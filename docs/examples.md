---
title: Examples
description: Complete worked examples - REST APIs, WebSocket chat, authentication, and database integration
outline: deep
---

# Examples

Practical examples showing how to build real applications with Asena. Each example demonstrates core concepts with working code.

<div class="card-grid">
  <a class="info-card" href="#complete-rest-api">
    <span class="ic-kicker">Full Stack</span>
    <div class="ic-title">Complete REST API</div>
    <p class="ic-desc">Controllers, services, validation and database in one app.</p>
  </a>
  <a class="info-card" href="#websocket-chat-application">
    <span class="ic-kicker">Real-time</span>
    <div class="ic-title">WebSocket Chat</div>
    <p class="ic-desc">Rooms, publishing and broadcasting.</p>
  </a>
  <a class="info-card" href="#authentication-with-middleware">
    <span class="ic-kicker">Auth</span>
    <div class="ic-title">JWT Authentication</div>
    <p class="ic-desc">Token login and protected routes via middleware.</p>
  </a>
  <a class="info-card" href="#rate-limiting">
    <span class="ic-kicker">Protection</span>
    <div class="ic-title">Rate Limiting</div>
    <p class="ic-desc">Token-bucket limits per user or IP.</p>
  </a>
  <a class="info-card" href="#cors-configuration">
    <span class="ic-kicker">Cross-Origin</span>
    <div class="ic-title">CORS Configuration</div>
    <p class="ic-desc">Global CORS middleware setup.</p>
  </a>
  <a class="info-card" href="#openapi-auto-documentation">
    <span class="ic-kicker">API Docs</span>
    <div class="ic-title">OpenAPI</div>
    <p class="ic-desc">Specs generated from route contracts, with Scalar or Swagger UI.</p>
  </a>
  <a class="info-card" href="#redis-caching">
    <span class="ic-kicker">Caching</span>
    <div class="ic-title">Redis Caching</div>
    <p class="ic-desc">Decorator-based cache with get-or-set.</p>
  </a>
  <a class="info-card" href="#scheduled-tasks">
    <span class="ic-kicker">Background Jobs</span>
    <div class="ic-title">Scheduled Tasks</div>
    <p class="ic-desc">Cron jobs on Bun's native scheduler.</p>
  </a>
  <a class="info-card" href="#frontend-controller">
    <span class="ic-kicker">HTML Pages</span>
    <div class="ic-title">Frontend Controller</div>
    <p class="ic-desc">Serve pages with native HTML imports.</p>
  </a>
</div>

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
│   ├── contracts/
│   │   └── UserContracts.ts
│   ├── middlewares/
│   │   └── AuthMiddleware.ts
│   ├── repositories/
│   │   └── UserRepository.ts
│   ├── database.ts
│   ├── logger.ts
│   └── index.ts
├── asena-config.ts
├── package.json
└── tsconfig.json
```

### Database Setup

```typescript
// src/database.ts
import { AsenaDatabaseService, Database } from '@asenajs/asena-drizzle';
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
export class MainDB extends AsenaDatabaseService {}
```

### Repository

```typescript
// src/repositories/UserRepository.ts
import { Repository, BaseRepository } from '@asenajs/asena-drizzle';
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { users } from '../database';

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
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { users } from './schema';

@Repository({ table: users, databaseService: 'MainDatabase' })
export class UserRepository extends BaseRepository<typeof users, NodePgDatabase<any>> {
  // Type-safe methods with IntelliSense
  async findByEmail(email: string) {
    return this.findOne(eq(users.email, email));
  }
}
```
:::

### Service

```typescript
// src/services/UserService.ts
import { Service } from '@asenajs/asena/decorators';
import { Inject } from '@asenajs/asena/decorators/ioc';
import { HttpException } from '@asenajs/asena/adapter';
import { UserRepository } from '../repositories/UserRepository';

@Service()
export class UserService {
  @Inject(UserRepository)
  private userRepo: UserRepository;

  async getAllUsers() {
    return this.userRepo.findAll();
  }

  async getUserById(id: string) {
    const user = await this.userRepo.findById(id);

    if (!user) {
      throw new HttpException(404, { error: 'User not found' });
    }

    return user;
  }

  async createUser(data: { name: string; email: string }) {
    if (await this.userRepo.findByEmail(data.email)) {
      throw new HttpException(409, { error: 'Email already exists' });
    }

    return this.userRepo.create(data);
  }

  async updateUser(id: string, data: Partial<{ name: string; email: string }>) {
    const user = await this.userRepo.updateById(id, data);

    if (!user) {
      throw new HttpException(404, { error: 'User not found' });
    }

    return user;
  }

  async deleteUser(id: string) {
    if (!(await this.userRepo.deleteById(id))) {
      throw new HttpException(404, { error: 'User not found' });
    }
  }
}
```

A thrown `HttpException` becomes the response, so the controller needs no `try`/`catch`.

### Contracts

Each route declares its request schemas as a [route context contract](/docs/concepts/validation#route-context-contracts):
a context class built with `Context.define()`. A request that fails a schema gets a **400** before
the handler runs.

```typescript
// src/contracts/UserContracts.ts
import { Context } from '@asenajs/ergenecore';
import { z } from 'zod';

const userId = z.object({ id: z.uuid() });

export class GetUserContext extends Context.define({
  params: userId,
}) {}

export class CreateUserContext extends Context.define({
  body: z.object({
    name: z.string().min(3).max(50),
    email: z.email(),
  }),
}) {}

export class UpdateUserContext extends Context.define({
  params: userId,
  body: z.object({
    name: z.string().min(3).max(50).optional(),
    email: z.email().optional(),
  }),
}) {}
```

### Controller

```typescript
// src/controllers/UserController.ts
import { Controller } from '@asenajs/asena/decorators';
import { Get, Post, Put, Delete } from '@asenajs/asena/decorators/http';
import { Inject } from '@asenajs/asena/decorators/ioc';
import type { Context } from '@asenajs/ergenecore';
import { UserService } from '../services/UserService';
import { CreateUserContext, GetUserContext, UpdateUserContext } from '../contracts/UserContracts';

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
  async getById(context: GetUserContext) {
    const user = await this.userService.getUserById(context.input.params.id);

    return context.send({ user });
  }

  @Post('/')
  async create(context: CreateUserContext) {
    const user = await this.userService.createUser(context.input.body);

    return context.send({ created: true, user }, 201);
  }

  @Put('/:id')
  async update(context: UpdateUserContext) {
    const { params, body } = context.input;
    const user = await this.userService.updateUser(params.id, body);

    return context.send({ updated: true, user });
  }

  @Delete('/:id')
  async delete(context: GetUserContext) {
    await this.userService.deleteUser(context.input.params.id);

    return context.send({ deleted: true });
  }
}
```

Asena finds a contract from the handler's parameter type, so import the contract classes as values
(not with `import type`) and keep `emitDecoratorMetadata` enabled in `tsconfig.json`.

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
[INFO]: Adapter: Ergenecore implemented
[INFO]: ✅ Database Connected [POSTGRESQL]
[INFO]: All components registered and ready to use
[INFO]: ✓ Successfully registered CONTROLLER UserController (5 routes)
[INFO]: Server ready → http://localhost:3000
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

### Handshake Middleware

The middleware runs on the upgrade request. Whatever it passes to `setWebSocketValue()` becomes
`ws.data.values` on the socket.

```typescript
// src/middlewares/ChatHandshake.ts
import { Middleware } from '@asenajs/asena/decorators';
import { MiddlewareService, type Context } from '@asenajs/ergenecore';

@Middleware()
export class ChatHandshake extends MiddlewareService {
  async handle(context: Context, next: () => Promise<void>) {
    const username = (await context.getQuery('username')) ?? 'Anonymous';
    const room = (await context.getQuery('room')) ?? 'general';

    context.setWebSocketValue({ username, room });

    await next();
  }
}
```

### WebSocket Service

```typescript
// src/websockets/ChatSocket.ts
import { WebSocket } from '@asenajs/asena/decorators';
import { AsenaWebSocketService, type Socket } from '@asenajs/asena/web-socket';
import { ChatHandshake } from '../middlewares/ChatHandshake';

interface ChatData {
  username: string;
  room: string;
}

@WebSocket({ path: '/chat', name: 'ChatSocket', middlewares: [ChatHandshake] })
export class ChatSocket extends AsenaWebSocketService<ChatData> {

  protected async onOpen(ws: Socket<ChatData>): Promise<void> {
    const { username, room } = ws.data.values;

    ws.send(JSON.stringify({ type: 'welcome', room }));
    ws.subscribe(room);

    // Every subscriber of the room, this socket included
    this.to(room, { type: 'joined', username });
  }

  protected async onMessage(ws: Socket<ChatData>, message: string | Buffer): Promise<void> {
    const { username, room } = ws.data.values;

    // Every subscriber of the room except the sender
    ws.publish(room, JSON.stringify({ type: 'message', username, text: String(message) }));
  }

  protected async onClose(ws: Socket<ChatData>): Promise<void> {
    const { username, room } = ws.data.values;

    this.to(room, { type: 'left', username });
  }
}
```

`ws.subscribe()` and `ws.publish()` prefix the room with the namespace, and `this.to()` does the
same, so both reach the same subscribers. Room subscriptions end with the connection, so `onClose`
needs no `unsubscribe()`. Pass objects to `this.to()` as they are; it serializes them.

```bash
bunx wscat -c "ws://localhost:3000/chat?username=ada&room=general"
```

::: info
For full documentation, see [WebSocket](/docs/concepts/websocket).
:::

---

## Authentication with Middleware

Implementing JWT authentication with middleware.

### Typed Context State

Declare what middleware puts on the context once, and `getValue()` / `setValue()` are type-checked
everywhere:

```typescript
// src/types/ContextState.ts
export interface AuthUser {
  id: string;
  email: string;
  role: 'user' | 'admin';
}

declare module '@asenajs/asena/adapter' {
  interface AsenaVariables {
    user: AuthUser;
  }
}
```

### Auth Service

```typescript
// src/services/AuthService.ts
import { Service } from '@asenajs/asena/decorators';
import { HttpException } from '@asenajs/asena/adapter';
import type { AuthUser } from '../types/ContextState';

@Service()
export class AuthService {
  async login(email: string, password: string): Promise<string> {
    // Replace with a real credential check and JWT signing
    if (email === 'user@example.com' && password === 'password') {
      return 'valid-token';
    }

    throw new HttpException(401, { error: 'Invalid credentials' });
  }

  async verifyToken(token: string): Promise<AuthUser> {
    // Replace with real JWT verification
    if (token === 'valid-token') {
      return { id: '123', email: 'user@example.com', role: 'user' };
    }

    throw new HttpException(401, { error: 'Invalid token' });
  }
}
```

### Auth Middleware

```typescript
// src/middlewares/AuthMiddleware.ts
import { Middleware } from '@asenajs/asena/decorators';
import { Inject } from '@asenajs/asena/decorators/ioc';
import { HttpException } from '@asenajs/asena/adapter';
import { MiddlewareService, type Context } from '@asenajs/ergenecore';
import { AuthService } from '../services/AuthService';

@Middleware()
export class AuthMiddleware extends MiddlewareService {
  @Inject(AuthService)
  private authService: AuthService;

  async handle(context: Context, next: () => Promise<void>) {
    const header = context.req.headers.get('authorization');

    if (!header?.startsWith('Bearer ')) {
      throw new HttpException(401, { error: 'No token provided' });
    }

    context.setValue('user', await this.authService.verifyToken(header.slice(7)));

    await next();
  }
}
```

A thrown `HttpException` reaches your [`onError`](/docs/guides/error-handling) first; when nothing
answers it there, its own status and body become the response.

### Protected Controller

```typescript
// src/controllers/ProfileController.ts
import { Controller } from '@asenajs/asena/decorators';
import { Get } from '@asenajs/asena/decorators/http';
import type { Context } from '@asenajs/ergenecore';
import { AuthMiddleware } from '../middlewares/AuthMiddleware';

@Controller({ path: '/profile', middlewares: [AuthMiddleware] })
export class ProfileController {
  @Get('/')
  async getProfile(context: Context) {
    return context.send({ user: context.getValue('user') });
  }

  @Get('/settings')
  async getSettings(context: Context) {
    const user = context.getValue('user'); // AuthUser

    return context.send({ userId: user.id, settings: {} });
  }
}
```

### Login Controller

The login body is a [route context contract](/docs/concepts/validation#route-context-contracts):
a malformed body gets a 400 before `login` runs, and `context.input.body` is typed from the schema.

```typescript
// src/controllers/AuthController.ts
import { Controller } from '@asenajs/asena/decorators';
import { Post } from '@asenajs/asena/decorators/http';
import { Inject } from '@asenajs/asena/decorators/ioc';
import { Context } from '@asenajs/ergenecore';
import { z } from 'zod';
import { AuthService } from '../services/AuthService';

class LoginContext extends Context.define({
  body: z.object({
    email: z.email(),
    password: z.string().min(1),
  }),
}) {}

@Controller('/auth')
export class AuthController {
  @Inject(AuthService)
  private authService: AuthService;

  @Post('/login')
  async login(context: LoginContext) {
    const { email, password } = context.input.body;

    return context.send({ token: await this.authService.login(email, password) });
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

# Response: {"user":{"id":"123","email":"user@example.com","role":"user"}}
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
      // Per user once AuthMiddleware has run, otherwise per client IP
      keyGenerator: (ctx) => ctx.getValue('user')?.id ?? ctx.getRequestIp() ?? 'unknown',
      trustProxy: true,     // one reverse proxy in front: read the client from X-Forwarded-For
      skip: (ctx) => ctx.getValue('user')?.role === 'admin',
      cost: (ctx) => (new URL(ctx.req.url).pathname.endsWith('/export') ? 10 : 1),
    });
  }
}

// src/controllers/ReportController.ts
import { Controller } from '@asenajs/asena/decorators';
import { Get } from '@asenajs/asena/decorators/http';
import type { Context } from '@asenajs/ergenecore';
import { AuthMiddleware } from '../middlewares/AuthMiddleware';
import { ApiRateLimiter } from '../middlewares/ApiRateLimiter';

@Controller({ path: '/reports', middlewares: [AuthMiddleware] })
export class ReportController {
  @Get({ path: '/', middlewares: [ApiRateLimiter] })
  async list(context: Context) {
    return context.send({ reports: [] });
  }

  @Get({ path: '/export', middlewares: [ApiRateLimiter] })
  async export(context: Context) {
    return context.send({ url: '/downloads/reports.csv' });
  }
}
```

Controller middleware runs before route middleware, so `user` is already set when the limiter
reads it. Leave `trustProxy` at its default (`false`) when clients connect to Bun directly - a
client could otherwise pick its own bucket by sending the header.

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
  globalMiddlewares() {
    return [GlobalCors];
  }
}
```

---

## OpenAPI Auto-Documentation

Generate an OpenAPI 3.1 spec from the routes you already have, and serve it with Scalar or Swagger
UI - no extra annotations.

### Setup

```typescript
// src/openapi/AppOpenApi.ts
import { OpenApi, OpenApiPostProcessor } from '@asenajs/asena-openapi';

@OpenApi({
  info: { title: 'My API', version: '1.0.0' },
  path: '/api/openapi',
  ui: 'scalar', // or 'swagger' (true) for Swagger UI
})
export class AppOpenApi extends OpenApiPostProcessor {}
```

### Request Schemas from Contracts

Every route that takes a [context contract](#contracts) is documented from it: `body` becomes the
request body, `params`, `query` and `headers` become parameters. The contracts from the REST API
example above need no changes:

```typescript
export class CreateUserContext extends Context.define({
  body: z.object({
    name: z.string().min(3).max(50),
    email: z.email(),
  }),
}) {}

@Post('/')
async create(context: CreateUserContext) { /* ... */ }
```

Request schemas are documented in their **input** shape - a field with `.default()` is optional,
because the client may omit it.

### Response Schemas

Response schemas come from the `response()` method of a validator class. A route takes either a
contract or a `validator`, not both, so a route that documents its responses uses a validator class
for its request schemas too:

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
      email: z.email(),
    });
  }

  response() {
    return {
      201: z.object({ id: z.uuid(), name: z.string() }),
      409: { schema: z.object({ error: z.string() }), description: 'Email already exists' },
    };
  }
}

@Post({ path: '/', validator: CreateUserValidator })
async create(context: Context) { /* ... */ }
```

A route without `response()` is documented with a single `200` response.

### Test

```bash
# Get the OpenAPI spec
curl http://localhost:3000/api/openapi

# Open the API docs UI in the browser
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

### Service and Controller

```typescript
// src/services/UserNameService.ts
import { Service } from '@asenajs/asena/decorators';
import { Inject } from '@asenajs/asena/decorators/ioc';
import { AppRedis } from '../redis/AppRedis';

@Service()
export class UserNameService {

  @Inject(AppRedis)
  private redis: AppRedis;

  async getName(id: string): Promise<string> {
    return this.redis.getOrSet(`user:${id}`, async () => {
      // Replace with the database lookup
      return `User-${id}`;
    }, 60);
  }

}

// src/controllers/CacheController.ts
import { Controller } from '@asenajs/asena/decorators';
import { Get } from '@asenajs/asena/decorators/http';
import { Inject } from '@asenajs/asena/decorators/ioc';
import type { Context } from '@asenajs/ergenecore';
import { UserNameService } from '../services/UserNameService';

@Controller('/api/cache')
export class CacheController {

  @Inject(UserNameService)
  private userNames: UserNameService;

  @Get('/user/:id')
  async getUser(context: Context) {
    const id = context.getParam('id');

    return context.send({ id, name: await this.userNames.getName(id) });
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
import { SessionService } from '../services/SessionService';

@Schedule({ cron: '0 2 * * *' }) // Daily at 2:00 AM
export class SessionCleanup implements AsenaSchedule {

  @Inject(SessionService)
  private sessionService: SessionService;

  public async execute() {
    const count = await this.sessionService.deleteExpired();
    console.log(`Cleaned up ${count} expired sessions`);
  }

}
```

A task is a component like any other; it reaches the database through the domain service that
owns the repository.

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

## Related

- [Controllers](/docs/concepts/controllers) - HTTP routing
- [Services](/docs/concepts/services) - Business logic
- [Middleware](/docs/concepts/middleware) - Request interception
- [Validation](/docs/concepts/validation) - Route context contracts and validators
- [Context](/docs/concepts/context) - Request, response and typed context state
- [Error Handling](/docs/guides/error-handling) - `HttpException` and `onError`
- [WebSocket](/docs/concepts/websocket) - Real-time communication
- [Scheduled Tasks](/docs/concepts/scheduled-tasks) - Cron-based task scheduling
- [Frontend Controller](/docs/concepts/frontend-controller) - HTML page serving
- [PostProcessor](/docs/concepts/post-processor) - Component interception
- [OpenAPI Package](/docs/packages/openapi) - API documentation
- [Redis Package](/docs/packages/redis) - Redis integration
- [Drizzle Package](/docs/packages/drizzle) - Database integration
- [Logger Package](/docs/packages/logger) - Logging
- [AsenaExample repository](https://github.com/LibirSoft/AsenaExample) - Additional use cases
