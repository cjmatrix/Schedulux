from __future__ import annotations

from typing import Any
from langchain_core.messages import AIMessage, HumanMessage
from langgraph.graph import END, StateGraph

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


async def start_onboarding_session(tenant_id: str, draft: dict, agent_id: str = "") -> dict:
    target_agent_id = agent_id or draft.get("agent_id") or f"agent_{tenant_id}_v1"
    draft["agent_id"] = target_agent_id

    initial: GraphState = {
        "tenant_id": tenant_id,
        "agent_id": target_agent_id,
        "draft": draft,
        "messages": [],
        "structural_gaps": [],
        "pending_field": None,
        "semantic_note": None,
        "decision": None,
        "pending_draft_update": None,
        "status": "onboarding",
        "patch_retries": 0,
    }

    try:
        from agent_orchestrator.clients.redis_client import set_cached_draft

        await set_cached_draft(tenant_id, target_agent_id, draft)
    except Exception as e:
        print(f"[Start Session Warning] Failed to prime Redis cache: {e}", flush=True)

    result_state = await _graph.ainvoke(initial)
    return _extract_payload(result_state)


async def resume_onboarding_session(tenant_id: str, user_answer: str, agent_id: str = "") -> dict:
    from agent_orchestrator.clients.redis_client import get_cached_draft

    draft = await get_cached_draft(tenant_id, agent_id)
    if not draft and agent_id:
        try:
            from agent_orchestrator.models import AgentDraft, AgentRuntimeConfig

            ad = await AgentDraft.find_one({"tenant_id": tenant_id, "agent_id": agent_id})
            if ad and ad.current_draft:
                draft = ad.current_draft
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
    }

    result_state = await _graph.ainvoke(initial)
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

