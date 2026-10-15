"""
Schedulux Agent Runtime Config — MongoDB Model (Beanie Async ODM)

Industry-standard Python MongoDB models for agent_runtime_configs and agent_drafts.
Collections: agent_runtime_configs, agent_drafts
Database:   schedulux_ai (or configured via MONGO_URI)

Design decisions:
  - Beanie Document (native async Motor/PyMongo + Pydantic v2)
  - Pydantic BaseModel for all embedded structures
  - Indexes on tenant_id + status + agent_id for runtime hot-path queries
  - ConfigDict(extra="ignore") for seamless backwards/forwards schema compatibility
"""

from __future__ import annotations
import copy
import os
import urllib.parse
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Literal
from pydantic import BaseModel, ConfigDict, Field
from pymongo import AsyncMongoClient, IndexModel
from beanie import Document, init_beanie


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
    vertical: str = ""  # e.g. "medical", "auto", "hospitality", "custom"
    timezone: str = "UTC"
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
    default_lead_time_hours: int = 2
    max_advance_booking_days: int = 60
    cancellation_window_hours: int = 24
    hold_duration_minutes: int = 10


class BlackoutDateEmbed(BaseModel):
    model_config = ConfigDict(extra="ignore")

    date: str
    reason: str | None = None
    is_closed: bool = True


class OperatingHoursEmbed(BaseModel):
    model_config = ConfigDict(extra="ignore")

    monday: list[dict[str, Any]] = Field(default_factory=list)
    tuesday: list[dict[str, Any]] = Field(default_factory=list)
    wednesday: list[dict[str, Any]] = Field(default_factory=list)
    thursday: list[dict[str, Any]] = Field(default_factory=list)
    friday: list[dict[str, Any]] = Field(default_factory=list)
    saturday: list[dict[str, Any]] = Field(default_factory=list)
    sunday: list[dict[str, Any]] = Field(default_factory=list)
    blackout_dates: list[BlackoutDateEmbed] = Field(default_factory=list)


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


class ServiceAllocationModel(str, Enum):
    SINGLE_RESOURCE = "single_resource"
    MULTI_RESOURCE = "multi_resource"
    POOLED = "pooled"
    ASSET_ONLY = "asset_only"


class BookingMode(str, Enum):
    TIME_SLOT = "time_slot"
    DATE_RANGE = "date_range"


class PriceType(str, Enum):
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
    custom_shift_overrides: dict[str, Any] = Field(default_factory=dict)


class PriceEmbed(BaseModel):
    model_config = ConfigDict(extra="ignore")

    type: PriceType = PriceType.FIXED
    amount: float = 0.0
    currency: str = "USD"


class DepositEmbed(BaseModel):
    model_config = ConfigDict(extra="ignore")

    required: bool = False
    amount: float = 0.0
    processor: str = ""
    upi_id: str = ""
    qr_code_url: str = ""
    confirmation_method: str = "automatic"
    payment_instructions: str = ""


class ServiceEmbed(BaseModel):
    model_config = ConfigDict(extra="ignore")

    service_id: str
    name: str
    category: str = "General"
    description: str = ""
    duration_minutes: int = 30
    buffer_minutes: int = 0
    allocation_model: ServiceAllocationModel = ServiceAllocationModel.SINGLE_RESOURCE
    booking_mode: BookingMode = BookingMode.TIME_SLOT
    price: PriceEmbed = Field(default_factory=PriceEmbed)
    deposit: DepositEmbed = Field(default_factory=DepositEmbed)
    eligible_resource_ids: list[str] = Field(default_factory=list)
    required_asset_ids: list[str] = Field(default_factory=list)
    recall_interval_days: int = 0


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

    model: str | None = None
    supported_processors: list[str] = Field(default_factory=list)
    active_processor: str | None = None
    upi_config: UpiConfigEmbed | None = None
    confirmation_method: str | None = None
    refund_policy: str | None = None


class IntegrationsEmbed(BaseModel):
    model_config = ConfigDict(extra="ignore")

    stripe: dict[str, Any] = Field(default_factory=dict)
    payment_gateway: PaymentGatewayEmbed | None = None
    twilio: dict[str, Any] = Field(default_factory=dict)


class ComplianceEmbed(BaseModel):
    model_config = ConfigDict(extra="ignore")

    hipaa_mode: bool = False
    phi_scrubbing: bool = False
    data_retention_policy: str | None = None
    zero_hallucination_mode: bool = True
    audit_trail_enabled: bool = True


class SubscriptionEmbed(BaseModel):
    model_config = ConfigDict(extra="ignore")

    tier: str | None = "starter"
    tokens_used_this_month: int = 0


class RuntimeMetaEmbed(BaseModel):
    model_config = ConfigDict(extra="ignore")

    template_id: str | None = None
    template_name: str | None = None
    agent_version: str | None = None
    last_published_at: datetime | None = None
    last_compiled_by: str | None = None
    compiler_mode: str | None = None
    deterministic_conflict_check: bool = True
    live_preview_lag_ms: int = 0
    inferred_fields: list[str] = Field(default_factory=list)


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
    compliance: ComplianceEmbed | None = None
    subscription: SubscriptionEmbed | None = None

    runtime_meta: RuntimeMetaEmbed | None = None

    class Settings:
        name = "agent_runtime_configs"
        indexes = [
            IndexModel([("tenant_id", 1), ("status", 1)], name="idx_tenant_status"),
            IndexModel([("agent_id", 1)], unique=True, sparse=True, name="idx_agent_id"),
            IndexModel([("tenant_id", 1), ("status", 1), ("compiled_at", -1)], name="idx_tenant_latest"),
        ]


class DraftCheckpointEmbed(BaseModel):
    model_config = ConfigDict(extra="ignore")

    checkpoint_id: str
    message_id: str
    user_prompt: str | None = ""
    summary: str | None = ""
    draft_snapshot: dict[str, Any] = Field(default_factory=dict)
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

    current_draft: dict[str, Any] = Field(default_factory=dict)
    active_message_id: str | None = None

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
        draft_snapshot: dict[str, Any],
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


_client: AsyncMongoClient | None = None
_db_initialized = False


async def init_db(mongo_uri: str | None = None):
    """
    Initializes Beanie connection with PyMongo AsyncMongoClient.
    Idempotent: safe to call multiple times.
    """
    global _client, _db_initialized
    if _db_initialized:
        return
    if mongo_uri is None:
        mongo_uri = os.environ.get("MONGO_URI", "mongodb://localhost:27017/schedulux_ai")

    parsed = urllib.parse.urlparse(mongo_uri)
    db_name = parsed.path.lstrip('/') if parsed.path else ""
    if not db_name or "?" in db_name:
        db_name = db_name.split("?")[0] if db_name else ""
    if not db_name:
        db_name = "schedulux_ai"

    _client = AsyncMongoClient(mongo_uri)
    db = _client[db_name]
    await init_beanie(
        database=db,
        document_models=[AgentDraft, AgentRuntimeConfig],
    )
    _db_initialized = True
