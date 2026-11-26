from __future__ import annotations

import json
import os
from typing import Any

from opentelemetry import trace

from agent_orchestrator.adapters.sqs_client import (
    extract_active_trace_context,
    resolve_queue_url,
    send_sqs_message,
)
from agent_orchestrator.clients.redis_client import get_redis_client
from agent_orchestrator.domain.protocols import CrawlerQueue

CRAWL_QUEUE_NAME = os.environ.get("CRAWL_QUEUE_NAME", "knowledge-crawl-queue")

tracer = trace.get_tracer("agent-orchestrator.crawler-queue")


class SqsCrawlerQueue(CrawlerQueue):
    

    def __init__(self, queue_url: str | None = None) -> None:
        self._explicit_url = queue_url

    async def enqueue_crawl(self, tenant_id: str, url: str, job_id: str) -> None:
        queue_url = self._explicit_url or await resolve_queue_url(
            "AWS_SQS_CRAWL_QUEUE_URL",
            "CRAWL_QUEUE_NAME",
            CRAWL_QUEUE_NAME,
        )

        with tracer.start_as_current_span(
            "knowledge.crawl.enqueue",
            kind=trace.SpanKind.PRODUCER,
            attributes={
                "messaging.system": "aws_sqs",
                "messaging.destination.name": CRAWL_QUEUE_NAME,
                "messaging.operation": "publish",
                "tenant.id": tenant_id,
                "crawl.job_id": job_id,
                "crawl.url": url,
            },
        ):
            trace_id, traceparent = extract_active_trace_context()
            payload = {
                "name": "crawl-site",
                "tenant_id": tenant_id,
                "url": url,
                "job_id": job_id,
                "trace_id": trace_id,
                "traceparent": traceparent,
            }
            await send_sqs_message(
                queue_url, payload, trace_id=trace_id, traceparent=traceparent
            )

        try:
            redis = get_redis_client()
            status_data = {
                "status": "active",
                "tenant_id": tenant_id,
                "url": url,
                "job_id": job_id,
                "pages": {},
            }
            await redis.setex(f"crawl:job:{job_id}", 86400, json.dumps(status_data))
        except Exception as e:
            print(
                f"[SqsCrawlerQueue] Warning: Failed to set initial job status in Redis: {e}",
                flush=True,
            )

        print(
            f"[SqsCrawlerQueue] Enqueued crawl job {job_id} to SQS (trace_id={trace_id})",
            flush=True,
        )

    async def get_crawl_job(self, job_id: str) -> tuple[str | None, int, list[dict[str, Any]]]:
        try:
            redis = get_redis_client()
            raw = await redis.get(f"crawl:job:{job_id}")
            if not raw:
                return None, 0, []

            data = json.loads(raw)
            state = data.get("status", "active")
            pages_dict = data.get("pages", {})
            pages = []
            if isinstance(pages_dict, dict):
                for u, md in pages_dict.items():
                    pages.append({"url": u, "markdown": md, "success": True, "error": ""})

            return state, len(pages), pages
        except Exception as e:
            print(f"[SqsCrawlerQueue] Error reading job status {job_id}: {e}", flush=True)
            return None, 0, []

    async def close(self) -> None:
        return None
