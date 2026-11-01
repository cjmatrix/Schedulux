from pathlib import Path
import os
import json
from typing import Optional, Any
import aio_pika
import redis.asyncio as aioredis
from dotenv import load_dotenv

dotenv_path = Path(__file__).resolve().parents[5] / ".env"
load_dotenv(dotenv_path)

redis_uri = os.environ.get("REDIS_URI", "redis://localhost:6379")
rabbitmq_uri = os.environ.get("RABBITMQ_URI", "amqp://guest:guest@localhost:5672")

CRAWL_QUEUE_NAME = os.environ.get("CRAWL_QUEUE_NAME", "knowledge-crawl-queue")
SCHEMA_QUEUE_NAME = os.environ.get("SCHEMA_QUEUE_NAME", "schema-generation-queue")
DOCUMENT_INDEXING_QUEUE_NAME = os.environ.get(
    "DOCUMENT_INDEXING_QUEUE_NAME", "knowledge-document-indexing-queue"
)
DOCUMENT_STATUS_QUEUE_NAME = os.environ.get(
    "DOCUMENT_STATUS_QUEUE_NAME", "knowledge-document-status-queue"
)

_rabbit_connection: Optional[aio_pika.abc.AbstractRobustConnection] = None
_rabbit_channel: Optional[aio_pika.abc.AbstractChannel] = None
_redis_client: Optional[aioredis.Redis] = None


async def get_rabbitmq_channel() -> aio_pika.abc.AbstractChannel:
    """Returns a global singleton robust RabbitMQ channel, declaring standard queues."""
    global _rabbit_connection, _rabbit_channel
    if _rabbit_connection is None or _rabbit_connection.is_closed:
        _rabbit_connection = await aio_pika.connect_robust(rabbitmq_uri)
        _rabbit_channel = await _rabbit_connection.channel()
        await _rabbit_channel.declare_queue(CRAWL_QUEUE_NAME, durable=True)
        await _rabbit_channel.declare_queue(SCHEMA_QUEUE_NAME, durable=True)
        await _rabbit_channel.declare_queue(DOCUMENT_INDEXING_QUEUE_NAME, durable=True)
        await _rabbit_channel.declare_queue(DOCUMENT_STATUS_QUEUE_NAME, durable=True)
    elif _rabbit_channel is None or _rabbit_channel.is_closed:
        _rabbit_channel = await _rabbit_connection.channel()
        await _rabbit_channel.declare_queue(CRAWL_QUEUE_NAME, durable=True)
        await _rabbit_channel.declare_queue(SCHEMA_QUEUE_NAME, durable=True)
        await _rabbit_channel.declare_queue(DOCUMENT_INDEXING_QUEUE_NAME, durable=True)
        await _rabbit_channel.declare_queue(DOCUMENT_STATUS_QUEUE_NAME, durable=True)
    return _rabbit_channel


async def publish_document_indexing_job(
    tenant_id: str,
    agent_id: str,
    document_id: str,
    s3_bucket: str,
    s3_key: str,
    file_name: str,
) -> None:
    """Publishes a document indexing task to RabbitMQ knowledge-document-indexing-queue."""
    channel = await get_rabbitmq_channel()
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
        f"[RabbitMQ] Published indexing job for doc '{document_id}' to '{DOCUMENT_INDEXING_QUEUE_NAME}'",
        flush=True,
    )


async def publish_document_status_update(
    tenant_id: str,
    agent_id: str,
    document_id: str,
    status: str,
    chunks_count: Optional[int] = None,
    error_message: Optional[str] = None,
) -> None:
    """Publishes a document indexing status update to RabbitMQ knowledge-document-status-queue."""
    channel = await get_rabbitmq_channel()
    payload = {
        "event": "document.status_updated",
        "tenant_id": tenant_id,
        "agent_id": agent_id,
        "document_id": document_id,
        "status": status,
        "chunks_count": chunks_count,
        "error_message": error_message,
    }

    await channel.default_exchange.publish(
        aio_pika.Message(
            body=json.dumps(payload).encode(),
            delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
            content_type="application/json",
            message_id=f"doc_status_{document_id}_{status}",
        ),
        routing_key=DOCUMENT_STATUS_QUEUE_NAME,
    )
    print(
        f"[RabbitMQ] Published status '{status}' for doc '{document_id}' to '{DOCUMENT_STATUS_QUEUE_NAME}'",
        flush=True,
    )


async def publish_schema_generation_job(tenant_id: str, url: str, job_id: str, crawled_data: dict) -> None:
    """Publishes a schema generation task to RabbitMQ schema-generation-queue."""
    channel = await get_rabbitmq_channel()
    payload = {
        "name": "generate-schema",
        "tenant_id": tenant_id,
        "url": url,
        "job_id": job_id,
        "crawled_data": crawled_data,
    }

    await channel.default_exchange.publish(
        aio_pika.Message(
            body=json.dumps(payload).encode(),
            delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
            content_type="application/json",
            message_id=f"schema_{job_id}",
        ),
        routing_key=SCHEMA_QUEUE_NAME,
    )
    print(f"[RabbitMQ] Published job 'schema_{job_id}' to '{SCHEMA_QUEUE_NAME}'", flush=True)


async def publish_crawl_job(tenant_id: str, url: str, job_id: str) -> None:
    """Publishes a website crawling task to RabbitMQ knowledge-crawl-queue."""
    channel = await get_rabbitmq_channel()
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
    print(f"[RabbitMQ] Published job '{job_id}' to '{CRAWL_QUEUE_NAME}'", flush=True)


def get_redis_client() -> aioredis.Redis:
    """Returns global singleton Redis client with connection pooling."""
    global _redis_client
    if _redis_client is None:
        _redis_client = aioredis.from_url(redis_uri, decode_responses=True)
    return _redis_client


async def close_all_connections():
    """Gracefully closes RabbitMQ and Redis connections."""
    global _rabbit_channel, _rabbit_connection, _redis_client
    if _rabbit_channel is not None and not _rabbit_channel.is_closed:
        await _rabbit_channel.close()
        _rabbit_channel = None
    if _rabbit_connection is not None and not _rabbit_connection.is_closed:
        await _rabbit_connection.close()
        _rabbit_connection = None
    if _redis_client is not None:
        await _redis_client.aclose()
        _redis_client = None
