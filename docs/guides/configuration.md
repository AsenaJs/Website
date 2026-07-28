---
title: Configuration
description: Configure the server with @Config - global middleware, error handling, environment variables, and microservice transports
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
        development: true,
        // port comes from AsenaServerFactory.create({ port }) - see Network Configuration
      },
      wsOptions: {
        perMessageDeflate: true,
        idleTimeout: 120,
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
        development: true,
        // port comes from AsenaServerFactory.create({ port }) - see Network Configuration
      },
      wsOptions: {
        perMessageDeflate: true,
        idleTimeout: 120,
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
   * Answers a request that matched no route
   */
  onNotFound?(context: C, request: NotFoundRequest): Response | Promise<Response>;

  /**
   * Global middleware configuration with pattern-based filtering
   */
  globalMiddlewares?(): Promise<GlobalMiddlewareEntry[]> | GlobalMiddlewareEntry[];

  /**
   * WebSocket and/or microservice transport configuration
   */
  transport?():
    | WebSocketTransport
    | AsenaTransportConfig
    | Promise<WebSocketTransport | AsenaTransportConfig>;
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

```typescript
@Config()
class AppConfig implements AsenaConfig {
  public serveOptions(): AsenaServeOptions {
    return {
      serveOptions: {
        reusePort: true,          // Enable load balancing across processes
        ipv6Only: false,          // Allow both IPv4 and IPv6
      },
    };
  }
}
```

::: danger `port` and `hostname` do not belong here
**`port`** is always overwritten. `AsenaServer.start()` pushes the port from
`AsenaServerFactory.create({ port })` into the adapter on every start, after
`serveOptions()` has been read - so a `port` (including `port: 0`) inside `serveOptions`
never takes effect. Set it on the factory:

```typescript
const server = await AsenaServerFactory.create({ adapter, logger, port: 8080 });
```

**`hostname`** is adapter-specific. Hono honours `serveOptions.hostname`; Ergenecore
overwrites it with the value given to the factory function:

```typescript
const adapter = createErgenecoreAdapter({ hostname: '0.0.0.0' });
```
:::

**Unix Socket Configuration:**

A unix socket is a *start* option, not a serve option - Bun rejects `hostname` and `unix`
together, so the framework only wires it through `start()`:

```typescript
await server.start({ unix: '/tmp/asena.sock' });
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
- **`idleTimeout`** - Maximum time (in seconds) an HTTP connection can remain idle before being closed. Bun's default is **10 seconds** (the 120 s default belongs to `wsOptions.idleTimeout`).

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
  maxPayloadLimit?: number;           // See the caveat below - currently not applied
  backpressureLimit?: number;         // Backpressure threshold
  closeOnBackpressureLimit?: boolean; // Close on backpressure
  idleTimeout?: number;               // WebSocket idle timeout
  publishToSelf?: boolean;            // Receive own published messages
  sendPings?: boolean;                // See the caveat below - superseded by sendPingStrategy
  sendPingStrategy?: 'adapter' | 'native'; // Keep-alive mechanism (default 'adapter')
  heartbeatInterval?: number;         // Heartbeat period in ms, 'adapter' strategy only
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

        // Keep-Alive ('adapter' is the default; 'native' delegates to Bun)
        sendPingStrategy: 'adapter',
        heartbeatInterval: 30_000,              // no heartbeat is sent without this

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
| `maxPayloadLimit` | 16 MB | Intended as the maximum message size. **Currently has no effect** - see the caveat below. |
| `backpressureLimit` | 16 MB (Bun's default) | Threshold for backpressure detection. Triggers `drain` event. |
| `closeOnBackpressureLimit` | `false` | Whether to close connection when backpressure limit is reached. |
| `idleTimeout` | 120 seconds | Auto-close connections exceeding idle period. |
| `publishToSelf` | `false` | Whether socket receives its own published messages. |
| `sendPings` | — | **Ignored.** Superseded by `sendPingStrategy`; the adapters overwrite whatever you pass. |
| `sendPingStrategy` | `'adapter'` | `'adapter'` uses the framework's own `ws.ping()` heartbeat; `'native'` hands keep-alive to Bun. |
| `heartbeatInterval` | — | Heartbeat period in ms for the `'adapter'` strategy. With no value, no heartbeat is sent. |
| `perMessageDeflate` | `false` | Enable per-message compression (reduces bandwidth). **Required field.** |

::: warning `maxPayloadLimit` is not applied
The adapters forward `wsOptions` to `Bun.serve()` verbatim, but Bun's option is named
`maxPayloadLength`. `maxPayloadLimit` is therefore an unknown key that Bun silently drops,
and the cap stays at Bun's 16 MB default. Do not rely on it to bound message size.
:::

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

## onNotFound() Method

Answers a request that matched no route. Separate from `onError` on purpose: nothing threw, the
router simply had nowhere to send the request, so neither handler has to ask which case it is
looking at.

```typescript
onNotFound?(context: C, request: NotFoundRequest): Response | Promise<Response>
```

**Parameters:**
- `context` - The request context
- `request` - `{ path, method }`, normalised by the adapter

**Returns:** `Response` or `Promise<Response>`

### Basic Usage

```typescript
import { Config } from '@asenajs/asena/decorators';
import type { NotFoundRequest } from '@asenajs/asena/adapter';
import { ConfigService, type Context } from '@asenajs/hono-adapter';

@Config()
export class AppConfig extends ConfigService {

  public onNotFound(context: Context, request: NotFoundRequest) {
    return context.send({
      type: 'about:blank',
      title: 'Not Found',
      status: 404,
      instance: request.path
    }, 404);
  }

}
```

`request.path` carries the path only - no origin, no query string - and `request.method` is the
upper-case verb. Both adapters produce identical values, so the same body works under either.

### Defaults

With no `onNotFound` declared, both adapters answer `{"error":"Not Found"}` with status `404` and
`Content-Type: application/json`.

Global middlewares run **before** `onNotFound` on both adapters, so a 404 still carries CORS
headers and anything else you apply to every request.

If the hook throws, the adapter logs it and falls back to the default 404 rather than taking the
server down. It is deliberately **not** routed to `onError`.

::: warning Not for domain 404s
When the route exists but the record does not, throw instead - that reaches `onError` like any
other application decision:

```typescript
if (!user) {
  throw new HttpException(404, { code: 'USER_NOT_FOUND' });
}
```
:::


## globalMiddlewares() Method

Configure global middleware that applies to all or specific routes. Supports both simple array syntax and pattern-based filtering.

```typescript
globalMiddlewares?(): Promise<GlobalMiddlewareEntry[]> | GlobalMiddlewareEntry[]
```

**Returns:** Array of middleware classes or `GlobalMiddlewareEntry` objects

::: danger It must be a method, not a property
Asena reads global middleware by calling `globalMiddlewares()`. A `middlewares = [...]`
property on the config class is never read - the server starts normally and the middleware
simply never runs.

The server warns at startup when it finds such a property, but the warning is scrollback:
if middleware seems to be skipped, check the shape of this hook first.
:::

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

A `*` matches any characters **including `/`**, so a pattern covers every path below it.
`**` is not a separate construct - it compiles to the same regex as `*`.

| Path | `/api/*` | `/api/**` |
|:-----|:---------|:----------|
| `/api/users` | ✅ | ✅ |
| `/api/v1/users` | ✅ | ✅ |
| `/api` (no trailing segment) | ❌ | ❌ |

Other forms: an exact path (`/health`) matches literally, trailing slashes are normalized,
and `:param` patterns (`/users/:id`) match a single segment.

::: danger `/api/*` is recursive
A wildcard does **not** stop at the next `/`. If you write
`{ middleware: AuthMiddleware, routes: { include: ['/api/*'] } }` it protects
`/api/v1/admin/users` too - which is usually what you want, but is the opposite of a
single-segment glob. Conversely `include: ['/api/*']` does **not** cover the bare `/api`
path; list it explicitly if you need it.
:::

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

Configure the transport layer: cross-pod **WebSocket** messaging and/or **microservice** messaging. Two return forms are supported:

```typescript
transport?(): WebSocketTransport | AsenaTransportConfig | Promise<WebSocketTransport | AsenaTransportConfig>
```

1. **Bare `WebSocketTransport`** (backward compatible) — configures only the WebSocket transport. When not specified, Asena uses `BunLocalTransport` which calls `server.publish()` directly — zero overhead for single-pod deployments.
2. **`AsenaTransportConfig` object** — configures WebSocket and microservice transports separately, plus messaging interceptors:

```typescript
interface AsenaTransportConfig {
  websocket?: WebSocketTransport;                                       // cross-pod WS
  microservice?: MicroserviceTransport | Record<string, MicroserviceTransport>; // single or named map
  interceptors?: MessagingInterceptor[];                                // e.g. otelMessaging()
}
```

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

### Microservice Messaging (Object Form)

Use the object form to add a microservice transport — with or without a WebSocket transport:

```typescript
import { Config } from '@asenajs/asena/decorators';
import { RedisTransport, RedisMicroserviceTransport } from '@asenajs/asena-redis';
import { otelMessaging } from '@asenajs/asena-otel';

@Config()
export class AppConfig extends ConfigService {

  public transport() {
    return {
      websocket: new RedisTransport({ url: 'redis://localhost:6379' }),      // optional
      microservice: new RedisMicroserviceTransport(
        { url: 'redis://localhost:6379' },                                   // connection
        { serviceName: 'order-service' },                                    // required options
      ),
      interceptors: [otelMessaging({ system: 'redis' })],                    // optional
    };
  }

}
```

A single microservice transport is registered under the name `default`. Multi-broker projects can pass a named map instead and bind controllers per transport — see [Microservices - Multiple Named Transports](/docs/concepts/microservices#multiple-named-transports).

::: info
For details on how transport works with WebSocket pub/sub, see [WebSocket - Multi-Pod](/docs/concepts/websocket#multi-pod-websocket). For RedisTransport setup and configuration, see [Redis Package](/docs/packages/redis#multi-pod-websocket-transport). For microservice messaging concepts, see [Microservices](/docs/concepts/microservices).
:::

## Complete Example

A real-world configuration example combining all features:

::: code-group

```typescript [Ergenecore]
import { Config, Service } from '@asenajs/asena/decorators';
import { Inject } from '@asenajs/asena/decorators/ioc';
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
        // port/hostname are not read from here - see Network Configuration
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
import { Config, Service } from '@asenajs/asena/decorators';
import { Inject } from '@asenajs/asena/decorators/ioc';
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
        // port/hostname are not read from here - see Network Configuration
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
   - `onNotFound()` is registered as the unmatched-route handler
   - `globalMiddlewares()` is called and middleware are registered
   - `transport()` is called and the WebSocket / microservice transports are wired
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

::: warning Async `serveOptions()` - runtime yes, types no
The adapters `await` the result, so returning a Promise works at runtime. But
`AsenaConfig.serveOptions?(): AsenaServeOptions` declares a synchronous return, so a class
that `implements AsenaConfig` / `extends ConfigService` cannot legally declare the method
`async`. Prefer resolving async values before the server starts and passing them in, or
widen the type at the call site.
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

### "Only one config is allowed"

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
