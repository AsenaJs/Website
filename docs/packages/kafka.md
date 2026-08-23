---
title: Asena Kafka
description: Kafka for AsenaJS - a decorator-based produce/consume client, plus a microservice transport with broker-tracked delivery attempts
outline: deep
---

# Asena Kafka

This package gives you **two independent things**:

1. **A Kafka client for your application** — the `@Kafka` decorated service. Produce to and consume from your own topics, with connection lifecycle and IoC registration handled for you.
2. **A microservice transport** — `KafkaMicroserviceTransport` plugs Kafka into Asena's [microservice layer](/docs/concepts/microservices) so independent Asena services can call each other (RPC) and broadcast events.

If you only need to publish and read Kafka messages, **part 1 is all you need** — start at [Quick Start](#quick-start) and stop after [Service Client](#service-client). Read the [Microservice Transport](#microservice-transport) section when you want service-to-service messaging on top of Kafka.

<div class="card-grid">
  <a class="info-card" href="#quick-start">
    <span class="ic-kicker">01</span>
    <div class="ic-title">Quick Start</div>
    <p class="ic-desc">The <code>@Kafka</code> service, connected and registered.</p>
  </a>
  <a class="info-card" href="#service-client">
    <span class="ic-kicker">02</span>
    <div class="ic-title">Service Client</div>
    <p class="ic-desc">Producer, consumer and admin access to your own topics.</p>
  </a>
  <a class="info-card" href="#microservice-transport">
    <span class="ic-kicker">03</span>
    <div class="ic-title">Microservice Transport</div>
    <p class="ic-desc">RPC, event fan-out, retry and DLQ over Kafka.</p>
  </a>
  <a class="info-card" href="#external-topics-interop">
    <span class="ic-kicker">04</span>
    <div class="ic-title">External Topics</div>
    <p class="ic-desc">Consuming and emitting envelope-less foreign topics.</p>
  </a>
  <a class="info-card" href="#best-practices">
    <span class="ic-kicker">05</span>
    <div class="ic-title">Best Practices</div>
    <p class="ic-desc">Partitioning, keys and consumer group choices.</p>
  </a>
  <a class="info-card" href="#troubleshooting">
    <span class="ic-kicker">06</span>
    <div class="ic-title">Troubleshooting</div>
    <p class="ic-desc">When messages do not arrive as expected.</p>
  </a>
</div>

## Features

- **Decorator-Based Setup** - `@Kafka` handles IoC registration and connection lifecycle
- **Full Producer/Consumer/Admin Access** - the underlying kafkajs objects, with lifecycle you control
- **Microservice Transport** - full `MicroserviceTransport` implementation: RPC, event fan-out with wildcards, retry + DLQ
- **Broker-Tracked Attempts** - `context.attempt` survives crashes and rebalances (persisted in offset-commit metadata)
- **External Topic Interop** - consume from and emit to envelope-less foreign topics
- **Zero Runtime Dependencies** - only peer deps (asena, kafkajs, reflect-metadata)

## Installation

```bash
bun add @asenajs/asena-kafka kafkajs
```

**Requirements:**
- [Bun](https://bun.sh) v1.3.12 or higher
- [@asenajs/asena](https://github.com/AsenaJs/Asena) v0.10.0 or higher
- [kafkajs](https://kafka.js.org) v2.2 or higher

::: warning Broker compatibility
Use Apache Kafka **2.8 – 3.9**. Kafka 4.0 removed old protocol API versions (KIP-896) and kafkajs 2.2.4 has reported incompatibilities — pin your broker to 3.9.x. See [Client Roadmap](#client-roadmap) for why kafkajs is the client today.
:::

For local development, a single-node KRaft container is enough:

```bash
docker run -d --name asena-kafka --restart always -p 9092:9092 \
  -e KAFKA_NODE_ID=1 -e KAFKA_PROCESS_ROLES=broker,controller \
  -e KAFKA_LISTENERS=PLAINTEXT://:9092,CONTROLLER://:9093 \
  -e KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://localhost:9092 \
  -e KAFKA_CONTROLLER_LISTENER_NAMES=CONTROLLER \
  -e KAFKA_CONTROLLER_QUORUM_VOTERS=1@localhost:9093 \
  -e KAFKA_LISTENER_SECURITY_PROTOCOL_MAP=CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT \
  -e KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR=1 \
  -e KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR=1 \
  -e KAFKA_TRANSACTION_STATE_LOG_MIN_ISR=1 \
  -e KAFKA_GROUP_INITIAL_REBALANCE_DELAY_MS=0 \
  -e KAFKA_GROUP_MIN_SESSION_TIMEOUT_MS=1000 \
  apache/kafka:3.9.1
```

## Quick Start

A complete produce-and-consume round trip in three steps.

### 1. Define a Kafka service

Extend `AsenaKafkaService` and decorate with `@Kafka`. The decorator registers the class as an Asena `@Service`, so it is injectable everywhere; the connection is opened by an [`@OnStart`](/docs/concepts/lifecycle) during `server.start()` and closed by an `@OnStop` during `server.stop()`.

```typescript
// src/kafka/AppKafka.ts
import { Kafka, AsenaKafkaService } from '@asenajs/asena-kafka';

@Kafka({
  config: {
    brokers: ['localhost:9092'],
    clientId: 'my-app',
  },
  name: 'AppKafka', // the injection key
})
export class AppKafka extends AsenaKafkaService {}
```

That is a complete, working service — every method below is inherited.

### 2. Produce a message

Inject the service and call `sendMessage(topic, messages)`. Values must be strings or `Buffer`s, so serialize your payload yourself.

```typescript
// src/services/AuditService.ts
import { Service } from '@asenajs/asena/decorators';
import { Inject } from '@asenajs/asena/decorators/ioc';
import { AppKafka } from '../kafka/AppKafka';

interface AuditEntry {
  userId: string;
  action: string;
}

@Service()
export class AuditService {
  @Inject(AppKafka)
  private kafka: AppKafka;

  async record(entry: AuditEntry) {
    await this.kafka.sendMessage('audit.log', [
      {
        key: entry.userId, // same key -> same partition -> ordered per user
        value: JSON.stringify(entry),
        headers: { source: 'my-app' },
      },
    ]);
  }
}
```

::: tip Add domain methods to the service
`AppKafka` is a normal class — putting `publishAudit()` on it instead of calling `sendMessage` from every caller keeps topic names and serialization in one place.
:::

### 3. Consume messages

`createConsumer()` returns a **caller-owned** consumer: you connect it, subscribe, run it, and disconnect it. A `@Service` with [`@OnStart` / `@OnStop`](/docs/concepts/lifecycle) is the natural home — components stop in the reverse of the order they started, so this service is torn down while `AppKafka` and its client are still up.

```typescript
// src/services/AuditConsumer.ts
import { Service } from '@asenajs/asena/decorators';
import { Inject, OnStart, OnStop } from '@asenajs/asena/decorators/ioc';
import type { KafkaConsumerLike } from '@asenajs/asena-kafka';
import { AppKafka } from '../kafka/AppKafka';

@Service()
export class AuditConsumer {
  @Inject(AppKafka)
  private kafka: AppKafka;

  private consumer: KafkaConsumerLike;

  @OnStart()
  async start() {
    // groupId is required - replicas sharing it split the partitions between them
    this.consumer = this.kafka.createConsumer({ groupId: 'audit-archiver' });

    await this.consumer.connect();
    await this.consumer.subscribe({ topics: ['audit.log'], fromBeginning: false });

    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const entry = JSON.parse(message.value!.toString());

        console.log(`[${topic}/${partition}@${message.offset}]`, entry);
      },
    });
  }

  @OnStop()
  async stop() {
    await this.consumer?.disconnect();
  }
}
```

::: tip What the service closes and what it does not
`AsenaKafkaService` carries its own `@OnStop`, which disconnects the client `@OnStart` brought up
— and with it the default producer behind `sendMessage()`. A client passed as the `client` option
goes down there too.

What `createProducer()`, `createConsumer()` and `createAdmin()` hand out stays **yours**: nothing
tracks them, so nothing closes them at a moment your application did not choose. `@OnStop` is
where you close them.
:::

::: warning The topic must exist
The service never auto-creates topics (`allowAutoTopicCreation: false`). Create them with your broker tooling, or via `createAdmin()`:

```typescript
const admin = this.kafka.createAdmin();

await admin.connect();
await admin.createTopics({ topics: [{ topic: 'audit.log', numPartitions: 3 }] });
await admin.disconnect();
```
:::

## Service Client

### API Reference

| Method | Description |
|:-------|:------------|
| `sendMessage(topic, messages)` | Produce via the service's default producer |
| `createProducer()` | New caller-owned producer |
| `createConsumer(config)` | New caller-owned consumer (`groupId` required) |
| `createAdmin()` | New caller-owned admin client |
| `client` | The underlying `KafkaClientAdapter` |
| `config` | The `KafkaConfig` used |
| `disconnect()` | Close the default producer. Called for you by `@OnStop` on `server.stop()` |
| `testConnection()` | Bounded broker probe (3s), returns `boolean` |

Objects returned by `createProducer` / `createConsumer` / `createAdmin` are **yours** — the service will not connect or disconnect them. `disconnect()` only closes the service's own default producer, and `server.stop()` now calls it through the service's `@OnStop`. Before the framework grew a stop phase nothing did, so the client outlived the server that opened it.

### Configuration

`KafkaConfig` is passed straight through to the kafkajs `Kafka` constructor, plus Asena's display `name`.

| Option | Type | Description |
|:-------|:-----|:------------|
| `brokers` | `string[]` | **Required.** Seed broker list — one entry is enough, the client discovers the rest |
| `clientId` | `string` | Identifies your app in broker logs and quotas. Default `'asena-kafka'` |
| `ssl` | `boolean \| object` | TLS settings |
| `sasl` | `object` | SASL authentication (see below) |
| `connectionTimeout` | `number` | TCP connect timeout in ms |
| `requestTimeout` | `number` | Per-request timeout in ms |
| `retry` | `object` | kafkajs retry policy (`retries`, `initialRetryTime`, …) |
| `logLevel` | `logLevel` | kafkajs log level. Default `NOTHING` |
| `name` | `string` | Asena display name used in connection logs — **not** forwarded to kafkajs |

### Production Config

A managed cluster (Confluent Cloud, Aiven, MSK) typically needs SASL over TLS and multiple seed brokers:

```typescript
import { Kafka, AsenaKafkaService } from '@asenajs/asena-kafka';

@Kafka({
  config: {
    brokers: [
      'broker-1.example.com:9093',
      'broker-2.example.com:9093',
      'broker-3.example.com:9093',
    ],
    clientId: 'order-service',
    ssl: true,
    sasl: {
      mechanism: 'scram-sha-512', // or 'plain', 'scram-sha-256'
      username: Bun.env.KAFKA_USERNAME!,
      password: Bun.env.KAFKA_PASSWORD!,
    },
    connectionTimeout: 10_000,
    requestTimeout: 30_000,
    retry: { retries: 8, initialRetryTime: 300 },
    name: 'Orders',
  },
  name: 'AppKafka',
})
export class AppKafka extends AsenaKafkaService {}
```

::: danger Never hardcode credentials
Read them from the environment (`Bun.env`) and keep them out of version control.
:::

### Multiple Kafka Services

Define one class per cluster and give each a distinct `name` — that name is the injection key.

```typescript
@Kafka({ config: { brokers: ['events:9092'] }, name: 'EventsKafka' })
export class EventsKafka extends AsenaKafkaService {}

@Kafka({ config: { brokers: ['logs:9092'] }, name: 'LogsKafka' })
export class LogsKafka extends AsenaKafkaService {}

@Service()
export class Reporter {
  @Inject(EventsKafka)
  private events: EventsKafka;

  @Inject(LogsKafka)
  private logs: LogsKafka;
}
```

### Health Checks

`testConnection()` performs a bounded (3 second) `listTopics` probe and never throws:

```typescript
@Service()
export class KafkaHealth {
  @Inject(AppKafka)
  private kafka: AppKafka;

  async check(): Promise<'up' | 'down'> {
    return (await this.kafka.testConnection()) ? 'up' : 'down';
  }
}
```

### Reusing an Existing Client

The `@Kafka` decorator's `client` option accepts any `KafkaClientAdapter` and bypasses connection construction entirely — the service adopts it as-is and only calls `connect()` if it is not already connected. Use it when the connection must come from somewhere else: a client you configured by hand, a test double, or a different Kafka library.

`KafkaClientAdapter` is a small interface — `isConnected`, `connect`, `disconnect`, `producer`, `consumer`, `admin`, `send`:

```typescript
import { Kafka, AsenaKafkaService, KafkajsAdapter } from '@asenajs/asena-kafka';
import type { KafkaClientAdapter } from '@asenajs/asena-kafka';

// A pre-built adapter - e.g. constructed from secrets fetched at startup
const sharedAdapter: KafkaClientAdapter = new KafkajsAdapter({
  brokers: ['localhost:9092'],
  clientId: 'shared',
});

@Kafka({
  config: { brokers: ['localhost:9092'] },
  client: sharedAdapter, // adopted as-is; config is not used to connect
  name: 'AppKafka',
})
export class AppKafka extends AsenaKafkaService {}
```

::: tip Don't repeat broker config for the transport
If your goal is simply to avoid writing brokers twice — once for the service, once for the microservice transport — you don't need this option at all. Hand the `@Kafka` service itself to the transport: see [Reusing Your @Kafka Service](#reusing-your-kafka-service).
:::

## Microservice Transport

### When You Need This

Everything above is **raw Kafka**: you pick topic names, you serialize, you manage consumers. That is the right tool for integrating with existing topics and pipelines.

The microservice transport is for something different: **Asena services calling each other.** It gives you request/response with correlation and timeouts, event fan-out with wildcard patterns, automatic retries with a dead-letter topic, and delivery-attempt tracking — over topics it creates and owns. You write `@MessagePattern` / `@EventPattern` handlers and never touch a topic name.

Both can coexist in one application.

### Setup

```typescript
import { Config } from '@asenajs/asena/decorators';
import { ConfigService } from '@asenajs/hono-adapter'; // or '@asenajs/ergenecore'
import { KafkaMicroserviceTransport } from '@asenajs/asena-kafka';

@Config()
export class AppConfig extends ConfigService {
  public transport() {
    return {
      microservice: new KafkaMicroserviceTransport(
        { brokers: ['localhost:9092'] },
        { serviceName: 'order-service' }, // REQUIRED - consumer group identity
      ),
    };
  }
}
```

`serviceName` is the consumer group identity:

- All replicas of the same service **must** share it — they then split partitions between them.
- Different services **must** differ — each service group receives its own copy of every event.

The actual Kafka group id is prefix-scoped (`asena.ms.order-service`) because consumer groups are cluster-global.

### Reusing Your @Kafka Service

If your app already has a `@Kafka` service, you do not need to repeat the broker configuration. Inject it into the config class and hand it to the transport — the transport borrows its adapter (and still creates its **own** producer, consumers and admin, so lifecycles never collide):

```typescript
import { Config } from '@asenajs/asena/decorators';
import { Inject } from '@asenajs/asena/decorators/ioc';
import { ConfigService } from '@asenajs/hono-adapter'; // or '@asenajs/ergenecore'
import { KafkaMicroserviceTransport } from '@asenajs/asena-kafka';
import { AppKafka } from '../kafka/AppKafka';

@Config()
export class AppConfig extends ConfigService {
  @Inject(AppKafka)
  private kafka: AppKafka;

  public transport() {
    return {
      microservice: new KafkaMicroserviceTransport(this.kafka, {
        serviceName: 'order-service',
      }),
    };
  }
}
```

Broker list, credentials and TLS now live in exactly one place. Config classes are prepared after user components are initialized, so the injected service is already connected by the time `transport()` runs.

::: tip The same works for Redis
[`RedisMicroserviceTransport`](/docs/packages/redis#microservice-transport-redis-streams) accepts an `AsenaRedisService` in the same position.
:::

### Topics It Owns

| Purpose | Kafka Topic | Mechanism |
|---|---|---|
| Events | `asena.ms.evt` (shared) | Keyless round-robin production; one consumer group per service; wildcard patterns matched locally; at-least-once with committed offsets |
| Requests | `asena.ms.req.<pattern>` (topic per pattern) | Consumer group distributes each request to exactly one replica |
| Replies | `asena.ms.reply` (shared) | Per-instance ephemeral consumer group filters by correlationId |
| Dead letters | `asena.ms.dlq` | Poison events after `maxRetries`, with provenance headers |

The transport creates these explicitly and waits for partition leaders before consuming.

### Delivery Attempts

**What you get:** `context.attempt` is a trustworthy retry counter. It keeps counting correctly even if the process crashes or the consumer group rebalances mid-handler — and it needs no database or Redis on the side.

**How it works:** Kafka has no per-message delivery counter, so the transport stores one in the offset-commit **metadata**. Before dispatching the record at offset X it commits X with `{"a":attempt}`; on success it commits X+1 clean. A crash therefore redelivers exactly that record, and whichever consumer picks it up derives `attempt = a + 1` when it joins the group.

The cost is two commits per record per partition. Throughput scales by adding partitions.

### Retries and DLQ

- A failed **event** handler leaves the offset uncommitted. The partition is paused, seeked back, and re-fetched after `retryBackoffMs` — the broker genuinely redelivers, sharing one mechanism with crash recovery.
- After `maxRetries` the event is produced to the DLQ topic with provenance headers (`origin_stream`, original value and headers preserved).
- **RPC errors are final.** The caller receives the error and the offset is committed; only event handlers are retried. Retrying a request is the caller's decision.

### Options

| Option | Default | Description |
|---|---|---|
| `serviceName` | — (required) | Consumer group identity shared by replicas |
| `topicPrefix` | `'asena.ms'` | Topic/group namespace (`[a-zA-Z0-9._-]` only) |
| `requestTimeout` | `30000` | Default `send()` reply timeout (ms) |
| `maxRetries` | `3` | Event delivery attempts before DLQ (events only) |
| `retryBackoffMs` | `5000` | Pause before a failed event's partition is resumed for the retry fetch |
| `handlerTimeout` | `min(30000, sessionTimeout)` | Per-handler timeout — explicit values above `sessionTimeout` throw at construction (kafkajs cannot heartbeat during a handler; a longer handler gets the member evicted and the record concurrently redelivered) |
| `maxInFlight` | `16` | Partitions processed concurrently (per-partition processing stays sequential) |
| `drainTimeout` | `10000` | Graceful drain window on shutdown |
| `sessionTimeout` | `30000` | Consumer group session timeout — crash detection speed |
| `heartbeatInterval` | `3000` | Consumer heartbeat (keep ≤ 1/3 of sessionTimeout) |
| `rebalanceTimeout` | `60000` | Max rebalance duration |
| `maxWaitTimeInMs` | `1000` | Idle fetch long-poll (boot readiness / shutdown responsiveness) |
| `eventPartitions` / `requestPartitions` / `replyPartitions` | `4` | Partition counts for transport-created topics |
| `replicationFactor` | `-1` | Broker default |
| `healthCheckIntervalMs` | `5000` | Interval of the active broker probe. A failed probe is **one** of the inputs to `isConnected` — the reply consumer's fetch loop is the other (see [Delivery Guarantees](#delivery-guarantees)) |
| `external` | — | Foreign-topic interop: `{ topics: (string \| { name, keyHeader? })[], fromBeginning? }` — see [External Topics](#external-topics-interop) |

### Delivery Guarantees

- **Events: at-least-once.** Messages survive restarts and deploys. Duplicate delivery is possible — [write idempotent handlers](/docs/concepts/microservices#idempotent-handlers) keyed on `context.messageId` (one id per emit, identical for every group and every redelivery).
- **RPC: at-most-once per attempt.** Handler errors are final. Requests older than the caller's own timeout are **dropped without execution** — a restarting service never burns through a backlog of dead RPCs.
- **First boot starts at latest.** A brand-new consumer group ignores messages produced before the service ever existed — deploy consumers before producers. The start position is pinned to a committed offset immediately, so later crash-restarts can never skip records.
- **Reconnect:** on broker loss the transport reports `isConnected: false` (health endpoint 503), kafkajs reconnects with its built-in retry, and consumption resumes from committed offsets.
- **Readiness means "can serve", not "a broker answers".** `isConnected` requires **both** a passing metadata probe **and** a reply consumer that has rejoined its group and is fetching. The probe alone goes green within about a second of a broker coming back, while the ephemeral reply group can still be rejoining ~20 seconds later — and until it fetches, nothing consumes replies, so every `send()` on that instance times out. Expect an instance to stay 503 for as long as its reply consumer takes to rejoin after an outage; that is the honest signal, and it is what keeps an orchestrator from routing RPC traffic at an instance that cannot complete it. A stall is detected from the fetch loop going quiet for 5 s, so readiness can lag a fresh stall by up to that much — kafkajs's own `CRASH` takes ~7.5 s.
- **Replies survive a rejoin.** The reply consumer's start position is committed as an offset, so a rejoin resumes where it left off instead of re-resolving `latest`. A reply produced while the consumer was away is delivered late, never skipped.
- **Ordering:** with the default multi-partition event topic, publish order is not preserved end-to-end. Use `eventPartitions: 1` for strict ordering at the cost of parallelism.
- **Rolling deploys:** kafkajs uses eager rebalancing — every membership change briefly pauses the group. Graceful shutdown leaves the group cleanly (short pause); SIGKILL costs a full `sessionTimeout`.

## External Topics (interop)

Everything above rides Asena's own envelope on Asena-owned topics. The `external` option connects your Asena service to **foreign systems** — a Quarkus/SmallRye service, a CDC pipeline, any plain Kafka producer or consumer — whose topics carry no envelope at all.

Say a team runs a Quarkus order service that publishes plain JSON to an `orders` topic and consumes an `invoices` topic. An Asena microservice joins that world with nothing but configuration:

```typescript
import { KafkaMicroserviceTransport } from '@asenajs/asena-kafka';

const transport = new KafkaMicroserviceTransport(
  { brokers: ['localhost:9092'] },
  {
    serviceName: 'billing-service',
    external: {
      topics: [
        'orders',                                    // string shorthand
        { name: 'invoices', keyHeader: 'x-tenant' }, // outbound partition affinity
      ],
      fromBeginning: false, // start position on FIRST subscribe (default: latest)
    },
  },
);
```

Controllers stay completely transport-agnostic — external topics surface through the same decorators:

```typescript
import { MessageController } from '@asenajs/asena/decorators';
import { EventPattern } from '@asenajs/asena/microservice';
import type { MessageContext } from '@asenajs/asena/microservice';

@MessageController()
export class OrdersListener {
  // The pattern is the external TOPIC NAME - prefix: false keeps it verbatim
  @EventPattern({ pattern: 'orders', prefix: false })
  async onOrder(order: any, context: MessageContext) {
    // context.headers = ALL raw record headers - Quarkus's traceparent /
    // ce-* headers arrive verbatim
    // context.messageId = the 'mid' header if present, else 'topic:partition:offset'
  }
}
```

::: danger External topics and the controller prefix
The [`@MessageController` prefix is joined onto `@EventPattern` too](/docs/concepts/microservices), so on a prefixed controller `@EventPattern('orders')` registers as `billing.orders` and **stops matching the foreign topic**. This fails quietly: the service boots green, health returns 200, and the topic is simply never consumed.

Always pass `prefix: false` for external topic handlers. If you forget, `listen()` prints the reason:

```
KafkaMicroserviceTransport(billing-service): external topic "orders" has no matching event handler -
outbound-only (emit works, nothing is consumed) - but "billing.orders" looks like the same handler with
the @MessageController prefix joined on; add prefix: false to that @EventPattern to register "orders" verbatim
```
:::

And emitting to the foreign side is a plain `emit` on the topic name:

```typescript
await this.ulak.emit('invoices', { invoiceId: 'inv-1' }, { headers: { 'x-tenant': 't-42' } });
```

**Inbound rules** (external topics with a matching `@EventPattern`):

- The dispatch pattern is **always the topic name** — a foreign record's incidental `p` header never steers routing.
- The handler must resolve to exactly the topic name, so use `prefix: false` on any prefixed controller.
- `context.headers` exposes **all raw record headers**. `context.messageId` honors a `mid` header, otherwise it falls back to the record position `topic:partition:offset` — stable across groups and redeliveries, so [messageId dedup](/docs/concepts/microservices#idempotent-handlers) still works.
- Retry, DLQ (`origin_stream` = the foreign topic; value and headers preserved) and `context.attempt` work exactly as for own topics.

**Outbound rules** (`emit('topicName')` where the name is configured external):

- The value is plain JSON, headers go over **verbatim** — no `p`/`mid`/`h`/`ts` envelope keys the foreign consumer wouldn't understand.
- With `keyHeader` set, that header's value becomes the record **key** (partition affinity on the foreign topic); the header itself is still sent.
- External topics are **event-only**: `send()` to an external name rejects immediately with `SEND_FAILED` — request/reply needs the envelope.

**Boot behavior:** the transport **never creates external topics** — they are foreign property. Subscribed external topics are awaited (bounded) at startup and missing ones fail the boot loudly; configured topics with no matching handler are outbound-only, logged and never an error. `fromBeginning: true` reads each external topic from the earliest retained record on the group's first subscribe.

::: tip Trace continuity with OpenTelemetry
With [@asenajs/asena-otel](/docs/packages/opentelemetry) messaging instrumentation active, an inbound Quarkus `traceparent` header is extracted from `context.headers` and your handler joins the foreign trace; on outbound emits the injected `traceparent` travels as a plain header and the Quarkus consumer resumes yours. Distributed tracing works across the framework boundary with zero extra code.
:::

::: warning Position-based ids and replays
When a foreign record has no `mid` header, its messageId is derived from the record position. A replay *tool* that re-produces a DLQ'd record creates a new position — and therefore a new messageId. If you replay externally-sourced records, carry your own dedup key in the payload or add a `mid` header at the producer.
:::

::: warning Rolling deploys
Changing the `external` list changes the consumer group's subscription. Restart all replicas together for a deterministic assignment instead of mixing generations.
:::

## Best Practices

### 1. Make Event Handlers Idempotent

At-least-once delivery means duplicates are normal, not exceptional. Deduplicate on `context.messageId`:

```typescript
@MessageController('booking')
export class BookingListener {
  @EventPattern('*') // handles 'booking.*'
  async onBooking(data: any, context: MessageContext) {
    if (this.seen.has(context.messageId)) return; // dedup key
    this.seen.add(context.messageId);
    // ...
  }
}
```

### 2. Keep Handlers Below sessionTimeout

A handler outliving `sessionTimeout` gets its instance evicted from the group and the record redelivered elsewhere **while it is still running**. Offload long work to a job queue and return quickly.

### 3. Key Your Messages for Ordering

Kafka guarantees order within a partition, not across a topic. Give related messages the same `key` (a user id, an order id) so they land on the same partition and stay ordered.

### 4. Watch the Health Endpoint

The transport's `isConnected` feeds Asena's health endpoint — `503` means either the broker probe is failing **or** the reply consumer is not fetching, i.e. this instance cannot complete a `send()`. Wire it into your orchestrator's readiness checks. After a broker outage an instance stays 503 until its reply consumer has rejoined, which can take tens of seconds; a liveness probe must be more forgiving than the readiness probe, or the orchestrator will restart pods that were about to recover on their own.

## Troubleshooting

### `TimeoutNegativeWarning` on startup

Cosmetic. Bun warns where Node silently clamps negative timers to 1ms; it comes from kafkajs's request queue and behavior is identical. Safe to ignore.

### `There is no leader for this topic-partition` / `topic not present in metadata`

The topic does not exist, or its metadata has not propagated yet. The client never auto-creates topics. Create it via `createAdmin().createTopics(...)` or your broker tooling. Right after creation a brief window of this error is normal — the transport retries it internally.

### The service boots but consumes nothing

Check the boot log for the resolved patterns. Since Asena 0.8 the `@MessageController` prefix applies to `@EventPattern` as well, so a handler you expect on `orders` may have registered as `billing.orders`:

```
[Microservice] OrdersListener → "default" (prefix "billing") evt: billing.orders
```

Add `prefix: false` to that `@EventPattern`. For external topics, `listen()` prints an explicit hint (see [External Topics](#external-topics-interop)).

### `handlerTimeout must not exceed sessionTimeout`

Thrown at construction, on purpose. kafkajs cannot heartbeat while your handler runs, so a handler allowed to outlive the session would get the member evicted and the record redelivered concurrently. Lower `handlerTimeout` or raise `sessionTimeout`.

### Health endpoint returns 503

Two independent causes, both recovering on their own:

1. **The active metadata probe is failing** — the broker is unreachable, credentials are wrong, or TLS is misconfigured.
2. **The reply consumer is not fetching** — normal for tens of seconds after a broker outage, while kafkajs works through its retry backoff and the ephemeral reply group rejoins. Until it does, this instance cannot complete a `send()`, so 503 is the correct answer.

If 503 persists past a rejoin, check the logs for `reply consumer recreate failed`.

### Connecting to Kafka 4.0 fails

kafkajs 2.2.4 does not support brokers that dropped the old protocol API versions (KIP-896). Pin your broker to 3.9.x — see [Client Roadmap](#client-roadmap).

## Client Roadmap

**Why kafkajs?** It is the only full-featured Kafka client that actually runs on Bun today. It is also effectively unmaintained (2.2.4 is the final release), which is why the package keeps every kafkajs call behind the `KafkaClientAdapter` interface — a seam a different client could be slotted into.

**Why not `@confluentinc/kafka-javascript`?** Confluent's official client is the obvious successor and even ships a KafkaJS-compatibility mode. It was tested directly on Bun 1.3.14 and **does not work**, for two independent reasons:

1. **It cannot load on Bun.** The addon is built on NAN (the V8 C++ API) rather than N-API. Bun's ABI (`NODE_MODULE_VERSION` 137) matches a published prebuilt, and that prebuilt downloads and installs cleanly — so this is neither an install-script nor an ABI problem. Loading it still dies inside `dlopen`:

   ```
   bun: symbol lookup error: .../confluent-kafka-javascript.node:
        undefined symbol: _ZN2v816FunctionTemplate12SetClassNameENS_5LocalINS_6StringEEE
   ```

   That symbol is `v8::FunctionTemplate::SetClassName`, which JavaScriptCore does not provide. Nothing on the Asena side can work around it. Tracking: [bun#4290](https://github.com/oven-sh/bun/issues/4290), [confluent-kafka-javascript#264](https://github.com/confluentinc/confluent-kafka-javascript/issues/264).

2. **Even on Node it would cost you a feature.** Confluent's KafkaJS-compatibility mode does not support sending metadata with offset commits. The [broker-tracked delivery attempts](#delivery-attempts) described above are built entirely on offset-commit metadata, so `context.attempt` would need a side store to survive. `consumer.stop()` and the consumer instrumentation events used for ready-gating and crash detection are also unsupported.

**What would change this:** [confluent-kafka-javascript#471](https://github.com/confluentinc/confluent-kafka-javascript/pull/471) migrates the addon from NAN to N-API. If it lands, blocker 1 disappears for Bun, Deno and future Node ABIs alike. Blocker 2 would still need upstream work. That PR is the one thing worth watching.

Until then: kafkajs, with brokers pinned to 3.9.x.

## Related

- [Microservices](/docs/concepts/microservices) - The transport-agnostic microservice layer
- [Redis](/docs/packages/redis) - Redis Streams transport (same SPI, different broker)
- [OpenTelemetry](/docs/packages/opentelemetry) - Distributed tracing across transports
