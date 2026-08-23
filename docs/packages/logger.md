---
title: AsenaLogger
description: Winston-based structured logging with AsenaLogger - log levels, transports (console, file, Loki), and profiling
outline: deep
---

# AsenaLogger

**AsenaLogger** is Asena's official logging package built on Winston, providing beautifully formatted console output, performance profiling, and seamless integration with both adapters.

## Installation

```bash
bun add @asenajs/asena-logger
```

**Requirements:**
- [Bun](https://bun.sh) v1.3.12 or higher
- TypeScript v5.8.3 or higher

The package has no peer dependency on `@asenajs/asena` - it only implements the
`ServerLogger` shape, so it works with any version.

## Quick Start

::: code-group

```typescript [Ergenecore]
import { AsenaServerFactory } from '@asenajs/asena';
import { createErgenecoreAdapter } from '@asenajs/ergenecore';
import { AsenaLogger } from '@asenajs/asena-logger';

// Create logger
export const logger = new AsenaLogger();

// Create adapter
const adapter = createErgenecoreAdapter();

// Create and start server
const server = await AsenaServerFactory.create({
  adapter,
  logger,
  port: 3000
});

await server.start();
```

```typescript [Hono]
import { AsenaServerFactory } from '@asenajs/asena';
import { createHonoAdapter } from '@asenajs/hono-adapter';
import { AsenaLogger } from '@asenajs/asena-logger';

// Create logger
export const logger = new AsenaLogger();

// Create adapter - returns a tuple, and the logger is required
const [adapter] = createHonoAdapter({ logger });

// Create and start server
const server = await AsenaServerFactory.create({
  adapter,
  logger,
  port: 3000
});

await server.start();
```

:::

## Using Logger in Your Application

### Recommended: Global Export

The most common pattern in Asena is to export the logger and use it directly:

```typescript
// src/logger.ts
import { AsenaLogger } from '@asenajs/asena-logger';

export const logger = new AsenaLogger();
```

The constructor also takes an optional Winston logger and an options object, which is the
simplest way to change the level or add transports without building a Winston logger
yourself:

```typescript
export const logger = new AsenaLogger(undefined, {
  level: 'debug',
  transports: [/* extra Winston transports */],
});
```

```typescript
// src/services/UserService.ts
import { Service } from '@asenajs/asena/decorators';
import { Inject } from '@asenajs/asena/decorators/ioc';
import { logger } from '../logger';

@Service()
export class UserService {
  @Inject(UserRepository)
  private userRepository: UserRepository;

  async getUsers() {
    logger.info('Getting users from the database');
    return await this.userRepository.getUsers();
  }

  async createUser(data: { name: string; email: string }) {
    logger.info('Creating user', { email: data.email });

    try {
      const user = await this.userRepository.create(data);
      logger.info('User created successfully', { userId: user.id });
      return user;
    } catch (error) {
      logger.error('Failed to create user', error);
      throw error;
    }
  }
}
```

### Alternative: IoC Injection

You can also inject the logger using the IoC container:

```typescript
import { Service } from '@asenajs/asena/decorators';
import { Inject } from '@asenajs/asena/decorators/ioc';
import { ICoreServiceNames } from '@asenajs/asena/ioc/types';
import type { ServerLogger } from '@asenajs/asena/logger';

@Service()
export class UserService {
  @Inject(ICoreServiceNames.SERVER_LOGGER)
  private logger!: ServerLogger;

  @Inject(UserRepository)
  private userRepository: UserRepository;

  async getUsers() {
    this.logger.info('Getting users from the database');
    return await this.userRepository.getUsers();
  }
}
```

::: tip Which Approach to Use?
**Global Export (Recommended):**
- ✅ Simpler and more straightforward
- ✅ Works everywhere (services, utilities, helpers)
- ✅ Common pattern in Asena applications

**IoC Injection:**
- ✅ Better for unit testing (easier to mock)
- ✅ Follows strict dependency injection principles
- ✅ Useful when you need to swap logger implementations

Most Asena applications use the global export pattern for simplicity.
:::

## AsenaLogger API

### info(message, meta?)

Log informational messages.

```typescript
logger.info('Server started successfully');
logger.info('User logged in', { userId: 123, ip: '192.168.1.1' });
```

### error(message, meta?)

Log error messages with optional error object.

```typescript
logger.error('Database connection failed');
logger.error('Payment processing error', new Error('Insufficient funds'));
```

### warn(message, meta?)

Log warning messages.

```typescript
logger.warn('High memory usage detected', { usage: '85%' });
logger.warn('API rate limit approaching', { remaining: 5 });
```

### debug(message, meta?)

Log debug-level information (useful during development).

```typescript
logger.debug('Request received', { method: 'GET', path: '/api/users' });
logger.debug('Cache hit', { key: 'user:123' });
```

### log(level, message, meta?)

Log at a custom level.

```typescript
logger.log('verbose', 'Detailed operation info', { step: 1 });
logger.log('info', 'Custom informational message');
```

### profile(id)

Start/stop profiling with the given ID. Call once to start, call again with the same ID to stop and log elapsed time.

```typescript
logger.profile('expensive-operation');

// ... perform expensive operation

logger.profile('expensive-operation'); // Logs: "expensive-operation 1234ms"
```

## Log Levels

AsenaLogger supports the following log levels (in order of priority):

AsenaLogger uses Winston's default `npm` levels:

| Level     | Priority | Description                     | Color      |
|:----------|:---------|:--------------------------------|:-----------|
| `error`   | 0        | Error conditions                | Red        |
| `warn`    | 1        | Warning conditions              | Yellow     |
| `info`    | 2        | Informational messages          | Green      |
| `http`    | 3        | HTTP-level messages             | uncoloured |
| `verbose` | 4        | Detailed informational messages | uncoloured |
| `debug`   | 5        | Debug-level messages            | Blue       |
| `silly`   | 6        | Everything                      | uncoloured |

Only `error`, `warn`, `info` and `debug` have a colour mapping; other levels print
uppercased and uncoloured.

## Output Format

```
2025-10-15 14:30:45 [INFO]:     Server starting
2025-10-15 14:30:45 [WARN]:     Resource usage high {
  "memory": "85%"
}
2025-10-15 14:30:45 [ERROR]:    Failed to connect to database Connection timeout
Error: Connection timeout
    at connectToDatabase (/app/services/db.ts:42:11)
    at startServer (/app/index.ts:23:5)
    ...
2025-10-15 14:30:45 [PROFILE]:  database-query 125ms
```

## Real-World Examples

### Middleware Logging

```typescript
import { Middleware } from '@asenajs/asena/decorators';
import { MiddlewareService, type Context } from '@asenajs/ergenecore';
import { logger } from '../logger';

@Middleware()
export class RequestLoggerMiddleware extends MiddlewareService {
  async handle(context: Context, next: () => Promise<void>) {
    const start = Date.now();
    const method = context.req.method;
    const url = context.req.url;

    logger.info('Request started', { method, url });

    await next();

    const duration = Date.now() - start;
    logger.info('Request completed', { method, url, duration });
  }
}
```

### Error Handling in Config

```typescript
import { Config } from '@asenajs/asena/decorators';
import { ConfigService, type Context } from '@asenajs/ergenecore';
import { logger } from '../logger';

@Config()
export class ServerConfig extends ConfigService {
  onError(error: Error, context: Context): Response {
    logger.error('Unhandled error', {
      error: error.message,
      stack: error.stack,
      url: context.req.url,
      method: context.req.method
    });

    return context.send({ error: 'Internal server error' }, 500);
  }
}
```

### Performance Profiling

```typescript
import { Service } from '@asenajs/asena/decorators';
import { Inject } from '@asenajs/asena/decorators/ioc';
import { logger } from '../logger';

@Service()
export class ReportService {
  @Inject(AnalyticsRepository)
  private analyticsRepo: AnalyticsRepository;

  private async processData(data: unknown) {
    // your own aggregation logic
    return data;
  }

  async generateReport(userId: string) {
    logger.profile('generate-report');

    const data = await this.analyticsRepo.getData(userId);
    const report = await this.processData(data);

    logger.profile('generate-report'); // Logs elapsed time
    return report;
  }
}
```

## Custom Winston Configuration

AsenaLogger is built on Winston. For advanced logging configurations (file transports, custom formats, log rotation), you can pass a custom Winston instance:

```typescript
import winston from 'winston';
import { AsenaLogger } from '@asenajs/asena-logger';

// Create custom Winston logger
const winstonLogger = winston.createLogger({
  level: 'info',
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console()
  ]
});

// Use with AsenaLogger
export const logger = new AsenaLogger(winstonLogger);
```

::: info Winston Documentation
For detailed Winston configuration options (transports, formats, log rotation, etc.), see the [Winston Documentation](https://github.com/winstonjs/winston).
:::

## Best Practices

### 1. Export Logger Globally

```typescript
// ✅ Good: Export for global use
// src/logger.ts
export const logger = new AsenaLogger();

// ❌ Avoid: Creating logger in each file
const logger = new AsenaLogger(); // Don't do this in multiple files
```

### 2. Include Rich Context

```typescript
// ✅ Good: Rich structured logging
logger.info('User action', {
  userId: 123,
  action: 'update_profile',
  timestamp: new Date().toISOString()
});

// ❌ Bad: No context
logger.info('User did something');
```

### 3. Use Appropriate Log Levels

```typescript
// ✅ Good: Use correct level
logger.error('Database connection failed', error);
logger.warn('Cache miss, fetching from database');
logger.info('User logged in successfully');
logger.debug('Cache key: user:123');

// ❌ Bad: Wrong level
logger.info('Critical error occurred!');
logger.error('User logged in');
```

### 4. Profile Expensive Operations

```typescript
// ✅ Good: Profile performance-critical operations
logger.profile('complex-calculation');
const result = await performComplexCalculation();
logger.profile('complex-calculation');
```

### 5. Don't Log Sensitive Data

```typescript
// ✅ Good: Sanitize sensitive data
logger.info('User logged in', {
  userId: user.id,
  email: maskEmail(user.email)
});

// ❌ Bad: Logging passwords and tokens
logger.info('User logged in', {
  password: user.password, // NEVER do this!
  token: user.sessionToken
});
```

## Related

- [Services](/docs/concepts/services) - Service layer patterns
- [Middleware](/docs/concepts/middleware) - Middleware patterns
- [Dependency Injection](/docs/concepts/dependency-injection) - IoC container
- [Configuration](/docs/guides/configuration) - Server configuration
- [Error Handling](/docs/guides/error-handling) - Logging errors from a global handler
- [Winston Documentation](https://github.com/winstonjs/winston) - Advanced configuration
