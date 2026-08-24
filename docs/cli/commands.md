---
title: CLI Commands
description: Reference for every CLI command - create, generate, dev start, build, init and doctor, including shortcuts
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
- **Wrapper Entry** - Bundles through a temporary wrapper created **outside** your source folder; your entry file is never rewritten and its module-level code is not executed at build time
- **Import Management** - Detected components are handed to the server through the build component list. No manual imports needed
- **User-Owned `components:`** - A hand-written `components: [...]` array in your entry is left alone and, when non-empty, wins over the build's list

### Usage

```bash
asena build
```

### Build Process

1. Reads `asena-config.ts`
2. Scans the source folder for controllers, services, middlewares, configs and websockets
3. Writes a temporary wrapper entry in the OS temp directory: it imports every scanned component, publishes them on `globalThis[Symbol.for('asena.buildComponents')]`, then imports your entry file
4. Bundles that wrapper with Bun's bundler and deletes the temporary files
5. Outputs the bundle to `buildOptions.outdir` (CLI default `./out`; the scaffolded `asena-config.ts` sets `dist`)

The output is always `<outdir>/index.asena.js`, whatever your entry file is called.

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

::: warning Upgrading from asena-cli 0.x builds
The build used to rewrite your entry file: it parsed the `AsenaServerFactory.create({...})` call
and injected a `components: [...]` array into it. That imposed formatting rules nobody could see
in the source — the call had to match an exact shape, the options object could not contain
comments, the factory token could appear only once — and it executed the entry's module-level
code at build time ([#25](https://github.com/AsenaJs/Asena-cli/issues/25)).

The wrapper entry removes all of it. **What you need to know:**

- **Your entry file is untouched.** Any formatting, any comments, arbitrary code around the
  bootstrap call — all fine now.
- **A `components: [...]` array you wrote is yours.** It is no longer overwritten, and a
  non-empty one takes precedence over the build's list. Delete it to let the build supply the
  components; keep it to pin them by hand. See
  [Which source wins](/docs/concepts/dependency-injection#which-source-wins).
- **This requires `@asenajs/asena` 0.11 or newer.** That is the first core version that reads
  the build component list. On an older core the bundle falls back to the filesystem scan and
  dies in production with `No components or configuration found`, so the CLI declares
  `^0.11.0`.
- **`minify.identifiers` is forced off.** See below.
:::

### Minification and component names

Component registration is name-based: `@Inject('UserService')` and
`@Repository({ databaseService: 'MainDb' })` look their target up by the class's runtime `.name`.
Minifying identifiers renames the class, and the component registers under the mangled name — the
lookup then fails in production and only in production.

So when `buildOptions.minify` enables identifier minification, **the build turns it off** and says
so:

```
[build] minify.identifiers disabled: component names are read at runtime
```

`minify: true` (which implies all three flags) is likewise narrowed to
`{ whitespace: true, syntax: true, identifiers: false }`. Whitespace and syntax minification are
untouched — they are where the size win is anyway.

::: danger `keepNames` does not save you
`keepNames: true` looks like the answer and is not: Bun's bundler (measured on 1.4.0) does **not**
preserve class names under identifier minification, whether `keepNames` sits inside `minify` or
beside it. The only rule that works is `identifiers: false`, which is what `asena init` writes and
what the build now enforces. `keepNames` is harmless — leave it or drop it — but do not treat it
as a safeguard.

[`asena doctor`](#asena-doctor) flags a config that enables identifier minification, so a project
that hand-edits `asena-config.ts` finds out before the deploy rather than after it.
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

::: tip Why `identifiers: false`
Component registration is name-based. Minifying identifiers renames your classes and breaks
`@Inject('UserService')` lookups at runtime. `keepNames: true` is written alongside it for
readable stack traces, but it is **not** what protects the component names — see
[Minification and component names](#minification-and-component-names).
:::

::: info When to Use `asena init`
Use `asena init` when:
- Adding Asena to an existing project
- Manually setting up a project without `asena create`
- Resetting configuration to defaults
:::

## asena doctor

Check the current project for common static configuration mistakes that the other commands do not
catch. It is **read-only** — it reports and never modifies anything.

### Usage

```bash
asena doctor        # one line per check
asena doctor --json # the result array as JSON
```

The exit code is `1` when any check failed and `0` otherwise, so it drops straight into CI.

### Checks

| Check | What it verifies |
|:------|:-----------------|
| `tsconfig-decorators` | `experimentalDecorators` and `emitDecoratorMetadata` are both `true` in `tsconfig.json` |
| `asena-config` | An `asena-config.ts` is found and importable, its `rootFile` and `sourceFolder` exist on disk, and `minify.identifiers` is not enabled |
| `direct-dependencies` | `@asenajs/asena` and `reflect-metadata` are direct dependencies, plus `hono` / `zod` when the matching adapter is installed — they are [peer dependencies](/docs/adapters/overview) your project owns |
| `duplicate-packages` | `@asenajs/asena`, `hono` and `zod` each resolve to a single version under `node_modules` (including the `.bun` store) |
| `peer-ranges` | Every installed `@asenajs/*` package's peer range for `@asenajs/asena` is satisfied by the installed core version |

### Output

```
✓ tsconfig-decorators — experimentalDecorators and emitDecoratorMetadata are enabled
✗ asena-config — minify.identifiers drops component names that are read at runtime (keepNames does not preserve them)
  hint: disable identifier minification: minify: { whitespace: true, syntax: true, identifiers: false }
✓ direct-dependencies — all required packages are direct dependencies
✓ duplicate-packages — @asenajs/asena@0.11.0, hono@4.12.9, zod@4.4.3
✓ peer-ranges — all @asenajs/* peer ranges are satisfied by @asenajs/asena@0.11.0
```

A failing check prints an indented `hint:` line with the fix. A check that cannot run at all — no
`tsconfig.json`, unparsable JSON — reports as a failure explaining why rather than throwing.

::: tip Why `duplicate-packages` is worth a check of its own
Two installed copies of `@asenajs/asena`, `hono` or `zod` break every `instanceof`-shaped test in
the framework — most visibly the [`HttpException` brand](/docs/guides/error-handling), which stops
matching and turns a deliberate `404` into a `500`. The symptom never points at the cause. This
check is the fastest way to rule it in or out.
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
| `asena doctor`       | -               | Check the project for configuration mistakes |
| `asena --version`    | `asena -V`      | Show CLI version                     |
| `asena --help`       | `asena -h`      | Show help                            |

## Related

- [Configuration](/docs/cli/configuration) - CLI configuration options
- [Suffix Configuration](/docs/cli/suffix-configuration) - Component naming conventions
- [CLI Examples](/docs/cli/examples) - See complete project examples
- [Controllers](/docs/concepts/controllers) - Controller patterns
- [Services](/docs/concepts/services) - Service patterns
- [Middleware](/docs/concepts/middleware) - Middleware patterns
- [WebSocket](/docs/concepts/websocket) - WebSocket patterns
