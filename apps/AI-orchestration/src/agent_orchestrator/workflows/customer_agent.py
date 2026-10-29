from __future__ import annotations

import json
import logging
import os
from datetime import UTC, datetime
from typing import Any

from dotenv import load_dotenv
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_groq import ChatGroq
from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent
from pydantic import SecretStr

from agent_orchestrator.mcp.scheduling_mcp_server import get_scheduling_mcp_tools
from agent_orchestrator.models import AgentDraft, AgentRuntimeConfig
from agent_orchestrator.repositories.customer_message_repository import CustomerMessageRepository

try:
    import toon

    _has_toon = True
except ImportError:
    _has_toon = False

logger = logging.getLogger(__name__)

_env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".env"))
load_dotenv(_env_path)

_customer_msg_repo = CustomerMessageRepository()


def _format_services_catalog(services: list[dict[str, Any]]) -> str:
    """Format services catalog using TOON for token efficiency, with JSON fallback."""
    if _has_toon:
        try:
            return toon.encode(services)
        except Exception as e:
            logger.warning(
                "[CustomerAgent] Failed to toonify services, falling back to JSON: %s", e
            )
    return json.dumps(services, indent=2)


def _get_chat_model(temperature: float = 0.2) -> BaseChatModel:
    """Initialize LLM model (Groq preferred, Gemini fallback)."""
    groq_api_key = os.environ.get("GROQ_API_KEY")
    gemini_api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")

    if groq_api_key:
        groq_model = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")
        return ChatGroq(
            model=groq_model,
            api_key=SecretStr(groq_api_key),
            temperature=temperature,
            max_tokens=4096,
        )
    elif gemini_api_key:
        model_name = os.environ.get("GEMINI_MODEL", "gemini-1.5-flash")
        return ChatGoogleGenerativeAI(
            model=model_name,
            google_api_key=gemini_api_key,
            temperature=temperature,
            max_output_tokens=4096,
        )
    else:
        return ChatOpenAI(
            model="gpt-4o-mini",
            temperature=temperature,
        )


async def _resolve_business_context(tenant_id: str, agent_id: str) -> dict[str, Any]:
    """Retrieve tenant business configuration, services, and resources for the prompt."""
    biz_name: str | None = None
    timezone: str | None = None
    currency: str | None = None
    services: list[dict[str, Any]] = []
    resources: list[dict[str, Any]] = []
    resource_map: dict[str, dict[str, Any]] = {}

    query: dict[str, Any] = {"tenant_id": tenant_id}
    if agent_id:
        query["agent_id"] = agent_id

    runtime = await AgentRuntimeConfig.find_one(query)

    if runtime:
        if runtime.business_profile:
            biz_name = runtime.business_profile.name or biz_name
            timezone = runtime.business_profile.timezone or timezone
            currency = runtime.business_profile.currency or currency
        if not timezone and hasattr(runtime.scheduling_engine, "timezone"):
            timezone = getattr(runtime.scheduling_engine, "timezone", None) or timezone

        if runtime.resources:
            for r in runtime.resources:
                if not r.is_bookable:
                    continue
                r_type = (
                    str(r.resource_type.value)
                    if hasattr(r.resource_type, "value")
                    else str(r.resource_type or "staff")
                )
                d_status = (
                    str(r.dispatch_status.value)
                    if hasattr(r.dispatch_status, "value")
                    else str(r.dispatch_status or "active")
                )
                r_entry = {
                    "resource_id": r.resource_id,
                    "name": r.name,
                    "title": r.title or "",
                    "category": r.category or "General",
                    "description": r.description or "",
                    "resource_type": r_type,
                    "dispatch_status": d_status,
                }
                resource_map[r.resource_id] = r_entry
                resources.append(r_entry)

        if runtime.services:
            for s in runtime.services:
                selectable_staff: list[dict[str, Any]] = []
                auto_assigned: list[dict[str, Any]] = []

                for req in s.resource_requirements:
                    req_mode = (
                        str(req.selection_mode.value)
                        if hasattr(req.selection_mode, "value")
                        else str(req.selection_mode or "")
                    )
                    r_type = str(getattr(req.resource_type, "value", req.resource_type) or "staff")

                    resolved_for_req = [
                        resource_map[rid]
                        for rid in req.eligible_resource_ids
                        if rid in resource_map
                    ]

                    if req_mode == "user_selectable" or (
                        not req_mode and r_type.lower() == "staff"
                    ):
                        for res in resolved_for_req:
                            selectable_staff.append(
                                {
                                    "resource_id": res["resource_id"],
                                    "name": res["name"],
                                    "title": res["title"],
                                    "category": res["category"],
                                    "role": req.role or "Provider",
                                }
                            )
                    else:
                        auto_assigned.append(
                            {
                                "role": req.role or "Resource",
                                "resource_type": r_type,
                                "count": req.count,
                            }
                        )

                services.append(
                    {
                        "service_id": s.service_id,
                        "name": s.name,
                        "description": s.description or "",
                        "duration_minutes": s.duration_minutes,
                        "price": (
                            f"{s.price.amount} {s.price.currency}"
                            if s.price and getattr(s.price, "amount", None) is not None
                            else "Free"
                        ),
                        "booking_mode": s.booking_mode,
                        "selectable_staff": selectable_staff,
                        "auto_assigned_resources": auto_assigned,
                    }
                )

    if not runtime or not services or not biz_name:
        draft = await AgentDraft.find_one(query)
        if draft and draft.current_draft:
            biz = draft.current_draft.get("business_profile") or {}
            if isinstance(biz, dict):
                if not biz_name:
                    biz_name = biz.get("name")
                if not timezone:
                    timezone = biz.get("timezone")
                if not currency:
                    currency = biz.get("currency")
            if not timezone:
                engine = draft.current_draft.get("scheduling_engine") or {}
                if isinstance(engine, dict):
                    timezone = engine.get("timezone")

            if not resources:
                raw_resources = draft.current_draft.get("resources") or []
                if isinstance(raw_resources, list):
                    for r in raw_resources:
                        if not isinstance(r, dict) or not r.get("is_bookable", True):
                            continue
                        r_entry = {
                            "resource_id": r.get("resource_id", ""),
                            "name": r.get("name", "Unnamed"),
                            "title": r.get("title", ""),
                            "category": r.get("category", "General"),
                            "description": r.get("description", ""),
                            "resource_type": r.get("resource_type", "staff"),
                            "dispatch_status": r.get("dispatch_status", "active"),
                        }
                        resource_map[r_entry["resource_id"]] = r_entry
                        resources.append(r_entry)

            if not services:
                raw_services = draft.current_draft.get("services") or []
                if isinstance(raw_services, list):
                    for s in raw_services:
                        if not isinstance(s, dict):
                            continue
                        price_val = s.get("price")
                        if isinstance(price_val, dict):
                            price_str = f"{price_val.get('amount', 0)} {price_val.get('currency', currency or 'USD')}"
                        elif price_val is not None:
                            price_str = str(price_val)
                        else:
                            price_str = "Free"

                        raw_reqs = s.get("resource_requirements") or []
                        selectable_staff = []
                        auto_assigned = []
                        if isinstance(raw_reqs, list):
                            for req in raw_reqs:
                                if not isinstance(req, dict):
                                    continue
                                draft_req_mode = str(req.get("selection_mode") or "")
                                req_r_type = str(req.get("resource_type") or "staff").lower()
                                eligible_ids = req.get("eligible_resource_ids") or []
                                resolved_for_req = [
                                    resource_map[rid] for rid in eligible_ids if rid in resource_map
                                ]
                                if draft_req_mode == "user_selectable" or (
                                    not draft_req_mode and req_r_type == "staff"
                                ):
                                    for res in resolved_for_req:
                                        selectable_staff.append(
                                            {
                                                "resource_id": res["resource_id"],
                                                "name": res["name"],
                                                "title": res["title"],
                                                "category": res["category"],
                                                "role": req.get("role", "Provider"),
                                            }
                                        )
                                else:
                                    auto_assigned.append(
                                        {
                                            "role": req.get("role", "Resource"),
                                            "resource_type": req.get("resource_type", ""),
                                            "count": req.get("count", 1),
                                        }
                                    )

                        services.append(
                            {
                                "service_id": s.get("service_id", ""),
                                "name": s.get("name", "Unnamed"),
                                "description": s.get("description", ""),
                                "duration_minutes": s.get("duration_minutes", 30),
                                "price": price_str,
                                "booking_mode": s.get("booking_mode", "time_slot"),
                                "selectable_staff": selectable_staff,
                                "auto_assigned_resources": auto_assigned,
                            }
                        )

    return {
        "business_name": biz_name or "Schedulux Business",
        "timezone": timezone or "UTC",
        "currency": currency or "USD",
        "services": services,
        "resources": resources,
    }


def _build_system_prompt(tenant_id: str, agent_id: str, biz_context: dict[str, Any]) -> str:
    now_iso = datetime.now(UTC).strftime("%Y-%m-%d %H:%M:%S UTC")
    services_catalog = _format_services_catalog(biz_context.get("services", []))

    return f"""You are the friendly, professional AI Booking Concierge for {biz_context.get("business_name")}.
Your sole mission is to assist customers with discovering available services, checking real-time availability, and completing appointment bookings.

[Context]
Current UTC Time: {now_iso}
Business Timezone: {biz_context.get("timezone")}
Tenant ID: {tenant_id}
Agent ID: {agent_id}

[Services Catalog]
{services_catalog}

[Guidelines & Protocol]
1. Warm Greeting & Guidance:
   - Be polite, welcoming, and concise. Explain services, pricing, and duration if asked.
2. Resource / Staff Selection:
   - When a service has `selectable_staff` listed, the customer may request a specific staff member or provider (e.g. "I want Dr. Sarah").
   - If the customer specifies a provider, match their choice to that staff member's `resource_id`. Pass this `resource_id` into `check_availability` and `book_appointment`.
   - If the customer does NOT express a provider preference, or if requirements are marked under `auto_assigned_resources`, do NOT force them to choose. Leave `resource_id=None` so the scheduling engine automatically assigns the best available provider.
3. In-Depth Staff & Resource Inquiries:
   - If a customer asks detailed questions about our staff, specific providers' backgrounds, qualifications, specialties, rooms, or equipment, invoke the `search_resources` tool passing tenant_id="{tenant_id}" and agent_id="{agent_id}".
4. Checking Availability:
   - When a user wants to book or asks for open times, match their request to the appropriate service_id from the catalog.
   - Use the `check_availability` tool passing tenant_id="{tenant_id}", agent_id="{agent_id}", and service_id to query real-time slots. If a specific provider was requested, include their `resource_id`. NEVER invent, estimate, or hallucinate available times.
   - If no specific date is mentioned, check today and upcoming days.
   - Present available slots clearly to the customer.
5. Booking Confirmation Requirements:
   - Before confirming a booking, ensure you have:
     a) Desired Service (`service_id`)
     b) Specific Start Time (`start_time` in ISO format, e.g. 2026-10-30T10:00:00Z)
     c) Customer's Full Name
     d) Customer's Mobile Phone Number
     e) Desired Staff Member (`resource_id`), only if the customer requested someone specific
   - If any of these are missing, ask the customer for them politely before calling the booking tool.
6. Calling `book_appointment`:
   - Pass tenant_id="{tenant_id}", agent_id="{agent_id}", the selected service_id, start_time, customer_name, customer_phone, and optional resource_id if chosen.
   - Once confirmed, share the booking reference code and reassure the customer their appointment is booked!
7. Tone: Helpful, courteous, and efficient.
"""


async def process_customer_chat(
    tenant_id: str,
    agent_id: str,
    session_id: str,
    message: str,
    customer_id: str | None = None,
    customer_phone: str | None = None,
    customer_name: str | None = None,
) -> dict[str, Any]:
    """Execute LangGraph Customer Agent with FastMCP tools and sliding window memory."""

    await _customer_msg_repo.get_or_create_conversation(session_id, tenant_id, agent_id)

    if customer_id or customer_phone or customer_name:
        await _customer_msg_repo.update_conversation_customer(
            session_id=session_id,
            customer_id=customer_id,
            customer_name=customer_name,
            customer_phone=customer_phone,
        )

    await _customer_msg_repo.save_message(
        session_id=session_id,
        tenant_id=tenant_id,
        agent_id=agent_id,
        role="user",
        content=message,
    )

    recent_messages = await _customer_msg_repo.get_recent_messages(session_id, limit=10)

    langchain_messages: list[BaseMessage] = []
    for m in recent_messages:
        if m.role == "user":
            langchain_messages.append(HumanMessage(content=m.content))
        elif m.role == "assistant":
            langchain_messages.append(AIMessage(content=m.content))

    biz_context = await _resolve_business_context(tenant_id, agent_id)
    system_prompt = _build_system_prompt(tenant_id, agent_id, biz_context)

    model = _get_chat_model(temperature=0.2)
    tools = get_scheduling_mcp_tools()

    agent = create_react_agent(
        model=model,
        tools=tools,
        prompt=SystemMessage(content=system_prompt),
    )

    try:
        result = await agent.ainvoke({"messages": langchain_messages})
        final_message = result["messages"][-1]
        if isinstance(final_message.content, str):
            response_text = final_message.content
        elif isinstance(final_message.content, list):
            texts = []
            for item in final_message.content:
                if isinstance(item, dict) and item.get("text"):
                    texts.append(item["text"])
                elif isinstance(item, str):
                    texts.append(item)
            response_text = "\n".join(texts) if texts else str(final_message.content)
        else:
            response_text = str(final_message.content)
    except Exception as e:
        logger.error("[CustomerAgent] Error invoking LangGraph agent: %s", e, exc_info=True)
        response_text = (
            "I'm sorry, I encountered a temporary issue checking the schedule. "
            "Please try again in a moment."
        )

    await _customer_msg_repo.save_message(
        session_id=session_id,
        tenant_id=tenant_id,
        agent_id=agent_id,
        role="assistant",
        content=response_text,
    )

    updated_history = await _customer_msg_repo.get_recent_messages(session_id, limit=10)

    return {
        "session_id": session_id,
        "response": response_text,
        "history": [
            {
                "id": str(m.id),
                "session_id": m.session_id,
                "tenant_id": m.tenant_id,
                "agent_id": m.agent_id,
                "role": m.role,
                "content": m.content,
                "created_at": m.created_at.isoformat(),
            }
            for m in updated_history
        ],
    }
