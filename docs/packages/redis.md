---
title: Asena Redis
description: Redis integration with decorator-based setup and multi-pod WebSocket transport
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
- [Bun](https://bun.sh) v1.3.11 or higher
- [@asenajs/asena](https://github.com/AsenaJs/Asena) v0.7.0 or higher

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

::: tip
The `@Redis` decorator automatically handles connection during IoC initialization and disconnection on server shutdown. You don't need to manage the lifecycle manually.
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
| `createSubscriber()` | — | `RedisClientAdapter` | Create duplicate connection for pub/sub |
| `testConnection()` | — | `boolean` | Returns `true` if connected |
| `disconnect()` | — | `void` | Close connection |

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

## Related Documentation

- [WebSocket](/docs/concepts/websocket) - WebSocket implementation guide
- [Configuration](/docs/guides/configuration) - Server configuration with `transport()`
- [Services](/docs/concepts/services) - Service layer architecture
- [Dependency Injection](/docs/concepts/dependency-injection) - IoC container

---

**Next Steps:**
- Set up [WebSocket](/docs/concepts/websocket) real-time communication
- Configure [multi-pod transport](/docs/concepts/websocket#multi-pod-websocket) for scaling
- Learn about [Services](/docs/concepts/services)