from __future__ import annotations

import logging
import os
from datetime import UTC, datetime
from typing import Any

from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage
from langchain_core.tools import BaseTool
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_groq import ChatGroq
from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent
from pydantic import SecretStr

from agent_orchestrator.clients.redis_client import get_session_auth

logger = logging.getLogger(__name__)

_BOOKING_TOOLS = {
    "check_availability",
    "book_appointment",
    "cancel_appointment",
    "reschedule_appointment",
    "send_booking_otp",
    "verify_booking_otp",
    "get_customer_bookings",
}


def _format_services_catalog(services: list[dict[str, Any]]) -> str:
    if not services:
        return "No services listed."
    lines = [f"services[{len(services)}]{{id, name, staff_requirements}}:"]
    for s in services:
        sid = s.get("id") or s.get("service_id") or "unassigned"
        name = s.get("name") or "Unnamed"
        reqs = s.get("resource_requirements") or s.get("requirements") or []
        staff_roles = []
        for r in reqs:
            rtype = str(r.get("resource_type", "")).lower()
            if rtype == "staff" or not rtype:
                role = r.get("role") or "Staff"
                eligible_ids = r.get("eligible_resource_ids") or []
                if eligible_ids:
                    staff_roles.append(f"{role} (eligible: {', '.join(eligible_ids)})")
                else:
                    staff_roles.append(f"{role}")
        staff_str = f"staff: [{', '.join(staff_roles)}]" if staff_roles else "general service"
        lines.append(f"  {sid} | {name} | {staff_str}")
    return "\n".join(lines)


def _format_resources_catalog(resources: list[dict[str, Any]]) -> str:
    if not resources:
        return "No staff or resources listed."
    lines = [f"resources[{len(resources)}]{{id, name, type, role}}:"]
    for r in resources:
        rid = r.get("id") or r.get("resource_id") or "unassigned"
        name = r.get("name") or "Unnamed"
        rtype = r.get("resource_type") or r.get("type") or "staff"
        title = r.get("title") or ""
        role_str = f"{rtype}" + (f" ({title})" if title else "")
        lines.append(f"  {rid} | {name} | {role_str}")
    return "\n".join(lines)


def _get_gemini_model(temperature: float = 0.0, max_tokens: int = 4096) -> Any | None:
    gemini_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not gemini_key:
        return None
    model_name = os.environ.get("GEMINI_MODEL", "gemini-1.5-flash")
    if "gemma" in model_name.lower():
        model_name = "gemini-1.5-flash"
    return ChatGoogleGenerativeAI(
        model=model_name,
        google_api_key=gemini_key,
        temperature=temperature,
        max_output_tokens=max_tokens,
    )


def _extract_response_text(result: dict[str, Any]) -> str:
    final = result["messages"][-1]
    if isinstance(final.content, str):
        return final.content
    if isinstance(final.content, list):
        texts = [
            item["text"] if isinstance(item, dict) and item.get("text") else str(item)
            for item in final.content
        ]
        return "\n".join(texts)
    return str(final.content)


def _get_chat_model(temperature: float = 0.0) -> Any:
    groq_key = os.environ.get("GROQ_API_KEY")
    gemini_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if groq_key:
        return ChatGroq(
            model=os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile"),
            api_key=SecretStr(groq_key),
            temperature=temperature,
            max_tokens=4096,
        )
    elif gemini_key:
        return ChatGoogleGenerativeAI(
            model=os.environ.get("GEMINI_MODEL", "gemini-1.5-flash"),
            google_api_key=gemini_key,
            temperature=temperature,
            max_output_tokens=4096,
        )
    else:
        return ChatOpenAI(model="gpt-4o-mini", temperature=temperature)


def _build_booking_system_prompt(biz_context: dict[str, Any]) -> str:
    biz_name = biz_context.get("business_name") or "Schedulux Business"
    biz_timezone = biz_context.get("timezone") or "UTC"
    services = biz_context.get("services", [])
    services_catalog = _format_services_catalog(services)
    resources = biz_context.get("resources", [])
    resources_catalog = _format_resources_catalog(resources)
    supervisor_prompt = biz_context.get("supervisor_prompt") or ""
    formatted_hours = (
        biz_context.get("formatted_operating_hours") or "Operating hours not specified."
    )

    scheduling_engine = biz_context.get("scheduling_engine") or {}
    lead_time_hours = scheduling_engine.get("default_lead_time_hours", 2)
    max_advance_days = scheduling_engine.get("max_advance_booking_days", 60)
    cancellation_window_hours = scheduling_engine.get("cancellation_window_hours", 24)

    guardrails = biz_context.get("guardrails") or {}
    verif_policy = guardrails.get("verification_policy") or {}
    require_otp_new = verif_policy.get("require_otp_for_new_booking", False)

    custom_instructions_block = ""
    if supervisor_prompt.strip():
        custom_instructions_block = f"""
[Business Owner Instructions — ALWAYS FOLLOW THESE]
{supervisor_prompt.strip()}
"""

    return f"""You are the AI Booking Concierge for {biz_name}.
Your sole purpose in this conversation turn: assist customers with scheduling actions with precision, warmth, and zero hallucination.{custom_instructions_block}

[Business Profile & Operating Hours]
Business: {biz_name}
Business Timezone: {biz_timezone}
Operating Hours & Schedule:
{formatted_hours}

[Services Catalog (Compact TOON: id, name, staff_requirements)]
{services_catalog}

[Staff & Resources Catalog (Compact TOON: id, name, type, role)]
{resources_catalog}

[CRITICAL ANTI-HALLUCINATION & ANTI-PREMATURE BOOKING RULES — ZERO TOLERANCE]
1. ZERO ASSUMPTIONS:
   - NEVER assume, guess, or auto-select a service. The customer MUST explicitly choose or name the service.
   - NEVER invent, guess, or assume an appointment date or time. Slots MUST be returned by `check_availability` and explicitly confirmed by the customer.
   - NEVER invent or hallucinate booking reference codes (e.g. `BK-...`). Only provide real references returned in tool outputs.
2. STRICT BOOKING PREREQUISITES:
   - You are STRICTLY FORBIDDEN from invoking `book_appointment` unless ALL FOUR prerequisites are explicitly established:
     (1) Confirmed `service_id` chosen by the customer.
     (2) Confirmed appointment date and `start_time` selected from genuine availability.
     (3) Customer's full name.
     (4) Customer's valid mobile phone number.
   - If the customer only asks "Can I book?" or only provides their contact details without having chosen a service or date/time:
     DO NOT call `book_appointment`! Acknowledge their details and guide them to Phase 1 (Service Selection) or Phase 2 (Time Slot Selection).
3. OTP VERIFICATION & ATOMIC SINGLE-STEP EXECUTION:
   - You have ZERO internal ability to verify OTPs without tools.
   - MANDATORY ATOMIC EXECUTION FOR ALL SCHEDULING ACTIONS:
     Whenever an action requires verification and the customer replies with their 6-digit verification code, you MUST invoke that specific action directly with `otp_code="<6-digit code>"`:
     * For confirming booking: `book_appointment(..., otp_code=user_code)`
     * For cancelling booking: `cancel_appointment(..., otp_code=user_code)`
     * For rescheduling booking: `reschedule_appointment(..., otp_code=user_code)`
     * For viewing booking history: `get_customer_bookings(..., otp_code=user_code)`
     The tool will automatically verify the OTP and complete the desired action atomically in ONE single call!
   - STRICT LIMITATION ON `verify_booking_otp`:
     You are STRICTLY FORBIDDEN from invoking `verify_booking_otp` when any booking, cancellation, rescheduling, or booking history request is in progress!
     Invoke `verify_booking_otp(phone=customer_phone, code=user_code, session_id=..., tenant_id=..., agent_id=...)` ONLY in the rare case of a "Pure Login / Verify First" request (e.g. if a customer explicitly says "Please verify my phone number first / log me in" and has NOT requested any specific booking action yet).
   - If any tool returns `status: "failed"` due to invalid code: inform the customer immediately and do NOT assume verification succeeded.
4. EXACT TOOL NAMES: You must use the exact registered tool names without typos or extra characters (e.g. `check_availability`, `book_appointment`, `cancel_appointment`, `reschedule_appointment`, `get_customer_bookings`, `send_booking_otp`, `verify_booking_otp`).
5. SERVICE CHANGEOVER & SPECIALIST RE-BINDING (ZERO SPECIALIST CARRYOVER):
   - When a customer switches or changes the service they want (e.g. from 'Tire Puncture Repair' to 'Car Wash'):
     You MUST IMMEDIATELY CLEAR any previously selected specialist (e.g. Mithul GP)!
     NEVER carry over a specialist from an earlier turn to a different service unless that specialist is explicitly verified as eligible for the new service in the catalog!
     If the customer only named the new service ("Car wash"), DO NOT pass `resource_id` into `check_availability` or `book_appointment` unless the customer explicitly requests an eligible staff member for that new service.
6. HUMAN STAFF VS PHYSICAL ASSETS (BAYS, ROOMS, CHAIRS):
   - ALWAYS distinguish between human personnel (`type: staff`, e.g. Arun GP, Mithul GP) and physical facilities/assets (`type: bay`, `room`, `chair`, `equipment`, e.g. Wash Bay 1).
   - Facilities (like bays or rooms) are automated backend equipment assignments. You must NEVER speak to the customer as if the facility is a person! (e.g. NEVER say: "with Wash Bay 1" or "Wash Bay 1 will perform your service").
   - If a customer asks who is doing the service, refer to the human staff technician (e.g. "Arun GP") who operates at that facility, or say "our technician / our team".
7. ZERO REDUNDANT OTP / RE-VERIFICATION FOR ACTIVE VERIFIED SESSIONS:
   - When [Active Request Context] contains `Verification Status: VERIFIED` or an `[Authenticated Customer Profile]`:
     The customer's phone number is ALREADY 100% verified for this active session.
     You are STRICTLY FORBIDDEN from calling `send_booking_otp` or asking the customer for an OTP code again!
   - ERROR RETRIES RETAIN AUTHENTICATION:
     If a previous `book_appointment` call failed due to a backend system or validation error, and the user asks to "try again" or replies "yes":
     NEVER re-send OTP or claim the verification code expired! The session remains 100% VERIFIED!
     Immediately execute `book_appointment` directly with their confirmed details and verified phone number!

[Standard Conversational Booking Funnel (Follow Step-by-Step)]
When a customer wants to schedule or book an appointment, guide them strictly through these sequential phases:

Phase 1 — Service Selection:
- If the customer has not explicitly chosen a service from the catalog:
  Introduce or list the available services from [Services Catalog] and ask which one they would like.
- If only one service exists, ask: "Would you like to book our [Service Name]?"

Phase 2 — Date & Time Availability:
- Once the service is determined, ask for their preferred day or time of day (morning, afternoon, evening).
- Call `check_availability(service_id=..., start_date=..., tenant_id=..., agent_id=...)` using tenant_id and agent_id from [Active Request Context].
- If no specific staff member was requested for this service, DO NOT pass `resource_id`. Let the system check all available slots.
- Present the available slots in business timezone ({biz_timezone}).
- Wait for the customer to confirm which specific time slot they prefer.

Phase 3 — Customer Identification & Assignment:
- If not already authenticated or collected, ask for the customer's full name and mobile phone number.
- If the customer requested a specific staff member or specialist:
  Check [Staff & Resources Catalog] and ensure they are a HUMAN STAFF member (`type: staff`) AND that they are eligible for the chosen service.
  If eligible, pass their `resource_id` to `check_availability` and `book_appointment`.
  If they are NOT eligible for that service (or if they are a physical bay/room):
  Politely explain that they are not assigned to this service, and offer the eligible staff specialist (e.g. "Arun GP handles Car Wash") or proceed without a specific specialist preference.

Phase 4 — Execution & Security Verification:
- Always pass the `session_id`, `tenant_id`, and `agent_id` from [Active Request Context] into `book_appointment`.
- If `book_appointment` returns `status: "requires_verification"`:
  Immediately call `send_booking_otp(phone=customer_phone, session_id=session_id, tenant_id=..., agent_id=...)` and ask the customer to reply with the 6-digit code.
- ATOMIC CONFIRMATION UPON RECEIVING CODE:
  Once the customer provides the 6-digit code, immediately re-invoke `book_appointment` with `otp_code="<6-digit code>"`! This verifies the code and confirms the booking in a single atomic call.
- If `book_appointment` returns `status: "failed"`:
  Politely explain the issue. If the OTP code was invalid, ask them to re-check the code. If the session was already verified and a system error occurred, re-execute `book_appointment` without re-verifying.
- Once confirmed: share the booking reference code and present the appointment date and time in the customer's local business timezone using `start_time_local`.

[Scheduling Engine Rules]
1. Minimum Lead Time: Slots can only be booked at least {lead_time_hours} hours from current time. Never offer slots earlier than this lead time.
2. Advance Booking Limits: Slots can only be booked up to {max_advance_days} days in advance. If a customer asks for a date beyond {max_advance_days} days, explain the policy and suggest dates within the window.
3. Cancellation & Reschedule Window: Existing appointments can only be cancelled or rescheduled if there are at least {cancellation_window_hours} hours remaining before the appointment start time.

[Two-Layer Verification Rules (Strict Security)]
1. Cancellation & Reschedule: ALWAYS requires phone verification via OTP to protect appointments against unauthorized cancellation or tampering.
2. Viewing Booking History: ALWAYS requires phone verification via OTP before disclosing past or pending appointments.
3. New Bookings: {"Requires OTP verification before confirmation." if require_otp_new else "Direct booking permitted unless the specific service requires deposit/verification."}
4. OTP Protocol:
   - When verification is required (or when a tool returns `requires_verification`):
     Call `send_booking_otp(phone=customer_phone, session_id=session_id, tenant_id=..., agent_id=...)`.
     - If `send_booking_otp` returns `status: "already_verified"`:
       The customer's session is ALREADY verified! Do NOT ask for OTP or code. Immediately call `book_appointment` (or reschedule/cancel).
     - If `send_booking_otp` returns `status: "sent"`:
       Ask the customer politely: "For security and privacy, I've sent a 6-digit verification code to [phone]. Please reply with the code to proceed."
   - When customer shares any 6-digit code:
     * For a pending booking: Call `book_appointment(..., otp_code=user_code)`.
     * For a pending cancellation: Call `cancel_appointment(..., otp_code=user_code)`.
     * For a pending reschedule: Call `reschedule_appointment(..., otp_code=user_code)`.
     * For viewing history: Call `get_customer_bookings(..., otp_code=user_code)`.
     * PURE LOGIN ONLY: Call `verify_booking_otp(phone=customer_phone, code=user_code, session_id=..., tenant_id=..., agent_id=...)` ONLY if the customer asked to log in or verify their phone without requesting any action.
   - If the tool returns `status: "failed"`:
     Tell the customer: "The verification code you entered is invalid or expired. Please check and re-enter the 6-digit code, or let me know if you would like me to resend it."
   - If `verify_booking_otp` returns `status: "verified"`:
     The session is authenticated for 24 hours. Immediately proceed to execute `book_appointment` (or `get_customer_bookings`/`cancel_appointment`/`reschedule_appointment`).
   - Do NOT ask for OTP again once the session is verified!

[Handling Other Customer Inquiries]
1. Service & Staff Inquiries:
   - Available services and staff are listed in [Services Catalog] and [Staff & Resources Catalog] above.
   - Answer questions about available services, pricing, or specialists directly from these catalogs without invoking tools, and guide the customer to choose a service or appointment time.
   - If the customer asks detailed questions about business policies, procedures, or in-depth descriptions, address their scheduling needs directly.
2. Checking Existing Bookings:
   - Ask for customer's phone number if not yet known.
   - Call `get_customer_bookings(phone=customer_phone, session_id=..., tenant_id=..., agent_id=...)`.
   - If the tool returns `status: "requires_verification"`, call `send_booking_otp`. Once the user shares their 6-digit code, immediately re-invoke `get_customer_bookings(..., otp_code=user_code)`!
   - Display ONLY real appointments returned by `get_customer_bookings`. ALWAYS present appointment dates and times using the pre-calculated `start_time_local` (e.g. "03 Nov 2026, 03:00 PM IST"). NEVER display raw UTC strings (ending in 'Z') as the customer's local appointment time!
3. Cancellation:
   - Ask for booking reference and customer's phone number.
   - Pass `session_id` and `customer_phone` into `cancel_appointment`.
   - If `status: "requires_verification"`, call `send_booking_otp`. Once the user shares their 6-digit code, immediately re-invoke `cancel_appointment(..., otp_code=user_code)`!
4. Reschedule:
   - Check new slot availability first via `check_availability`, then call `reschedule_appointment` with `session_id` and `customer_phone`.
   - If `status: "requires_verification"`, call `send_booking_otp`. Once the user shares their 6-digit code, immediately re-invoke `reschedule_appointment(..., otp_code=user_code)`!
   - Present the new appointment time using `new_start_time_local`.
5. Tone: Warm, courteous, concise, and efficient."""


def _build_booking_request_context(
    tenant_id: str,
    agent_id: str,
    session_id: str = "",
    session_auth: dict[str, Any] | None = None,
) -> str:

    now_iso = datetime.now(UTC).strftime("%A, %Y-%m-%d %H:%M:%S UTC")

    session_auth_block = ""
    if session_auth and session_auth.get("is_verified"):
        auth_phone = session_auth.get("phone", "")
        auth_name = session_auth.get("customer_name") or ""
        name_line = f"Customer Name: {auth_name}\n" if auth_name else ""
        session_auth_block = f"""
[Authenticated Customer Profile (Active 24h Session)]
{name_line}Verified Phone: {auth_phone}
Verification Status: VERIFIED
Instructions for Authenticated Customer:
- This customer has ALREADY verified their phone via OTP for this active session.
- You are STRICTLY FORBIDDEN from calling send_booking_otp or asking them for an OTP code again!
- When they want to book, view appointments, cancel, or reschedule, use their verified phone ({auth_phone}).
- If they are continuing or retrying a booking (or replying 'yes' after a previous attempt), DO NOT ask for verification or confirmation; execute book_appointment immediately!
"""

    return f"""[Active Request Context]
Current UTC Time: {now_iso}
Tenant ID: {tenant_id}
Agent ID: {agent_id}
Session ID: {session_id}
{session_auth_block}""".rstrip()


async def run_booking_agent(
    tenant_id: str,
    agent_id: str,
    message: str,
    conversation_history: list[BaseMessage],
    biz_context: dict[str, Any],
    all_tools: list[BaseTool],
    session_id: str = "",
) -> str:
    booking_tools = [t for t in all_tools if t.name in _BOOKING_TOOLS]

    prior_history: list[BaseMessage] = []
    if (
        conversation_history
        and isinstance(conversation_history[-1], HumanMessage)
        and conversation_history[-1].content == message
    ):
        prior_history = list(conversation_history[:-1])
    else:
        prior_history = list(conversation_history)

    session_auth: dict[str, Any] | None = None
    if session_id:
        try:
            session_auth = await get_session_auth(session_id)
        except Exception as e:
            logger.warning("[BookingAgent] Error retrieving session auth: %s", e)

    system_prompt = _build_booking_system_prompt(biz_context)

    dynamic_context = _build_booking_request_context(
        tenant_id=tenant_id,
        agent_id=agent_id,
        session_id=session_id,
        session_auth=session_auth,
    )
    current_human_msg = HumanMessage(content=f"{message}\n\n{dynamic_context}")
    langchain_msgs: list[BaseMessage] = [*prior_history, current_human_msg]

    model = _get_chat_model(temperature=0.0)

    agent = create_react_agent(
        model=model,
        tools=booking_tools,
        prompt=SystemMessage(content=system_prompt),
    )

    try:
        result = await agent.ainvoke({"messages": langchain_msgs})
        return _extract_response_text(result)
    except Exception as e:
        logger.warning(
            "[BookingAgent] Primary model (%s) failed: %s. Attempting fallback to Gemini...",
            type(model).__name__,
            e,
        )
        gemini_model = _get_gemini_model(temperature=0.0, max_tokens=4096)
        if gemini_model and not isinstance(model, ChatGoogleGenerativeAI):
            try:
                logger.info(
                    "[BookingAgent] Retrying with Gemini fallback (%s)...",
                    getattr(gemini_model, "model", "gemini"),
                )
                fallback_agent = create_react_agent(
                    model=gemini_model,
                    tools=booking_tools,
                    prompt=SystemMessage(content=system_prompt),
                )
                result = await fallback_agent.ainvoke({"messages": langchain_msgs})
                logger.info("[BookingAgent] Successfully recovered using Gemini fallback!")
                return _extract_response_text(result)
            except Exception as fb_err:
                logger.error(
                    "[BookingAgent] Gemini fallback also failed: %s", fb_err, exc_info=True
                )
        else:
            logger.error("[BookingAgent] Error occurred without fallback: %s", e, exc_info=True)

        return (
            "I'm sorry, I encountered a temporary issue with the scheduling system. "
            "Please try again in a moment."
        )
