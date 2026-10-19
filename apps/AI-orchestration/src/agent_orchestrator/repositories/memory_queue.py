from __future__ import annotations

import os
from typing import Optional
from bullmq import Queue
from agent_orchestrator.config import AGENT_MEMORY_QUEUE_NAME


class BullMQMemoryQueue:
    def __init__(self, redis_uri: Optional[str] = None):
        uri = redis_uri or os.environ.get("REDIS_URI", "redis://localhost:6379")
        self.queue = Queue(AGENT_MEMORY_QUEUE_NAME, {"connection": uri})

    async def enqueue_summarization_job(
        self, tenant_id: str, agent_id: str, total_count: int, cutoff_seq: int
    ) -> None:
        job_id = f"mem_{tenant_id}_{agent_id}_{cutoff_seq}"
        await self.queue.add(
            "consolidate_memory",
            {
                "tenant_id": tenant_id,
                "agent_id": agent_id,
                "total_count": total_count,
                "cutoff_seq": cutoff_seq,
            },
            {"jobId": job_id, "removeOnComplete": True, "removeOnFail": False},
        )
        print(f"[BullMQMemoryQueue] Enqueued memory job {job_id} for agent {agent_id} (cutoff: {cutoff_seq})", flush=True)

    async def close(self) -> None:
        try:
            await self.queue.close()
        except Exception:
            pass
