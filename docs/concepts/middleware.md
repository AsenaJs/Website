---
title: Middleware
description: Multi-level middleware system for cross-cutting concerns
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

::: info Adapter-Specific Response Handling
The way you handle responses in middleware differs between adapters:

**Ergenecore:** Supports both approaches:

- `context.send()` - Direct response (native feature)
- `throw new HttpException()` - Throwing HTTP exceptions

**Hono:** Only supports:

- `throw new HTTPException()` - Throwing HTTP exceptions
- `context.send()` does NOT work in middleware

This guide shows both approaches using code-groups where applicable.
:::

## Creating Middleware

Create middleware by extending `MiddlewareService` and implementing the `handle` method:

```typescript
import { Middleware } from '@asenajs/asena/server';
import { MiddlewareService, type Context } from '@asenajs/ergenecore';

@Middleware()
export class LoggerMiddleware extends MiddlewareService {
  async handle(context: Context, next: () => Promise<void>): Promise<any> {
    const start = Date.now();
    const method = context.getRequest().method;
    const url = context.getRequest().url;

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
import { Config } from '@asenajs/asena/server';
import { ConfigService } from '@asenajs/ergenecore';

@Config()
export class AppConfig extends ConfigService {
  middlewares = [
    LoggerMiddleware,
    CorsMiddleware
  ];
}
```

### 2. Pattern-Based Middleware

Apply middleware to specific route patterns:

```typescript
@Config()
export class AppConfig extends ConfigService {
  middlewares = [
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
import { Middleware } from '@asenajs/asena/server';
import { MiddlewareService, type Context } from '@asenajs/ergenecore';

@Middleware()
export class AuthMiddleware extends MiddlewareService {
  async handle(context: Context, next: () => Promise<void>): Promise<any> {
    const token = context.getHeader('authorization')?.replace('Bearer ', '');

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
import { Middleware } from '@asenajs/asena/server';
import { MiddlewareService, type Context } from '@asenajs/hono-adapter';
import { HTTPException } from 'hono/http-exception';

@Middleware()
export class AuthMiddleware extends MiddlewareService {
  async handle(context: Context, next: () => Promise<void>): Promise<any> {
    const token = context.getHeader('authorization')?.replace('Bearer ', '');

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
import { Middleware } from '@asenajs/asena/server';
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
import { Middleware } from '@asenajs/asena/server';
import { MiddlewareService, type Context } from '@asenajs/hono-adapter';
import { HTTPException } from 'hono/http-exception';

@Middleware()
export class AdminRoleMiddleware extends MiddlewareService {
  async handle(context: Context, next: () => Promise<void>): Promise<any> {
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
  async handle(context: Context, next: () => Promise<void>): Promise<any> {
    const request = context.getRequest();
    const start = Date.now();

    console.log({
      method: request.method,
      url: request.url,
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      timestamp: new Date().toISOString()
    });

    await next();

    const duration = Date.now() - start;
    console.log(`Request completed in ${duration}ms`);
  }
}
```

### Error Handling Middleware

::: code-group

```typescript [Ergenecore]
import { Middleware } from '@asenajs/asena/server';
import { MiddlewareService, type Context } from '@asenajs/ergenecore';

@Middleware()
export class ErrorHandlerMiddleware extends MiddlewareService {
  async handle(context: Context, next: () => Promise<void>): Promise<any> {
    try {
      await next();
    } catch (error) {
      console.error('Error:', error);

      if (error instanceof ValidationError) {
        return context.send({ error: error.message }, 400);
      }

      if (error instanceof UnauthorizedError) {
        return context.send({ error: 'Unauthorized' }, 401);
      }

      return context.send({ error: 'Internal server error' }, 500);
    }
  }
}
```

```typescript [Hono]
import { Middleware } from '@asenajs/asena/server';
import { MiddlewareService, type Context } from '@asenajs/hono-adapter';
import { HTTPException } from 'hono/http-exception';

@Middleware()
export class ErrorHandlerMiddleware extends MiddlewareService {
  async handle(context: Context, next: () => Promise<void>): Promise<any> {
    try {
      await next();
    } catch (error) {
      console.error('Error:', error);

      if (error instanceof ValidationError) {
        throw new HTTPException(400, { message: error.message });
      }

      if (error instanceof UnauthorizedError) {
        throw new HTTPException(401, { message: 'Unauthorized' });
      }

      throw new HTTPException(500, { message: 'Internal server error' });
    }
  }
}
```

:::

## Built-in Middleware (Ergenecore)

### CORS Middleware

```typescript
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
        if (ctx.getRequest().url.includes('/search')) return 5;
        if (ctx.getRequest().url.includes('/export')) return 10;
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
import { Middleware } from '@asenajs/asena/server';
import { MiddlewareService, type Context } from '@asenajs/ergenecore';
import { Inject } from '@asenajs/asena/ioc';

@Middleware()
export class AuthMiddleware extends MiddlewareService {
  @Inject(JwtService)
  private jwtService: JwtService;

  @Inject(UserService)
  private userService: UserService;

  async handle(context: Context, next: () => Promise<void>): Promise<any> {
    const token = context.getHeader('authorization')?.replace('Bearer ', '');

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
import { Middleware } from '@asenajs/asena/server';
import { MiddlewareService, type Context } from '@asenajs/hono-adapter';
import { Inject } from '@asenajs/asena/ioc';
import { HTTPException } from 'hono/http-exception';

@Middleware()
export class AuthMiddleware extends MiddlewareService {
  @Inject(JwtService)
  private jwtService: JwtService;

  @Inject(UserService)
  private userService: UserService;

  async handle(context: Context, next: () => Promise<void>): Promise<any> {
    const token = context.getHeader('authorization')?.replace('Bearer ', '');

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
Global Middleware
  ↓
Pattern-Based Middleware
  ↓
Controller Middleware
  ↓
Route Middleware
  ↓
Route Handler
```

**Example:**

```typescript
// 1. Global
@Config()
export class AppConfig extends ConfigService {
  middlewares = [
    LoggerMiddleware, // Executes 1st
    { middleware: AuthMiddleware, routes: { include: ['/api/*'] } } // Executes 2nd
  ];
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

Don't call `next()` to stop the middleware chain:

::: code-group

```typescript [Ergenecore]
import { Middleware } from '@asenajs/asena/server';
import { MiddlewareService, type Context } from '@asenajs/ergenecore';

@Middleware()
export class MaintenanceMiddleware extends MiddlewareService {
  async handle(context: Context, next: () => Promise<void>): Promise<any> {
    const isMaintenanceMode = process.env.MAINTENANCE === 'true';

    if (isMaintenanceMode) {
      // Don't call next() - stop here
      return context.send({
        error: 'Service under maintenance'
      }, 503);
    }

    await next(); // Continue if not in maintenance mode
  }
}
```

```typescript [Hono]
import { Middleware } from '@asenajs/asena/server';
import { MiddlewareService, type Context } from '@asenajs/hono-adapter';
import { HTTPException } from 'hono/http-exception';

@Middleware()
export class MaintenanceMiddleware extends MiddlewareService {
  async handle(context: Context, next: () => Promise<void>): Promise<any> {
    const isMaintenanceMode = process.env.MAINTENANCE === 'true';

    if (isMaintenanceMode) {
      // Don't call next() - stop here
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
middlewares = [
  LoggerMiddleware,
  AuthMiddleware
];

// ❌ Bad: Auth before logger (auth logs won't be captured)
middlewares = [
  AuthMiddleware,
  LoggerMiddleware
];
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
