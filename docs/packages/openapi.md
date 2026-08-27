---
title: Asena OpenAPI
description: Zero-config OpenAPI 3.1 spec generation from your existing validators, with built-in Swagger UI and Scalar API Reference
outline: deep
---

# Asena OpenAPI

Automatic OpenAPI 3.1 spec generation for AsenaJS — zero config, uses your existing validators. Your `@Controller` routes and validator schemas (`json()`, `query()`, `param()`, `response()`) are automatically converted to a full OpenAPI specification. No extra annotations needed.

## Features

- **Zero Config** - Extracts schemas from existing validators, no extra annotations needed
- **OpenAPI 3.1** - Generates JSON Schema draft-2020-12 compatible spec
- **Built-in API Docs UIs** - Swagger UI or Scalar, CDN-based, no npm install required
- **@Hidden Decorator** - Class and method level exclusion from spec
- **Zod v4 Native** - Uses `z.toJSONSchema()` for accurate conversion
- **Pluggable Converters** - `SchemaConverter` interface for custom schema types
- **IoC Integrated** - PostProcessor pattern, auto-discovers controllers during bootstrap
- **Zero Runtime Dependencies** - Only peer deps (asena, reflect-metadata, zod)

## Installation

```bash
bun add @asenajs/asena-openapi
```

**Requirements:**
- [Bun](https://bun.sh) v1.4 or higher
- [@asenajs/asena](https://github.com/AsenaJs/Asena) v0.11.0 or higher
- [Zod](https://zod.dev) v4.3 or higher

## Quick Start

```typescript
// src/openapi/AppOpenApi.ts
import { OpenApi, OpenApiPostProcessor } from '@asenajs/asena-openapi';

@OpenApi({
  info: { title: 'My API', version: '1.0.0' },
  path: '/api/openapi',
  ui: 'scalar', // or true / 'swagger' — API docs UI at /api/openapi/ui
})
export class AppOpenApi extends OpenApiPostProcessor {}
```

Asena automatically discovers it — that's it.

Now:

- `GET /api/openapi` → OpenAPI 3.1 JSON spec
- `GET /api/openapi/ui` → API docs UI (Swagger UI or Scalar)

::: tip Zero Setup
You don't need to register `AppOpenApi` anywhere. It lives in your `sourceFolder`, so the component scan discovers and initializes it during bootstrap, just like any other component.
:::

## How It Works

The `OpenApiPostProcessor` automatically:

1. **Intercepts** every `@Controller` during IoC setup
2. **Extracts** route metadata (`@Get`, `@Post`, `@Put`, `@Patch`, `@Delete`, … — `@All` and `@Connect` are skipped, OpenAPI has no path item field for them)
3. **Resolves** validators and converts their Zod schemas to JSON Schema
4. **Generates** a complete OpenAPI 3.1 spec
5. **Registers** GET endpoints on the adapter for spec and the docs UI

Your existing validators do double duty — they validate requests **AND** generate documentation.

## Validator Mapping

Each validator method maps to a specific part of the OpenAPI spec:

| Validator Method | OpenAPI Output | Location |
|:-----------------|:---------------|:---------|
| `json()` | RequestBody | `application/json` |
| `form()` | RequestBody | `multipart/form-data` |
| `query()` | ParameterObject[] | `in: query` |
| `param()` | ParameterObject[] | `in: path` |
| `header()` | ParameterObject[] | `in: header` |
| `response()` | ResponseObject | by status code |

### Complete Validator Example

```typescript
import { Middleware } from '@asenajs/asena/decorators';
import { ValidationService } from '@asenajs/hono-adapter'; // or '@asenajs/ergenecore'
import { z } from 'zod';

@Middleware({ validator: true })
export class CreateUserValidator extends ValidationService {
  // → requestBody (application/json)
  json() {
    return z.object({
      name: z.string().min(1),
      email: z.string().email(),
    });
  }

  // → query parameters
  query() {
    return z.object({
      page: z.coerce.number().optional(),
    });
  }

  // → path parameters
  param() {
    return z.object({
      id: z.string().uuid(),
    });
  }

  // → response schemas by status code
  response() {
    return {
      201: z.object({ id: z.string(), name: z.string() }),
      400: { schema: z.object({ error: z.string() }), description: 'Validation error' },
    };
  }
}
```

::: info Response Format
The `response()` method supports two formats per status code:
- **Simple:** A Zod schema directly (e.g., `201: z.object({ ... })`)
- **Detailed:** An object with `schema` and optional `description` (e.g., `400: { schema: z.object({ ... }), description: '...' }`)
:::

### Descriptions

The text the docs UI shows comes from code you already write:

| Source | Lands in |
|:-------|:---------|
| `@Controller({ path, description })` | Tag description — the controller's section in the UI |
| `@Get({ path, summary, description })` (any verb decorator) | Operation summary and description |
| `.describe()` on a `query()` / `param()` / `header()` field | Parameter description |
| `.describe()` on a field inside a `json()` / `form()` / `response()` schema | Property description |
| `.describe()` on the `json()` / `form()` object itself | `requestBody.description` — the schema itself does not carry it, so UIs that print both show it once |
| `response()` detailed form `{ schema, description }` | Response description |

```typescript
@Controller({ path: '/api/users', description: 'User accounts and profiles' })
export class UserController {
  @Post({
    path: '/',
    validator: CreateUserValidator,
    summary: 'Create a user',
    description: 'Creates the account and sends the welcome email.',
  })
  create(context: Context) { /* ... */ }
}

// CreateUserValidator
json() {
  return z
    .object({
      name: z.string().min(1).describe('Display name, 1-200 characters'),
      email: z.string().email().describe('Must be unique across accounts'),
    })
    .describe('New account');
}
```

## @Hidden Decorator

Hide controllers or individual routes from the spec:

```typescript
import { Hidden } from '@asenajs/asena-openapi';
import { Controller } from '@asenajs/asena/decorators';
import { Get } from '@asenajs/asena/decorators/http';

// Hide entire controller
@Hidden()
@Controller('/internal')
export class InternalController {
  @Get('/metrics')
  metrics() { /* hidden from spec */ }
}

// Hide single route
@Controller('/api')
export class ApiController {
  @Hidden()
  @Get('/health')
  healthCheck() { /* hidden from spec */ }

  @Get('/users')  // this route IS in the spec
  listUsers() { /* visible in spec */ }
}
```

## Configuration

### OpenApiDecoratorOptions

```typescript
@OpenApi({
  info: {
    title: 'My API',         // Required
    version: '1.0.0',        // Required
    description: 'My app',   // Optional
  },
  path: '/api/openapi',      // Default: '/openapi'
  ui: 'scalar',              // Default: none — 'swagger' (or true), 'scalar', or { provider, configuration }
  servers: [                 // Optional
    { url: 'https://api.example.com', description: 'Production' },
  ],
  converters: [              // Default: [ZodSchemaConverter]
    new ZodSchemaConverter(),
  ],
})
export class AppOpenApi extends OpenApiPostProcessor {}
```

| Option | Type | Default | Description |
|:-------|:-----|:--------|:------------|
| `info` | `{ title, version, description? }` | — | API metadata (required) |
| `path` | `string` | `'/openapi'` | Base path for spec and UI endpoints |
| `ui` | `boolean \| 'swagger' \| 'scalar' \| { provider, configuration? }` | — | API docs UI served at `{path}/ui` |
| `servers` | `ServerObject[]` | — | Server URLs for the spec |
| `converters` | `SchemaConverter[]` | `[ZodSchemaConverter]` | Schema converters |

## API Docs UI

Set `ui` to serve an API documentation page at `{path}/ui`. Both providers load from CDN — zero npm dependencies:

| Value | UI served |
|:------|:----------|
| `true` / `'swagger'` | Swagger UI (`swagger-ui-dist@5` from unpkg) |
| `'scalar'` | Scalar API Reference (`@scalar/api-reference@1` from jsdelivr) |
| `{ provider, configuration }` | Either provider, with raw provider configuration merged over the defaults |
| `false` / unset | None |

```typescript
@OpenApi({
  info: { title: 'My API', version: '1.0.0' },
  ui: {
    provider: 'scalar',
    configuration: { theme: 'purple', darkMode: true },
  },
})
export class AppOpenApi extends OpenApiPostProcessor {}
```

`configuration` is passed straight through: for Scalar it lands in `Scalar.createApiReference`, for Swagger in `SwaggerUIBundle`. Its keys override the defaults — including `url`, if you want the UI to read a spec from somewhere else. An unknown provider fails at boot with a clear error instead of serving a broken page.

::: warning Production Consideration
Both UIs load from CDN, which requires internet access. If your production environment has no external network access, consider leaving `ui` unset and using an external API documentation tool.
:::

## Best Practices

### 1. Use @Hidden for Internal Endpoints

```typescript
// ✅ Good: Hide health checks and internal endpoints
@Hidden()
@Controller('/internal')
export class InternalController { }

// ❌ Bad: Exposing internal endpoints in public API docs
@Controller('/internal')
export class InternalController { }
```

### 2. Keep Validators Co-located

```typescript
// ✅ Good: Validator next to its controller
// src/controllers/UserController.ts
// src/validators/CreateUserValidator.ts

// ❌ Bad: Validators scattered across the project
```

### 3. Use Response Schemas

```typescript
// ✅ Good: Document response schemas for better API docs
response() {
  return {
    200: z.object({ users: z.array(userSchema) }),
    404: { schema: z.object({ error: z.string() }), description: 'Not found' },
  };
}
```

## Related

- [Validation](/docs/concepts/validation) - Request validation with Zod, the source of the schemas
- [Controllers](/docs/concepts/controllers) - HTTP route handling
- [Middleware](/docs/concepts/middleware) - Middleware and validators
- [PostProcessor](/docs/concepts/post-processor) - The interception system this package is built on
- [Configuration](/docs/guides/configuration) - Server configuration
