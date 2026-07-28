---
title: Middleware
description: Global, pattern-based, controller-level and route-level middleware with @Middleware
outline: deep
---

# Middleware

Asena provides a flexible multi-level middleware system that allows you to handle cross-cutting concerns like authentication, logging, rate limiting, and more. Middleware can be applied globally, at the controller level, or on individual routes.

## What is Middleware?

Middleware is code that executes **before** your route handler. It can:

- Validate authentication/authorization
- Log requests
- Transform request/response data
- Handle CORS
- Rate limiting
- Error handling

::: info Responding from middleware
Both adapters accept the same three ways to answer a request from middleware:

- **`return context.send(...)`** - returning a `Response` short-circuits the chain
- **`return false`** - short-circuits with `403 Forbidden`
- **`throw`** - an `HttpException` (Ergenecore) or `HTTPException` (Hono) is routed to
  your `onError` handler

The one thing that is *not* portable is **omitting `next()`**. See
[Stopping Middleware Chain](#stopping-middleware-chain).
:::

## Creating Middleware

Create middleware by extending `MiddlewareService` and implementing the `handle` method:

```typescript
import { Middleware } from '@asenajs/asena/decorators';
import { MiddlewareService, type Context } from '@asenajs/ergenecore';

@Middleware()
export class LoggerMiddleware extends MiddlewareService {
  async handle(context: Context, next: () => Promise<void>): Promise<any> {
    const start = Date.now();
    const method = context.req.method;
    const url = context.req.url;

    console.log(`[${method}] ${url} - Start`);

    await next(); // Call next middleware or route handler

    const duration = Date.now() - start;
    console.log(`[${method}] ${url} - Completed in ${duration}ms`);
  }
}
```

::: tip
Always call `await next()` to pass control to the next middleware or route handler!
:::

## Middleware Levels

### 1. Global Middleware

Applied to **all routes** in your application:

```typescript
import { Config } from '@asenajs/asena/decorators';
import { ConfigService } from '@asenajs/ergenecore';

@Config()
export class AppConfig extends ConfigService {
  public globalMiddlewares() {
    return [
      LoggerMiddleware,
      CorsMiddleware
    ];
  }
}
```

::: warning Every entry must be a component
The names above stand for **your** middlewares — each one a class carrying `@Middleware()`. The
built-ins an adapter ships (`CorsMiddleware`, `RateLimiterMiddleware`) are undecorated base classes
meant to be extended, so listing one directly fails at startup with
`… is not a component. Decorate it with @Middleware()`. Subclass it first:

```typescript
@Middleware()
export class GlobalCors extends CorsMiddleware {}
```

Component identity is not inherited, which is exactly why the subclass needs its own decorator —
see [Inheritance](/docs/concepts/inheritance).
:::

::: warning It is a method, not a property
Global middleware must be returned from a `globalMiddlewares()` **method**. A
`middlewares = [...]` property compiles but is never read by the framework, so the
middleware silently never runs.
:::

### 2. Pattern-Based Middleware

Apply middleware to specific route patterns:

```typescript
@Config()
export class AppConfig extends ConfigService {
  public globalMiddlewares() {
    return [
      // Apply to all routes
      LoggerMiddleware,

      // Apply only to /api/* and /admin/* routes
      {
        middleware: AuthMiddleware,
        routes: { include: ['/api/*', '/admin/*'] }
      },

      // Apply to all routes except /health and /metrics
      {
        middleware: RateLimiterMiddleware,
        routes: { exclude: ['/health', '/metrics'] }
      }
    ];
  }
}
```

### 3. Controller-Level Middleware

Applied to **all routes** in a controller:

```typescript
@Controller({ path: '/admin', middlewares: [AuthMiddleware, AdminRoleMiddleware] })
export class AdminController {
  @Get('/users') // AuthMiddleware + AdminRoleMiddleware applied
  async getUsers(context: Context) {
    return context.send({ users: [] });
  }

  @Get('/settings') // AuthMiddleware + AdminRoleMiddleware applied
  async getSettings(context: Context) {
    return context.send({ settings: {} });
  }
}
```

### 4. Route-Level Middleware

Applied to **specific routes**:

```typescript
@Controller('/users')
export class UserController {
  @Get({ path: '/' }) // No middleware
  async list(context: Context) {
    return context.send({ users: [] });
  }

  @Post({ path: '/', middlewares: [AuthMiddleware, CreateUserValidator] })
  async create(context: Context) {
    const data = await context.getBody();
    return context.send({ created: true });
  }

  @Delete({ path: '/:id', middlewares: [AuthMiddleware, AdminRoleMiddleware] })
  async delete(context: Context) {
    return context.send({ deleted: true });
  }
}
```

## Common Middleware Patterns

### Authentication Middleware

::: code-group

```typescript [Ergenecore]
import { Middleware } from '@asenajs/asena/decorators';
import { MiddlewareService, type Context } from '@asenajs/ergenecore';

@Middleware()
export class AuthMiddleware extends MiddlewareService {
  async handle(context: Context, next: () => Promise<void>): Promise<any> {
    const token = context.headers['authorization']?.replace('Bearer ', '');

    if (!token) {
      return context.send({ error: 'No token provided' }, 401);
    }

    try {
      // Verify JWT token
      const payload = await this.verifyToken(token);
      context.setValue('user', payload);
      await next();
    } catch (error) {
      return context.send({ error: 'Invalid token' }, 401);
    }
  }

  private async verifyToken(token: string) {
    // JWT verification logic
    return { id: 123, role: 'user' };
  }
}
```

```typescript [Hono]
import { Middleware } from '@asenajs/asena/decorators';
import { MiddlewareService, type Context } from '@asenajs/hono-adapter';
import { HTTPException } from 'hono/http-exception';

@Middleware()
export class AuthMiddleware extends MiddlewareService {
  async handle(context: Context, next: () => Promise<void>): Promise<any> {
    const token = context.headers['authorization']?.replace('Bearer ', '');

    if (!token) {
      throw new HTTPException(401, { message: 'No token provided' });
    }

    try {
      // Verify JWT token
      const payload = await this.verifyToken(token);
      context.setValue('user', payload);
      await next();
    } catch (error) {
      throw new HTTPException(401, { message: 'Invalid token' });
    }
  }

  private async verifyToken(token: string) {
    // JWT verification logic
    return { id: 123, role: 'user' };
  }
}
```

:::

### Role-Based Authorization

::: code-group

```typescript [Ergenecore]
import { Middleware } from '@asenajs/asena/decorators';
import { MiddlewareService, type Context } from '@asenajs/ergenecore';

@Middleware()
export class AdminRoleMiddleware extends MiddlewareService {
  async handle(context: Context, next: () => Promise<void>): Promise<any> {
    const user = context.getValue('user');

    if (!user || user.role !== 'admin') {
      return context.send({ error: 'Forbidden' }, 403);
    }

    await next();
  }
}
```

```typescript [Hono]
import { Middleware } from '@asenajs/asena/decorators';
import { MiddlewareService, type Context } from '@asenajs/hono-adapter';
import { HTTPException } from 'hono/http-exception';
import type { Next } from 'hono';


@Middleware()
export class AdminRoleMiddleware extends MiddlewareService {
  async handle(context: Context, next: Next): Promise<any> {
    const user = context.getValue('user');

    if (!user || user.role !== 'admin') {
      throw new HTTPException(403, { message: 'Forbidden' });
    }

    await next();
  }
}
```

:::

### Request Logging

```typescript
@Middleware()
export class RequestLoggerMiddleware extends MiddlewareService {
  async handle(context: Context, next: Next): Promise<any> {
    const request = context.req;
    const start = Date.now();

    console.log({
      method: request.method,
      url: request.url,
      ip: request.headers['x-forwarded-for'] || 'unknown',
      timestamp: new Date().toISOString()
    });

    await next();

    const duration = Date.now() - start;
    console.log(`Request completed in ${duration}ms`);
  }
}
```

## Built-in Middleware

### CORS Middleware

```typescript
import { Middleware } from '@asenajs/asena/decorators';
import { CorsMiddleware } from '@asenajs/ergenecore';

@Middleware()
export class GlobalCors extends CorsMiddleware {
  constructor() {
    super({
      origin: ['https://example.com', 'https://app.example.com'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      maxAge: 86400
    });
  }
}
```

**Dynamic CORS:**

```typescript
@Middleware()
export class DynamicCors extends CorsMiddleware {
  constructor() {
    super({
      origin: (origin: string) => {
        return origin.endsWith('.example.com');
      },
      credentials: true
    });
  }
}
```

### Rate Limiter Middleware

```typescript
import { RateLimiterMiddleware } from '@asenajs/ergenecore';

@Middleware()
export class ApiRateLimiter extends RateLimiterMiddleware {
  constructor() {
    super({
      capacity: 100, // 100 requests
      refillRate: 100 / 60, // per minute
      message: 'Rate limit exceeded'
    });
  }
}
```

**Advanced Rate Limiter:**

```typescript
@Middleware()
export class AdvancedRateLimiter extends RateLimiterMiddleware {
  constructor() {
    super({
      capacity: 50,
      refillRate: 50 / 60,

      // Rate limit by user ID
      keyGenerator: (ctx) => ctx.getValue('user')?.id || 'anonymous',

      // Skip for admins
      skip: (ctx) => ctx.getValue('user')?.role === 'admin',

      // Expensive operations cost more
      cost: (ctx) => {
        if (ctx.req.url.includes('/search')) return 5;
        if (ctx.req.url.includes('/export')) return 10;
        return 1;
      }
    });
  }
}
```

## Middleware with Dependency Injection

Middleware can use dependency injection just like services:

::: code-group

```typescript [Ergenecore]
import { Middleware } from '@asenajs/asena/decorators';
import { MiddlewareService, type Context } from '@asenajs/ergenecore';
import { Inject } from '@asenajs/asena/decorators/ioc';

@Middleware()
export class AuthMiddleware extends MiddlewareService {
  @Inject(JwtService)
  private jwtService: JwtService;

  @Inject(UserService)
  private userService: UserService;

  async handle(context: Context, next: () => Promise<void>): Promise<any> {
    const token = context.req.headers['authorization']?.replace('Bearer ', '');

    if (!token) {
      return context.send({ error: 'Unauthorized' }, 401);
    }

    try {
      const payload = await this.jwtService.verify(token);
      const user = await this.userService.findById(payload.id);

      context.setValue('user', user);
      await next();
    } catch (error) {
      return context.send({ error: 'Invalid token' }, 401);
    }
  }
}
```

```typescript [Hono]
import { Middleware } from '@asenajs/asena/decorators';
import { MiddlewareService, type Context } from '@asenajs/hono-adapter';
import { Inject } from '@asenajs/asena/decorators/ioc';
import { HTTPException } from 'hono/http-exception';

@Middleware()
export class AuthMiddleware extends MiddlewareService {
  @Inject(JwtService)
  private jwtService: JwtService;

  @Inject(UserService)
  private userService: UserService;

  async handle(context: Context, next: () => Promise<void>): Promise<any> {
    const token = context.headers['authorization']?.replace('Bearer ', '');

    if (!token) {
      throw new HTTPException(401, { message: 'Unauthorized' });
    }

    try {
      const payload = await this.jwtService.verify(token);
      const user = await this.userService.findById(payload.id);

      context.setValue('user', user);
      await next();
    } catch (error) {
      throw new HTTPException(401, { message: 'Invalid token' });
    }
  }
}
```

:::

## Middleware Execution Order

Middleware executes in the order it's defined:

```text
globalMiddlewares()   ← array order, pattern-based entries included
  ↓
Controller Middleware
  ↓
Route Middleware
  ↓
Route Handler
  ↓
Route Middleware
  ↓
Controller Middleware
  ↓
globalMiddlewares()

```

::: info Pattern-based entries are not a separate stage
An entry with a `routes` filter is just an item in the `globalMiddlewares()` array. It runs
in **array position**, interleaved with unfiltered entries - putting a pattern-based entry
first makes it run first. Controller-level middleware always follows the whole global list,
because the config is applied before controllers are registered.
:::

**Example:**

```typescript
// 1. Global
@Config()
export class AppConfig extends ConfigService {
  public globalMiddlewares() {
    return [
      LoggerMiddleware, // Executes 1st
      { middleware: AuthMiddleware, routes: { include: ['/api/*'] } } // Executes 2nd
    ];
  }
}

// 2. Controller-level
@Controller({ path: '/api/users', middlewares: [CacheMiddleware] }) // Executes 3rd
export class UserController {
  // 3. Route-level
  @Get({ path: '/:id', middlewares: [ValidationMiddleware] }) // Executes 4th
  async getUser(context: Context) { // Executes 5th (finally!)
    return context.send({ user: {} });
  }
}
```

## Stopping Middleware Chain

Return a `Response` (or `false`, or throw) to stop the chain:

::: danger Omitting `next()` is not portable
Under **Hono**, a middleware that returns without calling `next()` ends the chain. Under
**Ergenecore** it does not: when a middleware returns `void` or `true` without calling
`next()`, the adapter continues to the next middleware on your behalf.

Always signal explicitly - `return context.send(...)`, `return false`, or `throw` - so the
same middleware behaves identically on both adapters.
:::

### Shorthand: `return false`

Returning `false` short-circuits the chain with a plain `403 Forbidden` on both adapters -
useful when no response body is needed:

```typescript
@Middleware()
export class IpAllowlistMiddleware extends MiddlewareService {
  async handle(context: Context, next: () => Promise<void>): Promise<any> {
    if (!this.isAllowed(context.getRequestIp())) {
      return false; // -> 403 Forbidden, handler never runs
    }

    await next();
  }

  private isAllowed(ip: string | null) {
    return ip !== null;
  }
}
```

::: code-group

```typescript [Ergenecore]
import { Middleware } from '@asenajs/asena/decorators';
import { MiddlewareService, type Context } from '@asenajs/ergenecore';

@Middleware()
export class MaintenanceMiddleware extends MiddlewareService {
  async handle(context: Context, next: () => Promise<void>): Promise<any> {
    const isMaintenanceMode = process.env.MAINTENANCE === 'true';

    if (isMaintenanceMode) {
      // Returning a Response stops the chain
      return context.send({
        error: 'Service under maintenance'
      }, 503);
    }

    await next(); // Continue if not in maintenance mode
  }
}
```

```typescript [Hono]
import { Middleware } from '@asenajs/asena/decorators';
import { MiddlewareService, type Context } from '@asenajs/hono-adapter';
import { HTTPException } from 'hono/http-exception';

@Middleware()
export class MaintenanceMiddleware extends MiddlewareService {
  async handle(context: Context, next: () => Promise<void>): Promise<any> {
    const isMaintenanceMode = process.env.MAINTENANCE === 'true';

    if (isMaintenanceMode) {
      // Returning a Response also works here; throwing routes through onError instead
      throw new HTTPException(503, {
        message: 'Service under maintenance'
      });
    }

    await next(); // Continue if not in maintenance mode
  }
}
```

:::

## Best Practices

### 1. Use Context for Sharing Data

```typescript
// ✅ Good: Store data in context
@Middleware()
export class AuthMiddleware extends MiddlewareService {
  async handle(context: Context, next: () => Promise<void>) {
    context.setValue('user', user);
    await next();
  }
}

// ❌ Bad: Global state
let currentUser; // Don't!
```

### 2. Always Await next()

```typescript
// ✅ Good
await next();

// ❌ Bad
next(); // Missing await!
```

### 3. Order Matters

```typescript
// ✅ Good: Logger first, then auth
public globalMiddlewares() {
  return [LoggerMiddleware, AuthMiddleware];
}

// ❌ Bad: Auth before logger (auth logs won't be captured)
public globalMiddlewares() {
  return [AuthMiddleware, LoggerMiddleware];
}
```

## Related Documentation

- [Controllers](/docs/concepts/controllers)
- [Ergenecore Adapter](/docs/adapters/ergenecore)
- [Validation](/docs/concepts/validation)
- [Configuration](/docs/guides/configuration)

---

**Next Steps:**

- Learn about [Validation](/docs/concepts/validation)
- Explore [Context API](/docs/concepts/context)
- Understand [Configuration](/docs/guides/configuration)
