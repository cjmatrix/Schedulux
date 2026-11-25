from __future__ import annotations

from datetime import datetime
from typing import Any

from beanie import Document
from pydantic import ConfigDict, Field, model_validator
from pydantic_core import PydanticUndefined
from pymongo import IndexModel

from agent_orchestrator.models.base import (
    BusinessProfileEmbed,
    GuardrailsEmbed,
    LlmEngineEmbed,
    OperatingHoursEmbed,
    ResourceEmbed,
    SchedulingEngineEmbed,
    ServiceEmbed,
    WidgetConfigEmbed,
)


class AgentRuntimeConfig(Document):
    model_config = ConfigDict(extra="ignore")

    @model_validator(mode="before")
    @classmethod
    def drop_nulls_for_defaulted_fields(cls, data: Any) -> Any:
        if not isinstance(data, dict):
            return data
        cleaned = {}
        for k, v in data.items():
            field_info = cls.model_fields.get(k)
            if v is None and field_info is not None:
                has_default = (
                    field_info.default is not PydanticUndefined and field_info.default is not ...
                )
                has_default_factory = field_info.default_factory is not None
                if has_default or has_default_factory:
                    continue
            cleaned[k] = v
        return cleaned

    schema_version: str = "2.4"
    status: str = "draft"
    tenant_id: str
    agent_id: str | None = None
    creation_source: str = "custom"

    compiled_at: datetime = Field(default_factory=datetime.utcnow)

    business_profile: BusinessProfileEmbed | None = None
    widget_config: WidgetConfigEmbed | None = None
    llm_engine: LlmEngineEmbed | None = None
    supervisor_prompt: str | None = None
    scheduling_engine: SchedulingEngineEmbed | None = None
    operating_hours: OperatingHoursEmbed | None = None

    resources: list[ResourceEmbed] = Field(default_factory=list)
    services: list[ServiceEmbed] = Field(default_factory=list)

    guardrails: GuardrailsEmbed | None = None

    class Settings:
        name = "agent_runtime_configs"
        indexes = [
            IndexModel([("tenant_id", 1), ("status", 1)], name="idx_tenant_status"),
            IndexModel([("agent_id", 1)], unique=True, sparse=True, name="idx_agent_id"),
            IndexModel(
                [("tenant_id", 1), ("status", 1), ("compiled_at", -1)], name="idx_tenant_latest"
            ),
        ]
