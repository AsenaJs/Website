---
title: CLI Examples
description: Step-by-step tutorial for creating and running an Asena project
outline: deep
---

# CLI Examples

This guide walks you through creating your first Asena project from scratch, including creating components and building for production.

## Prerequisites

- [Bun runtime](https://bun.sh) v1.2.8 or higher
- Asena CLI installed globally

**Verify installations:**

```bash
bun --version
asena --version
```

## Step 1: Install Asena CLI

If you haven't installed the CLI yet:

```bash
bun install -g @asenajs/asena-cli
```

Verify installation:

```bash
asena --version
```

## Step 2: Create a New Project

Create a new Asena project with interactive prompts:

```bash
asena create
```

Answer the prompts:

```bash
✔ Enter your project name: my-asena-app
✔ Select adapter: Ergenecore
✔ Do you want to setup ESLint? Yes
✔ Do you want to setup Prettier? Yes
⠙ Creating asena project...
```

::: tip Adapter Selection
- **Ergenecore** - Bun-native adapter with zero dependencies (recommended)
- **Hono** - Hono framework-based adapter with ecosystem compatibility
:::

::: info ESLint and Prettier
Setting up ESLint and Prettier is recommended for maintaining code quality and consistency.
:::

## Step 3: Verify Project Setup

Navigate to your project directory:

```bash
cd my-asena-app
```

Start the development server:

```bash
asena dev start
```

You should see output like this:

```
Build completed successfully.
2025-10-15 14:30:19 [info]:
    ___    _____  ______ _   __ ___
   /   |  / ___/ / ____// | / //   |
  / /| |  \__ \ / __/  /  |/ // /| |
 / ___ | ___/ // /___ / /|  // ___ |
/_/  |_|/____//_____//_/ |_//_/  |_|

2025-10-15 14:30:20 [info]:   Adapter: ErgenecoreAdapter implemented
2025-10-15 14:30:20 [info]:   All components registered and ready to use
2025-10-15 14:30:20 [info]:   No configs found
2025-10-15 14:30:20 [info]:   Controller: AsenaController found:
2025-10-15 14:30:20 [info]:   Successfully registered GET route for PATH: /
2025-10-15 14:30:20 [info]:   Controller: AsenaController successfully registered.
2025-10-15 14:30:20 [info]:   No websockets found
2025-10-15 14:30:20 [info]:   Server started on port 3000
```

Test the default endpoint:

```bash
curl http://localhost:3000/
```

You should see: `Hello asena`

## Step 4: Create a Controller

Generate a new controller:

```bash
asena g c
```

Enter the controller name when prompted:

```bash
✔ Enter controller name: User
```

This creates `src/controllers/UserController.ts`. Let's modify it:

### For Ergenecore Adapter

```typescript
import { Controller } from '@asenajs/asena/server';
import { Get } from '@asenajs/asena/web';
import type { Context } from '@asenajs/ergenecore/types';

@Controller('/users')
export class UserController {
  @Get({ path: '/' })
  async getAllUsers(context: Context) {
    return context.send({
      message: 'List of all users',
      users: [
        { id: 1, name: 'John Doe' },
        { id: 2, name: 'Jane Smith' }
      ]
    });
  }

  @Get({ path: '/:id' })
  async getUserById(context: Context) {
    const id = context.getParam('id');
    return context.send({
      message: `User with ID: ${id}`,
      user: { id, name: 'John Doe' }
    });
  }
}
```

### For Hono Adapter

```typescript
import { Controller } from '@asenajs/asena/server';
import { Get } from '@asenajs/asena/web';
import type { Context } from '@asenajs/hono-adapter/types';

@Controller('/users')
export class UserController {
  @Get({ path: '/' })
  async getAllUsers(context: Context) {
    return context.send({
      message: 'List of all users',
      users: [
        { id: 1, name: 'John Doe' },
        { id: 2, name: 'Jane Smith' }
      ]
    });
  }

  @Get({ path: '/:id' })
  async getUserById(context: Context) {
    const id = context.getParam('id');
    return context.send({
      message: `User with ID: ${id}`,
      user: { id, name: 'John Doe' }
    });
  }
}
```

Restart the development server:

```bash
asena dev start
```

You should see the new routes registered:

```
2025-10-15 14:35:27 [info]:   Controller: UserController found:
2025-10-15 14:35:27 [info]:   Successfully registered GET route for PATH: /users
2025-10-15 14:35:27 [info]:   Successfully registered GET route for PATH: /users/:id
2025-10-15 14:35:27 [info]:   Controller: UserController successfully registered.
```

Test the new endpoints:

```bash
# Get all users
curl http://localhost:3000/users

# Get user by ID
curl http://localhost:3000/users/1
```

::: info Controller Names in Output
Controller names are visible in logs when `buildOptions.minify.identifiers` is set to `false` in `asena.config.ts`.
:::

## Step 5: Create a Service

Generate a service for business logic:

```bash
asena g s
```

Enter the service name:

```bash
✔ Enter service name: User
```

Edit `src/services/UserService.ts`:

```typescript
import { Service } from '@asenajs/asena/server';

interface User {
  id: number;
  name: string;
  email: string;
}

@Service()
export class UserService {
  private users: User[] = [
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
  ];

  async getAllUsers(): Promise<User[]> {
    return this.users;
  }

  async getUserById(id: number): Promise<User | undefined> {
    return this.users.find(user => user.id === id);
  }

  async createUser(name: string, email: string): Promise<User> {
    const newUser: User = {
      id: this.users.length + 1,
      name,
      email
    };
    this.users.push(newUser);
    return newUser;
  }
}
```

Update your controller to use the service:

```typescript
import { Controller } from '@asenajs/asena/server';
import { Get, Post } from '@asenajs/asena/web';
import { Inject } from '@asenajs/asena/ioc';
import type { Context } from '@asenajs/ergenecore/types';
import { UserService } from '../services/UserService';

@Controller('/users')
export class UserController {
  @Inject(UserService)
  private userService: UserService;

  @Get({ path: '/' })
  async getAllUsers(context: Context) {
    const users = await this.userService.getAllUsers();
    return context.send({ users });
  }

  @Get({ path: '/:id' })
  async getUserById(context: Context) {
    const id = parseInt(context.getParam('id'));
    const user = await this.userService.getUserById(id);

    if (!user) {
      return context.send({ error: 'User not found' }, 404);
    }

    return context.send({ user });
  }

  @Post({ path: '/' })
  async createUser(context: Context) {
    const { name, email } = await context.getBody();
    const user = await this.userService.createUser(name, email);
    return context.send({ user }, 201);
  }
}
```

Test the new endpoints:

```bash
# Get all users
curl http://localhost:3000/users

# Get user by ID
curl http://localhost:3000/users/1

# Create a new user
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Bob Johnson","email":"bob@example.com"}'
```

## Step 6: Build for Production

Build your project:

```bash
asena build
```

Output:

```
Build completed successfully.
Output: dist/index.js
```

The build files are in the `dist/` directory (configured in `asena.config.ts`).

Run the production build:

```bash
bun dist/index.js
```

::: tip Build Output
The CLI automatically discovers and bundles all your components. No manual imports needed!
:::

## Step 7: Add Middleware (Optional)

Generate a middleware:

```bash
asena g m
```

Enter the middleware name:

```bash
✔ Enter middleware name: Logger
```

Edit `src/middlewares/LoggerMiddleware.ts`:

```typescript
import { Middleware } from '@asenajs/asena/server';
import { MiddlewareService, type Context } from '@asenajs/ergenecore';

@Middleware()
export class LoggerMiddleware extends MiddlewareService {
  async handle(context: Context, next: () => Promise<void>) {
    const start = Date.now();
    const method = context.getRequest().method;
    const url = context.getRequest().url;

    console.log(`[${method}] ${url} - Started`);

    await next();

    const duration = Date.now() - start;
    console.log(`[${method}] ${url} - Completed in ${duration}ms`);
  }
}
```

Apply it to your controller:

```typescript
@Controller('/users', { middlewares: [LoggerMiddleware] })
export class UserController {
  // ... your routes
}
```

## Project Structure

Your project should now look like this:

```
my-asena-app/
├── src/
│   ├── controllers/
│   │   ├── AsenaController.ts    # Default controller
│   │   └── UserController.ts     # Your controller
│   ├── services/
│   │   └── UserService.ts        # Your service
│   ├── middlewares/
│   │   └── LoggerMiddleware.ts   # Your middleware
│   └── index.ts                  # Entry point
├── dist/                         # Build output
├── asena.config.ts               # CLI configuration
├── package.json
└── tsconfig.json
```

## Next Steps

Now that you've created your first Asena application:

- Learn about [Controllers](/docs/concepts/controllers)
- Explore [Services](/docs/concepts/services)
- Understand [Middleware](/docs/concepts/middleware)
- Set up [Database integration](/docs/packages/drizzle)
- Configure [WebSocket](/docs/concepts/websocket)
- Deploy to [Production](/docs/guides/deployment)

---

**Related Documentation:**
- [CLI Commands](/docs/cli/commands) - All CLI commands
- [CLI Configuration](/docs/cli/configuration) - Configure your project
- [Get Started Guide](/docs/get-started) - Complete guide
- [Adapters](/docs/adapters/overview) - Learn about adapters
