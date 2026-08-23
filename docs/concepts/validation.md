---
title: Validation
description: Type-safe request validation with Zod integration in Asena
outline: deep
---

# Validation

Asena provides built-in validation support using [Zod](https://zod.dev). Validation ensures that incoming request data meets your requirements before reaching your route handlers.

<div class="card-grid">
  <a class="info-card" href="#quick-start">
    <span class="ic-kicker">01</span>
    <div class="ic-title">Quick Start</div>
    <p class="ic-desc">A validator class wired to a route.</p>
  </a>
  <a class="info-card" href="#what-getbody-returns">
    <span class="ic-kicker">02</span>
    <div class="ic-title">What getBody() Returns</div>
    <p class="ic-desc">The schema's output, not the raw client JSON.</p>
  </a>
  <a class="info-card" href="#validationservice-api">
    <span class="ic-kicker">03</span>
    <div class="ic-title">ValidationService API</div>
    <p class="ic-desc"><code>json()</code>, <code>query()</code>, <code>param()</code> and header validation.</p>
  </a>
  <a class="info-card" href="#validation-hooks">
    <span class="ic-kicker">04</span>
    <div class="ic-title">Validation Hooks</div>
    <p class="ic-desc">Custom logic that runs after validation.</p>
  </a>
  <a class="info-card" href="#validation-error-responses">
    <span class="ic-kicker">05</span>
    <div class="ic-title">Error Responses</div>
    <p class="ic-desc">The 400 Bad Request shape Asena returns.</p>
  </a>
  <a class="info-card" href="#zod-schema-definition">
    <span class="ic-kicker">06</span>
    <div class="ic-title">Zod Schemas</div>
    <p class="ic-desc">Defining the schemas the validators return.</p>
  </a>
</div>

::: info Adapter Support
Both the **Ergenecore** and the **Hono** adapter ship validation. Each exports its own `ValidationService` and `ValidationSchemaWithHook`, so import them from the adapter you use.

One behavioural difference remains: Ergenecore runs the `hook` **only when validation fails**, while the Hono adapter runs it on **every** validation attempt. Write hooks that check `result.success` and they behave the same on both.
:::

## Installation

Zod is a **peer dependency** of both adapters — they define the validation contract, they do not
ship the library, so your project owns the version:

```bash
bun add zod
```

**Zod v4 or higher is required.** Both adapters call `flattenError` to build the validation-failure
envelope, and that is a top-level export introduced in Zod 4.

::: tip You may already have it
`asena create` installs zod for you, and `asena generate validator` writes `import { z } from 'zod'`
into the file it scaffolds. If you set the project up by hand, add it — before 3.0.0 the import
resolved by hoisting out of the adapter's own dependencies, which was never something to rely on.
:::

## Why Use Validation?

- **Type Safety**: Catch type mismatches at runtime
- **Security**: Prevent malicious or malformed input
- **Better Error Messages**: Provide clear validation feedback
- **Self-Documentation**: Schema serves as API documentation
- **Automatic Error Handling**: 400 Bad Request responses automatically

## Quick Start

### 1. Create a Validator

Extend `ValidationService` and implement the `json()` method:

```typescript
import { Middleware } from '@asenajs/asena/decorators';
import { ValidationService } from '@asenajs/ergenecore';
import { z } from 'zod';

@Middleware({ validator: true })
export class CreateUserValidator extends ValidationService {
  json() {
    return z.object({
      name: z.string().min(3).max(50),
      email: z.string().email(),
      age: z.number().min(18).max(120)
    });
  }
}
```

### 2. Apply to a Route

Use the `validator` option in route decorators:

```typescript
import { Controller } from '@asenajs/asena/decorators';
import { Post } from '@asenajs/asena/decorators/http';
import type { Context } from '@asenajs/ergenecore';

@Controller('/users')
export class UserController {
  @Post({ path: '/', validator: CreateUserValidator })
  async create(context: Context) {
    const body = await context.getBody();
    // body is the schema's parsed output, not the raw payload

    return context.send({ created: true, user: body }, 201);
  }
}
```

::: tip Validation Happens Automatically
The validator runs **before** your route handler. If validation fails, the handler is never called.
:::

## What `getBody()` returns

When a route declares a `json` validator, `context.getBody()` returns the **schema's output** - the
value Zod produced, not the JSON the client sent. That means unknown keys are gone, `default()`s are
filled in, and `coerce` has been applied:

```typescript
json() {
  return z.object({ voteLock: z.boolean() });
}
```

```json
{ "voteLock": true, "ownerId": "<attacker-id>", "password": "plaintext" }
```

```typescript
await context.getBody(); // { voteLock: true }
```

This matters because `z.object()` **ignores** unknown keys rather than rejecting them. Before this
behaviour existed, `getBody()` re-read the raw body and the two extra keys arrived at the handler
intact, so the common shape

```typescript
await this.repository.updateById(id, await context.getBody());
```

was a mass-assignment sink on every validated route - with a schema sitting right next to it that
looked like it prevented exactly that.

::: warning Body only
Only the body is swapped for its validated form. `query`, `param` and `header` schemas still run,
and still reject bad input, but `getQuery()`, `getParam()` and `headers` return the raw request
values - a `z.coerce.number()` on a query parameter validates, then hands you the string. Convert
explicitly in the handler for those targets.

Requires hono-adapter 3.1+ / ergenecore 3.1+. On earlier versions `getBody()` returns the raw body
on every route, whatever the schema says.
:::

## ValidationService API

### The `json()` Method

The `json()` method defines the validation schema for request bodies:

```typescript
@Middleware({ validator: true })
export class MyValidator extends ValidationService {
  json() {
    // Return a Zod schema
    return z.object({
      // Your validation rules
    });
  }
}
```

**Method Signature:**
```typescript
json(): ValidationSchema | Promise<ValidationSchema>
```

- **Return Type**: A Zod schema (`z.ZodType`)
- **Async Support**: Can be `async` for dynamic schemas

### Validating other request parts

`json()` is the most common, but a validator can define any of these - each takes the same
shape (a Zod schema, or `{ schema, hook }`) and validates a different part of the request:

| Method | Validates | Runtime |
|:-------|:----------|:--------|
| `json()` | JSON request body | ✅ |
| `form()` | `multipart/form-data` / URL-encoded body | ✅ |
| `query()` | Query string | ✅ |
| `param()` | Route parameters | ✅ |
| `header()` | Request headers | ✅ |
| `response()` | Response shape, **by status code** | ❌ documentation only |

```typescript
@Middleware({ validator: true })
export class ListUsersValidator extends ValidationService {
  public query() {
    return z.object({
      page: z.string().transform(Number).pipe(z.number().min(1)),
    });
  }

  public param() {
    return z.object({ id: z.string().uuid() });
  }
}
```

::: warning `response()` is never executed
It exists so [`@asenajs/asena-openapi`](/docs/packages/openapi) can emit response schemas
into the spec; the runtime ignores it.

A consequence worth knowing: `@Middleware({ validator: true })` requires at least one of
the five *runtime* methods. A validator class that defines **only** `response()` fails the
decorator's check at import time and the process exits.
:::

### Basic Example

```typescript
@Middleware({ validator: true })
export class ProductValidator extends ValidationService {
  json() {
    return z.object({
      name: z.string(),
      price: z.number().positive(),
      category: z.enum(['electronics', 'clothing', 'food']),
      inStock: z.boolean()
    });
  }
}
```

### Async Validation

For database lookups or async checks:

```typescript
@Middleware({ validator: true })
export class UniqueEmailValidator extends ValidationService {
  @Inject(UserRepository)
  private userRepo: UserRepository;

  async json() {
    return z.object({
      email: z.string().email().refine(async (email) => {
        const exists = await this.userRepo.findByEmail(email);
        return !exists;
      }, 'Email already exists')
    });
  }
}
```

## Validation Hooks

Use `ValidationSchemaWithHook` to execute custom logic after validation:
::: code-group
```typescript [ergenecore]
import { type ValidationSchemaWithHook, ValidationService } from '@asenajs/ergenecore';

@Middleware({ validator: true })
export class UserValidatorWithHook extends ValidationService {
  json(): ValidationSchemaWithHook {
    return {
      schema: z.object({
        email: z.string().email(),
        password: z.string().min(8)
      }),

      hook: (result, context) => {
        // result: Zod SafeParseResult - { success, data } or { success, error }
        // context: Asena's Context wrapper

        if (!result.success) {
          // Return nothing to let the framework report the failure through onError
          return;
        }

        console.log('Validated user data:', result.data);

        // Store in context for later use
        context.setValue('validatedEmail', result.data.email);
      }
    };
  }
}
```

```typescript [hono]
import { type ValidationSchemaWithHook, ValidationService } from '@asenajs/hono-adapter';

@Middleware({ validator: true })
export class UserValidatorWithHook extends ValidationService {
  json(): ValidationSchemaWithHook {
    return {
      schema: z.object({
        email: z.string().email(),
        password: z.string().min(8)
      }),

      hook: (result, context) => {
        // result: Zod SafeParseResult - { success, data } or { success, error }
        // context: Hono's NATIVE context, not Asena's wrapper - see the warning below

        if (!result.success) {
          // Return nothing to let the framework report the failure through onError
          return;
        }

        console.log('Validated user data:', result.data);

        // Hono's own state API - set()/get(), not setValue()/getValue()
        context.set('validatedEmail', result.data.email);
      }
    };
  }
}
```
:::

::: warning The hook's `context` differs per adapter
This is the one place where the two adapters are not interchangeable.

- **Ergenecore** passes Asena's `Context` wrapper, so `setValue()` / `getValue()` /
  `send()` are available.
- **Hono** types the hook as `@hono/zod-validator`'s `Hook`, which hands you **Hono's
  native context**. Use `set()` / `get()` to store state and `json()` to respond.

The values you store are still readable from the handler's Asena context - `setValue`
and Hono's `set` write to the same per-request store.
:::
### Hook Function Signature

```typescript
hook: (
  result: z.ZodSafeParseResult<T>,
  context: Context
) => Response | void | Promise<Response | void>
```

| Parameter | Type | Description |
|:----------|:-----|:------------|
| `result` | `z.ZodSafeParseResult<T>` | Zod's safe-parse result: `{ success: true, data }` or `{ success: false, error }` |
| `context` | `Context` | The adapter's Context object |
| **Returns** | `Response \| void` | Return a `Response` to answer the request yourself; return nothing to continue |

::: warning The hook receives the parse result, not the parsed data
`result` is **not** the validated object - the data lives at `result.data`, and only when
`result.success` is `true`. Always branch on `result.success` first.

The return value is **not** a way to transform the payload. Returning a plain object does
nothing; only a `Response` is honoured, and it short-circuits the request.
:::

### Hook Use Cases

**1. Logging and Monitoring**

```typescript
hook: (result, context) => {
  console.log('Validation attempted:', {
    endpoint: context.req.url,
    ok: result.success
  });
}
```

Returning nothing leaves the error contract untouched - a failure is still reported the
normal way.

**2. Storing Validated Data in Context**

```typescript
hook: (result, context) => {
  if (!result.success) return;

  // Make validated data available to middlewares/handlers
  context.setValue('validatedUser', result.data);
  context.setValue('userEmail', result.data.email);
}
```

**3. Answering the Request Yourself**

```typescript
hook: (result, context) => {
  if (result.success) return;

  // A Response short-circuits everything - the handler never runs and
  // onError is never called for this request
  return context.send({ error: 'Invalid signup payload' }, 422);
}
```

**4. Side Effects**

```typescript
hook: async (result, context) => {
  if (!result.success) return;

  // Send notification, update cache, etc.
  await this.notificationService.sendAlert('New signup', result.data.email);
}
```

## Validation Error Responses

When validation fails, Asena answers with **400 Bad Request**.

### Default response

A `ValidationError` is always thrown. When nothing answers it - your application defines no
global error handler, or its handler returns nothing - **both** adapters fall back to the same
envelope, Zod's flattened error:

```json
{
  "error": "Validation failed",
  "details": {
    "formErrors": [],
    "fieldErrors": {
      "email": ["Invalid email"],
      "age": ["Must be at least 18"]
    }
  },
  "target": "json"
}
```

`target` names the part of the request that failed - `json`, `query`, `form`, `param` or
`header`.

The failure is also logged like any other 4xx, at DEBUG (or INFO when your logger has no
`debug`). Before 0.9.1 an application with no `onError` got this response from inside the
validator, which never threw - so it reached neither `onError` nor the log, the one rejection
that was invisible at every level. See
[Error Handling](/docs/guides/error-handling#adapter-logging).

### Customizing the response

Define `onError` in your `@Config` class and validation failures arrive there like any
other error, so they can share your application's response envelope:

```typescript
import { Config } from '@asenajs/asena/decorators';
import { isValidationError } from '@asenajs/asena/adapter';
import { ConfigService, type Context } from '@asenajs/hono-adapter';

@Config()
export class ServerConfig extends ConfigService {
  public onError(error: Error, context: Context): Response {
    if (isValidationError(error)) {
      return context.send(
        {
          success: false,
          message: 'Validation failed',
          errors: error.issues // [{ path, message, code }]
        },
        400
      );
    }

    return context.send({ success: false, message: 'Internal Server Error' }, 500);
  }
}
```

`isValidationError()` is exported from `@asenajs/asena/adapter` and works with both
adapters. The error it narrows to also carries `target` and `cause` (the original
`ZodError`) if you need more than `issues`.

::: tip Existing error handlers keep working
The thrown error is an HTTP exception carrying status **400**, so a handler that matches with
`isHttpException()` and replies with `error.status` keeps answering 400 - adopting this does not
silently turn validation failures into 500s.

Check `isValidationError()` **first** if you want validation failures to have their own envelope.
A `ValidationError` is an HTTP exception too, so a generic `isHttpException()` branch placed
above it would swallow it.

The class each adapter extends is an implementation detail and they differ - Ergenecore's extends
`HttpException`, the Hono adapter's extends hono's `HTTPException` so that pre-0.9 handlers
written against `instanceof HTTPException` keep answering 400. Match with the guards and you do
not have to know which.
:::

::: warning A hook that returns a Response wins
If the validator's `hook` returns a `Response`, that response is sent as-is and `onError`
is never reached for that request. See [Validation Hooks](#validation-hooks).
:::

## Integration with Controllers

### Route-Level Validation

```typescript
@Controller('/products')
export class ProductController {
  @Post({ path: '/', validator: CreateProductValidator })
  async create(context: Context) {
    // Body is already validated
    const product = await context.getBody();
    return context.send(product, 201);
  }

  @Put({ path: '/:id', validator: UpdateProductValidator })
  async update(context: Context) {
    const id = context.getParam('id');
    const updates = await context.getBody();
    return context.send({ updated: true });
  }
}
```

### Combining with Middleware

```typescript
@Post({
  path: '/',
  middlewares: [AuthMiddleware, RateLimitMiddleware],
  validator: CreateUserValidator
})
async create(context: Context) {
  // Ergenecore: AuthMiddleware -> RateLimitMiddleware -> CreateUserValidator -> handler
  // Hono:       CreateUserValidator -> AuthMiddleware -> RateLimitMiddleware -> handler
}
```

::: danger Validators and route middleware run in a different order per adapter
Ergenecore validates **after** the route's middleware chain; Hono registers validators
**before** route middleware, so validation happens first.

This matters when a middleware populates state the validator depends on - an
`AuthMiddleware` that calls `context.setValue('user', …)` has not run yet on Hono. Global
middleware is unaffected: it is top-level on both adapters and always runs first.
:::

## Zod Schema Definition

Asena uses [Zod](https://zod.dev) for schema definition. The `json()` method returns a Zod schema:

```typescript
json() {
  return z.object({
    name: z.string(),
    email: z.string().email(),
    age: z.number().int().positive()
  });
}
```

### Reusable Schemas

You can extract and reuse common schemas across multiple validators:

```typescript
// src/validators/schemas/common.ts
import { z } from 'zod';

// Reusable schema definitions
export const emailSchema = z.string().email().toLowerCase();
export const passwordSchema = z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/);

export const addressSchema = z.object({
  street: z.string().min(1),
  city: z.string().min(1),
  zipCode: z.string().regex(/^\d{5}$/),
  country: z.string().length(2)
});

export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().min(1).max(100).default(10)
});
```

Then use them in your validators:

```typescript
import { Middleware } from '@asenajs/asena/decorators';
import { ValidationService } from '@asenajs/ergenecore';
import { emailSchema, passwordSchema, addressSchema } from '../schemas/common';
import { z } from 'zod';

@Middleware({ validator: true })
export class CreateUserValidator extends ValidationService {
  json() {
    return z.object({
      email: emailSchema,           // Reuse common schema
      password: passwordSchema,      // Reuse common schema
      shippingAddress: addressSchema // Reuse common schema
    });
  }
}

@Middleware({ validator: true })
export class UpdateUserValidator extends ValidationService {
  json() {
    return z.object({
      email: emailSchema.optional(),      // Reuse and modify
      shippingAddress: addressSchema.partial() // All fields optional
    });
  }
}
```

::: tip Benefits of Reusable Schemas
- **Consistency**: Same validation rules across your app
- **Maintainability**: Update once, apply everywhere
- **Type Safety**: Share types between validators
- **Composition**: Build complex schemas from simple ones
:::

::: info Zod API Documentation
For complete schema documentation including strings, numbers, arrays, objects, unions, transformations, and refinements, see the [Zod API Documentation](https://zod.dev/api).
:::

## Asena-Specific Best Practices

### 1. Use Validators for All User Input

```typescript
// ✅ Good: Validate all POST/PUT/PATCH requests
@Post({ path: '/', validator: CreateUserValidator })
async create(context: Context) { }
```

### 2. Keep Validators Focused

```typescript
// ✅ Good: One validator per endpoint
@Middleware({ validator: true })
export class CreateUserValidator extends ValidationService {
  json() {
    return z.object({
      name: z.string(),
      email: z.string().email()
    });
  }
}
```

### 3. Use Hooks for Context Integration

```typescript
// ✅ Good: Use hooks to enrich context
hook: (result, context) => {
  context.setValue('userId', result.id);
  context.setValue('userRole', result.role);
}
```

### 4. Leverage Dependency Injection

```typescript
// ✅ Good: Inject services in validators
@Middleware({ validator: true })
export class UniqueUsernameValidator extends ValidationService {
  @Inject(UserService)
  private userService: UserService;

  async json() {
    return z.object({
      username: z.string().refine(async (name) => {
        return !(await this.userService.usernameExists(name));
      }, 'Username already taken')
    });
  }
}
```

## ValidationSchema Types

```typescript
// Simple schema
type ValidationSchema = z.ZodType<any, z.ZodTypeDef, any>;

// Schema with hook
interface ValidationSchemaWithHook {
  schema: ValidationSchema;
  hook?: (result: any, context: Context) => any;
}
```

## Complete Example

Here's a real-world validator with hooks and service injection:

```typescript
import { Middleware } from '@asenajs/asena/decorators';
import { ValidationService, type ValidationSchemaWithHook } from '@asenajs/ergenecore';
import { Inject } from '@asenajs/asena/decorators/ioc';
import { z } from 'zod';

@Middleware({ validator: true })
export class RegisterUserValidator extends ValidationService {
  @Inject(UserService)
  private userService: UserService;

  @Inject(Logger)
  private logger: Logger;

  async json(): Promise<ValidationSchemaWithHook> {
    return {
      schema: z.object({
        username: z.string()
          .min(3, 'Username must be at least 3 characters')
          .max(20)
          .regex(/^[a-zA-Z0-9_]+$/, 'Alphanumeric and underscore only')
          .refine(async (name) => {
            const exists = await this.userService.usernameExists(name);
            return !exists;
          }, 'Username already taken'),

        email: z.string()
          .email('Invalid email')
          .transform(v => v.toLowerCase()),

        password: z.string()
          .min(8, 'Password must be at least 8 characters')
          .regex(/[A-Z]/, 'Must contain uppercase letter')
          .regex(/[0-9]/, 'Must contain number'),

        confirmPassword: z.string(),

        terms: z.literal(true, {
          errorMap: () => ({ message: 'Must accept terms' })
        })
      }).refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword']
      }),

      // The hook receives Zod's SafeParseResult - the data lives at `result.data`
      // and only when `result.success` is true
      hook: (result, context) => {
        if (!result.success) {
          // Returning a Response overrides the adapter's default 400 envelope
          return context.send({ success: false, issues: result.error.issues }, 400);
        }

        this.logger.info('User registration validated', {
          username: result.data.username,
          email: result.data.email
        });

        // Stash the parsed data for the handler to pick up with context.getValue()
        const { confirmPassword, ...userData } = result.data;

        context.setValue('registrationData', userData);
      }
    };
  }
}
```

::: warning The hook cannot transform the payload
The return value is a **Response override**, not a transformed body. Returning a plain
object is silently ignored - the handler still receives the original parsed data. To pass
a reshaped value along, write it to the context with `setValue()` as above.

Note also that Ergenecore invokes the hook **only on failure**, while Hono invokes it on
every attempt. Guard on `result.success` so the same hook works under both adapters.
:::

## Related

- [Controllers](/docs/concepts/controllers) - Using validators in controllers
- [Middleware](/docs/concepts/middleware) - Understanding middleware flow
- [Context API](/docs/concepts/context) - Working with Context in hooks
- [Configuration](/docs/guides/configuration) - Global error and validation setup
- [Ergenecore Adapter](/docs/adapters/ergenecore) - Ergenecore-specific features
- [Zod Documentation](https://zod.dev) - Complete Zod schema guide
