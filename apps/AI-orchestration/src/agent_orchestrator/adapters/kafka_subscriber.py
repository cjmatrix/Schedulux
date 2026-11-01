from __future__ import annotations

import asyncio
import json
import logging
import ssl
from typing import Any

from aiokafka import AIOKafkaConsumer

from agent_orchestrator.domain.protocols import EventSubscriber, MessageHandler

logger = logging.getLogger(__name__)


class KafkaEventSubscriber(EventSubscriber):
    def __init__(
        self,
        brokers: str,
        group_id: str,
        username: str = "",
        password: str = "",
        auto_offset_reset: str = "earliest",
        max_poll_interval_ms: int = 300_000,
    ) -> None:
        self.brokers = brokers
        self.group_id = group_id
        self.username = username
        self.password = password
        self.auto_offset_reset = auto_offset_reset
        self.max_poll_interval_ms = max_poll_interval_ms

        self._handlers: dict[str, MessageHandler] = {}
        self._consumer: AIOKafkaConsumer | None = None
        self._running = False

    async def subscribe(self, topic_or_queue: str, handler: MessageHandler) -> None:

        self._handlers[topic_or_queue] = handler
        logger.info("[KafkaSubscriber] Registered handler for topic '%s'", topic_or_queue)

    async def start(self) -> None:

        if not self._handlers:
            logger.warning("[KafkaSubscriber] No topic handlers registered before start.")
            return

        topics = list(self._handlers.keys())
        logger.info(
            "[KafkaSubscriber] Connecting to brokers: %s (group=%s, topics=%s)",
            self.brokers,
            self.group_id,
            topics,
        )

        consumer_kwargs: dict[str, Any] = {
            "bootstrap_servers": self.brokers,
            "group_id": self.group_id,
            "auto_offset_reset": self.auto_offset_reset,
            "enable_auto_commit": False,
            "value_deserializer": None,
            "max_poll_interval_ms": self.max_poll_interval_ms,
        }

        if self.username and self.password:
            ssl_context = ssl.create_default_context()
            ssl_context.check_hostname = False
            ssl_context.verify_mode = ssl.CERT_NONE

            consumer_kwargs.update(
                {
                    "security_protocol": "SASL_SSL",
                    "sasl_mechanism": "SCRAM-SHA-256",
                    "sasl_plain_username": self.username,
                    "sasl_plain_password": self.password,
                    "ssl_context": ssl_context,
                }
            )

        self._consumer = AIOKafkaConsumer(*topics, **consumer_kwargs)
        await self._consumer.start()
        self._running = True
        logger.info("[KafkaSubscriber] Connected and started listening on topics: %s", topics)

    async def run(self) -> None:
        """Main consumption loop with manual offset commit after successful handling."""
        if self._consumer is None:
            await self.start()

        if self._consumer is None:
            raise RuntimeError("[KafkaSubscriber] Failed to initialize consumer.")

        try:
            async for msg in self._consumer:
                if not self._running:
                    break

                handler = self._handlers.get(msg.topic)
                if not handler:
                    logger.warning(
                        "[KafkaSubscriber] No handler registered for topic: %s", msg.topic
                    )
                    await self._consumer.commit()
                    continue

                try:
                    payload = json.loads(msg.value.decode("utf-8"))
                    await handler(payload)
                    await self._consumer.commit()
                except (json.JSONDecodeError, UnicodeDecodeError) as exc:
                    logger.error(
                        "[KafkaSubscriber] Failed to decode JSON message on topic %s: %s",
                        msg.topic,
                        exc,
                    )
                    await self._consumer.commit()
                except Exception as exc:
                    logger.error(
                        "[KafkaSubscriber] Error handling message on topic %s: %s",
                        msg.topic,
                        exc,
                        exc_info=True,
                    )
                    raise

        except asyncio.CancelledError:
            logger.info("[KafkaSubscriber] Consumption task cancelled.")
        finally:
            await self.stop()

    async def stop(self) -> None:
        """Gracefully disconnect from Kafka."""
        self._running = False
        if self._consumer is not None:
            try:
                await self._consumer.stop()
                logger.info("[KafkaSubscriber] Kafka consumer stopped.")
            except Exception as e:
                logger.warning("[KafkaSubscriber] Error during consumer stop: %s", e)
            finally:
                self._consumer = None
