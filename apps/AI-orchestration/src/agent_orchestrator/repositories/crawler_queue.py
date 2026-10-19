from __future__ import annotations

import os
from typing import Optional, List, Tuple, Dict, Any
from bullmq import Queue


class BullMQCrawlerQueue:
    def __init__(self, redis_uri: Optional[str] = None):
        uri = redis_uri or os.environ.get("REDIS_URI", "redis://localhost:6379")
        self.queue = Queue("knowledge-crawl-queue", {"connection": uri})

    async def enqueue_crawl(self, tenant_id: str, url: str, job_id: str) -> None:
        await self.queue.add(
            "crawl-site",
            {"tenant_id": tenant_id, "url": url, "job_id": job_id},
            {"jobId": job_id, "removeOnComplete": False, "removeOnFail": False},
        )

    async def get_crawl_job(self, job_id: str) -> Tuple[Optional[str], int, List[Dict[str, Any]]]:
        job = await self.queue.getJob(job_id)
        if not job:
            return None, 0, []

        state = await job.getState()
        pages = []
        if state == "completed" and job.returnvalue:
            for url, markdown in job.returnvalue.items():
                pages.append({"url": url, "markdown": markdown, "success": True, "error": ""})

        return state, len(pages), pages

    async def close(self) -> None:
        try:
            await self.queue.close()
        except Exception:
            pass
