const { NodeTracerProvider } = require('@opentelemetry/sdk-trace-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http');
const { ExpressInstrumentation } = require('@opentelemetry/instrumentation-express');
const { registerInstrumentations } = require('@opentelemetry/instrumentation');

const provider = new NodeTracerProvider({
  resource: { attributes: { 'service.name': 'api-web' } }
});

provider.addSpanProcessor(
  new (require('@opentelemetry/sdk-trace-node').SimpleSpanProcessor)(
    new OTLPTraceExporter({ url: 'http://tempo-service:4318/v1/traces' })
  )
);

provider.register();

registerInstrumentations({
  instrumentations: [
    new HttpInstrumentation(),
    new ExpressInstrumentation()
  ]
});

console.log('OpenTelemetry tracing initialized');
