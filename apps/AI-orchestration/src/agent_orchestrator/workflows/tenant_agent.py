from __future__ import annotations

import copy
import json
import os
from datetime import UTC, datetime
from enum import StrEnum
from typing import Annotated, Any, Literal, cast

import jsonpatch
from dotenv import load_dotenv
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_groq import ChatGroq
from langchain_openai import ChatOpenAI
from langgraph.graph import END, StateGraph
from langgraph.graph.message import add_messages
from pydantic import BaseModel, ConfigDict, Field, SecretStr
from typing_extensions import TypedDict

_env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".env"))
load_dotenv(_env_path)

_GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
_GROQ_MODEL = os.environ.get("GROQ_MODEL", "openai/gpt-oss-120b")
_GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY", "")
_GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-1.5-flash")


class GraphState(TypedDict):
    tenant_id: str
    agent_id: str | None
    draft: dict[str, Any]
    messages: Annotated[list, add_messages]
    structural_gaps: list[dict]
    pending_field: str | None
    semantic_note: str | None
    decision: str | None
    pending_patches: list[dict] | None
    status: str
    patch_retries: int


STRUCTURAL_REQUIREMENTS: list[dict] = [
    {
        "field": "business_profile.name",
        "question": "What is the name of your business?",
        "type": "scalar",
    },
    {
        "field": "business_profile.vertical",
        "question": (
            "What industry are you in? "
            "(e.g. medical_dental, auto_repair, lodging, salon, legal, custom)"
        ),
        "type": "scalar",
    },
    {
        "field": "business_profile.timezone",
        "question": "What timezone are your operating hours in? (e.g. Asia/Kolkata, America/New_York)",
        "type": "scalar",
    },
    {
        "field": "business_profile.contact.public_phone",
        "question": "What is your public contact phone number?",
        "type": "scalar",
    },
    {
        "field": "operating_hours",
        "question": (
            "What are your operating hours? "
            "Describe your weekly schedule (e.g. Mon-Fri 9am-6pm, Sat 10am-2pm, closed Sun)."
        ),
        "type": "operating_hours",
    },
    {
        "field": "services",
        "question": (
            "Please tell me about your first service — its name, duration in minutes, "
            "cleanup/buffer time in minutes, and price."
        ),
        "type": "services_present",
    },
    {
        "field": "services[*].name",
        "question": "What is the name of this service?",
        "type": "per_service",
        "attr": "name",
    },
    {
        "field": "services[*].duration_minutes",
        "question": "How many minutes does '{service_name}' take?",
        "type": "per_service",
        "attr": "duration_minutes",
    },
    {
        "field": "services[*].buffer_minutes",
        "question": "How many minutes of cleanup/buffer time after '{service_name}'? (enter 0 if none)",
        "type": "per_service",
        "attr": "buffer_minutes",
    },
    {
        "field": "services[*].price.amount",
        "question": "What is the price of '{service_name}'? (enter 0 if free)",
        "type": "per_service_nested",
        "attr": "price.amount",
    },
    {
        "field": "resources",
        "question": (
            "Who or what delivers your services? "
            "Please tell me about at least one staff member or bookable resource "
            "(e.g. staff member name and role, or room/bay/chair name)."
        ),
        "type": "resources_present",
    },
]


def _get_nested(d: dict, path: str) -> Any:
    parts = path.split(".")
    cur: Any = d
    for part in parts:
        if not isinstance(cur, dict):
            return None
        cur = cur.get(part)
    return cur


def _set_nested(d: dict, path: str, value: Any) -> None:
    parts = path.split(".")
    cur = d
    for part in parts[:-1]:
        if part not in cur or not isinstance(cur[part], dict):
            cur[part] = {}
        cur = cur[part]
    cur[parts[-1]] = value


def _get_llm(temperature: float = 0.2) -> BaseChatModel:

    groq_api_key = os.environ.get("GROQ_API_KEY") or _GROQ_API_KEY
    gemini_api_key = (
        os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY") or _GEMINI_API_KEY
    )

    if groq_api_key:
        groq_model = os.environ.get("GROQ_MODEL") or _GROQ_MODEL or "openai/gpt-oss-120b"
        if ChatGroq is not None:
            print(f"[Tenant Agent] Initializing ChatGroq with model '{groq_model}'.", flush=True)
            return ChatGroq(  # type: ignore[call-arg]
                model_name=groq_model,
                groq_api_key=groq_api_key,
                temperature=temperature,
                max_tokens=8192,
            )
        else:
            print(
                f"[Tenant Agent] Initializing ChatOpenAI (Groq endpoint) with model '{groq_model}'.",
                flush=True,
            )
            return ChatOpenAI(  # type: ignore[call-arg]
                model=groq_model,
                api_key=SecretStr(groq_api_key),
                base_url="https://api.groq.com/openai/v1",
                temperature=temperature,
                max_tokens=8192,
            )
    else:
        model_name = os.environ.get("GEMINI_MODEL") or _GEMINI_MODEL or "gemini-1.5-flash"
        if "gemma" in model_name.lower():
            model_name = "gemini-1.5-flash"
        print(
            f"[Tenant Agent] Initializing ChatGoogleGenerativeAI with model '{model_name}'.",
            flush=True,
        )
        return ChatGoogleGenerativeAI(
            model=model_name,
            google_api_key=gemini_api_key,
            temperature=temperature,
            max_output_tokens=8192,
        )


def _compute_structural_gaps(draft: dict) -> list[dict]:
    gaps: list[dict] = []

    for req in STRUCTURAL_REQUIREMENTS:
        rtype = req["type"]

        if rtype == "scalar":
            if not _get_nested(draft, req["field"]):
                gaps.append(req)

        elif rtype == "operating_hours":
            oh = draft.get("operating_hours", {})
            weekdays = ("monday", "tuesday", "wednesday", "thursday", "friday")
            has_slot = any(isinstance(oh.get(d), list) and len(oh[d]) > 0 for d in weekdays)
            if not has_slot:
                gaps.append(req)

        elif rtype == "services_present":
            if not draft.get("services"):
                gaps.append(req)

        elif rtype == "resources_present":
            if not draft.get("resources"):
                gaps.append(req)

        elif rtype == "per_service":
            attr = req["attr"]
            for idx, svc in enumerate(draft.get("services", [])):
                val = svc.get(attr)
                if val is None or val == "":
                    svc_name = svc.get("name", f"Service #{idx + 1}")
                    gaps.append(
                        {
                            **req,
                            "service_idx": idx,
                            "question": req["question"].format(service_name=svc_name),
                        }
                    )

        elif rtype == "per_service_nested":
            for idx, svc in enumerate(draft.get("services", [])):
                val = _get_nested(svc, req["attr"])
                if val is None:
                    svc_name = svc.get("name", f"Service #{idx + 1}")
                    gaps.append(
                        {
                            **req,
                            "service_idx": idx,
                            "question": req["question"].format(service_name=svc_name),
                        }
                    )

    return gaps


def _format_draft_toon(draft: dict) -> str:
    """
    Serializes the draft schema using TOON (Token-Oriented Object Notation).
    Provides optimal token compression for LLM attention while preserving complete schema structure.
    """
    try:
        import toon

        return toon.encode(draft)
    except Exception as e:
        print(f"[TOON Warning] Fallback to json: {e}", flush=True)
        return json.dumps(draft, indent=2)


async def node_load_draft(state: GraphState) -> dict:
    """Entry point. Ensures baseline dict structure."""
    draft = copy.deepcopy(state.get("draft", {}))
    tenant_id = state.get("tenant_id") or draft.get("tenant_id", "")
    agent_id = state.get("agent_id") or draft.get("agent_id") or f"agent_{tenant_id}_v1"
    draft.setdefault("tenant_id", tenant_id)
    draft.setdefault("agent_id", agent_id)
    draft.setdefault("status", "draft")
    draft.setdefault("schema_version", "2.4")
    draft.setdefault("business_profile", {})
    draft.setdefault("operating_hours", {})
    draft.setdefault("services", [])
    draft.setdefault("resources", [])
    gaps = _compute_structural_gaps(draft)
    return {
        "tenant_id": tenant_id,
        "agent_id": agent_id,
        "draft": draft,
        "status": "onboarding",
        "structural_gaps": gaps,
        "pending_field": None,
        "semantic_note": None,
        "decision": None,
        "pending_patches": None,
        "patch_retries": 0,
    }


class SemanticAction(BaseModel):
    action: Literal["update_schema", "ask_user", "finalize"] = Field(
        description="Action to take based on current state"
    )
    question: str = Field(
        description=(
            "MANDATORY. The conversational response and follow-up question sent to the user. "
            "Must ALWAYS be a non-empty string. "
            "When updating the schema ('update_schema'): briefly acknowledge the applied changes (1 sentence) "
            "AND proactively ask the next specific question from the deployment checklist or suggest an optional feature. "
            "For 'ask_user': ask a specific, contextual follow-up question based on what is missing in the draft. "
            "For 'finalize': confirm the save and summarise next steps. "
            "NEVER leave this field empty or null."
        ),
    )
    patches: list[dict] | None = Field(
        default=None,
        description="RFC 6902 JSON Patches to apply whenever user provides configuration details",
    )


async def node_llm_semantic_review(state: GraphState) -> dict:
    """
    Acts as the 'Main Brain' for the semantic phase.
    Decides whether to apply JSON patches, ask the user a question, or finalize setup.
    """
    llm = _get_llm().with_structured_output(SemanticAction)

    all_msgs = state.get("messages", [])
    history_msgs = all_msgs

    history_lines = []
    for m in history_msgs:
        if isinstance(m, SystemMessage):
            continue
        prefix = "Tenant: " if isinstance(m, HumanMessage) else "Agent: "
        c = str(m.content)
        if c.startswith("Tenant: ") or c.startswith("Agent: ") or c.startswith("User: "):
            history_lines.append(c)
        else:
            history_lines.append(f"{prefix}{c}")
    history = "\n".join(history_lines) if history_lines else "No conversation history yet."

    last_msg = all_msgs[-1] if all_msgs else None
    is_system_feedback = isinstance(last_msg, SystemMessage)
    system_feedback_text = str(last_msg.content) if isinstance(last_msg, SystemMessage) else ""

    _early_draft = state.get("draft", {})
    _early_gaps = _compute_structural_gaps(_early_draft)

    post_patch_instruction = ""
    if is_system_feedback:
        post_patch_instruction = f"""
*** SYSTEM EXECUTION FEEDBACK: PREVIOUS PATCH FAILED ***
{system_feedback_text}

CRITICAL RULES FOR RECOVERY:
1. The draft was NOT updated with your patches.
2. You must NOT pretend or tell the user that any changes were applied.
3. Analyze the error above, correct the invalid patch path, field name, or value, and output an 'update_schema' action with corrected patches now.
4. If a field was flagged as extra_forbidden, inspect the allowed schema specification below and use only valid allowed fields.
"""

    summary_block = ""
    tenant_id = state.get("tenant_id")
    agent_id = state.get("agent_id")
    if agent_id:
        try:
            from agent_orchestrator.models import AgentDraft

            ad = await AgentDraft.find_one({"tenant_id": tenant_id, "agent_id": agent_id})
            if ad and ad.conversation_summary:
                summary_block = (
                    f"\nROLLING SUMMARY OF PAST CONVERSATION:\n{ad.conversation_summary}\n"
                )
        except Exception:
            pass

    facts_block = ""
    if agent_id and history_msgs:
        try:
            from agent_orchestrator.utils.embedding_util import embed_query
            from agent_orchestrator.utils.qdrant_util import get_qdrant_store

            last_text = str(history_msgs[-1].content)
            q_vec = await embed_query(last_text)
            facts = await get_qdrant_store().search_relevant_facts(
                q_vec, tenant_id, agent_id, limit=3
            )
            if facts:
                facts_block = (
                    "\nRELEVANT BUSINESS RULES & FACTS RETRIEVED FROM LONG-TERM MEMORY:\n"
                    + "\n".join([f"- {f}" for f in facts])
                    + "\n"
                )
        except Exception:
            pass
    draft = state.get("draft", {})
    gaps = _compute_structural_gaps(draft)
    gaps_block = ""
    if gaps:
        gap_lines = "\n".join([f"- {g['field']}: {g['question']}" for g in gaps])
        gaps_block = f"""
REQUIRED MINIMUM DEPLOYMENT CHECKLIST (These must be configured before the agent can be finalized or deployed live):
{gap_lines}

CONVERSATIONAL GUIDANCE:
- You are holding a natural, consultative setup conversation with the user.
- The user may configure their business in ANY order (e.g. they might describe multiple services first, then set hours, then introduce staff/rooms). NEVER force the user into a rigid sequence.
- INCREMENTAL UPDATES (CRITICAL): The REQUIRED MINIMUM DEPLOYMENT CHECKLIST above applies ONLY to 'finalize' (going live). It is NOT a requirement for 'update_schema'! You MUST apply patches incrementally as details are provided. For example, if the user gives services or business name, apply them immediately to the draft canvas even if phone number, timezone, or resources are still missing. NEVER withhold patches waiting for a "complete" configuration!
- If the user provides service, staff, or business details, generate all required JSON patches immediately.
- If you have just applied patches or if the user asks what to do next, proactively and conversationally prompt for 1 or 2 missing items from the checklist above.
- If there is no conversation history yet, greet the user warmly as their Schedulux AI setup assistant and ask for their business name and what services they provide.
- NEVER guess external user details (phone number, prices, staff names).
- CRITICAL: DO NOT choose 'finalize' if ANY items from the REQUIRED MINIMUM DEPLOYMENT CHECKLIST above are still missing. If the user asks to save/finalize while items are missing, choose 'ask_user' and politely explain what is still needed before going live.
"""

    optional_features_block = """
OPTIONAL FEATURES YOU CAN SUGGEST (Not required to go live, but proactively mention them when relevant):
These features are fully configurable and can dramatically improve the user's booking experience. Suggest them naturally in conversation at the right moment — don't dump them all at once.

1. DEPOSIT / ADVANCE PAYMENT (services[].deposit):
   - Ask: "Would you like to collect an advance deposit for any service? (e.g. ₹500 upfront for a Deep Cleaning)"
   - Relevant when: a service has a non-zero price and deposit is not yet configured.
   - Requires: deposit.required=true, deposit.amount, deposit.processor="upi_direct", deposit.upi_id, deposit.confirmation_method="utr_reference".

2. OTP VERIFICATION POLICY (guardrails.verification_policy):
   - Ask: "Should customers verify via OTP before booking, rescheduling, or cancelling? (Recommended for high-value or deposit-backed services)"
   - Fields: require_otp_for_new_booking, require_otp_for_reschedule, require_otp_for_cancel (all boolean).

3. BLACKOUT / HOLIDAY DATES (operating_hours.blackout_dates):
   - Ask: "Do you have any holidays or days when you'll be closed? I can block those dates out."
   - Relevant when: operating hours are set but no blackout_dates are configured.
   - Format: list of {date: "YYYY-MM-DD", reason: "string", is_closed: true}.

4. CANCELLATION & LEAD TIME POLICY (scheduling_engine):
   - Ask: "How far in advance can customers book? And is there a cancellation window? (e.g. must cancel 24h before appointment)"
   - Fields: cancellation_window_hours, default_lead_time_hours, max_advance_booking_days, hold_duration_minutes.

5. HUMAN HANDOFF / ESCALATION (guardrails.human_handoff):
   - Ask: "If the AI can't handle a query, should it transfer the customer to a human? (e.g. for complex cases or emergencies)"
   - Fields: enabled, trigger_topics, reception_contact, handoff_message.

6. RETURN VISIT REMINDERS (services[].recall_interval_days):
   - Ask: "Should the system remind customers to book again after a set number of days? (e.g. remind dental patients every 180 days)"
   - Relevant when: service is configured but recall_interval_days is null or 0.

7. WIDGET CUSTOMISATION (widget_config):
   - Ask: "Would you like to customise the booking widget? (e.g. chatbot name, greeting message, brand color, or which platforms to enable it on)"
   - Fields: agent_name, initial_greeting, fallback_message, primary_color, platform_sources.

8. SUPERVISOR / CUSTOM AI INSTRUCTIONS (supervisor_prompt):
   - Ask: "Do you want to give the AI any special instructions? (e.g. 'Always upsell the premium package' or 'Never book Sundays')"
   - Field: supervisor_prompt (free-text string).

SUGGESTION TIMING RULES:
- Suggest at most 1 optional feature per turn to avoid overwhelming the user.
- Prioritise suggestions that are MOST RELEVANT to the vertical and current draft state (e.g. suggest deposits for salons/clinics that have priced services; suggest blackout dates after operating hours are set; suggest OTP after services are added).
- If the user declines a suggestion (e.g. "no deposit needed"), do NOT re-suggest it.
- Only suggest optional features AFTER the immediate context/action is resolved (e.g. don't suggest deposits mid-flow while the user is still naming their services).
"""

    prompt = f"""You are the Schedulux AI Configuration Agent.
Your job is to review the JSON draft, apply user changes, and converse with the user to ensure the configuration is logically sound, functional, and complete.
{summary_block}{facts_block}{gaps_block}{optional_features_block}

CRITICAL RULES FOR REASONING & ACTIONS:
1. GRAMMAR & CASING: Automatically correct spelling, casing, and grammar from user messages before generating patches (e.g., "tier punchuree repai" -> "Tire Puncture Repair").
2. SINGLE-TURN PATCHES: If the user provides multiple updates, generate ALL required JSON patches in a SINGLE turn. Do not break them down into multiple turns.
3. ANTI-HALLUCINATION / NEVER GUESS DETAILS:
   - NEVER assume, default, or invent external user details that the user did not provide (specifically: UPI IDs (upi_id), phone numbers, email addresses, or business verticals).
   - Internal system slugs ('resource_id', 'service_id') are NOT user details—always auto-generate them from the name (e.g. "Dr. Shijisha" -> "res_shijisha"). NEVER ask the user for an ID!
4. STRICT JSON FORMATTING (NO COMMENTS):
   - Never include comments (// or /* */) anywhere inside JSON tool arguments. All tool arguments must be 100% strict JSON.

DOMAIN INTEGRITY & DEPENDENCY RULES:
1. DEPOSITS & PAYMENTS (UPI ONLY):
   - Schedulux ONLY supports direct UPI deposit payments. The frontend system automatically generates dynamic payment QR codes for customers directly from the owner's UPI ID.
   - When configuring a deposit (deposit.required is True or deposit.amount > 0):
     * Set `deposit.processor` to "upi_direct" and `deposit.confirmation_method` to "utr_reference".
     * `deposit.upi_id` (e.g., clinic@okhdfcbank or 9876543210@paytm) is MANDATORY for collecting deposits.
     * If the user enables a deposit without providing their UPI ID, apply the deposit amount patch and ASK the user specifically for their UPI ID (e.g., "Please provide your UPI ID for collecting deposit payments."). NEVER ask the user for a QR code image or QR code URL, as the system generates the QR code automatically from their UPI ID.
     * `deposit.amount` cannot exceed `price.amount` (unless `price.type` is "variable" or "starting_at").
     * If `price.type == "free"`, deposit cannot be required (`deposit.required` must be False).
2. CURRENCY SYNCHRONIZATION:
   - If the user specifies prices or deposits in a specific currency (e.g., rupees / INR / ₹, dollars / USD / $, euros / EUR / €, pounds / GBP / £):
     * Synchronize `business_profile.currency` to the standard ISO 3-letter currency code (e.g., "INR", "USD", "EUR", "GBP").
     * Synchronize each modified service's `price.currency` to match.
3. EMERGENCY & HANDOFF GUARDRAILS:
   - If `guardrails.human_handoff.enabled` is True: `reception_contact` and `handoff_message` MUST NOT be empty. If missing, ask the user.
4. HEALTHCARE / HIPAA COMPLIANCE:
   - If `compliance.hipaa_mode` is True: ensure `guardrails.phi_scrubbing.enabled` is True and `compliance.zero_hallucination_mode` is True.
5. SERVICES & RESOURCES (AUTOMATIC SYSTEM ID CREATION):
   - NEVER ASK THE USER FOR A `resource_id` OR `service_id`: End-users speak naturally (e.g. "Add Dr. Shijisha", "she is a staff add her", "Add Deep Cleaning"). Internal technical slugs like `res_...` and `srv_...` are system-managed.
   - ALWAYS automatically derive IDs yourself from entity names:
     * For resources: "res_" + sanitized name (e.g., "Dr. Shijisha" -> `res_shijisha`, "Nurse Bob" -> `res_nurse_bob`, "Chair 1" -> `res_chair_1`).
     * For services: "srv_" + sanitized name (e.g., "Deep Cleaning" -> `srv_deep_cleaning`).
   - WHEN THE USER SAYS TO ADD A RESOURCE (e.g. "Add Dr. Shijisha", "she is a staff add her", "Add Room 2"):
     * Choose 'update_schema' IMMEDIATELY.
     * Generate an 'add' JSON patch appending to `/resources/-` with:
       {{"resource_id": "res_<sanitized_name>", "resource_type": "staff" (or "room" / "chair" / "bay" / "equipment" if physical), "name": "<Resource Name>", "title": "Specialist", "category": "General", "description": "", "is_bookable": true, "dispatch_status": "active", "custom_shift_overrides": {{}}}}
     * DO NOT ask the user for `resource_id`, title, or category as a blocker. Add the resource to the canvas first, and let the user refine optional details later if they want.
   - AT LEAST ONE RESOURCE IS MANDATORY: `resources[]` MUST contain at least one bookable resource (a staff member or a physical asset like a room, chair, or bay). If `resources[]` is empty, you CANNOT finalize; you MUST choose 'ask_user' and ask who or what delivers their service.
    - RESOURCE-TO-SERVICE LINKING & RESOURCE REQUIREMENTS (ENTERPRISE MODEL):
      * `services[].resource_requirements` is the ONLY place where required resources and providers are defined. Each requirement item contains:
        {{"role": "<Role Name e.g. Lead Doctor, Room, Bay, Therapist>", "resource_type": "staff"|"room"|"chair"|"bay"|"equipment"|"asset", "count": 1, "eligible_resource_ids": ["res_..."], "selection_mode": "user_selectable"|"auto_assign"}}
      * INTELLIGENT SELECTION MODE (`selection_mode`):
        - Set `selection_mode: "user_selectable"` for human specialists (Doctors, Stylists, Consultants) where clients can pick a preferred person, OR for bookable spaces/units (Hotel Rooms, Conference Rooms).
        - Set `selection_mode: "auto_assign"` for internal clinic equipment, dental chairs, operation bays, or vehicles that the system should automatically lock behind the scenes without asking the client.
        - DO NOT interrogate the user with tedious questions for internal equipment like chairs or bays; deduce it automatically! Only ask if truly ambiguous (e.g., "Do guests select their specific cabin, or is it auto-assigned upon arrival?").
      * `count` indicates how many simultaneous resources are required from that pool (e.g. `count: 2` for a couples massage requiring 2 therapists from a pool of 5). Default is 1.
      * WHENEVER you add or modify resources, you MUST ALSO emit patches to update `resource_requirements` on the matching service(s) IN THE SAME PATCH BATCH.
      * Match resources to services by type/category/name context (e.g. AC rooms → AC Homestay service, Non-AC rooms → Non-AC Homestay service, staff doctor → consultation service).
      * EXAMPLE: User says "I have 3 AC rooms: 300, 301, 302 and 2 Non-AC rooms: 400, 401":
        - Patches to add resources: `add /resources/- {{res_room_300...}}`, `add /resources/- {{res_room_301...}}`, etc.
        - ALSO add patches to link: `replace /services/0/resource_requirements [{{"role": "Room", "resource_type": "room", "count": 1, "eligible_resource_ids": ["res_room_300","res_room_301","res_room_302"], "selection_mode": "user_selectable"}}]` (for AC Homestay at index 0)
        - AND: `replace /services/1/resource_requirements [{{"role": "Room", "resource_type": "room", "count": 1, "eligible_resource_ids": ["res_room_400","res_room_401"], "selection_mode": "user_selectable"}}]` (for Non-AC Homestay at index 1)
      * NEVER leave `resource_requirements` empty or with empty `eligible_resource_ids` on any service that has corresponding resources in `resources[]`.
   - INTELLIGENT BOOKING MODE DETERMINATION (`booking_mode`):
     Every service MUST have `booking_mode` set to EXACTLY one of these two lowercase string enums:
       * "time_slot"
       * "date_range"
     CRITICAL: Never output invalid variations such as "timeslot", "time-slot", "TimeSlot", "daterange", "date-range", "daily", or "hourly".

     * HOW TO CHOOSE "time_slot":
       - Use for intraday appointments and services booked at specific clock hours/minutes (e.g., 10:00 AM, 2:30 PM) where the customer arrives, receives the service, and leaves on the same day.
       - Applicable Verticals & Use Cases:
         • Automotive & Repair: Car wash, detailing, oil change, tire repair/replacement, wheel alignment, brake inspection.
         • Medical & Healthcare: Doctor consultations, dental cleaning, root canal, therapy sessions, clinical visits.
         • Salons & Spas: Haircuts, styling, beard trim, hair coloring, manicure, pedicure, facials, massage.
         • Fitness & Wellness: Personal training sessions, gym classes, yoga sessions, court bookings.
         • Professional Services: Legal consultations, accounting/tax meetings, tutoring sessions, business advisory.
         • Home Services: Plumbing repairs, AC maintenance, electrician visits, house cleaning by hour.
       - Requirement: `duration_minutes` MUST be > 0 (e.g. 15, 30, 45, 60, 90, 120 minutes).

     * HOW TO CHOOSE "date_range":
       - Use for multi-day, overnight, or calendar-date spanning bookings where the customer books from a start date (check-in) to an end date (check-out) without hourly minute slots.
       - Applicable Verticals & Use Cases:
         • Hospitality & Lodging: Hotel room stays, resort reservations, Airbnb/vacation rental villas, campgrounds, hostel beds.
         • Vehicle & Equipment Rentals: Car rentals (daily/weekly), bike hire, construction/heavy equipment rental, camera/AV gear daily hire.
         • Pet Boarding: Overnight pet boarding, dog kennel stays.
         • Event Spaces & Venues: Multi-day conference hall hire, exhibition booths, wedding venue daily booking.
       - Requirement: `duration_minutes` is 0 or 1440 (full day); booking availability is calculated by calendar dates.

     * SCHEDULING ENGINE BOOKING MODE SYNCHRONIZATION:
       - Keep `scheduling_engine.booking_mode` synchronized:
         • Set to "date_range" if the business primarily offers overnight stays or multi-day rentals (hotels, car rental agencies).
         • Set to "time_slot" if the business primarily offers slot-based appointments (auto shops, clinics, salons, consulting).
6. PER-SERVICE OTP VERIFICATION (`services[].verification.require_otp`):
   - Individual services can have their own OTP verification rule overriding the global baseline:
     * Set `services[].verification.require_otp` to True if the user asks for OTP on a specific service (e.g. "require OTP verification for root canal", "overnight rooms need OTP verification") or for high-value / deposit-backed services.
     * Set to False if the user explicitly wants low-friction, instant bookings without OTP (e.g. "no OTP for standard wash", "anyone can book consultation without verification").
     * If not mentioned, omit or leave null to automatically inherit the global `guardrails.verification_policy.require_otp_for_new_booking`.
7. AVOID REPEATED QUESTIONS:
   - Do NOT re-ask questions that the user already answered or declined in recent conversation.
8. BUSINESS TIMEZONE (MANDATORY FOR CALENDAR ACCURACY):
   - Operating hours, service durations, and appointment slots are meaningless without an accurate business timezone.
   - Schedulux requires standard IANA timezone identifiers (e.g., "Asia/Kolkata", "America/New_York", "America/Los_Angeles", "Europe/London", "Asia/Dubai", etc.).
   - If the user mentions a location, state, city, or local timezone acronym (e.g., "we're in California", "Mumbai", "London", "EST", "IST"), map it to the proper IANA timezone (e.g. "America/Los_Angeles", "Asia/Kolkata", "Europe/London", "America/New_York") and generate an update_schema patch for `/business_profile/timezone`.
   - Timezone is a mandatory deployment item: if `business_profile.timezone` is missing from the checklist, actively ask the user what timezone their business operates in before finalizing.
{post_patch_instruction}
CRITICAL: When generating JSON patches, you MUST use ONLY these exact fields:
- business_profile: name, vertical, timezone, locale, currency, address
- business_profile.contact: support_email, public_phone, escalation_phone
- business_profile.terminology: customer_singular, customer_plural, primary_metric, action_metric
- business_profile.brand: primary_color, logo_url
- services[]: service_id, name, category, description, duration_minutes, buffer_minutes, booking_mode ("time_slot"|"date_range"), resource_requirements, recall_interval_days
- services[].resource_requirements[]: role, resource_type, count, eligible_resource_ids, selection_mode ("user_selectable"|"auto_assign")
- services[].price: type (fixed|starting_at|hourly|free|custom), amount, currency
- services[].deposit: required, amount, processor ("upi_direct"), upi_id, qr_code_url, confirmation_method ("utr_reference"), payment_instructions
- services[].verification: require_otp (boolean|null)
- resources[]: resource_id, resource_type (staff|room|chair|bay|equipment|asset|vehicle), name, title, category, description, is_bookable, dispatch_status (active|on_leave|maintenance|retired|inactive), custom_shift_overrides
- operating_hours: monday, tuesday, wednesday, thursday, friday, saturday, sunday (each is list of {{start: "HH:MM", end: "HH:MM"}}), blackout_dates (list of {{date: "YYYY-MM-DD", reason, is_closed}})
- scheduling_engine: booking_mode ("time_slot"|"date_range"), default_lead_time_hours, max_advance_booking_days, cancellation_window_hours, hold_duration_minutes
- widget_config: agent_name, avatar_url, initial_greeting, fallback_message, position, launcher_style, sound_on_load, auto_expand_delay_seconds, platform_sources, whitelisted_domains
- compliance: hipaa_mode, phi_scrubbing, data_retention_policy, zero_hallucination_mode, audit_trail_enabled
- guardrails.verification_policy: require_otp_for_new_booking, require_otp_for_reschedule, require_otp_for_cancel
- guardrails.phi_scrubbing: enabled, policy, description, hipaa_compliant
- guardrails.triage_emergency: enabled, keywords, response_override
- guardrails.human_handoff: enabled, trigger_topics, reception_contact, handoff_message
- supervisor_prompt: (string)

Current Draft (Token-Optimized TOON Notation):
{_format_draft_toon(state["draft"])}

NOTE ON TOON NOTATION:
The draft above is formatted in TOON (Token-Oriented Object Notation) for optimal token efficiency.
- Arrays (e.g. `services[N]`, `resources[N]`) declare keys in `{{...}}` headers followed by compact data rows, or YAML lists with `-`.
- Array rows correspond to 0-indexed elements (row 1 is index 0, row 2 is index 1, etc.) for your RFC 6902 patch paths (e.g. `/services/0/price/amount`).

Recent Conversation:
{history}

Decide your next action:
CRITICAL ACTION SELECTION RULES (STRICT PRIORITY):
1. 'update_schema' (HIGHEST PRIORITY):
   - Whenever the user provides ANY configuration detail (e.g. business name, vertical, timezone, hours, services, prices, resources/rooms/staff, phone number), you MUST choose 'update_schema' and output the RFC 6902 JSON patches.
   - You MUST NOT choose 'ask_user' when the user provides configuration details, even if other checklist items or mandatory fields are still missing!
   - SINGLE-TURN DUAL OUTPUT: In the SAME turn that you emit patches, your 'question' field must BOTH:
     1) Confirm the update in 1 natural sentence (e.g., "I've added Dr. Shijisha as a resource and updated your business hours.").
     2) Proactively ask the user for the NEXT missing item from the REQUIRED MINIMUM DEPLOYMENT CHECKLIST (e.g., "What are your services or pricing?").
   - NEVER pretend or say in text "I've set your business name to..." or "I've updated..." unless you are also generating the patches for it right now.
2. 'ask_user':
   - Choose 'ask_user' if the user asked a question, sent a greeting, or if no new configuration details were provided in their message.
3. 'finalize':
   - ONLY choose this if the user EXPLICITLY requested to save, finalize, or deploy the agent (e.g. "save changes", "looks good, save it", "deploy now") AND all mandatory checklist items are complete. Never finalize on a routine modification without explicit user confirmation.

CRITICAL OUTPUT RULE — QUESTION FIELD IS MANDATORY:
- You MUST always populate the `question` field. It must NEVER be empty, null, or a generic filler like "Do you have any more changes?".
- For 'update_schema': acknowledge what you updated in 1 sentence AND proactively prompt for the next missing item from the REQUIRED MINIMUM DEPLOYMENT CHECKLIST or suggest a relevant optional feature.
  Example: "I've updated your business timezone to Asia/Kolkata. What are your operating hours during the week?"
- For 'ask_user': ask a SPECIFIC, CONTEXTUAL question based on what is still missing in the draft (use the REQUIRED MINIMUM DEPLOYMENT CHECKLIST above or the OPTIONAL FEATURES list). Examples:
    * "What are your weekly operating hours? (e.g. Mon–Fri 9am–6pm, Sat 10am–2pm, closed Sun)"
    * "Who delivers your AC Home Stay service — should I create a room like 'Room 301' as a resource?"
    * "Would you like to collect an advance deposit for AC Home Stay bookings?"
- For 'finalize': confirm the action (e.g. "✅ Your agent is now live! Customers can start booking.").
- FAILURE TO FILL `question` WILL BREAK THE FRONTEND — the user will see a blank message.
"""

    try:
        print("Start streaming", flush=True)
        resp = cast(
            SemanticAction,
            await llm.ainvoke(
                [SystemMessage(content="You are a Schedulux agent."), HumanMessage(content=prompt)]
            ),
        )
        print("End streaming", flush=True)
    except Exception as e:
        print(f"[Semantic Agent Error] {e}", flush=True)

        gemini_api_key = (
            os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY") or _GEMINI_API_KEY
        )
        if gemini_api_key:
            try:
                print("[Semantic Agent] Attempting fallback to Gemini...", flush=True)
                fallback_model = os.environ.get("GEMINI_MODEL", "gemini-1.5-flash")
                fallback_llm = ChatGoogleGenerativeAI(
                    model=fallback_model,
                    google_api_key=gemini_api_key,
                    temperature=0.1,
                    max_output_tokens=8192,
                ).with_structured_output(SemanticAction)
                resp = cast(
                    SemanticAction,
                    await fallback_llm.ainvoke(
                        [
                            SystemMessage(content="You are a Schedulux agent."),
                            HumanMessage(content=prompt),
                        ]
                    ),
                )
                print("[Semantic Agent] Fallback to Gemini succeeded!", flush=True)
            except Exception as fe:
                print(f"[Semantic Agent Fallback Error] {fe}", flush=True)
                return {
                    "decision": "ask_user",
                    "pending_patches": None,
                    "semantic_note": "I encountered an error processing that update. Would you like to try again?",
                }
        else:
            return {
                "decision": "ask_user",
                "pending_patches": None,
                "semantic_note": "I encountered an error processing that update. Would you like to try again?",
            }

    follow_up = (resp.question or "").strip()
    if not follow_up:
        if _early_gaps:
            follow_up = f"I've updated your configuration. {_early_gaps[0]['question']}"
        else:
            follow_up = "Configuration updated. What would you like to configure next?"

    if resp.patches:
        print(
            f"[Semantic Agent Brain] Decided to update schema with {len(resp.patches)} patches.",
            flush=True,
        )
        return {
            "decision": "update_schema",
            "pending_patches": resp.patches,
            "semantic_note": follow_up,
        }

    if resp.action == "ask_user":
        print(f"[Semantic Agent Brain] Asking: {follow_up[:120]}", flush=True)
        return {
            "decision": "ask_user",
            "pending_patches": None,
            "semantic_note": follow_up,
        }
    elif resp.action == "finalize":
        print("[Semantic Agent Brain] Finalizing setup.", flush=True)
        return {
            "decision": "finalize",
            "pending_patches": None,
            "semantic_note": follow_up
            or "✅ Your agent configuration has been saved and deployed live!",
        }
    else:
        return {
            "decision": "ask_user",
            "pending_patches": None,
            "semantic_note": follow_up,
        }


from agent_orchestrator.models import StrictDraftPatchValidator


def _prepare_draft_for_patches(draft: dict, patches: list[dict]) -> tuple[dict, list[dict]]:
    """
    1. Auto-vivifies None parent objects into empty dicts along patch target paths.
       Prevents jsonpatch from raising 'Document <class NoneType> does not support indexing'
       when setting child fields like /business_profile/contact/public_phone where contact is None.
    2. LLM-Tolerant Patch Normalization:
       If the LLM emits op='replace' targeting an object property that does not exist yet,
       auto-heals op to 'add' (which creates or updates in RFC 6902), preventing
       'can't replace a non-existent object' exceptions.
    """
    d = copy.deepcopy(draft)
    normalized_patches: list[dict] = []
    for p in patches:
        p_norm = copy.deepcopy(p)
        parts = [s for s in p_norm.get("path", "").split("/") if s]
        if parts:
            curr = d
            for i, seg in enumerate(parts[:-1]):
                if isinstance(curr, dict):
                    if curr.get(seg) is None:
                        next_seg = parts[i + 1]
                        if next_seg == "-" or next_seg.isdigit():
                            curr[seg] = []
                        else:
                            curr[seg] = {}
                    curr = curr[seg]
                elif isinstance(curr, list) and seg.isdigit():
                    idx = int(seg)
                    if 0 <= idx < len(curr):
                        curr = curr[idx]

            leaf = parts[-1]
            if p_norm.get("op") == "replace":
                if isinstance(curr, dict) and leaf not in curr:
                    p_norm["op"] = "add"
                elif isinstance(curr, list) and leaf == "-":
                    p_norm["op"] = "add"

        normalized_patches.append(p_norm)
    return d, normalized_patches


async def node_apply_json_patches(state: GraphState) -> dict:
    """
    Execution / Tool Node: Applies RFC 6902 JSON patches to the draft.
    Keeps mutation and side-effects strictly separate from LLM decision making.
    Writes the patched draft directly to Redis cache and keeps state in LangGraph memory (0 MongoDB hits).
    """
    patches = state.get("pending_patches") or []
    if not patches:
        return {"decision": None, "pending_patches": None}

    try:
        prepared_draft, normalized_patches = _prepare_draft_for_patches(state["draft"], patches)
        patcher = jsonpatch.JsonPatch(normalized_patches)
        updated_draft = patcher.apply(prepared_draft)

        StrictDraftPatchValidator.model_validate(updated_draft)

        tenant_id = state.get("tenant_id", "")
        agent_id = state.get("agent_id") or updated_draft.get("agent_id", "")

        if tenant_id and agent_id:
            try:
                from agent_orchestrator.clients.redis_client import set_cached_draft

                await set_cached_draft(tenant_id, agent_id, updated_draft)
            except Exception as re:
                print(f"[Patch Node] Redis cache write warning: {re}", flush=True)

        print(
            f"[Patch Node] Applied {len(patches)} patches to draft and passed schema validation (cached in Redis).",
            flush=True,
        )
        return {
            "draft": updated_draft,
            "decision": "ask_user",
            "pending_patches": None,
            "patch_retries": 0,
            "structural_gaps": _compute_structural_gaps(updated_draft),
            "semantic_note": state.get("semantic_note"),
        }
    except Exception as e:
        retries = state.get("patch_retries", 0) + 1
        print(
            f"[Patch Node Error] Failed applying patches (or validation) [retry {retries}/3]: {e}",
            flush=True,
        )
        if retries >= 3:
            print(
                f"[Patch Node Error] Max retries reached ({retries}). Breaking loop to ask user.",
                flush=True,
            )
            return {
                "decision": "ask_user",
                "pending_patches": None,
                "patch_retries": 0,
                "semantic_note": (
                    f"I encountered an error updating the draft configuration: {e}. "
                    "Could you please clarify or provide the details again?"
                ),
            }
        return {
            "decision": None,
            "pending_patches": None,
            "patch_retries": retries,
            "messages": [
                SystemMessage(
                    content=f"Error applying JSON patches: {e}. The draft was NOT updated. Please generate a corrected patch."
                )
            ],
        }


async def node_ask_human_semantic(state: GraphState) -> dict:
    """
    Interrupts the graph to ask the human the semantic agent's question.
    Records the Q&A in the conversation history and loops back to the agent.
    Defers writing the consolidated MongoDB AgentDraft checkpoint to here (once per conversational turn).
    """
    tenant_id = state.get("tenant_id", "")
    agent_id = state.get("agent_id") or state.get("draft", {}).get("agent_id", "")
    current_draft = state.get("draft", {})
    question = state.get("semantic_note") or ""

    if tenant_id and agent_id and current_draft:
        try:
            import secrets

            from agent_orchestrator.models import AgentDraft, init_db

            await init_db()
            agent_draft = await AgentDraft.find_one({"tenant_id": tenant_id, "agent_id": agent_id})
            if agent_draft:
                last_msgs = state.get("messages", [])
                last_user_prompt = ""
                for m in reversed(last_msgs):
                    if isinstance(m, HumanMessage):
                        last_user_prompt = str(m.content)
                        break

                agent_draft.add_checkpoint(
                    checkpoint_id=f"cp_{secrets.token_hex(4)}",
                    message_id=f"msg_{secrets.token_hex(4)}",
                    draft_snapshot=current_draft,
                    user_prompt=last_user_prompt[:200] if last_user_prompt else "",
                    summary=state.get("semantic_note") or "Updated schema draft",
                )
                await agent_draft.save()
                print(
                    f"[Ask Human Node] Persisted turn checkpoint to AgentDraft ({tenant_id}/{agent_id})",
                    flush=True,
                )
        except Exception as e:
            print(
                f"[Ask Human Node Warning] Failed to persist AgentDraft turn checkpoint: {e}",
                flush=True,
            )

    return {
        "decision": "ask_user",
        "semantic_note": question,
        "status": "awaiting_input",
        "messages": [AIMessage(content=question)],
    }


async def node_finalize_and_save(state: GraphState) -> dict:
    """
    Stamps the config as live and upserts to MongoDB via Beanie.
    One live config per tenant (upsert by tenant_id).
    """
    from agent_orchestrator.models import (
        AgentRuntimeConfig,
        init_db,
    )

    await init_db()

    draft = state.get("draft") or {}
    tenant_id = state.get("tenant_id") or draft.get("tenant_id", "")
    agent_id = draft.get("agent_id") or state.get("agent_id") or f"agent_{tenant_id}_v1"

    sync_result: dict = {}
    try:
        from agent_orchestrator.clients.scheduling_client import sync_agent_inventory

        sync_result = await sync_agent_inventory(tenant_id, agent_id, draft)
        if sync_result.get("success"):
            draft = sync_result["draft"]
            print(
                f"[TenantAgent] Inventory sync succeeded ({sync_result.get('resources_synced')} resources, {sync_result.get('services_synced')} services)",
                flush=True,
            )
        else:
            print(
                f"[TenantAgent Warning] Inventory sync warning: {sync_result.get('error')}",
                flush=True,
            )
    except Exception as se:
        print(f"[TenantAgent Warning] Unexpected exception during inventory sync: {se}", flush=True)

    agent_id = draft.get("agent_id") or state.get("agent_id") or f"agent_{tenant_id}_v1"

    import secrets

    from agent_orchestrator.models import AgentDraft, canonicalize_agent_schema

    agent_draft = await AgentDraft.find_one({"tenant_id": tenant_id, "agent_id": agent_id})
    draft_source = (
        (agent_draft.creation_source if agent_draft and agent_draft.creation_source else None)
        or draft.get("creation_source")
        or draft.get("business_profile", {}).get("vertical")
        or "custom"
    )

    existing_config = await AgentRuntimeConfig.find_one(
        {"tenant_id": tenant_id, "agent_id": agent_id}
    )
    if not existing_config:
        existing_config = AgentRuntimeConfig(
            tenant_id=tenant_id,
            agent_id=agent_id,
        )
    draft["creation_source"] = draft_source
    draft["status"] = "live"
    canonical_draft = canonicalize_agent_schema(draft, status="live")

    cfg_obj = AgentRuntimeConfig(**canonical_draft)
    existing_config.schema_version = cfg_obj.schema_version
    existing_config.status = "live"
    existing_config.creation_source = cfg_obj.creation_source
    existing_config.compiled_at = datetime.now(UTC)
    existing_config.business_profile = cfg_obj.business_profile
    existing_config.operating_hours = cfg_obj.operating_hours
    existing_config.scheduling_engine = cfg_obj.scheduling_engine
    existing_config.services = cfg_obj.services
    existing_config.resources = cfg_obj.resources
    existing_config.guardrails = cfg_obj.guardrails
    existing_config.widget_config = cfg_obj.widget_config
    existing_config.llm_engine = cfg_obj.llm_engine
    existing_config.knowledge_base = cfg_obj.knowledge_base
    existing_config.sub_agents = cfg_obj.sub_agents
    existing_config.integrations = cfg_obj.integrations
    existing_config.subscription = cfg_obj.subscription
    existing_config.supervisor_prompt = cfg_obj.supervisor_prompt
    await existing_config.save()

    try:
        if agent_draft:
            agent_draft.add_checkpoint(
                checkpoint_id=f"cp_{secrets.token_hex(4)}",
                message_id="finalized",
                draft_snapshot=canonical_draft,
                summary="Finalized and deployed to live",
            )
            agent_draft.current_draft = canonical_draft
            agent_draft.status = "created"
            agent_draft.updated_at = datetime.now(UTC)
            await agent_draft.save()
    except Exception as ade:
        print(f"[TenantAgent Warning] Failed to update AgentDraft on finalize: {ade}", flush=True)

    try:
        from agent_orchestrator.clients.redis_client import set_cached_draft

        await set_cached_draft(tenant_id, agent_id, canonical_draft)
    except Exception as re:
        print(f"[TenantAgent Warning] Failed to update Redis cache on finalize: {re}", flush=True)

    return {
        "status": "complete",
        "draft": canonical_draft,
    }


async def node_block_incomplete_finalize(state: GraphState) -> dict:
    """
    Safety Gatekeeper: Intercepts premature finalize attempts when minimum deployment checklist items are still missing.
    Sets a polite, clear explanation in semantic_note and directs to ask_human_semantic.
    """
    draft = state.get("draft", {})
    gaps = _compute_structural_gaps(draft)
    missing_desc = "\n".join(
        [f"• {g['field'].replace('_', ' ').title()}: {g['question']}" for g in gaps]
    )
    note = (
        f"We cannot finalize and deploy your agent just yet because a few required configuration items are still missing:\n\n"
        f"{missing_desc}\n\n"
        f"Could you please provide these details so we can complete your setup?"
    )
    return {
        "decision": "ask_user",
        "semantic_note": note,
        "structural_gaps": gaps,
        "status": "awaiting_input",
    }


def route_semantic(state: GraphState) -> str:
    """
    Routes from semantic review based on the explicit decision state:
      - 'update_schema' -> apply_json_patches
      - 'ask_user'      -> ask_human_semantic
      - 'finalize'      -> block_incomplete_finalize (if checklist gaps remain) else finalize_and_save
    """
    decision = state.get("decision")
    if decision == "update_schema":
        return "apply_json_patches"
    elif decision == "ask_user":
        return "ask_human_semantic"
    elif decision == "finalize":
        draft = state.get("draft", {})
        gaps = _compute_structural_gaps(draft)
        if gaps:
            return "block_incomplete_finalize"
        return "finalize_and_save"
    return "ask_human_semantic"


def route_after_patch(state: GraphState) -> str:
    """
    Routes from patch application node:
      - If patches were applied or max retries were exceeded (decision == 'ask_user'), routes directly to ask_human_semantic.
      - Otherwise (patch failed and retries < 3), returns to LLM semantic review for self-correction.
    """
    if state.get("decision") == "ask_user":
        return "ask_human_semantic"
    return "llm_semantic_review"


def build_tenant_onboarding_graph():
    """Compiles and returns the LangGraph StateGraph without in-memory checkpointing dependency."""
    builder = StateGraph(GraphState)

    builder.add_node("load_draft", node_load_draft)
    builder.add_node("llm_semantic_review", node_llm_semantic_review)
    builder.add_node("apply_json_patches", node_apply_json_patches)
    builder.add_node("ask_human_semantic", node_ask_human_semantic)
    builder.add_node("block_incomplete_finalize", node_block_incomplete_finalize)
    builder.add_node("finalize_and_save", node_finalize_and_save)

    builder.set_entry_point("load_draft")
    builder.add_edge("load_draft", "llm_semantic_review")

    builder.add_conditional_edges(
        "llm_semantic_review",
        route_semantic,
        {
            "apply_json_patches": "apply_json_patches",
            "ask_human_semantic": "ask_human_semantic",
            "block_incomplete_finalize": "block_incomplete_finalize",
            "finalize_and_save": "finalize_and_save",
        },
    )

    builder.add_conditional_edges(
        "apply_json_patches",
        route_after_patch,
        {
            "ask_human_semantic": "ask_human_semantic",
            "llm_semantic_review": "llm_semantic_review",
        },
    )
    builder.add_edge("block_incomplete_finalize", "ask_human_semantic")
    builder.add_edge("ask_human_semantic", END)
    builder.add_edge("finalize_and_save", END)

    return builder.compile()


_graph = build_tenant_onboarding_graph()


async def start_onboarding_session(tenant_id: str, draft: dict, agent_id: str = "") -> dict:
    """
    Starts (or restarts) an onboarding session for a tenant agent.

    Args:
        tenant_id: Schedulux tenant ID
        draft:     Pre-populated dict from web crawl OR empty {} for template path
        agent_id:  Optional agent ID — used together with tenant_id for thread_id

    Returns:
        {
          "status":   "awaiting_input" | "complete",
          "question": str | None,
          "field":    str | None,
          "type":     "structural_gap" | "semantic_review" | None,
        }
    """
    target_agent_id = agent_id or draft.get("agent_id") or f"agent_{tenant_id}_v1"
    draft["agent_id"] = target_agent_id

    initial: GraphState = {
        "tenant_id": tenant_id,
        "agent_id": target_agent_id,
        "draft": draft,
        "messages": [],
        "structural_gaps": [],
        "pending_field": None,
        "semantic_note": None,
        "decision": None,
        "pending_patches": None,
        "status": "onboarding",
        "patch_retries": 0,
    }

    try:
        from agent_orchestrator.clients.redis_client import set_cached_draft

        await set_cached_draft(tenant_id, target_agent_id, draft)
    except Exception as e:
        print(f"[Start Session Warning] Failed to prime Redis cache: {e}", flush=True)

    result_state = await _graph.ainvoke(initial)
    return _extract_payload(result_state)


async def resume_onboarding_session(tenant_id: str, user_answer: str, agent_id: str = "") -> dict:
    from agent_orchestrator.clients.redis_client import get_cached_draft

    draft = await get_cached_draft(tenant_id, agent_id)
    if not draft and agent_id:
        try:
            from agent_orchestrator.models import AgentDraft, AgentRuntimeConfig

            ad = await AgentDraft.find_one({"tenant_id": tenant_id, "agent_id": agent_id})
            if ad and ad.current_draft:
                draft = ad.current_draft
            else:
                cfg = await AgentRuntimeConfig.find_one(
                    {"tenant_id": tenant_id, "agent_id": agent_id}
                )
                if cfg:
                    from agent_orchestrator.models import canonicalize_agent_schema

                    draft = canonicalize_agent_schema(cfg.model_dump(), status="live")
        except Exception:
            pass

    if not draft:
        draft = {"tenant_id": tenant_id, "agent_id": agent_id}

    target_agent_id = agent_id or draft.get("agent_id") or f"agent_{tenant_id}_v1"

    recent_history: list[HumanMessage | AIMessage] = []
    if target_agent_id:
        try:
            from agent_orchestrator.models import AgentDraft, AgentMessage

            agent_draft_doc = await AgentDraft.find_one(
                {"tenant_id": tenant_id, "agent_id": target_agent_id}
            )
            last_summarized = agent_draft_doc.last_summarized_seq if agent_draft_doc else 0

            active_db_msgs = (
                await AgentMessage.find(
                    {
                        "tenant_id": tenant_id,
                        "agent_id": target_agent_id,
                        "seq": {"$gt": last_summarized},
                    }
                )
                .sort("seq")
                .to_list()
            )

           
            from agent_orchestrator.config import MEMORY_TRIGGER_TOKEN_THRESHOLD

            total_active_tokens = sum(
                (m.token_count or max(1, len(m.content) // 4)) for m in active_db_msgs
            )
            if total_active_tokens > MEMORY_TRIGGER_TOKEN_THRESHOLD:
                budget = MEMORY_TRIGGER_TOKEN_THRESHOLD
                kept: list[AgentMessage] = []
                for m in reversed(active_db_msgs):
                    t = m.token_count or max(1, len(m.content) // 4)
                    if budget - t < 0 and kept:
                        break
                    kept.append(m)
                    budget -= t
                active_db_msgs = list(reversed(kept))

            for m in active_db_msgs:
                if m.role in ("tenant", "user"):
                    recent_history.append(HumanMessage(content=m.content))
                else:
                    recent_history.append(AIMessage(content=m.content))
        except Exception as rhe:
            print(f"[TenantAgent Warning] Could not rehydrate recent history: {rhe}", flush=True)

    initial: GraphState = {
        "tenant_id": tenant_id,
        "agent_id": target_agent_id,
        "draft": draft,
        "messages": recent_history,
        "structural_gaps": [],
        "pending_field": None,
        "semantic_note": f"User requested change: {user_answer}",
        "decision": None,
        "pending_patches": None,
        "status": "onboarding",
        "patch_retries": 0,
    }

    result_state = await _graph.ainvoke(initial)
    return _extract_payload(result_state)


async def get_current_draft(tenant_id: str, agent_id: str = "") -> dict:
    if agent_id:
        try:
            from agent_orchestrator.clients.redis_client import (
                get_cached_draft,
                set_cached_draft,
            )
            from agent_orchestrator.models import (
                AgentDraft,
                canonicalize_agent_schema,
                init_db,
            )

            cached = await get_cached_draft(tenant_id, agent_id)
            if cached:
                return canonicalize_agent_schema(cached, status="draft")

            await init_db()
            doc = await AgentDraft.find_one({"tenant_id": tenant_id, "agent_id": agent_id})
            if doc and doc.current_draft:
                canonical = canonicalize_agent_schema(doc.current_draft, status="draft")

                try:
                    await set_cached_draft(tenant_id, agent_id, canonical)
                except Exception:
                    pass
                return canonical

        except Exception as e:
            print(f"[get_current_draft Warning] {e}", flush=True)

    return {}


def _extract_payload(snapshot: Any) -> dict:
    """Converts a LangGraph snapshot or state dict into a clean frontend-ready payload."""
    if isinstance(snapshot, dict):
        values = snapshot
    elif hasattr(snapshot, "values") and isinstance(snapshot.values, dict):
        values = snapshot.values
    else:
        values = {}

    if values.get("status") == "complete":
        return {"status": "complete", "question": None, "field": None, "type": None}

    question = values.get("semantic_note") or ""
    return {
        "status": values.get("status", "awaiting_input"),
        "question": question,
        "field": values.get("pending_field") or "",
        "type": "semantic_review",
    }
