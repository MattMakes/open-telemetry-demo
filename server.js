const http = require('http')
const url = require('url')
const express = require('express');
const app = express();
const client = require('prom-client')
const winston = require('winston')
const LokiTransport = require('winston-loki')

const { MeterProvider } = require('@opentelemetry/metrics');
const { PrometheusExporter } = require('@opentelemetry/exporter-prometheus');

const { NodeTracerProvider } = require('@opentelemetry/node');
const { SimpleSpanProcessor } = require('@opentelemetry/tracing');
const { ZipkinExporter } = require('@opentelemetry/exporter-zipkin');
const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http');
const { ExpressInstrumentation } = require('@opentelemetry/instrumentation-express');
const { registerInstrumentations } = require('@opentelemetry/instrumentation')

const provider = new NodeTracerProvider();
const register = new client.Registry()

register.setDefaultLabels({
  app: 'default-nodejs-app',
  env: 'dev'
})

client.collectDefaultMetrics({ register })

const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in microseconds',
  labelNames: ['method', 'route', 'code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
})

register.registerMetric(httpRequestDurationMicroseconds)

// Configure span processor to send spans to the exporter as they are ended.
const spanProcessor = new SimpleSpanProcessor(
  new ZipkinExporter({
    serviceName: 'express-example',
    // Point this to your locally running Zipkin instance
    url: 'http://localhost:9411/api/v2/spans',
  }),
);

provider.addSpanProcessor(spanProcessor);

// Register the tracer
provider.register();

// Register instrumentations
registerInstrumentations({
  instrumentations: [
    new HttpInstrumentation(),
    new ExpressInstrumentation(),
  ],
});

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'this-api' },
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
    new LokiTransport({
      host: 'http://127.0.0.1:3100',
      labels: { job: 'winston-loki-example', env: 'dev' }
    })
  ],
});

app.use(async (req, res, next) => {
  // Start the timer
  const end = httpRequestDurationMicroseconds.startTimer()

  // Retrieve route from request object
  const route = url.parse(req.url).pathname

  if (route === '/metrics') {
    // Return all metrics the Prometheus exposition format
    res.setHeader('Content-Type', register.contentType)
    res.end(await register.metrics())
  }

  res.on('finish', () => {
    end({ route, code: res.statusCode, method: req.method })
  });

  next()
})


app.get('/', (req, res) => {
  logger.info(req)
  logger.info('Hello World!')
  logger.warn('Warning, Hello World!')
  logger.error('Error, Hello World!')
  res.send('Hello World!');
});

const port = 3777;
const server = http.createServer(app)
// Start the HTTP server which exposes the metrics on http://localhost:8080/metrics
server.listen(port)