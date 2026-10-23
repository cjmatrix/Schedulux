from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Protocol


@dataclass
class CrawlResultDTO:
    job_id: str
    status: str
    pages_crawled: int
    pages: list[dict[str, Any]]


@dataclass
class ChatMessageDTO:
    id: str
    tenant_id: str
    agent_id: str
    role: str
    content: str
    created_at: str


@dataclass
class ChatHistoryResult:
    messages: list[ChatMessageDTO]
    next_cursor: str
    has_more: bool


@dataclass
class AgentSummaryDTO:
    agent_id: str
    name: str
    status: str
    creation_source: str
    services_count: int
    updated_at: str
    created_at: str


@dataclass
class OnboardingResult:
    status: str
    question: str
    field: str
    type: str
    draft_schema_json: str
    live_schema_json: str = "{}"


class CrawlerServiceProtocol(Protocol):
    async def crawl_site(self, tenant_id: str, url: str) -> str: ...
    async def get_crawl_status(self, job_id: str) -> CrawlResultDTO: ...
    async def close(self) -> None: ...


class ChatServiceProtocol(Protocol):
    async def get_history(
        self, tenant_id: str, agent_id: str, before_iso: str | None, limit: int
    ) -> ChatHistoryResult: ...


class AgentManagementServiceProtocol(Protocol):
    async def save_initial_draft(
        self, tenant_id: str, creation_source: str, draft_json: str | None, name: str | None
    ) -> tuple[str, str]: ...
    async def list_tenant_agents(self, tenant_id: str) -> list[AgentSummaryDTO]: ...


class OnboardingServiceProtocol(Protocol):
    async def start_session(
        self, tenant_id: str, agent_id: str, initial_draft_json: str | None = None
    ) -> OnboardingResult: ...
    async def resume_session(
        self, tenant_id: str, agent_id: str, user_answer: str
    ) -> OnboardingResult: ...


class MemoryServiceProtocol(Protocol):
    async def check_and_trigger_memory(self, tenant_id: str, agent_id: str) -> bool: ...
    async def consolidate_memory(
        self, tenant_id: str, agent_id: str, cutoff_seq: int
    ) -> dict[str, Any]: ...
