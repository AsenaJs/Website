---
title: createWebTest
description: Boot only the web layer of an Asena application - controllers, middlewares and validators are real, everything else is auto-mocked
outline: deep
---

# createWebTest

`createWebTest` boots **only the web layer** of your application. Controllers, their middlewares and their validators run for real; every other dependency they inject is replaced by a generated mock shaped like the real class. It is the equivalent of Spring's `@WebMvcTest`.

That means a controller test never drags in a database, a Redis connection or an HTTP client — but the routing, middleware chain and request validation you are actually testing are the production ones.

```typescript
import { createWebTest, silentLogger } from '@asenajs/asena/test';
import { createHonoAdapter } from '@asenajs/hono-adapter';
import { describe, test, expect } from 'bun:test';

describe('UserController', () => {
  test('returns a user', async () => {
    const [adapter] = createHonoAdapter({ logger: silentLogger });

    const { app, mocks } = await createWebTest({ adapter, controllers: [UserController] });

    mocks.UserService.findById.mockResolvedValue({ id: '1', name: 'Ada' });

    await app.get('/api/users/1').expectStatus(200).expectJson({ id: '1', name: 'Ada' });

    expect(mocks.UserService.findById).toHaveBeenCalledWith('1');

    await app.stop();
  });
});
```

## Options

```typescript
interface WebTestOptions {
  adapter: AsenaAdapter;              // required
  controllers: Class | Class[];       // required - the controllers under test
  components?: Class[];               // extra REAL components
  overrides?: Record<string, object>; // explicit doubles; win over auto-mocks
  logger?: ServerLogger;
  port?: number;
  dispatch?: 'server' | 'socket';
}
```

Returns `{ app, mocks }`. `app` is a full [`TestApp`](/docs/testing/test-app) — same fluent HTTP client, same `stop()`, same `await using` support.

## What runs for real

| Registered for real | Why |
|---|---|
| The controllers you pass | They are what you are testing |
| Controller-level `middlewares` | The framework resolves them **by name** from the container at start-up and throws if they are missing |
| Route-level `middlewares`, `validator`, `staticServe` | Same reason |
| Anything in `components` | You asked for it |
| Core services (`ulak(...)`, the event emitter, the container, …) | They are wired during bootstrap, before user components exist |

Everything else a real component injects gets an auto-generated mock.

::: tip Validators are real
This is deliberate and often surprising the first time: if a route has a validator requiring a UUID, `app.get('/api/users/1')` returns **400**, not 200. That is the production behaviour, and testing it is the point of a slice test.
:::

## The `mocks` object

`mocks` is keyed by **service name** — not by field name.

```typescript
const { mocks } = await createWebTest({ adapter, controllers: [UserController] });

mocks.UserService     // ✅ registered service name
mocks.userService     // ❌ undefined - that is the field name
```

::: warning Different from mockComponent
[`mockComponent`](/docs/testing/mock-component) keys `mocks` by **field name**, because it works on one class where field names are unambiguous. `createWebTest` keys by **service name**, matching container and `@MockBean` semantics — and giving one shared double per service.
:::

Each service gets exactly **one** mock, shared across every component that injects it:

```typescript
const { mocks } = await createWebTest({
  adapter,
  controllers: [UserController, AdminController], // both inject UserService
});

// Both controllers received the very same object
mocks.UserService.findById.mockResolvedValue({ id: '1' });
```

`mocks` also contains any explicit `overrides` you passed, so it is a single place to reach every double in play.

## Mock shape

Auto-mocks are generated from the injected class, so every method exists as a `bun:test` mock:

```typescript
@Service()
class UserService {
  public async findById(id: string) { /* ... */ }
  public async deleteById(id: string) { /* ... */ }
}

// mocks.UserService === { findById: Mock, deleteById: Mock }
```

Async methods default to resolving `null`; sync methods default to returning `undefined`.

### String injections cannot be shaped

`@Inject('UserService')` stores only a name, so there is no class to derive methods from. The mock falls back to `{}` and a warning is logged:

```typescript
const { logger, entries } = createCapturingLogger();

const { mocks } = await createWebTest({ adapter, controllers: [LegacyController], logger });

mocks.UserService; // {}
```

Pass an explicit override for those fields:

```typescript
await createWebTest({
  adapter,
  controllers: [LegacyController],
  overrides: { UserService: { findById: mock(async () => ({ id: '1' })) } },
});
```

## Promoting a mock back to the real thing

Anything listed in `components` is registered for real and disappears from `mocks`:

```typescript
const { mocks } = await createWebTest({
  adapter,
  controllers: [UserController],
  components: [UserService], // now real
});

mocks.UserService; // undefined
```

## Explicit overrides

Explicit `overrides` always win over the generated mock:

```typescript
const double = { findById: mock(async () => ({ id: '1', name: 'Explicit' })) };

const { mocks } = await createWebTest({
  adapter,
  controllers: [UserController],
  overrides: { UserService: double },
});

expect(mocks.UserService).toBe(double);
```

## Known behaviours

- **`@PostConstruct` runs against mocks.** A real component whose dependency was auto-mocked will see async mock methods resolve `null` during its lifecycle hook. This matches `@WebMvcTest` semantics.
- **Only `@Controller` classes are accepted** in `controllers`. Pass services and middlewares through `components`.

## Related

- **[createTestApp](/docs/testing/test-app)** — full-application testing and the fluent HTTP client
- **[MockComponent API](/docs/testing/mock-component)** — unit-level dependency mocking
- **[Testing Overview](/docs/testing/overview)** — introduction to testing in Asena
