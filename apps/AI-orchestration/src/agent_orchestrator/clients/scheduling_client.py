import json
import logging
import os
from collections.abc import Awaitable, Callable
from typing import Any, TypeVar

import grpc

from agent_orchestrator.circuit_breaker import (
    CircuitBreakerError,
    get_circuit_breaker,
)
from agent_orchestrator.models import (
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

scheduling_breaker = get_circuit_breaker(
    name="scheduling-inventory",
    failure_threshold=int(os.environ.get("SCHEDULING_CB_FAILURE_THRESHOLD", 5)),
    recovery_timeout=float(os.environ.get("SCHEDULING_CB_RECOVERY_TIMEOUT", 10.0)),
)

T = TypeVar("T")


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
                verification=ServiceVerificationEmbed(require_otp=verif_d.get("require_otp"))
                if verif_d
                else ServiceVerificationEmbed(),
                resource_requirements=[
                    ResourceRequirementEmbed(
                        role=req.get("role", "Staff"),
                        resource_type=req.get("resource_type", "staff"),
                        count=int(req.get("count") or 1),
                        eligible_resource_ids=req.get("eligible_resource_ids", []),
                        selection_mode=req.get("selection_mode")
                        or (
                            "user_selectable"
                            if (req.get("resource_type") or "").lower() == "staff"
                            else "auto_assign"
                        ),
                    )
                    for req in (svc.get("resource_requirements") or [])
                ],
            )
        )
    return services_list


async def _execute_scheduling_rpc[T](
    rpc_caller: Callable[[scheduling_pb2_grpc.SchedulingInventoryServiceStub], Awaitable[T]],
    operation_name: str,
    fallback_on_open: dict[str, Any],
) -> T | dict[str, Any]:
    """
    Executes a gRPC call to scheduling-inventory guarded by aiobreaker.
    Centralizes channel lifecycle, timeouts, circuit breaking, and unified error handling.
    """
    target_url = SCHEDULING_SERVICE_URL

    async def _do_rpc() -> T:
        async with grpc.aio.insecure_channel(target_url) as channel:
            stub = scheduling_pb2_grpc.SchedulingInventoryServiceStub(channel)
            return await rpc_caller(stub)

    try:
        return await scheduling_breaker.call_async(_do_rpc)
    except CircuitBreakerError as cb_err:
        logger.warning(
            "[SchedulingClient] %s fast-failed (circuit open): %s",
            operation_name,
            cb_err,
        )
        return fallback_on_open
    except grpc.RpcError as rpc_err:
        err_msg = f"gRPC error ({rpc_err.code()}): {rpc_err.details()}"
        logger.error("[SchedulingClient Error] Failed %s: %s", operation_name, err_msg)
        fallback = dict(fallback_on_open)
        fallback["error"] = err_msg
        return fallback
    except Exception as e:
        err_msg = str(e)
        logger.error("[SchedulingClient Error] Unexpected %s error: %s", operation_name, err_msg)
        fallback = dict(fallback_on_open)
        fallback["error"] = err_msg
        return fallback


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

    raw_resources = [r for r in draft.get("resources", []) if isinstance(r, dict)]
    raw_services = [s for s in draft.get("services", []) if isinstance(s, dict)]

    logger.info(
        "[SchedulingClient] Initiating atomic BatchSyncInventory (tenant: %s, agent: %s, %d resources, %d services)",
        tenant_id,
        agent_id,
        len(raw_resources),
        len(raw_services),
    )

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
                is_deleted=bool(res.get("is_deleted", False)),
                deleted_at=str(res.get("deleted_at")) if res.get("deleted_at") else None,
            )
        )

    proto_services: list[scheduling_pb2.CreateServiceRequest] = []
    for svc in raw_services:
        price_d = svc.get("price") or {}
        verif_d = svc.get("verification") or {}
        verif_info = None
        if verif_d and verif_d.get("require_otp") is not None:
            verif_info = scheduling_pb2.ServiceVerificationInfo(
                require_otp=bool(verif_d["require_otp"])
            )

        proto_requirements: list[scheduling_pb2.ResourceRequirement] = []
        for req in svc.get("resource_requirements", []):
            proto_requirements.append(
                scheduling_pb2.ResourceRequirement(
                    role=req.get("role", "Staff"),
                    resource_type=req.get("resource_type", "staff"),
                    count=int(req.get("count") or 1),
                    eligible_resource_ids=req.get("eligible_resource_ids", []),
                    selection_mode=req.get("selection_mode") or "auto_assign",
                )
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
                booking_mode=svc.get("booking_mode", "time_slot"),
                price=scheduling_pb2.Price(
                    type=price_d.get("type", "fixed"),
                    amount=float(price_d.get("amount", 0.0)),
                    currency=price_d.get("currency", "USD"),
                )
                if price_d
                else None,
                verification=verif_info,
                resource_requirements=proto_requirements,
                is_deleted=bool(svc.get("is_deleted", False)),
                deleted_at=str(svc.get("deleted_at")) if svc.get("deleted_at") else None,
            )
        )

    timezone = draft.get("timezone", "UTC")
    currency = draft.get("currency", "USD")

    proto_operating_hours: list[scheduling_pb2.OperatingHoursDay] = []
    for day in draft.get("operating_hours", []):
        proto_operating_hours.append(
            scheduling_pb2.OperatingHoursDay(
                day_of_week=day.get("day_of_week", ""),
                is_open=day.get("is_open", True),
                time_ranges=[
                    scheduling_pb2.TimeRange(start=tr.get("start", ""), end=tr.get("end", ""))
                    for tr in day.get("time_ranges", [])
                ],
            )
        )

    proto_blackout_dates: list[scheduling_pb2.BlackoutDateInfo] = []
    for bo in draft.get("blackout_dates", []):
        proto_blackout_dates.append(
            scheduling_pb2.BlackoutDateInfo(
                start_date=bo.get("start_date", ""),
                end_date=bo.get("end_date", ""),
                reason=bo.get("reason", ""),
            )
        )

    se_raw = draft.get("scheduling_engine") or {}
    proto_scheduling_engine = scheduling_pb2.SchedulingEngineConfigInfo(
        slot_interval_minutes=int(se_raw.get("slot_interval_minutes") or 30),
        min_advance_booking_hours=int(se_raw.get("min_advance_booking_hours") or 2),
        max_advance_booking_days=int(se_raw.get("max_advance_booking_days") or 60),
        cancellation_window_hours=int(se_raw.get("cancellation_window_hours") or 24),
        hold_duration_minutes=int(se_raw.get("hold_duration_minutes") or 10),
    )

    guard_raw = draft.get("guardrails") or {}
    verif_pol_raw = guard_raw.get("verification_policy") or {}
    proto_verification_policy = scheduling_pb2.VerificationPolicyConfigInfo(
        require_otp_for_new_booking=bool(verif_pol_raw.get("require_otp_for_new_booking", False)),
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

    resp = await _execute_scheduling_rpc(
        lambda stub: stub.BatchSyncInventory(batch_request, timeout=GRPC_TIMEOUT_SECONDS),
        operation_name="BatchSyncInventory",
        fallback_on_open={
            "success": False,
            "error": "Scheduling inventory service is temporarily unavailable (circuit open).",
            "resources_synced": 0,
            "services_synced": 0,
            "resources": build_embedded_resources(raw_resources),
            "services": build_embedded_services(raw_services),
            "draft": draft,
        },
    )

    if isinstance(resp, dict) and not resp.get("success", True):
        return resp

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
                    "selection_mode": req.selection_mode or "auto_assign",
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


async def get_availability(
    tenant_id: str,
    agent_id: str,
    service_id: str,
    start_date: str,
    end_date: str | None = None,
    resource_id: str | None = None,
    resource_ids: list[str] | None = None,
    timezone: str | None = None,
) -> dict[str, Any]:
    """Query scheduling-inventory service for available slots."""
    req = scheduling_pb2.GetAvailabilityRequest(
        tenant_id=tenant_id,
        agent_id=agent_id,
        service_id=service_id,
        start_date=start_date,
        end_date=end_date or None,
        resource_id=resource_id or None,
        timezone=timezone or None,
        resource_ids=resource_ids or [],
    )

    resp = await _execute_scheduling_rpc(
        lambda stub: stub.GetAvailability(req, timeout=GRPC_TIMEOUT_SECONDS),
        operation_name="GetAvailability",
        fallback_on_open={
            "success": False,
            "error": "Scheduling calendar is temporarily offline. Please try again shortly.",
            "days": [],
        },
    )

    if isinstance(resp, dict) and not resp.get("success", True):
        return resp

    days_data = [
        {
            "date": d.date,
            "is_closed": d.is_closed,
            "closure_reason": d.closure_reason or None,
            "has_availability": d.has_availability,
            "slots": [
                {
                    "start_time": s.start_time,
                    "end_time": s.end_time,
                    "available": s.available,
                    "available_resource_ids": list(s.available_resource_ids),
                    "reason": s.reason or None,
                }
                for s in d.slots
            ],
        }
        for d in resp.days
    ]

    return {
        "success": True,
        "service_id": resp.service_id,
        "booking_mode": resp.booking_mode,
        "timezone": resp.timezone,
        "days": days_data,
        "blocked_dates": list(resp.blocked_dates),
    }


async def create_booking(
    tenant_id: str,
    agent_id: str,
    service_id: str,
    start_time: str,
    customer_name: str,
    customer_phone: str,
    customer_email: str | None = None,
    end_time: str | None = None,
    resource_id: str | None = None,
    resource_ids: list[str] | None = None,
    notes: str | None = None,
    source: str = "customer_agent",
    hold_token: str | None = None,
    override_hold: bool = False,
) -> dict[str, Any]:
    """Execute booking creation in scheduling-inventory service."""
    req = scheduling_pb2.CreateBookingRequest(
        tenant_id=tenant_id,
        agent_id=agent_id,
        service_id=service_id,
        resource_id=resource_id or None,
        start_time=start_time,
        end_time=end_time or None,
        customer_name=customer_name.strip(),
        customer_phone=customer_phone.strip(),
        customer_email=customer_email.strip() if customer_email else None,
        notes=notes or None,
        source=source or "customer_agent",
        created_by="customer_agent",
        resource_ids=resource_ids or [],
        hold_token=hold_token or None,
        override_hold=bool(override_hold),
    )

    resp = await _execute_scheduling_rpc(
        lambda stub: stub.CreateBooking(req, timeout=GRPC_TIMEOUT_SECONDS),
        operation_name="CreateBooking",
        fallback_on_open={
            "success": False,
            "error": "Booking service is temporarily unavailable (circuit open). Please try again shortly.",
        },
    )

    if isinstance(resp, dict) and not resp.get("success", True):
        return resp

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
            "price": {
                "type": bk.price.type,
                "amount": bk.price.amount,
                "currency": bk.price.currency,
            }
            if bk.price
            else None,
        },
    }


async def cancel_booking(
    tenant_id: str,
    agent_id: str,
    booking_id: str,
    reason: str | None = None,
    cancelled_by: str = "customer_agent",
) -> dict[str, Any]:
    """Execute booking cancellation in scheduling-inventory service."""
    req = scheduling_pb2.CancelBookingRequest(
        tenant_id=tenant_id,
        agent_id=agent_id,
        booking_id=booking_id.strip(),
        reason=reason.strip() if reason else None,
        cancelled_by=cancelled_by,
    )

    resp = await _execute_scheduling_rpc(
        lambda stub: stub.CancelBooking(req, timeout=GRPC_TIMEOUT_SECONDS),
        operation_name="CancelBooking",
        fallback_on_open={
            "success": False,
            "error": "Cancellation service is temporarily unavailable (circuit open).",
        },
    )

    if isinstance(resp, dict) and not resp.get("success", True):
        return resp

    bk = resp.booking
    return {
        "success": True,
        "message": resp.message,
        "booking": {
            "booking_id": bk.booking_id,
            "booking_reference": bk.booking_reference,
            "status": bk.status,
        },
    }


async def reschedule_booking(
    tenant_id: str,
    agent_id: str,
    booking_id: str,
    new_start_time: str,
    new_end_time: str | None = None,
    resource_id: str | None = None,
    resource_ids: list[str] | None = None,
    notes: str | None = None,
    rescheduled_by: str = "customer_agent",
    hold_token: str | None = None,
    override_hold: bool = False,
) -> dict[str, Any]:
    """Execute booking rescheduling in scheduling-inventory service."""
    req = scheduling_pb2.RescheduleBookingRequest(
        tenant_id=tenant_id,
        agent_id=agent_id,
        booking_id=booking_id.strip(),
        new_start_time=new_start_time.strip(),
        new_end_time=new_end_time.strip() if new_end_time else None,
        resource_id=resource_id or None,
        resource_ids=resource_ids or [],
        notes=notes or None,
        rescheduled_by=rescheduled_by,
        hold_token=hold_token or None,
        override_hold=bool(override_hold),
    )

    resp = await _execute_scheduling_rpc(
        lambda stub: stub.RescheduleBooking(req, timeout=GRPC_TIMEOUT_SECONDS),
        operation_name="RescheduleBooking",
        fallback_on_open={
            "success": False,
            "error": "Rescheduling service is temporarily unavailable (circuit open).",
        },
    )

    if isinstance(resp, dict) and not resp.get("success", True):
        return resp

    bk = resp.booking
    return {
        "success": True,
        "message": resp.message,
        "booking": {
            "booking_id": bk.booking_id,
            "booking_reference": bk.booking_reference,
            "start_time": bk.start_time,
            "end_time": bk.end_time,
            "status": bk.status,
        },
    }


async def list_bookings(
    tenant_id: str,
    agent_id: str | None = None,
    service_id: str | None = None,
    resource_id: str | None = None,
    status: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
    search: str | None = None,
    customer_phone: str | None = None,
    page: int = 1,
    limit: int = 50,
) -> dict[str, Any]:
    """Query bookings from scheduling-inventory service via gRPC."""
    req = scheduling_pb2.ListBookingsRequest(
        tenant_id=tenant_id.strip(),
        agent_id=agent_id.strip() if agent_id else None,
        service_id=service_id.strip() if service_id else None,
        resource_id=resource_id.strip() if resource_id else None,
        status=status.strip() if status else None,
        start_date=start_date.strip() if start_date else None,
        end_date=end_date.strip() if end_date else None,
        search=search.strip() if search else None,
        customer_phone=customer_phone.strip() if customer_phone else None,
        page=page,
        limit=limit,
    )

    resp = await _execute_scheduling_rpc(
        lambda stub: stub.ListBookings(req, timeout=GRPC_TIMEOUT_SECONDS),
        operation_name="ListBookings",
        fallback_on_open={
            "success": False,
            "error": "Booking history service is temporarily unavailable (circuit open).",
            "bookings": [],
            "total": 0,
        },
    )

    if isinstance(resp, dict) and not resp.get("success", True):
        return resp

    items = []
    for bk in resp.bookings:
        c_name = bk.customer.name if bk.HasField("customer") else ""
        c_phone = bk.customer.phone if bk.HasField("customer") else ""
        c_email = bk.customer.email if (bk.HasField("customer") and bk.customer.email) else None
        price_info = (
            {
                "amount": bk.price.amount,
                "currency": bk.price.currency,
                "type": bk.price.type,
            }
            if bk.HasField("price")
            else None
        )
        items.append(
            {
                "booking_id": bk.booking_id,
                "booking_reference": bk.booking_reference,
                "tenant_id": bk.tenant_id,
                "agent_id": bk.agent_id,
                "service_id": bk.service_id,
                "resource_id": bk.resource_id if bk.resource_id else None,
                "resource_ids": list(bk.resource_ids) if bk.resource_ids else [],
                "booking_mode": bk.booking_mode or "time_slot",
                "duration_minutes": bk.duration_minutes,
                "price": price_info,
                "start_time": bk.start_time,
                "end_time": bk.end_time,
                "customer_name": c_name,
                "customer_phone": c_phone,
                "customer_email": c_email,
                "notes": bk.notes if bk.notes else None,
                "status": bk.status,
            }
        )

    return {
        "success": True,
        "bookings": items,
        "total": resp.total,
        "page": resp.page,
        "limit": resp.limit,
    }


async def verify_customer(
    tenant_id: str,
    customer_phone: str,
    agent_id: str | None = None,
) -> dict[str, Any]:
    """Mark a customer as verified (is_guest: false) in scheduling-inventory service via gRPC."""
    kwargs: dict[str, Any] = {
        "tenant_id": tenant_id.strip(),
        "customer_phone": customer_phone.strip(),
    }
    if agent_id and agent_id.strip():
        kwargs["agent_id"] = agent_id.strip()
    req = scheduling_pb2.VerifyCustomerRequest(**kwargs)

    resp = await _execute_scheduling_rpc(
        lambda stub: stub.VerifyCustomer(req, timeout=GRPC_TIMEOUT_SECONDS),
        operation_name="VerifyCustomer",
        fallback_on_open={
            "success": False,
            "error": "Verification service is temporarily unavailable (circuit open).",
            "updated_count": 0,
        },
    )

    if isinstance(resp, dict) and not resp.get("success", True):
        return resp

    return {
        "success": resp.success,
        "message": resp.message,
        "updated_count": resp.updated_count,
    }
