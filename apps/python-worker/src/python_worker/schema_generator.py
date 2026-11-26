import os
import json
from pydantic import BaseModel
from langchain_core.prompts import PromptTemplate
from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv
from python_worker.queues import get_redis_client, publish_schema_failure_event
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
                    ]
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
                    "require_otp_for_new_booking": False
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

    def _create_llm(provider: str):
        if provider == "gemini" and gemini_api_key:
            model_name = os.environ.get("GEMINI_MODEL") or "gemini-3.5-flash"
            if "gemma" in model_name.lower():
                model_name = "gemini-2.5-flash"
            print(f"[Schema Generator] Initializing ChatGoogleGenerativeAI with model '{model_name}'.", flush=True)
            return ChatGoogleGenerativeAI(
                model=model_name,
                google_api_key=gemini_api_key,
                temperature=0,
            )
        elif provider == "groq" and groq_api_key:
            groq_model = os.environ.get("GROQ_MODEL") or "openai/gpt-oss-120b"
            if ChatGroq is not None:
                print(f"[Schema Generator] Initializing ChatGroq with model '{groq_model}'.", flush=True)
                return ChatGroq(
                    model_name=groq_model,
                    groq_api_key=groq_api_key,
                    temperature=0,
                )
            else:
                print(f"[Schema Generator] Initializing ChatOpenAI (Groq endpoint) with model '{groq_model}'.", flush=True)
                return ChatOpenAI(
                    model=groq_model,
                    api_key=groq_api_key,
                    base_url="https://api.groq.com/openai/v1",
                    temperature=0,
                )
        return None

  
    providers = []
    if gemini_api_key:
        providers.append("gemini")
    if groq_api_key:
        providers.append("groq")

    prompt = PromptTemplate(
        template="""You are an expert AI system architect for Schedulux AI.
Your task is to extract and generate a factual, strictly grounded AI booking agent configuration from the provided website crawl data for tenant: {tenant_id} (website URL: {url}).

======================================================================
ABSOLUTE ZERO-HALLUCINATION & FACTUAL GROUNDING MANDATE:
You must strictly extract ONLY information that is explicitly stated or directly verifiable in the Crawled Data.
Under NO circumstances should you fabricate, assume, extrapolate, or invent services, staff, resources, contact numbers, emails, addresses, or prices that do not appear in the crawl text.
======================================================================

1. STRICT FACTUAL EXTRACTION - SERVICES (DO NOT INVENT SERVICES):
   - Extract ONLY services, treatments, procedures, or bookable offerings explicitly listed or described in the Crawled Data.
   - Do NOT add "common industry services" or imaginary packages. If a site only lists 2 services, output EXACTLY those 2 services.
   - "service_id": Unique identifier string formatted with prefix srv_ (e.g. srv_exterior_wash).
   - "name": Exact name of the service as written on the website.
   - "category": Actual category from the website or 'General'.
   - "description": Description derived strictly from the website text.
   - "booking_mode":
     * "time_slot": For appointments booked at specific clock hours/minutes (e.g. consultations, appointments, medical/dental visits, haircuts, detailing sessions).
     * "date_range": For bookings spanning multiple calendar days (e.g. hotel room stays, multi-day equipment rentals).
   - "duration_minutes": Duration in minutes if explicitly stated on the site. If NOT stated, use 30 min (or 60 for date_range) and record "services[].duration_minutes" in runtime_meta.inferred_fields.
   - "buffer_minutes": 0 (unless explicitly specified on site).
   - "price":
     * Extract real prices if explicitly mentioned on the site: {{"type": "fixed"|"starting_at"|"hourly"|"free", "amount": float, "currency": "USD" (or local currency)}}.
     * If NO price is mentioned in the crawl data, set {{"type": "custom", "amount": 0.0, "currency": "USD"}}. NEVER invent fictional dollar amounts!
   - "verification": {{"require_otp": bool|null}} (Set true for high-value/sensitive/exclusive services or date_range stays; false for routine/low-friction bookings; null to inherit global default).
   - "resource_requirements": Link to eligible resources defined in the resources section.

2. STRICT FACTUAL EXTRACTION - RESOURCES (DO NOT INVENT PEOPLE OR ASSETS):
   - Extract ONLY real practitioners, doctors, therapists, staff members, bookable rooms, or assets explicitly named or listed on the website.
   - NEVER invent fictional staff names (e.g. do NOT invent "Dr. Smith", "Jane Doe", "Staff Provider").
   - If individual staff or practitioner names are NOT mentioned anywhere in the crawl data:
     * Do NOT invent fake people!
     * Instead, create EXACTLY ONE generic business provider:
       {{"resource_id": "res_staff_general", "resource_type": "staff", "name": "General Staff", "title": "Service Specialist", "category": "General", "description": "Primary service provider", "is_bookable": true, "dispatch_status": "active", "custom_shift_overrides": {{}}}}
     * Point all services' resource_requirements to ["res_staff_general"].
   - If specific practitioners, staff members, or physical bookable assets ARE named in the crawl text, extract each with:
     * "resource_id": Unique identifier string with prefix res_ (e.g. res_dr_alan_walker).
     * "resource_type": One of "staff", "room", "chair", "bay", "equipment", "asset", "vehicle".
     * "name": Real name from website.
     * "title": Real title or role (e.g. "Senior Stylist", "Dental Surgeon", "Deluxe Suite").
     * "is_bookable": true
     * "dispatch_status": "active"
     * "custom_shift_overrides": {{}}

3. STRICT FACTUAL EXTRACTION - BUSINESS PROFILE:
   - "name": Official business name extracted from the site (never generic or made up).
   - "vertical": Most accurate industry vertical (e.g., medical_dental, salon_spa, automotive, consulting, fitness, hospitality, general).
   - "address": Real physical address from the site. If NOT found, set to null. NEVER invent fake street names or cities!
   - "contact":
     * "public_phone": Real phone number from the site. If NOT found, set to null. NEVER invent fake 555 numbers!
     * "support_email": Real email address from the site. If NOT found, set to null. NEVER invent fake info@ emails!
   - "timezone": Local timezone matching the address/city if known (e.g. "America/New_York", "Europe/London", "Asia/Kolkata"), or "UTC" if unstated.
   - "locale": "en-US" (or detected locale).
   - "currency": Currency matching the prices or country (default "USD").

4. OPERATING HOURS:
   - Extract actual business days and open/close times if explicitly stated on the site.
   - If operating hours are NOT stated on the site:
     * Provide standard business hours (Monday-Friday 09:00-17:00, Saturday/Sunday closed []).
     * Add "operating_hours" to runtime_meta.inferred_fields.

5. SCHEDULING ENGINE & GUARDRAILS:
   - Set scheduling_engine.booking_mode and scheduling_engine.default_booking_mode to match the predominant service mode ("time_slot" or "date_range").
   - Set default_lead_time_hours (default 2), max_advance_booking_days (default 60), cancellation_window_hours (default 24), and hold_duration_minutes (default 10).
   - Set guardrails.verification_policy with require_otp_for_new_booking (default false).

6. WIDGET CONFIGURATION & SUPERVISOR PROMPT:
   - "agent_name": "{{Business Name}} AI Assistant" or business name receptionist.
   - "initial_greeting": Friendly greeting explicitly welcoming the user to the specific business name and offering to assist with the ACTUAL extracted services.
   - "quick_prompts": 3 relevant prompts referencing real services or inquiries for this business (e.g. "What services do you provide?", "Book an appointment", "What are your business hours?").
   - "supervisor_prompt": Operational instructions for the AI receptionist, tailored ONLY to the actual services and business facts discovered.

7. RUNTIME META:
   - List any field that had to use fallback defaults in `runtime_meta.inferred_fields` (e.g. ["operating_hours", "services[0].duration_minutes"]).

Crawled Data:
{crawled_data}
""",
        input_variables=["tenant_id", "url", "crawled_data"],
    )

    if isinstance(crawled_data, dict):
        formatted_pages = []
        for page_url, markdown in crawled_data.items():
            clean_md = (markdown or "").strip()
            if clean_md:
                formatted_pages.append(f"=== PAGE: {page_url} ===\n{clean_md}")
        crawl_text = "\n\n".join(formatted_pages)[:25000]
    else:
        crawl_text = str(crawled_data)[:25000]

    structured_result = None
    last_err = None

    for provider in providers:
        llm = _create_llm(provider)
        if not llm:
            continue

        try:
            active_crawl_text = crawl_text[:12000] if provider == "groq" else crawl_text
            print(f"[Schema Generator] Attempting structured synthesis with provider '{provider}'...", flush=True)

            structured_llm = llm.with_structured_output(GeneratedAgentDraftSchema)
            chain = prompt | structured_llm

            structured_result = await chain.ainvoke({
                "tenant_id": tenant_id,
                "url": url,
                "crawled_data": active_crawl_text,
            })

            if structured_result:
                print(f"[Schema Generator] Successfully synthesized schema using provider '{provider}'.", flush=True)
                break
        except Exception as e:
            last_err = e
            print(f"[Schema Generator] Provider '{provider}' failed ({e}). Attempting next provider...", flush=True)

    if not structured_result:
        raise last_err or RuntimeError("No LLM provider was able to synthesize the schema.")

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

        pubsub_channel = f"schema-events:{tenant_id}:{job_id}"
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
        elif "429" in raw_err or "413" in raw_err or "quota" in raw_err.lower() or "rate_limit" in raw_err.lower() or "rate limit" in raw_err.lower() or "too large" in raw_err.lower():
            friendly_err = "API rate limit or message size limit reached. Please wait a minute and retry."
        else:
            friendly_err = f"AI schema synthesis failed: {raw_err}"

        await publish_schema_failure_event(tenant_id, url, job_id, friendly_err)

     
        raise RuntimeError(friendly_err) from exc
