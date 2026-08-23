---
layout: home
title: Asena
---

<div class="lp">

<section class="lp-hero lp-bleed">

<img class="lp-hero-logo" src="/asena-logo.svg" alt="Asena" />

<h1 class="lp-hero-title">Asena</h1>

<p class="lp-hero-text">The IoC web framework for Bun</p>

<p class="lp-hero-tagline">Spring-style component discovery and field injection, in TypeScript — running at native Bun speed. Controllers, services, validation, OpenAPI, tracing and microservices all come out of one container.</p>

<CopyCmd cmd="bun install -g @asenajs/asena-cli && asena create my-app" />

<div class="lp-hero-actions">
<a class="lp-btn-brand" href="/docs/get-started">Get Started</a>
<a class="lp-btn-alt" href="https://github.com/AsenaJs/Asena" target="_blank" rel="noopener">View on GitHub</a>
</div>

<a class="lp-hero-hint" href="#dx" aria-label="Scroll down">
<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
</a>

</section>

<section class="lp-section" id="dx">

<div class="lp-wrap">

<div class="lp-cols" data-reveal>

<div class="lp-cols-text">
<span class="lp-eyebrow">Design for humans</span>
<h2 class="lp-h2">Declare the component. Ask for the dependency.</h2>
<p class="lp-lead">No modules to wire, no providers array to keep in sync, no factory boilerplate. Decorate a class and Asena's container finds it at boot, builds it once, and hands it to whoever declared it.</p>
<ul class="lp-bullets">
<li><b>IoC container</b> — components are discovered by scanning, never registered by hand.</li>
<li><b>Field injection</b> — <code>@Inject</code> sits on the field; constructors stay yours.</li>
<li><b>Pluggable adapters</b> — Ergenecore or Hono behind the same business code.</li>
<li><b>Type-safe validation</b> — Zod schemas at route, controller or global level.</li>
</ul>
<a class="lp-more" href="/docs/concepts/dependency-injection">How injection works →</a>
</div>

<div class="lp-code">

::: code-group

```typescript [Ergenecore]
import { Controller, Service } from '@asenajs/asena/decorators';
import { Inject } from '@asenajs/asena/decorators/ioc';
import { Get } from '@asenajs/asena/decorators/http';
import type { Context } from '@asenajs/ergenecore';

@Service()
export class UserService {
  findAll() {
    return [{ id: 1, name: 'Ada' }];
  }
}

@Controller('/users')
export class UserController {
  @Inject(UserService)
  private userService: UserService;

  @Get('/')
  async list(context: Context) {
    return context.send({ users: this.userService.findAll() });
  }
}
```

```typescript [Hono]
import { Controller, Service } from '@asenajs/asena/decorators';
import { Inject } from '@asenajs/asena/decorators/ioc';
import { Get } from '@asenajs/asena/decorators/http';
import type { Context } from '@asenajs/hono-adapter';

@Service()
export class UserService {
  findAll() {
    return [{ id: 1, name: 'Ada' }];
  }
}

@Controller('/users')
export class UserController {
  @Inject(UserService)
  private userService: UserService;

  @Get('/')
  async list(context: Context) {
    return context.send({ users: this.userService.findAll() });
  }
}
```

:::

</div>

</div>

</div>

</section>

<section class="lp-bench lp-bleed lp-section">

<div class="lp-wrap">

<div class="lp-bench-grid" data-reveal>

<div class="lp-cols-text">
<span class="lp-eyebrow">Benchmarks</span>
<div class="lp-bench-num">2.49<span>×</span></div>
<h2 class="lp-h2">Faster than NestJS, with nothing tuned</h2>
<p class="lp-lead">Byte-for-byte identical workloads on the same machine, measured with wrk. Asena on Ergenecore over Bun against NestJS on Express over Node.</p>
<a class="lp-more" href="/docs/benchmarks">Full methodology →</a>
</div>

<div class="lp-bars">

<div class="lp-bar-row">
<div class="lp-bar-head"><b>Plaintext</b><span>2.49× faster</span></div>
<div class="lp-bar"><div class="lp-bar-track"><span class="lp-bar-fill is-asena" style="width:100%"></span></div><span class="lp-bar-val"><b>202,066</b> Asena</span></div>
<div class="lp-bar"><div class="lp-bar-track"><span class="lp-bar-fill is-rival" style="width:40.1%"></span></div><span class="lp-bar-val"><b>80,988</b> NestJS</span></div>
</div>

<div class="lp-bar-row">
<div class="lp-bar-head"><b>Request validation</b><span>3.76× faster</span></div>
<div class="lp-bar"><div class="lp-bar-track"><span class="lp-bar-fill is-asena" style="width:66.7%"></span></div><span class="lp-bar-val"><b>134,793</b> Asena</span></div>
<div class="lp-bar"><div class="lp-bar-track"><span class="lp-bar-fill is-rival" style="width:17.8%"></span></div><span class="lp-bar-val"><b>35,873</b> NestJS</span></div>
</div>

<div class="lp-bar-row">
<div class="lp-bar-head"><b>Database · read by id</b><span>2.80× faster</span></div>
<div class="lp-bar"><div class="lp-bar-track"><span class="lp-bar-fill is-asena" style="width:38.6%"></span></div><span class="lp-bar-val"><b>78,023</b> Asena</span></div>
<div class="lp-bar"><div class="lp-bar-track"><span class="lp-bar-fill is-rival" style="width:13.8%"></span></div><span class="lp-bar-val"><b>27,883</b> NestJS</span></div>
</div>

<div class="lp-bar-row">
<div class="lp-bar-head"><b>Full API endpoint</b><span>2.24× faster</span></div>
<div class="lp-bar"><div class="lp-bar-track"><span class="lp-bar-fill is-asena" style="width:58.9%"></span></div><span class="lp-bar-val"><b>119,095</b> Asena</span></div>
<div class="lp-bar"><div class="lp-bar-track"><span class="lp-bar-fill is-rival" style="width:26.3%"></span></div><span class="lp-bar-val"><b>53,236</b> NestJS</span></div>
</div>

</div>

</div>

<p class="lp-bench-foot">Requests per second, higher is better. Numbers for NestJS on Fastify, NestJS on Bun and every other scenario are published alongside the harness.</p>

</div>

</section>

<section class="lp-section">

<div class="lp-wrap">

<div class="lp-rail">

<div class="lp-feat" data-reveal>
<div class="lp-cols">

<div class="lp-cols-text">
<span class="lp-eyebrow">OpenAPI</span>
<h2 class="lp-h2">A spec you never write</h2>
<p class="lp-lead">Extend one class and Asena walks the container at boot — every controller, route, Zod schema and status code lands in an OpenAPI 3.1 document. Swagger UI is served from the same config.</p>
<div class="lp-pills"><a class="lp-pill" href="/docs/packages/openapi">asena-openapi</a><span class="lp-pill">OpenAPI 3.1</span><span class="lp-pill">Swagger UI</span></div>
</div>

<div class="lp-code">

```typescript
@OpenApi({
  info: { title: 'My API', version: '1.0.0' },
  path: '/api/openapi',
  ui: true, // Swagger UI at /api/openapi/ui
})
export class AppOpenApi extends OpenApiPostProcessor {}
```

</div>

</div>
</div>

<div class="lp-feat" data-reveal>
<div class="lp-cols">

<div class="lp-cols-text">
<span class="lp-eyebrow">OpenTelemetry</span>
<h2 class="lp-h2">Every request, already traced</h2>
<p class="lp-lead">One decorated class boots the SDK. From there each request produces a full waterfall — server span, controller span, service span — with W3C context propagated in and out, plus request counters and duration histograms per route.</p>
<div class="lp-pills"><a class="lp-pill" href="/docs/packages/opentelemetry">asena-otel</a><span class="lp-pill">OTLP</span><span class="lp-pill">Auto-trace</span></div>
</div>

<div class="lp-stack">

<div class="lp-trace">
<div class="lp-trace-row"><span class="lp-trace-name">GET /api/users</span><span class="lp-trace-kind">SERVER</span><span class="lp-trace-track"><span class="lp-trace-span" style="--s:0%;--w:100%"></span></span><span class="lp-trace-ms">18.4ms</span></div>
<div class="lp-trace-row is-d1"><span class="lp-trace-name">UserController.list</span><span class="lp-trace-kind">INTERNAL</span><span class="lp-trace-track"><span class="lp-trace-span" style="--s:9%;--w:84%"></span></span><span class="lp-trace-ms">15.5ms</span></div>
<div class="lp-trace-row is-d2"><span class="lp-trace-name">UserService.getAll</span><span class="lp-trace-kind">INTERNAL</span><span class="lp-trace-track"><span class="lp-trace-span" style="--s:19%;--w:66%"></span></span><span class="lp-trace-ms">12.1ms</span></div>
</div>

<div class="lp-code">

```typescript
@Otel({
  serviceName: 'my-app',
  traceExporter: new OTLPTraceExporter({
    url: 'http://localhost:4318/v1/traces',
  }),
  autoTrace: { services: true, controllers: true },
})
export class AppOtel extends OtelTracingPostProcessor {}
```

</div>

</div>

</div>
</div>

<div class="lp-feat" data-reveal>
<div class="lp-cols">

<div class="lp-cols-text">
<span class="lp-eyebrow">Microservices</span>
<h2 class="lp-h2">Same decorators, different transport</h2>
<p class="lp-lead">Swap HTTP for a broker without changing how you write code. Request/response and fire-and-forget events sit on the same controller, with retry, DLQ, graceful drain and trace propagation handled by the transport.</p>
<div class="lp-pills"><a class="lp-pill" href="/docs/packages/redis">Redis Streams</a><a class="lp-pill" href="/docs/packages/kafka">Kafka</a><span class="lp-pill">Headless mode</span></div>
<a class="lp-more" href="/docs/concepts/microservices">Read the messaging guide →</a>
</div>

<div class="lp-code">

```typescript
@MessageController('order') // prefixes every handler below
export class OrderHandler {
  @Inject(OrderService)
  private orderService: OrderService;

  @MessagePattern('create') // handles 'order.create'
  async create(data: CreateOrderDto) {
    return this.orderService.create(data);
  }

  @EventPattern('created') // handles 'order.created'
  async onCreated(event: OrderEvent) {
    await this.orderService.index(event);
  }
}
```

</div>

</div>
</div>

<div class="lp-feat" data-reveal>
<div class="lp-cols">

<div class="lp-cols-text">
<span class="lp-eyebrow">PostProcessor</span>
<h2 class="lp-h2">The extension point the framework uses on itself</h2>
<p class="lp-lead">Spring's BeanPostProcessor, in TypeScript. Every component passes through your hook on its way out of the container, so cross-cutting concerns land in one place instead of every class. OpenAPI and OpenTelemetry are built on this exact API — nothing is reserved for the framework.</p>
<a class="lp-more" href="/docs/concepts/post-processor">See what you can hook →</a>
</div>

<div class="lp-code">

```typescript
@PostProcessor()
export class TimingPostProcessor
  implements ComponentPostProcessor
{

  postProcess<T>(instance: T, Class: any): T {
    return withTimers(instance, Class.name);
  }

}
```

</div>

</div>
</div>

<div class="lp-feat" data-reveal>
<div class="lp-cols">

<div class="lp-cols-text">
<span class="lp-eyebrow">Testing</span>
<h2 class="lp-h2">Boot the web layer, mock the rest</h2>
<p class="lp-lead">The equivalent of Spring's @WebMvcTest. Controllers, middlewares and validators run for real; every other dependency is auto-mocked into a stub shaped like the real class. No database, no Redis, no HTTP client — just the routing and validation you meant to test.</p>
<div class="lp-pills"><a class="lp-pill" href="/docs/testing/web-test">createWebTest</a><span class="lp-pill">createTestApp</span><span class="lp-pill">mockComponent</span></div>
</div>

<div class="lp-code">

```typescript
import { createWebTest, silentLogger } from '@asenajs/asena/test';
import { createErgenecoreAdapter } from '@asenajs/ergenecore';

test('returns a user', async () => {
  const adapter = createErgenecoreAdapter({ logger: silentLogger });

  const { app, mocks } = await createWebTest({
    adapter,
    controllers: [UserController],
  });

  mocks.UserService.findById.mockResolvedValue({ id: '1' });

  await app
    .get('/users/1')
    .expectStatus(200)
    .expectJson({ id: '1' });

  await app.stop();
});
```

</div>

</div>
</div>

</div>

</div>

</section>

<section class="lp-section lp-section-tight" data-reveal>

<div class="showcase-section">
  <h2 class="showcase-title">Built with Asena</h2>
  <div class="showcase-grid">
    <a href="https://scrumpoker.me/" target="_blank" rel="noopener" class="showcase-card"><svg class="card-logo" width="180" height="42" viewBox="0 0 170 40" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="spg" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#3B82F6"></stop><stop offset="100%" stop-color="#4F46E5"></stop></linearGradient><linearGradient id="sp1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#3B82F6"></stop><stop offset="100%" stop-color="#4F46E5"></stop></linearGradient><linearGradient id="sp2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#60A5FA"></stop><stop offset="100%" stop-color="#6366F1"></stop></linearGradient></defs><circle cx="20" cy="20" r="20" fill="#EFF6FF"></circle><rect x="24" y="12" width="8" height="20" rx="2" fill="#E0E7FF" stroke="#6366F1" stroke-width="1.5" transform="rotate(15, 28, 22)"></rect><rect x="16" y="10" width="8" height="20" rx="2" fill="url(#sp2)" stroke-width="1.5" transform="rotate(0, 20, 20)"></rect><rect x="8" y="12" width="8" height="20" rx="2" fill="url(#sp1)" stroke-width="1.5" transform="rotate(-15, 12, 22)"></rect><text x="48" y="28" style="font-family:system-ui,-apple-system,sans-serif;font-weight:600;font-size:18px" fill="currentColor">Scrum</text><text x="103" y="28" style="font-family:system-ui,-apple-system,sans-serif;font-weight:600;font-size:18px" fill="url(#spg)">Poker</text></svg><p class="card-desc">Real-time planning poker for agile teams</p><div class="card-tags"><span class="ctag">REST API</span><span class="ctag">WebSocket</span><span class="ctag">Production</span></div></a><a href="https://checkcryptoaddress.com/" target="_blank" rel="noopener" class="showcase-card"><div class="crypto-brand"><svg width="40" height="40" viewBox="0 0 375 375" xmlns="http://www.w3.org/2000/svg"><path fill="#4dabf7" d="M346.895 91.305 191.62 1.754l-.023-.012a7.915 7.915 0 0 0-7.844.012L28.488 91.304a7.867 7.867 0 0 0-3.941 6.81v179.1a7.87 7.87 0 0 0 3.933 6.806l155.305 89.57a7.912 7.912 0 0 0 3.903 1.035 7.93 7.93 0 0 0 3.933-1.055l155.266-89.547a7.88 7.88 0 0 0 3.941-6.808V98.113a7.88 7.88 0 0 0-3.933-6.808Zm-11.801 110.382v70.989L187.688 357.69l-55.856-32.214Zm-286.95 75.524 286.95-165.457v71.527L116.309 316.523ZM187.657 110.77l-78.039-48.106 78.07-45.027 78.04 45.008Zm-.203 67.968L48.074 98.152 94.137 71.59l89.379 55.097c2.5 1.543 5.843 1.52 8.273.004l89.418-55.12 46.047 26.558ZM40.281 168.477v-56.668l131.446 75.996-48.926 28.21Zm66.781 56.617-66.78 38.504V186.62Zm0 0"></path></svg><span class="ctext">Check</span><span class="ctext-grad">Crypto</span></div><p class="card-desc">Crypto adress validation</p><div class="card-tags"><span class="ctag">REST API</span><span class="ctag">Migration</span><span class="ctag">Websocket</span></div></a>
  </div>
  <a href="/docs/showcase" class="view-all">View All Projects →</a>
</div>

</section>

<section class="lp-cta lp-bleed">

<div class="lp-cta-inner">
<h2 class="lp-h2">Start in one command</h2>
<p class="lp-lead">The CLI scaffolds the project, the adapter, the logger and the lint setup. You write the first controller.</p>

<CopyCmd cmd="bun install -g @asenajs/asena-cli && asena create my-app" />

<div class="lp-hero-actions">
<a class="lp-btn-brand" href="/docs/get-started">Get Started</a>
<a class="lp-btn-alt" href="/docs/examples">Browse Examples</a>
</div>
</div>

</section>

</div>
