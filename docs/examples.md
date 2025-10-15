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
export class UserRepository extends BaseRepository<typeof users> {
  async findByEmail(email: string) {
    return this.findOne(eq(users.email, email));
  }
}
```

### Service

```typescript
// src/services/UserService.ts
import { Service } from '@asenajs/asena/server';
import { Inject } from '@asenajs/asena/ioc';
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
import { Middleware } from '@asenajs/asena/server';
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
import { Controller } from '@asenajs/asena/server';
import { Get, Post, Put, Delete } from '@asenajs/asena/web';
import { Inject } from '@asenajs/asena/ioc';
import type { Context } from '@asenajs/ergenecore/types';
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
import { AsenaServerFactory } from '@asenajs/asena/server';
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
  private users = new Map<string, { username: string; socket: Socket<ChatData> }>();
  private rooms = new Map<string, Set<string>>();

  protected async onOpen(ws: Socket<ChatData>): Promise<void> {
    const username = ws.data?.username || 'Anonymous';
    const room = ws.data?.room || 'general';

    // Store user
    this.users.set(ws.id, { username, socket: ws });

    // Add to room
    if (!this.rooms.has(room)) {
      this.rooms.set(room, new Set());
    }
    this.rooms.get(room)!.add(ws.id);

    // Notify room
    this.broadcastToRoom(room, JSON.stringify({
      type: 'user_joined',
      username,
      totalUsers: this.rooms.get(room)!.size
    }), ws.id);

    // Welcome message
    ws.send(JSON.stringify({
      type: 'welcome',
      message: `Welcome to ${room}, ${username}!`
    }));
  }

  protected async onMessage(ws: Socket<ChatData>, message: string): Promise<void> {
    const user = this.users.get(ws.id);
    const room = ws.data?.room || 'general';

    try {
      const data = JSON.parse(message);

      if (data.type === 'message') {
        this.broadcastToRoom(room, JSON.stringify({
          type: 'message',
          username: user?.username,
          message: data.message,
          timestamp: new Date().toISOString()
        }));
      }
    } catch (error) {
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
    }
  }

  protected async onClose(ws: Socket<ChatData>): Promise<void> {
    const user = this.users.get(ws.id);
    const room = ws.data?.room || 'general';

    this.users.delete(ws.id);

    if (this.rooms.has(room)) {
      this.rooms.get(room)!.delete(ws.id);

      this.broadcastToRoom(room, JSON.stringify({
        type: 'user_left',
        username: user?.username,
        totalUsers: this.rooms.get(room)!.size
      }));

      if (this.rooms.get(room)!.size === 0) {
        this.rooms.delete(room);
      }
    }
  }

  private broadcastToRoom(room: string, message: string, excludeId?: string) {
    const socketIds = this.rooms.get(room);
    if (!socketIds) return;

    for (const socketId of socketIds) {
      if (excludeId && socketId === excludeId) continue;

      const user = this.users.get(socketId);
      if (user) {
        user.socket.send(message);
      }
    }
  }
}
```

### Client-Side Code

```html
<!DOCTYPE html>
<html>
<head>
  <title>Chat</title>
</head>
<body>
  <div id="messages"></div>
  <input id="messageInput" type="text" placeholder="Type a message...">
  <button onclick="sendMessage()">Send</button>

  <script>
    const username = prompt('Enter your username:');
    const room = prompt('Enter room name:');
    const ws = new WebSocket(`ws://localhost:3000/chat?username=${username}&room=${room}`);

    ws.addEventListener('open', () => {
      console.log('Connected to chat!');
    });

    ws.addEventListener('message', (event) => {
      const data = JSON.parse(event.data);
      const messagesDiv = document.getElementById('messages');

      if (data.type === 'welcome') {
        messagesDiv.innerHTML += `<p><strong>${data.message}</strong></p>`;
      }

      if (data.type === 'message') {
        messagesDiv.innerHTML += `<p><strong>${data.username}:</strong> ${data.message}</p>`;
      }

      if (data.type === 'user_joined') {
        messagesDiv.innerHTML += `<p><em>${data.username} joined (${data.totalUsers} users)</em></p>`;
      }

      if (data.type === 'user_left') {
        messagesDiv.innerHTML += `<p><em>${data.username} left (${data.totalUsers} users)</em></p>`;
      }
    });

    function sendMessage() {
      const input = document.getElementById('messageInput');
      ws.send(JSON.stringify({
        type: 'message',
        message: input.value
      }));
      input.value = '';
    }
  </script>
</body>
</html>
```

---

## Authentication with Middleware

Implementing JWT authentication with middleware.

### Auth Service

```typescript
// src/services/AuthService.ts
import { Service } from '@asenajs/asena/server';

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
import { Middleware } from '@asenajs/asena/server';
import { MiddlewareService, type Context } from '@asenajs/ergenecore';
import { Inject } from '@asenajs/asena/ioc';
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
import { Controller } from '@asenajs/asena/server';
import { Get } from '@asenajs/asena/web';
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
import { Controller } from '@asenajs/asena/server';
import { Post } from '@asenajs/asena/web';
import { Inject } from '@asenajs/asena/ioc';
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
import { Middleware } from '@asenajs/asena/server';
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
import { Middleware } from '@asenajs/asena/server';
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
import { Config } from '@asenajs/asena/server';
import { ConfigService } from '@asenajs/ergenecore';
import { GlobalCors } from '../middlewares/GlobalCors';

@Config()
export class ServerConfig extends ConfigService {
  middlewares = [GlobalCors];
}
```

---

## Related Documentation

- [Controllers](/docs/concepts/controllers) - HTTP routing
- [Services](/docs/concepts/services) - Business logic
- [Middleware](/docs/concepts/middleware) - Request interception
- [Validation](/docs/concepts/validation) - Request validation
- [WebSocket](/docs/concepts/websocket) - Real-time communication
- [Drizzle Package](/docs/packages/drizzle) - Database integration
- [Logger Package](/docs/packages/logger) - Logging

---

**Need more examples?** Check out the [AsenaExample repository](https://github.com/LibirSoft/AsenaExample) for additional use cases.
