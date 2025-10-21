---
title: CLI Configuration
description: Complete reference for asena.config.ts configuration file
outline: deep
---

# CLI Configuration

All Asena projects come with an `asena.config.ts` file for project configuration. This file controls how the CLI builds, develops, and manages your project.

## defineConfig Helper

Use the `defineConfig` helper for type-safe configuration:

```typescript
import { defineConfig } from '@asenajs/asena-cli';

export default defineConfig({
  // Your configuration here
});
```

## Configuration Options

### Complete Configuration Interface

```typescript
interface AsenaConfig {
  sourceFolder: string;           // Source code directory
  rootFile: string;                // Application entry point
  buildOptions?: BuildOptions;     // Optional Bun bundler options
}

/**
 * BuildOptions is a subset of Bun's BuildConfig.
 * Only backend-relevant options are exposed.
 */
type BuildOptions = Partial<
  Pick<
    Bun.BuildConfig,
    'outdir' | 'sourcemap' | 'minify' | 'external' | 'format' | 'drop'
  >
>;
```

## Default Configuration

When you create a project with `asena create` or run `asena init`, this default configuration is generated:

```typescript
import { defineConfig } from '@asenajs/asena-cli';

export default defineConfig({
  sourceFolder: 'src',
  rootFile: 'src/index.ts',
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

## Configuration Properties

### sourceFolder

**Type:** `string`
**Default:** `'src'`

Specifies the source code directory where Asena looks for components (controllers, services, middlewares, configs, websockets).

```typescript
export default defineConfig({
  sourceFolder: 'src', // Asena scans src/ for components
});
```

::: tip Component Discovery
The CLI automatically discovers and registers all decorated classes in this folder:
- `@Controller` classes in `sourceFolder/controllers/`
- `@Service` classes in `sourceFolder/services/`
- `@Middleware` classes in `sourceFolder/middlewares/`
- `@Config` classes in `sourceFolder/config/`
- `@Websocket` classes in `sourceFolder/namespaces/`
:::

### rootFile

**Type:** `string`
**Default:** `'src/index.ts'`

Specifies the application entry point file where your server is initialized.

```typescript
export default defineConfig({
  rootFile: 'src/index.ts', // Entry point for the application
});
```

**Example rootFile (`src/index.ts`):**

```typescript
import { AsenaServerFactory } from '@asenajs/asena';
import { createErgenecoreAdapter } from '@asenajs/ergenecore/factory';
import { AsenaLogger } from '@asenajs/asena-logger';

const logger = new AsenaLogger();
const adapter = createErgenecoreAdapter();

const server = await AsenaServerFactory.create({
  adapter,
  logger,
  port: 3000
});

await server.start();
```

### buildOptions

**Type:** `BuildOptions` (optional)
**Default:** `{ outdir: './out' }` if not specified

Configuration options for Bun's bundler. Asena exposes only backend-relevant build options from Bun's `BuildConfig`.

::: info Managed Internally
The `entrypoints` and `target` properties are managed internally by Asena CLI and cannot be configured by users. Asena always builds for the `bun` target since it's a Bun-native backend framework.
:::

**Available BuildOptions:**
- `outdir` - Output directory for compiled files
- `sourcemap` - Source map generation strategy
- `minify` - Code minification options
- `external` - Dependencies to exclude from bundling
- `format` - Output module format (ESM/CJS)
- `drop` - Remove function calls from bundle (e.g., `console`, `debugger`)

## Build Options Reference

### outdir

**Type:** `string`
**Default:** `'dist'`

Output directory for compiled files.

```typescript
export default defineConfig({
  buildOptions: {
    outdir: 'dist', // Build output to dist/
  },
});
```

### sourcemap

**Type:** `'none' | 'inline' | 'external' | 'linked'`
**Default:** Not set (optional)

Controls source map generation for debugging:

- `'none'` - No source maps
- `'inline'` - Embedded in output file
- `'external'` - Separate .map files
- `'linked'` - Separate .map files with links

```typescript
export default defineConfig({
  buildOptions: {
    sourcemap: 'linked', // For debugging with linked source maps
  },
});
```

::: tip Development vs Production
- **Development:** Use `'linked'` or `'external'` for debugging
- **Production:** Use `'none'` for smaller bundle size
:::

### format

**Type:** `'esm' | 'cjs'`
**Default:** `'esm'` (Bun's default)

Specifies the output module format.

```typescript
export default defineConfig({
  buildOptions: {
    format: 'esm', // ES modules (recommended for Bun)
  },
});
```

::: tip
Asena works best with ESM format since Bun has native ESM support. CJS is supported but not recommended unless you have specific compatibility requirements.
:::

### external

**Type:** `string[]`
**Default:** `[]` (empty array)

List of dependencies that should not be bundled into the output. Useful for native modules or dependencies that should be resolved at runtime.

```typescript
export default defineConfig({
  buildOptions: {
    external: ['pg', 'mysql2', 'better-sqlite3'], // Don't bundle database drivers
  },
});
```

**Common use cases:**
- Native Node.js modules (e.g., `fs`, `path` - though Bun handles these)
- Database drivers with native bindings
- Large dependencies that should be installed separately

::: warning Native Dependencies
Some packages with native bindings (like `better-sqlite3`) must be marked as external to work correctly.
:::

### drop

**Type:** `string[]`
**Default:** `[]` (empty array)

Removes specified function calls from the bundle during build. Commonly used to strip debugging code in production.

```typescript
export default defineConfig({
  buildOptions: {
    drop: ['console', 'debugger'], // Remove all console calls and debugger statements
  },
});
```

**Common values:**
- `'console'` - Removes all `console.*` calls
- `'debugger'` - Removes `debugger` statements
- Custom identifiers like `'logger.debug'`

::: danger Side Effects Warning
The `drop` option removes the entire call expression, including arguments, even if they have side effects. For example, `drop: ['console']` will turn `console.log(doSomething())` into nothing, so `doSomething()` will never execute.
:::

**Example - Production build:**

```typescript
export default defineConfig({
  sourceFolder: 'src',
  rootFile: 'src/index.ts',
  buildOptions: {
    outdir: 'dist',
    sourcemap: 'none',
    minify: true,
    drop: ['console', 'debugger'], // Clean production output
  },
});
```

### minify

**Type:** `boolean | MinifyOptions`
**Default:** `{ whitespace: true, syntax: true, identifiers: false, keepNames: true }`

Controls code minification for smaller bundle sizes.

#### Boolean Mode

```typescript
export default defineConfig({
  buildOptions: {
    minify: true, // Enable all minification
  },
});
```

#### Fine-Grained Control

```typescript
export default defineConfig({
  buildOptions: {
    minify: {
      whitespace: true,   // Remove unnecessary whitespace
      syntax: true,       // Apply smart condensation transforms
      identifiers: false, // Keep original variable/function names
      keepNames: true     // Preserve function and class names
    },
  },
});
```

**Minify Options:**

| Option        | Type      | Description                                    |
|:--------------|:----------|:-----------------------------------------------|
| `whitespace`  | `boolean` | Removes unnecessary whitespace and newlines    |
| `syntax`      | `boolean` | Applies syntax-level optimizations             |
| `identifiers` | `boolean` | Renames variables/functions to shorter names   |
| `keepNames`   | `boolean` | Preserves function and class names for debugging |

::: warning identifiers and Debugging
Setting `identifiers: true` makes debugging harder because:
- Controller names become unreadable in logs
- Stack traces show minified names
- Hot reload becomes less predictable

**Recommendation:** Keep `identifiers: false` in development, set to `true` only in production if bundle size is critical.
:::

## Environment-Specific Configuration

You can create environment-specific configurations:

### Development Configuration

```typescript
// asena.config.dev.ts
import { defineConfig } from '@asenajs/asena-cli';

export default defineConfig({
  sourceFolder: 'src',
  rootFile: 'src/index.ts',
  buildOptions: {
    outdir: 'dist',
    sourcemap: 'linked',  // Full debugging support
    minify: {
      whitespace: false,  // Keep readable
      syntax: false,
      identifiers: false, // Keep original names
    },
    drop: [], // Keep all console logs for debugging
  },
});
```

### Production Configuration

```typescript
// asena.config.prod.ts
import { defineConfig } from '@asenajs/asena-cli';

export default defineConfig({
  sourceFolder: 'src',
  rootFile: 'src/index.ts',
  buildOptions: {
    outdir: 'dist',
    sourcemap: 'none',    // No source maps
    minify: {
      whitespace: true,   // Minimize size
      syntax: true,
      identifiers: true,  // Shorten names
    },
    drop: ['console', 'debugger'], // Remove debugging code
  },
});
```

**Usage:**

```bash
# Development
cp asena.config.dev.ts asena.config.ts
asena dev start

# Production
cp asena.config.prod.ts asena.config.ts
asena build
```

## Advanced Build Options

Asena exposes backend-relevant build options from Bun's bundler. Here are some common advanced configurations:

### Custom Entry Points

```typescript
export default defineConfig({
  sourceFolder: 'src',
  rootFile: 'src/server.ts', // Custom entry point
  buildOptions: {
    outdir: 'build',
  },
});
```

### Production-Optimized Build

```typescript
export default defineConfig({
  sourceFolder: 'src',
  rootFile: 'src/index.ts',
  buildOptions: {
    outdir: 'dist',
    format: 'esm',
    sourcemap: 'none',
    minify: true,
    drop: ['console', 'debugger'], // Strip debugging code
  },
});
```

### External Dependencies

```typescript
export default defineConfig({
  sourceFolder: 'src',
  rootFile: 'src/index.ts',
  buildOptions: {
    outdir: 'dist',
    external: ['pg', 'mysql2', 'better-sqlite3'], // Don't bundle native modules
  },
});
```

## Configuration Examples

### Minimal Configuration

```typescript
import { defineConfig } from '@asenajs/asena-cli';

export default defineConfig({
  sourceFolder: 'src',
  rootFile: 'src/index.ts',
  buildOptions: {
    outdir: 'dist',
  },
});
```

### Monorepo Configuration

```typescript
import { defineConfig } from '@asenajs/asena-cli';

export default defineConfig({
  sourceFolder: 'packages/api/src',
  rootFile: 'packages/api/src/index.ts',
  buildOptions: {
    outdir: 'packages/api/dist',
    sourcemap: 'linked',
    format: 'esm',
  },
});
```

### Docker-Optimized Configuration

```typescript
import { defineConfig } from '@asenajs/asena-cli';

export default defineConfig({
  sourceFolder: 'src',
  rootFile: 'src/index.ts',
  buildOptions: {
    outdir: '/app/dist',
    sourcemap: 'none',
    minify: true,
    drop: ['console', 'debugger'], // Clean production logs
  },
});
```

## Bun Bundler Options

Asena uses Bun's bundler under the hood and exposes only the options relevant for backend framework builds.

::: info
The `entrypoints` and `target` are managed internally by Asena CLI. All exposed options are **optional** (wrapped in `Partial<>`).
:::

**Supported BuildOptions:**

| Option        | Type                  | Description                                      | Reference                                                |
|:--------------|:----------------------|:-------------------------------------------------|:---------------------------------------------------------|
| `outdir`      | `string`              | Output directory for compiled files              | [Bun Docs](https://bun.com/docs/bundler#outdir)           |
| `sourcemap`   | `'none' \| 'inline' \| 'external' \| 'linked'` | Source map generation strategy | [Bun Docs](https://bun.com/docs/bundler#sourcemap) |
| `minify`      | `boolean \| MinifyOptions`   | Code minification options             | [Bun Docs](https://bun.com/docs/bundler#minify)           |
| `external`    | `string[]`            | Dependencies to exclude from bundling           | [Bun Docs](https://bun.com/docs/bundler#external)         |
| `format`      | `'esm' \| 'cjs'`      | Output module format                             | [Bun Docs](https://bun.com/docs/bundler#format)           |
| `drop`        | `string[]`            | Remove function calls (e.g., `console`, `debugger`) | [Bun Docs](https://bun.com/docs/bundler#drop)       |

::: warning Unsupported Options
Options like `target`, `entrypoints`, `splitting`, `define`, and `loader` are **not exposed** because they're either managed internally or not relevant for backend framework builds.
:::

For a complete reference of Bun's bundler capabilities, see the [Bun Bundler Documentation](https://bun.com/docs/bundler).

## Best Practices

### 1. Keep identifiers Unminified in Development

```typescript
// ✅ Good: Easy debugging
export default defineConfig({
  buildOptions: {
    minify: {
      identifiers: false, // See real controller names in logs
    },
  },
});
```

### 2. Use Linked Source Maps

```typescript
// ✅ Good: Balance between debugging and performance
export default defineConfig({
  buildOptions: {
    sourcemap: 'linked',
  },
});
```

### 3. Organize by Environment

```typescript
// ✅ Good: Clear separation
// - asena.config.dev.ts
// - asena.config.prod.ts
// - asena.config.ts (active config)
```

### 4. Document Custom Configuration

```typescript
// ✅ Good: Comments for team members
export default defineConfig({
  sourceFolder: 'src',
  rootFile: 'src/index.ts',
  buildOptions: {
    outdir: 'dist',
    // Keep identifiers readable for easier debugging
    minify: {
      identifiers: false,
    },
  },
});
```

## Troubleshooting

### Build Output Not Found

**Problem:** CLI can't find build output

**Solution:** Check `outdir` matches your expectations:

```typescript
export default defineConfig({
  buildOptions: {
    outdir: 'dist', // Make sure this directory exists
  },
});
```

### Controllers Not Discovered

**Problem:** Controllers not being registered

**Solution:** Ensure `sourceFolder` is correct:

```typescript
export default defineConfig({
  sourceFolder: 'src', // Must match your actual source directory
});
```

### Source Maps Not Working

**Problem:** Can't debug with source maps

**Solution:** Use `'linked'` or `'external'`:

```typescript
export default defineConfig({
  buildOptions: {
    sourcemap: 'linked', // Not 'none'
  },
});
```

## Related Documentation

- [CLI Commands](/docs/cli/commands) - Available CLI commands
- [CLI Examples](/docs/cli/examples) - See project structure examples
- [Deployment](/docs/guides/deployment) - Production deployment
- [Bun Bundler](https://bun.com/docs/bundler) - Complete bundler reference

---

**Next Steps:**
- Explore [CLI Commands](/docs/cli/commands)
- Learn about [Deployment](/docs/guides/deployment)
- See [CLI Examples](/docs/cli/examples) for project structure
