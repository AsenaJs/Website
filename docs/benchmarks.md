---
title: Benchmarks
description: How Asena performs against Elysia, Hono, Fastify, Express and NestJS across eight scenarios and two runtimes, on identical, byte-verified workloads.
outline: deep
llms: false
---

# Benchmarks

Eight frameworks, two runtimes, eleven scenarios, one frozen contract. Every application
returns **byte-for-byte identical responses** to byte-for-byte identical requests, verified
mechanically on the exact builds that were measured. Without that, a benchmark compares
implementations, not frameworks.

The harness, every app and every raw result are public in
[AsenaJs/benchmark](https://github.com/AsenaJs/benchmark): clone it and run the same sweep on
your own machine.

::: info Read the charts honestly: Elysia and Hono are right there
Elysia and Hono are minimal routers, and on a minimal application they are excellent
choices. On most charts the top three — Elysia, Hono and Asena · Ergenecore — sit within a
few percent of each other, and Elysia leads 5 of the
8 headline scenarios. If your service is a handful of routes, any of the three will do.

Asena is built for the application after that one: controllers, injected services,
middleware, validation, lifecycle hooks, a container that wires it together. That is the
shape NestJS gives you, and NestJS is the comparison this page is really about.
:::

<div class="bm-hero">
<div class="bm-hero-num">2.59<span>×</span></div>
<div class="bm-hero-txt">
<strong>Asena outruns NestJS out of the box</strong>
<span>Plaintext — 211,630 vs 81,623 req/s.</span>
</div>
</div>

<div class="bm-hero-badges">
<div class="bm-badge"><b>3.87×</b><span>Validation · Zod vs class-validator</span></div>
<div class="bm-badge"><b>1.74×</b><span>DB read · Drizzle vs TypeORM</span></div>
<div class="bm-badge"><b>2.59×</b><span>Full API endpoint</span></div>
</div>

<div class="bm-badges-note">Asena · Ergenecore vs NestJS · Express · Node. Each stack runs its own validator and data
layer, so those two badges compare the stacks you get, libraries included.</div>

## Asena vs NestJS

NestJS is the framework Asena is most often compared to: both are decorator-driven, both
put an IoC container at the centre, both ask you to write controllers and inject services.
The difference is what runs underneath.

<div class="bm-vs-grid">
<div class="bm-vs-card">
<div class="bm-vs-scenario">Plaintext</div>
<div class="bm-vs-big">2.59<span>×</span></div>
<div class="bm-vs-sub">faster than <strong>NestJS + Express</strong> on Node <span class="bm-paren">(1.92× on Bun)</span></div>
<div class="bm-vs-alt"><b>1.70×</b> against <strong>NestJS + Fastify</strong> on Node <span class="bm-paren">(1.65× on Bun)</span></div>
<div class="bm-vs-detail">
<div class="is-me"><b>211,630</b><span>Asena · Ergenecore · Bun</span></div>
<div><b>81,623</b><span>NestJS · Express · Node</span></div>
<div><b>110,435</b><span>NestJS · Express · Bun</span></div>
<div><b>124,606</b><span>NestJS · Fastify · Node</span></div>
<div><b>128,142</b><span>NestJS · Fastify · Bun</span></div>
</div>
</div>
<div class="bm-vs-card">
<div class="bm-vs-scenario">Request validation</div>
<div class="bm-vs-big">3.87<span>×</span></div>
<div class="bm-vs-sub">faster than <strong>NestJS + Express</strong> on Node <span class="bm-paren">(3.32× on Bun)</span></div>
<div class="bm-vs-alt"><b>3.04×</b> against <strong>NestJS + Fastify</strong> on Node <span class="bm-paren">(2.96× on Bun)</span></div>
<div class="bm-vs-detail">
<div class="is-me"><b>135,012</b><span>Asena · Ergenecore · Bun</span></div>
<div><b>34,847</b><span>NestJS · Express · Node</span></div>
<div><b>40,654</b><span>NestJS · Express · Bun</span></div>
<div><b>44,467</b><span>NestJS · Fastify · Node</span></div>
<div><b>45,638</b><span>NestJS · Fastify · Bun</span></div>
</div>
</div>
<div class="bm-vs-card">
<div class="bm-vs-scenario">Database · read by id</div>
<div class="bm-vs-big">1.74<span>×</span></div>
<div class="bm-vs-sub">faster than <strong>NestJS + Express</strong> on Node <span class="bm-paren">(1.74× on Bun)</span></div>
<div class="bm-vs-alt"><b>1.47×</b> against <strong>NestJS + Fastify</strong> on Node <span class="bm-paren">(1.61× on Bun)</span></div>
<div class="bm-vs-detail">
<div class="is-me"><b>46,422</b><span>Asena · Ergenecore · Bun · Drizzle</span></div>
<div><b>26,636</b><span>NestJS · Express · Node</span></div>
<div><b>26,737</b><span>NestJS · Express · Bun</span></div>
<div><b>31,661</b><span>NestJS · Fastify · Node</span></div>
<div><b>28,914</b><span>NestJS · Fastify · Bun</span></div>
</div>
</div>
<div class="bm-vs-card">
<div class="bm-vs-scenario">Full API endpoint</div>
<div class="bm-vs-big">2.59<span>×</span></div>
<div class="bm-vs-sub">faster than <strong>NestJS + Express</strong> on Node <span class="bm-paren">(1.95× on Bun)</span></div>
<div class="bm-vs-alt"><b>1.81×</b> against <strong>NestJS + Fastify</strong> on Node <span class="bm-paren">(1.57× on Bun)</span></div>
<div class="bm-vs-detail">
<div class="is-me"><b>133,533</b><span>Asena · Ergenecore · Bun</span></div>
<div><b>51,650</b><span>NestJS · Express · Node</span></div>
<div><b>68,408</b><span>NestJS · Express · Bun</span></div>
<div><b>73,682</b><span>NestJS · Fastify · Node</span></div>
<div><b>84,784</b><span>NestJS · Fastify · Bun</span></div>
</div>
</div>
</div>

::: tip How to read the four numbers on each card
`nest new` gives you NestJS on Express, running on Node. Nothing is chosen, nothing is tuned,
and that is what the headline divides by — the configuration you actually get. The three
smaller figures are the escapes, applied one at a time: swap Express for Fastify, move Node
to Bun, or do both. None of them closes the gap, and every raw req/s behind them is printed
on the card so you can check the arithmetic. On the database card Asena reads through Drizzle,
because NestJS reads through TypeORM: ORM against ORM.

Moving to Bun is not a free win everywhere: NestJS Fastify on database · read by id is slower on Bun
than on Node, so on those cards the Bun figure is the wider one.
:::

## Plaintext

A 13-byte <code>text/plain</code> response. Nothing but the HTTP layer and the router.

<div class="bm-chart">
<div class="bm-row is-first is-asena">
<div class="bm-label">Asena <span class="bm-adapter">Ergenecore</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:100.0%"><span class="bm-in">211,630 req/s</span></div>
      
</div>
</div>
<div class="bm-row">
<div class="bm-label">Elysia<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:98.4%"></div>
<span class="bm-out">208,209</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Hono<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:96.3%"></div>
<span class="bm-out">203,790</span>
</div>
</div>
<div class="bm-row is-asena">
<div class="bm-label">Asena <span class="bm-adapter">Hono</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:90.3%"></div>
<span class="bm-out">191,199</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Fastify<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:68.0%"></div>
<span class="bm-out">143,992</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Fastify<span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:62.3%"></div>
<span class="bm-out">131,886</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Express<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:61.8%"></div>
<span class="bm-out">130,688</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Fastify</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:60.6%"></div>
<span class="bm-out">128,142</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Fastify</span><span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:58.9%"></div>
<span class="bm-out">124,606</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Express</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:52.2%"></div>
<span class="bm-out">110,435</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Express<span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:44.3%"></div>
<span class="bm-out">93,850</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Express</span><span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:38.6%"></div>
<span class="bm-out">81,623</span>
</div>
</div>
</div>

## JSON serialization

A small object built and serialized per request — no caching, no precomputed body.

<div class="bm-chart">
<div class="bm-row is-first">
<div class="bm-label">Elysia<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:100.0%"><span class="bm-in">206,806 req/s</span></div>
      
</div>
</div>
<div class="bm-row is-asena">
<div class="bm-label">Asena <span class="bm-adapter">Ergenecore</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:97.6%"></div>
<span class="bm-out">201,879</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Hono<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:93.0%"></div>
<span class="bm-out">192,348</span>
</div>
</div>
<div class="bm-row is-asena">
<div class="bm-label">Asena <span class="bm-adapter">Hono</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:92.1%"></div>
<span class="bm-out">190,401</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Fastify<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:68.8%"></div>
<span class="bm-out">142,323</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Fastify<span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:63.9%"></div>
<span class="bm-out">132,118</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Express<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:61.3%"></div>
<span class="bm-out">126,819</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Fastify</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:59.5%"></div>
<span class="bm-out">123,130</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Fastify</span><span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:59.3%"></div>
<span class="bm-out">122,682</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Express</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:50.8%"></div>
<span class="bm-out">105,136</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Express<span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:44.8%"></div>
<span class="bm-out">92,556</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Express</span><span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:39.0%"></div>
<span class="bm-out">80,660</span>
</div>
</div>
</div>

## Query string parsing

Four query parameters read, coerced to numbers, defaults applied, one arithmetic result.

<div class="bm-chart">
<div class="bm-row is-first">
<div class="bm-label">Elysia<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:100.0%"><span class="bm-in">184,220 req/s</span></div>
      
</div>
</div>
<div class="bm-row">
<div class="bm-label">Hono<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:97.7%"></div>
<span class="bm-out">180,007</span>
</div>
</div>
<div class="bm-row is-asena">
<div class="bm-label">Asena <span class="bm-adapter">Ergenecore</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:93.3%"></div>
<span class="bm-out">171,829</span>
</div>
</div>
<div class="bm-row is-asena">
<div class="bm-label">Asena <span class="bm-adapter">Hono</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:92.1%"></div>
<span class="bm-out">169,602</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Fastify<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:73.1%"></div>
<span class="bm-out">134,648</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Fastify<span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:67.9%"></div>
<span class="bm-out">125,127</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Fastify</span><span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:61.3%"></div>
<span class="bm-out">112,842</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Fastify</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:60.4%"></div>
<span class="bm-out">111,335</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Express<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:58.0%"></div>
<span class="bm-out">106,906</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Express</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:49.7%"></div>
<span class="bm-out">91,484</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Express<span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:44.2%"></div>
<span class="bm-out">81,347</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Express</span><span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:40.0%"></div>
<span class="bm-out">73,723</span>
</div>
</div>
</div>

## Path parameters

Two path parameters parsed from the route and summed.

<div class="bm-chart">
<div class="bm-row is-first">
<div class="bm-label">Elysia<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:100.0%"><span class="bm-in">197,668 req/s</span></div>
      
</div>
</div>
<div class="bm-row is-asena">
<div class="bm-label">Asena <span class="bm-adapter">Ergenecore</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:98.2%"></div>
<span class="bm-out">194,040</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Hono<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:94.1%"></div>
<span class="bm-out">186,050</span>
</div>
</div>
<div class="bm-row is-asena">
<div class="bm-label">Asena <span class="bm-adapter">Hono</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:92.8%"></div>
<span class="bm-out">183,418</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Fastify<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:70.9%"></div>
<span class="bm-out">140,191</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Fastify<span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:65.9%"></div>
<span class="bm-out">130,178</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Express<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:62.5%"></div>
<span class="bm-out">123,533</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Fastify</span><span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:58.5%"></div>
<span class="bm-out">115,655</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Fastify</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:57.9%"></div>
<span class="bm-out">114,483</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Express</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:48.6%"></div>
<span class="bm-out">96,057</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Express<span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:45.6%"></div>
<span class="bm-out">90,062</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Express</span><span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:38.1%"></div>
<span class="bm-out">75,242</span>
</div>
</div>
</div>

## Full API endpoint

Path param + query + custom header + a nested JSON body parsed, reshaped and re-serialized. Integer cents only, so no float formatting can diverge.

<div class="bm-chart">
<div class="bm-row is-first">
<div class="bm-label">Hono<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:100.0%"><span class="bm-in">140,083 req/s</span></div>
      
</div>
</div>
<div class="bm-row">
<div class="bm-label">Elysia<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:99.8%"></div>
<span class="bm-out">139,772</span>
</div>
</div>
<div class="bm-row is-asena">
<div class="bm-label">Asena <span class="bm-adapter">Hono</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:96.7%"></div>
<span class="bm-out">135,480</span>
</div>
</div>
<div class="bm-row is-asena">
<div class="bm-label">Asena <span class="bm-adapter">Ergenecore</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:95.3%"></div>
<span class="bm-out">133,533</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Fastify<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:77.6%"></div>
<span class="bm-out">108,733</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Fastify<span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:62.9%"></div>
<span class="bm-out">88,129</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Express<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:62.0%"></div>
<span class="bm-out">86,884</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Fastify</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:60.5%"></div>
<span class="bm-out">84,784</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Fastify</span><span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:52.6%"></div>
<span class="bm-out">73,682</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Express</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:48.8%"></div>
<span class="bm-out">68,408</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Express<span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:44.2%"></div>
<span class="bm-out">61,945</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Express</span><span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:36.9%"></div>
<span class="bm-out">51,650</span>
</div>
</div>
</div>

## Request validation

Each framework runs its own validator: Zod for Asena and Hono, TypeBox for Elysia, ajv for Fastify, class-validator for NestJS.

<div class="bm-chart">
<div class="bm-row is-first">
<div class="bm-label">Elysia<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:100.0%"><span class="bm-in">141,501 req/s</span></div>
      
</div>
</div>
<div class="bm-row is-asena">
<div class="bm-label">Asena <span class="bm-adapter">Ergenecore</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:95.4%"></div>
<span class="bm-out">135,012</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Hono<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:94.9%"></div>
<span class="bm-out">134,329</span>
</div>
</div>
<div class="bm-row is-asena">
<div class="bm-label">Asena <span class="bm-adapter">Hono</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:93.0%"></div>
<span class="bm-out">131,627</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Fastify<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:80.9%"></div>
<span class="bm-out">114,420</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Fastify<span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:67.6%"></div>
<span class="bm-out">95,639</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Express<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:60.8%"></div>
<span class="bm-out">85,981</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Express<span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:44.5%"></div>
<span class="bm-out">62,903</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Fastify</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:32.3%"></div>
<span class="bm-out">45,638</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Fastify</span><span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:31.4%"></div>
<span class="bm-out">44,467</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Express</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:28.7%"></div>
<span class="bm-out">40,654</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Express</span><span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:24.6%"></div>
<span class="bm-out">34,847</span>
</div>
</div>
</div>

## Database · read by id

One indexed <code>SELECT</code> against a 10,000-row table, connection pool of 20.

<div class="bm-chart">
<div class="bm-row is-first">
<div class="bm-label">Elysia<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:100.0%"><span class="bm-in">95,881 req/s</span></div>
      
</div>
</div>
<div class="bm-row">
<div class="bm-label">Hono<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:98.6%"></div>
<span class="bm-out">94,549</span>
</div>
</div>
<div class="bm-row is-asena">
<div class="bm-label">Asena <span class="bm-adapter">Ergenecore</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:97.8%"></div>
<span class="bm-out">93,786</span>
</div>
</div>
<div class="bm-row is-asena">
<div class="bm-label">Asena <span class="bm-adapter">Hono</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:96.2%"></div>
<span class="bm-out">92,216</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Fastify<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:61.0%"></div>
<span class="bm-out">58,453</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Fastify<span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:58.7%"></div>
<span class="bm-out">56,240</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Express<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:53.5%"></div>
<span class="bm-out">51,290</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Express<span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:48.6%"></div>
<span class="bm-out">46,583</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Fastify</span><span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:33.0%"></div>
<span class="bm-out">31,661</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Fastify</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:30.2%"></div>
<span class="bm-out">28,914</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Express</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:27.9%"></div>
<span class="bm-out">26,737</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Express</span><span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:27.8%"></div>
<span class="bm-out">26,636</span>
</div>
</div>
</div>

## Static file · 4 KB

Each stack serves the file the way its own documentation tells you to.

<div class="bm-chart">
<div class="bm-row is-first is-asena">
<div class="bm-label">Asena <span class="bm-adapter">Ergenecore</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:100.0%"><span class="bm-in">140,542 req/s</span></div>
      
</div>
</div>
<div class="bm-row">
<div class="bm-label">Elysia<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:85.2%"></div>
<span class="bm-out">119,723</span>
</div>
</div>
<div class="bm-row is-asena">
<div class="bm-label">Asena <span class="bm-adapter">Hono</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:63.9%"></div>
<span class="bm-out">89,802</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Express<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:29.4%"></div>
<span class="bm-out">41,277</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Express</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:28.7%"></div>
<span class="bm-out">40,363</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Fastify<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:27.6%"></div>
<span class="bm-out">38,789</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Fastify</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:26.2%"></div>
<span class="bm-out">36,765</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Hono<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:25.9%"></div>
<span class="bm-out">36,441</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Fastify</span><span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:24.1%"></div>
<span class="bm-out">33,855</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Fastify<span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:23.5%"></div>
<span class="bm-out">33,053</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Express</span><span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:22.8%"></div>
<span class="bm-out">32,053</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Express<span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:22.4%"></div>
<span class="bm-out">31,544</span>
</div>
</div>
</div>


::: warning What the static numbers actually measure
The static scenario measures each stack's **official static middleware**, not the framework,
and those middlewares do different amounts of work per request:

- **Elysia** (`@elysiajs/static`) registers every HTML file as its own constant route at
  startup, so the 4 KB page skips the per-request filesystem lookup entirely.
- **Asena · Ergenecore** stats the file on every request but keeps small files' descriptors,
  MIME type and headers open between requests and reads fresh bytes through them.
- **Asena · Hono adapter** ships its own wrapper around `hono/serve-static`: a synchronous
  stat, then a `Bun.file()` response.
- **Hono** uses `serveStatic` from `hono/bun`: an asynchronous stat plus an existence check,
  then a `Bun.file()` response.
- **Express, Fastify and both NestJS stacks** stat the file asynchronously and open a new read
  stream on every request; on Node that goes through the libuv thread pool, on the same core.

On the 256 KB file Elysia and Ergenecore fall back to the per-request path too, and the ranking
follows synchronous against asynchronous stat. Read both static charts as "what each
framework's recommended static setup costs on one core", not as equal work.
:::

## Node vs Bun

The four Node-based frameworks were measured twice, running the **same compiled
`dist/main.js`** on both runtimes. Only the runtime changes, measured on plaintext.
All four are faster on Bun — yet none of them reaches the Bun-native stacks, which is the framework cost the runtime cannot remove.

<div class="bm-runtime-grid">
<div class="bm-runtime-card">
<div class="bm-rc-name">Express</div>
<div class="bm-rc-gain">+39%</div>
<div class="bm-rc-rows"><span>Node 93,850</span><span>Bun 130,688</span></div>
</div>
<div class="bm-runtime-card">
<div class="bm-rc-name">Fastify</div>
<div class="bm-rc-gain">+9%</div>
<div class="bm-rc-rows"><span>Node 131,886</span><span>Bun 143,992</span></div>
</div>
<div class="bm-runtime-card">
<div class="bm-rc-name">NestJS <span class="bm-adapter">Express</span></div>
<div class="bm-rc-gain">+35%</div>
<div class="bm-rc-rows"><span>Node 81,623</span><span>Bun 110,435</span></div>
</div>
<div class="bm-runtime-card">
<div class="bm-rc-name">NestJS <span class="bm-adapter">Fastify</span></div>
<div class="bm-rc-gain">+3%</div>
<div class="bm-rc-rows"><span>Node 124,606</span><span>Bun 128,142</span></div>
</div>
</div>

## Asena's two adapters

Identical application code — the same controllers, services, validators and repositories.
Only the adapter import changes.

| Scenario | Ergenecore | Hono adapter |
|:---|--:|--:|
| Plaintext | 211,630 | 191,199 |
| JSON serialization | 201,879 | 190,401 |
| Full API endpoint | 133,533 | 135,480 |
| Request validation | 135,012 | 131,627 |
| Database · read by id | 93,786 | 92,216 |
| Static file · 4 KB | 140,542 | 89,802 |

Ergenecore leads on raw throughput; on the body-heavy API endpoint and the database read the
two are level. The static gap is the two adapters' different file-serving strategies (see the
warning above), not routing. Pick Ergenecore for speed, the Hono adapter when you want Hono's
middleware ecosystem.

## What an ORM costs

Asena exposes the same three database operations twice: once over raw `Bun.sql`, once over
`@asenajs/asena-drizzle`. Same tables, same response bytes, the same `Bun.sql` driver, each
path with its own pool of 20 connections. The cost column is everything the ORM path adds:
Drizzle building the statement on every call (the read by id also gets a `LIMIT 1`), mapping
rows back to objects, and the repository resolving its connection per access.

| Operation | Raw `Bun.sql` | Drizzle | Cost |
|:---|--:|--:|--:|
| read by id | 93,786 | 46,422 | −51% |
| paged list | 54,517 | 33,060 | −39% |
| insert | 87,539 | 48,246 | −45% |

## Memory

Resident memory (RSS) of the listening process, sampled once a second by the harness.
Lower is better. Every server ran under the same hard cap of
2 GB with swap disabled;
no server came anywhere near it and none was ever killed for memory.

### Peak under load

The highest RSS seen across all of a target's scenarios. For Elysia, Hono and Asena ·
Ergenecore that is the first scenario after warm-up, before the garbage collector has given back
what the warm-up allocated; Asena · Hono adapter peaks on an ORM route only Asena serves; for
the Node-based stacks it is the 256 KB static file or the validation route. Asena's figures
include its second (Drizzle) connection pool.

<div class="bm-chart">
<div class="bm-row is-first">
<div class="bm-label">Elysia<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:26.7%"></div>
<span class="bm-out">71 MB</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Hono<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:26.9%"></div>
<span class="bm-out">72 MB</span>
</div>
</div>
<div class="bm-row is-asena">
<div class="bm-label">Asena <span class="bm-adapter">Ergenecore</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:36.9%"></div>
<span class="bm-out">99 MB</span>
</div>
</div>
<div class="bm-row is-asena">
<div class="bm-label">Asena <span class="bm-adapter">Hono</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:37.6%"></div>
<span class="bm-out">101 MB</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Express<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:55.5%"></div>
<span class="bm-out">148 MB</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Fastify<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:59.8%"></div>
<span class="bm-out">160 MB</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Express</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:78.9%"></div>
<span class="bm-out">211 MB</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Express<span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:80.9%"></div>
<span class="bm-out">216 MB</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Fastify</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:82.3%"></div>
<span class="bm-out">220 MB</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Fastify<span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:83.0%"></div>
<span class="bm-out">222 MB</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Express</span><span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:96.2%"></div>
<span class="bm-out">257 MB</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Fastify</span><span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:100.0%"></div>
<span class="bm-out">267 MB</span>
</div>
</div>
</div>

### Idle, right after startup

<div class="bm-chart">
<div class="bm-row is-first">
<div class="bm-label">Hono<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:25.5%"></div>
<span class="bm-out">36 MB</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Elysia<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:26.3%"></div>
<span class="bm-out">37 MB</span>
</div>
</div>
<div class="bm-row is-asena">
<div class="bm-label">Asena <span class="bm-adapter">Ergenecore</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:36.9%"></div>
<span class="bm-out">52 MB</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Express<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:36.9%"></div>
<span class="bm-out">52 MB</span>
</div>
</div>
<div class="bm-row is-asena">
<div class="bm-label">Asena <span class="bm-adapter">Hono</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:37.3%"></div>
<span class="bm-out">53 MB</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Fastify<span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:42.1%"></div>
<span class="bm-out">60 MB</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Express</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:58.5%"></div>
<span class="bm-out">83 MB</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Fastify</span><span class="bm-rt">Bun</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:61.0%"></div>
<span class="bm-out">86 MB</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Express<span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:63.1%"></div>
<span class="bm-out">89 MB</span>
</div>
</div>
<div class="bm-row">
<div class="bm-label">Fastify<span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:65.5%"></div>
<span class="bm-out">93 MB</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Express</span><span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:99.6%"></div>
<span class="bm-out">141 MB</span>
</div>
</div>
<div class="bm-row is-nest">
<div class="bm-label">NestJS <span class="bm-adapter">Fastify</span><span class="bm-rt bm-rt-node">Node</span></div>
<div class="bm-track">
<div class="bm-bar" style="width:100.0%"></div>
<span class="bm-out">141 MB</span>
</div>
</div>
</div>

| Framework | Runtime | Ready by | Idle | After warm-up | Avg under load | Peak |
|:---|:---|--:|--:|--:|--:|--:|
| Elysia | Bun | 153 ms | 37 MB | 70 MB | 63 MB | 71 MB |
| Hono | Bun | 154 ms | 36 MB | 71 MB | 60 MB | 72 MB |
| Asena Ergenecore | Bun | 151 ms | 52 MB | 93 MB | 77 MB | 99 MB |
| Asena Hono | Bun | 152 ms | 53 MB | 93 MB | 79 MB | 101 MB |
| Fastify | Bun | 153 ms | 60 MB | 155 MB | 136 MB | 160 MB |
| Express | Bun | 153 ms | 52 MB | 141 MB | 126 MB | 148 MB |
| NestJS Fastify | Bun | 305 ms | 86 MB | 214 MB | 188 MB | 220 MB |
| NestJS Express | Bun | 304 ms | 83 MB | 206 MB | 185 MB | 211 MB |
| Fastify | Node | 154 ms | 93 MB | 205 MB | 145 MB | 222 MB |
| Express | Node | 154 ms | 89 MB | 175 MB | 147 MB | 216 MB |
| NestJS Fastify | Node | 304 ms | 141 MB | 201 MB | 193 MB | 267 MB |
| NestJS Express | Node | 305 ms | 141 MB | 193 MB | 193 MB | 257 MB |

- **Ready by** is wall time from spawning the process to the first successful response,
  including the runtime's own boot. The harness polls once immediately and then every 150 ms,
  so the number is only as fine as that step: everything except NestJS answered on the second
  poll (~150 ms), NestJS on the third (~300 ms).
- **RSS** counts the pages the process actually holds in memory, including the runtime's own
  code. That is why a Bun process starts above 30 MB before the application has done anything.
- **After warm-up** follows traffic on every route: JIT-compiled code, connection pools and
  caches are all resident by then. It is the number to size a container by.

## Full results

Every measured number, req/s.

| Framework | Runtime | Plaintext | JSON serialization | Query string parsing | Path parameters | Full API endpoint | Request validation | DB read by id | Static 4 KB |
|:---|:---|--:|--:|--:|--:|--:|--:|--:|--:|
| Elysia | Bun | 208,209 | 206,806 | 184,220 | 197,668 | 139,772 | 141,501 | 95,881 | 119,723 |
| Hono | Bun | 203,790 | 192,348 | 180,007 | 186,050 | 140,083 | 134,329 | 94,549 | 36,441 |
| Asena  Ergenecore | Bun | 211,630 | 201,879 | 171,829 | 194,040 | 133,533 | 135,012 | 93,786 | 140,542 |
| Asena  Hono | Bun | 191,199 | 190,401 | 169,602 | 183,418 | 135,480 | 131,627 | 92,216 | 89,802 |
| Fastify | Bun | 143,992 | 142,323 | 134,648 | 140,191 | 108,733 | 114,420 | 58,453 | 38,789 |
| Express | Bun | 130,688 | 126,819 | 106,906 | 123,533 | 86,884 | 85,981 | 51,290 | 41,277 |
| NestJS  Fastify | Bun | 128,142 | 123,130 | 111,335 | 114,483 | 84,784 | 45,638 | 28,914 | 36,765 |
| NestJS  Express | Bun | 110,435 | 105,136 | 91,484 | 96,057 | 68,408 | 40,654 | 26,737 | 40,363 |
| Fastify | Node | 131,886 | 132,118 | 125,127 | 130,178 | 88,129 | 95,639 | 56,240 | 33,053 |
| Express | Node | 93,850 | 92,556 | 81,347 | 90,062 | 61,945 | 62,903 | 46,583 | 31,544 |
| NestJS  Fastify | Node | 124,606 | 122,682 | 112,842 | 115,655 | 73,682 | 44,467 | 31,661 | 33,855 |
| NestJS  Express | Node | 81,623 | 80,660 | 73,723 | 75,242 | 51,650 | 34,847 | 26,636 | 32,053 |

## Methodology

| | |
|---|---|
| Hardware | AMD Ryzen 9 9950X3D 16-Core Processor · 16C/32T · 60 GB RAM · Linux 7.2.11-arch1-1 · CPU governor `performance` |
| Runtimes | Bun 1.4.4 · Node 26.13.0 · PostgreSQL 18.3 |
| Server budget | **1 CPU, 2 GB RAM** per server — pinned to one logical core (no other benchmark work is placed on it or its SMT sibling), inside a cgroup with a hard memory cap and no swap |
| Order | **strictly sequential** — exactly one server runs at a time; nothing else is benchmarked alongside it |
| Server lifecycle | one fresh process per framework, reused for all of its scenarios |
| Warm-up | 120s per process before the first measurement, split evenly over every route so each is JIT-warm; discarded |
| Measurement | 180s per scenario, back to back, 1 run each |
| Load generator | `wrk`, 2 threads, 128 connections, on two physical cores of their own (`taskset -c 1,2,17,18 wrk -t2 -c128 -d<N>s --latency --timeout 10s`) |
| Database | PostgreSQL in a container pinned to five cores of its own, pool size 20 in every app, 10,000 seeded rows, `synchronous_commit = off`; write tables truncated before every write scenario |
| Quiet machine | unrelated containers stopped for the run; the orchestrator pinned to its own core |
| Logging | disabled in every application; no compression, no CORS, no ETag hashing |

### Versions

| Framework | Version | Runtime(s) | Database layer | Validator |
|:---|:---|:---|:---|:---|
| Elysia | 1.4.30 | Bun | Bun.sql | TypeBox |
| Hono | 4.13.14 | Bun | Bun.sql | zod |
| Asena Ergenecore | 5.0.1 | Bun | Bun.sql + drizzle | zod |
| Asena Hono | 5.0.2 | Bun | Bun.sql + drizzle | zod |
| Fastify | 5.12.7 | Node, Bun | pg | ajv (JSON Schema) |
| Express | 5.3.0 | Bun, Node | pg | zod |
| NestJS Fastify | 11.2.1 | Node, Bun | TypeORM | class-validator |
| NestJS Express | 11.2.1 | Bun, Node | TypeORM | class-validator |

**Byte-level conformance is the gate.** Every app must return the exact expected bytes for all
eleven contract requests plus the negative cases.
For this sweep the check ran on the exact builds that were measured, right after the sweep, and all eight apps passed; the harness now runs it against every server process before its warm-up.

**Validation runs on one route only.** Adding a schema elsewhere would make some apps measure
"parse + validate" and others "parse" while still returning identical bytes.

**Every result is checked, not just collected.** A run counts only if `wrk` saw zero non-2xx
responses and zero socket errors, the cgroup memory cap was verified in place, and the
process was still alive at the end. All 138 runs passed.

**The server core was the bottleneck, not the load generator.** The harness reads the server
core's own counters during every measurement, and it never dropped below
100% busy.
Part of that core goes to the kernel's network stack (softirq) rather than the framework —
from 13% on the slowest stacks
to 33% on the fastest. It is a
fixed cost per request, so the faster a framework is, the larger its share; every framework pays
it at the same rate. In a spot check, raising `wrk` from 2 to 8 threads did not change the numbers.

### Where these numbers are soft

- **The database layer is not uniform.** Each stack uses its idiomatic choice —
  `pg` for Express and Fastify, `Bun.sql` for Elysia, Hono and Asena, TypeORM for NestJS.
  The clean framework-to-framework database signal is the set of rows sharing one layer.
- **Prepared statements differ by driver.** `Bun.sql` prepares and caches per connection;
  `pg` and TypeORM issue unnamed statements and re-parse on every call. This favours the
  four `Bun.sql` applications on the database reads.
- **The static scenarios rank file-serving strategies**, not routers — see the warning under the
  charts. The 256 KB file in particular follows synchronous against asynchronous stat.
- **Scenarios share a process.** Each framework serves all of its scenarios from one process,
  in the same order for every framework, the way a real service would. Memory a route leaves
  behind is visible to the routes measured after it.
- **Warm-up was split across routes.** The 120s budget was divided evenly over a target's
  routes: about 11s each for most stacks, 9s for
  Asena, which also serves the three ORM routes. Bun and Node are warm within seconds, so this
  is not expected to move results, but it is not identical. The harness now gives every route
  the same seconds.
- **Frameworks ran in a fixed order** (Express, Fastify, NestJS, Elysia, Hono, Asena), one run
  each. Drift in machine state over the 7.4-hour sweep is not averaged out.
- **Handler code was equivalent, with four small exceptions**, all fixed in the apps since:
  standalone Express read `req.query` field by field, which re-runs its query parser each time
  (query and list routes); on the full API route Asena and Elysia built the whole header map to
  read one header (the Asena Hono adapter also sorts it); the NestJS + Express validation DTO
  lacked one `@IsDefined()` the Fastify variant has. Each is worth at most a few percent on its
  route.
- **No app checks `Authorization`** on the full API route. It is sent, but the scenario
  measures parsing, arithmetic and reshaping, not authentication.
- **NestJS bundles its own Express and Fastify.** Under NestJS they resolve to Express 5.2.1 and
  Fastify 5.11.3, slightly older than the standalone apps' versions.
- **The load generator shares the machine** with the server. The server sits alone on one CPU
  chiplet with its own L3 cache; `wrk` and PostgreSQL run on the other chiplet. Memory bandwidth
  and the I/O die are still shared.
- **One run per scenario.** Differences of a few percent are within run-to-run noise; read
  close rows as a tie. On plaintext the top three are 211,630, 208,209, 203,790 req/s — a tie.

The full contract, the harness, every app and every raw result are in
[AsenaJs/benchmark](https://github.com/AsenaJs/benchmark).
