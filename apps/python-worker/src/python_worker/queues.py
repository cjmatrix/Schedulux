from __future__ import annotations

import asyncio
import json
import os
from collections.abc import Awaitable, Callable
from typing import Any

import boto3
import redis.asyncio as aioredis
from dotenv import find_dotenv, load_dotenv

from python_worker.tracing import inject_trace_context

load_dotenv(find_dotenv())

redis_uri = os.environ.get("REDIS_URI", "redis://localhost:6379")

CRAWL_QUEUE_NAME = os.environ.get("CRAWL_QUEUE_NAME", "knowledge-crawl-queue")
SCHEMA_QUEUE_NAME = os.environ.get("SCHEMA_QUEUE_NAME", "schema-generation-queue")
DOCUMENT_INDEXING_QUEUE_NAME = os.environ.get(
    "DOCUMENT_INDEXING_QUEUE_NAME", "knowledge-document-indexing-queue"
)
DOCUMENT_STATUS_QUEUE_NAME = os.environ.get(
    "DOCUMENT_STATUS_QUEUE_NAME", "knowledge-document-status-queue"
)

_sqs_client: Any = None
_queue_url_cache: dict[str, str] = {}
_redis_client: aioredis.Redis | None = None


def get_sqs_client() -> Any:
    """Returns a cached boto3 SQS client for AWS_REGION."""
    global _sqs_client
    if _sqs_client is None:
        region = os.environ.get("AWS_REGION", "ap-south-1")
        endpoint_url = os.environ.get("AWS_SQS_ENDPOINT_URL") or None
        _sqs_client = boto3.client("sqs", region_name=region, endpoint_url=endpoint_url)
    return _sqs_client


async def resolve_queue_url(
    url_env: str,
    name_env: str | None = None,
    default_name: str = "",
) -> str:
    """Resolves an SQS queue URL from explicit env var or cached GetQueueUrl lookup."""
    explicit_url = os.environ.get(url_env, "").strip()
    if explicit_url:
        return explicit_url

    queue_name = (os.environ.get(name_env, "").strip() if name_env else "") or default_name
    if not queue_name:
        raise ValueError(f"Missing SQS queue URL ({url_env}) and queue name ({name_env})")

    if queue_name in _queue_url_cache:
        return _queue_url_cache[queue_name]

    sqs = get_sqs_client()
    resp = await asyncio.to_thread(sqs.get_queue_url, QueueName=queue_name)
    url = str(resp["QueueUrl"])
    _queue_url_cache[queue_name] = url
    return url


def _build_message_attributes(headers: dict[str, Any]) -> dict[str, Any]:
    attrs: dict[str, Any] = {}
    for k, v in headers.items():
        if v is not None:
            attrs[k] = {"DataType": "String", "StringValue": str(v)}
    return attrs


async def _send_sqs_json(
    queue_url: str,
    payload: dict[str, Any],
    headers: dict[str, Any] | None = None,
) -> str:
    sqs = get_sqs_client()
    params: dict[str, Any] = {
        "QueueUrl": queue_url,
        "MessageBody": json.dumps(payload),
    }
    if headers:
        attrs = _build_message_attributes(headers)
        if attrs:
            params["MessageAttributes"] = attrs
    res = await asyncio.to_thread(sqs.send_message, **params)
    return str(res.get("MessageId", ""))


async def publish_document_indexing_job(
    tenant_id: str,
    agent_id: str,
    document_id: str,
    s3_bucket: str,
    s3_key: str,
    file_name: str,
) -> None:
    """Publishes a document indexing task to AWS SQS."""
    queue_url = await resolve_queue_url(
        "AWS_SQS_DOCUMENT_INDEXING_QUEUE_URL",
        "DOCUMENT_INDEXING_QUEUE_NAME",
        DOCUMENT_INDEXING_QUEUE_NAME,
    )
    payload = {
        "name": "index-knowledge-document",
        "tenant_id": tenant_id,
        "agent_id": agent_id,
        "document_id": document_id,
        "s3_bucket": s3_bucket,
        "s3_key": s3_key,
        "file_name": file_name,
    }
    headers: dict[str, Any] = {}
    inject_trace_context(headers, payload)

    await _send_sqs_json(queue_url, payload, headers)
    print(
        f"[SQS] Published indexing job for doc '{document_id}' to '{queue_url}'",
        flush=True,
    )


async def publish_document_status_update(
    tenant_id: str,
    agent_id: str,
    document_id: str,
    status: str,
    chunks_count: int | None = None,
    error_message: str | None = None,
) -> None:
    """Publishes a document indexing status update to AWS SQS."""
    queue_url = await resolve_queue_url(
        "AWS_SQS_DOCUMENT_STATUS_QUEUE_URL",
        "DOCUMENT_STATUS_QUEUE_NAME",
        DOCUMENT_STATUS_QUEUE_NAME,
    )
    payload = {
        "event": "document.status_updated",
        "tenant_id": tenant_id,
        "agent_id": agent_id,
        "document_id": document_id,
        "status": status,
        "chunks_count": chunks_count,
        "error_message": error_message,
    }
    headers: dict[str, Any] = {}
    inject_trace_context(headers, payload)

    await _send_sqs_json(queue_url, payload, headers)
    print(
        f"[SQS] Published status '{status}' for doc '{document_id}' to '{queue_url}'",
        flush=True,
    )


async def publish_schema_generation_job(
    tenant_id: str, url: str, job_id: str, crawled_data: dict
) -> None:
    """Stores crawled markdown in Redis (Claim Check) and enqueues schema generation on SQS."""
    redis = get_redis_client()
    schema_data_key = f"crawl:schema_data:{job_id}"
    await redis.setex(schema_data_key, 86400, json.dumps(crawled_data))

    queue_url = await resolve_queue_url(
        "AWS_SQS_SCHEMA_QUEUE_URL",
        "SCHEMA_QUEUE_NAME",
        SCHEMA_QUEUE_NAME,
    )
    payload = {
        "name": "generate-schema",
        "tenant_id": tenant_id,
        "url": url,
        "job_id": job_id,
        "crawled_data_redis_key": schema_data_key,
    }
    headers: dict[str, Any] = {}
    inject_trace_context(headers, payload)

    await _send_sqs_json(queue_url, payload, headers)
    print(f"[SQS] Published job 'schema_{job_id}' to '{queue_url}'", flush=True)


async def publish_schema_failure_event(
    tenant_id: str, url: str, job_id: str, error: str
) -> None:
    """Publishes a SCHEMA_GENERATION_FAILED notification to Redis pub/sub for SSE clients."""
    pubsub_channel = f"schema-events:{tenant_id}:{job_id}"
    event_payload = {
        "event": "SCHEMA_GENERATION_FAILED",
        "tenant_id": tenant_id,
        "job_id": job_id,
        "url": url,
        "error": error,
    }
    try:
        redis = get_redis_client()
        await redis.publish(pubsub_channel, json.dumps(event_payload))
        print(
            f"[Redis PubSub] Published failure event to '{pubsub_channel}': {error}",
            flush=True,
        )
    except Exception as pub_err:
        print(f"[Redis PubSub] Failed to publish error event to redis: {pub_err}", flush=True)


async def publish_crawl_job(tenant_id: str, url: str, job_id: str) -> None:
    """Publishes a website crawling task to AWS SQS."""
    queue_url = await resolve_queue_url(
        "AWS_SQS_CRAWL_QUEUE_URL",
        "CRAWL_QUEUE_NAME",
        CRAWL_QUEUE_NAME,
    )
    payload = {
        "name": "crawl-site",
        "tenant_id": tenant_id,
        "url": url,
        "job_id": job_id,
    }
    headers: dict[str, Any] = {}
    inject_trace_context(headers, payload)

    await _send_sqs_json(queue_url, payload, headers)
    print(f"[SQS] Published job '{job_id}' to '{queue_url}'", flush=True)


SqsMessageHandler = Callable[[dict[str, Any], dict[str, str]], Awaitable[None]]


async def poll_sqs_queue(
    queue_url: str,
    handler: SqsMessageHandler,
    stop_event: asyncio.Event,
    *,
    max_concurrent: int = 1,
    wait_seconds: int = 20,
    label: str = "SQS",
) -> None:
    """Long-polls an SQS queue, deleting messages only when handler succeeds."""
    sqs = get_sqs_client()
    semaphore = asyncio.Semaphore(max(1, max_concurrent))
    active_tasks: set[asyncio.Task[None]] = set()

    async def _process_msg(raw_msg: dict[str, Any]) -> None:
        receipt = raw_msg["ReceiptHandle"]
        raw_attrs = raw_msg.get("MessageAttributes") or {}
        headers = {
            k: str(v["StringValue"])
            for k, v in raw_attrs.items()
            if isinstance(v, dict) and "StringValue" in v
        }
        try:
            data = json.loads(raw_msg["Body"])
        except Exception as parse_err:
            print(f"[{label}] Invalid JSON in SQS message: {parse_err}", flush=True)
            return

        try:
            await handler(data, headers)
            await asyncio.to_thread(sqs.delete_message, QueueUrl=queue_url, ReceiptHandle=receipt)
        except Exception as err:
            print(f"[{label}] Message callback failed (letting SQS redrive): {err}", flush=True)
        finally:
            semaphore.release()

    while not stop_event.is_set():
        try:
            batch_size = min(10, max(1, max_concurrent))
            resp = await asyncio.to_thread(
                sqs.receive_message,
                QueueUrl=queue_url,
                MaxNumberOfMessages=batch_size,
                WaitTimeSeconds=wait_seconds,
                MessageAttributeNames=["All"],
            )
            for raw_msg in resp.get("Messages", []):
                await semaphore.acquire()
                if stop_event.is_set():
                    semaphore.release()
                    break
                task = asyncio.create_task(_process_msg(raw_msg))
                active_tasks.add(task)
                task.add_done_callback(active_tasks.discard)
        except asyncio.CancelledError:
            break
        except Exception as poll_err:
            print(f"[{label}] SQS polling error on '{queue_url}': {poll_err}", flush=True)
            try:
                await asyncio.wait_for(stop_event.wait(), timeout=3.0)
            except TimeoutError:
                pass

    if active_tasks:
        await asyncio.gather(*active_tasks, return_exceptions=True)


def get_redis_client() -> aioredis.Redis:
    """Returns global singleton Redis client with connection pooling."""
    global _redis_client
    if _redis_client is None:
        _redis_client = aioredis.from_url(redis_uri, decode_responses=True)
    return _redis_client


async def close_all_connections() -> None:
    """Gracefully closes Redis connections."""
    global _redis_client
    if _redis_client is not None:
        await _redis_client.aclose()
        _redis_client = None
