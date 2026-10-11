"""
Schedulux Agent Runtime Config — MongoDB Model (mongoengine ODM)

Industry-standard Python MongoDB model for the agent_runtime_config document.
Collection: agent_runtime_configs
Database:   schedulux_ai (or configured via MONGO_URI)

Design decisions:
  - EmbeddedDocuments for all nested objects (single-document reads, no joins)
  - DictField used for flexible sub-structures (operating_hours by day, custom_shift_overrides)
  - StringField enums with choices enforced at ODM level
  - Indexes on tenant_id + status + agent_id for runtime hot-path queries
  - meta.allow_inheritance = False on all embeds to keep bson lean
"""

from __future__ import annotations
from datetime import datetime
from mongoengine import (
    Document,
    EmbeddedDocument,
    StringField,
    IntField,
    FloatField,
    BooleanField,
    DateTimeField,
    ListField,
    DictField,
    EmbeddedDocumentField,
    EmbeddedDocumentListField,
)



class ContactEmbed(EmbeddedDocument):
    meta = {"allow_inheritance": False}

    support_email      = StringField()
    public_phone       = StringField()
    escalation_phone   = StringField()


class TerminologyEmbed(EmbeddedDocument):
    meta = {"allow_inheritance": False}

    customer_singular = StringField()
    customer_plural   = StringField()
    primary_metric    = StringField()
    action_metric     = StringField()


class BrandEmbed(EmbeddedDocument):
    meta = {"allow_inheritance": False}

    primary_color = StringField()
    logo_url      = StringField()


class BusinessProfileEmbed(EmbeddedDocument):
    meta = {"allow_inheritance": False}

    name        = StringField(required=True)
    vertical    = StringField(required=True)  # e.g. "medical_dental", "lodging"
    timezone    = StringField(required=True)
    locale      = StringField()
    currency    = StringField()
    address     = StringField()
    contact     = EmbeddedDocumentField(ContactEmbed)
    terminology = EmbeddedDocumentField(TerminologyEmbed)
    brand       = EmbeddedDocumentField(BrandEmbed)




class WidgetConfigEmbed(EmbeddedDocument):
    meta = {"allow_inheritance": False}

    agent_name              = StringField()
    avatar_url              = StringField()
    initial_greeting        = StringField()
    fallback_message        = StringField()
    position                = StringField(choices=["left", "right"])
    launcher_style          = StringField()
    sound_on_load           = BooleanField(default=False)
    auto_expand_delay_seconds = IntField()
    platform_sources        = ListField(StringField())
    whitelisted_domains     = ListField(StringField())




class LlmEngineEmbed(EmbeddedDocument):
    meta = {"allow_inheritance": False}

    studio_model               = StringField()
    chat_model                 = StringField()
    chat_fallback_model        = StringField()
    fallback_trigger_latency_ms = IntField()
    temperature                = FloatField(default=0.1)
    schema_validation          = StringField(choices=["strict", "lenient"])
    semantic_caching           = BooleanField(default=True)
    streaming                  = StringField()
    prompt_compiler_token_limit = IntField()



class KnowledgeAssetEmbed(EmbeddedDocument):
    meta = {"allow_inheritance": False}

    asset_id      = StringField(required=True)
    title         = StringField()
    asset_type    = StringField(choices=["pdf", "docx", "web_crawler", "text", "csv"])
    source_uri    = StringField()
    sync_status   = StringField(choices=["synced", "pending", "failed"])
    last_synced_at = DateTimeField()


class KnowledgeBaseEmbed(EmbeddedDocument):
    meta = {"allow_inheritance": False}

    namespace          = StringField()
    qdrant_collection  = StringField()
    sources            = EmbeddedDocumentListField(KnowledgeAssetEmbed)




class SchedulingEngineEmbed(EmbeddedDocument):
    meta = {"allow_inheritance": False}

    allocation_model         = StringField(choices=["time_slot", "date_range"], default="time_slot")
    default_lead_time_hours  = IntField(default=2)
    max_advance_booking_days = IntField(default=60)
    cancellation_window_hours = IntField(default=24)
    hold_duration_minutes    = IntField(default=10)
   



class BlackoutDateEmbed(EmbeddedDocument):
    meta = {"allow_inheritance": False}

    date      = StringField(required=True)   # ISO date "YYYY-MM-DD"
    reason    = StringField()
    is_closed = BooleanField(default=True)


class OperatingHoursEmbed(EmbeddedDocument):
    meta = {"allow_inheritance": False}

   
    monday    = ListField(DictField())
    tuesday   = ListField(DictField())
    wednesday = ListField(DictField())
    thursday  = ListField(DictField())
    friday    = ListField(DictField())
    saturday  = ListField(DictField())
    sunday    = ListField(DictField())
    blackout_dates = EmbeddedDocumentListField(BlackoutDateEmbed)




class ResourceEmbed(EmbeddedDocument):
    meta = {"allow_inheritance": False}

    resource_id            = StringField(required=True)
    resource_type          = StringField(required=True, choices=["staff", "physical_asset"])
    name                   = StringField(required=True)
    title                  = StringField()
    category               = StringField()
    description            = StringField()
    is_bookable            = BooleanField(default=True)
    dispatch_status        = StringField(choices=["active", "inactive", "on_leave"], default="active")
    # custom_shift_overrides: day-name → list of {start, end} dicts (same structure as OperatingHoursEmbed)
    custom_shift_overrides = DictField()


# ─────────────────────────────────────────────────────────────────────────────
# SERVICES
# ─────────────────────────────────────────────────────────────────────────────

class PriceEmbed(EmbeddedDocument):
    meta = {"allow_inheritance": False}

    type     = StringField(choices=["fixed", "variable", "free"], default="fixed")
    amount   = FloatField(default=0.0)
    currency = StringField(default="USD")


class DepositEmbed(EmbeddedDocument):
    meta = {"allow_inheritance": False}

    required               = BooleanField(default=False)
    amount                 = FloatField(default=0.0)
    processor              = StringField(choices=["upi_direct", "stripe", "bank_transfer", "cash_on_arrival"])
    upi_id                 = StringField()
    qr_code_url            = StringField()
    confirmation_method    = StringField()
    payment_instructions   = StringField()


class ServiceEmbed(EmbeddedDocument):
    meta = {"allow_inheritance": False}

    service_id            = StringField(required=True)
    name                  = StringField(required=True)
    category              = StringField()
    description           = StringField()
    duration_minutes      = IntField(required=True)  
    buffer_minutes        = IntField(default=0)       
    allocation_model      = StringField(choices=["time_slot", "date_range"], default="time_slot")
    price                 = EmbeddedDocumentField(PriceEmbed)
    deposit               = EmbeddedDocumentField(DepositEmbed)
    eligible_resource_ids = ListField(StringField())
    required_asset_ids    = ListField(StringField())
    recall_interval_days  = IntField()  




class VerificationPolicyEmbed(EmbeddedDocument):
    meta = {"allow_inheritance": False}

    require_otp_for_new_booking    = BooleanField(default=False)
    require_otp_for_reschedule     = BooleanField(default=True)
    require_otp_for_cancel         = BooleanField(default=True)
    require_otp_for_history_access = BooleanField(default=True)
    otp_delivery_channel           = StringField(choices=["sms", "email", "whatsapp"])
    otp_expiry_seconds             = IntField(default=300)


class PatientFieldEmbed(EmbeddedDocument):
    meta = {"allow_inheritance": False}

    field_name       = StringField(required=True)
    data_type        = StringField(choices=["string", "phone", "email", "date", "number", "boolean"])
    is_required      = BooleanField(default=True)
    prompt_if_missing = StringField()






class PhiScrubEmbed(EmbeddedDocument):
    meta = {"allow_inheritance": False}
    enabled        = BooleanField(default=True)
    policy         = StringField(choices=["zero_retention", "anonymize"])
    description    = StringField()
    hipaa_compliant = BooleanField(default=True)


class TriageEmergencyEmbed(EmbeddedDocument):
    meta = {"allow_inheritance": False}
    enabled               = BooleanField(default=True)
    rule_id               = StringField()
    trigger_type          = StringField()
    keywords              = ListField(StringField())
    action                = StringField()
    agent_locked_on_trigger = BooleanField(default=True)
    response_override     = StringField()
    notify_front_desk     = BooleanField(default=True)
    front_desk_contact    = StringField()


class HumanHandoffEmbed(EmbeddedDocument):
    meta = {"allow_inheritance": False}
    enabled              = BooleanField(default=True)
    trigger_topics       = ListField(StringField())
    action               = StringField()
    target_action        = StringField()
    reception_contact    = StringField()
    lock_agent_on_handoff = BooleanField(default=True)
    handoff_message      = StringField()


class OffHoursPolicyEmbed(EmbeddedDocument):
    meta = {"allow_inheritance": False}
    action   = StringField()
    response = StringField()


class NoDiagnosisPolicyEmbed(EmbeddedDocument):
    meta = {"allow_inheritance": False}
    enabled           = BooleanField(default=True)
    response_override = StringField()


class GuardrailsEmbed(EmbeddedDocument):
    meta = {"allow_inheritance": False}
    phi_scrubbing          = EmbeddedDocumentField(PhiScrubEmbed)
    triage_emergency       = EmbeddedDocumentField(TriageEmergencyEmbed)
    human_handoff          = EmbeddedDocumentField(HumanHandoffEmbed)
    off_hours_policy       = EmbeddedDocumentField(OffHoursPolicyEmbed)
    no_diagnosis_policy    = EmbeddedDocumentField(NoDiagnosisPolicyEmbed)




class StateVariableEmbed(EmbeddedDocument):
    meta = {"allow_inheritance": False}
    variable_key      = StringField(required=True)
    data_type         = StringField(choices=["string", "phone", "email", "date", "time", "number", "boolean"])
    description       = StringField()
    is_required       = BooleanField(default=True)
    prompt_if_missing = StringField()


class SubAgentEmbed(EmbeddedDocument):
    meta = {"allow_inheritance": False}
    agent_id                      = StringField(required=True)
    agent_type                    = StringField(
        required=True,
        choices=["booking", "faq_rag", "payment", "recall_outbound", "custom"]
    )
    routing_trigger_description   = StringField()
    system_prompt                 = StringField()
    allowed_tools                 = ListField(StringField())
    required_state_variables      = EmbeddedDocumentListField(StateVariableEmbed)




class UpiConfigEmbed(EmbeddedDocument):
    meta = {"allow_inheritance": False}
    upi_id        = StringField()
    display_name  = StringField()
    qr_code_url   = StringField()
    accepted_apps = ListField(StringField())


class PaymentGatewayEmbed(EmbeddedDocument):
    meta = {"allow_inheritance": False}
    model                = StringField(choices=["pass_through", "platform_managed"])
    supported_processors = ListField(StringField())
    active_processor     = StringField()
    upi_config           = EmbeddedDocumentField(UpiConfigEmbed)
    confirmation_method  = StringField()
    refund_policy        = StringField()


class IntegrationsEmbed(EmbeddedDocument):
    meta = {"allow_inheritance": False}
    # Stripe / Twilio stored as flexible dicts since their shape varies by tier
    stripe          = DictField()
    payment_gateway = EmbeddedDocumentField(PaymentGatewayEmbed)
    twilio          = DictField()




class ComplianceEmbed(EmbeddedDocument):
    meta = {"allow_inheritance": False}
    hipaa_mode             = BooleanField(default=False)
    phi_scrubbing          = BooleanField(default=False)
    data_retention_policy  = StringField(choices=["session_only", "30_days", "1_year", "indefinite"])
    zero_hallucination_mode = BooleanField(default=True)
    audit_trail_enabled    = BooleanField(default=True)




class SubscriptionEmbed(EmbeddedDocument):
    meta = {"allow_inheritance": False}
    tier                       = StringField(choices=["starter", "pro", "enterprise"])
    tokens_used_this_month     = IntField(default=0)
   



class RuntimeMetaEmbed(EmbeddedDocument):
    meta = {"allow_inheritance": False}
    template_id                 = StringField()
    template_name               = StringField()
    agent_version               = StringField()
    last_published_at           = DateTimeField()
    last_compiled_by            = StringField()
    compiler_mode               = StringField(choices=["deterministic_strict", "permissive", "mock"])
    deterministic_conflict_check = BooleanField(default=True)
    live_preview_lag_ms         = IntField(default=0)
    inferred_fields             = ListField(StringField())  # fields AI-inferred during schema gen



class AgentRuntimeConfig(Document):
    """
    Top-level document for a compiled Schedulux agent runtime configuration.

    One document per active agent per tenant.
    Indexed for runtime hot-path: tenant_id + status is the primary lookup.
    """

    meta = {
        "collection": "agent_runtime_configs",
        "allow_inheritance": False,
        "indexes": [
            {"fields": ["tenant_id", "status"], "name": "idx_tenant_status"},
            {"fields": ["agent_id"], "name": "idx_agent_id", "unique": True, "sparse": True},
            {"fields": ["tenant_id", "status", "-compiled_at"], "name": "idx_tenant_latest"},
        ],
    }

    # ── Identity ──────────────────────────────────────────────────────────
    schema_version  = StringField(default="2.4")
    status          = StringField(
        required=True,
        choices=["draft", "live", "archived", "paused"],
        default="draft",
    )
    tenant_id       = StringField(required=True, db_field="tenant_id")
    agent_id        = StringField()

    # ── Compiler metadata ─────────────────────────────────────────────────
    compiled_at        = DateTimeField(default=datetime.utcnow)
    compiler_latency_ms = IntField()
    compiler_hash      = StringField()

    # ── Core configuration blocks ─────────────────────────────────────────
    business_profile    = EmbeddedDocumentField(BusinessProfileEmbed, required=True)
    widget_config       = EmbeddedDocumentField(WidgetConfigEmbed)
    llm_engine          = EmbeddedDocumentField(LlmEngineEmbed)
    supervisor_prompt   = StringField()
    knowledge_base      = EmbeddedDocumentField(KnowledgeBaseEmbed)
    scheduling_engine   = EmbeddedDocumentField(SchedulingEngineEmbed)
    operating_hours     = EmbeddedDocumentField(OperatingHoursEmbed)

    # ── Resources, services ───────────────────────────────────────────────
    resources  = EmbeddedDocumentListField(ResourceEmbed)
    services   = EmbeddedDocumentListField(ServiceEmbed)

    # ── Behaviour rules ───────────────────────────────────────────────────

    guardrails    = EmbeddedDocumentField(GuardrailsEmbed)

    # ── Agent routing ─────────────────────────────────────────────────────
    sub_agents = EmbeddedDocumentListField(SubAgentEmbed)

    # ── Platform configs ──────────────────────────────────────────────────
    integrations = EmbeddedDocumentField(IntegrationsEmbed)
    compliance   = EmbeddedDocumentField(ComplianceEmbed)
    subscription = EmbeddedDocumentField(SubscriptionEmbed)

    # ── Runtime / compile metadata ────────────────────────────────────────
    runtime_meta = EmbeddedDocumentField(RuntimeMetaEmbed)
