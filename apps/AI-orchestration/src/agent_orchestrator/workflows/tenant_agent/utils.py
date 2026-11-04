from __future__ import annotations

import json
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


def _format_draft_toon(draft: dict) -> str:
    try:
        import toon

        return toon.encode(draft)
    except Exception as e:
        print(f"[TOON Warning] Fallback to json: {e}", flush=True)
        return json.dumps(draft, indent=2)


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

