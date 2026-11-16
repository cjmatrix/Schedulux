import 'dotenv/config';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { RuntimeNodeInstrumentation } from '@opentelemetry/instrumentation-runtime-node';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';

const serviceName = process.env.OTEL_SERVICE_NAME || 'identity-tenant';
const collectorEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4317';

const traceExporter = new OTLPTraceExporter({
  url: collectorEndpoint,
});

const metricReader = new PeriodicExportingMetricReader({
  exporter: new OTLPMetricExporter({
    url: collectorEndpoint,
  }),
  exportIntervalMillis: 15000,
});

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: serviceName,
    [ATTR_SERVICE_VERSION]: '1.0.0',
  }),
  traceExporter,
  metricReaders: [metricReader],
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': { enabled: false },
      '@opentelemetry/instrumentation-dns': { enabled: false },
    }),
    new RuntimeNodeInstrumentation(),
  ],
});

sdk.start();
console.log(
  `[OTel] Initialized distributed tracing & metrics for ${serviceName} -> ${collectorEndpoint}`,
);

process.on('SIGTERM', () => {
  sdk
    .shutdown()
    .then(() => console.log(`[OTel] ${serviceName} telemetry shutdown complete`))
    .catch((error) => console.error(`[OTel] Error shutting down telemetry:`, error));
});
