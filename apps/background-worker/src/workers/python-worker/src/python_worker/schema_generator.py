import os
import json
from pydantic import BaseModel
from langchain_core.prompts import PromptTemplate
from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv
from python_worker.queues import get_redis_client
from python_worker.schema_validator import (
    GeneratedAgentDraftSchema,
    StrictDraftPatchValidator,
    validate_and_sanitize_schema,
)

try:
    from langchain_groq import ChatGroq
except ImportError:
    ChatGroq = None

current_dir = os.path.dirname(__file__)
for env_path in [
    os.path.abspath(os.path.join(current_dir, '../../../../..', '.env')),
    os.path.abspath(os.path.join(current_dir, '../../../../../../', '.env')),
]:
    if os.path.exists(env_path):
        load_dotenv(env_path)

async def generate_agent_schema(crawled_data: dict, tenant_id: str, url: str) -> dict:
    """
    Generates a Schedulux agent_runtime_config JSON payload using LangChain with_structured_output.
    Prefers Groq (openai/gpt-oss-120b) for ultra-fast structured synthesis, falling back to Gemini.
    """
    groq_api_key = os.environ.get("GROQ_API_KEY")
    gemini_api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")

    if not groq_api_key and not gemini_api_key:
        print("[Schema Generator] Neither GROQ_API_KEY nor GEMINI_API_KEY found in environment. Returning fallback mockup schema.")
        return {
            "schema_ref": "https://schedulux.ai/schema/v2/agent_runtime_config.json",
            "schema_version": "2.4",
            "status": "draft",
            "tenant_id": tenant_id,
            "agent_id": f"agent_{tenant_id}_v1",
            "business_profile": {
                "name": "Auto-detected Business",
                "vertical": "medical_dental",
                "timezone": "America/New_York",
                "locale": "en-US",
                "currency": "USD",
                "address": "Extracted from " + url,
                "contact": {
                    "support_email": None,
                    "public_phone": None
                }
            },
            "operating_hours": {
                "monday": [{"start": "08:00", "end": "17:00"}],
                "tuesday": [{"start": "08:00", "end": "17:00"}],
                "wednesday": [{"start": "08:00", "end": "17:00"}],
                "thursday": [{"start": "08:00", "end": "17:00"}],
                "friday": [{"start": "08:00", "end": "17:00"}],
                "saturday": [],
                "sunday": []
            },
            "services": [
                {
                    "service_id": "srv_consultation",
                    "name": "Initial Consultation",
                    "category": "General",
                    "description": "Initial consultation and evaluation",
                    "duration_minutes": 30,
                    "buffer_minutes": 0,
                    "booking_mode": "time_slot",
                    "price": {"type": "fixed", "amount": 100.0, "currency": "USD"},
                    "deposit": {
                        "required": False,
                        "amount": 0.0,
                        "processor": "upi_direct",
                        "upi_id": "",
                        "qr_code_url": "",
                        "confirmation_method": "utr_reference",
                        "payment_instructions": ""
                    },
                    "verification": {
                        "require_otp": False
                    },
                    "resource_requirements": [
                        {
                            "role": "Provider",
                            "resource_type": "staff",
                            "count": 1,
                            "eligible_resource_ids": ["res_staff_default"],
                            "selection_mode": "user_selectable"
                        }
                    ],
                    "recall_interval_days": 0
                }
            ],
            "scheduling_engine": {
                "booking_mode": "time_slot",
                "default_booking_mode": "time_slot",
                "default_lead_time_hours": 2,
                "max_advance_booking_days": 60,
                "cancellation_window_hours": 24,
                "hold_duration_minutes": 10
            },
            "guardrails": {
                "verification_policy": {
                    "require_otp_for_new_booking": False,
                    "require_otp_for_reschedule": True,
                    "require_otp_for_cancel": True
                }
            },
            "resources": [
                {
                    "resource_id": "res_staff_default",
                    "resource_type": "staff",
                    "name": "Primary Provider",
                    "title": "Specialist",
                    "category": "General",
                    "description": "Primary staff provider",
                    "is_bookable": True,
                    "dispatch_status": "active",
                    "custom_shift_overrides": {}
                }
            ],
            "runtime_meta": {
                "template_id": "tpl_medical_dental_v2",
                "compiler_mode": "mock",
                "inferred_fields": ["operating_hours", "services", "resources"]
            }
        }

    if groq_api_key:
        groq_model = os.environ.get("GROQ_MODEL") or "openai/gpt-oss-120b"
        if ChatGroq is not None:
            print(f"[Schema Generator] Initializing ChatGroq with model '{groq_model}'.", flush=True)
            llm = ChatGroq(
                model_name=groq_model,
                groq_api_key=groq_api_key,
                temperature=0,
            )
        else:
            print(f"[Schema Generator] Initializing ChatOpenAI (Groq endpoint) with model '{groq_model}'.", flush=True)
            llm = ChatOpenAI(
                model=groq_model,
                api_key=groq_api_key,
                base_url="https://api.groq.com/openai/v1",
                temperature=0,
            )
    else:
        model_name = os.environ.get("GEMINI_MODEL") or "gemini-3.8-flash"
        if "gemma" in model_name.lower():
            model_name = "gemini-3.6-flash"
        print(f"[Schema Generator] Initializing ChatGoogleGenerativeAI with model '{model_name}'.", flush=True)
        llm = ChatGoogleGenerativeAI(
            model=model_name,
            google_api_key=gemini_api_key,
            temperature=0,
        )

    prompt = PromptTemplate(
        template="""You are an expert AI system architect for Schedulux AI.
Your task is to extract and generate a comprehensive AI booking agent configuration from website crawl data for tenant: {tenant_id} (website URL: {url}).

CRITICAL DOMAIN INSTRUCTIONS:
1. SERVICES BOOKING MODE & ATTRIBUTES:
   - For every service, specify the time dimension (booking_mode):
     * "booking_mode": MUST be "time_slot" for services booked at clock hours/minutes (e.g. consultations, appointments, dental/medical procedures) or "date_range" for services booked over days/dates (e.g. hotel stays, car/equipment rentals). Default: "time_slot".
   - For every service, include:
     * "service_id": Unique identifier string (e.g. srv_consultation)
     * "name": Name of the service
     * "category": Category (default 'General')
     * "description": Detailed description
     * "duration_minutes": Duration in minutes (must be >= 1, default 30)
     * "buffer_minutes": Post-service buffer time in minutes (default 0)
     * "booking_mode": "time_slot" or "date_range"
     * "price": {{"type": "fixed"|"starting_at"|"hourly"|"free"|"custom", "amount": float, "currency": "USD"}}
     * "deposit": {{"required": bool, "amount": float, "processor": "upi_direct", "upi_id": str, "qr_code_url": str, "confirmation_method": "utr_reference", "payment_instructions": str}} (Schedulux only supports direct UPI deposits via upi_id or qr_code_url)
     * "verification": {{"require_otp": bool|null}} (Optional per-service OTP verification override: true for high-value/sensitive/exclusive services or date-range stays with deposits; false for low-friction/routine services; null to inherit global verification policy)
     * "resource_requirements": list of required resource specs, e.g. [{{"role": "Provider", "resource_type": "staff", "count": 1, "eligible_resource_ids": ["res_..."], "selection_mode": "user_selectable"|"auto_assign"}}] (use "user_selectable" for human specialists/practitioners or bookable hotel/meeting rooms; "auto_assign" for internal facility chairs, operation bays, equipment, or assets that the system assigns automatically)
     * "recall_interval_days": days until next recall/follow-up (default 0)

2. RESOURCES ATTRIBUTES & ENUMS:
   - Identify practitioners, staff, rooms, chairs, bays, equipment, or vehicles:
     * "resource_id": Unique identifier string (e.g. res_dr_smith)
     * "resource_type": MUST be one of: "staff", "room", "chair", "bay", "equipment", "asset", "vehicle" (default: "staff")
     * "name": Full name or label
     * "title": Title or role (e.g. "Senior Specialist")
     * "category": Category (default 'General')
     * "description": Description
     * "is_bookable": bool (default true)
     * "dispatch_status": MUST be one of: "active", "on_leave", "maintenance", "retired", "inactive" (default: "active")
     * "custom_shift_overrides": dict (default empty object)
   - Ensure every service in services[] defines resource_requirements pointing to these resources.

3. SCHEDULING ENGINE & GUARDRAILS:
   - Set scheduling_engine.booking_mode and scheduling_engine.default_booking_mode to "time_slot" for slot-based appointments (clinics, salons, etc.) or "date_range" for multi-day bookings (rentals, hotels). Individual services in services[] can override this with their own "booking_mode".
   - Include default_lead_time_hours (default 2), max_advance_booking_days (default 60), cancellation_window_hours (default 24), and hold_duration_minutes (default 10).
   - Set guardrails.verification_policy with require_otp_for_new_booking (default false), require_otp_for_reschedule (default true), require_otp_for_cancel (default true).

4. OPERATING HOURS & SERVICE DURATIONS:
   - If operating hours or service durations are not explicitly found in the crawled data, use your parametric knowledge to make accurate industry-standard guesses based on the vertical (e.g., Dental consults are 30 min, Dental offices open Mon-Fri 08:00 to 17:00).
   - Keep track of all fields you guessed or filled with defaults, and list them in `runtime_meta.inferred_fields`.

5. ACCURACY & PROFILE:
   - Extract real clinic or business name, address, contact phone/email, and timezone into `business_profile`.
   - Extract real staff, practitioners, or assets into `resources`.
   - Extract all offered services, categories, and prices into `services`.

Crawled Data:
{crawled_data}
""",
        input_variables=["tenant_id", "url", "crawled_data"],
    )

    crawl_text = json.dumps(crawled_data)[:25000]

    structured_llm = llm.with_structured_output(GeneratedAgentDraftSchema)
    chain = prompt | structured_llm

    try:
        structured_result = await chain.ainvoke({
            "tenant_id": tenant_id,
            "url": url,
            "crawled_data": crawl_text,
        })

        if isinstance(structured_result, BaseModel):
            schema_dict = structured_result.model_dump(mode="json", exclude_none=True)
        elif isinstance(structured_result, dict):
            schema_dict = structured_result
        else:
            schema_dict = dict(structured_result)

        schema_dict["schema_ref"] = "https://schedulux.ai/schema/v2/agent_runtime_config.json"
        schema_dict["schema_version"] = "2.4"
        schema_dict["tenant_id"] = tenant_id
        schema_dict["status"] = "draft"
        if not schema_dict.get("agent_id"):
            schema_dict["agent_id"] = f"agent_{tenant_id}_v1"

        print(f"[Schema Generator] Generated valid schema via with_structured_output.", flush=True)
        return schema_dict
    except Exception as e:
        print(f"[Schema Generator] Error generating structured schema: {e}", flush=True)
        raise


async def process_schema_generation(job_or_data, token=None):
    """RabbitMQ message processor for schema-generation-queue"""
    if isinstance(job_or_data, dict):
        data = job_or_data
    elif hasattr(job_or_data, "data"):
        data = job_or_data.data
    else:
        data = {}

    tenant_id = data.get("tenant_id")
    url = data.get("url")
    job_id = data.get("job_id")
    crawled_data = data.get("crawled_data", {})

    print(f"[Schema Worker] Processing schema generation for tenant: {tenant_id}, URL: {url}, job_id: {job_id}", flush=True)

    try:
        schema = await generate_agent_schema(crawled_data, tenant_id, url)

        validated_schema, is_valid, validation_errors = validate_and_sanitize_schema(schema)
        if is_valid:
            print(f"[Schema Worker] Draft schema validated successfully with StrictDraftPatchValidator.", flush=True)
            schema = validated_schema
        else:
            print(f"[Schema Worker] Validation WARNING - StrictDraftPatchValidator detected issues: {validation_errors}", flush=True)

        redis = get_redis_client()
        draft_key = f"agent:draft:{tenant_id}:{job_id}"
        latest_key = f"agent:draft:{tenant_id}"
        schema_json = json.dumps(schema)

        await redis.setex(draft_key, 86400, schema_json)
        await redis.setex(latest_key, 86400, schema_json)

        print(f"[Schema Worker] Stored draft schema in Redis: {draft_key}", flush=True)
        print(f"[Schema Worker] Schema JSON preview: {schema_json[:500]}...", flush=True)

        pubsub_channel = "schema-generation-events"
        event_payload = {
            "event": "SCHEMA_GENERATED",
            "tenant_id": tenant_id,
            "job_id": job_id,
            "url": url,
            "schema": schema,
        }
        await redis.publish(pubsub_channel, json.dumps(event_payload))
        print(f"[Schema Worker] Published event to Redis channel '{pubsub_channel}' for job {job_id}", flush=True)

        print(f"[Schema Worker] Successfully compiled agent schema for tenant: {tenant_id}", flush=True)

        return schema

    except Exception as exc:
        raw_err = str(exc)
        print(f"[Schema Worker] Exception caught during schema generation for tenant {tenant_id}: {raw_err}", flush=True)

        if "503" in raw_err or "high demand" in raw_err.lower():
            friendly_err = "The AI model is temporarily experiencing high demand (503). Please wait a moment and try again."
        elif "429" in raw_err or "quota" in raw_err.lower() or "rate_limit" in raw_err.lower() or "rate limit" in raw_err.lower():
            friendly_err = "API rate limit reached. Please wait a minute and retry."
        else:
            friendly_err = f"AI schema synthesis failed: {raw_err}"

        pubsub_channel = "schema-generation-events"
        event_payload = {
            "event": "SCHEMA_GENERATION_FAILED",
            "tenant_id": tenant_id,
            "job_id": job_id,
            "url": url,
            "error": friendly_err,
        }
        try:
            redis = get_redis_client()
            await redis.publish(pubsub_channel, json.dumps(event_payload))
            print(f"[Schema Worker] Published failure event to '{pubsub_channel}': {friendly_err}", flush=True)
        except Exception as pub_err:
            print(f"[Schema Worker] Failed to publish error event to redis: {pub_err}", flush=True)

     
        raise RuntimeError(friendly_err) from exc
