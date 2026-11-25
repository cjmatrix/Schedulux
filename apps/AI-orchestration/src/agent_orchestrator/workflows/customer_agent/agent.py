from __future__ import annotations

import asyncio
import logging
import os
import uuid
from typing import Any, AsyncIterator

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage
from langchain_core.runnables import RunnableConfig
from langchain_core.tracers import LangChainTracer
from langgraph.graph import END, StateGraph

from agent_orchestrator.mcp.scheduling_mcp_server import get_scheduling_mcp_tools
from agent_orchestrator.repositories.customer_message_repository import CustomerMessageRepository
from agent_orchestrator.services.token_service import TokenTrackingService, TokenUsageTracker
from agent_orchestrator.tracing import get_current_trace_id, set_span_attributes
from agent_orchestrator.workflows.customer_agent.context import resolve_business_context
from agent_orchestrator.workflows.customer_agent.state import CustomerGraphState
from agent_orchestrator.workflows.customer_agent.subagents import (
    classify_intent,
    run_booking_agent,
    run_faq_agent,
    run_handoff_agent,
)
from agent_orchestrator.workflows.customer_agent.text_util import extract_text_content
from agent_orchestrator.workflows.llm_factory import (
    get_fallback_chat_model,
    get_primary_chat_model,
)

logger = logging.getLogger(__name__)

_customer_msg_repo = CustomerMessageRepository()


async def node_supervisor(state: CustomerGraphState, config: RunnableConfig) -> dict[str, Any]:
    message = state.get("message", "")
    history = state.get("messages", [])
    biz_context = state.get("biz_context", {})

    intents = await classify_intent(
        message=message,
        conversation_history=history,
        biz_context=biz_context,
        config=config,
    )
    logger.info("[CustomerGraph:SupervisorNode] Classified intents -> %s", intents)
    return {"intents": intents}


async def node_booking_agent(state: CustomerGraphState, config: RunnableConfig) -> dict[str, Any]:
    logger.info("[CustomerGraph:BookingAgentNode] Executing booking specialist")
    response_text = await run_booking_agent(
        tenant_id=state["tenant_id"],
        agent_id=state["agent_id"],
        message=state["message"],
        conversation_history=state["messages"],
        biz_context=state["biz_context"],
        all_tools=state["all_tools"],
        session_id=state.get("session_id", ""),
        config=config,
    )
    return {
        "booking_response": response_text,
    }


async def node_faq_agent(state: CustomerGraphState, config: RunnableConfig) -> dict[str, Any]:
    logger.info("[CustomerGraph:FaqAgentNode] Executing FAQ / RAG specialist")
    response_text = await run_faq_agent(
        tenant_id=state["tenant_id"],
        agent_id=state["agent_id"],
        message=state["message"],
        conversation_history=state["messages"],
        biz_context=state["biz_context"],
        all_tools=state["all_tools"],
        config=config,
    )
    return {
        "faq_response": response_text,
    }


async def node_handoff_agent(state: CustomerGraphState, config: RunnableConfig) -> dict[str, Any]:
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


async def node_synthesizer(state: CustomerGraphState, config: RunnableConfig) -> dict[str, Any]:
    booking_resp = state.get("booking_response")
    faq_resp = state.get("faq_response")

    if booking_resp and faq_resp:
        logger.info("[CustomerGraph:SynthesizerNode] Merging compound FAQ + Booking responses")
        model = get_primary_chat_model(temperature=0.2, max_tokens=4096)
        biz_name = state.get("biz_context", {}).get("business_name", "our business")
        user_msg = state.get("message", "")

        synth_system = f"""You are the AI Concierge for {biz_name}.
Your job is to merge specialist agent answers into a single, cohesive, seamless, warm, and natural response for the customer.

[Synthesis Guidelines & Instructions]
- Answer the customer's question thoroughly using the Knowledge answer.
- Present their scheduling/availability options clearly using the Booking answer.
- CRITICAL CONTRADICTION & FALLBACK RESOLUTION: If one specialist provided genuine facts (e.g. available services, pricing, operating hours, or appointments) while the other specialist returned a fallback disclaimer (such as "I don't have that information on file" or "our team will be happy to assist you directly"), COMPLETELY OMIT the fallback disclaimer! Never tell the customer you don't have the information when the other specialist provided it.
- Do NOT hallucinate any new dates, times, prices, or policies not present in the specialist answers.
- Speak in a single natural voice as the assistant for {biz_name}."""

        synth_input = f"""[Customer Inquiry]
"{user_msg}"

[Verified Specialist Facts to Merge]
[Policy / Knowledge Specialist Answer]:
{faq_resp}

[Booking & Availability Specialist Answer]:
{booking_resp}"""

        synth_messages: list[BaseMessage] = [
            SystemMessage(content=synth_system),
            HumanMessage(content=synth_input),
        ]

        try:
            synth_result = await model.ainvoke(synth_messages, config=config)
            final_text = extract_text_content(synth_result)
        except Exception as e:
            logger.warning(
                "[CustomerGraph:SynthesizerNode] Primary LLM (%s) error (%s) → trying fallback",
                type(model).__name__,
                e,
            )
            fallback_model = get_fallback_chat_model(
                primary=model,
                temperature=0.2,
                max_tokens=4096,
            )
            if fallback_model is not None:
                try:
                    synth_result = await fallback_model.ainvoke(synth_messages, config=config)
                    final_text = extract_text_content(synth_result)
                except Exception as fb_err:
                    logger.error(
                        "[CustomerGraph:SynthesizerNode] Fallback (%s) synthesis failed (%s) → fallback join",
                        type(fallback_model).__name__,
                        fb_err,
                    )
                    final_text = (
                        f"{extract_text_content(faq_resp)}\n\n{extract_text_content(booking_resp)}"
                    )
            else:
                final_text = (
                    f"{extract_text_content(faq_resp)}\n\n{extract_text_content(booking_resp)}"
                )
    elif booking_resp and extract_text_content(booking_resp).strip():
        final_text = extract_text_content(booking_resp).strip()
    elif faq_resp and extract_text_content(faq_resp).strip():
        final_text = extract_text_content(faq_resp).strip()
    else:
        final_text = (
            "I'm here to help! Could you please tell me which service and time you would prefer?"
        )

    final_text = extract_text_content(final_text)

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
    tier: str | None = None,
    is_quota_verified: bool = False,
) -> dict[str, Any]:
    if mode == "sandbox":
        is_sandbox = True
    elif mode == "live":
        is_sandbox = False
    else:
        is_sandbox = bool(session_id and session_id.startswith("sandbox_"))

   
    pre_tasks: list[Any] = [
        _customer_msg_repo.save_message(
            session_id=session_id,
            tenant_id=tenant_id,
            agent_id=agent_id,
            role="user",
            content=message,
            customer_id=customer_id,
            customer_name=customer_name,
            customer_phone=customer_phone,
        ),
        _customer_msg_repo.get_recent_messages(session_id, limit=20),
        resolve_business_context(tenant_id, agent_id, is_sandbox=is_sandbox),
    ]

    check_quota = not is_quota_verified
    if check_quota:
        pre_tasks.append(TokenTrackingService.check_weekly_quota(tenant_id, tier=tier))

    pre_results = await asyncio.gather(*pre_tasks)
    user_msg = pre_results[0]
    recent_messages = pre_results[1]
    biz_context = pre_results[2]

    if check_quota:
        is_exceeded, current_tokens, token_limit = pre_results[3]
        if is_exceeded:
            logger.warning(
                "[CustomerAgent] Tenant %s exceeded weekly token quota (%d/%d). Blocking interaction.",
                tenant_id,
                current_tokens,
                token_limit,
            )
            quota_msg = (
                "This workspace has reached its weekly AI token usage limit. "
                "Please contact the administrator or upgrade your subscription plan to continue."
            )
            assistant_msg = await _customer_msg_repo.save_message(
                session_id=session_id,
                tenant_id=tenant_id,
                agent_id=agent_id,
                role="assistant",
                content=quota_msg,
            )
            user_msg_id = str(user_msg.id) if user_msg and hasattr(user_msg, "id") else ""
            agent_msg_id = (
                str(assistant_msg.id) if assistant_msg and hasattr(assistant_msg, "id") else ""
            )
            created_at_iso = (
                assistant_msg.created_at.isoformat()
                if assistant_msg
                and hasattr(assistant_msg, "created_at")
                and assistant_msg.created_at
                else ""
            )
            return {
                "session_id": session_id,
                "response": quota_msg,
                "user_message_id": user_msg_id,
                "agent_message_id": agent_msg_id,
                "created_at": created_at_iso,
            }

    all_tools = get_scheduling_mcp_tools()

    langchain_messages: list[BaseMessage] = []
    for m in recent_messages:
        
        if user_msg and hasattr(user_msg, "id") and hasattr(m, "id") and m.id == user_msg.id:
            continue
        clean_history_text = extract_text_content(m.content)
        if m.role == "user":
            langchain_messages.append(HumanMessage(content=clean_history_text))
        elif m.role == "assistant":
            langchain_messages.append(AIMessage(content=clean_history_text))

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

    otel_trace_id = get_current_trace_id()
    set_span_attributes(
        tenant_id=tenant_id,
        agent_id=agent_id,
        session_id=session_id,
        tier=tier or "starter",
        is_sandbox=is_sandbox,
    )

    metadata: dict[str, Any] = {
        "tenant_id": tenant_id,
        "agent_id": agent_id,
        "session_id": session_id,
        "tier": tier or "starter",
        "is_sandbox": is_sandbox,
        "thread_id": session_id,
    }
    if otel_trace_id:
        metadata["otel_trace_id"] = otel_trace_id

    tags = [
        "customer_chat",
        f"tier:{tier or 'starter'}",
        "sandbox" if is_sandbox else "live",
        f"tenant:{tenant_id}",
    ]

    tracker = TokenUsageTracker()
    run_config: dict[str, Any] = {
        "recursion_limit": 8,
        "callbacks": [tracker, LangChainTracer(project_name="customer-agent")],
        "run_name": f"CustomerChat:{agent_id}",
        "tags": tags,
        "metadata": metadata,
    }

   
    if os.getenv("MOCK_LLM", "").strip().lower() in ("true", "1", "yes"):
        response_text = (
            "Thank you for reaching out. I am your automated AI assistant and can help you "
            "with scheduling appointments, checking availability, and answering questions."
        )
        tracker.input_tokens = max(15, len(message) // 4)
        tracker.output_tokens = max(25, len(response_text) // 4)
        tracker.call_count = 1
        tracker.model_id = "mock-llm-fast"
    else:
        try:
            final_state = await customer_orchestration_graph.ainvoke(
                initial_state,
                config=run_config,
            )
            raw_response = final_state.get("response")
            response_text = (
                extract_text_content(raw_response)
                if raw_response
                else (
                    "I'm sorry, I encountered a temporary issue while processing your request. "
                    "Please try again in a moment."
                )
            )
        except Exception as e:
            logger.error("[CustomerAgent] StateGraph orchestration error: %s", e, exc_info=True)
            response_text = (
                "I'm sorry, I encountered a temporary issue while processing your request. "
                "Please try again in a moment."
            )

    fallback_prompt = f"{message} " + " ".join(
        m.content
        for m in langchain_messages
        if hasattr(m, "content") and isinstance(m.content, str)
    )
    fallback_inp = max(1, len(fallback_prompt) // 4)
    fallback_out = max(1, len(response_text) // 4)

    if tracker.total_tokens > 0:
        inp_tokens = tracker.input_tokens
        out_tokens = tracker.output_tokens
        model_name = tracker.model_id or os.environ.get("GEMINI_MODEL", "gemini-1.5-flash")
        logger.info(
            "[CustomerAgent] Recorded %d subagent/node LLM calls for session %s (In: %d, Out: %d, Total: %d, Model: %s)",
            tracker.call_count,
            session_id,
            inp_tokens,
            out_tokens,
            tracker.total_tokens,
            model_name,
        )
    else:
        inp_tokens = fallback_inp
        out_tokens = fallback_out
        model_name = os.environ.get("GEMINI_MODEL", "gemini-1.5-flash")

    det_event_id = f"evt_tok_{tenant_id}_{agent_id}_{uuid.uuid4().hex[:16]}"

  
    assistant_msg_task = _customer_msg_repo.save_message(
        session_id=session_id,
        tenant_id=tenant_id,
        agent_id=agent_id,
        role="assistant",
        content=response_text,
    )
    token_task = TokenTrackingService.record_tokens(
        tenant_id=tenant_id,
        agent_id=agent_id,
        source="customer_agent",
        input_tokens=inp_tokens,
        output_tokens=out_tokens,
        model_id=model_name,
        event_id=det_event_id,
    )
    assistant_msg, _ = await asyncio.gather(assistant_msg_task, token_task)

    user_msg_id = str(user_msg.id) if user_msg and hasattr(user_msg, "id") else ""
    agent_msg_id = str(assistant_msg.id) if assistant_msg and hasattr(assistant_msg, "id") else ""
    created_at_iso = (
        assistant_msg.created_at.isoformat()
        if assistant_msg and hasattr(assistant_msg, "created_at") and assistant_msg.created_at
        else ""
    )

    return {
        "session_id": session_id,
        "response": response_text,
        "user_message_id": user_msg_id,
        "agent_message_id": agent_msg_id,
        "created_at": created_at_iso,
    }


async def process_customer_chat_stream(
    tenant_id: str,
    agent_id: str,
    session_id: str,
    message: str,
    customer_id: str | None = None,
    customer_phone: str | None = None,
    customer_name: str | None = None,
    mode: str | None = None,
    tier: str | None = None,
    is_quota_verified: bool = False,
) -> AsyncIterator[dict[str, Any]]:
    if mode == "sandbox":
        is_sandbox = True
    elif mode == "live":
        is_sandbox = False
    else:
        is_sandbox = bool(session_id and session_id.startswith("sandbox_"))

    pre_tasks: list[Any] = [
        _customer_msg_repo.save_message(
            session_id=session_id,
            tenant_id=tenant_id,
            agent_id=agent_id,
            role="user",
            content=message,
            customer_id=customer_id,
            customer_name=customer_name,
            customer_phone=customer_phone,
        ),
        _customer_msg_repo.get_recent_messages(session_id, limit=20),
        resolve_business_context(tenant_id, agent_id, is_sandbox=is_sandbox),
    ]

    check_quota = not is_quota_verified
    if check_quota:
        pre_tasks.append(TokenTrackingService.check_weekly_quota(tenant_id, tier=tier))

    pre_results = await asyncio.gather(*pre_tasks)
    user_msg = pre_results[0]
    recent_messages = pre_results[1]
    biz_context = pre_results[2]

    if check_quota:
        is_exceeded, current_tokens, token_limit = pre_results[3]
        if is_exceeded:
            logger.warning(
                "[CustomerAgent] Tenant %s exceeded weekly token quota (%d/%d). Blocking interaction.",
                tenant_id,
                current_tokens,
                token_limit,
            )
            quota_msg = (
                "This workspace has reached its weekly AI token usage limit. "
                "Please contact the administrator or upgrade your subscription plan to continue."
            )
            assistant_msg = await _customer_msg_repo.save_message(
                session_id=session_id,
                tenant_id=tenant_id,
                agent_id=agent_id,
                role="assistant",
                content=quota_msg,
            )
            user_msg_id = str(user_msg.id) if user_msg and hasattr(user_msg, "id") else ""
            agent_msg_id = (
                str(assistant_msg.id) if assistant_msg and hasattr(assistant_msg, "id") else ""
            )
            created_at_iso = (
                assistant_msg.created_at.isoformat()
                if assistant_msg
                and hasattr(assistant_msg, "created_at")
                and assistant_msg.created_at
                else ""
            )
            yield {
                "event_type": "error",
                "session_id": session_id,
                "error": "QUOTA_EXCEEDED",
                "delta": quota_msg,
                "response": quota_msg,
                "user_message_id": user_msg_id,
                "agent_message_id": agent_msg_id,
                "created_at": created_at_iso,
            }
            return

    all_tools = get_scheduling_mcp_tools()

    langchain_messages: list[BaseMessage] = []
    for m in recent_messages:
        if user_msg and hasattr(user_msg, "id") and hasattr(m, "id") and m.id == user_msg.id:
            continue
        clean_history_text = extract_text_content(getattr(m, "content", ""))
        role = getattr(m, "role", "user")
        if role == "user":
            langchain_messages.append(HumanMessage(content=clean_history_text))
        elif role in ("assistant", "agent"):
            langchain_messages.append(AIMessage(content=clean_history_text))

    initial_state: CustomerGraphState = {
        "tenant_id": tenant_id,
        "agent_id": agent_id,
        "session_id": session_id,
        "message": message,
        "customer_id": customer_id,
        "customer_phone": customer_phone,
        "customer_name": customer_name,
        "biz_context": biz_context,
        "all_tools": all_tools,
        "messages": langchain_messages,
        "intents": [],
        "booking_response": None,
        "faq_response": None,
        "handoff_response": None,
        "response": "",
        "error": None,
        "is_sandbox": is_sandbox,
    }

    otel_trace_id = get_current_trace_id()
    set_span_attributes(
        tenant_id=tenant_id,
        agent_id=agent_id,
        session_id=session_id,
        tier=tier or "starter",
        is_sandbox=is_sandbox,
    )

    metadata: dict[str, Any] = {
        "tenant_id": tenant_id,
        "agent_id": agent_id,
        "session_id": session_id,
        "tier": tier or "starter",
        "is_sandbox": is_sandbox,
        "thread_id": session_id,
    }
    if otel_trace_id:
        metadata["otel_trace_id"] = otel_trace_id

    tags = [
        "customer_chat",
        f"tier:{tier or 'starter'}",
        "sandbox" if is_sandbox else "live",
        f"tenant:{tenant_id}",
    ]

    tracker = TokenUsageTracker()
    run_config: dict[str, Any] = {
        "recursion_limit": 8,
        "callbacks": [tracker, LangChainTracer(project_name="customer-agent")],
        "run_name": f"CustomerChatStream:{agent_id}",
        "tags": tags,
        "metadata": metadata,
    }

    streamed_tokens: list[str] = []
    final_state: dict[str, Any] = {}

    if os.getenv("MOCK_LLM", "").strip().lower() in ("true", "1", "yes"):
        response_text = (
            "Thank you for reaching out. I am your automated AI assistant and can help you "
            "with scheduling appointments, checking availability, and answering questions."
        )
        words = response_text.split(" ")
        for i, word in enumerate(words):
            delta = word + (" " if i < len(words) - 1 else "")
            streamed_tokens.append(delta)
            yield {
                "event_type": "token",
                "delta": delta,
                "session_id": session_id,
            }
            await asyncio.sleep(0.02)
        tracker.input_tokens = max(15, len(message) // 4)
        tracker.output_tokens = max(25, len(response_text) // 4)
        tracker.call_count = 1
        tracker.model_id = "mock-llm-fast"
    else:
        try:
            async for event in customer_orchestration_graph.astream_events(
                initial_state,
                config=run_config,
                version="v2",
            ):
                ev_name = event.get("event")
                node = event.get("metadata", {}).get("langgraph_node")

                if ev_name == "on_chat_model_stream" and node in ("booking_agent", "faq_agent", "synthesizer"):
                    chunk = event.get("data", {}).get("chunk")
                    content = extract_text_content(getattr(chunk, "content", None) or chunk)
                    if content:
                        streamed_tokens.append(content)
                        yield {
                            "event_type": "token",
                            "delta": content,
                            "session_id": session_id,
                        }
                elif ev_name == "on_chain_end" and not node:
                    output = event.get("data", {}).get("output")
                    if isinstance(output, dict):
                        final_state = output
        except Exception as e:
            logger.error("[CustomerAgent] StateGraph stream error: %s", e, exc_info=True)
            err_msg = (
                "I'm sorry, I encountered a temporary issue while processing your request. "
                "Please try again in a moment."
            )
            yield {
                "event_type": "error",
                "session_id": session_id,
                "error": str(e),
                "delta": err_msg,
            }
            return

        raw_response = final_state.get("response") if isinstance(final_state, dict) else None
        response_text = (
            extract_text_content(raw_response)
            if raw_response
            else "".join(streamed_tokens)
        )
        if not response_text.strip():
            response_text = (
                "I'm here to help! Could you please tell me which service and time you would prefer?"
            )

        if not streamed_tokens:
            yield {
                "event_type": "token",
                "delta": response_text,
                "session_id": session_id,
            }

    fallback_prompt = f"{message} " + " ".join(
        m.content
        for m in langchain_messages
        if hasattr(m, "content") and isinstance(m.content, str)
    )
    fallback_inp = max(1, len(fallback_prompt) // 4)
    fallback_out = max(1, len(response_text) // 4)

    if tracker.total_tokens > 0:
        inp_tokens = tracker.input_tokens
        out_tokens = tracker.output_tokens
        model_name = tracker.model_id or os.environ.get("GEMINI_MODEL", "gemini-1.5-flash")
    else:
        inp_tokens = fallback_inp
        out_tokens = fallback_out
        model_name = os.environ.get("GEMINI_MODEL", "gemini-1.5-flash")

    det_event_id = f"evt_tok_{tenant_id}_{agent_id}_{uuid.uuid4().hex[:16]}"

    assistant_msg_task = _customer_msg_repo.save_message(
        session_id=session_id,
        tenant_id=tenant_id,
        agent_id=agent_id,
        role="assistant",
        content=response_text,
    )
    token_task = TokenTrackingService.record_tokens(
        tenant_id=tenant_id,
        agent_id=agent_id,
        source="customer_agent",
        input_tokens=inp_tokens,
        output_tokens=out_tokens,
        model_id=model_name,
        event_id=det_event_id,
    )
    assistant_msg, _ = await asyncio.gather(assistant_msg_task, token_task)

    user_msg_id = str(user_msg.id) if user_msg and hasattr(user_msg, "id") else ""
    agent_msg_id = str(assistant_msg.id) if assistant_msg and hasattr(assistant_msg, "id") else ""
    created_at_iso = (
        assistant_msg.created_at.isoformat()
        if assistant_msg and hasattr(assistant_msg, "created_at") and assistant_msg.created_at
        else ""
    )

    yield {
        "event_type": "done",
        "session_id": session_id,
        "response": response_text,
        "user_message_id": user_msg_id,
        "agent_message_id": agent_msg_id,
        "created_at": created_at_iso,
        "booking_id": final_state.get("booking_id") or "",
        "booking_reference": final_state.get("booking_reference") or "",
        "status": final_state.get("status") or "",
    }
