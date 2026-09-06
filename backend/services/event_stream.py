"""Bounded SSE delivery with heartbeats, backpressure, and producer cancellation."""
import asyncio
from contextlib import suppress
import json


async def stream_events(produce, *, heartbeat_seconds=15, buffer_size=64):
    queue = asyncio.Queue(maxsize=buffer_size)
    done = object()

    async def run():
        try:
            await produce(queue.put)
        except asyncio.CancelledError:
            raise
        except Exception:
            await queue.put({"type": "RUN_FAILED", "error": "Execution failed. Check the run diagnostics."})
        await queue.put(done)

    task = asyncio.create_task(run())
    try:
        while True:
            try:
                event = await asyncio.wait_for(queue.get(), timeout=heartbeat_seconds)
            except TimeoutError:
                yield ": heartbeat\n\n"
                continue
            if event is done:
                yield 'data: {"type":"STREAM_DONE"}\n\n'
                break
            yield f"data: {json.dumps(event, default=str)}\n\n"
    finally:
        task.cancel()
        with suppress(asyncio.CancelledError):
            await task
