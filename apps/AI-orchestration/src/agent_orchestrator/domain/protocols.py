from __future__ import annotations

from datetime import datetime
from typing import Any, Protocol

from agent_orchestrator.models import AgentDraft, AgentMessage, AgentRuntimeConfig


class MessageRepository(Protocol):
    async def get_messages(
        self, tenant_id: str, agent_id: str, before: datetime | None, limit: int
    ) -> tuple[list[AgentMessage], bool, str | None]: ...

    async def save_message(
        self, tenant_id: str, agent_id: str, role: str, content: str
    ) -> AgentMessage: ...

    async def count_messages(self, tenant_id: str, agent_id: str) -> int: ...

    async def get_latest_agent_message(
        self, tenant_id: str, agent_id: str
    ) -> AgentMessage | None: ...


class DraftRepository(Protocol):
    async def get_agent_draft(self, tenant_id: str, agent_id: str) -> AgentDraft | None: ...

    async def list_drafts(self, tenant_id: str) -> list[AgentDraft]: ...

    async def upsert_agent_draft(
        self,
        tenant_id: str,
        agent_id: str,
        name: str,
        creation_source: str,
        draft_dict: dict[str, Any],
    ) -> AgentDraft: ...


class RuntimeConfigRepository(Protocol):
    async def get_runtime_config(
        self, tenant_id: str, agent_id: str
    ) -> AgentRuntimeConfig | None: ...

    async def list_runtime_configs(self, tenant_id: str) -> list[AgentRuntimeConfig]: ...


class CacheRepository(Protocol):
    async def get_cached_draft(self, tenant_id: str, agent_id: str) -> dict[str, Any] | None: ...

    async def set_cached_draft(
        self, tenant_id: str, agent_id: str, draft: dict[str, Any]
    ) -> None: ...

    async def get_raw_crawl_draft(self, tenant_id: str) -> str | None: ...


class CrawlerQueue(Protocol):
    async def enqueue_crawl(self, tenant_id: str, url: str, job_id: str) -> None: ...

    async def get_crawl_job(self, job_id: str) -> tuple[str | None, int, list[dict[str, Any]]]: ...

    async def close(self) -> None: ...


class MemoryQueue(Protocol):
    async def enqueue_summarization_job(
        self, tenant_id: str, agent_id: str, total_count: int, cutoff_seq: int
    ) -> None: ...

    async def close(self) -> None: ...


class AgentOrchestrator(Protocol):
    async def start_session(
        self, tenant_id: str, initial_draft: dict[str, Any], agent_id: str
    ) -> dict[str, Any]: ...

    async def resume_session(
        self, tenant_id: str, user_answer: str, agent_id: str
    ) -> dict[str, Any]: ...

    async def get_current_draft(self, tenant_id: str, agent_id: str) -> dict[str, Any] | None: ...
