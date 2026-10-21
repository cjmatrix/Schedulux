from __future__ import annotations

from typing import Any

VERTICAL_DISPLAY_NAMES = {
    "medical": "Medical & Dental Clinics",
    "auto": "Auto Repair & Services",
    "hospitality": "Hospitality & Rooms",
    "custom": "Custom Scheduling Service",
}


def build_default_agent_template(
    tenant_id: str,
    agent_id: str,
    vertical: str,
    name: str | None = None,
) -> dict[str, Any]:
    clean_vertical = (vertical or "custom").strip().lower()
    default_name = VERTICAL_DISPLAY_NAMES.get(clean_vertical, "Primary Assistant")
    final_name = (name or "").strip() or default_name

    return {
        "schema_ref": "https://schedulux.ai/schema/v2/agent_runtime_config.json",
        "schema_version": "2.4",
        "status": "draft",
        "tenant_id": tenant_id,
        "agent_id": agent_id,
        "business_profile": {
            "name": final_name,
            "vertical": clean_vertical,
        },
        "services": [],
        "resources": [],
        "runtime_meta": {
            "template_id": f"tpl_{clean_vertical}_v1",
            "compiler_mode": "manual_template",
        },
    }
