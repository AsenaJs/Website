---
title: Asena OpenTelemetry
description: Automatic HTTP tracing, method-level auto-tracing, metrics, and distributed tracing for Asena
outline: deep
---

# Asena OpenTelemetry

OpenTelemetry integration for AsenaJS — automatic HTTP tracing, method-level auto-tracing, metrics, and distributed tracing support. Your `@Otel` decorated class handles SDK initialization, and `OtelTracingMiddleware` traces every request. A single HTTP request automatically produces a full waterfall trace:

```
GET /api/users (SERVER)
  └─ UserController.list (INTERNAL)
       └─ UserService.getAll (INTERNAL)
```

<div class="card-grid">
  <a class="info-card" href="#quick-start">
    <span class="ic-kicker">01</span>
    <div class="ic-title">Quick Start</div>
    <p class="ic-desc">The <code>@Otel</code> decorator and your first trace.</p>
  </a>
  <a class="info-card" href="#how-auto-tracing-works">
    <span class="ic-kicker">02</span>
    <div class="ic-title">How Auto-Tracing Works</div>
    <p class="ic-desc">The HTTP → Controller → Service span waterfall.</p>
  </a>
  <a class="info-card" href="#otelservice-api">
    <span class="ic-kicker">03</span>
    <div class="ic-title">OtelService API</div>
    <p class="ic-desc">Creating spans and recording metrics by hand.</p>
  </a>
  <a class="info-card" href="#configuration">
    <span class="ic-kicker">04</span>
    <div class="ic-title">Configuration</div>
    <p class="ic-desc">Exporters, resource attributes and instrumentation options.</p>
  </a>
  <a class="info-card" href="#sampling">
    <span class="ic-kicker">05</span>
    <div class="ic-title">Sampling</div>
    <p class="ic-desc"><code>ratioBasedSampler</code> for production traffic.</p>
  </a>
  <a class="info-card" href="#outgoing-request-context-propagation">
    <span class="ic-kicker">06</span>
    <div class="ic-title">Context Propagation</div>
    <p class="ic-desc">W3C <code>traceparent</code> in and out of your service.</p>
  </a>
</div>

## Features

- **Decorator-Based Setup** — `@Otel` decorator handles SDK initialization and IoC registration
- **Automatic HTTP Tracing** — `OtelTracingMiddleware` traces all requests with zero code changes
- **Method-Level Auto-Tracing** — Auto-wrap `@Service` and `@Controller` methods with `INTERNAL` spans
- **Waterfall Trace Hierarchy** — HTTP → Controller → Service parent-child spans automatically
- **Metrics Collection** — Request counter and duration histogram per route
- **W3C Context Propagation** — Extract incoming `traceparent`, inject outgoing context
- **Route Exclusion** — `ignoreRoutes` with exact and wildcard matching
- **Custom Sampling** — `ratioBasedSampler` helper for production
- **Flush on Shutdown** — `server.stop()` flushes and releases the SDK through an `@OnStop` hook
- **Minimal Dependencies** — One runtime dependency (`@opentelemetry/context-async-hooks`); everything else is a peer dep

## Installation

```bash
bun add @asenajs/asena-otel @opentelemetry/api @opentelemetry/resources @opentelemetry/sdk-trace-base @opentelemetry/sdk-metrics @opentelemetry/semantic-conventions @opentelemetry/context-async-hooks
```

For OTLP exporters (Jaeger, Grafana Tempo, etc.):

```bash
bun add @opentelemetry/exporter-trace-otlp-http @opentelemetry/exporter-metrics-otlp-http
```

::: info Requirements
- [Bun](https://bun.sh) v1.3.12 or higher
- [@asenajs/asena](https://github.com/AsenaJs/Asena) v0.10.0 or higher
:::

## Quick Start

### 1. Create an @Otel Class

Create a class that extends `OtelTracingPostProcessor` and apply the `@Otel` decorator. Asena automatically discovers and initializes it during bootstrap.

```typescript
// src/otel/AppOtel.ts
import { Otel, OtelTracingPostProcessor } from '@asenajs/asena-otel';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';

@Otel({
  serviceName: 'my-app',
  serviceVersion: '1.0.0',
  traceExporter: new OTLPTraceExporter({
    url: 'http://localhost:4318/v1/traces',
  }),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      url: 'http://localhost:4318/v1/metrics',
    }),
  }),
  autoTrace: {
    services: true,
    controllers: true,
  },
})
export class AppOtel extends OtelTracingPostProcessor {}
```

::: tip Zero Config Discovery
Asena's IoC container automatically discovers your `@Otel` class and `OtelService`. No manual component registration needed — except for `OtelTracingMiddleware`, which requires a local wrapper class (see Step 2).
:::

#### Lazy options

`@Otel` also accepts a **thunk** returning the options. It is not called at decoration time: it
runs once when the post-processor initialises (`onInit`), after module-level configuration has been
read, and the result is cached. Per-service values can therefore come from the environment, and the
decorated class can live in a shared package:

```typescript
@Otel(() => ({
  serviceName: process.env.SERVICE_NAME!,
  traceExporter: new OTLPTraceExporter({ url: process.env.OTLP_URL }),
}))
export class AppOtel extends OtelTracingPostProcessor {}
```

The plain options-object form is unchanged.

### 2. Create a Local Middleware Class

Create a class in your `src` folder that extends `OtelTracingMiddleware` and apply the `@Middleware()` decorator. This registers the middleware in Asena's IoC container.

```typescript
// src/middlewares/AppOtelMiddleware.ts
import { Middleware } from '@asenajs/asena/decorators';
import { OtelTracingMiddleware } from '@asenajs/asena-otel';

@Middleware()
export class AppOtelMiddleware extends OtelTracingMiddleware {}
```

::: warning Important
Asena's IoC container only scans the `src` folder defined in your `asena-config.ts`. Since `OtelTracingMiddleware` lives in `node_modules`, the container cannot discover it automatically. You **must** create a local class extending it with `@Middleware()` so that Asena can register and use it. Without this step, the container will throw an error because it cannot find the middleware.
:::

### 3. Register the Middleware in Your Config

Add `AppOtelMiddleware` to your config's `globalMiddlewares()`. This is required so that all HTTP requests are traced automatically.

```typescript
import { Config } from '@asenajs/asena/decorators';
import { ConfigService, type Context } from '@asenajs/ergenecore';
import { isHttpException } from '@asenajs/asena/adapter';
import { AppOtelMiddleware } from '../middlewares/AppOtelMiddleware';
import { AppCorsMiddleware } from '../middlewares/AppCorsMiddleware';

@Config()
export class AppConfig extends ConfigService {

  public globalMiddlewares() {
    return [
      AppOtelMiddleware,  // traces all HTTP requests automatically
      AppCorsMiddleware,
    ];
  }

  public onError(error: Error, context: Context) {
    if (isHttpException(error)) {
      // Answer with the body the exception carries; `error.message` is that body
      // already flattened to a string, so re-wrapping it double-encodes an object
      return error.getResponse?.() ?? context.send({ error: error.message }, error.status);
    }
    return context.send({ error: 'Internal Server Error' }, 500);
  }

}
```

That's it. All HTTP requests are traced, service methods are auto-traced, and metrics are collected — without changing any business logic.

## How Auto-Tracing Works

When `autoTrace` is enabled, `OtelTracingPostProcessor` wraps component methods with a JavaScript Proxy. Each method call creates an `INTERNAL` span named `"{ClassName}.{methodName}"`. Combined with the middleware's `SERVER` span, this produces a full waterfall:

```
GET /api/users (SERVER span — OtelTracingMiddleware)
  └─ UserController.list (INTERNAL span — auto-traced)
       └─ UserService.getAll (INTERNAL span — auto-traced)
            └─ UserService._buildQuery (NOT traced — private method)
```

All spans in the same request share the same `traceId` and form a parent-child hierarchy via `context.with()`.

::: info What Gets Traced
| Decorator | Auto-Traced |
|:----------|:------------|
| `@Service` | Yes |
| `@Controller` | Yes |
| `@Repository` | Yes (treated as Service) |
| `@Redis` | Yes (treated as Service) |
| `@Middleware` | No |
| `@Component` | No |

Private methods (starting with `_`), constructors, and Symbol-keyed methods are always skipped.
:::

## OtelService API

`OtelService` is an injectable `@Service` that provides access to OpenTelemetry tracer and meter. Asena automatically discovers it — just inject where needed.

::: tip When the scan cannot see it
Discovery works because your `sourceFolder` is scanned and `OtelService` is registered along with
the `@Otel` class. A project whose components come from packages rather than a scanned source
folder can hand it in directly instead of writing a local subclass just to make it visible:

```typescript
import { OtelService } from '@asenajs/asena-otel';

await AsenaServerFactory.create({
  adapter,
  logger,
  imports: [OtelService],
});
```

See [Registering components from packages](/docs/concepts/dependency-injection#registering-components-from-packages).
:::

### withSpan(name, fn)

Wraps an async function in a span with automatic status and exception handling:

```typescript
import { Service } from '@asenajs/asena/decorators';
import { Inject } from '@asenajs/asena/decorators/ioc';
import type { OtelService } from '@asenajs/asena-otel';

@Service()
export class OrderService {

  @Inject('OtelService')
  private otelService: OtelService;

  async processOrder(orderId: string) {
    return this.otelService.withSpan('process-order', async (span) => {
      span.setAttribute('order.id', orderId);
      // ... business logic
      return { success: true };
    });
    // span automatically ends, errors are recorded
  }

}
```

### getActiveSpan()

Returns the currently active span, or `undefined` if there is none:

```typescript
const span = this.otelService.getActiveSpan();
if (span) {
  span.setAttribute('custom.key', 'value');
}
```

### injectTraceContext(headers?)

Injects W3C `traceparent` header into a headers object for distributed tracing. See [Outgoing Request Context Propagation](#outgoing-request-context-propagation) for full usage.

```typescript
const headers = this.otelService.injectTraceContext({
  'Content-Type': 'application/json',
});
// headers now contains { 'Content-Type': '...', 'traceparent': '00-...' }
```

### Expression Injection

For direct tracer/meter access without going through `OtelService` methods:

```typescript
@Inject('OtelService', (s) => s.tracer)
private tracer: Tracer;

@Inject('OtelService', (s) => s.meter)
private meter: Meter;
```

### API Reference

| Method | Parameters | Returns | Description |
|:-------|:-----------|:--------|:------------|
| `withSpan(name, fn)` | `name: string, fn: (span: Span) => Promise<T>` | `Promise<T>` | Create span, auto-end, record errors |
| `getActiveSpan()` | — | `Span \| undefined` | Get current active span |
| `injectTraceContext(headers?)` | `headers?: Record<string, string>` | `Record<string, string>` | Inject W3C traceparent header |
| `tracer` | — | `Tracer` | OpenTelemetry Tracer instance |
| `meter` | — | `Meter` | OpenTelemetry Meter instance |

## OtelTracingMiddleware

`@Middleware` that automatically traces all HTTP requests. Must be registered in your Config's `globalMiddlewares()`.

**Creates for each request:**
- A `SERVER` span named `"{METHOD} {PATH}"` (e.g., `GET /api/users`)
- After route matching, the span name is updated to use the route pattern (e.g., `GET /api/users/:id`) for low-cardinality naming

**Span Attributes:**

| Attribute | Example | Description |
|:----------|:--------|:------------|
| `http.request.method` | `GET` | HTTP method |
| `url.path` | `/api/users/123` | Request path |
| `http.route` | `/api/users/:id` | Route pattern (after matching) |
| `http.response.status_code` | `200` | Response status code |

**Metrics:**

| Metric | Type | Description |
|:-------|:-----|:------------|
| `http.server.request.count` | Counter | Total requests by method/path |
| `http.server.request.duration` | Histogram (ms) | Request duration by method/path |

The middleware also extracts incoming W3C `traceparent` headers, enabling distributed tracing when other services call your API.

## Shutdown

`server.stop()` runs `shutdown()` on your `@Otel` class through an
[`@OnStop`](/docs/concepts/lifecycle) hook: buffered spans and metrics are flushed, the exporter
timers stop, and the context manager is unhooked. There is nothing to call by hand, and nothing to
register — the hook is inherited from `OtelTracingPostProcessor`.

Each step runs independently and every failure is logged rather than thrown, so a collector that
cannot be reached does not take the application down with it. `shutdown()` is safe to call twice;
the second call has nothing left to release.

::: warning The package no longer installs its own signal handlers
Up to now this package registered `process.on('SIGTERM')` and `process.on('SIGINT')` of its own.
That was wrong three ways: the async listener's rejection was unheld, so an unreachable collector
— the normal case for a local `Ctrl+C` — killed the process with `ECONNREFUSED`; the listeners were
never removed, so repeated boots in one process piled them up; and `server.stop()` on its own
flushed nothing, leaving the `BatchSpanProcessor` timer and the metric reader's export interval
running.

Signals are now [handled by the server](/docs/concepts/lifecycle#signal-handling), which calls
`stop()`, which drives this hook. If you added a `SIGTERM` handler of your own to work around the
missing flush, remove it.
:::

## Configuration

### AsenaOtelOptions

```typescript
interface AsenaOtelOptions {
  serviceName: string;           // Required: identifies your service
  serviceVersion?: string;       // Optional: defaults to '0.0.0'
  traceExporter: SpanExporter;   // Required: where to send spans
  metricReader?: MetricReader;   // Optional: enables metrics collection
  autoTrace?: AutoTraceConfig;   // Optional: auto-trace settings
  sampler?: Sampler;             // Optional: custom sampling strategy
  ignoreRoutes?: string[];       // Optional: routes to exclude from tracing
}
```

### AutoTraceConfig

```typescript
interface AutoTraceConfig {
  services?: boolean;     // auto-trace @Service methods (default: false)
  controllers?: boolean;  // auto-trace @Controller methods (default: false)
}
```

| Field | Type | Default | Description |
|:------|:-----|:--------|:------------|
| `serviceName` | `string` | — | Required. Identifies your service in traces |
| `serviceVersion` | `string` | `'0.0.0'` | Service version for resource attributes |
| `traceExporter` | `SpanExporter` | — | Required. Where to send spans (OTLP, Jaeger, etc.) |
| `metricReader` | `MetricReader` | — | Enables metrics collection |
| `autoTrace` | `AutoTraceConfig` | `{}` | Which component types to auto-trace |
| `sampler` | `Sampler` | — | Custom sampling strategy |
| `ignoreRoutes` | `string[]` | `[]` | Routes to exclude from tracing |

## Sampling

Use `ratioBasedSampler()` for production environments to control trace volume:

```typescript
import { Otel, OtelTracingPostProcessor, ratioBasedSampler } from '@asenajs/asena-otel';

@Otel({
  serviceName: 'my-app',
  traceExporter: exporter,
  sampler: ratioBasedSampler(0.1),  // sample 10% of traces
  autoTrace: { services: true, controllers: true },
})
export class AppOtel extends OtelTracingPostProcessor {}
```

`ratioBasedSampler(ratio)` creates a `ParentBasedSampler` wrapping `TraceIdRatioBasedSampler`. Root spans are sampled at the given ratio (0.0–1.0); child spans respect the parent's decision.

::: tip Production Recommendation
Always configure a sampler in production to control trace volume and reduce exporter costs. A ratio of `0.1` (10%) is a good starting point for most applications.
:::

## Route Exclusion

Use `ignoreRoutes` to skip tracing on specific paths (e.g., health checks, metrics endpoints):

```typescript
@Otel({
  serviceName: 'my-app',
  traceExporter: exporter,
  ignoreRoutes: ['/health', '/metrics', '/admin/*'],
})
export class AppOtel extends OtelTracingPostProcessor {}
```

- **Exact match:** `/health` matches only `/health`
- **Wildcard suffix:** `/admin/*` matches `/admin/` and all sub-paths

Ignored routes produce no spans and no metrics.

::: warning Match the static path, not the route pattern
Routes are matched against the URL path before route matching occurs. Use the static path, not the route pattern.
:::

## Outgoing Request Context Propagation

`@asenajs/asena-otel` automatically traces **incoming** HTTP requests via `OtelTracingMiddleware` (extracts W3C `traceparent` header). However, **outgoing** HTTP calls (e.g., `fetch` to another service) are **not** automatically instrumented.

::: warning No Automatic Fetch Instrumentation
When your service calls another service via `fetch`, the trace context is **not** propagated automatically. You must use `OtelService.injectTraceContext()` to manually add the `traceparent` header to outgoing requests.
:::

Use `OtelService.injectTraceContext()` to propagate trace context to downstream services:

```typescript
@Service()
export class PaymentClient {

  @Inject('OtelService')
  private otelService: OtelService;

  async charge(payload: ChargeRequest) {
    const headers = this.otelService.injectTraceContext({
      'Content-Type': 'application/json',
    });

    const res = await fetch('http://payment-service/api/charge', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    return res.json();
  }

}
```

For full visibility, combine with `withSpan()` to create a dedicated span for the outgoing call:

```typescript
async charge(payload: ChargeRequest) {
  return this.otelService.withSpan('call-payment-service', async (span) => {
    span.setAttribute('service.target', 'payment-service');

    const headers = this.otelService.injectTraceContext();
    const res = await fetch('http://payment-service/api/charge', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return res.json();
  });
}
```

This writes a `traceparent` header in the format `00-{traceId}-{spanId}-{traceFlags}`. The downstream service extracts this header to continue the same trace, enabling end-to-end distributed tracing across microservices.

## Microservice Messaging Instrumentation

For Asena's [microservice layer](/docs/concepts/microservices), trace propagation is fully automatic — register the `otelMessaging()` interceptor in your `transport()` config:

```typescript
import { otelMessaging } from '@asenajs/asena-otel';
import { RedisMicroserviceTransport } from '@asenajs/asena-redis';

@Config()
export class AppConfig extends ConfigService {
  public transport() {
    return {
      microservice: new RedisMicroserviceTransport(
        { url: 'redis://localhost:6379' }, // connection
        { serviceName: 'order-service' },  // required options
      ),
      interceptors: [otelMessaging({ system: 'redis' })],
    };
  }
}
```

What it does:

- **Outgoing `send`/`emit`**: opens a `PRODUCER` span (`send order.create` / `publish order.created`) and injects `traceparent`/`tracestate` into the message headers. Because the interceptor wraps the whole operation, RPC spans carry the full round-trip duration and error state.
- **Incoming handlers**: extracts the upstream context from the message headers and runs the handler inside a `CONSUMER` span (`process order.create`) — services join into **one distributed trace** with no manual propagation.
- **Attributes**: `messaging.system`, `messaging.destination.name`, `messaging.operation.type`, `messaging.message.id`; redeliveries set `messaging.redelivery_count`.

Register the interceptor in **every** service (producers and consumers alike) so the chain stays unbroken end-to-end.

## Testing

Use `InMemorySpanExporter` and `InMemoryMetricExporter` for testing:

```typescript
import { Otel, OtelTracingPostProcessor } from '@asenajs/asena-otel';
import { InMemorySpanExporter } from '@opentelemetry/sdk-trace-base';
import {
  AggregationTemporality,
  InMemoryMetricExporter,
  PeriodicExportingMetricReader,
} from '@opentelemetry/sdk-metrics';

const spanExporter = new InMemorySpanExporter();
// InMemoryMetricExporter requires an aggregation temporality
const metricExporter = new InMemoryMetricExporter(AggregationTemporality.CUMULATIVE);
const metricReader = new PeriodicExportingMetricReader({
  exporter: metricExporter,
  exportIntervalMillis: 100,
});

@Otel({
  serviceName: 'test-service',
  traceExporter: spanExporter,
  metricReader,
  autoTrace: { services: true, controllers: true },
})
export class TestOtel extends OtelTracingPostProcessor {}
```

After making requests, flush spans (`BatchSpanProcessor` is lazy):

```typescript
import { trace } from '@opentelemetry/api';

const provider = trace.getTracerProvider() as any;
await provider.forceFlush?.();
const spans = spanExporter.getFinishedSpans();
```

For metrics:

```typescript
await metricReader.forceFlush();
const metrics = metricExporter.getMetrics();
```

### Verifying Parent-Child Hierarchy

In OpenTelemetry SDK v2, use `parentSpanContext` (not `parentSpanId`):

```typescript
import { SpanKind } from '@opentelemetry/api';

const httpSpan = spans.find(s => s.kind === SpanKind.SERVER);
const serviceSpan = spans.find(s => s.name.includes('UserService'));

// Same trace
expect(serviceSpan.spanContext().traceId).toBe(httpSpan.spanContext().traceId);

// Parent-child link (SDK v2)
expect(serviceSpan.parentSpanContext?.spanId).toBe(httpSpan.spanContext().spanId);
```

## Best Practices

### 1. Keep @Otel Class in a Dedicated File

```typescript
// ✅ Good: src/otel/AppOtel.ts — easy to find and modify
@Otel({ ... })
export class AppOtel extends OtelTracingPostProcessor {}
```

### 2. Use Sampler in Production

```typescript
// ✅ Good: control trace volume
@Otel({
  sampler: ratioBasedSampler(0.1),
  // ...
})
```

### 3. Exclude Health and Metrics Routes

```typescript
// ✅ Good: avoid noise from readiness probes
@Otel({
  ignoreRoutes: ['/health', '/ready', '/metrics'],
  // ...
})
```

### 4. Inject Trace Context for Outgoing Calls

```typescript
// ✅ Good: propagate context to downstream services
const headers = this.otelService.injectTraceContext();
await fetch('http://other-service/api', { headers });
```

## Related

- [PostProcessor](/docs/concepts/post-processor) - How PostProcessors work in Asena
- [Component Lifecycle](/docs/concepts/lifecycle) - `@OnStop`, signal handling and shutdown ordering
- [Services](/docs/concepts/services) - Service layer architecture
- [Middleware](/docs/concepts/middleware) - Middleware system and registration
- [Dependency Injection](/docs/concepts/dependency-injection) - IoC container and `@Inject`
- [Configuration](/docs/guides/configuration) - Server configuration with `@Config`
