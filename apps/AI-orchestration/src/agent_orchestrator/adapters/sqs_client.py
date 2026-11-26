from __future__ import annotations

import asyncio
import json
import logging
import os
from collections.abc import Awaitable, Callable
from typing import Any

import boto3
from opentelemetry import trace

logger = logging.getLogger(__name__)

_sqs_client: Any = None
_queue_url_cache: dict[str, str] = {}


def get_sqs_client() -> Any:
   
    global _sqs_client
    if _sqs_client is None:
        region = os.environ.get("AWS_REGION", "ap-south-1")
        endpoint_url = os.environ.get("AWS_SQS_ENDPOINT_URL") or None
        _sqs_client = boto3.client("sqs", region_name=region, endpoint_url=endpoint_url)
    return _sqs_client


def extract_active_trace_context() -> tuple[str | None, str | None]:
  
    span = trace.get_current_span()
    span_ctx = span.get_span_context() if span else None
    if span_ctx and span_ctx.is_valid:
        trace_id = format(span_ctx.trace_id, "032x")
        traceparent = (
            f"00-{trace_id}-{format(span_ctx.span_id, '016x')}-{span_ctx.trace_flags:02x}"
        )
        return trace_id, traceparent
    return None, None


async def resolve_queue_url(
    url_env: str,
    name_env: str | None = None,
    default_name: str = "",
) -> str:
    
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


async def send_sqs_message(
    queue_url: str,
    payload: dict[str, Any],
    trace_id: str | None = None,
    traceparent: str | None = None,
) -> str:
    
    if not trace_id or not traceparent:
        ctx_tid, ctx_tp = extract_active_trace_context()
        trace_id = trace_id or ctx_tid
        traceparent = traceparent or ctx_tp

    message_attributes: dict[str, Any] = {}
    if traceparent:
        message_attributes["traceparent"] = {"DataType": "String", "StringValue": traceparent}
    if trace_id:
        message_attributes["trace_id"] = {"DataType": "String", "StringValue": trace_id}

    params: dict[str, Any] = {
        "QueueUrl": queue_url,
        "MessageBody": json.dumps(payload),
    }
    if message_attributes:
        params["MessageAttributes"] = message_attributes

    sqs = get_sqs_client()
    res = await asyncio.to_thread(sqs.send_message, **params)
    return str(res.get("MessageId", ""))


MessageCallback = Callable[[dict[str, Any], dict[str, Any], dict[str, Any]], Awaitable[None]]


async def poll_sqs_queue(
    queue_url: str,
    handler: MessageCallback,
    stop_event: asyncio.Event,
    *,
    max_messages: int = 5,
    wait_seconds: int = 20,
    label: str = "SQS",
) -> None:
    
    sqs = get_sqs_client()
    semaphore = asyncio.Semaphore(max(1, max_messages))
    active_tasks: set[asyncio.Task[None]] = set()

    async def _handle_raw(raw_msg: dict[str, Any]) -> None:
        receipt = raw_msg["ReceiptHandle"]
        attrs = raw_msg.get("MessageAttributes") or {}
        try:
            payload = json.loads(raw_msg["Body"])
        except (json.JSONDecodeError, UnicodeDecodeError, KeyError) as exc:
            logger.error("[%s] Malformed JSON in SQS message %s: %s", label, raw_msg.get("MessageId"), exc)
            return

        try:
            await handler(payload, attrs, raw_msg)
            await asyncio.to_thread(sqs.delete_message, QueueUrl=queue_url, ReceiptHandle=receipt)
        except Exception as exc:
            logger.error("[%s] Handler failed for message %s: %s", label, raw_msg.get("MessageId"), exc, exc_info=True)
        finally:
            semaphore.release()

    while not stop_event.is_set():
        try:
            batch_size = min(10, max(1, max_messages))
            resp = await asyncio.to_thread(
                sqs.receive_message,
                QueueUrl=queue_url,
                MaxNumberOfMessages=batch_size,
                WaitTimeSeconds=wait_seconds,
                MessageAttributeNames=["All"],
            )
            messages = resp.get("Messages", [])
            for raw_msg in messages:
                await semaphore.acquire()
                if stop_event.is_set():
                    semaphore.release()
                    break
                task = asyncio.create_task(_handle_raw(raw_msg))
                active_tasks.add(task)
                task.add_done_callback(active_tasks.discard)
        except asyncio.CancelledError:
            break
        except Exception as exc:
            logger.error("[%s] Polling error on '%s': %s", label, queue_url, exc)
            try:
                await asyncio.wait_for(stop_event.wait(), timeout=3.0)
            except TimeoutError:
                pass

    if active_tasks:
        await asyncio.gather(*active_tasks, return_exceptions=True)
