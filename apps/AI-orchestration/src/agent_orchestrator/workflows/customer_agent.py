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

logger = logging.getLogger(__name__)

_env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".env"))
load_dotenv(_env_path)

_customer_msg_repo = CustomerMessageRepository()


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
    """Retrieve tenant business configuration and services for the prompt."""
    runtime = await AgentRuntimeConfig.find_one({"tenant_id": tenant_id, "agent_id": agent_id})
    if runtime and runtime.services:
        return {
            "business_name": runtime.business_name or "Schedulux Business",
            "timezone": runtime.timezone or "UTC",
            "currency": runtime.currency or "USD",
            "services": [
                {
                    "service_id": s.service_id,
                    "name": s.name,
                    "description": s.description,
                    "duration_minutes": s.duration_minutes,
                    "price": f"{s.price.amount} {s.price.currency}" if s.price else "Free",
                    "booking_mode": s.booking_mode,
                }
                for s in runtime.services
            ],
        }

 
    draft = await AgentDraft.find_one({"tenant_id": tenant_id, "agent_id": agent_id})
    if draft and draft.data:
        biz = draft.data.get("business_profile", {})
        services = draft.data.get("services", [])
        return {
            "business_name": biz.get("name") or "Schedulux Business",
            "timezone": biz.get("timezone") or "UTC",
            "currency": biz.get("currency") or "USD",
            "services": [
                {
                    "service_id": s.get("service_id", ""),
                    "name": s.get("name", "Unnamed"),
                    "description": s.get("description", ""),
                    "duration_minutes": s.get("duration_minutes", 30),
                    "price": f"{s.get('price', {}).get('amount', 0)} {s.get('price', {}).get('currency', 'USD')}",
                    "booking_mode": s.get("booking_mode", "time_slot"),
                }
                for s in services
            ],
        }

    return {
        "business_name": "Schedulux Business",
        "timezone": "UTC",
        "currency": "USD",
        "services": [],
    }


def _build_system_prompt(tenant_id: str, agent_id: str, biz_context: dict[str, Any]) -> str:
    now_iso = datetime.now(UTC).strftime("%Y-%m-%d %H:%M:%S UTC")
    services_list = json.dumps(biz_context.get("services", []), indent=2)

    return f"""You are the friendly, professional AI Booking Concierge for {biz_context.get('business_name')}.
Your sole mission is to assist customers with discovering available services, checking real-time availability, and completing appointment bookings.

[Context]
Current UTC Time: {now_iso}
Business Timezone: {biz_context.get('timezone')}
Tenant ID: {tenant_id}
Agent ID: {agent_id}

[Services Catalog]
{services_list}

[Guidelines & Protocol]
1. Warm Greeting & Guidance: Be polite, welcoming, and concise. Explain services if asked.
2. Checking Availability:
   - When a user wants to book or asks for open times, match their request to the appropriate service_id from the catalog.
   - Use the `check_availability` tool to query real-time slots. NEVER invent, estimate, or hallucinate available times.
   - If no specific date is mentioned, check today and upcoming days.
   - Present available slots clearly to the customer.
3. Booking Confirmation Requirements:
   - Before confirming a booking, ensure you have:
     a) Desired Service (`service_id`)
     b) Specific Start Time (`start_time` in ISO format, e.g. 2026-10-30T10:00:00Z)
     c) Customer's Full Name
     d) Customer's Mobile Phone Number
   - If any of these are missing, ask the customer for them politely before calling the booking tool.
4. Calling `book_appointment`:
   - Pass tenant_id="{tenant_id}", agent_id="{agent_id}", the selected service_id, start_time, customer_name, and customer_phone.
   - Once confirmed, share the booking reference code and reassure the customer their appointment is booked!
5. Tone: Helpful, courteous, and efficient.
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
        response_text = (
            final_message.content
            if isinstance(final_message.content, str)
            else str(final_message.content)
        )
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
