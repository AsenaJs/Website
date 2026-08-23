---
title: Error Handling
description: Comprehensive guide to error handling in Asena - throwing exceptions, global error handlers, custom errors, and best practices
outline: deep
---

# Error Handling

Error handling is a critical part of building robust web applications. Asena provides a powerful and flexible error handling system that works seamlessly with both Ergenecore and Hono adapters.

<div class="card-grid">
  <a class="info-card" href="#philosophy">
    <span class="ic-kicker">01</span>
    <div class="ic-title">Philosophy</div>
    <p class="ic-desc">The model Asena's error handling is built on.</p>
  </a>
  <a class="info-card" href="#basic-error-handling">
    <span class="ic-kicker">02</span>
    <div class="ic-title">Basics</div>
    <p class="ic-desc">Throwing and answering from a route handler.</p>
  </a>
  <a class="info-card" href="#global-error-handler">
    <span class="ic-kicker">03</span>
    <div class="ic-title">Global Handler</div>
    <p class="ic-desc">One place to catch everything that escapes.</p>
  </a>
  <a class="info-card" href="#custom-error-classes">
    <span class="ic-kicker">04</span>
    <div class="ic-title">Custom Errors</div>
    <p class="ic-desc">Your own exception types on top of HttpException.</p>
  </a>
  <a class="info-card" href="#not-found">
    <span class="ic-kicker">05</span>
    <div class="ic-title">Not Found</div>
    <p class="ic-desc">Handling routes that never matched.</p>
  </a>
  <a class="info-card" href="#validation-errors">
    <span class="ic-kicker">06</span>
    <div class="ic-title">Validation Errors</div>
    <p class="ic-desc">Shaping the 400 responses Zod produces.</p>
  </a>
</div>

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

Throw an `HttpException`. It comes from `@asenajs/asena/adapter` — the framework core, not an
adapter — so the same import and the same throw work unchanged on Ergenecore and Hono:

```typescript
import { Controller } from '@asenajs/asena/decorators';
import { Get } from '@asenajs/asena/decorators/http';
import { HttpException } from '@asenajs/asena/adapter';
import type { Context } from '@asenajs/ergenecore'; // or '@asenajs/hono-adapter'

@Controller('/users')
export class UserController {
  @Get('/:id')
  async getUser(context: Context) {
    const id = context.getParam('id');

    const user = await findUserById(id);

    if (!user) {
      throw new HttpException(404, { error: 'User not found' });
    }

    return context.send(user);
  }
}
```

Only the `Context` type is adapter-specific. Everything else — the class, the constructor, the
response it produces — is identical, so moving an application between adapters does not mean
rewriting its error handling.

::: tip Upgrading from 0.9
`HttpException` used to be declared by each adapter. Ergenecore exported its own class; the Hono
adapter re-exported `HTTPException` from `hono/http-exception`, which takes
`(status, { message })` rather than `(status, body)`. There is now one class, in core.

`import { HttpException } from '@asenajs/ergenecore'` still works and is the *same class object*,
so nothing breaks — but prefer `@asenajs/asena/adapter` in new code. On the Hono adapter this is
the only import path: `@asenajs/hono-adapter` deliberately does not re-export it, because
`HttpException` and `HTTPException` sitting side by side in one package differ by the case of two
letters and autocomplete cannot tell which you meant.
:::

::: info Hono's `HTTPException` keeps working
`@asenajs/hono-adapter` still exports `HTTPException`, and hono packages that throw it —
`hono/basic-auth`, `hono/bearer-auth`, `hono/jwt`, hono's own validator — are unaffected by the
move. Both classes are recognised by `isHttpException()` and both are answered from their own
status, so your handler does not have to know which one it is holding.

**Import it from `@asenajs/hono-adapter`, never from `hono/http-exception`.** This is not a style
preference. If a project ever resolves *two* copies of `hono`, `HTTPException` from the other copy
is a different class — `isHttpException()` does not recognise it, and every deliberate `401`/`403`
thrown from it becomes a `500`, silently, with the API still responding. The brand cannot close
that: it is installed on the prototype of the copy the adapter resolved and cannot reach another
copy's class.

Since **3.0.0 `hono` is a peer dependency**, so the adapter no longer has a resolution slot of its
own and a project normally resolves exactly one copy. That is the real fix; importing from the
adapter is the guarantee on top of it. Before 3.0.0 this happened in a real application, triggered
by nothing more than a patch bump of `hono` in its own `package.json`.

`HttpException` from `@asenajs/asena/adapter` sidesteps the question entirely — it brands each
*instance*, so it is recognised no matter which copy of the framework constructed it. Another
reason to prefer it for your own throws.

If you suspect a duplicate, `bun pm ls --all | grep hono` shows a nested
`@asenajs/hono-adapter/node_modules/hono` when there is one, and the adapter writes a startup
warning if it finds itself resolving one. Note that removing the duplicate from the lockfile is not
enough — the stale `node_modules` directory has to go too, so upgrade with
`rm -rf node_modules bun.lock && bun install`.
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

::: warning `message` is the body as a *string* — do not re-wrap it
`body` is what the caller receives. `message` is the same thing flattened to a string, which for
an object body is the **serialized JSON**:

```typescript
const error = new HttpException(404, { error: 'User not found' });

error.message              // '{"error":"User not found"}'   <- a string, not an object
error.getResponse()        // 404, body {"error":"User not found"}
```

So an `onError` that answers `context.send({ error: error.message }, error.status)` double-encodes
an object body into `{"error":"{\"error\":\"User not found\"}"}`. Pick one of two styles and stay
with it:

- **The exception owns the body** — throw whatever shape you want and let your handler answer with
  `error.getResponse()`. Works for hono's `HTTPException` too, which has no `body` at all.
- **The handler owns the body** — throw a **string** and let `onError` build the envelope from
  `error.message` and `error.status`. Use this when every error in your API must share one shape.

The examples below use the first. `error.body` is only on `HttpException` itself, not on the
`isHttpException()` contract, so a handler that reads it is assuming it threw the exception itself.
:::

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

::: info The log follows the response
When the framework answers — no handler, or one that declined or threw — it also writes the line,
at a level derived from *the status the caller actually received*. A 4xx is logged as a rejected
request without a stack; a 5xx is logged as an application error with one. See
[Adapter logging](#adapter-logging).
:::

::: warning Match the exception with `isHttpException()`, not `instanceof`
There are two reasons, and on the Hono adapter both apply at once.

**Two classes.** Anything hono's ecosystem raises is an `HTTPException`, not an `HttpException`.
`instanceof HttpException` answers false for every 401 from `hono/bearer-auth`, and
`instanceof HTTPException` answers false for everything your own code throws. `isHttpException()`
matches both, which is the whole reason it exists.

**Two copies.** A project that resolves two copies of `@asenajs/asena` — or of `hono` — ends up
with two distinct exception classes, and `instanceof` silently answers false for one of them.
Every deliberate 401/403/404 then collapses to your generic 500 branch while the API keeps
responding, so nothing looks broken until someone reads the status codes.

```typescript
import { isHttpException } from '@asenajs/asena/adapter';

public onError(error: Error, context: Context) {
  if (isHttpException(error)) {
    // Let the exception answer with the body it carries. `error.message` would be that body
    // flattened to a string - re-wrapping it double-encodes an object body
    return error.getResponse?.() ?? context.send({ error: error.message }, error.status);
  }

  return context.send({ error: 'Internal Server Error' }, 500);
}
```

The guard narrows to `status`, an optional `getResponse()` and the usual `Error` members. It
deliberately does **not** guarantee `body` — a branded exception from another package may not
carry one — so reach for `error.body` only after you have an `HttpException` you know you threw
yourself. `getResponse` is optional for the same reason, hence the `?.` and the fallback.
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
import { isHttpException, isValidationError } from '@asenajs/asena/adapter';
import { ClientErrorStatusCode, ServerErrorStatusCode } from '@asenajs/asena/web-types';

@Component({ name: 'ExceptionMapper', scope: Scope.SINGLETON })
export class ExceptionMapper {
  public map(error: Error, context: Context): Response | Promise<Response> {
    const requestPath = context.req.path;
    const requestMethod = context.req.method;

    // Handle request validation errors.
    // Checked BEFORE the HTTP exception branch on purpose: a ValidationError *is* an HTTP
    // exception (status 400), so the generic branch below would otherwise swallow it
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

    // Handle every deliberate HTTP status: your own HttpException, and anything a
    // hono middleware raised. One branch covers both - see the warning above on why
    // this is not an `instanceof` check
    if (isHttpException(error)) {
      console.warn(`HTTP Exception: ${error.message}`, {
        path: requestPath,
        method: requestMethod,
        status: error.status
      });

      // The exception carries its own body - answer with it rather than re-wrapping
      // `error.message`, which is that body already flattened to a string
      return error.getResponse?.() ?? context.send({ error: error.message }, error.status);
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
import { HttpException } from '@asenajs/asena/adapter';

@Middleware()
export class AuthMiddleware implements MiddlewareService {
  public async handle(context: Context, next: Next): Promise<void> {
    const authHeader = context.req.header('authorization');

    if (!authHeader) {
      throw new HttpException(401, {
        error: 'Unauthorized',
        message: 'Missing Authorization header'
      });
    }

    await next();
  }
}
```

The throw is the same on Ergenecore — only the `Context` and `MiddlewareService` imports change.

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
    // `ValidationError` is the framework's own type for a failed *request* validation and
    // takes a ZodError - it is not a general-purpose error to construct by hand
    throw new HttpException(400, { code: 'USER_ID_REQUIRED' });
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

## Related

- [Configuration](/docs/guides/configuration) - Registering the global `onError` handler
- [Middleware](/docs/concepts/middleware) - Error handling in middleware
- [Validation](/docs/concepts/validation) - Handling validation errors
- [Context API](/docs/concepts/context) - Understanding request context
- [Logger Package](/docs/packages/logger) - Structured logging with AsenaLogger
