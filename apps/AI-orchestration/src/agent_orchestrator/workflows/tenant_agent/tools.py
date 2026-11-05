from __future__ import annotations

import copy
import json
import secrets
from datetime import UTC, datetime
from typing import Any, cast

from jsonmerge import Merger

from agent_orchestrator.workflows.tenant_agent.utils import _slugify

_MERGE_SCHEMA = {
    "properties": {
        "services": {
            "mergeStrategy": "arrayMergeById",
            "mergeOptions": {"idRef": "service_id"},
        },
        "resources": {
            "mergeStrategy": "arrayMergeById",
            "mergeOptions": {"idRef": "resource_id"},
        },
        "operating_hours": {
            "properties": {
                "blackout_dates": {
                    "mergeStrategy": "arrayMergeById",
                    "mergeOptions": {"idRef": "date"},
                }
            }
        },
    }
}

_DRAFT_MERGER = Merger(_MERGE_SCHEMA)


def _generate_semantic_id(prefix: str, name: str, suffix_len: int = 6) -> str:
    slug = _slugify(name)[:20] if name else ""
    suffix = secrets.token_hex(suffix_len // 2)
    return f"{prefix}_{slug}_{suffix}" if slug else f"{prefix}_{suffix}"


def apply_draft_merge(base_draft: dict[str, Any], update_data: dict[str, Any]) -> dict[str, Any]:
    if not update_data:
        return base_draft

    up = copy.deepcopy(update_data)

    if "services" in up and isinstance(up["services"], list):
        base_services = {
            s.get("name", "").strip().lower(): s.get("service_id")
            for s in base_draft.get("services", [])
            if s.get("name") and s.get("service_id")
        }
        base_services_by_id = {
            s.get("service_id"): s for s in base_draft.get("services", []) if s.get("service_id")
        }
        for s in up["services"]:
            if isinstance(s, dict):
                name_key = s.get("name", "").strip().lower()

                if name_key and name_key in base_services and base_services[name_key]:
                    s["service_id"] = base_services[name_key]

                elif s.get("service_id") and s.get("service_id") in base_services_by_id:
                    pass

                elif not s.get("service_id"):
                    s["service_id"] = _generate_semantic_id("srv", name_key)
                if s.get("is_deleted"):
                    s.setdefault("deleted_at", datetime.now(UTC).isoformat())

    if "resources" in up and isinstance(up["resources"], list):
        base_resources = {
            r.get("name", "").strip().lower(): r.get("resource_id")
            for r in base_draft.get("resources", [])
            if r.get("name") and r.get("resource_id")
        }
        base_resources_by_id = {
            r.get("resource_id"): r for r in base_draft.get("resources", []) if r.get("resource_id")
        }
        for r in up["resources"]:
            if isinstance(r, dict):
                name_key = r.get("name", "").strip().lower()

                if name_key and name_key in base_resources and base_resources[name_key]:
                    r["resource_id"] = base_resources[name_key]

                elif r.get("resource_id") and r.get("resource_id") in base_resources_by_id:
                    pass

                elif not r.get("resource_id"):
                    r["resource_id"] = _generate_semantic_id("res", name_key)
                if "custom_shift_overrides" in r and isinstance(r["custom_shift_overrides"], str):
                    try:
                        r["custom_shift_overrides"] = json.loads(r["custom_shift_overrides"])
                    except Exception:
                        r["custom_shift_overrides"] = {}
                if r.get("is_deleted"):
                    r.setdefault("deleted_at", datetime.now(UTC).isoformat())
                    r["dispatch_status"] = "retired"
                    r["is_bookable"] = False

    merged = _DRAFT_MERGER.merge(base_draft, up)

    deleted_res_ids = {
        r.get("resource_id")
        for r in merged.get("resources", [])
        if isinstance(r, dict) and r.get("is_deleted") and r.get("resource_id")
    }
    if deleted_res_ids:
        for svc in merged.get("services", []):
            if isinstance(svc, dict) and "resource_requirements" in svc:
                for rr in svc.get("resource_requirements") or []:
                    if isinstance(rr, dict) and "eligible_resource_ids" in rr:
                        rr["eligible_resource_ids"] = [
                            rid for rid in rr["eligible_resource_ids"] if rid not in deleted_res_ids
                        ]

    return cast(dict[str, Any], merged)

