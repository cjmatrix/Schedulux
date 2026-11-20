from __future__ import annotations

import json
from datetime import datetime
from enum import StrEnum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from pydantic_core import PydanticUndefined


class TolerantBaseModel(BaseModel):
    model_config = ConfigDict(extra="ignore")

    @model_validator(mode="before")
    @classmethod
    def drop_nulls_for_defaulted_fields(cls, data: Any) -> Any:
        if not isinstance(data, dict):
            return data
        cleaned = {}
        for k, v in data.items():
            field_info = cls.model_fields.get(k)
            if v is None and field_info is not None:
                has_default = (
                    field_info.default is not PydanticUndefined and field_info.default is not ...
                )
                has_default_factory = field_info.default_factory is not None
                if has_default or has_default_factory:
                    continue
            cleaned[k] = v
        return cleaned


class ContactEmbed(TolerantBaseModel):
    support_email: str | None = None
    public_phone: str | None = None
    escalation_phone: str | None = None


class TerminologyEmbed(TolerantBaseModel):
    customer_singular: str | None = None
    customer_plural: str | None = None
    primary_metric: str | None = None
    action_metric: str | None = None


class WidgetThemeEmbed(TolerantBaseModel):
    primary_color: str = "#4F46E5"
    theme_mode: str = "light"
    secondary_color: str | None = None
    background_color: str | None = None
    header_background: str | None = None
    header_text_color: str | None = None
    user_bubble_bg: str | None = None
    user_bubble_text: str | None = None
    agent_bubble_bg: str | None = None
    agent_bubble_text: str | None = None
    border_radius: str = "16px"
    font_family: str = "inherit"


class BusinessProfileEmbed(TolerantBaseModel):
    name: str = ""
    vertical: str = ""
    timezone: str | None = None
    locale: str | None = None
    currency: str | None = "USD"
    address: str | None = None
    contact: ContactEmbed | None = None
    terminology: TerminologyEmbed | None = None


class WidgetConfigEmbed(TolerantBaseModel):
    agent_name: str = "AI Assistant"
    agent_subtitle: str | None = "Typically replies instantly"
    avatar_url: str | None = None
    logo_url: str | None = None
    initial_greeting: str | None = "Hi there! How can I assist you with scheduling today?"
    placeholder_text: str = "Type a message or ask a question..."
    quick_prompts: list[str] = Field(
        default_factory=lambda: [
            "What services do you provide?",
            "Check available appointment times",
            "What are your operating hours?",
        ]
    )
    fallback_message: str | None = None
    position: str = "bottom-right"
    bottom_spacing_px: int = 20
    side_spacing_px: int = 20
    launcher_style: str | None = "bubble"
    launcher_icon: str = "chat"
    sound_on_load: bool = False
    auto_expand_delay_seconds: int | None = None
    platform_sources: list[str] = Field(default_factory=list)
    whitelisted_domains: list[str] = Field(default_factory=list)
    theme: WidgetThemeEmbed = Field(default_factory=WidgetThemeEmbed)


class LlmEngineEmbed(TolerantBaseModel):
    fallback_trigger_latency_ms: int | None = None
    temperature: float = 0.1
    semantic_caching: bool = True
    prompt_compiler_token_limit: int | None = None


class KnowledgeAssetEmbed(TolerantBaseModel):
    asset_id: str
    title: str | None = None
    asset_type: str | None = None
    source_uri: str | None = None
    sync_status: str | None = None
    last_synced_at: datetime | None = None


class KnowledgeBaseEmbed(TolerantBaseModel):
    namespace: str | None = None
    qdrant_collection: str | None = None
    sources: list[KnowledgeAssetEmbed] = Field(default_factory=list)


class BookingMode(StrEnum):
    TIME_SLOT = "time_slot"
    DATE_RANGE = "date_range"


class SchedulingEngineEmbed(TolerantBaseModel):
    booking_mode: BookingMode = BookingMode.TIME_SLOT
    default_lead_time_hours: int = 2
    max_advance_booking_days: int = 60
    cancellation_window_hours: int = 24
    hold_duration_minutes: int = 10


class BlackoutDateEmbed(TolerantBaseModel):
    date: str
    reason: str | None = None
    is_closed: bool = True


class TimeSlotEmbed(TolerantBaseModel):
    start: str
    end: str


class OperatingHoursEmbed(TolerantBaseModel):
    monday: list[TimeSlotEmbed] = Field(default_factory=list)
    tuesday: list[TimeSlotEmbed] = Field(default_factory=list)
    wednesday: list[TimeSlotEmbed] = Field(default_factory=list)
    thursday: list[TimeSlotEmbed] = Field(default_factory=list)
    friday: list[TimeSlotEmbed] = Field(default_factory=list)
    saturday: list[TimeSlotEmbed] = Field(default_factory=list)
    sunday: list[TimeSlotEmbed] = Field(default_factory=list)
    blackout_dates: list[BlackoutDateEmbed] = Field(default_factory=list)


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


class ResourceEmbed(TolerantBaseModel):
    resource_id: str
    resource_type: ResourceType = ResourceType.STAFF
    name: str
    title: str | None = ""
    category: str = "General"
    description: str | None = ""
    is_bookable: bool = True
    dispatch_status: DispatchStatus = DispatchStatus.ACTIVE
    custom_shift_overrides: dict[str, object] = Field(default_factory=dict)
    is_deleted: bool = False
    deleted_at: str | None = None

    @field_validator("category", mode="before")
    @classmethod
    def parse_category(cls, v: object) -> str:
        if not v or not str(v).strip():
            return "General"
        return str(v).strip()

    @field_validator("custom_shift_overrides", mode="before")
    @classmethod
    def parse_custom_shift_overrides(cls, v: object) -> dict[str, object]:
        if not v:
            return {}
        if isinstance(v, str):
            try:
                parsed = json.loads(v)
                return parsed if isinstance(parsed, dict) else {}
            except Exception:
                return {}
        if isinstance(v, dict):
            return v
        return {}


class PriceEmbed(TolerantBaseModel):
    type: PriceType = PriceType.FIXED
    amount: float = 0.0
    currency: str = "USD"

    @field_validator("amount", mode="before")
    @classmethod
    def parse_amount(cls, v: object) -> float:
        if v is None:
            return 0.0
        try:
            return float(v)  # type: ignore[arg-type]
        except (ValueError, TypeError):
            return 0.0


class ServiceVerificationEmbed(TolerantBaseModel):
    require_otp: bool | None = None


class SelectionMode(StrEnum):
    USER_SELECTABLE = "user_selectable"
    AUTO_ASSIGN = "auto_assign"


class ResourceRequirementEmbed(TolerantBaseModel):
    role: str | None = "Provider"
    resource_type: ResourceType | str | None = ResourceType.STAFF
    count: int = 1
    eligible_resource_ids: list[str] = Field(default_factory=list)
    selection_mode: SelectionMode = SelectionMode.AUTO_ASSIGN

    @model_validator(mode="before")
    @classmethod
    def set_default_selection_mode(cls, data: Any) -> Any:
        if isinstance(data, dict):
            raw_mode = data.get("selection_mode")
            if raw_mode:
                str_mode = str(raw_mode).lower().strip()
                if str_mode in ("user_selectable", "auto_assign"):
                    data["selection_mode"] = SelectionMode(str_mode)
            else:
                r_type = str(data.get("resource_type") or "").lower()
                data["selection_mode"] = (
                    SelectionMode.USER_SELECTABLE
                    if r_type == "staff"
                    else SelectionMode.AUTO_ASSIGN
                )
        return data

    @field_validator("count", mode="before")
    @classmethod
    def parse_count(cls, v: object) -> int:
        if v is None:
            return 1
        try:
            return max(1, int(v))
        except (ValueError, TypeError):
            return 1


class ServiceEmbed(TolerantBaseModel):
    service_id: str
    name: str
    category: str = "General"
    description: str | None = ""
    duration_minutes: int | None = 30
    buffer_minutes: int | None = 0
    booking_mode: BookingMode = BookingMode.TIME_SLOT
    price: PriceEmbed = Field(default_factory=PriceEmbed)
    verification: ServiceVerificationEmbed | None = None
    resource_requirements: list[ResourceRequirementEmbed] = Field(default_factory=list)
    is_deleted: bool = False
    deleted_at: str | None = None

    @field_validator("category", mode="before")
    @classmethod
    def parse_category(cls, v: object) -> str:
        if not v or not str(v).strip():
            return "General"
        return str(v).strip()

    @field_validator("buffer_minutes", mode="before")
    @classmethod
    def parse_zero_ints(cls, v: object) -> int:
        if v is None:
            return 0
        try:
            return int(v)  # type: ignore[call-overload,arg-type]
        except (ValueError, TypeError):
            return 0

    @field_validator("duration_minutes", mode="before")
    @classmethod
    def parse_duration_minutes(cls, v: object) -> int:
        if v is None:
            return 30
        try:
            return int(v)  # type: ignore[call-overload,arg-type]
        except (ValueError, TypeError):
            return 30


class VerificationPolicyEmbed(TolerantBaseModel):
    require_otp_for_new_booking: bool = False


class PatientFieldEmbed(TolerantBaseModel):
    field_name: str
    data_type: str | None = None
    is_required: bool = True
    prompt_if_missing: str | None = None


class PhiScrubEmbed(TolerantBaseModel):
    enabled: bool = True
    policy: str | None = None
    description: str | None = None
    hipaa_compliant: bool = True


class TriageEmergencyEmbed(TolerantBaseModel):
    enabled: bool = True
    keywords: list[str] = Field(default_factory=list)
    response_override: str | None = None


class HumanHandoffEmbed(TolerantBaseModel):
    enabled: bool = True
    trigger_topics: list[str] = Field(default_factory=list)
    reception_contact: str | None = None
    handoff_message: str | None = None


class GuardrailsEmbed(TolerantBaseModel):
    verification_policy: VerificationPolicyEmbed | None = None
    phi_scrubbing: PhiScrubEmbed | None = None
    triage_emergency: TriageEmergencyEmbed | None = None
    human_handoff: HumanHandoffEmbed | None = None


class StateVariableEmbed(TolerantBaseModel):
    variable_key: str
    data_type: str | None = None
    description: str | None = None
    is_required: bool = True
    prompt_if_missing: str | None = None


class SubAgentEmbed(TolerantBaseModel):
    agent_id: str
    agent_type: str
    routing_trigger_description: str | None = None
    system_prompt: str | None = None
    allowed_tools: list[str] = Field(default_factory=list)
    required_state_variables: list[StateVariableEmbed] = Field(default_factory=list)


class UpiConfigEmbed(TolerantBaseModel):
    upi_id: str | None = None
    display_name: str | None = None
    qr_code_url: str | None = None
    accepted_apps: list[str] = Field(default_factory=list)
