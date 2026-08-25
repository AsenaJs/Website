---
title: Roadmap
description: Asena Framework development roadmap - completed features, active development, and future plans
outline: deep
---

# Roadmap

This page outlines the current state of Asena Framework and our plans for future development. Our goal is to build a production-ready, high-performance IoC framework for Bun with enterprise-grade features.

::: info Living Document
This roadmap is updated regularly as we complete features and adjust priorities based on community feedback.
:::

---

## Current Release <span class="pill pill-live">v0.11.x · Stable</span>

These features are **stable and production-ready** in the current release:

### New in v0.11

`@asenajs/asena` 0.11.0, with both adapters at 4.0.0 — a major, because their context semantics changed. Every official package took a major alongside it, since each now requires core 0.11.

- **[`imports`](/docs/concepts/dependency-injection#registering-components-from-packages)** - packages hand their components to the server directly, since the scan never walks `node_modules`. The first step towards the plugin system below
- **[`@Value`](/docs/concepts/dependency-injection#value-configuration-injection)** - configuration injection from the environment, with `parse`, `default` and a loud failure for a required variable that is unset
- **[`createTestApp` walks the injection closure](/docs/testing/test-app#components)** - a test names its roots; classes reached through `@Inject(Class)` come along, and a dependency nobody provides fails before the boot instead of mid-boot
- **[`asena doctor`](/docs/cli/commands#asena-doctor)** - a read-only check for decorator flags, duplicate package copies, unsatisfied peer ranges and build settings that mangle component names
- **[`asena build` no longer rewrites your entry file](/docs/cli/commands#asena-build)** - it bundles through a temporary wrapper instead, so the entry's formatting rules are gone and its module-level code no longer runs at build time
- **Unified context semantics** *(adapter majors)* - [`getQuery` returns `undefined` when absent](/docs/concepts/context#query-parameters) on both adapters, [`setResponseHeader` replaces and `appendResponseHeader` appends](/docs/concepts/context#response-headers-setresponseheader-and-appendresponseheader) on both, and [SSE messages can carry a `comment`](/docs/concepts/context#keep-alive-comments) for keep-alive pings
- **[Lazy decorator options](/docs/packages/drizzle#lazy-options)** - `@Database`, `@Redis` and `@Otel` accept a thunk, so a service configured from the environment can ship inside a package
- **[The drizzle transaction boot guard](/docs/packages/drizzle#the-boot-guard)** - an unwrapped `@Transaction` method fails the boot instead of silently running with autocommit

### New in v0.10

- **[Component Lifecycle](/docs/concepts/lifecycle)** - `@OnStart` and `@OnStop`, a symmetric pair around `server.start()` and `server.stop()`. `@PostConstruct` is now a deprecated alias of `@OnStart`, and start hooks moved out of the component scan into `start()` - so a hook sees the finished graph, a `@Config` finds its injected components already started, and no request can reach a component whose hook has not run. A hook still cannot publish through `ulak`: it runs before the transports are wired
- **Graceful shutdown, completed** - `stop()` reordered around the new hooks, `ulak.dispose()` called automatically, the WebSocket transport's `destroy()` actually invoked, and every teardown step contained so one failure cannot strand the rest
- **[Signal handling](/docs/concepts/lifecycle#signal-handling)** - `SIGTERM` / `SIGINT` / `SIGHUP` call `stop()` by default; handlers are installed in `start()` and removed in `stop()`, with `forceExitAfter` and `onUnhandledError` as opt-ins
- **[`keepAlive`](/docs/concepts/lifecycle#keepalive-and-headless-workers)** - a headless worker starts its loop in `@OnStart`, returns, and the process stays alive. The run loop no longer has to live in the entry file
- **[Liveness and readiness probes](/docs/concepts/lifecycle#health-probes)** - `{path}/live` and `{path}/ready` next to the original endpoint, with readiness wired to the lifecycle state so `/ready` answers 503 for the whole drain
- **`server.resolve<T>(name)`** - resolve a component without reaching through `coreContainer.container`
- **A failing hook no longer kills the process** - `process.exit(1)` is gone; the error propagates and `start()` rejects

### New in v0.9

- **[Decorator Inheritance](/docs/concepts/inheritance)** - A route, page, event or message handler declared on a base class is now inherited by the decorated subclass. What changes the behaviour of a request travels with the route; what says where the route lives, or what a class is, stays with the concrete class
- **`onNotFound`** - An unmatched route is a routing outcome, not an error, so it has [its own config hook](/docs/guides/error-handling#not-found) and `onError` never has to ask which it is looking at
- **[Uniform error handling](/docs/guides/error-handling#adapter-logging)** - Both adapters answer the same 404, 500 and validation envelopes, and the framework's default log fires exactly when its default response does
- **`isHttpException()`** - Branded exception detection that survives a project resolving two copies of a package, where `instanceof` silently answers false and turns every deliberate 401/403 into a 500

### New in v0.9.2

- **[One `HttpException`](/docs/guides/error-handling#throwing-http-exceptions)** - The class moved into `@asenajs/asena/adapter`, so the same import and the same `throw` work unchanged on both adapters. Each adapter used to declare its own, with different constructors and different response bodies. Hono's `HTTPException` is still fully supported, so `hono/basic-auth`, `hono/bearer-auth`, `hono/jwt` and hono's validator keep working
- **Hono brand parity** - The Hono adapter's default response now selects on the brand rather than `instanceof`, and its log level is derived from the same status the caller received. Previously a branded exception from a second resolved copy was answered 500 while its log line claimed the status it carried

### Core Framework

- **Dependency Injection Container** - Full IoC container with constructor, property, and method injection
- **Decorator-Based API** - TypeScript decorators for controllers, services, middleware, and more
- **Controller System** - REST API controllers with route decorators (`@Get`, `@Post`, `@Put`, `@Delete`, `@Patch`, `@All`, `@Route`)
- **Service Layer** - Service components with lifecycle management
- **Middleware System** - Global, pattern-based, controller, and route-level middleware
- **Context API** - Unified request context abstraction across adapters
- **[Validation](/docs/concepts/validation)** - Zod-based request validation with `@Middleware({ validator: true })`
- **[Static File Serving](/docs/concepts/static-files)** - `@StaticServe` with lifecycle hooks
- **WebSocket Support** - Decorator-based WebSocket with namespace, room management, and [multi-pod transport](/docs/concepts/websocket#multi-pod-websocket)
- **[Ulak](/docs/concepts/ulak)** - Central message hub that breaks circular dependencies between services, WebSocket namespaces, and microservice transports
- **Configuration Management** - `@Config` decorator for server configuration
- **EventService Support** - Built-in native EventService support with `@EventService` and `@On`
- **[Scheduled Tasks](/docs/concepts/scheduled-tasks)** - Cron-based task scheduling with `@Schedule` and `CronRunner`
- **[FrontendController](/docs/concepts/frontend-controller)** - Serve HTML pages using Bun's native HTML imports with `@FrontendController` and `@Page`
- **[PostProcessor](/docs/concepts/post-processor)** - Component interception for metadata collection and instance transformation
- **SSE/Streaming** - Server-Sent Events with `stream()`, `streamSSE()`, `streamText()`
- **Duplicate Route Detection** - Prevents accidental route conflicts at startup
- **[Graceful Server Shutdown](/docs/concepts/lifecycle#stop-sequence)** - `server.stop()` with a contained, ordered teardown: cron, adapter, `@OnStop` hooks, microservice transports, Ulak, health endpoint
- **[Microservices](/docs/concepts/microservices)** - Broker-agnostic messaging with `@MessageController`, `@MessagePattern` (RPC), `@EventPattern` (events), Ulak client API, and multiple named transports
- **Headless Mode** - Start without an HTTP adapter for message-driven internal services, with optional health endpoint

### Testing

- **[mockComponent](/docs/testing/mock-component)** - Unit-level testing that auto-mocks every `@Inject` dependency of a component, including expression injections such as `ulak()`
- **[createTestApp](/docs/testing/test-app)** - Boot a full application in a test, replace any registered component with a mock, and assert on real HTTP responses with a fluent chain
- **[createWebTest](/docs/testing/web-test)** - Controller-slice testing: routing, middlewares and validators stay real while every other dependency is auto-mocked
- **Unix Socket Dispatch** - Run the adapter's real routing pipeline without occupying a TCP port, so parallel suites never collide

### Adapters

- **Ergenecore Adapter** - Native Bun adapter with SIMD-accelerated routing and streaming
- **Hono Adapter** - Hono-based adapter with [strict mode (trailing slash)](/docs/adapters/hono#trailing-slash-strict-mode), streaming, and middleware compatibility

### Official Packages

- **[@asenajs/asena-logger](/docs/packages/logger)** - Structured logging with multiple transports (console, file, Loki)
- **[@asenajs/asena-drizzle](/docs/packages/drizzle)** - Drizzle ORM integration with repository pattern
- **[@asenajs/asena-openapi](/docs/packages/openapi)** - Automatic OpenAPI 3.1 spec generation from existing validators
- **[@asenajs/asena-redis](/docs/packages/redis)** - Redis client with multi-pod WebSocket transport (pub/sub) and production-grade microservice transport (Redis Streams: consumer groups, retry + DLQ, graceful drain)
- **[@asenajs/asena-kafka](/docs/packages/kafka)** - Kafka microservice transport with deterministic topic management, broker-tracked retry attempts, DLQ, and external-topic interop
- **[@asenajs/asena-otel](/docs/packages/opentelemetry)** - OpenTelemetry tracing with automatic instrumentation, including distributed tracing across microservices via `otelMessaging()`

::: info Independent Versioning
Adapters and official packages version independently of the core framework. `@asenajs/asena` v0.11.x is the baseline they all target — check each package page for its own current version.
:::

### CLI Tools

- **Project Scaffolding** - `asena create` command for project generation
- **Code Generation** - Generate controllers, services, middleware, WebSocket services
- **Project Bundling** - `asena build` command bundles your project based on [`asena-config.ts`](/docs/cli/configuration), significantly improving performance by reducing cold start time and package size

## Planned for v1.0 <span class="pill pill-teal">Planned</span>

These features are **planned for the v1.0 release** and will make Asena enterprise-ready:

### Plugin System

A powerful plugin architecture allowing third-party extensions.

**The first step landed in v0.11:**
[`imports`](/docs/concepts/dependency-injection#registering-components-from-packages) closes the
gap that made a plugin impossible to write at all — the component scan never walks
`node_modules`, so a package's components had no way into the container short of the consumer
re-declaring them. A package can now export its components and the application hands them in:

```typescript
imports: [...platformComponents, OtelService]
```

Combined with the [lazy decorator options](/docs/packages/drizzle#lazy-options) that landed
alongside it, a package can also ship a *configured* `@Database`, `@Redis` or `@Otel` service and
still read the consuming application's environment at the right moment.

**What `imports` does not do**, and what the plugin system is for:

| Missing | Why it matters |
|:--------|:---------------|
| A plugin *unit* | `imports` takes a flat list of classes. There is no object a package can export that carries its components, its configuration schema and its identity together |
| Lifecycle hooks of its own | A plugin cannot run anything at load time. Only its components have [`@OnStart` / `@OnStop`](/docs/concepts/lifecycle) |
| Dependency resolution between plugins | Nothing declares "this plugin needs that one", so ordering is the application's problem |
| Configuration management | A plugin's options are whatever its own decorators read. There is no per-plugin config surface and no validation |
| A registry | Discovery is npm search |

**Features still planned:**
- Plugin lifecycle hooks (`onLoad`, plus the plugin-level equivalents of the component `@OnStart` / `@OnStop` [shipped in v0.10](/docs/concepts/lifecycle))
- Plugin dependency resolution
- Plugin configuration management
- Official plugin registry

**Use Cases:**
- Authentication plugins (OAuth, JWT, SAML)
- Database adapters (PostgreSQL, MySQL, MongoDB)
- Monitoring and APM integrations

---

## Future Ideas · CLI <span class="pill pill-planned">Under discussion</span>

These features are **under consideration** for future CLI releases:

### Dev Console (Quarkus-inspired)

Interactive development console for debugging and inspection.

**Planned Features:**
- Web-based dashboard running during development
- Live route inspection and testing
- Request/response logging
- Performance metrics in real-time

**Inspiration:** Similar to Quarkus Dev UI

### Container Visualizer

Visual representation of IoC container dependencies.

**Planned Features:**

- Dependency graph visualization
- Service lifecycle tracking
- Circular dependency detection

**Benefits:**

- Understanding service dependencies

::: warning No Timeline Yet
These CLI features are **ideas under discussion** and do not have a fixed release timeline.
:::

---

## 🎯 Release Philosophy

### Version Strategy

- **v0.x.x** - Pre-1.0 releases with breaking changes possible
- **v1.0.0** - First stable release with API stability guarantees
- **v1.x.x** - Patch and minor releases with backward compatibility
- **v2.0.0** - Major release with new features and potential breaking changes

### Stability Guarantees

| Version | Status | Breaking Changes | Production Use |
|:--------|:-------|:-----------------|:---------------|
| v0.9.x  | Older | Possible | Yes (with caution) |
| v0.10.x | Previous | Possible | Yes (with caution) |
| v0.11.x | Current | Possible | Yes (with caution) |
| v1.0.0+ | Stable | Semantic versioning | Recommended |

### Development Priorities

1. **Stability First** - Bug fixes and reliability improvements take priority
2. **Performance** - Maintain Bun's performance advantages
3. **Developer Experience** - Clear APIs, great documentation, helpful errors
4. **Community Feedback** - Feature requests and issues guide our roadmap

---

## 🤝 Community Involvement

### How to Contribute

We welcome contributions in many forms:

- **Code Contributions** - Submit PRs for features or bug fixes
- **Documentation** - Improve guides, add examples, fix typos
- **Feature Requests** - Open GitHub issues with your ideas
- **Bug Reports** - Report issues with reproducible examples
- **Testing** - Test pre-release versions and provide feedback

### Feature Request Process

1. Open a GitHub issue with the `feature-request` label
2. Describe the use case and expected behavior
3. Community discussion and feedback
4. Core team review and prioritization
5. Implementation and release

---

## 📅 Release Schedule

### Current Cycle

- **v0.7.0** - Released April 2026 (OpenAPI, Redis, OTel, FrontendController, Schedule, PostProcessor, Streaming)
- **v0.7.1** - Released April 2026 (`routePattern` on Context, FrontendController registration refinements)
- **v0.8.0** - Released July 2026 (Microservices, Headless mode, Kafka package, test harness, Redis Streams transport, distributed tracing)
- **v0.9.0** - Released July 2026 (Decorator inheritance, `onNotFound` hook, uniform error and 404 handling across adapters, branded `HttpException`)
- **v0.9.2** - Released July 2026 (One `HttpException` in core, thrown identically on both adapters; the Hono adapter's default response and log level both moved onto the brand)
- **v0.10.0** - Released July 2026 (Component lifecycle (`@OnStart` / `@OnStop`), reordered graceful shutdown, signal handling, `keepAlive`, liveness/readiness probes, `server.resolve()`). **Breaking:** start hooks moved from the component scan to `server.start()`
- **v0.11.0** - Released August 2026 (`imports`, `@Value`, `createTestApp` dependency closure, `asena doctor`, wrapper-based `asena build`, lazy decorator options, drizzle transaction boot guard). **Breaking:** both adapters moved to 4.0.0 for unified context semantics, and every official package took a major to require core 0.11
- **v1.0.0** - TBD (Plugin system)

::: tip Follow Progress
Track development progress on our [GitHub repository](https://github.com/AsenaJs/Asena) and join discussions in [GitHub Issues](https://github.com/AsenaJs/Asena/issues).
:::

---

## 🔮 Long-Term Vision

Our vision for Asena is to become the **go-to framework for Bun-based web applications**, combining:

- **Enterprise-Grade Features** - Plugin system, observability, API documentation
- **Developer Experience** - Intuitive APIs, excellent tooling, comprehensive docs
- **Performance** - Native Bun speed with minimal overhead
- **Ecosystem** - Rich collection of official and community packages

---

## Related

- [Get Started](/docs/get-started) - Start building with Asena today
- [CLI Overview](/docs/cli/overview) - Learn about Asena CLI tools
- [GitHub Repository](https://github.com/AsenaJs/Asena) - Contribute to the project
- [Examples](/docs/examples) - See real-world usage examples
