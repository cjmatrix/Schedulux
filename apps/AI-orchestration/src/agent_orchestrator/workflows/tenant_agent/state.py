from __future__ import annotations

from typing import Annotated, Any, Literal
from langgraph.graph.message import add_messages
from pydantic import BaseModel, Field
from typing_extensions import TypedDict

from agent_orchestrator.models import StrictDraftPatchValidator


class GraphState(TypedDict):
    tenant_id: str
    agent_id: str | None
    draft: dict[str, Any]
    messages: Annotated[list, add_messages]
    structural_gaps: list[dict]
    pending_field: str | None
    semantic_note: str | None
    decision: str | None
    pending_draft_update: dict[str, Any] | None
    status: str
    patch_retries: int


STRUCTURAL_REQUIREMENTS: list[dict] = [
    {
        "field": "business_profile.name",
        "question": "What is the name of your business?",
        "type": "scalar",
    },
    {
        "field": "business_profile.vertical",
        "question": (
            "What industry are you in? "
            "(e.g. medical_dental, auto_repair, lodging, salon, legal, custom)"
        ),
        "type": "scalar",
    },
    {
        "field": "business_profile.timezone",
        "question": "What timezone are your operating hours in? (e.g. Asia/Kolkata, America/New_York)",
        "type": "scalar",
    },
    {
        "field": "business_profile.contact.public_phone",
        "question": "What is your public contact phone number?",
        "type": "scalar",
    },
    {
        "field": "operating_hours",
        "question": (
            "What are your operating hours? "
            "Describe your weekly schedule (e.g. Mon-Fri 9am-6pm, Sat 10am-2pm, closed Sun)."
        ),
        "type": "operating_hours",
    },
    {
        "field": "services",
        "question": (
            "Please tell me about your first service — its name, duration in minutes, "
            "cleanup/buffer time in minutes, and price."
        ),
        "type": "services_present",
    },
    {
        "field": "services[*].name",
        "question": "What is the name of this service?",
        "type": "per_service",
        "attr": "name",
    },
    {
        "field": "services[*].duration_minutes",
        "question": "How many minutes does '{service_name}' take?",
        "type": "per_service",
        "attr": "duration_minutes",
    },
    {
        "field": "services[*].buffer_minutes",
        "question": "How many minutes of cleanup/buffer time after '{service_name}'? (enter 0 if none)",
        "type": "per_service",
        "attr": "buffer_minutes",
    },
    {
        "field": "services[*].price.amount",
        "question": "What is the price of '{service_name}'? (enter 0 if free)",
        "type": "per_service_nested",
        "attr": "price.amount",
    },
    {
        "field": "services[*].resource_requirements",
        "question": "Who or what delivers '{service_name}'? (Please assign at least one staff member, doctor, room, or equipment so customers can book it)",
        "type": "per_service_requirements",
    },
    {
        "field": "resources",
        "question": (
            "Who or what delivers your services? "
            "Please tell me about at least one staff member or bookable resource "
            "(e.g. staff member name and role, or room/bay/chair name)."
        ),
        "type": "resources_present",
    },
]


class SemanticAction(BaseModel):
    action: Literal["update_schema", "ask_user", "finalize"] = Field(
        description="Action to take based on current state"
    )
    question: str = Field(
        description=(
            "MANDATORY. The conversational response and follow-up question sent to the user. "
            "Must ALWAYS be a non-empty string. "
            "When updating the schema ('update_schema'): briefly acknowledge the applied changes (1 sentence) "
            "AND proactively ask the next specific question from the deployment checklist or suggest an optional feature. "
            "For 'ask_user': ask a specific, contextual follow-up question based on what is missing in the draft. "
            "For 'finalize': confirm the save and summarise next steps. "
            "NEVER leave this field empty or null."
        ),
    )
    draft_update: StrictDraftPatchValidator | None = Field(
        default=None,
        description=(
            "Structured partial draft containing any configuration updates to merge into the draft. "
            "Use this whenever the user provides services, staff/resources, hours, prices, or business details."
        ),
    )

