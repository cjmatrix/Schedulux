import logging
import os
from typing import Any

from dotenv import load_dotenv

from agent_orchestrator.clients.redis_client import (
    delete_cached_biz_context,
    set_cached_draft,
)
from agent_orchestrator.domain.protocols import EventSubscriber
from agent_orchestrator.models import (
    AgentDraft,
    AgentRuntimeConfig,
    BlackoutDateEmbed,
    BookingMode,
    DepositEmbed,
    DispatchStatus,
    GuardrailsEmbed,
    OperatingHoursEmbed,
    PriceEmbed,
    PriceType,
    ResourceEmbed,
    ResourceRequirementEmbed,
    ResourceType,
    SchedulingEngineEmbed,
    ServiceEmbed,
    ServiceVerificationEmbed,
    TimeSlotEmbed,
    VerificationPolicyEmbed,
)

local_env = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".env"))
load_dotenv(local_env)

logger = logging.getLogger(__name__)

TOPICS = ["scheduling.service.events", "scheduling.resource.events", "scheduling.schedule.events"]


async def handle_service_event(payload: dict[str, Any]) -> None:
    event_type = payload.get("event_type", "")
    agent_id = payload.get("agent_id", "")
    service_id = payload.get("service_id", "")

    if not agent_id or not service_id:
        logger.warning(
            "[Consumer] Skipping service event — missing agent_id or service_id: %s", payload
        )
        return

    data = payload.get("data")
    price_raw = data.get("price", {}) if data else {}
    deposit_raw = data.get("deposit", {}) if data else {}

    config = await AgentRuntimeConfig.find_one({"agent_id": agent_id})
    if config:
        if event_type == "service.deleted":
            config.services = [s for s in config.services if s.service_id != service_id]
            await config.save()
            logger.info(
                "[Consumer] Removed service %s from live AgentRuntimeConfig of agent %s",
                service_id,
                agent_id,
            )
        elif data:
            price = PriceEmbed(
                type=PriceType(price_raw.get("type", "fixed")),
                amount=float(price_raw.get("amount", 0)),
                currency=price_raw.get("currency", "USD"),
            )
            deposit = DepositEmbed(
                required=bool(deposit_raw.get("required", False)),
                amount=float(deposit_raw.get("amount", 0)),
                processor=deposit_raw.get("processor", ""),
                upi_id=deposit_raw.get("upi_id", ""),
                qr_code_url=deposit_raw.get("qr_code_url", ""),
                confirmation_method=deposit_raw.get("confirmation_method", "automatic"),
                payment_instructions=deposit_raw.get("payment_instructions", ""),
            )
            existing_embed = next((s for s in config.services if s.service_id == service_id), None)
            verif_raw = data.get("verification")
            if verif_raw is not None and isinstance(verif_raw, dict):
                verification = ServiceVerificationEmbed(require_otp=verif_raw.get("require_otp"))
            elif existing_embed and existing_embed.verification:
                verification = existing_embed.verification
            else:
                verification = ServiceVerificationEmbed()

            new_embed = ServiceEmbed(
                service_id=service_id,
                name=data.get("name", ""),
                category=data.get("category", "General"),
                description=data.get("description", ""),
                duration_minutes=int(data.get("duration_minutes") or 30),
                buffer_minutes=int(data.get("buffer_minutes") or 0),
                booking_mode=BookingMode(data.get("booking_mode", "time_slot")),
                price=price,
                deposit=deposit,
                verification=verification,
                resource_requirements=[
                    ResourceRequirementEmbed(
                        role=req.get("role", "Staff"),
                        resource_type=req.get("resource_type", "staff"),
                        count=int(req.get("count") or 1),
                        eligible_resource_ids=req.get("eligible_resource_ids", []),
                    )
                    for req in (data.get("resource_requirements") or [])
                ],
            )
            config.services = [s for s in config.services if s.service_id != service_id]
            config.services.append(new_embed)
            await config.save()
            try:
                await delete_cached_biz_context(config.tenant_id, agent_id)
            except Exception:
                pass
            logger.info(
                "[Consumer] Upserted service %s into live AgentRuntimeConfig of agent %s",
                service_id,
                agent_id,
            )


    agent_draft = await AgentDraft.find_one({"agent_id": agent_id})
    if agent_draft:
        current_draft = dict(agent_draft.current_draft) if agent_draft.current_draft else {}
        raw_svcs = current_draft.get("services")
        svcs: list[dict[str, Any]] = (
            [s for s in raw_svcs if isinstance(s, dict)] if isinstance(raw_svcs, list) else []
        )
        if event_type == "service.deleted":
            current_draft["services"] = [s for s in svcs if s.get("service_id") != service_id]
        elif data:
            existing_draft_svc = next((s for s in svcs if s.get("service_id") == service_id), None)
            verif_dict = (
                data.get("verification")
                if "verification" in data
                else (existing_draft_svc.get("verification") if existing_draft_svc else None)
            )

            svc_dict: dict[str, Any] = {
                "service_id": service_id,
                "name": data.get("name", ""),
                "category": data.get("category", "General"),
                "description": data.get("description", ""),
                "duration_minutes": int(data.get("duration_minutes") or 30),
                "buffer_minutes": int(data.get("buffer_minutes") or 0),
                "booking_mode": data.get("booking_mode", "time_slot"),
                "price": price_raw,
                "deposit": deposit_raw,
                "verification": verif_dict,
                "resource_requirements": data.get("resource_requirements", []),
            }
            updated_svcs = [s for s in svcs if s.get("service_id") != service_id]
            updated_svcs.append(svc_dict)
            current_draft["services"] = updated_svcs

        agent_draft.current_draft = current_draft
        await agent_draft.save()
        try:
            await set_cached_draft(agent_draft.tenant_id, agent_id, current_draft)
        except Exception:
            pass
        logger.info(
            "[Consumer] Synced service %s to AgentDraft & Redis for agent %s", service_id, agent_id
        )


async def handle_resource_event(payload: dict[str, Any]) -> None:
    event_type = payload.get("event_type", "")
    agent_id = payload.get("agent_id", "")
    resource_id = payload.get("resource_id", "")

    if not agent_id or not resource_id:
        logger.warning(
            "[Consumer] Skipping resource event — missing agent_id or resource_id: %s", payload
        )
        return

    data = payload.get("data")

    config = await AgentRuntimeConfig.find_one({"agent_id": agent_id})
    if config:
        if event_type == "resource.deleted":
            config.resources = [r for r in config.resources if r.resource_id != resource_id]
            await config.save()
            logger.info(
                "[Consumer] Removed resource %s from live AgentRuntimeConfig of agent %s",
                resource_id,
                agent_id,
            )
        elif data:
            new_embed = ResourceEmbed(
                resource_id=resource_id,
                resource_type=ResourceType(data.get("resource_type", "staff")),
                name=data.get("name", ""),
                title=data.get("title", ""),
                category=data.get("category", "General"),
                description=data.get("description", ""),
                is_bookable=bool(data.get("is_bookable", True)),
                dispatch_status=DispatchStatus(data.get("dispatch_status", "active")),
                custom_shift_overrides=data.get("custom_shift_overrides", {}),
            )
            config.resources = [r for r in config.resources if r.resource_id != resource_id]
            config.resources.append(new_embed)
            await config.save()
            try:
                await delete_cached_biz_context(config.tenant_id, agent_id)
            except Exception:
                pass
            logger.info(
                "[Consumer] Upserted resource %s into live AgentRuntimeConfig of agent %s",
                resource_id,
                agent_id,
            )


    agent_draft = await AgentDraft.find_one({"agent_id": agent_id})
    if agent_draft:
        current_draft = dict(agent_draft.current_draft) if agent_draft.current_draft else {}
        raw_res = current_draft.get("resources")
        res_list: list[dict[str, Any]] = (
            [r for r in raw_res if isinstance(r, dict)] if isinstance(raw_res, list) else []
        )
        if event_type == "resource.deleted":
            current_draft["resources"] = [
                r for r in res_list if r.get("resource_id") != resource_id
            ]
        elif data:
            res_dict: dict[str, Any] = {
                "resource_id": resource_id,
                "resource_type": data.get("resource_type", "staff"),
                "name": data.get("name", ""),
                "title": data.get("title", ""),
                "category": data.get("category", "General"),
                "description": data.get("description", ""),
                "is_bookable": bool(data.get("is_bookable", True)),
                "dispatch_status": data.get("dispatch_status", "active"),
                "custom_shift_overrides": data.get("custom_shift_overrides", {}),
            }
            updated_res = [r for r in res_list if r.get("resource_id") != resource_id]
            updated_res.append(res_dict)
            current_draft["resources"] = updated_res

        agent_draft.current_draft = current_draft
        await agent_draft.save()
        try:
            await set_cached_draft(agent_draft.tenant_id, agent_id, current_draft)
        except Exception:
            pass
        logger.info(
            "[Consumer] Synced resource %s to AgentDraft & Redis for agent %s",
            resource_id,
            agent_id,
        )


async def handle_schedule_event(payload: dict[str, Any]) -> None:
    agent_id = payload.get("agent_id", "")
    tenant_id = payload.get("tenant_id", "")

    if not agent_id and not tenant_id:
        logger.warning(
            "[Consumer] Skipping schedule event — missing agent_id and tenant_id: %s", payload
        )
        return

    data = payload.get("data")
    if not data or not isinstance(data, dict):
        return

    raw_oh = data.get("operating_hours", {})
    raw_bo = data.get("blackout_dates", []) or (raw_oh.get("blackout_dates", []) if isinstance(raw_oh, dict) else [])

    blackout_embeds = [
        BlackoutDateEmbed(
            date=str(b.get("date", "")),
            reason=b.get("reason"),
            is_closed=bool(b.get("is_closed", True)),
        )
        for b in raw_bo
        if isinstance(b, dict) and b.get("date")
    ]

    def _parse_slots(slots_raw: Any) -> list[TimeSlotEmbed]:
        if not isinstance(slots_raw, list):
            return []
        return [
            TimeSlotEmbed(start=str(s.get("start", "")), end=str(s.get("end", "")))
            for s in slots_raw
            if isinstance(s, dict) and s.get("start") and s.get("end")
        ]

    operating_hours = OperatingHoursEmbed(
        monday=_parse_slots(raw_oh.get("monday") if isinstance(raw_oh, dict) else None),
        tuesday=_parse_slots(raw_oh.get("tuesday") if isinstance(raw_oh, dict) else None),
        wednesday=_parse_slots(raw_oh.get("wednesday") if isinstance(raw_oh, dict) else None),
        thursday=_parse_slots(raw_oh.get("thursday") if isinstance(raw_oh, dict) else None),
        friday=_parse_slots(raw_oh.get("friday") if isinstance(raw_oh, dict) else None),
        saturday=_parse_slots(raw_oh.get("saturday") if isinstance(raw_oh, dict) else None),
        sunday=_parse_slots(raw_oh.get("sunday") if isinstance(raw_oh, dict) else None),
        blackout_dates=blackout_embeds,
    )

    raw_engine = data.get("scheduling_engine", {})
    raw_mode = raw_engine.get("booking_mode", "time_slot") if isinstance(raw_engine, dict) else "time_slot"
    scheduling_engine = SchedulingEngineEmbed(
        booking_mode=BookingMode(raw_mode) if raw_mode in BookingMode._value2member_map_ else BookingMode.TIME_SLOT,
        default_lead_time_hours=int((raw_engine.get("default_lead_time_hours") if isinstance(raw_engine, dict) else None) or 2),
        max_advance_booking_days=int((raw_engine.get("max_advance_booking_days") if isinstance(raw_engine, dict) else None) or 60),
        cancellation_window_hours=int((raw_engine.get("cancellation_window_hours") if isinstance(raw_engine, dict) else None) or 24),
        hold_duration_minutes=int((raw_engine.get("hold_duration_minutes") if isinstance(raw_engine, dict) else None) or 10),
    )

    raw_verif = data.get("verification_policy", {})
    verif_policy = VerificationPolicyEmbed(
        require_otp_for_new_booking=bool(
            raw_verif.get("require_otp_for_new_booking", False) if isinstance(raw_verif, dict) else False
        )
    )

    # 1. Update live AgentRuntimeConfig
    query: dict[str, Any] = {"agent_id": agent_id} if agent_id else {"tenant_id": tenant_id}
    config = await AgentRuntimeConfig.find_one(query)
    if config:
        config.operating_hours = operating_hours
        config.scheduling_engine = scheduling_engine
        if not config.guardrails:
            config.guardrails = GuardrailsEmbed()
        config.guardrails.verification_policy = verif_policy

        if "timezone" in data and config.business_profile:
            config.business_profile.timezone = data.get("timezone")
        if "currency" in data and config.business_profile:
            config.business_profile.currency = data.get("currency")

        await config.save()
        try:
            await delete_cached_biz_context(config.tenant_id, agent_id or config.agent_id or "")
        except Exception:
            pass
        logger.info(
            "[Consumer] Synced schedule to live AgentRuntimeConfig for agent %s (tenant %s)",
            agent_id,
            config.tenant_id,
        )


    agent_draft = await AgentDraft.find_one(query)
    if agent_draft:
        current_draft = dict(agent_draft.current_draft) if agent_draft.current_draft else {}
        current_draft["operating_hours"] = {
            "monday": [s.model_dump() for s in operating_hours.monday],
            "tuesday": [s.model_dump() for s in operating_hours.tuesday],
            "wednesday": [s.model_dump() for s in operating_hours.wednesday],
            "thursday": [s.model_dump() for s in operating_hours.thursday],
            "friday": [s.model_dump() for s in operating_hours.friday],
            "saturday": [s.model_dump() for s in operating_hours.saturday],
            "sunday": [s.model_dump() for s in operating_hours.sunday],
            "blackout_dates": [b.model_dump() for b in operating_hours.blackout_dates],
        }
        current_draft["blackout_dates"] = [b.model_dump() for b in operating_hours.blackout_dates]
        current_draft["scheduling_engine"] = scheduling_engine.model_dump()

        guardrails = current_draft.get("guardrails")
        if not isinstance(guardrails, dict):
            guardrails = {}
        guardrails["verification_policy"] = verif_policy.model_dump()
        current_draft["guardrails"] = guardrails

        if "timezone" in data:
            bp = current_draft.get("business_profile")
            if isinstance(bp, dict):
                bp["timezone"] = data.get("timezone")
        if "currency" in data:
            bp = current_draft.get("business_profile")
            if isinstance(bp, dict):
                bp["currency"] = data.get("currency")

        agent_draft.current_draft = current_draft
        await agent_draft.save()
        try:
            await set_cached_draft(agent_draft.tenant_id, agent_id or agent_draft.agent_id, current_draft)
        except Exception:
            pass
        logger.info(
            "[Consumer] Synced schedule to AgentDraft & Redis for agent %s (tenant %s)",
            agent_id,
            agent_draft.tenant_id,
        )


async def handle_schedule_event(payload: dict[str, Any]) -> None:
    agent_id = payload.get("agent_id", "")
    tenant_id = payload.get("tenant_id", "")

    if not agent_id and not tenant_id:
        logger.warning(
            "[Consumer] Skipping schedule event — missing agent_id and tenant_id: %s", payload
        )
        return

    data = payload.get("data")
    if not data or not isinstance(data, dict):
        return

    raw_oh = data.get("operating_hours", {})
    raw_bo = data.get("blackout_dates", []) or (raw_oh.get("blackout_dates", []) if isinstance(raw_oh, dict) else [])

    blackout_embeds = [
        BlackoutDateEmbed(
            date=str(b.get("date", "")),
            reason=b.get("reason"),
            is_closed=bool(b.get("is_closed", True)),
        )
        for b in raw_bo
        if isinstance(b, dict) and b.get("date")
    ]

    def _parse_slots(slots_raw: Any) -> list[TimeSlotEmbed]:
        if not isinstance(slots_raw, list):
            return []
        return [
            TimeSlotEmbed(start=str(s.get("start", "")), end=str(s.get("end", "")))
            for s in slots_raw
            if isinstance(s, dict) and s.get("start") and s.get("end")
        ]

    operating_hours = OperatingHoursEmbed(
        monday=_parse_slots(raw_oh.get("monday") if isinstance(raw_oh, dict) else None),
        tuesday=_parse_slots(raw_oh.get("tuesday") if isinstance(raw_oh, dict) else None),
        wednesday=_parse_slots(raw_oh.get("wednesday") if isinstance(raw_oh, dict) else None),
        thursday=_parse_slots(raw_oh.get("thursday") if isinstance(raw_oh, dict) else None),
        friday=_parse_slots(raw_oh.get("friday") if isinstance(raw_oh, dict) else None),
        saturday=_parse_slots(raw_oh.get("saturday") if isinstance(raw_oh, dict) else None),
        sunday=_parse_slots(raw_oh.get("sunday") if isinstance(raw_oh, dict) else None),
        blackout_dates=blackout_embeds,
    )

    raw_engine = data.get("scheduling_engine", {})
    raw_mode = raw_engine.get("booking_mode", "time_slot") if isinstance(raw_engine, dict) else "time_slot"
    scheduling_engine = SchedulingEngineEmbed(
        booking_mode=BookingMode(raw_mode) if raw_mode in BookingMode._value2member_map_ else BookingMode.TIME_SLOT,
        default_lead_time_hours=int((raw_engine.get("default_lead_time_hours") if isinstance(raw_engine, dict) else None) or 2),
        max_advance_booking_days=int((raw_engine.get("max_advance_booking_days") if isinstance(raw_engine, dict) else None) or 60),
        cancellation_window_hours=int((raw_engine.get("cancellation_window_hours") if isinstance(raw_engine, dict) else None) or 24),
        hold_duration_minutes=int((raw_engine.get("hold_duration_minutes") if isinstance(raw_engine, dict) else None) or 10),
    )

    raw_verif = data.get("verification_policy", {})
    verif_policy = VerificationPolicyEmbed(
        require_otp_for_new_booking=bool(
            raw_verif.get("require_otp_for_new_booking", False) if isinstance(raw_verif, dict) else False
        )
    )

    # 1. Update live AgentRuntimeConfig
    query: dict[str, Any] = {"agent_id": agent_id} if agent_id else {"tenant_id": tenant_id}
    config = await AgentRuntimeConfig.find_one(query)
    if config:
        config.operating_hours = operating_hours
        config.scheduling_engine = scheduling_engine
        if not config.guardrails:
            config.guardrails = GuardrailsEmbed()
        config.guardrails.verification_policy = verif_policy

        if "timezone" in data and config.business_profile:
            config.business_profile.timezone = data.get("timezone")
        if "currency" in data and config.business_profile:
            config.business_profile.currency = data.get("currency")

        await config.save()
        try:
            await delete_cached_biz_context(config.tenant_id, agent_id or config.agent_id or "")
        except Exception:
            pass
        logger.info(
            "[Consumer] Synced schedule to live AgentRuntimeConfig for agent %s (tenant %s)",
            agent_id,
            config.tenant_id,
        )

    # 2. Update AgentDraft
    agent_draft = await AgentDraft.find_one(query)
    if agent_draft:
        current_draft = dict(agent_draft.current_draft) if agent_draft.current_draft else {}
        current_draft["operating_hours"] = {
            "monday": [s.model_dump() for s in operating_hours.monday],
            "tuesday": [s.model_dump() for s in operating_hours.tuesday],
            "wednesday": [s.model_dump() for s in operating_hours.wednesday],
            "thursday": [s.model_dump() for s in operating_hours.thursday],
            "friday": [s.model_dump() for s in operating_hours.friday],
            "saturday": [s.model_dump() for s in operating_hours.saturday],
            "sunday": [s.model_dump() for s in operating_hours.sunday],
            "blackout_dates": [b.model_dump() for b in operating_hours.blackout_dates],
        }
        current_draft["blackout_dates"] = [b.model_dump() for b in operating_hours.blackout_dates]
        current_draft["scheduling_engine"] = scheduling_engine.model_dump()

        guardrails = current_draft.get("guardrails")
        if not isinstance(guardrails, dict):
            guardrails = {}
        guardrails["verification_policy"] = verif_policy.model_dump()
        current_draft["guardrails"] = guardrails

        if "timezone" in data:
            bp = current_draft.get("business_profile")
            if isinstance(bp, dict):
                bp["timezone"] = data.get("timezone")
        if "currency" in data:
            bp = current_draft.get("business_profile")
            if isinstance(bp, dict):
                bp["currency"] = data.get("currency")

        agent_draft.current_draft = current_draft
        await agent_draft.save()
        try:
            await set_cached_draft(agent_draft.tenant_id, agent_id or agent_draft.agent_id, current_draft)
        except Exception:
            pass
        logger.info(
            "[Consumer] Synced schedule to AgentDraft & Redis for agent %s (tenant %s)",
            agent_id,
            agent_draft.tenant_id,
        )


class SchedulingConsumer:
    def __init__(
        self,
        subscriber: EventSubscriber,
        service_topic: str = "scheduling.service.events",
        resource_topic: str = "scheduling.resource.events",
        schedule_topic: str = "scheduling.schedule.events",
    ) -> None:
        self.subscriber = subscriber
        self.service_topic = service_topic
        self.resource_topic = resource_topic
        self.schedule_topic = schedule_topic

    async def handle_service_event(self, payload: dict[str, Any]) -> None:
        await handle_service_event(payload)

    async def handle_resource_event(self, payload: dict[str, Any]) -> None:
        await handle_resource_event(payload)

    async def handle_schedule_event(self, payload: dict[str, Any]) -> None:
        await handle_schedule_event(payload)

    async def start(self) -> None:
        """Register topic handlers, start the subscriber connection, and listen."""
        await self.subscriber.subscribe(self.service_topic, self.handle_service_event)
        await self.subscriber.subscribe(self.resource_topic, self.handle_resource_event)
        await self.subscriber.subscribe(self.schedule_topic, self.handle_schedule_event)
        await self.subscriber.start()
        logger.info(
            "[SchedulingConsumer] Listening for scheduling events via %s on topics: [%s, %s, %s]...",
            type(self.subscriber).__name__,
            self.service_topic,
            self.resource_topic,
            self.schedule_topic,
        )
        await self.subscriber.run()

    async def stop(self) -> None:
        """Stop the underlying subscriber."""
        await self.subscriber.stop()
