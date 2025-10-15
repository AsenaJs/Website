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
  buildOptions: BuildOptions;      // Bun bundler options
}
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
    sourcemap: 'linked',
    target: 'bun',
    minify: {
      whitespace: true,
      syntax: true,
      identifiers: false,
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

**Type:** `BuildOptions`
**Default:** See below

Configuration options for Bun's bundler. Asena supports all Bun bundler options.

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
**Default:** `'linked'`

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

### target

**Type:** `'bun' | 'node' | 'browser'`
**Default:** `'bun'`

Specifies the compilation target runtime.

```typescript
export default defineConfig({
  buildOptions: {
    target: 'bun', // Optimize for Bun runtime
  },
});
```

### minify

**Type:** `boolean | MinifyOptions`
**Default:** `{ whitespace: true, syntax: true, identifiers: false }`

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
    target: 'bun',
    minify: {
      whitespace: false,  // Keep readable
      syntax: false,
      identifiers: false, // Keep original names
    },
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
    target: 'bun',
    minify: {
      whitespace: true,   // Minimize size
      syntax: true,
      identifiers: true,  // Shorten names
    },
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

Asena supports all Bun bundler options. Here are some common advanced configurations:

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

### Multiple Output Formats

```typescript
export default defineConfig({
  sourceFolder: 'src',
  rootFile: 'src/index.ts',
  buildOptions: {
    outdir: 'dist',
    format: 'esm', // Output as ES modules
    splitting: true, // Code splitting
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
    external: ['pg', 'mysql2'], // Don't bundle these
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
    target: 'bun',
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
    target: 'bun',
    minify: true,
  },
});
```

## Bun Bundler Options

Asena uses Bun's bundler under the hood. For complete bundler options, see the [Bun Bundler Documentation](https://bun.sh/docs/bundler).

**Common Options:**

| Option        | Type                  | Description                          |
|:--------------|:----------------------|:-------------------------------------|
| `outdir`      | `string`              | Output directory                     |
| `sourcemap`   | `string`              | Source map generation                |
| `target`      | `string`              | Compilation target                   |
| `minify`      | `boolean \| object`   | Code minification                    |
| `format`      | `'esm' \| 'cjs'`      | Output format                        |
| `splitting`   | `boolean`             | Code splitting                       |
| `external`    | `string[]`            | External dependencies                |
| `define`      | `Record<string, string>` | Define constants                  |
| `loader`      | `Record<string, string>` | File loaders                      |

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
- [Bun Bundler](https://bun.sh/docs/bundler) - Complete bundler reference

---

**Next Steps:**
- Explore [CLI Commands](/docs/cli/commands)
- Learn about [Deployment](/docs/guides/deployment)
- See [CLI Examples](/docs/cli/examples) for project structure
