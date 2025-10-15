---
title: Validation
description: Type-safe request validation with Zod integration in Asena
outline: deep
---

# Validation

Asena provides built-in validation support for the **Ergenecore adapter** using [Zod](https://zod.dev). Validation ensures that incoming request data meets your requirements before reaching your route handlers.

::: info Adapter Support
Validation is currently supported only in the **Ergenecore adapter**. The Hono adapter can use Zod directly with Hono's validation middleware.
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
import { Middleware } from '@asenajs/asena/server';
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
import { Controller } from '@asenajs/asena/server';
import { Post } from '@asenajs/asena/web';
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

```typescript
import type { ValidationSchemaWithHook } from '@asenajs/ergenecore';

@Middleware({ validator: true })
export class UserValidatorWithHook extends ValidationService {
  json(): ValidationSchemaWithHook {
    return {
      schema: z.object({
        email: z.string().email(),
        password: z.string().min(8)
      }),

      hook: (result, context) => {
        // result: validated data
        // context: Ergenecore Context

        // Log validation success
        console.log('Validated user data:', result);

        // Store in context for later use
        context.setValue('validatedEmail', result.email);

        // Transform or enrich data
        return {
          ...result,
          emailLowercase: result.email.toLowerCase()
        };
      }
    };
  }
}
```

### Hook Function Signature

```typescript
hook: (result: any, context: Context) => any
```

| Parameter | Type | Description |
|:----------|:-----|:------------|
| `result` | `any` | The validated and parsed data from Zod |
| `context` | `Context` | Ergenecore Context object |
| **Returns** | `any` | Transformed data (optional) |

### Hook Use Cases

**1. Logging and Monitoring**

```typescript
hook: (result, context) => {
  console.log('Validation passed:', {
    endpoint: context.req.url,
    data: result
  });
}
```

**2. Storing Validated Data in Context**

```typescript
hook: (result, context) => {
  // Make validated data available to middlewares/handlers
  context.setValue('validatedUser', result);
  context.setValue('userEmail', result.email);
}
```

**3. Data Transformation**

```typescript
hook: (result, context) => {
  // Transform validated data
  return {
    ...result,
    email: result.email.toLowerCase(),
    createdAt: new Date(),
    ipAddress: context.req.headers.get('x-forwarded-for')
  };
}
```

**4. Side Effects**

```typescript
hook: async (result, context) => {
  // Send notification, update cache, etc.
  await this.notificationService.sendAlert('New signup', result.email);
}
```

## Validation Error Responses

When validation fails, Asena automatically returns **400 Bad Request** with detailed error information:

```json
{
  "error": "Validation failed",
  "details": [
    {
      "path": ["email"],
      "message": "Invalid email"
    },
    {
      "path": ["age"],
      "message": "Must be at least 18"
    }
  ]
}
```

::: tip Custom Error Handling
You cannot customize the error response format directly. For custom error handling, use a global error handler in your `@Config` class.
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
import { Middleware } from '@asenajs/asena/server';
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
import { Middleware } from '@asenajs/asena/server';
import { ValidationService, type ValidationSchemaWithHook } from '@asenajs/ergenecore';
import { Inject } from '@asenajs/asena/ioc';
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
