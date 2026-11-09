from __future__ import annotations

import json
import logging
import os

import aio_pika

logger = logging.getLogger(__name__)

SMS_QUEUE_NAME = os.getenv("SMS_QUEUE_NAME", "sms-queue")


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

    async def enqueue_otp_sms(
        self,
        phone: str,
        code: str,
        tenant_id: str = "",
        agent_id: str = "",
    ) -> None:
        try:
            channel = await self._get_channel()
            payload = {
                "name": "send-otp",
                "data": {
                    "phone": phone.strip(),
                    "code": str(code).strip(),
                    "tenant_id": tenant_id,
                    "agent_id": agent_id,
                },
            }

            await channel.default_exchange.publish(
                aio_pika.Message(
                    body=json.dumps(payload).encode(),
                    delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
                    content_type="application/json",
                    message_id=f"otp_{phone}_{code}",
                ),
                routing_key=SMS_QUEUE_NAME,
            )
            logger.info("[SmsQueue] Enqueued OTP SMS for %s to '%s'", phone, SMS_QUEUE_NAME)
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
    ) -> None:
        try:
            channel = await self._get_channel()
            payload = {
                "name": "send-booking-created",
                "data": {
                    "phone": phone.strip(),
                    "customer_name": customer_name.strip(),
                    "service_name": service_name.strip(),
                    "start_time": start_time.strip(),
                    "booking_reference": booking_reference.strip(),
                    "tenant_id": tenant_id,
                    "agent_id": agent_id,
                },
            }

            await channel.default_exchange.publish(
                aio_pika.Message(
                    body=json.dumps(payload).encode(),
                    delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
                    content_type="application/json",
                    message_id=f"bk_sms_{booking_reference or phone}",
                ),
                routing_key=SMS_QUEUE_NAME,
            )
            logger.info(
                "[SmsQueue] Enqueued booking confirmation SMS for %s (Ref: %s)",
                phone,
                booking_reference,
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
    ) -> None:
        try:
            channel = await self._get_channel()
            payload = {
                "name": "send-booking-cancelled",
                "data": {
                    "phone": phone.strip(),
                    "customer_name": customer_name.strip(),
                    "service_name": service_name.strip(),
                    "start_time": start_time.strip(),
                    "booking_reference": booking_reference.strip(),
                    "tenant_id": tenant_id,
                    "agent_id": agent_id,
                },
            }

            await channel.default_exchange.publish(
                aio_pika.Message(
                    body=json.dumps(payload).encode(),
                    delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
                    content_type="application/json",
                    message_id=f"cancel_sms_{booking_reference or phone}",
                ),
                routing_key=SMS_QUEUE_NAME,
            )
            logger.info(
                "[SmsQueue] Enqueued booking cancellation SMS for %s (Ref: %s)",
                phone,
                booking_reference,
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
