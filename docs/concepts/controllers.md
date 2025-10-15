---
title: Controllers
description: Handle HTTP requests with decorator-based routing and dependency injection
outline: deep
---

# Controllers

Controllers are the backbone of your Asena application. They handle incoming HTTP requests, process them, and return responses to the client. Using TypeScript decorators, you can define routes, inject services, and integrate middleware seamlessly.

## Quick Start

Here's a complete controller example with both Ergenecore and Hono adapters:

::: code-group

```typescript [Ergenecore]
import { Controller } from '@asenajs/asena/server';
import { Get, Post } from '@asenajs/asena/web';
import type { Context } from '@asenajs/ergenecore';

@Controller('/users')
export class UserController {
  @Get('/')
  async list(context: Context) {
    const page = context.getQuery('page') || '1';
    return context.send({ users: [], page });
  }

  @Get('/:id')
  async getById(context: Context) {
    const id = context.getParam('id');
    return context.send({ id, name: 'John Doe' });
  }

  @Post('/')
  async create(context: Context) {
    const body = await context.getBody();
    return context.send({ created: true, data: body }, 201);
  }
}
```

```typescript [Hono]
import { Controller } from '@asenajs/asena/server';
import { Get, Post } from '@asenajs/asena/web';
import type { Context } from '@asenajs/hono-adapter';

@Controller('/users')
export class UserController {
  @Get('/')
  async list(context: Context) {
    const page = context.getQuery('page') || '1';
    return context.send({ users: [], page });
  }

  @Get('/:id')
  async getById(context: Context) {
    const id = context.getParam('id');
    return context.send({ id, name: 'John Doe' });
  }

  @Post('/')
  async create(context: Context) {
    const body = await context.getBody();
    return context.send({ created: true, data: body }, 201);
  }
}
```

:::

::: tip Unified Context API
Both Ergenecore and Hono adapters provide the **same Context API** (`getParam`, `getQuery`, `getBody`, `send`, etc.). Only import the Context type from your chosen adapter package.
:::

## The @Controller Decorator

The `@Controller()` decorator marks a class as a request handler and defines the base path for all routes within it.

### Syntax

```typescript
@Controller(path: string)
@Controller(params: ControllerParams)
```

### Simple Path (String)

```typescript
@Controller('/api/users')
export class UserController {
  // All routes will be prefixed with /api/users
}
```

### With ControllerParams Object

When you need to add middlewares or other options, use the `ControllerParams` object:

```typescript
import { AuthMiddleware } from '../middlewares/AuthMiddleware';

@Controller({
  path: '/admin',
  middlewares: [AuthMiddleware]
})
export class AdminController {
  // All routes require authentication
}
```

### ControllerParams Interface

```typescript
interface ControllerParams {
  path: string;              // Required: Base path for all routes
  middlewares?: Middleware[]; // Optional: Controller-level middlewares
}
```

| Property | Type | Required | Description |
|:---------|:-----|:---------|:------------|
| `path` | `string` | **Yes** | Base path for all routes in this controller |
| `middlewares` | `Middleware[]` | No | Array of middleware classes to apply to all routes |

::: tip Path is Always Required
When using the object notation, `path` is **required**. If you want routes at the root level, use `path: '/'`:
```typescript
@Controller({ path: '/', middlewares: [LoggerMiddleware] })
export class AppController { }
```
:::

## HTTP Method Decorators

Asena provides decorators for all standard HTTP methods:

| Decorator | HTTP Method | Common Use Case |
|:----------|:------------|:----------------|
| `@Get()` | GET | Retrieve resources |
| `@Post()` | POST | Create resources |
| `@Put()` | PUT | Update resources (full replacement) |
| `@Patch()` | PATCH | Partial update |
| `@Delete()` | DELETE | Delete resources |
| `@Options()` | OPTIONS | CORS preflight |
| `@Head()` | HEAD | Metadata only |

### Simple Route

```typescript
@Get('/profile')
async getProfile(context: Context) {
  return context.send({ name: 'John' });
}
```

### With Path Parameter

```typescript
@Get('/:id')
async getById(context: Context) {
  const id = context.getParam('id');
  return context.send({ id });
}
```

### With Route-Level Options

```typescript
import { AuthMiddleware } from '../middlewares/AuthMiddleware';
import { CreateUserValidator } from '../validators/CreateUserValidator';

@Post({
  path: '/',
  middlewares: [AuthMiddleware],
  validator: CreateUserValidator
})
async create(context: Context) {
  const body = await context.getBody();
  return context.send({ created: true, data: body }, 201);
}
```

## Working with Request Data

### Route Parameters

Extract dynamic segments from the URL path:

```typescript
@Get('/:userId/posts/:postId')
async getPost(context: Context) {
  const userId = context.getParam('userId');
  const postId = context.getParam('postId');

  return context.send({ userId, postId });
}
```

### Query Parameters

Access URL query strings:

```typescript
@Get('/search')
async search(context: Context) {
  const query = context.getQuery('q');
  const page = context.getQuery('page') || '1';
  const limit = context.getQuery('limit') || '10';

  return context.send({ query, page, limit });
}
```

### Request Body

Parse JSON request bodies:

```typescript
@Post('/users')
async create(context: Context) {
  const body = await context.getBody<{
    name: string;
    email: string;
    age: number;
  }>();

  // Type-safe body access
  return context.send({ created: true, user: body }, 201);
}
```

### Headers

Access request headers:

```typescript
@Get('/profile')
async getProfile(context: Context) {
  const token = context.getHeader('authorization');
  const userAgent = context.getHeader('user-agent');

  return context.send({ token, userAgent });
}
```

## Sending Responses

### JSON Response

```typescript
@Get('/data')
async getData(context: Context) {
  return context.send({ message: 'Success', data: [] });
}
```

### Custom Status Code

```typescript
@Post('/users')
async create(context: Context) {
  return context.send({ created: true }, 201);
}

@Get('/not-found')
async notFound(context: Context) {
  return context.send({ error: 'Not found' }, 404);
}
```

### With Custom Headers

```typescript
@Get('/headers')
async download(context: Context) {

  context.res.headers.set('X-My-Header', 'Awsome-Header');

  return respcontext.send('File content', 200);
}
```

## Context API Reference

Both adapters provide a **unified Context API** for common operations.

### Common Methods (Both Adapters)

```typescript
import type { Context } from '@asenajs/ergenecore'; // or '@asenajs/hono-adapter'
```

| Method | Description | Example |
|:-------|:------------|:--------|
| `getParam(key)` | Get route parameter | `context.getParam('id')` |
| `getQuery(key)` | Get query parameter | `context.getQuery('page')` |
| `getBody<T>()` | Get parsed request body | `await context.getBody<User>()` |
| `getHeader(key)` | Get request header | `context.getHeader('authorization')` |
| `send(data, status?)` | Send JSON response | `context.send({ success: true }, 200)` |
| `setCookie(name, value, options?)` | Set cookie | `context.setCookie('session', 'abc')` |
| `getCookie(name)` | Get cookie value | `context.getCookie('session')` |
| `setValue(key, value)` | Set context state | `context.setValue('userId', 123)` |
| `getValue(key)` | Get context state | `context.getValue('userId')` |
| `getRequest()` | Get raw request object | `context.getRequest()` |

::: tip Advanced Hono Features
For Hono-specific features (streaming, form data, WebSocket upgrade, etc.), access the native Hono context via `context.req`:

```typescript
// Access native Hono request methods
const contentType = context.req.header('content-type');
const formData = await context.req.formData();
```

For more details about Context API methods and advanced usage, see the [Context API Reference](/docs/concepts/context) guide.

:::

## Service Injection

Controllers can inject services using the `@Inject` decorator for business logic separation. The `@Inject` decorator supports two injection methods:

1. **Class-based injection** - Inject by passing the service class directly
2. **String-based injection** - Inject by passing the service name as a string

### Create a Service

```typescript
// src/services/UserService.ts
import { Service } from '@asenajs/asena/server';

@Service()
export class UserService {
  private users = [
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
  ];

  findAll() {
    return this.users;
  }

  findById(id: number) {
    return this.users.find(user => user.id === id);
  }

  create(userData: { name: string; email: string }) {
    const newUser = {
      id: this.users.length + 1,
      ...userData
    };
    this.users.push(newUser);
    return newUser;
  }
}
```

### Inject Service in Controller

```typescript
import { Controller } from '@asenajs/asena/server';
import { Get, Post } from '@asenajs/asena/web';
import { Inject } from '@asenajs/asena/ioc';
import { UserService } from '../services/UserService';
import type { Context } from '@asenajs/ergenecore';

@Controller('/users')
export class UserController {
  @Inject(UserService)
  private userService: UserService;

  @Get('/')
  async list(context: Context) {
    const users = this.userService.findAll();
    return context.send({ users });
  }

  @Get('/:id')
  async getById(context: Context) {
    const id = Number(context.getParam('id'));
    const user = this.userService.findById(id);

    if (!user) {
      return context.send({ error: 'User not found' }, 404);
    }

    return context.send({ user });
  }

  @Post('/')
  async create(context: Context) {
    const body = await context.getBody<{ name: string; email: string }>();
    const user = this.userService.create(body);

    return context.send({ created: true, user }, 201);
  }
}
```

### String-Based Injection

You can also inject services using their registered name as a string. This is useful when you want to decouple your code from concrete implementations or when working with dynamically registered services.

First, register your service with a custom name:

```typescript
// src/services/UserService.ts
import { Service } from '@asenajs/asena/server';

@Service('UserService')  // Register with custom name
export class UserService {
  // ... same implementation as above
}
```

Then inject using the string name:

```typescript
import { Controller } from '@asenajs/asena/server';
import { Get } from '@asenajs/asena/web';
import { Inject } from '@asenajs/asena/ioc';
import type { Context } from '@asenajs/ergenecore';

@Controller('/users')
export class UserController {
  @Inject('UserService')  // Inject by string name
  private userService: any;  // Type needs to be specified manually or use a type assertion

  @Get('/')
  async list(context: Context) {
    const users = this.userService.findAll();
    return context.send({ users });
  }
}
```

::: tip Class-based vs String-based Injection

**Class-based injection** (recommended):
- ✅ Type-safe - TypeScript knows the exact type
- ✅ Refactor-friendly - Renaming the class updates all references
- ✅ Better IDE support (autocomplete, go-to-definition)

**String-based injection**:
- ✅ Loose coupling - No direct dependency on the class
- ✅ Dynamic service resolution
- ❌ No type safety - Manual type annotations required
- ❌ Runtime errors if service name is misspelled
:::

::: tip Learn More About DI
See the [Dependency Injection](/docs/concepts/dependency-injection) guide for advanced patterns.
:::

## Middleware Integration

You can apply middleware at three levels: global, controller, and route.

### Controller-Level Middleware

```typescript
import { Controller } from '@asenajs/asena/server';
import { Get } from '@asenajs/asena/web';
import { AuthMiddleware } from '../middlewares/AuthMiddleware';
import type { Context } from '@asenajs/ergenecore';

@Controller({
  path: '/admin',
  middlewares: [AuthMiddleware]
})
export class AdminController {
  @Get('/dashboard')
  async dashboard(context: Context) {
    // AuthMiddleware runs before this handler
    const userId = context.getValue('userId');
    return context.send({ userId, message: 'Admin dashboard' });
  }
}
```

### Route-Level Middleware

```typescript
import { Controller } from '@asenajs/asena/server';
import { Get, Post } from '@asenajs/asena/web';
import { AuthMiddleware } from '../middlewares/AuthMiddleware';
import type { Context } from '@asenajs/ergenecore';

@Controller('/posts')
export class PostController {
  @Get('/')
  async list(context: Context) {
    // Public endpoint - no middleware
    return context.send({ posts: [] });
  }

  @Post({
    path: '/',
    middlewares: [AuthMiddleware]
  })
  async create(context: Context) {
    // Only runs if AuthMiddleware passes
    const body = await context.getBody();
    return context.send({ created: true, post: body }, 201);
  }
}
```

::: tip Middleware Execution Order
Middleware executes in this order:
1. Global middleware (defined in `@Config`)
2. Controller-level middleware
3. Route-level middleware
4. Route handler
:::

## Validation

Asena supports automatic request validation using Zod schemas (available with Ergenecore adapter).

### Create a Validator

```typescript
// src/validators/CreateUserValidator.ts
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

### Use Validator in Controller

```typescript
import { Controller } from '@asenajs/asena/server';
import { Post } from '@asenajs/asena/web';
import { CreateUserValidator } from '../validators/CreateUserValidator';
import type { Context } from '@asenajs/ergenecore';

@Controller('/users')
export class UserController {
  @Post({
    path: '/',
    validator: CreateUserValidator
  })
  async create(context: Context) {
    // Body is automatically validated
    const body = await context.getBody();

    return context.send({ created: true, data: body }, 201);
  }
}
```

::: warning Validation Errors
If validation fails, Asena automatically returns a `400 Bad Request` with validation error details.
:::

::: tip Learn More About Validation
See the [Validation](/docs/concepts/validation) guide for advanced schemas and custom error handling.
:::

## Combining Features

Here's a real-world example combining services, middleware, and validation:

```typescript
import { Controller } from '@asenajs/asena/server';
import { Get, Post, Put, Delete } from '@asenajs/asena/web';
import { Inject } from '@asenajs/asena/ioc';
import { AuthMiddleware } from '../middlewares/AuthMiddleware';
import { CreatePostValidator } from '../validators/CreatePostValidator';
import { UpdatePostValidator } from '../validators/UpdatePostValidator';
import { PostService } from '../services/PostService';
import type { Context } from '@asenajs/ergenecore';

@Controller({
  path: '/posts',
  middlewares: [AuthMiddleware]  // All routes require authentication
})
export class PostController {
  @Inject(PostService)
  private postService: PostService;

  @Get('/')
  async list(context: Context) {
    const page = Number(context.getQuery('page')) || 1;
    const limit = Number(context.getQuery('limit')) || 10;

    const posts = await this.postService.findAll(page, limit);
    return context.send({ posts, page, limit });
  }

  @Get('/:id')
  async getById(context: Context) {
    const id = Number(context.getParam('id'));
    const post = await this.postService.findById(id);

    if (!post) {
      return context.send({ error: 'Post not found' }, 404);
    }

    return context.send({ post });
  }

  @Post({
    path: '/',
    validator: CreatePostValidator
  })
  async create(context: Context) {
    const userId = context.getValue('userId');
    const body = await context.getBody<{
      title: string;
      content: string;
    }>();

    const post = await this.postService.create(userId, body);
    return context.send({ created: true, post }, 201);
  }

  @Put({
    path: '/:id',
    validator: UpdatePostValidator
  })
  async update(context: Context) {
    const id = Number(context.getParam('id'));
    const userId = context.getValue('userId');
    const body = await context.getBody();

    const post = await this.postService.update(id, userId, body);

    if (!post) {
      return context.send({ error: 'Post not found or unauthorized' }, 404);
    }

    return context.send({ updated: true, post });
  }

  @Delete('/:id')
  async delete(context: Context) {
    const id = Number(context.getParam('id'));
    const userId = context.getValue('userId');

    const deleted = await this.postService.delete(id, userId);

    if (!deleted) {
      return context.send({ error: 'Post not found or unauthorized' }, 404);
    }

    return context.send({ deleted: true });
  }
}
```

## Common Patterns

### Error Handling

```typescript
@Get('/:id')
async getById(context: Context) {
  try {
    const id = Number(context.getParam('id'));
    const user = await this.userService.findById(id);

    if (!user) {
      return context.send({ error: 'User not found' }, 404);
    }

    return context.send({ user });
  } catch (error) {
    return context.send({ error: 'Internal server error' }, 500);
  }
}
```

### Pagination

```typescript
@Get('/')
async list(context: Context) {
  const page = Number(context.getQuery('page')) || 1;
  const limit = Number(context.getQuery('limit')) || 20;
  const offset = (page - 1) * limit;

  const users = await this.userService.findAll({ offset, limit });
  const total = await this.userService.count();

  return context.send({
    users,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
}
```

### Search and Filtering

```typescript
@Get('/search')
async search(context: Context) {
  const query = context.getQuery('q');
  const category = context.getQuery('category');
  const sortBy = context.getQuery('sort') || 'createdAt';

  const results = await this.postService.search({
    query,
    category,
    sortBy
  });

  return context.send({ results, query });
}
```

## Best Practices

::: tip Keep Controllers Thin
Move business logic to services. Controllers should only handle:
- Request parsing
- Calling services
- Returning responses
:::

::: tip Use Type Safety
Always type your request bodies and service responses for better IDE support and fewer runtime errors:
```typescript
interface CreateUserDto {
  name: string;
  email: string;
  age: number;
}

const body = await context.getBody<CreateUserDto>();
```
:::

::: tip Consistent Error Handling
Use consistent error response formats across your application:
```typescript
return context.send({
  error: 'User not found',
  code: 'USER_NOT_FOUND'
}, 404);
```
:::

::: warning Async Handlers
Always use `async` handlers when working with asynchronous operations like database calls or external APIs.
:::

## Related Documentation

- [Services](/docs/concepts/services) - Business logic separation
- [Middleware](/docs/concepts/middleware) - Request/response interception
- [Validation](/docs/concepts/validation) - Request validation with Zod
- [Dependency Injection](/docs/concepts/dependency-injection) - IoC container
- [Context API](/docs/concepts/context) - Detailed context methods for each adapter
- [Ergenecore Adapter](/docs/adapters/ergenecore) - Ergenecore-specific features
- [Hono Adapter](/docs/adapters/hono) - Hono-specific features
