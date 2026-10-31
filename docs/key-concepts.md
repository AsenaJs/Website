---
title: Key Concepts
description: The six ideas the rest of Asena builds on - the container and component scan, field injection, scopes, bootstrap order, adapters and the request context
outline: deep
---

# Key Concepts

Six ideas explain almost everything Asena does. Each section here is a short summary with a link
to the page that covers it in depth.

## The Container and the Scan

Asena is an IoC container first. You never register a class by hand: a component decorator marks
it, and the container finds it when the application boots.

| Decorator | Role |
|:----------|:-----|
| `@Controller` | HTTP routes |
| `@Service` | Business logic, the default for anything injectable |
| `@Middleware` | Request middleware, and validators with `{ validator: true }` |
| `@Config` | Server hooks: `onError`, `onNotFound`, `globalMiddlewares`, `transport` |
| `@WebSocket` | A WebSocket namespace |
| `@MessageController` | Broker message handlers |
| `@Schedule` | Cron jobs |
| `@PostProcessor` | Hooks every component on its way out of the container |

Where the container looks is decided once, in this order:

1. the `components` list passed to `AsenaServerFactory.create()`, when it is not empty
2. the component list `asena build` writes into the production bundle
3. a scan of the `sourceFolder` set in `asena-config.ts`

Components shipped inside a package are never scanned. A package hands them in through the
`imports` option, which adds to whichever source above was chosen.

Learn more: [Dependency Injection](/docs/concepts/dependency-injection#registering-components-from-packages)

## Field Injection

Dependencies are declared on fields with `@Inject`. Constructors take no parameters and stay yours.

```typescript
import { Service } from '@asenajs/asena/decorators';
import { Inject } from '@asenajs/asena/decorators/ioc';

@Service()
export class CartService {
  @Inject(PriceService)
  private prices: PriceService;

  total(skus: string[]) {
    return skus.reduce((sum, sku) => sum + this.prices.price(sku), 0);
  }
}
```

- `@Inject(Class)` resolves by class; `@Inject('Name')` resolves by registered name.
- `@Strategy('InterfaceName')` injects every `@Implements('InterfaceName')` component, always as an array.
- `@Value('ENV_KEY')` injects configuration from `process.env`.
- Injected fields are filled **after** the constructor returns. Setup that needs them goes in an
  `@OnStart` method.

Learn more: [Dependency Injection](/docs/concepts/dependency-injection)

## Scopes

| Scope | Instances | Lifecycle hooks |
|:------|:----------|:----------------|
| `Scope.SINGLETON` (default) | One for the whole application | `@OnStart` and `@OnStop` |
| `Scope.PROTOTYPE` | A new one every time the component is injected or resolved | `@OnStart` at construction; `@OnStop` never runs |

There is no request scope. A prototype is created per **injection point**, not per request, so a
prototype injected into a singleton controller lives as long as the controller. Data that belongs
to one request lives on the [context](#the-request-context).

Learn more: [Service Scopes](/docs/concepts/dependency-injection#service-scopes)

## Bootstrap Order

Booting is two calls, and they do different things:

- `await AsenaServerFactory.create()` builds the container: core services first, then your
  components, in dependency order. Singletons are constructed and their fields injected here.
- `await server.start()` runs every `@OnStart` hook, applies `@Config`, connects transports,
  registers routes with the adapter and only then binds the port.

A component's dependencies always start before it, and stop after it. A throwing `@OnStart` aborts
the boot.

Learn more: [Component Lifecycle](/docs/concepts/lifecycle#where-the-hooks-sit)

## Adapters

The core package knows nothing about HTTP servers. It reads your decorators and hands routes,
middleware and error hooks to an **adapter**, which runs them on `Bun.serve()`.

| Import from | What |
|:------------|:-----|
| `@asenajs/asena/*` | Decorators, `HttpException`, the server factory, test utilities |
| `@asenajs/ergenecore` or `@asenajs/hono-adapter` | `Context`, `MiddlewareService`, `ValidationService`, `ConfigService`, built-in middleware |

Switching adapters changes those imports and the factory call. Controllers, services and
middleware stay the same.

Learn more: [Adapters Overview](/docs/adapters/overview)

## The Request Context

Every handler and middleware receives a `Context`: one object per request that reads the request,
writes the response and carries state between middleware and the handler.

```typescript
import { Middleware } from '@asenajs/asena/decorators';
import { MiddlewareService, type Context } from '@asenajs/ergenecore';

@Middleware()
export class RequestIdMiddleware extends MiddlewareService {
  async handle(context: Context, next: () => Promise<void>) {
    context.setValue('requestId', crypto.randomUUID());
    await next();
  }
}
```

A handler then reads it back with `context.getValue<string>('requestId')`.

A route can also declare a **context contract**: a `Context` subclass built with
`Context.define()` whose schemas validate the request before the handler runs and type
`context.input`.

Learn more: [Context](/docs/concepts/context) · [Route Context Contracts](/docs/concepts/validation#route-context-contracts)

## Next

- [Best Practices](/docs/best-practices) - project layout, layering and the common traps
- [Coming from NestJS](/docs/migrate/from-nestjs) - the same ideas mapped to NestJS
