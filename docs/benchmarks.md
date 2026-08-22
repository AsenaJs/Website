---
title: Benchmarks
description: How Asena performs against Elysia, Hono, Fastify, Express and NestJS across eight scenarios and two runtimes, on identical, byte-verified workloads.
outline: deep
llms: false
---

# Benchmarks

Eight frameworks, two runtimes, eleven scenarios, one frozen contract. Every application
returns **byte-for-byte identical responses** to byte-for-byte identical requests — verified
mechanically before a single measurement was taken. Without that, a benchmark compares
implementations, not frameworks.

::: info Read the charts honestly: for a minimal app, Elysia and Hono win
Elysia and Hono are minimal routers, and on a minimal application they are the faster
choice. The top of almost every chart on this page belongs to them, and nothing here
disputes it — if your service is a handful of routes and you want the last few thousand
requests per second, reach for one of those.

Asena is built for the application after that one: controllers, injected services,
middleware, validation, lifecycle hooks, a container that wires it together. That is the
shape NestJS gives you, and NestJS is the comparison this page is really about.
:::

<div class="bm-hero">
<div class="bm-hero-num">2.49<span>×</span></div>
<div class="bm-hero-txt">
<strong>Asena outruns NestJS out of the box</strong>
<span>Plaintext — 202,066 vs 80,988 req/s.</span>
</div>
</div>

<div class="bm-hero-badges">
<div class="bm-badge"><b>3.76×</b><span>Request validation</span></div>
<div class="bm-badge"><b>2.80×</b><span>Database · read by id</span></div>
<div class="bm-badge"><b>2.24×</b><span>Full API endpoint</span></div>
</div>

<div class="bm-badges-note">Asena · Ergenecore vs NestJS · Express · Node.</div>

## Asena vs NestJS

NestJS is the framework Asena is most often compared to: both are decorator-driven, both
put an IoC container at the centre, both ask you to write controllers and inject services.
The difference is what runs underneath.

<div class="bm-vs-grid">
<div class="bm-vs-card">
<div class="bm-vs-scenario">Plaintext</div>
<div class="bm-vs-big">2.49<span>×</span></div>
<div class="bm-vs-sub">faster than <strong>NestJS + Express</strong> on Node <span class="bm-paren">(1.54× on Bun)</span></div>
<div class="bm-vs-alt"><b>1.74×</b> against <strong>NestJS + Fastify</strong> on Node <span class="bm-paren">(1.47× on Bun)</span></div>
<div class="bm-vs-detail">
<div class="is-me"><b>202,066</b><span>Asena · Ergenecore · Bun</span></div>
<div><b>80,988</b><span>NestJS · Express · Node</span></div>
<div><b>131,281</b><span>NestJS · Express · Bun</span></div>
<div><b>116,307</b><span>NestJS · Fastify · Node</span></div>
<div><b>137,580</b><span>NestJS · Fastify · Bun</span></div>
</div>
</div>
<div class="bm-vs-card">
<div class="bm-vs-scenario">Request validation</div>
<div class="bm-vs-big">3.76<span>×</span></div>
<div class="bm-vs-sub">faster than <strong>NestJS + Express</strong> on Node <span class="bm-paren">(3.10× on Bun)</span></div>
<div class="bm-vs-alt"><b>2.95×</b> against <strong>NestJS + Fastify</strong> on Node <span class="bm-paren">(2.75× on Bun)</span></div>
<div class="bm-vs-detail">
<div class="is-me"><b>134,793</b><span>Asena · Ergenecore · Bun</span></div>
<div><b>35,873</b><span>NestJS · Express · Node</span></div>
<div><b>43,497</b><span>NestJS · Express · Bun</span></div>
<div><b>45,636</b><span>NestJS · Fastify · Node</span></div>
<div><b>48,966</b><span>NestJS · Fastify · Bun</span></div>
</div>
</div>
<div class="bm-vs-card">
<div class="bm-vs-scenario">Database · read by id</div>
<div class="bm-vs-big">2.80<span>×</span></div>
<div class="bm-vs-sub">faster than <strong>NestJS + Express</strong> on Node <span class="bm-paren">(2.67× on Bun)</span></div>
<div class="bm-vs-alt"><b>2.36×</b> against <strong>NestJS + Fastify</strong> on Node <span class="bm-paren">(2.56× on Bun)</span></div>
<div class="bm-vs-detail">
<div class="is-me"><b>78,023</b><span>Asena · Ergenecore · Bun</span></div>
<div><b>27,883</b><span>NestJS · Express · Node</span></div>
<div><b>29,178</b><span>NestJS · Express · Bun</span></div>
<div><b>33,076</b><span>NestJS · Fastify · Node</span></div>
<div><b>30,536</b><span>NestJS · Fastify · Bun</span></div>
</div>
</div>
<div class="bm-vs-card">
<div class="bm-vs-scenario">Full API endpoint</div>
<div class="bm-vs-big">2.24<span>×</span></div>
<div class="bm-vs-sub">faster than <strong>NestJS + Express</strong> on Node <span class="bm-paren">(1.54× on Bun)</span></div>
<div class="bm-vs-alt"><b>1.60×</b> against <strong>NestJS + Fastify</strong> on Node <span class="bm-paren">(1.32× on Bun)</span></div>
<div class="bm-vs-detail">
<div class="is-me"><b>119,095</b><span>Asena · Ergenecore · Bun</span></div>
<div><b>53,236</b><span>NestJS · Express · Node</span></div>
<div><b>77,223</b><span>NestJS · Express · Bun</span></div>
<div><b>74,513</b><span>NestJS · Fastify · Node</span></div>
<div><b>90,256</b><span>NestJS · Fastify · Bun</span></div>
</div>
</div>
</div>

::: tip How to read the four numbers on each card
`nest new` gives you NestJS on Express, running on Node. Nothing is chosen, nothing is tuned,
and that is what the headline divides by — the configuration you actually get. The three
smaller figures are the escapes, applied one at a time: swap Express for Fastify, move Node
to Bun, or do both. None of them closes the gap, and every raw req/s behind them is printed
on the card so you can check the arithmetic.

The database read is the one place an escape backfires: TypeORM is *slower* on Bun than on
Node, so the Fastify line widens from 2.36× to 2.56× instead of narrowing.
:::

## Plaintext

A 13-byte <code>text/plain</code> response. Nothing but the HTTP layer and the router.

<div class="bm-chart">
<div class="bm-row is-first">
<div class="bm-label">Elysia<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:100.0%"><span class="bm-in">213,772 req/s</span></div>
      
</div>
</div>
<div class="bm-row">
<div class="bm-label">Hono<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:94.5%"></div>
<span class="bm-out">202,099</span>
</div>
</div>
<div class="bm-row is-asena">
<div class="bm-label">Asena <span class="bm-adapter">Ergenecore</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:94.5%"></div>
<span class="bm-out">202,066</span>
</div>
</div>
<div class="bm-row is-asena">
<div class="bm-label">Asena <span class="bm-adapter">Hono</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:88.9%"></div>
<span class="bm-out">190,030</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Fastify<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:70.7%"></div>
<span class="bm-out">151,163</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Fastify</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:64.4%"></div>
<span class="bm-out">137,580</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Express<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:63.3%"></div>
<span class="bm-out">135,311</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Express</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:61.4%"></div>
<span class="bm-out">131,281</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Fastify</span><span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:54.4%"></div>
<span class="bm-out">116,307</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Fastify<span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:43.1%"></div>
<span class="bm-out">92,134</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Express<span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:40.4%"></div>
<span class="bm-out">86,368</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Express</span><span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:37.9%"></div>
<span class="bm-out">80,988</span>
</div>
</div>
</div>

## JSON serialization

A small object built and serialized per request — no caching, no precomputed body.

<div class="bm-chart">
<div class="bm-row is-first">
<div class="bm-label">Elysia<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:100.0%"><span class="bm-in">199,070 req/s</span></div>
      
</div>
</div>
<div class="bm-row is-asena">
<div class="bm-label">Asena <span class="bm-adapter">Ergenecore</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:98.2%"></div>
<span class="bm-out">195,494</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Hono<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:92.9%"></div>
<span class="bm-out">184,982</span>
</div>
</div>
<div class="bm-row is-asena">
<div class="bm-label">Asena <span class="bm-adapter">Hono</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:89.8%"></div>
<span class="bm-out">178,857</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Fastify<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:79.2%"></div>
<span class="bm-out">157,664</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Express<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:68.6%"></div>
<span class="bm-out">136,565</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Fastify</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:68.4%"></div>
<span class="bm-out">136,081</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Express</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:59.9%"></div>
<span class="bm-out">119,195</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Fastify</span><span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:56.7%"></div>
<span class="bm-out">112,810</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Fastify<span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:47.4%"></div>
<span class="bm-out">94,322</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Express<span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:42.5%"></div>
<span class="bm-out">84,668</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Express</span><span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:41.4%"></div>
<span class="bm-out">82,459</span>
</div>
</div>
</div>

## Query string parsing

Four query parameters read, coerced to numbers, defaults applied, one arithmetic result.

<div class="bm-chart">
<div class="bm-row is-first">
<div class="bm-label">Elysia<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:100.0%"><span class="bm-in">184,765 req/s</span></div>
      
</div>
</div>
<div class="bm-row">
<div class="bm-label">Hono<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:97.0%"></div>
<span class="bm-out">179,141</span>
</div>
</div>
<div class="bm-row is-asena">
<div class="bm-label">Asena <span class="bm-adapter">Hono</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:88.8%"></div>
<span class="bm-out">164,108</span>
</div>
</div>
<div class="bm-row is-asena">
<div class="bm-label">Asena <span class="bm-adapter">Ergenecore</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:86.1%"></div>
<span class="bm-out">159,116</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Fastify<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:73.8%"></div>
<span class="bm-out">136,273</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Fastify</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:65.7%"></div>
<span class="bm-out">121,404</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Express<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:61.8%"></div>
<span class="bm-out">114,199</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Express</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:58.8%"></div>
<span class="bm-out">108,660</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Fastify</span><span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:58.0%"></div>
<span class="bm-out">107,252</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Fastify<span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:49.4%"></div>
<span class="bm-out">91,254</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Express</span><span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:40.7%"></div>
<span class="bm-out">75,189</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Express<span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:40.5%"></div>
<span class="bm-out">74,745</span>
</div>
</div>
</div>

## Path parameters

Two path parameters parsed from the route and summed.

<div class="bm-chart">
<div class="bm-row is-first">
<div class="bm-label">Elysia<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:100.0%"><span class="bm-in">196,930 req/s</span></div>
      
</div>
</div>
<div class="bm-row">
<div class="bm-label">Hono<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:93.3%"></div>
<span class="bm-out">183,800</span>
</div>
</div>
<div class="bm-row is-asena">
<div class="bm-label">Asena <span class="bm-adapter">Hono</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:92.6%"></div>
<span class="bm-out">182,279</span>
</div>
</div>
<div class="bm-row is-asena">
<div class="bm-label">Asena <span class="bm-adapter">Ergenecore</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:92.3%"></div>
<span class="bm-out">181,683</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Fastify<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:73.9%"></div>
<span class="bm-out">145,609</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Express<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:68.0%"></div>
<span class="bm-out">133,935</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Fastify</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:62.1%"></div>
<span class="bm-out">122,280</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Express</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:56.2%"></div>
<span class="bm-out">110,711</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Fastify</span><span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:53.9%"></div>
<span class="bm-out">106,239</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Fastify<span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:49.0%"></div>
<span class="bm-out">96,424</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Express<span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:42.1%"></div>
<span class="bm-out">83,006</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Express</span><span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:38.2%"></div>
<span class="bm-out">75,133</span>
</div>
</div>
</div>

## Full API endpoint

Path param + query + custom header + a nested JSON body parsed, reshaped and re-serialized. Integer cents only, so no float formatting can diverge.

<div class="bm-chart">
<div class="bm-row is-first">
<div class="bm-label">Elysia<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:100.0%"><span class="bm-in">144,270 req/s</span></div>
      
</div>
</div>
<div class="bm-row">
<div class="bm-label">Hono<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:96.3%"></div>
<span class="bm-out">138,948</span>
</div>
</div>
<div class="bm-row is-asena">
<div class="bm-label">Asena <span class="bm-adapter">Hono</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:87.5%"></div>
<span class="bm-out">126,251</span>
</div>
</div>
<div class="bm-row is-asena">
<div class="bm-label">Asena <span class="bm-adapter">Ergenecore</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:82.5%"></div>
<span class="bm-out">119,095</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Fastify<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:72.5%"></div>
<span class="bm-out">104,627</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Express<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:64.8%"></div>
<span class="bm-out">93,518</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Fastify</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:62.6%"></div>
<span class="bm-out">90,256</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Express</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:53.5%"></div>
<span class="bm-out">77,223</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Fastify</span><span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:51.6%"></div>
<span class="bm-out">74,513</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Fastify<span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:47.2%"></div>
<span class="bm-out">68,088</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Express<span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:39.9%"></div>
<span class="bm-out">57,595</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Express</span><span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:36.9%"></div>
<span class="bm-out">53,236</span>
</div>
</div>
</div>

## Request validation

Each framework runs its own validator: Zod for Asena and Hono, TypeBox for Elysia, ajv for Fastify, class-validator for NestJS.

<div class="bm-chart">
<div class="bm-row is-first">
<div class="bm-label">Elysia<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:100.0%"><span class="bm-in">146,624 req/s</span></div>
      
</div>
</div>
<div class="bm-row is-asena">
<div class="bm-label">Asena <span class="bm-adapter">Ergenecore</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:91.9%"></div>
<span class="bm-out">134,793</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Hono<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:91.6%"></div>
<span class="bm-out">134,307</span>
</div>
</div>
<div class="bm-row is-asena">
<div class="bm-label">Asena <span class="bm-adapter">Hono</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:86.8%"></div>
<span class="bm-out">127,340</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Fastify<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:80.8%"></div>
<span class="bm-out">118,503</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Express<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:64.1%"></div>
<span class="bm-out">93,958</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Fastify<span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:51.4%"></div>
<span class="bm-out">75,359</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Express<span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:40.2%"></div>
<span class="bm-out">58,974</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Fastify</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:33.4%"></div>
<span class="bm-out">48,966</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Fastify</span><span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:31.1%"></div>
<span class="bm-out">45,636</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Express</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:29.7%"></div>
<span class="bm-out">43,497</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Express</span><span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:24.5%"></div>
<span class="bm-out">35,873</span>
</div>
</div>
</div>

## Database · read by id

One indexed <code>SELECT</code> against a 10,000-row table, connection pool of 20.

<div class="bm-chart">
<div class="bm-row is-first">
<div class="bm-label">Elysia<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:100.0%"><span class="bm-in">79,025 req/s</span></div>
      
</div>
</div>
<div class="bm-row is-asena">
<div class="bm-label">Asena <span class="bm-adapter">Ergenecore</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:98.7%"></div>
<span class="bm-out">78,023</span>
</div>
</div>
<div class="bm-row is-asena">
<div class="bm-label">Asena <span class="bm-adapter">Hono</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:97.2%"></div>
<span class="bm-out">76,780</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Hono<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:96.5%"></div>
<span class="bm-out">76,298</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Fastify<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:81.0%"></div>
<span class="bm-out">64,006</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Express<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:72.6%"></div>
<span class="bm-out">57,366</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Fastify<span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:60.2%"></div>
<span class="bm-out">47,572</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Express<span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:53.5%"></div>
<span class="bm-out">42,261</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Fastify</span><span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:41.9%"></div>
<span class="bm-out">33,076</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Fastify</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:38.6%"></div>
<span class="bm-out">30,536</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Express</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:36.9%"></div>
<span class="bm-out">29,178</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Express</span><span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:35.3%"></div>
<span class="bm-out">27,883</span>
</div>
</div>
</div>

## Static file · 4 KB

Each stack serves the file the way its own documentation tells you to.

<div class="bm-chart">
<div class="bm-row is-first">
<div class="bm-label">Elysia<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:100.0%"><span class="bm-in">139,629 req/s</span></div>
      
</div>
</div>
<div class="bm-row is-asena">
<div class="bm-label">Asena <span class="bm-adapter">Ergenecore</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:73.1%"></div>
<span class="bm-out">102,046</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Express<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:46.4%"></div>
<span class="bm-out">64,727</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Express</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:46.1%"></div>
<span class="bm-out">64,387</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Fastify</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:43.6%"></div>
<span class="bm-out">60,862</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Fastify<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:43.5%"></div>
<span class="bm-out">60,686</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Fastify</span><span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:36.3%"></div>
<span class="bm-out">50,646</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Express</span><span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:34.4%"></div>
<span class="bm-out">48,079</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Express<span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:33.9%"></div>
<span class="bm-out">47,319</span>
</div>
</div>
<div class="bm-row is-asena">
<div class="bm-label">Asena <span class="bm-adapter">Hono</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:30.6%"></div>
<span class="bm-out">42,671</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Hono<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:29.8%"></div>
<span class="bm-out">41,629</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Fastify<span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:28.1%"></div>
<span class="bm-out">39,285</span>
</div>
</div>
</div>


::: warning What the static numbers actually measure
The static scenario measures each stack's **official static middleware**, not the framework.
A controlled A/B inside each framework — its own middleware versus a hand-written handler on
the same server — makes that plain:

| Framework | Official middleware | Hand-written handler |
|---|--:|--:|
| Hono | 45,128 | **141,120** |
| Elysia | **147,745** | 116,895 |

Hono is not slow at serving files; `serveStatic` from `hono/bun` costs it 68%, because it
runs two filesystem round-trips per request — a `node:fs/promises` `stat()` purely to test
whether the path is a directory, then `Bun.file().exists()`. This is also why Asena's two
adapters diverge here: Ergenecore implements static serving itself, while the Hono adapter
delegates to that middleware.
:::

## Node vs Bun

The four Node-based frameworks were measured twice, running the **same compiled
`dist/main.js`** on both runtimes. Only the runtime changes. This is the free speed-up a
NestJS application can claim without rewriting a line — and the reason every card above
prints its Bun variant alongside the Node one.

<div class="bm-runtime-grid">
<div class="bm-runtime-card">
<div class="bm-rc-name">Express</div>
<div class="bm-rc-gain">+57%</div>
<div class="bm-rc-rows"><span>Node 86,368</span><span>Bun 135,311</span></div>
</div>
<div class="bm-runtime-card">
<div class="bm-rc-name">Fastify</div>
<div class="bm-rc-gain">+64%</div>
<div class="bm-rc-rows"><span>Node 92,134</span><span>Bun 151,163</span></div>
</div>
<div class="bm-runtime-card">
<div class="bm-rc-name">NestJS <span class="bm-adapter">Express</span></div>
<div class="bm-rc-gain">+62%</div>
<div class="bm-rc-rows"><span>Node 80,988</span><span>Bun 131,281</span></div>
</div>
<div class="bm-runtime-card">
<div class="bm-rc-name">NestJS <span class="bm-adapter">Fastify</span></div>
<div class="bm-rc-gain">+18%</div>
<div class="bm-rc-rows"><span>Node 116,307</span><span>Bun 137,580</span></div>
</div>
</div>

## Asena's two adapters

Identical application code — the same controllers, services, validators and repositories.
Only the adapter import changes.

| Scenario | Ergenecore | Hono adapter |
|:---|--:|--:|
| Plaintext | 202,066 | 190,030 |
| JSON serialization | 195,494 | 178,857 |
| Full API endpoint | 119,095 | 126,251 |
| Request validation | 134,793 | 127,340 |
| Database · read by id | 78,023 | 76,780 |
| Static file · 4 KB | 102,046 | 42,671 |

Ergenecore leads on raw throughput and static files; the Hono adapter edges ahead on the
body-heavy API endpoint. Pick Ergenecore for speed, the Hono adapter when you want Hono's
middleware ecosystem.

## What an ORM costs

Asena exposes the same three database operations twice: once over raw `Bun.sql`, once over
`@asenajs/asena-drizzle`. Same queries, same response bytes, same driver — the only
difference is the query builder.

| Operation | Raw `Bun.sql` | Drizzle | Cost |
|:---|--:|--:|--:|
| read by id | 78,023 | 39,462 | −49% |
| paged list | 48,063 | 30,510 | −37% |
| insert | 73,099 | 42,393 | −42% |

## Full results

Every measured number, req/s.

| Framework | Runtime | Plaintext | JSON serialization | Query string parsing | Path parameters | Full API endpoint | Request validation | DB read by id | Static 4 KB |
|:---|:---|--:|--:|--:|--:|--:|--:|--:|--:|
| Elysia | Bun | 213,772 | 199,070 | 184,765 | 196,930 | 144,270 | 146,624 | 79,025 | 139,629 |
| Hono | Bun | 202,099 | 184,982 | 179,141 | 183,800 | 138,948 | 134,307 | 76,298 | 41,629 |
| Asena  Ergenecore | Bun | 202,066 | 195,494 | 159,116 | 181,683 | 119,095 | 134,793 | 78,023 | 102,046 |
| Asena  Hono | Bun | 190,030 | 178,857 | 164,108 | 182,279 | 126,251 | 127,340 | 76,780 | 42,671 |
| Fastify | Bun | 151,163 | 157,664 | 136,273 | 145,609 | 104,627 | 118,503 | 64,006 | 60,686 |
| Express | Bun | 135,311 | 136,565 | 114,199 | 133,935 | 93,518 | 93,958 | 57,366 | 64,727 |
| NestJS  Fastify | Bun | 137,580 | 136,081 | 121,404 | 122,280 | 90,256 | 48,966 | 30,536 | 60,862 |
| NestJS  Express | Bun | 131,281 | 119,195 | 108,660 | 110,711 | 77,223 | 43,497 | 29,178 | 64,387 |
| Fastify | Node | 92,134 | 94,322 | 91,254 | 96,424 | 68,088 | 75,359 | 47,572 | 39,285 |
| Express | Node | 86,368 | 84,668 | 74,745 | 83,006 | 57,595 | 58,974 | 42,261 | 47,319 |
| NestJS  Fastify | Node | 116,307 | 112,810 | 107,252 | 106,239 | 74,513 | 45,636 | 33,076 | 50,646 |
| NestJS  Express | Node | 80,988 | 82,459 | 75,189 | 75,133 | 53,236 | 35,873 | 27,883 | 48,079 |

## Methodology

| | |
|---|---|
| Hardware | AMD Ryzen 9 9950X3D · 16C/32T · 60 GB RAM |
| Runtimes | Bun 1.4.0 · Node 26.7.0 |
| Load generator | `wrk`, 12 threads, 400 connections, 60s |
| Repetitions | 2 per scenario, fresh server process each, spread reported |
| Warmup | 15s discarded before every measurement |
| Isolation | server pinned to cores 0-7, `wrk` to 16-31, single process, no clustering |
| Database | PostgreSQL, pool size 20, 10,000 seeded rows, `synchronous_commit = off` |
| Logging | disabled in every application; no compression, no CORS, no ETag hashing |

**Byte-level conformance is the gate.** Before any target is measured it must return the
exact expected bytes for all eleven contract requests plus the negative cases. A target that
fails is skipped, not measured.

**Validation runs on one route only.** Adding a schema elsewhere would make some apps measure
"parse + validate" and others "parse" while still returning identical bytes. Three
applications had done exactly that and were corrected before this run.

### Where these numbers are soft

- **The database layer is not uniform.** Each stack uses its idiomatic choice —
  `pg` for Express and Fastify, `Bun.sql` for Elysia, Hono and Asena, TypeORM for NestJS.
  The clean framework-to-framework database signal is the set of rows sharing one layer.
- **Prepared statements differ by driver.** `Bun.sql` prepares and caches per connection;
  `pg` and TypeORM issue unnamed statements and re-parse on every call. This favours the
  four `Bun.sql` applications on the database reads.
- **The 256 KB static scenario is noisy** — up to 18% spread between repetitions, because it
  moves 3-5 GB/s and is dominated by page cache and scheduler behaviour rather than framework
  code. Treat it as an order of magnitude, not a ranking.
- **The load generator shares the machine** with the server. Core pinning limits the
  interference but does not remove it.

The full contract, the harness and every raw result are reproducible from a single command.
