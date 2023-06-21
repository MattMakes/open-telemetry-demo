# How To Use This Repo

1. Clone the repo
2. Start Docker daemon
3. Run `npm install`
4. Run `npm run up`
5. Run `npm run start`
6. Navigate to `localhost:3000` to open Grafana

## What you should see:

Loki, Prometheus and Zipkin should all be pre-configured data sources in Grafana.

As you navigate to `localhost:3777`, this should generate traces, metrics and logs that will all get sent to the different apps listed above. From the data sources configured in Grafana, this should allow the data to be queried.

Persistent layers are being used to back Loki, Prometheus and Zipkin, so the server should be able to withstand restarts without losing data.

## Next Up

- Add Grafana dashboards as part of the startup configuration for default views of Loki, Prometheus and Zipkin
- Add example of span events (using traces) to complete MELT combination (i.e. Metrics, Events, Logs, Traces)
- Figure out how to reduce verbose logging from zipkin traces
