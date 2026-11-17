from __future__ import annotations

import os
from typing import Any

from langchain_core.messages import AIMessage, HumanMessage
from langchain_core.tracers import LangChainTracer
from langgraph.graph import END, StateGraph

from agent_orchestrator.tracing import get_current_trace_id, set_span_attributes
from agent_orchestrator.workflows.tenant_agent.nodes import (
    node_apply_draft_update,
    node_ask_human_semantic,
    node_block_incomplete_finalize,
    node_finalize_and_save,
    node_llm_semantic_review,
    node_load_draft,
    route_after_patch,
    route_semantic,
)
from agent_orchestrator.workflows.tenant_agent.state import GraphState
from agent_orchestrator.workflows.tenant_agent.utils import _extract_payload


def build_tenant_onboarding_graph():
    builder = StateGraph(GraphState)

    builder.add_node("load_draft", node_load_draft)
    builder.add_node("llm_semantic_review", node_llm_semantic_review)
    builder.add_node("apply_draft_update", node_apply_draft_update)
    builder.add_node("ask_human_semantic", node_ask_human_semantic)
    builder.add_node("block_incomplete_finalize", node_block_incomplete_finalize)
    builder.add_node("finalize_and_save", node_finalize_and_save)

    builder.set_entry_point("load_draft")
    builder.add_edge("load_draft", "llm_semantic_review")

    builder.add_conditional_edges(
        "llm_semantic_review",
        route_semantic,
        {
            "apply_draft_update": "apply_draft_update",
            "ask_human_semantic": "ask_human_semantic",
            "block_incomplete_finalize": "block_incomplete_finalize",
            "finalize_and_save": "finalize_and_save",
        },
    )

    builder.add_conditional_edges(
        "apply_draft_update",
        route_after_patch,
        {
            "ask_human_semantic": "ask_human_semantic",
            "llm_semantic_review": "llm_semantic_review",
        },
    )
    builder.add_edge("block_incomplete_finalize", "ask_human_semantic")
    builder.add_edge("ask_human_semantic", END)
    builder.add_edge("finalize_and_save", END)

    return builder.compile()


_graph = build_tenant_onboarding_graph()


async def start_onboarding_session(
    tenant_id: str, draft: dict, agent_id: str = "", tier: str | None = None
) -> dict:
    from agent_orchestrator.services.token_service import TokenTrackingService

    is_exceeded, current_tokens, token_limit = await TokenTrackingService.check_weekly_quota(
        tenant_id, tier=tier
    )
    if is_exceeded:
        return {
            "error": "Weekly AI token limit exceeded",
            "message": f"Weekly AI token limit reached ({current_tokens}/{token_limit} tokens). Upgrade your workspace plan in Billing to continue.",
            "status": "quota_exceeded",
        }

    target_agent_id = agent_id or draft.get("agent_id") or f"agent_{tenant_id}_v1"
    draft["agent_id"] = target_agent_id

    try:
        from agent_orchestrator.clients.redis_client import set_cached_draft

        await set_cached_draft(tenant_id, target_agent_id, draft)
    except Exception as e:
        print(f"[Start Session Warning] Failed to prime Redis cache: {e}", flush=True)

    from agent_orchestrator.workflows.tenant_agent.utils import (
        _compute_structural_gaps,
        generate_deterministic_onboarding_greeting,
    )

    gaps = _compute_structural_gaps(draft)
    greeting = generate_deterministic_onboarding_greeting(draft, gaps)
    first_gap_field = gaps[0]["field"] if gaps else ""

    print(
        f"[TenantAgent:StartSession] Deterministic greeting initialized for agent '{target_agent_id}' "
        f"(source='{draft.get('creation_source')}', gaps={len(gaps)}, latency=<2ms, tokens=0)",
        flush=True,
    )

    return {
        "status": "awaiting_input",
        "question": greeting,
        "field": first_gap_field,
        "type": "semantic_review",
    }


async def resume_onboarding_session(
    tenant_id: str, user_answer: str, agent_id: str = "", tier: str | None = None
) -> dict:
    from agent_orchestrator.services.token_service import TokenTrackingService, TokenUsageTracker

    is_exceeded, current_tokens, token_limit = await TokenTrackingService.check_weekly_quota(
        tenant_id, tier=tier
    )
    if is_exceeded:
        return {
            "error": "Weekly AI token limit exceeded",
            "message": f"Weekly AI token limit reached ({current_tokens}/{token_limit} tokens). Upgrade your workspace plan in Billing to continue.",
            "status": "quota_exceeded",
        }

    from agent_orchestrator.clients.redis_client import get_cached_draft

    draft = await get_cached_draft(tenant_id, agent_id)
    if not draft and agent_id:
        try:
            from agent_orchestrator.models import AgentDraft, AgentRuntimeConfig

            ad = await AgentDraft.find_one({"tenant_id": tenant_id, "agent_id": agent_id})
            if ad and ad.current_draft:
                draft = ad.current_draft.model_dump()
            else:
                cfg = await AgentRuntimeConfig.find_one(
                    {"tenant_id": tenant_id, "agent_id": agent_id}
                )
                if cfg:
                    from agent_orchestrator.models import canonicalize_agent_schema

                    draft = canonicalize_agent_schema(cfg.model_dump(), status="live")
        except Exception:
            pass

    if not draft:
        draft = {"tenant_id": tenant_id, "agent_id": agent_id}

    target_agent_id = agent_id or draft.get("agent_id") or f"agent_{tenant_id}_v1"

    recent_history: list[HumanMessage | AIMessage] = []
    if target_agent_id:
        try:
            from agent_orchestrator.models import AgentDraft, AgentMessage

            agent_draft_doc = await AgentDraft.find_one(
                {"tenant_id": tenant_id, "agent_id": target_agent_id}
            )
            last_summarized = agent_draft_doc.last_summarized_seq if agent_draft_doc else 0

            active_db_msgs = (
                await AgentMessage.find(
                    {
                        "tenant_id": tenant_id,
                        "agent_id": target_agent_id,
                        "seq": {"$gt": last_summarized},
                    }
                )
                .sort("seq")
                .to_list()
            )

            from agent_orchestrator.config import MEMORY_TRIGGER_TOKEN_THRESHOLD

            total_active_tokens = sum(
                (m.token_count or max(1, len(m.content) // 4)) for m in active_db_msgs
            )
            if total_active_tokens > MEMORY_TRIGGER_TOKEN_THRESHOLD:
                budget = MEMORY_TRIGGER_TOKEN_THRESHOLD
                kept: list[AgentMessage] = []
                for m in reversed(active_db_msgs):
                    t = m.token_count or max(1, len(m.content) // 4)
                    if budget - t < 0 and kept:
                        break
                    kept.append(m)
                    budget -= t
                active_db_msgs = list(reversed(kept))

            for m in active_db_msgs:
                if m.role in ("tenant", "user"):
                    recent_history.append(HumanMessage(content=m.content))
                else:
                    recent_history.append(AIMessage(content=m.content))
        except Exception as rhe:
            print(f"[TenantAgent Warning] Could not rehydrate recent history: {rhe}", flush=True)

    initial: GraphState = {
        "tenant_id": tenant_id,
        "agent_id": target_agent_id,
        "draft": draft,
        "messages": recent_history,
        "structural_gaps": [],
        "pending_field": None,
        "semantic_note": f"User requested change: {user_answer}",
        "decision": None,
        "pending_draft_update": None,
        "status": "onboarding",
        "patch_retries": 0,
        "react_step_count": 0,
        "tier": tier or "starter",
    }

    otel_trace_id = get_current_trace_id()
    set_span_attributes(
        tenant_id=tenant_id,
        agent_id=target_agent_id,
        tier=tier or "starter",
    )

    metadata: dict[str, Any] = {
        "tenant_id": tenant_id,
        "agent_id": target_agent_id,
        "tier": tier or "starter",
        "session_phase": "resume",
        "thread_id": f"onboarding_{tenant_id}_{target_agent_id}",
    }
    if otel_trace_id:
        metadata["otel_trace_id"] = otel_trace_id

    tracker = TokenUsageTracker()
    run_config: dict[str, Any] = {
        "callbacks": [tracker, LangChainTracer(project_name="tenant-onboarding-agent")],
        "run_name": f"TenantOnboarding:Resume:{target_agent_id}",
        "tags": [
            "tenant_onboarding",
            "session_resume",
            f"tier:{tier or 'starter'}",
            f"tenant:{tenant_id}",
        ],
        "metadata": metadata,
    }
    result_state = await _graph.ainvoke(initial, config=run_config)

    from datetime import UTC, datetime

    semantic_resp = result_state.get("semantic_note") or ""
    if tracker.total_tokens > 0:
        inp_tokens = tracker.input_tokens
        out_tokens = tracker.output_tokens
        model_name = tracker.model_id or os.environ.get("GEMINI_MODEL", "gemini-1.5-flash")
        print(
            f"[TenantAgent] Recorded {tracker.call_count} LLM calls (In: {inp_tokens}, Out: {out_tokens}, Total: {tracker.total_tokens}, Model: {model_name})",
            flush=True,
        )
    else:
        inp_tokens = max(1, (len(user_answer or "") + 500) // 4)
        out_tokens = max(1, len(semantic_resp) // 4)
        model_name = os.environ.get("GEMINI_MODEL", "gemini-1.5-flash")

    det_event_id = (
        f"evt_tok_{tenant_id}_{target_agent_id}_resume_{int(datetime.now(UTC).timestamp() * 1000)}"
    )

    await TokenTrackingService.record_tokens(
        tenant_id=tenant_id,
        agent_id=target_agent_id,
        source="tenant_agent",
        input_tokens=inp_tokens,
        output_tokens=out_tokens,
        model_id=model_name,
        event_id=det_event_id,
    )

    return _extract_payload(result_state)


async def get_current_draft(tenant_id: str, agent_id: str = "") -> dict:
    if agent_id:
        try:
            from agent_orchestrator.clients.redis_client import (
                get_cached_draft,
                set_cached_draft,
            )
            from agent_orchestrator.models import (
                AgentDraft,
                canonicalize_agent_schema,
                init_db,
            )

            cached = await get_cached_draft(tenant_id, agent_id)
            if cached:
                return canonicalize_agent_schema(cached, status="draft")

            await init_db()
            doc = await AgentDraft.find_one({"tenant_id": tenant_id, "agent_id": agent_id})
            if doc and doc.current_draft:
                canonical = canonicalize_agent_schema(doc.current_draft, status="draft")

                try:
                    await set_cached_draft(tenant_id, agent_id, canonical)
                except Exception:
                    pass
                return canonical

        except Exception as e:
            print(f"[get_current_draft Warning] {e}", flush=True)

    return {}
