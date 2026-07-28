---
title: Microservices
description: Broker-agnostic microservice messaging with request/response, events, headless mode and production-grade delivery semantics
outline: deep
---

# Microservices

Asena's microservice layer lets independent Asena services communicate through a message broker — supporting both **orchestration** (request/response) and **choreography** (fire-and-forget events). The transport is pluggable: the core defines a broker-agnostic SPI, and transport packages ([Redis Streams](/docs/packages/redis) and [Kafka](/docs/packages/kafka) today, more in the future) implement it.

## Key Features

- **🎯 Pattern-Based Handlers** - `@MessagePattern` (RPC) and `@EventPattern` (events) on `@MessageController` classes
- **🔌 Broker-Agnostic SPI** - Swap transports without touching business logic
- **📮 Ulak Client API** - `ulak.messages('order')` scoped injection, `send()`/`emit()` everywhere
- **🕶️ Headless Mode** - Run a service without an HTTP server, driven purely by messages
- **🏭 Production Semantics** - At-least-once events with retry + DLQ, graceful drain, reconnect (Redis Streams, Kafka)
- **🧵 Multi-Broker Support** - Bind different controllers to different named transports
- **🔭 Distributed Tracing** - OpenTelemetry propagation via messaging interceptors
- **📦 Zero Dependencies** - The core SPI is plain TypeScript; brokers live in separate packages

---

## Quick Start

### 1. Create a Message Controller

```typescript
import { MessageController } from '@asenajs/asena/decorators';
import { Inject } from '@asenajs/asena/decorators/ioc';
import { MessagePattern, EventPattern, type MessageContext } from '@asenajs/asena/microservice';

@MessageController('order') // prefix - applied to every handler below
export class OrderHandler {
  @Inject('OrderService')
  private orderService: OrderService;

  @Inject('SearchIndexService')
  private searchIndex: SearchIndexService;

  // Request/Response (orchestration): return value is the reply
  @MessagePattern('create') // handles 'order.create'
  async create(data: CreateOrderDto, context: MessageContext) {
    return await this.orderService.create(data);
  }

  // Fire-and-forget event (choreography): wildcards allowed
  @EventPattern('created') // handles 'order.created'
  async onCreated(event: OrderEvent, context: MessageContext) {
    await this.searchIndex.update(event);
  }

  // Another service's event vocabulary - opt out of the prefix
  @EventPattern({ pattern: 'payment.completed', prefix: false })
  async onPaymentCompleted(event: PaymentEvent, context: MessageContext) {
    await this.orderService.markPaid(event.orderId);
  }
}
```

> **Prefix rule:** the controller prefix is joined onto **every** `@MessagePattern` and `@EventPattern` in the class (`order` + `create` → `order.create`, `order` + `created` → `order.created`). A handler opts out with `prefix: false` and is then registered verbatim.

This is the same rule the client side uses: `ulak.messages('order').emit('created')` publishes `order.created`, and `@MessageController('order') @EventPattern('created')` subscribes to `order.created`. Sender and listener always agree.

Use `prefix: false` when the name is **not yours**: another service's events, a [Kafka external topic](/docs/packages/kafka#external-topics-interop), or a global catch-all.

::: warning Migrating from 0.7
In 0.7 the prefix was applied to `@MessagePattern` only, and `@EventPattern` was always absolute. Every `@EventPattern` on a **prefixed** controller now changes its subscription name and must either be rewritten relative to the prefix or given `prefix: false`.

- `@MessageController('order') @EventPattern('payment.completed')` → now subscribes to `order.payment.completed`. Add `prefix: false` to keep the old behavior.
- `@EventPattern('*')` under a prefix is **no longer a global catch-all** — it becomes `order.*`. Audit and logging listeners need `prefix: false`.
- A wildcard controller prefix (`@MessageController('order.*')`) is now a boot error.
- Controllers with no prefix are unaffected.

Asena prints the resolved patterns for every controller at boot, so you can see exactly what each handler subscribes to:

```
[Microservice] OrderHandler → "default" (prefix "order") msg: order.create | evt: order.created, payment.completed
```
:::

### 2. Configure a Transport

```typescript
import { Config } from '@asenajs/asena/decorators';
import { RedisMicroserviceTransport } from '@asenajs/asena-redis';

@Config()
export class AppConfig extends ConfigService {
  transport() {
    return {
      microservice: new RedisMicroserviceTransport(
        { url: 'redis://localhost:6379' },
        { serviceName: 'order-service' }, // serviceName REQUIRED: consumer group identity
      ),
    };
  }
}
```

The same shape works for [Kafka](/docs/packages/kafka) — only the transport line changes:

```typescript
import { KafkaMicroserviceTransport } from '@asenajs/asena-kafka';

microservice: new KafkaMicroserviceTransport(
  { brokers: ['localhost:9092'] },
  { serviceName: 'order-service' },
),
```

### 3. Send Messages from Any Service

```typescript
import { Service } from '@asenajs/asena/decorators';
import { Inject } from '@asenajs/asena/decorators/ioc';
import { ulak, type Ulak } from '@asenajs/asena/messaging';

@Service()
export class CheckoutService {
  @Inject(ulak.messages('order'))
  private orders: Ulak.Messages<'order'>;

  async checkout(dto: CheckoutDto) {
    // RPC - awaits the remote handler's reply
    // `send<T>` defaults to `unknown` - name the reply type to use it
    const order = await this.orders.send<{ id: string }>('create', dto); // → 'order.create'

    // Event - fire-and-forget
    await this.orders.emit('created', { id: order.id }); // → 'order.created'
  }
}
```

The full `Ulak` instance can also be injected for absolute patterns:

```typescript
@Inject(ICoreServiceNames.__ULAK__)
private ulak: Ulak;

await this.ulak.send('inventory.reserve', { sku: 'A1' });
await this.ulak.emit('audit.recorded', entry);
```

---

## Headless Mode

An Asena service does not need an HTTP server. Omit the adapter and the service lives purely on microservice messages, events and schedules:

```typescript
import { AsenaServerFactory } from '@asenajs/asena';

const server = await AsenaServerFactory.create({
  headless: true, // explicit opt-in - omitting the adapter alone throws
  logger,
  health: { port: 9090 }, // optional K8s probe endpoint
});

await server.start(); // no HTTP port is opened
```

What still runs in headless mode: configs, the microservice layer, the in-process event system, scheduled tasks. HTTP-only components (`@Controller`, `@WebSocket`, `@FrontendController`) are ignored with a warning.

### Health Endpoint

With `health: { port }`, a minimal `Bun.serve` endpoint reports process liveness and per-transport connection state — built for Kubernetes probes:

```jsonc
// GET :9090/healthz → 200 while all transports are connected
{ "status": "up", "uptime": 123, "transports": { "default": "connected" } }
// → 503 with "status": "degraded" when any transport is disconnected
```

---

## Delivery Semantics

Understanding the guarantees is essential for production use. With the broker transports:

| Aspect | Events (`@EventPattern`) | RPC (`@MessagePattern`) |
|---|---|---|
| Guarantee | **At-least-once** (consumer groups + ack/commit) | At-most-once per attempt |
| Handler error | No ack → broker redelivers up to `maxRetries`, then **DLQ** | **Final**: `ok:false` reply + ack — no broker retry |
| Service offline | Messages wait in the stream/topic | Caller times out (`UlakErrorCode.TIMEOUT`) |
| Crash mid-handling | Another replica takes over (Redis: XCLAIM; Kafka: rebalance) | Request rescued only if the caller hasn't timed out |

Broker-specific mechanics (retry latency, ordering, offline tolerance) are documented on each transport's package page: [Redis](/docs/packages/redis#delivery-guarantees), [Kafka](/docs/packages/kafka#delivery-guarantees).

### Idempotent Handlers

At-least-once means **duplicate delivery is normal** — a crash after handling but before ACK causes redelivery. Event handlers must be idempotent. Use `context.messageId` (stable across redeliveries) for deduplication:

```typescript
@EventPattern('payment.completed')
async onPayment(event: PaymentEvent, context: MessageContext) {
  if (await this.processedStore.has(context.messageId)) return; // duplicate
  await this.orderService.markPaid(event.orderId);
  await this.processedStore.add(context.messageId);
}
```

`context.attempt > 1` tells you the delivery is a retry.

### Operational Rules

- **Handler duration must stay below `claimIdleMs`** (default 60s) — otherwise the sweep assumes the replica crashed and a second replica processes the same entry concurrently.
- **`maxStreamLength` bounds memory but also offline tolerance** — events older than the trim window are lost for services that stay down too long. Size it against your worst-case deployment gap.
- **Monitor the DLQ stream** (`asena:ms:dlq`) — poison events land there after `maxRetries`, with `origin_stream`, `origin_group` and `delivery_count` fields.
- **`@PostConstruct` cannot send messages** — transports are wired during application setup (after component init), so `ulak.send/emit` in `@PostConstruct` throws `NO_TRANSPORT`.

---

## Multiple Named Transports

Different parts of one project can use different brokers:

```typescript
transport() {
  return {
    microservice: {
      default: new RedisMicroserviceTransport({ url }, { serviceName: 'order-service' }),
      analytics: new KafkaMicroserviceTransport({ brokers }, { serviceName: 'order-service' }),
    },
  };
}
```

```typescript
// Handler side - bind the controller to a named transport
@MessageController({ prefix: 'metrics', transport: 'analytics' })
export class AnalyticsHandler { ... }

// Client side - select the transport in the injection helper
@Inject(ulak.messages('metrics', { transport: 'analytics' }))
private metrics: Ulak.Messages<'metrics'>;
```

A single (unnamed) transport is registered under the name `default`. Binding a controller to an unknown transport name fails at boot with the list of configured names.

A proven real-world shape for this is the **cross-broker bridge**: keep Redis as `default` so every existing prefix-only controller works unchanged, add Kafka as a named transport, and let one deliberately transport-aware controller consume Kafka-side events and re-emit them onto the default side via `Ulak` (headers copied along, so tracing metadata survives the hop). Services without Kafka handlers boot their Kafka transport client-only — zero handlers means no consumer group. The health endpoint reports each named transport separately (`transports: { default: 'connected', kafka: 'connected' }`), so a partial broker outage degrades to 503 while the other broker keeps flowing. See the [Kafka package docs](/docs/packages/kafka) for the Kafka side of such a setup.

---

## Graceful Shutdown

`server.stop()` drains the microservice layer before closing:

1. Consuming stops (no new messages are read)
2. In-flight handlers get `drainTimeout` (default 10s) to finish — completed ones ACK, unfinished ones stay pending for another replica
3. Pending `send()` calls are rejected
4. The consumer's group registration is removed **only if it has no pending entries** — otherwise the entries stay pending for another replica's sweep to claim, and the leftover consumer name is garbage-collected by the sweep once drained
5. Connections close

> **`handlerTimeout` is not cancellation:** when a handler exceeds `handlerTimeout`, the dispatch is rejected (the entry stays un-ACKed for redelivery) but the handler function itself keeps running until it settles on its own.

---

## InMemoryTransport (Development & Testing)

The core ships a zero-dependency loopback transport — ideal for development before a broker exists and for integration tests:

```typescript
import { InMemoryTransport } from '@asenajs/asena/microservice';

@Config()
export class DevConfig extends ConfigService {
  transport() {
    return { microservice: new InMemoryTransport() };
  }
}
```

Messages never leave the process; handlers registered in the same app receive them synchronously.

> **Behavioral difference from broker transports:** in-memory `emit()` awaits its handlers, so when it returns the handlers have already run. With Redis, delivery is asynchronous — a test that relies on the event being handled "immediately after emit" passes in development but races in production. Await an observable effect instead of the emit itself. All handlers of one emit observe the **same** `messageId`, matching Redis semantics.

---

## Distributed Tracing

Wire OpenTelemetry through messaging interceptors — producer and consumer spans join into one distributed trace across services:

```typescript
import { otelMessaging } from '@asenajs/asena-otel';

transport() {
  return {
    microservice: new RedisMicroserviceTransport({ url }, { serviceName: 'order-service' }),
    interceptors: [otelMessaging({ system: 'redis' })],
  };
}
```

See the [OpenTelemetry package docs](/docs/packages/opentelemetry) for details.

---

## Error Handling

Microservice errors surface as `UlakError` with structured codes:

| Code | Meaning |
|---|---|
| `NO_TRANSPORT` | `send`/`emit` called but no microservice transport configured |
| `TRANSPORT_NOT_FOUND` | Named transport does not exist (message lists available names) |
| `TIMEOUT` | No reply arrived within the caller's timeout (`send`) |
| `REMOTE_ERROR` | The remote handler threw **or exceeded `handlerTimeout`** — the responder replies `ok: false`, so the caller sees `REMOTE_ERROR`, not `TIMEOUT` |
| `SEND_FAILED` | Broker publish failed / no handler registered (InMemoryTransport) |

```typescript
import { UlakError, UlakErrorCode } from '@asenajs/asena/messaging';

try {
  const res = await this.orders.send('create', dto, { timeout: 5000 });
} catch (error) {
  if (error instanceof UlakError && error.code === UlakErrorCode.TIMEOUT) {
    // decide: retry (make sure the handler is idempotent!) or fail the request
  }
}
```

---

## Writing a Custom Transport

Implement the `MicroserviceTransport` SPI to integrate any broker:

```typescript
import type { MicroserviceTransport } from '@asenajs/asena/microservice';

export class MyBrokerTransport implements MicroserviceTransport {
  readonly name = 'my-broker';
  get isConnected(): boolean { ... }

  async init() { ... }                                  // connect; send/emit usable after this
  registerMessageHandler(pattern, handler) { ... }      // exact patterns (RPC)
  registerEventHandler(pattern, handler) { ... }        // absolute patterns, wildcards allowed
  async listen() { ... }                                // consume ONLY sources with handlers
  async send(pattern, data?, options?) { ... }          // request/response with correlation
  async emit(pattern, data?, options?) { ... }          // fire-and-forget
  async destroy(options?) { ... }                       // graceful drain, then release
}
```

Contract notes:

- `init()` must make `send`/`emit` usable **before** `listen()` (client-only mode)
- With zero registered handlers, `listen()` must not start any consumer
- Wildcard matching can reuse `matchesEventPattern` from `@asenajs/asena/event`

---

## Comparison with the In-Process Event System

| | [Event System](/docs/concepts/event-system) | Microservices |
|---|---|---|
| Scope | Single process | Across services |
| Delivery | Synchronous dispatch, no persistence | Broker-backed, at-least-once (events) |
| API | `EventEmitter.emit()` / `@On` | `ulak.send/emit` / `@MessagePattern` / `@EventPattern` |
| Use for | Domain events inside one app | Service-to-service communication |

They are deliberately separate: hiding the local-vs-remote distinction creates false expectations about delivery guarantees.

## Related

- [Inheritance](/docs/concepts/inheritance) - Sharing `@MessagePattern` and `@EventPattern` handlers through a base class, and why an inherited `@EventPattern` opens a real subscription
