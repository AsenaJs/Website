---
title: CLI Commands
description: Reference for every CLI command - create, generate, dev start, build and init, including shortcuts
outline: deep
---

# CLI Commands

Asena CLI provides command-line utilities to help you manage your Asena applications efficiently.

## Installation

**Prerequisite:** [Bun runtime](https://bun.sh) (v1.3.12 or higher)

```bash
bun install -g @asenajs/asena-cli
```

Verify installation:

```bash
asena --version
```

## asena create

Bootstrap a new Asena project with a complete development environment setup.

### Features

- **Interactive Setup** - User-friendly setup experience with inquirer
- **Non-Interactive Mode** - Support for SSH and CI/CD environments with CLI arguments
- **Multi-Adapter Support** - Choose between Hono or Ergenecore adapters
- **Project Structure** - Creates complete project structure with necessary files
- **Default Components** - Generates default controller and server setup
- **Development Tools** - Optional ESLint and Prettier integration
- **Dependency Management** - Automatically installs required dependencies

### Usage

**Interactive Mode** (prompts for all options):

```bash
asena create
# or create in current directory
asena create .
```

::: warning SSH Connection Issue
Interactive prompts may not work properly over SSH connections or in non-TTY environments (CI/CD pipelines). Use non-interactive mode instead.
:::

**Non-Interactive Mode** (specify options via CLI arguments):

```bash
# Create with all features enabled
asena create my-project --adapter=hono --logger --eslint --prettier

# Create in current directory without optional features
asena create . --adapter=ergenecore --no-logger --no-eslint --no-prettier

# Mix of CLI arguments and interactive prompts
asena create my-app --adapter=hono  # Will prompt for remaining options
```

### CLI Options

| Option | Description | Values | Default |
|:-------|:------------|:-------|:--------|
| `[project-name]` | Project name (use `.` for current directory) | Any string | Prompted |
| `--adapter <adapter>` | Adapter to use | `hono`, `ergenecore` | Prompted |
| `--logger` / `--no-logger` | Setup Asena logger | boolean | `true` |
| `--eslint` / `--no-eslint` | Setup ESLint | boolean | `true` |
| `--prettier` / `--no-prettier` | Setup Prettier | boolean | `true` |

### Interactive Prompts

When using interactive mode without CLI arguments:

```bash
✔ Enter your project name: my-asena-app
✔ Select adapter: Ergenecore
✔ Do you want to setup logger? Yes
✔ Do you want to setup ESLint? Yes
✔ Do you want to setup Prettier? Yes
⠙ Creating asena project...
```

### Generated Project Structure

```
my-asena-app/
├── src/
│   ├── controllers/
│   │   └── AsenaController.ts   # Sample controller
│   ├── logger/
│   │   └── logger.ts            # Only when the logger option is enabled
│   └── index.ts                 # Application entry point
├── .asena/
│   ├── config.json              # Adapter + suffix settings used by `asena generate`
│   └── config.schema.json
├── asena-config.ts              # Build configuration
├── package.json
├── tsconfig.json
├── .gitignore
├── eslint.config.cjs            # Only when ESLint is enabled
├── .prettierrc.js               # Only when Prettier is enabled
└── .prettierignore              # Only when Prettier is enabled
```

::: info Directories are created on demand
`asena create` does not pre-create `services/`, `middlewares/`, `config/`, `namespaces/`,
`tests/` or `public/`. `asena generate` creates the folder it needs the first time you use
it. Folder layout is a convention only - the component scanner walks the whole
`sourceFolder` tree and finds components wherever they live.
:::

## asena generate

Quickly and consistently create project components with proper structure and imports.

**Shortcut:** `asena g`

### Features

- **Multi-Component Support** - Generate controllers, services, middlewares, configs, and websockets
- **Automatic Code Generation** - Creates template code with base structure and necessary imports
- **Adapter-Aware** - Generates adapter-specific code based on project configuration
- **Suffix Configuration** - Customize component naming conventions (see [Suffix Configuration](/docs/cli/suffix-configuration))
- **Project Structure Integration** - Places files in the correct directories
- **Command Shortcuts** - Faster usage with aliases

### Commands

| Component  | Full Command                | Shortcut      | Description                 |
|:-----------|:----------------------------|:--------------|:----------------------------|
| Controller | `asena generate controller` | `asena g c`   | Generates a controller      |
| Service    | `asena generate service`    | `asena g s`   | Generates a service         |
| Middleware | `asena generate middleware` | `asena g m`   | Generates a middleware      |
| Validator  | `asena generate validator`  | `asena g v`   | Generates a Zod validator   |
| Config     | `asena generate config`     | `asena g config` | Generates a server config |
| WebSocket  | `asena generate websocket`  | `asena g ws`  | Generates a WebSocket namespace |

### Examples

#### Generate Controller

```bash
asena g c
# or
asena generate controller
```

**Prompt:**
```bash
✔ Enter controller name: User
```

**Generated:** `src/controllers/UserController.ts`

```typescript
import { Controller } from '@asenajs/asena/decorators';
import { Get } from '@asenajs/asena/decorators/http';
import type { Context } from '@asenajs/ergenecore';

@Controller()
export class UserController {

}
```

::: tip The body is intentionally empty
The generator scaffolds the class and its imports only - add the path and your routes
yourself, e.g. `@Controller('/users')` with a `@Get('/')` handler.
:::

#### Generate Service

```bash
asena g s
# or
asena generate service
```

**Prompt:**
```bash
✔ Enter service name: User
```

**Generated:** `src/services/UserService.ts`

```typescript
import { Service } from '@asenajs/asena/decorators';

@Service()
export class UserService {

}
```

#### Generate Middleware

```bash
asena g m
# or
asena generate middleware
```

**Prompt:**
```bash
✔ Enter middleware name: Auth
```

**Generated:** `src/middlewares/AuthMiddleware.ts`

```typescript
import { Middleware } from '@asenajs/asena/decorators';
import { MiddlewareService, type Context } from '@asenajs/ergenecore';

@Middleware()
export class AuthMiddleware extends MiddlewareService {

  public async handle(context: Context, next: () => Promise<void>) {
    context.setValue('testValue', 'test');
    await next();
  }

}
```

::: warning Replace the placeholder body
The scaffolded `handle()` is a smoke-test stub. Real middleware should be `async`, take
`next: () => Promise<void>`, and `await next()`.
:::

#### Generate Config

```bash
asena g config
# or
asena generate config
```

**Prompt:**
```bash
✔ Enter config name: Server
```

**Generated:** `src/config/ServerConfig.ts`

```typescript
import { Config } from '@asenajs/asena/decorators';
import { ConfigService, type Context } from '@asenajs/ergenecore';

@Config()
export class ServerConfig extends ConfigService {

  public onError(error: Error, context: Context): Response | Promise<Response> {
    console.error('Error:', error.message);

    return context.send({ error: error.message }, 500);
  }

}
```

#### Generate WebSocket

```bash
asena g ws
# or
asena generate websocket
```

**Prompt:**
```bash
✔ Enter websocket namespace name: Chat
```

**Generated:** `src/namespaces/ChatNamespace.ts`

```typescript
import { WebSocket } from '@asenajs/asena/decorators';
import { AsenaWebSocketService, type Socket } from '@asenajs/asena/web-socket';

@WebSocket({ path: '/chat', name: 'ChatNamespace' })
export class ChatNamespace extends AsenaWebSocketService {

  protected async onOpen(ws: Socket): Promise<void> {
    console.log('Client connected');
  }

  protected async onMessage(ws: Socket, message: string): Promise<void> {
    console.log('Message received:', message);
  }

  protected async onClose(ws: Socket): Promise<void> {
    console.log('Client disconnected');
  }

}
```

::: info Adapter-agnostic
WebSocket namespaces are generated the same way for both adapters - the base class and
`Socket` type come from `@asenajs/asena/web-socket`, not from the adapter package.
:::

::: tip Adapter-Specific Generation
The CLI automatically detects your adapter (Ergenecore or Hono) from `asena-config.ts` and generates appropriate imports and base classes.
:::

## asena dev start

Start the application in development mode with automatic building.

### Features

- **Automatic Build** - Builds the project before starting
- **Component Registration** - Automatically registers all controllers, services, and middlewares
- **Single Build + Run** - Builds once, then runs the bundle. `asena dev start` takes no options and does **not** watch for changes; use the scaffolded `bun run dev:hot` (`bun run --hot src/index.ts`) while iterating.

### Usage

```bash
asena dev start
```

### Output

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
2025-10-15 14:30:20 [info]:   Controller: UserController found:
2025-10-15 14:30:20 [info]:   Successfully registered GET route for PATH: /users
2025-10-15 14:30:20 [info]:   Controller: UserController successfully registered.
2025-10-15 14:30:20 [info]:   Server started on port 3000
```

::: info Controller Names in Output
Controller names are visible in logs when `buildOptions.minify.identifiers` is set to `false` in `asena-config.ts`.
:::

## asena build

Build the project for production deployment.

### Features

- **Configuration Processing** - Reads and processes `asena-config.ts`
- **Code Generation** - Creates a temporary build file combining all components
- **Import Management** - Automatically organizes imports based on project structure
- **Server Integration** - Integrates all components with AsenaServer
- **No Manual Registration** - Controllers are automatically discovered and registered

### Usage

```bash
asena build
```

### Build Process

1. Reads `asena-config.ts`
2. Scans source folder for controllers, services, middlewares, configs, and websockets
3. Generates a temporary build file with all imports
4. Bundles the application using Bun's bundler
5. Outputs compiled files to `buildOptions.outdir` (CLI default `./out`; the scaffolded `asena-config.ts` sets `dist`)

### Build Output

```
Build completed successfully.
Output: dist/index.asena.js
```

::: tip Production Deployment
After building, you can run your application with:
```bash
bun dist/index.asena.js
```
:::

## asena init

Initialize an existing project with Asena configuration.

### Features

- **Configuration Generation** - Creates `asena-config.ts`
- **Default Values** - Provides sensible defaults for quick start
- **No Need if Using `create`** - Not required if you used `asena create`

### Usage

```bash
asena init
```

### Generated Configuration

Creates `asena-config.ts`:

```typescript
import { defineConfig } from '@asenajs/asena-cli';

export default defineConfig({
  sourceFolder: 'src',
  rootFile: 'src/index.ts',
  // include: ['public'], // Directories/files to copy into outdir during build
  buildOptions: {
    outdir: 'dist',
    minify: {
      whitespace: true,
      syntax: true,
      identifiers: false, //It's better for you to make this false for better debugging during the running phase of the application.
      keepNames: true
    },
  },
});
```

::: tip Why `identifiers: false` and `keepNames: true`
Component registration is name-based. Minifying identifiers would rename your classes and
break `@Inject('UserService')` lookups at runtime.
:::

::: info When to Use `asena init`
Use `asena init` when:
- Adding Asena to an existing project
- Manually setting up a project without `asena create`
- Resetting configuration to defaults
:::

## Command Reference

### Quick Reference

| Command              | Shortcut        | Description                          |
|:---------------------|:----------------|:-------------------------------------|
| `asena create`       | -               | Create a new Asena project           |
| `asena generate`     | `asena g`       | Generate project components          |
| `asena generate controller` | `asena g c` | Generate a controller         |
| `asena generate service` | `asena g s`    | Generate a service            |
| `asena generate middleware` | `asena g m` | Generate a middleware         |
| `asena generate config` | `asena g config` | Generate a config          |
| `asena generate websocket` | `asena g ws` | Generate a WebSocket namespace |
| `asena dev start`    | -               | Start development server             |
| `asena build`        | -               | Build for production                 |
| `asena init`         | -               | Initialize configuration             |
| `asena --version`    | `asena -V`      | Show CLI version                     |
| `asena --help`       | `asena -h`      | Show help                            |

## Related Documentation

- [Configuration](/docs/cli/configuration) - CLI configuration options
- [Suffix Configuration](/docs/cli/suffix-configuration) - Component naming conventions
- [CLI Examples](/docs/cli/examples) - See complete project examples
- [Controllers](/docs/concepts/controllers) - Controller patterns
- [Services](/docs/concepts/services) - Service patterns
- [Middleware](/docs/concepts/middleware) - Middleware patterns
- [WebSocket](/docs/concepts/websocket) - WebSocket patterns

---

**Next Steps:**
- Learn about [CLI Configuration](/docs/cli/configuration)
- See [CLI Examples](/docs/cli/examples) for project structure
- Understand [Controllers](/docs/concepts/controllers)
