from __future__ import annotations

import logging
import os
from typing import Any

from agent_orchestrator.adapters.sqs_client import (
    extract_active_trace_context,
    resolve_queue_url,
    send_sqs_message,
)

logger = logging.getLogger(__name__)

SMS_QUEUE_NAME = os.getenv("SMS_QUEUE_NAME", "sms-queue")


class SqsSmsQueue:
    """Publishes SMS notification jobs directly to AWS SQS."""

    async def _send(
        self,
        name: str,
        data: dict[str, Any],
        trace_id: str | None = None,
        traceparent: str | None = None,
    ) -> None:
        if not trace_id or not traceparent:
            ctx_tid, ctx_tp = extract_active_trace_context()
            trace_id = trace_id or ctx_tid
            traceparent = traceparent or ctx_tp

        try:
            sqs_url = await resolve_queue_url(
                "AWS_SQS_SMS_QUEUE_URL", "SMS_QUEUE_NAME", SMS_QUEUE_NAME
            )
            payload = {
                "name": name,
                "data": data,
                "trace_id": trace_id,
                "traceparent": traceparent,
            }
            await send_sqs_message(
                sqs_url, payload, trace_id=trace_id, traceparent=traceparent
            )
            logger.info(
                "[SmsQueue] Enqueued '%s' to SQS '%s' (Trace: %s)",
                name,
                sqs_url,
                trace_id or "N/A",
            )
        except Exception as e:
            logger.error("[SmsQueue] Failed to enqueue '%s' to SQS: %s", name, e)

    async def enqueue_otp_sms(
        self,
        phone: str,
        code: str,
        tenant_id: str = "",
        agent_id: str = "",
        trace_id: str | None = None,
        traceparent: str | None = None,
    ) -> None:
        payload_data = {
            "phone": phone.strip(),
            "code": str(code).strip(),
            "tenant_id": tenant_id,
            "agent_id": agent_id,
        }
        await self._send("send-otp", payload_data, trace_id=trace_id, traceparent=traceparent)

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
        payload_data = {
            "phone": phone.strip(),
            "customer_name": customer_name.strip(),
            "service_name": service_name.strip(),
            "start_time": start_time.strip(),
            "booking_reference": booking_reference.strip(),
            "tenant_id": tenant_id,
            "agent_id": agent_id,
        }
        await self._send(
            "send-booking-created", payload_data, trace_id=trace_id, traceparent=traceparent
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
        payload_data = {
            "phone": phone.strip(),
            "customer_name": customer_name.strip(),
            "service_name": service_name.strip(),
            "start_time": start_time.strip(),
            "booking_reference": booking_reference.strip(),
            "tenant_id": tenant_id,
            "agent_id": agent_id,
        }
        await self._send(
            "send-booking-cancelled", payload_data, trace_id=trace_id, traceparent=traceparent
        )

    async def close(self) -> None:
        return None


_sms_queue_instance: SqsSmsQueue | None = None


def get_sms_queue() -> SqsSmsQueue:
    global _sms_queue_instance
    if _sms_queue_instance is None:
        _sms_queue_instance = SqsSmsQueue()
    return _sms_queue_instance
