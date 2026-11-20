import json
import logging
import secrets
from datetime import datetime
from typing import Any
from zoneinfo import ZoneInfo

from langchain_core.tools import BaseTool, StructuredTool
from mcp.server.fastmcp import FastMCP

from agent_orchestrator.clients.redis_client import (
    acquire_slot_holds,
    get_active_hold_for_session,
    is_session_verified,
    release_session_hold,
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
from agent_orchestrator.queues.sms_queue import get_sms_queue
from agent_orchestrator.repositories.customer_message_repository import CustomerMessageRepository

logger = logging.getLogger(__name__)


async def _resolve_business_context(
    tenant_id: str,
    agent_id: str,
    is_sandbox: bool = False,
) -> dict[str, Any]:
    from agent_orchestrator.workflows.customer_agent.context import resolve_business_context

    return await resolve_business_context(tenant_id, agent_id, is_sandbox=is_sandbox)


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


def _format_local_time(iso_str: str | None, tz_name: str | None) -> str:
    """Format slot start time to concise local time string (e.g. '09:00 AM IST')."""
    if not iso_str:
        return ""
    try:
        clean_iso = iso_str.replace("Z", "+00:00")
        dt = datetime.fromisoformat(clean_iso)
        target_tz = _resolve_zoneinfo(tz_name)
        local_dt = dt.astimezone(target_tz)
        return local_dt.strftime("%I:%M %p %Z").strip()
    except Exception:
        return iso_str


def _sanitize_start_time(start_time: str, tz_name: str | None) -> str:
    """Ensure incoming start_time has a timezone offset.

    If an incoming timestamp has no timezone offset (naive string, e.g. '2026-11-16T09:00:00'),
    automatically attach the business's timezone offset so it is never treated as Greenwich UTC.
    """
    if not start_time:
        return start_time
    cleaned = start_time.strip()
    target_tz = _resolve_zoneinfo(tz_name)
    try:
        if cleaned.endswith("Z") or cleaned.endswith("z"):
            return cleaned
        dt = datetime.fromisoformat(cleaned)
        if dt.tzinfo is None:
            localized = dt.replace(tzinfo=target_tz)
            return localized.isoformat()
        return cleaned
    except Exception:
        return cleaned


mcp = FastMCP("schedulux-scheduling-service")


@mcp.tool()
async def check_availability(
    tenant_id: str,
    agent_id: str,
    service_id: str,
    start_date: str,
    end_date: str | None = None,
    resource_id: str | None = None,
    resource_ids: list[str] | None = None,
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
        resource_ids: Optional list of specific resource IDs if multiple resources are requested.
        timezone: Optional customer timezone string (e.g. 'UTC', 'America/New_York').

    Returns:
        JSON string containing available dates, operating hours, and open time slots.
    """
    logger.info(
        "[MCP Tool: check_availability] Invoked with arguments: tenant_id=%s, agent_id=%s, service_id=%s, start_date=%s, end_date=%s, resource_id=%s, resource_ids=%s, timezone=%s",
        tenant_id,
        agent_id,
        service_id,
        start_date,
        end_date,
        resource_id,
        resource_ids,
        timezone,
    )
    biz_ctx = await _resolve_business_context(tenant_id, agent_id)
    if not biz_ctx or not biz_ctx.get("business_name"):
        return json.dumps(
            {
                "status": "failed",
                "error": "This agent is currently in draft mode and has not been published yet. Please click 'Publish Agent' in Admin Studio to check availability.",
            }
        )

    target_resource_ids: list[str] = []
    if resource_ids:
        target_resource_ids.extend([r.strip() for r in resource_ids if r and r.strip()])
    if resource_id and resource_id.strip() and resource_id.strip() not in target_resource_ids:
        target_resource_ids.append(resource_id.strip())

    result = await get_availability(
        tenant_id=tenant_id,
        agent_id=agent_id,
        service_id=service_id,
        start_date=start_date,
        end_date=end_date,
        resource_id=resource_id or (target_resource_ids[0] if target_resource_ids else None),
        resource_ids=target_resource_ids or None,
        timezone=timezone,
    )

    if not result.get("success"):
        return json.dumps(
            {
                "status": "error",
                "message": result.get("error", "Failed to retrieve availability slots"),
            }
        )

    tz_str = result.get("timezone") or biz_ctx.get("timezone") or "UTC"

    available_days = []
    for day in result.get("days", []):
        open_slots = [
            {
                "start": s["start_time"],
                "end": s["end_time"],
                "display": _format_local_time(s["start_time"], tz_str),
            }
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

    return json.dumps(
        {
            "status": "success",
            "service_id": result.get("service_id"),
            "booking_mode": result.get("booking_mode", "time_slot"),
            "timezone": tz_str,
            "days": available_days,
        },
        indent=2,
    )


async def _check_session_verified(session_id: str | None, phone: str | None) -> bool:
    """Check if a session is verified for the given phone number via Redis (authoritative session store)."""
    if not session_id or not phone:
        return False
    cleaned_phone = phone.strip()
    if not cleaned_phone:
        return False
    return await is_session_verified(session_id, cleaned_phone)


@mcp.tool()
async def hold_slot(
    tenant_id: str,
    agent_id: str,
    service_id: str,
    start_time: str,
    session_id: str | None = None,
    resource_id: str | None = None,
    resource_ids: list[str] | None = None,
) -> str:
    """Provisionally lock/hold an appointment time slot for a customer for 5-10 minutes.

    Call this tool when a customer selects a specific time slot or expresses intent to book it,
    BEFORE or DURING collecting their contact details or OTP verification.
    This guarantees no other customer can book or hold the same slot while the customer completes checkout.

    Args:
        tenant_id: The ID of the business/tenant.
        agent_id: The ID of the agent managing the service catalog and schedule.
        service_id: The ID of the service to hold.
        start_time: The exact appointment start time ISO string returned by check_availability (e.g. '2026-11-16T09:00:00+05:30' or '2026-11-16T03:30:00Z'). NEVER append 'Z' to local business hours!
        session_id: The active chat session ID to associate with the provisional hold.
        resource_id: Optional specific staff or resource ID requested by customer.
        resource_ids: Optional list of specific resource IDs to hold.

    Returns:
        JSON string containing hold status, hold_token, expiration, and confirmation details.
    """
    logger.info(
        "[MCP Tool: hold_slot] Invoked: tenant_id=%s, agent_id=%s, service_id=%s, start_time=%s, session_id=%s, resource_id=%s, resource_ids=%s",
        tenant_id,
        agent_id,
        service_id,
        start_time,
        session_id,
        resource_id,
        resource_ids,
    )
    biz_ctx = await _resolve_business_context(tenant_id, agent_id)
    if not biz_ctx or not biz_ctx.get("business_name"):
        return json.dumps(
            {
                "status": "failed",
                "error": "This agent is currently in draft mode and has not been published yet.",
            }
        )

    tz_str = (biz_ctx.get("timezone") if biz_ctx else None) or "UTC"
    start_time = _sanitize_start_time(start_time, tz_str)

    services_list = biz_ctx.get("services") or []
    service_doc = next(
        (
            s
            for s in services_list
            if (s.get("service_id") == service_id or s.get("id") == service_id)
        ),
        None,
    )
    if not service_doc:
        return json.dumps(
            {
                "status": "failed",
                "error": f"Service with ID '{service_id}' not found in active catalog.",
            }
        )

    sched_engine = biz_ctx.get("scheduling_engine") or {}
    hold_duration_mins = 10
    if sched_engine.get("hold_duration_minutes"):
        hold_duration_mins = max(1, min(10, int(sched_engine["hold_duration_minutes"])))
    ttl_seconds = hold_duration_mins * 60

    target_resources: list[str] = []
    if resource_ids and len(resource_ids) > 0:
        target_resources = [r.strip() for r in resource_ids if r and r.strip()]
    elif resource_id and resource_id.strip():
        target_resources = [resource_id.strip()]

    all_resources = biz_ctx.get("resources") or []
    if not target_resources:
        reqs = service_doc.get("resource_requirements") or []
        for req in reqs:
            eligible_ids = req.get("eligible_resource_ids") or []
            if eligible_ids:
                matching = [
                    (r.get("resource_id") or r.get("id"))
                    for r in all_resources
                    if (r.get("resource_id") in eligible_ids or r.get("id") in eligible_ids)
                    and r.get("is_bookable", True)
                ]
                if matching and matching[0]:
                    target_resources.append(matching[0])
            else:
                req_type = str(req.get("resource_type") or "staff").lower()
                matching = [
                    (r.get("resource_id") or r.get("id"))
                    for r in all_resources
                    if str(r.get("resource_type") or r.get("type") or "staff").lower() == req_type
                    and r.get("is_bookable", True)
                ]
                if matching and matching[0]:
                    target_resources.append(matching[0])

    if not target_resources:
        all_bookable = [
            (r.get("resource_id") or r.get("id"))
            for r in all_resources
            if r.get("is_bookable", True)
        ]
        if all_bookable and all_bookable[0]:
            target_resources = [all_bookable[0]]

    if not target_resources:
        return json.dumps(
            {
                "status": "failed",
                "error": "No bookable resources configured for this service to hold.",
            }
        )

    success, hold_token, err_msg = await acquire_slot_holds(
        tenant_id=tenant_id,
        agent_id=agent_id,
        resource_ids=target_resources,
        start_time=start_time,
        session_id=session_id,
        ttl_seconds=ttl_seconds,
    )

    if not success:
        return json.dumps(
            {
                "status": "slot_unavailable",
                "message": err_msg
                or "This time slot is temporarily held by another customer. Please choose another time.",
            }
        )

    return json.dumps(
        {
            "status": "held",
            "hold_token": hold_token,
            "service_id": service_id,
            "start_time": start_time,
            "start_time_local": _format_local_datetime(start_time, tz_str),
            "resource_ids": target_resources,
            "hold_duration_minutes": hold_duration_mins,
            "expires_in_seconds": ttl_seconds,
            "message": f"Time slot successfully held for {hold_duration_mins} minutes while you complete your details.",
        },
        indent=2,
    )


@mcp.tool()
async def send_booking_otp(
    tenant_id: str,
    agent_id: str,
    phone: str,
    session_id: str | None = None,
) -> str:
    """Send a 6-digit verification code to a customer's phone number via SMS.

    If session_id is provided and the session is ALREADY verified for this customer,
    sending OTP is automatically skipped, and status 'already_verified' is returned.

    Args:
        tenant_id: The ID of the business/tenant.
        agent_id: The ID of the agent managing the business.
        phone: Customer mobile phone number.
        session_id: Optional active chat session ID (e.g. sandbox_... or web session).
    """
    logger.info(
        "[MCP Tool: send_booking_otp] Invoked with arguments: tenant_id=%s, agent_id=%s, phone=%s, session_id=%s",
        tenant_id,
        agent_id,
        phone,
        session_id,
    )
    cleaned_phone = phone.strip()
    if not cleaned_phone:
        return json.dumps({"status": "failed", "message": "Valid phone number is required."})

    if session_id and await _check_session_verified(session_id, cleaned_phone):
        logger.info(
            "[MCP Tool send_booking_otp] Session %s is ALREADY VERIFIED for phone %s. Skipping OTP dispatch.",
            session_id,
            cleaned_phone,
        )
        return json.dumps(
            {
                "status": "already_verified",
                "phone": cleaned_phone,
                "session_id": session_id,
                "message": (
                    f"Customer phone {cleaned_phone} in session {session_id} is ALREADY VERIFIED. "
                    "Do NOT ask the customer for a code or send another OTP! "
                    "Immediately call book_appointment (or reschedule/cancel) directly."
                ),
            }
        )

    code = f"{secrets.randbelow(900000) + 100000}"
    await store_otp(cleaned_phone, code, ttl=300)

    await get_sms_queue().enqueue_otp_sms(
        phone=cleaned_phone,
        code=code,
        tenant_id=tenant_id,
        agent_id=agent_id,
    )

    logger.info(
        "[MCP Tool send_booking_otp] Enqueued OTP for %s for agent %s", cleaned_phone, agent_id
    )
    return json.dumps(
        {
            "status": "sent",
            "phone": cleaned_phone,
            "message": f"Verification code sent to {cleaned_phone}. Please ask customer to provide the 6-digit code.",
        }
    )


async def _verify_and_authenticate_session(
    phone: str,
    otp_code: str,
    session_id: str | None,
    tenant_id: str,
    agent_id: str,
    action_name: str = "tool",
) -> tuple[bool, str | None]:
    """Validate OTP code, authenticate active Redis session, and sync verified state to DB.

    Returns:
        (True, None) if verification succeeded.
        (False, error_message) if verification failed or was rejected.
    """
    cleaned_phone = phone.strip()
    cleaned_code = otp_code.strip()

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

        logger.warning(
            "[MCP Tool: %s] Atomic OTP verification failed for %s: %s",
            action_name,
            cleaned_phone,
            reason,
        )
        return False, message

    if session_id:
        await set_session_auth(session_id=session_id, phone=cleaned_phone, ttl=86400)
        repo = CustomerMessageRepository()
        await repo.mark_conversation_verified(session_id=session_id, customer_phone=cleaned_phone)
        try:
            await verify_customer(
                tenant_id=tenant_id or "",
                customer_phone=cleaned_phone,
                agent_id=agent_id,
            )
            logger.info(
                "[MCP Tool: %s] Synced is_guest: false via gRPC for %s (atomic OTP verification)",
                action_name,
                cleaned_phone,
            )
        except Exception as e:
            logger.warning(
                "[MCP Tool: %s] Could not sync customer verification via gRPC: %s",
                action_name,
                e,
            )

    return True, None


@mcp.tool()
async def verify_booking_otp(
    session_id: str,
    phone: str,
    code: str,
    tenant_id: str,
    agent_id: str,
) -> str:
    """Verify customer's 6-digit OTP code to authenticate their chat session for standalone login.

    NOTE: Call this tool ONLY for pure standalone verification or login (e.g. "Please verify my phone number first")
    when the customer has NOT requested a specific booking, cancellation, rescheduling, or booking history check.
    For all pending actions, pass `otp_code` directly to `book_appointment`, `cancel_appointment`, `reschedule_appointment`,
    or `get_customer_bookings` for atomic 1-step verification and execution.

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

    success, err_msg = await _verify_and_authenticate_session(
        phone=cleaned_phone,
        otp_code=cleaned_code,
        session_id=session_id,
        tenant_id=tenant_id,
        agent_id=agent_id,
        action_name="verify_booking_otp",
    )
    if not success:
        return json.dumps(
            {
                "status": "failed",
                "message": err_msg,
            }
        )

    logger.info(
        "[MCP Tool verify_booking_otp] Session %s verified for phone %s", session_id, cleaned_phone
    )
    return json.dumps(
        {
            "status": "verified",
            "phone": cleaned_phone,
            "message": f"Phone number {cleaned_phone} successfully verified! Session is now authenticated.",
        }
    )


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
    resource_ids: list[str] | None = None,
    notes: str | None = None,
    session_id: str | None = None,
    otp_code: str | None = None,
) -> str:
    """Create and confirm an appointment booking for a customer.

    Call this tool when you have obtained:
    1. The customer's desired service
    2. A valid start date and time
    3. The customer's full name
    4. The customer's phone number

    If phone verification was requested (or OTP was sent) and the customer provides their 6-digit verification code,
    pass the code directly in `otp_code`. This tool will verify the OTP and confirm the booking in a single atomic step!

    Args:
        tenant_id: The ID of the business/tenant.
        agent_id: The ID of the agent managing the booking.
        service_id: The ID of the service being booked.
        start_time: The exact appointment start time ISO string returned by check_availability (e.g. '2026-11-16T09:00:00+05:30' or '2026-11-16T03:30:00Z'). NEVER append 'Z' to local business hours!
        customer_name: Full name of the customer.
        customer_phone: Valid mobile phone number of the customer.
        customer_email: Optional email address.
        end_time: Optional appointment end time (required for date_range bookings).
        resource_id: Optional specific staff or resource ID requested.
        resource_ids: Optional list of resource IDs if multiple resources/assets are selected (e.g. room + VIP card).
        notes: Optional customer requests or notes.
        session_id: Optional active chat session ID for session verification check.
        otp_code: Optional 6-digit verification code provided by the customer to verify phone and confirm booking atomically in one step.

    Returns:
        JSON string containing the booking confirmation, booking reference code, and status.
    """
    logger.info(
        "[MCP Tool: book_appointment] Invoked with arguments: tenant_id=%s, agent_id=%s, service_id=%s, start_time=%s, customer_name=%s, customer_phone=%s, customer_email=%s, end_time=%s, resource_id=%s, resource_ids=%s, notes=%s, session_id=%s, has_otp=%s",
        tenant_id,
        agent_id,
        service_id,
        start_time,
        customer_name,
        customer_phone,
        customer_email,
        end_time,
        resource_id,
        resource_ids,
        notes,
        session_id,
        bool(otp_code),
    )

    cleaned_phone = customer_phone.strip()

    if otp_code and otp_code.strip():
        success, err_msg = await _verify_and_authenticate_session(
            phone=cleaned_phone,
            otp_code=otp_code,
            session_id=session_id,
            tenant_id=tenant_id,
            agent_id=agent_id,
            action_name="book_appointment",
        )
        if not success:
            return json.dumps(
                {
                    "status": "failed",
                    "error": err_msg,
                    "message": err_msg,
                }
            )

    is_sandbox = bool(session_id and session_id.startswith("sandbox_"))
    biz_ctx = await _resolve_business_context(tenant_id, agent_id, is_sandbox=is_sandbox)
    if not biz_ctx or not biz_ctx.get("business_name"):
        return json.dumps(
            {
                "status": "failed",
                "error": "This agent is currently in draft mode and has not been published yet. Please click 'Publish Agent' in Admin Studio to enable live appointment bookings.",
            }
        )

    service_doc = None
    service_otp_override: bool | None = None
    global_otp = False
    tz_str = (biz_ctx.get("timezone") if biz_ctx else None) or "UTC"

    services_list = biz_ctx.get("services") or []
    service_doc = next(
        (
            s
            for s in services_list
            if (s.get("service_id") == service_id or s.get("id") == service_id)
        ),
        None,
    )
    if service_doc:
        ver = service_doc.get("verification")
        if isinstance(ver, dict) and ver.get("require_otp") is not None:
            service_otp_override = bool(ver["require_otp"])
    guardrails = biz_ctx.get("guardrails") or {}
    ver_policy = guardrails.get("verification_policy") or {}
    if ver_policy and ver_policy.get("require_otp_for_new_booking") is not None:
        global_otp = bool(ver_policy["require_otp_for_new_booking"])

    start_time = _sanitize_start_time(start_time, tz_str)
    if end_time:
        end_time = _sanitize_start_time(end_time, tz_str)

    requires_otp = service_otp_override if service_otp_override is not None else global_otp

    if requires_otp:
        is_verified = await _check_session_verified(session_id, customer_phone)
        if not is_verified:
            return json.dumps(
                {
                    "status": "requires_verification",
                    "phone": customer_phone,
                    "message": (
                        f"Phone verification is required to confirm this booking for {customer_phone}. "
                        "Inform the customer that a 6-digit verification code is being sent to their phone, "
                        "and call send_booking_otp followed by verify_booking_otp."
                    ),
                }
            )

    booking_source = "sandbox_simulation" if is_sandbox else "customer_agent"
    active_hold_token: str | None = None
    if session_id:
        active_hold_token = await get_active_hold_for_session(session_id)

    target_resource_ids: list[str] = []
    if resource_ids:
        target_resource_ids.extend([r.strip() for r in resource_ids if r and r.strip()])
    if resource_id and resource_id.strip() and resource_id.strip() not in target_resource_ids:
        target_resource_ids.append(resource_id.strip())

    result = await create_booking(
        tenant_id=tenant_id,
        service_id=service_id,
        start_time=start_time,
        customer_name=customer_name,
        customer_phone=customer_phone,
        customer_email=customer_email,
        end_time=end_time,
        resource_id=resource_id or (target_resource_ids[0] if target_resource_ids else None),
        resource_ids=target_resource_ids or None,
        notes=notes,
        agent_id=agent_id,
        source=booking_source,
        hold_token=active_hold_token,
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
        await release_session_hold(session_id)
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
        try:
            await verify_customer(
                tenant_id=tenant_id or "",
                customer_phone=customer_phone,
                agent_id=agent_id,
            )
            logger.info(
                "[MCP Tool book_appointment] Synced is_guest: false via gRPC for %s",
                customer_phone,
            )
        except Exception as e:
            logger.warning(
                "[MCP Tool book_appointment] Could not sync customer verification via gRPC: %s", e
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
    otp_code: str | None = None,
) -> str:
    """Cancel an existing confirmed booking or appointment.

    Requires mandatory phone verification via OTP to prevent unauthorized cancellations.
    If OTP was sent and customer provides their 6-digit verification code, pass `otp_code` directly
    to verify phone and cancel the booking atomically in a single step!

    Args:
        tenant_id: The tenant identifier.
        agent_id: The specific agent ID responsible for the scheduling flow.
        booking_id: The booking ID (bk_...) or booking reference (BK-...).
        session_id: Optional active chat session ID for verification status.
        customer_phone: Customer phone number for OTP verification.
        reason: Optional reason for the cancellation.
        otp_code: Optional 6-digit verification code to verify phone and cancel booking atomically in one step.
    """
    logger.info(
        "[MCP Tool: cancel_appointment] Invoked with arguments: tenant_id=%s, agent_id=%s, booking_id=%s, session_id=%s, customer_phone=%s, reason=%s, has_otp=%s",
        tenant_id,
        agent_id,
        booking_id,
        session_id,
        customer_phone,
        reason,
        bool(otp_code),
    )

    if otp_code and otp_code.strip():
        if not customer_phone or not customer_phone.strip():
            return json.dumps(
                {
                    "status": "failed",
                    "error": "Customer phone number is required along with OTP code to verify cancellation.",
                    "message": "Customer phone number is required along with OTP code to verify cancellation.",
                }
            )
        success, err_msg = await _verify_and_authenticate_session(
            phone=customer_phone,
            otp_code=otp_code,
            session_id=session_id,
            tenant_id=tenant_id,
            agent_id=agent_id,
            action_name="cancel_appointment",
        )
        if not success:
            return json.dumps(
                {
                    "status": "failed",
                    "error": err_msg,
                    "message": err_msg,
                }
            )

    is_verified = await _check_session_verified(session_id, customer_phone)

    if not is_verified:
        if customer_phone:
            return json.dumps(
                {
                    "status": "requires_verification",
                    "phone": customer_phone,
                    "message": (
                        f"For security, cancellation strictly requires phone verification for {customer_phone}. "
                        "Inform the customer that a 6-digit verification code is being sent to their phone, "
                        "and call send_booking_otp."
                    ),
                }
            )
        return json.dumps(
            {
                "status": "requires_verification",
                "message": "Cancellation strictly requires phone verification. Please provide your phone number so we can text you a 6-digit verification code.",
            }
        )

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
    otp_code: str | None = None,
) -> str:
    """Reschedule an existing booking to a new date and time.

    Requires mandatory phone verification via OTP to prevent unauthorized modifications.
    If OTP was sent and customer provides their 6-digit verification code, pass `otp_code` directly
    to verify phone and reschedule the booking atomically in a single step!

    Args:
        tenant_id: The tenant identifier.
        agent_id: The specific agent ID responsible for the scheduling flow.
        booking_id: The booking ID (bk_...) or booking reference (BK-...).
        new_start_time: The exact new appointment start time ISO string returned by check_availability (e.g. '2026-11-16T09:00:00+05:30' or '2026-11-16T03:30:00Z'). NEVER append 'Z' to local business hours!
        new_end_time: Optional new ISO-8601 end time.
        resource_id: Optional specific staff/resource ID for the new slot.
        session_id: Optional active chat session ID for verification status.
        customer_phone: Customer phone number for OTP verification.
        notes: Optional rescheduling notes.
        otp_code: Optional 6-digit verification code to verify phone and reschedule booking atomically in one step.
    """
    logger.info(
        "[MCP Tool: reschedule_appointment] Invoked with arguments: tenant_id=%s, agent_id=%s, booking_id=%s, new_start_time=%s, new_end_time=%s, resource_id=%s, session_id=%s, customer_phone=%s, notes=%s, has_otp=%s",
        tenant_id,
        agent_id,
        booking_id,
        new_start_time,
        new_end_time,
        resource_id,
        session_id,
        customer_phone,
        notes,
        bool(otp_code),
    )

    if otp_code and otp_code.strip():
        if not customer_phone or not customer_phone.strip():
            return json.dumps(
                {
                    "status": "failed",
                    "error": "Customer phone number is required along with OTP code to verify rescheduling.",
                    "message": "Customer phone number is required along with OTP code to verify rescheduling.",
                }
            )
        success, err_msg = await _verify_and_authenticate_session(
            phone=customer_phone,
            otp_code=otp_code,
            session_id=session_id,
            tenant_id=tenant_id,
            agent_id=agent_id,
            action_name="reschedule_appointment",
        )
        if not success:
            return json.dumps(
                {
                    "status": "failed",
                    "error": err_msg,
                    "message": err_msg,
                }
            )

    is_verified = await _check_session_verified(session_id, customer_phone)

    if not is_verified:
        if customer_phone:
            return json.dumps(
                {
                    "status": "requires_verification",
                    "phone": customer_phone,
                    "message": (
                        f"For security, rescheduling strictly requires phone verification for {customer_phone}. "
                        "Inform the customer that a 6-digit verification code is being sent to their phone, "
                        "and call send_booking_otp followed by verify_booking_otp."
                    ),
                }
            )
        return json.dumps(
            {
                "status": "requires_verification",
                "message": "Rescheduling strictly requires phone verification. Please provide your phone number so we can text you a 6-digit verification code.",
            }
        )
    biz_ctx = await _resolve_business_context(tenant_id, agent_id)
    tz_str = (biz_ctx.get("timezone") if biz_ctx else None) or "UTC"

    new_start_time = _sanitize_start_time(new_start_time, tz_str)
    if new_end_time:
        new_end_time = _sanitize_start_time(new_end_time, tz_str)

    active_hold_token: str | None = None
    if session_id:
        active_hold_token = await get_active_hold_for_session(session_id)

    result = await reschedule_booking(
        tenant_id=tenant_id,
        agent_id=agent_id,
        booking_id=booking_id,
        new_start_time=new_start_time,
        new_end_time=new_end_time,
        resource_id=resource_id,
        notes=notes,
        hold_token=active_hold_token,
    )
    if not result.get("success"):
        return json.dumps(
            {
                "status": "failed",
                "error": result.get("error", "Failed to reschedule booking"),
            }
        )

    if session_id:
        await release_session_hold(session_id)

    bk = result.get("booking", {})
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
    otp_code: str | None = None,
) -> str:
    """Retrieve the recent booking records and history (up to 20) for a customer.

    CRITICAL SECURITY PROTOCOL:
    Before returning private customer appointment records, the customer's phone number MUST
    be verified via OTP in the active chat session (Layer 2 Deterministic Check).
    If OTP was sent and customer provides their 6-digit verification code, pass `otp_code` directly
    to verify phone and retrieve booking history atomically in a single step!

    Args:
        session_id: Active customer chat session ID.
        phone: Customer mobile phone number (E.164 or 10-digit).
        tenant_id: The business / tenant ID.
        agent_id: The specific agent ID responsible for the scheduling flow.
        status: Optional filter by booking status (e.g. 'confirmed', 'pending', 'cancelled').
        limit: Max number of bookings to return (default 20, max 20).
        otp_code: Optional 6-digit verification code to verify phone and retrieve bookings atomically in one step.

    Returns:
        JSON string containing the list of recent bookings.
    """
    logger.info(
        "[MCP Tool: get_customer_bookings] Invoked with arguments: session_id=%s, phone=%s, tenant_id=%s, agent_id=%s, status=%s, limit=%s, has_otp=%s",
        session_id,
        phone,
        tenant_id,
        agent_id,
        status,
        limit,
        bool(otp_code),
    )
    cleaned_phone = phone.strip()
    if not cleaned_phone:
        return json.dumps(
            {
                "status": "failed",
                "message": "Valid customer phone number is required to look up bookings.",
            }
        )

    if otp_code and otp_code.strip():
        success, err_msg = await _verify_and_authenticate_session(
            phone=cleaned_phone,
            otp_code=otp_code,
            session_id=session_id,
            tenant_id=tenant_id,
            agent_id=agent_id,
            action_name="get_customer_bookings",
        )
        if not success:
            return json.dumps(
                {
                    "status": "failed",
                    "error": err_msg,
                    "message": err_msg,
                }
            )

    verified = await _check_session_verified(session_id, cleaned_phone)
    if not verified:
        logger.warning(
            "[MCP Security Gatekeeper] Blocked unauthorized booking lookup for session=%s, phone=%s",
            session_id,
            cleaned_phone,
        )
        return json.dumps(
            {
                "status": "requires_verification",
                "phone": cleaned_phone,
                "message": (
                    f"Customer phone number {cleaned_phone} has not been verified for this session. "
                    "For privacy and security, inform the customer that an OTP verification is required "
                    "before showing their booking details. Call send_booking_otp to send a verification code."
                ),
            }
        )

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
        return json.dumps(
            {
                "status": "failed",
                "error": result.get("error", "Failed to retrieve customer bookings"),
            }
        )

    raw_bookings = result.get("bookings", [])
    last10 = cleaned_phone[-10:] if len(cleaned_phone) >= 10 else cleaned_phone
    matched = [
        bk
        for bk in raw_bookings
        if not bk.get("customer_phone") or last10 in bk.get("customer_phone", "")
    ]

    biz_ctx = await _resolve_business_context(tenant_id, agent_id)
    tz_str = (biz_ctx.get("timezone") if biz_ctx else None) or "UTC"

    services_list = biz_ctx.get("services", []) if biz_ctx else []
    resources_list = biz_ctx.get("resources", []) if biz_ctx else []

    service_name_map = {
        (s.get("id") or s.get("service_id")): s.get("name")
        for s in services_list
        if (s.get("id") or s.get("service_id"))
    }
    resource_name_map = {
        (r.get("id") or r.get("resource_id")): r.get("name")
        for r in resources_list
        if (r.get("id") or r.get("resource_id"))
    }

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

        svc_name = service_name_map.get(bk.get("service_id")) or "Scheduled Service"
        b_dict["service_name"] = svc_name

        primary_res_id = bk.get("resource_id") or (
            bk.get("resource_ids", [])[0] if bk.get("resource_ids") else None
        )
        res_name = resource_name_map.get(primary_res_id) or "Auto-Assigned Unit"
        b_dict["resource_name"] = res_name

        all_res_ids = bk.get("resource_ids") or ([primary_res_id] if primary_res_id else [])
        b_dict["assigned_resources"] = [
            resource_name_map.get(rid, rid) for rid in all_res_ids if rid
        ]

        b_mode = bk.get("booking_mode", "time_slot")
        if b_mode == "date_range" and s_utc and e_utc:
            try:
                s_dt = datetime.fromisoformat(s_utc.replace("Z", "+00:00"))
                e_dt = datetime.fromisoformat(e_utc.replace("Z", "+00:00"))
                nights = max(1, round((e_dt - s_dt).total_seconds() / 86400))
                b_dict["stay_duration"] = f"{nights} night(s)"
            except Exception:
                b_dict["stay_duration"] = "Date Range Stay"

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
) -> list[dict[str, Any]] | None:
    """Load resources directly from cached biz_context (with fallback to AgentRuntimeConfig).

    Returns None if the agent has not been published yet.
    """
    biz_ctx = await _resolve_business_context(tenant_id, agent_id, is_sandbox=is_sandbox)
    if not biz_ctx or not biz_ctx.get("business_name"):
        return None

    raw_resources = biz_ctx.get("resources") or []
    resources: list[dict[str, Any]] = []
    for r in raw_resources:
        rid = r.get("resource_id") or r.get("id")
        if not rid:
            continue
        r_type = str(r.get("resource_type") or r.get("type") or "staff")
        d_status = str(r.get("dispatch_status") or "active")
        resources.append(
            {
                "resource_id": rid,
                "name": r.get("name") or "",
                "title": r.get("title") or "",
                "category": r.get("category") or "General",
                "description": r.get("description") or "",
                "resource_type": r_type,
                "is_bookable": r.get("is_bookable", True),
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

    if all_resources is None:
        return json.dumps(
            {
                "status": "failed",
                "error": "This agent is currently in draft mode and has not been published yet. Please click 'Publish Agent' in Admin Studio to enable live resources.",
            }
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
) -> list[dict[str, Any]] | None:
    """Load full service catalog directly from cached biz_context (with fallback to AgentRuntimeConfig).

    Returns None if the agent has not been published yet.
    """
    biz_ctx = await _resolve_business_context(tenant_id, agent_id, is_sandbox=is_sandbox)
    if not biz_ctx or not biz_ctx.get("business_name"):
        return None

    raw_resources = biz_ctx.get("resources") or []
    raw_services = biz_ctx.get("services") or []

    services: list[dict[str, Any]] = []
    resource_map: dict[str, dict[str, Any]] = {}

    for r in raw_resources:
        rid = r.get("resource_id") or r.get("id")
        if rid:
            resource_map[rid] = {
                "resource_id": rid,
                "name": r.get("name") or "",
                "title": r.get("title") or "",
                "category": r.get("category") or "General",
                "description": r.get("description") or "",
            }

    for s in raw_services:
        if s.get("is_deleted", False):
            continue
        selectable_staff = []
        auto_assigned = []

        reqs = s.get("resource_requirements") or []
        for req in reqs:
            req_mode = str(req.get("selection_mode") or "")
            r_type = str(req.get("resource_type") or "staff")
            eligible = req.get("eligible_resource_ids") or []

            resolved = [resource_map[rid] for rid in eligible if rid in resource_map]
            if req_mode == "user_selectable" or (not req_mode and r_type.lower() == "staff"):
                for res in resolved:
                    selectable_staff.append(
                        {
                            "resource_id": res["resource_id"],
                            "name": res["name"],
                            "title": res["title"],
                            "category": res["category"],
                            "role": req.get("role") or "Provider",
                        }
                    )
            else:
                auto_assigned.append(
                    {
                        "role": req.get("role") or "Resource",
                        "resource_type": r_type,
                        "count": req.get("count", 1),
                    }
                )

        price_obj = s.get("price")
        if isinstance(price_obj, dict) and price_obj.get("amount") is not None:
            price_str = f"{price_obj.get('amount')} {price_obj.get('currency', 'USD')}"
        elif price_obj is not None and getattr(price_obj, "amount", None) is not None:
            price_str = f"{price_obj.amount} {getattr(price_obj, 'currency', 'USD')}"
        else:
            price_str = "Free"

        sid = s.get("service_id") or s.get("id")
        services.append(
            {
                "service_id": sid,
                "name": s.get("name") or "",
                "category": s.get("category") or "General",
                "description": s.get("description") or "",
                "duration_minutes": s.get("duration_minutes", 30),
                "price": price_str,
                "booking_mode": str(s.get("booking_mode") or "time_slot"),
                "selectable_staff": selectable_staff,
                "auto_assigned_resources": auto_assigned,
            }
        )

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

    if all_services is None:
        return json.dumps(
            {
                "status": "failed",
                "error": "This agent is currently in draft mode and has not been published yet. Please click 'Publish Agent' in Admin Studio to enable live services.",
            }
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
                logger.info(
                    "[MCP Tool Call] Executing '%s' with arguments: %s",
                    tool_name,
                    json.dumps(kwargs, default=str),
                )
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
