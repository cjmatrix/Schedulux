from __future__ import annotations

import json
import logging
from typing import Any

from langchain_core.tools import BaseTool, StructuredTool
from mcp.server.fastmcp import FastMCP

from agent_orchestrator.clients.scheduling_client import create_booking, get_availability
from agent_orchestrator.models import AgentDraft, AgentRuntimeConfig

logger = logging.getLogger(__name__)


mcp = FastMCP("schedulux-scheduling-service")


@mcp.tool()
async def check_availability(
    tenant_id: str,
    agent_id: str,
    service_id: str,
    start_date: str,
    end_date: str | None = None,
    resource_id: str | None = None,
    timezone: str | None = None,
) -> str:
    """Check available appointment time slots for a given service.

    Args:
        tenant_id: The ID of the business/tenant.
        agent_id: The ID of the agent managing the service catalog and schedule.
        service_id: The ID of the service to check availability for.
        start_date: Start date in YYYY-MM-DD format.
        end_date: Optional end date in YYYY-MM-DD format (for range lookup).
        resource_id: Optional specific staff or resource ID requested by customer.
        timezone: Optional customer timezone string (e.g. 'UTC', 'America/New_York').

    Returns:
        JSON string containing available dates, operating hours, and open time slots.
    """
    logger.info(
        "[MCP Tool check_availability] tenant=%s, agent=%s, service=%s, start_date=%s",
        tenant_id,
        agent_id,
        service_id,
        start_date,
    )
    result = await get_availability(
        tenant_id=tenant_id,
        agent_id=agent_id,
        service_id=service_id,
        start_date=start_date,
        end_date=end_date,
        resource_id=resource_id,
        timezone=timezone,
    )

    if not result.get("success"):
        return json.dumps(
            {
                "status": "error",
                "message": result.get("error", "Failed to retrieve availability slots"),
            }
        )

    available_days = []
    for day in result.get("days", []):
        open_slots = [
            {"start": s["start_time"], "end": s["end_time"]}
            for s in day.get("slots", [])
            if s.get("available")
        ]
        available_days.append(
            {
                "date": day["date"],
                "is_closed": day["is_closed"],
                "closure_reason": day.get("closure_reason"),
                "total_available_slots": len(open_slots),
                "slots": open_slots[:30],
            }
        )

    print(available_days)
    return json.dumps(
        {
            "status": "success",
            "service_id": result.get("service_id"),
            "booking_mode": result.get("booking_mode", "time_slot"),
            "timezone": result.get("timezone", "UTC"),
            "days": available_days,
        },
        indent=2,
    )


@mcp.tool()
async def book_appointment(
    tenant_id: str,
    agent_id: str,
    service_id: str,
    start_time: str,
    customer_name: str,
    customer_phone: str,
    customer_email: str | None = None,
    end_time: str | None = None,
    resource_id: str | None = None,
    notes: str | None = None,
) -> str:
    """Create and confirm an appointment booking for a customer.

    Call this tool ONLY when you have obtained:
    1. The customer's desired service
    2. A valid start date and time
    3. The customer's full name
    4. The customer's phone number

    Args:
        tenant_id: The ID of the business/tenant.
        agent_id: The ID of the agent managing the booking.
        service_id: The ID of the service being booked.
        start_time: Appointment start time in ISO 8601 format (e.g. 2026-10-30T14:00:00Z).
        customer_name: Full name of the customer.
        customer_phone: Valid mobile phone number of the customer.
        customer_email: Optional email address.
        end_time: Optional appointment end time (required for date_range bookings).
        resource_id: Optional specific staff or resource ID requested.
        notes: Optional customer requests or notes.

    Returns:
        JSON string containing the booking confirmation, booking reference code, and status.
    """
    logger.info(
        "[MCP Tool book_appointment] tenant=%s, service=%s, customer=%s, phone=%s, time=%s",
        tenant_id,
        service_id,
        customer_name,
        customer_phone,
        start_time,
    )
    result = await create_booking(
        tenant_id=tenant_id,
        service_id=service_id,
        start_time=start_time,
        customer_name=customer_name,
        customer_phone=customer_phone,
        customer_email=customer_email,
        end_time=end_time,
        resource_id=resource_id,
        notes=notes,
        agent_id=agent_id,
    )

    if not result.get("success"):
        return json.dumps(
            {
                "status": "failed",
                "error": result.get("error", "Failed to confirm booking"),
            }
        )

    bk = result.get("booking", {})
    return json.dumps(
        {
            "status": "confirmed",
            "message": "Appointment successfully confirmed!",
            "booking_id": bk.get("booking_id"),
            "booking_reference": bk.get("booking_reference"),
            "start_time": bk.get("start_time"),
            "end_time": bk.get("end_time"),
            "deposit_status": bk.get("deposit_status"),
            "price": bk.get("price"),
        },
        indent=2,
    )


async def _load_tenant_resources(tenant_id: str, agent_id: str) -> list[dict[str, Any]]:
    """Load resources directly from the local CQRS Read Model (AgentRuntimeConfig / AgentDraft)."""
    query: dict[str, Any] = {"tenant_id": tenant_id, "agent_id": agent_id}

    runtime = await AgentRuntimeConfig.find_one(query)
    resources: list[dict[str, Any]] = []

    if runtime and runtime.resources:
        for r in runtime.resources:
            r_type = (
                r.resource_type.value
                if hasattr(r.resource_type, "value")
                else str(r.resource_type or "staff")
            )
            d_status = (
                r.dispatch_status.value
                if hasattr(r.dispatch_status, "value")
                else str(r.dispatch_status or "active")
            )
            resources.append(
                {
                    "resource_id": r.resource_id,
                    "name": r.name,
                    "title": r.title or "",
                    "category": r.category or "General",
                    "description": r.description or "",
                    "resource_type": r_type,
                    "is_bookable": r.is_bookable,
                    "dispatch_status": d_status,
                }
            )

    if not resources:
        draft = await AgentDraft.find_one(query)
        if draft and draft.current_draft:
            raw_resources = draft.current_draft.get("resources") or []
            if isinstance(raw_resources, list):
                for r in raw_resources:
                    if not isinstance(r, dict):
                        continue
                    resources.append(
                        {
                            "resource_id": r.get("resource_id", ""),
                            "name": r.get("name", "Unnamed"),
                            "title": r.get("title", ""),
                            "category": r.get("category", "General"),
                            "description": r.get("description", ""),
                            "resource_type": str(r.get("resource_type", "staff")),
                            "is_bookable": bool(r.get("is_bookable", True)),
                            "dispatch_status": str(r.get("dispatch_status", "active")),
                        }
                    )

    return resources


@mcp.tool()
async def search_resources(
    tenant_id: str,
    agent_id: str,
    query: str | None = None,
    resource_id: str | None = None,
    resource_type: str | None = None,
) -> str:
    """Search and get detailed information about staff, providers, rooms, or equipment.

    Use this tool when the customer asks:
    - Detailed questions about a specific doctor, stylist, or provider (e.g. bio, background, qualifications, specialties).
    - Which staff members or resources exist for a particular specialty, category, or title.
    - Information about rooms, chairs, or equipment.

    Args:
        tenant_id: The ID of the business/tenant.
        agent_id: The ID of the agent managing the resources.
        query: Optional search keyword to filter by name, title, category, or description.
        resource_id: Optional exact resource ID to retrieve a single resource's full details.
        resource_type: Optional filter by resource type ('staff', 'room', 'chair', 'bay', 'equipment', 'asset', 'vehicle').

    Returns:
        JSON string containing matching resources with their name, title, category, description, and status.
    """
    logger.info(
        "[MCP Tool search_resources (CQRS Local Read)] tenant=%s, query=%s, resource_id=%s, type=%s",
        tenant_id,
        query,
        resource_id,
        resource_type,
    )

    all_resources = await _load_tenant_resources(tenant_id=tenant_id, agent_id=agent_id)

    if resource_id:
        match = next((r for r in all_resources if r["resource_id"] == resource_id), None)
        if not match:
            return json.dumps(
                {
                    "status": "not_found",
                    "message": f"Resource {resource_id} not found in tenant catalog",
                }
            )
        return json.dumps(
            {
                "status": "success",
                "resource": match,
            },
            indent=2,
        )

    filtered = [r for r in all_resources if r.get("is_bookable", True)]

    if resource_type:
        rt = resource_type.lower().strip()
        filtered = [r for r in filtered if r.get("resource_type", "").lower() == rt]

    if query:
        q = query.lower().strip()
        filtered = [
            r
            for r in filtered
            if q in r.get("name", "").lower()
            or q in r.get("title", "").lower()
            or q in r.get("category", "").lower()
            or q in r.get("description", "").lower()
        ]

    return json.dumps(
        {
            "status": "success",
            "total_matches": len(filtered),
            "resources": filtered[:20],
        },
        indent=2,
    )


def get_scheduling_mcp_tools() -> list[BaseTool]:
    """Convert FastMCP server tools into standard LangChain StructuredTools safely."""
    tools: list[BaseTool] = []

    mcp_tools = mcp._tool_manager.list_tools() if hasattr(mcp, "_tool_manager") else []
    for mcp_tool in mcp_tools:

        def _make_caller(tool_name: str):
            async def _execute_mcp_tool(**kwargs: Any) -> str:
                res = await mcp.call_tool(tool_name, arguments=kwargs)
                contents = res[0] if isinstance(res, tuple) else res
                if isinstance(contents, list):
                    return "".join([c.text for c in contents if hasattr(c, "text")])
                return str(res)

            return _execute_mcp_tool

        tools.append(
            StructuredTool(
                name=mcp_tool.name,
                description=mcp_tool.description or "",
                coroutine=_make_caller(mcp_tool.name),
                args_schema=mcp_tool.fn_metadata.arg_model,
            )
        )

    return tools


if __name__ == "__main__":
    mcp.run(transport="stdio")
