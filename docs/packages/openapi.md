---
title: Asena OpenAPI
description: Automatic OpenAPI 3.1 spec generation for Asena
outline: deep
---

# Asena OpenAPI

Automatic OpenAPI 3.1 spec generation for AsenaJS — zero config, uses your existing validators. Your `@Controller` routes and validator schemas (`json()`, `query()`, `param()`, `response()`) are automatically converted to a full OpenAPI specification. No extra annotations needed.

## Features

- **Zero Config** - Extracts schemas from existing validators, no extra annotations needed
- **OpenAPI 3.1** - Generates JSON Schema draft-2020-12 compatible spec
- **Built-in Swagger UI** - CDN-based UI page, no npm install required
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
- [Bun](https://bun.sh) v1.3.11 or higher
- [@asenajs/asena](https://github.com/AsenaJs/Asena) v0.7.0 or higher
- [Zod](https://zod.dev) v4.3 or higher

## Quick Start

```typescript
import { OpenApi, OpenApiPostProcessor } from '@asenajs/asena-openapi';

@OpenApi({
  info: { title: 'My API', version: '1.0.0' },
  path: '/api/openapi',
  ui: true, // Swagger UI at /api/openapi/ui
})
export class AppOpenApi extends OpenApiPostProcessor {}
```

Asena automatically discovers it — that's it.

Now:

- `GET /api/openapi` → OpenAPI 3.1 JSON spec
- `GET /api/openapi/ui` → Swagger UI page

::: tip Zero Setup
You don't need to register `AppOpenApi` anywhere. Asena's IoC container automatically discovers and initializes it during bootstrap, just like any other component.
:::

## How It Works

The `OpenApiPostProcessor` automatically:

1. **Intercepts** every `@Controller` during IoC setup
2. **Extracts** route metadata (`@Get`, `@Post`, `@Put`, `@Delete`)
3. **Resolves** validators and converts their Zod schemas to JSON Schema
4. **Generates** a complete OpenAPI 3.1 spec
5. **Registers** GET endpoints on the adapter for spec and Swagger UI

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
  ui: true,                  // Default: false — enables Swagger UI at {path}/ui
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
| `ui` | `boolean` | `false` | Enable Swagger UI at `{path}/ui` |
| `servers` | `ServerObject[]` | — | Server URLs for the spec |
| `converters` | `SchemaConverter[]` | `[ZodSchemaConverter]` | Schema converters |

## Swagger UI

When `ui: true`, a Swagger UI page is served at `{path}/ui`. It loads from CDN — zero npm dependencies:

- Uses `swagger-ui-dist@5` from unpkg CDN
- No build step required
- Works in development and production

::: warning Production Consideration
Swagger UI loads from CDN, which requires internet access. If your production environment has no external network access, consider setting `ui: false` and using an external API documentation tool.
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

## Related Documentation

- [Validation](/docs/concepts/validation) - Request validation with Zod
- [Controllers](/docs/concepts/controllers) - HTTP route handling
- [Middleware](/docs/concepts/middleware) - Middleware and validators
- [Configuration](/docs/guides/configuration) - Server configuration

---

**Next Steps:**
- Set up [request validation](/docs/concepts/validation) with Zod
- Learn about [Controllers](/docs/concepts/controllers)
- Explore [Middleware patterns](/docs/concepts/middleware)