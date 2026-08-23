---
title: CLI Overview
description: Asena CLI for project scaffolding, code generation, dev server, and production bundling
outline: deep
---

# CLI Overview

The Asena CLI is a powerful command-line tool that streamlines Asena application development. It handles project scaffolding, code generation, building, and development workflows.

## What is Asena CLI?

Asena CLI provides essential tools for building and managing Asena applications:

- **Project Scaffolding** - Create new projects with complete setup
- **Code Generation** - Generate controllers, services, middleware, and more
- **Build System** - Bundle your application for production
- **Development Mode** - One-shot build and run with `asena dev start`; use the scaffolded `bun run dev:hot` for hot reload
- **Multi-Adapter Support** - Works with both Ergenecore and Hono adapters

## Key Features

<div class="card-grid">
  <div class="info-card">
    <span class="ic-kicker">🚀 Setup</span>
    <div class="ic-title">Quick Project Setup</div>
    <p class="ic-desc">Create a fully configured Asena project in seconds with interactive prompts for adapter selection, ESLint, and Prettier setup.</p>
  </div>
  <div class="info-card">
    <span class="ic-kicker">🔧 Generation</span>
    <div class="ic-title">Code Generation</div>
    <p class="ic-desc">Generate controllers with route handlers, services with business logic, middleware, config classes and WebSocket namespaces.</p>
  </div>
  <div class="info-card">
    <span class="ic-kicker">⚡ Development</span>
    <div class="ic-title">Fast Development</div>
    <p class="ic-desc">One-shot build and run — the CLI discovers and registers all your components automatically. No manual imports needed.</p>
  </div>
  <div class="info-card">
    <span class="ic-kicker">📦 Production</span>
    <div class="ic-title">Production Builds</div>
    <p class="ic-desc">Bundle with Bun's fast bundler, with full control over minification, source maps and output options.</p>
  </div>
</div>

## Getting Started

Install the CLI globally:

```bash
bun install -g @asenajs/asena-cli
```

Create your first project:

```bash
asena create
```

Start developing:

```bash
cd my-project
asena dev start
```

## Documentation

- [Installation](/docs/cli/installation) - Install and verify the CLI
- [Commands](/docs/cli/commands) - All available commands and options
- [Configuration](/docs/cli/configuration) - Configure your project
- [Examples](/docs/cli/examples) - Step-by-step tutorials

## Requirements

- **Bun Runtime** - v1.3.12 or higher
- **TypeScript** - v5.8.2 or higher (installed automatically)

## Related

- [Get Started Guide](/docs/get-started) - Complete beginner's guide
- [Adapters Overview](/docs/adapters/overview) - Choose between Ergenecore and Hono
- [Controllers](/docs/concepts/controllers) - What the generated controllers do
- [Deployment](/docs/guides/deployment) - Running a built project in production
