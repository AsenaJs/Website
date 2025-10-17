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
import { Controller } from '@asenajs/asena/server';
import { Get } from '@asenajs/asena/web';
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
import { Controller } from '@asenajs/asena/server';
import { Get } from '@asenajs/asena/web';
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

| Parameter | Type | Description |
|:----------|:-----|:------------|
| `status` | `number` | HTTP status code (e.g., 400, 401, 404, 500) |
| `body` | `string \| object` | Response body (string or JSON object) |
| `options` | `ResponseInit` | Optional response options (headers, statusText) |

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

::: tip Automatic Detection
Both adapters automatically detect `HttpException`/`HTTPException` and convert them to proper HTTP responses. You don't need to catch them manually in your handlers.
:::

---

## Global Error Handler

For production applications, you'll want centralized error handling to ensure consistent error responses and proper logging.

### Using onError() Hook

Both adapters support the `onError()` hook in your `ServerConfig` class.

#### Basic Global Error Handler

```typescript
import { Config } from '@asenajs/asena/server';
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
import { Scope } from '@asenajs/asena/ioc';
import { Component } from '@asenajs/asena/server';
import type { Context } from '@asenajs/hono-adapter';
import { HTTPException } from 'hono/http-exception';
import { ZodError } from 'zod';
import { ClientErrorStatusCode, ServerErrorStatusCode } from '@asenajs/asena/web-types';

@Component({ name: 'ExceptionMapper', scope: Scope.SINGLETON })
export class ExceptionMapper {
  public map(error: Error, context: Context): Response | Promise<Response> {
    const requestPath = context.req.path;
    const requestMethod = context.req.method;

    // Handle HTTPException (from Hono or middleware)
    if (error instanceof HTTPException) {
      console.warn(`HTTP Exception: ${error.message}`, {
        path: requestPath,
        method: requestMethod,
        status: error.status
      });

      return context.send(error.message, error.status);
    }

    // Handle Zod validation errors
    if (error instanceof ZodError) {
      const errors = error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message
      }));

      return context.send({
        success: false,
        message: 'Validation error',
        errors
      }, ClientErrorStatusCode.BadRequest);
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
import { Inject } from '@asenajs/asena/ioc';
import { Config } from '@asenajs/asena/server';
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
import { Controller } from '@asenajs/asena/server';
import { Post } from '@asenajs/asena/web';
import type { Context } from '@asenajs/hono-adapter';
import { AuthError } from '../errors/AuthError';

@Controller('/auth')
export class AuthController {
  @Post('/login')
  async login(context: Context) {
    const { username, password } = await context.getBody();

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
import { Middleware } from '@asenajs/asena/server';
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

## Validation Errors

### Zod Validation Errors

When using Zod for validation, validation errors are automatically caught by the adapter. You can customize the response in your error handler.

```typescript
import { ZodError } from 'zod';

public map(error: Error, context: Context): Response {
  if (error instanceof ZodError) {
    // Transform Zod errors to user-friendly format
    const errors = error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code
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
    throw new NotFoundError('User not found');
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
    const { amount, token } = await context.getBody();

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

- [Middleware](/concepts/middleware) - Error handling in middleware
- [Validation](/guides/validation) - Handling validation errors
- [Logger Package](/packages/logger) - Structured logging with AsenaLogger
- [Context API](/concepts/context) - Understanding request context
