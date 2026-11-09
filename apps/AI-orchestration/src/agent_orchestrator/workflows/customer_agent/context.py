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

    query: dict[str, Any] = {"tenant_id": tenant_id}
    if agent_id:
        query["agent_id"] = agent_id

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

        for r in runtime.resources:
            if not getattr(r, "is_bookable", True) or getattr(r, "is_deleted", False):
                continue
            rtype = getattr(r, "resource_type", "staff")
            if hasattr(rtype, "value"):
                rtype = rtype.value
            resources.append(
                {
                    "id": r.resource_id,
                    "name": r.name,
                    "type": rtype or "staff",
                    "title": getattr(r, "title", "") or "",
                }
            )

        for s in runtime.services:
            if getattr(s, "is_deleted", False):
                continue
            reqs = getattr(s, "resource_requirements", []) or []
            services.append(
                {
                    "id": s.service_id,
                    "name": s.name,
                    "resource_requirements": [
                        req.model_dump() if hasattr(req, "model_dump") else req for req in reqs
                    ],
                }
            )
    else:
        draft = await AgentDraft.find_one(query)
        if draft and draft.current_draft:
            cd = draft.current_draft
            if cd.business_profile:
                biz_name = cd.business_profile.name
                timezone = cd.business_profile.timezone
                currency = cd.business_profile.currency
                address = cd.business_profile.address
                if cd.business_profile.contact:
                    public_phone = cd.business_profile.contact.public_phone
                    support_email = cd.business_profile.contact.support_email

            if cd.operating_hours:
                operating_hours = cd.operating_hours.model_dump()

            supervisor_prompt = cd.supervisor_prompt

            if cd.guardrails:
                guardrails = cd.guardrails.model_dump()

            if cd.scheduling_engine:
                scheduling_engine = cd.scheduling_engine.model_dump()

            if cd.resources:
                for r in cd.resources:
                    if not getattr(r, "is_bookable", True) or getattr(r, "is_deleted", False):
                        continue
                    if r.resource_id and r.name:
                        rtype = getattr(r, "resource_type", "staff")
                        if hasattr(rtype, "value"):
                            rtype = rtype.value
                        resources.append(
                            {
                                "id": r.resource_id,
                                "name": r.name,
                                "type": rtype or "staff",
                                "title": getattr(r, "title", "") or "",
                            }
                        )

            if cd.services:
                for s in cd.services:
                    if getattr(s, "is_deleted", False):
                        continue
                    if s.service_id and s.name:
                        reqs = getattr(s, "resource_requirements", []) or []
                        services.append(
                            {
                                "id": s.service_id,
                                "name": s.name,
                                "resource_requirements": [
                                    req.model_dump() if hasattr(req, "model_dump") else req
                                    for req in reqs
                                ],
                            }
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
    }
