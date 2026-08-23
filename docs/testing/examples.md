---
title: Testing Examples
description: Real-world testing patterns for controllers, services, WebSockets, and middleware in Asena
outline: deep
---

# Testing Examples

This page provides practical testing examples for common Asena components.

<div class="card-grid">
  <a class="info-card" href="#testing-controllers">
    <span class="ic-kicker">01</span>
    <div class="ic-title">Controllers</div>
    <p class="ic-desc">Asserting on routes, status codes and payloads.</p>
  </a>
  <a class="info-card" href="#testing-services">
    <span class="ic-kicker">02</span>
    <div class="ic-title">Services</div>
    <p class="ic-desc">Unit-testing business logic with mocked dependencies.</p>
  </a>
  <a class="info-card" href="#testing-websockets">
    <span class="ic-kicker">03</span>
    <div class="ic-title">WebSockets</div>
    <p class="ic-desc">Driving a namespace and checking what it sends.</p>
  </a>
  <a class="info-card" href="#testing-middleware">
    <span class="ic-kicker">04</span>
    <div class="ic-title">Middleware</div>
    <p class="ic-desc">Verifying a middleware runs, passes or blocks.</p>
  </a>
  <a class="info-card" href="#integration-testing-patterns">
    <span class="ic-kicker">05</span>
    <div class="ic-title">Integration Patterns</div>
    <p class="ic-desc">Putting the pieces together in one test suite.</p>
  </a>
</div>

## Testing Controllers

### Basic Controller Testing

```typescript
import { describe, test, expect } from 'bun:test';
import { mockComponent } from '@asenajs/asena/test';
import { Controller } from '@asenajs/asena/decorators';
import { Inject } from '@asenajs/asena/decorators/ioc';
import { Get, Post } from '@asenajs/asena/decorators/http';
import type { Context } from '@asenajs/ergenecore';

@Service()
class UserService {
  async getUser(id: string) {
    // implementation
  }

  async createUser(name: string, email: string) {
    // implementation
  }
}

@Controller('/users')
class UserController {
  @Inject(UserService)
  private userService!: UserService;

  @Get('/:id')
  async getUser(context: Context) {
    const id = context.getParam('id');
    const user = await this.userService.getUser(id);
    return context.send(user);
  }

  @Post('/')
  async createUser(context: Context) {
    const { name, email } = await context.getBody<{ name: string; email: string }>();
    const user = await this.userService.createUser(name, email);
    return context.send(user, 201);
  }
}

describe('UserController', () => {
  test('GET /:id should return user', async () => {
    const { instance, mocks } = mockComponent(UserController);

    const mockUser = { id: 'user-123', name: 'John Doe' };
    mocks.userService.getUser.mockResolvedValue(mockUser);

    // Mock context - stub the methods the handler actually calls
    const mockContext = {
      getParam: mock(() => 'user-123'),
      send: mock((data) => data)
    } as unknown as Context;

    const result = await instance.getUser(mockContext);

    expect(result).toEqual(mockUser);
    expect(mocks.userService.getUser).toHaveBeenCalledWith('user-123');
  });

  test('POST / should create user', async () => {
    const { instance, mocks } = mockComponent(UserController);

    const mockUser = { id: 'user-123', name: 'John', email: 'john@example.com' };
    mocks.userService.createUser.mockResolvedValue(mockUser);

    const mockContext = {
      getBody: mock(async () => ({ name: 'John', email: 'john@example.com' })),
      send: mock((data, status) => ({ data, status }))
    } as unknown as Context;

    // send() is typed as returning a Response, so unwrap the stub's shape
    const result = (await instance.createUser(mockContext)) as unknown as {
      data: unknown;
      status: number;
    };

    expect(result.data).toEqual(mockUser);
    expect(result.status).toBe(201);
    expect(mocks.userService.createUser).toHaveBeenCalledWith('John', 'john@example.com');
  });
});
```

## Testing Services

### Service with Multiple Dependencies

```typescript
import { describe, test, expect } from 'bun:test';
import { mockComponent } from '@asenajs/asena/test';
import { Service } from '@asenajs/asena/decorators';
import { Inject } from '@asenajs/asena/decorators/ioc';

@Service()
class DatabaseService {
  async query(sql: string) {
    // implementation
  }
}

@Service()
class CacheService {
  async get(key: string) {
    // implementation
  }

  async set(key: string, value: any) {
    // implementation
  }
}

@Service()
class LoggerService {
  log(message: string) {
    // implementation
  }
}

@Service()
class UserService {
  @Inject(DatabaseService)
  private database!: DatabaseService;

  @Inject(CacheService)
  private cache!: CacheService;

  @Inject(LoggerService)
  private logger!: LoggerService;

  async getUser(id: string) {
    this.logger.log(`Fetching user ${id}`);

    // Check cache first
    const cached = await this.cache.get(`user:${id}`);
    if (cached) {
      return cached;
    }

    // Query database
    const user = await this.database.query(`SELECT * FROM users WHERE id = ${id}`);

    // Cache result
    await this.cache.set(`user:${id}`, user);

    return user;
  }
}

describe('UserService', () => {
  test('should return cached user when available', async () => {
    const { instance, mocks } = mockComponent(UserService);

    const mockUser = { id: 'user-123', name: 'John' };
    mocks.cache.get.mockResolvedValue(mockUser);

    const result = await instance.getUser('user-123');

    expect(result).toEqual(mockUser);
    expect(mocks.cache.get).toHaveBeenCalledWith('user:user-123');
    expect(mocks.database.query).not.toHaveBeenCalled();
    expect(mocks.logger.log).toHaveBeenCalledWith('Fetching user user-123');
  });

  test('should query database when cache miss', async () => {
    const { instance, mocks } = mockComponent(UserService);

    const mockUser = { id: 'user-123', name: 'John' };
    mocks.cache.get.mockResolvedValue(null);
    mocks.database.query.mockResolvedValue(mockUser);

    const result = await instance.getUser('user-123');

    expect(result).toEqual(mockUser);
    expect(mocks.cache.get).toHaveBeenCalledWith('user:user-123');
    expect(mocks.database.query).toHaveBeenCalled();
    expect(mocks.cache.set).toHaveBeenCalledWith('user:user-123', mockUser);
  });
});
```

### Testing Error Handling

```typescript
import { describe, test, expect } from 'bun:test';
import { mockComponent } from '@asenajs/asena/test';

describe('UserService - Error Handling', () => {
  test('should handle database errors', async () => {
    const { instance, mocks } = mockComponent(UserService);

    mocks.cache.get.mockResolvedValue(null);
    mocks.database.query.mockRejectedValue(new Error('Database connection failed'));

    await expect(instance.getUser('user-123')).rejects.toThrow('Database connection failed');
  });
});
```

## Testing WebSockets

### WebSocket Service Testing

```typescript
import { describe, test, expect, mock } from 'bun:test';
import { mockComponent } from '@asenajs/asena/test';
import { WebSocket } from '@asenajs/asena/decorators';
import { Inject } from '@asenajs/asena/decorators/ioc';
import { AsenaWebSocketService, type Socket } from '@asenajs/asena/web-socket';

@Service()
class MessageService {
  async saveMessage(userId: string, message: string) {
    // implementation
  }
}

@WebSocket('/chat')
class ChatSocket extends AsenaWebSocketService {
  @Inject(MessageService)
  private messageService!: MessageService;

  async onOpen(ws: Socket) {
    const userId = ws.data.values?.userId;
    ws.subscribe(`user:${userId}`);
  }

  async onMessage(ws: Socket, message: string) {
    const userId = ws.data.values?.userId;
    await this.messageService.saveMessage(userId, message);
    this.to(`user:${userId}`, { type: 'message', data: message });
  }

  async onClose(ws: Socket) {
    const userId = ws.data.values?.userId;
    ws.unsubscribe(`user:${userId}`);
  }
}

describe('ChatSocket', () => {
  test('onOpen should subscribe to user room', async () => {
    const { instance, mocks } = mockComponent(ChatSocket);

    const mockSocket = {
      data: { values: { userId: 'user-123' } },
      subscribe: mock(() => {})
    } as unknown as Socket;

    await instance.onOpen(mockSocket);

    expect(mockSocket.subscribe).toHaveBeenCalledWith('user:user-123');
  });

  test('onMessage should save and broadcast message', async () => {
    const { instance, mocks } = mockComponent(ChatSocket);

    const mockSocket = {
      data: { values: { userId: 'user-123' } }
    } as unknown as Socket;

    // Mock the 'to' method
    instance.to = mock(() => {});

    await instance.onMessage(mockSocket, 'Hello!');

    expect(mocks.messageService.saveMessage).toHaveBeenCalledWith('user-123', 'Hello!');
    expect(instance.to).toHaveBeenCalledWith('user:user-123', {
      type: 'message',
      data: 'Hello!'
    });
  });

  test('onClose should unsubscribe from room', async () => {
    const { instance, mocks } = mockComponent(ChatSocket);

    const mockSocket = {
      data: { values: { userId: 'user-123' } },
      unsubscribe: mock(() => {})
    } as unknown as Socket;

    await instance.onClose(mockSocket);

    expect(mockSocket.unsubscribe).toHaveBeenCalledWith('user:user-123');
  });
});
```

### Testing Ulak Messaging

Services that inject scoped namespaces via the [`ulak()` helper](/docs/concepts/ulak) work with `mockComponent` out of the box — no running WebSocket broker needed. The injected namespace becomes a deep mock whose methods are assertable Bun mocks.

```typescript
import { describe, test, expect, mock } from 'bun:test';
import { createTestUlakStub, mockComponent } from '@asenajs/asena/test';
import { Service } from '@asenajs/asena/decorators';
import { Inject } from '@asenajs/asena/decorators/ioc';
import { ulak, type Ulak } from '@asenajs/asena/messaging';

@Service('ChatService')
class ChatService {
  @Inject(ulak('/chat'))
  private chat: Ulak.NameSpace<'/chat'>;

  async sendMessage(roomId: string, message: string) {
    await this.chat.to(roomId, { message });
  }

  async broadcastAnnouncement(text: string) {
    await this.chat.broadcast({ type: 'announcement', text });
  }
}

describe('ChatService', () => {
  test('sendMessage should target the room', async () => {
    // Automatic deep mock - no setup required
    const { instance, mocks } = mockComponent(ChatService);

    await instance.sendMessage('room-1', 'Hello!');

    expect(mocks.chat.to).toHaveBeenCalledWith('room-1', { message: 'Hello!' });
  });

  test('broadcastAnnouncement should reach everyone', async () => {
    // Typed stub override - full Ulak.NameSpace interface with Bun mocks
    const chat = createTestUlakStub('/chat');

    const { instance } = mockComponent(ChatService, {
      overrides: { chat }
    });

    await instance.broadcastAnnouncement('Server maintenance at 22:00');

    expect(chat.broadcast).toHaveBeenCalledWith({
      type: 'announcement',
      text: 'Server maintenance at 22:00'
    });
  });
});
```

## Testing Middleware

### Custom Middleware Testing

```typescript
import { describe, test, expect, mock } from 'bun:test';
import { mockComponent } from '@asenajs/asena/test';
import { Middleware } from '@asenajs/asena/decorators';
import { Inject } from '@asenajs/asena/decorators/ioc';
import { MiddlewareService, type Context } from '@asenajs/ergenecore';

@Service()
class AuthService {
  async validateToken(token: string) {
    // implementation
  }
}

@Middleware()
class AuthMiddleware extends MiddlewareService {
  @Inject(AuthService)
  private authService!: AuthService;

  async handle(context: Context, next: () => Promise<void>) {
    const token = context.headers['authorization'];

    if (!token) {
      return context.send({ error: 'Unauthorized' }, 401);
    }

    const user = await this.authService.validateToken(token);

    if (!user) {
      return context.send({ error: 'Invalid token' }, 401);
    }

    context.setValue('user', user);
    return next();
  }
}

describe('AuthMiddleware', () => {
  test('should reject request without token', async () => {
    const { instance, mocks } = mockComponent(AuthMiddleware);

    const mockContext = {
      headers: {},
      send: mock((data, status) => ({ data, status }))
    } as unknown as Context;

    const mockNext = mock(async () => {});

    await instance.handle(mockContext, mockNext);

    expect(mockContext.send).toHaveBeenCalledWith({ error: 'Unauthorized' }, 401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  test('should reject request with invalid token', async () => {
    const { instance, mocks } = mockComponent(AuthMiddleware);

    mocks.authService.validateToken.mockResolvedValue(null);

    const mockContext = {
      headers: { authorization: 'Bearer invalid-token' },
      send: mock((data, status) => ({ data, status }))
    } as unknown as Context;

    const mockNext = mock(async () => {});

    await instance.handle(mockContext, mockNext);

    expect(mockContext.send).toHaveBeenCalledWith({ error: 'Invalid token' }, 401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  test('should allow request with valid token', async () => {
    const { instance, mocks } = mockComponent(AuthMiddleware);

    const mockUser = { id: 'user-123', name: 'John' };
    mocks.authService.validateToken.mockResolvedValue(mockUser);

    const mockContext = {
      headers: { authorization: 'Bearer valid-token' },
      setValue: mock(() => {})
    } as unknown as Context;

    const mockNext = mock(async () => {});

    await instance.handle(mockContext, mockNext);

    expect(mockContext.setValue).toHaveBeenCalledWith('user', mockUser);
    expect(mockNext).toHaveBeenCalled();
  });
});
```

## Integration Testing Patterns

`mockComponent` stops at the class boundary. When you need the framework itself in the loop — routing, middlewares, validators, real HTTP — use the harness.

### Full application

[`createTestApp`](/docs/testing/test-app) boots everything and gives you a fluent HTTP client:

```typescript
import { createTestApp, silentLogger } from '@asenajs/asena/test';
import { createHonoAdapter } from '@asenajs/hono-adapter';
import { describe, test, expect, mock } from 'bun:test';

describe('User API', () => {
  test('creates a user', async () => {
    const [adapter] = createHonoAdapter({ logger: silentLogger });

    await using app = await createTestApp({
      adapter,
      components: [AppConfig, UserController, UserService, CreateUserValidator],
    });

    await app
      .post('/api/users', { body: JSON.stringify({ name: 'Ada', email: 'ada@example.com' }) })
      .expectStatus(201)
      .expectJsonContains({ name: 'Ada' });
  });
});
```

### Replacing a dependency with a mock

`overrides` swaps a registered service for a double, the way Spring's `@MockBean` does. The real class is never constructed:

```typescript
test('surfaces repository failures as 500', async () => {
  const [adapter] = createHonoAdapter({ logger: silentLogger });

  await using app = await createTestApp({
    adapter,
    components: [AppConfig, UserController, UserService],
    overrides: {
      UserService: {
        getAll: mock(async () => {
          throw new Error('database is down');
        }),
      },
    },
  });

  await app.get('/api/users').expectStatus(500);
});
```

### Controller slice

[`createWebTest`](/docs/testing/web-test) keeps the controller, its middlewares and its validators real, and auto-mocks everything else:

```typescript
test('returns 404 for an unknown user', async () => {
  const [adapter] = createHonoAdapter({ logger: silentLogger });

  const { app, mocks } = await createWebTest({ adapter, controllers: [UserController] });

  mocks.UserService.getById.mockResolvedValue(null);

  await app.get('/api/users/3f1a9c7e-9b5d-4c2a-8f6e-1d2b3c4d5e6f').expectStatus(404);

  await app.stop();
});
```

Remember that validators are real here — an id that fails validation returns **400** before the controller runs, which is exactly the behaviour worth testing.

### Testing without occupying a port

`dispatch: 'socket'` runs the same adapter pipeline over a unix domain socket, so parallel suites cannot collide on ports:

```typescript
await using app = await createTestApp({
  adapter,
  components: [AppConfig, UserController, UserService],
  dispatch: 'socket',
});

await app.get('/api/users').expectStatus(200);

// WebSocket URLs differ per mode - let the harness build them
const socket = new WebSocket(app.wsUrl('/ws/chat'));
```

## Related

- [Testing Overview](/docs/testing/overview) - Introduction to testing in Asena
- [MockComponent API](/docs/testing/mock-component) - Complete API reference
- [createTestApp](/docs/testing/test-app) - Full-application testing
- [createWebTest](/docs/testing/web-test) - Controller-slice testing
- [Dependency Injection](/docs/concepts/dependency-injection) - Understanding DI in Asena
- [Controllers](/docs/concepts/controllers) - Controller documentation
- [Services](/docs/concepts/services) - Service documentation
- [WebSocket](/docs/concepts/websocket) - WebSocket documentation
- [Middleware](/docs/concepts/middleware) - Middleware documentation
