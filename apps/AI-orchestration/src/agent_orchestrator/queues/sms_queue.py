from __future__ import annotations

import json
import logging
import os
from typing import Any

import aio_pika
import boto3
from opentelemetry import trace

logger = logging.getLogger(__name__)

SMS_QUEUE_NAME = os.getenv("SMS_QUEUE_NAME", "sms-queue")


def _get_active_trace_context() -> tuple[str | None, str | None]:
    
    span = trace.get_current_span()
    span_ctx = span.get_span_context() if span else None
    if span_ctx and span_ctx.is_valid:
        trace_id = format(span_ctx.trace_id, "032x")
        traceparent = f"00-{trace_id}-{format(span_ctx.span_id, '016x')}-{span_ctx.trace_flags:02x}"
        return trace_id, traceparent
    return None, None


class RabbitMQSmsQueue:
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
            await self._channel.declare_queue(SMS_QUEUE_NAME, durable=True)
        elif self._channel is None or self._channel.is_closed:
            self._channel = await self._connection.channel()
            await self._channel.declare_queue(SMS_QUEUE_NAME, durable=True)
        return self._channel

    def _send_to_sqs(
        self,
        name: str,
        data: dict[str, Any],
        trace_id: str | None = None,
        traceparent: str | None = None,
    ) -> bool:
        sqs_url = os.getenv("AWS_SQS_SMS_QUEUE_URL", "")
        if not sqs_url:
            return False

        if not trace_id or not traceparent:
            ctx_tid, ctx_tp = _get_active_trace_context()
            trace_id = trace_id or ctx_tid
            traceparent = traceparent or ctx_tp

        try:
            sqs = boto3.client("sqs", region_name=os.getenv("AWS_REGION", "ap-south-1"))
            payload = {
                "name": name,
                "data": data,
                "trace_id": trace_id,
                "traceparent": traceparent,
            }
            message_attributes: dict[str, Any] = {}
            if traceparent:
                message_attributes["traceparent"] = {
                    "DataType": "String",
                    "StringValue": traceparent,
                }
            if trace_id:
                message_attributes["trace_id"] = {
                    "DataType": "String",
                    "StringValue": trace_id,
                }

            params: dict[str, Any] = {
                "QueueUrl": sqs_url,
                "MessageBody": json.dumps(payload),
            }
            if message_attributes:
                params["MessageAttributes"] = message_attributes

            sqs.send_message(**params)
            logger.info(
                "[SmsQueue] Enqueued '%s' to SQS '%s' (Trace: %s)",
                name,
                sqs_url,
                trace_id or "N/A",
            )
            return True
        except Exception as e:
            logger.error("[SmsQueue] Failed to enqueue '%s' to SQS: %s", name, e)
            return False

    async def enqueue_otp_sms(
        self,
        phone: str,
        code: str,
        tenant_id: str = "",
        agent_id: str = "",
        trace_id: str | None = None,
        traceparent: str | None = None,
    ) -> None:
        if not trace_id or not traceparent:
            ctx_tid, ctx_tp = _get_active_trace_context()
            trace_id = trace_id or ctx_tid
            traceparent = traceparent or ctx_tp

        payload_data = {
            "phone": phone.strip(),
            "code": str(code).strip(),
            "tenant_id": tenant_id,
            "agent_id": agent_id,
        }
        if self._send_to_sqs("send-otp", payload_data, trace_id=trace_id, traceparent=traceparent):
            return

        try:
            channel = await self._get_channel()
            payload = {
                "name": "send-otp",
                "data": payload_data,
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
                    message_id=f"otp_{phone}_{code}",
                    headers=headers or None,
                ),
                routing_key=SMS_QUEUE_NAME,
            )
            logger.info(
                "[SmsQueue] Enqueued OTP SMS for %s to '%s' (Trace: %s)",
                phone,
                SMS_QUEUE_NAME,
                trace_id or "N/A",
            )
        except Exception as e:
            logger.error("[SmsQueue] Failed to enqueue OTP SMS for %s: %s", phone, e)

    async def enqueue_booking_created_sms(
        self,
        phone: str,
        customer_name: str,
        service_name: str,
        start_time: str,
        booking_reference: str = "",
        tenant_id: str = "",
        agent_id: str = "",
        trace_id: str | None = None,
        traceparent: str | None = None,
    ) -> None:
        if not trace_id or not traceparent:
            ctx_tid, ctx_tp = _get_active_trace_context()
            trace_id = trace_id or ctx_tid
            traceparent = traceparent or ctx_tp

        payload_data = {
            "phone": phone.strip(),
            "customer_name": customer_name.strip(),
            "service_name": service_name.strip(),
            "start_time": start_time.strip(),
            "booking_reference": booking_reference.strip(),
            "tenant_id": tenant_id,
            "agent_id": agent_id,
        }
        if self._send_to_sqs(
            "send-booking-created",
            payload_data,
            trace_id=trace_id,
            traceparent=traceparent,
        ):
            return

        try:
            channel = await self._get_channel()
            payload = {
                "name": "send-booking-created",
                "data": payload_data,
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
                    message_id=f"bk_sms_{booking_reference or phone}",
                    headers=headers or None,
                ),
                routing_key=SMS_QUEUE_NAME,
            )
            logger.info(
                "[SmsQueue] Enqueued booking confirmation SMS for %s (Ref: %s, Trace: %s)",
                phone,
                booking_reference,
                trace_id or "N/A",
            )
        except Exception as e:
            logger.error(
                "[SmsQueue] Failed to enqueue booking confirmation SMS for %s: %s", phone, e
            )

    async def enqueue_booking_cancelled_sms(
        self,
        phone: str,
        customer_name: str,
        service_name: str,
        start_time: str,
        booking_reference: str = "",
        tenant_id: str = "",
        agent_id: str = "",
        trace_id: str | None = None,
        traceparent: str | None = None,
    ) -> None:
        if not trace_id or not traceparent:
            ctx_tid, ctx_tp = _get_active_trace_context()
            trace_id = trace_id or ctx_tid
            traceparent = traceparent or ctx_tp

        payload_data = {
            "phone": phone.strip(),
            "customer_name": customer_name.strip(),
            "service_name": service_name.strip(),
            "start_time": start_time.strip(),
            "booking_reference": booking_reference.strip(),
            "tenant_id": tenant_id,
            "agent_id": agent_id,
        }
        if self._send_to_sqs(
            "send-booking-cancelled",
            payload_data,
            trace_id=trace_id,
            traceparent=traceparent,
        ):
            return

        try:
            channel = await self._get_channel()
            payload = {
                "name": "send-booking-cancelled",
                "data": payload_data,
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
                    message_id=f"cancel_sms_{booking_reference or phone}",
                    headers=headers or None,
                ),
                routing_key=SMS_QUEUE_NAME,
            )
            logger.info(
                "[SmsQueue] Enqueued booking cancellation SMS for %s (Ref: %s, Trace: %s)",
                phone,
                booking_reference,
                trace_id or "N/A",
            )
        except Exception as e:
            logger.error(
                "[SmsQueue] Failed to enqueue booking cancellation SMS for %s: %s", phone, e
            )

    async def close(self) -> None:
        try:
            if self._channel and not self._channel.is_closed:
                await self._channel.close()
            if self._connection and not self._connection.is_closed:
                await self._connection.close()
        except Exception:
            pass


_sms_queue_instance: RabbitMQSmsQueue | None = None


def get_sms_queue() -> RabbitMQSmsQueue:
    global _sms_queue_instance
    if _sms_queue_instance is None:
        _sms_queue_instance = RabbitMQSmsQueue()
    return _sms_queue_instance
