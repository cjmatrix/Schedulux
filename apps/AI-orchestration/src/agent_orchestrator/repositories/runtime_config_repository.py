from __future__ import annotations

from agent_orchestrator.models import AgentRuntimeConfig


class MongoRuntimeConfigRepository:
    async def get_runtime_config(self, tenant_id: str, agent_id: str) -> AgentRuntimeConfig | None:
        return await AgentRuntimeConfig.find_one({"tenant_id": tenant_id, "agent_id": agent_id})

    async def list_runtime_configs(self, tenant_id: str) -> list[AgentRuntimeConfig]:
        return await AgentRuntimeConfig.find({"tenant_id": tenant_id}).to_list()
