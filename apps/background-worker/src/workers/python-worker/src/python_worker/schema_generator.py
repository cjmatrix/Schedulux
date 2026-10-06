import os
import json
from langchain_core.prompts import PromptTemplate
from langchain_openai import ChatOpenAI
from langchain_core.output_parsers import JsonOutputParser
from dotenv import load_dotenv

dotenv_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', '..', '..', '.env')
if not os.path.exists(dotenv_path):
    dotenv_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', '.env')
load_dotenv(dotenv_path)

def generate_agent_schema(crawled_data: dict, tenant_id: str, url: str) -> dict:
    """
    Generates a Schedulux agent_runtime_config JSON payload using LangChain.
    Dynamically infers operating hours, services, resources, and terminology
    from crawl data.
    """
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print("[Schema Generator] OPENAI_API_KEY not found in environment. Returning fallback mockup schema.")
        return {
            "$schema": "https://schedulux.ai/schema/v2/agent_runtime_config.json",
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
                    "allocation_model": "time_slot",
                    "duration_minutes": 30,
                    "price": {"type": "fixed", "amount": 100, "currency": "USD"}
                }
            ],
            "runtime_meta": {
                "template_id": "tpl_medical_dental_v2",
                "compiler_mode": "mock",
                "inferred_fields": ["operating_hours", "services"]
            }
        }

    llm = ChatOpenAI(model="gpt-4-turbo-preview", temperature=0)
    parser = JsonOutputParser()

    prompt = PromptTemplate(
        template="""You are an expert AI system architect for Schedulux AI.
Your task is to generate a comprehensive JSON configuration file for an AI booking agent based on the provided website crawl data.

CRITICAL INSTRUCTIONS FOR MISSING DATA & TIME SLOTS:
1. FOR ALL SERVICES, identify and specify the "allocation_model". 
   - Set "time_slot" for services booked at specific times (e.g., dental clinics, hair salons, auto repairs).
   - Set "date_range" for services booked over days/dates (e.g., hotel stays, multi-day car rentals).
2. IF OPERATING HOURS OR SERVICE DURATIONS ARE NOT EXPLICITLY FOUND in the crawled data, DO NOT perform a live search. Instead, use your parametric knowledge to make highly accurate industry-standard guesses based on the business vertical (e.g., Dental consults are 30 min, Dental offices open Mon-Fri 08:00 to 17:00).
3. Keep track of all fields you guessed or filled with defaults. List them explicitly in the `runtime_meta.inferred_fields` array (e.g., ["operating_hours", "services.srv_general_consult.duration_minutes"]).

The generated JSON must EXACTLY follow this structure:

{{
  "$schema": "https://schedulux.ai/schema/v2/agent_runtime_config.json",
  "schema_version": "2.4",
  "tenant_id": "{tenant_id}",
  "business_profile": {{
    "name": "Extract clinic or business name",
    "vertical": "Identify vertical (e.g., medical_dental, lodging, auto_repair)",
    "timezone": "Determine from data or default America/New_York",
    "address": "Extract physical address",
    "contact": {{
       "support_email": "Extract or null",
       "public_phone": "Extract phone"
    }}
  }},
  "operating_hours": {{
    "monday": [{{ "start": "08:00", "end": "17:00" }}],
    "tuesday": [{{ "start": "08:00", "end": "17:00" }}],
    "wednesday": [{{ "start": "08:00", "end": "17:00" }}],
    "thursday": [{{ "start": "08:00", "end": "17:00" }}],
    "friday": [{{ "start": "08:00", "end": "17:00" }}],
    "saturday": [],
    "sunday": []
  }},
  "resources": [
     {{
        "resource_id": "res_dr_aris_smith",
        "resource_type": "staff",
        "name": "Dr. Aris Smith",
        "title": "Lead Dentist",
        "category": "Orthodontist",
        "description": "Short bio or details extracted",
        "is_bookable": true,
        "dispatch_status": "active"
     }}
  ],
  "services": [
     {{
        "service_id": "srv_general_consult",
        "name": "General Dental Consultation",
        "allocation_model": "time_slot",
        "duration_minutes": 30,
        "price": {{
           "type": "fixed",
           "amount": 75,
           "currency": "USD"
        }},
        "eligible_resource_ids": ["res_dr_aris_smith"],
        "required_asset_ids": []
     }}
  ],
  "runtime_meta": {{
     "template_id": "tpl_medical_dental_v2",
     "compiler_mode": "deterministic_strict",
     "inferred_fields": ["operating_hours", "services.srv_general_consult.price"]
  }}
}}

Crawled Data:
{crawled_data}

Return ONLY valid JSON matching the format instructions.
{format_instructions}
""",
        input_variables=["tenant_id", "url", "crawled_data"],
        partial_variables={"format_instructions": parser.get_format_instructions()},
    )

    crawl_text = json.dumps(crawled_data)[:30000]

    chain = prompt | llm | parser

    try:
        response = chain.invoke({
            "tenant_id": tenant_id,
            "url": url,
            "crawled_data": crawl_text
        })
        return response
    except Exception as e:
        print(f"[Schema Generator] Error generating schema: {e}")
        return {"error": str(e)}


async def process_schema_generation(job, token):
    """BullMQ processor for schema-generation-queue"""
    data = job.data
    tenant_id = data.get("tenant_id")
    url = data.get("url")
    job_id = data.get("job_id")
    crawled_data = data.get("crawled_data", {})

    print(f"[Schema Worker] Processing schema generation for tenant: {tenant_id}, URL: {url}, job_id: {job_id}")

    await job.updateProgress(20)

   
    schema = generate_agent_schema(crawled_data, tenant_id, url)

    await job.updateProgress(100)
    print(f"[Schema Worker] Successfully compiled agent schema for tenant: {tenant_id}")

    return schema
