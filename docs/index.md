---
title: Documentation
description: Every Asena documentation section on one page - getting started, core concepts, migration, adapters, official packages, testing and AI tooling
outline: [2, 2]
llms: false
---

# Documentation

Asena is an IoC web framework for Bun: decorate a class, and the container finds it, wires its
dependencies and serves its routes. Start with the first section, or jump to what you need.

## Start

<div class="card-grid">
  <a class="info-card" href="/docs/get-started">
    <span class="ic-kicker">5 minutes</span>
    <div class="ic-title">Get Started</div>
    <p class="ic-desc">Install the CLI, create a project and serve your first route.</p>
  </a>
  <a class="info-card" href="/docs/key-concepts">
    <span class="ic-kicker">Overview</span>
    <div class="ic-title">Key Concepts</div>
    <p class="ic-desc">The container, field injection, scopes, bootstrap, adapters and context.</p>
  </a>
  <a class="info-card" href="/docs/best-practices">
    <span class="ic-kicker">Structure</span>
    <div class="ic-title">Best Practices</div>
    <p class="ic-desc">Feature folders, thin controllers, repository ownership and the silent traps.</p>
  </a>
  <a class="info-card" href="/docs/examples">
    <span class="ic-kicker">Reference</span>
    <div class="ic-title">Examples</div>
    <p class="ic-desc">Complete, runnable example projects.</p>
  </a>
</div>

## Concepts

<div class="card-grid">
  <a class="info-card" href="/docs/concepts/controllers">
    <span class="ic-kicker">HTTP</span>
    <div class="ic-title">Controllers</div>
    <p class="ic-desc">Routes, parameters and responses.</p>
  </a>
  <a class="info-card" href="/docs/concepts/dependency-injection">
    <span class="ic-kicker">IoC</span>
    <div class="ic-title">Dependency Injection</div>
    <p class="ic-desc"><code>@Inject</code>, <code>@Strategy</code>, <code>@Value</code> and scopes.</p>
  </a>
  <a class="info-card" href="/docs/concepts/lifecycle">
    <span class="ic-kicker">Lifecycle</span>
    <div class="ic-title">Component Lifecycle</div>
    <p class="ic-desc"><code>@OnStart</code>, <code>@OnStop</code>, shutdown and health probes.</p>
  </a>
  <a class="info-card" href="/docs/concepts/middleware">
    <span class="ic-kicker">Requests</span>
    <div class="ic-title">Middleware</div>
    <p class="ic-desc">Global, controller and route middleware, CORS and rate limiting.</p>
  </a>
  <a class="info-card" href="/docs/concepts/validation">
    <span class="ic-kicker">Type Safety</span>
    <div class="ic-title">Validation</div>
    <p class="ic-desc">Route context contracts and validator classes.</p>
  </a>
  <a class="info-card" href="/docs/concepts/websocket">
    <span class="ic-kicker">Real-time</span>
    <div class="ic-title">WebSocket</div>
    <p class="ic-desc">Namespaces, rooms and multi-pod broadcasting.</p>
  </a>
  <a class="info-card" href="/docs/concepts/microservices">
    <span class="ic-kicker">Messaging</span>
    <div class="ic-title">Microservices</div>
    <p class="ic-desc">Request/response and events over a broker.</p>
  </a>
  <a class="info-card" href="/docs/concepts/event-system">
    <span class="ic-kicker">In-process</span>
    <div class="ic-title">Event System</div>
    <p class="ic-desc">Decoupled reactions inside one application.</p>
  </a>
  <a class="info-card" href="/docs/concepts/scheduled-tasks">
    <span class="ic-kicker">Background</span>
    <div class="ic-title">Scheduled Tasks</div>
    <p class="ic-desc">Cron jobs as components.</p>
  </a>
  <a class="info-card" href="/docs/concepts/context">
    <span class="ic-kicker">Per request</span>
    <div class="ic-title">Context</div>
    <p class="ic-desc">Reading the request, writing the response, sharing state.</p>
  </a>
</div>

See the sidebar for the rest: static files, Ulak, frontend controllers, post-processors and
inheritance.

## Migrate

<div class="card-grid">
  <a class="info-card" href="/docs/migrate/from-nestjs">
    <span class="ic-kicker">NestJS</span>
    <div class="ic-title">Coming from NestJS</div>
    <p class="ic-desc">Modules, guards, pipes, filters and tests mapped to Asena side by side.</p>
  </a>
</div>

## Adapters

<div class="card-grid">
  <a class="info-card" href="/docs/adapters/overview">
    <span class="ic-kicker">Architecture</span>
    <div class="ic-title">Adapters Overview</div>
    <p class="ic-desc">How the core and the HTTP layer fit together, and which to pick.</p>
  </a>
  <a class="info-card" href="/docs/adapters/ergenecore">
    <span class="ic-kicker">Native Bun</span>
    <div class="ic-title">Ergenecore</div>
    <p class="ic-desc">Zero runtime dependencies, Bun's own router.</p>
  </a>
  <a class="info-card" href="/docs/adapters/hono">
    <span class="ic-kicker">Hono</span>
    <div class="ic-title">Hono Adapter</div>
    <p class="ic-desc">The Hono middleware ecosystem behind the same decorators.</p>
  </a>
</div>

## Packages

<div class="card-grid">
  <a class="info-card" href="/docs/packages/drizzle">
    <span class="ic-kicker">Database</span>
    <div class="ic-title">Drizzle ORM</div>
    <p class="ic-desc">Repositories and declarative transactions.</p>
  </a>
  <a class="info-card" href="/docs/packages/openapi">
    <span class="ic-kicker">API Docs</span>
    <div class="ic-title">OpenAPI</div>
    <p class="ic-desc">An OpenAPI 3.1 spec generated from your routes.</p>
  </a>
  <a class="info-card" href="/docs/packages/opentelemetry">
    <span class="ic-kicker">Observability</span>
    <div class="ic-title">OpenTelemetry</div>
    <p class="ic-desc">Traces and metrics for every request.</p>
  </a>
  <a class="info-card" href="/docs/packages/redis">
    <span class="ic-kicker">Caching and Transport</span>
    <div class="ic-title">Redis</div>
    <p class="ic-desc">Cache decorators, WebSocket and microservice transports.</p>
  </a>
  <a class="info-card" href="/docs/packages/kafka">
    <span class="ic-kicker">Streaming</span>
    <div class="ic-title">Kafka</div>
    <p class="ic-desc">A Kafka client and microservice transport.</p>
  </a>
  <a class="info-card" href="/docs/packages/logger">
    <span class="ic-kicker">Logging</span>
    <div class="ic-title">Logger</div>
    <p class="ic-desc">The official logger.</p>
  </a>
</div>

## Testing

<div class="card-grid">
  <a class="info-card" href="/docs/testing/overview">
    <span class="ic-kicker">Start here</span>
    <div class="ic-title">Testing Overview</div>
    <p class="ic-desc">Which tool to use at which level.</p>
  </a>
  <a class="info-card" href="/docs/testing/mock-component">
    <span class="ic-kicker">Unit</span>
    <div class="ic-title">mockComponent</div>
    <p class="ic-desc">One class, every dependency mocked automatically.</p>
  </a>
  <a class="info-card" href="/docs/testing/web-test">
    <span class="ic-kicker">Web layer</span>
    <div class="ic-title">createWebTest</div>
    <p class="ic-desc">Real controllers and validation, mocked services.</p>
  </a>
  <a class="info-card" href="/docs/testing/test-app">
    <span class="ic-kicker">Full app</span>
    <div class="ic-title">createTestApp</div>
    <p class="ic-desc">The whole container behind a real HTTP server.</p>
  </a>
</div>

## AI

Teach your coding agent Asena. The skill works with Claude Code, Cursor, Copilot, Windsurf and
any other tool that supports Agent Skills:

```bash
npx skills add asenajs/skills
```

Every docs page also has buttons to copy it as Markdown or open it in Claude or ChatGPT, and the
whole site is published for language models:

<div class="card-grid">
  <a class="info-card" href="/llms.txt">
    <span class="ic-kicker">Index</span>
    <div class="ic-title">llms.txt</div>
    <p class="ic-desc">Every page with a one-line description and a link to its Markdown.</p>
  </a>
  <a class="info-card" href="/llms-full.txt">
    <span class="ic-kicker">Full text</span>
    <div class="ic-title">llms-full.txt</div>
    <p class="ic-desc">The complete documentation in a single file.</p>
  </a>
</div>
