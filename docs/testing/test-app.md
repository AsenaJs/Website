---
title: createTestApp
description: Boot a full Asena application in a test, swap any component for a mock, and assert on real HTTP responses
outline: deep
---

# createTestApp

`createTestApp` boots a **complete** Asena application inside a test: the IoC container, every bootstrap phase, the adapter and its real routing pipeline. It is the equivalent of Spring Boot's `@SpringBootTest`.

Where [`mockComponent`](/docs/testing/mock-component) tests a single class in isolation, `createTestApp` tests how your components behave once the framework has wired them together and a real request comes in.

```typescript
import { createTestApp, silentLogger } from '@asenajs/asena/test';
import { createHonoAdapter } from '@asenajs/hono-adapter';
import { describe, test, expect } from 'bun:test';

describe('UserController', () => {
  test('lists users', async () => {
    const [adapter] = createHonoAdapter({ logger: silentLogger });

    await using app = await createTestApp({
      adapter,
      components: [UserController, UserService],
    });

    await app.get('/api/users').expectStatus(200).expectJsonContains({ total: 3 });
  });
});
```

## Options

```typescript
interface TestAppOptions {
  adapter: AsenaAdapter;             // required
  components: Class[];               // required - skips filesystem scanning entirely
  overrides?: Record<string, object>; // service name -> replacement instance
  logger?: ServerLogger;             // default: silentLogger
  port?: number;                     // default: 0 (Bun picks a free port)
  dispatch?: 'server' | 'socket';    // default: 'server'
}
```

### `components`

Passing an explicit component list skips config-based filesystem scanning, so a test boots only what it names. Every class the app needs at start-up must be present — controllers, services, middlewares, validators, configs.

### `port`

Defaults to `0`, which asks Bun for a free ephemeral port. Read the bound port back from `app.port`:

```typescript
const app = await createTestApp({ adapter, components });

console.log(app.port);     // e.g. 43117
console.log(app.baseUrl);  // http://localhost:43117
```

::: tip No more random-port collisions
Hand-rolled helpers usually pick `10000 + Math.random() * 50000` and occasionally collide when suites run in parallel. `port: 0` removes the race entirely — the kernel hands out a port that is guaranteed free.
:::

## Replacing components with mocks

`overrides` maps a **registered service name** to a replacement instance — Spring's `@MockBean`:

```typescript
const userService = {
  getAll: mock(async () => [{ id: '1', name: 'Ada' }]),
};

await using app = await createTestApp({
  adapter,
  components: [UserController, UserService],
  overrides: { UserService: userService },
});

await app.get('/api/users').expectStatus(200).expectJson([{ id: '1', name: 'Ada' }]);

expect(userService.getAll).toHaveBeenCalledTimes(1);
```

Overrides are seeded **before** any user component is registered, so:

- the real class is never constructed, so its `@OnStart` (and its deprecated `@PostConstruct` alias) never runs
- every dependent captures the double, because Asena builds injection closures eagerly at registration time

### What can and cannot be overridden

| | |
|---|---|
| ✅ Services, repositories, components | The normal case |
| ❌ Core services | `Container`, `ServerLogger`, `__Ulak__`, `EventEmitter`, … are wired during bootstrap phases 1–5 and have already captured their dependencies. Attempting it throws with a clear message. |
| ❌ Controllers | A plain object carries no `@Controller` metadata, so an overridden controller's routes would never be registered. Override the services it depends on instead. |
| ⚠️ `@Strategy` arrays | Overriding an interface name to displace one member of a strategy array is not supported. |

::: tip Do not assign to an injected field
`@Inject` and `@Strategy` install accessors with no setter, so `Object.assign(instance, { dep: fake })` throws. The error names the field and the class and points back here. Use `overrides`, or [`mockComponent()`](/docs/testing/mock-component) for a unit-level double.
:::

If a component is registered under a custom name (`@Service('Mailer')`), override it by **that** name.

## Fluent HTTP assertions

`app.get()` / `.post()` / … return a `TestHttpCall`. Nothing is sent until the call is awaited, assertions run in the order they were chained, and the send is memoized so awaiting twice does not issue a second request.

```typescript
await app.post('/api/users', { body: JSON.stringify({ name: 'Ada' }) })
  .expectStatus(201)
  .expectHeader('content-type', /json/)
  .expectJsonContains({ name: 'Ada' });
```

| Method | Assertion |
|---|---|
| `expectStatus(code)` | Status code. On failure the message includes the method, URL and response body. |
| `expectHeader(name, value)` | Header equals a string, or matches a `RegExp`. |
| `expectJson(expected)` | Whole JSON body deep-equals `expected`. |
| `expectJsonContains(partial)` | JSON body contains at least these properties. |
| `expectBody(expected)` | Raw text body equals a string, or matches a `RegExp`. |
| `expect(fn)` | Escape hatch — receives the buffered response. |

Awaiting the call resolves to a `TestHttpResponse` whose body is already buffered, so it can be read as many times and as many ways as you like:

```typescript
const response = await app.get('/api/users').expectStatus(200);

expect(response.json<User[]>()).toHaveLength(3);
expect(response.text()).toContain('Ada');
expect(response.headers.get('x-total')).toBe('3');
expect(response.raw).toBeInstanceOf(Response);
```

## Cleanup

`app.stop()` is idempotent. The app also implements `Symbol.asyncDispose`, so `await using` cleans up automatically even when a test throws:

```typescript
test('...', async () => {
  await using app = await createTestApp({ adapter, components });
  // no afterEach needed
});
```

## Dispatch modes

### `'server'` (default)

Listens on a TCP port. Identical to production.

### `'socket'`

Listens on a **unix domain socket** instead. It is still the adapter's real routing pipeline — Bun's own router, real cookies, real validators, real WebSocket upgrades — but no TCP port is used at all, so parallel suites can never collide.

```typescript
await using app = await createTestApp({
  adapter,
  components,
  dispatch: 'socket',
});

expect(app.port).toBe(0);
expect(app.socketPath).toMatch(/\.sock$/);

await app.get('/api/users').expectStatus(200);
```

WebSocket URLs differ between modes, so build them with `app.wsUrl()` and the same test works in both:

```typescript
const socket = new WebSocket(app.wsUrl('/ws/chat'));
// 'server' -> ws://localhost:43117/ws/chat
// 'socket' -> ws+unix:///tmp/asena-test-1234-1.sock:/ws/chat
```

::: warning Adapter support
Socket dispatch requires an adapter that honours `AsenaStartOptions.unix`. The official `@asenajs/hono-adapter` and `@asenajs/ergenecore` both do.
:::

## The container

```typescript
const service = await app.resolve<UserService>('UserService');

expect(app.container.has('UserRepository')).toBe(true);
```

## Known behaviours

- **Cron and schedules run for real.** `cronRunner.startAll()` executes as part of start-up, so a `@Schedule` component in your test set will fire.
- **[`@OnStart` and `@OnStop` run for real.](/docs/concepts/lifecycle)** `createTestApp` calls `server.start()` and `app.stop()` calls `server.stop()`, so a component's start hook runs before the first request and its stop hook runs during cleanup — which is what releases pools, subscribers and timers between test files.
- **A throwing `@OnStart` fails the boot, not the process.** `createTestApp()` rejects with an error naming the hook. Up to 0.9.x the container called `process.exit(1)` instead, which reported `0 pass / 1 fail` with no indication of why.
- **Signals are not intercepted and the loop is not held open.** The harness passes `shutdown: { signals: false }` and `keepAlive: false`, so booting twenty apps in one suite installs no listeners and nothing keeps the process alive after the last test.
- **`lib/test` requires Bun.** The utilities import `bun:test` at module scope.

## Related

- **[Component Lifecycle](/docs/concepts/lifecycle)** — what `start()` and `stop()` run on your behalf
- **[createWebTest](/docs/testing/web-test)** — controller-slice testing with automatic mocks
- **[MockComponent API](/docs/testing/mock-component)** — unit-level dependency mocking
- **[Testing Overview](/docs/testing/overview)** — introduction to testing in Asena
