from __future__ import annotations

import logging
import os
from datetime import UTC, datetime
from typing import Any

from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage
from langchain_core.tools import BaseTool
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_groq import ChatGroq
from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent
from pydantic import SecretStr

logger = logging.getLogger(__name__)

_FAQ_TOOLS = {"search_knowledge_base", "search_services", "search_resources"}


def _format_services_catalog(services: list[dict[str, Any]]) -> str:
    if not services:
        return "No services listed."
    lines = [f"services[{len(services)}]{{id, name, staff_requirements}}:"]
    for s in services:
        sid = s.get("id") or s.get("service_id") or "unassigned"
        name = s.get("name") or "Unnamed"
        reqs = s.get("resource_requirements") or []
        staff_roles = [
            f"{r.get('role', 'Staff')}"
            for r in reqs
            if str(r.get("resource_type", "")).lower() == "staff" or not r.get("resource_type")
        ]
        staff_str = f"staff: [{', '.join(staff_roles)}]" if staff_roles else "general service"
        lines.append(f"  {sid} | {name} | {staff_str}")
    return "\n".join(lines)


def _format_resources_catalog(resources: list[dict[str, Any]]) -> str:
    if not resources:
        return "No staff or resources listed."
    lines = [f"resources[{len(resources)}]{{id, name, type, role}}:"]
    for r in resources:
        rid = r.get("id") or r.get("resource_id") or "unassigned"
        name = r.get("name") or "Unnamed"
        rtype = r.get("resource_type") or r.get("type") or "staff"
        title = r.get("title") or ""
        role_str = f"{rtype}" + (f" ({title})" if title else "")
        lines.append(f"  {rid} | {name} | {role_str}")
    return "\n".join(lines)


def _get_gemini_model(temperature: float = 0.1, max_tokens: int = 2048) -> Any | None:
    gemini_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not gemini_key:
        return None
    model_name = os.environ.get("GEMINI_MODEL", "gemini-1.5-flash")
    if "gemma" in model_name.lower():
        model_name = "gemini-1.5-flash"
    return ChatGoogleGenerativeAI(
        model=model_name,
        google_api_key=gemini_key,
        temperature=temperature,
        max_output_tokens=max_tokens,
    )


def _extract_response_text(result: dict[str, Any]) -> str:
    final = result["messages"][-1]
    if isinstance(final.content, str):
        return final.content
    if isinstance(final.content, list):
        texts = [
            item["text"] if isinstance(item, dict) and item.get("text") else str(item)
            for item in final.content
        ]
        return "\n".join(texts)
    return str(final.content)


def _get_chat_model(temperature: float = 0.1) -> Any:
    groq_key = os.environ.get("GROQ_API_KEY")
    gemini_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if groq_key:
        return ChatGroq(
            model=os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile"),
            api_key=SecretStr(groq_key),
            temperature=temperature,
            max_tokens=2048,
        )
    elif gemini_key:
        return ChatGoogleGenerativeAI(
            model=os.environ.get("GEMINI_MODEL", "gemini-1.5-flash"),
            google_api_key=gemini_key,
            temperature=temperature,
            max_output_tokens=2048,
        )
    else:
        return ChatOpenAI(model="gpt-4o-mini", temperature=temperature)


def _build_faq_system_prompt(biz_context: dict[str, Any]) -> str:
    biz_name = biz_context.get("business_name") or "Schedulux Business"
    biz_timezone = biz_context.get("timezone") or "UTC"
    supervisor_prompt = biz_context.get("supervisor_prompt") or ""
    formatted_hours = biz_context.get("formatted_operating_hours") or "Operating hours not specified."
    public_phone = biz_context.get("public_phone") or "Not provided"
    support_email = biz_context.get("support_email") or "Not provided"
    address = biz_context.get("address") or "Not provided"
    services = biz_context.get("services", [])
    services_catalog = _format_services_catalog(services)
    resources = biz_context.get("resources", [])
    resources_catalog = _format_resources_catalog(resources)

    custom_instructions_block = ""
    if supervisor_prompt.strip():
        custom_instructions_block = f"""
[Business Owner Instructions — ALWAYS FOLLOW THESE]
{supervisor_prompt.strip()}
"""

   
    return f"""You are the Knowledge & Policy specialist for {biz_name}.
Your sole purpose: answer customer questions about business services, offerings, pricing, operating hours, contact info, procedures, rules, preparation guidelines, and general knowledge accurately.{custom_instructions_block}

[Business Profile & Operating Hours]
Business: {biz_name}
Business Timezone: {biz_timezone}
Phone: {public_phone}
Email: {support_email}
Address: {address}
Operating Hours & Schedule:
{formatted_hours}

[Services & Offerings Catalog (Compact TOON: id, name, staff_requirements)]
{services_catalog}

[Staff & Resources Catalog (Compact TOON: id, name, type, role)]
{resources_catalog}

[Protocol]
1. For questions about services, offerings, pricing, operating hours, opening/closing times, days open/closed, phone number, email, address, location, or available staff/specialists:
   Answer DIRECTLY using [Services & Offerings Catalog], [Staff & Resources Catalog], and [Business Profile & Operating Hours].
   If the customer asks for deeper details on services or specialists/practitioners, invoke `search_services` or `search_resources`.
2. For questions about policies, refund/cancellation rules, procedures, preparation guidelines, or general business information:
   Invoke `search_knowledge_base(query=..., tenant_id=..., agent_id=...)` using tenant_id and agent_id from [Active Request Context].
3. Ground answers to policy/procedure questions STRICTLY on retrieved content from the knowledge base, services, or business profile. Do NOT fabricate policies, terms, or guidelines.
4. If no matching information is found in the knowledge base, services catalog, or business profile, say: "I don't have that information on file — our team will be happy to assist you directly."
5. If the customer indicates they want to schedule an appointment or book, let them know our booking concierge can assist them right away.
6. Tone: knowledgeable, warm, concise, and helpful."""


def _build_faq_request_context(
    tenant_id: str,
    agent_id: str,
) -> str:

    now_iso = datetime.now(UTC).strftime("%A, %Y-%m-%d %H:%M:%S UTC")
    return f"""[Active Request Context]
Current UTC Time: {now_iso}
Tenant ID: {tenant_id}
Agent ID: {agent_id}""".rstrip()


async def run_faq_agent(
    tenant_id: str,
    agent_id: str,
    message: str,
    conversation_history: list[BaseMessage],
    biz_context: dict[str, Any],
    all_tools: list[BaseTool],
) -> str:
    faq_tools = [t for t in all_tools if t.name in _FAQ_TOOLS]

    
    prior_history: list[BaseMessage] = []
    if (
        conversation_history
        and isinstance(conversation_history[-1], HumanMessage)
        and conversation_history[-1].content == message
    ):
        prior_history = list(conversation_history[:-1])
    else:
        prior_history = list(conversation_history)

   #l1+l2
    system_prompt = _build_faq_system_prompt(biz_context)

    # l4
    dynamic_context = _build_faq_request_context(
        tenant_id=tenant_id,
        agent_id=agent_id,
    )
    current_human_msg = HumanMessage(content=f"{message}\n\n{dynamic_context}")
    langchain_msgs: list[BaseMessage] = [*prior_history, current_human_msg]

    model = _get_chat_model(temperature=0.1)

    agent = create_react_agent(
        model=model,
        tools=faq_tools,
        prompt=SystemMessage(content=system_prompt),
    )

    try:
        result = await agent.ainvoke({"messages": langchain_msgs})
        return _extract_response_text(result)
    except Exception as e:
        logger.warning(
            "[FaqAgent] Primary model (%s) failed: %s. Attempting fallback to Gemini...",
            type(model).__name__,
            e,
        )
        gemini_model = _get_gemini_model(temperature=0.1, max_tokens=2048)
        if gemini_model and not isinstance(model, ChatGoogleGenerativeAI):
            try:
                logger.info(
                    "[FaqAgent] Retrying with Gemini fallback (%s)...",
                    getattr(gemini_model, "model", "gemini"),
                )
                fallback_agent = create_react_agent(
                    model=gemini_model,
                    tools=faq_tools,
                    prompt=SystemMessage(content=system_prompt),
                )
                result = await fallback_agent.ainvoke({"messages": langchain_msgs})
                logger.info("[FaqAgent] Successfully recovered using Gemini fallback!")
                return _extract_response_text(result)
            except Exception as fb_err:
                logger.error("[FaqAgent] Gemini fallback also failed: %s", fb_err, exc_info=True)
        else:
            logger.error("[FaqAgent] Error occurred without fallback: %s", e, exc_info=True)

        return (
            "I'm having trouble retrieving that information right now. "
            "Please feel free to call us directly or try again in a moment."
        )

