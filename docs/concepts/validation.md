---
title: Validation
description: Type-safe request validation with Zod integration in Asena
outline: deep
---

# Validation

Asena provides built-in validation support using [Zod](https://zod.dev). Validation ensures that incoming request data meets your requirements before reaching your route handlers.

::: info Adapter Support
Both the **Ergenecore** and the **Hono** adapter ship validation. Each exports its own `ValidationService` and `ValidationSchemaWithHook`, so import them from the adapter you use.

One behavioural difference remains: Ergenecore runs the `hook` **only when validation fails**, while the Hono adapter runs it on **every** validation attempt. Write hooks that check `result.success` and they behave the same on both.
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
    // body is guaranteed to be valid!

    return context.send({ created: true, user: body }, 201);
  }
}
```

::: tip Validation Happens Automatically
The validator runs **before** your route handler. If validation fails, the handler is never called.
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
        // context: adapter Context

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
        // context: adapter Context

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

If your application defines no global error handler, the adapter answers directly with
Zod's flattened error:

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
`header`. The Hono adapter includes it; Ergenecore omits it.

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
The thrown error extends the adapter's HTTP exception type (`HTTPException` for Hono,
`HttpException` for Ergenecore) and carries status **400**. An existing handler that
branches on `instanceof HTTPException` and replies with `error.status` therefore keeps
answering 400 - adopting this does not silently turn validation failures into 500s.
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
  // Execution order:
  // 1. AuthMiddleware
  // 2. RateLimitMiddleware
  // 3. CreateUserValidator (validation)
  // 4. create() handler
}
```

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

      hook: (result, context) => {
        // Log validation success
        this.logger.info('User registration validated', {
          username: result.username,
          email: result.email
        });

        // Store validated data in context
        context.setValue('registrationData', result);

        // Remove confirmPassword from result
        const { confirmPassword, ...userData } = result;
        return userData;
      }
    };
  }
}
```

## Related Documentation

- [Controllers](/docs/concepts/controllers) - Using validators in controllers
- [Middleware](/docs/concepts/middleware) - Understanding middleware flow
- [Ergenecore Adapter](/docs/adapters/ergenecore) - Ergenecore-specific features
- [Context API](/docs/concepts/context) - Working with Context in hooks
- [Zod Documentation](https://zod.dev) - Complete Zod schema guide

---

**Next Steps:**
- Learn about [Middleware](/docs/concepts/middleware)
- Explore [Error Handling](/docs/guides/configuration)
- Understand [Context API](/docs/concepts/context)
