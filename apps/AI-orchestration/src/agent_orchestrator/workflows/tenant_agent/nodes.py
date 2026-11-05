from __future__ import annotations

import copy
import os
import secrets
from datetime import UTC, datetime
from typing import cast

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI

from agent_orchestrator.models import StrictDraftPatchValidator
from agent_orchestrator.workflows.tenant_agent.state import GraphState, SemanticAction
from agent_orchestrator.workflows.tenant_agent.tools import apply_draft_merge
from agent_orchestrator.workflows.tenant_agent.utils import (
    _compute_structural_gaps,
    _format_draft_toon,
    _get_llm,
)


async def node_load_draft(state: GraphState) -> dict:
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
        "pending_draft_update": None,
        "patch_retries": 0,
    }


async def node_llm_semantic_review(state: GraphState) -> dict:
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
*** SYSTEM EXECUTION FEEDBACK: PREVIOUS UPDATE FAILED ***
{system_feedback_text}

CRITICAL RULES FOR RECOVERY:
1. The draft was NOT updated with your previous update.
2. You must NOT pretend or tell the user that any changes were applied.
3. Analyze the error above, correct the invalid field name, structure, or value, and output an 'update_schema' action with a corrected draft_update now.
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
- You are holding a natural, consultative setup conversation with the user as their Lead Operations Architect and Business Mentor.
- The user may configure their business in ANY order (e.g. they might explore concepts first, describe multiple services, then set hours, then introduce staff/rooms). NEVER force the user into a rigid sequence or checklist interrogation.
- INCREMENTAL UPDATES (CRITICAL): The REQUIRED MINIMUM DEPLOYMENT CHECKLIST above applies ONLY to 'finalize' (going live). It is NOT a requirement for 'update_schema'! You MUST apply updates incrementally in `draft_update` as details are provided. NEVER withhold updates waiting for a "complete" configuration, and NEVER bombard the user with missing administrative fields when they are discussing services or workflow.
- If the user provides service, staff, or business details, generate all required updates in `draft_update` immediately.
- If the user asks how to build an agent or how appointments work in their industry, answer thoroughly with domain blueprints, explain the customer booking flow, and offer starter templates.
- If there is no conversation history yet, greet the user warmly as their Schedulux Lead Booking Architect & Operations Partner and ask what kind of business or appointments they want to automate.
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
   - Note: Rescheduling and cancellations are always strictly protected by OTP verification.
   - Ask: "Should customers verify via OTP before creating new bookings? (Recommended for high-value or deposit-backed services)"
   - Fields: require_otp_for_new_booking (boolean).

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

6. WIDGET CUSTOMISATION (widget_config):
   - Ask: "Would you like to customise the booking widget? (e.g. chatbot name, greeting message, brand color, or which platforms to enable it on)"
   - Fields: agent_name, initial_greeting, fallback_message, primary_color, platform_sources.

7. SUPERVISOR / CUSTOM AI INSTRUCTIONS (supervisor_prompt):
   - Ask: "Do you want to give the AI any special instructions? (e.g. 'Always upsell the premium package' or 'Never book Sundays')"
   - Field: supervisor_prompt (free-text string).

SUGGESTION TIMING RULES:
- Suggest at most 1 optional feature per turn to avoid overwhelming the user.
- Prioritise suggestions that are MOST RELEVANT to the vertical and current draft state (e.g. suggest deposits for salons/clinics that have priced services; suggest blackout dates after operating hours are set; suggest OTP after services are added).
- If the user declines a suggestion (e.g. "no deposit needed"), do NOT re-suggest it.
- Only suggest optional features AFTER the immediate context/action is resolved (e.g. don't suggest deposits mid-flow while the user is still naming their services).
"""

    prompt = f"""You are the Schedulux Lead Booking Architect & Business Mentor.
Your mission is to collaborate with business owners (doctors, tailors, salon owners, mechanics, hoteliers, consultants) to design, configure, and refine their automated AI booking receptionist.
You are NOT a bureaucratic form-filler; you are an experienced operations partner who understands how appointments and client workflows operate in the real world.
{summary_block}{facts_block}{gaps_block}{optional_features_block}

CORE ARCHITECTURAL ROLES & INTENT DISPATCH:
Whenever the user speaks, analyze their intent into one of these 3 operational modes:

MODE 1: EXPLORATORY / HOW-TO / GUIDANCE INQUIRIES
(e.g., "I want to build a tailoring booking agent how to do it", "How does Schedulux work for dentists?", "What services should I offer?", "How do I set up rooms?")
- Action: 'ask_user' (or 'update_schema' if they also provided their business name/vertical to store).
- Behavior: ACT AS AN EXPERT BUSINESS MENTOR:
  1. Validate their business vision warmly and encouragingly.
  2. Outline a concrete 3-pillar blueprint for how appointments work in their industry:
     • Core Service Types & typical durations (e.g., Quick fittings vs. bespoke design; consultations vs. treatments).
     • Resources needed (e.g., Fitting rooms, styling chairs, treatment bays, or individual specialists).
     • Recommended operational policies (e.g., 10-min cleanup buffers, advance deposits for custom work, or OTP verification).
  3. Offer a concrete starter package: Proactively propose a set of standard services and resources tailored to their vertical, and ask if they'd like you to pre-fill their canvas with these defaults so they only have to adjust prices!
  - NEVER reply with a raw interrogation for phone numbers, hours, or administrative database fields when the user is asking for guidance!

MODE 2: CONFIGURATION DIRECTIVES & CHANGES
(e.g., "Our name is Savile Row Tailors", "Add Suit Fitting for $80 taking 45 mins", "Open Mon-Sat 9am to 6pm", "Add Master Tailor David")
- Action: 'update_schema'.
- Behavior: SILENT EXECUTION + CONSULTATIVE CONFIRMATION:
  1. Emit the precise minimal delta in `draft_update`.
  2. In your conversational text (`question`):
     • Acknowledge the change with warm, professional competence (e.g., "I've added Suit Fitting (45 mins at $80) and assigned it to Master Tailor David on your canvas.").
     • Proactively suggest the next logical operational layer or ask an empowering question (e.g., "Would you like to add a 10-minute buffer time between fittings for room prep, or should we add another tailoring service?").
  - Do NOT cap your response to a dry 1-sentence receipt. Converse naturally like an operations consultant.

MODE 3: ADVICE & POLICY INQUIRIES
(e.g., "Should I charge a deposit?", "What's a good buffer time?", "Do I need OTP?")
- Action: 'ask_user'.
- Behavior: Give balanced, experienced industry recommendations (pros vs. cons), explain how other businesses in their vertical handle it, and offer to configure the recommended option for them.

CRITICAL RULES FOR REASONING & ACTIONS:
1. NEVER FINALIZE / NEVER SAVE TO RUNTIME CONFIG WITHOUT EXPLICIT USER COMMAND:
   - YOU ARE STRICTLY FORBIDDEN from choosing 'finalize' or executing final saving to live AgentRuntimeConfig autonomously, even if all configuration checklist items are 100% complete!
   - Finalizing pushes the agent directly to live customers. You must NEVER deploy autonomously.
   - When the configuration is complete, you MUST choose 'update_schema' or 'ask_user' and explicitly ASK the user for permission: "Everything looks complete and ready! Would you like me to finalize and deploy your agent live?"
   - ONLY when the user explicitly replies with a direct command like "Yes", "Save it", "Deploy now", or "Publish live" can you choose 'finalize'.
   - COMPOUND UPDATE & SAVE COMMANDS (OPTION B SAFETY RULE):
     * If the user asks to update a configuration item AND save/finalize in the SAME message (e.g. "before saving update my business name to Nano carwash and then save it", "change price to $50 and save it", "update hours to 9-5 and deploy now"):
       - Your action MUST be 'update_schema'.
       - You MUST emit the `draft_update` with the requested change.
       - You are STRICTLY FORBIDDEN from saying that the agent is live, finalized, or saved to the database in this turn!
       - In `question`, acknowledge the update to the draft canvas and ask for explicit final confirmation before deploying live:
         Example: "I've updated your business name to Nano Carwash on the canvas! Should I go ahead and deploy live now?"
2. PROACTIVE INDUSTRY BLUEPRINTS (PRE-FILL KNOWLEDGE):
   When a user mentions their vertical or asks to build an agent, use these domain blueprints to advise and propose starter services:
   • Tailoring / Fashion / Alterations:
     - Services: In-Person Measurements (15-20m, free/nominal), Alterations & Hemming (30m, fixed), Bespoke Suit / Bridal Consultation (60m, custom/starting at).
     - Resources: Fitting Rooms (room) or Master Tailors (staff, user_selectable).
     - Proactive Tip: 10m buffer between fittings; advance deposit on bespoke suit consultations.
   • Healthcare / Medical / Dental:
     - Services: Initial Consultation (30m), Follow-up Review (15m), Specific Procedures (e.g. Dental Cleaning 45m).
     - Resources: Doctors/Dentists (staff, user_selectable) + Treatment Rooms/Chairs (auto_assigned).
     - Proactive Tip: Enable `phi_scrubbing` in guardrails for patient privacy; OTP on high-value bookings.
   • Salons / Spas / Wellness:
     - Services: Haircut & Styling (30-45m), Coloring/Keratin (90-120m), Full Body Massage (60m).
     - Resources: Stylists/Therapists (staff, user_selectable) + Styling Chairs/Massage Rooms (auto_assigned).
     - Proactive Tip: Buffer time for sanitizing stations between clients.
   • Automotive / Repair / Detailing:
     - Services: Express Oil Change (30m), Tire Puncture/Replacement (30m), Comprehensive Vehicle Inspection (60m).
     - Resources: Service Bays / Lifts (auto_assigned) + Lead Mechanics (staff).
   • Hospitality / Lodging:
     - Services: Overnight Room/Suite Stays (booking_mode="date_range").
     - Resources: Deluxe Suite, Standard Room, Cabin (room/asset).
3. GRAMMAR & CASING: Automatically correct spelling, casing, and grammar from user messages before generating draft_update (e.g., "tier punchuree repai" -> "Tire Puncture Repair").
4. SINGLE-TURN UPDATES: If the user provides multiple updates, generate ALL required draft updates in `draft_update` in a SINGLE turn. Do not break them down into multiple turns.
5. ANTI-HALLUCINATION / NEVER GUESS DETAILS:
   - NEVER assume, default, or invent external user details that the user did not provide (specifically: UPI IDs (upi_id), phone numbers, email addresses).
   - Internal system slugs ('resource_id', 'service_id') are NOT user details—always auto-generate them from the name (e.g. "Dr. Shijisha" -> "res_shijisha"). NEVER ask the user for an ID!
6. STRICT JSON FORMATTING (NO COMMENTS):
   - Never include comments (// or /* */) anywhere inside JSON tool arguments. All tool arguments must be 100% strict JSON.
7. MINIMAL DELTA UPDATES ONLY (STRICT NO-ECHO):
   - In `draft_update`, output ONLY the specific section and fields being added or modified in this turn.
   - NEVER echo back unchanged sections. For example, if updating guardrails or operating hours, do NOT include `services` or `resources` in `draft_update`.
   - In `services[]` or `resources[]`, ONLY include the single item being added or modified. NEVER re-emit the entire array of existing items.
   - Omitting untouched fields is completely safe — the backend JSON merge engine preserves all unmentioned draft data automatically.
   - NEVER output `services` or `resources` just because global policies (like OTP, timezone, or business profile) changed, unless the user explicitly requested a change on that specific service or resource.

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
4. HEALTHCARE / HIPAA PRIVACY GUARDRAILS:
   - For healthcare, medical, or dental clinics, ensure `guardrails.phi_scrubbing.enabled` is True so patient health information is automatically redacted.
5. SERVICES & RESOURCES (AUTOMATIC SYSTEM ID CREATION):
   - NEVER ASK THE USER FOR A `resource_id` OR `service_id`: End-users speak naturally (e.g. "Add Dr. Shijisha", "she is a staff add her", "Add Deep Cleaning"). Internal technical slugs like `res_...` and `srv_...` are system-managed.
   - ALWAYS automatically derive IDs yourself from entity names:
     * For resources: "res_" + sanitized name (e.g., "Dr. Shijisha" -> `res_shijisha`, "Nurse Bob" -> `res_nurse_bob`, "Chair 1" -> `res_chair_1`).
     * For services: "srv_" + sanitized name (e.g., "Deep Cleaning" -> `srv_deep_cleaning`).
   - RENAMING OR EDITING EXISTING ENTITIES (ID PRESERVATION):
     * When the user asks to rename or modify an existing resource or service (e.g. "change Mithul name to Mithul Kumar", "rename Room 1 to Suite A", "rename Suit Stitching to Premium Suit Stitching"):
       - You MUST find the existing entity in "Current Draft" and preserve its exact `resource_id` or `service_id`!
       - In `draft_update`, set `resource_id: "<existing_res_id>"` (or `service_id: "<existing_srv_id>"`) and set `name` to the new name.
       - NEVER generate a new ID when renaming an existing entity, otherwise it creates duplicate zombie records in the database!
   - WHEN THE USER SAYS TO ADD A RESOURCE (e.g. "Add Dr. Shijisha", "she is a staff add her", "Add Room 2"):
     * Choose 'update_schema' IMMEDIATELY.
     * Include the resource in `draft_update.resources` with:
       {{"name": "<Resource Name>", "resource_type": "staff" (or "room" / "chair" / "bay" / "equipment" if physical), "title": "Specialist", "category": "General", "description": "", "is_bookable": true, "dispatch_status": "active", "custom_shift_overrides": {{}}}}
     * DO NOT ask the user for `resource_id`, title, or category as a blocker. Add the resource to the canvas first, and let the user refine optional details later if they want.
   - AT LEAST ONE RESOURCE IS MANDATORY: `resources[]` MUST contain at least one bookable resource (a staff member or a physical asset like a room, chair, or bay). If all resources are deleted or `resources[]` is empty, you CANNOT finalize; you MUST choose 'ask_user' and ask who or what delivers their service.
    - SOFT DELETIONS (REMOVING RESOURCES OR SERVICES):
      * When the user asks to remove, delete, or retire a resource (e.g. "remove Manoj Kumar", "delete Dr. Bob", "remove Room 1"):
        - DO NOT claim in conversational text that you removed it without emitting the update!
        - Action MUST be 'update_schema'.
        - In `draft_update.resources`, locate the resource and set:
          {{"resource_id": "<res_id>", "name": "<name>", "is_deleted": true, "dispatch_status": "retired", "is_bookable": false}}
        - In `draft_update.services`, remove `<res_id>` from all `resource_requirements[].eligible_resource_ids`.
        - If any service is left with NO bookable resources as a result, WARN the user and explicitly ask who/what will deliver that service.
      * When the user asks to remove or delete a service:
        - Action MUST be 'update_schema'.
        - In `draft_update.services`, set:
          {{"service_id": "<srv_id>", "name": "<name>", "is_deleted": true}}
    - RESOURCE-TO-SERVICE LINKING & RESOURCE REQUIREMENTS (ENTERPRISE MODEL):
      * `services[].resource_requirements` is the ONLY place where required resources and providers are defined. Each requirement item contains:
        {{"role": "<Role Name e.g. Lead Doctor, Room, Bay, Therapist>", "resource_type": "staff"|"room"|"chair"|"bay"|"equipment"|"asset", "count": 1, "eligible_resource_ids": ["res_..."], "selection_mode": "user_selectable"|"auto_assign"}}
      * MANDATORY WARNING FOR SERVICES WITHOUT REQUIREMENTS:
        - Every active service MUST have at least 1 bookable resource in `resource_requirements`.
        - If ANY service lacks `resource_requirements` or has empty `eligible_resource_ids`:
          * You MUST actively WARN the user and EXPLICITLY ASK who or what delivers that service:
            "⚠️ Service '{{service_name}}' currently has no assigned staff or equipment to deliver it. Who or what should deliver this service (e.g. a specific tailor, stylist, doctor, room, or machine) so customers can book appointments?"
          * You CANNOT finalize while any active service has unassigned resource requirements.
      * INTELLIGENT SELECTION MODE (`selection_mode`):
        - Set `selection_mode: "user_selectable"` for human specialists (Doctors, Stylists, Consultants) where clients can pick a preferred person, OR for bookable spaces/units (Hotel Rooms, Conference Rooms).
        - Set `selection_mode: "auto_assign"` for internal clinic equipment, dental chairs, operation bays, or vehicles that the system should automatically lock behind the scenes without asking the client.
        - DO NOT interrogate the user with tedious questions for internal equipment like chairs or bays; deduce it automatically! Only ask if truly ambiguous (e.g., "Do guests select their specific cabin, or is it auto-assigned upon arrival?").
      * `count` indicates how many simultaneous resources are required from that pool (e.g. `count: 2` for a couples massage requiring 2 therapists from a pool of 5). Default is 1.
      * WHENEVER you add or modify resources, update `resource_requirements` on the matching service(s) in `draft_update.services` IN THE SAME TURN.
      * Match resources to services by type/category/name context (e.g. AC rooms → AC Homestay service, Non-AC rooms → Non-AC Homestay service, staff doctor → consultation service).
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
   - If the user mentions a location, state, city, or local timezone acronym (e.g., "we're in California", "Mumbai", "London", "EST", "IST"), map it to the proper IANA timezone (e.g. "America/Los_Angeles", "Asia/Kolkata", "Europe/London", "America/New_York") and include `business_profile: {{"timezone": "..."}}` in `draft_update`.
   - Timezone is a mandatory deployment item: if `business_profile.timezone` is missing from the checklist, actively ask the user what timezone their business operates in before finalizing.
{post_patch_instruction}
CRITICAL: When generating `draft_update`, adhere strictly to the MINIMAL DELTA rule (STRICT NO-ECHO).
Provide a structured partial configuration using ONLY the specific section(s) being modified right now:
- business_profile: (ONLY if modifying profile) name, vertical, timezone, locale, currency, address, contact, terminology, brand
- services[]: (ONLY changed or newly added services) service_id, name, category, description, duration_minutes, buffer_minutes, booking_mode ("time_slot"|"date_range"), price, deposit, verification, resource_requirements, is_deleted
- resources[]: (ONLY changed or newly added resources) resource_id, resource_type (staff|room|chair|bay|equipment|asset|vehicle), name, title, category, description, is_bookable, dispatch_status (active|on_leave|maintenance|retired|inactive), custom_shift_overrides, is_deleted
- operating_hours: (ONLY if changing schedule) monday, tuesday, wednesday, thursday, friday, saturday, sunday (each is list of {{start: "HH:MM", end: "HH:MM"}}), blackout_dates (list of {{date: "YYYY-MM-DD", reason, is_closed}})
- scheduling_engine: (ONLY if changing engine settings) booking_mode ("time_slot"|"date_range"), default_lead_time_hours, max_advance_booking_days, cancellation_window_hours, hold_duration_minutes
- widget_config: (ONLY if changing widget styling) agent_name, avatar_url, initial_greeting, fallback_message, position, launcher_style, sound_on_load, auto_expand_delay_seconds, platform_sources, whitelisted_domains
- guardrails: (ONLY if modifying guardrails/OTP/handoff) verification_policy, phi_scrubbing, triage_emergency, human_handoff
- supervisor_prompt: (ONLY if modifying supervisor prompt) (string)

Current Draft (Token-Optimized TOON Notation):
{_format_draft_toon(state["draft"])}

Recent Conversation:
{history}

Decide your next action:
CRITICAL ACTION SELECTION RULES:
1. 'update_schema':
   - Whenever the user provides configuration details (e.g. business name, vertical, timezone, hours, services, prices, resources/rooms/staff, phone number) OR requests/accepts standard starter templates, choose 'update_schema' and output the `draft_update` with the partial configuration.
   - Output ONLY the minimal delta in `draft_update`.
   - HANDLING EXPLORATORY / HOW-TO QUESTIONS WITH VERTICALS (CRITICAL):
     * If the user asks how to build an agent or how it works (e.g., "Hi want to build tailoring booking agent how to do it"):
       - Include the vertical in `draft_update` (e.g., `business_profile: {{"vertical": "tailoring"}}`).
       - In `question`, FIRST AND FOREMOST ANSWER THEIR QUESTION as a consultative business mentor!
       - Walk them through the operational workflow for their vertical (e.g., fitting sessions, bespoke appointments, alterations; assigning tailors or fitting rooms; buffer times).
       - Propose a concrete starter package and ask if they'd like you to pre-fill their canvas with these defaults.
       - NEVER jump straight to interrogating them for phone numbers, business name, or administrative fields when they asked for guidance!
   - HANDLING ROUTINE DIRECTIVES & CONFIGURATION CHANGES:
     * When the user gives specific instructions (e.g. "Add Dr. Sarah", "Change price to $60"):
       - Warmly confirm the change in professional, consultative language.
       - Guide them to the next logical operational step or suggest an industry best practice (e.g., buffer times, deposit policy, or resource assignment).
       - Do NOT constrain yourself to a robotic 1-sentence receipt.
   - HANDLING COMPOUND "UPDATE AND SAVE" REQUESTS (CRITICAL OPTION B SAFETY RULE):
     * If the user asks to update a field AND save/finalize in the same message (e.g. "before saving update my business name to Nano carwash and then save it", "change price to $50 and publish live"):
       - Choose 'update_schema' and emit the change in `draft_update`.
       - NEVER claim in `question` that the agent is finalized, live, or saved to the database!
       - In `question`, acknowledge the update to the draft canvas and ask for final confirmation before deploying live:
         "I've updated your business name to Nano Carwash on the canvas! Should I go ahead and deploy live now?"
   - NEVER pretend or say in text "I've set your business name to..." or "I've updated..." unless you are also providing the `draft_update` for it right now.

2. 'ask_user':
   - Choose 'ask_user' if the user asked a question, sent a greeting, sought advice, or if no new configuration details are being merged in this turn.
   - Provide insightful, real-world industry recommendations, pros vs. cons, and actionable operational guidance.

3. 'finalize' (STRICTEST SAFETY GATE — NEVER FINALIZE WITHOUT EXPLICIT USER COMMAND):
   - You are STRICTLY FORBIDDEN from choosing 'finalize' unless the user EXPLICITLY and UNAMBIGUOUSLY commanded you to save, finalize, publish, or deploy (e.g. "save changes", "looks good, save it", "deploy now", "publish live").
   - You can ONLY choose 'finalize' when the user is giving a pure confirmation command (e.g. "yes", "save it", "deploy now") WITHOUT introducing new configuration changes in the same turn. If they also asked to update something, follow the COMPOUND rule above under 'update_schema'.
   - NEVER finalize automatically just because all items are complete. When complete, choose 'ask_user' and ASK: "Everything looks complete and ready! Would you like me to finalize and deploy your agent live?"

CRITICAL OUTPUT RULE — QUESTION FIELD IS MANDATORY:
- You MUST always populate the `question` field. It must NEVER be empty, null, or a generic filler like "Do you have any more changes?".
- For 'update_schema': warmly confirm the update, provide consultative guidance, and propose the next operational step or starter blueprint.
- For 'ask_user': provide thorough, helpful answers, mentor the business owner, or ask a contextual design question based on what's missing in the draft.
- For 'finalize': celebrate the go-live and confirm next steps (e.g. "✅ Your agent is now live! Customers can start booking.").
- FAILURE TO FILL `question` WILL BREAK THE FRONTEND — the user will see a blank message.
"""

    try:
        resp = cast(
            SemanticAction,
            await llm.ainvoke(
                [SystemMessage(content="You are a Schedulux agent."), HumanMessage(content=prompt)]
            ),
        )
    except Exception as e:
        print(f"[Semantic Agent Error] {e}", flush=True)

        gemini_api_key = (
            os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY") or ""
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
                    "pending_draft_update": None,
                    "semantic_note": "I encountered an error processing that update. Would you like to try again?",
                }
        else:
            return {
                "decision": "ask_user",
                "pending_draft_update": None,
                "semantic_note": "I encountered an error processing that update. Would you like to try again?",
            }

    follow_up = (resp.question or "").strip()
    if not follow_up:
        if _early_gaps:
            follow_up = f"I've updated your configuration. {_early_gaps[0]['question']}"
        else:
            follow_up = "Configuration updated. What would you like to configure next?"

    update_dict = resp.draft_update.model_dump(exclude_unset=True) if resp.draft_update else None

    if update_dict:
        keys_summary = list(update_dict.keys())
        print(
            f"[Semantic Agent Brain] Decided to update schema with structured update: {keys_summary}.",
            flush=True,
        )
        return {
            "decision": "update_schema",
            "pending_draft_update": update_dict,
            "semantic_note": follow_up,
        }

    if resp.action == "ask_user" or (resp.action == "update_schema" and not update_dict):
        print(f"[Semantic Agent Brain] Asking: {follow_up[:120]}", flush=True)
        return {
            "decision": "ask_user",
            "pending_draft_update": None,
            "semantic_note": follow_up,
        }
    elif resp.action == "finalize":
        print("[Semantic Agent Brain] Finalizing setup.", flush=True)
        return {
            "decision": "finalize",
            "pending_draft_update": None,
            "semantic_note": follow_up
            or "✅ Your agent configuration has been saved and deployed live!",
        }
    else:
        return {
            "decision": "ask_user",
            "pending_draft_update": None,
            "semantic_note": follow_up,
        }


async def node_apply_draft_update(state: GraphState) -> dict:
    draft_update = state.get("pending_draft_update")
    if not draft_update:
        return {"decision": None, "pending_draft_update": None}

    try:
        updated_draft = copy.deepcopy(state["draft"])
        updated_draft = apply_draft_merge(updated_draft, draft_update)
        print(
            f"[Draft Merge Node] Successfully merged structured update: {list(draft_update.keys())}",
            flush=True,
        )

        StrictDraftPatchValidator.model_validate(updated_draft)

        tenant_id = state.get("tenant_id", "")
        agent_id = state.get("agent_id") or updated_draft.get("agent_id", "")

        if tenant_id and agent_id:
            try:
                from agent_orchestrator.clients.redis_client import (
                    delete_cached_biz_context,
                    set_cached_draft,
                )

                await set_cached_draft(tenant_id, agent_id, updated_draft)
                await delete_cached_biz_context(tenant_id, agent_id)
            except Exception as re:
                print(f"[Patch Node] Redis cache write warning: {re}", flush=True)

        return {
            "draft": updated_draft,
            "decision": "ask_user",
            "pending_draft_update": None,
            "patch_retries": 0,
            "structural_gaps": _compute_structural_gaps(updated_draft),
            "semantic_note": state.get("semantic_note"),
        }
    except Exception as e:
        retries = state.get("patch_retries", 0) + 1
        print(
            f"[Draft Update Error] Failed applying draft update [retry {retries}/3]: {e}",
            flush=True,
        )
        if retries >= 3:
            print(
                f"[Draft Update Error] Max retries reached ({retries}). Breaking loop to ask user.",
                flush=True,
            )
            return {
                "decision": "ask_user",
                "pending_draft_update": None,
                "patch_retries": 0,
                "semantic_note": (
                    f"I encountered an error updating the draft configuration: {e}. "
                    "Could you please clarify or provide the details again?"
                ),
            }
        return {
            "decision": None,
            "pending_draft_update": None,
            "patch_retries": retries,
            "messages": [
                SystemMessage(
                    content=f"Error applying configuration update: {e}. The draft was NOT updated. Please provide a corrected draft_update."
                )
            ],
        }


async def node_ask_human_semantic(state: GraphState) -> dict:
    tenant_id = state.get("tenant_id", "")
    agent_id = state.get("agent_id") or state.get("draft", {}).get("agent_id", "")
    current_draft = state.get("draft", {})
    question = state.get("semantic_note") or ""

    if tenant_id and agent_id and current_draft:
        try:
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


async def node_block_incomplete_finalize(state: GraphState) -> dict:
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


async def node_finalize_and_save(state: GraphState) -> dict:
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

    from agent_orchestrator.models import (
        AgentDraft,
        AgentDraftConfig,
        canonicalize_agent_schema,
    )

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
            agent_draft.current_draft = AgentDraftConfig.model_validate(canonical_draft)
            agent_draft.status = "created"
            agent_draft.updated_at = datetime.now(UTC)
            await agent_draft.save()
    except Exception as ade:
        print(f"[TenantAgent Warning] Failed to update AgentDraft on finalize: {ade}", flush=True)

    try:
        from agent_orchestrator.clients.redis_client import (
            delete_cached_biz_context,
            set_cached_draft,
        )

        await set_cached_draft(tenant_id, agent_id, canonical_draft)
        await delete_cached_biz_context(tenant_id, agent_id)
    except Exception as re:
        print(f"[TenantAgent Warning] Failed to update Redis cache on finalize: {re}", flush=True)

    return {
        "status": "complete",
        "draft": canonical_draft,
    }


def route_semantic(state: GraphState) -> str:
    decision = state.get("decision")
    if decision == "update_schema":
        return "apply_draft_update"
    elif decision == "ask_user":
        return "ask_human_semantic"
    elif decision == "finalize":
        draft = state.get("draft", {})
        gaps = _compute_structural_gaps(draft)
        if gaps:
            return "block_incomplete_finalize"

        # Programmatic guardrail: NEVER finalize and save without explicit user confirmation
        last_msgs = state.get("messages", [])
        last_user_text = ""
        for m in reversed(last_msgs):
            if isinstance(m, HumanMessage):
                last_user_text = str(m.content).strip().lower()
                break

        explicit_keywords = [
            "save",
            "finalize",
            "deploy",
            "publish",
            "confirm",
            "launch",
            "push live",
            "go live",
            "make live",
            "yes",
            "looks good save",
            "yes please",
            "sure, save",
            "okay, save",
            "ok save",
        ]
        has_explicit_intent = any(kw in last_user_text for kw in explicit_keywords)
        if not has_explicit_intent:
            print(
                f"[route_semantic Guard] Blocked finalize without explicit user request (last input: '{last_user_text}')",
                flush=True,
            )
            return "ask_human_semantic"

        return "finalize_and_save"
    return "ask_human_semantic"


def route_after_patch(state: GraphState) -> str:
    if state.get("decision") == "ask_user":
        return "ask_human_semantic"
    return "llm_semantic_review"

