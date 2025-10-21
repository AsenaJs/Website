---
title: Get Started
description: Quick start guide for Asena framework
outline: deep
---

# Get Started

Get up and running with Asena in minutes. This guide shows you how to create your first Asena application.

## Prerequisites

- [Bun](https://bun.sh) v1.2.8 or higher

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

**For Ergenecore adapter (recommended):**

```bash
bun add @asenajs/asena @asenajs/ergenecore @asenajs/asena-logger
bun add -D @asenajs/asena-cli
```

**For Hono adapter:**

```bash
bun add @asenajs/asena @asenajs/hono-adapter hono @asenajs/asena-logger
bun add -D @asenajs/asena-cli
```

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

**For Ergenecore:**

```typescript
import { AsenaServerFactory } from '@asenajs/asena/server';
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

**For Hono:**

```typescript
import { AsenaServerFactory } from '@asenajs/asena/server';
import { createHonoAdapter } from '@asenajs/hono-adapter';
import { logger } from './logger';

const adapter = createHonoAdapter();

const server = await AsenaServerFactory.create({
  adapter,
  logger,
  port: 3000
});

await server.start();
```

### 6. Create Your First Controller

Create `src/controllers/HelloController.ts`:

**For Ergenecore:**

```typescript
import { Controller } from '@asenajs/asena/server';
import { Get } from '@asenajs/asena/web';
import type { Context } from '@asenajs/ergenecore/types';

@Controller('/')
export class HelloController {
  @Get('/')
  async hello(context: Context) {
    return context.send('Hello World!');
  }
}
```

**For Hono:**

```typescript
import { Controller } from '@asenajs/asena/server';
import { Get } from '@asenajs/asena/web';
import type { Context } from '@asenajs/hono-adapter/types';

@Controller('/')
export class HelloController {
  @Get('/')
  async hello(context: Context) {
    return context.send('Hello World!');
  }
}
```

### 7. Initialize CLI Configuration

```bash
asena init
```

This creates `asena.config.ts` with default build settings.

### 8. Run Your Application

**Development mode:**

```bash
asena dev start
```

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
├── asena.config.ts
├── package.json
└── tsconfig.json
```

---

## Next Steps

Now that you have a working Asena application:

- **Add more routes** - Learn about [Controllers](/docs/concepts/controllers)
- **Add business logic** - Learn about [Services](/docs/concepts/services)
- **Add middleware** - Learn about [Middleware](/docs/concepts/middleware)
- **Add validation** - Learn about [Validation](/docs/concepts/validation) (Ergenecore only)
- **Explore CLI** - Check out [CLI Commands](/docs/cli/commands)
- **See examples** - Browse [Examples](/docs/examples)

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
