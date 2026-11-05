from __future__ import annotations

import json
import logging
import os
from typing import Any

from dotenv import load_dotenv
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_groq import ChatGroq
from langchain_openai import ChatOpenAI
from langgraph.graph import END, StateGraph
from pydantic import SecretStr

from agent_orchestrator.mcp.scheduling_mcp_server import get_scheduling_mcp_tools
from agent_orchestrator.repositories.customer_message_repository import CustomerMessageRepository
from agent_orchestrator.workflows.customer_agent.context import resolve_business_context
from agent_orchestrator.workflows.customer_agent.state import CustomerGraphState
from agent_orchestrator.workflows.customer_agent.subagents import (
    classify_intent,
    run_booking_agent,
    run_faq_agent,
    run_handoff_agent,
)

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
    if _has_toon:
        try:
            return toon.encode(services)
        except Exception as e:
            logger.warning("[CustomerAgent] Failed to toonify services, falling back to JSON: %s", e)
    return json.dumps(services, indent=2)


def _get_chat_model(temperature: float = 0.2) -> BaseChatModel:
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


async def node_supervisor(state: CustomerGraphState) -> dict[str, Any]:
    message = state.get("message", "")
    history = state.get("messages", [])
    biz_context = state.get("biz_context", {})

    intents = await classify_intent(
        message=message,
        conversation_history=history,
        biz_context=biz_context,
    )
    logger.info("[CustomerGraph:SupervisorNode] Classified intents -> %s", intents)
    return {"intents": intents}


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
        "booking_response": response_text,
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
        "faq_response": response_text,
    }


async def node_handoff_agent(state: CustomerGraphState) -> dict[str, Any]:
    intents = state.get("intents") or ["handoff"]
    is_emergency = "emergency" in intents
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
        "handoff_response": response_text,
        "response": response_text,
        "messages": [AIMessage(content=response_text)],
    }


async def node_synthesizer(state: CustomerGraphState) -> dict[str, Any]:
    booking_resp = state.get("booking_response")
    faq_resp = state.get("faq_response")

    if booking_resp and faq_resp:
        logger.info("[CustomerGraph:SynthesizerNode] Merging compound FAQ + Booking responses")
        model = _get_chat_model(temperature=0.2)
        biz_name = state.get("biz_context", {}).get("business_name", "our business")
        user_msg = state.get("message", "")

        synth_system = f"""You are the AI Concierge for {biz_name}.
A customer asked: "{user_msg}"

Two specialist agents provided the following verified facts:
[Policy / Knowledge Specialist Answer]:
{faq_resp}

[Booking & Availability Specialist Answer]:
{booking_resp}

Merge these two answers into a single, cohesive, seamless, warm, and natural response for the customer.
- Answer their question thoroughly using the Knowledge answer.
- Present their scheduling/availability options clearly using the Booking answer.
- Do NOT hallucinate any new dates, times, prices, or policies not present in the specialist answers.
- Speak in a single natural voice as the assistant for {biz_name}."""

        try:
            synth_result = await model.ainvoke([SystemMessage(content=synth_system)])
            final_text = (
                synth_result.content
                if isinstance(synth_result.content, str)
                else str(synth_result.content)
            )
        except Exception as e:
            logger.error("[CustomerGraph:SynthesizerNode] Synthesis LLM error (%s) → fallback join", e)
            final_text = f"{faq_resp}\n\n{booking_resp}"
    elif booking_resp:
        final_text = booking_resp
    elif faq_resp:
        final_text = faq_resp
    else:
        final_text = (
            "I'm sorry, I could not complete your request. Please try again or ask our team."
        )

    return {
        "response": final_text,
        "messages": [AIMessage(content=final_text)],
    }


def route_supervisor_decision(state: CustomerGraphState) -> list[str]:
    intents = state.get("intents") or ["booking"]
    if "emergency" in intents or "handoff" in intents:
        return ["handoff_agent"]

    targets: list[str] = []
    if "faq" in intents:
        targets.append("faq_agent")
    if "booking" in intents:
        targets.append("booking_agent")
    return targets if targets else ["booking_agent"]


def build_customer_orchestration_graph():
    builder = StateGraph(CustomerGraphState)

    builder.add_node("supervisor", node_supervisor)
    builder.add_node("booking_agent", node_booking_agent)
    builder.add_node("faq_agent", node_faq_agent)
    builder.add_node("handoff_agent", node_handoff_agent)
    builder.add_node("synthesizer", node_synthesizer)

    builder.set_entry_point("supervisor")

    builder.add_conditional_edges(
        "supervisor",
        route_supervisor_decision,
        ["booking_agent", "faq_agent", "handoff_agent"],
    )

    builder.add_edge("booking_agent", "synthesizer")
    builder.add_edge("faq_agent", "synthesizer")
    builder.add_edge("synthesizer", END)
    builder.add_edge("handoff_agent", END)

    return builder.compile()


customer_orchestration_graph = build_customer_orchestration_graph()


def get_orchestration_graph_mermaid() -> str:
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
    mode: str | None = None,
) -> dict[str, Any]:
    if mode == "sandbox":
        is_sandbox = True
    elif mode == "live":
        is_sandbox = False
    else:
        is_sandbox = bool(session_id and session_id.startswith("sandbox_"))

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

    biz_context = await resolve_business_context(tenant_id, agent_id, is_sandbox=is_sandbox)
    all_tools = get_scheduling_mcp_tools()

    initial_state: CustomerGraphState = {
        "session_id": session_id,
        "tenant_id": tenant_id,
        "agent_id": agent_id,
        "message": message,
        "messages": langchain_messages,
        "biz_context": biz_context,
        "all_tools": all_tools,
        "intents": [],
        "booking_response": None,
        "faq_response": None,
        "handoff_response": None,
        "response": "",
        "error": None,
        "is_sandbox": is_sandbox,
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

