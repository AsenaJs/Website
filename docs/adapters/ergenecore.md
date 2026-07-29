---
title: Ergenecore Adapter
description: Blazing-fast native Bun adapter with zero dependencies and built-in middleware
outline: deep
---

# Ergenecore Adapter

**Ergenecore** is Asena's native Bun adapter built exclusively with Bun's native APIs for maximum performance. Developed by the Asena team, it provides zero-dependency HTTP/WebSocket serving with SIMD-accelerated routing.

## What is Ergenecore?

Ergenecore is a high-performance adapter that:

- **Built by Asena Team** - First-party adapter maintained alongside Asena core
- **Bun-Native** - Uses `Bun.serve()` and native Bun APIs exclusively
- **Zero Dependencies** - no runtime dependencies at all; Zod is a peer your project owns
- **SIMD-Accelerated** - Leverages Bun's SIMD-optimized routing engine
- **Zero-Copy File Serving** - Uses `Bun.file()` for optimal static file performance
- **Built-in Middleware** - Includes CorsMiddleware and RateLimiterMiddleware

## Why Choose Ergenecore?

### Performance

Ergenecore is the **fastest** Asena adapter:

| Adapter              | Requests/sec | Latency (avg) |
|:---------------------|:-------------|:--------------|
| **Ergenecore**       | **294,962**  | **1.34ms**    |
| Hono (standalone)    | 266,476      | 1.49ms        |
| Hono adapter         | 233,182      | 1.70ms        |
| NestJS (Bun)         | 100,975      | 3.92ms        |

::: tip Benchmark Details
12 threads, 400 connections, 120s duration
:::

### When to Use Ergenecore

**Choose Ergenecore when:**
- ✅ You need maximum performance on Bun runtime
- ✅ You want zero external dependencies
- ✅ You need built-in CORS and rate limiting
- ✅ You're building Bun-exclusive applications
- ✅ You want first-party support and updates

**Choose Hono Adapter when:**
- ✅ You need compatibility with Hono ecosystem
- ✅ You're migrating from standalone Hono
- ✅ You need Hono-specific middleware

::: info
For Hono adapter documentation, see [Hono Adapter](/docs/adapters/hono).
:::

## Installation

```bash
bun add @asenajs/ergenecore zod
```

`zod` is a **peer dependency**: the adapter defines the validation contract, your project owns the
library and its version.

**Requirements:**
- Bun v1.3.12 or higher
- [@asenajs/asena](https://github.com/AsenaJs/Asena) v0.10.0 or higher
- [Zod](https://zod.dev) v4.3.6 or higher (peer dependency)
- TypeScript v5.9.3 or higher

## Quick Start

### Basic Server Setup

```typescript
import { AsenaServerFactory } from '@asenajs/asena';
import { createErgenecoreAdapter } from '@asenajs/ergenecore';
import { logger } from './logger';

// Create adapter
const adapter = createErgenecoreAdapter();

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
import { Controller } from '@asenajs/asena/decorators';
import { Get, Post } from '@asenajs/asena/decorators/http';
import type { Context } from '@asenajs/ergenecore';

@Controller('/users')
export class UserController {
  @Get({ path: '/:id' })
  async getById(context: Context) {
    const id = context.getParam('id');
    return context.send({ id, name: 'John Doe' });
  }

  @Post({ path: '/' })
  async create(context: Context) {
    const body = await context.getBody();
    return context.send({ created: true, data: body }, 201);
  }
}
```

::: info Context API
For complete Context API documentation, see [Context](/docs/concepts/context).
:::

## Factory Functions

Ergenecore provides three factory functions for creating adapter instances with different configurations.

### createErgenecoreAdapter(options?)

Creates a new Ergenecore adapter instance with custom configuration.

```typescript
import { createErgenecoreAdapter } from '@asenajs/ergenecore';

const adapter = createErgenecoreAdapter({
  hostname: 'localhost',
  enableWebSocket: true,
  logger: customLogger
});
```

**Options:**

| Option              | Type                         | Default     | Description                    |
|:--------------------|:-----------------------------|:------------|:-------------------------------|
| `port`              | `number`                     | —           | **Ignored.** `AsenaServer.start()` overwrites it with the port from `AsenaServerFactory.create({ port })`. |
| `hostname`          | `string`                     | `undefined` | Server hostname. On Ergenecore this is the **only** way to set it - `serveOptions.hostname` is overwritten. |
| `logger`            | `ServerLogger`               | `undefined` | Custom logger instance         |
| `enableWebSocket`   | `boolean`                    | `true`      | Enable WebSocket support       |
| `websocketAdapter`  | `ErgenecoreWebsocketAdapter` | Auto        | Custom WebSocket adapter       |
| `logErrors`         | `boolean`                    | `true`      | Log the failures the framework itself answers - a request your `onError`/`onNotFound` answered writes nothing. 5xx logs at `error` with a stack, 4xx at `debug` (falling back to `info`) without one, an unmatched route at `info`. Set `false` to silence all three. See [Adapter logging](/docs/guides/error-handling#adapter-logging). |

### createProductionAdapter(options?)

Creates a production-optimized adapter with sensible defaults.

```typescript
import { createProductionAdapter } from '@asenajs/ergenecore';

const adapter = createProductionAdapter({
  hostname: '0.0.0.0',
  logger: productionLogger
});
```

**Production Defaults:**
- WebSocket enabled (which is already the default)

::: info It is an alias
`createProductionAdapter(options)` forwards to `createErgenecoreAdapter(options)` with
`enableWebSocket` defaulted to `true` - and that is already the base default. There is no
additional performance tuning; the name only documents intent.
:::

### createDevelopmentAdapter(options?)

Creates a development-friendly adapter with verbose logging.

```typescript
import { createDevelopmentAdapter } from '@asenajs/ergenecore';

const adapter = createDevelopmentAdapter();
```

**Development Defaults:**
- WebSocket **forced** on - unlike the other two factories, passing
  `enableWebSocket: false` here has no effect
- Same default console logger as `createErgenecoreAdapter`

::: tip Prefer `createErgenecoreAdapter`
The three factories are near-identical. Use the plain one unless you specifically want the
forced-WebSocket behaviour.
:::

## Built-in Middleware

Ergenecore includes two powerful built-in middleware classes that you can extend and customize.

### CorsMiddleware

Ergenecore provides a high-performance CORS middleware with support for origin whitelisting and dynamic validation.

#### Basic CORS (Allow All Origins)

```typescript
import { Middleware } from '@asenajs/asena/decorators';
import { CorsMiddleware } from '@asenajs/ergenecore';

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
| `origin`         | `'*' \| string[] \| (origin: string) => boolean` | `'*'` | Allowed origins. A **bare origin string is not supported** here - wrap it in an array. |
| `credentials`    | `boolean`                     | `false`    | Allow credentials               |
| `methods`        | `string[]`                    | `['GET','POST','PUT','PATCH','DELETE','OPTIONS']` | Allowed HTTP methods |
| `allowedHeaders` | `string[]`                    | `['Content-Type', 'Authorization']` | Allowed request headers |
| `exposedHeaders` | `string[]`                    | `[]`       | Exposed response headers        |
| `maxAge`         | `number`                      | `86400`    | Preflight cache duration (sec)  |

#### Using CORS Middleware

```typescript
import { Config } from '@asenajs/asena/decorators';
import { ConfigService } from '@asenajs/ergenecore';

// Global CORS
@Config()
export class ServerConfig extends ConfigService {
  globalMiddlewares() {
    return [GlobalCors];
  }
}

// Per-route CORS
@Controller('/api')
export class ApiController {
  @Get({ path: '/public', middlewares: [RestrictedCors] })
  async publicData(context: Context) {
    return context.send({ data: 'public' });
  }
}
```

::: tip Performance
CorsMiddleware uses lazy header allocation and pre-joined strings for optimal performance.
:::

### RateLimiterMiddleware

Ergenecore includes a Token Bucket-based rate limiter for controlling request rates and preventing abuse.

#### Basic Rate Limiter

```typescript
import { Middleware } from '@asenajs/asena/decorators';
import { RateLimiterMiddleware } from '@asenajs/ergenecore';

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
| `keyGenerator`    | `(ctx) => string`           | `x-forwarded-for` → `cf-connecting-ip` → `getRequestIp()` → `'unknown'` | Client identifier function |
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
import { Config } from '@asenajs/asena/decorators';
import { ConfigService } from '@asenajs/ergenecore';

// Global rate limiter
@Config()
export class ServerConfig extends ConfigService {
  globalMiddlewares() {
    return [ApiRateLimiter];
  }
}

// Per-controller
@Controller('/api', { middlewares: [ApiRateLimiter] })
export class ApiController { }

// Per-route
@Controller('/auth')
export class AuthController {
  @Post({ path: '/login', middlewares: [StrictRateLimiter] })
  async login(context: Context) {
    const body = await context.getBody();
    return context.send({ token: 'abc123' });
  }
}
```

::: tip Token Bucket Algorithm
RateLimiterMiddleware uses O(1) bucket lookup and lazy token refill for optimal performance. Each middleware instance maintains its own bucket storage for route-specific rate limiting.
:::

::: info Its sweep timer is released on shutdown
`RateLimiterMiddleware.destroy()` carries an [`@OnStop`](/docs/concepts/lifecycle), so `server.stop()` clears the cleanup interval and drops the bucket map. The hook is inherited, so your `@Middleware()` subclass gets it without redeclaring anything.

The timer was always `unref()`'d and never held the process open — what it did do is survive a stop/start cycle *inside* one process (an ordinary test suite does twenty), leaving a timer per stopped server still sweeping a map nobody reads, and letting a restarted server inherit rate-limit state from the one before it.
:::

## Performance & Architecture

### SIMD-Accelerated Routing

Ergenecore leverages Bun's SIMD-accelerated router for ultra-fast route matching. No framework overhead, just native performance.

### Zero-Copy File Serving

Uses `Bun.file()` for serving static files without copying data to memory. This provides optimal performance for static assets.

### Bun-Native APIs

Ergenecore is built exclusively with:
- `Bun.serve()` - Native HTTP server
- `Bun.file()` - Zero-copy file I/O
- Native WebSocket APIs
- No external runtime dependencies

## Ergenecore-Specific Features

### Context Type

Always import Context from Ergenecore's types:

```typescript
import type { Context } from '@asenajs/ergenecore';
```

::: info
For complete Context API, see [Context](/docs/concepts/context).
:::

### Middleware Base Class

Extend `MiddlewareService` for custom middleware:

```typescript
import { Middleware } from '@asenajs/asena/decorators';
import { MiddlewareService, type Context } from '@asenajs/ergenecore';

@Middleware()
export class AuthMiddleware extends MiddlewareService {
  async handle(context: Context, next: () => Promise<void>): Promise<any> {
    const token = context.headers['authorization'];
    if (!token) {
      return context.send({ error: 'Unauthorized' }, 401);
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
import { Middleware } from '@asenajs/asena/decorators';
import { ValidationService } from '@asenajs/ergenecore';
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
import { Config } from '@asenajs/asena/decorators';
import { ConfigService, type Context } from '@asenajs/ergenecore';
import type { NotFoundRequest } from '@asenajs/asena/adapter';

@Config()
export class ServerConfig extends ConfigService {
  globalMiddlewares() {
    return [GlobalCors, ApiRateLimiter];
  }

  onError(error: Error, context: Context): Response | Promise<Response> {
    return context.send({ error: 'Something went wrong' }, 500);
  }

  onNotFound(context: Context, request: NotFoundRequest): Response | Promise<Response> {
    return context.send({ title: 'Not Found', status: 404, instance: request.path }, 404);
  }
}
```

### The two handlers do not overlap

`onError` is for something your code **threw**. `onNotFound` is for a request that matched **no
route** — a routing outcome, not a failure — so neither handler has to ask which case it is looking
at. An unmatched route never reaches `onError`.

`request.path` is the path only, with no origin and no query string, and `request.method` is
normalised by the adapter, so the same handler body works unchanged on the Hono adapter. With no
`onNotFound` declared, both adapters answer `{"error":"Not Found"}` with a 404.

A *domain* 404 — the route exists, the record does not — is still a throw, and still goes to
`onError`:

```typescript
import { HttpException } from '@asenajs/asena/adapter';

throw new HttpException(404, { error: 'User not found' });
```

`HttpException` lives in the framework core, not in this adapter, so the same throw works
unchanged on the Hono adapter. `@asenajs/ergenecore` re-exports it under the name it has always
had, and that re-export is the same class object.

::: warning `onNotFound` also catches missing static files
A file that `@StaticServe` cannot find reaches this hook too, so both adapters answer the same
body. The per-route `StaticServeService.onNotFound` still runs first when you declare one.
:::

### Every thrown error reaches `onError` first

Including `HttpException`. The adapter used to answer an `HttpException` straight from
`getResponse()` at several points and only consult your handler for everything else, so an
application could reshape its own 4xx envelopes on the Hono adapter but not here. Your handler now
sees all of them, and the adapter falls back to `getResponse()` (or a generic 500) only when there
is no handler, when it returns nothing, or when it throws.

With no `onError` declared, an unhandled error answers `{"error":"Internal Server Error"}`. The
thrown message is deliberately not echoed to the caller — it is written to the log with its stack
instead.

::: info
For configuration, see [Configuration](/docs/guides/configuration), and for the full picture of
both hooks see [Error Handling](/docs/guides/error-handling).
:::

## Best Practices

### 1. Use Type Imports

```typescript
// ✅ Good: Type-only import
import type { Context } from '@asenajs/ergenecore';

// ❌ Bad: Runtime import for types
import { Context } from '@asenajs/ergenecore';
```

### 2. Leverage Built-in Middleware

```typescript
// ✅ Good: Use built-in CORS and rate limiting
@Config()
export class ServerConfig extends ConfigService {
  globalMiddlewares() {
    return [GlobalCors, ApiRateLimiter];
  }
}
```

### 3. Extend Ergenecore Base Classes

```typescript
// ✅ Good: Extend base classes
import { Config, Middleware } from '@asenajs/asena/decorators';
import {
  ConfigService,
  MiddlewareService,
  ValidationService,
  type Context,
  type ValidationSchema,
} from '@asenajs/ergenecore';
import { isHttpException } from '@asenajs/asena/adapter';
import { z } from 'zod';

// MiddlewareService requires handle() - it is the only abstract member
@Middleware()
export class MyMiddleware extends MiddlewareService {
  public async handle(context: Context, next: () => Promise<void>) {
    await next();
  }
}

// ValidationService has no abstract members; define the request parts you validate
@Middleware({ validator: true })
export class MyValidator extends ValidationService {
  public json(): ValidationSchema {
    return z.object({ name: z.string() });
  }
}

// ConfigService has no abstract members; override only the hooks you need
@Config()
export class MyConfig extends ConfigService {
  public onError(error: Error, context: Context) {
    // Without this branch every deliberate 401/403/404 arrives at the client as a 500
    if (isHttpException(error)) {
      return error.getResponse?.() ?? context.send({ error: error.message }, error.status);
    }

    return context.send({ error: 'Internal Server Error' }, 500);
  }
}
```

### 4. Use Factory Functions

```typescript
// ✅ Good: Use appropriate factory
const adapter = process.env.NODE_ENV === 'production'
  ? createProductionAdapter({ hostname: '0.0.0.0' })
  : createDevelopmentAdapter();
```

## Troubleshooting

### Common Issues

**Issue: TypeScript errors with Context**

```typescript
// Solution: Use type-only import
import type { Context } from '@asenajs/ergenecore';
```

**Issue: Middleware not executing**

```typescript
// Solution: Ensure middleware extends MiddlewareService
import { MiddlewareService } from '@asenajs/ergenecore';

@Middleware()
export class MyMiddleware extends MiddlewareService {
  async handle(context: Context, next: () => Promise<void>) {
    await next();
  }
}
```

**Issue: WebSocket connection fails**

```typescript
// Solution: Enable WebSocket in adapter
const adapter = createErgenecoreAdapter({
  enableWebSocket: true
});
```

## Related Documentation

- [Adapters Overview](/docs/adapters/overview) - Compare Ergenecore vs Hono
- [Hono Adapter](/docs/adapters/hono) - Alternative adapter
- [Context API](/docs/concepts/context) - Request/response handling
- [Middleware](/docs/concepts/middleware) - Custom middleware patterns
- [Validation](/docs/concepts/validation) - Request validation with Zod
- [WebSocket](/docs/concepts/websocket) - WebSocket support
- [Configuration](/docs/guides/configuration) - Server configuration

---

**Next Steps:**
- Learn about [Context API](/docs/concepts/context)
- Explore [Middleware patterns](/docs/concepts/middleware)
- Understand [Validation strategies](/docs/concepts/validation)
