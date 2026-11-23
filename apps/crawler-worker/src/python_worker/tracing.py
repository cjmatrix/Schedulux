from __future__ import annotations

import logging
import os
from typing import Any

from opentelemetry import context, trace
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.trace.propagation.tracecontext import TraceContextTextMapPropagator

logger = logging.getLogger(__name__)

_IS_INITIALIZED = False
_TRACER_PROVIDER: TracerProvider | None = None
_PROPAGATOR = TraceContextTextMapPropagator()


def init_telemetry() -> None:
    """Initializes OpenTelemetry TracerProvider with OTLP gRPC span exporter."""
    global _IS_INITIALIZED, _TRACER_PROVIDER
    if _IS_INITIALIZED:
        return

    service_name = os.environ.get("OTEL_SERVICE_NAME", "crawler-worker")
    service_version = os.environ.get("OTEL_SERVICE_VERSION", "1.0.0")

    raw_endpoint = os.environ.get("OTEL_EXPORTER_OTLP_ENDPOINT", "localhost:4317")
    endpoint = raw_endpoint
    if endpoint.startswith("http://"):
        endpoint = endpoint[7:]
    elif endpoint.startswith("https://"):
        endpoint = endpoint[8:]

    resource = Resource.create(
        {
            "service.name": service_name,
            "service.version": service_version,
            "deployment.environment": os.environ.get("NODE_ENV", "development"),
        }
    )

    _TRACER_PROVIDER = TracerProvider(resource=resource)
    try:
        span_exporter = OTLPSpanExporter(endpoint=endpoint, insecure=True)
        _TRACER_PROVIDER.add_span_processor(
            BatchSpanProcessor(
                span_exporter,
                max_queue_size=2048,
                max_export_batch_size=512,
                schedule_delay_millis=2000,
            )
        )
    except Exception as e:
        logger.warning("[Telemetry] Failed to initialize OTLPSpanExporter: %s", e)

    trace.set_tracer_provider(_TRACER_PROVIDER)
    _IS_INITIALIZED = True
    print(
        f"[Telemetry] OpenTelemetry initialized for '{service_name}' -> OTLP target '{endpoint}'",
        flush=True,
    )


def get_tracer(name: str = "crawler-worker") -> trace.Tracer:
    """Returns a tracer instance."""
    return trace.get_tracer(name)


def extract_trace_context(
    headers: dict[str, Any] | None = None,
    data: dict[str, Any] | None = None,
) -> context.Context:
    """Extracts W3C TraceContext from AMQP headers or JSON data payload."""
    carrier: dict[str, str] = {}
    if headers:
        for k, v in headers.items():
            key = str(k).lower()
            if isinstance(v, bytes):
                carrier[key] = v.decode("utf-8", errors="ignore")
            elif isinstance(v, str):
                carrier[key] = v

    if data:
        if "traceparent" in data and "traceparent" not in carrier:
            carrier["traceparent"] = str(data["traceparent"])
        if "trace_id" in data and "trace_id" not in carrier:
            carrier["trace_id"] = str(data["trace_id"])

    if carrier:
        return _PROPAGATOR.extract(carrier)
    return context.get_current()


def get_active_trace_context() -> tuple[str | None, str | None]:
    """Returns (trace_id, traceparent) from the currently active span."""
    span = trace.get_current_span()
    span_ctx = span.get_span_context() if span else None
    if span_ctx and span_ctx.is_valid:
        trace_id = format(span_ctx.trace_id, "032x")
        traceparent = f"00-{trace_id}-{format(span_ctx.span_id, '016x')}-{span_ctx.trace_flags:02x}"
        return trace_id, traceparent
    return None, None


def inject_trace_context(headers: dict[str, Any], payload: dict[str, Any]) -> None:
    """Injects active W3C traceparent and trace_id into message headers and payload."""
    trace_id, traceparent = get_active_trace_context()
    if traceparent:
        headers["traceparent"] = traceparent
        payload["traceparent"] = traceparent
    if trace_id:
        headers["trace_id"] = trace_id
        payload["trace_id"] = trace_id
