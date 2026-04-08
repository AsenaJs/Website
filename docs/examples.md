---
title: Examples
description: Real-world examples and complete applications with Asena
outline: deep
---

# Examples

Practical examples showing how to build real applications with Asena. Each example demonstrates core concepts with working code.

## Complete REST API

A full-featured REST API with controllers, services, validation, and database integration.

### Project Structure

```
my-api/
├── src/
│   ├── controllers/
│   │   └── UserController.ts
│   ├── services/
│   │   └── UserService.ts
│   ├── validators/
│   │   ├── CreateUserValidator.ts
│   │   └── UpdateUserValidator.ts
│   ├── middlewares/
│   │   └── AuthMiddleware.ts
│   ├── repositories/
│   │   └── UserRepository.ts
│   ├── database.ts
│   ├── logger.ts
│   └── index.ts
├── asena.config.ts
├── package.json
└── tsconfig.json
```

### Database Setup

```typescript
// src/database.ts
import { Database } from '@asenajs/asena-drizzle';
import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow()
});

@Database({
  type: 'postgresql',
  config: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'myapp',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres'
  }
})
export class MainDB {}
```

### Repository

```typescript
// src/repositories/UserRepository.ts
import { Repository, BaseRepository } from '@asenajs/asena-drizzle';
import { users } from '../database';
import { eq } from 'drizzle-orm';

@Repository({ table: users, databaseService: 'MainDB' })
export class UserRepository extends BaseRepository<typeof users, NodePgDatabase<any>> {
  async findByEmail(email: string) {
    return this.findOne(eq(users.email, email));
  }
}
```

::: tip Type-Safe Repository Pattern
Always provide both generic parameters to your repository for full TypeScript support:
```typescript
// First parameter: Your table schema
// Second parameter: Your database connection type
export class UserRepository extends BaseRepository<typeof users, NodePgDatabase<any>> {
  // Now you have full IntelliSense and type checking!
}
```

**Why this matters:**
Without the database type parameter, TypeScript cannot infer the correct query builder methods, and you'll lose IDE autocomplete features.

**Available Database Types:**

| Database | Driver | Type to Use |
|----------|--------|-------------|
| PostgreSQL | `pg` | `NodePgDatabase<any>` |
| MySQL | `mysql2` | `MySql2Database<any>` |
| SQLite | `bun:sqlite` | `BunSQLDatabase<any>` |

**Complete Example:**
```typescript
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { users } from './schema';

@Repository(users)
export class UserRepository extends BaseRepository<typeof users, NodePgDatabase<any>> {
  // Type-safe methods with IntelliSense
  async findByEmail(email: string) {
    return this.query().where(eq(users.email, email)).limit(1);
  }
}
```
:::

### Service

```typescript
// src/services/UserService.ts
import { Service } from '@asenajs/asena/decorators';
import { Inject } from '@asenajs/asena/decorators/ioc';
import { UserRepository } from '../repositories/UserRepository';

@Service()
export class UserService {
  @Inject(UserRepository)
  private userRepo: UserRepository;

  async getAllUsers() {
    return await this.userRepo.findAll();
  }

  async getUserById(id: string) {
    const user = await this.userRepo.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async createUser(data: { name: string; email: string }) {
    const existing = await this.userRepo.findByEmail(data.email);
    if (existing) {
      throw new Error('Email already exists');
    }

    return await this.userRepo.create(data);
  }

  async updateUser(id: string, data: Partial<{ name: string; email: string }>) {
    return await this.userRepo.update(id, data);
  }

  async deleteUser(id: string) {
    return await this.userRepo.delete(id);
  }
}
```

### Validators

```typescript
// src/validators/CreateUserValidator.ts
import { Middleware } from '@asenajs/asena/decorators';
import { ValidationService } from '@asenajs/ergenecore';
import { z } from 'zod';

@Middleware({ validator: true })
export class CreateUserValidator extends ValidationService {
  json() {
    return z.object({
      name: z.string().min(3).max(50),
      email: z.string().email()
    });
  }
}

// src/validators/UpdateUserValidator.ts
@Middleware({ validator: true })
export class UpdateUserValidator extends ValidationService {
  json() {
    return z.object({
      name: z.string().min(3).max(50).optional(),
      email: z.string().email().optional()
    });
  }
}
```

### Controller

```typescript
// src/controllers/UserController.ts
import { Controller } from '@asenajs/asena/decorators';
import { Get, Post, Put, Delete } from '@asenajs/asena/decorators/http';
import { Inject } from '@asenajs/asena/decorators/ioc';
import type { Context } from '@asenajs/ergenecore';
import { UserService } from '../services/UserService';
import { CreateUserValidator } from '../validators/CreateUserValidator';
import { UpdateUserValidator } from '../validators/UpdateUserValidator';

@Controller('/users')
export class UserController {
  @Inject(UserService)
  private userService: UserService;

  @Get('/')
  async list(context: Context) {
    const users = await this.userService.getAllUsers();
    return context.send({ users });
  }

  @Get('/:id')
  async getById(context: Context) {
    try {
      const user = await this.userService.getUserById(context.getParam('id'));
      return context.send({ user });
    } catch (error) {
      return context.send({ error: error.message }, 404);
    }
  }

  @Post({ path: '/', validator: CreateUserValidator })
  async create(context: Context) {
    try {
      const data = await context.getBody<{ name: string; email: string }>();
      const user = await this.userService.createUser(data);
      return context.send({ created: true, user }, 201);
    } catch (error) {
      return context.send({ error: error.message }, 400);
    }
  }

  @Put({ path: '/:id', validator: UpdateUserValidator })
  async update(context: Context) {
    try {
      const id = context.getParam('id');
      const data = await context.getBody();
      const user = await this.userService.updateUser(id, data);
      return context.send({ updated: true, user });
    } catch (error) {
      return context.send({ error: error.message }, 400);
    }
  }

  @Delete('/:id')
  async delete(context: Context) {
    try {
      await this.userService.deleteUser(context.getParam('id'));
      return context.send({ deleted: true });
    } catch (error) {
      return context.send({ error: error.message }, 404);
    }
  }
}
```

### Entry Point

```typescript
// src/index.ts
import { AsenaServerFactory } from '@asenajs/asena';
import { createErgenecoreAdapter } from '@asenajs/ergenecore';
import { logger } from './logger';

const adapter = createErgenecoreAdapter();

const server = await AsenaServerFactory.create({
  adapter,
  logger,
  port: 3000
});

await server.start();
```

### Logger

```typescript
// src/logger.ts
import { AsenaLogger } from '@asenajs/asena-logger';

export const logger = new AsenaLogger();
```

### Run the Application

```bash
asena dev start
```

You'll see:

```
2025-10-15 20:21:56 [INFO]:     ✅ Database Connected [POSTGRESQL]
2025-10-15 20:21:56 [INFO]:     Adapter: ErgenecoreAdapter implemented
2025-10-15 20:21:56 [INFO]:     All components registered and ready to use
2025-10-15 20:21:56 [INFO]:     ✓ Successfully registered CONTROLLER UserController (5 routes)
2025-10-15 20:21:56 [INFO]:     Server running at http://localhost:3000
```

### Test the API

```bash
# Get all users
curl http://localhost:3000/users

# Create user
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com"}'

# Get user by ID
curl http://localhost:3000/users/123e4567-e89b-12d3-a456-426614174000

# Update user
curl -X PUT http://localhost:3000/users/123e4567-e89b-12d3-a456-426614174000 \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Doe"}'

# Delete user
curl -X DELETE http://localhost:3000/users/123e4567-e89b-12d3-a456-426614174000
```

---

## WebSocket Chat Application

A real-time chat application with room management and broadcasting.

### WebSocket Service

```typescript
// src/websockets/ChatSocket.ts
import { WebSocket } from '@asenajs/asena/web-socket';
import { AsenaWebSocketService } from '@asenajs/asena/web-socket';
import type { Socket } from '@asenajs/asena/web-socket';

interface ChatData {
  username: string;
  room: string;
}

@WebSocket({ path: '/chat', name: 'ChatSocket' })
export class ChatSocket extends AsenaWebSocketService<ChatData> {

  protected async onOpen(ws: Socket<ChatData>): Promise<void> {
    const username = ws.data.value?.username || 'Anonymous';
    const room = ws.data.value?.room || 'general';

    // Send message to socket
    ws.send(`Hello ${username}`)

    // Join room
    ws.subscribe(room);

    // send message to all room.
    this.server.to(room, `User joined: ${username}`)
  }

  protected async onMessage(ws: Socket<ChatData>, message: string): Promise<void> {
    const username = ws.data.value?.username || 'Anonymous';
    const room = ws.data.value?.room || 'general';

    // send message to other sockets in room. (except itself)
    ws.publish(room, message);
  }

  protected async onClose(ws: Socket<ChatData>): Promise<void> {
    const username = ws.data.value?.username || 'Anonymous';
    const room = ws.data.value?.room || 'general';

    // leave room
    ws.unsubscribe(room);

    // send message to all room.
    this.server.to(room, `User leaved: ${username}`)
  }
}
```

## Authentication with Middleware

Implementing JWT authentication with middleware.

### Auth Service

```typescript
// src/services/AuthService.ts
import { Service } from '@asenajs/asena/decorators';

@Service()
export class AuthService {
  async verifyToken(token: string): Promise<{ id: string; email: string }> {
    // In production, use proper JWT verification
    if (token === 'valid-token') {
      return { id: '123', email: 'user@example.com' };
    }
    throw new Error('Invalid token');
  }

  async generateToken(userId: string): Promise<string> {
    // In production, use proper JWT generation
    return 'valid-token';
  }
}
```

### Auth Middleware

```typescript
// src/middlewares/AuthMiddleware.ts
import { Middleware } from '@asenajs/asena/decorators';
import { MiddlewareService, type Context } from '@asenajs/ergenecore';
import { Inject } from '@asenajs/asena/decorators/ioc';
import { AuthService } from '../services/AuthService';

@Middleware()
export class AuthMiddleware extends MiddlewareService {
  @Inject(AuthService)
  private authService: AuthService;

  async handle(context: Context, next: () => Promise<void>): Promise<any> {
    const token = context.getHeader('authorization')?.replace('Bearer ', '');

    if (!token) {
      return context.send({ error: 'No token provided' }, 401);
    }

    try {
      const user = await this.authService.verifyToken(token);
      context.setValue('user', user);
      await next();
    } catch (error) {
      return context.send({ error: 'Invalid token' }, 401);
    }
  }
}
```

### Protected Controller

```typescript
// src/controllers/ProfileController.ts
import { Controller } from '@asenajs/asena/decorators';
import { Get } from '@asenajs/asena/decorators/http';
import type { Context } from '@asenajs/ergenecore/types';
import { AuthMiddleware } from '../middlewares/AuthMiddleware';

@Controller({ path: '/profile', middlewares: [AuthMiddleware] })
export class ProfileController {
  @Get('/')
  async getProfile(context: Context) {
    const user = context.getValue('user');
    return context.send({ user });
  }

  @Get('/settings')
  async getSettings(context: Context) {
    const user = context.getValue('user');
    return context.send({ userId: user.id, settings: {} });
  }
}
```

### Login Controller

```typescript
// src/controllers/AuthController.ts
import { Controller } from '@asenajs/asena/decorators';
import { Post } from '@asenajs/asena/decorators/http';
import { Inject } from '@asenajs/asena/decorators/ioc';
import type { Context } from '@asenajs/ergenecore/types';
import { AuthService } from '../services/AuthService';

@Controller('/auth')
export class AuthController {
  @Inject(AuthService)
  private authService: AuthService;

  @Post('/login')
  async login(context: Context) {
    const { email, password } = await context.getBody<{
      email: string;
      password: string;
    }>();

    // Validate credentials (simplified)
    if (email === 'user@example.com' && password === 'password') {
      const token = await this.authService.generateToken('123');
      return context.send({ token });
    }

    return context.send({ error: 'Invalid credentials' }, 401);
  }
}
```

### Usage

```bash
# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Response: {"token":"valid-token"}

# Access protected route
curl http://localhost:3000/profile \
  -H "Authorization: Bearer valid-token"

# Response: {"user":{"id":"123","email":"user@example.com"}}
```

---

## Rate Limiting

Using built-in rate limiter middleware.

```typescript
// src/middlewares/ApiRateLimiter.ts
import { Middleware } from '@asenajs/asena/decorators';
import { RateLimiterMiddleware } from '@asenajs/ergenecore';

@Middleware()
export class ApiRateLimiter extends RateLimiterMiddleware {
  constructor() {
    super({
      capacity: 100,        // 100 requests
      refillRate: 100 / 60, // per minute
      keyGenerator: (ctx) => {
        // Rate limit per user or IP
        const user = ctx.getValue('user');
        return user?.id || ctx.getRequest().headers.get('x-forwarded-for') || 'anonymous';
      },
      skip: (ctx) => {
        // Skip for admins
        const user = ctx.getValue('user');
        return user?.role === 'admin';
      },
      cost: (ctx) => {
        // Expensive operations cost more tokens
        if (ctx.getRequest().url.includes('/search')) return 5;
        if (ctx.getRequest().url.includes('/export')) return 10;
        return 1;
      }
    });
  }
}

// Apply to specific routes
@Controller('/api')
export class ApiController {
  @Get({ path: '/data', middlewares: [ApiRateLimiter] })
  async getData(context: Context) {
    return context.send({ data: [] });
  }
}
```

---

## CORS Configuration

Setting up CORS for cross-origin requests.

```typescript
// src/middlewares/GlobalCors.ts
import { Middleware } from '@asenajs/asena/decorators';
import { CorsMiddleware } from '@asenajs/ergenecore';

@Middleware()
export class GlobalCors extends CorsMiddleware {
  constructor() {
    super({
      origin: ['https://example.com', 'https://app.example.com'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      maxAge: 86400
    });
  }
}

// src/config/ServerConfig.ts
import { Config } from '@asenajs/asena/decorators';
import { ConfigService } from '@asenajs/ergenecore';
import { GlobalCors } from '../middlewares/GlobalCors';

@Config()
export class ServerConfig extends ConfigService {
  middlewares = [GlobalCors];
}
```

---

## OpenAPI Auto-Documentation

Automatically generate OpenAPI specs from your existing validators — zero extra annotations.

### Setup

```typescript
// src/openapi/AppOpenApi.ts
import { OpenApi, OpenApiPostProcessor } from '@asenajs/asena-openapi';

@OpenApi({
  info: { title: 'My API', version: '1.0.0' },
  path: '/api/openapi',
  ui: true,
})
export class AppOpenApi extends OpenApiPostProcessor {}
```

### Validator with Response Schema

```typescript
// src/validators/CreateUserValidator.ts
import { Middleware } from '@asenajs/asena/decorators';
import { ValidationService } from '@asenajs/ergenecore';
import { z } from 'zod';

@Middleware({ validator: true })
export class CreateUserValidator extends ValidationService {
  json() {
    return z.object({
      name: z.string().min(1),
      email: z.string().email(),
    });
  }

  response() {
    return {
      201: z.object({ id: z.string(), name: z.string() }),
      400: { schema: z.object({ error: z.string() }), description: 'Validation error' },
    };
  }
}
```

### Test

```bash
# Get OpenAPI spec
curl http://localhost:3000/api/openapi

# Open Swagger UI in browser
open http://localhost:3000/api/openapi/ui
```

::: info
For full documentation, see [OpenAPI Package](/docs/packages/openapi).
:::

---

## Redis Caching

Add Redis-powered caching with decorator-based setup.

### Redis Service

```typescript
// src/redis/AppRedis.ts
import { Redis, AsenaRedisService } from '@asenajs/asena-redis';

@Redis({
  config: { url: 'redis://localhost:6379' },
  name: 'AppRedis',
})
export class AppRedis extends AsenaRedisService {

  async getOrSet(key: string, factory: () => Promise<string>, ttl?: number): Promise<string> {
    const cached = await this.get(key);
    if (cached) return cached;

    const value = await factory();
    await this.set(key, value, ttl);
    return value;
  }

}
```

### Cache Controller

```typescript
// src/controllers/CacheController.ts
import { Controller } from '@asenajs/asena/decorators';
import { Get } from '@asenajs/asena/decorators/http';
import { Inject } from '@asenajs/asena/decorators/ioc';
import type { Context } from '@asenajs/ergenecore';

@Controller('/api/cache')
export class CacheController {

  @Inject('AppRedis')
  private redis: AppRedis;

  @Get('/user/:id')
  async getUser(context: Context) {
    const id = context.getParam('id');
    const name = await this.redis.getOrSet(`user:${id}`, async () => {
      // Simulate DB lookup
      return `User-${id}`;
    }, 60);

    return context.send({ id, name, cached: true });
  }

}
```

### Test

```bash
# First call — fetches from "DB" and caches
curl http://localhost:3000/api/cache/user/42

# Second call — served from Redis cache
curl http://localhost:3000/api/cache/user/42
```

::: info
For full documentation, see [Redis Package](/docs/packages/redis).
:::

---

## Scheduled Tasks

Run background jobs on a cron schedule using Bun's native cron support.

### Cleanup Task

```typescript
// src/schedule/SessionCleanup.ts
import { Schedule } from '@asenajs/asena/decorators';
import { Inject } from '@asenajs/asena/decorators/ioc';
import type { AsenaSchedule } from '@asenajs/asena/schedule';

@Schedule({ cron: '0 2 * * *' }) // Daily at 2:00 AM
export class SessionCleanup implements AsenaSchedule {

  @Inject('SessionRepository')
  private sessionRepo: SessionRepository;

  public async execute() {
    const count = await this.sessionRepo.deleteExpired();
    console.log(`Cleaned up ${count} expired sessions`);
  }

}
```

### Cron Health Endpoint

```typescript
// src/controllers/CronController.ts
import { Controller } from '@asenajs/asena/decorators';
import { Get } from '@asenajs/asena/decorators/http';
import { Inject } from '@asenajs/asena/decorators/ioc';
import { ICoreServiceNames } from '@asenajs/asena/ioc/types';
import type { CronRunner } from '@asenajs/asena/schedule';
import type { Context } from '@asenajs/ergenecore';

@Controller('/api/cron')
export class CronController {

  @Inject(ICoreServiceNames.CRON_RUNNER)
  private cronRunner: CronRunner;

  @Get('/status')
  async status(context: Context) {
    return context.send({
      jobs: this.cronRunner.getJobNames(),
      count: this.cronRunner.jobCount,
      running: this.cronRunner.hasRunningJobs,
    });
  }

}
```

### Test

```bash
curl http://localhost:3000/api/cron/status
# {"jobs":["SessionCleanup"],"count":1,"running":true}
```

::: info
For full documentation, see [Scheduled Tasks](/docs/concepts/scheduled-tasks).
:::

---

## Frontend Controller

Serve HTML pages using Bun's native HTML imports — zero middleware overhead.

```typescript
// src/frontend/AppFrontendController.ts
import { FrontendController } from '@asenajs/asena/decorators';
import { Page } from '@asenajs/asena/decorators/http';

@FrontendController('/ui')
export class AppFrontendController {

  @Page('/')
  public home() {
    return import('./pages/home.html');
  }

  @Page('/settings')
  public settings() {
    return import('./pages/settings.html');
  }

}
```

Visit `http://localhost:3000/ui` to see the home page, and `http://localhost:3000/ui/settings` for settings.

::: warning
FrontendController routes bypass the middleware chain entirely (no CORS, auth, etc.). Use `@Controller` for routes that need middleware.
:::

::: info
For full documentation, see [Frontend Controller](/docs/concepts/frontend-controller).
:::

---

## Related Documentation

- [Controllers](/docs/concepts/controllers) - HTTP routing
- [Services](/docs/concepts/services) - Business logic
- [Middleware](/docs/concepts/middleware) - Request interception
- [Validation](/docs/concepts/validation) - Request validation
- [WebSocket](/docs/concepts/websocket) - Real-time communication
- [Scheduled Tasks](/docs/concepts/scheduled-tasks) - Cron-based task scheduling
- [Frontend Controller](/docs/concepts/frontend-controller) - HTML page serving
- [PostProcessor](/docs/concepts/post-processor) - Component interception
- [OpenAPI Package](/docs/packages/openapi) - API documentation
- [Redis Package](/docs/packages/redis) - Redis integration
- [Drizzle Package](/docs/packages/drizzle) - Database integration
- [Logger Package](/docs/packages/logger) - Logging

---

**Need more examples?** Check out the [AsenaExample repository](https://github.com/LibirSoft/AsenaExample) for additional use cases.
