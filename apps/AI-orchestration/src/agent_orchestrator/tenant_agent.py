"""
tenant_agent.py — Schedulux Tenant Onboarding Agent (LangGraph)

Graph Flow:
  start
    └→ load_draft
         └→ validate_structural_gaps
              ├→ [gaps found]  → ask_human_structural  (interrupt)
              │                     └→ patch_draft → validate_structural_gaps (loop)
              └→ [no gaps]    → llm_semantic_review
                                   ├→ [incomplete] → ask_human_semantic  (interrupt)
                                   │                     └→ patch_draft → validate_structural_gaps
                                   └→ [complete]  → finalize_and_save → END

Design principles:
  - Python structural validator: 0 LLM tokens (free gap detection)
  - LLM receives only a compact summary dict (~300-500 tokens, not the full schema)
  - LangGraph interrupt() for human-in-the-loop (WebSocket/gRPC resumable)
  - MemorySaver checkpoint: sessions survive reconnects (swap for Redis in prod)
  - Thread ID = tenant_id (isolated state per tenant)
"""

from __future__ import annotations

import copy
import json
import os
import re
import jsonpatch
from typing import Annotated, Any, Literal, List, Optional
from datetime import datetime, timezone
from pydantic import BaseModel, Field, ConfigDict
from enum import Enum
from dotenv import load_dotenv
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, StateGraph
from langgraph.graph.message import add_messages
from langgraph.types import interrupt
from typing_extensions import TypedDict

# ── env ───────────────────────────────────────────────────────────────────────
_env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))
load_dotenv(_env_path)

_GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY", "")
_GEMINI_MODEL   = os.environ.get("GEMINI_MODEL", "gemini-1.5-flash")



class GraphState(TypedDict):
    tenant_id:       str
    agent_id:        Optional[str]
    draft:           dict[str, Any]        
    messages:        Annotated[list, add_messages]  
    structural_gaps: list[dict]            # [{field, question, type, ...}]
    pending_field:   str | None
    semantic_note:   str | None          
    decision:        str | None            # "update_schema" | "ask_user" | "finalize"
    pending_patches: list[dict] | None     # RFC 6902 JSON Patches
    status:          str                   # "onboarding" | "complete" | "error"



STRUCTURAL_REQUIREMENTS: list[dict] = [
    {
        "field":    "business_profile.name",
        "question": "What is the name of your business?",
        "type":     "scalar",
    },
    {
        "field":    "business_profile.vertical",
        "question": (
            "What industry are you in? "
            "(e.g. medical_dental, auto_repair, lodging, salon, legal, custom)"
        ),
        "type": "scalar",
    },
    {
        "field":    "business_profile.timezone",
        "question": "What timezone are your operating hours in? (e.g. Asia/Kolkata, America/New_York)",
        "type":     "scalar",
    },
    {
        "field":    "business_profile.contact.public_phone",
        "question": "What is your public contact phone number?",
        "type":     "scalar",
    },
    {
        "field":    "operating_hours",
        "question": (
            "What are your operating hours? "
            "Describe your weekly schedule (e.g. Mon-Fri 9am-6pm, Sat 10am-2pm, closed Sun)."
        ),
        "type": "operating_hours",
    },
    {
        "field":    "services",
        "question": (
            "Please tell me about your first service — its name, duration in minutes, "
            "cleanup/buffer time in minutes, and price."
        ),
        "type": "services_present",
    },
    {
        "field":    "services[*].name",
        "question": "What is the name of this service?",
        "type":     "per_service",
        "attr":     "name",
    },
    {
        "field":    "services[*].duration_minutes",
        "question": "How many minutes does '{service_name}' take?",
        "type":     "per_service",
        "attr":     "duration_minutes",
    },
    {
        "field":    "services[*].buffer_minutes",
        "question": "How many minutes of cleanup/buffer time after '{service_name}'? (enter 0 if none)",
        "type":     "per_service",
        "attr":     "buffer_minutes",
    },
    {
        "field":    "services[*].price.amount",
        "question": "What is the price of '{service_name}'? (enter 0 if free)",
        "type":     "per_service_nested",
        "attr":     "price.amount",
    },
    {
        "field":    "resources",
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
    cur = d
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



def _get_llm() -> ChatGoogleGenerativeAI:
    return ChatGoogleGenerativeAI(
        model=_GEMINI_MODEL,
        google_api_key=_GEMINI_API_KEY,
        temperature=0.2,
    )



def _extract_text(resp) -> str:
    content = resp.content
    if isinstance(content, list):
        return " ".join(b.get("text", "") if isinstance(b, dict) else str(b) for b in content)
    return str(content)

class TimeSlot(BaseModel):
    start: str = Field(description="Start time in HH:MM 24h format")
    end: str = Field(description="End time in HH:MM 24h format")

class OperatingHours(BaseModel):
    monday: List[TimeSlot] = Field(default_factory=list)
    tuesday: List[TimeSlot] = Field(default_factory=list)
    wednesday: List[TimeSlot] = Field(default_factory=list)
    thursday: List[TimeSlot] = Field(default_factory=list)
    friday: List[TimeSlot] = Field(default_factory=list)
    saturday: List[TimeSlot] = Field(default_factory=list)
    sunday: List[TimeSlot] = Field(default_factory=list)

async def _parse_operating_hours_with_llm(raw_text: str, llm: ChatGoogleGenerativeAI) -> dict:
    """Converts free-form hours description → {monday: [{start,end}], ...}"""
    structured_llm = llm.with_structured_output(OperatingHours)
    prompt = f"Convert this business hours description into structured data:\n{raw_text}"
    try:
        resp = await structured_llm.ainvoke([HumanMessage(content=prompt)])
        return resp.dict()
    except Exception as e:
        print(f"[LLM Pydantic Parse Error] {e}", flush=True)
        slot = [{"start": "09:00", "end": "17:00"}]
        return {d: slot for d in ("monday","tuesday","wednesday","thursday","friday")} | {"saturday":[],"sunday":[]}

class ServiceDetails(BaseModel):
    name: str = Field(description="Name of the service")
    description: str | None = Field(default=None, description="Description of the service, if mentioned")
    duration_minutes: int = Field(description="Duration in minutes", default=30)
    buffer_minutes: int = Field(description="Buffer/cleanup time in minutes", default=0)
    price_amount: float = Field(description="Price amount", default=0.0)
    price_currency: str = Field(description="Currency code", default="USD")



async def _parse_service_with_llm(raw_text: str, llm: ChatGoogleGenerativeAI) -> dict | None:
    """Parses a free-form service description → structured service dict."""
    structured_llm = llm.with_structured_output(ServiceDetails)
    prompt = f"Extract service details from this input:\n{raw_text}"
    try:
        p = await structured_llm.ainvoke([HumanMessage(content=prompt)])
        svc_name = p.name
        service_id = "srv_" + svc_name.lower().replace(" ", "_")[:24]
        return {
            "service_id":       service_id,
            "name":             svc_name,
            "description":      p.description or "",
            "duration_minutes": p.duration_minutes,
            "buffer_minutes":   p.buffer_minutes,
            "price": {
                "type":     "fixed",
                "amount":   p.price_amount,
                "currency": p.price_currency,
            },
            "eligible_resource_ids": [],
            "required_asset_ids":    [],
        }
    except Exception as e:
        print(f"[LLM Pydantic Parse Error] {e}", flush=True)
        return None

class PartialServiceUpdate(BaseModel):
    duration_minutes: int | None = Field(default=None, description="Duration in minutes, if mentioned")
    buffer_minutes: int | None = Field(default=None, description="Buffer/cleanup time in minutes, if mentioned")
    price_amount: float | None = Field(default=None, description="Price amount, if mentioned")
    name: str | None = Field(default=None, description="Name of the service, if mentioned")
    description: str | None = Field(default=None, description="Description of the service, if mentioned")

async def _parse_partial_service_update(raw_text: str, current_service: dict, llm: ChatGoogleGenerativeAI) -> dict:
    structured_llm = llm.with_structured_output(PartialServiceUpdate)
    prompt = (
        f"The user is updating a service. Current details: {json.dumps(current_service)}.\n"
        f"Extract any new or updated fields from the user's input:\n{raw_text}"
    )
    try:
        resp = await structured_llm.ainvoke([HumanMessage(content=prompt)])
        return resp.dict(exclude_none=True)
    except Exception as e:
        print(f"[LLM Pydantic Parse Error] {e}", flush=True)
        return {}


class ResourceDetails(BaseModel):
    name: str = Field(description="Name of the person, staff member, room, chair, bay, or asset")
    resource_type: Literal["staff", "physical_asset"] = Field(
        default="staff",
        description="Whether this is a human staff member ('staff') or a room/chair/equipment/bay ('physical_asset')"
    )
    title: str | None = Field(default=None, description="Job title, role, or asset category (e.g. Senior Barber, Doctor, Bay 1, Deluxe Suite)")
    description: str | None = Field(default=None, description="Brief description")


async def _parse_resource_with_llm(raw_text: str, llm: ChatGoogleGenerativeAI) -> dict | None:
    """Parses a free-form resource description → structured resource dict."""
    structured_llm = llm.with_structured_output(ResourceDetails)
    prompt = f"Extract resource details from this input:\n{raw_text}"
    try:
        p = await structured_llm.ainvoke([HumanMessage(content=prompt)])
        res_name = p.name
        clean_name = re.sub(r'[^a-zA-Z0-9_]', '_', res_name.lower().replace(" ", "_"))
        resource_id = "res_" + clean_name[:24]
        return {
            "resource_id":            resource_id,
            "resource_type":          p.resource_type,
            "name":                   res_name,
            "title":                  p.title or "",
            "category":               p.resource_type,
            "description":            p.description or "",
            "is_bookable":            True,
            "dispatch_status":        "active",
            "custom_shift_overrides": {},
        }
    except Exception as e:
        print(f"[LLM Resource Parse Error] {e}", flush=True)
        return None


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
            has_slot = any(
                isinstance(oh.get(d), list) and len(oh[d]) > 0
                for d in weekdays
            )
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
                    svc_name = svc.get("name", f"Service #{idx+1}")
                    gaps.append({
                        **req,
                        "service_idx": idx,
                        "question":    req["question"].format(service_name=svc_name),
                    })

        elif rtype == "per_service_nested":
            for idx, svc in enumerate(draft.get("services", [])):
                val = _get_nested(svc, req["attr"])
                if val is None:
                    svc_name = svc.get("name", f"Service #{idx+1}")
                    gaps.append({
                        **req,
                        "service_idx": idx,
                        "question":    req["question"].format(service_name=svc_name),
                    })

    return gaps



async def _apply_patch(draft: dict, gap: dict, answer: str, llm: ChatGoogleGenerativeAI) -> dict:
    draft = copy.deepcopy(draft)
    

    if isinstance(answer, list):
        answer = answer[0] if answer else ""
    answer = str(answer)
    
    rtype = gap["type"]

    if rtype == "scalar":
        _set_nested(draft, gap["field"], answer.strip())

    elif rtype == "operating_hours":
        parsed = await _parse_operating_hours_with_llm(answer, llm)
        oh = draft.get("operating_hours", {})
        oh.update(parsed)
        draft["operating_hours"] = oh

    elif rtype == "services_present":
        svc = await _parse_service_with_llm(answer, llm)
        if svc:
            existing_resources = draft.get("resources", [])
            if existing_resources and not svc.get("eligible_resource_ids"):
                svc["eligible_resource_ids"] = [existing_resources[0].get("resource_id")]
            draft.setdefault("services", []).append(svc)

    elif rtype == "resources_present":
        res = await _parse_resource_with_llm(answer, llm)
        if res:
            draft.setdefault("resources", []).append(res)
            for svc in draft.get("services", []):
                if not svc.get("eligible_resource_ids"):
                    svc["eligible_resource_ids"] = [res["resource_id"]]

    elif rtype in ("per_service", "per_service_nested"):
        idx = gap.get("service_idx", 0)
        svcs = draft.get("services", [])
        if idx < len(svcs):
            updates = await _parse_partial_service_update(answer, svcs[idx], llm)
            
            if "duration_minutes" in updates:
                svcs[idx]["duration_minutes"] = updates["duration_minutes"]
            if "buffer_minutes" in updates:
                svcs[idx]["buffer_minutes"] = updates["buffer_minutes"]
            if "name" in updates:
                svcs[idx]["name"] = updates["name"]
            if "description" in updates:
                svcs[idx]["description"] = updates["description"]
            if "price_amount" in updates:
                if "price" not in svcs[idx] or not isinstance(svcs[idx]["price"], dict):
                    curr = draft.get("business_profile", {}).get("currency", "USD")
                    svcs[idx]["price"] = {"type": "fixed", "currency": curr}
                svcs[idx]["price"]["amount"] = updates["price_amount"]

    return draft




def _build_semantic_review_prompt(draft: dict) -> str:
    bp       = draft.get("business_profile", {})
    services = draft.get("services", [])
    resources= draft.get("resources", [])

    svc_lines = "\n".join(
        f"  • {s.get('name','?')} — {s.get('duration_minutes','?')}min "
        f"+ {s.get('buffer_minutes',0)}min buffer, "
        f"{s.get('price',{}).get('currency','USD')} {s.get('price',{}).get('amount','?')}"
        for s in services
    ) or "  (none)"

    res_lines = "\n".join(
        f"  • {r.get('name','?')} ({r.get('resource_type','?')})"
        for r in resources
    ) or "  (none)"

    return f"""You are reviewing a Schedulux AI agent config before it goes live.

Business: {bp.get('name','?')} | Vertical: {bp.get('vertical','?')} | Timezone: {bp.get('timezone','?')}

Services ({len(services)}):
{svc_lines}

Staff / Resources ({len(resources)}):
{res_lines}

Task:
1. For this vertical, are there OBVIOUSLY IMPORTANT services missing that most businesses of this type offer?
2. Any critical setup issues?

Rules:
- If everything looks reasonably complete, reply exactly: COMPLETE
- If something important is missing, ask ONE specific short question to the tenant.
- Do NOT ask about optional fields. Do NOT repeat already-filled fields.
- Do NOT add preamble. Just the question or COMPLETE."""


def _format_draft_toon(draft: dict) -> str:
    """
    Serializes the draft schema using Recursive Pruning + TOON (Token-Oriented Object Notation).
    Automatically captures 100% of schema fields (future-proof against schema drift),
    strips empty/null syntax bloat, and provides optimal token compression for LLM attention.
    """
    def prune_empty(d):
        if isinstance(d, dict):
            return {k: prune_empty(v) for k, v in d.items() if v not in (None, "", {}, [])}
        elif isinstance(d, list):
            return [prune_empty(v) for v in d if v not in (None, "", {}, [])]
        return d

    pruned = prune_empty(copy.deepcopy(draft))
    try:
        import toon
        return toon.encode(pruned)
    except Exception as e:
        print(f"[TOON Warning] Fallback to pruned json: {e}", flush=True)
        return json.dumps(pruned, indent=2)


async def node_load_draft(state: GraphState) -> dict:
    """Entry point. Ensures baseline dict structure."""
    draft = copy.deepcopy(state.get("draft", {}))
    agent_id = state.get("agent_id") or draft.get("agent_id") or f"agent_{state['tenant_id']}_v1"
    draft.setdefault("tenant_id",        state["tenant_id"])
    draft.setdefault("agent_id",         agent_id)
    draft.setdefault("status",           "draft")
    draft.setdefault("schema_version",   "2.4")
    draft.setdefault("business_profile", {})
    draft.setdefault("operating_hours",  {})
    draft.setdefault("services",         [])
    draft.setdefault("resources",        [])
    return {
        "tenant_id":       state["tenant_id"],
        "agent_id":        agent_id,
        "draft":           draft,
        "status":          "onboarding",
        "structural_gaps": [],
        "pending_field":   None,
        "semantic_note":   None,
        "decision":        None,
        "pending_patches": None,
    }


async def node_validate_structural(state: GraphState) -> dict:
    """Pure Python. Zero LLM calls. Computes all structural gaps."""
    gaps = _compute_structural_gaps(state["draft"])
    return {"structural_gaps": gaps}


async def node_ask_human_structural(state: GraphState) -> dict:
    """
    Pops the first structural gap and raises a LangGraph interrupt.
    The graph is paused here. Resume by calling Command(resume=user_answer).
    """
    gaps = state["structural_gaps"]
    if not gaps:
        return {}

    gap = gaps[0]

    user_answer: str = interrupt({
        "type":     "structural_gap",
        "field":    gap["field"],
        "question": gap["question"],
    })

 
    llm = _get_llm()
    updated_draft = await _apply_patch(state["draft"], gap, user_answer, llm)
    return {
        "draft":         updated_draft,
        "pending_field": gap["field"],
        "messages":      [HumanMessage(content=f"[{gap['field']}] {user_answer}")],
    }


class SemanticAction(BaseModel):
    action: Literal["update_schema", "ask_user", "finalize"] = Field(description="Action to take based on current state")
    question: str | None = Field(default=None, description="The question to ask the user, if action is ask_user or finalize")
    patches: list[dict] | None = Field(default=None, description="RFC 6902 JSON Patches to apply, if action is update_schema")

async def node_llm_semantic_review(state: GraphState) -> dict:
    """
    Acts as the 'Main Brain' for the semantic phase.
    Decides whether to apply JSON patches, ask the user a question, or finalize setup.
    """
    llm = _get_llm().with_structured_output(SemanticAction)
    
    history_msgs = state.get("messages", [])[-6:]
    history = "\n".join([m.content for m in history_msgs]) if history_msgs else "No conversation history yet."
    
 
    last_msg = history_msgs[-1] if history_msgs else None
    just_applied_patches = bool(
        last_msg
        and isinstance(last_msg, SystemMessage)
        and "Successfully applied" in str(last_msg.content)
    )

    post_patch_instruction = ""
    if just_applied_patches:
        post_patch_instruction = """
*** ATTENTION: YOU JUST APPLIED JSON PATCHES IN THE IMMEDIATE PRECEDING STEP ***
- You CANNOT choose 'update_schema' again in this step.
- Review the updated draft below:
  * If any mandatory dependent fields are missing (e.g., active deposit missing payment processor or UPI ID, or emergency triage missing contact), you MUST choose 'ask_user' and ask for that specific detail.
  * If the draft is completely valid, functional, and has no missing dependent fields, you MUST choose 'finalize'.
"""

    prompt = f"""You are the Schedulux AI Configuration Agent.
Your job is to review the JSON draft, apply user changes, and converse with the user to ensure the configuration is logically sound, functional, and complete.

CRITICAL RULES FOR REASONING & ACTIONS:
1. GRAMMAR & CASING: Automatically correct spelling, casing, and grammar from user messages before generating patches (e.g., "tier punchuree repai" -> "Tire Puncture Repair").
2. SINGLE-TURN PATCHES: If the user provides multiple updates, generate ALL required JSON patches in a SINGLE turn. Do not break them down into multiple turns.
3. ANTI-HALLUCINATION / NEVER GUESS DETAILS:
   - NEVER assume, default, or invent technical details or configuration values that the user did not provide.
   - Specifically, NEVER guess payment processors (e.g., upi_direct, stripe), payment IDs (upi_id), phone numbers, email addresses, or business verticals.

DOMAIN INTEGRITY & DEPENDENCY RULES:
1. DEPOSITS & PAYMENTS:
   - When configuring a deposit (deposit.required is True or deposit.amount > 0):
     * A payment method (`processor`) is MANDATORY (one of: 'upi_direct', 'stripe', 'bank_transfer', 'cash_on_arrival').
     * If the user did NOT specify a processor, DO NOT guess one! Apply the deposit amount patch, and then you MUST ASK the user which processor they want to use.
     * If `processor == "upi_direct"`: `upi_id` is MANDATORY. If missing, you MUST ask the user for their UPI ID before finalizing.
     * If `processor == "bank_transfer"`: `payment_instructions` is MANDATORY. If missing, ask the user for account / payment instructions.
     * `deposit.amount` cannot exceed `price.amount` (unless `price.type` is "variable").
     * If `price.type == "free"`, deposit cannot be required (`deposit.required` must be False).
2. CURRENCY SYNCHRONIZATION:
   - If the user specifies prices or deposits in a specific currency (e.g., rupees / INR / ₹, dollars / USD / $, euros / EUR / €, pounds / GBP / £):
     * Synchronize `business_profile.currency` to the standard ISO 3-letter currency code (e.g., "INR", "USD", "EUR", "GBP").
     * Synchronize each modified service's `price.currency` to match.
3. EMERGENCY & HANDOFF GUARDRAILS:
   - If `guardrails.human_handoff.enabled` is True: `reception_contact` and `handoff_message` MUST NOT be empty. If missing, ask the user.
4. HEALTHCARE / HIPAA COMPLIANCE:
   - If `compliance.hipaa_mode` is True: ensure `guardrails.phi_scrubbing.enabled` is True and `compliance.zero_hallucination_mode` is True.
5. SERVICES & RESOURCES:
   - AT LEAST ONE RESOURCE IS MANDATORY: `resources[]` MUST contain at least one bookable resource (a staff member or a physical asset like a room, chair, or bay). If `resources[]` is empty, you CANNOT finalize; you MUST choose 'ask_user' and ask who or what delivers their service.
   - Any IDs in `services[].eligible_resource_ids` must correspond to actual resources in `resources[]`. Always link services to eligible resources.
   - For services, specify `booking_mode`: "time_slot" for services booked at clock hours/minutes (appointments, consultations), or "date_range" for multi-day bookings (rentals, stays). Default: "time_slot".
   - For `time_slot` services, `duration_minutes` must be > 0.
6. AVOID REPEATED QUESTIONS:
   - Do NOT re-ask questions that the user already answered or declined in recent conversation.
{post_patch_instruction}
CRITICAL: When generating JSON patches, you MUST use ONLY these exact fields:
- business_profile: name, vertical, timezone, locale, currency, address
- business_profile.contact: support_email, public_phone, escalation_phone
- business_profile.terminology: customer_singular, customer_plural, primary_metric, action_metric
- business_profile.brand: primary_color, logo_url
- services[]: service_id, name, category, description, duration_minutes, buffer_minutes, booking_mode (time_slot|date_range), allocation_model (single_resource|multi_resource|pooled|asset_only), eligible_resource_ids, required_asset_ids, recall_interval_days
- services[].price: type (fixed|starting_at|hourly|free|custom), amount, currency
- services[].deposit: required, amount, processor, upi_id, qr_code_url, confirmation_method, payment_instructions
- resources[]: resource_id, resource_type (staff|room|chair|bay|equipment|asset|vehicle), name, title, category, description, is_bookable, dispatch_status (active|on_leave|maintenance|retired|inactive), custom_shift_overrides
- operating_hours: monday, tuesday, wednesday, thursday, friday, saturday, sunday (each is list of {{start: "HH:MM", end: "HH:MM"}}), blackout_dates (list of {{date: "YYYY-MM-DD", reason, is_closed}})
- scheduling_engine: allocation_model(date_range or time_slot), default_lead_time_hours, max_advance_booking_days, cancellation_window_hours
- widget_config: agent_name, avatar_url, initial_greeting, fallback_message, position, launcher_style, sound_on_load, auto_expand_delay_seconds, platform_sources, whitelisted_domains
- compliance: hipaa_mode, phi_scrubbing, data_retention_policy, zero_hallucination_mode, audit_trail_enabled
- guardrails.phi_scrubbing: enabled, policy, description, hipaa_compliant
- guardrails.triage_emergency: enabled, keywords, response_override
- guardrails.human_handoff: enabled, trigger_topics, reception_contact, handoff_message
- supervisor_prompt: (string)

Current Draft (Token-Optimized TOON Notation):
{_format_draft_toon(state['draft'])}

NOTE ON TOON NOTATION:
The draft above is formatted in TOON (Token-Oriented Object Notation) for optimal token efficiency.
- Arrays (e.g. `services[N]`, `resources[N]`) declare keys in `{...}` headers followed by compact data rows, or YAML lists with `-`.
- Array rows correspond to 0-indexed elements (row 1 is index 0, row 2 is index 1, etc.) for your RFC 6902 patch paths (e.g. `/services/0/price/amount`).

Recent Conversation:
{history}

Decide your next action:
1. 'update_schema': The user requested a configuration change. Generate the JSON patches (e.g. op: replace/add/remove). Only populate fields explicitly mentioned. Do NOT invent missing details.
2. 'ask_user': A mandatory dependent field is missing (such as payment processor or UPI ID for an active deposit, or emergency contact for active triage), or the schema has a direct logical contradiction, or the user asked a question you must answer.
3. 'finalize': All user-requested changes are applied AND all dependent mandatory fields are complete. Generate a welcoming confirmation message acknowledging the setup and suggesting 1 or 2 specific advanced features relevant to their industry.
"""

    try:
        print("Start streaming", flush=True)
        resp = await llm.ainvoke([SystemMessage(content="You are a Schedulux agent."), HumanMessage(content=prompt)])
        print("End streaming", flush=True)
    except Exception as e:
        print(f"[Semantic Agent Error] {e}", flush=True)
        return {"decision": "finalize", "pending_patches": None, "semantic_note": None}

    
    if just_applied_patches and resp.action == "update_schema":
        print("[Semantic Agent Brain]  Forcing ask_user or finalize.", flush=True)
        if resp.question:
            return {
                "decision": "ask_user",
                "pending_patches": None,
                "semantic_note": resp.question,
            }
        else:
            return {
                "decision": "finalize",
                "pending_patches": None,
                "semantic_note": "Configuration updated. What would you like to configure next?",
            }

    if resp.action == "update_schema" and resp.patches:
        print(f"[Semantic Agent Brain] Decided to update schema with {len(resp.patches)} patches.", flush=True)
        return {
            "decision": "update_schema",
            "pending_patches": resp.patches,
            "semantic_note": None,
        }
    elif resp.action == "ask_user" and resp.question:
        print(f"[Semantic Agent Brain] Asking: {resp.question[:120]}", flush=True)
        return {
            "decision": "ask_user",
            "pending_patches": None,
            "semantic_note": resp.question,
        }
    else:
        print(f"[Semantic Agent Brain] Finalizing setup.", flush=True)
        return {
            "decision": "finalize",
            "pending_patches": None,
            "semantic_note": resp.question or "✅ Your agent configuration is saved and live! What would you like to configure next?",
        }


class StrictContactSchema(BaseModel):
    model_config = ConfigDict(extra="forbid")
    support_email: Optional[str] = None
    public_phone: Optional[str] = None
    escalation_phone: Optional[str] = None

class StrictTerminologySchema(BaseModel):
    model_config = ConfigDict(extra="forbid")
    customer_singular: Optional[str] = None
    customer_plural: Optional[str] = None
    primary_metric: Optional[str] = None
    action_metric: Optional[str] = None

class StrictBrandSchema(BaseModel):
    model_config = ConfigDict(extra="forbid")
    primary_color: Optional[str] = None
    logo_url: Optional[str] = None

class StrictBusinessProfileSchema(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: Optional[str] = None
    vertical: Optional[str] = None
    timezone: Optional[str] = None
    locale: Optional[str] = None
    currency: Optional[str] = None
    address: Optional[str] = None
    contact: Optional[StrictContactSchema] = None
    terminology: Optional[StrictTerminologySchema] = None
    brand: Optional[StrictBrandSchema] = None

class ServiceAllocationModel(str, Enum):
    SINGLE_RESOURCE = "single_resource"
    MULTI_RESOURCE = "multi_resource"
    POOLED = "pooled"
    ASSET_ONLY = "asset_only"

class BookingMode(str, Enum):
    TIME_SLOT = "time_slot"
    DATE_RANGE = "date_range"

class ResourceType(str, Enum):
    STAFF = "staff"
    ROOM = "room"
    CHAIR = "chair"
    BAY = "bay"
    EQUIPMENT = "equipment"
    ASSET = "asset"
    VEHICLE = "vehicle"

class DispatchStatus(str, Enum):
    ACTIVE = "active"
    ON_LEAVE = "on_leave"
    MAINTENANCE = "maintenance"
    RETIRED = "retired"
    INACTIVE = "inactive"

class PriceType(str, Enum):
    FIXED = "fixed"
    STARTING_AT = "starting_at"
    HOURLY = "hourly"
    FREE = "free"
    CUSTOM = "custom"

class StrictPriceSchema(BaseModel):
    model_config = ConfigDict(extra="forbid")
    type: Optional[PriceType] = None
    amount: Optional[float] = None
    currency: Optional[str] = None

class StrictDepositSchema(BaseModel):
    model_config = ConfigDict(extra="forbid")
    required: Optional[bool] = None
    amount: Optional[float] = None
    processor: Optional[str] = None
    upi_id: Optional[str] = None
    qr_code_url: Optional[str] = None
    confirmation_method: Optional[str] = None
    payment_instructions: Optional[str] = None

class AllocationModel(str, Enum):
    TIME_SLOT = "time_slot"
    DATE_RANGE = "date_range"


class StrictServiceSchema(BaseModel):
    model_config = ConfigDict(extra="forbid")
    service_id: Optional[str] = None
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    duration_minutes: Optional[int] = None
    buffer_minutes: Optional[int] = None
    allocation_model: Optional[ServiceAllocationModel] = None
    booking_mode: Optional[BookingMode] = None
    price: Optional[StrictPriceSchema] = None
    deposit: Optional[StrictDepositSchema] = None
    eligible_resource_ids: Optional[list[str]] = None
    required_asset_ids: Optional[list[str]] = None
    recall_interval_days: Optional[int] = None

class StrictResourceSchema(BaseModel):
    model_config = ConfigDict(extra="forbid")
    resource_id: Optional[str] = None
    resource_type: Optional[ResourceType] = None
    name: Optional[str] = None
    title: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    is_bookable: Optional[bool] = None
    dispatch_status: Optional[DispatchStatus] = None
    custom_shift_overrides: Optional[dict] = None

class StrictTimeSlotSchema(BaseModel):
    model_config = ConfigDict(extra="forbid")
    start: Optional[str] = None
    end: Optional[str] = None

class StrictBlackoutDateSchema(BaseModel):
    model_config = ConfigDict(extra="forbid")
    date: Optional[str] = None
    reason: Optional[str] = None
    is_closed: Optional[bool] = None

class StrictOperatingHoursSchema(BaseModel):
    model_config = ConfigDict(extra="forbid")
    monday: Optional[list[StrictTimeSlotSchema]] = None
    tuesday: Optional[list[StrictTimeSlotSchema]] = None
    wednesday: Optional[list[StrictTimeSlotSchema]] = None
    thursday: Optional[list[StrictTimeSlotSchema]] = None
    friday: Optional[list[StrictTimeSlotSchema]] = None
    saturday: Optional[list[StrictTimeSlotSchema]] = None
    sunday: Optional[list[StrictTimeSlotSchema]] = None
    blackout_dates: Optional[list[StrictBlackoutDateSchema]] = None

class StrictSchedulingEngineSchema(BaseModel):
    model_config = ConfigDict(extra="forbid")
    allocation_model: Optional[AllocationModel] = None
    default_lead_time_hours: Optional[int] = None
    max_advance_booking_days: Optional[int] = None
    cancellation_window_hours: Optional[int] = None

class StrictWidgetConfigSchema(BaseModel):
    model_config = ConfigDict(extra="forbid")
    agent_name: Optional[str] = None
    avatar_url: Optional[str] = None
    initial_greeting: Optional[str] = None
    fallback_message: Optional[str] = None
    position: Optional[str] = None
    launcher_style: Optional[str] = None
    sound_on_load: Optional[bool] = None
    auto_expand_delay_seconds: Optional[int] = None
    platform_sources: Optional[list[str]] = None
    whitelisted_domains: Optional[list[str]] = None

class StrictComplianceSchema(BaseModel):
    model_config = ConfigDict(extra="forbid")
    hipaa_mode: Optional[bool] = None
    phi_scrubbing: Optional[bool] = None
    data_retention_policy: Optional[str] = None
    zero_hallucination_mode: Optional[bool] = None
    audit_trail_enabled: Optional[bool] = None

class StrictPhiScrubSchema(BaseModel):
    model_config = ConfigDict(extra="forbid")
    enabled: Optional[bool] = None
    policy: Optional[str] = None
    description: Optional[str] = None
    hipaa_compliant: Optional[bool] = None

class StrictTriageEmergencySchema(BaseModel):
    model_config = ConfigDict(extra="forbid")
    enabled: Optional[bool] = None
    keywords: Optional[list[str]] = None
    response_override: Optional[str] = None

class StrictHumanHandoffSchema(BaseModel):
    model_config = ConfigDict(extra="forbid")
    enabled: Optional[bool] = None
    trigger_topics: Optional[list[str]] = None
    reception_contact: Optional[str] = None
    handoff_message: Optional[str] = None

class StrictGuardrailsSchema(BaseModel):
    model_config = ConfigDict(extra="forbid")
    phi_scrubbing: Optional[StrictPhiScrubSchema] = None
    triage_emergency: Optional[StrictTriageEmergencySchema] = None
    human_handoff: Optional[StrictHumanHandoffSchema] = None

class StrictDraftPatchValidator(BaseModel):
    model_config = ConfigDict(extra="ignore")
    business_profile: Optional[StrictBusinessProfileSchema] = None
    services: Optional[list[StrictServiceSchema]] = None
    resources: Optional[list[StrictResourceSchema]] = None
    operating_hours: Optional[StrictOperatingHoursSchema] = None
    scheduling_engine: Optional[StrictSchedulingEngineSchema] = None
    widget_config: Optional[StrictWidgetConfigSchema] = None
    compliance: Optional[StrictComplianceSchema] = None
    guardrails: Optional[StrictGuardrailsSchema] = None
    supervisor_prompt: Optional[str] = None



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
        patcher = jsonpatch.JsonPatch(patches)
        updated_draft = patcher.apply(copy.deepcopy(state["draft"]))
        
        StrictDraftPatchValidator.model_validate(updated_draft)
        
        tenant_id = state.get("tenant_id", "")
        agent_id = state.get("agent_id") or updated_draft.get("agent_id", "")

       
        if tenant_id and agent_id:
            try:
                from agent_orchestrator.redis_client import set_cached_draft
                await set_cached_draft(tenant_id, agent_id, updated_draft)
            except Exception as re:
                print(f"[Patch Node] Redis cache write warning: {re}", flush=True)

        print(f"[Patch Node] Applied {len(patches)} patches to draft and passed schema validation (cached in Redis).", flush=True)
        return {
            "draft": updated_draft,
            "decision": None,
            "pending_patches": None,
            "messages": [SystemMessage(content=f"Successfully applied {len(patches)} JSON patches. The schema is now updated. Analyze the new draft and decide your next move. DO NOT repeat these exact patches.")],
        }
    except Exception as e: 
        print(f"[Patch Node Error] Failed applying patches (or validation): {e}", flush=True)
        return {
            "decision": None,
            "pending_patches": None,
            "messages": [SystemMessage(content=f"Error applying JSON patches: {e}. The draft was NOT updated. Please generate a corrected patch.")],
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
    question = state.get("semantic_note") or "Do you have any more changes?"

   
    if tenant_id and agent_id and current_draft:
        try:
            from agent_orchestrator.models import AgentDraft, init_db
            import secrets
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
                print(f"[Ask Human Node] Persisted turn checkpoint to AgentDraft ({tenant_id}/{agent_id})", flush=True)
        except Exception as e:
            print(f"[Ask Human Node Warning] Failed to persist AgentDraft turn checkpoint: {e}", flush=True)

    user_answer: str = interrupt({
        "type":     "semantic_review",
        "question": question,
    })

    if isinstance(user_answer, list):
        user_answer = user_answer[0] if user_answer else ""
    user_answer = str(user_answer)

    return {
        "decision":      None,
        "semantic_note": None,  
        "messages": [
            HumanMessage(content=f"Agent: {question}"), 
            HumanMessage(content=f"User: {user_answer}")
        ],
    }


async def node_finalize_and_save(state: GraphState) -> dict:
    """
    Stamps the config as live and upserts to MongoDB via Beanie.
    One live config per tenant (upsert by tenant_id).
    """
    from agent_orchestrator.models import (
        AgentRuntimeConfig,
        BusinessProfileEmbed,
        ContactEmbed,
        OperatingHoursEmbed,
        BlackoutDateEmbed,
        SchedulingEngineEmbed,
        init_db,
    )

    await init_db()

    draft     = state["draft"]
    tenant_id = state["tenant_id"]
    agent_id  = draft.get("agent_id") or state.get("agent_id") or f"agent_{tenant_id}_v1"

    sync_result: dict = {}
    try:
        from agent_orchestrator.scheduling_client import sync_agent_inventory
        sync_result = await sync_agent_inventory(tenant_id, agent_id, draft)
        if sync_result.get("success"):
            draft = sync_result["draft"]
            print(f"[TenantAgent] Inventory sync succeeded ({sync_result.get('resources_synced')} resources, {sync_result.get('services_synced')} services)", flush=True)
        else:
            print(f"[TenantAgent Warning] Inventory sync warning: {sync_result.get('error')}", flush=True)
    except Exception as se:
        print(f"[TenantAgent Warning] Unexpected exception during inventory sync: {se}", flush=True)

    bp   = draft.get("business_profile", {})
    ct   = bp.get("contact", {})
    business_profile = BusinessProfileEmbed(
        name     = bp.get("name", ""),
        vertical = bp.get("vertical", ""),
        timezone = bp.get("timezone", "UTC"),
        locale   = bp.get("locale"),
        currency = bp.get("currency", "USD"),
        address  = bp.get("address"),
        contact  = ContactEmbed(
            support_email    = ct.get("support_email"),
            public_phone     = ct.get("public_phone"),
            escalation_phone = ct.get("escalation_phone"),
        ),
    )

    oh = draft.get("operating_hours", {})
    operating_hours = OperatingHoursEmbed(
        monday    = oh.get("monday",    []),
        tuesday   = oh.get("tuesday",   []),
        wednesday = oh.get("wednesday", []),
        thursday  = oh.get("thursday",  []),
        friday    = oh.get("friday",    []),
        saturday  = oh.get("saturday",  []),
        sunday    = oh.get("sunday",    []),
        blackout_dates = [
            BlackoutDateEmbed(**bd)
            for bd in oh.get("blackout_dates", [])
        ],
    )

    se = draft.get("scheduling_engine", {})
    scheduling_engine = SchedulingEngineEmbed(
        allocation_model          = se.get("allocation_model", "time_slot"),
        default_lead_time_hours   = se.get("default_lead_time_hours", 2),
        max_advance_booking_days  = se.get("max_advance_booking_days", 60),
        cancellation_window_hours = se.get("cancellation_window_hours", 24),
        hold_duration_minutes     = int(os.environ.get("HOLD_DURATION_MINUTES", 10)),
    )

    agent_id = draft.get("agent_id") or state.get("agent_id") or f"agent_{tenant_id}_v1"

    existing_config = await AgentRuntimeConfig.find_one({"tenant_id": tenant_id, "agent_id": agent_id})
    if not existing_config:
        existing_config = AgentRuntimeConfig(
            tenant_id=tenant_id,
            agent_id=agent_id,
        )

    existing_config.schema_version = "2.4"
    existing_config.status = "live"
    existing_config.compiled_at = datetime.now(timezone.utc)
    existing_config.business_profile = business_profile
    existing_config.operating_hours = operating_hours
    existing_config.scheduling_engine = scheduling_engine
    existing_config.services = sync_result.get("services", [])
    existing_config.resources = sync_result.get("resources", [])
    existing_config.supervisor_prompt = draft.get("supervisor_prompt")
    await existing_config.save()
    config_doc = existing_config

    print(f"[TenantAgent] Saved config for tenant {tenant_id}, agent {agent_id} — id: {config_doc.id}", flush=True)

  
    try:
        from agent_orchestrator.models import AgentDraft
        import secrets
        agent_draft = await AgentDraft.find_one({"tenant_id": tenant_id, "agent_id": agent_id})
        if agent_draft:
            agent_draft.add_checkpoint(
                checkpoint_id=f"cp_{secrets.token_hex(4)}",
                message_id="finalized",
                draft_snapshot=draft,
                summary="Finalized and deployed to live",
            )
            agent_draft.current_draft = draft
            agent_draft.status = "created"
            agent_draft.updated_at = datetime.utcnow()
            await agent_draft.save()
    except Exception as ade:
        print(f"[TenantAgent Warning] Failed to update AgentDraft on finalize: {ade}", flush=True)

   
    try:
        from agent_orchestrator.redis_client import set_cached_draft
        await set_cached_draft(tenant_id, agent_id, draft)
    except Exception as re:
        print(f"[TenantAgent Warning] Failed to update Redis cache on finalize: {re}", flush=True)

    return {
        "status":   "draft",
        "draft":    draft,
    }




def route_structural(state: GraphState) -> Literal["ask_human_structural", "llm_semantic_review"]:
    return "ask_human_structural" if state["structural_gaps"] else "llm_semantic_review"


def route_semantic(state: GraphState) -> str:
    """
    Routes from semantic review based on the explicit decision state:
      - 'update_schema' -> apply_json_patches
      - 'ask_user'      -> ask_human_semantic
      - 'finalize'      -> finalize_and_save
    """
    decision = state.get("decision")
    if decision == "update_schema":
        return "apply_json_patches"
    elif decision == "ask_user":
        return "ask_human_semantic"
    else:
        return "finalize_and_save"




def build_tenant_onboarding_graph():
    """Compiles and returns the LangGraph StateGraph with MemorySaver checkpoint."""
    checkpointer = MemorySaver()  # swap for AsyncRedisSaver in production

    builder = StateGraph(GraphState)

 
    builder.add_node("load_draft",           node_load_draft)
    builder.add_node("validate_structural",  node_validate_structural)
    builder.add_node("ask_human_structural", node_ask_human_structural)
    builder.add_node("llm_semantic_review",  node_llm_semantic_review)
    builder.add_node("apply_json_patches",   node_apply_json_patches)
    builder.add_node("ask_human_semantic",   node_ask_human_semantic)
    builder.add_node("finalize_and_save",    node_finalize_and_save)


    builder.set_entry_point("load_draft")
    builder.add_edge("load_draft",           "validate_structural")
    builder.add_conditional_edges(
        "validate_structural",
        route_structural,
        {
            "ask_human_structural": "ask_human_structural",
            "llm_semantic_review":  "llm_semantic_review",
        },
    )
  
    builder.add_edge("ask_human_structural", "validate_structural")

    builder.add_conditional_edges(
        "llm_semantic_review",
        route_semantic,
        {
            "apply_json_patches":  "apply_json_patches",
            "ask_human_semantic":  "ask_human_semantic",
            "finalize_and_save":   "finalize_and_save",
        },
    )

    builder.add_edge("apply_json_patches",  "llm_semantic_review")
    builder.add_edge("ask_human_semantic",  "llm_semantic_review")
    builder.add_edge("finalize_and_save",   "ask_human_semantic")

    return builder.compile(checkpointer=checkpointer)




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

    thread_id = f"{tenant_id}:{target_agent_id}" if target_agent_id else tenant_id
    config = {"configurable": {"thread_id": thread_id}}
    initial: GraphState = {
        "tenant_id":       tenant_id,
        "agent_id":        target_agent_id,
        "draft":           draft,
        "messages":        [],
        "structural_gaps": [],
        "pending_field":   None,
        "semantic_note":   None,
        "decision":        None,
        "pending_patches": None,
        "status":          "onboarding",
    }

   
    try:
        from agent_orchestrator.redis_client import set_cached_draft
        await set_cached_draft(tenant_id, target_agent_id, draft)
    except Exception as e:
        print(f"[Start Session Warning] Failed to prime Redis cache: {e}", flush=True)

    async for _ in _graph.astream(initial, config=config, stream_mode="values"):
        pass  

    return _extract_payload(await _graph.aget_state(config))


async def resume_onboarding_session(tenant_id: str, user_answer: str, agent_id: str = "") -> dict:
    """
    Resumes a paused session with the tenant's answer.

    Args:
        tenant_id:   Schedulux tenant ID
        user_answer: Free-text answer to the interrupted question
        agent_id:    Optional agent ID to resume specific agent thread

    Returns: Same shape as start_onboarding_session.
    """
    from langgraph.types import Command

    thread_id = f"{tenant_id}:{agent_id}" if agent_id else tenant_id
    config = {"configurable": {"thread_id": thread_id}}
    async for _ in _graph.astream(Command(resume=user_answer), config=config, stream_mode="values"):
        pass

    return _extract_payload(await _graph.aget_state(config))


async def get_current_draft(tenant_id: str, agent_id: str = "") -> dict:
    """Returns the current in-progress draft dict for a tenant agent, checking LangGraph state then Redis."""
    thread_id = f"{tenant_id}:{agent_id}" if agent_id else tenant_id
    config = {"configurable": {"thread_id": thread_id}}
    snap = await _graph.aget_state(config)
    draft = getattr(snap, "values", {}).get("draft", {})
    if not draft and agent_id:
        try:
            from agent_orchestrator.redis_client import get_cached_draft
            cached = await get_cached_draft(tenant_id, agent_id)
            if cached:
                return cached
        except Exception:
            pass
    return draft


def _extract_payload(snapshot) -> dict:
    """Converts a LangGraph snapshot into a clean frontend-ready payload."""
    for task in getattr(snapshot, "tasks", []):
        for intr in getattr(task, "interrupts", []):
            val = getattr(intr, "value", {})
            return {
                "status":   "awaiting_input",
                "question": val.get("question"),
                "field":    val.get("field"),
                "type":     val.get("type"),
            }

    values = getattr(snapshot, "values", {})
    if values.get("status") == "complete":
        return {"status": "complete", "question": None, "field": None, "type": None}

    return {"status": "awaiting_input", "question": None, "field": None, "type": None}
