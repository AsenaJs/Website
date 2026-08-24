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

| Adapter            | Runtime | Plaintext   | JSON serialization | Full API endpoint |
|:-------------------|:--------|------------:|-------------------:|------------------:|
| Ergenecore         | Bun     | 202,066     | 195,494            | 119,095           |
| **Hono adapter**   | Bun     | **190,030** | **178,857**        | **126,251**       |

The Hono adapter pulls ahead on the body-heavy API endpoint; Ergenecore leads on raw plaintext throughput.

::: tip
Numbers from the [published benchmark suite](/docs/benchmarks) — byte-verified workloads, `wrk` at 400 connections, full methodology attached.
:::

### When to Use Hono Adapter

**Choose Hono Adapter when:**
- ✅ You're already familiar with Hono framework
- ✅ You're migrating an existing Hono project to Asena
- ✅ You need Hono-specific middleware or plugins
- ✅ You want a battle-tested, production-proven adapter
- ✅ You value ecosystem compatibility over raw performance

**Choose Ergenecore when:**
- ✅ You need maximum raw throughput
- ✅ You want zero external dependencies
- ✅ You're building a greenfield Bun-exclusive project

::: info
For Ergenecore adapter documentation, see [Ergenecore Adapter](/docs/adapters/ergenecore).
:::

## Installation

```bash
bun add @asenajs/hono-adapter hono zod
```

`hono` and `zod` are **peer dependencies**: this adapter defines the wrapper, your project owns
the libraries it wraps. That is what keeps you and the adapter on one copy of `hono` — see
[Error Handling](/docs/guides/error-handling#throwing-http-exceptions) for what a second copy does.

**Requirements:**
- [Bun](https://bun.sh) runtime v1.3.12 or higher
- [@asenajs/asena](https://github.com/AsenaJs/Asena) v0.11.0 or higher (peer dependency)
- [Hono](https://hono.dev) v4.12.9 or higher (peer dependency)
- [Zod](https://zod.dev) v4.3.6 or higher (peer dependency)
- TypeScript v5.8.2 or higher

## Context semantics

The adapter implements the core [`AsenaContext`](/docs/concepts/context) contract, so handler code
is portable between adapters. Three points of that contract are worth stating here, because two of
them changed in `4.0.0`:

- **`setResponseHeader(key, value)` replaces** any value already set for that header. It used to
  append.
- **`appendResponseHeader(key, value)` appends**, keeping existing values — for multi-valued
  headers such as `Vary` and `Link`. Cookies go through `setCookie`, not through either method.
- **`getQuery(name)` is typed `string | undefined`**: `undefined` when the parameter is absent,
  `''` when present but empty (`?name=`). The runtime already behaved this way; only the type
  changed.

An SSE message may carry a `comment` instead of — or alongside — `data`. Comments are emitted as
`: <line>` lines, which `EventSource` clients ignore, which makes them the right shape for a
keep-alive ping:

```typescript
await stream.writeSSE({ comment: 'ping' });   // writes ": ping\n\n"
```

At least one of `data` / `comment` must be set; `writeSSE` throws otherwise.

::: warning Upgrading from 3.x
`setResponseHeader` appending was the source of two visible bugs, both of which this release
closes:

- **`CorsMiddleware` clobbered `Vary`.** It now appends `Vary: Origin` with an "already listed"
  guard, so an upstream `Vary: Accept-Encoding` survives and `Origin` is never listed twice when
  the middleware runs more than once.
- **`RateLimiterMiddleware` duplicated its headers.** A global and a route limiter on the same
  request emitted two sets of `X-RateLimit-*`. With replace semantics the innermost limiter wins
  and each header appears exactly once.

If your own code called `setResponseHeader` twice on purpose to build a multi-valued header,
switch those calls to `appendResponseHeader`.
:::

## Quick Start

### Basic Server Setup

```typescript
import { AsenaServerFactory } from '@asenajs/asena';
import { createHonoAdapter } from '@asenajs/hono-adapter';
import { AsenaLogger } from '@asenajs/asena-logger';

// Create adapter (returns tuple: [adapter, logger]) - a logger is required
const [adapter, logger] = createHonoAdapter({ logger: new AsenaLogger() });

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
import type { Context } from '@asenajs/hono-adapter';

@Controller('/users')
export class UserController {
  @Get({ path: '/:id' })
  async getById(context: Context) {
    const id = context.req.param('id');
    return context.send({ id, name: 'John Doe' });
  }

  @Post({ path: '/' })
  async create(context: Context) {
    const body = await context.req.json();
    return context.send({ created: true, data: body }, 201);
  }
}
```

::: info Context API
For complete Context API documentation, see [Context](/docs/concepts/context).
:::

## Factory Function

### createHonoAdapter(loggerOrOptions?)

Creates a new Hono adapter instance. Supports two calling conventions:

**Legacy: Logger argument**

```typescript
import { createHonoAdapter } from '@asenajs/hono-adapter';

const [adapter, logger] = createHonoAdapter(myLogger);
```

**Options object (recommended)**

```typescript
import { createHonoAdapter } from '@asenajs/hono-adapter';

const [adapter, logger] = createHonoAdapter({
  logger: myLogger,
  strict: false, // '/health' and '/health/' match the same route
});
```

### HonoAdapterOptions

| Property | Type | Required | Default | Description |
|:---------|:-----|:---------|:--------|:------------|
| `logger` | `ServerLogger` | Yes | — | Logger instance |
| `app` | `Hono` | No | — | Pre-configured Hono app instance |
| `websocketAdapter` | `HonoWebsocketAdapter` | No | — | Custom WebSocket adapter |
| `strict` | `boolean` | No | `true` | Strict route matching (trailing slash) |
| `logErrors` | `boolean` | No | `true` | Log the failures the framework itself answers - a request your `onError`/`onNotFound` answered writes nothing. 5xx logs at `error` with a stack, 4xx at `debug` (falling back to `info`) without one, an unmatched route at `info`. Set `false` to silence all three. See [Adapter logging](/docs/guides/error-handling#adapter-logging). |

**Returns:** Tuple: `[adapter, logger]`

### Trailing Slash (Strict Mode)

By default, Hono uses strict mode where `/health` and `/health/` are **different** routes. Set `strict: false` to treat them as the same:

```typescript
// strict: true (default) — /users and /users/ are different routes
const [adapter, logger] = createHonoAdapter({ logger: myLogger });

// strict: false — /users and /users/ match the same route
const [adapter, logger] = createHonoAdapter({ logger: myLogger, strict: false });
```

::: tip Reverse Proxies
Set `strict: false` when deploying behind reverse proxies (Nginx, Cloudflare, etc.) that may add or remove trailing slashes. This prevents 404 errors from slash mismatches.
:::

## Built-in Middleware

Hono Adapter includes the same powerful built-in middleware as Ergenecore.

### CorsMiddleware

High-performance CORS middleware with origin whitelisting and dynamic validation.

#### Basic CORS (Allow All Origins)

```typescript
import { Middleware } from '@asenajs/asena/decorators';
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
| `methods`        | `string[]`                    | `['GET','POST','PUT','PATCH','DELETE','OPTIONS']` | Allowed HTTP methods |
| `allowedHeaders` | `string[]`                    | `['Content-Type', 'Authorization']` | Allowed request headers |
| `exposedHeaders` | `string[]`                    | `[]`       | Exposed response headers        |
| `maxAge`         | `number`                      | `86400`    | Preflight cache duration (sec)  |

#### Using CORS Middleware

```typescript
import { Config } from '@asenajs/asena/decorators';
import { ConfigService } from '@asenajs/hono-adapter';

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

Token Bucket-based rate limiter for controlling request rates and preventing abuse.

#### Basic Rate Limiter

```typescript
import { Middleware } from '@asenajs/asena/decorators';
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

Each appears exactly once, even when a global and a route limiter both run — the innermost one
writes last and wins. Before `4.0.0` that pairing emitted both sets.

#### Using Rate Limiter

```typescript
import { Config } from '@asenajs/asena/decorators';
import { ConfigService } from '@asenajs/hono-adapter';

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
    const body = await context.req.json();
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

## Hono-Specific Features

### @Override Decorator

The `@Override` decorator allows middleware to work directly with Hono's native context without Asena wrappers. This is **unique to Hono Adapter** and enables seamless integration with Hono ecosystem middleware.

Extend `AsenaMiddlewareService` rather than the adapter's `MiddlewareService` here: the adapter class binds `handle()` to Asena's wrapped Context, so declaring a Hono `Context` parameter on it is a signature mismatch. `AsenaMiddlewareService` leaves the context type open, which is exactly what `@Override` needs.

```typescript
import { Middleware, Override } from '@asenajs/asena/decorators';
import { AsenaMiddlewareService } from '@asenajs/asena/middleware';
import type { Context as HonoContext, Next } from 'hono';

@Middleware()
export class NativeHonoMiddleware extends AsenaMiddlewareService {
  @Override()
  async handle(context: HonoContext, next: Next) {
    // Use Hono's native context directly - no wrapper!
    const startTime = Date.now();

    await next();

    const duration = Date.now() - startTime;
    // Hono's own API - this is the native context, not Asena's wrapper
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
import { Middleware, Override } from '@asenajs/asena/decorators';
import { AsenaMiddlewareService } from '@asenajs/asena/middleware';
import { compress } from 'hono/compress';
import { logger } from 'hono/logger';
import type { Context as HonoContext, Next } from 'hono';

@Middleware()
export class CompressionMiddleware extends AsenaMiddlewareService {
  @Override()
  async handle(context: HonoContext, next: Next) {
    // Use Hono's compress middleware directly
    return compress()(context, next);
  }
}

@Middleware()
export class LoggerMiddleware extends AsenaMiddlewareService {
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
import { Middleware } from '@asenajs/asena/decorators';
import { MiddlewareService, type Context } from '@asenajs/hono-adapter';

@Middleware()
export class AuthMiddleware extends MiddlewareService {
  async handle(context: Context, next: () => Promise<void>): Promise<any> {
    const token = context.req.header('authorization');
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
import { Config } from '@asenajs/asena/decorators';
import { ConfigService, type Context } from '@asenajs/hono-adapter';
import { isHttpException, type NotFoundRequest } from '@asenajs/asena/adapter';

@Config()
export class ServerConfig extends ConfigService {
  globalMiddlewares() {
    return [GlobalCors, ApiRateLimiter];
  }

  onError(error: Error, context: Context): Response | Promise<Response> {
    if (isHttpException(error)) {
      // Answer with the body the exception carries; `error.message` is that body
      // already flattened to a string, so re-wrapping it double-encodes an object
      return error.getResponse?.() ?? context.send({ error: error.message }, error.status);
    }

    return context.send({ error: 'Internal Server Error' }, 500);
  }

  onNotFound(context: Context, request: NotFoundRequest): Response | Promise<Response> {
    return context.send({ title: 'Not Found', status: 404, instance: request.path }, 404);
  }
}
```

::: info
For configuration, see [Configuration](/docs/guides/configuration).
:::

### The two handlers do not overlap

`onError` is for something your code **threw**. `onNotFound` is for a request that matched **no
route** — a routing outcome, not a failure — so neither handler has to ask which case it is
looking at. An unmatched route never reaches `onError`.

`request.path` is the path only, with no origin and no query string, and `request.method` is
normalised by the adapter, so the same handler body works unchanged on Ergenecore. With no
`onNotFound` declared, both adapters answer `{"error":"Not Found"}` with a 404.

A *domain* 404 — the route exists, the record does not — is still a throw, and still goes to
`onError`:

```typescript
import { HttpException } from '@asenajs/asena/adapter';

throw new HttpException(404, { error: 'User not found' });
```

`HttpException` lives in the framework core, so that throw is identical on Ergenecore. This
adapter deliberately does **not** re-export it: it already exports hono's `HTTPException`, and two
throwable classes differing by the case of two letters is a trap for autocomplete.

### Every thrown error reaches `onError` first

Including `HttpException`, hono's `HTTPException`, and anything a hono middleware raised. Your
handler sees all of them; the adapter falls back to answering from the exception itself only when
there is no handler, when it returns nothing, or when it throws.

::: warning Match with `isHttpException()`, not `instanceof`
This adapter is the one where it matters most. Applications throw `HttpException`, while
`hono/basic-auth`, `hono/bearer-auth`, `hono/jwt` and hono's own validator throw `HTTPException` —
two unrelated classes, so **either** `instanceof` check misses half of your 4xx responses and
sends them down the generic 500 branch. `isHttpException()` matches both.

It also survives a project resolving two copies of `@asenajs/asena`, where `instanceof` silently
answers false: `HttpException` brands each instance, so the brand travels with the exception
whichever copy built it.

**Two copies of `hono` are a different matter, and the guard does not save you there.** The brand
is patched onto the prototype of the `HTTPException` class *the adapter* resolved; it cannot reach
another copy's class. An `HTTPException` thrown from a second copy is recognised by neither
`instanceof` nor `isHttpException()`, and answers `500`.

Since 3.0.0 `hono` is a **peer dependency**, so the adapter has no resolution slot of its own and a
project normally resolves one copy — which is what makes the guard sufficient. Keep the habit
anyway: always `import { HTTPException } from '@asenajs/hono-adapter'`, never from
`hono/http-exception`. Preferring `HttpException` from `@asenajs/asena/adapter` for your own throws
avoids the question entirely, since it brands each instance rather than a prototype. See
[Error Handling](/docs/guides/error-handling#throwing-http-exceptions).
:::

With no `onError` declared, an unhandled error answers `{"error":"Internal Server Error"}`. The
thrown message is deliberately not echoed to the caller — it is written to the log with its stack
instead. See [Adapter logging](/docs/guides/error-handling#adapter-logging).

### Static File Serving

Extend `StaticServeService` for serving static files:

```typescript
import { Controller } from '@asenajs/asena/decorators';
import { Get } from '@asenajs/asena/decorators/http';
import { StaticServe } from '@asenajs/asena/decorators';
import { StaticServeService, type Context } from '@asenajs/hono-adapter';

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
import { Controller } from '@asenajs/asena/decorators';
import { Get, Post } from '@asenajs/asena/decorators/http';
import type { Context } from '@asenajs/hono-adapter';

@Controller('/users')
export class UserController {
  @Get({ path: '/:id' })
  async getUser(context: Context) {
    const id = context.req.param('id');
    return context.send({ id, name: 'John' });
  }

  @Post({ path: '/' })
  async create(context: Context) {
    const body = await context.req.json();
    return context.send({ created: true, data: body }, 201);
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
import { logger } from "./logger";

describe("UserController", () => {
  let server;
  let baseUrl;

  beforeEach(async () => {
    // 10000-31999: below the kernel's ephemeral floor (net.ipv4.ip_local_port_range,
    // 32768-60999). A server port drawn from that range collides with the outbound
    // sockets the suite itself holds open - TIME_WAIT included - and Bun.serve then
    // fails with EADDRINUSE, randomly, in whichever test happened to draw it.
    const port = 10000 + Math.floor(Math.random() * 22000);
    // createHonoAdapter returns a tuple and requires a logger - calling it with no argument
    // yields [adapter, undefined], and AsenaServerFactory.create throws on the undefined logger
    const [adapter] = createHonoAdapter({ logger });

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
| `headless`   | `boolean`  | Explicit opt-in to boot without an adapter ([headless mode](/docs/concepts/microservices#headless-mode)) |
| `logger`     | `Logger`   | Logger instance                           |
| `port`       | `number`   | Server port (optional)                    |
| `components` | `Class[]`  | Controllers/services to register (for testing) |
| `overrides`  | `Record<string, object>` | Replace registered components with test doubles, keyed by service name |
| `health`     | `{ port, path? }` | Health probe endpoint — `path` defaults to `/healthz` ([health probes](/docs/concepts/lifecycle#health-probes)) |
| `shutdown`   | `object`   | Signal handling and `@OnStop` timeouts ([signal handling](/docs/concepts/lifecycle#signal-handling)) |
| `keepAlive`  | `boolean`  | Hold the event loop open. Defaults to `true` in headless mode, `false` otherwise |
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
  globalMiddlewares() {
    return [GlobalCors, ApiRateLimiter];
  }
}
```

### 3. Use @Override for Hono Middleware

```typescript
// ✅ Good: Use @Override for Hono ecosystem middleware
@Middleware()
export class HonoCompress extends AsenaMiddlewareService {
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
return context.send({ data });

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
// Solution: Use @Override decorator for native Hono middleware, and extend
// AsenaMiddlewareService so the Hono Context parameter type-checks
import { Override } from '@asenajs/asena/decorators';
import { AsenaMiddlewareService } from '@asenajs/asena/middleware';
import type { Context as HonoContext, Next } from 'hono';

@Middleware()
export class MyHonoMiddleware extends AsenaMiddlewareService {
  @Override()
  async handle(context: HonoContext, next: Next) {
    // Use Hono's native context
    await next();
  }
}
```

## Related

- [Adapters Overview](/docs/adapters/overview) - Compare Hono vs Ergenecore
- [Ergenecore Adapter](/docs/adapters/ergenecore) - Alternative adapter
- [Context API](/docs/concepts/context) - Request/response handling
- [Middleware](/docs/concepts/middleware) - Custom middleware patterns
- [Validation](/docs/concepts/validation) - Request validation with Zod
- [Testing Guide](/docs/guides/testing) - Testing strategies
- [Hono Documentation](https://hono.dev/) - Official Hono docs
