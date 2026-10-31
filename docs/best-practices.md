---
title: Best Practices
description: Project layout, thin controllers, repository ownership, validation with route contracts, testing levels, and the common traps with right-and-wrong examples
outline: deep
---

# Best Practices

How to structure an Asena application so it stays easy to change, and the handful of mistakes
that fail silently. Each section links to the page with the full detail.

## Organize by Feature

Group a domain's controller, service, repository and contracts in one folder. A change to orders
then stays in `orders/`.

```
src/
├── orders/
│   ├── OrderController.ts
│   ├── OrderService.ts
│   ├── OrderRepository.ts
│   └── CancelOrderContext.ts
├── invoices/
│   ├── InvoiceController.ts
│   └── InvoiceService.ts
├── shared/
│   └── AuthMiddleware.ts
├── AppConfig.ts
├── logger.ts
└── index.ts
```

The component scan walks the whole `sourceFolder`, so the layout is a convention, not a
requirement. `asena generate` writes into type-based folders (`src/controllers/`,
`src/services/`); either layout works, as long as one project uses one of them.

## Keep Controllers Thin

A controller reads the request, calls one service method and shapes the response. Business rules
belong in the service, where every caller gets them and a unit test can reach them.

::: code-group

```typescript [Wrong]
@Controller('/orders')
export class OrderController {
  @Inject(OrderRepository)
  private orders: OrderRepository;

  @Post('/:id/cancel')
  async cancel(context: Context) {
    const order = await this.orders.findById(context.getParam('id'));

    if (!order) return context.send({ message: 'Order not found' }, 404);
    if (order.status === 'paid') return context.send({ message: 'A paid order cannot be cancelled' }, 409);

    return context.send(await this.orders.update(order.id, { status: 'cancelled' }));
  }
}
```

```typescript [Right]
@Controller('/orders')
export class OrderController {
  @Inject(OrderService)
  private orderService: OrderService;

  @Post('/:id/cancel')
  async cancel(context: CancelOrderContext) {
    return context.send(await this.orderService.cancel(context.input.params.id));
  }
}

@Service()
export class OrderService {
  @Inject(OrderRepository)
  private orders: OrderRepository;

  async cancel(id: string) {
    const order = await this.orders.findById(id);

    if (!order) throw new HttpException(404, { message: 'Order not found' });
    if (order.status === 'paid') throw new HttpException(409, { message: 'A paid order cannot be cancelled' });

    return this.orders.update(id, { status: 'cancelled' });
  }
}
```

:::

`HttpException` comes from `@asenajs/asena/adapter` and answers with its status on both adapters,
so a service can reject a request without touching `Context`.

Learn more: [Controllers](/docs/concepts/controllers) · [Services](/docs/concepts/services) · [Error Handling](/docs/guides/error-handling)

## A Repository Belongs to One Service

Inject a repository only into its own domain's service. Another domain asks that service, never
the repository: the owning service is where the rules about that data live.

::: code-group

```typescript [Wrong]
@Service()
export class InvoiceService {
  @Inject(OrderRepository) // another domain's repository
  private orders: OrderRepository;

  async totalFor(customerId: string) {
    const orders = await this.orders.findByCustomer(customerId);

    return orders.filter((o) => o.status === 'paid').reduce((sum, o) => sum + o.total, 0);
  }
}
```

```typescript [Right]
@Service()
export class InvoiceService {
  @Inject(OrderService)
  private orderService: OrderService;

  async totalFor(customerId: string) {
    return this.orderService.paidTotalFor(customerId);
  }
}
```

:::

When two services would need each other, move the shared logic into a third service, or let one
react to the other through an [in-process event](/docs/concepts/event-system).

Learn more: [Drizzle ORM repositories](/docs/packages/drizzle)

## Validate with Route Contracts

Declare what a route accepts as a context contract. The request is validated before the handler
runs, the handler gets typed values, and the OpenAPI package documents the same schema.

::: code-group

```typescript [Wrong]
@Post('/:id/cancel')
async cancel(context: Context) {
  const id = context.getParam('id');
  const body = await context.getBody<{ reason?: unknown }>();

  if (!/^[0-9a-f-]{36}$/.test(id)) return context.send({ message: 'Invalid id' }, 400);
  if (body.reason !== undefined && typeof body.reason !== 'string') {
    return context.send({ message: 'Invalid reason' }, 400);
  }
  // ...
}
```

```typescript [Right]
import { Context } from '@asenajs/ergenecore';
import { z } from 'zod';

export class CancelOrderContext extends Context.define({
  params: z.object({ id: z.uuid() }),
  body: z.object({ reason: z.string().max(200).optional() }),
}) {}

// in the controller
@Post('/:id/cancel')
async cancel(context: CancelOrderContext) {
  return context.send(await this.orderService.cancel(context.input.params.id));
}
```

:::

Contracts check the **shape** of a request. Whether the request makes sense, such as cancelling an
order that is already paid, is the service's decision.

Learn more: [Route Context Contracts](/docs/concepts/validation#route-context-contracts)

## Test at the Right Level

| What you are testing | Tool | Boots |
|:---------------------|:-----|:------|
| One service's logic | `mockComponent` | Nothing; every injected field is a mock |
| Routing, middleware, validation | `createWebTest` | Controllers for real, everything else mocked |
| The wired application | `createTestApp` | The container, the adapter and a real HTTP server |

```typescript
import { describe, expect, it } from 'bun:test';
import { createWebTest, mockComponent, silentLogger } from '@asenajs/asena/test';
import { createErgenecoreAdapter } from '@asenajs/ergenecore';

describe('OrderService', () => {
  it('refuses to cancel a paid order', async () => {
    const { instance, mocks } = mockComponent(OrderService);

    mocks.orders.findById.mockResolvedValue({ id: 'o1', customerId: 'c1', status: 'paid', total: 10 });

    await expect(instance.cancel('o1')).rejects.toMatchObject({ status: 409 });
    expect(mocks.orders.update).not.toHaveBeenCalled();
  });
});

describe('OrderController', () => {
  it('rejects a malformed id before the service runs', async () => {
    const { app, mocks } = await createWebTest({
      adapter: createErgenecoreAdapter({ logger: silentLogger }),
      controllers: [OrderController],
    });

    await app
      .post('/orders/not-a-uuid/cancel', { body: '{}', headers: { 'content-type': 'application/json' } })
      .expectStatus(400);
    expect(mocks.OrderService.cancel).not.toHaveBeenCalled();

    await app.stop();
  });
});
```

Most tests belong at the first two levels. Keep `createTestApp` for the paths where the wiring
itself is what could break.

Learn more: [Testing Overview](/docs/testing/overview)

## Common Traps

These mistakes do not raise an error where they happen, which is what makes them expensive.

### Decorator flags missing from `tsconfig.json`

Bun reads the decorator mode from `tsconfig.json`. Without `experimentalDecorators` it applies
standard decorators: class decorators still run, but method decorators lose their metadata, so the
server boots and every route answers `404`. Without `emitDecoratorMetadata`, a route context
contract cannot find the handler's context class, and the route runs unvalidated.

::: code-group

```json [Wrong]
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext"
  }
}
```

```json [Right]
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

:::

Projects created with `asena create` already have both flags.

### Two copies of `@asenajs/asena`

Decorators write metadata through the copy of `@asenajs/asena` they were imported from, and the
server reads it through its own. When `node_modules` holds two copies, the two never meet:
injected fields stay `undefined`, `@OnStart` hooks do not run, and nothing logs an error. The usual
cause is a package or a stale lockfile pinning its own version.

```bash
# More than one line here is the bug
bun pm ls --all | grep @asenajs/asena@

# Reinstall so every package shares one copy
rm -rf node_modules bun.lock && bun install
```

The same applies to `hono` and `zod`: both adapters list them as peer dependencies so the
application owns exactly one copy. Match HTTP exceptions with `isHttpException()` rather than
`instanceof`, which also breaks across copies.

### Using an injected field in the constructor

Fields are injected after the constructor returns. Reading one there throws a `TypeError` while
the container builds the component, and the boot fails.

::: code-group

```typescript [Wrong]
@Service()
export class PriceCache {
  @Inject(PriceService)
  private prices: PriceService;

  private warm: number;

  constructor() {
    this.warm = this.prices.price('seed'); // this.prices is undefined here
  }
}
```

```typescript [Right]
@Service()
export class PriceCache {
  @Inject(PriceService)
  private prices: PriceService;

  private warm = 0;

  @OnStart()
  async init() {
    this.warm = this.prices.price('seed');
  }
}
```

:::

### Components declared below `create()`

A component declared in the entry file must come **before** `AsenaServerFactory.create()`.
Anything below it has not been evaluated when components are collected; Asena logs a warning
naming it.

Learn more: [Get Started](/docs/get-started#_5-create-entry-point)
