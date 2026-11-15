from __future__ import annotations

import asyncio
import json
import logging
import os
import ssl
from typing import Any

from aiokafka import AIOKafkaProducer
from aiokafka.errors import KafkaError
from dotenv import load_dotenv

from agent_orchestrator.domain.protocols import EventPublisher

local_env = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".env"))
load_dotenv(local_env)

logger = logging.getLogger(__name__)


class KafkaTokenProducer(EventPublisher):
    def __init__(
        self,
        brokers: str | None = None,
        username: str = "",
        password: str = "",
        default_topic: str | None = None,
    ) -> None:
        self.brokers = brokers or os.environ.get("KAFKA_BROKERS", "localhost:9092")
        self.username = username or os.environ.get("KAFKA_USERNAME", "")
        self.password = password or os.environ.get("KAFKA_PASSWORD", "")
        self.default_topic = default_topic or os.environ.get(
            "KAFKA_TOKEN_TOPIC", "billing.tokens.consumed"
        )
        self._producer: AIOKafkaProducer | None = None
        self._lock = asyncio.Lock()

    async def start(self) -> None:
        if self._producer is not None:
            return

        async with self._lock:
            if self._producer is not None:
                return

            broker_list = [b.strip() for b in self.brokers.split(",") if b.strip()]
            producer_kwargs: dict[str, Any] = {
                "bootstrap_servers": broker_list,
                "linger_ms": 10,
                "acks": 1,
                "max_batch_size": 16384,
                "retry_backoff_ms": 100,
            }

            if self.username and self.password:
                ssl_context = ssl.create_default_context()
                ssl_context.check_hostname = False
                ssl_context.verify_mode = ssl.CERT_NONE

                producer_kwargs.update(
                    {
                        "security_protocol": "SASL_SSL",
                        "sasl_mechanism": "SCRAM-SHA-256",
                        "sasl_plain_username": self.username,
                        "sasl_plain_password": self.password,
                        "ssl_context": ssl_context,
                    }
                )

            prod = AIOKafkaProducer(**producer_kwargs)
            await prod.start()
            self._producer = prod
            logger.info(
                "[KafkaTokenProducer] Started Kafka producer on brokers '%s' for topic '%s'",
                self.brokers,
                self.default_topic,
            )

    async def stop(self) -> None:
        async with self._lock:
            if self._producer is not None:
                try:
                    await self._producer.flush()
                    await self._producer.stop()
                    logger.info("[KafkaTokenProducer] Stopped Kafka producer.")
                except Exception as e:
                    logger.warning("[KafkaTokenProducer] Error stopping producer: %s", e)
                finally:
                    self._producer = None

    async def publish(
        self,
        topic: str,
        payload: dict[str, Any],
        key: str | None = None,
    ) -> None:
        if self._producer is None:
            await self.start()

        if self._producer is None:
            raise RuntimeError("[KafkaTokenProducer] Producer not initialized.")

        val_bytes = json.dumps(payload).encode("utf-8")
        key_bytes = key.encode("utf-8") if key else None
        target_topic = topic or self.default_topic

        try:
            future = await self._producer.send(target_topic, val_bytes, key=key_bytes)

            def on_delivery_callback(fut: Any) -> None:
                try:
                    _ = fut.result()
                except KafkaError as err:
                    logger.error(
                        "[KafkaTokenProducer] Async message delivery failed to topic %s: %s",
                        target_topic,
                        err,
                    )

            future.add_done_callback(on_delivery_callback)

        except Exception as e:
            logger.error("[KafkaTokenProducer] Direct publishing failure: %s", e)
            raise


_default_publisher: EventPublisher | None = None


def get_event_publisher() -> EventPublisher:
    global _default_publisher
    if _default_publisher is None:
        _default_publisher = KafkaTokenProducer()
    return _default_publisher


def set_event_publisher(publisher: EventPublisher) -> None:
    global _default_publisher
    _default_publisher = publisher
