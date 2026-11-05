from __future__ import annotations

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


def format_operating_hours(operating_hours: dict[str, Any] | None) -> str:
    if not operating_hours or not isinstance(operating_hours, dict):
        return "Operating hours not specified."

    days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    lines: list[str] = []
    has_any = False

    for day in days:
        slots = operating_hours.get(day)
        day_name = day.capitalize()
        if not slots or not isinstance(slots, list):
            lines.append(f"- {day_name}: Closed")
        else:
            time_strs: list[str] = []
            for slot in slots:
                if isinstance(slot, dict) and slot.get("start") and slot.get("end"):
                    time_strs.append(f"{slot['start']} - {slot['end']}")
            if time_strs:
                has_any = True
                lines.append(f"- {day_name}: {', '.join(time_strs)}")
            else:
                lines.append(f"- {day_name}: Closed")

    blackouts = operating_hours.get("blackout_dates")
    if blackouts and isinstance(blackouts, list):
        blackout_strs: list[str] = []
        for b in blackouts:
            if isinstance(b, dict) and b.get("date"):
                reason = f" ({b['reason']})" if b.get("reason") else ""
                blackout_strs.append(f"{b['date']}{reason}")
        if blackout_strs:
            lines.append(f"- Special Closures/Holidays: {', '.join(blackout_strs)}")

    return "\n".join(lines) if has_any else "Operating hours not specified."


async def resolve_business_context(
    tenant_id: str,
    agent_id: str,
    is_sandbox: bool = False,
) -> dict[str, Any]:
    mode_str = "sandbox" if is_sandbox else "live"
    cached = await get_cached_biz_context(tenant_id, agent_id, mode=mode_str)
    if cached and "formatted_operating_hours" in cached:
        return cached

    ctx = await _load_from_db(tenant_id, agent_id, is_sandbox=is_sandbox)
    await set_cached_biz_context(tenant_id, agent_id, ctx, ttl=3600, mode=mode_str)
    return ctx


async def _load_from_db(
    tenant_id: str,
    agent_id: str,
    is_sandbox: bool = False,
) -> dict[str, Any]:
    biz_name: str | None = None
    timezone: str | None = None
    currency: str | None = None
    public_phone: str | None = None
    support_email: str | None = None
    address: str | None = None
    supervisor_prompt: str | None = None
    services: list[dict[str, Any]] = []
    resources: list[dict[str, Any]] = []
    guardrails: dict[str, Any] = {}
    scheduling_engine: dict[str, Any] = {}
    operating_hours: dict[str, Any] = {}
    sub_agents: list[dict[str, Any]] = []

    query: dict[str, Any] = {"tenant_id": tenant_id}
    if agent_id:
        query["agent_id"] = agent_id

    if is_sandbox:
       
        draft = await AgentDraft.find_one(query)
        if draft and draft.current_draft:
            biz: dict[str, Any] = draft.current_draft.get("business_profile") or {}  # type: ignore[assignment]
            if isinstance(biz, dict):
                biz_name = biz.get("name")
                timezone = biz.get("timezone")
                currency = biz.get("currency")
                address = biz.get("address")
                contact_dict = biz.get("contact") or {}
                if isinstance(contact_dict, dict):
                    public_phone = contact_dict.get("public_phone")
                    support_email = contact_dict.get("support_email")
            if not timezone:
                engine: dict[str, Any] = draft.current_draft.get("scheduling_engine") or {}  # type: ignore[assignment]
                if isinstance(engine, dict):
                    timezone = engine.get("timezone")

            raw_oh = draft.current_draft.get("operating_hours")
            if isinstance(raw_oh, dict):
                operating_hours = raw_oh

            supervisor_prompt = draft.current_draft.get("supervisor_prompt")  # type: ignore[assignment]

            raw_gr = draft.current_draft.get("guardrails")
            if isinstance(raw_gr, dict):
                guardrails = raw_gr

            raw_se = draft.current_draft.get("scheduling_engine")
            if isinstance(raw_se, dict):
                scheduling_engine = raw_se

            raw_sa = draft.current_draft.get("sub_agents")
            if isinstance(raw_sa, list):
                sub_agents = raw_sa

            raw_resources = draft.current_draft.get("resources")
            if isinstance(raw_resources, list):
                for r_raw in raw_resources:
                    if (
                        not isinstance(r_raw, dict)
                        or not r_raw.get("is_bookable", True)
                        or r_raw.get("is_deleted", False)
                    ):
                        continue
                    r_id = r_raw.get("resource_id", "")
                    r_name = r_raw.get("name", "Unnamed")
                    if r_id and r_name:
                        resources.append({"id": r_id, "name": r_name})

            raw_services = draft.current_draft.get("services")
            if isinstance(raw_services, list):
                for s_raw in raw_services:
                    if not isinstance(s_raw, dict) or s_raw.get("is_deleted", False):
                        continue
                    s_id = s_raw.get("service_id", "")
                    s_name = s_raw.get("name", "Unnamed")
                    if s_id and s_name:
                        services.append({"id": s_id, "name": s_name})

        
        if not draft or not services or not biz_name:
            runtime = await AgentRuntimeConfig.find_one(query)
            if runtime:
                if not biz_name and runtime.business_profile:
                    biz_name = runtime.business_profile.name
                if not timezone and runtime.business_profile:
                    timezone = runtime.business_profile.timezone
                if not currency and runtime.business_profile:
                    currency = runtime.business_profile.currency
                if not address and runtime.business_profile:
                    address = runtime.business_profile.address
                if not public_phone and runtime.business_profile and runtime.business_profile.contact:
                    public_phone = runtime.business_profile.contact.public_phone
                if not support_email and runtime.business_profile and runtime.business_profile.contact:
                    support_email = runtime.business_profile.contact.support_email

                if not supervisor_prompt:
                    supervisor_prompt = runtime.supervisor_prompt
                if not operating_hours and runtime.operating_hours:
                    operating_hours = runtime.operating_hours.model_dump()
                if not scheduling_engine and runtime.scheduling_engine:
                    scheduling_engine = runtime.scheduling_engine.model_dump()
                if not guardrails and runtime.guardrails:
                    guardrails = runtime.guardrails.model_dump()
                if not sub_agents and runtime.sub_agents:
                    sub_agents = [sa.model_dump() for sa in runtime.sub_agents]

                if not resources and runtime.resources:
                    for r in runtime.resources:
                        if not getattr(r, "is_bookable", True) or getattr(r, "is_deleted", False):
                            continue
                        resources.append({"id": r.resource_id, "name": r.name})

                if not services and runtime.services:
                    for s in runtime.services:
                        if getattr(s, "is_deleted", False):
                            continue
                        services.append({"id": s.service_id, "name": s.name})
    else:
      
        runtime = await AgentRuntimeConfig.find_one(query)
        if runtime:
            if runtime.business_profile:
                biz_name = runtime.business_profile.name
                timezone = runtime.business_profile.timezone
                currency = runtime.business_profile.currency
                address = runtime.business_profile.address
                if runtime.business_profile.contact:
                    public_phone = runtime.business_profile.contact.public_phone
                    support_email = runtime.business_profile.contact.support_email

            supervisor_prompt = runtime.supervisor_prompt

            if runtime.operating_hours:
                operating_hours = runtime.operating_hours.model_dump()
            if runtime.scheduling_engine:
                scheduling_engine = runtime.scheduling_engine.model_dump()
            if runtime.guardrails:
                guardrails = runtime.guardrails.model_dump()
            if runtime.sub_agents:
                sub_agents = [sa.model_dump() for sa in runtime.sub_agents]

            for r in runtime.resources:
                if not getattr(r, "is_bookable", True) or getattr(r, "is_deleted", False):
                    continue
                resources.append({"id": r.resource_id, "name": r.name})

            for s in runtime.services:
                if getattr(s, "is_deleted", False):
                    continue
                services.append({"id": s.service_id, "name": s.name})
        else:
            logger.warning(
                "[CustomerContext] Live mode: No active AgentRuntimeConfig found for tenant %s, agent %s",
                tenant_id,
                agent_id,
            )

    return {
        "business_name": biz_name or "Schedulux Business",
        "timezone": timezone or "UTC",
        "currency": currency or "USD",
        "public_phone": public_phone,
        "support_email": support_email,
        "address": address,
        "operating_hours": operating_hours,
        "formatted_operating_hours": format_operating_hours(operating_hours),
        "services": services,
        "total_services_count": len(services),
        "resources": resources,
        "total_resources_count": len(resources),
        "supervisor_prompt": supervisor_prompt,
        "guardrails": guardrails,
        "scheduling_engine": scheduling_engine,
        "sub_agents": sub_agents,
    }

