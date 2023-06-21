const { Resource } = require('@opentelemetry/resources')
const {
  SemanticResourceAttributes,
} = require('@opentelemetry/semantic-conventions')
const { NodeTracerProvider } = require('@opentelemetry/sdk-trace-node')
const { registerInstrumentations } = require('@opentelemetry/instrumentation')
const {
  ConsoleSpanExporter,
  BatchSpanProcessor,
  // eslint-disable-next-line node/no-extraneous-require
} = require('@opentelemetry/sdk-trace-base')
const opentelemetryApi = require('@opentelemetry/api')
const {
  MeterProvider,
  PeriodicExportingMetricReader,
  ConsoleMetricExporter,
} = require('@opentelemetry/sdk-metrics')
const opentelemetry = require('@opentelemetry/sdk-node')
const {
  getNodeAutoInstrumentations,
} = require('@opentelemetry/auto-instrumentations-node')
const {
  OTLPTraceExporter,
} = require('@opentelemetry/exporter-trace-otlp-proto')
const {
  OTLPMetricExporter,
} = require('@opentelemetry/exporter-metrics-otlp-proto')
const { ZipkinExporter } = require("@opentelemetry/exporter-zipkin")

const resource = Resource.default().merge(
  new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'my-test-api',
    [SemanticResourceAttributes.SERVICE_VERSION]:
      process.env.npm_package_version,
  }),
)

const startTracing = () => {
  // Optionally register instrumentation libraries
  registerInstrumentations({
    instrumentations: [],
  })
  const provider = new NodeTracerProvider({
    resource: resource,
  })
  const exporter = new ConsoleSpanExporter()
  const processor = new BatchSpanProcessor(exporter)
  provider.addSpanProcessor(processor)
  provider.addSpanProcessor(new BatchSpanProcessor(new ZipkinExporter()))
  provider.register()
}

const startMetrics = () => {
  const metricReader = new PeriodicExportingMetricReader({
    exporter: new ConsoleMetricExporter(),

    // Default is 60000ms (60 seconds). Set to 3 seconds for demonstrative purposes only.
    exportIntervalMillis: 3000,
  })

  const myServiceMeterProvider = new MeterProvider({
    resource: resource,
  })
  myServiceMeterProvider.addMetricReader(metricReader)
  // Set this MeterProvider to be global to the app being instrumented.
  opentelemetryApi.metrics.setGlobalMeterProvider(myServiceMeterProvider)
}

const startDataExporter = () => {
  const sdk = new opentelemetry.NodeSDK({
    traceExporter: new OTLPTraceExporter(),
    instrumentations: [getNodeAutoInstrumentations()],
  })
  sdk.start()
}

startTracing()
startMetrics()
startDataExporter()
