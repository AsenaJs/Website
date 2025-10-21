---
title: Configuration
description: Server configuration with @Config decorator
outline: deep
---

# Configuration

Asena allows you to configure your server behavior using the `@Config` decorator. This includes global middleware, error handling, and other server-wide settings.

## Basic Configuration

Create a configuration class by extending `ConfigService` and decorating it with `@Config`:

```typescript
import { Config } from '@asenajs/asena/server';
import { ConfigService } from '@asenajs/ergenecore';

@Config()
export class AppConfig extends ConfigService {
  // Configuration goes here
}
```

## Global Middleware

Define middleware that applies to all routes:

```typescript
@Config()
export class AppConfig extends ConfigService {
  middlewares = [
    LoggerMiddleware,
    CorsMiddleware
  ];
}
```

### Pattern-Based Middleware

Apply middleware to specific route patterns:

```typescript
@Config()
export class AppConfig extends ConfigService {
  middlewares = [
    // Apply to all routes
    LoggerMiddleware,

    // Apply only to /api/* and /admin/*
    {
      middleware: AuthMiddleware,
      routes: { include: ['/api/*', '/admin/*'] }
    },

    // Apply to all except /health and /metrics
    {
      middleware: RateLimiterMiddleware,
      routes: { exclude: ['/health', '/metrics'] }
    }
  ];
}
```

## Error Handling

Configure global error handling:

```typescript
@Config()
export class AppConfig extends ConfigService {
  onError(error: Error, context: Context): Response | Promise<Response> {
    console.error('Error occurred:', error);

    // Development: Show full error details
    if (process.env.NODE_ENV === 'development') {
      return context.send({
        error: error.message,
        stack: error.stack
      }, 500);
    }

    // Production: Hide error details
    return context.send({
      error: 'Internal server error'
    }, 500);
  }
}
```

### Custom Error Types

```typescript
export class ValidationError extends Error {
  constructor(message: string, public details: any) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

@Config()
export class AppConfig extends ConfigService {
  onError(error: Error, context: Context): Response {
    if (error instanceof ValidationError) {
      return context.send({
        error: error.message,
        details: error.details
      }, 400);
    }

    if (error instanceof UnauthorizedError) {
      return context.send({
        error: error.message
      }, 401);
    }

    console.error('Unexpected error:', error);
    return context.send({
      error: 'Internal server error'
    }, 500);
  }
}
```

## Environment-Based Configuration

```typescript
@Config()
export class AppConfig extends ConfigService {
  middlewares = this.getMiddlewares();

  private getMiddlewares() {
    const middlewares = [LoggerMiddleware];

    if (process.env.NODE_ENV === 'production') {
      middlewares.push(
        RateLimiterMiddleware,
        CompressionMiddleware
      );
    }

    if (process.env.ENABLE_CORS === 'true') {
      middlewares.push(CorsMiddleware);
    }

    return middlewares;
  }

  onError(error: Error, context: Context): Response {
    const isDev = process.env.NODE_ENV === 'development';

    return context.send({
      error: error.message,
      ...(isDev && { stack: error.stack })
    }, 500);
  }
}
```

::: warning Single Configuration Class
Asena supports **only one** `@Config` class per application. If you define multiple `@Config` classes, only one will be used. Keep all your server configuration in a single class.
:::

## Asena CLI Configuration

Configure the Asena CLI build process with `asena.config.ts`:

```typescript
import { defineConfig } from '@asenajs/asena';

export default defineConfig({
  sourceFolder: 'src',
  rootFile: 'src/index.ts',
  buildOptions: {
    outdir: 'dist',
    minify: {
      whitespace: true,
      syntax: true,
      identifiers: false, //It's better for you to make this false for better debugging during the running phase of the application.
      keepNames: true
    },
  },
});
```

### Environment-Specific Build Config

```typescript
import { defineConfig } from '@asenajs/asena';

const isDev = process.env.NODE_ENV === 'development';

export default defineConfig({
  sourceFolder: 'src',
  rootFile: 'src/index.ts',
  buildOptions: {
    outdir: 'dist',
    sourcemap: isDev ? 'linked' : 'none',
    minify: isDev ? false : {
      whitespace: true,
      syntax: true,
      identifiers: true,
    },
  },
});
```

## Best Practices

### 1. Use Environment Variables

```typescript
// ✅ Good: Configuration from environment
@Config()
export class AppConfig extends ConfigService {
  middlewares = process.env.ENABLE_AUTH === 'true'
    ? [AuthMiddleware, LoggerMiddleware]
    : [LoggerMiddleware];
}
```

### 2. Separate Development and Production Config

```typescript
// ✅ Good: Different configs for different environments
@Config()
export class AppConfig extends ConfigService {
  onError(error: Error, context: Context): Response {
    const isDev = process.env.NODE_ENV === 'development';

    return context.send({
      error: error.message,
      ...(isDev && { stack: error.stack, details: error })
    }, 500);
  }
}
```

## Related Documentation

- [Middleware](/docs/concepts/middleware)
- [Error Handling](/docs/adapters/ergenecore#error-handling)
- [Asena CLI](/docs/cli/configuration)

---

**Next Steps:**
- Set up [Testing](/docs/guides/testing) for your application
- Learn about [Deployment](/docs/guides/deployment) strategies
- Explore [Middleware patterns](/docs/concepts/middleware)
