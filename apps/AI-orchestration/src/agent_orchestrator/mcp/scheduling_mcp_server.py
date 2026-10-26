from __future__ import annotations

import json
import logging
from typing import Any

from langchain_core.tools import BaseTool, StructuredTool
from mcp.server.fastmcp import FastMCP

from agent_orchestrator.clients.scheduling_client import create_booking, get_availability

logger = logging.getLogger(__name__)


mcp = FastMCP("schedulux-scheduling-service")


@mcp.tool()
async def check_availability(
    tenant_id: str,
    service_id: str,
    start_date: str,
    end_date: str | None = None,
    resource_id: str | None = None,
    timezone: str | None = None,
    agent_id: str | None = None,
) -> str:
    """Check available appointment time slots for a given service.
    
    Args:
        tenant_id: The ID of the business/tenant.
        service_id: The ID of the service to check availability for.
        start_date: Start date in YYYY-MM-DD format.
        end_date: Optional end date in YYYY-MM-DD format (for range lookup).
        resource_id: Optional specific staff or resource ID requested by customer.
        timezone: Optional customer timezone string (e.g. 'UTC', 'America/New_York').
        agent_id: Optional agent ID.
    
    Returns:
        JSON string containing available dates, operating hours, and open time slots.
    """
    logger.info(
        "[MCP Tool check_availability] tenant=%s, service=%s, start_date=%s",
        tenant_id,
        service_id,
        start_date,
    )
    result = await get_availability(
        tenant_id=tenant_id,
        service_id=service_id,
        start_date=start_date,
        end_date=end_date,
        resource_id=resource_id,
        timezone=timezone,
        agent_id=agent_id,
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
    service_id: str,
    start_time: str,
    customer_name: str,
    customer_phone: str,
    customer_email: str | None = None,
    end_time: str | None = None,
    resource_id: str | None = None,
    notes: str | None = None,
    agent_id: str | None = None,
) -> str:
    """Create and confirm an appointment booking for a customer.
    
    Call this tool ONLY when you have obtained:
    1. The customer's desired service
    2. A valid start date and time
    3. The customer's full name
    4. The customer's phone number
    
    Args:
        tenant_id: The ID of the business/tenant.
        service_id: The ID of the service being booked.
        start_time: Appointment start time in ISO 8601 format (e.g. 2026-10-30T14:00:00Z).
        customer_name: Full name of the customer.
        customer_phone: Valid mobile phone number of the customer.
        customer_email: Optional email address.
        end_time: Optional appointment end time (required for date_range bookings).
        resource_id: Optional specific staff or resource ID requested.
        notes: Optional customer requests or notes.
        agent_id: Optional agent ID.
    
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




def get_scheduling_mcp_tools() -> list[BaseTool]:
    """Convert FastMCP server tools into standard LangChain StructuredTools safely."""
    tools: list[BaseTool] = []

  
    for mcp_tool in mcp.tools:
        
        def _make_caller(tool_name: str):
            async def _execute_mcp_tool(**kwargs: Any) -> str:
               
                contents = await mcp.call_tool(tool_name, arguments=kwargs)
                
               
                return "".join([c.text for c in contents if hasattr(c, "text")])

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
