---
title: Inheritance
description: How decorators behave when components extend a base class — what is inherited, how overrides resolve, and which conflicts fail the build
outline: deep
---

# Inheritance

Asena components are ordinary TypeScript classes, so they can extend a base class. This is the way to share code across services: the base class ships in a package, and the concrete subclass lives in the consuming application's `src/` where the component scan can find it.

```typescript
// packages/platform — shared, no decorator of its own
export abstract class HealthControllerBase {
  @Get('/live')
  public live(context: Context) {
    return context.send({ status: 'ok' });
  }
}

// services/orders/src/controllers — the decorated concrete class
@Controller('/probe')
export class ProbeController extends HealthControllerBase {}
```

`GET /probe/live` works. The route is declared on the base class and picked up by the subclass.

## The rule, in one sentence

> **What changes the behaviour of a request travels with the route. What says where the route lives, or what a class is, belongs to the concrete class.**

Everything below follows from that. It is the same split Spring and JAX-RS use.

::: warning An undecorated subclass is not a component
`@Controller`, `@Service`, `@Middleware`, `@Config`, `@MessageController` and friends mark a class as a component, and that marking belongs to the class that carries it. A subclass of a `@Controller` is **not** a controller unless you decorate it too — and since 0.9.0 it is not registered at all.

Before 0.9.0 such a class was registered under its *base's* name. The container promotes a duplicate name to an array, so every `@Inject(Base)` started handing out `[Base, Sub]` and failed on first property access, a long way from the missing decorator. If a class disappears after upgrading, it was missing its decorator all along.
:::

## What is inherited

Everything declared on a method or a field is collected from the whole prototype chain:

| Decorator | Inherited | Notes |
|:----------|:----------|:------|
| `@Get` / `@Post` / `@Put` / `@Delete` / `@Patch` / `@All` | ✅ | Registered under the **subclass's** `@Controller` prefix |
| `@Page` | ✅ | Registered under the subclass's `@FrontendController` base path |
| `@On` | ✅ | Uses the subclass's `@EventService` prefix |
| `@MessagePattern` / `@EventPattern` | ✅ | Uses the subclass's `@MessageController` prefix and transport |
| `@Inject` | ✅ | Fields declared on any ancestor are injected |
| `@Strategy` | ✅ | |
| `@Implements` | ✅ | A subclass joins its base's interface registration, so a `@Strategy` list picks it up — see below |
| `@OnStart` / `@OnStop` ([lifecycle](/docs/concepts/lifecycle)) | ✅ | Runs once per method, even when the chain is several levels deep. Start hooks are collected ancestors-first; stop hooks run in the reverse of that. `@PostConstruct` is a deprecated alias of `@OnStart` and behaves identically |
| `@Override` | ✅ | Marks accumulate across the chain; a subclass cannot un-mark an inherited one |
| `@Hidden` on a method ([openapi](/docs/packages/openapi)) | ✅ | A hidden base-class route stays out of the spec |
| `@Transaction` ([drizzle](/docs/packages/drizzle)) | ✅ | A base class's transactional methods run inside a transaction |
| Controller-level `middlewares` | ✅ | See below — a subclass may add, never silently drop |
| Plain methods, getters, statics | ✅ | Normal JavaScript inheritance |

And what is **not** inherited, because it describes the class rather than the request:

| Metadata | Why |
|:---------|:----|
| `@Controller` / `@WebSocket` / `@FrontendController` path | The route mounts under the concrete class's prefix |
| Component name, scope | Identity — two classes must not resolve to one name |
| `@EventService` / `@MessageController` prefix and transport | Same reason as the path |
| Component type (`CONTROLLER`, `SERVICE`, …) | A class is what its own decorator says it is |
| `@Hidden` on a class | Re-exposing a hidden base under a new `@Controller` is a legitimate thing to write |

## `@Implements` is inherited; the component name is not

These look like the same kind of metadata and behave differently, on purpose.

A component **name** must be unique — two classes resolving to one name is a collision, which is
why an undecorated subclass is not registered at all. An **interface key** is deliberately
multi-valued: registering several classes under one key is the whole mechanism behind
[`@Strategy`](/docs/concepts/dependency-injection), whose consumer side injects everything found
there as an array. `@Implements` is the producer side of that same mechanism.

So a subclass joins its base's interface registration without redeclaring anything, exactly as a
Java or Spring subclass remains an instance of its base's interfaces:

```typescript
@Service()
@Implements('IPaymentGateway')
export class StripeGateway implements PaymentGateway { /* … */ }

@Service()
export class StripeGatewayWithAudit extends StripeGateway { /* … */ }

@Service()
export class Checkout {
  // Receives BOTH implementations - the subclass never declares @Implements
  @Strategy('IPaymentGateway')
  private gateways: PaymentGateway[];
}
```

::: warning `@Inject` on an interface key returns an array
An interface key holding more than one implementation is normal. Reach for it with `@Strategy`,
which expects a list. `@Inject('IPaymentGateway')` hands back the array too, and the failure
surfaces later as `… is not a function` on first use.
:::

## Guards follow the routes they protect

A controller's class-level `middlewares` are unioned across the chain, ancestors first:

```typescript
@Controller({ path: '/admin', middlewares: [AuthMiddleware] })
abstract class AdminBase {
  @Get('/users')
  public listUsers(context: Context) {
    return context.send(allUsers());
  }
}

@Controller('/v2/admin')
export class AdminV2 extends AdminBase {}
```

`GET /v2/admin/users` runs `AuthMiddleware`, even though `AdminV2` never mentions it. A subclass may **add** middlewares; it cannot silently drop an inherited one, because a route arriving without its guard is never the safe default.

To publish a base class's routes *without* its guards, move the routes to an undecorated base class and let each concrete controller declare its own `middlewares`.

Repositories behave the same way — `@Repository` and `@Database` from [`@asenajs/asena-drizzle`](/docs/packages/drizzle) keep everything the decorated class inherited, including getters and statics.

## How overrides resolve

The unit of overriding is the **method name**, exactly as in JAX-RS ([spec §3.6](https://jakarta.ee/specifications/restful-ws/)) and Spring.

```typescript
abstract class Base {
  @Get('/value')
  public value(context: Context) {
    return context.send({ from: 'base' });
  }
}

@Controller('/example')
class Example extends Base {
  @Get('/value')
  public override value(context: Context) {
    return context.send({ from: 'subclass' });
  }
}
```

One route is registered and it answers `{ from: 'subclass' }`. This is a plain override, not a conflict — nothing is reported.

The same rule applies to `@On`, `@MessagePattern`, `@EventPattern` and `@Page`: same method name means the subclass replaces the inherited entry and keeps every other one.

::: tip Redeclaring the decorator is optional
An override that does not repeat `@Get` still serves the inherited route — the metadata comes from the base class, the implementation from the subclass. Repeat the decorator only when you want to change the path or options.
:::

## Conflicts that fail the build

Overriding is by method name; conflict detection is by **resolved path or pattern**. They are separate checks, and only the second one throws.

### Two methods on the same route

```typescript
abstract class Base {
  @Get('/live')
  public live(context: Context) { /* ... */ }
}

@Controller('/probe')
class Probe extends Base {
  // Different method name, same path as the inherited route
  @Get('/live')
  public health(context: Context) { /* ... */ }
}
```

```
Error: Duplicate route detected: GET /probe/live — already registered by
Probe.live(), conflicts with Probe.health()
```

The server refuses to start. Spring reports the same situation as `Ambiguous mapping`. Fix it by renaming the subclass method to match the inherited one, which turns the conflict into an override.

The same error appears when two controllers extend one route-carrying base class **and share a prefix**. Give them distinct prefixes, or move the shared routes out of the base class.

### Two handlers on the same message pattern

`@MessagePattern` is request/response, so two handlers on one pattern is ambiguous — nothing decides which one produces the reply:

```
Error: Duplicate message pattern detected: "order.get" on transport "default" —
already registered by OrderController.get(), conflicts with OrderController.fetch()
```

`@EventPattern` and `@On` are exempt. Several handlers on one pattern is fan-out, which is the point of an event.

## Inherited handlers are logged at startup

Inheritance is invisible in the source of the class you are reading, so the server reports what each component picked up:

```
Controller ProbeController inherits routes: live, guarded
[Microservice] OrderController inherits handlers: onPaymentCompleted
EventService AuditNotifier inherits handlers: onUserCreated
```

Nothing is logged for a component that declares all of its own handlers.

::: warning An inherited @EventPattern opens a real subscription
`@EventPattern` and `@MessagePattern` register against the configured microservice transport — Redis, Kafka, or whatever `transport()` returns. Extending a base class that declares them makes your service **consume those patterns**, with at-least-once delivery on durable transports.

That is the intended semantic: extending a class means adopting its behaviour. But check the startup log after adding a base class you did not write, and keep inherited handlers idempotent like any other.
:::

## Practical pattern: a shared platform package

Asena never scans `node_modules`, so shared components have to reach the container through a decorated class in the application's own source. The base class carries the behaviour; the subclass carries the decorator and the prefix.

```typescript
// @acme/platform
export abstract class CrudControllerBase<T> {
  @Inject(AuditService)
  protected auditService: AuditService;

  @Get('/')
  public async list(context: Context) {
    return context.send(await this.findAll());
  }

  @Get('/:id')
  public async byId(context: Context) {
    return context.send(await this.findOne(context.getParam('id')));
  }

  protected abstract findAll(): Promise<T[]>;
  protected abstract findOne(id: string): Promise<T | null>;
}
```

```typescript
// services/orders/src/controllers/OrderController.ts
@Controller('/api/orders')
export class OrderController extends CrudControllerBase<Order> {
  @Inject(OrderService)
  private orderService: OrderService;

  protected findAll() {
    return this.orderService.findAll();
  }

  protected findOne(id: string) {
    return this.orderService.findById(id);
  }
}
```

`GET /api/orders` and `GET /api/orders/:id` are served by the base class implementation, running against the subclass instance — `this.orderService` and `this.auditService` are both injected.

## Related

- [Controllers](/docs/concepts/controllers) — routing and the `@Controller` prefix
- [Dependency Injection](/docs/concepts/dependency-injection) — how `@Inject` resolves along the chain
- [Microservices](/docs/concepts/microservices) — `@MessageController` prefixes and transports
- [Event System](/docs/concepts/event-system) — in-process `@On` handlers
- [Drizzle](/docs/packages/drizzle) — `@Repository` and `@Database` inheritance
