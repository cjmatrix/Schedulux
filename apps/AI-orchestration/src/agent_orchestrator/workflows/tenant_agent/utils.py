from __future__ import annotations

import os
import re
from typing import Any

from dotenv import load_dotenv
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_groq import ChatGroq
from langchain_openai import ChatOpenAI
from pydantic import SecretStr

from agent_orchestrator.workflows.tenant_agent.state import STRUCTURAL_REQUIREMENTS

_env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".env"))
load_dotenv(_env_path)

_GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
_GROQ_MODEL = os.environ.get("GROQ_MODEL", "openai/gpt-oss-120b")
_GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY", "")
_GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-1.5-flash")


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


def _slugify(val: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9]+", "_", val.strip().lower()).strip("_")
    return cleaned or "item"


def _get_llm(temperature: float = 0.2) -> BaseChatModel:
    groq_api_key = os.environ.get("GROQ_API_KEY") or _GROQ_API_KEY
    gemini_api_key = (
        os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY") or _GEMINI_API_KEY
    )

    if groq_api_key:
        groq_model = os.environ.get("GROQ_MODEL") or _GROQ_MODEL or "openai/gpt-oss-120b"
        if ChatGroq is not None:
            return ChatGroq(  # type: ignore[call-arg]
                model_name=groq_model,
                groq_api_key=groq_api_key,
                temperature=temperature,
                max_tokens=8192,
            )
        else:
            return ChatOpenAI(  # type: ignore[call-arg]
                model=groq_model,
                api_key=SecretStr(groq_api_key),
                base_url="https://api.groq.com/openai/v1",
                temperature=temperature,
                max_tokens=8192,
            )
    else:
        model_name = os.environ.get("GEMINI_MODEL") or _GEMINI_MODEL or "gemini-3.5-flash"
        if "gemma" in model_name.lower():
            model_name = "gemini-3.5-flash"
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
            active_svcs = [s for s in draft.get("services", []) if not s.get("is_deleted")]
            if not active_svcs:
                gaps.append(req)

        elif rtype == "resources_present":
            active_res = [
                r
                for r in draft.get("resources", [])
                if not r.get("is_deleted")
                and r.get("dispatch_status") not in ("retired", "inactive")
            ]
            if not active_res:
                gaps.append(req)

        elif rtype == "per_service":
            attr = req["attr"]
            for idx, svc in enumerate(draft.get("services", [])):
                if svc.get("is_deleted"):
                    continue
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
                if svc.get("is_deleted"):
                    continue
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

        elif rtype == "per_service_requirements":
            for idx, svc in enumerate(draft.get("services", [])):
                if svc.get("is_deleted"):
                    continue
                reqs = svc.get("resource_requirements") or []
                has_assigned = any(
                    isinstance(r, dict) and len(r.get("eligible_resource_ids", [])) > 0
                    for r in reqs
                )
                if not has_assigned:
                    svc_name = svc.get("name", f"Service #{idx + 1}")
                    gaps.append(
                        {
                            **req,
                            "service_idx": idx,
                            "question": req["question"].format(service_name=svc_name),
                        }
                    )

    return gaps


def _format_custom_shifts_compact(shifts: Any) -> str:
    if not shifts or not isinstance(shifts, dict):
        return "-"
    parts = []
    for day, intervals in shifts.items():
        if not intervals:
            parts.append(f"{day[:3]}:off")
        elif isinstance(intervals, list):
            time_strs = [
                f"{i.get('start', '?')}-{i.get('end', '?')}"
                for i in intervals
                if isinstance(i, dict) and "start" in i
            ]
            if time_strs:
                parts.append(f"{day[:3]}:" + ",".join(time_strs))
    return ";".join(parts) if parts else "-"


def _format_draft_toon(draft: dict) -> str:
    if not draft or not isinstance(draft, dict):
        return "{}"

    lines: list[str] = []

    bp = draft.get("business_profile")
    if bp and isinstance(bp, dict):
        lines.append("business_profile:")
        for k in ("name", "vertical", "timezone", "currency"):
            if bp.get(k):
                lines.append(f"  {k}: {bp[k]}")
        contact = bp.get("contact")
        if isinstance(contact, dict) and contact.get("public_phone"):
            lines.append(f"  phone: {contact['public_phone']}")

    oh = draft.get("operating_hours")
    if oh and isinstance(oh, dict):
        lines.append("operating_hours:")
        for day in ("monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"):
            slots = oh.get(day)
            if isinstance(slots, list) and slots:
                slot_strs = [
                    f"{s.get('start', '?')}-{s.get('end', '?')}"
                    for s in slots
                    if isinstance(s, dict)
                ]
                lines.append(f"  {day[:3]}: {', '.join(slot_strs)}")
        blackouts = oh.get("blackout_dates")
        if isinstance(blackouts, list) and blackouts:
            b_strs = [b.get("date") for b in blackouts if isinstance(b, dict) and b.get("date")]
            if b_strs:
                lines.append(f"  blackouts: [{', '.join(b_strs)}]")

    all_res = draft.get("resources") or []
    active_res = [r for r in all_res if isinstance(r, dict) and not r.get("is_deleted")]
    if active_res:
        lines.append(
            f"resources[{len(active_res)}]{{id, name, type, title, bookable, status, custom_shifts}}:"
        )
        for r in active_res:
            rid = r.get("resource_id") or "unassigned"
            name = r.get("name") or "Unnamed"
            rtype = r.get("resource_type") or "staff"
            title = r.get("title") or "Specialist"
            bookable = "true" if r.get("is_bookable", True) else "false"
            status = r.get("dispatch_status") or "active"
            shifts = _format_custom_shifts_compact(r.get("custom_shift_overrides"))
            lines.append(f"  {rid} | {name} | {rtype} | {title} | {bookable} | {status} | {shifts}")

    all_svcs = draft.get("services") or []
    active_svcs = [s for s in all_svcs if isinstance(s, dict) and not s.get("is_deleted")]
    if active_svcs:
        lines.append(
            f"services[{len(active_svcs)}]{{id, name, duration, buffer, price, eligible_resources}}:"
        )
        for s in active_svcs:
            sid = s.get("service_id") or "unassigned"
            name = s.get("name") or "Unnamed"
            dur = f"{s.get('duration_minutes', 30)}m"
            buf = f"{s.get('buffer_minutes', 0)}m"
            price = s.get("price") or {}
            price_str = f"${price.get('amount', 0)} {price.get('currency', 'USD')}"
            r_ids = []
            for req in s.get("resource_requirements") or []:
                if isinstance(req, dict):
                    r_ids.extend(req.get("eligible_resource_ids") or [])
            res_str = "[" + ", ".join(r_ids) + "]" if r_ids else "-"
            lines.append(f"  {sid} | {name} | {dur} | {buf} | {price_str} | {res_str}")

    se = draft.get("scheduling_engine")
    if se and isinstance(se, dict):
        lines.append("scheduling_engine:")
        if se.get("booking_mode"):
            lines.append(f"  mode: {se['booking_mode']}")
        if se.get("default_lead_time_hours") is not None:
            lines.append(f"  lead_time_hours: {se['default_lead_time_hours']}")
        if se.get("cancellation_window_hours") is not None:
            lines.append(f"  cancellation_window_hours: {se['cancellation_window_hours']}")

    gr = draft.get("guardrails")
    if gr and isinstance(gr, dict):
        vp = gr.get("verification_policy")
        if isinstance(vp, dict) and vp.get("require_otp_for_new_booking"):
            lines.append("guardrails.verification: require_otp=true")

    sp = draft.get("supervisor_prompt")
    if sp and str(sp).strip():
        lines.append(f"supervisor_prompt: {str(sp).strip()}")

    return "\n".join(lines) if lines else "{}"


def _extract_payload(snapshot: Any) -> dict:
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
