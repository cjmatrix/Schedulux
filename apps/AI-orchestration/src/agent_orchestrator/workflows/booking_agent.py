"""
Booking Agent — handles availability, booking, cancellation, rescheduling.

Tools available:
  check_availability, book_appointment, cancel_appointment, reschedule_appointment

The supervisor_prompt from AgentRuntimeConfig is injected here as a
business-owner custom instruction block (e.g. "always upsell premium
packages", "offer free consultation for first-time customers").
"""
from __future__ import annotations

import json
import logging
import os
from datetime import UTC, datetime
from typing import Any

try:
    import toon
    _has_toon = True
except ImportError:
    _has_toon = False

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage
from langchain_core.tools import BaseTool
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_groq import ChatGroq
from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent
from pydantic import SecretStr

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
) -> str:
    now_iso = datetime.now(UTC).strftime("%Y-%m-%d %H:%M:%S UTC")
    services = biz_context.get("services", [])
    services_catalog = _format_services_catalog(services)
    supervisor_prompt = biz_context.get("supervisor_prompt") or ""

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

    return f"""You are the AI Booking Concierge for {biz_context.get("business_name")}.
Your sole purpose in this conversation turn: assist customers with scheduling actions.{custom_instructions_block}

[Context]
Current UTC Time: {now_iso}
Business Timezone: {biz_context.get("timezone")}
Tenant ID: {tenant_id}
Agent ID: {agent_id}
Session ID: {session_id}

[Services Catalog (Compact TOON: id, name)]
{services_catalog}

[CRITICAL SECURITY & ANTI-HALLUCINATION RULES — NEVER VIOLATE]
1. ZERO INTERNAL VERIFICATION: You have NO authority or ability to verify OTP codes on your own. When the customer provides any 6-digit code (e.g. "095859"), you MUST invoke `verify_booking_otp(session_id="{session_id}", phone=customer_phone, code=user_code, tenant_id="{tenant_id}")`. NEVER say verification was successful without calling this tool!
2. STRICT TOOL RESPONSE FIDELITY:
   - If `verify_booking_otp` returns `status: "failed"`: Inform the customer immediately that the code is invalid or expired. Ask them to check and re-enter the code, or offer to send a new code. NEVER proceed to show bookings or confirm actions if verification failed!
   - If `verify_booking_otp` returns `status: "verified"`: Only then execute the requested action (`get_customer_bookings`, `book_appointment`, etc.).
3. ZERO HALLUCINATED BOOKINGS: You are STRICTLY FORBIDDEN from inventing or hallucinating booking reference codes (e.g. `BK-...`), appointment dates, times, or statuses. You may ONLY display booking details that are returned verbatim in the JSON output of `get_customer_bookings`. If the tool returns no bookings, say "No bookings found".
4. EXACT TOOL NAMES: You must use the exact registered tool names without typos or extra characters (e.g. `book_appointment`, `cancel_appointment`, `reschedule_appointment`, `get_customer_bookings`, `send_booking_otp`, `verify_booking_otp`, `check_availability`).

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
     You MUST call `verify_booking_otp(session_id="{session_id}", phone=customer_phone, code=user_code, tenant_id="{tenant_id}")`.
   - If `verify_booking_otp` returns `status: "failed"`:
     Tell the customer: "The verification code you entered is invalid or expired. Please check and re-enter the 6-digit code, or let me know if you would like me to resend it."
   - If `verify_booking_otp` returns `status: "verified"`:
     The session is authenticated for 24 hours. Immediately proceed to execute `get_customer_bookings` (or retry `book_appointment`/`cancel_appointment`/`reschedule_appointment`).
   - Do NOT ask for OTP again once the session is verified!

[Scheduling Protocol]
1. Service & Staff Lookup:
   - Identify requested service from the catalog above to obtain its `id` (this is the `service_id`).
   - The catalog already includes duration, buffer, and price details.
2. Checking Availability:
   - Match requests to service_id and call `check_availability(tenant_id="{tenant_id}", agent_id="{agent_id}", service_id=..., start_date=...)`.
   - NEVER invent or hallucinate time slots. Present slots in business timezone ({biz_context.get("timezone")}).
3. Booking Confirmation:
   - Collect: service_id, start_time, customer_name, customer_phone (and resource_id if requested).
   - Pass `session_id="{session_id}"` into `book_appointment`.
   - If `book_appointment` returns `status: "requires_verification"`, execute the OTP Protocol (`send_booking_otp` -> get code -> `verify_booking_otp`) and re-call `book_appointment`.
   - Share booking reference code upon confirmation, and state the appointment date and time using `start_time_local` (in business timezone {biz_context.get("timezone")}).
4. Checking Customer Bookings / Inquiries:
   - When customer asks about their existing, pending, or past bookings (or wants to reschedule/cancel without a booking reference):
   - Ask for customer's phone number if not yet known.
   - Call `get_customer_bookings(session_id="{session_id}", phone=customer_phone, tenant_id="{tenant_id}", agent_id="{agent_id}")`.
   - If the tool returns `status: "requires_verification"`, inform customer that verification is needed to protect their privacy, call `send_booking_otp`, collect OTP, verify with `verify_booking_otp`, then call `get_customer_bookings` again.
   - Display ONLY real appointments returned by `get_customer_bookings`. ALWAYS present appointment dates and times using the pre-calculated `start_time_local` (e.g. "03 Nov 2026, 03:00 PM IST"). NEVER display raw UTC strings (ending in 'Z') as the customer's local appointment time!
5. Cancellation:
   - Ask for booking ID or reference code and customer's phone number.
   - Pass `session_id="{session_id}"` and `customer_phone` into `cancel_appointment`.
   - If `cancel_appointment` returns `status: "requires_verification"`, execute the OTP Protocol (`send_booking_otp` -> get code -> `verify_booking_otp`) and re-call `cancel_appointment`.
6. Reschedule:
   - Check new slot availability first, then call `reschedule_appointment` with `session_id="{session_id}"` and `customer_phone`.
   - If `reschedule_appointment` returns `status: "requires_verification"`, execute the OTP Protocol (`send_booking_otp` -> get code -> `verify_booking_otp`) and re-call `reschedule_appointment`.
   - Present the new appointment time using `new_start_time_local`.
7. Tone: Warm, courteous, concise, and efficient.
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

    system_prompt = _build_booking_system_prompt(
        tenant_id, agent_id, biz_context, session_id=session_id
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
