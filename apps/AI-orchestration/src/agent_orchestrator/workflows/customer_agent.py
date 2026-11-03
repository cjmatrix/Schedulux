from __future__ import annotations

import json
import logging
import os
from typing import Annotated, Any, Literal

from dotenv import load_dotenv
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage
from langchain_core.tools import BaseTool
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_groq import ChatGroq
from langchain_openai import ChatOpenAI
from langgraph.graph import END, StateGraph
from langgraph.graph.message import add_messages
from pydantic import SecretStr
from typing_extensions import TypedDict

from agent_orchestrator.mcp.scheduling_mcp_server import get_scheduling_mcp_tools
from agent_orchestrator.repositories.customer_message_repository import CustomerMessageRepository
from agent_orchestrator.workflows.booking_agent import run_booking_agent
from agent_orchestrator.workflows.context import resolve_business_context
from agent_orchestrator.workflows.faq_agent import run_faq_agent
from agent_orchestrator.workflows.handoff_agent import run_handoff_agent
from agent_orchestrator.workflows.supervisor_agent import classify_intent

try:
    import toon

    _has_toon = True
except ImportError:
    _has_toon = False

logger = logging.getLogger(__name__)

_env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".env"))
load_dotenv(_env_path)

_customer_msg_repo = CustomerMessageRepository()


def _format_services_catalog(services: list[dict[str, Any]]) -> str:
    """Format services catalog using TOON for token efficiency, with JSON fallback."""
    if _has_toon:
        try:
            return toon.encode(services)
        except Exception as e:
            logger.warning(
                "[CustomerAgent] Failed to toonify services, falling back to JSON: %s", e
            )
    return json.dumps(services, indent=2)


def _get_chat_model(temperature: float = 0.2) -> BaseChatModel:
    """Initialize LLM model (Groq preferred, Gemini fallback)."""
    groq_api_key = os.environ.get("GROQ_API_KEY")
    gemini_api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")

    if groq_api_key:
        groq_model = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")
        return ChatGroq(
            model=groq_model,
            api_key=SecretStr(groq_api_key),
            temperature=temperature,
            max_tokens=4096,
        )
    elif gemini_api_key:
        model_name = os.environ.get("GEMINI_MODEL", "gemini-1.5-flash")
        return ChatGoogleGenerativeAI(
            model=model_name,
            google_api_key=gemini_api_key,
            temperature=temperature,
            max_output_tokens=4096,
        )
    else:
        return ChatOpenAI(
            model="gpt-4o-mini",
            temperature=temperature,
        )










class CustomerGraphState(TypedDict):
    session_id: str
    tenant_id: str
    agent_id: str
    message: str
    messages: Annotated[list[BaseMessage], add_messages]
    biz_context: dict[str, Any]
    all_tools: list[BaseTool]
    intent: str  # "booking" | "faq" | "handoff" | "emergency"
    response: str
    error: str | None





async def node_supervisor(state: CustomerGraphState) -> dict[str, Any]:
    """
    Supervisor Node — Evaluates fast-path guardrails and classifies user intent.
    Sets 'intent' in the graph state to trigger conditional edge routing.
    """
    message = state.get("message", "")
    history = state.get("messages", [])
    biz_context = state.get("biz_context", {})

    intent = await classify_intent(
        message=message,
        conversation_history=history,
        biz_context=biz_context,
    )
    logger.info("[CustomerGraph:SupervisorNode] Classified intent -> '%s'", intent)
    return {"intent": intent}


async def node_booking_agent(state: CustomerGraphState) -> dict[str, Any]:
   
    logger.info("[CustomerGraph:BookingAgentNode] Executing booking specialist")
    response_text = await run_booking_agent(
        tenant_id=state["tenant_id"],
        agent_id=state["agent_id"],
        message=state["message"],
        conversation_history=state["messages"],
        biz_context=state["biz_context"],
        all_tools=state["all_tools"],
        session_id=state.get("session_id", ""),
    )
    return {
        "response": response_text,
        "messages": [AIMessage(content=response_text)],
    }


async def node_faq_agent(state: CustomerGraphState) -> dict[str, Any]:
    
    logger.info("[CustomerGraph:FaqAgentNode] Executing FAQ / RAG specialist")
    response_text = await run_faq_agent(
        tenant_id=state["tenant_id"],
        agent_id=state["agent_id"],
        message=state["message"],
        conversation_history=state["messages"],
        biz_context=state["biz_context"],
        all_tools=state["all_tools"],
    )
    return {
        "response": response_text,
        "messages": [AIMessage(content=response_text)],
    }


async def node_handoff_agent(state: CustomerGraphState) -> dict[str, Any]:
    """
    Handoff / Escalation Guardrail Node — Delivers immediate deterministic human contact
    or emergency triage instructions. Zero LLM latency.
    """
    intent = state.get("intent", "handoff")
    is_emergency = intent == "emergency"
    logger.info(
        "[CustomerGraph:HandoffNode] Executing handoff guardrail (is_emergency=%s)",
        is_emergency,
    )
    response_text = run_handoff_agent(
        message=state["message"],
        biz_context=state["biz_context"],
        is_emergency=is_emergency,
    )
    return {
        "response": response_text,
        "messages": [AIMessage(content=response_text)],
    }




def route_supervisor_decision(
    state: CustomerGraphState,
) -> Literal["booking_agent", "faq_agent", "handoff_agent"]:
    intent = state.get("intent", "booking")
    if intent in ("emergency", "handoff"):
        return "handoff_agent"
    elif intent == "faq":
        return "faq_agent"
    else:
        return "booking_agent"





def build_customer_orchestration_graph():
  
    builder = StateGraph(CustomerGraphState)

    
    builder.add_node("supervisor", node_supervisor)
    builder.add_node("booking_agent", node_booking_agent)
    builder.add_node("faq_agent", node_faq_agent)
    builder.add_node("handoff_agent", node_handoff_agent)

  
    builder.set_entry_point("supervisor")

  
    builder.add_conditional_edges(
        "supervisor",
        route_supervisor_decision,
        {
            "booking_agent": "booking_agent",
            "faq_agent": "faq_agent",
            "handoff_agent": "handoff_agent",
        },
    )

    builder.add_edge("booking_agent", END)
    builder.add_edge("faq_agent", END)
    builder.add_edge("handoff_agent", END)

    return builder.compile()


customer_orchestration_graph = build_customer_orchestration_graph()


def get_orchestration_graph_mermaid() -> str:
    """Returns Mermaid markdown of the compiled customer state graph for documentation & UI rendering."""
    try:
        return customer_orchestration_graph.get_graph().draw_mermaid()
    except Exception:
        return ""




async def process_customer_chat(
    tenant_id: str,
    agent_id: str,
    session_id: str,
    message: str,
    customer_id: str | None = None,
    customer_phone: str | None = None,
    customer_name: str | None = None,
) -> dict[str, Any]:
    """
    State-Based Multi-Agent Orchestration Entrypoint for Customer Chat.

    Architecture:
      1. Session & History: Fetches conversation sliding-window from MongoDB.
      2. Hot-Path Cache: Retrieves business context & custom instructions from Redis.
      3. StateGraph Execution:
         - Supervisor Node: Evaluates guardrails and classifies intent (booking, faq, handoff, emergency).
         - Conditional Edge: Dispatches state to specialized worker node (Booking, FAQ, or Handoff).
         - Specialist Node: Runs domain logic with isolated tools and appends response to state.
      4. State Persistence: Stores assistant response and customer metadata in MongoDB.
    """
    await _customer_msg_repo.get_or_create_conversation(session_id, tenant_id, agent_id)

    if customer_id or customer_phone or customer_name:
        await _customer_msg_repo.update_conversation_customer(
            session_id=session_id,
            customer_id=customer_id,
            customer_name=customer_name,
            customer_phone=customer_phone,
        )

    await _customer_msg_repo.save_message(
        session_id=session_id,
        tenant_id=tenant_id,
        agent_id=agent_id,
        role="user",
        content=message,
    )

    recent_messages = await _customer_msg_repo.get_recent_messages(session_id, limit=10)

    langchain_messages: list[BaseMessage] = []
    for m in recent_messages:
        if m.role == "user":
            langchain_messages.append(HumanMessage(content=m.content))
        elif m.role == "assistant":
            langchain_messages.append(AIMessage(content=m.content))

    biz_context = await resolve_business_context(tenant_id, agent_id)
    all_tools = get_scheduling_mcp_tools()

   
    initial_state: CustomerGraphState = {
        "session_id": session_id,
        "tenant_id": tenant_id,
        "agent_id": agent_id,
        "message": message,
        "messages": langchain_messages,
        "biz_context": biz_context,
        "all_tools": all_tools,
        "intent": "",
        "response": "",
        "error": None,
    }

 
    try:
        final_state = await customer_orchestration_graph.ainvoke(initial_state)
        response_text = final_state.get("response") or (
            "I'm sorry, I encountered a temporary issue while processing your request. "
            "Please try again in a moment."
        )
    except Exception as e:
        logger.error("[CustomerAgent] StateGraph orchestration error: %s", e, exc_info=True)
        response_text = (
            "I'm sorry, I encountered a temporary issue while processing your request. "
            "Please try again in a moment."
        )


    await _customer_msg_repo.save_message(
        session_id=session_id,
        tenant_id=tenant_id,
        agent_id=agent_id,
        role="assistant",
        content=response_text,
    )

    updated_history = await _customer_msg_repo.get_recent_messages(session_id, limit=10)

    return {
        "session_id": session_id,
        "response": response_text,
        "history": [
            {
                "id": str(m.id),
                "session_id": m.session_id,
                "tenant_id": m.tenant_id,
                "agent_id": m.agent_id,
                "role": m.role,
                "content": m.content,
                "created_at": m.created_at.isoformat(),
            }
            for m in updated_history
        ],
    }
