---
title: Testing
description: Asena's built-in testing utilities for automatic dependency mocking with Bun's test runner
outline: deep
---

# Testing

Asena provides built-in testing utilities that automatically mock dependencies for components using dependency injection. These utilities are designed exclusively for [Bun's test runner](https://bun.sh/docs/cli/test).

::: info Built for Bun
Asena's testing utilities work exclusively with Bun's native test runner. They use Bun's `mock()` function from `bun:test` and are not compatible with other testing frameworks.
:::

## Bun Test Runner

Asena's testing utilities integrate with [Bun's built-in test runner](https://bun.sh/docs/cli/test), which provides:

- **Native Performance** - No transpilation, runs TypeScript directly
- **Jest-Compatible API** - Familiar `describe`, `test`, `expect` syntax
- **Built-in Mocking** - Native `mock()` function
- **Watch Mode** - Automatic re-running on file changes
- **Zero Configuration** - Works out of the box with TypeScript

```bash
# Run all tests
bun test

# Watch mode
bun test --watch

# Specific test file
bun test ./tests/auth.test.ts

# With coverage
bun test --coverage
```

## Automatic Dependency Mocking

The `mockComponent` function automatically discovers and mocks all injected dependencies:

```typescript
import { describe, test, expect } from 'bun:test';
import { mockComponent } from '@asenajs/asena/test';
import { Service } from '@asenajs/asena/server';
import { Inject } from '@asenajs/asena/ioc';

@Service()
class UserService {
  async createUser(name: string, email: string) {
    // implementation
  }
}

@Service()
class AuthService {
  @Inject(UserService)
  private userService!: UserService;

  async register(name: string, email: string, password: string) {
    const user = await this.userService.createUser(name, email);
    return { user, token: 'jwt-token' };
  }
}

// Test
describe('AuthService', () => {
  test('should register user', async () => {
    const { instance, mocks } = mockComponent(AuthService);

    mocks.userService.createUser.mockResolvedValue({
      id: 'user-123',
      name: 'John Doe',
      email: 'john@example.com'
    });

    const result = await instance.register('John', 'john@example.com', 'pass');

    expect(result.user.id).toBe('user-123');
    expect(mocks.userService.createUser).toHaveBeenCalledWith('John', 'john@example.com');
  });
});
```

## Import Path

```typescript
import { mockComponent, mockComponentAsync } from '@asenajs/asena/test';
```

## What You Can Test

### Services with Dependency Injection

```typescript
import { Service } from '@asenajs/asena/server';
import { Inject } from '@asenajs/asena/ioc';

@Service()
class StripeClient {
  async charge(amount: number) {
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
class PaymentService {
  @Inject(StripeClient)
  private stripe!: StripeClient;

  @Inject(LoggerService)
  private logger!: LoggerService;

  async processPayment(amount: number) {
    this.logger.log(`Processing payment: ${amount}`);
    return await this.stripe.charge(amount);
  }
}

const { instance, mocks } = mockComponent(PaymentService);
// Both stripe and logger are automatically mocked
```

### Controllers

```typescript
import { Controller } from '@asenajs/asena/server';
import { Inject } from '@asenajs/asena/ioc';
import { Get } from '@asenajs/asena/web';
import type { Context } from '@asenajs/ergenecore';

@Service()
class UserService {
  async getUser(id: string) {
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
    return this.userService.getUser(id);
  }
}

const { instance, mocks } = mockComponent(UserController);
```

### WebSocket Services

```typescript
import { WebSocket } from '@asenajs/asena/server';
import { Inject } from '@asenajs/asena/ioc';
import { AsenaWebSocketService, type Socket } from '@asenajs/asena/web-socket';

@Service()
class MessageService {
  async saveMessage(message: string) {
    // implementation
  }
}

@WebSocket('/chat')
class ChatSocket extends AsenaWebSocketService {
  @Inject(MessageService)
  private messageService!: MessageService;

  async onMessage(ws: Socket, message: string) {
    await this.messageService.saveMessage(message);
  }
}

const { instance, mocks } = mockComponent(ChatSocket);
```

## Main Testing Utilities

### mockComponent

Synchronous component instantiation with automatic dependency mocking.

```typescript
const { instance, mocks } = mockComponent(AuthService);
```

Returns an object with:
- `instance` - The component instance with all dependencies mocked
- `mocks` - Object containing all mock dependencies

See the [MockComponent API](/docs/testing/mock-component) documentation for detailed usage.

### mockComponentAsync

Asynchronous version for components with `postConstruct` hooks.

```typescript
@Service()
class DatabaseService {
  @Inject(ConnectionPool)
  private pool!: ConnectionPool;

  async initialize() {
    // async initialization
  }
}

const { instance, mocks } = await mockComponentAsync(DatabaseService, {
  postConstruct: async (inst) => {
    await inst.initialize();
  }
});
```

## Advanced Features

### Selective Mocking

Mock only specific dependencies:

```typescript
const { instance, mocks } = mockComponent(PaymentService, {
  injections: ['stripe'] // Only mock stripe, logger remains undefined
});

expect(mocks.stripe).toBeDefined();
expect(mocks.logger).toBeUndefined();
```

### Custom Overrides

Provide custom mock implementations:

```typescript
import { mock } from 'bun:test';

const customUserService = {
  createUser: mock(async (name: string, email: string) => ({
    id: 'custom-id',
    name,
    email
  }))
};

const { instance, mocks } = mockComponent(AuthService, {
  overrides: { userService: customUserService }
});
```

### Expression Transformations

Supports `@Inject` expression transformations:

```typescript
import { Service } from '@asenajs/asena/server';
import { Inject } from '@asenajs/asena/ioc';

@Service()
class UserService {
  async createUser(name: string, email: string) {
    // implementation
  }
}

@Service()
class AuthService {
  @Inject(UserService, (service) => service.createUser)
  private createUserFn!: (name: string, email: string) => Promise<User>;
}

const { instance, mocks } = mockComponent(AuthService);
mocks.createUserFn.mockResolvedValue({ id: 'user-123' });
```

## How It Works

1. **Metadata Discovery** - Reads the same metadata that Asena's IoC Container uses
2. **Mock Generation** - Uses Bun's native `mock()` function to create mocks
3. **Injection** - Injects mocks into the component instance
4. **Expression Support** - Applies expression transformations if defined

## Next Steps

- **[MockComponent API](/docs/testing/mock-component)** - Complete API reference and advanced usage
- **[Examples](/docs/testing/examples)** - Real-world testing patterns for controllers, services, and WebSockets
- **[Bun Test Documentation](https://bun.sh/docs/cli/test)** - Learn more about Bun's test runner