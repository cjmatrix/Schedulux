import 'dotenv/config';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-grpc';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { PinoInstrumentation } from '@opentelemetry/instrumentation-pino';
import { RuntimeNodeInstrumentation } from '@opentelemetry/instrumentation-runtime-node';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';

const serviceName = process.env.OTEL_SERVICE_NAME || 'api-gateway';
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

const logExporter = new OTLPLogExporter({
  url: collectorEndpoint,
});

const logRecordProcessor = new BatchLogRecordProcessor({
  exporter: logExporter,
});

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: serviceName,
    [ATTR_SERVICE_VERSION]: '1.0.0',
  }),
  traceExporter,
  metricReaders: [metricReader],
  logRecordProcessors: [logRecordProcessor],
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': { enabled: false },
      '@opentelemetry/instrumentation-dns': { enabled: false },
    }),
    new RuntimeNodeInstrumentation(),
    new PinoInstrumentation({
      disableLogCorrelation: false,
      disableLogSending: false,
      logHook: (span, record) => {
        const attrs = (span as any).attributes;
        if (attrs) {
          if (attrs['tenant.id']) record['tenant_id'] = attrs['tenant.id'];
          if (attrs['agent.id']) record['agent_id'] = attrs['agent.id'];
          if (attrs['session.id']) record['session_id'] = attrs['session.id'];
          if (attrs['user.id']) record['user_id'] = attrs['user.id'];
          if (attrs['tenant.tier']) record['tenant_tier'] = attrs['tenant.tier'];
          if (attrs['tenant.role']) record['tenant_role'] = attrs['tenant.role'];
        }
      },
    }),
  ],
});

sdk.start();
console.log(
  `[OTel] Initialized distributed tracing, metrics & logs for ${serviceName} -> ${collectorEndpoint}`,
);

process.on('SIGTERM', () => {
  sdk
    .shutdown()
    .then(() => console.log(`[OTel] ${serviceName} telemetry shutdown complete`))
    .catch((error) => console.error(`[OTel] Error shutting down telemetry:`, error));
});
