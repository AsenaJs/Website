---
title: MockComponent API
description: Complete API reference for Asena's automatic dependency mocking utilities
outline: deep
---

# MockComponent API

Asena's built-in testing utilities provide automated dependency mocking for components using dependency injection. The `mockComponent` and `mockComponentAsync` functions automatically discover and mock all injected dependencies.

## Quick Start

```typescript
import { mockComponent } from '@asenajs/asena/test';
import { Service } from '@asenajs/asena/decorators';
import { Inject } from '@asenajs/asena/decorators/ioc';
import { mock } from 'bun:test';

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

    // Configure mock behavior
    mocks.userService.createUser.mockResolvedValue({
      id: 'user-123',
      name: 'John Doe',
      email: 'john@example.com'
    });

    // Test
    const result = await instance.register('John', 'john@example.com', 'pass');

    expect(result.user.id).toBe('user-123');
    expect(mocks.userService.createUser).toHaveBeenCalledWith('John', 'john@example.com');
  });
});
```

## API Reference

### mockComponent

Creates a component instance with all dependencies automatically mocked.

```typescript
function mockComponent<T extends object>(
  ComponentClass: new (...args: any[]) => T,
  options?: MockComponentOptions
): MockedComponent<T>
```

**Parameters:**
- `ComponentClass` - The component class to instantiate
- `options` - Optional configuration (see [MockComponentOptions](#mockcomponentoptions))

**Returns:** [MockedComponent&lt;T&gt;](#mockedcomponentt)

**Example:**
```typescript
const { instance, mocks } = mockComponent(PaymentService);
```

### mockComponentAsync

Asynchronous version of `mockComponent` for components with async `postConstruct` hooks.

```typescript
async function mockComponentAsync<T extends object>(
  ComponentClass: new (...args: any[]) => T,
  options?: MockComponentOptions
): Promise<MockedComponent<T>>
```

**Parameters:** Same as `mockComponent`

**Returns:** Promise&lt;[MockedComponent&lt;T&gt;](#mockedcomponentt)&gt;

**Example:**
```typescript
import { Service } from '@asenajs/asena/decorators';
import { Inject } from '@asenajs/asena/decorators/ioc';

@Service()
class ConnectionPool {
  async connect() {
    // implementation
  }
}

@Service()
class DatabaseService {
  @Inject(ConnectionPool)
  private pool!: ConnectionPool;

  async initialize() {
    await this.pool.connect();
  }
}

const { instance, mocks } = await mockComponentAsync(DatabaseService, {
  postConstruct: async (inst) => {
    await inst.initialize();
  }
});
```

### MockComponentOptions

Configuration options for component mocking.

```typescript
interface MockComponentOptions {
  // Only mock specific fields (optional)
  injections?: string[];

  // Provide custom mocks instead of auto-generated ones (optional)
  overrides?: Record<string, any>;

  // Lifecycle hook called after injection (optional, can be async)
  postConstruct?: (instance: any) => void | Promise<void>;
}
```

**Properties:**

#### `injections`

Array of field names to mock. Other fields will not be mocked.

```typescript
const { instance, mocks } = mockComponent(PaymentService, {
  injections: ['stripe'] // Only mock stripe
});

expect(mocks.stripe).toBeDefined();
expect(mocks.logger).toBeUndefined();
```

#### `overrides`

Custom mock objects to use instead of auto-generated mocks.

```typescript
import { mock } from 'bun:test';

const customMock = {
  createUser: mock(async () => ({ id: 'custom-id' }))
};

const { instance, mocks } = mockComponent(AuthService, {
  overrides: { userService: customMock }
});

// mocks.userService is now your custom mock
expect(mocks.userService).toBe(customMock);
```

#### `postConstruct`

Lifecycle hook executed after dependencies are injected.

```typescript
const { instance, mocks } = mockComponent(AuthService, {
  postConstruct: (instance) => {
    console.log('Component ready for testing');
  }
});
```

::: tip Async Support
The `postConstruct` hook can be async. Use `mockComponentAsync` when you need to await the hook.
:::

### MockedComponent&lt;T&gt;

Return type of `mockComponent` and `mockComponentAsync`.

```typescript
interface MockedComponent<T> {
  instance: T;                // Component instance with injected mocks
  mocks: Record<string, any>; // Object containing all mock dependencies
}
```

**Properties:**

- **`instance`** - The component instance with all dependencies injected
- **`mocks`** - Object where keys are field names and values are mock objects

## Advanced Usage Patterns

### Selective Mocking

Mock only specific dependencies while leaving others undefined.

```typescript
import { Service } from '@asenajs/asena/decorators';
import { Inject } from '@asenajs/asena/decorators/ioc';

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
}

const { instance, mocks } = mockComponent(PaymentService, {
  injections: ['stripe'] // Only mock stripe, logger remains undefined
});

expect(mocks.stripe).toBeDefined();
expect(mocks.logger).toBeUndefined();
```

### Custom Overrides

Provide your own mock implementations for specific dependencies.

```typescript
import { mock } from 'bun:test';

const customUserService = {
  createUser: mock(async (name: string, email: string) => ({
    id: 'custom-id',
    name,
    email
  })),
  deleteUser: mock(async (id: string) => true)
};

const { instance, mocks } = mockComponent(AuthService, {
  overrides: {
    userService: customUserService
  }
});

// mocks.userService is now your custom mock
expect(mocks.userService).toBe(customUserService);
```

### Combining Options

You can combine `injections`, `overrides`, and `postConstruct` together.

```typescript
const { instance, mocks } = mockComponent(AuthService, {
  injections: ['userService', 'emailService'],
  overrides: {
    userService: customUserService
  },
  postConstruct: (inst) => {
    inst.setTestMode(true);
  }
});
```

### Expression Transformations

`mockComponent` supports `@Inject` expression transformations automatically.

```typescript
import { Service } from '@asenajs/asena/decorators';
import { Inject } from '@asenajs/asena/decorators/ioc';

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

// The expression is applied automatically
mocks.createUserFn.mockResolvedValue({ id: 'user-123' });
```

### Testing Components with Inheritance

`mockComponent` properly handles prototype chains.

```typescript
import { Service } from '@asenajs/asena/decorators';
import { Inject } from '@asenajs/asena/decorators/ioc';

@Service()
class LoggerService {
  log(message: string) {
    // implementation
  }
}

@Service()
class DatabaseService {
  query(sql: string) {
    // implementation
  }
}

@Service()
class BaseService {
  @Inject(LoggerService)
  protected logger!: LoggerService;
}

@Service()
class UserService extends BaseService {
  @Inject(DatabaseService)
  private database!: DatabaseService;
}

const { instance, mocks } = mockComponent(UserService);

// Both inherited and own dependencies are mocked
expect(mocks.logger).toBeDefined();
expect(mocks.database).toBeDefined();
```

## Technical Details

### How It Works

1. **Metadata Discovery** - Reads the same metadata that Asena's IoC Container uses (`ComponentConstants.DependencyKey` and `ComponentConstants.ExpressionKey`)
2. **Mock Generation** - Uses Bun's native `mock()` function to create mocks
   - Automatically detects async methods and creates `mock(async () => null)`
   - Sync methods get `mock(() => undefined)`
3. **Injection** - Injects mocks into the component instance
4. **Expression Support** - Applies expression transformations if defined

### Zero Dependencies

This feature follows Asena's zero-dependency philosophy:
- Uses only Bun's native `mock()` function from `bun:test`
- No external testing libraries required
- Fully compatible with Bun's test runner

### Import Path

```typescript
import { mockComponent, mockComponentAsync } from '@asenajs/asena/test';
```

Package export configuration:
```json
{
  "exports": {
    "./test": {
      "import": "./dist/lib/test/index.js",
      "types": "./dist/lib/test/index.d.ts"
    }
  }
}
```

## Related

- **[Testing Overview](/docs/testing/overview)** - Introduction to testing in Asena
- **[Examples](/docs/testing/examples)** - Real-world testing patterns
- **[Dependency Injection](/docs/concepts/dependency-injection)** - Understanding DI in Asena
- **[Bun Test Documentation](https://bun.sh/docs/cli/test)** - Learn more about Bun's test runner