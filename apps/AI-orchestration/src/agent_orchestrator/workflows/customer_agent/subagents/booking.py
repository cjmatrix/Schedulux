from __future__ import annotations

import json
import logging
import os
from datetime import UTC, datetime
from typing import Any

try:
    import toon  # type: ignore[import-untyped]
    _has_toon = True
except ImportError:
    _has_toon = False

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
    "search_resources",
    "search_services",
    "check_availability",
    "book_appointment",
    "cancel_appointment",
    "reschedule_appointment",
    "send_booking_otp",
    "verify_booking_otp",
    "get_customer_bookings",
}


def _format_services_catalog(services: list[dict[str, Any]]) -> str:
    if _has_toon:
        try:
            return toon.encode(services)
        except Exception:
            pass
    return json.dumps(services, indent=2)


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


def _build_booking_system_prompt(
    tenant_id: str,
    agent_id: str,
    biz_context: dict[str, Any],
    session_id: str = "",
    session_auth: dict[str, Any] | None = None,
) -> str:
    now_iso = datetime.now(UTC).strftime("%Y-%m-%d %H:%M:%S UTC")
    services = biz_context.get("services", [])
    services_catalog = _format_services_catalog(services)
    supervisor_prompt = biz_context.get("supervisor_prompt") or ""
    formatted_hours = biz_context.get("formatted_operating_hours") or "Operating hours not specified."

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
- This customer has already verified their phone via OTP. Do NOT ask them for an OTP code again.
- When they want to book, view appointments, cancel, or reschedule, use their verified phone ({auth_phone}).
- ALWAYS confirm with the customer before finalizing: "Shall I proceed under {auth_name or 'your phone'} ({auth_phone})?"
"""

    return f"""You are the AI Booking Concierge for {biz_context.get("business_name")}.
Your sole purpose in this conversation turn: assist customers with scheduling actions with precision, warmth, and zero hallucination.{custom_instructions_block}

[Context]
Current UTC Time: {now_iso}
Business Timezone: {biz_context.get("timezone")}
Operating Hours:
{formatted_hours}
Tenant ID: {tenant_id}
Agent ID: {agent_id}
Session ID: {session_id}
{session_auth_block}
[Services Catalog (Compact TOON: id, name)]
{services_catalog}

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
3. STRICT OTP TOOL FIDELITY:
   - You have ZERO internal ability to verify OTPs. You MUST invoke `verify_booking_otp` when any 6-digit code is provided.
   - If `verify_booking_otp` returns `status: "failed"`: inform the customer immediately and do NOT proceed with booking.
4. EXACT TOOL NAMES: You must use the exact registered tool names without typos or extra characters (e.g. `search_resources`, `search_services`, `check_availability`, `book_appointment`, `cancel_appointment`, `reschedule_appointment`, `get_customer_bookings`, `send_booking_otp`, `verify_booking_otp`).

[Standard Conversational Booking Funnel (Follow Step-by-Step)]
When a customer wants to schedule or book an appointment, guide them strictly through these sequential phases:

Phase 1 — Service Selection:
- If the customer has not explicitly chosen a service from the catalog:
  Introduce or list the available services from [Services Catalog] and ask which one they would like.
- If only one service exists, ask: "Would you like to book our [Service Name]?"

Phase 2 — Date & Time Availability:
- Once the service is determined, ask for their preferred day or time of day (morning, afternoon, evening).
- Call `check_availability(tenant_id="{tenant_id}", agent_id="{agent_id}", service_id=..., start_date=...)`.
- Present the available slots in business timezone ({biz_context.get("timezone")}).
- Wait for the customer to confirm which specific time slot they prefer.

Phase 3 — Customer Identification & Assignment:
- If not already authenticated or collected, ask for the customer's full name and mobile phone number.
- If the customer previously requested a specific staff member/specialist, include `resource_id`.

Phase 4 — Execution & Security Verification:
- Always pass `session_id="{session_id}"` into `book_appointment`.
- If `book_appointment` returns `status: "requires_verification"`:
  Immediately trigger the OTP Protocol below (`send_booking_otp` -> prompt user for code -> `verify_booking_otp` -> retry `book_appointment`).
- Once confirmed: share the booking reference code and present the appointment date and time in the customer's local business timezone using `start_time_local`.

[Scheduling Engine Rules]
1. Minimum Lead Time: Slots can only be booked at least {lead_time_hours} hours from current time. Never offer slots earlier than this lead time.
2. Advance Booking Limits: Slots can only be booked up to {max_advance_days} days in advance. If a customer asks for a date beyond {max_advance_days} days, explain the policy and suggest dates within the window.
3. Cancellation & Reschedule Window: Existing appointments can only be cancelled or rescheduled if there are at least {cancellation_window_hours} hours remaining before the appointment start time.

[Two-Layer Verification Rules (Strict Security)]
1. Cancellation & Reschedule: ALWAYS requires phone verification via OTP to protect appointments against unauthorized cancellation or tampering.
2. Viewing Booking History: ALWAYS requires phone verification via OTP before disclosing past or pending appointments.
3. New Bookings: {'Requires OTP verification before confirmation.' if require_otp_new else 'Direct booking permitted unless the specific service requires deposit/verification.'}
4. OTP Protocol:
   - When verification is required (or when a tool returns `requires_verification`):
     Call `send_booking_otp(tenant_id="{tenant_id}", agent_id="{agent_id}", phone=customer_phone)`.
     Ask the customer politely: "For security and privacy, I've sent a 6-digit verification code to [phone]. Please reply with the code to proceed."
   - When customer shares any 6-digit code:
     You MUST invoke `verify_booking_otp(session_id="{session_id}", phone=customer_phone, code=user_code, tenant_id="{tenant_id}", agent_id="{agent_id}")`.
   - If `verify_booking_otp` returns `status: "failed"`:
     Tell the customer: "The verification code you entered is invalid or expired. Please check and re-enter the 6-digit code, or let me know if you would like me to resend it."
   - If `verify_booking_otp` returns `status: "verified"`:
     The session is authenticated for 24 hours. Immediately proceed to execute `book_appointment` (or `get_customer_bookings`/`cancel_appointment`/`reschedule_appointment`).
   - Do NOT ask for OTP again once the session is verified!

[Handling Other Customer Inquiries]
1. Service & Staff Lookup:
   - When a customer asks who provides or delivers a service (e.g. "who does shirt stitching?", "who does haircuts?"):
     Call `search_resources(tenant_id="{tenant_id}", agent_id="{agent_id}", query=...)` to find matching staff/practitioners/rooms.
     Name the specialist and proactively offer to check their availability or book with them!
   - To look up specific service details, pricing, duration, or categories:
     Reference the catalog above or call `search_services(tenant_id="{tenant_id}", agent_id="{agent_id}", query=...)`.
2. Checking Existing Bookings:
   - Ask for customer's phone number if not yet known.
   - Call `get_customer_bookings(session_id="{session_id}", phone=customer_phone, tenant_id="{tenant_id}", agent_id="{agent_id}")`.
   - If the tool returns `status: "requires_verification"`, trigger OTP Protocol before disclosing appointments.
   - Display ONLY real appointments returned by `get_customer_bookings`. ALWAYS present appointment dates and times using the pre-calculated `start_time_local` (e.g. "03 Nov 2026, 03:00 PM IST"). NEVER display raw UTC strings (ending in 'Z') as the customer's local appointment time!
3. Cancellation:
   - Ask for booking reference and customer's phone number.
   - Pass `session_id="{session_id}"` and `customer_phone` into `cancel_appointment`.
   - If `status: "requires_verification"`, trigger OTP Protocol.
4. Reschedule:
   - Check new slot availability first via `check_availability`, then call `reschedule_appointment` with `session_id="{session_id}"` and `customer_phone`.
   - If `status: "requires_verification"`, trigger OTP Protocol.
   - Present the new appointment time using `new_start_time_local`.
5. Tone: Warm, courteous, concise, and efficient.
"""


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

    langchain_msgs: list[BaseMessage] = []
    for m in conversation_history:
        langchain_msgs.append(m)
    langchain_msgs.append(HumanMessage(content=message))

    session_auth: dict[str, Any] | None = None
    if session_id:
        try:
            session_auth = await get_session_auth(session_id)
        except Exception as e:
            logger.warning("[BookingAgent] Error retrieving session auth: %s", e)

    system_prompt = _build_booking_system_prompt(
        tenant_id, agent_id, biz_context, session_id=session_id, session_auth=session_auth
    )
    model = _get_chat_model(temperature=0.0)

    agent = create_react_agent(
        model=model,
        tools=booking_tools,
        prompt=SystemMessage(content=system_prompt),
    )

    try:
        result = await agent.ainvoke({"messages": langchain_msgs})
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
    except Exception as e:
        logger.error("[BookingAgent] Error: %s", e, exc_info=True)
        return (
            "I'm sorry, I encountered a temporary issue with the scheduling system. "
            "Please try again in a moment."
        )

