from __future__ import annotations

import copy
import json
import os
import re
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
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, StateGraph
from langgraph.graph.message import add_messages
from langgraph.types import interrupt
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


def _extract_text(resp) -> str:
    content = resp.content
    if isinstance(content, list):
        return " ".join(b.get("text", "") if isinstance(b, dict) else str(b) for b in content)
    return str(content)


class TimeSlot(BaseModel):
    start: str = Field(description="Start time in HH:MM 24h format")
    end: str = Field(description="End time in HH:MM 24h format")


class OperatingHours(BaseModel):
    monday: list[TimeSlot] = Field(default_factory=list)
    tuesday: list[TimeSlot] = Field(default_factory=list)
    wednesday: list[TimeSlot] = Field(default_factory=list)
    thursday: list[TimeSlot] = Field(default_factory=list)
    friday: list[TimeSlot] = Field(default_factory=list)
    saturday: list[TimeSlot] = Field(default_factory=list)
    sunday: list[TimeSlot] = Field(default_factory=list)


async def _parse_operating_hours_with_llm(raw_text: str, llm: BaseChatModel) -> dict:
    """Converts free-form hours description → {monday: [{start,end}], ...}"""
    structured_llm = llm.with_structured_output(OperatingHours)
    prompt = f"Convert this business hours description into structured data:\n{raw_text}"
    try:
        resp = await structured_llm.ainvoke([HumanMessage(content=prompt)])
        if isinstance(resp, BaseModel):
            return resp.model_dump()
        if isinstance(resp, dict):
            return resp
        return {}
    except Exception as e:
        print(f"[LLM Pydantic Parse Error] {e}", flush=True)
        slot = [{"start": "09:00", "end": "17:00"}]
        return {d: slot for d in ("monday", "tuesday", "wednesday", "thursday", "friday")} | {
            "saturday": [],
            "sunday": [],
        }


class ServiceDetails(BaseModel):
    name: str = Field(description="Name of the service")
    description: str | None = Field(
        default=None, description="Description of the service, if mentioned"
    )
    booking_mode: Literal["time_slot", "date_range"] = Field(
        default="time_slot",
        description="Booking mode: 'time_slot' for clock-hour appointments (e.g. consultations, car wash, haircut) or 'date_range' for multi-day bookings (e.g. hotel stays, equipment rentals)",
    )
    duration_minutes: int = Field(
        description="Duration in minutes (e.g. 30, 60; for date_range use 1440 or 0)", default=30
    )
    buffer_minutes: int = Field(description="Buffer/cleanup time in minutes", default=0)
    price_amount: float = Field(description="Price amount", default=0.0)
    price_currency: str = Field(description="Currency code", default="USD")
    require_otp: bool | None = Field(
        default=None,
        description="Whether this service specifically requires OTP verification before booking (true=mandatory, false=skip OTP, null=inherit global policy)",
    )


async def _parse_service_with_llm(raw_text: str, llm: BaseChatModel) -> dict | None:
    """Parses a free-form service description → structured service dict."""
    structured_llm = llm.with_structured_output(ServiceDetails)
    prompt = f"Extract service details from this input:\n{raw_text}"
    try:
        p = await structured_llm.ainvoke([HumanMessage(content=prompt)])
        if not isinstance(p, ServiceDetails):
            return None
        svc_name = p.name
        service_id = "srv_" + svc_name.lower().replace(" ", "_")[:24]
        return {
            "service_id": service_id,
            "name": svc_name,
            "description": p.description or "",
            "booking_mode": getattr(p, "booking_mode", "time_slot") or "time_slot",
            "duration_minutes": p.duration_minutes,
            "buffer_minutes": p.buffer_minutes,
            "price": {
                "type": "fixed",
                "amount": p.price_amount,
                "currency": p.price_currency,
            },
            "verification": {
                "require_otp": getattr(p, "require_otp", None),
            },
            "eligible_resource_ids": [],
            "required_asset_ids": [],
        }
    except Exception as e:
        print(f"[LLM Pydantic Parse Error] {e}", flush=True)
        return None


class PartialServiceUpdate(BaseModel):
    booking_mode: Literal["time_slot", "date_range"] | None = Field(
        default=None,
        description="Booking mode: 'time_slot' (appointments) or 'date_range' (multi-day stays/rentals)",
    )
    duration_minutes: int | None = Field(
        default=None, description="Duration in minutes, if mentioned"
    )
    buffer_minutes: int | None = Field(
        default=None, description="Buffer/cleanup time in minutes, if mentioned"
    )
    price_amount: float | None = Field(default=None, description="Price amount, if mentioned")
    name: str | None = Field(default=None, description="Name of the service, if mentioned")
    description: str | None = Field(
        default=None, description="Description of the service, if mentioned"
    )
    require_otp: bool | None = Field(
        default=None, description="Whether this service requires OTP verification"
    )


async def _parse_partial_service_update(
    raw_text: str, current_service: dict, llm: BaseChatModel
) -> dict:
    structured_llm = llm.with_structured_output(PartialServiceUpdate)
    prompt = (
        f"The user is updating a service. Current details: {json.dumps(current_service)}.\n"
        f"Extract any new or updated fields from the user's input:\n{raw_text}"
    )
    try:
        resp = await structured_llm.ainvoke([HumanMessage(content=prompt)])
        if isinstance(resp, BaseModel):
            return resp.model_dump(exclude_none=True)
        if isinstance(resp, dict):
            return resp
        return {}
    except Exception as e:
        print(f"[LLM Pydantic Parse Error] {e}", flush=True)
        return {}


class ResourceDetails(BaseModel):
    name: str = Field(description="Name of the person, staff member, room, chair, bay, or asset")
    resource_type: Literal["staff", "physical_asset"] = Field(
        default="staff",
        description="Whether this is a human staff member ('staff') or a room/chair/equipment/bay ('physical_asset')",
    )
    title: str | None = Field(
        default=None,
        description="Job title, role, or asset category (e.g. Senior Barber, Doctor, Bay 1, Deluxe Suite)",
    )
    description: str | None = Field(default=None, description="Brief description")


async def _parse_resource_with_llm(raw_text: str, llm: BaseChatModel) -> dict | None:
    """Parses a free-form resource description → structured resource dict."""
    structured_llm = llm.with_structured_output(ResourceDetails)
    prompt = f"Extract resource details from this input:\n{raw_text}"
    try:
        p = await structured_llm.ainvoke([HumanMessage(content=prompt)])
        if not isinstance(p, ResourceDetails):
            return None
        res_name = p.name
        clean_name = re.sub(r"[^a-zA-Z0-9_]", "_", res_name.lower().replace(" ", "_"))
        resource_id = "res_" + clean_name[:24]
        return {
            "resource_id": resource_id,
            "resource_type": p.resource_type,
            "name": res_name,
            "title": p.title or "",
            "category": p.resource_type,
            "description": p.description or "",
            "is_bookable": True,
            "dispatch_status": "active",
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


async def _apply_patch(draft: dict, gap: dict, answer: str, llm: BaseChatModel) -> dict:
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
    bp = draft.get("business_profile", {})
    services = draft.get("services", [])
    resources = draft.get("resources", [])

    svc_lines = (
        "\n".join(
            f"  • {s.get('name', '?')} — {s.get('duration_minutes', '?')}min "
            f"+ {s.get('buffer_minutes', 0)}min buffer, "
            f"{s.get('price', {}).get('currency', 'USD')} {s.get('price', {}).get('amount', '?')}"
            for s in services
        )
        or "  (none)"
    )

    res_lines = (
        "\n".join(f"  • {r.get('name', '?')} ({r.get('resource_type', '?')})" for r in resources)
        or "  (none)"
    )

    return f"""You are reviewing a Schedulux AI agent config before it goes live.

Business: {bp.get("name", "?")} | Vertical: {bp.get("vertical", "?")} | Timezone: {bp.get("timezone", "?")}

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

    user_answer: str = interrupt(
        {
            "type": "structural_gap",
            "field": gap["field"],
            "question": gap["question"],
        }
    )

    llm = _get_llm()
    updated_draft = await _apply_patch(state["draft"], gap, user_answer, llm)

    tenant_id = state.get("tenant_id", "")
    agent_id = state.get("agent_id") or updated_draft.get("agent_id", "")
    if tenant_id and agent_id:
        try:
            from agent_orchestrator.clients.redis_client import set_cached_draft

            await set_cached_draft(tenant_id, agent_id, updated_draft)
            print(
                f"[Structural Node] Updated draft cached in Redis for tenant {tenant_id}, agent {agent_id}",
                flush=True,
            )
        except Exception as re:
            print(f"[Structural Node] Redis cache write warning: {re}", flush=True)

        try:
            import secrets

            from agent_orchestrator.models import AgentDraft, init_db

            await init_db()
            agent_draft = await AgentDraft.find_one({"tenant_id": tenant_id, "agent_id": agent_id})
            if agent_draft:
                agent_draft.add_checkpoint(
                    checkpoint_id=f"cp_{secrets.token_hex(4)}",
                    message_id=f"msg_{secrets.token_hex(4)}",
                    draft_snapshot=updated_draft,
                    user_prompt=str(user_answer)[:200],
                    summary=f"Set {gap.get('field', 'field')}",
                )
                await agent_draft.save()
                print(
                    f"[Structural Node] Persisted turn checkpoint to AgentDraft ({tenant_id}/{agent_id})",
                    flush=True,
                )
        except Exception as de:
            print(
                f"[Structural Node Warning] Failed to persist AgentDraft turn checkpoint: {de}",
                flush=True,
            )

    return {
        "draft": updated_draft,
        "pending_field": gap["field"],
        "messages": [HumanMessage(content=f"[{gap['field']}] {user_answer}")],
    }


class SemanticAction(BaseModel):
    action: Literal["update_schema", "ask_user", "finalize"] = Field(
        description="Action to take based on current state"
    )
    question: str | None = Field(
        default=None, description="The question to ask the user, if action is ask_user or finalize"
    )
    patches: list[dict] | None = Field(
        default=None, description="RFC 6902 JSON Patches to apply, if action is update_schema"
    )


async def node_llm_semantic_review(state: GraphState) -> dict:
    """
    Acts as the 'Main Brain' for the semantic phase.
    Decides whether to apply JSON patches, ask the user a question, or finalize setup.
    """
    llm = _get_llm().with_structured_output(SemanticAction)

    history_msgs = state.get("messages", [])[-6:]
    history = (
        "\n".join([m.content for m in history_msgs])
        if history_msgs
        else "No conversation history yet."
    )

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
  * If any mandatory dependent fields are missing (e.g., active deposit missing UPI ID or QR code URL, or emergency triage missing contact), you MUST choose 'ask_user' and ask for that specific detail.
  * If the draft is valid and all dependent fields are sound, you MUST choose 'ask_user'. Inform the user of the exact changes applied, and ask if they would like to make any other adjustments or if they are ready to save their changes.
  * You must NEVER choose 'finalize' unless the user EXPLICITLY commanded to save/deploy in their recent message (e.g. "save", "save changes", "deploy now", "finalize").
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
- If the user provides service, staff, or business details, generate all required JSON patches immediately.
- If you have just applied patches or if the user asks what to do next, proactively and conversationally prompt for 1 or 2 missing items from the checklist above.
- If there is no conversation history yet, greet the user warmly as their Schedulux AI setup assistant and ask for their business name and what services they provide.
- NEVER guess external user details (phone number, prices, staff names).
- CRITICAL: DO NOT choose 'finalize' if ANY items from the REQUIRED MINIMUM DEPLOYMENT CHECKLIST above are still missing. If the user asks to save/finalize while items are missing, choose 'ask_user' and politely explain what is still needed before going live.
"""

    prompt = f"""You are the Schedulux AI Configuration Agent.
Your job is to review the JSON draft, apply user changes, and converse with the user to ensure the configuration is logically sound, functional, and complete.
{summary_block}{facts_block}{gaps_block}

CRITICAL RULES FOR REASONING & ACTIONS:
1. GRAMMAR & CASING: Automatically correct spelling, casing, and grammar from user messages before generating patches (e.g., "tier punchuree repai" -> "Tire Puncture Repair").
2. SINGLE-TURN PATCHES: If the user provides multiple updates, generate ALL required JSON patches in a SINGLE turn. Do not break them down into multiple turns.
3. ANTI-HALLUCINATION / NEVER GUESS DETAILS:
   - NEVER assume, default, or invent external user details that the user did not provide (specifically: UPI IDs (upi_id), QR code URLs, phone numbers, email addresses, or business verticals).
   - Internal system slugs ('resource_id', 'service_id') are NOT user details—always auto-generate them from the name (e.g. "Dr. Shijisha" -> "res_shijisha"). NEVER ask the user for an ID!

DOMAIN INTEGRITY & DEPENDENCY RULES:
1. DEPOSITS & PAYMENTS (UPI ONLY):
   - Schedulux ONLY supports direct UPI deposit payments (through UPI ID or QR Code URL). No Stripe, no bank transfer, and no cash on arrival are supported for service deposits.
   - When configuring a deposit (deposit.required is True or deposit.amount > 0):
     * Set `deposit.processor` to "upi_direct" and `deposit.confirmation_method` to "utr_reference".
     * Either `deposit.upi_id` (e.g., clinic@okhdfcbank) or `deposit.qr_code_url` is MANDATORY for collecting deposits.
     * If the user enables a deposit without providing their UPI ID or QR code, apply the deposit amount patch and ASK the user for their clinic's UPI ID or QR code so patients can pay their deposit.
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
   - Any IDs in `services[].eligible_resource_ids` must correspond to actual resources in `resources[]`. Always link services to eligible resources.
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

     * SCHEDULING ENGINE ALLOCATION SYNCHRONIZATION:
       - Keep `scheduling_engine.allocation_model` synchronized:
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
- services[]: service_id, name, category, description, duration_minutes, buffer_minutes, booking_mode ("time_slot"|"date_range"), allocation_model (single_resource|multi_resource|pooled|asset_only), eligible_resource_ids, required_asset_ids, recall_interval_days
- services[].price: type (fixed|starting_at|hourly|free|custom), amount, currency
- services[].deposit: required, amount, processor ("upi_direct"), upi_id, qr_code_url, confirmation_method ("utr_reference"), payment_instructions
- services[].verification: require_otp (boolean|null)
- resources[]: resource_id, resource_type (staff|room|chair|bay|equipment|asset|vehicle), name, title, category, description, is_bookable, dispatch_status (active|on_leave|maintenance|retired|inactive), custom_shift_overrides
- operating_hours: monday, tuesday, wednesday, thursday, friday, saturday, sunday (each is list of {{start: "HH:MM", end: "HH:MM"}}), blackout_dates (list of {{date: "YYYY-MM-DD", reason, is_closed}})
- scheduling_engine: allocation_model ("time_slot"|"date_range"), default_booking_mode ("time_slot"|"date_range"), default_lead_time_hours, max_advance_booking_days, cancellation_window_hours
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
- Arrays (e.g. `services[N]`, `resources[N]`) declare keys in `{...}` headers followed by compact data rows, or YAML lists with `-`.
- Array rows correspond to 0-indexed elements (row 1 is index 0, row 2 is index 1, etc.) for your RFC 6902 patch paths (e.g. `/services/0/price/amount`).

Recent Conversation:
{history}

Decide your next action:
1. 'update_schema': The user requested a configuration change. Generate the JSON patches (e.g. op: replace/add/remove). Only populate fields explicitly mentioned. Do NOT invent missing details.
2. 'ask_user': A mandatory dependent field is missing, or changes were just applied and you are confirming with the user, or the user asked a question.
3. 'finalize': ONLY choose this if the user EXPLICITLY requested to save, finalize, or deploy the agent (e.g. "save changes", "looks good, save it", "deploy now") AND all mandatory dependent fields are complete. Never finalize on a routine modification without explicit user confirmation.
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

    if just_applied_patches and resp.action == "update_schema":
        print("[Semantic Agent Brain] Forcing ask_user after patch application.", flush=True)
        return {
            "decision": "ask_user",
            "pending_patches": None,
            "semantic_note": resp.question
            or "I've applied your changes. Would you like to adjust anything else or are you ready to save?",
        }

    if resp.action == "update_schema" and resp.patches:
        print(
            f"[Semantic Agent Brain] Decided to update schema with {len(resp.patches)} patches.",
            flush=True,
        )
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
    elif resp.action == "finalize":
        print("[Semantic Agent Brain] Finalizing setup.", flush=True)
        return {
            "decision": "finalize",
            "pending_patches": None,
            "semantic_note": resp.question
            or "✅ Your agent configuration has been saved and deployed live!",
        }
    else:
        return {
            "decision": "ask_user",
            "pending_patches": None,
            "semantic_note": resp.question
            or "Configuration updated. What would you like to configure next?",
        }


class StrictContactSchema(BaseModel):
    model_config = ConfigDict(extra="forbid")
    support_email: str | None = None
    public_phone: str | None = None
    escalation_phone: str | None = None


class StrictTerminologySchema(BaseModel):
    model_config = ConfigDict(extra="forbid")
    customer_singular: str | None = None
    customer_plural: str | None = None
    primary_metric: str | None = None
    action_metric: str | None = None


class StrictBrandSchema(BaseModel):
    model_config = ConfigDict(extra="forbid")
    primary_color: str | None = None
    logo_url: str | None = None


class StrictBusinessProfileSchema(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str | None = None
    vertical: str | None = None
    timezone: str | None = None
    locale: str | None = None
    currency: str | None = None
    address: str | None = None
    contact: StrictContactSchema | None = None
    terminology: StrictTerminologySchema | None = None
    brand: StrictBrandSchema | None = None


class ServiceAllocationModel(StrEnum):
    SINGLE_RESOURCE = "single_resource"
    MULTI_RESOURCE = "multi_resource"
    POOLED = "pooled"
    ASSET_ONLY = "asset_only"


class BookingMode(StrEnum):
    TIME_SLOT = "time_slot"
    DATE_RANGE = "date_range"


class ResourceType(StrEnum):
    STAFF = "staff"
    ROOM = "room"
    CHAIR = "chair"
    BAY = "bay"
    EQUIPMENT = "equipment"
    ASSET = "asset"
    VEHICLE = "vehicle"


class DispatchStatus(StrEnum):
    ACTIVE = "active"
    ON_LEAVE = "on_leave"
    MAINTENANCE = "maintenance"
    RETIRED = "retired"
    INACTIVE = "inactive"


class PriceType(StrEnum):
    FIXED = "fixed"
    STARTING_AT = "starting_at"
    HOURLY = "hourly"
    FREE = "free"
    CUSTOM = "custom"


class StrictPriceSchema(BaseModel):
    model_config = ConfigDict(extra="forbid")
    type: PriceType | None = None
    amount: float | None = None
    currency: str | None = None


class StrictDepositSchema(BaseModel):
    model_config = ConfigDict(extra="forbid")
    required: bool | None = None
    amount: float | None = None
    processor: Literal["upi_direct"] | None = None
    upi_id: str | None = None
    qr_code_url: str | None = None
    confirmation_method: str | None = None
    payment_instructions: str | None = None


class AllocationModel(StrEnum):
    TIME_SLOT = "time_slot"
    DATE_RANGE = "date_range"


class StrictServiceVerificationSchema(BaseModel):
    model_config = ConfigDict(extra="forbid")
    require_otp: bool | None = None


class StrictServiceSchema(BaseModel):
    model_config = ConfigDict(extra="forbid")
    service_id: str | None = None
    name: str | None = None
    category: str | None = None
    description: str | None = None
    duration_minutes: int | None = None
    buffer_minutes: int | None = None
    allocation_model: ServiceAllocationModel | None = None
    booking_mode: BookingMode | None = None
    price: StrictPriceSchema | None = None
    deposit: StrictDepositSchema | None = None
    verification: StrictServiceVerificationSchema | None = None
    eligible_resource_ids: list[str] | None = None
    required_asset_ids: list[str] | None = None
    recall_interval_days: int | None = None


class StrictResourceSchema(BaseModel):
    model_config = ConfigDict(extra="forbid")
    resource_id: str | None = None
    resource_type: ResourceType | None = None
    name: str | None = None
    title: str | None = None
    category: str | None = None
    description: str | None = None
    is_bookable: bool | None = None
    dispatch_status: DispatchStatus | None = None
    custom_shift_overrides: dict | None = None


class StrictTimeSlotSchema(BaseModel):
    model_config = ConfigDict(extra="forbid")
    start: str | None = None
    end: str | None = None


class StrictBlackoutDateSchema(BaseModel):
    model_config = ConfigDict(extra="forbid")
    date: str | None = None
    reason: str | None = None
    is_closed: bool | None = None


class StrictOperatingHoursSchema(BaseModel):
    model_config = ConfigDict(extra="forbid")
    monday: list[StrictTimeSlotSchema] | None = None
    tuesday: list[StrictTimeSlotSchema] | None = None
    wednesday: list[StrictTimeSlotSchema] | None = None
    thursday: list[StrictTimeSlotSchema] | None = None
    friday: list[StrictTimeSlotSchema] | None = None
    saturday: list[StrictTimeSlotSchema] | None = None
    sunday: list[StrictTimeSlotSchema] | None = None
    blackout_dates: list[StrictBlackoutDateSchema] | None = None


class StrictSchedulingEngineSchema(BaseModel):
    model_config = ConfigDict(extra="forbid")
    allocation_model: AllocationModel | None = None
    default_booking_mode: BookingMode | None = None
    default_lead_time_hours: int | None = None
    max_advance_booking_days: int | None = None
    cancellation_window_hours: int | None = None


class StrictWidgetConfigSchema(BaseModel):
    model_config = ConfigDict(extra="forbid")
    agent_name: str | None = None
    avatar_url: str | None = None
    initial_greeting: str | None = None
    fallback_message: str | None = None
    position: str | None = None
    launcher_style: str | None = None
    sound_on_load: bool | None = None
    auto_expand_delay_seconds: int | None = None
    platform_sources: list[str] | None = None
    whitelisted_domains: list[str] | None = None


class StrictComplianceSchema(BaseModel):
    model_config = ConfigDict(extra="forbid")
    hipaa_mode: bool | None = None
    phi_scrubbing: bool | None = None
    data_retention_policy: str | None = None
    zero_hallucination_mode: bool | None = None
    audit_trail_enabled: bool | None = None


class StrictPhiScrubSchema(BaseModel):
    model_config = ConfigDict(extra="forbid")
    enabled: bool | None = None
    policy: str | None = None
    description: str | None = None
    hipaa_compliant: bool | None = None


class StrictTriageEmergencySchema(BaseModel):
    model_config = ConfigDict(extra="forbid")
    enabled: bool | None = None
    keywords: list[str] | None = None
    response_override: str | None = None


class StrictHumanHandoffSchema(BaseModel):
    model_config = ConfigDict(extra="forbid")
    enabled: bool | None = None
    trigger_topics: list[str] | None = None
    reception_contact: str | None = None
    handoff_message: str | None = None


class StrictVerificationPolicySchema(BaseModel):
    model_config = ConfigDict(extra="forbid")
    require_otp_for_new_booking: bool | None = None
    require_otp_for_reschedule: bool | None = None
    require_otp_for_cancel: bool | None = None


class StrictGuardrailsSchema(BaseModel):
    model_config = ConfigDict(extra="forbid")
    verification_policy: StrictVerificationPolicySchema | None = None
    phi_scrubbing: StrictPhiScrubSchema | None = None
    triage_emergency: StrictTriageEmergencySchema | None = None
    human_handoff: StrictHumanHandoffSchema | None = None


class StrictDraftPatchValidator(BaseModel):
    model_config = ConfigDict(extra="ignore")
    business_profile: StrictBusinessProfileSchema | None = None
    services: list[StrictServiceSchema] | None = None
    resources: list[StrictResourceSchema] | None = None
    operating_hours: StrictOperatingHoursSchema | None = None
    scheduling_engine: StrictSchedulingEngineSchema | None = None
    widget_config: StrictWidgetConfigSchema | None = None
    compliance: StrictComplianceSchema | None = None
    guardrails: StrictGuardrailsSchema | None = None
    supervisor_prompt: str | None = None


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
            "decision": None,
            "pending_patches": None,
            "structural_gaps": _compute_structural_gaps(updated_draft),
            "messages": [
                SystemMessage(
                    content=f"Successfully applied {len(patches)} JSON patches. The schema is now updated. Analyze the new draft and decide your next move. DO NOT repeat these exact patches."
                )
            ],
        }
    except Exception as e:
        print(f"[Patch Node Error] Failed applying patches (or validation): {e}", flush=True)
        return {
            "decision": None,
            "pending_patches": None,
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
    question = state.get("semantic_note") or "Do you have any more changes?"

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

    user_answer: str = interrupt(
        {
            "type": "semantic_review",
            "question": question,
        }
    )

    if isinstance(user_answer, list):
        user_answer = user_answer[0] if user_answer else ""
    user_answer = str(user_answer)

    return {
        "decision": None,
        "semantic_note": None,
        "messages": [
            HumanMessage(content=f"Agent: {question}"),
            HumanMessage(content=f"User: {user_answer}"),
        ],
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


def route_structural(state: GraphState) -> Literal["ask_human_structural", "llm_semantic_review"]:
    return "ask_human_structural" if state["structural_gaps"] else "llm_semantic_review"


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


def build_tenant_onboarding_graph():
    """Compiles and returns the LangGraph StateGraph with MemorySaver checkpoint."""
    checkpointer = MemorySaver()

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

    builder.add_edge("apply_json_patches", "llm_semantic_review")
    builder.add_edge("ask_human_semantic", "llm_semantic_review")
    builder.add_edge("block_incomplete_finalize", "ask_human_semantic")
    builder.add_edge("finalize_and_save", END)

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
    }

    try:
        from agent_orchestrator.clients.redis_client import set_cached_draft

        await set_cached_draft(tenant_id, target_agent_id, draft)
    except Exception as e:
        print(f"[Start Session Warning] Failed to prime Redis cache: {e}", flush=True)

    async for _ in _graph.astream(initial, config=config, stream_mode="values"):
        pass

    return _extract_payload(await _graph.aget_state(config))


async def resume_onboarding_session(tenant_id: str, user_answer: str, agent_id: str = "") -> dict:
    from langchain_core.messages import HumanMessage
    from langgraph.types import Command

    thread_id = f"{tenant_id}:{agent_id}" if agent_id else tenant_id
    config = {"configurable": {"thread_id": thread_id}}
    snap = await _graph.aget_state(config)

    has_interrupt = False
    for task in getattr(snap, "tasks", []):
        if getattr(task, "interrupts", []):
            has_interrupt = True
            break

    if has_interrupt:
        async for _ in _graph.astream(
            Command(resume=user_answer), config=config, stream_mode="values"
        ):
            pass
        return _extract_payload(await _graph.aget_state(config))

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
                    draft = {
                        "tenant_id": tenant_id,
                        "agent_id": agent_id,
                        "business_profile": cfg.business_profile.model_dump()
                        if cfg.business_profile
                        else {},
                        "operating_hours": cfg.operating_hours.model_dump()
                        if cfg.operating_hours
                        else {},
                        "scheduling_engine": cfg.scheduling_engine.model_dump()
                        if cfg.scheduling_engine
                        else {},
                        "services": [s.model_dump() for s in cfg.services] if cfg.services else [],
                        "resources": [r.model_dump() for r in cfg.resources]
                        if cfg.resources
                        else [],
                        "supervisor_prompt": cfg.supervisor_prompt,
                    }
        except Exception:
            pass

    if not draft:
        draft = {"tenant_id": tenant_id, "agent_id": agent_id}

    target_agent_id = agent_id or draft.get("agent_id") or f"agent_{tenant_id}_v1"

    recent_history: list[HumanMessage | AIMessage] = []
    if target_agent_id:
        try:
            from agent_orchestrator.config import MEMORY_WINDOW_LIMIT
            from agent_orchestrator.models import AgentDraft, AgentMessage

            agent_draft_doc = await AgentDraft.find_one(
                {"tenant_id": tenant_id, "agent_id": target_agent_id}
            )
            last_summarized = agent_draft_doc.last_summarized_seq if agent_draft_doc else 0

            all_db_msgs = (
                await AgentMessage.find({"tenant_id": tenant_id, "agent_id": target_agent_id})
                .sort("created_at")
                .to_list()
            )

            active_msgs = all_db_msgs[last_summarized:]

            if len(active_msgs) > MEMORY_WINDOW_LIMIT:
                active_msgs = active_msgs[-MEMORY_WINDOW_LIMIT:]

            for m in active_msgs:
                if m.role in ("tenant", "user"):
                    recent_history.append(HumanMessage(content=m.content))
                else:
                    recent_history.append(AIMessage(content=m.content))
        except Exception as rhe:
            print(f"[TenantAgent Warning] Could not rehydrate recent history: {rhe}", flush=True)

    recent_history.append(HumanMessage(content=f"User: {user_answer}"))

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
    }
    async for _ in _graph.astream(initial, config=config, stream_mode="values"):
        pass

    return _extract_payload(await _graph.aget_state(config))


async def get_current_draft(tenant_id: str, agent_id: str = "") -> dict:
    if agent_id:
        try:
            from agent_orchestrator.clients.redis_client import get_cached_draft

            cached = await get_cached_draft(tenant_id, agent_id)
            if cached:
                from agent_orchestrator.models import canonicalize_agent_schema

                return canonicalize_agent_schema(cached, status="draft")
        except Exception:
            pass

    return {}


def _extract_payload(snapshot) -> dict:
    """Converts a LangGraph snapshot into a clean frontend-ready payload."""
    for task in getattr(snapshot, "tasks", []):
        for intr in getattr(task, "interrupts", []):
            val = getattr(intr, "value", {})
            return {
                "status": "awaiting_input",
                "question": val.get("question"),
                "field": val.get("field"),
                "type": val.get("type"),
            }

    values = getattr(snapshot, "values", {})
    if values.get("status") == "complete":
        return {"status": "complete", "question": None, "field": None, "type": None}

    return {"status": "awaiting_input", "question": None, "field": None, "type": None}
