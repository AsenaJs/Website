---
title: Hono Adapter
description: Battle-tested adapter based on the popular Hono web framework
outline: deep
---

# Hono Adapter

**Hono Adapter** is Asena's adapter built on top of the popular [Hono](https://hono.dev/) web framework. It provides seamless integration with Hono's rich ecosystem while leveraging Asena's dependency injection and architectural patterns.

## What is Hono Adapter?

Hono Adapter brings together the best of both worlds:

- **Built on Hono** - Uses the proven Hono web framework under the hood
- **Familiar API** - If you know Hono, you already know how to use it
- **Rich Ecosystem** - Access to Hono's middleware and community packages
- **Easy Migration** - Seamlessly migrate existing Hono projects to Asena
- **Built-in Middleware** - Includes CorsMiddleware and RateLimiterMiddleware
- **Validation Support** - Full Zod validation support
- **@Override Support** - Use native Hono middleware directly without wrappers

## Why Choose Hono Adapter?

### Performance

Hono Adapter delivers excellent performance powered by Bun and Hono:

| Adapter              | Requests/sec | Latency (avg) |
|:---------------------|:-------------|:--------------|
| Ergenecore           | 294,962      | 1.34ms        |
| **Hono Adapter**     | **233,182**  | **1.70ms**    |
| Hono (standalone)    | 266,476      | 1.49ms        |

::: tip Benchmark Details
12 threads, 400 connections, 120s duration
:::

### When to Use Hono Adapter

**Choose Hono Adapter when:**
- ✅ You're already familiar with Hono framework
- ✅ You're migrating an existing Hono project to Asena
- ✅ You need Hono-specific middleware or plugins
- ✅ You want a battle-tested, production-proven adapter
- ✅ You value ecosystem compatibility over raw performance

**Choose Ergenecore when:**
- ✅ You need maximum performance (~26% faster)
- ✅ You want zero external dependencies
- ✅ You're building a greenfield Bun-exclusive project

::: info
For Ergenecore adapter documentation, see [Ergenecore Adapter](/docs/adapters/ergenecore).
:::

## Installation

```bash
bun add @asenajs/hono-adapter
```

**Requirements:**
- [Bun](https://bun.sh) runtime
- TypeScript v5.8.2 or higher

## Quick Start

### Basic Server Setup

```typescript
import { AsenaServerFactory } from '@asenajs/asena';
import { createHonoAdapter } from '@asenajs/hono-adapter';

// Create adapter (returns tuple: [adapter, logger])
const [adapter, logger] = createHonoAdapter();

// Create and start server
const server = await AsenaServerFactory.create({
  adapter,
  logger,
  port: 3000
});

await server.start();
```

### Controller Example

```typescript
import { Controller } from '@asenajs/asena/server';
import { Get, Post } from '@asenajs/asena/web';
import type { Context } from '@asenajs/hono-adapter';

@Controller('/users')
export class UserController {
  @Get({ path: '/:id' })
  async getById(context: Context) {
    const id = context.req.param('id');
    return context.json({ id, name: 'John Doe' });
  }

  @Post({ path: '/' })
  async create(context: Context) {
    const body = await context.req.json();
    return context.json({ created: true, data: body }, 201);
  }
}
```

::: info Context API
For complete Context API documentation, see [Context](/docs/concepts/context).
:::

## Factory Function

### createHonoAdapter(logger?, options?)

Creates a new Hono adapter instance.

```typescript
import { createHonoAdapter } from '@asenajs/hono-adapter';
import { AsenaLogger } from '@asenajs/logger';

// With custom logger
const logger = new AsenaLogger();
const [adapter, asenaLogger] = createHonoAdapter(logger);

// With default logger
const [adapter, logger] = createHonoAdapter();
```

**Parameters:**

| Parameter | Type     | Optional | Description                    |
|:----------|:---------|:---------|:-------------------------------|
| `logger`  | `Logger` | Yes      | Logger instance from Asena     |
| `options` | `object` | Yes      | Hono-specific options          |

**Returns:**
- Tuple: `[adapter, logger]`

## Built-in Middleware

Hono Adapter includes the same powerful built-in middleware as Ergenecore.

### CorsMiddleware

High-performance CORS middleware with origin whitelisting and dynamic validation.

#### Basic CORS (Allow All Origins)

```typescript
import { Middleware } from '@asenajs/asena/server';
import { CorsMiddleware } from '@asenajs/hono-adapter';

@Middleware()
export class GlobalCors extends CorsMiddleware {
  constructor() {
    super(); // Defaults to { origin: '*' }
  }
}
```

#### Whitelist Specific Origins

```typescript
@Middleware()
export class RestrictedCors extends CorsMiddleware {
  constructor() {
    super({
      origin: ['https://example.com', 'https://app.example.com'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      exposedHeaders: ['X-Total-Count'],
      maxAge: 86400 // 24 hours
    });
  }
}
```

#### Dynamic Origin Validation

```typescript
@Middleware()
export class DynamicCors extends CorsMiddleware {
  constructor() {
    super({
      origin: (origin: string) => {
        // Allow all subdomains of example.com
        return origin.endsWith('.example.com') || origin === 'https://example.com';
      },
      credentials: true
    });
  }
}
```

#### CORS Options

| Option           | Type                          | Default    | Description                     |
|:-----------------|:------------------------------|:-----------|:--------------------------------|
| `origin`         | `string \| string[] \| function` | `'*'`   | Allowed origins                 |
| `credentials`    | `boolean`                     | `false`    | Allow credentials               |
| `methods`        | `string[]`                    | All        | Allowed HTTP methods            |
| `allowedHeaders` | `string[]`                    | `['Content-Type', 'Authorization']` | Allowed request headers |
| `exposedHeaders` | `string[]`                    | `[]`       | Exposed response headers        |
| `maxAge`         | `number`                      | `86400`    | Preflight cache duration (sec)  |

#### Using CORS Middleware

```typescript
import { Config } from '@asenajs/asena/server';
import { ConfigService } from '@asenajs/hono-adapter';

// Global CORS
@Config()
export class ServerConfig extends ConfigService {
  middlewares = [GlobalCors];
}

// Per-route CORS
@Controller('/api')
export class ApiController {
  @Get({ path: '/public', middlewares: [RestrictedCors] })
  async publicData(context: Context) {
    return context.json({ data: 'public' });
  }
}
```

::: tip Performance
CorsMiddleware uses lazy header allocation and pre-joined strings for optimal performance.
:::

### RateLimiterMiddleware

Token Bucket-based rate limiter for controlling request rates and preventing abuse.

#### Basic Rate Limiter

```typescript
import { Middleware } from '@asenajs/asena/server';
import { RateLimiterMiddleware } from '@asenajs/hono-adapter';

// 100 requests per minute
@Middleware()
export class ApiRateLimiter extends RateLimiterMiddleware {
  constructor() {
    super({
      capacity: 100,
      refillRate: 100 / 60, // tokens per second
    });
  }
}
```

#### Strict Rate Limiter

```typescript
// 5 requests per minute for sensitive endpoints
@Middleware()
export class StrictRateLimiter extends RateLimiterMiddleware {
  constructor() {
    super({
      capacity: 5,
      refillRate: 5 / 60,
      message: 'Too many login attempts. Please try again later.',
    });
  }
}
```

#### Advanced Rate Limiter

```typescript
@Middleware()
export class CustomRateLimiter extends RateLimiterMiddleware {
  constructor() {
    super({
      capacity: 50,
      refillRate: 50 / 60,

      // Rate limit by user ID instead of IP
      keyGenerator: (ctx) => ctx.getValue('user')?.id || 'anonymous',

      // Skip rate limiting for admin users
      skip: (ctx) => ctx.getValue('user')?.role === 'admin',

      // Expensive operations cost more tokens
      cost: (ctx) => ctx.req.url.includes('/search') ? 5 : 1,

      // Custom response
      message: 'Rate limit exceeded. Please slow down.',
      statusCode: 429,

      // Cleanup settings
      cleanupInterval: 60000, // 1 minute
      bucketTTL: 600000 // 10 minutes
    });
  }
}
```

#### Rate Limiter Options

| Option            | Type                        | Default                                  | Description                    |
|:------------------|:----------------------------|:-----------------------------------------|:-------------------------------|
| `capacity`        | `number`                    | `100`                                    | Maximum burst capacity         |
| `refillRate`      | `number`                    | `10`                                     | Tokens per second              |
| `keyGenerator`    | `(ctx) => string`           | IP-based                                 | Client identifier function     |
| `message`         | `string`                    | `'Rate limit exceeded...'`               | Error message                  |
| `statusCode`      | `number`                    | `429`                                    | HTTP status code               |
| `cost`            | `number \| (ctx) => number` | `1`                                      | Token cost per request         |
| `skip`            | `(ctx) => boolean`          | `undefined`                              | Skip rate limiting function    |
| `cleanupInterval` | `number`                    | `60000`                                  | Cleanup interval (ms)          |
| `bucketTTL`       | `number`                    | `600000`                                 | Inactive bucket TTL (ms)       |

#### Rate Limit Headers

The middleware automatically sets these headers:

- `X-RateLimit-Limit`: Requests allowed per minute
- `X-RateLimit-Remaining`: Remaining tokens
- `X-RateLimit-Reset`: Unix timestamp when bucket resets
- `Retry-After`: Seconds to wait (on 429 response)

#### Using Rate Limiter

```typescript
import { Config } from '@asenajs/asena/server';
import { ConfigService } from '@asenajs/hono-adapter';

// Global rate limiter
@Config()
export class ServerConfig extends ConfigService {
  middlewares = [ApiRateLimiter];
}

// Per-controller
@Controller('/api', { middlewares: [ApiRateLimiter] })
export class ApiController { }

// Per-route
@Controller('/auth')
export class AuthController {
  @Post({ path: '/login', middlewares: [StrictRateLimiter] })
  async login(context: Context) {
    const body = await context.req.json();
    return context.json({ token: 'abc123' });
  }
}
```

::: tip Token Bucket Algorithm
RateLimiterMiddleware uses O(1) bucket lookup and lazy token refill for optimal performance. Each middleware instance maintains its own bucket storage for route-specific rate limiting.
:::

## Hono-Specific Features

### @Override Decorator

The `@Override` decorator allows middleware to work directly with Hono's native context without Asena wrappers. This is **unique to Hono Adapter** and enables seamless integration with Hono ecosystem middleware.

```typescript
import { Middleware, Override } from '@asenajs/asena/server';
import { MiddlewareService } from '@asenajs/hono-adapter';
import type { Context as HonoContext, Next } from 'hono';

@Middleware()
export class NativeHonoMiddleware extends MiddlewareService {
  @Override()
  async handle(context: HonoContext, next: Next) {
    // Use Hono's native context directly - no wrapper!
    const startTime = Date.now();

    await next();

    const duration = Date.now() - startTime;
    context.header('X-Response-Time', `${duration}ms`);
  }
}
```

**Benefits of @Override:**
- ✅ Use existing Hono middleware without modification
- ✅ Access Hono's full native API
- ✅ Zero performance overhead (no wrapper)
- ✅ Integrate with Hono ecosystem packages

**Example: Using Hono's Built-in Middleware**

```typescript
import { Middleware, Override } from '@asenajs/asena/server';
import { MiddlewareService } from '@asenajs/hono-adapter';
import { compress } from 'hono/compress';
import { logger } from 'hono/logger';
import type { Context as HonoContext, Next } from 'hono';

@Middleware()
export class CompressionMiddleware extends MiddlewareService {
  @Override()
  async handle(context: HonoContext, next: Next) {
    // Use Hono's compress middleware directly
    return compress()(context, next);
  }
}

@Middleware()
export class LoggerMiddleware extends MiddlewareService {
  @Override()
  async handle(context: HonoContext, next: Next) {
    // Use Hono's logger middleware directly
    return logger()(context, next);
  }
}
```

::: warning When to Use @Override
Use `@Override` only when you need direct access to Hono's context. For most use cases, Asena's wrapped Context provides a cleaner, adapter-agnostic API.
:::

### Context Type

Always import Context from Hono Adapter:

```typescript
import type { Context } from '@asenajs/hono-adapter';
```

The Hono adapter Context wraps Hono's native context with Asena enhancements.

::: info
For complete Context API, see [Context](/docs/concepts/context).
:::

### Middleware Base Class

Extend `MiddlewareService` for custom middleware:

```typescript
import { Middleware } from '@asenajs/asena/server';
import { MiddlewareService, type Context } from '@asenajs/hono-adapter';

@Middleware()
export class AuthMiddleware extends MiddlewareService {
  async handle(context: Context, next: () => Promise<void>): Promise<any> {
    const token = context.req.header('authorization');
    if (!token) {
      return context.json({ error: 'Unauthorized' }, 401);
    }
    await next();
  }
}
```

::: info
For middleware patterns, see [Middleware](/docs/concepts/middleware).
:::

### Validation Service

Extend `ValidationService` for request validation:

```typescript
import { Middleware } from '@asenajs/asena/server';
import { ValidationService } from '@asenajs/hono-adapter';
import { z } from 'zod';

@Middleware({ validator: true })
export class CreateUserValidator extends ValidationService {
  json() {
    return z.object({
      name: z.string().min(3),
      email: z.string().email()
    });
  }
}
```

::: info
For validation patterns, see [Validation](/docs/concepts/validation).
:::

### Config Service

Extend `ConfigService` for server configuration:

```typescript
import { Config } from '@asenajs/asena/server';
import { ConfigService, type Context } from '@asenajs/hono-adapter';

@Config()
export class ServerConfig extends ConfigService {
  middlewares = [GlobalCors, ApiRateLimiter];

  onError(error: Error, context: Context): Response | Promise<Response> {
    console.error('Error:', error);
    return context.json({ error: error.message }, 500);
  }
}
```

::: info
For configuration, see [Configuration](/docs/guides/configuration).
:::

### Static File Serving

Extend `StaticServeService` for serving static files:

```typescript
import { Controller } from '@asenajs/asena/server';
import { Get } from '@asenajs/asena/web';
import { StaticServe, StaticServeService } from '@asenajs/asena/static';
import type { Context } from '@asenajs/hono-adapter/types';

@StaticServe({ root: './public' })
export class StaticMiddleware extends StaticServeService {
  rewriteRequestPath(path: string): string {
    return path.replace(/^\/static\/|^static\//, '');
  }

  onFound(_path: string, _context: Context): void | Promise<void> {
    console.log('File served successfully');
  }

  onNotFound(path: string, context: Context): void | Promise<void> {
    console.log(`File not found: ${path}`);
  }
}

@Controller('/static')
export class StaticController {
  @Get({ path: '/*', staticServe: StaticMiddleware })
  static() {}
}
```

::: info
For static file serving, see [Static Files](/docs/guides/static-files).
:::

## Migrating from Standalone Hono

If you're migrating from a standalone Hono application to Asena with Hono adapter:

### Before (Standalone Hono)

```typescript
import { Hono } from 'hono';

const app = new Hono();

app.get('/users/:id', (c) => {
  const id = c.req.param('id');
  return c.json({ id, name: 'John' });
});

app.post('/users', async (c) => {
  const body = await c.req.json();
  return c.json({ created: true, data: body }, 201);
});

export default app;
```

### After (Asena with Hono Adapter)

```typescript
import { Controller } from '@asenajs/asena/server';
import { Get, Post } from '@asenajs/asena/web';
import type { Context } from '@asenajs/hono-adapter';

@Controller('/users')
export class UserController {
  @Get({ path: '/:id' })
  async getUser(context: Context) {
    const id = context.req.param('id');
    return context.json({ id, name: 'John' });
  }

  @Post({ path: '/' })
  async create(context: Context) {
    const body = await context.req.json();
    return context.json({ created: true, data: body }, 201);
  }
}
```

### Benefits of Migration

- **Dependency Injection** - Built-in IoC container with `@Inject`
- **Code Organization** - Controller-based routing with decorators
- **Service Layer** - Clean separation of concerns
- **Built-in Validation** - Zod validation with `ValidationService`
- **WebSocket Support** - Native WebSocket integration
- **Type Safety** - Full TypeScript support with decorators
- **@Override Support** - Use existing Hono middleware without changes

## Testing

Hono adapter provides excellent testing support with Bun's built-in test framework.

```typescript
import { describe, expect, it, beforeEach, afterEach } from "bun:test";
import { AsenaServerFactory } from "@asenajs/asena";
import { createHonoAdapter } from "@asenajs/hono-adapter";
import { UserController } from "./controllers/UserController";

describe("UserController", () => {
  let server;
  let baseUrl;

  beforeEach(async () => {
    const port = Math.floor(Math.random() * 55000) + 10000;
    const [adapter, logger] = createHonoAdapter();

    server = await AsenaServerFactory.create({
      adapter,
      logger,
      port,
      components: [UserController] // Register components for testing
    });

    await server.start();
    baseUrl = `http://localhost:${port}`;
  });

  afterEach(async () => {
    await server.stop();
  });

  it("should get user by id", async () => {
    const response = await fetch(`${baseUrl}/users/123`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.id).toBe('123');
  });

  it("should create new user", async () => {
    const response = await fetch(`${baseUrl}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'John', email: 'john@example.com' })
    });
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.created).toBe(true);
  });
});
```

**AsenaServerFactory.create() Options:**

| Option       | Type       | Description                               |
|:-------------|:-----------|:------------------------------------------|
| `adapter`    | `Adapter`  | Hono adapter instance                     |
| `logger`     | `Logger`   | Logger instance                           |
| `port`       | `number`   | Server port (optional)                    |
| `components` | `Class[]`  | Controllers/services to register (for testing) |
| `gc`         | `boolean`  | Enable garbage collection (optional)      |

::: tip Testing with Components
Use the `components` parameter to register only the controllers needed for testing. This prevents Asena from scanning the entire project, making tests faster and more isolated.
:::

::: info
For testing strategies, see [Testing Guide](/docs/guides/testing).
:::

## Best Practices

### 1. Use Type Imports

```typescript
// ✅ Good: Type-only import
import type { Context } from '@asenajs/hono-adapter';

// ❌ Bad: Runtime import for types
import { Context } from '@asenajs/hono-adapter';
```

### 2. Leverage Built-in Middleware

```typescript
// ✅ Good: Use built-in CORS and rate limiting
@Config()
export class ServerConfig extends ConfigService {
  middlewares = [GlobalCors, ApiRateLimiter];
}
```

### 3. Use @Override for Hono Middleware

```typescript
// ✅ Good: Use @Override for Hono ecosystem middleware
@Middleware()
export class HonoCompress extends MiddlewareService {
  @Override()
  async handle(c: HonoContext, next: Next) {
    return compress()(c, next);
  }
}
```

### 4. Use Hono's Native Methods

```typescript
// ✅ Good: Use Hono's native context methods
const id = context.req.param('id');
const body = await context.req.json();
return context.json({ data });

// Also works: Asena's unified API
const id = context.getParam('id');
const body = await context.getBody();
return context.send({ data });
```

## Troubleshooting

### Common Issues

**Issue: TypeScript errors with Context**

```typescript
// Solution: Use type-only import
import type { Context } from '@asenajs/hono-adapter';
```

**Issue: Middleware not executing**

```typescript
// Solution: Ensure middleware extends MiddlewareService
import { MiddlewareService } from '@asenajs/hono-adapter';

@Middleware()
export class MyMiddleware extends MiddlewareService {
  async handle(context: Context, next: () => Promise<void>) {
    await next();
  }
}
```

**Issue: Hono-specific middleware not working**

```typescript
// Solution: Use @Override decorator for native Hono middleware
import { Override } from '@asenajs/asena/server';
import type { Context as HonoContext, Next } from 'hono';

@Middleware()
export class MyHonoMiddleware extends MiddlewareService {
  @Override()
  async handle(context: HonoContext, next: Next) {
    // Use Hono's native context
    await next();
  }
}
```

## Related Documentation

- [Adapters Overview](/docs/adapters/overview) - Compare Hono vs Ergenecore
- [Ergenecore Adapter](/docs/adapters/ergenecore) - Alternative adapter
- [Context API](/docs/concepts/context) - Request/response handling
- [Middleware](/docs/concepts/middleware) - Custom middleware patterns
- [Validation](/docs/concepts/validation) - Request validation with Zod
- [Testing Guide](/docs/guides/testing) - Testing strategies
- [Hono Documentation](https://hono.dev/) - Official Hono docs

---

**Next Steps:**
- Learn about [Context API](/docs/concepts/context)
- Explore [Middleware patterns](/docs/concepts/middleware)
- Understand [@Override decorator](/docs/concepts/middleware#override-decorator)
