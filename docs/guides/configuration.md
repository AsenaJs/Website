---
title: Configuration
description: Server configuration with @Config decorator
outline: deep
---

# @Config - Application Configuration

The `@Config` decorator provides a centralized way to configure your Asena application, including server options, error handling, and global middleware. It allows you to customize both Bun's native server settings and Asena-specific features in a type-safe manner.

## Quick Start

::: code-group

```typescript [Ergenecore]
import type { ConfigService, Context } from '@asenajs/ergenecore';
import type { AsenaServeOptions } from '@asenajs/asena/adapter';
import { Config } from '@asenajs/asena/decorators';

@Config()
export class AppConfig implements ConfigService {
  public serveOptions(): AsenaServeOptions {
    return {
      serveOptions: {
        hostname: 'localhost',
        port: 3000,
        development: true,
      },
      wsOptions: {
        perMessageDeflate: true,
        maxPayloadLimit: 1024 * 1024, // 1MB
      },
    };
  }

  public onError(error: Error, _context: Context) {
    console.error('Application error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
```

```typescript [Hono]
import type { ConfigService, Context } from '@asenajs/hono-adapter';
import type { AsenaServeOptions } from '@asenajs/asena/adapter';
import { Config } from '@asenajs/asena/decorators';

@Config()
export class AppConfig implements ConfigService {
  public serveOptions(): AsenaServeOptions {
    return {
      serveOptions: {
        hostname: 'localhost',
        port: 3000,
        development: true,
      },
      wsOptions: {
        perMessageDeflate: true,
        maxPayloadLimit: 1024 * 1024, // 1MB
      },
    };
  }

  public onError(error: Error, _context: Context) {
    console.error('Application error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
```

:::

## API Reference

### @Config Decorator

Marks a class as the application configuration component. **Only one `@Config` class is allowed per application.**

```typescript
function Config(params?: ComponentParams | string): ClassDecorator
```

**Parameters:**
- `params` (optional) - Configuration name or component parameters

**Example:**
```typescript
@Config('AppConfig')
class AppConfig implements AsenaConfig {
  // ...
}
```

### AsenaConfig Interface

The configuration interface that your config class should implement. **All methods are optional.**

```typescript
interface AsenaConfig<C extends AsenaContext<any, any> = AsenaContext<any, any>> {
  /**
   * Configure server options
   */
  serveOptions?(): AsenaServeOptions;

  /**
   * Custom error handler for unhandled errors
   */
  onError?(error: Error, context: C): Response | Promise<Response>;

  /**
   * Global middleware configuration with pattern-based filtering
   */
  globalMiddlewares?(): Promise<GlobalMiddlewareEntry[]> | GlobalMiddlewareEntry[];

  /**
   * WebSocket transport for multi-pod messaging
   */
  transport?(): WebSocketTransport | Promise<WebSocketTransport>;
}
```

## serveOptions() Method

Configure Bun server options and WebSocket settings. This method returns `AsenaServeOptions` which contains both HTTP server configuration and WebSocket-specific options.

### Type Structure

```typescript
interface AsenaServeOptions {
  serveOptions?: AsenaServerOptions;  // Bun server configuration
  wsOptions?: WSOptions;               // WebSocket configuration
}
```

### AsenaServerOptions

Type-safe wrapper around Bun's `ServeOptions` that excludes framework-managed properties:

```typescript
type AsenaServerOptions = Omit<ServeOptions, 'fetch' | 'routes' | 'websocket' | 'error'>;
```

**❌ Excluded Options (Managed by AsenaJS):**

| Property | Managed By | Reason |
|----------|------------|--------|
| `fetch` | HTTP Adapter (e.g., HonoAdapter) | Core request handler |
| `routes` | AsenaJS decorators (@Get, @Post, etc.) | Route definitions |
| `websocket` | AsenaWebsocketAdapter | WebSocket handler |
| `error` | AsenaConfig.onError() | Error handling |

**✅ Available Options:**

| Category | Options | Description |
|----------|---------|-------------|
| **Network** | `hostname`, `port`, `unix` | Network interface binding |
| **Network** | `reusePort`, `ipv6Only` | Advanced networking |
| **Security** | `tls` | TLS/SSL configuration |
| **Performance** | `maxRequestBodySize`, `idleTimeout` | Performance tuning |
| **Development** | `development`, `id` | Development features |

### Network Configuration

Configure network interfaces and ports.

```typescript
@Config()
class AppConfig implements AsenaConfig {
  public serveOptions(): AsenaServeOptions {
    return {
      serveOptions: {
        hostname: '0.0.0.0',     // Bind to all interfaces
        port: 8080,               // Server port
        reusePort: true,          // Enable load balancing across processes
        ipv6Only: false,          // Allow both IPv4 and IPv6
      },
    };
  }
}
```

**Unix Socket Configuration:**

```typescript
public serveOptions(): AsenaServeOptions {
  return {
    serveOptions: {
      unix: '/tmp/asena.sock',  // Use Unix domain socket
    },
  };
}
```

**Dynamic Port (Random Available Port):**

```typescript
public serveOptions(): AsenaServeOptions {
  return {
    serveOptions: {
      port: 0,  // Bun will assign a random available port
    },
  };
}
```

### TLS/SSL Configuration

Configure HTTPS with TLS certificates.

```typescript
@Config()
class AppConfig implements AsenaConfig {
  public serveOptions(): AsenaServeOptions {
    return {
      serveOptions: {
        hostname: 'mydomain.com',
        port: 443,
        tls: {
          cert: Bun.file('/path/to/cert.pem'),
          key: Bun.file('/path/to/key.pem'),
          ca: Bun.file('/path/to/ca.pem'),        // Optional: CA certificate
          passphrase: 'secret',                   // Optional: Key passphrase
          serverName: 'mydomain.com',             // Optional: SNI server name
          lowMemoryMode: false,                   // Optional: Reduce memory footprint
          dhParamsFile: '/path/to/dhparams.pem',  // Optional: DH parameters
        },
      },
    };
  }
}
```

**Multiple TLS Certificates (SNI Support):**

```typescript
public serveOptions(): AsenaServeOptions {
  return {
    serveOptions: {
      tls: [
        {
          cert: Bun.file('/path/to/domain1-cert.pem'),
          key: Bun.file('/path/to/domain1-key.pem'),
          serverName: 'domain1.com',
        },
        {
          cert: Bun.file('/path/to/domain2-cert.pem'),
          key: Bun.file('/path/to/domain2-key.pem'),
          serverName: 'domain2.com',
        },
      ],
    },
  };
}
```

### Performance Configuration

Tune server performance and resource limits.

```typescript
@Config()
class AppConfig implements AsenaConfig {
  public serveOptions(): AsenaServeOptions {
    return {
      serveOptions: {
        maxRequestBodySize: 10 * 1024 * 1024,  // 10MB max body size
        idleTimeout: 120,                       // 120 seconds idle timeout
      },
    };
  }
}
```

**Options:**

- **`maxRequestBodySize`** - Maximum allowed request body size in bytes. Requests exceeding this limit will be rejected.
- **`idleTimeout`** - Maximum time (in seconds) a connection can remain idle before being closed. Default: 120 seconds.

### Development Mode

Enable development features for better debugging.

```typescript
@Config()
class AppConfig implements AsenaConfig {
  public serveOptions(): AsenaServeOptions {
    return {
      serveOptions: {
        development: process.env.NODE_ENV !== 'production',
        id: 'my-app-server',  // Used for hot reload identification
      },
    };
  }
}
```

### WebSocket Configuration (wsOptions)

Configure WebSocket-specific settings for real-time communication.

```typescript
interface WSOptions {
  maxPayloadLimit?: number;           // Maximum message size
  backpressureLimit?: number;         // Backpressure threshold
  closeOnBackpressureLimit?: boolean; // Close on backpressure
  idleTimeout?: number;               // WebSocket idle timeout
  publishToSelf?: boolean;            // Receive own published messages
  sendPings?: boolean;                // Enable automatic ping frames
  perMessageDeflate:                  // Compression configuration (required)
    | boolean
    | {
        compress?: boolean | WebSocketCompressor;
        decompress?: boolean | WebSocketCompressor;
      };
}
```

**Complete WebSocket Configuration:**

```typescript
@Config()
class AppConfig implements AsenaConfig {
  public serveOptions(): AsenaServeOptions {
    return {
      wsOptions: {
        // Size and Buffer Limits
        maxPayloadLimit: 16 * 1024 * 1024,      // 16MB (default)
        backpressureLimit: 1024 * 1024,         // 1MB backpressure threshold
        closeOnBackpressureLimit: false,        // Don't auto-close on backpressure

        // Timeout
        idleTimeout: 120,                       // 120 seconds idle timeout

        // Publishing
        publishToSelf: false,                   // Don't receive own messages

        // Keep-Alive
        sendPings: true,                        // Send automatic ping frames

        // Compression (required field)
        perMessageDeflate: true,                // Enable compression with defaults
      },
    };
  }
}
```

**WebSocket Configuration Details:**

| Option | Default | Description |
|--------|---------|-------------|
| `maxPayloadLimit` | 16 MB | Maximum message size. Larger messages close the connection. |
| `backpressureLimit` | 1 MB | Threshold for backpressure detection. Triggers `drain` event. |
| `closeOnBackpressureLimit` | `false` | Whether to close connection when backpressure limit is reached. |
| `idleTimeout` | 120 seconds | Auto-close connections exceeding idle period. |
| `publishToSelf` | `false` | Whether socket receives its own published messages. |
| `sendPings` | `true` | Enable automatic ping frames for keep-alive. |
| `perMessageDeflate` | `false` | Enable per-message compression (reduces bandwidth). **Required field.** |

**Advanced Compression Configuration:**

```typescript
public serveOptions(): AsenaServeOptions {
  return {
    wsOptions: {
      perMessageDeflate: {
        compress: true,      // Enable compression
        decompress: false,   // Disable decompression
      },
    },
  };
}
```

**Available compressor values:**
- `true` / `false` - Enable/disable with defaults
- `WebSocketCompressor` - Custom compressor configuration

## onError() Method

Custom error handler for application-wide error handling. This method is called whenever an unhandled error occurs during request processing.

```typescript
onError?(error: Error, context: C): Response | Promise<Response>
```

**Parameters:**
- `error` - The error that occurred
- `context` - The Asena context for the current request

**Returns:** `Response` or `Promise<Response>`

### Basic Error Handler

```typescript
@Config()
class AppConfig implements AsenaConfig {
  public onError(error: Error, context: AsenaContext<any, any>) {
    console.error('Application error:', error);

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
```

### Production Error Handler

Hide sensitive error details in production.

```typescript
@Config()
class AppConfig implements AsenaConfig {
  public onError(error: Error, context: AsenaContext<any, any>) {
    const isDevelopment = process.env.NODE_ENV !== 'production';

    // Log full error details
    console.error('[ERROR]', {
      message: error.message,
      stack: error.stack,
      url: context.req.url,
    });

    // Return appropriate response
    if (isDevelopment) {
      return new Response(
        JSON.stringify({
          error: error.message,
          stack: error.stack,
          url: context.req.url,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Internal Server Error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
```

### Error Handler with Dependency Injection

Integrate with dependency injection for advanced error handling.

```typescript
@Config()
class AppConfig implements AsenaConfig {
  @Inject(LoggerService)
  private logger!: LoggerService;

  @Inject(ErrorReportingService)
  private errorReporter!: ErrorReportingService;

  public async onError(error: Error, context: AsenaContext<any, any>) {
    // Log to logging service
    await this.logger.error('Unhandled error', {
      error: error.message,
      stack: error.stack,
      url: context.req.url,
    });

    // Report to external service (Sentry, etc.)
    await this.errorReporter.report(error);

    // Return user-friendly error
    return new Response(
      JSON.stringify({
        error: 'Something went wrong. Please try again later.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
```

## globalMiddlewares() Method

Configure global middleware that applies to all or specific routes. Supports both simple array syntax and pattern-based filtering.

```typescript
globalMiddlewares?(): Promise<GlobalMiddlewareEntry[]> | GlobalMiddlewareEntry[]
```

**Returns:** Array of middleware classes or `GlobalMiddlewareEntry` objects

### Simple Global Middleware

Apply middleware to all routes.

```typescript
@Config()
class AppConfig implements AsenaConfig {
  public globalMiddlewares() {
    return [
      LoggerMiddleware,
      CorsMiddleware,
      CompressionMiddleware,
    ];
  }
}
```

### Pattern-Based Middleware

Apply middleware to specific route patterns using `include` and `exclude` filters.

```typescript
@Config()
class AppConfig implements AsenaConfig {
  public globalMiddlewares() {
    return [
      // Apply to all routes
      LoggerMiddleware,

      // Apply only to /api/* and /admin/* routes
      {
        middleware: AuthMiddleware,
        routes: {
          include: ['/api/*', '/admin/*'],
        },
      },

      // Apply to all routes except /health and /metrics
      {
        middleware: RateLimitMiddleware,
        routes: {
          exclude: ['/health', '/metrics'],
        },
      },

      // Complex pattern: only /api/* but not /api/public/*
      {
        middleware: JwtMiddleware,
        routes: {
          include: ['/api/*'],
          exclude: ['/api/public/*'],
        },
      },
    ];
  }
}
```

### GlobalMiddlewareEntry

```typescript
type GlobalMiddlewareEntry =
  | MiddlewareClass
  | {
      middleware: MiddlewareClass;
      routes?: {
        include?: string[];  // Glob patterns to include
        exclude?: string[];  // Glob patterns to exclude
      };
    };
```

**Pattern Matching:**
- `*` - Matches any characters except `/`
- `**` - Matches any characters including `/`
- `/api/*` - Matches `/api/users` but not `/api/v1/users`
- `/api/**` - Matches `/api/users` and `/api/v1/users`

### Execution Order

Middleware executes in the order defined in the array:

```typescript
public globalMiddlewares() {
  return [
    LoggerMiddleware,        // 1. Runs first
    AuthMiddleware,          // 2. Runs second
    ValidationMiddleware,    // 3. Runs third
    RateLimitMiddleware,     // 4. Runs last
  ];
}
```

### Async Global Middleware

The method can return a Promise for async configuration.

```typescript
@Config()
class AppConfig implements AsenaConfig {
  @Inject(ConfigService)
  private configService!: ConfigService;

  public async globalMiddlewares() {
    const config = await this.configService.load();

    const middlewares = [LoggerMiddleware];

    if (config.enableAuth) {
      middlewares.push(AuthMiddleware);
    }

    if (config.enableRateLimit) {
      middlewares.push(RateLimitMiddleware);
    }

    return middlewares;
  }
}
```

## transport() Method

Configure the WebSocket transport for cross-pod messaging. When not specified, Asena uses `BunLocalTransport` which calls `server.publish()` directly — zero overhead for single-pod deployments.

```typescript
transport?(): WebSocketTransport | Promise<WebSocketTransport>
```

**Returns:** A `WebSocketTransport` instance

### Single-Pod (Default)

No configuration needed. Asena uses `BunLocalTransport` automatically.

### Multi-Pod with RedisTransport

For multi-pod deployments, return a `RedisTransport` instance to synchronize WebSocket messages across pods via Redis pub/sub:

::: code-group

```typescript [With Injected Redis]
import { Config } from '@asenajs/asena/decorators';
import { Inject } from '@asenajs/asena/decorators/ioc';
import { ConfigService } from '@asenajs/hono-adapter'; // or '@asenajs/ergenecore'
import { RedisTransport } from '@asenajs/asena-redis';

@Config()
export class AppConfig extends ConfigService {

  @Inject('AppRedis')
  private redis: AppRedis;

  public transport() {
    return new RedisTransport(this.redis);
  }

}
```

```typescript [Standalone]
import { Config } from '@asenajs/asena/decorators';
import { ConfigService } from '@asenajs/hono-adapter'; // or '@asenajs/ergenecore'
import { RedisTransport } from '@asenajs/asena-redis';

@Config()
export class AppConfig extends ConfigService {

  public transport() {
    return new RedisTransport({ url: 'redis://localhost:6379' });
  }

}
```

:::

::: info
For details on how transport works with WebSocket pub/sub, see [WebSocket - Multi-Pod](/docs/concepts/websocket#multi-pod-websocket). For RedisTransport setup and configuration, see [Redis Package](/docs/packages/redis#multi-pod-websocket-transport).
:::

## Complete Example

A real-world configuration example combining all features:

::: code-group

```typescript [Ergenecore]
import { Config, Inject, Service } from '@asenajs/asena/decorators';
import type { ConfigService, Context } from '@asenajs/ergenecore';
import type { AsenaServeOptions } from '@asenajs/asena/adapter';

@Service()
class LoggerService {
  public error(message: string, meta: any) {
    console.error(`[ERROR] ${message}`, meta);
  }
}

@Config()
export class AppConfig implements ConfigService {
  @Inject(LoggerService)
  private logger!: LoggerService;

  public serveOptions(): AsenaServeOptions {
    const isProduction = process.env.NODE_ENV === 'production';

    return {
      serveOptions: {
        hostname: process.env.HOSTNAME || '0.0.0.0',
        port: parseInt(process.env.PORT || '3000', 10),
        development: !isProduction,
        maxRequestBodySize: 10 * 1024 * 1024,  // 10MB
        idleTimeout: isProduction ? 30 : 120,
        tls: isProduction
          ? {
              cert: Bun.file(process.env.TLS_CERT!),
              key: Bun.file(process.env.TLS_KEY!),
            }
          : undefined,
      },
      wsOptions: {
        perMessageDeflate: isProduction,
        maxPayloadLimit: 5 * 1024 * 1024,  // 5MB
        backpressureLimit: 1024 * 1024,     // 1MB
        closeOnBackpressureLimit: false,
        idleTimeout: 120,
        sendPings: true,
        publishToSelf: false,
      },
    };
  }

  public async onError(error: Error, context: Context) {
    await this.logger.error('Unhandled error', {
      error: error.message,
      stack: error.stack,
      url: context.getUrl(),
    });

    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction) {
      return context.send({ error: 'Internal Server Error' }, 500);
    }

    return context.send({
      error: error.message,
      stack: error.stack,
    }, 500);
  }

  public globalMiddlewares() {
    return [
      LoggerMiddleware,
      {
        middleware: AuthMiddleware,
        routes: {
          include: ['/api/**'],
          exclude: ['/api/public/**'],
        },
      },
      {
        middleware: RateLimitMiddleware,
        routes: {
          exclude: ['/health'],
        },
      },
    ];
  }
}
```

```typescript [Hono]
import { Config, Inject, Service } from '@asenajs/asena/decorators';
import type { ConfigService, Context } from '@asenajs/hono-adapter';
import type { AsenaServeOptions } from '@asenajs/asena/adapter';

@Service()
class LoggerService {
  public error(message: string, meta: any) {
    console.error(`[ERROR] ${message}`, meta);
  }
}

@Config()
export class AppConfig implements ConfigService {
  @Inject(LoggerService)
  private logger!: LoggerService;

  public serveOptions(): AsenaServeOptions {
    const isProduction = process.env.NODE_ENV === 'production';

    return {
      serveOptions: {
        hostname: process.env.HOSTNAME || '0.0.0.0',
        port: parseInt(process.env.PORT || '3000', 10),
        development: !isProduction,
        maxRequestBodySize: 10 * 1024 * 1024,  // 10MB
        idleTimeout: isProduction ? 30 : 120,
        tls: isProduction
          ? {
              cert: Bun.file(process.env.TLS_CERT!),
              key: Bun.file(process.env.TLS_KEY!),
            }
          : undefined,
      },
      wsOptions: {
        perMessageDeflate: isProduction,
        maxPayloadLimit: 5 * 1024 * 1024,  // 5MB
        backpressureLimit: 1024 * 1024,     // 1MB
        closeOnBackpressureLimit: false,
        idleTimeout: 120,
        sendPings: true,
        publishToSelf: false,
      },
    };
  }

  public async onError(error: Error, context: Context) {
    await this.logger.error('Unhandled error', {
      error: error.message,
      stack: error.stack,
      url: context.req.url,
    });

    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction) {
      return context.json({ error: 'Internal Server Error' }, 500);
    }

    return context.json({
      error: error.message,
      stack: error.stack,
    }, 500);
  }

  public globalMiddlewares() {
    return [
      LoggerMiddleware,
      {
        middleware: AuthMiddleware,
        routes: {
          include: ['/api/**'],
          exclude: ['/api/public/**'],
        },
      },
      {
        middleware: RateLimitMiddleware,
        routes: {
          exclude: ['/health'],
        },
      },
    ];
  }
}
```

:::

## Technical Details

### Bootstrap Lifecycle

The `@Config` decorator is processed during the application bootstrap sequence:

1. **Phase: CONTAINER_INIT** - IoC container initializes
2. **Phase: IOC_ENGINE_INIT** - Component discovery begins
3. **Phase: USER_COMPONENTS_SCAN** - Config class is discovered and registered
4. **Phase: USER_COMPONENTS_INIT** - Config instance is created
5. **Phase: APPLICATION_SETUP** - Config methods are applied:
   - `serveOptions()` is called and passed to adapter
   - `onError()` is registered as error handler
   - `globalMiddlewares()` is called and middleware are registered
6. **Phase: SERVER_READY** - Server starts with applied configuration

### Singleton Validation

AsenaJS enforces a single `@Config` instance per application. If multiple `@Config` classes are detected, an error is thrown during bootstrap.

```typescript
// ✅ Valid: Single config
@Config()
class AppConfig implements AsenaConfig { }

// ❌ Invalid: Multiple configs (throws error during bootstrap)
@Config()
class AppConfig1 implements AsenaConfig { }

@Config()
class AppConfig2 implements AsenaConfig { }  // Error!
```

### Dependency Injection in Config

Config classes are regular components in the IoC container, so you can use `@Inject` to inject other services:

```typescript
@Config()
class AppConfig implements AsenaConfig {
  @Inject(DatabaseService)
  private db!: DatabaseService;

  @Inject(LoggerService)
  private logger!: LoggerService;

  public async serveOptions(): Promise<AsenaServeOptions> {
    const settings = await this.db.getSettings();
    return {
      serveOptions: {
        port: settings.port,
        hostname: settings.hostname,
      },
    };
  }
}
```

::: info Async Configuration
When using async operations in `serveOptions()`, the method can return `Promise<AsenaServeOptions>`.
:::

## Best Practices

### ✅ Do's

1. **Use Environment Variables**
   ```typescript
   port: parseInt(process.env.PORT || '3000', 10),
   hostname: process.env.HOSTNAME || 'localhost',
   ```

2. **Separate Development and Production Configuration**
   ```typescript
   const isProduction = process.env.NODE_ENV === 'production';

   development: !isProduction,
   idleTimeout: isProduction ? 30 : 120,
   ```

3. **Keep Config Simple**
   - Config should focus on configuration, not business logic
   - Use services for complex logic, inject them if needed

4. **Enable Compression in Production**
   ```typescript
   wsOptions: {
     perMessageDeflate: process.env.NODE_ENV === 'production',
   }
   ```

5. **Log Errors Properly**
   ```typescript
   public onError(error: Error, context: AsenaContext<any, any>) {
     console.error('[ERROR]', {
       message: error.message,
       stack: error.stack,
       url: context.req.url,
     });
     // Return response...
   }
   ```

### ❌ Don'ts

1. **Don't Create Multiple @Config Classes**
   ```typescript
   // ❌ Wrong: Only one @Config allowed per application
   @Config()
   class Config1 { }

   @Config()
   class Config2 { }  // Error!
   ```

2. **Don't Try to Set Framework-Managed Properties**
   ```typescript
   // ❌ Wrong: These cause TypeScript compile errors
   serveOptions: {
     fetch: () => new Response(),     // Compile error!
     routes: { '/': new Response() }, // Compile error!
     websocket: { /* ... */ },        // Compile error!
   }
   ```

3. **Don't Hardcode Secrets**
   ```typescript
   // ❌ Wrong: Never hardcode secrets
   tls: {
     key: Bun.file('/path/to/key.pem'),
     passphrase: 'mySecretPassword123',  // Use env vars!
   }
   ```

4. **Don't Forget perMessageDeflate When Using WebSockets**
   ```typescript
   // ❌ Wrong: perMessageDeflate is required in WSOptions
   wsOptions: {
     maxPayloadLimit: 1024,
     // Missing perMessageDeflate!
   }

   // ✅ Correct
   wsOptions: {
     perMessageDeflate: true,
     maxPayloadLimit: 1024,
   }
   ```

## Troubleshooting

### "Only one config instance is allowed"

**Error:** Multiple `@Config` classes are defined in your application.

**Solution:** Keep only one `@Config` class. Use conditionals for environment-specific configs:

```typescript
@Config()
class AppConfig implements AsenaConfig {
  public serveOptions(): AsenaServeOptions {
    if (process.env.NODE_ENV === 'production') {
      return { /* production config */ };
    }
    return { /* development config */ };
  }
}
```

### Type Errors with serveOptions

**Error:** TypeScript complains about `fetch`, `routes`, `websocket`, or `error` properties.

**Solution:** These properties are excluded from `AsenaServerOptions`:

```typescript
// ❌ Wrong: TypeScript will show errors
serveOptions: {
  fetch: () => new Response(),  // Not allowed!
}

// ✅ Correct
serveOptions: {
  port: 3000,
  hostname: 'localhost',
  tls: { /* ... */ },
}
```

### WebSocket Configuration Not Working

**Problem:** WebSocket options don't seem to apply.

**Solution:** Use `wsOptions`, not `serveOptions.websocket`:

```typescript
// ❌ Wrong
{
  serveOptions: {
    websocket: { /* ... */ },  // Not allowed!
  }
}

// ✅ Correct
{
  wsOptions: {
    perMessageDeflate: true,
    maxPayloadLimit: 1024 * 1024,
  }
}
```

## Related Documentation

- [Middleware](/docs/concepts/middleware) - Learn about middleware patterns
- [Error Handling](/docs/guides/error-handling) - Advanced error handling strategies
- [WebSocket](/docs/concepts/websocket) - WebSocket implementation guide
- [CLI Configuration](/docs/cli/configuration) - Asena CLI build configuration

---

**Next Steps:**
- Learn about [Middleware patterns](/docs/concepts/middleware)
- Explore [Error Handling](/docs/guides/error-handling) strategies
- Set up [WebSocket](/docs/concepts/websocket) communication
