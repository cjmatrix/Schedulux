"""
Business context loader with Redis caching.
TTL: 5 minutes — short enough to reflect admin changes quickly,
long enough to absorb burst chat traffic without hammering MongoDB.
Cache is invalidated on scheduling.service.events / scheduling.resource.events
via the existing SchedulingConsumer (scheduling_consumer.py already calls
set_cached_draft on every service/resource upsert).
"""
from __future__ import annotations

import json
import logging
from typing import Any

from agent_orchestrator.clients.redis_client import (
    delete_cached_biz_context,
    get_cached_biz_context,
    set_cached_biz_context,
)
from agent_orchestrator.models import AgentDraft, AgentRuntimeConfig

logger = logging.getLogger(__name__)

invalidate_biz_context = delete_cached_biz_context



# ── Loader ─────────────────────────────────────────────────────────────────────


async def resolve_business_context(tenant_id: str, agent_id: str) -> dict[str, Any]:
    """
    Load business context for all sub-agents.
    Cache-first: Redis → MongoDB AgentRuntimeConfig → AgentDraft fallback.
    Returns a stable dict with keys:
        business_name, timezone, currency, services, resources,
        supervisor_prompt, guardrails, scheduling_engine, sub_agents
    """
    cached = await get_cached_biz_context(tenant_id, agent_id)
    if cached:
        return cached

    ctx = await _load_from_db(tenant_id, agent_id)
    await set_cached_biz_context(tenant_id, agent_id, ctx, ttl=3600)
    return ctx


async def _load_from_db(tenant_id: str, agent_id: str) -> dict[str, Any]:
    biz_name: str | None = None
    timezone: str | None = None
    currency: str | None = None
    supervisor_prompt: str | None = None
    services: list[dict[str, Any]] = []
    resources: list[dict[str, Any]] = []
    guardrails: dict[str, Any] = {}
    scheduling_engine: dict[str, Any] = {}
    sub_agents: list[dict[str, Any]] = []

    query: dict[str, Any] = {"tenant_id": tenant_id}
    if agent_id:
        query["agent_id"] = agent_id

    runtime = await AgentRuntimeConfig.find_one(query)

    if runtime:
        if runtime.business_profile:
            biz_name = runtime.business_profile.name or biz_name
            timezone = runtime.business_profile.timezone or timezone
            currency = runtime.business_profile.currency or currency

        supervisor_prompt = runtime.supervisor_prompt

        if runtime.scheduling_engine:
            scheduling_engine = runtime.scheduling_engine.model_dump()

        if runtime.guardrails:
            guardrails = runtime.guardrails.model_dump()

        if runtime.sub_agents:
            sub_agents = [sa.model_dump() for sa in runtime.sub_agents]

        for r in runtime.resources:
            if not getattr(r, "is_bookable", True) or getattr(r, "is_deleted", False):
                continue
            resources.append({
                "id": r.resource_id,
                "name": r.name,
            })

        for s in runtime.services:
            if getattr(s, "is_deleted", False):
                continue
            services.append({
                "id": s.service_id,
                "name": s.name,
            })

    # ── AgentDraft fallback (when runtime not yet compiled) ────────────────────
    if not runtime or not services or not biz_name:
        draft = await AgentDraft.find_one(query)
        if draft and draft.current_draft:
            biz: dict[str, Any] = draft.current_draft.get("business_profile") or {}  # type: ignore[assignment]
            if isinstance(biz, dict):
                biz_name = biz_name or biz.get("name")
                timezone = timezone or biz.get("timezone")
                currency = currency or biz.get("currency")
            if not timezone:
                engine: dict[str, Any] = draft.current_draft.get("scheduling_engine") or {}  # type: ignore[assignment]
                if isinstance(engine, dict):
                    timezone = engine.get("timezone")
            supervisor_prompt = supervisor_prompt or draft.current_draft.get("supervisor_prompt")  # type: ignore[assignment]

            if not resources:
                for r_raw in draft.current_draft.get("resources") or []:  # type: ignore[union-attr]
                    if not isinstance(r_raw, dict) or not r_raw.get("is_bookable", True) or r_raw.get("is_deleted", False):
                        continue
                    r_id = r_raw.get("resource_id", "")
                    r_name = r_raw.get("name", "Unnamed")
                    if r_id and r_name:
                        resources.append({"id": r_id, "name": r_name})

            if not services:
                for s_raw in draft.current_draft.get("services") or []:  # type: ignore[union-attr]
                    if not isinstance(s_raw, dict) or s_raw.get("is_deleted", False):
                        continue
                    s_id = s_raw.get("service_id", "")
                    s_name = s_raw.get("name", "Unnamed")
                    if s_id and s_name:
                        services.append({"id": s_id, "name": s_name})

    return {
        "business_name": biz_name or "Schedulux Business",
        "timezone": timezone or "UTC",
        "currency": currency or "USD",
        "services": services,
        "total_services_count": len(services),
        "resources": resources,
        "total_resources_count": len(resources),
        "supervisor_prompt": supervisor_prompt,
        "guardrails": guardrails,
        "scheduling_engine": scheduling_engine,
        "sub_agents": sub_agents,
    }

