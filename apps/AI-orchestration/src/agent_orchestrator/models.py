from __future__ import annotations

import copy
import os
import urllib.parse
from datetime import datetime
from enum import StrEnum
from typing import Any, Literal

from beanie import Document, init_beanie
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from pydantic_core import PydanticUndefined
from pymongo import AsyncMongoClient, IndexModel


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


class BrandEmbed(TolerantBaseModel):
    primary_color: str | None = None
    logo_url: str | None = None


class BusinessProfileEmbed(TolerantBaseModel):
    name: str = ""
    vertical: str = ""
    timezone: str | None = None
    locale: str | None = None
    currency: str | None = "USD"
    address: str | None = None
    contact: ContactEmbed | None = None
    terminology: TerminologyEmbed | None = None
    brand: BrandEmbed | None = None


class WidgetConfigEmbed(TolerantBaseModel):
    agent_name: str | None = None
    avatar_url: str | None = None
    initial_greeting: str | None = None
    fallback_message: str | None = None
    position: str | None = "right"
    launcher_style: str | None = None
    sound_on_load: bool = False
    auto_expand_delay_seconds: int | None = None
    platform_sources: list[str] = Field(default_factory=list)
    whitelisted_domains: list[str] = Field(default_factory=list)


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


class SchedulingEngineEmbed(TolerantBaseModel):
    allocation_model: str = "time_slot"
    default_booking_mode: str = "time_slot"
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


class ServiceAllocationModel(StrEnum):
    SINGLE_RESOURCE = "single_resource"
    MULTI_RESOURCE = "multi_resource"
    POOLED = "pooled"
    ASSET_ONLY = "asset_only"


class BookingMode(StrEnum):
    TIME_SLOT = "time_slot"
    DATE_RANGE = "date_range"


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

    @field_validator("category", mode="before")
    @classmethod
    def parse_category(cls, v: object) -> str:
        if not v or not str(v).strip():
            return "General"
        return str(v).strip()


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


class DepositEmbed(TolerantBaseModel):
    required: bool = False
    amount: float = 0.0
    processor: str = "upi_direct"
    upi_id: str = ""
    qr_code_url: str = ""
    confirmation_method: str = "utr_reference"
    payment_instructions: str = ""

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


class ServiceEmbed(TolerantBaseModel):
    service_id: str
    name: str
    category: str = "General"
    description: str | None = ""
    duration_minutes: int | None = 30
    buffer_minutes: int | None = 0
    allocation_model: ServiceAllocationModel = ServiceAllocationModel.SINGLE_RESOURCE
    booking_mode: BookingMode = BookingMode.TIME_SLOT
    price: PriceEmbed = Field(default_factory=PriceEmbed)
    deposit: DepositEmbed = Field(default_factory=DepositEmbed)
    verification: ServiceVerificationEmbed | None = None
    eligible_resource_ids: list[str] = Field(default_factory=list)
    required_asset_ids: list[str] = Field(default_factory=list)
    recall_interval_days: int | None = 0

    @field_validator("category", mode="before")
    @classmethod
    def parse_category(cls, v: object) -> str:
        if not v or not str(v).strip():
            return "General"
        return str(v).strip()

    @field_validator("recall_interval_days", "buffer_minutes", mode="before")
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
    require_otp_for_reschedule: bool = True
    require_otp_for_cancel: bool = True


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


class PaymentGatewayEmbed(TolerantBaseModel):
    model: str | None = "pass_through"
    supported_processors: list[str] = Field(default_factory=lambda: ["upi_direct"])
    active_processor: str | None = "upi_direct"
    upi_config: UpiConfigEmbed | None = None
    confirmation_method: str | None = "utr_reference"
    refund_policy: str | None = "tenant_managed"


class IntegrationsEmbed(TolerantBaseModel):
    stripe: dict[str, object] = Field(default_factory=dict)
    payment_gateway: PaymentGatewayEmbed | None = None
    twilio: dict[str, object] = Field(default_factory=dict)


class SubscriptionEmbed(TolerantBaseModel):
    tier: str | None = "starter"
    tokens_used_this_month: int = 0


class AgentRuntimeConfig(Document):
    """
    Top-level document for a compiled Schedulux agent runtime configuration.
    One document per active agent per tenant.
    Indexed for runtime hot-path: tenant_id + status is the primary lookup.
    """

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

    schema_version: str = "2.4"
    status: str = "draft"
    tenant_id: str
    agent_id: str | None = None
    creation_source: str = "custom"

    compiled_at: datetime = Field(default_factory=datetime.utcnow)

    business_profile: BusinessProfileEmbed | None = None
    widget_config: WidgetConfigEmbed | None = None
    llm_engine: LlmEngineEmbed | None = None
    supervisor_prompt: str | None = None
    knowledge_base: KnowledgeBaseEmbed | None = None
    scheduling_engine: SchedulingEngineEmbed | None = None
    operating_hours: OperatingHoursEmbed | None = None

    resources: list[ResourceEmbed] = Field(default_factory=list)
    services: list[ServiceEmbed] = Field(default_factory=list)

    guardrails: GuardrailsEmbed | None = None
    sub_agents: list[SubAgentEmbed] = Field(default_factory=list)

    integrations: IntegrationsEmbed | None = None
    subscription: SubscriptionEmbed | None = None

    class Settings:
        name = "agent_runtime_configs"
        indexes = [
            IndexModel([("tenant_id", 1), ("status", 1)], name="idx_tenant_status"),
            IndexModel([("agent_id", 1)], unique=True, sparse=True, name="idx_agent_id"),
            IndexModel(
                [("tenant_id", 1), ("status", 1), ("compiled_at", -1)], name="idx_tenant_latest"
            ),
        ]



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
    allocation_model: BookingMode | None = None
    default_booking_mode: BookingMode | None = None
    default_lead_time_hours: int | None = None
    max_advance_booking_days: int | None = None
    cancellation_window_hours: int | None = None
    hold_duration_minutes: int | None = None


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
    schema_version: str | None = "2.4"
    status: str | None = "draft"
    tenant_id: str | None = None
    agent_id: str | None = None
    creation_source: str | None = "custom"
    business_profile: StrictBusinessProfileSchema | None = None
    services: list[StrictServiceSchema] | None = None
    resources: list[StrictResourceSchema] | None = None
    operating_hours: StrictOperatingHoursSchema | None = None
    scheduling_engine: StrictSchedulingEngineSchema | None = None
    widget_config: StrictWidgetConfigSchema | None = None
    compliance: StrictComplianceSchema | None = None
    guardrails: StrictGuardrailsSchema | None = None
    supervisor_prompt: str | None = None


def canonicalize_agent_schema(data: dict[str, object], status: str = "draft") -> dict[str, object]:
    if not data:
        return {}

    clean_data = copy.deepcopy(data)
    clean_data["status"] = status
    if "tenant_id" not in clean_data:
        clean_data["tenant_id"] = ""
    if "agent_id" not in clean_data:
        clean_data["agent_id"] = ""

    if status == "draft":
        try:
            validated = StrictDraftPatchValidator.model_validate(clean_data)
            res_draft = validated.model_dump(exclude_unset=True)
        except Exception:
            res_draft = clean_data

        res_draft.setdefault("schema_version", clean_data.get("schema_version", "2.4"))
        res_draft.setdefault("status", "draft")
        res_draft.setdefault("tenant_id", clean_data.get("tenant_id", ""))
        res_draft.setdefault("agent_id", clean_data.get("agent_id", ""))
        res_draft.setdefault("creation_source", clean_data.get("creation_source", "custom"))
        res_draft.setdefault("business_profile", clean_data.get("business_profile") or {})
        res_draft.setdefault("operating_hours", clean_data.get("operating_hours") or {})
        res_draft.setdefault("scheduling_engine", clean_data.get("scheduling_engine") or {})
        res_draft.setdefault("services", clean_data.get("services") or [])
        res_draft.setdefault("resources", clean_data.get("resources") or [])
        res_draft.setdefault("guardrails", clean_data.get("guardrails") or {})
        res_draft.setdefault("widget_config", clean_data.get("widget_config") or {})
        res_draft.setdefault("compliance", clean_data.get("compliance") or {})
        if "supervisor_prompt" in clean_data:
            res_draft["supervisor_prompt"] = clean_data["supervisor_prompt"]
        if "llm_engine" in clean_data:
            res_draft["llm_engine"] = clean_data["llm_engine"]
        if "knowledge_base" in clean_data:
            res_draft["knowledge_base"] = clean_data["knowledge_base"]
        if "sub_agents" in clean_data:
            res_draft["sub_agents"] = clean_data["sub_agents"]
        if "integrations" in clean_data:
            res_draft["integrations"] = clean_data["integrations"]
        if "subscription" in clean_data:
            res_draft["subscription"] = clean_data["subscription"]
        return res_draft

    if isinstance(clean_data.get("resources"), list):
        for r in clean_data["resources"]:
            if isinstance(r, dict) and r.get("custom_shift_overrides") is None:
                r["custom_shift_overrides"] = {}

    try:
        cfg = AgentRuntimeConfig(**clean_data)
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
            "knowledge_base": cfg.knowledge_base.model_dump()
            if cfg.knowledge_base
            else KnowledgeBaseEmbed().model_dump(),
            "sub_agents": [sa.model_dump() for sa in cfg.sub_agents],
            "integrations": cfg.integrations.model_dump()
            if cfg.integrations
            else IntegrationsEmbed().model_dump(),
            "subscription": cfg.subscription.model_dump()
            if cfg.subscription
            else SubscriptionEmbed().model_dump(),
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
        kb_raw = clean_data.get("knowledge_base")
        int_raw = clean_data.get("integrations")
        sub_raw = clean_data.get("subscription")

        raw_services = clean_data.get("services")
        raw_resources = clean_data.get("resources")
        raw_sub_agents = clean_data.get("sub_agents")
        services_list = raw_services if isinstance(raw_services, list) else []
        resources_list = raw_resources if isinstance(raw_resources, list) else []
        sub_agents_list = raw_sub_agents if isinstance(raw_sub_agents, list) else []

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
            "knowledge_base": KnowledgeBaseEmbed(**kb_raw).model_dump()
            if isinstance(kb_raw, dict)
            else KnowledgeBaseEmbed().model_dump(),
            "sub_agents": [
                SubAgentEmbed(**sa).model_dump() for sa in sub_agents_list if isinstance(sa, dict)
            ],
            "integrations": IntegrationsEmbed(**int_raw).model_dump()
            if isinstance(int_raw, dict)
            else IntegrationsEmbed().model_dump(),
            "subscription": SubscriptionEmbed(**sub_raw).model_dump()
            if isinstance(sub_raw, dict)
            else SubscriptionEmbed().model_dump(),
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

    current_draft: dict[str, object] = Field(default_factory=dict)
    active_message_id: str | None = None

    conversation_summary: str = ""
    last_summarized_seq: int = 0

    checkpoints: list[DraftCheckpointEmbed] = Field(default_factory=list)

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

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
        draft_snapshot: dict[str, object],
        user_prompt: str = "",
        summary: str = "",
        max_checkpoints: int = 20,
    ) -> None:
        """Appends a new message checkpoint and enforces a rolling window of max 20."""
        new_cp = DraftCheckpointEmbed(
            checkpoint_id=checkpoint_id,
            message_id=message_id,
            user_prompt=user_prompt,
            summary=summary,
            draft_snapshot=copy.deepcopy(draft_snapshot) if draft_snapshot else {},
            timestamp=datetime.utcnow(),
        )
        self.checkpoints.append(new_cp)

        if len(self.checkpoints) > max_checkpoints:
            self.checkpoints = self.checkpoints[-max_checkpoints:]

        self.current_draft = new_cp.draft_snapshot
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
        self.current_draft = copy.deepcopy(target_cp.draft_snapshot)
        self.active_message_id = target_cp.message_id
        self.updated_at = datetime.utcnow()

        return target_cp


class AgentMessage(Document):
    model_config = ConfigDict(extra="ignore")

    tenant_id: str
    agent_id: str
    seq: int = 0
    role: str  # "agent" or "tenant"
    content: str
    token_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "agent_messages"
        indexes = [
            IndexModel(
                [("tenant_id", 1), ("agent_id", 1), ("created_at", -1)],
                name="idx_tenant_agent_created_desc",
            ),
            IndexModel(
                [("tenant_id", 1), ("agent_id", 1)],
                name="idx_tenant_agent",
            ),
            IndexModel(
                [("tenant_id", 1), ("agent_id", 1), ("seq", 1)],
                name="idx_tenant_agent_seq",
            ),
        ]


_client: AsyncMongoClient | None = None
_db_initialized = False


async def init_db(mongo_uri: str | None = None):
    global _client, _db_initialized
    if _db_initialized:
        return
    if mongo_uri is None:
        mongo_uri = os.environ.get("MONGO_URI", "mongodb://localhost:27017/schedulux_ai")

    parsed = urllib.parse.urlparse(mongo_uri)
    db_name = parsed.path.lstrip("/") if parsed.path else ""
    if not db_name or "?" in db_name:
        db_name = db_name.split("?")[0] if db_name else ""
    if not db_name:
        db_name = "schedulux_ai"

    _client = AsyncMongoClient(mongo_uri)
    db = _client[db_name]
    await init_beanie(
        database=db,
        document_models=[AgentDraft, AgentRuntimeConfig, AgentMessage],
    )
    _db_initialized = True
