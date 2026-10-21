from __future__ import annotations

import secrets
from dataclasses import dataclass
from typing import Any

from agent_orchestrator.domain.exceptions import CrawlJobNotFoundException
from agent_orchestrator.domain.protocols import CrawlerQueue


@dataclass
class CrawlResultDTO:
    job_id: str
    status: str
    pages_crawled: int
    pages: list[dict[str, Any]]


class CrawlerService:
    def __init__(self, queue: CrawlerQueue):
        self.queue = queue

    async def crawl_site(self, tenant_id: str, url: str) -> str:
        job_id = f"crawl_{secrets.token_urlsafe(12)}"
        await self.queue.enqueue_crawl(tenant_id, url, job_id)
        return job_id

    async def get_crawl_status(self, job_id: str) -> CrawlResultDTO:
        state, pages_crawled, pages = await self.queue.get_crawl_job(job_id)
        if state is None:
            raise CrawlJobNotFoundException(f"Crawl job not found: {job_id}")

        return CrawlResultDTO(
            job_id=job_id,
            status=state,
            pages_crawled=pages_crawled,
            pages=pages,
        )

    async def close(self) -> None:
        await self.queue.close()
