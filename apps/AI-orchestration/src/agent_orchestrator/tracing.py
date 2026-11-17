from __future__ import annotations

import logging
import os
import sys
from typing import Any

from opentelemetry import _logs, metrics, trace
from opentelemetry.exporter.otlp.proto.grpc._log_exporter import OTLPLogExporter
from opentelemetry.exporter.otlp.proto.grpc.metric_exporter import OTLPMetricExporter
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.grpc import (
    GrpcAioInstrumentorClient,
    GrpcAioInstrumentorServer,
    GrpcInstrumentorClient,
    GrpcInstrumentorServer,
)
from opentelemetry.instrumentation.logging import LoggingInstrumentor
from opentelemetry.instrumentation.system_metrics import SystemMetricsInstrumentor
from opentelemetry.sdk._logs import LoggerProvider, LoggingHandler
from opentelemetry.sdk._logs.export import BatchLogRecordProcessor
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

_IS_INITIALIZED = False
_TRACER_PROVIDER: TracerProvider | None = None
_LOGGER_PROVIDER: LoggerProvider | None = None


class OtelContextFilter(logging.Filter):

    def filter(self, record: logging.LogRecord) -> bool:
        span = trace.get_current_span()
        if span and span.is_recording():
            ctx = span.get_span_context()
            if ctx.is_valid:
                record.trace_id = format(ctx.trace_id, "032x")
                record.span_id = format(ctx.span_id, "016x")

            attrs = getattr(span, "attributes", None)
            if attrs:
                if "tenant.id" in attrs:
                    record.tenant_id = attrs["tenant.id"]
                if "agent.id" in attrs:
                    record.agent_id = attrs["agent.id"]
                if "session.id" in attrs:
                    record.session_id = attrs["session.id"]
                if "tenant.tier" in attrs:
                    record.tenant_tier = attrs["tenant.tier"]
                if "user.id" in attrs:
                    record.user_id = attrs["user.id"]
        return True


def init_telemetry() -> None:
    global _IS_INITIALIZED, _TRACER_PROVIDER, _LOGGER_PROVIDER
    if _IS_INITIALIZED:
        return

    service_name = os.environ.get("OTEL_SERVICE_NAME", "ai-orchestration")
    service_version = os.environ.get("OTEL_SERVICE_VERSION", "1.0.0")

    raw_endpoint = os.environ.get("OTEL_EXPORTER_OTLP_ENDPOINT", "localhost:4317")
    endpoint = raw_endpoint
    if endpoint.startswith("http://"):
        endpoint = endpoint[7:]
    elif endpoint.startswith("https://"):
        endpoint = endpoint[8:]

    resource = Resource.create({
        "service.name": service_name,
        "service.version": service_version,
        "deployment.environment": os.environ.get("NODE_ENV", "development"),
    })


    _TRACER_PROVIDER = TracerProvider(resource=resource)
    span_exporter = OTLPSpanExporter(endpoint=endpoint, insecure=True)
    _TRACER_PROVIDER.add_span_processor(
        BatchSpanProcessor(
            span_exporter,
            max_queue_size=2048,
            max_export_batch_size=512,
            schedule_delay_millis=2000,
        )
    )
    trace.set_tracer_provider(_TRACER_PROVIDER)


    metric_exporter = OTLPMetricExporter(endpoint=endpoint, insecure=True)
    metric_reader = PeriodicExportingMetricReader(
        metric_exporter,
        export_interval_millis=15000,
    )
    meter_provider = MeterProvider(resource=resource, metric_readers=[metric_reader])
    metrics.set_meter_provider(meter_provider)


    _LOGGER_PROVIDER = LoggerProvider(resource=resource)
    log_exporter = OTLPLogExporter(endpoint=endpoint, insecure=True)
    _LOGGER_PROVIDER.add_log_record_processor(
        BatchLogRecordProcessor(
            log_exporter,
            max_queue_size=2048,
            max_export_batch_size=512,
            schedule_delay_millis=2000,
        )
    )
    _logs.set_logger_provider(_LOGGER_PROVIDER)


    root_logger = logging.getLogger()
    context_filter = OtelContextFilter()
    root_logger.addFilter(context_filter)

    logging_handler = LoggingHandler(level=logging.INFO, logger_provider=_LOGGER_PROVIDER)
    logging_handler.addFilter(context_filter)
    root_logger.addHandler(logging_handler)

    LoggingInstrumentor().instrument(set_logging_format=True)


    try:
        SystemMetricsInstrumentor().instrument()
    except Exception as e:
        print(f"[Telemetry Warning] SystemMetricsInstrumentor failed: {e}", file=sys.stderr)


    try:
        GrpcInstrumentorClient().instrument()
        GrpcInstrumentorServer().instrument()
        GrpcAioInstrumentorClient().instrument()
        GrpcAioInstrumentorServer().instrument()
    except Exception as e:
        print(f"[Telemetry Warning] GrpcInstrumentor failed: {e}", file=sys.stderr)

    _IS_INITIALIZED = True
    print(
        f"[OpenTelemetry] Initialized for '{service_name}' -> OTLP gRPC endpoint: {endpoint}",
        flush=True,
    )


def get_current_trace_id() -> str | None:
    span = trace.get_current_span()
    if span and span.is_recording():
        ctx = span.get_span_context()
        if ctx.is_valid:
            return format(ctx.trace_id, "032x")
    return None


def set_span_attributes(
    tenant_id: str | None = None,
    agent_id: str | None = None,
    session_id: str | None = None,
    tier: str | None = None,
    user_id: str | None = None,
    is_sandbox: bool | None = None,
    **kwargs: Any,
) -> None:

    span = trace.get_current_span()
    if not span or not span.is_recording():
        return

    if tenant_id:
        span.set_attribute("tenant.id", tenant_id)
    if agent_id:
        span.set_attribute("agent.id", agent_id)
    if session_id:
        span.set_attribute("session.id", session_id)
    if tier:
        span.set_attribute("tenant.tier", tier)
    if user_id:
        span.set_attribute("user.id", user_id)
    if is_sandbox is not None:
        span.set_attribute("session.is_sandbox", is_sandbox)

    for k, v in kwargs.items():
        if v is not None:
            span.set_attribute(k, v)


def flush_telemetry() -> None:
    if _TRACER_PROVIDER:
        try:
            _TRACER_PROVIDER.force_flush(timeout_millis=3000)
        except Exception:
            pass
    if _LOGGER_PROVIDER:
        try:
            _LOGGER_PROVIDER.force_flush(timeout_millis=3000)
        except Exception:
            pass
