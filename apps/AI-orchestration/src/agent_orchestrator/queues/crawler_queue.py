from __future__ import annotations

import json
import os
from typing import Any

import aio_pika

from agent_orchestrator.redis_client import get_redis_client

CRAWL_QUEUE_NAME = "knowledge-crawl-queue"


class RabbitMQCrawlerQueue:
    def __init__(self, rabbitmq_uri: str | None = None):
        self.uri = rabbitmq_uri or os.environ.get(
            "RABBITMQ_URI", "amqp://guest:guest@localhost:5672"
        )
        self._connection: aio_pika.abc.AbstractRobustConnection | None = None
        self._channel: aio_pika.abc.AbstractChannel | None = None

    async def _get_channel(self) -> aio_pika.abc.AbstractChannel:
        if self._connection is None or self._connection.is_closed:
            self._connection = await aio_pika.connect_robust(self.uri)
            self._channel = await self._connection.channel()
            await self._channel.declare_queue(CRAWL_QUEUE_NAME, durable=True)
        elif self._channel is None or self._channel.is_closed:
            self._channel = await self._connection.channel()
            await self._channel.declare_queue(CRAWL_QUEUE_NAME, durable=True)
        return self._channel

    async def enqueue_crawl(self, tenant_id: str, url: str, job_id: str) -> None:
        channel = await self._get_channel()
        payload = {
            "name": "crawl-site",
            "tenant_id": tenant_id,
            "url": url,
            "job_id": job_id,
        }

        await channel.default_exchange.publish(
            aio_pika.Message(
                body=json.dumps(payload).encode(),
                delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
                content_type="application/json",
                message_id=job_id,
            ),
            routing_key=CRAWL_QUEUE_NAME,
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
                f"[RabbitMQCrawlerQueue] Warning: Failed to set initial job status in Redis: {e}",
                flush=True,
            )

        print(
            f"[RabbitMQCrawlerQueue] Enqueued crawl job {job_id} to '{CRAWL_QUEUE_NAME}'",
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
            print(f"[RabbitMQCrawlerQueue] Error reading job status {job_id}: {e}", flush=True)
            return None, 0, []

    async def close(self) -> None:
        try:
            if self._channel and not self._channel.is_closed:
                await self._channel.close()
            if self._connection and not self._connection.is_closed:
                await self._connection.close()
        except Exception:
            pass


BullMQCrawlerQueue = RabbitMQCrawlerQueue
