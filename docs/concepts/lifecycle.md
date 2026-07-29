---
title: Component Lifecycle
description: Start and stop your components with @OnStart and @OnStop, including shutdown ordering, signal handling and health probes
outline: deep
---

# Component Lifecycle

A component that opens something at boot has to close it at shutdown. Asena gives you both
halves as a symmetric pair of method decorators:

| Decorator | Runs | Purpose |
|:----------|:-----|:--------|
| `@OnStart()` | During `server.start()`, before the HTTP socket binds | Acquire: connect, subscribe, preload, start a loop |
| `@OnStop()` | During `server.stop()`, in reverse start order | Release: disconnect, unsubscribe, drain, stop the loop |

```typescript
import { Service } from '@asenajs/asena/decorators';
import { Inject, OnStart, OnStop } from '@asenajs/asena/decorators/ioc';

@Service()
export class PriceFeed {
  @Inject(MarketClient)
  private market: MarketClient;

  private subscription?: Subscription;

  @OnStart()
  public async start() {
    this.subscription = await this.market.subscribe('prices');
  }

  @OnStop()
  public async stop() {
    await this.subscription?.close();
  }
}
```

::: tip `@PostConstruct` is now `@OnStart`
`@PostConstruct` still exists and still works — it is a deprecated alias that writes the same
metadata. Nothing needs to change beyond the import. What *did* change is **when** the hook
runs; see [Upgrading from 0.9.x](#upgrading-from-0-9-x).
:::

## `@OnStart`

The hook runs once the whole component graph exists, and before the framework starts consuming
it. By the time it is called:

- every component has been constructed and every `@Inject` / `@Strategy` field is populated
- every `@PostProcessor` has run

and — deliberately — none of the application setup has happened yet: `@Config` hooks have not
been read, microservice transports are not connected, routes are not registered, the HTTP socket
is not bound and scheduled jobs have not started.

Two things follow from that, and they are the reason the timing is what it is:

::: warning A start hook cannot publish through `ulak`
The transports are wired during application setup, which is *after* the hooks run, so
`ulak.send()` / `ulak.emit()` inside an `@OnStart` throws `NO_TRANSPORT`. Defer the first
publish — an `@OnStop` has no such limit, because the transports are torn down after the stop
hooks.
:::

::: tip A `@Config` finds its dependencies started
This is what buys the ordering above. `serveOptions()`, `globalMiddlewares()` and `transport()`
are *called* during application setup, and `prepareMicroservices()` goes on to `init()` and
`listen()` whatever `transport()` returned. A config that builds a transport from an injected
service — the pattern the redis and kafka packages document — therefore needs that service
already started, and it is.
:::

::: tip No request can outrun a start hook
The listening socket opens only after every hook has returned. A controller cannot be reached
before the service it injects has finished initialising.
:::

### The hook must return

`@OnStart` is awaited. A hook that never resolves is a server that never finishes starting.
A component that runs for the process's lifetime starts its loop and keeps the handle:

```typescript
@Service()
export class QueueWorker {
  private running = false;

  @OnStart()
  public async start() {
    this.running = true;
    void this.loop();       // started, not awaited
  }

  @OnStop()
  public async stop() {
    this.running = false;   // the loop observes this and returns
  }

  private async loop() {
    while (this.running) {
      await this.drainOnce();
    }
  }
}
```

## `@OnStop`

The counterpart. It runs during `server.stop()`, and at that point:

- the HTTP surface is already down — no new requests, in-flight ones have been handled
- the component's own dependencies are **still up**, because stop walks the graph backwards
- microservice transports are **still up**, so a hook can finish in-flight work and publish a
  last message

```typescript
import { ICoreServiceNames } from '@asenajs/asena/ioc/types';
import type { Ulak } from '@asenajs/asena/messaging';

@Service()
export class ShiftReporter {
  @Inject(ICoreServiceNames.__ULAK__)
  private ulak: Ulak;

  @OnStop()
  public async flush() {
    await this.ulak.emit('shift.ended', { at: Date.now() });
  }
}
```

## Where the hooks sit

### Start sequence

1. Components are constructed, `@Inject` and `@Strategy` fields are wired, `@PostProcessor`s run
2. **`@OnStart` hooks run**, in registration order
3. `@Config` hooks are read and applied
4. Microservice transports connect and start listening
5. Event handlers and scheduled jobs are registered
6. Routes, frontend controllers and WebSocket namespaces are registered with the adapter
7. The adapter binds the HTTP socket
8. Scheduled jobs start
9. The health endpoint starts, signal handlers are installed

### Stop sequence

`server.stop()` runs these steps in order. The order is what makes the shutdown graceful rather
than merely quick:

1. Signal handlers and the keep-alive handle are released, and the lifecycle state flips to
   `STOPPING` — so `/ready` answers `503` for the **whole** drain, not just the last instant
2. Scheduled jobs stop
3. The adapter stops (this is what closes the HTTP socket and the WebSocket transport)
4. **`@OnStop` hooks run**, in reverse start order
5. Microservice transports drain and disconnect
6. `ulak.dispose()`
7. The health endpoint stops — last, so the probe outlives the drain it reports on

Every step is contained: a step that throws is logged, the remaining steps still run, and the
collected failures are raised together as an `AggregateError` at the end. One broken teardown
cannot strand the ones behind it.

## Ordering rules

- **Start walks components in registration order**, which the IoC engine has topologically
  sorted — a component's dependencies have started before its own hook runs.
- **Stop walks the same list backwards** — a component still has its dependencies while it
  releases its own resources.
- Within one class, multiple `@OnStart` methods run in declaration order (ancestors first when
  the class inherits hooks), and its `@OnStop` methods run in the reverse of that.
- An inherited hook runs **once**, however deep the chain — see [Inheritance](/docs/concepts/inheritance).

## Failure policy

The two halves fail differently on purpose.

| | A hook that throws | A hook that hangs |
|:--|:--|:--|
| `@OnStart` | Boot aborts. Components that already started are rolled back, the lifecycle state becomes `FAILED`, and `server.start()` rejects with an error naming the hook and carrying the original error as `cause` | No timeout — an `@OnStart` that never resolves is a `start()` that never resolves |
| `@OnStop` | Logged and skipped; shutdown continues | Bounded per hook (default `5000` ms), then logged and skipped |

A half-initialised application must not serve traffic, so a failing start hook stops the boot.
A shutdown that gives up halfway leaves more behind than one that limps to the end, so a failing
stop hook does not.

::: warning A failed boot does not stop the server for you
`server.start()` rejecting rolls back the components that started, but the microservice
transports it already connected are still up. Call `server.stop()` in the failure path — it is
safe on a server that never finished starting.

```typescript
try {
  await server.start();
} catch (error) {
  await server.stop();
  throw error;
}
```
:::

::: info No more `process.exit(1)`
Up to 0.9.x a throwing `@PostConstruct` was caught by the container, logged, and followed by
`process.exit(1)` — which in a test run produced `0 pass / 1 fail` with no indication of why.
The error now propagates.
:::

## Who takes part

**Only singletons.** A transient (`Scope.PROTOTYPE`) is constructed per resolve and the
container keeps no handle on it, so there is nothing to stop. Its `@OnStart` still runs at
construction; a transient that declares `@OnStop` gets a boot warning, because that hook can
never run:

```
[IocEngine] 'RequestScratchpad' is transient and declares @OnStop (release), which will never
run - the container keeps no handle on a transient instance.
```

**A component is stopped only if its start hook completed.** Components rolled back by a failed
boot, or never started because `start()` was never called, are skipped. Components that
initialise at construction — `@PostProcessor`s, their dependencies, and the framework's own core
services — count as started from that moment, so their `@OnStop` runs even on a server that was
created but never started.

**`stop()` runs once.** Concurrent calls share one teardown rather than racing two of them, and a
later call is a no-op that returns the original outcome — including its failure, if it had one.
Every step was attempted the first time, so a retry has nothing to pick up. This matters beyond
tidiness: the component hooks would correctly find nothing to do, but the adapter, the cron runner
and the transports do not guard themselves, so a second pass would tear down an already-stopped
server and log a second round of teardown errors.

::: tip A `@Config` may carry a start hook
Its `@OnStart` runs before its config hooks are read, so it can prepare something that
`transport()` or `globalMiddlewares()` then uses. The same holds for anything the config injects.
:::

::: warning `@PostProcessor` keeps the old timing
A post-processor's `postProcess()` reads state its own start hook sets up, so deferring that
hook would wrap every later component against an uninitialised processor. Post-processors and
the components they inject therefore run their `@OnStart` at construction, as before — see
[PostProcessor](/docs/concepts/post-processor#bootstrap-priority).
:::

## Stopping the server

```typescript
await server.stop();                          // closeActiveConnections: true
await server.stop(false);                     // wait for in-flight connections instead
await server.stop({ drainTimeout: 30_000 });  // give the transports 30s to drain
```

| Option | Type | Default | Description |
|:-------|:-----|:--------|:------------|
| `closeActiveConnections` | `boolean` | `true` | Close in-flight connections instead of waiting for them |
| `drainTimeout` | `number` | transport's own | How long microservice transports may drain in-flight messages, in ms |
| `hookTimeout` | `number` | `shutdown.timeout`, else `5000` | Per-`@OnStop` ceiling, in ms |

The option shapes and the state the readiness probe reports are exported, so you can type a
wrapper around either:

```typescript
import { LifecycleState } from '@asenajs/asena';
import type { AsenaStopOptions, ShutdownOptions } from '@asenajs/asena';
```

The bare boolean form (`stop(true)` / `stop(false)`) is still accepted and still means
`closeActiveConnections`.

::: tip `drainTimeout` is reachable now
Both broker transports supported a drain window, but `stop()` only took a boolean — so there was
no way for an application to pass one. `stop({ drainTimeout })` is the way.
:::

## Signal handling

Signal handling is **on by default**. `start()` installs the handlers and `stop()` removes them,
so a process that boots several servers — a test suite, a watch-mode reload — does not
accumulate listeners.

```typescript
const server = await AsenaServerFactory.create({
  adapter,
  logger,
  port: 3000,
  shutdown: {
    signals: true,            // default: SIGTERM, SIGINT, SIGHUP
    timeout: 5000,            // per-@OnStop ceiling
    forceExitAfter: false,
    onUnhandledError: false,
  },
});
```

| Option | Type | Default | Description |
|:-------|:-----|:--------|:------------|
| `signals` | `boolean \| NodeJS.Signals[]` | `true` | `true` covers `SIGTERM`, `SIGINT`, `SIGHUP`. Pass a list to narrow it, or `false` to own the signals yourself |
| `timeout` | `number` | `5000` | Per-`@OnStop` ceiling, in ms. `stop({ hookTimeout })` overrides it for one call |
| `forceExitAfter` | `number \| false` | `false` | Force the **process** to exit this many ms after a signal-triggered shutdown began |
| `onUnhandledError` | `boolean` | `false` | Treat an uncaught exception or unhandled rejection as a shutdown request: log, stop, exit non-zero |

A second signal while a shutdown is already running exits immediately with code `130` — someone
pressing `Ctrl+C` again because the first one looked stuck means it.

::: warning `forceExitAfter` is a deadline on the process, not on `stop()`
The case worth protecting against is a `stop()` that completed cleanly and left something ref'd
behind anyway — a pool that never drained, a timer nobody owns — because that process now hangs
until the orchestrator `SIGKILL`s it. The timer is `unref()`'d, so a process that exits on its
own is never delayed by it, and a forced exit is always non-zero.

Leaving it `false` is the honest default: a process that will not exit is a bug worth seeing.
:::

::: tip `onUnhandledError` swallows the stack
It turns a crash into a graceful teardown, which is usually what a production process wants —
but the top-level stack Bun would otherwise print goes with it. Hence opt-in.
:::

## `keepAlive` and headless workers

A process with no listening socket has nothing holding the event loop open, so once `start()`
resolves it would exit — taking a perfectly healthy worker with it. `keepAlive` holds it open;
it defaults to `true` in [headless mode](/docs/concepts/microservices#headless-mode) and `false`
otherwise, because an HTTP server is held open by its own socket.

This is what lets the run loop live in the component instead of in the entry file:

```typescript
// src/workers/OutboxWorker.ts
import { Service } from '@asenajs/asena/decorators';
import { Inject, OnStart, OnStop } from '@asenajs/asena/decorators/ioc';
import { ICoreServiceNames } from '@asenajs/asena/ioc/types';
import type { Ulak } from '@asenajs/asena/messaging';

@Service()
export class OutboxWorker {
  @Inject(ICoreServiceNames.__ULAK__)
  private ulak: Ulak;

  @Inject(OutboxRepository)
  private outbox: OutboxRepository;

  private running = false;

  private loop?: Promise<void>;

  @OnStart()
  public start() {
    this.running = true;
    this.loop = this.run();   // returns immediately; the loop keeps running
  }

  @OnStop()
  public async stop() {
    this.running = false;
    await this.loop;          // let the current batch finish
  }

  private async run() {
    while (this.running) {
      for (const entry of await this.outbox.takePending(100)) {
        await this.ulak.emit(entry.pattern, entry.payload);
        await this.outbox.markSent(entry.id);
      }

      await Bun.sleep(250);
    }
  }
}
```

```typescript
// src/index.ts
import { AsenaServerFactory } from '@asenajs/asena';
import { logger } from './logger';

const server = await AsenaServerFactory.create({
  headless: true,           // no HTTP adapter
  logger,
  health: { port: 9090 },   // K8s probes
  // keepAlive defaults to true here - the entry file does not have to block
});

await server.start();
```

The entry file no longer awaits the loop, so `SIGTERM` reaches `stop()`, `stop()` reaches
`@OnStop`, and the worker finishes its current batch before the process exits.

## Health probes

With `health: { port }` Asena starts a minimal zero-dependency endpoint. `path` defaults to
`/healthz`, and there are three routes under it — liveness and readiness answer different
questions, and a probe that conflates them restarts a pod that was only busy starting up.

| Route | Answers |
|:------|:--------|
| `GET {path}/live` | `200` for as long as the process is alive. Touches no dependency — point your **restart policy** here |
| `GET {path}/ready` | `503` unless the lifecycle state is `STARTED`, and `503 degraded` when any microservice transport is disconnected. Point your **load balancer** here |
| `GET {path}` | The original endpoint, same body as `/ready` |

```jsonc
// GET :9090/healthz/live
{ "status": "up", "uptime": 123 }

// GET :9090/healthz/ready - serving, all transports connected
{ "status": "up", "uptime": 123, "transports": { "default": "connected" } }

// GET :9090/healthz/ready - a transport is down
{ "status": "degraded", "uptime": 123, "transports": { "default": "disconnected" } }   // 503

// GET :9090/healthz/ready - not serving (starting, stopping, or a failed boot)
{ "status": "not_ready", "state": "STOPPING", "uptime": 123 }                          // 503
```

`state` is the server's lifecycle state: `NEW`, `STARTING`, `STARTED`, `STOPPING`, `STOPPED` or
`FAILED`. Because readiness flips to `STOPPING` before anything is torn down, and the health
server is the last thing `stop()` takes down, `/ready` answers `503` for the entire drain — which
is what lets a load balancer pull the instance while it still has work to finish.

## `server.resolve()`

Once `start()` has returned, the server hands out any registered component by name — which is how
an entry file or a one-off script reaches the graph without being a component itself:

```typescript
await server.start();

const feed = await server.resolve<PriceFeed>('PriceFeed');
```

Resolving *before* `start()` is the trap this page exists to describe: the component is
constructed and injected, but its `@OnStart` has not run, so it is not initialised. It replaces
reaching through `server.coreContainer.container.resolve()`, which worked and was what everybody
found instead.

See [Reaching the container from outside](/docs/concepts/dependency-injection#reaching-the-container-from-outside)
for naming, duplicate names and the failure mode on an unknown name.

## Upgrading from 0.9.x

::: warning Start hooks moved to `server.start()`
Up to and including `0.9.x`, `@PostConstruct` ran inside `Container.register()` — mid-scan, while
the rest of the graph was still being built. It now runs from `server.start()`, once everything
exists. What that changes:

- **A start hook still cannot publish through `ulak`.** The hooks run before application setup,
  which is where the transports are wired, so `ulak.send()` / `emit()` inside one throws
  `NO_TRANSPORT` exactly as it did in `0.9.x`. Keep deferring the first publish.
- **A component resolved from a server that was created but never started is no longer
  initialised.** If you construct a server and pull components out of it without calling
  `start()`, call `start()`.
- **A throwing hook no longer calls `process.exit(1)`.** It throws, naming the hook, with the
  original error as `cause`, and `server.start()` rejects.
- **Start hooks now run after `@PostProcessor`s, not before.** A hook therefore runs against the
  post-processed instance — the same object every other component was injected with.
- **`@PostProcessor`s are the exception** and keep the old construction-time timing.

`@PostConstruct` itself is unchanged and still supported as a deprecated alias of `@OnStart`, so
no source change is required. Renaming the import is the whole migration.
:::

::: warning `stop()` reordered and `ulak.dispose()` is automatic
`server.stop()` now runs `@OnStop` hooks between the adapter and the microservice transports,
and calls `ulak.dispose()` itself. If your code called `ulak.dispose()` after `stop()`, drop it —
`dispose()` is idempotent, but the call is no longer needed.
:::

::: warning Signal handlers are installed by default
`start()` now registers `SIGTERM`, `SIGINT` and `SIGHUP` handlers that call `stop()`. If your
entry file already installs its own, either remove them or pass `shutdown: { signals: false }`,
or a signal will trigger two shutdowns.
:::

## Related

- [Dependency Injection](/docs/concepts/dependency-injection#lifecycle-hooks) — the wiring the hooks run on top of
- [PostProcessor](/docs/concepts/post-processor) — cross-cutting instance transformation, and why it starts earlier
- [Microservices](/docs/concepts/microservices#graceful-shutdown) — what the transports do while the hooks run
- [Inheritance](/docs/concepts/inheritance) — hooks declared on a base class
- [Scheduled Tasks](/docs/concepts/scheduled-tasks) — cron jobs start after the hooks and stop before them
