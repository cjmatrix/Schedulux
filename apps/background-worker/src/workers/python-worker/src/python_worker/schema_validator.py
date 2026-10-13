from enum import Enum
from typing import Optional, Any
import copy
from pydantic import BaseModel, ConfigDict, ValidationError

class AllocationModel(str, Enum):
    TIME_SLOT = "time_slot"
    DATE_RANGE = "date_range"

class StrictContactSchema(BaseModel):
    model_config = ConfigDict(extra="ignore")
    support_email: Optional[str] = None
    public_phone: Optional[str] = None
    escalation_phone: Optional[str] = None

class StrictTerminologySchema(BaseModel):
    model_config = ConfigDict(extra="ignore")
    customer_singular: Optional[str] = None
    customer_plural: Optional[str] = None
    primary_metric: Optional[str] = None
    action_metric: Optional[str] = None

class StrictBrandSchema(BaseModel):
    model_config = ConfigDict(extra="ignore")
    primary_color: Optional[str] = None
    logo_url: Optional[str] = None

class StrictBusinessProfileSchema(BaseModel):
    model_config = ConfigDict(extra="ignore")
    name: Optional[str] = None
    vertical: Optional[str] = None
    timezone: Optional[str] = None
    locale: Optional[str] = None
    currency: Optional[str] = None
    address: Optional[str] = None
    contact: Optional[StrictContactSchema] = None
    terminology: Optional[StrictTerminologySchema] = None
    brand: Optional[StrictBrandSchema] = None

class StrictPriceSchema(BaseModel):
    model_config = ConfigDict(extra="ignore")
    type: Optional[str] = None
    amount: Optional[float] = None
    currency: Optional[str] = None

class StrictDepositSchema(BaseModel):
    model_config = ConfigDict(extra="ignore")
    required: Optional[bool] = None
    amount: Optional[float] = None
    processor: Optional[str] = None
    upi_id: Optional[str] = None
    qr_code_url: Optional[str] = None
    confirmation_method: Optional[str] = None
    payment_instructions: Optional[str] = None

class StrictServiceSchema(BaseModel):
    model_config = ConfigDict(extra="ignore")
    service_id: Optional[str] = None
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    duration_minutes: Optional[int] = None
    buffer_minutes: Optional[int] = None
    allocation_model: Optional[AllocationModel] = None
    price: Optional[StrictPriceSchema] = None
    deposit: Optional[StrictDepositSchema] = None
    eligible_resource_ids: Optional[list[str]] = None
    required_asset_ids: Optional[list[str]] = None
    recall_interval_days: Optional[int] = None

class StrictResourceSchema(BaseModel):
    model_config = ConfigDict(extra="ignore")
    resource_id: Optional[str] = None
    resource_type: Optional[str] = None
    name: Optional[str] = None
    title: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    is_bookable: Optional[bool] = None
    dispatch_status: Optional[str] = None
    custom_shift_overrides: Optional[dict] = None

class StrictTimeSlotSchema(BaseModel):
    model_config = ConfigDict(extra="ignore")
    start: Optional[str] = None
    end: Optional[str] = None

class StrictBlackoutDateSchema(BaseModel):
    model_config = ConfigDict(extra="ignore")
    date: Optional[str] = None
    reason: Optional[str] = None
    is_closed: Optional[bool] = None

class StrictOperatingHoursSchema(BaseModel):
    model_config = ConfigDict(extra="ignore")
    monday: Optional[list[StrictTimeSlotSchema]] = None
    tuesday: Optional[list[StrictTimeSlotSchema]] = None
    wednesday: Optional[list[StrictTimeSlotSchema]] = None
    thursday: Optional[list[StrictTimeSlotSchema]] = None
    friday: Optional[list[StrictTimeSlotSchema]] = None
    saturday: Optional[list[StrictTimeSlotSchema]] = None
    sunday: Optional[list[StrictTimeSlotSchema]] = None
    blackout_dates: Optional[list[StrictBlackoutDateSchema]] = None

class StrictSchedulingEngineSchema(BaseModel):
    model_config = ConfigDict(extra="ignore")
    allocation_model: Optional[AllocationModel] = None
    default_lead_time_hours: Optional[int] = None
    max_advance_booking_days: Optional[int] = None
    cancellation_window_hours: Optional[int] = None

class StrictWidgetConfigSchema(BaseModel):
    model_config = ConfigDict(extra="ignore")
    agent_name: Optional[str] = None
    avatar_url: Optional[str] = None
    initial_greeting: Optional[str] = None
    fallback_message: Optional[str] = None
    position: Optional[str] = None
    launcher_style: Optional[str] = None
    sound_on_load: Optional[bool] = None
    auto_expand_delay_seconds: Optional[int] = None
    platform_sources: Optional[list[str]] = None
    whitelisted_domains: Optional[list[str]] = None

class StrictComplianceSchema(BaseModel):
    model_config = ConfigDict(extra="ignore")
    hipaa_mode: Optional[bool] = None
    phi_scrubbing: Optional[bool] = None
    data_retention_policy: Optional[str] = None
    zero_hallucination_mode: Optional[bool] = None
    audit_trail_enabled: Optional[bool] = None

class StrictPhiScrubSchema(BaseModel):
    model_config = ConfigDict(extra="ignore")
    enabled: Optional[bool] = None
    policy: Optional[str] = None
    description: Optional[str] = None
    hipaa_compliant: Optional[bool] = None

class StrictTriageEmergencySchema(BaseModel):
    model_config = ConfigDict(extra="ignore")
    enabled: Optional[bool] = None
    rule_id: Optional[str] = None
    trigger_type: Optional[str] = None
    keywords: Optional[list[str]] = None
    action: Optional[str] = None
    agent_locked_on_trigger: Optional[bool] = None
    response_override: Optional[str] = None
    notify_front_desk: Optional[bool] = None
    front_desk_contact: Optional[str] = None

class StrictHumanHandoffSchema(BaseModel):
    model_config = ConfigDict(extra="ignore")
    enabled: Optional[bool] = None
    trigger_topics: Optional[list[str]] = None
    action: Optional[str] = None
    target_action: Optional[str] = None
    reception_contact: Optional[str] = None
    lock_agent_on_handoff: Optional[bool] = None
    handoff_message: Optional[str] = None

class StrictOffHoursPolicySchema(BaseModel):
    model_config = ConfigDict(extra="ignore")
    action: Optional[str] = None
    response: Optional[str] = None

class StrictNoDiagnosisPolicySchema(BaseModel):
    model_config = ConfigDict(extra="ignore")
    enabled: Optional[bool] = None
    response_override: Optional[str] = None

class StrictGuardrailsSchema(BaseModel):
    model_config = ConfigDict(extra="ignore")
    phi_scrubbing: Optional[StrictPhiScrubSchema] = None
    triage_emergency: Optional[StrictTriageEmergencySchema] = None
    human_handoff: Optional[StrictHumanHandoffSchema] = None
    off_hours_policy: Optional[StrictOffHoursPolicySchema] = None
    no_diagnosis_policy: Optional[StrictNoDiagnosisPolicySchema] = None

class StrictDraftPatchValidator(BaseModel):
    """
    Pydantic schema validator mirroring AI-orchestration's StrictDraftPatchValidator.
    Ensures crawl-generated schemas strictly conform to the booking engine contract.
    """
    model_config = ConfigDict(extra="ignore")
    business_profile: Optional[StrictBusinessProfileSchema] = None
    services: Optional[list[StrictServiceSchema]] = None
    resources: Optional[list[StrictResourceSchema]] = None
    operating_hours: Optional[StrictOperatingHoursSchema] = None
    scheduling_engine: Optional[StrictSchedulingEngineSchema] = None
    widget_config: Optional[StrictWidgetConfigSchema] = None
    compliance: Optional[StrictComplianceSchema] = None
    guardrails: Optional[StrictGuardrailsSchema] = None
    supervisor_prompt: Optional[str] = None
    runtime_meta: Optional[dict] = None


class StrictRuntimeMetaSchema(BaseModel):
    model_config = ConfigDict(extra="ignore")
    template_id: Optional[str] = "tpl_standard_v2"
    compiler_mode: Optional[str] = "deterministic_strict"
    inferred_fields: Optional[list[str]] = None
    validation_status: Optional[str] = "valid"
    validation_errors: Optional[list[str]] = None


class GeneratedAgentDraftSchema(BaseModel):
    """
    Structured output schema for LangChain's with_structured_output().
    Constrains Gemini to generate strictly typed Schedulux agent configurations.
    """
    model_config = ConfigDict(extra="ignore")
    business_profile: Optional[StrictBusinessProfileSchema] = None
    operating_hours: Optional[StrictOperatingHoursSchema] = None
    services: Optional[list[StrictServiceSchema]] = None
    resources: Optional[list[StrictResourceSchema]] = None
    runtime_meta: Optional[StrictRuntimeMetaSchema] = None


def validate_and_sanitize_schema(schema: dict) -> tuple[dict, bool, list[str]]:
    """
    Validates and cleans the generated draft schema using StrictDraftPatchValidator.
    
    Returns:
        (sanitized_schema, is_valid, error_messages)
    """
    if not isinstance(schema, dict):
        return {}, False, ["Schema payload is not a valid JSON dictionary"]

    if "error" in schema and len(schema) == 1:
        return schema, False, [str(schema.get("error"))]

    try:
        validated = StrictDraftPatchValidator.model_validate(schema)
        
        # Create cleaned clone preserving top-level fields
        cleaned = copy.deepcopy(schema)
        
        if validated.business_profile:
            cleaned["business_profile"] = validated.business_profile.model_dump(mode="json", exclude_none=True)
        if validated.services is not None:
            cleaned["services"] = [s.model_dump(mode="json", exclude_none=True) for s in validated.services]
        if validated.resources is not None:
            cleaned["resources"] = [r.model_dump(mode="json", exclude_none=True) for r in validated.resources]
        if validated.operating_hours:
            cleaned["operating_hours"] = validated.operating_hours.model_dump(mode="json", exclude_none=True)
            
        return cleaned, True, []
    except ValidationError as ve:
        errors = [f"{'.'.join(str(loc) for loc in err['loc'])}: {err['msg']}" for err in ve.errors()]
        return schema, False, errors
    except Exception as e:
        return schema, False, [str(e)]
