from __future__ import annotations

import json
import os

import aio_pika

from agent_orchestrator.domain.protocols import DocumentIndexingQueue

DOCUMENT_INDEXING_QUEUE_NAME = "knowledge-document-indexing-queue"


class RabbitMQDocumentIndexingQueue(DocumentIndexingQueue):
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
            await self._channel.declare_queue(DOCUMENT_INDEXING_QUEUE_NAME, durable=True)
        elif self._channel is None or self._channel.is_closed:
            self._channel = await self._connection.channel()
            await self._channel.declare_queue(DOCUMENT_INDEXING_QUEUE_NAME, durable=True)
        return self._channel

    async def enqueue_indexing(
        self,
        tenant_id: str,
        agent_id: str,
        document_id: str,
        s3_bucket: str,
        s3_key: str,
        file_name: str,
    ) -> None:
        channel = await self._get_channel()
        payload = {
            "name": "index-knowledge-document",
            "tenant_id": tenant_id,
            "agent_id": agent_id,
            "document_id": document_id,
            "s3_bucket": s3_bucket,
            "s3_key": s3_key,
            "file_name": file_name,
        }

        await channel.default_exchange.publish(
            aio_pika.Message(
                body=json.dumps(payload).encode(),
                delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
                content_type="application/json",
                message_id=f"doc_idx_{document_id}",
            ),
            routing_key=DOCUMENT_INDEXING_QUEUE_NAME,
        )
        print(
            f"[RabbitMQDocumentIndexingQueue] Enqueued indexing job for doc '{document_id}' to '{DOCUMENT_INDEXING_QUEUE_NAME}'",
            flush=True,
        )

    async def close(self) -> None:
        try:
            if self._channel and not self._channel.is_closed:
                await self._channel.close()
            if self._connection and not self._connection.is_closed:
                await self._connection.close()
        except Exception:
            pass
