---
title: Dependency Injection
description: IoC container and field-based dependency injection in Asena
outline: deep
---

# Dependency Injection

Asena provides a powerful IoC (Inversion of Control) container with field-based dependency injection. This allows you to inject services, repositories, and other components into your classes automatically.

## What is Dependency Injection?

Dependency Injection (DI) is a design pattern where dependencies are provided to a class rather than the class creating them itself. This promotes:

- **Loose Coupling**: Classes don't need to know how to create their dependencies
- **Testability**: Easy to mock dependencies in tests
- **Maintainability**: Change implementations without modifying dependent code
- **Reusability**: Share instances across your application

## Basic Injection with @Inject

The `@Inject` decorator is used to inject dependencies into your classes.

### Simple Class Injection

```typescript
import { Controller } from '@asenajs/asena/server';
import { Get } from '@asenajs/asena/web';
import { Inject } from '@asenajs/asena/ioc';
import type { Context } from '@asenajs/ergenecore/types';
import { UserService } from '../services/UserService';

@Controller('/users')
export class UserController {
  @Inject(UserService)
  private userService: UserService;

  @Get('/')
  async list(context: Context) {
    const users = await this.userService.getAllUsers();
    return context.send({ users });
  }
}
```

### String-Based Injection

Inject services by their registered name:

```typescript
import { Service } from '@asenajs/asena/server';

@Service('UserService')
export class UserService {
  getAllUsers() {
    return [{ id: 1, name: 'John' }];
  }
}

// Inject by string name
@Controller('/users')
export class UserController {
  @Inject('UserService')
  private userService: any; // Type must be specified manually

  @Get('/')
  async list(context: Context) {
    const users = this.userService.getAllUsers();
    return context.send({ users });
  }
}
```

::: tip Class vs String Injection
- **Class-based** - Type-safe, refactor-friendly (recommended)
- **String-based** - Loose coupling, dynamic resolution
:::

## Injection with Expressions

Expressions allow you to transform the injected dependency or extract specific properties.

### Extract Property from Service

```typescript
import { Inject } from '@asenajs/asena/ioc';
import { DatabaseService } from '../services/DatabaseService';
import type { BunSQLDatabase } from 'drizzle-orm/bun-sqlite';

@Service()
export class UserRepository {
  // Inject the 'connection' property from DatabaseService
  @Inject(DatabaseService, (service: DatabaseService) => service.connection)
  protected db: BunSQLDatabase;

  async findAll() {
    return await this.db.select().from(users);
  }
}
```

### Extract Method Result

```typescript
@Service()
export class ProductController {
  // Inject the result of calling getItems()
  @Inject(ItemService, (service: ItemService) => service.getItems())
  private items: string[];

  @Get('/items')
  getItems(context: Context) {
    return context.send({ items: this.items });
  }
}
```

### Complex Transformations

```typescript
@Service()
export class ConfigService {
  getConfig() {
    return {
      apiUrl: 'https://api.example.com',
      timeout: 5000,
      retries: 3
    };
  }
}

@Service()
export class ApiService {
  // Extract only the apiUrl from config
  @Inject(ConfigService, (service: ConfigService) => service.getConfig().apiUrl)
  private apiUrl: string;

  async fetchData() {
    const response = await fetch(`${this.apiUrl}/data`);
    return response.json();
  }
}
```

### Expression Signature

```typescript
@Inject(ServiceClass, (service: ServiceType) => any)
```

| Parameter | Type | Description |
|:----------|:-----|:------------|
| `ServiceClass` | `Class` or `string` | Service to inject |
| `expression` | `(service) => any` | Optional transformation function |

## Strategy Pattern with @Strategy

The `@Strategy` decorator injects **all implementations** of an interface, enabling the Strategy design pattern.

### 1. Define Interface

```typescript
// src/services/NotificationService.ts
export interface NotificationService {
  send(userId: string, message: string): Promise<void>;
}
```

### 2. Implement Multiple Strategies

Mark implementations with `@Implements`:

```typescript
// src/services/EmailNotificationService.ts
import { Service, Implements } from '@asenajs/asena/server';
import type { NotificationService } from './NotificationService';

@Service()
@Implements('NotificationService')
export class EmailNotificationService implements NotificationService {
  async send(userId: string, message: string): Promise<void> {
    console.log(`Sending email to user ${userId}: ${message}`);
    // Email sending logic
  }
}
```

```typescript
// src/services/SmsNotificationService.ts
import { Service, Implements } from '@asenajs/asena/server';
import type { NotificationService } from './NotificationService';

@Service()
@Implements('NotificationService')
export class SmsNotificationService implements NotificationService {
  async send(userId: string, message: string): Promise<void> {
    console.log(`Sending SMS to user ${userId}: ${message}`);
    // SMS sending logic
  }
}
```

```typescript
// src/services/PushNotificationService.ts
import { Service, Implements } from '@asenajs/asena/server';
import type { NotificationService } from './NotificationService';

@Service()
@Implements('NotificationService')
export class PushNotificationService implements NotificationService {
  async send(userId: string, message: string): Promise<void> {
    console.log(`Sending push notification to user ${userId}: ${message}`);
    // Push notification logic
  }
}
```

### 3. Inject All Implementations

```typescript
import { Strategy } from '@asenajs/asena/ioc';
import type { NotificationService } from '../services/NotificationService';

@Service()
export class NotificationManager {
  @Strategy('NotificationService')
  private notificationServices: NotificationService[];

  async notifyUser(userId: string, message: string) {
    // Send notification via all channels
    for (const service of this.notificationServices) {
      await service.send(userId, message);
    }
  }
}
```

### Strategy with Expressions

Extract specific properties from all implementations:

```typescript
interface PaymentProvider {
  name: string;
  process(amount: number): Promise<void>;
}

@Service()
@Implements('PaymentProvider')
export class StripeProvider implements PaymentProvider {
  name = 'Stripe';
  async process(amount: number) { /* ... */ }
}

@Service()
@Implements('PaymentProvider')
export class PayPalProvider implements PaymentProvider {
  name = 'PayPal';
  async process(amount: number) { /* ... */ }
}

// Inject only the names
@Service()
export class PaymentService {
  @Strategy('PaymentProvider', (provider: PaymentProvider) => provider.name)
  private providerNames: string[]; // ['Stripe', 'PayPal']

  getAvailableProviders() {
    return this.providerNames;
  }
}
```

## Lifecycle Hooks with @PostConstruct

The `@PostConstruct` decorator marks a method to be called **after** all dependencies have been injected and the component is fully constructed.

### Basic Usage

```typescript
import { Service } from '@asenajs/asena/server';
import { Inject } from '@asenajs/asena/ioc';
import { PostConstruct } from '@asenajs/asena/ioc';

@Service()
export class UserService {
  @Inject(DatabaseService)
  private db: DatabaseService;

  private cache: Map<string, any>;

  @PostConstruct()
  async initialize() {
    // Called after all @Inject dependencies are resolved
    console.log('UserService initializing...');

    // Initialize cache
    this.cache = new Map();

    // Preload data
    const users = await this.db.getAllUsers();
    users.forEach(user => this.cache.set(user.id, user));

    console.log(`UserService initialized with ${users.length} cached users`);
  }

  getUser(id: string) {
    return this.cache.get(id);
  }
}
```

### Use Cases for @PostConstruct

**1. Initialization Logic**

```typescript
@Service()
export class CacheService {
  private redis: RedisClient;

  @PostConstruct()
  async connect() {
    this.redis = await createRedisClient();
    console.log('Redis connection established');
  }
}
```

**2. Validation**

```typescript
@Service()
export class ConfigService {
  @Inject('ENV_API_KEY')
  private apiKey: string;

  @PostConstruct()
  validate() {
    if (!this.apiKey || this.apiKey.length < 32) {
      throw new Error('Invalid API key configuration');
    }
  }
}
```

**3. Setup with Injected Dependencies**

```typescript
@Service()
export class EventSubscriberService {
  @Inject(EventBus)
  private eventBus: EventBus;

  @PostConstruct()
  subscribeToEvents() {
    // Subscribe to events after EventBus is injected
    this.eventBus.on('user.created', this.handleUserCreated.bind(this));
    this.eventBus.on('user.updated', this.handleUserUpdated.bind(this));
  }

  private handleUserCreated(user: any) {
    console.log('User created:', user);
  }

  private handleUserUpdated(user: any) {
    console.log('User updated:', user);
  }
}
```

**4. Data Preloading**

```typescript
@Service()
export class CountryService {
  @Inject(DatabaseService)
  private db: DatabaseService;

  private countries: Map<string, Country>;

  @PostConstruct()
  async preloadCountries() {
    const data = await this.db.query('SELECT * FROM countries');
    this.countries = new Map(data.map(c => [c.code, c]));
    console.log(`Preloaded ${this.countries.size} countries`);
  }

  getCountry(code: string): Country | undefined {
    return this.countries.get(code);
  }
}
```

### Execution Order

1. Class constructor runs
2. All `@Inject` dependencies are resolved
3. All `@PostConstruct` methods are called

```typescript
@Service()
export class ExampleService {
  @Inject(LoggerService)
  private logger: LoggerService;

  constructor() {
    console.log('1. Constructor called');
    // this.logger is undefined here!
  }

  @PostConstruct()
  initialize() {
    console.log('2. PostConstruct called');
    // this.logger is available here!
    this.logger.info('Service initialized');
  }
}
```

::: warning Async PostConstruct
`@PostConstruct` methods can be async. Asena waits for them to complete before the application starts.
:::

## Service Scopes

Control the lifecycle of injected services with scopes.

### Singleton Scope (Default)

One instance shared across the entire application:

```typescript
import { Service, Scope } from '@asenajs/asena/server';

@Service() // Default: Scope.SINGLETON
export class ConfigService {
  private config = { apiUrl: 'https://api.example.com' };

  getConfig() {
    return this.config;
  }
}
```

### Prototype Scope

New instance created for every injection:

```typescript
import { Service, Scope } from '@asenajs/asena/server';

@Service({ scope: Scope.PROTOTYPE })
export class RequestLogger {
  private requestId = crypto.randomUUID();
  private logs: string[] = [];

  log(message: string) {
    this.logs.push(`[${this.requestId}] ${message}`);
  }

  getLogs() {
    return this.logs;
  }
}
```

::: tip When to Use PROTOTYPE
Use `Scope.PROTOTYPE` for:
- Per-request state
- Isolated instances
- Testing scenarios
:::

## Injecting into Different Components

### Controllers

```typescript
@Controller('/products')
export class ProductController {
  @Inject(ProductService)
  private productService: ProductService;

  @Get('/')
  async list(context: Context) {
    const products = await this.productService.getAll();
    return context.send({ products });
  }
}
```

### Services

```typescript
@Service()
export class OrderService {
  @Inject(ProductService)
  private productService: ProductService;

  @Inject(PaymentService)
  private paymentService: PaymentService;

  async createOrder(items: any[]) {
    // Use injected services
    const products = await this.productService.validateItems(items);
    await this.paymentService.charge(products.total);
  }
}
```

### Middleware

```typescript
@Middleware()
export class AuthMiddleware extends MiddlewareService {
  @Inject(JwtService)
  private jwtService: JwtService;

  @Inject(UserService)
  private userService: UserService;

  async handle(context: Context, next: () => Promise<void>) {
    const token = context.getHeader('authorization');
    const payload = this.jwtService.verify(token);
    const user = await this.userService.findById(payload.id);

    context.setValue('user', user);
    await next();
  }
}
```

### Validators

```typescript
@Middleware({ validator: true })
export class UniqueEmailValidator extends ValidationService {
  @Inject(UserRepository)
  private userRepo: UserRepository;

  async json() {
    return z.object({
      email: z.string().email().refine(async (email) => {
        const exists = await this.userRepo.findByEmail(email);
        return !exists;
      }, 'Email already in use')
    });
  }
}
```

### WebSocket Services

```typescript
@WebSocket({ path: '/chat', name: 'ChatSocket' })
export class ChatSocket extends AsenaWebSocketService<void> {
  @Inject(MessageService)
  private messageService: MessageService;

  protected async onMessage(ws: Socket, message: string) {
    await this.messageService.saveMessage(message);
    // Broadcast to all clients
  }
}
```

## Complete Example

Combining all concepts:

```typescript
// Interface
export interface StorageProvider {
  save(key: string, data: any): Promise<void>;
  get(key: string): Promise<any>;
}

// Implementations
@Service()
@Implements('StorageProvider')
export class RedisStorage implements StorageProvider {
  @Inject(RedisService, (service) => service.client)
  private redis: RedisClient;

  @PostConstruct()
  async connect() {
    await this.redis.connect();
    console.log('Redis storage ready');
  }

  async save(key: string, data: any) {
    await this.redis.set(key, JSON.stringify(data));
  }

  async get(key: string) {
    const data = await this.redis.get(key);
    return JSON.parse(data);
  }
}

@Service()
@Implements('StorageProvider')
export class LocalStorage implements StorageProvider {
  private storage = new Map<string, any>();

  async save(key: string, data: any) {
    this.storage.set(key, data);
  }

  async get(key: string) {
    return this.storage.get(key);
  }
}

// Service using Strategy
@Service()
export class DataService {
  @Strategy('StorageProvider')
  private storageProviders: StorageProvider[];

  @PostConstruct()
  initialize() {
    console.log(`Loaded ${this.storageProviders.length} storage providers`);
  }

  async saveToAll(key: string, data: any) {
    // Save to all storage providers
    await Promise.all(
      this.storageProviders.map(provider => provider.save(key, data))
    );
  }

  async getFromFirst(key: string) {
    // Try each provider until one succeeds
    for (const provider of this.storageProviders) {
      try {
        return await provider.get(key);
      } catch (error) {
        continue;
      }
    }
    return null;
  }
}
```

## Best Practices

### 1. Prefer Class-Based Injection

```typescript
// ✅ Good: Type-safe
@Inject(UserService)
private userService: UserService;

// ⚠️ Only when necessary
@Inject('UserService')
private userService: any;
```

### 2. Use @PostConstruct for Setup

```typescript
// ✅ Good: Initialize after injection
@PostConstruct()
async initialize() {
  await this.setupConnection();
}

// ❌ Bad: Dependencies not available in constructor
constructor() {
  await this.setupConnection(); // this.dependency is undefined!
}
```

### 3. Avoid Circular Dependencies

```typescript
// ❌ Bad: Circular dependency
@Service()
class ServiceA {
  @Inject(ServiceB)
  private serviceB: ServiceB;
}

@Service()
class ServiceB {
  @Inject(ServiceA)
  private serviceA: ServiceA; // Circular!
}

// ✅ Good: Extract shared logic
@Service()
class SharedService { }

@Service()
class ServiceA {
  @Inject(SharedService)
  private shared: SharedService;
}

@Service()
class ServiceB {
  @Inject(SharedService)
  private shared: SharedService;
}
```

### 4. Use Expressions Wisely

```typescript
// ✅ Good: Extract specific property
@Inject(DatabaseService, (s) => s.connection)
private db: Database;

// ❌ Bad: Too complex
@Inject(ConfigService, (s) => s.getConfig().db.primary.connection.pool)
private pool: any; // Hard to maintain
```

### 5. Document @Strategy Interfaces

```typescript
// ✅ Good: Clear interface documentation
/**
 * Payment provider interface.
 * All implementations will be available via @Strategy('PaymentProvider')
 */
export interface PaymentProvider {
  name: string;
  process(amount: number): Promise<PaymentResult>;
}
```

## Related Documentation

- [Services](/docs/concepts/services) - Creating injectable services
- [Controllers](/docs/concepts/controllers) - Using DI in controllers
- [Middleware](/docs/concepts/middleware) - DI in middleware
- [Validation](/docs/concepts/validation) - DI in validators

---

**Next Steps:**
- Learn about [Service Scopes](/docs/concepts/services#service-scopes)
- Explore [Controllers](/docs/concepts/controllers)
- Understand [Middleware](/docs/concepts/middleware)
