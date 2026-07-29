---
title: Adapters Overview
description: Understanding Asena's adapter system and choosing the right adapter for your project
outline: deep
---

# Adapters Overview

Asena uses a **pluggable adapter system** that allows you to choose the HTTP server implementation that best fits your needs. This architectural decision provides flexibility while maintaining a consistent API across all adapters.

## What is an Adapter?

An adapter is a bridge between Asena's core framework and the underlying HTTP server implementation. It handles:

- HTTP request/response processing
- WebSocket connections
- Middleware execution
- Static file serving
- Context wrapping

## Available Adapters

Asena currently provides two official adapters:

### Ergenecore (Native Bun)

**The fastest adapter for production workloads**

- ⚡ **Performance:** ~295k req/sec
- 📦 **Dependencies:** Zero — Zod is a peer your project owns
- 🔧 **Runtime:** Bun-exclusive
- 🎯 **Use Case:** Production APIs, microservices

### Hono Adapter

**Familiar and battle-tested**

- ⚡ **Performance:** ~233k req/sec
- 📦 **Dependencies:** Hono and Zod, as peers your project owns
- 🔧 **Runtime:** Bun (can be ported to Node)
- 🎯 **Use Case:** Projects using Hono, gradual migration

## Performance Comparison

| Adapter              | Requests/sec | Latency (avg) | Memory Usage |
|:---------------------|:-------------|:--------------|:-------------|
| **Ergenecore**       | **294,962**  | **1.34ms**    | Low          |
| **Hono**             | **233,182**  | **1.70ms**    | Low          |
| Hono (standalone)    | 266,476      | 1.49ms        | Low          |
| NestJS (Bun)         | 100,975      | 3.92ms        | Medium       |
| NestJS (Node)        | 88,083       | 5.33ms        | High         |

::: tip
Benchmark conditions: 12 threads, 400 connections, 120s duration, Hello World endpoint
:::

## Feature Comparison

| Feature                  | Ergenecore | Hono     |
|:-------------------------|:-----------|:-----    |
| HTTP Methods             | ✅          | ✅      |
| WebSocket Support        | ✅          | ✅      |
| Middleware System        | ✅          | ✅      |
| Request Validation       | ✅ (Zod)    | ✅ (Zod) |
| Static File Serving      | ✅          | ✅      |
| Cookie Support           | ✅          | ✅      |
| CORS Middleware          | ✅          | ✅      |
| Rate Limiting            | ✅          | ✅      |
## Choosing the Right Adapter

### Use **Ergenecore** when:

- ✅ You need **maximum performance**
- ✅ You're building a **Test or Poc project**
- ✅ You want **zero external dependencies**
- ✅ You're using **Bun runtime** exclusively
- ✅ You want **native Bun optimizations**

### Use **Hono** when:

- ✅ You're already **familiar with Hono**
- ✅ You're **migrating** an existing Hono project
- ✅ You need **Hono-specific middleware**
- ✅ You want a **battle-tested** adapter

## Quick Start Comparison

### Ergenecore Setup

```typescript
import { AsenaServerFactory } from '@asenajs/asena';
import { createErgenecoreAdapter } from '@asenajs/ergenecore';
import { logger } from './logger';

const adapter = createErgenecoreAdapter();

const server = await AsenaServerFactory.create({
  adapter,
  logger,
  port: 3000
});

await server.start();
```

### Hono Setup

```typescript
import { AsenaServerFactory } from '@asenajs/asena';
import { createHonoAdapter } from '@asenajs/hono-adapter';
import { AsenaLogger } from '@asenajs/asena-logger';

// createHonoAdapter returns a tuple; createErgenecoreAdapter returns the adapter alone
const [adapter, logger] = createHonoAdapter({ logger: new AsenaLogger() });

const server = await AsenaServerFactory.create({
  adapter,
  logger,
  port: 3000
});

await server.start();
```

## Context API

Both adapters implement the same `AsenaContext` interface, so handler code is identical -
only the import path differs.

::: code-group

```typescript [Ergenecore]
import type { Context } from '@asenajs/ergenecore';

// Get parameters - getParam is sync, getQuery/getBody are async
const id = context.getParam('id');
const page = await context.getQuery('page');
const body = await context.getBody<{ name: string }>();

// Send response
return context.send({ id, page, body }, 200);
```

```typescript [Hono]
import type { Context } from '@asenajs/hono-adapter';

// Get parameters - getParam is sync, getQuery/getBody are async
const id = context.getParam('id');
const page = await context.getQuery('page');
const body = await context.getBody<{ name: string }>();

// Send response
return context.send({ id, page, body }, 200);
```

:::

The differences are in what `context.req` gives you: a native `Request` on Ergenecore,
a `HonoRequest` on Hono. See [Context API](/docs/concepts/context) for the full surface.

## Migration Between Adapters

::: tip
Migrating between adapters means changing the adapter factory and the `Context` import
path. Controllers, services and business logic stay unchanged.
:::

### From Hono to Ergenecore

```typescript
import { Get } from '@asenajs/asena/decorators/http';
// Before: import type { Context } from '@asenajs/hono-adapter';
import type { Context } from '@asenajs/ergenecore';

// The handler body itself does not change
@Get('/:id')
async getUser(context: Context) {
  const id = context.getParam('id');
  return context.send({ id });
}
```

The bootstrap file changes too, because the factories differ:

```typescript
// Before (Hono) - returns a tuple
const [adapter, logger] = createHonoAdapter({ logger: new AsenaLogger() });

// After (Ergenecore) - returns the adapter alone
const adapter = createErgenecoreAdapter();
```

## Advanced Adapter Configuration

### Ergenecore Advanced Setup

```typescript
import { createErgenecoreAdapter } from '@asenajs/ergenecore';

const adapter = createErgenecoreAdapter({
  hostname: '0.0.0.0',
  enableWebSocket: true,
  // Custom WebSocket adapter if needed
  websocketAdapter: customWebSocketAdapter
});
```

### Hono Advanced Setup

```typescript
import { createHonoAdapter } from '@asenajs/hono-adapter';
import { logger } from './logger';

// Single argument: either a bare logger, or an options object containing one
const [adapter, asenaLogger] = createHonoAdapter({
  logger,
  strict: false, // match '/health' and '/health/' alike - useful behind a reverse proxy
});
```

## Creating Custom Adapters

You can create your own adapter by implementing the `AsenaAdapter` interface:

```typescript
import type { AsenaAdapter } from '@asenajs/asena/adapter';

export class MyCustomAdapter implements AsenaAdapter {
  async start(port: number): Promise<void> {
    // Implementation
  }

  registerRoute(method: string, path: string, handler: Function): void {
    // Implementation
  }

  // ... implement other required methods
}
```

::: tip
Check the [Ergenecore source code](https://github.com/AsenaJs/Asena-ergenecore) for a complete implementation example.
or
Check the [Hono-adapter source code](https://github.com/AsenaJs/hono-adapter) for a complete implementation example.
:::

::: warning `stop()` has to reach your WebSocket layer
`server.stop()` calls the adapter's `stop()` before it runs any [`@OnStop`](/docs/concepts/lifecycle) hook, and an adapter with WebSocket support is responsible for tearing that layer down from there — clearing heartbeat timers and calling the [WebSocket transport's](/docs/concepts/websocket#multi-pod-websocket) optional `destroy()`.

Both official adapters do this now. Neither did before: `destroy()` had no call site anywhere in the framework, so a Redis-backed multi-pod setup leaked a subscriber and a publisher connection on every stop.
:::

## Recommendations

### For New Projects

Start with **Ergenecore** for optimal performance and native Bun features.

```bash
bun add @asenajs/ergenecore zod
```

### For Existing Hono Projects

Use the **Hono adapter** for seamless migration and reuse of existing middleware.

```bash
bun add @asenajs/hono-adapter hono zod
```

### For Maximum Performance

**Ergenecore** provides:

- Native Bun optimizations
- Minimal dependency overhead

## Related Documentation

- [Ergenecore Adapter](/docs/adapters/ergenecore)
- [Hono Adapter](/docs/adapters/hono)
- [Context API](/docs/concepts/context)
- [Middleware Guide](/docs/concepts/middleware)

---

**Next Steps:**

- Learn about [Ergenecore features](/docs/adapters/ergenecore)
- Explore [Hono adapter usage](/docs/adapters/hono)
- Understand [Context API](/docs/concepts/context)
