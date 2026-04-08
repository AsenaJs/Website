---
title: Frontend Controller
description: Serve HTML pages using Bun's native HTML import feature
outline: deep
---

# Frontend Controller

Asena's `@FrontendController` lets you serve HTML pages using Bun's native HTML import feature. Routes are registered directly with `Bun.serve()` and bypass the middleware chain entirely, providing zero-overhead static page serving.

## Quick Start

```typescript
import { FrontendController } from '@asenajs/asena/decorators';
import { Page } from '@asenajs/asena/decorators/http';

@FrontendController('/ui')
export class AppFrontendController {

  @Page('/')
  public home() {
    return import('./pages/home.html');
  }

}
```

With this setup, visiting `/ui` serves the `home.html` page directly through Bun's native HTML bundler.

::: info Bun HTML Imports
Bun supports importing `.html` files natively. The `import()` expression returns an HTMLBundle that Bun can serve with automatic bundling of linked CSS, JS, and other assets. See [Bun HTML Imports](https://bun.sh/docs/bundler/html) for details.
:::

## @FrontendController Decorator

Marks a class as a frontend page controller.

```typescript
import { FrontendController } from '@asenajs/asena/decorators';

// String shorthand
@FrontendController('/ui')

// Full options
@FrontendController({
  path: '/ui',
  name: 'DashboardFrontend', // Optional: component name for IoC
})
```

| Parameter | Type | Required | Description |
|:----------|:-----|:---------|:------------|
| `path` | `string` | Yes | Base URL path for all pages |
| `name` | `string` | No | Component name for IoC registration |

## @Page Decorator

Defines a page route within a `@FrontendController`. Each `@Page` method returns a Bun HTML import.

```typescript
import { Page } from '@asenajs/asena/decorators/http';

@Page('/')          // Serves at {basePath}/
@Page('/settings')  // Serves at {basePath}/settings
@Page('/about')     // Serves at {basePath}/about
```

The method decorated with `@Page` must return the result of an HTML `import()`:

```typescript
@Page('/dashboard')
public dashboard() {
  return import('./pages/dashboard.html');
}
```

## How It Works

1. `@FrontendController('/ui')` stores the base path in component metadata
2. `@Page('/')` collects sub-routes for each page method
3. During bootstrap, Asena registers these routes directly with `Bun.serve()`'s `routes` option
4. Requests are served by Bun's native HTTP server — no middleware, no adapter overhead

::: warning Middleware Bypass
Frontend Controller routes bypass the entire middleware chain. This means:
- No CORS middleware
- No authentication middleware
- No rate limiting
- No logging middleware

This is by design — HTML pages are served as static assets with zero overhead. If you need middleware processing for your routes, use a regular `@Controller` instead.
:::

## Multiple Pages

Serve multiple pages from a single controller:

```typescript
import { FrontendController } from '@asenajs/asena/decorators';
import { Page } from '@asenajs/asena/decorators/http';

@FrontendController('/app')
export class DashboardController {

  @Page('/')
  public home() {
    return import('./pages/home.html');
  }

  @Page('/settings')
  public settings() {
    return import('./pages/settings.html');
  }

  @Page('/about')
  public about() {
    return import('./pages/about.html');
  }

}
```

This registers:
- `/app` → `home.html`
- `/app/settings` → `settings.html`
- `/app/about` → `about.html`

## HTML File Structure

Your HTML files are standard HTML with Bun's bundling support:

```html
<!-- src/frontend/pages/home.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My App</title>
  <link rel="stylesheet" href="./styles.css">
</head>
<body>
  <div id="app">
    <h1>Welcome to My App</h1>
  </div>
  <script type="module" src="./app.ts"></script>
</body>
</html>
```

Bun automatically bundles linked CSS, JavaScript, and TypeScript files.

## FrontendController vs Controller

| Feature | `@FrontendController` | `@Controller` |
|:--------|:---------------------|:--------------|
| **Purpose** | Serve HTML pages | Handle API requests |
| **Middleware** | No (bypassed) | Yes (full chain) |
| **Served by** | `Bun.serve()` routes directly | HTTP adapter (Hono/Ergenecore) |
| **Performance** | Zero overhead | Adapter overhead |
| **Use case** | Static pages, SPAs | REST APIs, dynamic content |

## Best Practices

### 1. Use for Static Pages

```typescript
// ✅ Good: Static HTML pages
@FrontendController('/ui')
export class AppFrontend {
  @Page('/')
  home() { return import('./pages/home.html'); }
}

// ❌ Bad: Don't use for API routes
@FrontendController('/api')
export class ApiFrontend {
  @Page('/users')
  users() { return import('./pages/users.html'); } // Should be a Controller
}
```

### 2. Organize Pages in a Dedicated Directory

```
src/
├── controllers/      # API controllers
├── frontend/
│   ├── AppFrontendController.ts
│   └── pages/
│       ├── home.html
│       ├── settings.html
│       ├── styles.css
│       └── app.ts
└── services/
```

### 3. Consider Auth Requirements

```typescript
// ✅ Good: Public pages via FrontendController
@FrontendController('/public')
export class PublicPages {
  @Page('/')
  landing() { return import('./pages/landing.html'); }
}

// ✅ Good: Protected pages should handle auth client-side
// or use a @Controller with middleware for SSR
```

::: tip SPA Authentication
For single-page applications, handle authentication on the client side. The SPA can call your authenticated API endpoints (`@Controller` with auth middleware) while the initial HTML page is served without middleware.
:::

## Related Documentation

- [Controllers](/docs/concepts/controllers) - HTTP route handling
- [Static File Serving](/docs/concepts/static-files) - Serving static assets
- [Middleware](/docs/concepts/middleware) - Middleware system
- [Configuration](/docs/guides/configuration) - Server configuration

---

**Next Steps:**
- Learn about [Controllers](/docs/concepts/controllers) for API routes
- Explore [Static File Serving](/docs/concepts/static-files)
- Set up [Middleware](/docs/concepts/middleware) for protected routes