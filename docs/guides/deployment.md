---
title: Deployment
description: Deployment guide for Asena applications
outline: deep
---

# Deployment

::: info Coming Soon
This guide is currently under development. Check back soon for comprehensive deployment documentation including:

- Building for Production
- Docker Deployment
- Environment Configuration
- Performance Optimization
- Security Best Practices
- CI/CD Pipelines
- Monitoring and Logging
:::

## Quick Start

Check the project first — the mistakes that only surface in production are exactly the ones
`doctor` looks for, and it exits non-zero so it fits in a CI step:

```bash
asena doctor
```

Then build your application:

```bash
asena build
```

Then run the production build:

```bash
bun dist/index.asena.js
```

::: warning Two things worth checking before a first production deploy
- **`buildOptions.minify.identifiers` must be `false`.** Component names are read at runtime, and
  a bundle built with identifiers minified fails to resolve them — in production only. The build
  forces it off and `asena doctor` reports it. `keepNames: true` does not substitute for it. See
  [Minification and component names](/docs/cli/commands#minification-and-component-names).
- **One copy of `@asenajs/asena`, `hono` and `zod` each.** Two copies break `instanceof` and the
  `HttpException` brand, turning a deliberate `404` into a `500` with no clue as to why.
  `asena doctor` checks for this.
:::

## Graceful Shutdown and Probes

Two things a deployment needs are already available:

- **Signals are handled by default.** `SIGTERM`, `SIGINT` and `SIGHUP` call `server.stop()`, which stops taking new work, runs your components' `@OnStop` hooks while the transports are still up, then releases everything in order. See [Component Lifecycle](/docs/concepts/lifecycle#signal-handling).
- **Liveness and readiness are separate endpoints.** Pass `health: { port }` and point your restart policy at `{path}/live` and your load balancer at `{path}/ready`. Readiness answers `503` for the whole drain, so an instance is pulled from rotation while it still has work to finish. See [Health probes](/docs/concepts/lifecycle#health-probes).

## Related

- [CLI Build Command](/docs/cli/commands#asena-build) - Building a production bundle
- [asena doctor](/docs/cli/commands#asena-doctor) - Pre-flight check for the project's configuration
- [CLI Configuration](/docs/cli/configuration) - Build options and output
- [Server Configuration](/docs/guides/configuration) - Runtime server settings
- [Component Lifecycle](/docs/concepts/lifecycle) - Graceful shutdown, signals and health probes
- [GitHub](https://github.com/AsenaJs/Asena) - Follow the repository for updates
