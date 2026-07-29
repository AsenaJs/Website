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

For now, you can build your application with:

```bash
asena build
```

Then run the production build:

```bash
bun dist/index.asena.js
```

## Graceful Shutdown and Probes

Two things a deployment needs are already available:

- **Signals are handled by default.** `SIGTERM`, `SIGINT` and `SIGHUP` call `server.stop()`, which stops taking new work, runs your components' `@OnStop` hooks while the transports are still up, then releases everything in order. See [Component Lifecycle](/docs/concepts/lifecycle#signal-handling).
- **Liveness and readiness are separate endpoints.** Pass `health: { port }` and point your restart policy at `{path}/live` and your load balancer at `{path}/ready`. Readiness answers `503` for the whole drain, so an instance is pulled from rotation while it still has work to finish. See [Health probes](/docs/concepts/lifecycle#health-probes).

## Related Documentation

- [CLI Build Command](/docs/cli/commands#build)
- [CLI Configuration](/docs/cli/configuration)
- [Server Configuration](/docs/guides/configuration)
- [Component Lifecycle](/docs/concepts/lifecycle) - graceful shutdown, signals and health probes

---

**Stay Updated:** Follow us on [GitHub](https://github.com/AsenaJs/Asena) for updates.
