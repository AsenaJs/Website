---
title: Testing Examples
description: Real-world testing patterns for controllers, services, WebSockets, and middleware in Asena
outline: deep
---

# Testing Examples

This page provides practical testing examples for common Asena components.

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
    return context.json(user);
  }

  @Post('/')
  async createUser(context: Context) {
    const { name, email } = await context.getBody();
    const user = await this.userService.createUser(name, email);
    return context.json(user, 201);
  }
}

describe('UserController', () => {
  test('GET /:id should return user', async () => {
    const { instance, mocks } = mockComponent(UserController);

    const mockUser = { id: 'user-123', name: 'John Doe' };
    mocks.userService.getUser.mockResolvedValue(mockUser);

    // Mock context
    const mockContext = {
      getParam: mock(() => 'user-123'),
      json: mock((data) => data)
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
      json: mock((data, status) => ({ data, status }))
    } as unknown as Context;

    const result = await instance.createUser(mockContext);

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

  async handle(context: Context, next: Function) {
    const token = context.getHeader('authorization');

    if (!token) {
      return context.json({ error: 'Unauthorized' }, 401);
    }

    const user = await this.authService.validateToken(token);

    if (!user) {
      return context.json({ error: 'Invalid token' }, 401);
    }

    context.setValue('user', user);
    return next();
  }
}

describe('AuthMiddleware', () => {
  test('should reject request without token', async () => {
    const { instance, mocks } = mockComponent(AuthMiddleware);

    const mockContext = {
      getHeader: mock(() => null),
      json: mock((data, status) => ({ data, status }))
    } as unknown as Context;

    const mockNext = mock(() => {});

    const result = await instance.handle(mockContext, mockNext);

    expect(result.data).toEqual({ error: 'Unauthorized' });
    expect(result.status).toBe(401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  test('should reject request with invalid token', async () => {
    const { instance, mocks } = mockComponent(AuthMiddleware);

    mocks.authService.validateToken.mockResolvedValue(null);

    const mockContext = {
      getHeader: mock(() => 'Bearer invalid-token'),
      json: mock((data, status) => ({ data, status }))
    } as unknown as Context;

    const mockNext = mock(() => {});

    const result = await instance.handle(mockContext, mockNext);

    expect(result.data).toEqual({ error: 'Invalid token' });
    expect(result.status).toBe(401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  test('should allow request with valid token', async () => {
    const { instance, mocks } = mockComponent(AuthMiddleware);

    const mockUser = { id: 'user-123', name: 'John' };
    mocks.authService.validateToken.mockResolvedValue(mockUser);

    const mockContext = {
      getHeader: mock(() => 'Bearer valid-token'),
      setValue: mock(() => {})
    } as unknown as Context;

    const mockNext = mock(() => 'next-response');

    const result = await instance.handle(mockContext, mockNext);

    expect(mockContext.setValue).toHaveBeenCalledWith('user', mockUser);
    expect(mockNext).toHaveBeenCalled();
    expect(result).toBe('next-response');
  });
});
```

## Integration Testing Patterns

::: info Coming Soon
Integration testing patterns and examples will be added in future updates.
:::

## Related

- **[Testing Overview](/docs/testing/overview)** - Introduction to testing in Asena
- **[MockComponent API](/docs/testing/mock-component)** - Complete API reference
- **[Dependency Injection](/docs/concepts/dependency-injection)** - Understanding DI in Asena
- **[Controllers](/docs/concepts/controllers)** - Controller documentation
- **[Services](/docs/concepts/services)** - Service documentation
- **[WebSocket](/docs/concepts/websocket)** - WebSocket documentation
- **[Middleware](/docs/concepts/middleware)** - Middleware documentation