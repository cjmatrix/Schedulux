from __future__ import annotations

import json
import secrets
from typing import Any

from agent_orchestrator.domain.exceptions import InvalidDraftException
from agent_orchestrator.domain.protocols import (
    CacheRepository,
    DraftRepository,
    RuntimeConfigRepository,
)
from agent_orchestrator.domain.templates import build_default_agent_template
from agent_orchestrator.services.protocols import (
    AgentManagementServiceProtocol,
    AgentSummaryDTO,
)


class AgentManagementService(AgentManagementServiceProtocol):
    def __init__(
        self,
        draft_repo: DraftRepository,
        runtime_repo: RuntimeConfigRepository,
        cache_repo: CacheRepository,
    ):
        self.draft_repo = draft_repo
        self.runtime_repo = runtime_repo
        self.cache_repo = cache_repo

    async def save_initial_draft(
        self, tenant_id: str, creation_source: str, draft_json: str | None, name: str | None
    ) -> tuple[str, str]:
        source = (creation_source or "web_crawl").strip().lower()
        agent_id = f"agent_{secrets.token_urlsafe(16)}"
        draft_dict: dict[str, Any] = {}

        if source == "web_crawl":
            redis_draft = await self.cache_repo.get_raw_crawl_draft(tenant_id)
            if redis_draft:
                draft_dict = json.loads(redis_draft)
            elif draft_json:
                draft_dict = json.loads(draft_json)
            else:
                raise InvalidDraftException(
                    f"No draft schema found for tenant {tenant_id} in Redis or request payload"
                )
            draft_dict["agent_id"] = agent_id
        else:
            draft_dict = build_default_agent_template(
                tenant_id=tenant_id,
                agent_id=agent_id,
                vertical=source,
                name=name,
            )

        draft_dict["tenant_id"] = tenant_id
        draft_dict["agent_id"] = agent_id
        from agent_orchestrator.models import canonicalize_agent_schema

        draft_dict = canonicalize_agent_schema(draft_dict, status="draft")

        bp = draft_dict.get("business_profile")
        bp_name = bp.get("name") if isinstance(bp, dict) else None
        final_name = name or bp_name or "Primary Assistant"

        await self.draft_repo.upsert_agent_draft(
            tenant_id=tenant_id,
            agent_id=agent_id,
            name=final_name,
            creation_source=source,
            draft_dict=draft_dict,
        )

        try:
            await self.cache_repo.set_cached_draft(tenant_id, agent_id, draft_dict)
        except Exception as re:
            print(
                f"[AgentManagementService] Warning: Failed to cache draft in Redis: {re}",
                flush=True,
            )

        return agent_id, "pending"

    async def list_tenant_agents(self, tenant_id: str) -> list[AgentSummaryDTO]:
        agents_map: dict[str, AgentSummaryDTO] = {}

        drafts = await self.draft_repo.list_drafts(tenant_id)
        drafts_map = {d.agent_id: d for d in drafts}

        created_configs = await self.runtime_repo.list_runtime_configs(tenant_id)
        for cfg in created_configs:
            aid = cfg.agent_id or str(cfg.id)
            bp = cfg.business_profile
            name = (bp.name if bp else None) or "Active Agent"

            source = None
            if aid in drafts_map and drafts_map[aid].creation_source:
                source = drafts_map[aid].creation_source
            elif getattr(cfg, "creation_source", None) and cfg.creation_source != "custom":
                source = cfg.creation_source
            elif bp and getattr(bp, "vertical", None):
                source = bp.vertical
            elif getattr(cfg, "creation_source", None):
                source = cfg.creation_source
            else:
                source = "web_crawl"

            agents_map[aid] = AgentSummaryDTO(
                agent_id=aid,
                name=name,
                status="created",
                creation_source=source,
                services_count=len(cfg.services) if cfg.services else 0,
                updated_at=cfg.compiled_at.isoformat() if cfg.compiled_at else "",
                created_at=cfg.compiled_at.isoformat() if cfg.compiled_at else "",
            )

        for d in drafts:
            if d.agent_id in agents_map:
                continue
            d_services = (
                d.current_draft.get("services") if isinstance(d.current_draft, dict) else None
            )
            services_count = len(d_services) if isinstance(d_services, list) else 0
            agents_map[d.agent_id] = AgentSummaryDTO(
                agent_id=d.agent_id,
                name=d.name or "Draft Agent",
                status="pending",
                creation_source=d.creation_source or "web_crawl",
                services_count=services_count,
                updated_at=d.updated_at.isoformat() if d.updated_at else "",
                created_at=d.created_at.isoformat() if d.created_at else "",
            )

        return sorted(
            list(agents_map.values()),
            key=lambda x: x.updated_at or x.created_at,
            reverse=True,
        )
