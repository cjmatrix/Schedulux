from __future__ import annotations

import json
import os
from typing import Any

import aio_pika
from opentelemetry import trace

from agent_orchestrator.domain.protocols import DocumentIndexingQueue

DOCUMENT_INDEXING_QUEUE_NAME = "knowledge-document-indexing-queue"
DOCUMENT_INDEXING_DLQ_NAME = "knowledge-document-indexing-dlq"

tracer = trace.get_tracer("agent-orchestrator.document-queue")


class RabbitMQDocumentIndexingQueue(DocumentIndexingQueue):
    def __init__(self, rabbitmq_uri: str | None = None):
        self.uri = rabbitmq_uri or os.environ.get(
            "RABBITMQ_URI", "amqp://guest:guest@localhost:5672"
        )
        self._connection: aio_pika.abc.AbstractRobustConnection | None = None
        self._channel: aio_pika.abc.AbstractChannel | None = None

    async def _get_channel(self) -> aio_pika.abc.AbstractChannel:
        doc_indexing_args = {
            "x-dead-letter-exchange": "",
            "x-dead-letter-routing-key": DOCUMENT_INDEXING_DLQ_NAME,
        }
        if self._connection is None or self._connection.is_closed:
            self._connection = await aio_pika.connect_robust(self.uri)
            self._channel = await self._connection.channel()
            await self._channel.declare_queue(DOCUMENT_INDEXING_DLQ_NAME, durable=True)
            await self._channel.declare_queue(
                DOCUMENT_INDEXING_QUEUE_NAME, durable=True, arguments=doc_indexing_args
            )
        elif self._channel is None or self._channel.is_closed:
            self._channel = await self._connection.channel()
            await self._channel.declare_queue(DOCUMENT_INDEXING_DLQ_NAME, durable=True)
            await self._channel.declare_queue(
                DOCUMENT_INDEXING_QUEUE_NAME, durable=True, arguments=doc_indexing_args
            )
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

        with tracer.start_as_current_span(
            "knowledge.document.enqueue",
            kind=trace.SpanKind.PRODUCER,
            attributes={
                "messaging.system": "rabbitmq",
                "messaging.destination.name": DOCUMENT_INDEXING_QUEUE_NAME,
                "messaging.operation": "publish",
                "tenant.id": tenant_id,
                "agent.id": agent_id,
                "document.id": document_id,
                "document.file_name": file_name,
            },
        ) as producer_span:
            ctx = producer_span.get_span_context()
            trace_id = format(ctx.trace_id, "032x") if ctx.is_valid else None
            traceparent = (
                f"00-{trace_id}-{format(ctx.span_id, '016x')}-{ctx.trace_flags:02x}"
                if ctx.is_valid
                else None
            )

            payload = {
                "name": "index-knowledge-document",
                "tenant_id": tenant_id,
                "agent_id": agent_id,
                "document_id": document_id,
                "s3_bucket": s3_bucket,
                "s3_key": s3_key,
                "file_name": file_name,
                "trace_id": trace_id,
                "traceparent": traceparent,
            }

            headers: dict[str, Any] = {}
            if traceparent:
                headers["traceparent"] = traceparent
            if trace_id:
                headers["trace_id"] = trace_id

            await channel.default_exchange.publish(
                aio_pika.Message(
                    body=json.dumps(payload).encode(),
                    delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
                    content_type="application/json",
                    message_id=f"doc_idx_{document_id}",
                    headers=headers,
                ),
                routing_key=DOCUMENT_INDEXING_QUEUE_NAME,
            )

        print(
            f"[RabbitMQDocumentIndexingQueue] Enqueued indexing job for doc '{document_id}' to '{DOCUMENT_INDEXING_QUEUE_NAME}' (trace_id={trace_id})",
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
