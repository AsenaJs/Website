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
- 📦 **Dependencies:** Zero (except Zod)
- 🔧 **Runtime:** Bun-exclusive
- 🎯 **Use Case:** Production APIs, microservices

### Hono Adapter

**Familiar and battle-tested**

- ⚡ **Performance:** ~233k req/sec
- 📦 **Dependencies:** Hono framework
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

| Feature                  | Ergenecore | Hono |
|:-------------------------|:-----------|:-----|
| HTTP Methods             | ✅          | ✅    |
| WebSocket Support        | ✅          | ✅    |
| Middleware System        | ✅          | ✅    |
| Request Validation       | ✅ (Zod)    | ✅    |
| Static File Serving      | ✅          | ✅    |
| Cookie Support           | ✅          | ✅    |
| CORS Middleware          | ✅          | ✅    |
| Rate Limiting            | ✅          | ⚠️    |
| Zero-Copy File Serving   | ✅          | ❌    |
| SIMD-Accelerated Routing | ✅          | ❌    |
| External Dependencies    | 1 (Zod)    | Many |

## Choosing the Right Adapter

### Use **Ergenecore** when:

✅ You need **maximum performance**
✅ You're building a **production API**
✅ You want **zero external dependencies**
✅ You're using **Bun runtime** exclusively
✅ You need **built-in rate limiting**
✅ You want **native Bun optimizations**

### Use **Hono** when:

✅ You're already **familiar with Hono**
✅ You're **migrating** an existing Hono project
✅ You need **Hono-specific middleware**
✅ You want a **battle-tested** adapter
✅ You might **switch runtimes** later

## Quick Start Comparison

### Ergenecore Setup

```typescript
import { AsenaServerFactory } from '@asenajs/asena';
import { createErgenecoreAdapter } from '@asenajs/ergenecore/factory';
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
import { AsenaServer } from '@asenajs/asena';
import { createHonoAdapter } from '@asenajs/hono-adapter';
import { DefaultLogger } from '@asenajs/asena/logger';

const [adapter, logger] = createHonoAdapter(new DefaultLogger());

await new AsenaServer(adapter)
  .logger(logger)
  .port(3000)
  .start(true);
```

## Context API Differences

Both adapters provide a similar Context API, but with some differences:

### Ergenecore Context

```typescript
import type { Context } from '@asenajs/ergenecore/types';

// Get parameters
const id = context.getParam('id');
const page = context.getQuery('page');
const body = await context.getBody();

// Send response
return context.send({ data }, 200);
```

### Hono Context

```typescript
import type { Context } from '@asenajs/hono-adapter';

// Get parameters
const id = context.req.param('id');
const page = context.req.query('page');
const body = await context.req.json();

// Send response
return context.json({ data }, 200);
```

## Migration Between Adapters

::: warning
Migrating between adapters requires updating your Context API calls, but your controllers, services, and business logic remain unchanged.
:::

### From Hono to Ergenecore

```typescript
// Before (Hono)
@Get('/:id')
async getUser(context: Context) {
  const id = context.req.param('id');
  return context.json({ id });
}

// After (Ergenecore)
@Get('/:id')
async getUser(context: Context) {
  const id = context.getParam('id');
  return context.send({ id });
}
```

### Migration Checklist

- [ ] Update adapter import and initialization
- [ ] Change Context type import
- [ ] Replace `context.req.param()` with `context.getParam()`
- [ ] Replace `context.req.query()` with `context.getQuery()`
- [ ] Replace `context.req.json()` with `context.getBody()`
- [ ] Replace `context.json()` with `context.send()`
- [ ] Update middleware base class imports
- [ ] Test all endpoints

## Advanced Adapter Configuration

### Ergenecore Advanced Setup

```typescript
import { createErgenecoreAdapter } from '@asenajs/ergenecore/factory';

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

const [adapter, asenaLogger] = createHonoAdapter(logger, {
  // Hono-specific options
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
:::

## Recommendations

### For New Projects

Start with **Ergenecore** for optimal performance and native Bun features.

```bash
bun add @asenajs/ergenecore
```

### For Existing Hono Projects

Use the **Hono adapter** for seamless migration and reuse of existing middleware.

```bash
bun add @asenajs/hono-adapter
```

### For Maximum Performance

**Ergenecore** provides:
- SIMD-accelerated routing
- Zero-copy file serving
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
