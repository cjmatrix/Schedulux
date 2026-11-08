from __future__ import annotations

from typing import Annotated, Any

from langchain_core.messages import BaseMessage
from langchain_core.tools import BaseTool
from langgraph.graph.message import add_messages
from typing_extensions import TypedDict


class CustomerGraphState(TypedDict):
    session_id: str
    tenant_id: str
    agent_id: str
    message: str
    messages: Annotated[list[BaseMessage], add_messages]
    biz_context: dict[str, Any]
    all_tools: list[BaseTool]
    intents: list[str]
    booking_response: str | None
    faq_response: str | None
    handoff_response: str | None
    response: str
    error: str | None
    is_sandbox: bool
