---
title: Get Started
description: Install Asena, configure TypeScript decorators, and build your first controller and service on Bun
outline: deep
---

# Get Started

Get up and running with Asena in minutes. This guide shows you how to create your first Asena application.

## Prerequisites

- [Bun](https://bun.sh) v1.3.12 or higher

**Verify Bun installation:**

```bash
bun --version
```

## Option 1: With Asena CLI (Recommended)

The fastest way to create a new Asena project.

### 1. Install Asena CLI

```bash
bun install -g @asenajs/asena-cli
```

### 2. Create Project

```bash
asena create
```

Answer the interactive prompts:

```bash
✔ Enter your project name: my-app
✔ Select adapter: Ergenecore
✔ Do you want to setup ESLint? No
✔ Do you want to setup Prettier? No
```

### 3. Start Development Server

```bash
cd my-app
asena dev start
```

::: warning
You shouldn't use `asena dev start` for production. It will be removed in feature releases. Its for quick testings only
:::

Your server is now running at `http://localhost:3000`!

Test it:

```bash
curl http://localhost:3000
# Output: Hello asena
```

That's it! You now have a working Asena application. Skip to [Next Steps](#next-steps) to learn more.

---

## Option 2: Manual Setup

If you prefer to set up your project manually.

### 1. Create Project

```bash
mkdir my-app
cd my-app
bun init -y
```

### 2. Install Dependencies

::: code-group
```bash [For ergenecore]
bun add @asenajs/asena @asenajs/ergenecore @asenajs/asena-logger zod
bun add -D @asenajs/asena-cli
bunx asena init
✔ Which adapter do you want to use? Ergenecore Adapter
```

```bash [For hono]
bun add @asenajs/asena @asenajs/hono-adapter @asenajs/asena-logger hono zod
bun add -D @asenajs/asena-cli
bunx asena init
✔ Which adapter do you want to use? Hono Adapter
```
:::

### 3. Configure TypeScript

Update your `tsconfig.json` to enable decorators:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

::: tip
These two settings are **required** for Asena decorators to work properly.
:::

### 4. Create Logger

Create `src/logger.ts`:

```typescript
import { AsenaLogger } from '@asenajs/asena-logger';

export const logger = new AsenaLogger();
```

### 5. Create Entry Point

Create `src/index.ts`:

::: code-group

```typescript [Ergenecore]
import { AsenaServerFactory } from '@asenajs/asena';
import { createErgenecoreAdapter } from '@asenajs/ergenecore';
import { logger } from './logger';

const adapter = createErgenecoreAdapter();

const server = await AsenaServerFactory.create({
  adapter,
  logger,
  port: 3000
});

await server.start();
```

```typescript [Hono]
import { AsenaServerFactory } from '@asenajs/asena';
import { createHonoAdapter } from '@asenajs/hono-adapter';
import { logger } from './logger';

// createHonoAdapter returns a tuple and requires a logger
const [adapter] = createHonoAdapter({ logger });

const server = await AsenaServerFactory.create({
  adapter,
  logger,
  port: 3000
});

await server.start();
```
:::

::: tip Components in the entry file
Asena never forces you to split everything into separate files - a small app can declare a
`@Controller` or `@Service` directly in `src/index.ts` and it will be registered as usual.

Declare it **above** the `AsenaServerFactory.create()` call. Anything below that line has
not been evaluated yet when components are collected, so it cannot be registered; Asena
logs a warning naming any component it finds in that position.
:::

### 6. Create Your First Controller

Create `src/controllers/HelloController.ts`:

::: code-group

```typescript [Ergenecore]
import { Controller } from '@asenajs/asena/decorators';
import { Get } from '@asenajs/asena/decorators/http';
import { type Context } from '@asenajs/ergenecore';

@Controller('/')
export class HelloController {
  @Get('/')
  async hello(context: Context) {
    return context.send('Hello World!');
  }
}
```

```typescript [Hono]
import { Controller } from '@asenajs/asena/decorators';
import { Get } from '@asenajs/asena/decorators/http';
import { type Context } from '@asenajs/hono-adapter';

@Controller('/')
export class HelloController {
  @Get('/')
  async hello(context: Context) {
    return context.send('Hello World!');
  }
}
```
:::

### 7. Initialize CLI Configuration

```bash
asena init
```

This creates `asena-config.ts` with default build settings.

### 8. Run Your Application

**Development mode:**

```bash
# index.ts must be your root file
bun run src/index.ts
```

::: tip Hot Reload for Faster Development
Enable hot reloading to automatically restart your server on file changes:
```bash
bun run --hot src/index.ts
```

**What hot reload does:**
- Watches all source files for changes
- Automatically refreshes the server process
- Preserves in-memory state when possible
- Ideal for rapid iteration and testing
:::

**Production build:**

```bash
asena build
bun dist/index.asena.js
```

Test your application:

```bash
curl http://localhost:3000
# Output: Hello World!
```

---

## Project Structure

Your project should now look like this:

```
my-app/
├── src/
│   ├── controllers/
│   │   └── HelloController.ts
│   ├── index.ts
│   └── logger.ts
├── asena-config.ts
├── package.json
└── tsconfig.json
```

---

## Next Steps

Now that you have a working Asena application:

<div class="card-grid">
  <a class="info-card" href="/docs/concepts/controllers">
    <span class="ic-kicker">Routing</span>
    <div class="ic-title">Controllers</div>
    <p class="ic-desc">Add more routes to your application.</p>
  </a>
  <a class="info-card" href="/docs/concepts/services">
    <span class="ic-kicker">Business Logic</span>
    <div class="ic-title">Services</div>
    <p class="ic-desc">Injectable components that carry your logic.</p>
  </a>
  <a class="info-card" href="/docs/concepts/middleware">
    <span class="ic-kicker">Requests</span>
    <div class="ic-title">Middleware</div>
    <p class="ic-desc">Intercept requests at any level.</p>
  </a>
  <a class="info-card" href="/docs/concepts/validation">
    <span class="ic-kicker">Type Safety</span>
    <div class="ic-title">Validation</div>
    <p class="ic-desc">Zod-based request validation on routes.</p>
  </a>
  <a class="info-card" href="/docs/concepts/scheduled-tasks">
    <span class="ic-kicker">Background Jobs</span>
    <div class="ic-title">Scheduled Tasks</div>
    <p class="ic-desc">Cron-based task scheduling.</p>
  </a>
  <a class="info-card" href="/docs/concepts/frontend-controller">
    <span class="ic-kicker">HTML Pages</span>
    <div class="ic-title">Frontend Controller</div>
    <p class="ic-desc">Serve HTML pages with native imports.</p>
  </a>
  <a class="info-card" href="/docs/packages/openapi">
    <span class="ic-kicker">API Docs</span>
    <div class="ic-title">OpenAPI</div>
    <p class="ic-desc">Auto-generate OpenAPI 3.1 specs.</p>
  </a>
  <a class="info-card" href="/docs/packages/redis">
    <span class="ic-kicker">Caching</span>
    <div class="ic-title">Redis</div>
    <p class="ic-desc">Caching and multi-pod WebSocket transport.</p>
  </a>
  <a class="info-card" href="/docs/cli/commands">
    <span class="ic-kicker">Tooling</span>
    <div class="ic-title">CLI Commands</div>
    <p class="ic-desc">Scaffold, generate and build from the terminal.</p>
  </a>
  <a class="info-card" href="/docs/examples">
    <span class="ic-kicker">Reference</span>
    <div class="ic-title">Examples</div>
    <p class="ic-desc">Browse ready-to-run example projects.</p>
  </a>
</div>

---

## Common Issues

### Decorators not working

Make sure your `tsconfig.json` has:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

### Command not found: asena

Add Bun's global bin directory to your PATH:

```bash
# For bash
echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# For zsh
echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### Port already in use

Change the port in `AsenaServerFactory.create()`:

```typescript
const server = await AsenaServerFactory.create({
  adapter,
  logger,
  port: 3001
});
```

---

**Need help?** Check out our [documentation](https://asena.sh) or visit our [GitHub repository](https://github.com/AsenaJs/Asena).
