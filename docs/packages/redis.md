---
title: Asena Redis
description: Redis integration with @Redis - multi-pod WebSocket transport and a Redis Streams microservice transport with consumer groups, retry and DLQ
outline: deep
---

# Asena Redis

Redis integration for AsenaJS — service client with built-in multi-pod WebSocket transport. Your `@Redis` decorated service gives you full Redis operations with automatic IoC registration. For multi-pod deployments, `RedisTransport` synchronizes WebSocket messages across instances via Redis pub/sub.

## Features

- **Decorator-Based Setup** - `@Redis` decorator handles IoC registration and connection lifecycle
- **Dual Adapter Support** - Bun native `RedisClient` (default) and `redis` (node-redis) package
- **Multi-Pod WebSocket Transport** - Synchronize WebSocket messages across pods via Redis pub/sub
- **Full Redis Operations** - String, Hash, Set, Key, and raw command support
- **Binary Data Support** - ArrayBuffer and Uint8Array transport with Base64 encoding
- **Zero Runtime Dependencies** - Only peer deps (asena, reflect-metadata)

## Installation

```bash
bun add @asenajs/asena-redis
```

For node-redis adapter (optional):
```bash
bun add @asenajs/asena-redis redis
```

**Requirements:**
- [Bun](https://bun.sh) v1.3.12 or higher
- [@asenajs/asena](https://github.com/AsenaJs/Asena) v0.10.0 or higher

## Quick Start

### 1. Create Redis Service

```typescript
import { Redis, AsenaRedisService } from '@asenajs/asena-redis';

@Redis({
  config: { url: 'redis://localhost:6379' },
  name: 'AppRedis',
})
export class AppRedis extends AsenaRedisService {

  async getOrSet(key: string, factory: () => Promise<string>, ttl?: number): Promise<string> {
    const cached = await this.get(key);

    if (cached) return cached;

    const value = await factory();
    await this.set(key, value, ttl);

    return value;
  }

}
```

Asena automatically discovers it — that's it.

### 2. Inject and Use

```typescript
import { Service } from '@asenajs/asena/decorators';
import { Inject } from '@asenajs/asena/decorators/ioc';

@Service('CacheService')
export class CacheService {

  @Inject('AppRedis')
  private redis: AppRedis;

  async getUserName(id: string): Promise<string> {
    return this.redis.getOrSet(`user:${id}`, async () => {
      // fetch from database...
      return 'John';
    }, 60);
  }

}
```

::: tip Connection lifecycle is handled for you
`AsenaRedisService` carries an [`@OnStart`](/docs/concepts/lifecycle) that connects during
`server.start()`, and an `@OnStop` that closes on `server.stop()` — first every connection handed
out by `createSubscriber()`, then the main client. Failures on individual subscribers are logged
and stepped over so one dead socket cannot strand the others or the main client.

A **user-supplied `client`** (the `client` option) is closed too: `@OnStart` adopts it as the
connection the service runs on, and `@OnStop` treats it the same way. If you need to keep it
alive past the server, do not hand it to `@Redis`.
:::

::: warning This was not true before
This page previously claimed disconnection on shutdown was automatic. It was not — the framework
had no stop phase, so nothing ever called `disconnect()` and every connection outlived the server
that opened it. `@OnStop` is what makes the claim accurate, and it needs `@asenajs/asena` 0.10.0
or higher.
:::

## Adapter Selection

By default, `@asenajs/asena-redis` uses Bun's native `RedisClient`. For environments requiring the `redis` (node-redis) package:

```typescript
@Redis({
  config: { url: 'redis://localhost:6379' },
  adapter: 'node-redis',
})
export class AppRedis extends AsenaRedisService {}
```

| Adapter | Package | Best For |
|:--------|:--------|:---------|
| `'bun'` (default) | None (Bun built-in) | Bun runtime, maximum performance |
| `'node-redis'` | `redis` ^5.11.0 | Node.js compatibility, Redis modules |

## API Reference

### String Operations

| Method | Parameters | Returns | Description |
|:-------|:-----------|:--------|:------------|
| `get(key)` | `key: string` | `string \| null` | Get string value |
| `set(key, value, ttl?)` | `key: string, value: string, ttl?: number` | `void` | Set value with optional TTL (seconds) |
| `del(...keys)` | `...keys: string[]` | `number` | Delete keys, returns count |
| `exists(key)` | `key: string` | `boolean` | Check if key exists |
| `incr(key)` | `key: string` | `number` | Increment counter |
| `decr(key)` | `key: string` | `number` | Decrement counter |
| `expire(key, seconds)` | `key: string, seconds: number` | `void` | Set expiration |
| `ttl(key)` | `key: string` | `number` | Get remaining TTL |
| `keys(pattern)` | `pattern: string` | `string[]` | Find keys by pattern |

### Hash Operations

| Method | Parameters | Returns | Description |
|:-------|:-----------|:--------|:------------|
| `hget(key, field)` | `key: string, field: string` | `string \| null` | Get hash field |
| `hmset(key, fields)` | `key: string, fields: string[]` | `void` | Set multiple fields (`['f1', 'v1', 'f2', 'v2']`) |
| `hmget(key, fields)` | `key: string, fields: string[]` | `(string \| null)[]` | Get multiple fields |

### Set Operations

| Method | Parameters | Returns | Description |
|:-------|:-----------|:--------|:------------|
| `sadd(key, member)` | `key: string, member: string` | `number` | Add member to set |
| `srem(key, member)` | `key: string, member: string` | `number` | Remove member from set |
| `smembers(key)` | `key: string` | `string[]` | Get all members |
| `sismember(key, member)` | `key: string, member: string` | `boolean` | Check membership |

### Raw & Lifecycle

| Method | Parameters | Returns | Description |
|:-------|:-----------|:--------|:------------|
| `send(command, args)` | `command: string, args: string[]` | `any` | Execute raw Redis command |
| `client` | — | `RedisClientAdapter` | Access underlying client |
| `createSubscriber()` | — | `RedisClientAdapter` | Create duplicate connection for pub/sub. Tracked by the service and closed on `server.stop()` |
| `testConnection()` | — | `boolean` | Returns `true` if connected |
| `disconnect()` | — | `void` | Close the main connection. Called for you by `@OnStop`; calling it by hand leaves any subscriber you are still reading from open |

## Configuration

### RedisConfig

```typescript
interface RedisConfig {
  // Connection
  url?: string;                // redis[s]://[[username][:password]@][host][:port][/db]
  host?: string;               // default: 'localhost'
  port?: number;               // default: 6379
  username?: string;
  password?: string;
  db?: number;

  // Timeouts & Reconnection
  connectionTimeout?: number;  // Connection timeout in ms (default: 10000)
  idleTimeout?: number;        // Idle timeout in ms (Bun only, default: 0)
  autoReconnect?: boolean;     // Auto-reconnect on disconnect (default: true)
  maxRetries?: number;         // Max reconnection attempts (default: 10)

  // Behavior
  enableOfflineQueue?: boolean;     // Queue commands when disconnected (default: true)
  enableAutoPipelining?: boolean;   // Automatic command pipelining (Bun only, default: true)

  // TLS
  tls?: boolean | TLSOptions;

  // Identification
  name?: string;               // Service name for logging
}
```

::: info Bun-Only Features
`idleTimeout` and `enableAutoPipelining` are Bun-only features and are silently ignored when using the `node-redis` adapter.
:::

### @Redis Decorator Options

```typescript
@Redis({
  config: RedisConfig,         // Redis connection configuration
  adapter?: 'bun' | 'node-redis', // Client adapter (default: 'bun')
  name?: string,               // Service name for IoC registration
})
```

## Multi-Pod WebSocket Transport

`RedisTransport` synchronizes WebSocket messages across multiple server instances using Redis pub/sub. This enables room-based messaging, broadcasting, and direct socket messaging to work seamlessly across pods.

### Setup

Configure the transport in your `@Config` class's `transport()` method:

```typescript
import { Config } from '@asenajs/asena/decorators';
import { Inject } from '@asenajs/asena/decorators/ioc';
import { ConfigService } from '@asenajs/hono-adapter'; // or '@asenajs/ergenecore'
import { RedisTransport } from '@asenajs/asena-redis';

@Config()
export class AppConfig extends ConfigService {

  @Inject('AppRedis')
  private redis: AppRedis;

  public transport() {
    return new RedisTransport(this.redis);
  }

}
```

Or without an existing Redis service:

```typescript
public transport() {
  return new RedisTransport({ url: 'redis://localhost:6379' });
}
```

### How It Works

Each server instance gets a unique pod ID. When a WebSocket message is published:

1. The message is delivered locally via `server.publish()`
2. The message is sent to Redis pub/sub with the originating pod ID
3. Other pods receive the message and deliver it to their local sockets
4. Messages from the same pod are deduplicated automatically

### Options

```typescript
new RedisTransport(source, {
  channel: 'asena:ws:transport', // Redis pub/sub channel (default)
});
```

::: tip No Code Changes Needed
Your WebSocket services, Ulak messaging, and room management work exactly the same with `RedisTransport`. The transport layer is transparent — just configure it in `@Config` and multi-pod support is enabled automatically.
:::

## Microservice Transport (Redis Streams)

`RedisMicroserviceTransport` is the production-grade broker implementation for Asena's [microservice layer](/docs/concepts/microservices) — request/response and events between independent Asena services, built on Redis Streams consumer groups.

### Setup

```typescript
import { Config } from '@asenajs/asena/decorators';
import { RedisMicroserviceTransport } from '@asenajs/asena-redis';

@Config()
export class AppConfig extends ConfigService {
  public transport() {
    return {
      microservice: new RedisMicroserviceTransport(
        { url: 'redis://localhost:6379' },
        { serviceName: 'order-service' }, // serviceName REQUIRED - consumer group identity
      ),
    };
  }
}
```

`serviceName` is the consumer group: all replicas of the same service **must** share it, different services **must** differ (each service group receives its own copy of every event).

### Reusing Your @Redis Service

If your app already has a `@Redis` service, you do not need to repeat the connection settings. Inject it into the config class and pass it where the config object would go — the transport then reuses its connection instead of opening its own:

```typescript
import { Config } from '@asenajs/asena/decorators';
import { Inject } from '@asenajs/asena/decorators/ioc';
import { ConfigService } from '@asenajs/hono-adapter'; // or '@asenajs/ergenecore'
import { RedisMicroserviceTransport } from '@asenajs/asena-redis';
import { AppRedis } from '../redis/AppRedis';

@Config()
export class AppConfig extends ConfigService {
  @Inject(AppRedis)
  private redis: AppRedis;

  public transport() {
    return {
      microservice: new RedisMicroserviceTransport(this.redis, {
        serviceName: 'order-service',
      }),
    };
  }
}
```

URL, credentials and TLS now live in exactly one place. Config classes are prepared after user components are initialized, so the injected service is already connected by the time `transport()` runs.

::: tip The same works for Kafka
[`KafkaMicroserviceTransport`](/docs/packages/kafka#reusing-your-kafka-service) accepts an `AsenaKafkaService` in the same position.
:::

### How It Works

| Purpose | Redis Key | Mechanism |
|---|---|---|
| Events | `asena:ms:evt` (stream) | `XADD` + one consumer group per service; wildcard patterns matched locally; at-least-once with ACK |
| Requests | `asena:ms:req:<pattern>` (stream per pattern) | Consumer group distributes each request to exactly one replica |
| Replies | `asena:ms:reply:<instanceId>` (pub/sub) | Caller is alive and waiting — persistence unnecessary |
| Dead letters | `asena:ms:dlq` (stream) | Poison events after `maxRetries`, with provenance fields |

A background sweep (`XPENDING` + `XCLAIM`) rescues entries from crashed replicas, counts delivery attempts and moves poison events to the DLQ. **RPC errors are final** — the caller receives an `ok:false` reply and the entry is ACKed; only event handlers are retried.

### Options

| Option | Default | Description |
|---|---|---|
| `serviceName` | — (required) | Consumer group identity shared by replicas |
| `streamPrefix` | `'asena:ms'` | Key prefix for streams/channels |
| `requestTimeout` | `30000` | Default `send()` reply timeout (ms) |
| `maxRetries` | `3` | Event delivery attempts before DLQ (events only) |
| `claimIdleMs` | `60000` | Idle time before the sweep reclaims a pending entry — handler duration must stay below this |
| `maxStreamLength` | `100000` | `XADD MAXLEN ~` trim — bounds memory AND offline tolerance |
| `blockMs` | `5000` | `XREADGROUP BLOCK` duration |
| `count` | `16` | Max entries fetched per read |
| `maxInFlight` | `32` | Concurrent handler limit (backpressure) |
| `handlerTimeout` | `min(30000, claimIdleMs)` | Per-handler execution timeout — explicit values above `claimIdleMs` throw at construction; on timeout the dispatch is rejected but the handler keeps running |
| `drainTimeout` | `10000` | Graceful drain window on shutdown |
| `commandTimeout` | `10000` | Watchdog bound for publisher commands (`XADD`, `XACK`, `XCLAIM`, ...) — a command outliving it means the connection died mid-flight, so the connection is discarded and replaced |

### Delivery Guarantees

- **Events: at-least-once.** Messages survive restarts and deploys (within the `maxStreamLength` trim window). Duplicate delivery is possible — [write idempotent handlers](/docs/concepts/microservices#idempotent-handlers).
- **RPC: at-most-once per attempt.** Handler errors are final; retrying is the caller's decision.
- **Replies are not durable.** A reply is a plain `PUBLISH` on the caller's reply channel and the request entry is ACKed either way — Redis pub/sub has no replay, so a reply published while the caller has no live subscription on that channel is **dropped and never redelivered**. The caller sees a `TIMEOUT`. This is the one place where the transport is deliberately lossy; see [Reply loss across an outage](#reply-loss-across-an-outage) for exactly when it bites.
- **Readiness means "this instance can complete a `send()`", not "a socket is open".** `isConnected` requires the publisher connection **and** a reply subscription Redis is actually serving — the socket open *and* its `SUBSCRIBE` acknowledged since the last reconnect. Those are different facts: Bun's `RedisClient` reconnects on its own but does not restore subscriptions, so the replay costs a further round trip after the socket reports open, and the publisher is typically back before it finishes. Expect an instance to stay `503` a little past its reconnect; that is the honest signal, and it is what keeps a load balancer from releasing traffic at a pod whose replies are still being dropped.
- **Reconnect:** on connection loss the transport reports `isConnected: false`, retries with capped backoff, and continues where it left off — Streams hold the messages meanwhile. If the consumer group itself was lost (Redis restart without persistence, `FLUSHALL`), the transport re-creates it automatically from the beginning of the stream, so surviving entries are replayed — but data already trimmed or flushed from the stream is gone.
- **Connection poisoning defense:** Bun's `RedisClient` loses in-flight commands when a socket dies and afterwards resolves replies against the wrong promises. The transport guards both of its command connections against this — the blocking consumer via a wedge watchdog, the publisher via connection-loss detection plus the `commandTimeout` bound — and replaces a poisoned connection with a fresh one. The publisher is always a transport-owned duplicate, so a shared `AsenaRedisService` client is never touched.
- **Retry latency is sweep-driven, not immediate.** A failed event is redelivered by the sweep once its idle time exceeds `claimIdleMs` — with defaults the first retry lands after ~60–90s and a poison message reaches the DLQ after `maxRetries` sweep cycles (minutes, not seconds). Coming from BullMQ/NestJS-style immediate retries, plan for this or lower `claimIdleMs`.
- **No ordering guarantee.** Entries within a read batch are dispatched in parallel; consumers must not rely on event order.

### Reply Loss Across an Outage

Readiness is honest about the reply channel, but it does **not** make the reply channel durable. A reply is lost whenever it is published at a moment when the caller has no subscription on its reply channel:

| Situation | Outcome |
|---|---|
| `send()` in flight when the connection drops | **Lost.** The responder publishes into an empty channel and ACKs the request; the caller gets a `TIMEOUT` after `requestTimeout`. |
| `send()` issued while the instance reports `503` | Your own choice — the endpoint told you it could not serve. |
| `send()` issued after the instance reports `200` | Delivered. This is what readiness now guarantees; before it did not. |

So an RPC that spans a Redis outage must be treated as **retryable, not reliable**. Make handlers idempotent and retry the `TIMEOUT` at the caller, or use `emit()` (Streams, at-least-once) where losing the call is unacceptable.

Two narrower residuals are worth knowing about:

- Readiness is driven by connection events, so a health check that lands between the socket being marked open and the connect event being dispatched can read `200` for at most one event-loop turn.
- A **custom** `RedisClientAdapter` that implements `onConnected` but neither `onResubscribed` nor subscription restoration of its own is taken at its word on connect. Both built-in adapters (`BunRedisAdapter`, `NodeRedisAdapter`) report honestly.

::: warning Liveness must be more forgiving than readiness
`isConnected` feeds Asena's health endpoint: `503` now means "the publisher is down **or** this instance's reply channel is not being served", i.e. a `send()` issued right now cannot complete. Wire it into your orchestrator's **readiness** probe. Because an instance stays `503` until its reply subscription is acknowledged — not merely until its socket reconnects — a liveness probe sharing the same thresholds will restart pods that were about to recover on their own.
:::

::: info Durable replies are not in 0.9.0
Moving replies onto a Stream would close the loss entirely, at the cost of a per-request write and trim. It is deliberately deferred; the table above is the current contract.
:::

## Best Practices

### 1. Name Your Redis Services

```typescript
// ✅ Good: Named service for clear IoC registration
@Redis({
  config: { url: 'redis://localhost:6379' },
  name: 'AppRedis',
})
export class AppRedis extends AsenaRedisService {}

// ❌ Bad: Unnamed service (defaults to class name, but less explicit)
@Redis({ config: { url: 'redis://localhost:6379' } })
export class AppRedis extends AsenaRedisService {}
```

### 2. Use Cache Patterns

```typescript
// ✅ Good: getOrSet pattern for caching
async getOrSet(key: string, factory: () => Promise<string>, ttl?: number) {
  const cached = await this.get(key);
  if (cached) return cached;

  const value = await factory();
  await this.set(key, value, ttl);
  return value;
}
```

### 3. Health Checks

```typescript
// ✅ Good: Use testConnection() in health endpoints
@Get('/health')
async health(context: Context) {
  const redisOk = await this.redis.testConnection();
  return context.send({ redis: redisOk ? 'up' : 'down' });
}
```

::: warning `testConnection()` is not a microservice readiness check
It `PING`s the cache client and says nothing about whether this instance's **reply channel** is being served, which is what decides whether a `send()` can complete. For an instance running `RedisMicroserviceTransport`, the readiness signal is the transport's `isConnected` (already wired into Asena's health endpoint) — see [Delivery Guarantees](#delivery-guarantees).
:::

## Related Documentation

- [WebSocket](/docs/concepts/websocket) - WebSocket implementation guide
- [Microservices](/docs/concepts/microservices) - Microservice messaging concepts and delivery semantics
- [Configuration](/docs/guides/configuration) - Server configuration with `transport()`
- [Services](/docs/concepts/services) - Service layer architecture
- [Dependency Injection](/docs/concepts/dependency-injection) - IoC container

---

**Next Steps:**
- Set up [WebSocket](/docs/concepts/websocket) real-time communication
- Configure [multi-pod transport](/docs/concepts/websocket#multi-pod-websocket) for scaling
- Learn about [Services](/docs/concepts/services)