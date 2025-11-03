---
title: Static File Serving
description: Serve static files from your Asena application
outline: deep
---

# Static File Serving

Asena provides built-in support for serving static files through the `@StaticServe` decorator and `StaticServeService` base class.

::: danger BREAKING CHANGES IN v0.7.0
**This feature will undergo major changes in version 0.7.0.** The API and implementation described here may change significantly. If you're starting a new project, be prepared to update your static file serving implementation when v0.7.0 is released.
:::

## Quick Start

### 1. Create a Static Serve Middleware

Create a middleware class that extends `StaticServeService` and configure the root directory:

::: code-group
```typescript [Ergenecore]
import { StaticServe } from '@asenajs/asena/server';
import { StaticServeService, type Context } from '@asenajs/ergenecore';
import path from 'path';

@StaticServe({ root: path.join(process.cwd(), 'public') })
export class StaticServeMiddleware extends StaticServeService {

  public rewriteRequestPath(reqPath: string): string {
    // Remove /static prefix from path
    return reqPath.replace(/^\/static\/|^\/static/, '');
  }

  public onFound(filePath: string, _c: Context): void {
    console.log(`File served: ${filePath}`);
  }

  public onNotFound(reqPath: string, c: Context): void {
    console.log(`File not found: ${reqPath}`);
  }
}
```

```typescript [Hono]
import { StaticServe } from '@asenajs/asena/server';
import { StaticServeService, type Context } from '@asenajs/hono-adapter';
import path from 'path';

@StaticServe({ root: path.join(process.cwd(), 'public') })
export class StaticServeMiddleware extends StaticServeService {

  public rewriteRequestPath(reqPath: string): string {
    // Remove /static prefix from path
    return reqPath.replace(/^\/static\/|^\/static/, '');
  }

  public onFound(filePath: string, _c: Context): void {
    console.log(`File served: ${filePath}`);
  }

  public onNotFound(reqPath: string, c: Context): void {
    console.log(`File not found: ${reqPath}`);
  }
}
```
:::

### 2. Create a Controller for Static Routes

Create a controller that uses the middleware:

::: code-group
```typescript [Ergenecore]
import { Controller } from '@asenajs/asena/server';
import { Get } from '@asenajs/asena/web';
import { StaticServeMiddleware } from './middlewares/StaticServeMiddleware';

@Controller({ path: '/static' })
export class StaticController {

  @Get({ path: '/*', staticServe: StaticServeMiddleware })
  public static() {}
}
```

```typescript [Hono]
import { Controller } from '@asenajs/asena/server';
import { Get } from '@asenajs/asena/web';
import { StaticServeMiddleware } from './middlewares/StaticServeMiddleware';

@Controller({ path: '/static' })
export class StaticController {

  @Get({ path: '/*', staticServe: StaticServeMiddleware })
  public static() {}
}
```
:::

### 3. Create Your Public Directory

Create a `public` directory in your project root and add your static files:

```
your-project/
├── src/
│   ├── controllers/
│   │   └── StaticController.ts
│   └── middlewares/
│       └── StaticServeMiddleware.ts
└── public/
    ├── index.html
    ├── style.css
    ├── script.js
    └── images/
        └── logo.png
```

### 4. Access Your Static Files

Start your server and access files via the configured route:

```bash
# Access HTML files
curl http://localhost:3000/static/index.html

# Access CSS files
curl http://localhost:3000/static/style.css

# Access images
curl http://localhost:3000/static/images/logo.png
```

---

## Configuration

### `@StaticServe` Options

Configure the static serve middleware with the following options:

```typescript
@StaticServe({
  root: string;  // Root directory for static files (required)
})
```

| Option | Type | Description | Example |
|--------|------|-------------|---------|
| `root` | `string` | Absolute path to the directory containing static files | `path.join(process.cwd(), 'public')` |

**Example:**

```typescript
import path from 'path';

// Serve from 'public' directory
@StaticServe({ root: path.join(process.cwd(), 'public') })

// Serve from 'assets' directory
@StaticServe({ root: path.join(process.cwd(), 'assets') })

// Serve from custom path
@StaticServe({ root: '/var/www/static' })
```

---

## Lifecycle Hooks

The `StaticServeService` base class provides three lifecycle hooks for customizing static file serving behavior:

### `rewriteRequestPath(reqPath: string): string`

Transform the incoming request path before looking up the file. Useful for removing route prefixes or implementing custom path logic.

**Parameters:**
- `reqPath: string` - The original request path

**Returns:** `string` - The transformed path to use for file lookup

**Example:**

```typescript
public rewriteRequestPath(reqPath: string): string {
  console.log(`Original path: ${reqPath}`);

  // Remove /static prefix
  const rewritten = reqPath.replace(/^\/static\/|^\/static/, '');

  console.log(`Rewritten path: ${rewritten}`);
  return rewritten;
}
```

**Use Cases:**
- Remove route prefixes (`/static/file.js` → `file.js`)
- Add file extensions (`/page` → `/page.html`)
- Normalize paths (`/foo//bar` → `/foo/bar`)

---

### `onFound(filePath: string, c: Context): void | Promise<void>`

Called when a file is successfully found and served. Useful for logging, analytics, or custom headers.

**Parameters:**
- `filePath: string` - The absolute path to the file being served
- `c: Context` - The request context

**Example:**

```typescript
public onFound(filePath: string, c: Context): void {
  console.log(`✅ File served: ${filePath}`);

  // Add custom headers
  c.header('X-Served-By', 'Asena Static Serve');

  // Track analytics
  this.analytics.track('file_served', { path: filePath });
}
```

---

### `onNotFound(reqPath: string, c: Context): void | Promise<void>`

Called when a requested file is not found. Useful for logging 404s or implementing fallback logic.

**Parameters:**
- `reqPath: string` - The requested path that wasn't found
- `c: Context` - The request context

**Example:**

```typescript
public onNotFound(reqPath: string, c: Context): void {
  const pathname = new URL(c.req.url).pathname;
  console.log(`❌ File not found: ${reqPath}`);
  console.log(`   Accessed from: ${pathname}`);

  // Log 404s
  this.logger.warn('Static file not found', { path: reqPath });

  // Send custom 404 response (optional)
  c.status(404);
  c.json({ error: 'File not found' });
}
```

---

## Examples

### Basic Static File Server

Serve files from a public directory:

::: code-group
```typescript [Ergenecore]
import { StaticServe } from '@asenajs/asena/server';
import { StaticServeService, type Context } from '@asenajs/ergenecore';
import path from 'path';

@StaticServe({ root: path.join(process.cwd(), 'public') })
export class StaticServeMiddleware extends StaticServeService {

  public rewriteRequestPath(reqPath: string): string {
    return reqPath.replace(/^\/static\/|^\/static/, '');
  }

  public onFound(filePath: string, _c: Context): void {
    console.log(`Served: ${filePath}`);
  }

  public onNotFound(reqPath: string, _c: Context): void {
    console.log(`Not found: ${reqPath}`);
  }
}
```

```typescript [Hono]
import { StaticServe } from '@asenajs/asena/server';
import { StaticServeService, type Context } from '@asenajs/hono-adapter';
import path from 'path';

@StaticServe({ root: path.join(process.cwd(), 'public') })
export class StaticServeMiddleware extends StaticServeService {

  public rewriteRequestPath(reqPath: string): string {
    return reqPath.replace(/^\/static\/|^\/static/, '');
  }

  public onFound(filePath: string, _c: Context): void {
    console.log(`Served: ${filePath}`);
  }

  public onNotFound(reqPath: string, _c: Context): void {
    console.log(`Not found: ${reqPath}`);
  }
}
```
:::

```typescript
// Controller
@Controller({ path: '/static' })
export class StaticController {
  @Get({ path: '/*', staticServe: StaticServeMiddleware })
  public static() {}
}
```

**Usage:**
```bash
# http://localhost:3000/static/index.html
# Serves: public/index.html
```

---

### SPA with Fallback to index.html

Serve a Single Page Application with fallback routing:

::: code-group
```typescript [Ergenecore]
import { StaticServe } from '@asenajs/asena/server';
import { StaticServeService, type Context } from '@asenajs/ergenecore';
import path from 'path';
import { existsSync } from 'fs';

@StaticServe({ root: path.join(process.cwd(), 'dist') })
export class SPAStaticServe extends StaticServeService {

  public rewriteRequestPath(reqPath: string): string {
    const cleanPath = reqPath.replace(/^\/|^/, '');
    const fullPath = path.join(process.cwd(), 'dist', cleanPath);

    // If file doesn't exist and no extension, fallback to index.html
    if (!existsSync(fullPath) && !path.extname(cleanPath)) {
      return 'index.html';
    }

    return cleanPath;
  }

  public onFound(filePath: string, c: Context): void {
    // Cache static assets
    if (filePath.match(/\.(js|css|png|jpg|svg)$/)) {
      c.header('Cache-Control', 'public, max-age=31536000');
    }
  }

  public onNotFound(reqPath: string, c: Context): void {
    console.warn(`SPA: File not found - ${reqPath}`);
  }
}
```

```typescript [Hono]
import { StaticServe } from '@asenajs/asena/server';
import { StaticServeService, type Context } from '@asenajs/hono-adapter';
import path from 'path';
import { existsSync } from 'fs';

@StaticServe({ root: path.join(process.cwd(), 'dist') })
export class SPAStaticServe extends StaticServeService {

  public rewriteRequestPath(reqPath: string): string {
    const cleanPath = reqPath.replace(/^\/|^/, '');
    const fullPath = path.join(process.cwd(), 'dist', cleanPath);

    // If file doesn't exist and no extension, fallback to index.html
    if (!existsSync(fullPath) && !path.extname(cleanPath)) {
      return 'index.html';
    }

    return cleanPath;
  }

  public onFound(filePath: string, c: Context): void {
    // Cache static assets
    if (filePath.match(/\.(js|css|png|jpg|svg)$/)) {
      c.header('Cache-Control', 'public, max-age=31536000');
    }
  }

  public onNotFound(reqPath: string, c: Context): void {
    console.warn(`SPA: File not found - ${reqPath}`);
  }
}
```
:::

```typescript
// Controller
@Controller({ path: '/' })
export class AppController {
  @Get({ path: '/*', staticServe: SPAStaticServe })
  public spa() {}
}
```

**Usage:**
```bash
# All these routes serve dist/index.html
http://localhost:3000/
http://localhost:3000/about
http://localhost:3000/users/123

# Static assets served directly
http://localhost:3000/app.js       # Serves: dist/app.js
http://localhost:3000/style.css    # Serves: dist/style.css
```

---

### Multiple Static Directories

Serve different directories from different routes:

::: code-group
```typescript [Ergenecore]
import { StaticServe } from '@asenajs/asena/server';
import { StaticServeService, type Context } from '@asenajs/ergenecore';
import path from 'path';

// Public assets
@StaticServe({ root: path.join(process.cwd(), 'public') })
export class PublicStaticServe extends StaticServeService {
  public rewriteRequestPath(reqPath: string): string {
    return reqPath.replace(/^\/assets\/|^\/assets/, '');
  }
}

// Downloads
@StaticServe({ root: path.join(process.cwd(), 'downloads') })
export class DownloadStaticServe extends StaticServeService {
  public rewriteRequestPath(reqPath: string): string {
    return reqPath.replace(/^\/downloads\/|^\/downloads/, '');
  }

  public onFound(filePath: string, c: Context): void {
    // Force download
    const fileName = path.basename(filePath);
    c.header('Content-Disposition', `attachment; filename="${fileName}"`);
  }
}

// Images with custom headers
@StaticServe({ root: path.join(process.cwd(), 'images') })
export class ImageStaticServe extends StaticServeService {
  public rewriteRequestPath(reqPath: string): string {
    return reqPath.replace(/^\/images\/|^\/images/, '');
  }

  public onFound(filePath: string, c: Context): void {
    // Long cache for images
    c.header('Cache-Control', 'public, max-age=2592000'); // 30 days
  }
}
```

```typescript [Hono]
import { StaticServe } from '@asenajs/asena/server';
import { StaticServeService, type Context } from '@asenajs/hono-adapter';
import path from 'path';

// Public assets
@StaticServe({ root: path.join(process.cwd(), 'public') })
export class PublicStaticServe extends StaticServeService {
  public rewriteRequestPath(reqPath: string): string {
    return reqPath.replace(/^\/assets\/|^\/assets/, '');
  }
}

// Downloads
@StaticServe({ root: path.join(process.cwd(), 'downloads') })
export class DownloadStaticServe extends StaticServeService {
  public rewriteRequestPath(reqPath: string): string {
    return reqPath.replace(/^\/downloads\/|^\/downloads/, '');
  }

  public onFound(filePath: string, c: Context): void {
    // Force download
    const fileName = path.basename(filePath);
    c.header('Content-Disposition', `attachment; filename="${fileName}"`);
  }
}

// Images with custom headers
@StaticServe({ root: path.join(process.cwd(), 'images') })
export class ImageStaticServe extends StaticServeService {
  public rewriteRequestPath(reqPath: string): string {
    return reqPath.replace(/^\/images\/|^\/images/, '');
  }

  public onFound(filePath: string, c: Context): void {
    // Long cache for images
    c.header('Cache-Control', 'public, max-age=2592000'); // 30 days
  }
}
```
:::

```typescript
// Controllers
@Controller({ path: '/assets' })
export class AssetsController {
  @Get({ path: '/*', staticServe: PublicStaticServe })
  public assets() {}
}

@Controller({ path: '/downloads' })
export class DownloadsController {
  @Get({ path: '/*', staticServe: DownloadStaticServe })
  public downloads() {}
}

@Controller({ path: '/images' })
export class ImagesController {
  @Get({ path: '/*', staticServe: ImageStaticServe })
  public images() {}
}
```

**Usage:**
```bash
# Public assets
http://localhost:3000/assets/logo.png

# Downloads (forces download)
http://localhost:3000/downloads/report.pdf

# Images (with long cache)
http://localhost:3000/images/banner.jpg
```

---

## Best Practices

### 1. Use Absolute Paths for Root Directory

Always use `path.join(process.cwd(), 'directory')` for the root directory:

```typescript
// ✅ Good
@StaticServe({ root: path.join(process.cwd(), 'public') })

// ❌ Bad - relative path may not work
@StaticServe({ root: './public' })
```

### 2. Implement Security Checks

Prevent directory traversal attacks in `rewriteRequestPath`:

```typescript
public rewriteRequestPath(reqPath: string): string {
  let cleanPath = reqPath.replace(/^\/static\/|^\/static/, '');

  // Remove directory traversal attempts
  cleanPath = cleanPath.replace(/\.\./g, '');

  // Normalize path
  cleanPath = path.normalize(cleanPath);

  return cleanPath;
}
```

### 3. Set Appropriate Cache Headers

Use `onFound` to set cache headers based on file type:

```typescript
public onFound(filePath: string, c: Context): void {
  const ext = path.extname(filePath);

  // Long cache for immutable assets
  if (ext.match(/\.(js|css|woff2?|ttf|svg|png|jpg|gif)$/)) {
    c.header('Cache-Control', 'public, max-age=31536000, immutable');
  }

  // Short cache for HTML
  else if (ext === '.html') {
    c.header('Cache-Control', 'public, max-age=300');
  }

  // No cache for others
  else {
    c.header('Cache-Control', 'no-cache');
  }
}
```

### 4. Log 404s for Monitoring

Use `onNotFound` to track missing files:

```typescript
public onNotFound(reqPath: string, c: Context): void {
  console.warn(`404: ${reqPath} - Referrer: ${c.req.header('referer')}`);

  // Track in monitoring service
  this.monitoring.track404(reqPath);
}
```

### 5. Keep Middleware Simple

Avoid heavy logic in lifecycle hooks. Keep them fast and focused:

```typescript
// ✅ Good - Simple and fast
public rewriteRequestPath(reqPath: string): string {
  return reqPath.replace(/^\/static\//, '');
}

// ❌ Bad - Too much logic
public rewriteRequestPath(reqPath: string): string {
  // Multiple regex checks
  // Database lookups
  // Complex transformations
  // This slows down every request!
}
```

### 6. Be Prepared for v0.7.0 Changes

::: warning
Since this API will change in v0.7.0, avoid building complex abstractions on top of the current implementation. Keep your static serving logic isolated and easy to refactor.
:::

---

## Common Use Cases

### Serve Build Output

Serve production build from frontend frameworks:

```typescript
// React/Vue/Svelte build output
@StaticServe({ root: path.join(process.cwd(), 'dist') })

// Next.js static export
@StaticServe({ root: path.join(process.cwd(), 'out') })
```

### Serve Documentation

Serve generated documentation:

```typescript
// VitePress docs
@StaticServe({ root: path.join(process.cwd(), 'docs/.vitepress/dist') })

// Storybook
@StaticServe({ root: path.join(process.cwd(), 'storybook-static') })
```

### Serve User Uploads

Serve user-uploaded files:

```typescript
@StaticServe({ root: path.join(process.cwd(), 'uploads') })
export class UploadsStaticServe extends StaticServeService {
  public onFound(filePath: string, c: Context): void {
    // Add security headers
    c.header('X-Content-Type-Options', 'nosniff');
    c.header('Content-Disposition', 'inline');
  }
}
```

---

## Troubleshooting

### Files Not Being Served

**Check:**
1. Is the `root` path correct and absolute?
2. Is `rewriteRequestPath` removing the route prefix correctly?
3. Do the files exist in the specified directory?
4. Check console logs from `onFound` and `onNotFound` hooks

### MIME Type Issues

Ensure proper file extensions and let the adapter handle MIME types automatically.

### 404 Errors for Existing Files

Check that `rewriteRequestPath` is not over-transforming the path:

```typescript
public rewriteRequestPath(reqPath: string): string {
  console.log('Original:', reqPath);
  const result = reqPath.replace(/^\/static\//, '');
  console.log('Rewritten:', result);
  return result;
}
```

---

## Related

- [Controllers](/docs/concepts/controllers.md) - Setting up controllers
- [Middleware](/docs/concepts/middleware.md) - Understanding middleware
- [Context](/docs/concepts/context.md) - Working with request context
