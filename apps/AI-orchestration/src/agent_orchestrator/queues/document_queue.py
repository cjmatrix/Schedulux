from __future__ import annotations

import os

from opentelemetry import trace

from agent_orchestrator.adapters.sqs_client import (
    extract_active_trace_context,
    resolve_queue_url,
    send_sqs_message,
)
from agent_orchestrator.domain.protocols import DocumentIndexingQueue

DOCUMENT_INDEXING_QUEUE_NAME = os.environ.get(
    "DOCUMENT_INDEXING_QUEUE_NAME", "knowledge-document-indexing-queue"
)

tracer = trace.get_tracer("agent-orchestrator.document-queue")


class SqsDocumentIndexingQueue(DocumentIndexingQueue):
    """DocumentIndexingQueue implementation backed by AWS SQS."""

    def __init__(self, queue_url: str | None = None) -> None:
        self._explicit_url = queue_url

    async def enqueue_indexing(
        self,
        tenant_id: str,
        agent_id: str,
        document_id: str,
        s3_bucket: str,
        s3_key: str,
        file_name: str,
    ) -> None:
        queue_url = self._explicit_url or await resolve_queue_url(
            "AWS_SQS_DOCUMENT_INDEXING_QUEUE_URL",
            "DOCUMENT_INDEXING_QUEUE_NAME",
            DOCUMENT_INDEXING_QUEUE_NAME,
        )

        with tracer.start_as_current_span(
            "knowledge.document.enqueue",
            kind=trace.SpanKind.PRODUCER,
            attributes={
                "messaging.system": "aws_sqs",
                "messaging.destination.name": DOCUMENT_INDEXING_QUEUE_NAME,
                "messaging.operation": "publish",
                "tenant.id": tenant_id,
                "agent.id": agent_id,
                "document.id": document_id,
                "document.file_name": file_name,
            },
        ):
            trace_id, traceparent = extract_active_trace_context()
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
            await send_sqs_message(
                queue_url, payload, trace_id=trace_id, traceparent=traceparent
            )

        print(
            f"[SqsDocumentIndexingQueue] Enqueued indexing job for doc '{document_id}' to SQS (trace_id={trace_id})",
            flush=True,
        )

    async def close(self) -> None:
        return None
