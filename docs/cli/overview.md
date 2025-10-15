---
title: CLI Overview
description: Overview of Asena CLI features and capabilities
outline: deep
---

# CLI Overview

The Asena CLI is a powerful command-line tool that streamlines Asena application development. It handles project scaffolding, code generation, building, and development workflows.

## What is Asena CLI?

Asena CLI provides essential tools for building and managing Asena applications:

- **Project Scaffolding** - Create new projects with complete setup
- **Code Generation** - Generate controllers, services, middleware, and more
- **Build System** - Bundle your application for production
- **Development Mode** - Hot reload and automatic compilation
- **Multi-Adapter Support** - Works with both Ergenecore and Hono adapters

## Key Features

### 🚀 Quick Project Setup

Create a fully configured Asena project in seconds with interactive prompts for adapter selection, ESLint, and Prettier setup.

### 🔧 Code Generation

Quickly generate boilerplate code for:
- Controllers with route handlers
- Services with business logic
- Middleware for request processing
- Config classes for server configuration
- WebSocket namespaces for real-time features

### ⚡ Fast Development

Development mode with automatic building and component registration. No manual imports needed—the CLI discovers and registers all your components automatically.

### 📦 Production Builds

Bundle your application with Bun's fast bundler, with full control over minification, source maps, and output options.

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

- **Bun Runtime** - v1.2.8 or higher
- **TypeScript** - v5.8.2 or higher (installed automatically)

## Related Resources

- [Get Started Guide](/docs/get-started) - Complete beginner's guide
- [Adapters Overview](/docs/adapters/overview) - Choose between Ergenecore and Hono
- [Project Structure](/docs/guides/project-structure) - Recommended file organization

---

**Next Steps:**
- [Install the CLI](/docs/cli/installation)
- [Learn CLI Commands](/docs/cli/commands)
- [Try the Examples](/docs/cli/examples)
