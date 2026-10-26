import json
import logging
import os
from typing import Any

import grpc

from agent_orchestrator.models import (
    DepositEmbed,
    PriceEmbed,
    ResourceEmbed,
    ResourceRequirementEmbed,
    ServiceEmbed,
    ServiceVerificationEmbed,
)
from agent_orchestrator.proto import scheduling_pb2, scheduling_pb2_grpc

logger = logging.getLogger(__name__)

SCHEDULING_SERVICE_URL = os.environ.get("SCHEDULING_SERVICE_URL", "localhost:50053")
GRPC_TIMEOUT_SECONDS = float(os.environ.get("SCHEDULING_GRPC_TIMEOUT", 15.0))


def build_embedded_resources(raw_resources: list[dict[str, Any]]) -> list[ResourceEmbed]:
    resources_list: list[ResourceEmbed] = []
    for res in raw_resources:
        resources_list.append(
            ResourceEmbed(
                resource_id=res.get("resource_id", ""),
                resource_type=res.get("resource_type", "staff"),
                name=res.get("name", "unnamed"),
                title=res.get("title") or "",
                category=res.get("category") or "General",
                description=res.get("description") or "",
                is_bookable=res.get("is_bookable", True),
                dispatch_status=res.get("dispatch_status", "active"),
                custom_shift_overrides=res.get("custom_shift_overrides", {}),
            )
        )
    return resources_list


def build_embedded_services(raw_services: list[dict[str, Any]]) -> list[ServiceEmbed]:
    services_list: list[ServiceEmbed] = []
    for svc in raw_services:
        price_d = svc.get("price", {}) or {}
        deposit_d = svc.get("deposit", {}) or {}
        verif_d = svc.get("verification", {}) or {}
        services_list.append(
            ServiceEmbed(
                service_id=svc.get("service_id", ""),
                name=svc.get("name", "unnamed"),
                category=svc.get("category") or "General",
                description=svc.get("description") or "",
                duration_minutes=int(svc.get("duration_minutes") or 30),
                buffer_minutes=int(svc.get("buffer_minutes") or 0),
                booking_mode=svc.get("booking_mode", "time_slot"),
                price=PriceEmbed(
                    type=price_d.get("type", "fixed"),
                    amount=float(price_d.get("amount", 0.0)),
                    currency=price_d.get("currency", "USD"),
                )
                if price_d
                else PriceEmbed(),
                deposit=DepositEmbed(
                    required=bool(deposit_d.get("required", False)),
                    amount=float(deposit_d.get("amount", 0.0)),
                    processor=deposit_d.get("processor") or "",
                    upi_id=deposit_d.get("upi_id") or "",
                    qr_code_url=deposit_d.get("qr_code_url") or "",
                    confirmation_method=deposit_d.get("confirmation_method") or "automatic",
                    payment_instructions=deposit_d.get("payment_instructions") or "",
                )
                if deposit_d
                else DepositEmbed(),
                verification=ServiceVerificationEmbed(require_otp=verif_d.get("require_otp"))
                if verif_d
                else ServiceVerificationEmbed(),
                resource_requirements=[
                    ResourceRequirementEmbed(
                        role=req.get("role", "Staff"),
                        resource_type=req.get("resource_type", "staff"),
                        count=int(req.get("count") or 1),
                        eligible_resource_ids=req.get("eligible_resource_ids", []),
                    )
                    for req in (svc.get("resource_requirements") or [])
                ],
                recall_interval_days=int(svc.get("recall_interval_days") or 0),
            )
        )
    return services_list


async def sync_agent_inventory(
    tenant_id: str,
    agent_id: str,
    draft: dict[str, Any],
) -> dict[str, Any]:

    if not tenant_id:
        return {
            "success": False,
            "error": "Missing tenant_id",
            "resources": [],
            "services": [],
            "draft": draft,
        }

    target_url = SCHEDULING_SERVICE_URL
    raw_resources = draft.get("resources", [])
    raw_services = draft.get("services", [])

    logger.info(
        "[SchedulingClient] Initiating atomic BatchSyncInventory to %s (tenant: %s, agent: %s, %d resources, %d services)",
        target_url,
        tenant_id,
        agent_id,
        len(raw_resources),
        len(raw_services),
    )

    try:
        proto_resources: list[scheduling_pb2.CreateResourceRequest] = []
        for res in raw_resources:
            custom_shifts = res.get("custom_shift_overrides") or {}
            shifts_json = (
                json.dumps(custom_shifts)
                if isinstance(custom_shifts, (dict, list))
                else str(custom_shifts)
            )
            proto_resources.append(
                scheduling_pb2.CreateResourceRequest(
                    tenant_id=tenant_id,
                    agent_id=agent_id or None,
                    resource_id=res.get("resource_id") or None,
                    resource_type=res.get("resource_type") or "staff",
                    name=(res.get("name") or "Unnamed").strip(),
                    title=res.get("title") or "",
                    category=res.get("category") or "General",
                    description=res.get("description") or "",
                    is_bookable=res.get("is_bookable", True),
                    dispatch_status=res.get("dispatch_status") or "active",
                    custom_shift_overrides_json=shifts_json,
                )
            )

        proto_services: list[scheduling_pb2.CreateServiceRequest] = []
        for svc in raw_services:
            price_d = svc.get("price") or {}
            deposit_d = svc.get("deposit") or {}
            verif_d = svc.get("verification") or {}
            verif_info = None
            if verif_d and verif_d.get("require_otp") is not None:
                verif_info = scheduling_pb2.ServiceVerificationInfo(
                    require_otp=bool(verif_d["require_otp"])
                )

            proto_services.append(
                scheduling_pb2.CreateServiceRequest(
                    tenant_id=tenant_id,
                    agent_id=agent_id or None,
                    service_id=svc.get("service_id") or None,
                    name=(svc.get("name") or "Unnamed").strip(),
                    category=svc.get("category") or "General",
                    description=svc.get("description") or "",
                    duration_minutes=int(svc.get("duration_minutes") or 30),
                    buffer_minutes=int(svc.get("buffer_minutes") or 0),
                    booking_mode=str(svc.get("booking_mode") or "time_slot"),
                    price=scheduling_pb2.PriceInfo(
                        type=str(price_d.get("type") or "fixed"),
                        amount=float(price_d.get("amount") or 0.0),
                        currency=str(price_d.get("currency") or "USD"),
                    ),
                    deposit=scheduling_pb2.DepositInfo(
                        required=bool(deposit_d.get("required", False)),
                        amount=float(deposit_d.get("amount") or 0.0),
                        processor=str(deposit_d.get("processor") or ""),
                        upi_id=str(deposit_d.get("upi_id") or ""),
                        qr_code_url=str(deposit_d.get("qr_code_url") or ""),
                        confirmation_method=str(
                            deposit_d.get("confirmation_method") or "automatic"
                        ),
                        payment_instructions=str(deposit_d.get("payment_instructions") or ""),
                    ),
                    verification=verif_info,
                    resource_requirements=[
                        scheduling_pb2.ResourceRequirementInfo(
                            role=req.get("role") or "Staff",
                            resource_type=req.get("resource_type") or "staff",
                            count=int(req.get("count") or 1),
                            eligible_resource_ids=req.get("eligible_resource_ids") or [],
                            selection_mode=req.get("selection_mode")
                            or (
                                "user_selectable"
                                if (req.get("resource_type") or "").lower() == "staff"
                                else "auto_assign"
                            ),
                        )
                        for req in (svc.get("resource_requirements") or [])
                    ],
                    recall_interval_days=int(svc.get("recall_interval_days") or 0),
                )
            )

        biz = draft.get("business_profile") or {}
        timezone = biz.get("timezone") or "UTC"
        currency = biz.get("currency") or "USD"

        op_raw = draft.get("operating_hours") or {}
        blackout_raw = op_raw.get("blackout_dates") or []

        def build_intervals(day_slots: Any) -> list[scheduling_pb2.TimeIntervalInfo]:
            if not isinstance(day_slots, list):
                return []
            return [
                scheduling_pb2.TimeIntervalInfo(start=s.get("start", "08:00"), end=s.get("end", "17:00"))
                for s in day_slots
                if isinstance(s, dict) and s.get("start") and s.get("end")
            ]

        proto_operating_hours = scheduling_pb2.OperatingHoursInfo(
            monday=build_intervals(op_raw.get("monday")),
            tuesday=build_intervals(op_raw.get("tuesday")),
            wednesday=build_intervals(op_raw.get("wednesday")),
            thursday=build_intervals(op_raw.get("thursday")),
            friday=build_intervals(op_raw.get("friday")),
            saturday=build_intervals(op_raw.get("saturday")),
            sunday=build_intervals(op_raw.get("sunday")),
        )

        proto_blackout_dates = [
            scheduling_pb2.BlackoutDateInfo(
                date=str(b.get("date", "")),
                reason=str(b.get("reason", "")),
                is_closed=bool(b.get("is_closed", True)),
            )
            for b in blackout_raw
            if isinstance(b, dict) and b.get("date")
        ]

        se_raw = draft.get("scheduling_engine") or {}
        proto_scheduling_engine = scheduling_pb2.SchedulingEngineConfigInfo(
            booking_mode=str(se_raw.get("booking_mode", "time_slot")),
            default_lead_time_hours=int(se_raw.get("default_lead_time_hours") or 2),
            max_advance_booking_days=int(se_raw.get("max_advance_booking_days") or 60),
            cancellation_window_hours=int(se_raw.get("cancellation_window_hours") or 24),
            hold_duration_minutes=int(se_raw.get("hold_duration_minutes") or 10),
        )

        guard_raw = draft.get("guardrails") or {}
        verif_pol_raw = guard_raw.get("verification_policy") or {}
        proto_verification_policy = scheduling_pb2.VerificationPolicyConfigInfo(
            require_otp_for_new_booking=bool(verif_pol_raw.get("require_otp_for_new_booking", False)),
            require_otp_for_reschedule=bool(verif_pol_raw.get("require_otp_for_reschedule", True)),
            require_otp_for_cancel=bool(verif_pol_raw.get("require_otp_for_cancel", True)),
        )

        batch_request = scheduling_pb2.BatchSyncInventoryRequest(
            tenant_id=tenant_id,
            agent_id=agent_id or "",
            resources=proto_resources,
            services=proto_services,
            timezone=timezone,
            currency=currency,
            operating_hours=proto_operating_hours,
            blackout_dates=proto_blackout_dates,
            scheduling_engine=proto_scheduling_engine,
            verification_policy=proto_verification_policy,
        )

        async with grpc.aio.insecure_channel(target_url) as channel:
            stub = scheduling_pb2_grpc.SchedulingInventoryServiceStub(channel)
            resp: scheduling_pb2.BatchSyncInventoryResponse = await stub.BatchSyncInventory(
                batch_request,
                timeout=GRPC_TIMEOUT_SECONDS,
            )

        if not resp.success:
            logger.error("[SchedulingClient] BatchSyncInventory returned failure: %s", resp.message)
            return {
                "success": False,
                "error": resp.message,
                "resources_synced": 0,
                "services_synced": 0,
                "resources": build_embedded_resources(raw_resources),
                "services": build_embedded_services(raw_services),
                "draft": draft,
            }

        for res, proto_res in zip(raw_resources, resp.resources, strict=False):
            res["resource_id"] = proto_res.resource_id

        for svc, proto_svc in zip(raw_services, resp.services, strict=False):
            svc["service_id"] = proto_svc.service_id
            if proto_svc.resource_requirements:
                svc["resource_requirements"] = [
                    {
                        "role": req.role,
                        "resource_type": req.resource_type,
                        "count": req.count,
                        "eligible_resource_ids": list(req.eligible_resource_ids),
                    }
                    for req in proto_svc.resource_requirements
                ]

        resources_list = build_embedded_resources(raw_resources)
        services_list = build_embedded_services(raw_services)

        logger.info(
            "[SchedulingClient] BatchSyncInventory succeeded atomically (%d resources, %d services synced)",
            len(resp.resources),
            len(resp.services),
        )

        return {
            "success": True,
            "error": None,
            "resources_synced": len(resp.resources),
            "services_synced": len(resp.services),
            "resources": resources_list,
            "services": services_list,
            "draft": draft,
        }

    except grpc.RpcError as rpc_err:
        err_msg = f"gRPC error ({rpc_err.code()}): {rpc_err.details()}"
        logger.error(
            "[SchedulingClient Error] Failed BatchSyncInventory to %s: %s", target_url, err_msg
        )
        return {
            "success": False,
            "error": err_msg,
            "resources_synced": 0,
            "services_synced": 0,
            "resources": build_embedded_resources(raw_resources),
            "services": build_embedded_services(raw_services),
            "draft": draft,
        }
    except Exception as e:
        err_msg = str(e)
        logger.error(
            "[SchedulingClient Error] Unexpected error during BatchSyncInventory: %s", err_msg
        )
        return {
            "success": False,
            "error": err_msg,
            "resources_synced": 0,
            "services_synced": 0,
            "resources": build_embedded_resources(raw_resources),
            "services": build_embedded_services(raw_services),
            "draft": draft,
        }


async def get_availability(
    tenant_id: str,
    service_id: str,
    start_date: str,
    end_date: str | None = None,
    resource_id: str | None = None,
    resource_ids: list[str] | None = None,
    timezone: str | None = None,
    agent_id: str | None = None,
) -> dict[str, Any]:
    """Query scheduling-inventory service for available slots."""
    target_url = SCHEDULING_SERVICE_URL
    req = scheduling_pb2.GetAvailabilityRequest(
        tenant_id=tenant_id,
        agent_id=agent_id or None,
        service_id=service_id,
        start_date=start_date,
        end_date=end_date or None,
        resource_id=resource_id or None,
        timezone=timezone or None,
        resource_ids=resource_ids or [],
    )
    try:
        async with grpc.aio.insecure_channel(target_url) as channel:
            stub = scheduling_pb2_grpc.SchedulingInventoryServiceStub(channel)
            resp: scheduling_pb2.GetAvailabilityResponse = await stub.GetAvailability(
                req, timeout=GRPC_TIMEOUT_SECONDS
            )

        days_data = []
        for d in resp.days:
            slots_data = [
                {
                    "start_time": s.start_time,
                    "end_time": s.end_time,
                    "available": s.available,
                    "available_resource_ids": list(s.available_resource_ids),
                    "reason": s.reason or None,
                }
                for s in d.slots
            ]
            days_data.append(
                {
                    "date": d.date,
                    "is_closed": d.is_closed,
                    "closure_reason": d.closure_reason or None,
                    "has_availability": d.has_availability,
                    "slots": slots_data,
                }
            )

        return {
            "success": True,
            "service_id": resp.service_id,
            "booking_mode": resp.booking_mode,
            "timezone": resp.timezone,
            "days": days_data,
            "blocked_dates": list(resp.blocked_dates),
        }
    except grpc.RpcError as rpc_err:
        err_msg = f"gRPC error ({rpc_err.code()}): {rpc_err.details()}"
        logger.error("[SchedulingClient Error] Failed GetAvailability: %s", err_msg)
        return {"success": False, "error": err_msg, "days": []}
    except Exception as e:
        logger.error("[SchedulingClient Error] Unexpected GetAvailability error: %s", e)
        return {"success": False, "error": str(e), "days": []}


async def create_booking(
    tenant_id: str,
    service_id: str,
    start_time: str,
    customer_name: str,
    customer_phone: str,
    customer_email: str | None = None,
    end_time: str | None = None,
    resource_id: str | None = None,
    resource_ids: list[str] | None = None,
    notes: str | None = None,
    agent_id: str | None = None,
) -> dict[str, Any]:
    """Execute booking creation in scheduling-inventory service."""
    target_url = SCHEDULING_SERVICE_URL
    req = scheduling_pb2.CreateBookingRequest(
        tenant_id=tenant_id,
        agent_id=agent_id or None,
        service_id=service_id,
        resource_id=resource_id or None,
        start_time=start_time,
        end_time=end_time or None,
        customer_name=customer_name.strip(),
        customer_phone=customer_phone.strip(),
        customer_email=customer_email.strip() if customer_email else None,
        notes=notes or None,
        source="ai_chat",
        created_by="customer_agent",
        resource_ids=resource_ids or [],
    )
    try:
        async with grpc.aio.insecure_channel(target_url) as channel:
            stub = scheduling_pb2_grpc.SchedulingInventoryServiceStub(channel)
            resp: scheduling_pb2.BookingResponse = await stub.CreateBooking(
                req, timeout=GRPC_TIMEOUT_SECONDS
            )

        bk = resp.booking
        return {
            "success": True,
            "message": resp.message,
            "booking": {
                "booking_id": bk.booking_id,
                "booking_reference": bk.booking_reference,
                "tenant_id": bk.tenant_id,
                "service_id": bk.service_id,
                "start_time": bk.start_time,
                "end_time": bk.end_time,
                "status": bk.status,
                "deposit_status": bk.deposit_status,
                "price": {
                    "type": bk.price.type,
                    "amount": bk.price.amount,
                    "currency": bk.price.currency,
                }
                if bk.price
                else None,
            },
        }
    except grpc.RpcError as rpc_err:
        err_msg = f"gRPC error ({rpc_err.code()}): {rpc_err.details()}"
        logger.error("[SchedulingClient Error] Failed CreateBooking: %s", err_msg)
        return {"success": False, "error": err_msg}
    except Exception as e:
        logger.error("[SchedulingClient Error] Unexpected CreateBooking error: %s", e)
        return {"success": False, "error": str(e)}

