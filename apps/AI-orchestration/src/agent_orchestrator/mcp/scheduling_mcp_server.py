import json
import logging
import secrets
from datetime import datetime
from typing import Any
from zoneinfo import ZoneInfo

from langchain_core.tools import BaseTool, StructuredTool
from mcp.server.fastmcp import FastMCP

from agent_orchestrator.clients.redis_client import (
    is_session_verified,
    set_session_auth,
    store_otp,
    verify_otp_code,
)
from agent_orchestrator.clients.scheduling_client import (
    cancel_booking,
    create_booking,
    get_availability,
    list_bookings,
    reschedule_booking,
    verify_customer,
)
from agent_orchestrator.models import AgentDraft, AgentRuntimeConfig
from agent_orchestrator.queues.sms_queue import get_sms_queue
from agent_orchestrator.repositories.customer_message_repository import CustomerMessageRepository

logger = logging.getLogger(__name__)


_TZ_ALIASES: dict[str, str] = {
    "kolkata": "Asia/Kolkata",
    "calcutta": "Asia/Kolkata",
    "ist": "Asia/Kolkata",
    "utc": "UTC",
    "gmt": "GMT",
    "est": "America/New_York",
    "edt": "America/New_York",
    "cst": "America/Chicago",
    "cdt": "America/Chicago",
    "mst": "America/Denver",
    "mdt": "America/Denver",
    "pst": "America/Los_Angeles",
    "pdt": "America/Los_Angeles",
    "london": "Europe/London",
    "dubai": "Asia/Dubai",
    "singapore": "Asia/Singapore",
}


def _resolve_zoneinfo(tz_name: str | None) -> ZoneInfo:
    if not tz_name:
        return ZoneInfo("UTC")
    cleaned = tz_name.strip()
    try:
        return ZoneInfo(cleaned)
    except Exception:
        canonical = _TZ_ALIASES.get(cleaned.lower())
        if canonical:
            try:
                return ZoneInfo(canonical)
            except Exception:
                pass
    return ZoneInfo("UTC")


def _format_local_datetime(iso_str: str | None, tz_name: str | None) -> str:
    """Convert UTC ISO timestamp (e.g. 2026-11-03T09:30:00.000Z) to formatted local time string."""
    if not iso_str:
        return ""
    try:
        clean_iso = iso_str.replace("Z", "+00:00")
        dt = datetime.fromisoformat(clean_iso)
        target_tz = _resolve_zoneinfo(tz_name)
        local_dt = dt.astimezone(target_tz)
        return local_dt.strftime("%d %b %Y, %I:%M %p %Z").strip()
    except Exception:
        return iso_str


mcp = FastMCP("schedulux-scheduling-service")


@mcp.tool()
async def check_availability(
    tenant_id: str,
    agent_id: str,
    service_id: str,
    start_date: str,
    end_date: str | None = None,
    resource_id: str | None = None,
    timezone: str | None = None,
) -> str:
    """Check available appointment time slots for a given service.

    Args:
        tenant_id: The ID of the business/tenant.
        agent_id: The ID of the agent managing the service catalog and schedule.
        service_id: The ID of the service to check availability for.
        start_date: Start date in YYYY-MM-DD format.
        end_date: Optional end date in YYYY-MM-DD format (for range lookup).
        resource_id: Optional specific staff or resource ID requested by customer.
        timezone: Optional customer timezone string (e.g. 'UTC', 'America/New_York').

    Returns:
        JSON string containing available dates, operating hours, and open time slots.
    """
    logger.info(
        "[MCP Tool: check_availability] Invoked with arguments: tenant_id=%s, agent_id=%s, service_id=%s, start_date=%s, end_date=%s, resource_id=%s, timezone=%s",
        tenant_id,
        agent_id,
        service_id,
        start_date,
        end_date,
        resource_id,
        timezone,
    )
    result = await get_availability(
        tenant_id=tenant_id,
        agent_id=agent_id,
        service_id=service_id,
        start_date=start_date,
        end_date=end_date,
        resource_id=resource_id,
        timezone=timezone,
    )

    if not result.get("success"):
        return json.dumps(
            {
                "status": "error",
                "message": result.get("error", "Failed to retrieve availability slots"),
            }
        )

    available_days = []
    for day in result.get("days", []):
        open_slots = [
            {"start": s["start_time"], "end": s["end_time"]}
            for s in day.get("slots", [])
            if s.get("available")
        ]
        available_days.append(
            {
                "date": day["date"],
                "is_closed": day["is_closed"],
                "closure_reason": day.get("closure_reason"),
                "total_available_slots": len(open_slots),
                "slots": open_slots[:30],
            }
        )

    print(available_days)
    return json.dumps(
        {
            "status": "success",
            "service_id": result.get("service_id"),
            "booking_mode": result.get("booking_mode", "time_slot"),
            "timezone": result.get("timezone", "UTC"),
            "days": available_days,
        },
        indent=2,
    )


@mcp.tool()
async def send_booking_otp(
    tenant_id: str,
    agent_id: str,
    phone: str,
) -> str:
    logger.info(
        "[MCP Tool: send_booking_otp] Invoked with arguments: tenant_id=%s, agent_id=%s, phone=%s",
        tenant_id,
        agent_id,
        phone,
    )
    cleaned_phone = phone.strip()
    if not cleaned_phone:
        return json.dumps({"status": "failed", "message": "Valid phone number is required."})


    code = f"{secrets.randbelow(900000) + 100000}"
    await store_otp(cleaned_phone, code, ttl=300)

    await get_sms_queue().enqueue_otp_sms(
        phone=cleaned_phone,
        code=code,
        tenant_id=tenant_id,
        agent_id=agent_id,
    )

    logger.info("[MCP Tool send_booking_otp] Enqueued OTP for %s for agent %s", cleaned_phone, agent_id)
    return json.dumps({
        "status": "sent",
        "phone": cleaned_phone,
        "message": f"Verification code sent to {cleaned_phone}. Please ask customer to provide the 6-digit code.",
    })


@mcp.tool()
async def verify_booking_otp(
    session_id: str,
    phone: str,
    code: str,
    tenant_id: str,
    agent_id: str,
) -> str:
    """Verify customer's 6-digit OTP code and authenticate their chat session.

    Args:
        session_id: Active customer chat session ID.
        phone: Customer mobile phone number.
        code: 6-digit code provided by customer.
        tenant_id: The ID of the business/tenant.
        agent_id: The ID of the agent managing the business.
    """
    logger.info(
        "[MCP Tool: verify_booking_otp] Invoked with arguments: session_id=%s, phone=%s, code=%s, tenant_id=%s, agent_id=%s",
        session_id,
        phone,
        code,
        tenant_id,
        agent_id,
    )
    cleaned_phone = phone.strip()
    cleaned_code = code.strip()

    valid, reason = await verify_otp_code(cleaned_phone, cleaned_code)
    if not valid:
        if reason == "max_attempts_exceeded":
            message = "Too many failed verification attempts. This verification code has been invalidated for security. Please request a new verification code."
        elif reason.startswith("invalid_code:"):
            remaining = reason.split(":")[1]
            attempts_str = "attempt" if remaining == "1" else "attempts"
            message = f"Invalid verification code. You have {remaining} {attempts_str} remaining. Please double-check the 6-digit code sent to your phone."
        elif reason == "expired_or_not_found":
            message = "Verification code has expired or was not found. Please request a new verification code."
        else:
            message = "Invalid or expired verification code. Please check and try again."

        return json.dumps({
            "status": "failed",
            "message": message,
        })

    await set_session_auth(session_id=session_id, phone=cleaned_phone, ttl=86400)

    repo = CustomerMessageRepository()
    await repo.mark_conversation_verified(session_id=session_id, customer_phone=cleaned_phone)


    try:
        await verify_customer(tenant_id=tenant_id or "", customer_phone=cleaned_phone)
        logger.info("[MCP Tool verify_booking_otp] Synced is_guest: false via gRPC for %s", cleaned_phone)
    except Exception as e:
        logger.warning("[MCP Tool verify_booking_otp] Could not sync customer verification via gRPC: %s", e)

    logger.info("[MCP Tool verify_booking_otp] Session %s verified for phone %s", session_id, cleaned_phone)
    return json.dumps({
        "status": "verified",
        "phone": cleaned_phone,
        "message": f"Phone number {cleaned_phone} successfully verified! Session is now authenticated.",
    })


@mcp.tool()
async def book_appointment(
    tenant_id: str,
    agent_id: str,
    service_id: str,
    start_time: str,
    customer_name: str,
    customer_phone: str,
    customer_email: str | None = None,
    end_time: str | None = None,
    resource_id: str | None = None,
    notes: str | None = None,
    session_id: str | None = None,
) -> str:
    """Create and confirm an appointment booking for a customer.

    Call this tool ONLY when you have obtained:
    1. The customer's desired service
    2. A valid start date and time
    3. The customer's full name
    4. The customer's phone number

    Args:
        tenant_id: The ID of the business/tenant.
        agent_id: The ID of the agent managing the booking.
        service_id: The ID of the service being booked.
        start_time: Appointment start time in ISO 8601 format (e.g. 2026-10-30T14:00:00Z).
        customer_name: Full name of the customer.
        customer_phone: Valid mobile phone number of the customer.
        customer_email: Optional email address.
        end_time: Optional appointment end time (required for date_range bookings).
        resource_id: Optional specific staff or resource ID requested.
        notes: Optional customer requests or notes.
        session_id: Optional active chat session ID for session verification check.

    Returns:
        JSON string containing the booking confirmation, booking reference code, and status.
    """
    logger.info(
        "[MCP Tool: book_appointment] Invoked with arguments: tenant_id=%s, agent_id=%s, service_id=%s, start_time=%s, customer_name=%s, customer_phone=%s, customer_email=%s, end_time=%s, resource_id=%s, notes=%s, session_id=%s",
        tenant_id,
        agent_id,
        service_id,
        start_time,
        customer_name,
        customer_phone,
        customer_email,
        end_time,
        resource_id,
        notes,
        session_id,
    )

    query: dict[str, Any] = {"tenant_id": tenant_id, "agent_id": agent_id}
    is_sandbox = bool(session_id and session_id.startswith("sandbox_"))

    runtime: AgentRuntimeConfig | None = None
    draft: AgentDraft | None = None
    service_doc = None
    draft_service: dict[str, Any] | None = None
    service_otp_override: bool | None = None
    deposit_required = False
    global_otp = False
    tz_str = "UTC"

    if is_sandbox:
        draft = await AgentDraft.find_one(query)
        if draft and isinstance(draft.current_draft, dict):
            raw_services = draft.current_draft.get("services")
            if isinstance(raw_services, list):
                draft_service = next(
                    (s for s in raw_services if isinstance(s, dict) and s.get("service_id") == service_id),
                    None,
                )
            raw_gr = draft.current_draft.get("guardrails")
            if isinstance(raw_gr, dict) and raw_gr.get("verification_policy"):
                global_otp = bool(raw_gr["verification_policy"].get("require_otp_for_new_booking"))

            bp = draft.current_draft.get("business_profile") or {}
            if isinstance(bp, dict) and bp.get("timezone"):
                tz_str = str(bp["timezone"])

        if not draft_service or tz_str == "UTC":
            runtime = await AgentRuntimeConfig.find_one(query)
            if runtime:
                if not draft_service and runtime.services:
                    service_doc = next((s for s in runtime.services if s.service_id == service_id), None)
                if tz_str == "UTC" and runtime.business_profile and runtime.business_profile.timezone:
                    tz_str = runtime.business_profile.timezone
                if not global_otp and runtime.guardrails and runtime.guardrails.verification_policy:
                    global_otp = bool(runtime.guardrails.verification_policy.require_otp_for_new_booking)

        if draft_service:
            v_dict = draft_service.get("verification") or {}
            if isinstance(v_dict, dict) and "require_otp" in v_dict and v_dict["require_otp"] is not None:
                service_otp_override = bool(v_dict["require_otp"])
            d_dict = draft_service.get("deposit") or {}
            deposit_required = bool(d_dict.get("required")) if isinstance(d_dict, dict) else False
        elif service_doc:
            if service_doc.verification and service_doc.verification.require_otp is not None:
                service_otp_override = service_doc.verification.require_otp
            deposit_required = bool(service_doc.deposit and service_doc.deposit.required)

    else:
        runtime = await AgentRuntimeConfig.find_one(query)
        if not runtime:
            return json.dumps({
                "status": "failed",
                "error": "The booking service is currently inactive or not yet published. Please contact support.",
            })

        if runtime.services:
            service_doc = next((s for s in runtime.services if s.service_id == service_id), None)

        if service_doc:
            if service_doc.verification and service_doc.verification.require_otp is not None:
                service_otp_override = service_doc.verification.require_otp
            deposit_required = bool(service_doc.deposit and service_doc.deposit.required)

        if runtime.guardrails and runtime.guardrails.verification_policy:
            global_otp = bool(runtime.guardrails.verification_policy.require_otp_for_new_booking)

        if runtime.business_profile and runtime.business_profile.timezone:
            tz_str = runtime.business_profile.timezone

    requires_otp = service_otp_override if service_otp_override is not None else (deposit_required or global_otp)

    if requires_otp:
        is_verified = await is_session_verified(session_id, customer_phone) if session_id else False
        if not is_verified:
            return json.dumps({
                "status": "requires_verification",
                "phone": customer_phone,
                "message": (
                    f"Phone verification is required to confirm this booking for {customer_phone}. "
                    "Inform the customer that a 6-digit verification code is being sent to their phone, "
                    "and call send_booking_otp followed by verify_booking_otp."
                ),
            })

    booking_source = "sandbox_simulation" if is_sandbox else "customer_agent"
    result = await create_booking(
        tenant_id=tenant_id,
        service_id=service_id,
        start_time=start_time,
        customer_name=customer_name,
        customer_phone=customer_phone,
        customer_email=customer_email,
        end_time=end_time,
        resource_id=resource_id,
        notes=notes,
        agent_id=agent_id,
        source=booking_source,
    )

    if not result.get("success"):
        return json.dumps(
            {
                "status": "failed",
                "error": result.get("error", "Failed to confirm booking"),
            }
        )

    bk = result.get("booking", {})
    customer_id = bk.get("customer_id")

    if session_id:
        await set_session_auth(
            session_id=session_id,
            phone=customer_phone,
            customer_id=customer_id,
            customer_name=customer_name,
        )
        await CustomerMessageRepository().update_conversation_customer(
            session_id=session_id,
            customer_id=customer_id,
            customer_name=customer_name,
            customer_phone=customer_phone,
        )

    tz_str = tz_str or "UTC"
    start_utc = bk.get("start_time")
    end_utc = bk.get("end_time")

    return json.dumps(
        {
            "status": "confirmed",
            "message": "Appointment successfully confirmed!",
            "booking_id": bk.get("booking_id"),
            "booking_reference": bk.get("booking_reference"),
            "start_time_utc": start_utc,
            "end_time_utc": end_utc,
            "start_time_local": _format_local_datetime(start_utc, tz_str),
            "end_time_local": _format_local_datetime(end_utc, tz_str),
            "timezone": tz_str,
            "deposit_status": bk.get("deposit_status"),
            "price": bk.get("price"),
        },
        indent=2,
    )


@mcp.tool()
async def cancel_appointment(
    tenant_id: str,
    agent_id: str,
    booking_id: str,
    session_id: str | None = None,
    customer_phone: str | None = None,
    reason: str | None = None,
) -> str:
    """Cancel an existing confirmed booking or appointment.

    Requires mandatory phone verification via OTP to prevent unauthorized cancellations.

    Args:
        tenant_id: The tenant identifier.
        agent_id: The specific agent ID responsible for the scheduling flow.
        booking_id: The booking ID (bk_...) or booking reference (BK-...).
        session_id: Optional active chat session ID for verification status.
        customer_phone: Customer phone number for OTP verification.
        reason: Optional reason for the cancellation.
    """
    logger.info(
        "[MCP Tool: cancel_appointment] Invoked with arguments: tenant_id=%s, agent_id=%s, booking_id=%s, session_id=%s, customer_phone=%s, reason=%s",
        tenant_id,
        agent_id,
        booking_id,
        session_id,
        customer_phone,
        reason,
    )

    is_verified = await is_session_verified(session_id, customer_phone) if session_id else False

    if not is_verified:
        if customer_phone:
            return json.dumps({
                "status": "requires_verification",
                "phone": customer_phone,
                "message": (
                    f"For security, cancellation strictly requires phone verification for {customer_phone}. "
                    "Inform the customer that a 6-digit verification code is being sent to their phone, "
                    "and call send_booking_otp followed by verify_booking_otp."
                ),
            })
        return json.dumps({
            "status": "requires_verification",
            "message": "Cancellation strictly requires phone verification. Please provide your phone number so we can text you a 6-digit verification code.",
        })

    result = await cancel_booking(
        tenant_id=tenant_id,
        agent_id=agent_id,
        booking_id=booking_id,
        reason=reason,
    )
    if not result.get("success"):
        return json.dumps(
            {
                "status": "failed",
                "error": result.get("error", "Failed to cancel booking"),
            }
        )

    bk = result.get("booking", {})
    return json.dumps(
        {
            "status": "cancelled",
            "message": "Appointment successfully cancelled.",
            "booking_id": bk.get("booking_id"),
            "booking_reference": bk.get("booking_reference"),
        },
        indent=2,
    )


@mcp.tool()
async def reschedule_appointment(
    tenant_id: str,
    agent_id: str,
    booking_id: str,
    new_start_time: str,
    new_end_time: str | None = None,
    resource_id: str | None = None,
    session_id: str | None = None,
    customer_phone: str | None = None,
    notes: str | None = None,
) -> str:
    """Reschedule an existing booking to a new date and time.

    Requires mandatory phone verification via OTP to prevent unauthorized modifications.

    Args:
        tenant_id: The tenant identifier.
        agent_id: The specific agent ID responsible for the scheduling flow.
        booking_id: The booking ID (bk_...) or booking reference (BK-...).
        new_start_time: New ISO-8601 start time (e.g. 2026-10-30T14:00:00Z).
        new_end_time: Optional new ISO-8601 end time.
        resource_id: Optional specific staff/resource ID for the new slot.
        session_id: Optional active chat session ID for verification status.
        customer_phone: Customer phone number for OTP verification.
        notes: Optional rescheduling notes.
    """
    logger.info(
        "[MCP Tool: reschedule_appointment] Invoked with arguments: tenant_id=%s, agent_id=%s, booking_id=%s, new_start_time=%s, new_end_time=%s, resource_id=%s, session_id=%s, customer_phone=%s, notes=%s",
        tenant_id,
        agent_id,
        booking_id,
        new_start_time,
        new_end_time,
        resource_id,
        session_id,
        customer_phone,
        notes,
    )

    is_verified = await is_session_verified(session_id, customer_phone) if session_id else False

    if not is_verified:
        if customer_phone:
            return json.dumps({
                "status": "requires_verification",
                "phone": customer_phone,
                "message": (
                    f"For security, rescheduling strictly requires phone verification for {customer_phone}. "
                    "Inform the customer that a 6-digit verification code is being sent to their phone, "
                    "and call send_booking_otp followed by verify_booking_otp."
                ),
            })
        return json.dumps({
            "status": "requires_verification",
            "message": "Rescheduling strictly requires phone verification. Please provide your phone number so we can text you a 6-digit verification code.",
        })
    result = await reschedule_booking(
        tenant_id=tenant_id,
        agent_id=agent_id,
        booking_id=booking_id,
        new_start_time=new_start_time,
        new_end_time=new_end_time,
        resource_id=resource_id,
        notes=notes,
    )
    if not result.get("success"):
        return json.dumps(
            {
                "status": "failed",
                "error": result.get("error", "Failed to reschedule booking"),
            }
        )

    bk = result.get("booking", {})
    query: dict[str, Any] = {"tenant_id": tenant_id, "agent_id": agent_id}
    is_sandbox = bool(session_id and session_id.startswith("sandbox_"))
    tz_str = "UTC"
    if is_sandbox:
        draft = await AgentDraft.find_one(query)
        if draft and isinstance(draft.current_draft, dict):
            bp = draft.current_draft.get("business_profile") or {}
            if isinstance(bp, dict) and bp.get("timezone"):
                tz_str = str(bp["timezone"])
        if tz_str == "UTC":
            runtime = await AgentRuntimeConfig.find_one(query)
            if runtime and runtime.business_profile and runtime.business_profile.timezone:
                tz_str = runtime.business_profile.timezone
    else:
        runtime = await AgentRuntimeConfig.find_one(query)
        if runtime and runtime.business_profile and runtime.business_profile.timezone:
            tz_str = runtime.business_profile.timezone
    start_utc = bk.get("start_time")
    end_utc = bk.get("end_time")

    return json.dumps(
        {
            "status": "rescheduled",
            "message": "Appointment successfully rescheduled!",
            "booking_id": bk.get("booking_id"),
            "booking_reference": bk.get("booking_reference"),
            "new_start_time_utc": start_utc,
            "new_end_time_utc": end_utc,
            "new_start_time_local": _format_local_datetime(start_utc, tz_str),
            "new_end_time_local": _format_local_datetime(end_utc, tz_str),
            "timezone": tz_str,
        },
        indent=2,
    )


@mcp.tool()
async def get_customer_bookings(
    session_id: str,
    phone: str,
    tenant_id: str,
    agent_id: str,
    status: str | None = None,
    limit: int = 20,
) -> str:
    """Retrieve the recent booking records and history (up to 20) for a customer.

    CRITICAL SECURITY PROTOCOL:
    Before returning private customer appointment records, the customer's phone number MUST
    be verified via OTP in the active chat session (Layer 2 Deterministic Check).
    If the session is not verified, this tool returns 'requires_verification'. You MUST
    then call send_booking_otp and verify_booking_otp with the customer before retrying.

    Args:
        session_id: Active customer chat session ID.
        phone: Customer mobile phone number (E.164 or 10-digit).
        tenant_id: The business / tenant ID.
        agent_id: The specific agent ID responsible for the scheduling flow.
        status: Optional filter by booking status (e.g. 'confirmed', 'pending', 'cancelled').
        limit: Max number of bookings to return (default 20, max 20).

    Returns:
        JSON string containing the list of recent bookings.
    """
    logger.info(
        "[MCP Tool: get_customer_bookings] Invoked with arguments: session_id=%s, phone=%s, tenant_id=%s, agent_id=%s, status=%s, limit=%s",
        session_id,
        phone,
        tenant_id,
        agent_id,
        status,
        limit,
    )
    cleaned_phone = phone.strip()
    if not cleaned_phone:
        return json.dumps({
            "status": "failed",
            "message": "Valid customer phone number is required to look up bookings.",
        })


    verified = await is_session_verified(session_id, cleaned_phone)
    if not verified:
        logger.warning(
            "[MCP Security Gatekeeper] Blocked unauthorized booking lookup for session=%s, phone=%s",
            session_id,
            cleaned_phone,
        )
        return json.dumps({
            "status": "requires_verification",
            "phone": cleaned_phone,
            "message": (
                f"Customer phone number {cleaned_phone} has not been verified for this session. "
                "For privacy and security, inform the customer that an OTP verification is required "
                "before showing their booking details. Call send_booking_otp to send a verification code."
            ),
        })

    clamped_limit = min(20, max(1, limit))

    result = await list_bookings(
        tenant_id=tenant_id,
        agent_id=agent_id,
        customer_phone=cleaned_phone,
        status=status,
        page=1,
        limit=clamped_limit,
    )

    if not result.get("success"):
        return json.dumps({
            "status": "failed",
            "error": result.get("error", "Failed to retrieve customer bookings"),
        })

    raw_bookings = result.get("bookings", [])
    last10 = cleaned_phone[-10:] if len(cleaned_phone) >= 10 else cleaned_phone
    matched = [
        bk for bk in raw_bookings
        if not bk.get("customer_phone") or last10 in bk.get("customer_phone", "")
    ]

    query: dict[str, Any] = {"tenant_id": tenant_id, "agent_id": agent_id}
    is_sandbox = bool(session_id and session_id.startswith("sandbox_"))
    tz_str = "UTC"
    if is_sandbox:
        draft = await AgentDraft.find_one(query)
        if draft and isinstance(draft.current_draft, dict):
            bp = draft.current_draft.get("business_profile") or {}
            if isinstance(bp, dict) and bp.get("timezone"):
                tz_str = str(bp["timezone"])
        if tz_str == "UTC":
            runtime = await AgentRuntimeConfig.find_one(query)
            if runtime and runtime.business_profile and runtime.business_profile.timezone:
                tz_str = runtime.business_profile.timezone
    else:
        runtime = await AgentRuntimeConfig.find_one(query)
        if runtime and runtime.business_profile and runtime.business_profile.timezone:
            tz_str = runtime.business_profile.timezone

    enriched_bookings = []
    for bk in matched:
        b_dict = dict(bk)
        s_utc = bk.get("start_time")
        e_utc = bk.get("end_time")
        b_dict["start_time_utc"] = s_utc
        b_dict["end_time_utc"] = e_utc
        b_dict["start_time_local"] = _format_local_datetime(s_utc, tz_str)
        b_dict["end_time_local"] = _format_local_datetime(e_utc, tz_str)
        b_dict["timezone"] = tz_str
        enriched_bookings.append(b_dict)

    return json.dumps(
        {
            "status": "success",
            "phone": cleaned_phone,
            "timezone": tz_str,
            "total": len(enriched_bookings),
            "bookings": enriched_bookings,
            "message": (
                f"Found {len(enriched_bookings)} booking(s) for {cleaned_phone}."
                if enriched_bookings
                else f"No bookings found for phone number {cleaned_phone}."
            ),
        },
        indent=2,
    )


async def _load_tenant_resources(
    tenant_id: str,
    agent_id: str,
    is_sandbox: bool = False,
) -> list[dict[str, Any]]:
    """Load resources directly from the local CQRS Read Model (AgentDraft in sandbox, AgentRuntimeConfig in live)."""
    query: dict[str, Any] = {"tenant_id": tenant_id, "agent_id": agent_id}
    resources: list[dict[str, Any]] = []

    if is_sandbox:
        draft = await AgentDraft.find_one(query)
        if draft and draft.current_draft:
            raw_resources = draft.current_draft.get("resources") or []
            if isinstance(raw_resources, list):
                for r in raw_resources:
                    if not isinstance(r, dict):
                        continue
                    resources.append(
                        {
                            "resource_id": r.get("resource_id", ""),
                            "name": r.get("name", "Unnamed"),
                            "title": r.get("title", ""),
                            "category": r.get("category", "General"),
                            "description": r.get("description", ""),
                            "resource_type": str(r.get("resource_type", "staff")),
                            "is_bookable": bool(r.get("is_bookable", True)),
                            "dispatch_status": str(r.get("dispatch_status", "active")),
                        }
                    )
        if not resources:
            runtime = await AgentRuntimeConfig.find_one(query)
            if runtime and runtime.resources:
                for r in runtime.resources:
                    r_type = (
                        r.resource_type.value
                        if hasattr(r.resource_type, "value")
                        else str(r.resource_type or "staff")
                    )
                    d_status = (
                        r.dispatch_status.value
                        if hasattr(r.dispatch_status, "value")
                        else str(r.dispatch_status or "active")
                    )
                    resources.append(
                        {
                            "resource_id": r.resource_id,
                            "name": r.name,
                            "title": r.title or "",
                            "category": r.category or "General",
                            "description": r.description or "",
                            "resource_type": r_type,
                            "is_bookable": r.is_bookable,
                            "dispatch_status": d_status,
                        }
                    )
    else:
        runtime = await AgentRuntimeConfig.find_one(query)
        if runtime and runtime.resources:
            for r in runtime.resources:
                r_type = (
                    r.resource_type.value
                    if hasattr(r.resource_type, "value")
                    else str(r.resource_type or "staff")
                )
                d_status = (
                    r.dispatch_status.value
                    if hasattr(r.dispatch_status, "value")
                    else str(r.dispatch_status or "active")
                )
                resources.append(
                    {
                        "resource_id": r.resource_id,
                        "name": r.name,
                        "title": r.title or "",
                        "category": r.category or "General",
                        "description": r.description or "",
                        "resource_type": r_type,
                        "is_bookable": r.is_bookable,
                        "dispatch_status": d_status,
                    }
                )

    return resources


@mcp.tool()
async def search_resources(
    tenant_id: str,
    agent_id: str,
    query: str | None = None,
    resource_id: str | None = None,
    resource_type: str | None = None,
    session_id: str | None = None,
) -> str:
    """Search and get detailed information about staff, providers, rooms, or equipment.

    Use this tool when the customer asks:
    - Detailed questions about a specific doctor, stylist, or provider (e.g. bio, background, qualifications, specialties).
    - Which staff members or resources exist for a particular specialty, category, or title.
    - Information about rooms, chairs, or equipment.

    Args:
        tenant_id: The ID of the business/tenant.
        agent_id: The ID of the agent managing the resources.
        query: Optional search keyword to filter by name, title, category, or description.
        resource_id: Optional exact resource ID to retrieve a single resource's full details.
        resource_type: Optional filter by resource type ('staff', 'room', 'chair', 'bay', 'equipment', 'asset', 'vehicle').
        session_id: Optional active chat session ID to resolve draft vs live mode.

    Returns:
        JSON string containing matching resources with their name, title, category, description, and status.
    """
    logger.info(
        "[MCP Tool: search_resources] Invoked with arguments: tenant_id=%s, agent_id=%s, query=%s, resource_id=%s, resource_type=%s, session_id=%s",
        tenant_id,
        agent_id,
        query,
        resource_id,
        resource_type,
        session_id,
    )

    is_sandbox = bool(session_id and session_id.startswith("sandbox_"))
    all_resources = await _load_tenant_resources(
        tenant_id=tenant_id, agent_id=agent_id, is_sandbox=is_sandbox
    )

    if resource_id:
        match = next((r for r in all_resources if r["resource_id"] == resource_id), None)
        if not match:
            return json.dumps(
                {
                    "status": "not_found",
                    "message": f"Resource {resource_id} not found in tenant catalog",
                }
            )
        return json.dumps(
            {
                "status": "success",
                "resource": match,
            },
            indent=2,
        )

    filtered = [r for r in all_resources if r.get("is_bookable", True)]

    if resource_type:
        rt = resource_type.lower().strip()
        filtered = [r for r in filtered if r.get("resource_type", "").lower() == rt]

    if query:
        q = query.lower().strip()
        filtered = [
            r
            for r in filtered
            if q in r.get("name", "").lower()
            or q in r.get("title", "").lower()
            or q in r.get("category", "").lower()
            or q in r.get("description", "").lower()
        ]

    return json.dumps(
        {
            "status": "success",
            "total_matches": len(filtered),
            "resources": filtered[:20],
        },
        indent=2,
    )


async def _load_tenant_services(
    tenant_id: str,
    agent_id: str,
    is_sandbox: bool = False,
) -> list[dict[str, Any]]:
    """Load full service catalog directly from local CQRS Read Model (AgentDraft in sandbox, AgentRuntimeConfig in live)."""
    query: dict[str, Any] = {"tenant_id": tenant_id}
    if agent_id:
        query["agent_id"] = agent_id

    services: list[dict[str, Any]] = []
    resource_map: dict[str, dict[str, Any]] = {}

    if is_sandbox:
        try:
            draft = await AgentDraft.find_one(query)
        except Exception as e:
            logger.warning("[MCP _load_tenant_services] AgentDraft lookup failed: %s", e)
            draft = None

        if draft and draft.current_draft:
            raw_resources = draft.current_draft.get("resources") or []
            if isinstance(raw_resources, list):
                for r in raw_resources:
                    if isinstance(r, dict):
                        resource_map[r.get("resource_id", "")] = {
                            "resource_id": r.get("resource_id", ""),
                            "name": r.get("name", "Unnamed"),
                            "title": r.get("title", ""),
                            "category": r.get("category", "General"),
                            "description": r.get("description", ""),
                        }

            raw_services = draft.current_draft.get("services") or []
            if isinstance(raw_services, list):
                for s in raw_services:
                    if not isinstance(s, dict) or s.get("is_deleted", False):
                        continue
                    price_val = s.get("price")
                    if isinstance(price_val, dict):
                        price_str = f"{price_val.get('amount', 0)} {price_val.get('currency', 'USD')}"
                    elif price_val is not None:
                        price_str = str(price_val)
                    else:
                        price_str = "Free"

                    raw_reqs = s.get("resource_requirements") or []
                    selectable_staff = []
                    auto_assigned = []
                    if isinstance(raw_reqs, list):
                        for req in raw_reqs:
                            if not isinstance(req, dict):
                                continue
                            draft_req_mode = str(req.get("selection_mode") or "")
                            req_r_type = str(req.get("resource_type") or "staff").lower()
                            eligible_ids = req.get("eligible_resource_ids") or []
                            resolved = [resource_map[rid] for rid in eligible_ids if rid in resource_map]
                            if draft_req_mode == "user_selectable" or (not draft_req_mode and req_r_type == "staff"):
                                for res in resolved:
                                    selectable_staff.append({
                                        "resource_id": res["resource_id"],
                                        "name": res["name"],
                                        "title": res["title"],
                                        "category": res["category"],
                                        "role": req.get("role", "Provider"),
                                    })
                            else:
                                auto_assigned.append({
                                    "role": req.get("role", "Resource"),
                                    "resource_type": req.get("resource_type", ""),
                                    "count": req.get("count", 1),
                                })

                    services.append({
                        "service_id": s.get("service_id", ""),
                        "name": s.get("name", "Unnamed"),
                        "category": s.get("category", "General"),
                        "description": s.get("description", ""),
                        "duration_minutes": s.get("duration_minutes", 30),
                        "price": price_str,
                        "booking_mode": s.get("booking_mode", "time_slot"),
                        "selectable_staff": selectable_staff,
                        "auto_assigned_resources": auto_assigned,
                    })

        if not services:
            try:
                runtime = await AgentRuntimeConfig.find_one(query)
            except Exception as e:
                logger.warning("[MCP _load_tenant_services] AgentRuntimeConfig lookup failed: %s", e)
                runtime = None

            if runtime and runtime.resources:
                for r in runtime.resources:
                    resource_map[r.resource_id] = {
                        "resource_id": r.resource_id,
                        "name": r.name,
                        "title": r.title or "",
                        "category": r.category or "General",
                        "description": r.description or "",
                    }

            if runtime and runtime.services:
                for s in runtime.services:
                    if getattr(s, "is_deleted", False):
                        continue
                    selectable_staff = []
                    auto_assigned = []

                    for req in s.resource_requirements:
                        req_mode = str(getattr(req.selection_mode, "value", req.selection_mode) or "")
                        r_type = str(getattr(req.resource_type, "value", req.resource_type) or "staff")

                        resolved = [resource_map[rid] for rid in req.eligible_resource_ids if rid in resource_map]
                        if req_mode == "user_selectable" or (not req_mode and r_type.lower() == "staff"):
                            for res in resolved:
                                selectable_staff.append({
                                    "resource_id": res["resource_id"],
                                    "name": res["name"],
                                    "title": res["title"],
                                    "category": res["category"],
                                    "role": req.role or "Provider",
                                })
                        else:
                            auto_assigned.append({
                                "role": req.role or "Resource",
                                "resource_type": r_type,
                                "count": req.count,
                            })

                    price_str = (
                        f"{s.price.amount} {s.price.currency}"
                        if s.price and getattr(s.price, "amount", None) is not None
                        else "Free"
                    )

                    services.append({
                        "service_id": s.service_id,
                        "name": s.name,
                        "category": s.category or "General",
                        "description": s.description or "",
                        "duration_minutes": s.duration_minutes,
                        "price": price_str,
                        "booking_mode": s.booking_mode,
                        "selectable_staff": selectable_staff,
                        "auto_assigned_resources": auto_assigned,
                    })
    else:
        # Live mode: AgentRuntimeConfig exclusively
        try:
            runtime = await AgentRuntimeConfig.find_one(query)
        except Exception as e:
            logger.warning("[MCP _load_tenant_services] AgentRuntimeConfig lookup failed: %s", e)
            runtime = None

        if runtime and runtime.resources:
            for r in runtime.resources:
                resource_map[r.resource_id] = {
                    "resource_id": r.resource_id,
                    "name": r.name,
                    "title": r.title or "",
                    "category": r.category or "General",
                    "description": r.description or "",
                }

        if runtime and runtime.services:
            for s in runtime.services:
                if getattr(s, "is_deleted", False):
                    continue
                selectable_staff = []
                auto_assigned = []

                for req in s.resource_requirements:
                    req_mode = str(getattr(req.selection_mode, "value", req.selection_mode) or "")
                    r_type = str(getattr(req.resource_type, "value", req.resource_type) or "staff")

                    resolved = [resource_map[rid] for rid in req.eligible_resource_ids if rid in resource_map]
                    if req_mode == "user_selectable" or (not req_mode and r_type.lower() == "staff"):
                        for res in resolved:
                            selectable_staff.append({
                                "resource_id": res["resource_id"],
                                "name": res["name"],
                                "title": res["title"],
                                "category": res["category"],
                                "role": req.role or "Provider",
                            })
                    else:
                        auto_assigned.append({
                            "role": req.role or "Resource",
                            "resource_type": r_type,
                            "count": req.count,
                        })

                price_str = (
                    f"{s.price.amount} {s.price.currency}"
                    if s.price and getattr(s.price, "amount", None) is not None
                    else "Free"
                )

                services.append({
                    "service_id": s.service_id,
                    "name": s.name,
                    "category": s.category or "General",
                    "description": s.description or "",
                    "duration_minutes": s.duration_minutes,
                    "price": price_str,
                    "booking_mode": s.booking_mode,
                    "selectable_staff": selectable_staff,
                    "auto_assigned_resources": auto_assigned,
                })

    return services


@mcp.tool()
async def search_services(
    tenant_id: str,
    agent_id: str,
    query: str | None = None,
    category: str | None = None,
    service_id: str | None = None,
    session_id: str | None = None,
) -> str:
    """Search and get detailed information about services, treatments, prices, and requirements.

    Use this tool when:
    - Customer asks about a service, treatment, procedure, or package not listed in the initial view.
    - Customer asks for services under a specific category (e.g. 'Dental Cleaning', 'Facials', 'Repairs').
    - Customer needs full details, duration, pricing, or provider options for a specific service ID.

    Args:
        tenant_id: The ID of the business/tenant.
        agent_id: The ID of the agent managing the services.
        query: Optional search keyword to filter by service name or description.
        category: Optional category filter (e.g. 'Dental', 'Cosmetic', 'General').
        service_id: Optional exact service ID to retrieve full details.
        session_id: Optional active chat session ID to resolve draft vs live mode.

    Returns:
        JSON string containing matching services with their service_id, name, category, price, duration, and staff requirements.
    """
    logger.info(
        "[MCP Tool: search_services] Invoked with arguments: tenant_id=%s, agent_id=%s, query=%s, category=%s, service_id=%s, session_id=%s",
        tenant_id,
        agent_id,
        query,
        category,
        service_id,
        session_id,
    )

    is_sandbox = bool(session_id and session_id.startswith("sandbox_"))
    all_services = await _load_tenant_services(
        tenant_id=tenant_id, agent_id=agent_id, is_sandbox=is_sandbox
    )

    if service_id:
        match = next((s for s in all_services if s["service_id"] == service_id.strip()), None)
        if not match:
            return json.dumps(
                {
                    "status": "not_found",
                    "message": f"Service '{service_id}' not found in catalog",
                }
            )
        return json.dumps(
            {
                "status": "success",
                "service": match,
            },
            indent=2,
        )

    filtered = all_services

    if category:
        cat_lower = category.lower().strip()
        filtered = [s for s in filtered if cat_lower in s.get("category", "").lower()]

    if query:
        q = query.lower().strip()
        filtered = [
            s
            for s in filtered
            if q in s.get("name", "").lower()
            or q in s.get("description", "").lower()
            or q in s.get("category", "").lower()
        ]

    return json.dumps(
        {
            "status": "success",
            "total_matches": len(filtered),
            "services": filtered[:15],
        },
        indent=2,
    )


@mcp.tool()
async def search_knowledge_base(
    tenant_id: str,
    agent_id: str,
    query: str,
) -> str:
    """Search tenant's uploaded knowledge base documents, policies, services, and FAQs using hybrid search (BM25 + Dense vector search + Voyage AI reranking).

    Args:
        tenant_id: The ID of the business/tenant.
        agent_id: The ID of the agent managing the business.
        query: The customer's inquiry or question to search the knowledge base for.

    Returns:
        JSON string containing the most relevant excerpts and answers from official documents.
    """
    logger.info(
        "[MCP Tool: search_knowledge_base] Invoked with arguments: tenant_id=%s, agent_id=%s, query=%s",
        tenant_id,
        agent_id,
        query,
    )
    try:
        from agent_orchestrator.adapters.bm25_embedder import BM25SparseEmbedder
        from agent_orchestrator.adapters.qdrant_stores import QdrantKnowledgeStore
        from agent_orchestrator.adapters.voyage_embedder import VoyageDenseEmbedder
        from agent_orchestrator.services.knowledge_retrieval_service import (
            KnowledgeRetrievalService,
        )

        service = KnowledgeRetrievalService(
            dense_embedder=VoyageDenseEmbedder(),
            sparse_embedder=BM25SparseEmbedder(),
            knowledge_store=QdrantKnowledgeStore(),
        )
        results = await service.retrieve_relevant_context(
            query=query,
            tenant_id=tenant_id,
            agent_id=agent_id,
            top_k=4,
        )
        if not results:
            return json.dumps(
                {
                    "status": "not_found",
                    "message": "No relevant documents found in knowledge base.",
                    "results": [],
                }
            )
        return json.dumps(
            {
                "status": "success",
                "matches_count": len(results),
                "results": [
                    {
                        "content": r["content"],
                        "file_name": r.get("file_name", ""),
                        "relevance_score": r.get("relevance_score", 1.0),
                        "headers": r.get("headers", {}),
                        "is_table": r.get("is_table", False),
                    }
                    for r in results
                ],
            },
            indent=2,
        )
    except Exception as e:
        logger.error("[MCP search_knowledge_base Error] %s", e)
        return json.dumps(
            {
                "status": "error",
                "message": f"Failed to search knowledge base: {str(e)}",
            }
        )


def get_scheduling_mcp_tools() -> list[BaseTool]:
    """Convert FastMCP server tools into standard LangChain StructuredTools safely."""
    tools: list[BaseTool] = []

    mcp_tools = mcp._tool_manager.list_tools() if hasattr(mcp, "_tool_manager") else []
    for mcp_tool in mcp_tools:

        def _make_caller(tool_name: str):
            async def _execute_mcp_tool(**kwargs: Any) -> str:
                logger.info("[MCP Tool Call] Executing '%s' with arguments: %s", tool_name, json.dumps(kwargs, default=str))
                res = await mcp.call_tool(tool_name, arguments=kwargs)
                contents = res[0] if isinstance(res, tuple) else res
                if isinstance(contents, list):
                    return "".join([c.text for c in contents if hasattr(c, "text")])
                return str(res)

            return _execute_mcp_tool

        tools.append(
            StructuredTool(
                name=mcp_tool.name,
                description=mcp_tool.description or "",
                coroutine=_make_caller(mcp_tool.name),
                args_schema=mcp_tool.fn_metadata.arg_model,
            )
        )

    return tools


if __name__ == "__main__":
    mcp.run(transport="stdio")
