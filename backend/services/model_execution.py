"""Shared asynchronous ADK execution for configured model routes and admin tests."""
import asyncio
import time
import uuid
from dataclasses import dataclass
from typing import Any

from google import genai
from google.genai import types
from google.adk.agents import Agent
from google.adk.agents.run_config import RunConfig, StreamingMode
from google.adk.models import Gemini
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService


@dataclass
class ModelResult:
    text: str
    model: str
    latency_ms: int
    prompt_tokens: int | None
    completion_tokens: int | None
    first_token_ms: int | None


async def execute_model(*, model_id: str, credentials: dict[str, Any], prompt: str,
                        instruction: str = "Respond accurately to the user's request.",
                        temperature: float = 0.2, max_tokens: int = 4096,
                        timeout_seconds: int = 30, output_schema=None, on_delta=None,
                        harness_context: dict | None = None) -> ModelResult:
    if not model_id:
        raise ValueError("Select a model before running a test.")
    if not model_id.startswith(("gemini-", "models/gemini-")):
        raise ValueError("This runtime adapter supports Gemini models. Register a provider adapter for this model.")
    # Credentials belong to this request's client; never mutate process environment.
    client_options = {}
    if credentials.get("api_key"):
        client_options["api_key"] = credentials["api_key"]
    if credentials.get("vertexai"):
        client_options.update(vertexai=True, project=credentials.get("project"),
                              location=credentials.get("location", "global"))
    client = genai.Client(**client_options)
    started = time.perf_counter()
    first_token_ms = None
    prompt_tokens = completion_tokens = None
    final_text = ""
    sessions = InMemorySessionService()
    session_id = uuid.uuid4().hex
    runtime = {"max_llm_calls": 4, "timeout_seconds": timeout_seconds}
    if harness_context and harness_context.get("project_id"):
        from backend.database.connection import get_async_db
        from backend.harness.configuration import resolve_configuration
        async with get_async_db() as db:
            effective = await resolve_configuration(db, harness_context["project_id"])
        runtime.update(effective.get("runtime", {}))
    try:
        async with asyncio.timeout(min(timeout_seconds, int(runtime.get("timeout_seconds", timeout_seconds)))):
            await sessions.create_session(app_name="prism", user_id=session_id, session_id=session_id)
            agent = Agent(name="configured_agent", model=Gemini(model=model_id, client=client),
                          instruction=instruction, output_schema=output_schema,
                          generate_content_config=types.GenerateContentConfig(
                              temperature=temperature, max_output_tokens=max_tokens))
            if harness_context:
                from backend.harness.agent_factory import build_project_agent
                agent = await build_project_agent(model=Gemini(model=model_id, client=client), **harness_context)
                agent.generate_content_config = types.GenerateContentConfig(
                    temperature=temperature, max_output_tokens=max_tokens)
            plugins = []
            if harness_context:
                from backend.harness.plugin_registry import HarnessPluginRegistry
                from backend.harness.adk_plugin import HarnessLifecyclePlugin
                await HarnessPluginRegistry.initialize_defaults()
                plugins.append(HarnessLifecyclePlugin(harness_context["run_id"]))
            runner = Runner(agent=agent, app_name="prism", session_service=sessions, plugins=plugins)
            async for event in runner.run_async(
                user_id=session_id, session_id=session_id,
                new_message=types.Content(role="user", parts=[types.Part(text=prompt)]),
                run_config=RunConfig(streaming_mode=StreamingMode.SSE,
                                     max_llm_calls=int(runtime.get("max_llm_calls", 4))),
            ):
                if event.error_code:
                    raise RuntimeError("Model provider returned an error. Check provider configuration and quota.")
                parts = event.content.parts if event.content and event.content.parts else []
                text = "".join(p.text for p in parts if p.text and not p.thought)
                if text and first_token_ms is None:
                    first_token_ms = int((time.perf_counter() - started) * 1000)
                if event.partial and text and on_delta:
                    await on_delta(text)
                if event.is_final_response() and text:
                    final_text = text
                if event.usage_metadata:
                    prompt_tokens = event.usage_metadata.prompt_token_count
                    completion_tokens = event.usage_metadata.candidates_token_count
            if not final_text:
                raise RuntimeError("The model returned no final response.")
            return ModelResult(final_text, model_id, int((time.perf_counter() - started) * 1000),
                               prompt_tokens, completion_tokens, first_token_ms)
    finally:
        await client.aio.aclose()
        client.close()
