from __future__ import annotations

import copy
import os
import urllib.parse
from datetime import datetime
from enum import StrEnum

from beanie import Document, init_beanie
from pydantic import BaseModel, ConfigDict, Field, field_validator
from pymongo import AsyncMongoClient, IndexModel


class ContactEmbed(BaseModel):
    model_config = ConfigDict(extra="ignore")

    support_email: str | None = None
    public_phone: str | None = None
    escalation_phone: str | None = None


class TerminologyEmbed(BaseModel):
    model_config = ConfigDict(extra="ignore")

    customer_singular: str | None = None
    customer_plural: str | None = None
    primary_metric: str | None = None
    action_metric: str | None = None


class BrandEmbed(BaseModel):
    model_config = ConfigDict(extra="ignore")

    primary_color: str | None = None
    logo_url: str | None = None


class BusinessProfileEmbed(BaseModel):
    model_config = ConfigDict(extra="ignore")

    name: str = ""
    vertical: str = ""
    timezone: str | None = None
    locale: str | None = None
    currency: str | None = "USD"
    address: str | None = None
    contact: ContactEmbed | None = None
    terminology: TerminologyEmbed | None = None
    brand: BrandEmbed | None = None


class WidgetConfigEmbed(BaseModel):
    model_config = ConfigDict(extra="ignore")

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


class LlmEngineEmbed(BaseModel):
    model_config = ConfigDict(extra="ignore")
    fallback_trigger_latency_ms: int | None = None
    temperature: float = 0.1
    semantic_caching: bool = True
    prompt_compiler_token_limit: int | None = None


class KnowledgeAssetEmbed(BaseModel):
    model_config = ConfigDict(extra="ignore")

    asset_id: str
    title: str | None = None
    asset_type: str | None = None
    source_uri: str | None = None
    sync_status: str | None = None
    last_synced_at: datetime | None = None


class KnowledgeBaseEmbed(BaseModel):
    model_config = ConfigDict(extra="ignore")

    namespace: str | None = None
    qdrant_collection: str | None = None
    sources: list[KnowledgeAssetEmbed] = Field(default_factory=list)


class SchedulingEngineEmbed(BaseModel):
    model_config = ConfigDict(extra="ignore")

    allocation_model: str = "time_slot"
    default_booking_mode: str = "time_slot"
    default_lead_time_hours: int = 2
    max_advance_booking_days: int = 60
    cancellation_window_hours: int = 24
    hold_duration_minutes: int = 10


class BlackoutDateEmbed(BaseModel):
    model_config = ConfigDict(extra="ignore")

    date: str
    reason: str | None = None
    is_closed: bool = True


class TimeSlotEmbed(BaseModel):
    model_config = ConfigDict(extra="ignore")

    start: str
    end: str


class OperatingHoursEmbed(BaseModel):
    model_config = ConfigDict(extra="ignore")

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


class ResourceEmbed(BaseModel):
    model_config = ConfigDict(extra="ignore")

    resource_id: str
    resource_type: ResourceType = ResourceType.STAFF
    name: str
    title: str = ""
    category: str = "General"
    description: str = ""
    is_bookable: bool = True
    dispatch_status: DispatchStatus = DispatchStatus.ACTIVE
    custom_shift_overrides: dict[str, object] = Field(default_factory=dict)


class PriceEmbed(BaseModel):
    model_config = ConfigDict(extra="ignore")

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


class DepositEmbed(BaseModel):
    model_config = ConfigDict(extra="ignore")

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

    @field_validator("required", mode="before")
    @classmethod
    def parse_required(cls, v: object) -> bool:
        return False if v is None else bool(v)


class ServiceVerificationEmbed(BaseModel):
    model_config = ConfigDict(extra="ignore")

    require_otp: bool | None = None


class ServiceEmbed(BaseModel):
    model_config = ConfigDict(extra="ignore")

    service_id: str
    name: str
    category: str = "General"
    description: str = ""
    duration_minutes: int | None = 30
    buffer_minutes: int | None = 0
    allocation_model: ServiceAllocationModel = ServiceAllocationModel.SINGLE_RESOURCE
    booking_mode: BookingMode = BookingMode.TIME_SLOT
    price: PriceEmbed = Field(default_factory=PriceEmbed)
    deposit: DepositEmbed = Field(default_factory=DepositEmbed)
    verification: ServiceVerificationEmbed = Field(default_factory=ServiceVerificationEmbed)
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

    @field_validator("price", mode="before")
    @classmethod
    def parse_price(cls, v: object) -> object:
        return {} if v is None else v

    @field_validator("deposit", mode="before")
    @classmethod
    def parse_deposit(cls, v: object) -> object:
        return {} if v is None else v

    @field_validator("eligible_resource_ids", "required_asset_ids", mode="before")
    @classmethod
    def parse_lists(cls, v: object) -> object:
        return [] if v is None else v


class VerificationPolicyEmbed(BaseModel):
    model_config = ConfigDict(extra="ignore")

    require_otp_for_new_booking: bool = False
    require_otp_for_reschedule: bool = True
    require_otp_for_cancel: bool = True


class PatientFieldEmbed(BaseModel):
    model_config = ConfigDict(extra="ignore")

    field_name: str
    data_type: str | None = None
    is_required: bool = True
    prompt_if_missing: str | None = None


class PhiScrubEmbed(BaseModel):
    model_config = ConfigDict(extra="ignore")

    enabled: bool = True
    policy: str | None = None
    description: str | None = None
    hipaa_compliant: bool = True


class TriageEmergencyEmbed(BaseModel):
    model_config = ConfigDict(extra="ignore")

    enabled: bool = True
    keywords: list[str] = Field(default_factory=list)
    response_override: str | None = None


class HumanHandoffEmbed(BaseModel):
    model_config = ConfigDict(extra="ignore")

    enabled: bool = True
    trigger_topics: list[str] = Field(default_factory=list)
    reception_contact: str | None = None
    handoff_message: str | None = None


class GuardrailsEmbed(BaseModel):
    model_config = ConfigDict(extra="ignore")

    verification_policy: VerificationPolicyEmbed | None = None
    phi_scrubbing: PhiScrubEmbed | None = None
    triage_emergency: TriageEmergencyEmbed | None = None
    human_handoff: HumanHandoffEmbed | None = None


class StateVariableEmbed(BaseModel):
    model_config = ConfigDict(extra="ignore")

    variable_key: str
    data_type: str | None = None
    description: str | None = None
    is_required: bool = True
    prompt_if_missing: str | None = None


class SubAgentEmbed(BaseModel):
    model_config = ConfigDict(extra="ignore")

    agent_id: str
    agent_type: str
    routing_trigger_description: str | None = None
    system_prompt: str | None = None
    allowed_tools: list[str] = Field(default_factory=list)
    required_state_variables: list[StateVariableEmbed] = Field(default_factory=list)


class UpiConfigEmbed(BaseModel):
    model_config = ConfigDict(extra="ignore")

    upi_id: str | None = None
    display_name: str | None = None
    qr_code_url: str | None = None
    accepted_apps: list[str] = Field(default_factory=list)


class PaymentGatewayEmbed(BaseModel):
    model_config = ConfigDict(extra="ignore")

    model: str | None = "pass_through"
    supported_processors: list[str] = Field(default_factory=lambda: ["upi_direct"])
    active_processor: str | None = "upi_direct"
    upi_config: UpiConfigEmbed | None = None
    confirmation_method: str | None = "utr_reference"
    refund_policy: str | None = "tenant_managed"


class IntegrationsEmbed(BaseModel):
    model_config = ConfigDict(extra="ignore")

    stripe: dict[str, object] = Field(default_factory=dict)
    payment_gateway: PaymentGatewayEmbed | None = None
    twilio: dict[str, object] = Field(default_factory=dict)


class SubscriptionEmbed(BaseModel):
    model_config = ConfigDict(extra="ignore")

    tier: str | None = "starter"
    tokens_used_this_month: int = 0


class AgentRuntimeConfig(Document):
    """
    Top-level document for a compiled Schedulux agent runtime configuration.
    One document per active agent per tenant.
    Indexed for runtime hot-path: tenant_id + status is the primary lookup.
    """

    model_config = ConfigDict(extra="ignore")

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


def canonicalize_agent_schema(data: dict[str, object], status: str = "draft") -> dict[str, object]:

    if not data:
        return {}

    clean_data = copy.deepcopy(data)
    clean_data["status"] = status
    if "tenant_id" not in clean_data:
        clean_data["tenant_id"] = ""
    if "agent_id" not in clean_data:
        clean_data["agent_id"] = ""

    if not clean_data.get("scheduling_engine"):
        clean_data["scheduling_engine"] = SchedulingEngineEmbed().model_dump()

    if not clean_data.get("operating_hours"):
        clean_data["operating_hours"] = OperatingHoursEmbed().model_dump()

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


class DraftCheckpointEmbed(BaseModel):
    model_config = ConfigDict(extra="ignore")

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
    role: str  # "agent" or "tenant"
    content: str
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
