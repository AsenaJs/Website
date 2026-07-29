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
import { Controller } from '@asenajs/asena/decorators';
import { Inject } from '@asenajs/asena/decorators/ioc';
import { Delete, Get, Post, Put } from '@asenajs/asena/decorators/http';
import type { Context } from '@asenajs/ergenecore';
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

You can also inject services using their registered name as a string. This is useful when you want to decouple your code from concrete implementations or when working with dynamically registered services.

First, register your service with a custom name:

::: tip Name Your Components for String-Based Injection
A component is registered under its `name` if you give one, and under its **class name**
otherwise - so `@Inject('UserService')` already resolves an unnamed `@Service()` class
called `UserService`.

**Why give an explicit name anyway?** The Bun bundler may rename classes during a
production build, and the container key would change with it. An explicit
`@Service('UserService')` pins the key so string injection keeps working after minification.
:::

Inject services by their registered name:

```typescript
import { Service } from '@asenajs/asena/decorators';

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
  private userService: UserService;

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
import { Inject } from '@asenajs/asena/decorators/ioc';
import { DatabaseService } from '../services/DatabaseService';
import type { BunSQLDatabase } from 'drizzle-orm/bun-sql';

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
import { Service } from '@asenajs/asena/decorators';
import { Implements } from '@asenajs/asena/decorators/ioc';
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
import { Service } from '@asenajs/asena/decorators';
import { Implements } from '@asenajs/asena/decorators/ioc';
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
import { Service } from '@asenajs/asena/decorators';
import { Implements } from '@asenajs/asena/decorators/ioc';
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
import { Strategy } from '@asenajs/asena/decorators/ioc';
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

### How many implementations?

A `@Strategy` field is **always an array**, whatever the number of implementations:

| `@Implements('Key')` components | injected value |
|:--------------------------------|:---------------|
| 0 | `[]` |
| 1 | `[implementation]` |
| 2+ | every implementation |

Zero is a normal state, not a misconfiguration. `@Strategy` is the consumer side of a plugin
point, and a plugin point with no plugins is how one starts — you write the consumer first and
the implementations arrive per feature:

```typescript
@Service()
export class NotificationManager {
  @Strategy('NotificationService')
  private notificationServices: NotificationService[]; // [] until the first @Implements exists

  async notifyUser(userId: string, message: string) {
    // Works from day one - iterates nothing until a channel is added
    for (const service of this.notificationServices) {
      await service.send(userId, message);
    }
  }
}
```

Because an empty key is legitimate, a **mistyped** interface name cannot fail at boot either — it
would just stay empty forever. To keep that diagnosable, the container logs one line per injection
site at startup, at `debug` level:

```
[IocEngine] Strategy key 'NotificationService' has no implementations - NotificationManager.notificationServices will be injected as []
```

Enable `debug` on your logger when a strategy collection is unexpectedly empty. Keys supplied
through a test's `overrides` are not reported.

:::warning Upgrading from 0.9.0
Up to and including `0.9.0`, a strategy key with no implementations **aborted the boot** with
`<key> is not registered`, and a key with exactly one implementation injected a **bare instance
instead of an array** — so `.length`, `for...of` and `.map()` all failed on it at runtime. If you
worked around either of those, the workaround can go.
:::

## Lifecycle Hooks

`@OnStart` marks a method to be called when the server starts — after every dependency is
injected and every component is constructed, but *before* the application is set up — so a
`@Config` that builds something out of an injected service finds it already started — and long
before the HTTP socket binds. `@OnStop` is its counterpart, called during `server.stop()`.

::: tip Full reference
This section covers the injection side. Ordering, failure policies, signal handling and the
headless worker pattern live on [Component Lifecycle](/docs/concepts/lifecycle).
:::

::: warning Upgrading from 0.9.x
`@PostConstruct` was renamed to **`@OnStart`**. It remains a deprecated alias writing the same
metadata, so existing code keeps working and renaming the import is the whole migration.

The **timing** changed, and that part is breaking: the hook used to run inside
`Container.register()`, mid-scan, while the rest of the graph was still being built. It now runs
from `server.start()`. A component resolved from a server that was created but never started is
therefore no longer initialised, and a throwing hook no longer calls `process.exit(1)` — it
throws and `server.start()` rejects. See [Upgrading from 0.9.x](/docs/concepts/lifecycle#upgrading-from-0-9-x).
:::

### Basic Usage

```typescript
import { Service } from '@asenajs/asena/decorators';
import { Inject } from '@asenajs/asena/decorators/ioc';
import { OnStart, OnStop } from '@asenajs/asena/decorators/ioc';

@Service()
export class UserService {
  @Inject(DatabaseService)
  private db: DatabaseService;

  private cache: Map<string, any>;

  @OnStart()
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

  @OnStop()
  async release() {
    this.cache.clear();
  }
}
```

### Use Cases for @OnStart

**1. Initialization Logic**

```typescript
@Service()
export class CacheService {
  private redis: RedisClient;

  @OnStart()
  async connect() {
    this.redis = await createRedisClient();
    console.log('Redis connection established');
  }

  @OnStop()
  async disconnect() {
    await this.redis?.close();
  }
}
```

**2. Validation**

```typescript
@Service()
export class ApiKeyService {
  private apiKey = process.env.API_KEY;

  @OnStart()
  validate() {
    if (!this.apiKey || this.apiKey.length < 32) {
      throw new Error('Invalid API key configuration');
    }
  }
}
```

::: warning `@Inject` resolves components, not values
A string token names a **registered component**. There is no value/constant registry, so
`@Inject('ENV_API_KEY')` throws `ENV_API_KEY is not registered` at startup. Read plain
configuration values from `process.env` (or a `@Service` that wraps it) as above.
:::

**3. Setup with Injected Dependencies**

```typescript
@Service()
export class EventSubscriberService {
  @Inject(EventBus)
  private eventBus: EventBus;

  @OnStart()
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

  @OnStart()
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

Construction, per component:

1. Class constructor runs
2. All `@Inject` dependencies are resolved
3. All `@Strategy` arrays are resolved (a separate pass)
4. Registered `@PostProcessor`s run

Then, once every component exists, from `server.start()`:

5. All `@OnStart` methods are called, in registration order — dependencies before dependents

And from `server.stop()`, in the reverse of that order:

6. All `@OnStop` methods are called

::: danger A throwing `@OnStart` aborts the boot
The error is **not** swallowed. The components that already started are rolled back and
`server.start()` rejects with an error naming the hook, carrying the original error as `cause`.
Use `@OnStart` for setup that must succeed at boot (opening a connection pool, subscribing to a
topic) and validate recoverable input elsewhere.

Up to 0.9.x the container caught the error, logged it, and called `process.exit(1)`.
:::

```typescript
@Service()
export class ExampleService {
  @Inject(LoggerService)
  private logger: LoggerService;

  constructor() {
    console.log('1. Constructor called');
    // this.logger is undefined here!
  }

  @OnStart()
  initialize() {
    console.log('2. OnStart called');
    // this.logger is available here!
    this.logger.info('Service initialized');
  }
}
```

::: warning Async hooks
`@OnStart` and `@OnStop` methods can be async. Asena awaits `@OnStart` before the HTTP socket is
bound, and awaits each `@OnStop` under a per-hook timeout (default 5s) during shutdown.

An `@OnStart` that never resolves is a `start()` that never resolves — a component with a run
loop should start it and return, not await it. See
[Component Lifecycle](/docs/concepts/lifecycle#the-hook-must-return).
:::

::: warning Injected fields are read-only
`@Inject` and `@Strategy` install accessors with no setter, so assigning to one throws. The error
names the field and the class and points at the [`overrides` option](/docs/testing/test-app#replacing-components-with-mocks)
or [`mockComponent()`](/docs/testing/mock-component) — reach for those instead of
`Object.assign(instance, { dep: fake })` in a test.
:::

## Service Scopes

Control the lifecycle of injected services with scopes.

### Singleton Scope (Default)

One instance shared across the entire application:

```typescript
import { Service } from '@asenajs/asena/decorators';

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
import { Service } from '@asenajs/asena/decorators';
import { Scope } from '@asenajs/asena/decorators/ioc';

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
    const token = context.req.headers['authorization'];
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

## Reaching the container from outside

`@Inject` only works inside a component, and the entry file is not one. A migration runner, a
one-off script, a `bun --eval` session against a booted server — none of them can declare a field
the container will fill. For those, the server itself hands out components:

```typescript
const server = await AsenaServerFactory.create({ adapter, logger });

await server.start();

const feed = await server.resolve<PriceFeed>('PriceFeed');

await feed.warmUp();
```

The name is the component's registered name: the class name by default, or whatever string you
passed to `@Service('name')`. It is the same key `@Inject('PriceFeed')` takes, and the same
signature the test harness exposes as [`app.resolve()`](/docs/testing/test-app#the-container).

Three things worth knowing before you reach for it:

- **Resolve after `start()`, not after `create()`.** `create()` builds the graph, but
  [`@OnStart`](/docs/concepts/lifecycle) runs in `start()` — a component pulled out in between is
  constructed and injected, yet its pool is unopened and its cache is empty.
- **An unknown name throws**, with `<name> is not registered`. There is no `undefined` to check
  for.
- **A name shared by two classes resolves to an array**, because the container promotes duplicate
  names rather than letting one silently win. See [Inheritance](/docs/concepts/inheritance) for
  how a class ends up sharing its base's name.

::: tip Replaces `coreContainer.container`
`server.coreContainer.container.resolve()` also works, and up to 0.9.x it was what everyone found
instead. `server.resolve()` is the supported spelling — prefer it.
:::

Inside a component, keep using `@Inject`. Resolving by hand from a component works but hides the
dependency from the graph, so the container can no longer order construction around it.

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

  @OnStart()
  async connect() {
    await this.redis.connect();
    console.log('Redis storage ready');
  }

  @OnStop()
  async close() {
    await this.redis.close();
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

  @OnStart()
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

### 2. Use @OnStart for Setup, @OnStop to Release

```typescript
// ✅ Good: Initialize after injection, release symmetrically
@OnStart()
async initialize() {
  this.connection = await this.setupConnection();
}

@OnStop()
async release() {
  await this.connection?.close();
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

- [Component Lifecycle](/docs/concepts/lifecycle) - `@OnStart` / `@OnStop`, shutdown ordering and signals
- [Services](/docs/concepts/services) - Creating injectable services
- [Controllers](/docs/concepts/controllers) - Using DI in controllers
- [Middleware](/docs/concepts/middleware) - DI in middleware
- [Validation](/docs/concepts/validation) - DI in validators

---

**Next Steps:**
- Learn about [Service Scopes](/docs/concepts/services#service-scopes)
- Explore [Controllers](/docs/concepts/controllers)
- Understand [Middleware](/docs/concepts/middleware)
