---
title: Context API
description: Unified request/response handling across all Asena adapters
outline: deep
---

# Context API

The Context API is the heart of request/response handling in Asena. It provides a **unified interface** that works consistently across all adapters (Ergenecore and Hono), allowing you to write adapter-agnostic code.

## What is Context?

The Context object wraps the underlying HTTP request and response, providing convenient methods for:

- Extracting route parameters, query strings, and request bodies
- Sending JSON, HTML, or custom responses
- Managing cookies (with signing support)
- Storing per-request state
- Handling WebSocket upgrades

::: tip Adapter-Agnostic Design
The same Context API works identically in both Ergenecore and Hono adapters. Only the import path changes - your application code remains the same.
:::

## Quick Start

Here's how to use Context in your controllers with both adapters:

::: code-group

```typescript [Ergenecore]
import { Controller } from '@asenajs/asena/server';
import { Get, Post } from '@asenajs/asena/web';
import type { Context } from '@asenajs/ergenecore';

@Controller('/api')
export class ApiController {
  @Get('/user/:id')
  async getUser(context: Context) {
    const id = context.getParam('id');
    const format = context.getQuery('format');

    return context.send({
      userId: id,
      format: format || 'json'
    });
  }

  @Post('/user')
  async createUser(context: Context) {
    const body = await context.getBody<{ name: string; email: string }>();

    return context.send({
      created: true,
      user: body
    }, 201);
  }
}
```

```typescript [Hono]
import { Controller } from '@asenajs/asena/server';
import { Get, Post } from '@asenajs/asena/web';
import type { Context } from '@asenajs/hono-adapter';

@Controller('/api')
export class ApiController {
  @Get('/user/:id')
  async getUser(context: Context) {
    const id = context.getParam('id');
    const format = context.getQuery('format');

    return context.send({
      userId: id,
      format: format || 'json'
    });
  }

  @Post('/user')
  async createUser(context: Context) {
    const body = await context.getBody<{ name: string; email: string }>();

    return context.send({
      created: true,
      user: body
    }, 201);
  }
}
```

:::

::: tip Notice the Difference?
The **only difference** between the two examples is the import path for the `Context` type. The API is completely identical.
:::

## Core Properties

### `req` - Request Object

Access the underlying request object for adapter-specific features.

```typescript
@Get('/info')
async getInfo(context: Context) {
  // Access native request
  const url = context.req.url;
  const method = context.req.method;

  return context.send({ url, method });
}
```

### `res` - Response Object

Access the underlying response object to set headers directly.

```typescript
@Get('/download')
async download(context: Context) {
  // Set custom headers
  context.res.headers.set('Content-Disposition', 'attachment; filename="data.json"');
  context.res.headers.set('X-Custom-Header', 'value');

  return context.send({ data: 'example' });
}
```

### `headers` - Request Headers

Get all request headers as a key-value object.

```typescript
@Get('/headers')
async showHeaders(context: Context) {
  const headers = context.headers;

  return context.send({ headers });
}
```

## Request Data Methods

### Route Parameters

Extract dynamic segments from the URL path using `getParam()`.

```typescript
@Get('/posts/:postId/comments/:commentId')
async getComment(context: Context) {
  const postId = context.getParam('postId');
  const commentId = context.getParam('commentId');

  return context.send({ postId, commentId });
}
```

::: tip Type Safety
Route parameters are always strings. Convert to numbers when needed:
```typescript
const id = Number(context.getParam('id'));
```
:::

### Query Parameters

Extract query string values using `getQuery()` and `getQueryAll()`.

```typescript
@Get('/search')
async search(context: Context) {
  // Single value: ?q=asena
  const query = await context.getQuery('q');

  // Multiple values: ?tags=node&tags=bun
  const tags = await context.getQueryAll('tags');

  // Optional with default
  const page = await context.getQuery('page') || '1';
  const limit = await context.getQuery('limit') || '10';

  return context.send({
    query,
    tags,
    page: Number(page),
    limit: Number(limit)
  });
}
```

### Request Body

Parse JSON request bodies with automatic type casting.

```typescript
interface CreateUserDto {
  name: string;
  email: string;
  age: number;
}

@Post('/users')
async createUser(context: Context) {
  // Type-safe body parsing
  const body = await context.getBody<CreateUserDto>();

  // body is now typed as CreateUserDto
  console.log(body.name, body.email, body.age);

  return context.send({ created: true, user: body }, 201);
}
```

::: warning Empty Body Handling
**Ergenecore**: Empty request body returns `{}` (empty object)

**Hono**: Empty request body may throw an error - always handle parsing errors

```typescript
try {
  const body = await context.getBody();
} catch (error) {
  return context.send({ error: 'Invalid JSON' }, 400);
}
```
:::

### Request Headers

Access specific headers using `req.headers` (via native request object).



::: tip
`Hono` req.headers is a function that returns headers as values

```typescript
const age:string = context.req.header().Age;
```

but in the other hand `ergenecore` is just a regular records

```typescript
const server:string = context.req.headers.get("X-Server")
```
:::


Here is example 

::: code-group
```typescript [ergenecore]
@Get('/auth')
async checkAuth(context: Context) {
  const token = context.req.headers.get('authorization');
  const userAgent = context.req.headers.get('user-agent');

  if (!token) {
    return context.send({ error: 'Unauthorized' }, 401);
  }

  return context.send({ token, userAgent });
}
```

```typescript [hono]
@Get('/auth')
async checkAuth(context: Context) {
  const token = context.req.header().Authorization;
  const userAgent = context.req.header()["User-Agent"];

  if (!token) {
    return context.send({ error: 'Unauthorized' }, 401);
  }

  return context.send({ token, userAgent });
}
```
:::

### Form Data

Parse multipart/form-data and URL-encoded forms.

```typescript
@Post('/upload')
async handleUpload(context: Context) {
  // Get form data
  const formData = await context.getFormData();

  const name = formData.get('name');
  const file = formData.get('file'); // File object

  return context.send({
    name,
    fileName: file instanceof File ? file.name : null
  });
}
```

### Binary Data

Handle binary request bodies (ArrayBuffer, Blob).

```typescript
@Post('/binary')
async handleBinary(context: Context) {
  // Get as ArrayBuffer
  const buffer = await context.getArrayBuffer();

  // Or as Blob
  const blob = await context.getBlob();

  return context.send({ size: buffer.byteLength });
}
```

## Response Methods

### JSON Response - `send()`

Send JSON responses with automatic content-type headers.

```typescript
@Get('/data')
async getData(context: Context) {
  // Simple JSON response (200 OK)
  return context.send({ message: 'Success', data: [] });
}

@Post('/create')
async create(context: Context) {
  // JSON with custom status code
  return context.send({ created: true }, 201);
}

@Get('/error')
async error(context: Context) {
  // Error response
  return context.send({ error: 'Not found' }, 404);
}
```

### Custom Headers

Add custom headers to responses.

```typescript
@Get('/with-headers')
async withHeaders(context: Context) {
  return context.send(
    { data: 'example' },
    {
      status: 200,
      headers: {
        'X-Custom-Header': 'value',
        'X-Request-ID': crypto.randomUUID()
      }
    }
  );
}
```

### HTML Response - `html()`

Send HTML content with proper content-type.

```typescript
@Get('/page')
async showPage(context: Context) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head><title>Asena Page</title></head>
      <body><h1>Hello from Asena!</h1></body>
    </html>
  `;

  return context.html(html);
}
```

### Redirect - `redirect()`

Redirect to another URL (302 Found by default).

```typescript
@Get('/old-path')
async oldPath(context: Context) {
  return context.redirect('/new-path');
}

@Get('/login')
async login(context: Context) {
  const isAuthenticated = context.getValue('authenticated');

  if (isAuthenticated) {
    return context.redirect('/dashboard');
  }

  return context.send({ message: 'Please login' });
}
```

## Cookie Management

### Get Cookie - `getCookie()`

Retrieve cookie values, with optional signature verification.

```typescript
@Get('/check-session')
async checkSession(context: Context) {
  // Get simple cookie
  const sessionId = await context.getCookie('session');

  if (!sessionId) {
    return context.send({ error: 'No session' }, 401);
  }

  return context.send({ sessionId });
}
```

### Signed Cookies

Use signed cookies for tamper-proof data.

```typescript
@Post('/login')
async login(context: Context) {
  const body = await context.getBody<{ username: string }>();

  // Set signed cookie
  await context.setCookie('userId', body.username, {
    secret: 'your-secret-key',
    extraOptions: {
      httpOnly: true,
      secure: true,
      maxAge: 3600 // 1 hour
    }
  });

  return context.send({ message: 'Logged in' });
}

@Get('/profile')
async profile(context: Context) {
  // Verify signed cookie
  const userId = await context.getCookie('userId', 'your-secret-key');

  if (!userId) {
    return context.send({ error: 'Invalid session' }, 401);
  }

  return context.send({ userId });
}
```

### Set Cookie - `setCookie()`

Set cookies with various options.

```typescript
@Post('/preferences')
async setPreferences(context: Context) {
  await context.setCookie('theme', 'dark', {
    extraOptions: {
      path: '/',
      maxAge: 86400 * 30, // 30 days
      httpOnly: false, // Accessible from JavaScript
      sameSite: 'lax'
    }
  });

  return context.send({ message: 'Preferences saved' });
}
```

### Delete Cookie - `deleteCookie()`

Remove cookies by expiring them.

```typescript
@Post('/logout')
async logout(context: Context) {
  await context.deleteCookie('session');
  await context.deleteCookie('userId');

  return context.send({ message: 'Logged out' });
}
```

## State Management

Context provides in-memory state storage for sharing data between middlewares and handlers.

### Set Value - `setValue()`

Store per-request values.

```typescript
// In middleware
@Middleware()
export class AuthMiddleware extends MiddlewareService {
  async use(context: Context) {
    const token = context.req.headers.get('authorization');
    const userId = await verifyToken(token);

    // Store for later use
    context.setValue('userId', userId);
    context.setValue('isAdmin', userId === 'admin');
  }
}
```

### Get Value - `getValue()`

Retrieve stored values in handlers.

```typescript
@Get('/dashboard')
async dashboard(context: Context) {
  // Retrieve value set by middleware
  const userId = context.getValue<string>('userId');
  const isAdmin = context.getValue<boolean>('isAdmin');

  return context.send({ userId, isAdmin });
}
```

::: tip Type-Safe State
Use TypeScript generics for type-safe state access:
```typescript
const userId = context.getValue<string>('userId');
const count = context.getValue<number>('count');
```
:::

## WebSocket Support

Context provides WebSocket-specific methods for upgrade handling.

### Set WebSocket Value - `setWebSocketValue()`

Store data before WebSocket upgrade. 

```typescript
import { Middleware } from '@asenajs/asena/server';
import type { Context, MiddlewareService } from '@asenajs/ergenecore';

@Middleware()
export class WsAuthMiddleware implements MiddlewareService {
  async handle(context: Context, next: () => Promise<void>): Promise<boolean | Response> {

    //.. Rest of code

    context.setWebSocketValue({
      userId: '123',
      username: 'john_doe'
    });

    await next();
  }
}
```

### Get WebSocket Value - `getWebSocketValue()`

::: warning
Socket data will automaticly injectining in `ws.data.value` by adapter. So you dont need to use this.
:::

## Advanced Methods

### Parse Body - `getParseBody()`

Automatically detect and parse request body based on Content-Type.

```typescript
@Post('/auto-parse')
async autoParse(context: Context) {
  // Handles JSON, form-data, and URL-encoded automatically
  const body = await context.getParseBody();

  return context.send({ parsed: body });
}
```

### Array Buffer - `getArrayBuffer()`

Get raw binary data as ArrayBuffer.

```typescript
@Post('/process-image')
async processImage(context: Context) {
  const buffer = await context.getArrayBuffer();

  // Process binary data
  const processed = await processImageBuffer(buffer);

  return context.send({ size: buffer.byteLength, processed });
}
```

### Blob - `getBlob()`

Get request body as a Blob.

```typescript
@Post('/upload-blob')
async uploadBlob(context: Context) {
  const blob = await context.getBlob();

  return context.send({
    type: blob.type,
    size: blob.size
  });
}
```

## Common Patterns

### Authentication Flow

```typescript
// Middleware sets user data 
@Middleware()
export class AuthMiddleware extends MiddlewareService {
  async use(context: Context) {
    const token = context.req.header().Authorization;

    if (!token) {
      throw new Error('Unauthorized');
    }

    const user = await this.verifyToken(token);
    context.setValue('user', user);
  }
}

// Controller uses user data
@Controller({ path: '/api', middlewares: [AuthMiddleware] })
export class ApiController {
  @Get('/profile')
  async getProfile(context: Context) {
    const user = context.getValue('user');
    return context.send({ user });
  }
}
```

### File Upload

```typescript
@Post('/upload')
async uploadFile(context: Context) {
  const formData = await context.getFormData();

  const file = formData.get('file');
  const description = formData.get('description');

  if (!file || !(file instanceof File)) {
    return context.send({ error: 'No file provided' }, 400);
  }

  // Process file
  const buffer = await file.arrayBuffer();
  const saved = await this.fileService.save(file.name, buffer);

  return context.send({
    uploaded: true,
    fileName: file.name,
    size: file.size,
    description
  }, 201);
}
```

## Adapter-Specific Features

### Ergenecore Adapter

**Performance Optimizations:**
- Lazy URL parsing (only when query params accessed)
- Lazy state Map (only when setValue/getValue called)
- Body caching (allows multiple getBody() calls)

**Native Bun Features:**
- Uses Bun's native cookie API
- Direct access to Bun's Request/Response

```typescript
import type { Context } from '@asenajs/ergenecore';

@Get('/native')
async useNative(context: Context) {
  // Access Bun native request
  const bunRequest: Request = context.req;

  return context.send({ framework: 'Ergenecore' });
}
```

### Hono Adapter

**Rich Ecosystem:**
- Full access to Hono's middleware ecosystem
- Streaming response support
- WebSocket via Hono's upgrade mechanism

**Native Hono Context:**
Access Hono-specific features via the wrapped context.

```typescript
import type { Context } from '@asenajs/hono-adapter';

@Get('/native')
async useNative(context: Context) {
  // Access Hono native methods
  const contentType = context.req.header('content-type');

  // Use Hono streaming (if needed)
  // Note: send() is still recommended for most cases

  return context.send({ framework: 'Hono' });
}
```

## API Reference

### Request Methods

| Method | Return Type | Description |
|:-------|:------------|:------------|
| `getParam(name)` | `string` | Get route parameter |
| `getQuery(name)` | `Promise<string>` | Get single query parameter |
| `getQueryAll(name)` | `Promise<string[]>` | Get all values of a query parameter |
| `getBody<T>()` | `Promise<T>` | Parse JSON body with type |
| `getParseBody()` | `Promise<any>` | Auto-parse body by content-type |
| `getFormData()` | `Promise<FormData>` | Parse form data |
| `getArrayBuffer()` | `Promise<ArrayBuffer>` | Get binary body |
| `getBlob()` | `Promise<Blob>` | Get body as Blob |

### Response Methods

| Method | Return Type | Description |
|:-------|:------------|:------------|
| `send(data, status?)` | `Response \| Promise<Response>` | Send JSON response |
| `html(html, status?)` | `Response \| Promise<Response>` | Send HTML response |
| `redirect(url)` | `void` | Redirect to URL |

### Cookie Methods

| Method | Return Type | Description |
|:-------|:------------|:------------|
| `getCookie(name, secret?)` | `Promise<string \| false>` | Get cookie value |
| `setCookie(name, value, options?)` | `Promise<void>` | Set cookie |
| `deleteCookie(name, options?)` | `Promise<void>` | Delete cookie |

### State Methods

| Method | Return Type | Description |
|:-------|:------------|:------------|
| `getValue<T>(key)` | `T` | Get context value |
| `setValue(key, value)` | `void` | Set context value |
| `getWebSocketValue<T>()` | `T` | Get WebSocket data |
| `setWebSocketValue(value)` | `void` | Set WebSocket data |

## Best Practices

::: tip Always Type Your Bodies
Use TypeScript generics for type-safe request bodies:
```typescript
interface CreateUserDto {
  name: string;
  email: string;
}

const body = await context.getBody<CreateUserDto>();
// body.name and body.email are now type-safe
```
:::

::: tip Use State for Middleware Communication
Share data between middlewares and handlers using setValue/getValue:
```typescript
// Middleware
context.setValue('userId', extractedUserId);

// Handler
const userId = context.getValue<string>('userId');
```
:::

::: tip Consistent Error Responses
Use a consistent error format across your API:
```typescript
return context.send({
  error: 'Human-readable message',
  code: 'MACHINE_READABLE_CODE',
  details: {} // Optional
}, statusCode);
```
:::

::: warning Async Methods
Most Context methods are async. Always use `await`:
```typescript
// ❌ Wrong
const query = context.getQuery('q');

// ✅ Correct
const query = await context.getQuery('q');
```
:::

## Related Documentation

- [Controllers](/docs/concepts/controllers) - Using Context in controllers
- [Middleware](/docs/concepts/middleware) - Context in middlewares
- [Ergenecore Adapter](/docs/adapters/ergenecore) - Ergenecore-specific features
- [Hono Adapter](/docs/adapters/hono) - Hono-specific features
- [WebSocket](/docs/concepts/websocket) - WebSocket integration with Context
