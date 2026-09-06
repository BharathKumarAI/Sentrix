"""Optional ADK CLI entry point; application runs resolve their model from the database."""
import os
from google.adk.agents import Agent
from google.adk.apps import App

root_agent = Agent(
    name="prism",
    model=os.environ["PRISM_ADK_MODEL"],
    instruction="Use supplied evidence only. Report uncertainty and missing evidence. Never claim to have executed unavailable tools.",
)
app = App(name="agent", root_agent=root_agent)
