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
<div class="bm-hero-num">2.65<span>×</span></div>
<div class="bm-hero-txt">
<strong>Asena outruns NestJS out of the box</strong>
<span>Plaintext — 151,923 vs 57,408 req/s.</span>
</div>
</div>

<div class="bm-hero-badges">
<div class="bm-badge"><b>4.23×</b><span>Request validation</span></div>
<div class="bm-badge"><b>4.20×</b><span>Database · read by id</span></div>
<div class="bm-badge"><b>2.70×</b><span>Full API endpoint</span></div>
</div>

<div class="bm-badges-note">Asena · Ergenecore vs NestJS · Express · Node.</div>

## Asena vs NestJS

NestJS is the framework Asena is most often compared to: both are decorator-driven, both
put an IoC container at the centre, both ask you to write controllers and inject services.
The difference is what runs underneath.

<div class="bm-vs-grid">
<div class="bm-vs-card">
<div class="bm-vs-scenario">Plaintext</div>
<div class="bm-vs-big">2.65<span>×</span></div>
<div class="bm-vs-sub">faster than <strong>NestJS + Express</strong> on Node <span class="bm-paren">(2.31× on Bun)</span></div>
<div class="bm-vs-alt"><b>1.63×</b> against <strong>NestJS + Fastify</strong> on Node <span class="bm-paren">(1.67× on Bun)</span></div>
<div class="bm-vs-detail">
<div class="is-me"><b>151,923</b><span>Asena · Ergenecore · Bun</span></div>
<div><b>57,408</b><span>NestJS · Express · Node</span></div>
<div><b>65,750</b><span>NestJS · Express · Bun</span></div>
<div><b>93,241</b><span>NestJS · Fastify · Node</span></div>
<div><b>91,003</b><span>NestJS · Fastify · Bun</span></div>
</div>
</div>
<div class="bm-vs-card">
<div class="bm-vs-scenario">Request validation</div>
<div class="bm-vs-big">4.23<span>×</span></div>
<div class="bm-vs-sub">faster than <strong>NestJS + Express</strong> on Node <span class="bm-paren">(3.35× on Bun)</span></div>
<div class="bm-vs-alt"><b>3.39×</b> against <strong>NestJS + Fastify</strong> on Node <span class="bm-paren">(2.51× on Bun)</span></div>
<div class="bm-vs-detail">
<div class="is-me"><b>82,584</b><span>Asena · Ergenecore · Bun</span></div>
<div><b>19,546</b><span>NestJS · Express · Node</span></div>
<div><b>24,630</b><span>NestJS · Express · Bun</span></div>
<div><b>24,368</b><span>NestJS · Fastify · Node</span></div>
<div><b>32,943</b><span>NestJS · Fastify · Bun</span></div>
</div>
</div>
<div class="bm-vs-card">
<div class="bm-vs-scenario">Database · read by id</div>
<div class="bm-vs-big">4.20<span>×</span></div>
<div class="bm-vs-sub">faster than <strong>NestJS + Express</strong> on Node <span class="bm-paren">(4.29× on Bun)</span></div>
<div class="bm-vs-alt"><b>3.74×</b> against <strong>NestJS + Fastify</strong> on Node <span class="bm-paren">(4.04× on Bun)</span></div>
<div class="bm-vs-detail">
<div class="is-me"><b>64,995</b><span>Asena · Ergenecore · Bun</span></div>
<div><b>15,461</b><span>NestJS · Express · Node</span></div>
<div><b>15,148</b><span>NestJS · Express · Bun</span></div>
<div><b>17,391</b><span>NestJS · Fastify · Node</span></div>
<div><b>16,075</b><span>NestJS · Fastify · Bun</span></div>
</div>
</div>
<div class="bm-vs-card">
<div class="bm-vs-scenario">Full API endpoint</div>
<div class="bm-vs-big">2.70<span>×</span></div>
<div class="bm-vs-sub">faster than <strong>NestJS + Express</strong> on Node <span class="bm-paren">(2.25× on Bun)</span></div>
<div class="bm-vs-alt"><b>1.70×</b> against <strong>NestJS + Fastify</strong> on Node <span class="bm-paren">(1.56× on Bun)</span></div>
<div class="bm-vs-detail">
<div class="is-me"><b>86,710</b><span>Asena · Ergenecore · Bun</span></div>
<div><b>32,119</b><span>NestJS · Express · Node</span></div>
<div><b>38,603</b><span>NestJS · Express · Bun</span></div>
<div><b>50,917</b><span>NestJS · Fastify · Node</span></div>
<div><b>55,690</b><span>NestJS · Fastify · Bun</span></div>
</div>
</div>
</div>

::: tip How to read the four numbers on each card
`nest new` gives you NestJS on Express, running on Node. Nothing is chosen, nothing is tuned,
and that is what the headline divides by — the configuration you actually get. The three
smaller figures are the escapes, applied one at a time: swap Express for Fastify, move Node
to Bun, or do both. None of them closes the gap, and every raw req/s behind them is printed
on the card so you can check the arithmetic.

Moving to Bun is not a free win everywhere: NestJS on Fastify serves plaintext slower on Bun
than on Node, and the TypeORM read is slower on Bun under both adapters, so on those cards the
Bun figure is the wider one.
:::

## Plaintext

A 13-byte <code>text/plain</code> response. Nothing but the HTTP layer and the router.

<div class="bm-chart">
<div class="bm-row is-first">
<div class="bm-label">Elysia<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:100.0%"><span class="bm-in">177,152 req/s</span></div>
      
</div>
</div>
<div class="bm-row">
<div class="bm-label">Hono<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:89.4%"></div>
<span class="bm-out">158,409</span>
</div>
</div>
<div class="bm-row is-asena">
<div class="bm-label">Asena <span class="bm-adapter">Ergenecore</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:85.8%"></div>
<span class="bm-out">151,923</span>
</div>
</div>
<div class="bm-row is-asena">
<div class="bm-label">Asena <span class="bm-adapter">Hono</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:80.1%"></div>
<span class="bm-out">141,822</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Fastify<span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:65.4%"></div>
<span class="bm-out">115,937</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Fastify<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:58.2%"></div>
<span class="bm-out">103,025</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Fastify</span><span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:52.6%"></div>
<span class="bm-out">93,241</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Fastify</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:51.4%"></div>
<span class="bm-out">91,003</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Express<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:47.8%"></div>
<span class="bm-out">84,690</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Express<span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:39.9%"></div>
<span class="bm-out">70,711</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Express</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:37.1%"></div>
<span class="bm-out">65,750</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Express</span><span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:32.4%"></div>
<span class="bm-out">57,408</span>
</div>
</div>
</div>

## JSON serialization

A small object built and serialized per request — no caching, no precomputed body.

<div class="bm-chart">
<div class="bm-row is-first is-asena">
<div class="bm-label">Asena <span class="bm-adapter">Ergenecore</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:100.0%"><span class="bm-in">148,415 req/s</span></div>
      
</div>
</div>
<div class="bm-row">
<div class="bm-label">Hono<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:98.6%"></div>
<span class="bm-out">146,282</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Elysia<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:97.2%"></div>
<span class="bm-out">144,192</span>
</div>
</div>
<div class="bm-row is-asena">
<div class="bm-label">Asena <span class="bm-adapter">Hono</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:89.4%"></div>
<span class="bm-out">132,708</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Fastify<span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:82.2%"></div>
<span class="bm-out">122,016</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Fastify<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:69.4%"></div>
<span class="bm-out">102,927</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Fastify</span><span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:61.3%"></div>
<span class="bm-out">90,926</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Fastify</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:59.2%"></div>
<span class="bm-out">87,893</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Express<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:56.1%"></div>
<span class="bm-out">83,315</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Express<span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:55.5%"></div>
<span class="bm-out">82,431</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Express</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:42.8%"></div>
<span class="bm-out">63,540</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Express</span><span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:39.0%"></div>
<span class="bm-out">57,824</span>
</div>
</div>
</div>

## Query string parsing

Four query parameters read, coerced to numbers, defaults applied, one arithmetic result.

<div class="bm-chart">
<div class="bm-row is-first">
<div class="bm-label">Elysia<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:100.0%"><span class="bm-in">151,357 req/s</span></div>
      
</div>
</div>
<div class="bm-row">
<div class="bm-label">Hono<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:80.0%"></div>
<span class="bm-out">121,134</span>
</div>
</div>
<div class="bm-row is-asena">
<div class="bm-label">Asena <span class="bm-adapter">Ergenecore</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:79.2%"></div>
<span class="bm-out">119,897</span>
</div>
</div>
<div class="bm-row is-asena">
<div class="bm-label">Asena <span class="bm-adapter">Hono</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:77.3%"></div>
<span class="bm-out">117,022</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Fastify<span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:71.4%"></div>
<span class="bm-out">108,068</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Fastify<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:63.2%"></div>
<span class="bm-out">95,608</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Fastify</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:51.8%"></div>
<span class="bm-out">78,404</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Fastify</span><span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:49.5%"></div>
<span class="bm-out">74,866</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Express<span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:47.0%"></div>
<span class="bm-out">71,201</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Express<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:44.6%"></div>
<span class="bm-out">67,581</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Express</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:36.8%"></div>
<span class="bm-out">55,656</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Express</span><span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:35.3%"></div>
<span class="bm-out">53,391</span>
</div>
</div>
</div>

## Path parameters

Two path parameters parsed from the route and summed.

<div class="bm-chart">
<div class="bm-row is-first">
<div class="bm-label">Elysia<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:100.0%"><span class="bm-in">155,440 req/s</span></div>
      
</div>
</div>
<div class="bm-row is-asena">
<div class="bm-label">Asena <span class="bm-adapter">Ergenecore</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:91.6%"></div>
<span class="bm-out">142,369</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Hono<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:85.3%"></div>
<span class="bm-out">132,600</span>
</div>
</div>
<div class="bm-row is-asena">
<div class="bm-label">Asena <span class="bm-adapter">Hono</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:84.9%"></div>
<span class="bm-out">131,908</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Fastify<span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:74.9%"></div>
<span class="bm-out">116,465</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Fastify<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:62.7%"></div>
<span class="bm-out">97,470</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Fastify</span><span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:54.8%"></div>
<span class="bm-out">85,138</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Fastify</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:53.1%"></div>
<span class="bm-out">82,533</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Express<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:51.1%"></div>
<span class="bm-out">79,356</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Express<span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:50.5%"></div>
<span class="bm-out">78,573</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Express</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:39.3%"></div>
<span class="bm-out">61,152</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Express</span><span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:36.9%"></div>
<span class="bm-out">57,400</span>
</div>
</div>
</div>

## Full API endpoint

Path param + query + custom header + a nested JSON body parsed, reshaped and re-serialized. Integer cents only, so no float formatting can diverge.

<div class="bm-chart">
<div class="bm-row is-first">
<div class="bm-label">Elysia<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:100.0%"><span class="bm-in">103,067 req/s</span></div>
      
</div>
</div>
<div class="bm-row">
<div class="bm-label">Hono<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:96.6%"></div>
<span class="bm-out">99,586</span>
</div>
</div>
<div class="bm-row is-asena">
<div class="bm-label">Asena <span class="bm-adapter">Hono</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:84.3%"></div>
<span class="bm-out">86,840</span>
</div>
</div>
<div class="bm-row is-asena">
<div class="bm-label">Asena <span class="bm-adapter">Ergenecore</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:84.1%"></div>
<span class="bm-out">86,710</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Fastify<span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:71.8%"></div>
<span class="bm-out">73,995</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Fastify<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:68.0%"></div>
<span class="bm-out">70,073</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Fastify</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:54.0%"></div>
<span class="bm-out">55,690</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Express<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:50.2%"></div>
<span class="bm-out">51,700</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Fastify</span><span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:49.4%"></div>
<span class="bm-out">50,917</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Express<span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:43.7%"></div>
<span class="bm-out">45,031</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Express</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:37.5%"></div>
<span class="bm-out">38,603</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Express</span><span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:31.2%"></div>
<span class="bm-out">32,119</span>
</div>
</div>
</div>

## Request validation

Each framework runs its own validator: Zod for Asena and Hono, TypeBox for Elysia, ajv for Fastify, class-validator for NestJS.

<div class="bm-chart">
<div class="bm-row is-first">
<div class="bm-label">Hono<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:100.0%"><span class="bm-in">92,033 req/s</span></div>
      
</div>
</div>
<div class="bm-row">
<div class="bm-label">Elysia<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:91.8%"></div>
<span class="bm-out">84,506</span>
</div>
</div>
<div class="bm-row is-asena">
<div class="bm-label">Asena <span class="bm-adapter">Ergenecore</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:89.7%"></div>
<span class="bm-out">82,584</span>
</div>
</div>
<div class="bm-row is-asena">
<div class="bm-label">Asena <span class="bm-adapter">Hono</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:87.2%"></div>
<span class="bm-out">80,265</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Fastify<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:84.4%"></div>
<span class="bm-out">77,682</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Fastify<span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:82.1%"></div>
<span class="bm-out">75,600</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Express<span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:54.1%"></div>
<span class="bm-out">49,778</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Express<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:51.1%"></div>
<span class="bm-out">47,030</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Fastify</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:35.8%"></div>
<span class="bm-out">32,943</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Express</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:26.8%"></div>
<span class="bm-out">24,630</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Fastify</span><span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:26.5%"></div>
<span class="bm-out">24,368</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Express</span><span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:21.2%"></div>
<span class="bm-out">19,546</span>
</div>
</div>
</div>

## Database · read by id

One indexed <code>SELECT</code> against a 10,000-row table, connection pool of 20.

<div class="bm-chart">
<div class="bm-row is-first">
<div class="bm-label">Elysia<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:100.0%"><span class="bm-in">66,506 req/s</span></div>
      
</div>
</div>
<div class="bm-row is-asena">
<div class="bm-label">Asena <span class="bm-adapter">Ergenecore</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:97.7%"></div>
<span class="bm-out">64,995</span>
</div>
</div>
<div class="bm-row is-asena">
<div class="bm-label">Asena <span class="bm-adapter">Hono</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:94.2%"></div>
<span class="bm-out">62,664</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Hono<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:92.5%"></div>
<span class="bm-out">61,532</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Fastify<span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:57.5%"></div>
<span class="bm-out">38,245</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Fastify<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:51.6%"></div>
<span class="bm-out">34,350</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Express<span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:45.2%"></div>
<span class="bm-out">30,031</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Express<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:38.5%"></div>
<span class="bm-out">25,632</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Fastify</span><span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:26.1%"></div>
<span class="bm-out">17,391</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Fastify</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:24.2%"></div>
<span class="bm-out">16,075</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Express</span><span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:23.2%"></div>
<span class="bm-out">15,461</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Express</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:22.8%"></div>
<span class="bm-out">15,148</span>
</div>
</div>
</div>

## Static file · 4 KB

Each stack serves the file the way its own documentation tells you to.

<div class="bm-chart">
<div class="bm-row is-first">
<div class="bm-label">Elysia<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:100.0%"><span class="bm-in">99,703 req/s</span></div>
      
</div>
</div>
<div class="bm-row is-asena">
<div class="bm-label">Asena <span class="bm-adapter">Ergenecore</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:84.0%"></div>
<span class="bm-out">83,704</span>
</div>
</div>
<div class="bm-row is-asena">
<div class="bm-label">Asena <span class="bm-adapter">Hono</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:63.0%"></div>
<span class="bm-out">62,846</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Hono<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:26.5%"></div>
<span class="bm-out">26,422</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Fastify</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:23.2%"></div>
<span class="bm-out">23,140</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Fastify<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:21.1%"></div>
<span class="bm-out">21,059</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Express</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:20.0%"></div>
<span class="bm-out">19,972</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Express<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:19.9%"></div>
<span class="bm-out">19,875</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Fastify<span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:19.7%"></div>
<span class="bm-out">19,593</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Express<span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:18.5%"></div>
<span class="bm-out">18,459</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Express</span><span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:16.4%"></div>
<span class="bm-out">16,312</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Fastify</span><span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:10.9%"></div>
<span class="bm-out">10,909</span>
</div>
</div>
</div>


::: warning What the static numbers actually measure
The static scenario measures each stack's **official static middleware**, not the framework.
This is also why Asena's two adapters diverge here:
Ergenecore implements static serving itself, while the Hono adapter delegates to
`serveStatic` from `hono/bun`.
:::

## Node vs Bun

The four Node-based frameworks were measured twice, running the **same compiled
`dist/main.js`** on both runtimes. Only the runtime changes, measured on plaintext. The
Express-based stacks gain on Bun, the Fastify-based ones lose ground — which is why every
card above prints its Bun variant alongside the Node one.

<div class="bm-runtime-grid">
<div class="bm-runtime-card">
<div class="bm-rc-name">Express</div>
<div class="bm-rc-gain">+20%</div>
<div class="bm-rc-rows"><span>Node 70,711</span><span>Bun 84,690</span></div>
</div>
<div class="bm-runtime-card">
<div class="bm-rc-name">Fastify</div>
<div class="bm-rc-gain">−11%</div>
<div class="bm-rc-rows"><span>Node 115,937</span><span>Bun 103,025</span></div>
</div>
<div class="bm-runtime-card">
<div class="bm-rc-name">NestJS <span class="bm-adapter">Express</span></div>
<div class="bm-rc-gain">+15%</div>
<div class="bm-rc-rows"><span>Node 57,408</span><span>Bun 65,750</span></div>
</div>
<div class="bm-runtime-card">
<div class="bm-rc-name">NestJS <span class="bm-adapter">Fastify</span></div>
<div class="bm-rc-gain">−2%</div>
<div class="bm-rc-rows"><span>Node 93,241</span><span>Bun 91,003</span></div>
</div>
</div>

## Asena's two adapters

Identical application code — the same controllers, services, validators and repositories.
Only the adapter import changes.

| Scenario | Ergenecore | Hono adapter |
|:---|--:|--:|
| Plaintext | 151,923 | 141,822 |
| JSON serialization | 148,415 | 132,708 |
| Full API endpoint | 86,710 | 86,840 |
| Request validation | 82,584 | 80,265 |
| Database · read by id | 64,995 | 62,664 |
| Static file · 4 KB | 83,704 | 62,846 |

Ergenecore leads on raw throughput and static files; on the body-heavy API endpoint the two
are level. Pick Ergenecore for speed, the Hono adapter when you want Hono's
middleware ecosystem.

## What an ORM costs

Asena exposes the same three database operations twice: once over raw `Bun.sql`, once over
`@asenajs/asena-drizzle`. Same queries, same response bytes, same driver — the only
difference is the query builder.

| Operation | Raw `Bun.sql` | Drizzle | Cost |
|:---|--:|--:|--:|
| read by id | 64,995 | 28,084 | −57% |
| paged list | 34,137 | 18,632 | −45% |
| insert | 58,254 | 29,779 | −49% |

## Full results

Every measured number, req/s.

| Framework | Runtime | Plaintext | JSON serialization | Query string parsing | Path parameters | Full API endpoint | Request validation | DB read by id | Static 4 KB |
|:---|:---|--:|--:|--:|--:|--:|--:|--:|--:|
| Elysia | Bun | 177,152 | 144,192 | 151,357 | 155,440 | 103,067 | 84,506 | 66,506 | 99,703 |
| Hono | Bun | 158,409 | 146,282 | 121,134 | 132,600 | 99,586 | 92,033 | 61,532 | 26,422 |
| Asena  Ergenecore | Bun | 151,923 | 148,415 | 119,897 | 142,369 | 86,710 | 82,584 | 64,995 | 83,704 |
| Asena  Hono | Bun | 141,822 | 132,708 | 117,022 | 131,908 | 86,840 | 80,265 | 62,664 | 62,846 |
| Fastify | Bun | 103,025 | 102,927 | 95,608 | 97,470 | 70,073 | 77,682 | 34,350 | 21,059 |
| Express | Bun | 84,690 | 83,315 | 67,581 | 79,356 | 51,700 | 47,030 | 25,632 | 19,875 |
| NestJS  Fastify | Bun | 91,003 | 87,893 | 78,404 | 82,533 | 55,690 | 32,943 | 16,075 | 23,140 |
| NestJS  Express | Bun | 65,750 | 63,540 | 55,656 | 61,152 | 38,603 | 24,630 | 15,148 | 19,972 |
| Fastify | Node | 115,937 | 122,016 | 108,068 | 116,465 | 73,995 | 75,600 | 38,245 | 19,593 |
| Express | Node | 70,711 | 82,431 | 71,201 | 78,573 | 45,031 | 49,778 | 30,031 | 18,459 |
| NestJS  Fastify | Node | 93,241 | 90,926 | 74,866 | 85,138 | 50,917 | 24,368 | 17,391 | 10,909 |
| NestJS  Express | Node | 57,408 | 57,824 | 53,391 | 57,400 | 32,119 | 19,546 | 15,461 | 16,312 |

## Methodology

| | |
|---|---|
| Hardware | AMD Ryzen 9 9950X3D · 16C/32T · 60 GB RAM |
| Runtimes | Bun 1.4.4 · Node 26.13.0 |
| Server budget | **1 CPU, 1 GB RAM** per server — one logical core with its SMT sibling idle, a cgroup memory cap with no swap |
| Load generator | `wrk`, 2 threads, 128 connections, 180s, on its own physical core |
| Repetitions | 1 per scenario, fresh server process each |
| Warmup | 60s discarded before every measurement |
| Isolation | single process, no clustering; seven scenarios run side by side, every server on the same CCD |
| Database | PostgreSQL on its own cores, pool size 20, 10,000 seeded rows, `synchronous_commit = off`; at most three database scenarios at once, one write at a time |
| Logging | disabled in every application; no compression, no CORS, no ETag hashing |

**Byte-level conformance is the gate.** Before any target is measured it must return the
exact expected bytes for all eleven contract requests plus the negative cases. A target that
fails is skipped, not measured.

**Validation runs on one route only.** Adding a schema elsewhere would make some apps measure
"parse + validate" and others "parse" while still returning identical bytes.

### Where these numbers are soft

- **The database layer is not uniform.** Each stack uses its idiomatic choice —
  `pg` for Express and Fastify, `Bun.sql` for Elysia, Hono and Asena, TypeORM for NestJS.
  The clean framework-to-framework database signal is the set of rows sharing one layer.
- **Prepared statements differ by driver.** `Bun.sql` prepares and caches per connection;
  `pg` and TypeORM issue unnamed statements and re-parse on every call. This favours the
  four `Bun.sql` applications on the database reads.
- **The 256 KB static scenario is noisy** — it is dominated by page cache and memory
  bandwidth rather than framework code. Treat it as an order of magnitude, not a ranking.
- **The load generator shares the machine** with the server, and seven scenarios run in
  parallel. Core pinning keeps them off each other's cores, but the shared L3 cache and
  memory bandwidth are not isolated.
- **One repetition per scenario.** A 1-CPU server is close to how these frameworks run in a
  container, but differences of a few percent are within run-to-run noise.

The full contract, the harness and every raw result are reproducible from a single command.
