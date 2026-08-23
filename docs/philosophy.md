---
title: Philosophy
description: Why Asena exists, the principles behind its design, and the trade-offs it deliberately makes
outline: deep
---

# Philosophy

`Spring Boot` and `Quarkus` have established proven patterns for enterprise application development, but developers transitioning to TypeScript often find themselves reimplementing familiar concepts or adapting to unfamiliar architectures. `AsenaJS` addresses this gap by bringing automatic component discovery and field-based dependency injection to the `Bun` ecosystem.

The framework eliminates boilerplate through automatic scanning of decorator-annotated classes, removing the need for explicit module declarations or manual wiring. Components marked with `@Controller`, `@Service`, or `@Repository` (via the asena-drizzle package) are discovered and registered automatically, allowing developers to focus on business logic rather than configuration. Combined with Bun's native performance characteristics, this delivers both the familiar developer experience of Spring Boot and the speed expected from a modern JavaScript runtime.

`AsenaJS` is designed to make developers familiar with `Spring Boot` and `Quarkus` feel at home in the TypeScript ecosystem. As the framework evolves, we remain committed to this philosophy — bringing more proven patterns from the Java world while maintaining the performance advantages that `Bun` provides and the flexibility of TypeScript.

## Core Principles

These are the rules we hold ourselves to. They explain most of the design decisions you will encounter in the codebase.

<div class="card-grid">
  <a class="info-card" href="#zero-dependencies">
    <span class="ic-kicker">01</span>
    <div class="ic-title">Zero Dependencies</div>
    <p class="ic-desc">The core depends on exactly one package: <code>reflect-metadata</code>.</p>
  </a>
  <a class="info-card" href="#bun-native-first">
    <span class="ic-kicker">02</span>
    <div class="ic-title">Bun Native First</div>
    <p class="ic-desc"><code>Bun.serve()</code>, <code>Bun.file()</code> and native cron directly - not portable shims.</p>
  </a>
  <a class="info-card" href="#adapter-agnostic">
    <span class="ic-kicker">03</span>
    <div class="ic-title">Adapter Agnostic</div>
    <p class="ic-desc">The framework defines the contract; adapters implement it.</p>
  </a>
  <a class="info-card" href="#convention-over-configuration">
    <span class="ic-kicker">04</span>
    <div class="ic-title">Convention Over Configuration</div>
    <p class="ic-desc">Decorators announce what a component is; wiring is automatic.</p>
  </a>
  <a class="info-card" href="#testability-is-a-feature-not-an-afterthought">
    <span class="ic-kicker">05</span>
    <div class="ic-title">Testability Is a Feature</div>
    <p class="ic-desc"><code>mockComponent</code>, <code>createWebTest</code> and <code>createTestApp</code> ship in the box.</p>
  </a>
  <a class="info-card" href="#honest-performance">
    <span class="ic-kicker">06</span>
    <div class="ic-title">Honest Performance</div>
    <p class="ic-desc">Every number published with its adapter, machine and methodology attached.</p>
  </a>
</div>

### Zero Dependencies

The core framework depends on exactly one package: `reflect-metadata`. Nothing else.

Every feature is measured against this bar first. Before reaching for an npm package we ask: can Bun's native APIs do this? Can the framework do it in a few hundred lines we actually understand? Only when both answers are no does a dependency become a candidate — and even then it goes into a separate `@asenajs/*` package rather than the core.

This is why Redis, Kafka, OpenTelemetry, Drizzle and Winston all live in optional packages. Your application pays for what it uses and nothing more.

### Bun Native First

Asena is not a framework that happens to run on Bun. It is built for Bun.

`Bun.serve()`, `Bun.file()`, `server.upgrade()`, `Bun.CookieMap`, native cron, and Bun's own router are used directly instead of being abstracted behind portable shims. The `Ergenecore` adapter has zero runtime dependencies and hands routing entirely to Bun's native router — which is precisely why it reaches 202,066 req/s on plaintext in [our published benchmarks](/docs/benchmarks).

The trade-off is deliberate: Asena will not run on Node.js. In exchange, it does not pay the abstraction tax that portability demands.

### Adapter Agnostic

The framework defines the contract; adapters implement it.

`AsenaAdapter` and `AsenaContext` describe what an HTTP and WebSocket layer must provide. [Ergenecore](/docs/adapters/ergenecore) implements it with Bun natives for maximum speed; [Hono](/docs/adapters/hono) implements it on top of the Hono ecosystem for middleware compatibility. Your controllers, services and tests do not change when you switch between them.

This same seam is what lets microservice transports be swapped — Redis Streams, Kafka, or an in-memory transport — without a single change to a `@MessageController`.

### Convention Over Configuration

A component should announce what it is, not how to wire it.

`@Controller`, `@Service`, `@Middleware`, `@WebSocket`, `@Schedule`, `@EventService`, `@MessageController` — each decorator is enough for the container to discover, instantiate and inject the class. There are no module files, no provider arrays, no manual registration lists.

Field injection (`@Inject`) is chosen over constructor injection on purpose: it keeps constructors free for real initialization and makes inheritance hierarchies behave predictably.

### Testability Is a Feature, Not an Afterthought

A framework that is hard to test is a framework that quietly resists change.

Asena ships its testing utilities in the box, at three levels: [`mockComponent`](/docs/testing/mock-component) for unit tests that bypass the container entirely, [`createWebTest`](/docs/testing/web-test) for controller slices where routing and validation stay real, and [`createTestApp`](/docs/testing/test-app) for full-application tests where any component can be swapped for a mock.

They run on Bun's native test runner, add no external dependencies, and exercise the real routing pipeline rather than a simulation of it.

### Honest Performance

Benchmarks are published with the adapter, the machine and the methodology attached, and we do not quote numbers we have not measured. Where an abstraction costs performance, we say so. Where a faster path exists but sacrifices correctness, we take the correct one and document the trade-off.

## What Asena Is Not

Being clear about non-goals is as useful as listing features:

- **Not a Node.js framework.** Bun-only, by design.
- **Not a batteries-included monolith.** The core stays small; capability arrives through optional packages.
- **Not a Spring clone.** We borrow patterns that earned their place — IoC, component scanning, declarative transactions — and leave behind the ceremony that TypeScript does not need.
- **Not a full-stack meta-framework.** Asena serves APIs, WebSockets, messaging and static or Bun-bundled HTML. It does not ship an opinionated frontend rendering layer.

## Related

- [Get Started](/docs/get-started) - Build your first Asena application
- [Dependency Injection](/docs/concepts/dependency-injection) - How the IoC container works
- [Adapters Overview](/docs/adapters/overview) - Ergenecore vs Hono, and the contract between them
- [Testing Overview](/docs/testing/overview) - The three levels of testing
- [Roadmap](/docs/roadmap) - What is shipped and what is planned
