---
title: Services
description: Business logic layer with dependency injection
outline: deep
---

# Services

Services contain your application's business logic and are the core of your application's functionality. They are injectable classes that can be used throughout your application using Asena's dependency injection system.

## What is a Service?

A service is a class decorated with `@Service()` that contains business logic, data manipulation, external API calls, or any other application-specific functionality. Services promote:

- **Separation of Concerns**: Keep controllers thin and business logic in services
- **Reusability**: Share logic across multiple controllers
- **Testability**: Easy to unit test in isolation
- **Maintainability**: Centralized business logic

## Creating a Service

### Basic Service

```typescript
import { Service } from '@asenajs/asena/server';

@Service()
export class UserService {
  async findUser(id: string) {
    // Business logic
    return { id, name: 'John Doe', email: 'john@example.com' };
  }

  async createUser(data: { name: string; email: string }) {
    // Validation and business logic
    if (!data.email.includes('@')) {
      throw new Error('Invalid email');
    }

    return { id: 'new-id', ...data };
  }

  async deleteUser(id: string) {
    // Business logic
    return { success: true };
  }
}
```

## Using Services in Controllers

Inject services into controllers using the `@Inject` decorator:

```typescript
import { Controller } from '@asenajs/asena/server';
import { Get, Post, Delete } from '@asenajs/asena/web';
import { Inject } from '@asenajs/asena/ioc';
import type { Context } from '@asenajs/ergenecore/types';

@Controller('/users')
export class UserController {
  @Inject(UserService)
  private userService: UserService;

  @Get('/:id')
  async getUser(context: Context) {
    const id = context.getParam('id');
    const user = await this.userService.findUser(id);
    return context.send(user);
  }

  @Post('/')
  async createUser(context: Context) {
    const data = await context.getBody();
    const user = await this.userService.createUser(data);
    return context.send(user, 201);
  }

  @Delete('/:id')
  async deleteUser(context: Context) {
    const id = context.getParam('id');
    await this.userService.deleteUser(id);
    return context.send({ success: true }, 204);
  }
}
```

## Service Dependencies

Services can depend on other services:

```typescript
// Emailservice.ts
import { Service } from '@asenajs/asena/server';
import { Inject } from '@asenajs/asena/ioc';


@Service()
export class EmailService {
  async sendEmail(to: string, subject: string, body: string) {
    console.log(`Sending email to ${to}: ${subject}`);
    // Email sending logic
  }
}
```

```typescript
// UserService.ts
import { Service } from '@asenajs/asena/server';
import { Inject } from '@asenajs/asena/ioc';


@Service()
export class UserService {
  @Inject(EmailService)
  private emailService: EmailService;

  async createUser(data: { name: string; email: string }) {
    const user = { id: 'new-id', ...data };

    // Send welcome email
    await this.emailService.sendEmail(
      user.email,
      'Welcome!',
      `Hello ${user.name}, welcome to our platform!`
    );

    return user;
  }
}
```

## Layered Architecture

Asena promotes a clean layered architecture:

```
Request -> Controller -> Service -> Repository -> Database

Response <- Controller <- Service <- Repository <- Database
```

### Example: Complete Layered Structure

```typescript
// repository.ts
import { Repository, BaseRepository } from '@asenajs/asena-drizzle';
import { eq } from 'drizzle-orm';

@Repository({ table: users, databaseService: 'MainDB' })
export class UserRepository extends BaseRepository<typeof users , BunSQLDatabase> {
  async findByEmail(email: string) {
    return this.findOne(eq(users.email, email));
  }
}

// service.ts
@Service()
export class UserService {
  @Inject(UserRepository)
  private userRepo: UserRepository;

  @Inject(EmailService)
  private emailService: EmailService;

  async createUser(data: { name: string; email: string }) {
    // Check if user exists
    const existing = await this.userRepo.findByEmail(data.email);
    if (existing) {
      throw new Error('Email already exists');
    }

    // Create user
    const user = await this.userRepo.create(data);

    // Send welcome email
    await this.emailService.sendEmail(
      user.email,
      'Welcome!',
      `Hello ${user.name}!`
    );

    return user;
  }

  async getUser(id: string) {
    const user = await this.userRepo.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }
}

// controller.ts
@Controller('/users')
export class UserController {
  @Inject(UserService)
  private userService: UserService;

  @Get('/:id')
  async getUser(context: Context) {
    const user = await this.userService.getUser(context.getParam('id'));
    return context.send(user);
  }

  @Post('/')
  async createUser(context: Context) {
    const data = await context.getBody();
    const user = await this.userService.createUser(data);
    return context.send(user, 201);
  }
}
```

## Service Patterns

### 1. Business Logic Service

```typescript
@Service()
export class OrderService {
  @Inject(OrderRepository)
  private orderRepo: OrderRepository;

  @Inject(InventoryService)
  private inventoryService: InventoryService;

  @Inject(PaymentService)
  private paymentService: PaymentService;

  async createOrder(items: Array<{ productId: string; quantity: number }>) {
    // Check inventory
    for (const item of items) {
      const available = await this.inventoryService.checkStock(
        item.productId,
        item.quantity
      );
      if (!available) {
        throw new Error(`Product ${item.productId} is out of stock`);
      }
    }

    // Calculate total
    const total = await this.calculateTotal(items);

    // Process payment
    const payment = await this.paymentService.charge(total);

    // Create order
    const order = await this.orderRepo.create({
      items,
      total,
      paymentId: payment.id,
      status: 'pending'
    });

    // Update inventory
    for (const item of items) {
      await this.inventoryService.decrementStock(
        item.productId,
        item.quantity
      );
    }

    return order;
  }

  private async calculateTotal(items: Array<{ productId: string; quantity: number }>) {
    // Calculate logic
    return 100;
  }
}
```

### 2. Integration Service

```typescript
@Service()
export class StripeService {
  private stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);

  async createPaymentIntent(amount: number, currency: string = 'usd') {
    return await this.stripeClient.paymentIntents.create({
      amount: amount * 100, // Convert to cents
      currency,
    });
  }

  async confirmPayment(paymentIntentId: string) {
    return await this.stripeClient.paymentIntents.confirm(paymentIntentId);
  }
}
```

### 3. Utility Service

```typescript
@Service()
export class CryptoService {
  async hashPassword(password: string): Promise<string> {
    return await Bun.password.hash(password);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await Bun.password.verify(password, hash);
  }

  generateToken(length: number = 32): string {
    const buffer = new Uint8Array(length);
    crypto.getRandomValues(buffer);
    return Buffer.from(buffer).toString('hex');
  }
}
```

## Service Scopes

Services can have different lifecycle scopes that control how instances are created and shared.

### Singleton Scope (Default)

By default, all services use `Scope.SINGLETON` - a single instance is created and shared across the entire application:

```typescript
import { Service } from '@asenajs/asena/server';
import { Scope } from '@asenajs/asena/ioc';

@Service() // Default: Scope.SINGLETON
export class ConfigService {
  private config = { apiUrl: 'https://api.example.com' };

  getConfig() {
    return this.config;
  }
}

// Or explicitly:
@Service({ scope: Scope.SINGLETON })
export class DatabaseService {
  // Same instance shared everywhere
}
```

**When to use SINGLETON:**
- Configuration services
- Database connections
- Caching services
- Stateless services
- Services that maintain application-wide state

### Prototype Scope

`Scope.PROTOTYPE` creates a **new instance** for every injection:

```typescript
import { Service } from '@asenajs/asena/server';
import { Scope } from '@asenajs/asena/ioc';


@Service({ scope: Scope.PROTOTYPE })
export class RequestLoggerService {
  private requestId = crypto.randomUUID();
  private logs: string[] = [];

  log(message: string) {
    this.logs.push(`[${this.requestId}] ${message}`);
  }

  getLogs() {
    return this.logs;
  }
}

// Each injection gets a new instance:
@Controller('/users')
export class UserController {
  @Inject(RequestLoggerService) // New instance
  private logger: RequestLoggerService;
}

@Controller('/posts')
export class PostController {
  @Inject(RequestLoggerService) // Different instance
  private logger: RequestLoggerService;
}
```

**When to use PROTOTYPE:**
- Services that hold per-request state
- Services that shouldn't be shared
- Services with mutable state per instance
- Testing scenarios where isolation is needed

### Scope Comparison

| Aspect | Singleton | Prototype |
|:-------|:----------|:----------|
| **Instances** | One per application | One per injection |
| **Memory** | Low (single instance) | Higher (multiple instances) |
| **State** | Shared across app | Isolated per injection |
| **Performance** | Fast (reused) | Slower (created each time) |
| **Use Case** | Stateless services, configs | Per-request state, isolation |

::: warning State Management in Singletons
Singleton services are shared across all requests. Be careful with mutable state:

```typescript
// ❌ Bad: Shared mutable state in singleton
@Service() // Singleton by default
export class UserService {
  private currentUser: User; // Shared across all requests - DANGEROUS!

  setCurrentUser(user: User) {
    this.currentUser = user; // Race condition!
  }
}

// ✅ Good: Pass state as parameters
@Service()
export class UserService {
  async getUserData(userId: string) {
    // Stateless - safe for singletons
    return await this.userRepo.findById(userId);
  }
}
```
:::

## String-based vs Class-based Injection

Asena supports two ways to inject services: by class reference or by string name.

### Class-based Injection (Recommended)

```typescript
@Service()
export class UserService {
  async findUser(id: string) {
    return { id, name: 'John' };
  }
}

@Controller('/users')
export class UserController {
  @Inject(UserService) // ✅ Type-safe
  private userService: UserService;

  @Get('/:id')
  async getUser(context: Context) {
    // TypeScript knows all methods
    const user = await this.userService.findUser(context.getParam('id'));
    return context.send(user);
  }
}
```

**Advantages:**
- ✅ Full TypeScript type safety
- ✅ IDE autocomplete and intellisense
- ✅ Refactoring support (rename class updates all references)
- ✅ Compile-time error detection

### String-based Injection

```typescript
@Service('UserService') // Register with custom name
export class UserService {
  async findUser(id: string) {
    return { id, name: 'John' };
  }
}

@Controller('/users')
export class UserController {
  @Inject('UserService') // Maybe throw runtime error
  private userService: UserService;

  @Get('/:id')
  async getUser(context: Context) {
    const user = await this.userService.findUser(context.getParam('id'));
    return context.send(user);
  }
}
```

**Advantages:**
- ✅ Loose coupling (no direct class import)
- ✅ Dynamic service resolution
- ✅ Useful for plugin systems or dynamic loading

**Disadvantages:**
- ❌ No compile-time type checking
- ❌ Runtime errors if service name is misspelled
- ❌ No IDE autocomplete

::: tip When to Use String-based Injection?
Use string-based injection when:
- Building plugin architectures
- Need to swap implementations at runtime
- Working with dynamically loaded modules
- Absolute decoupling is required
- it can improve IDE performance

For most use cases, **class-based injection is recommended**.
:::

## @Service Decorator API

Complete reference for the `@Service` decorator:

```typescript
import { Service } from '@asenajs/asena/server';
import { Scope } from '@asenajs/asena/ioc';

// 1. Basic service (singleton by default)
@Service()
export class BasicService { }

// 2. Named service (string-based injection)
@Service('MyCustomService')
export class NamedService { }

// 3. Prototype scope (new instance per injection)
@Service({ scope: Scope.PROTOTYPE })
export class PrototypeService { }

// 4. Named with prototype scope
@Service({ name: 'RequestHandler', scope: Scope.PROTOTYPE })
export class RequestHandlerService { }
```

### ComponentParams Interface

```typescript
interface ComponentParams {
  name?: string;    // Custom name for string-based injection
  scope?: Scope;    // Scope.SINGLETON or Scope.PROTOTYPE
}
```

| Parameter | Type | Default | Description |
|:----------|:-----|:--------|:------------|
| `name` | `string` | `undefined` | Custom name for the service. Enables string-based injection. |
| `scope` | `Scope` | `Scope.SINGLETON` | Service lifecycle scope. |

## Asena-Specific Best Practices

### 1. Choose the Right Scope

```typescript
// ✅ Singleton for stateless services
@Service()
export class EmailService {
  async send(to: string, subject: string) {
    // No mutable state - safe as singleton
  }
}

// ✅ Prototype for per-request state
@Service({ scope: Scope.PROTOTYPE })
export class RequestContextService {
  private startTime = Date.now();
  private metrics: any[] = [];

  trackMetric(name: string, value: number) {
    this.metrics.push({ name, value });
  }
}
```

### 2. Use Class-based Injection by Default

```typescript
// ✅ Preferred: Type-safe class injection
@Inject(UserService)
private userService: UserService;

// ⚠️ Only when necessary: String injection
@Inject('UserService')
private userService: any;
```

### 3. Avoid Circular Dependencies

```typescript
// ❌ Bad: Circular dependency
@Service()
export class ServiceA {
  @Inject(ServiceB)
  private serviceB: ServiceB;
}

@Service()
export class ServiceB {
  @Inject(ServiceA)
  private serviceA: ServiceA; // Circular!
}

// ✅ Good: Introduce an intermediate service
@Service()
export class SharedService { }

@Service()
export class ServiceA {
  @Inject(SharedService)
  private shared: SharedService;
}

@Service()
export class ServiceB {
  @Inject(SharedService)
  private shared: SharedService;
}
```

::: tip WebSocket + Services Circular Dependencies
A common circular dependency occurs when **services need to send WebSocket messages** and **WebSocket handlers need to inject services** for business logic.

**Problem:**
```typescript
// ❌ This creates a circular dependency
@WebSocket('/notifications')
export class NotificationWebSocket extends AsenaWebSocketService<{}> {
  @Inject(UserService)  // WebSocket needs service
  private userService: UserService;
}

@Service('UserService')
export class UserService {
  @Inject(NotificationWebSocket)  // ❌ Circular!
  private notificationWs: NotificationWebSocket;
}
```

**Solution: Use Ulak Message Broker**

Ulak breaks this circular dependency by acting as a centralized message broker:

```typescript
import { Service} from '@asenajs/asena/server';
import { Inject } from '@asenajs/asena/ioc';
import { ulak, type Ulak } from '@asenajs/asena/messaging';

@Service('UserService')
export class UserService {
  // ✅ Inject Ulak namespace instead of WebSocket service
  @Inject(ulak('/notifications'))
  private notifications: Ulak.NameSpace<'/notifications'>;

  async createUser(name: string, email: string) {
    const user = await this.saveUser(name, email);

    // Send WebSocket message without injecting the WebSocket service
    await this.notifications.broadcast({
      type: 'user_created',
      user
    });

    return user;
  }

  private async saveUser(name: string, email: string) {
    // Database logic
    return { id: '123', name, email };
  }
}
```

For complete documentation on breaking WebSocket circular dependencies, see [Ulak - WebSocket Messaging System](/docs/concepts/ulak).
:::

## Testing Services

Services are easy to test in isolation:

```typescript
import { describe, expect, it, mock } from 'bun:test';
import { UserService } from './UserService';

describe('UserService', () => {
  it('should create user successfully', async () => {
    const mockRepo = {
      findByEmail: mock(() => Promise.resolve(null)),
      create: mock((data) => Promise.resolve({ id: '123', ...data }))
    };

    const service = new UserService();
    service['userRepo'] = mockRepo as any;

    const result = await service.createUser({
      name: 'John',
      email: 'john@example.com'
    });

    expect(result).toEqual({
      id: '123',
      name: 'John',
      email: 'john@example.com'
    });
    expect(mockRepo.create).toHaveBeenCalled();
  });

  it('should throw error if email exists', async () => {
    const mockRepo = {
      findByEmail: mock(() => Promise.resolve({ id: '1', email: 'john@example.com' }))
    };

    const service = new UserService();
    service['userRepo'] = mockRepo as any;

    await expect(
      service.createUser({ name: 'John', email: 'john@example.com' })
    ).rejects.toThrow('Email already exists');
  });
});
```

## Related Documentation

- [Dependency Injection](/docs/concepts/dependency-injection)
- [Controllers](/docs/concepts/controllers)
- [Ulak - WebSocket Messaging System](/docs/concepts/ulak) - Break circular dependencies with WebSocket
- [WebSocket](/docs/concepts/websocket)
- [Drizzle ORM](/docs/packages/drizzle)
- [Testing Guide](/docs/guides/testing)

---

**Next Steps:**
- Learn about [Dependency Injection](/docs/concepts/dependency-injection)
- Explore [Repository Pattern](/docs/packages/drizzle)
- Understand [Testing Strategies](/docs/guides/testing)
