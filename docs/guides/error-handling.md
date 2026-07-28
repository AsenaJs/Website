---
title: Error Handling
description: Comprehensive guide to error handling in Asena - throwing exceptions, global error handlers, custom errors, and best practices
outline: deep
---

# Error Handling

Error handling is a critical part of building robust web applications. Asena provides a powerful and flexible error handling system that works seamlessly with both Ergenecore and Hono adapters.

## Why Error Handling Matters

Proper error handling ensures:

- **User Experience**: Clear, consistent error messages help users understand what went wrong
- **Debugging**: Structured errors with context make troubleshooting easier
- **Security**: Proper error responses prevent sensitive information leakage
- **Maintainability**: Centralized error handling reduces code duplication

## Philosophy

Asena's error handling philosophy:

1. **Explicit over implicit**: Throw errors explicitly, handle them centrally
2. **Type-safe**: Use TypeScript classes for compile-time safety
3. **Adapter-agnostic**: Same patterns work across Ergenecore and Hono
4. **Production-ready**: Built-in support for logging and monitoring

---

## Basic Error Handling

### Throwing HTTP Exceptions

The simplest way to handle errors in Asena is to throw an `HttpException` (Ergenecore) or `HTTPException` (Hono).

#### Ergenecore Adapter
::: code-group

```typescript [Ergenecore]
import { Controller } from '@asenajs/asena/decorators';
import { Get } from '@asenajs/asena/decorators/http';
import { HttpException } from '@asenajs/ergenecore';
import type { Context } from '@asenajs/ergenecore';

@Controller('/users')
export class UserController {
  @Get('/:id')
  async getUser(context: Context) {
    const id = context.getParam('id');

    const user = await findUserById(id);

    if (!user) {
      // Throw HttpException with status code and message
      throw new HttpException(404, 'User not found');
    }

    return context.send(user);
  }
}
```


```typescript [Hono]
import { Controller } from '@asenajs/asena/decorators';
import { Get } from '@asenajs/asena/decorators/http';
import { HTTPException } from 'hono/http-exception';
import type { Context } from '@asenajs/hono-adapter';

@Controller('/users')
export class UserController {
  @Get('/:id')
  async getUser(context: Context) {
    const id = context.getParam('id');

    const user = await findUserById(id);

    if (!user) {
      // Throw HTTPException with status code and response
      const response = context.send({ error: 'User not found' }, 404);
      throw new HTTPException(404, { res: response as Response });
    }

    return context.send(user);
  }
}
```
:::
### HttpException API

The `HttpException` class accepts three parameters:

```typescript
new HttpException(status, body, options?)
```

| Parameter | Type | Required | Description |
|:----------|:-----|:---------|:------------|
| `status` | `HttpStatusCode \| number` | Yes | HTTP status code. The `ClientErrorStatusCode` / `ServerErrorStatusCode` enums are accepted. |
| `body` | `string \| object` | No (default `''`) | Response body. An object is serialized and gets `Content-Type: application/json` automatically. |
| `options` | `HttpExceptionInit` | No | Extends `ResponseInit` (headers, statusText) with `cause?: Error` for wrapping the original failure. |

**Examples:**

```typescript
// Simple string message
throw new HttpException(404, 'Not Found');

// JSON object response
throw new HttpException(400, {
  error: 'Invalid input',
  field: 'email'
});

// With custom headers
throw new HttpException(429, 'Too Many Requests', {
  headers: { 'Retry-After': '60' }
});

// With status text
throw new HttpException(503, 'Service Unavailable', {
  statusText: 'Maintenance Mode'
});
```

::: tip Your handler always gets first refusal
Both adapters turn the exception into a proper HTTP response without you catching it, and
both offer it to `onError` first:

1. `onError` is called. If it returns a `Response`, that is the answer.
2. If there is no handler, it returns nothing, or it throws, the exception answers itself
   from its own status and body. Anything that is not an `HttpException` becomes a 500.

So an ExceptionMapper that logs or enriches thrown exceptions works the same on both adapters.

Before 0.9.0 Ergenecore answered an `HttpException` straight from `getResponse()` and only
consulted `onError` for everything else, so the same ExceptionMapper worked on Hono and was
bypassed here. If you worked around that by throwing a plain domain error, you can now throw
`HttpException` directly.
:::

::: warning Match the exception with `isHttpException()`, not `instanceof`
A project that resolves two copies of an adapter - or two copies of `hono`, which is a peer
dependency - ends up with two distinct exception classes, and `instanceof` silently answers
false for one of them. Every deliberate 401/403/404 then collapses to your generic 500 branch
while the API keeps responding.

```typescript
import { isHttpException } from '@asenajs/asena/adapter';

public onError(error: Error, context: Context) {
  if (isHttpException(error)) {
    return context.send({ error: error.message }, error.status);
  }

  return context.send({ error: 'Internal Server Error' }, 500);
}
```
:::

---

## Global Error Handler

For production applications, you'll want centralized error handling to ensure consistent error responses and proper logging.

### Using onError() Hook

Both adapters support the `onError()` hook in your `ServerConfig` class.

#### Basic Global Error Handler

```typescript
import { Config } from '@asenajs/asena/decorators';
import { ConfigService, type Context } from '@asenajs/ergenecore';

@Config()
export class ServerConfig extends ConfigService {
  public onError(error: Error, context: Context): Response | Promise<Response> {
    // Log the error
    console.error('Error occurred:', error);

    // Return custom response
    return context.send({
      success: false,
      message: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
}
```

### Advanced: ExceptionMapper Pattern

For complex applications, use the **ExceptionMapper pattern** to handle different error types with dependency injection.

#### Step 1: Create ExceptionMapper

```typescript
// src/exceptions/ExceptionMapper.ts
import { Scope } from '@asenajs/asena/decorators/ioc';
import { Component } from '@asenajs/asena/decorators';
import type { Context } from '@asenajs/hono-adapter';
import { HTTPException } from 'hono/http-exception';
import { isValidationError } from '@asenajs/asena/adapter';
import { ClientErrorStatusCode, ServerErrorStatusCode } from '@asenajs/asena/web-types';

@Component({ name: 'ExceptionMapper', scope: Scope.SINGLETON })
export class ExceptionMapper {
  public map(error: Error, context: Context): Response | Promise<Response> {
    const requestPath = context.req.path;
    const requestMethod = context.req.method;

    // Handle request validation errors.
    // Checked BEFORE HTTPException on purpose: ValidationError extends HTTPException,
    // so the generic branch below would otherwise swallow it
    if (isValidationError(error)) {
      const errors = error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message
      }));

      return context.send({
        success: false,
        message: 'Validation error',
        errors
      }, ClientErrorStatusCode.BadRequest);
    }

    // Handle HTTPException (from Hono or middleware)
    if (error instanceof HTTPException) {
      console.warn(`HTTP Exception: ${error.message}`, {
        path: requestPath,
        method: requestMethod,
        status: error.status
      });

      return context.send(error.message, error.status);
    }

    // Handle custom domain errors
    if (error instanceof AuthError) {
      return context.send({
        success: false,
        message: 'Authentication failed'
      }, ClientErrorStatusCode.Unauthorized);
    }

    // Default error response for unexpected errors
    console.error(`Internal Server Error: ${error.message}`, {
      path: requestPath,
      method: requestMethod,
      stack: error.stack
    });

    return context.send({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, ServerErrorStatusCode.InternalServerError);
  }
}
```

#### Step 2: Register in ServerConfig

```typescript
// src/config/ServerConfig.ts
import { Inject } from '@asenajs/asena/decorators/ioc';
import { Config } from '@asenajs/asena/decorators';
import { ConfigService, type Context } from '@asenajs/hono-adapter';
import type { ExceptionMapper } from '../exceptions/ExceptionMapper';

@Config()
export class ServerConfig extends ConfigService {
  @Inject('ExceptionMapper')
  private mapper: ExceptionMapper;

  public onError(error: Error, context: Context): Response | Promise<Response> {
    return this.mapper.map(error, context);
  }
}
```

::: tip Production Pattern
The ExceptionMapper pattern is used in production applications for centralized error handling with IoC integration. It provides a single place to manage all error types.
:::

---

## Custom Error Classes

Create custom error classes for domain-specific errors in your application.

### Basic Custom Error

```typescript
// src/errors/AuthError.ts
export class AuthError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}
```

### Custom Error with Response

For more control, store a custom response in your error:

```typescript
// src/errors/AuthError.ts
export class AuthError extends Error {
  private _response?: Response | Promise<Response>;

  public constructor(message: string, response?: Response | Promise<Response>) {
    super(message);
    this.name = 'AuthError';
    this._response = response;
  }

  public get response(): Response | Promise<Response> | undefined {
    return this._response;
  }
}
```

### Using Custom Errors

#### In Controllers

```typescript
import { Controller } from '@asenajs/asena/decorators';
import { Post } from '@asenajs/asena/decorators/http';
import type { Context } from '@asenajs/hono-adapter';
import { AuthError } from '../errors/AuthError';

@Controller('/auth')
export class AuthController {
  @Post('/login')
  async login(context: Context) {
    const { username, password } = await context.getBody<{ username: string; password: string }>();

    const user = await validateCredentials(username, password);

    if (!user) {
      throw new AuthError('Invalid credentials');
    }

    return context.send({ token: generateToken(user) });
  }
}
```

#### In Middleware

```typescript
import { Middleware } from '@asenajs/asena/decorators';
import type { Context, MiddlewareService } from '@asenajs/hono-adapter';
import type { Next } from 'hono';
import { HTTPException } from 'hono/http-exception';

@Middleware()
export class AuthMiddleware implements MiddlewareService {
  public async handle(context: Context, next: Next): Promise<void> {
    const authHeader = context.req.header('authorization');

    if (!authHeader) {
      const response = context.send({
        error: 'Unauthorized',
        message: 'Missing Authorization header'
      }, 401);

      throw new HTTPException(401, { res: response as Response });
    }

    await next();
  }
}
```

### Mapping Custom Errors

Handle custom errors in your `ExceptionMapper`:

```typescript
public map(error: Error, context: Context): Response {
  // ... other error handlers

  // Handle AuthError
  if (error instanceof AuthError) {
    // Use custom response if provided
    if (error.response) {
      return error.response;
    }

    // Default auth error response
    return context.send({
      success: false,
      message: error.message
    }, 401);
  }

  // ... default handler
}
```

---

## Not Found

A request that matched no route is not an error - nothing threw, the router simply had nowhere
to send it. It has its own hook, so `onError` only ever sees something your code raised and
never has to ask which it is looking at.

```typescript
import type { NotFoundRequest } from '@asenajs/asena/adapter';

@Config()
export class AppConfig extends ConfigService {

  public onNotFound(context: Context, request: NotFoundRequest) {
    return context.send({
      type: 'about:blank',
      title: 'Not Found',
      status: 404,
      instance: request.path
    }, 404);
  }

  public onError(error: Error, context: Context) {
    // No 404 branch needed here
    return context.send({ error: 'Internal Server Error' }, 500);
  }

}
```

`request.path` is the path only - no origin, no query string - and `request.method` is the
upper-case verb. Both are normalised by the adapter, so the same handler body works on
Ergenecore and the Hono adapter alike.

With no `onNotFound` declared, **both** adapters answer:

```json
{ "error": "Not Found" }
```

with status `404` and `Content-Type: application/json`, and write one INFO line -
`Route not found:` with `{ path, method, status }`. A hook that answers the request itself
replaces both. See [Adapter logging](#adapter-logging).

::: info Not the same as a domain 404
`onNotFound` is about routing. When the route exists but the record does not, throw - that is a
real application decision and belongs in `onError`:

```typescript
const user = await this.db.findUser(id);

if (!user) {
  throw new HttpException(404, { code: 'USER_NOT_FOUND', id });
}
```
:::

::: warning Upgrading from 0.8
`NotFoundError`, `isNotFoundError` and the `NOT_FOUND_ERROR` brand are removed. An `onError`
that branched on `isNotFoundError()` should move that branch into `onNotFound`. On the Hono
adapter the default 404 body also changes from `text/plain` to the JSON envelope above.
:::

::: tip Static file 404s are separate
`StaticServeService.onNotFound` handles a file missing *inside* a `@StaticServe` route. It is
unrelated to the config hook, which only fires when no route matched at all.
:::

### Adapter logging

One rule, both adapters: **the framework's default log fires exactly when the framework's
default response fires.**

| | your hook answered | no hook, or it declined or threw |
|:--|:--|:--|
| response | yours | the framework's |
| log | none | `5xx` ERROR + stack · `4xx` DEBUG (INFO when the logger has no `debug`) · `404` INFO |

If your `onError` returns a `Response`, you own the response and therefore the record - log it
there, with your correlation id, and the adapter stays out of the way. If it returns nothing or
throws, the adapter is the one answering, so it writes the original error rather than letting it
disappear. Same for `onNotFound`.

The level split exists so a wall of 401s from a bot cannot flood the error stream: only `5xx`
carries a stack. An unmatched route logs `Route not found:` with `{ path, method, status }` at
INFO - low enough that a scanner walking `/wp-admin` and `/.env` cannot fill the warning stream,
high enough that a mistyped route in a deployed client is visible without turning on debug.

Pass `logErrors: false` (`createHonoAdapter` / `createErgenecoreAdapter`) to silence all of it,
including the 404 line. There is no setting that forces a log line for a request your own handler
answered.

::: warning Upgrading from ergenecore 1.5.x / hono-adapter 1.7.x
Those versions logged only when **no** `onError` was registered - which in a real application
meant never, since almost every application configures one. A 500 answered the client and wrote
nothing at all, stack included. You will now see error output you did not see before: whenever the
framework is the one answering. If your own handler answers and also logs, nothing is duplicated.
:::

## Validation Errors

### Request Validation Errors

A failed request validation reaches your error handler like any other error, so it can
share the same response envelope as the rest of your API.

Match it with `isValidationError()` rather than `instanceof ZodError`: the framework wraps
the failure in an adapter-specific `ValidationError` that carries HTTP status 400, and the
guard works with both adapters.

```typescript
import { isValidationError } from '@asenajs/asena/adapter';

public map(error: Error, context: Context): Response {
  if (isValidationError(error)) {
    // error.issues is adapter-agnostic: { path, message, code }
    const errors = error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
      code: issue.code
    }));

    return context.send({
      success: false,
      message: 'Validation failed',
      errors
    }, 400);
  }

  // ... other handlers
}
```

::: tip Reaching the original ZodError
`error.cause` holds the underlying `ZodError` if you need something `issues` does not
carry - `z.treeifyError(error.cause)`, for instance. Note that Zod 4 removed
`ZodError.errors`; the field is now `issues`.
:::

::: info When no handler answers it
A `ValidationError` is always thrown, whether or not you declare `onError`. If nothing answers it -
no handler, or a handler that returns nothing - both adapters fall back to the same envelope:

```json
{
  "error": "Validation failed",
  "details": { "formErrors": [], "fieldErrors": { "email": ["..."] } },
  "target": "json"
}
```

`target` is which part of the request failed: `json`, `query`, `param`, `form` or `header`. The
failure is logged like any other 4xx. See
[Validation](/docs/concepts/validation#validation-error-responses).
:::

### Custom Validation Error Response

```typescript
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format",
      "code": "invalid_string"
    },
    {
      "field": "password",
      "message": "String must contain at least 8 character(s)",
      "code": "too_small"
    }
  ]
}
```


## Best Practices

### 1. Consistent Error Response Format

Always return errors in a consistent format:

```typescript
{
  "success": false,
  "message": "Human-readable error message",
  "error": "ERROR_CODE",
  "details": { /* optional additional context */ },
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

### 2. Security Considerations

::: danger Never Leak Sensitive Information
- **Don't expose stack traces** in production
- **Don't return internal error messages** to clients
- **Don't include database queries** or system paths
- **Do sanitize error messages** before sending to clients
:::

**Bad:**
```typescript
return context.send({
  error: error.stack,  // ❌ Exposes internal details
  query: sql           // ❌ Exposes database structure
}, 500);
```

**Good:**
```typescript
return context.send({
  success: false,
  message: 'An error occurred. Please try again later.',
  ...(process.env.NODE_ENV === 'development' && { debug: error.message })
}, 500);
```

### 3. Use Specific Status Codes

Choose the right HTTP status code for each error:

| Status Code | When to Use |
|:------------|:------------|
| `400` | Bad Request - Invalid input data |
| `401` | Unauthorized - Authentication required |
| `403` | Forbidden - User doesn't have permission |
| `404` | Not Found - Resource doesn't exist |
| `409` | Conflict - Resource already exists |
| `422` | Unprocessable Entity - Validation failed |
| `429` | Too Many Requests - Rate limit exceeded |
| `500` | Internal Server Error - Unexpected server error |
| `503` | Service Unavailable - Temporary downtime |

### 4. Error Boundaries

Create error boundaries at different levels:

```typescript
// Application-level (ServerConfig)
public onError(error: Error, context: Context): Response {
  return this.mapper.map(error, context);
}

// Route-level (Controller)
@Get('/:id')
async getUser(context: Context) {
  try {
    // Risky operation
    return await this.userService.getUser(id);
  } catch (error) {
    // Handle specific errors
    if (error instanceof DatabaseError) {
      throw new HttpException(503, 'Database temporarily unavailable');
    }
    throw error; // Let global handler deal with it
  }
}

// Service-level (Business Logic)
async getUser(id: string) {
  if (!id) {
    throw new ValidationError('User ID is required');
  }

  const user = await this.db.findUser(id);

  if (!user) {
    throw new HttpException(404, { code: 'USER_NOT_FOUND', id });
  }

  return user;
}
```

### 5. Graceful Degradation

Handle errors gracefully without crashing the application:

```typescript
@Get('/dashboard')
async getDashboard(context: Context) {
  try {
    const [users, posts, stats] = await Promise.allSettled([
      this.userService.getUsers(),
      this.postService.getPosts(),
      this.statsService.getStats()
    ]);

    return context.send({
      users: users.status === 'fulfilled' ? users.value : [],
      posts: posts.status === 'fulfilled' ? posts.value : [],
      stats: stats.status === 'fulfilled' ? stats.value : null,
      warnings: [
        users.status === 'rejected' && 'Failed to load users',
        posts.status === 'rejected' && 'Failed to load posts',
        stats.status === 'rejected' && 'Failed to load stats'
      ].filter(Boolean)
    });
  } catch (error) {
    throw new HttpException(500, 'Dashboard unavailable');
  }
}
```

### 6. Error Context

Always include request context in error logs:

```typescript
logger.error('Payment processing failed', {
  userId: user.id,
  orderId: order.id,
  amount: order.total,
  path: context.req.path,
  method: context.req.method,
  userAgent: context.req.header('user-agent'),
  timestamp: new Date().toISOString()
});
```

---

## Common Patterns

### Pattern 1: Try-Catch in Controllers

```typescript
@Post('/charge')
async processPayment(context: Context) {
  try {
    const { amount, token } = await context.getBody<{ amount: number; token: string }>();

    const charge = await this.paymentService.charge(amount, token);

    return context.send({ success: true, charge });
  } catch (error) {
    if (error instanceof PaymentError) {
      throw new HttpException(402, {
        error: 'Payment failed',
        reason: error.reason
      });
    }

    throw error; // Let global handler deal with unexpected errors
  }
}
```

### Pattern 2: Early Returns

```typescript
@Get('/:id')
async getUser(context: Context) {
  const id = context.getParam('id');

  if (!id) {
    throw new HttpException(400, 'User ID is required');
  }

  if (!isValidUUID(id)) {
    throw new HttpException(400, 'Invalid user ID format');
  }

  const user = await this.userService.getUser(id);

  if (!user) {
    throw new HttpException(404, 'User not found');
  }

  return context.send(user);
}
```

### Pattern 3: Error Enrichment

```typescript
public map(error: Error, context: Context): Response {
  // Enrich error with request context
  const enrichedError = {
    ...error,
    requestId: context.getValue('requestId'),
    userId: context.getValue('user')?.id,
    path: context.req.path,
    method: context.req.method
  };

  // Send to monitoring service
  monitoringService.captureException(enrichedError);

  // Return safe response to client
  return context.send({
    success: false,
    message: error.message,
    requestId: enrichedError.requestId
  }, 500);
}
```

---

## Related

- [Middleware](/docs/concepts/middleware) - Error handling in middleware
- [Validation](/docs/concepts/validation) - Handling validation errors
- [Logger Package](/docs/packages/logger) - Structured logging with AsenaLogger
- [Context API](/docs/concepts/context) - Understanding request context
