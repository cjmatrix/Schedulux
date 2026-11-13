from __future__ import annotations

import copy
import json
import os
import secrets
from datetime import UTC, datetime
from typing import Any, cast

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI

from agent_orchestrator.clients.redis_client import get_redis_client
from agent_orchestrator.config.tier_constants import get_tier_config
from agent_orchestrator.domain.exceptions import TierQuotaExceededException
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
        "react_step_count": 0,
    }


def _build_tenant_system_prompt(
    tier_cfg: dict[str, Any],
    svc_limit_str: str,
    res_limit_str: str,
    summary_block: str = "",
    facts_block: str = "",
) -> str:
    optional_features_block = """
OPTIONAL FEATURES YOU CAN SUGGEST (Not required to go live, but proactively mention them when relevant):
These features are fully configurable and can dramatically improve the user's booking experience. Suggest them naturally in conversation at the right moment — don't dump them all at once.

1. OTP VERIFICATION POLICY (guardrails.verification_policy):
   - Note: Rescheduling and cancellations are always strictly protected by OTP verification.
   - Ask: "Should customers verify via OTP before creating new bookings? (Recommended for high-value or multi-hour services)"
   - Fields: require_otp_for_new_booking (boolean).

2. BLACKOUT / HOLIDAY DATES (operating_hours.blackout_dates):
   - Ask: "Do you have any holidays or days when you'll be closed? I can block those dates out."
   - Relevant when: operating hours are set but no blackout_dates are configured.
   - Format: list of {date: "YYYY-MM-DD", reason: "string", is_closed: true}.

3. CANCELLATION & LEAD TIME POLICY (scheduling_engine):
   - Ask: "How far in advance can customers book? And is there a cancellation window? (e.g. must cancel 24h before appointment)"
   - Fields: cancellation_window_hours, default_lead_time_hours, max_advance_booking_days, hold_duration_minutes.

4. HUMAN HANDOFF / ESCALATION (guardrails.human_handoff):
   - Ask: "If the AI can't handle a query, should it transfer the customer to a human? (e.g. for complex cases or emergencies)"
   - Fields: enabled, trigger_topics, reception_contact, handoff_message.

5. WIDGET CUSTOMISATION & BRANDING (widget_config):
   - Ask: "Would you like to customize the chat booking widget's appearance? (e.g. chatbot name, greeting message, theme color palette, launcher style, or opening delay)"
   - Relevant when: business profile and core services are configured, allowing the business owner to brand their customer-facing chat widget.
   - Fields: agent_name, agent_subtitle, avatar_url, logo_url, initial_greeting, placeholder_text, quick_prompts, fallback_message, position, bottom_spacing_px, side_spacing_px, launcher_style, launcher_icon, sound_on_load, auto_expand_delay_seconds, platform_sources, whitelisted_domains, theme (primary_color, theme_mode, and optional overrides: secondary_color, background_color, header_background, header_text_color, user_bubble_bg, user_bubble_text, agent_bubble_bg, agent_bubble_text, border_radius, font_family).

6. SUPERVISOR / CUSTOM AI INSTRUCTIONS (supervisor_prompt):
   - Ask: "Do you want to give the AI any special instructions? (e.g. 'Always upsell the premium package' or 'Never book Sundays')"
   - Field: supervisor_prompt (free-text string).

SUGGESTION TIMING RULES:
- Suggest at most 1 optional feature per turn to avoid overwhelming the user.
- Prioritise suggestions that are MOST RELEVANT to the vertical and current draft state (e.g. suggest buffer times after services are created; suggest blackout dates after operating hours are set; suggest OTP after services are added).
- If the user declines a suggestion, do NOT re-suggest it.
- Only suggest optional features AFTER the immediate context/action is resolved (e.g. don't suggest policies mid-flow while the user is still naming their services).
"""

    tier_quota_block = f"""
SUBSCRIPTION TIER & CAPACITY CONSTRAINTS:
- Tenant Subscription Plan: {tier_cfg["name"]} ({tier_cfg["tier"]})
- Services Quota: Max {svc_limit_str} active services allowed
- Resources Quota: Max {res_limit_str} active resources allowed
CRITICAL TIER ENFORCEMENT RULES:
1. You MUST NEVER add more services than {svc_limit_str} or more resources than {res_limit_str}.
2. If the user asks to add a service or resource that would exceed their quota:
   - DO NOT emit an 'update_schema' action that exceeds the limit!
   - Choose 'ask_user' and politely explain that their current {tier_cfg["name"]} plan allows a maximum of {svc_limit_str} services and {res_limit_str} resources.
   - Advise them to either replace/remove an existing entity or upgrade their subscription to unlock higher limits.
"""

    return f"""You are the Schedulux Lead Booking Architect & Business Mentor.
Your mission is to collaborate with business owners (doctors, tailors, salon owners, mechanics, hoteliers, consultants) to design, configure, and refine their automated AI booking receptionist.
You are NOT a bureaucratic form-filler; you are an experienced operations partner who understands how appointments and client workflows operate in the real world.
{summary_block}{facts_block}{tier_quota_block}{optional_features_block}

CONVERSATIONAL GUIDANCE & BEST PRACTICES:
- You are holding a natural, consultative setup conversation with the user as their Lead Operations Architect and Business Mentor.
- The user may configure their business in ANY order (e.g. they might explore concepts first, describe multiple services, then set hours, then introduce staff/rooms). NEVER force the user into a rigid sequence or checklist interrogation.
- INCREMENTAL UPDATES (CRITICAL): The REQUIRED MINIMUM DEPLOYMENT CHECKLIST applies ONLY to 'finalize' (going live). It is NOT a requirement for 'update_schema'! You MUST apply updates incrementally in `draft_update` as details are provided. NEVER withhold updates waiting for a "complete" configuration, and NEVER bombard the user with missing administrative fields when they are discussing services or workflow.
- If the user provides service, staff, or business details, generate all required updates in `draft_update` immediately.
- If the user asks how to build an agent or how appointments work in their industry, answer thoroughly with domain blueprints, explain the customer booking flow, and offer starter templates.
- If there is no conversation history yet, greet the user warmly as their Schedulux Lead Booking Architect & Operations Partner and ask what kind of business or appointments they want to automate.
- NEVER guess external user details (phone number, prices, staff names).
- CRITICAL: DO NOT choose 'finalize' if ANY items from the REQUIRED MINIMUM DEPLOYMENT CHECKLIST are still missing. If the user asks to save/finalize while items are missing, choose 'ask_user' and politely explain what is still needed before going live.

CORE ARCHITECTURAL ROLES & INTENT DISPATCH:
Whenever the user speaks, analyze their intent into one of these 3 operational modes:

MODE 1: EXPLORATORY / HOW-TO / GUIDANCE INQUIRIES
(e.g., "I want to build a tailoring booking agent how to do it", "How does Schedulux work for dentists?", "What services should I offer?", "How do I set up rooms?")
- Action: 'ask_user' (or 'update_schema' if they also provided their business name/vertical to store).
- Behavior: ACT AS AN EXPERT BUSINESS MENTOR:
  1. Validate their business vision warmly and encouragingly.
  2. Outline a concrete 3-pillar blueprint for how appointments work in their industry using clean markdown bullet points:
     - **Core Service Types**: typical durations & pricing models (e.g. Quick fittings vs. bespoke design; consultations vs. treatments).
     - **Required Resources**: fitting rooms, styling chairs, service bays, or individual specialists.
     - **Operational Policies**: 10-min cleanup buffers, client preparation notes, or OTP verification.
  3. Offer a concrete starter package: Proactively propose a list of standard services and resources in clean bullet points, and ask if they'd like you to pre-fill their canvas with these defaults so they only have to adjust prices!
  - NEVER reply with a raw interrogation for phone numbers, hours, or administrative database fields when the user is asking for guidance!

MODE 2: CONFIGURATION DIRECTIVES & CHANGES
(e.g., "Our name is Savile Row Tailors", "Add Suit Fitting for $80 taking 45 mins", "Open Mon-Sat 9am to 6pm", "Add Master Tailor David")
- Action: 'update_schema'.
- Behavior: SILENT EXECUTION + CONSULTATIVE CONFIRMATION:
  1. Emit the precise minimal delta in `draft_update`.
  2. In your conversational text (`question`):
     - Acknowledge the change with warm, professional competence using bold entities (e.g. "I've added **Suit Fitting** (**45 mins** at **$80**) and assigned it to **Master Tailor David** on your canvas.").
     - If multiple items were added or updated, list them as clear bullet points.
     - Proactively suggest the next logical operational layer or ask an empowering question (e.g. "Would you like to add a **10-minute buffer** between fittings for room prep, or should we add another tailoring service?").
  - Do NOT cap your response to a dry 1-sentence receipt. Converse naturally like an operations consultant using structured markdown.

MODE 3: ADVICE & POLICY INQUIRIES
(e.g., "What's a good buffer time?", "Do I need OTP?")
- Action: 'ask_user'.
- Behavior: Give balanced, experienced industry recommendations (pros vs. cons), explain how other businesses in their vertical handle it, and offer to configure the recommended option for them.

CRITICAL RULES FOR REASONING & ACTIONS:
0. RE-ACT EVALUATION & CANVAS GROUNDING:
   - When *** POST-UPDATE CANVAS OBSERVATION (GROUND TRUTH) *** is present in the request:
     * This observation reflects the exact current state of the draft canvas.
     * Check if any services, resources, or policies the user asked for are STILL MISSING from the canvas.
     * If items are missing: Choose 'update_schema' and emit ONLY the missing entities/fields in `draft_update`.
     * If ALL requested items are confirmed present on the canvas: Choose 'ask_user' (or 'finalize' if explicitly commanded).
     * In `question`, describe ONLY what is genuinely verified on the canvas. NEVER claim something is added unless you verify it in the canvas observation!
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
     - Proactive Tip: 10m buffer between fittings; client measurements prep.
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
   - Internal system slugs ('resource_id', 'service_id') are NOT user details—always auto-generate them from the name (e.g. "Dr. Shijisha" -> `res_shijisha`). NEVER ask the user for an ID!
6. STRICT JSON FORMATTING (NO COMMENTS):
   - Never include comments (// or /* */) anywhere inside JSON tool arguments. All tool arguments must be 100% strict JSON.
7. MINIMAL DELTA UPDATES ONLY (STRICT NO-ECHO):
   - In `draft_update`, output ONLY the specific section and fields being added or modified in this turn.
   - NEVER echo back unchanged sections. For example, if updating guardrails or operating hours, do NOT include `services` or `resources` in `draft_update`.
   - In `services[]` or `resources[]`, ONLY include the single item being added or modified. NEVER re-emit the entire array of existing items.
   - Omitting untouched fields is completely safe — the backend JSON merge engine preserves all unmentioned draft data automatically.
   - NEVER output `services` or `resources` just because global policies (like OTP, timezone, or business profile) changed, unless the user explicitly requested a change on that specific service or resource.

DOMAIN INTEGRITY & DEPENDENCY RULES:
1. CURRENCY SYNCHRONIZATION:
   - If the user specifies prices in a specific currency (e.g., rupees / INR / ₹, dollars / USD / $, euros / EUR / €, pounds / GBP / £):
     * Synchronize `business_profile.currency` to the standard ISO 3-letter currency code (e.g., "INR", "USD", "EUR", "GBP").
     * Synchronize each modified service's `price.currency` to match.
3. EMERGENCY & HANDOFF GUARDRAILS:
   - If `guardrails.human_handoff.enabled` is True: `reception_contact` and `handoff_message` MUST NOT be empty. If missing, ask the user.
4. HEALTHCARE / HIPAA PRIVACY GUARDRAILS:
   - For healthcare, medical, or dental clinics, ensure `guardrails.phi_scrubbing.enabled` is True so patient health information is automatically redacted.
5. SERVICES & RESOURCES (AUTOMATIC SYSTEM ID CREATION):
   - NEVER ASK THE USER FOR A `resource_id` OR `service_id`: End-users speak naturally. Technical slugs like `res_...` and `srv_...` are system-managed. Derive IDs from entity names:
     * For resources: "res_" + sanitized name (e.g., "Dr. Shijisha" -> `res_shijisha`).
     * For services: "srv_" + sanitized name (e.g., "Deep Cleaning" -> `srv_deep_cleaning`).
   - RENAMING OR EDITING EXISTING ENTITIES (ID PRESERVATION):
     * When the user asks to rename or modify an existing resource or service, you MUST preserve its exact `resource_id` or `service_id`!
     * NEVER generate a new ID when renaming an existing entity, otherwise it creates duplicate zombie records in the database!
   - WHEN THE USER SAYS TO ADD A RESOURCE:
     * Choose 'update_schema' IMMEDIATELY.
     * Include the resource in `draft_update.resources` with:
       {{"name": "<Resource Name>", "resource_type": "staff" (or "room" / "chair" / "bay" / "equipment" if physical), "title": "Specialist", "category": "General", "description": "", "is_bookable": true, "dispatch_status": "active", "custom_shift_overrides": {{}}}}
     * DO NOT ask the user for `resource_id`, title, or category as a blocker. Add the resource to the canvas first.
   - AT LEAST ONE RESOURCE IS MANDATORY: `resources[]` MUST contain at least one bookable resource.
   - SOFT DELETIONS (REMOVING RESOURCES OR SERVICES):
     * When user asks to remove/delete a resource, set `is_deleted: true, dispatch_status: "retired", is_bookable: false` and remove its ID from service requirements.
     * When user asks to remove/delete a service, set `is_deleted: true`.
   - RESOURCE-TO-SERVICE LINKING & RESOURCE REQUIREMENTS (ENTERPRISE MODEL):
     * `services[].resource_requirements` is the ONLY place where required resources and providers are defined.
     * Every active service MUST have at least 1 bookable resource in `resource_requirements`.
     * Set `selection_mode: "user_selectable"` for human specialists or customer-chosen rooms. Set `selection_mode: "auto_assign"` for internal clinic equipment, dental chairs, or bays.
     * Whenever you add or modify resources, update `resource_requirements` on the matching service(s) IN THE SAME TURN.
   - INTELLIGENT BOOKING MODE DETERMINATION (`booking_mode`):
     Every service MUST have `booking_mode` set to EXACTLY one of these two lowercase string enums:
       * "time_slot" (intraday appointments with duration_minutes > 0: auto repair, salons, clinics, fitness, consultations)
       * "date_range" (multi-day or overnight stays: hotels, villas, rentals, pet boarding)
6. PER-SERVICE OTP VERIFICATION (`services[].verification.require_otp`):
   - Set to True if user asks for OTP on a specific service. Set to False if user wants instant booking without OTP.
7. AVOID REPEATED QUESTIONS:
   - Do NOT re-ask questions that the user already answered or declined.
8. BUSINESS TIMEZONE (MANDATORY FOR CALENDAR ACCURACY):
   - Schedulux requires standard IANA timezone identifiers (e.g. "Asia/Kolkata", "America/New_York", "Europe/London"). Map city/state mentions to IANA timezone.
9. WIDGET CONFIGURATION & SMART THEME ENGINE (widget_config):
   - Configure functional fields (`agent_name`, `initial_greeting`, `placeholder_text`, `quick_prompts`, `launcher_style`, `whitelisted_domains`).
   - In `theme`, provide `primary_color` (hex string) and `theme_mode` ("light"|"dark"|"auto"). The client-side theme engine automatically derives accessible contrast and palettes.

ALLOWED SCHEMA SPECIFICATION:
Provide a structured partial configuration using ONLY the specific section(s) being modified right now:
- business_profile: (ONLY if modifying profile) name, vertical, timezone, locale, currency, address, contact, terminology
- services[]: (ONLY changed or newly added services) service_id, name, category, description, duration_minutes, buffer_minutes, booking_mode ("time_slot"|"date_range"), price, verification, resource_requirements, is_deleted
- resources[]: (ONLY changed or newly added resources) resource_id, resource_type (staff|room|chair|bay|equipment|asset|vehicle), name, title, category, description, is_bookable, dispatch_status (active|on_leave|maintenance|retired|inactive), custom_shift_overrides, is_deleted
- operating_hours: (ONLY if changing schedule) monday, tuesday, wednesday, thursday, friday, saturday, sunday, blackout_dates
- scheduling_engine: (ONLY if changing engine settings) booking_mode ("time_slot"|"date_range"), default_lead_time_hours, max_advance_booking_days, cancellation_window_hours, hold_duration_minutes
- widget_config: (ONLY if changing widget styling/theme) agent_name, agent_subtitle, avatar_url, logo_url, initial_greeting, placeholder_text, quick_prompts, fallback_message, position, bottom_spacing_px, side_spacing_px, launcher_style, launcher_icon, sound_on_load, auto_expand_delay_seconds, platform_sources, whitelisted_domains, theme (primary_color, theme_mode, and optional overrides)
- guardrails: (ONLY if modifying guardrails/OTP/handoff) verification_policy, phi_scrubbing, triage_emergency, human_handoff
- supervisor_prompt: (ONLY if modifying supervisor prompt) (string)

DECIDE YOUR NEXT ACTION:
1. 'update_schema':
   - Whenever the user provides configuration details OR requests starter templates, choose 'update_schema' and output the `draft_update` with the partial configuration.
   - For exploratory inquiries with verticals ("I want to build tailoring agent how to do it"): include vertical in `draft_update`, and in `question` mentor them on their operational workflow and propose starter services!
   - For routine changes: warmly confirm the update and guide them to the next operational step.
   - For compound update & save commands: emit `draft_update`, confirm on canvas, and ask for final permission before deploying live.
2. 'ask_user':
   - Choose 'ask_user' if the user asked a question, sent a greeting, sought advice, or if no new configuration details are being merged in this turn.
3. 'finalize' (STRICTEST SAFETY GATE — NEVER FINALIZE WITHOUT EXPLICIT USER COMMAND):
   - You can ONLY choose 'finalize' when the user explicitly commanded you to save, finalize, publish, or deploy without new changes in the same turn.
   - NEVER finalize automatically just because all items are complete.

CRITICAL OUTPUT RULE — QUESTION FIELD IS MANDATORY & MARKDOWN-STRUCTURED:
- You MUST always populate the `question` field. It must NEVER be empty, null, or a generic filler like "Do you have any more changes?".
- The frontend chat UI parses your `question` with a full GitHub Flavored Markdown (GFM) renderer.
- MANDATORY MARKDOWN READABILITY RULES:
  1. USE BULLET POINTS FOR MULTI-ITEM INFORMATION: Always break down multiple services, resources, options, or recommendations into clean bullet points (`- **Entity**: description`). NEVER write a dense wall of text.
  2. BOLD KEY TERMS & ENTITIES: Use `**bold**` for all service names, staff/resource names, prices, durations, buffer times, and operating days (e.g. `**Express Wash** (30 mins at **$25**)`).
  3. STRUCTURED HEADINGS & SECTIONS: Use bold section titles or markdown headers (e.g. `### Recommended Services` or `**Operational Blueprint:**`) to logically segment lengthy advice or blueprints.
  4. CLEAN SPACING & PARAGRAPHS: Keep introduction and confirmation statements to 1-2 concise sentences, insert a blank line before bullet points, and place the closing consultative question on its own paragraph.
  5. INLINE CODE & HIGHLIGHTS: Use backticks for technical settings, hours, or flags (e.g. `9:00 AM - 6:00 PM`, `30 mins`).
- For 'update_schema': warmly confirm the update with bolded entities, outline what was added/updated in clean bullet points if multiple items changed, and propose the next operational step or blueprint.
- For 'ask_user': provide thorough, helpful answers using structured bulleted blueprints, mentor the business owner, or ask a contextual design question based on what's missing in the draft.
- For 'finalize': celebrate the go-live and confirm next steps (e.g. "✅ **Your agent is now live!** Customers can start booking.").
- FAILURE TO FILL `question` WILL BREAK THE FRONTEND — the user will see a blank message."""


async def node_llm_semantic_review(state: GraphState) -> dict:
    llm = _get_llm().with_structured_output(SemanticAction)

  
    all_msgs = state.get("messages", [])
    last_msg = all_msgs[-1] if all_msgs else None
    is_system_feedback = isinstance(last_msg, SystemMessage)
    system_feedback_text = str(last_msg.content) if isinstance(last_msg, SystemMessage) else ""

    obs_block = ""
    for m in reversed(all_msgs):
        if isinstance(m, SystemMessage) and "[SYSTEM OBSERVATION" in str(m.content):
            obs_block = f"\n*** POST-UPDATE CANVAS OBSERVATION (GROUND TRUTH) ***\n{m.content}\n"
            break

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
    if agent_id and all_msgs:
       
        raw_user_msg = ""
        for m in reversed(all_msgs):
            if isinstance(m, HumanMessage):
                raw_user_msg = str(m.content)
                break
        if not raw_user_msg and all_msgs:
            raw_user_msg = str(all_msgs[-1].content)

        if raw_user_msg.startswith("Tenant: ") or raw_user_msg.startswith("User: "):
            raw_user_msg = raw_user_msg.split(": ", 1)[1]

        if raw_user_msg.strip():
            try:
                from agent_orchestrator.utils.embedding_util import embed_query
                from agent_orchestrator.utils.qdrant_util import get_qdrant_store

                q_vec = await embed_query(raw_user_msg.strip())
                if q_vec and any(q_vec):
                    facts = await get_qdrant_store().search_relevant_facts(
                        q_vec, tenant_id, agent_id, limit=5, score_threshold=0.45
                    )
                    print("fact blocks", facts, flush=True)
                    if facts:
                        facts_block = (
                            "\nRELEVANT BUSINESS RULES & FACTS RETRIEVED FROM LONG-TERM MEMORY:\n"
                            + "\n".join([f"- {f}" for f in facts])
                            + "\n"
                        )
                    
                    
            except Exception as qe:
                print(
                    f"[node_llm_semantic_review] Warning retrieving long-term facts: {qe}",
                    flush=True,
                )
    draft = state.get("draft", {})

    tenant_tier = state.get("tier")
    if not tenant_tier and tenant_id:
        try:
            redis_client = get_redis_client()
            stored_tier = await redis_client.get(f"tenant:{tenant_id}:tier")
            if stored_tier:
                tenant_tier = stored_tier
        except Exception as re:
            print(f"[node_llm_semantic_review] Warning fetching tenant tier: {re}", flush=True)
    if not tenant_tier:
        tenant_tier = "starter"

    tier_cfg = get_tier_config(tenant_tier)
    print(tier_cfg, "hereeeeee", flush=True)
    max_services = tier_cfg["max_services"]
    max_resources = tier_cfg["max_resources"]

    current_services = [
        s
        for s in draft.get("services", [])
        if isinstance(s, dict) and not s.get("is_deleted", False)
    ]
    current_resources = [
        r
        for r in draft.get("resources", [])
        if isinstance(r, dict) and not r.get("is_deleted", False)
    ]
    svc_count = len(current_services)
    res_count = len(current_resources)

    svc_limit_str = "Unlimited" if max_services == -1 else str(max_services)
    res_limit_str = "Unlimited" if max_resources == -1 else str(max_resources)

    gaps = _compute_structural_gaps(draft)
    gaps_block = ""
    if gaps:
        gap_lines = "\n".join([f"- {g['field']}: {g['question']}" for g in gaps])
        gaps_block = f"""
[REQUIRED MINIMUM DEPLOYMENT CHECKLIST (Unconfigured items needed before live deployment)]
{gap_lines}
"""

    system_prompt = _build_tenant_system_prompt(
        tier_cfg=tier_cfg,
        svc_limit_str=svc_limit_str,
        res_limit_str=res_limit_str,
        summary_block=summary_block,
        facts_block=facts_block,
    )

    # l3
    prior_raw = all_msgs[:-1] if len(all_msgs) > 1 else []
    prior_history: list[BaseMessage] = []
    for m in prior_raw:
        if isinstance(m, SystemMessage):
            continue
        c = str(m.content)
        if isinstance(m, HumanMessage):
            if c.startswith("Tenant: ") or c.startswith("User: "):
                c = c.split(": ", 1)[1]
            prior_history.append(HumanMessage(content=c))
        elif isinstance(m, AIMessage):
            if c.startswith("Agent: "):
                c = c.split(": ", 1)[1]
            prior_history.append(AIMessage(content=c))

    # l4
    latest_msg = all_msgs[-1] if all_msgs else None
    if isinstance(latest_msg, HumanMessage):
        raw_user_content = str(latest_msg.content)
        if raw_user_content.startswith("Tenant: ") or raw_user_content.startswith("User: "):
            raw_user_content = raw_user_content.split(": ", 1)[1]
    elif is_system_feedback:
        raw_user_content = (
            "Please analyze the system execution feedback and correct the draft update."
        )
    else:
        raw_user_content = "Hello, I want to set up my booking agent."

    dynamic_user_tail = f"""{raw_user_content}

[Current Draft Canvas State (Ground Truth)]
{_format_draft_toon(draft)}

[Active Quota Usage]
- Services: {svc_count} / {svc_limit_str}
- Resources: {res_count} / {res_limit_str}
{gaps_block}{obs_block}{post_patch_instruction}
Decide your next action: choose 'update_schema', 'ask_user', or 'finalize' according to the Action Selection Rules. Output valid JSON adhering to SemanticAction."""

    current_human_msg = HumanMessage(content=dynamic_user_tail)
    conversation: list[BaseMessage] = [
        SystemMessage(content=system_prompt),
        *prior_history,
        current_human_msg,
    ]

    try:
        resp = cast(
            SemanticAction,
            await llm.ainvoke(conversation),
        )
    except Exception as e:
        print(f"[Semantic Agent Error] {e}", flush=True)

        gemini_api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY") or ""
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
                    await fallback_llm.ainvoke(conversation),
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

        tenant_tier = state.get("tier")
        if not tenant_tier and tenant_id:
            try:
                redis_client = get_redis_client()
                stored_tier = await redis_client.get(f"tenant:{tenant_id}:tier")
                if stored_tier:
                    tenant_tier = stored_tier
            except Exception as re:
                print(f"[node_apply_draft_update] Warning fetching tenant tier: {re}", flush=True)
        if not tenant_tier:
            tenant_tier = "starter"

        tier_cfg = get_tier_config(tenant_tier)
        max_services = tier_cfg["max_services"]
        max_resources = tier_cfg["max_resources"]

        active_services = [
            s
            for s in updated_draft.get("services", [])
            if isinstance(s, dict) and not s.get("is_deleted", False)
        ]
        if max_services != -1 and len(active_services) > max_services:
            raise TierQuotaExceededException(
                f"Tier quota exceeded: Your {tier_cfg['name']} plan allows a maximum of {max_services} services, "
                f"but this update would result in {len(active_services)} active services. "
                f"Please remove an existing service or upgrade your subscription tier."
            )

        active_resources = [
            r
            for r in updated_draft.get("resources", [])
            if isinstance(r, dict) and not r.get("is_deleted", False)
        ]
        if max_resources != -1 and len(active_resources) > max_resources:
            raise TierQuotaExceededException(
                f"Tier quota exceeded: Your {tier_cfg['name']} plan allows a maximum of {max_resources} resources, "
                f"but this update would result in {len(active_resources)} active resources. "
                f"Please remove an existing resource or upgrade your subscription tier."
            )

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

        step_count = state.get("react_step_count", 0) + 1
        gaps = _compute_structural_gaps(updated_draft)
        gap_fields = [g["field"] for g in gaps]

        try:
            patch_json = json.dumps(draft_update, indent=2, default=str)
        except Exception:
            patch_json = str(draft_update)

        obs_msg = SystemMessage(
            content=(
                f"[SYSTEM OBSERVATION - STEP {step_count}]:\n"
                f"Action 'update_schema' applied to draft canvas successfully.\n\n"
                f"APPLIED JSON PATCH:\n{patch_json}\n\n"
                f"REMAINING DEPLOYMENT CHECKLIST GAPS ({len(gap_fields)}):\n{gap_fields}\n\n"
                f"EVALUATION INSTRUCTION:\n"
                f"Compare the user's latest request against the APPLIED JSON PATCH above:\n"
                f"- If any items, services, staff, or policy changes requested by the user are missing or only partially applied in the patch, emit an 'update_schema' action with the missing fields now.\n"
                f"- If all requested updates are confirmed present in the patch or canvas, choose 'ask_user' (or 'finalize' if explicitly commanded) and summarize the verified updates for the user."
            )
        )

        MAX_REACT_STEPS = 2
        decision = "ask_user" if step_count >= MAX_REACT_STEPS else "evaluate"

        return {
            "draft": updated_draft,
            "decision": decision,
            "pending_draft_update": None,
            "patch_retries": 0,
            "react_step_count": step_count,
            "structural_gaps": gaps,
            "semantic_note": state.get("semantic_note"),
            "messages": [obs_msg],
        }
    except Exception as e:
        retries = state.get("patch_retries", 0) + 1
        print(
            f"[Draft Update Error] Failed applying draft update [retry {retries}/3]: {e}",
            flush=True,
        )
        if isinstance(e, TierQuotaExceededException):
            if retries >= 2:
                return {
                    "decision": "ask_user",
                    "pending_draft_update": None,
                    "patch_retries": 0,
                    "semantic_note": str(e),
                }
            return {
                "decision": "evaluate",
                "pending_draft_update": None,
                "patch_retries": retries,
                "messages": [
                    SystemMessage(
                        content=f"Tier Limit Error: {e}. The draft was NOT updated. Choose 'ask_user' to explain the tier quota limit to the user."
                    )
                ],
            }
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
            "decision": "evaluate",
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

    tenant_tier = state.get("tier")
    if not tenant_tier and tenant_id:
        try:
            redis_client = get_redis_client()
            stored_tier = await redis_client.get(f"tenant:{tenant_id}:tier")
            if stored_tier:
                tenant_tier = stored_tier
        except Exception as re:
            print(f"[node_finalize_and_save] Warning fetching tenant tier: {re}", flush=True)
    if not tenant_tier:
        tenant_tier = "starter"

    tier_cfg = get_tier_config(tenant_tier)
    max_services = tier_cfg["max_services"]
    max_resources = tier_cfg["max_resources"]

    active_services = [
        s
        for s in draft.get("services", [])
        if isinstance(s, dict) and not s.get("is_deleted", False)
    ]
    if max_services != -1 and len(active_services) > max_services:
        note = (
            f"Cannot finalize and deploy your agent: Your {tier_cfg['name']} plan allows a maximum of {max_services} services, "
            f"but this agent currently has {len(active_services)} active services. "
            f"Please remove excess services or upgrade your subscription tier."
        )
        return {
            "status": "awaiting_input",
            "decision": "ask_user",
            "semantic_note": note,
            "messages": [AIMessage(content=note)],
        }

    active_resources = [
        r
        for r in draft.get("resources", [])
        if isinstance(r, dict) and not r.get("is_deleted", False)
    ]
    if max_resources != -1 and len(active_resources) > max_resources:
        note = (
            f"Cannot finalize and deploy your agent: Your {tier_cfg['name']} plan allows a maximum of {max_resources} resources, "
            f"but this agent currently has {len(active_resources)} active resources. "
            f"Please remove excess resources or upgrade your subscription tier."
        )
        return {
            "status": "awaiting_input",
            "decision": "ask_user",
            "semantic_note": note,
            "messages": [AIMessage(content=note)],
        }

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
            err_msg = sync_result.get("error") or "Inventory synchronization failed"
            print(f"[TenantAgent Warning] Inventory sync warning: {err_msg}", flush=True)
            note = f"Cannot finalize agent: {err_msg}"
            return {
                "status": "awaiting_input",
                "decision": "ask_user",
                "semantic_note": note,
                "messages": [AIMessage(content=note)],
            }
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
    if state.get("decision") == "ask_user" or state.get("react_step_count", 0) >= 2:
        return "ask_human_semantic"
    return "llm_semantic_review"
