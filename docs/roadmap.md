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

## ✅ Current Release (v0.4.x)

These features are **stable and production-ready** in the current release:

### Core Framework

- **Dependency Injection Container** - Full IoC container with constructor, property, and method injection
- **Decorator-Based API** - TypeScript decorators for controllers, services, middleware, and more
- **Controller System** - REST API controllers with route decorators (`@Get`, `@Post`, `@Put`, `@Delete`, `@Patch`)
- **Service Layer** - Service components with lifecycle management
- **Middleware System** - Global and route-level middleware with execution control
- **Context API** - Unified request context abstraction across adapters
- **WebSocket Support** - Decorator-based WebSocket services with namespace support
- **Configuration Management** - `@Config` decorator for server configuration

### Adapters

- **Ergenecore Adapter** - Native Bun adapter with SIMD-accelerated routing
- **Hono Adapter** - Hono-based adapter with middleware compatibility

### Official Packages

- **@asenajs/logger** - Structured logging with multiple transports (console, file, Loki)
- **@asenajs/drizzle** - Drizzle ORM integration with repository pattern

### CLI Tools

- **Project Scaffolding** - `asena new` command for project generation
- **Code Generation** - Generate controllers, services, middleware, WebSocket services
- **Project Bundling** - `asena build` command bundles your project based on `asena-config.ts`, significantly improving performance by reducing cold start time and package size

---

## 🚧 In Active Development (v0.5.0)

These features are **currently being developed** and will be available soon:

### Official Packages

#### @asenajs/redis
Redis integration package with connection pooling and caching utilities.

- Bun native Redis client wrapper with IoC integration

**Status:** In development

#### @asenajs/nats
NATS messaging integration for microservices communication.

**Features:**
- NATS client with IoC support
- Request/reply pattern
- Publish/subscribe messaging
- Queue groups and load balancing
- Microservices communication helpers

**Status:** In development

### Framework Features

#### AsenaEventRoute

Event-based routing system for internal framework events.

**Features:**

- Route-based event handling with decorators
- Event lifecycle management
- Event middleware support
- Type-safe event payloads
- Event namespaces and filtering

**Use Cases:**

- Application lifecycle hooks
- Custom framework events
- Plugin system foundation
- Inter-service communication

**Status:** Planned for v0.5.0

---

## 📋 Planned for v1.0

These features are **planned for the v1.0 release** and will make Asena enterprise-ready:

### Plugin System

A powerful plugin architecture allowing third-party extensions.

**Features:**
- Plugin lifecycle hooks (`onLoad`, `onStart`, `onStop`)
- Plugin dependency resolution
- Plugin configuration management
- Official plugin registry

**Use Cases:**
- Authentication plugins (OAuth, JWT, SAML)
- Database adapters (PostgreSQL, MySQL, MongoDB)
- Monitoring and APM integrations

### OpenTelemetry Support

Built-in observability and distributed tracing.

**Features:**
- Automatic request tracing
- Custom span creation
- Metrics collection (HTTP, WebSocket, database)
- Integration with Jaeger, Zipkin, and other backends
- Performance profiling

**Benefits:**
- Production debugging
- Performance monitoring
- Distributed system observability
- SLA compliance tracking

### OpenAPI Support

Automatic OpenAPI/Swagger documentation generation.

**Features:**
- Auto-generate OpenAPI specs from decorators
- Swagger UI integration
- Type-safe API client generation
- Schema validation sync with Zod
- API versioning support

**Benefits:**
- Automatic API documentation
- Client SDK generation
- API contract testing
- Developer experience improvements

---

## 💡 Future Ideas (CLI)

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
| v0.4.x | Current | Possible | Yes (with caution) |
| v0.5.x | Next | Possible | Yes (with caution) |
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

- **v0.5.0** - Q4 2025 (Redis, NATS, AsenaEventRoute)
- **v1.0.0** - Q2-Q3 2026 (Plugin system, OpenTelemetry, OpenAPI)

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
