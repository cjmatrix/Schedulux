from __future__ import annotations

import copy
import json
from datetime import datetime
from typing import Any

from beanie import Document
from pydantic import BaseModel, ConfigDict, Field, field_validator
from pymongo import IndexModel

from agent_orchestrator.models.base import (
    BookingMode,
    BusinessProfileEmbed,
    DispatchStatus,
    GuardrailsEmbed,
    LlmEngineEmbed,
    OperatingHoursEmbed,
    PriceType,
    ResourceEmbed,
    ResourceType,
    SchedulingEngineEmbed,
    SelectionMode,
    ServiceEmbed,
    TolerantBaseModel,
    WidgetConfigEmbed,
)


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


class StrictPriceSchema(BaseModel):
    model_config = ConfigDict(extra="forbid")
    type: PriceType | None = None
    amount: float | None = None
    currency: str | None = None


class StrictServiceVerificationSchema(BaseModel):
    model_config = ConfigDict(extra="forbid")
    require_otp: bool | None = None


class StrictResourceRequirementSchema(BaseModel):
    model_config = ConfigDict(extra="forbid")
    role: str | None = None
    resource_type: ResourceType | str | None = None
    count: int | None = None
    eligible_resource_ids: list[str] | None = None
    selection_mode: SelectionMode | None = None


class StrictServiceSchema(BaseModel):
    model_config = ConfigDict(extra="forbid")
    service_id: str | None = None
    name: str | None = None
    category: str | None = None
    description: str | None = None
    duration_minutes: int | None = None
    buffer_minutes: int | None = None
    booking_mode: BookingMode | None = None
    price: StrictPriceSchema | None = None
    verification: StrictServiceVerificationSchema | None = None
    resource_requirements: list[StrictResourceRequirementSchema] | None = None
    is_deleted: bool | None = None
    deleted_at: str | None = None


class StrictShiftIntervalSchema(BaseModel):
    model_config = ConfigDict(extra="forbid")
    start: str = Field(description="Shift start time in 24-hr format HH:MM (e.g. '09:00')")
    end: str = Field(description="Shift end time in 24-hr format HH:MM (e.g. '17:00')")


class StrictCustomShiftOverridesSchema(BaseModel):
    model_config = ConfigDict(extra="forbid")
    monday: list[StrictShiftIntervalSchema] | None = Field(
        default=None, description="Shifts for Monday. Empty list [] means day off."
    )
    tuesday: list[StrictShiftIntervalSchema] | None = Field(
        default=None, description="Shifts for Tuesday. Empty list [] means day off."
    )
    wednesday: list[StrictShiftIntervalSchema] | None = Field(
        default=None, description="Shifts for Wednesday. Empty list [] means day off."
    )
    thursday: list[StrictShiftIntervalSchema] | None = Field(
        default=None, description="Shifts for Thursday. Empty list [] means day off."
    )
    friday: list[StrictShiftIntervalSchema] | None = Field(
        default=None, description="Shifts for Friday. Empty list [] means day off."
    )
    saturday: list[StrictShiftIntervalSchema] | None = Field(
        default=None, description="Shifts for Saturday. Empty list [] means day off."
    )
    sunday: list[StrictShiftIntervalSchema] | None = Field(
        default=None, description="Shifts for Sunday. Empty list [] means day off."
    )


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
    custom_shift_overrides: StrictCustomShiftOverridesSchema | dict | None = Field(
        default=None,
        description="Optional custom working shifts overriding global operating hours for this resource (e.g. friday: [{start: '09:00', end: '12:00'}], saturday: [] for day off).",
    )
    is_deleted: bool | None = None
    deleted_at: str | None = None

    @field_validator("custom_shift_overrides", mode="before")
    @classmethod
    def parse_custom_shift_overrides(cls, v: object) -> object:
        if not v:
            return {}
        if isinstance(v, str):
            try:
                parsed = json.loads(v)
                return parsed if isinstance(parsed, dict) else {}
            except Exception:
                return {}
        return v


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
    booking_mode: BookingMode | None = None
    default_lead_time_hours: int | None = None
    max_advance_booking_days: int | None = None
    cancellation_window_hours: int | None = None
    hold_duration_minutes: int | None = None


class StrictWidgetThemeSchema(BaseModel):
    model_config = ConfigDict(extra="forbid")
    primary_color: str | None = None
    secondary_color: str | None = None
    background_color: str | None = None
    header_background: str | None = None
    header_text_color: str | None = None
    user_bubble_bg: str | None = None
    user_bubble_text: str | None = None
    agent_bubble_bg: str | None = None
    agent_bubble_text: str | None = None
    border_radius: str | None = None
    font_family: str | None = None
    theme_mode: str | None = None


class StrictWidgetConfigSchema(BaseModel):
    model_config = ConfigDict(extra="forbid")
    agent_name: str | None = None
    agent_subtitle: str | None = None
    avatar_url: str | None = None
    logo_url: str | None = None
    initial_greeting: str | None = None
    placeholder_text: str | None = None
    quick_prompts: list[str] | None = None
    fallback_message: str | None = None
    position: str | None = None
    bottom_spacing_px: int | None = None
    side_spacing_px: int | None = None
    launcher_style: str | None = None
    launcher_icon: str | None = None
    sound_on_load: bool | None = None
    auto_expand_delay_seconds: int | None = None
    platform_sources: list[str] | None = None
    whitelisted_domains: list[str] | None = None
    theme: StrictWidgetThemeSchema | None = None


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


class StrictGuardrailsSchema(BaseModel):
    model_config = ConfigDict(extra="forbid")
    verification_policy: StrictVerificationPolicySchema | None = None
    phi_scrubbing: StrictPhiScrubSchema | None = None
    triage_emergency: StrictTriageEmergencySchema | None = None
    human_handoff: StrictHumanHandoffSchema | None = None


class StrictLlmEngineSchema(BaseModel):
    model_config = ConfigDict(extra="forbid")
    fallback_trigger_latency_ms: int | None = None
    temperature: float | None = None
    semantic_caching: bool | None = None
    prompt_compiler_token_limit: int | None = None


class StrictDraftPatchValidator(BaseModel):
    model_config = ConfigDict(extra="forbid")
    schema_version: str | None = "2.4"
    status: str | None = "draft"
    tenant_id: str | None = None
    agent_id: str | None = None
    creation_source: str | None = "custom"
    business_profile: StrictBusinessProfileSchema | None = Field(
        default=None,
        description="ONLY include if actively modifying business profile details (name, timezone, etc.). Omit if unchanged.",
    )
    services: list[StrictServiceSchema] | None = Field(
        default=None,
        description="ONLY include if actively adding, editing, or deleting services. Omit completely if services are unchanged.",
    )
    resources: list[StrictResourceSchema] | None = Field(
        default=None,
        description="ONLY include if actively adding, editing, or deleting resources. Omit completely if resources are unchanged.",
    )
    operating_hours: StrictOperatingHoursSchema | None = Field(
        default=None,
        description="ONLY include if actively modifying weekly operating hours or blackout dates. Omit if unchanged.",
    )
    scheduling_engine: StrictSchedulingEngineSchema | None = Field(
        default=None,
        description="ONLY include if updating lead times, cancellation window, or booking mode. Omit if unchanged.",
    )
    widget_config: StrictWidgetConfigSchema | None = Field(
        default=None,
        description="ONLY include if customizing widget styling, greeting, or platforms. Omit if unchanged.",
    )
    guardrails: StrictGuardrailsSchema | None = Field(
        default=None,
        description="ONLY include if updating verification policies (OTP), triage, or human handoff. Omit if unchanged.",
    )
    llm_engine: StrictLlmEngineSchema | None = Field(
        default=None,
        description="ONLY include if customizing LLM engine settings (temperature, caching). Omit if unchanged.",
    )
    supervisor_prompt: str | None = Field(
        default=None,
        description="ONLY include if setting or modifying custom AI supervisor prompt instructions. Omit if unchanged.",
    )


class AgentDraftConfig(TolerantBaseModel):
    schema_version: str = "2.4"
    status: str = "draft"
    tenant_id: str | None = None
    agent_id: str | None = None
    creation_source: str = "custom"
    business_profile: BusinessProfileEmbed | None = None
    widget_config: WidgetConfigEmbed | None = None
    llm_engine: LlmEngineEmbed | None = None
    supervisor_prompt: str | None = None
    scheduling_engine: SchedulingEngineEmbed | None = None
    operating_hours: OperatingHoursEmbed | None = None
    resources: list[ResourceEmbed] = Field(default_factory=list)
    services: list[ServiceEmbed] = Field(default_factory=list)
    guardrails: GuardrailsEmbed | None = None


def canonicalize_agent_schema(
    data: dict[str, object] | Any, status: str = "draft"
) -> dict[str, object]:
    if not data:
        return {}

    raw_dict = data.model_dump() if hasattr(data, "model_dump") else data
    clean_data = copy.deepcopy(raw_dict)
    clean_data["status"] = status
    if "tenant_id" not in clean_data:
        clean_data["tenant_id"] = ""
    if "agent_id" not in clean_data:
        clean_data["agent_id"] = ""

    resources_data = clean_data.get("resources")
    if isinstance(resources_data, list):
        for r in resources_data:
            if isinstance(r, dict) and r.get("custom_shift_overrides") is None:
                r["custom_shift_overrides"] = {}

    try:
        cfg = AgentDraftConfig(**clean_data)
        res: dict[str, object] = {
            "schema_version": cfg.schema_version,
            "status": status,
            "tenant_id": cfg.tenant_id,
            "agent_id": cfg.agent_id,
            "creation_source": cfg.creation_source,
            "business_profile": cfg.business_profile.model_dump()
            if cfg.business_profile
            else BusinessProfileEmbed().model_dump(),
            "operating_hours": cfg.operating_hours.model_dump()
            if cfg.operating_hours
            else OperatingHoursEmbed().model_dump(),
            "scheduling_engine": cfg.scheduling_engine.model_dump()
            if cfg.scheduling_engine
            else SchedulingEngineEmbed().model_dump(),
            "services": [s.model_dump() for s in cfg.services],
            "resources": [r.model_dump() for r in cfg.resources],
            "guardrails": cfg.guardrails.model_dump()
            if cfg.guardrails
            else GuardrailsEmbed().model_dump(),
            "widget_config": cfg.widget_config.model_dump()
            if cfg.widget_config
            else WidgetConfigEmbed().model_dump(),
            "llm_engine": cfg.llm_engine.model_dump()
            if cfg.llm_engine
            else LlmEngineEmbed().model_dump(),
        }
        if cfg.supervisor_prompt:
            res["supervisor_prompt"] = cfg.supervisor_prompt
        bp = res.get("business_profile")
        if status == "live" and isinstance(bp, dict) and not bp.get("timezone"):
            bp["timezone"] = "UTC"
        return res
    except Exception:
        bp_raw = clean_data.get("business_profile")
        oh_raw = clean_data.get("operating_hours")
        se_raw = clean_data.get("scheduling_engine")
        gr_raw = clean_data.get("guardrails")
        wc_raw = clean_data.get("widget_config")
        llm_raw = clean_data.get("llm_engine")

        raw_services = clean_data.get("services")
        raw_resources = clean_data.get("resources")
        services_list = raw_services if isinstance(raw_services, list) else []
        resources_list = raw_resources if isinstance(raw_resources, list) else []

        res_fallback: dict[str, object] = {
            "schema_version": clean_data.get("schema_version", "2.4"),
            "status": status,
            "tenant_id": clean_data.get("tenant_id", ""),
            "agent_id": clean_data.get("agent_id", ""),
            "business_profile": BusinessProfileEmbed(**bp_raw).model_dump()
            if isinstance(bp_raw, dict)
            else BusinessProfileEmbed().model_dump(),
            "operating_hours": OperatingHoursEmbed(**oh_raw).model_dump()
            if isinstance(oh_raw, dict)
            else OperatingHoursEmbed().model_dump(),
            "scheduling_engine": SchedulingEngineEmbed(**se_raw).model_dump()
            if isinstance(se_raw, dict)
            else SchedulingEngineEmbed().model_dump(),
            "services": [
                ServiceEmbed(**s).model_dump() for s in services_list if isinstance(s, dict)
            ],
            "resources": [
                ResourceEmbed(**r).model_dump() for r in resources_list if isinstance(r, dict)
            ],
            "guardrails": GuardrailsEmbed(**gr_raw).model_dump()
            if isinstance(gr_raw, dict)
            else GuardrailsEmbed().model_dump(),
            "widget_config": WidgetConfigEmbed(**wc_raw).model_dump()
            if isinstance(wc_raw, dict)
            else WidgetConfigEmbed().model_dump(),
            "llm_engine": LlmEngineEmbed(**llm_raw).model_dump()
            if isinstance(llm_raw, dict)
            else LlmEngineEmbed().model_dump(),
        }
        if clean_data.get("supervisor_prompt"):
            res_fallback["supervisor_prompt"] = clean_data["supervisor_prompt"]
        bp_fb = res_fallback.get("business_profile")
        if status == "live" and isinstance(bp_fb, dict) and not bp_fb.get("timezone"):
            bp_fb["timezone"] = "UTC"
        return res_fallback


class DraftCheckpointEmbed(TolerantBaseModel):
    checkpoint_id: str
    message_id: str
    user_prompt: str | None = ""
    summary: str | None = ""
    draft_snapshot: dict[str, object] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class AgentDraft(Document):
    """
    Workspace staging document for in-progress agent configurations.
    Maintains a rolling timeline of the last 20 message checkpoints (full snapshots)
    enabling instant Google Antigravity-style time travel rewind to any message.
    """

    model_config = ConfigDict(extra="ignore")

    tenant_id: str
    agent_id: str
    name: str
    creation_source: str = "custom"
    status: str = "pending"
    last_edited_by: str | None = None

    current_draft: AgentDraftConfig = Field(default_factory=AgentDraftConfig)
    active_message_id: str | None = None

    conversation_summary: str = ""
    last_summarized_seq: int = 0

    checkpoints: list[DraftCheckpointEmbed] = Field(default_factory=list)

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    @field_validator("current_draft", mode="before")
    @classmethod
    def parse_current_draft(cls, v: Any) -> Any:
        if isinstance(v, dict):
            return AgentDraftConfig.model_validate(v)
        return v

    class Settings:
        name = "agent_drafts"
        indexes = [
            IndexModel([("tenant_id", 1), ("agent_id", 1)], unique=True, name="idx_tenant_agent"),
            IndexModel([("tenant_id", 1), ("updated_at", -1)], name="idx_tenant_updated"),
        ]

    def add_checkpoint(
        self,
        checkpoint_id: str,
        message_id: str,
        draft_snapshot: dict[str, object] | AgentDraftConfig,
        user_prompt: str = "",
        summary: str = "",
        max_checkpoints: int = 20,
    ) -> None:
        """Appends a new message checkpoint and enforces a rolling window of max 20."""
        raw_dict = (
            draft_snapshot.model_dump()
            if hasattr(draft_snapshot, "model_dump")
            else (copy.deepcopy(draft_snapshot) if draft_snapshot else {})
        )
        new_cp = DraftCheckpointEmbed(
            checkpoint_id=checkpoint_id,
            message_id=message_id,
            user_prompt=user_prompt,
            summary=summary,
            draft_snapshot=raw_dict,
            timestamp=datetime.utcnow(),
        )
        self.checkpoints.append(new_cp)

        if len(self.checkpoints) > max_checkpoints:
            self.checkpoints = self.checkpoints[-max_checkpoints:]

        self.current_draft = AgentDraftConfig.model_validate(raw_dict)
        self.active_message_id = message_id
        self.updated_at = datetime.utcnow()

    def rewind_to_message(self, target_message_id: str) -> DraftCheckpointEmbed | None:
        """
        Rewinds the draft back to the state of target_message_id.
        Truncates any forward checkpoints after this message (linear time travel).
        Returns the target checkpoint so LangGraph can rewind its thread state too.
        """
        target_idx = None
        for idx, cp in enumerate(self.checkpoints):
            if cp.message_id == target_message_id:
                target_idx = idx
                break

        if target_idx is None:
            return None

        target_cp = self.checkpoints[target_idx]

        self.checkpoints = self.checkpoints[: target_idx + 1]
        self.current_draft = AgentDraftConfig.model_validate(target_cp.draft_snapshot)
        self.active_message_id = target_cp.message_id
        self.updated_at = datetime.utcnow()

        return target_cp
