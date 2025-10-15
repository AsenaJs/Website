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
- **Zero Dependencies** - No external dependencies except Zod (for validation)
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
bun add @asenajs/ergenecore
```

**Requirements:**
- Bun v1.3 or higher
- TypeScript v5.8.2 or higher

## Quick Start

### Basic Server Setup

```typescript
import { AsenaServerFactory } from '@asenajs/asena';
import { createErgenecoreAdapter } from '@asenajs/ergenecore/factory';
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
import { Controller } from '@asenajs/asena/server';
import { Get, Post } from '@asenajs/asena/web';
import type { Context } from '@asenajs/ergenecore/types';

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
import { createErgenecoreAdapter } from '@asenajs/ergenecore/factory';

const adapter = createErgenecoreAdapter({
  hostname: 'localhost',
  enableWebSocket: true,
  logger: customLogger
});
```

**Options:**

| Option              | Type                         | Default     | Description                    |
|:--------------------|:-----------------------------|:------------|:-------------------------------|
| `port`              | `number`                     | `3000`      | Server port (passed to AsenaServerFactory) |
| `hostname`          | `string`                     | `undefined` | Server hostname (binds to all interfaces if not set) |
| `logger`            | `ServerLogger`               | `undefined` | Custom logger instance         |
| `enableWebSocket`   | `boolean`                    | `true`      | Enable WebSocket support       |
| `websocketAdapter`  | `ErgenecoreWebsocketAdapter` | Auto        | Custom WebSocket adapter       |

### createProductionAdapter(options?)

Creates a production-optimized adapter with sensible defaults.

```typescript
import { createProductionAdapter } from '@asenajs/ergenecore/factory';

const adapter = createProductionAdapter({
  hostname: '0.0.0.0',
  logger: productionLogger
});
```

**Production Defaults:**
- WebSocket enabled
- Optimized for performance
- Use with production logger

### createDevelopmentAdapter(options?)

Creates a development-friendly adapter with verbose logging.

```typescript
import { createDevelopmentAdapter } from '@asenajs/ergenecore/factory';

const adapter = createDevelopmentAdapter();
```

**Development Defaults:**
- Port 3000
- WebSocket enabled
- Console logging enabled

## Built-in Middleware

Ergenecore includes two powerful built-in middleware classes that you can extend and customize.

### CorsMiddleware

Ergenecore provides a high-performance CORS middleware with support for origin whitelisting and dynamic validation.

#### Basic CORS (Allow All Origins)

```typescript
import { Middleware } from '@asenajs/asena/server';
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
| `origin`         | `string \| string[] \| function` | `'*'`   | Allowed origins                 |
| `credentials`    | `boolean`                     | `false`    | Allow credentials               |
| `methods`        | `string[]`                    | All        | Allowed HTTP methods            |
| `allowedHeaders` | `string[]`                    | `['Content-Type', 'Authorization']` | Allowed request headers |
| `exposedHeaders` | `string[]`                    | `[]`       | Exposed response headers        |
| `maxAge`         | `number`                      | `86400`    | Preflight cache duration (sec)  |

#### Using CORS Middleware

```typescript
import { Config } from '@asenajs/asena/server';
import { ConfigService } from '@asenajs/ergenecore';

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
import { Middleware } from '@asenajs/asena/server';
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
      keyGenerator: (ctx) => ctx.state.user?.id || 'anonymous',

      // Skip rate limiting for admin users
      skip: (ctx) => ctx.state.user?.role === 'admin',

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
import { ConfigService } from '@asenajs/ergenecore';

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
    const body = await context.getBody();
    return context.send({ token: 'abc123' });
  }
}
```

::: tip Token Bucket Algorithm
RateLimiterMiddleware uses O(1) bucket lookup and lazy token refill for optimal performance. Each middleware instance maintains its own bucket storage for route-specific rate limiting.
:::

## Performance & Architecture

### SIMD-Accelerated Routing

Ergenecore leverages Bun's SIMD-accelerated router for ultra-fast route matching. No framework overhead, just native performance.

### Zero-Copy File Serving

Uses `Bun.file()` for serving static files without copying data to memory. This provides optimal performance for static assets.

::: info Static Files
For static file serving, see [Static Files](/docs/guides/static-files).
:::

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
import type { Context } from '@asenajs/ergenecore/types';
```

::: info
For complete Context API, see [Context](/docs/concepts/context).
:::

### Middleware Base Class

Extend `MiddlewareService` for custom middleware:

```typescript
import { Middleware } from '@asenajs/asena/server';
import { MiddlewareService, type Context } from '@asenajs/ergenecore';

@Middleware()
export class AuthMiddleware extends MiddlewareService {
  async handle(context: Context, next: () => Promise<void>): Promise<any> {
    const token = context.getHeader('authorization');
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
import { Middleware } from '@asenajs/asena/server';
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
import { Config } from '@asenajs/asena/server';
import { ConfigService, type Context } from '@asenajs/ergenecore';

@Config()
export class ServerConfig extends ConfigService {
  middlewares = [GlobalCors, ApiRateLimiter];

  onError(error: Error, context: Context): Response | Promise<Response> {
    console.error('Error:', error);
    return context.send({ error: error.message }, 500);
  }
}
```

::: info
For configuration, see [Configuration](/docs/guides/configuration).
:::

## Best Practices

### 1. Use Type Imports

```typescript
// ✅ Good: Type-only import
import type { Context } from '@asenajs/ergenecore/types';

// ❌ Bad: Runtime import for types
import { Context } from '@asenajs/ergenecore/types';
```

### 2. Leverage Built-in Middleware

```typescript
// ✅ Good: Use built-in CORS and rate limiting
@Config()
export class ServerConfig extends ConfigService {
  middlewares = [GlobalCors, ApiRateLimiter];
}
```

### 3. Extend Ergenecore Base Classes

```typescript
// ✅ Good: Extend base classes
import { MiddlewareService, ValidationService, ConfigService } from '@asenajs/ergenecore';

@Middleware()
export class MyMiddleware extends MiddlewareService { }

@Middleware({ validator: true })
export class MyValidator extends ValidationService { }

@Config()
export class MyConfig extends ConfigService { }
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
import type { Context } from '@asenajs/ergenecore/types';
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
