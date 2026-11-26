import asyncio
import os
import signal
import sys
import traceback
from typing import Any

from dotenv import find_dotenv, load_dotenv
from opentelemetry import trace

load_dotenv(find_dotenv())

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))

from python_worker.tracing import extract_trace_context, get_tracer, init_telemetry

init_telemetry()
tracer = get_tracer("crawler-worker")

from python_worker.crawler import process_crawl_job
from python_worker.document_indexer import process_document_indexing
from python_worker.queues import (
    CRAWL_QUEUE_NAME,
    DOCUMENT_INDEXING_QUEUE_NAME,
    SCHEMA_QUEUE_NAME,
    close_all_connections,
    poll_sqs_queue,
    resolve_queue_url,
)
from python_worker.schema_generator import process_schema_generation


async def handle_crawl_message(data: dict[str, Any], headers: dict[str, str]) -> None:
    parent_ctx = extract_trace_context(headers, data)
    with tracer.start_as_current_span(
        "knowledge.crawl.process",
        context=parent_ctx,
        kind=trace.SpanKind.CONSUMER,
        attributes={
            "messaging.system": "aws_sqs",
            "messaging.destination.name": CRAWL_QUEUE_NAME,
            "messaging.operation": "process",
            "tenant.id": data.get("tenant_id", "default"),
            "crawl.job_id": data.get("job_id", ""),
            "crawl.url": data.get("url", ""),
        },
    ) as span:
        try:
            await process_crawl_job(data)
            span.set_status(trace.StatusCode.OK)
        except Exception as e:
            span.record_exception(e)
            span.set_status(trace.StatusCode.ERROR, str(e))
            traceback.print_exc()
            raise


async def handle_schema_message(data: dict[str, Any], headers: dict[str, str]) -> None:
    parent_ctx = extract_trace_context(headers, data)
    with tracer.start_as_current_span(
        "knowledge.schema.process",
        context=parent_ctx,
        kind=trace.SpanKind.CONSUMER,
        attributes={
            "messaging.system": "aws_sqs",
            "messaging.destination.name": SCHEMA_QUEUE_NAME,
            "messaging.operation": "process",
            "tenant.id": data.get("tenant_id", "default"),
            "crawl.job_id": data.get("job_id", ""),
        },
    ) as span:
        try:
            await process_schema_generation(data)
            span.set_status(trace.StatusCode.OK)
        except Exception as e:
            span.record_exception(e)
            span.set_status(trace.StatusCode.ERROR, str(e))
            traceback.print_exc()
            raise


async def handle_indexing_message(data: dict[str, Any], headers: dict[str, str]) -> None:
    parent_ctx = extract_trace_context(headers, data)
    with tracer.start_as_current_span(
        "knowledge.document.index",
        context=parent_ctx,
        kind=trace.SpanKind.CONSUMER,
        attributes={
            "messaging.system": "aws_sqs",
            "messaging.destination.name": DOCUMENT_INDEXING_QUEUE_NAME,
            "messaging.operation": "process",
            "tenant.id": data.get("tenant_id", ""),
            "agent.id": data.get("agent_id", ""),
            "document.id": data.get("document_id", ""),
            "document.file_name": data.get("file_name", ""),
        },
    ) as span:
        try:
            await process_document_indexing(data)
            span.set_status(trace.StatusCode.OK)
        except Exception as e:
            span.record_exception(e)
            span.set_status(trace.StatusCode.ERROR, str(e))
            traceback.print_exc()
            raise


async def main() -> None:
    print("[Python Worker] Starting AWS SQS background workers...", flush=True)

    stop_event = asyncio.Event()

    def shutdown_handler() -> None:
        print("\n[Python Worker] Shutting down workers gracefully...", flush=True)
        stop_event.set()

    loop = asyncio.get_event_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, shutdown_handler)

    queue_specs = [
        ("AWS_SQS_CRAWL_QUEUE_URL", "CRAWL_QUEUE_NAME", CRAWL_QUEUE_NAME, handle_crawl_message, "CrawlWorker"),
        ("AWS_SQS_SCHEMA_QUEUE_URL", "SCHEMA_QUEUE_NAME", SCHEMA_QUEUE_NAME, handle_schema_message, "SchemaWorker"),
        (
            "AWS_SQS_DOCUMENT_INDEXING_QUEUE_URL",
            "DOCUMENT_INDEXING_QUEUE_NAME",
            DOCUMENT_INDEXING_QUEUE_NAME,
            handle_indexing_message,
            "IndexingWorker",
        ),
    ]

    poll_tasks = []
    for url_env, name_env, default_name, handler, label in queue_specs:
        queue_url = await resolve_queue_url(url_env, name_env, default_name)
        print(f"[Python Worker] Polling SQS '{queue_url}' ({label})", flush=True)
        poll_tasks.append(
            asyncio.create_task(
                poll_sqs_queue(
                    queue_url,
                    handler,
                    stop_event,
                    max_concurrent=1,
                    wait_seconds=20,
                    label=label,
                )
            )
        )

    await stop_event.wait()
    if poll_tasks:
        await asyncio.gather(*poll_tasks, return_exceptions=True)

    await close_all_connections()
    print("[Python Worker] All background workers and connections closed gracefully.", flush=True)


if __name__ == "__main__":
    asyncio.run(main())
