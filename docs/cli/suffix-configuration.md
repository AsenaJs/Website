---
title: Suffix Configuration
description: Customize component naming conventions with flexible suffix configuration
outline: deep
---

# Suffix Configuration

Suffix configuration allows you to customize how class names are generated when using `asena generate` commands.

## What are Suffixes?

Suffixes are text strings automatically appended to class names during component generation:

| Input | Default Suffix | Result |
|:------|:---------------|:-------|
| `User` | `Controller` | `UserController` |
| `Auth` | `Service` | `AuthService` |
| `Logger` | `Middleware` | `LoggerMiddleware` |
| `Database` | `Config` | `DatabaseConfig` |
| `Chat` | `Namespace` | `ChatNamespace` |

## Configuration File

Suffix settings are stored in `.asena/config.json`, which is automatically created by `asena create` or `asena init`:

```json
{
  "adapter": "hono",
  "suffixes": true
}
```

::: info Backward Compatibility
If your `.asena/config.json` doesn't include a `suffixes` field, all components will use default suffixes (equivalent to `"suffixes": true`).
:::

## Default Suffixes

| Component Type | Default Suffix |
|:---------------|:---------------|
| Controller     | `Controller`   |
| Service        | `Service`      |
| Middleware     | `Middleware`   |
| Config         | `Config`       |
| WebSocket      | `Namespace`    |

## Configuration Options

The `suffixes` field supports three value types:

### Boolean (Global Setting)

```json
{
  "adapter": "hono",
  "suffixes": true   // Use all default suffixes
}
```

```json
{
  "adapter": "hono",
  "suffixes": false  // No suffixes at all
}
```

### Object (Granular Control)

```json
{
  "adapter": "hono",
  "suffixes": {
    "controller": true,     // Use default (Controller)
    "service": false,       // No suffix
    "middleware": "MW",     // Custom suffix
    "config": true,         // Use default (Config)
    "websocket": "Socket"   // Custom suffix
  }
}
```

Each component type accepts:
- `true` → Use default suffix
- `false` → No suffix
- `"CustomString"` → Custom suffix
- `undefined` → Fallback to default suffix

## Examples

### Global Boolean

```json
{
  "adapter": "hono",
  "suffixes": true
}
```

```bash
asena g c User        # → UserController.ts
asena g s Auth        # → AuthService.ts
asena g m Logger      # → LoggerMiddleware.ts
```

---

```json
{
  "adapter": "hono",
  "suffixes": false
}
```

```bash
asena g c User        # → User.ts
asena g s Auth        # → Auth.ts
asena g m Logger      # → Logger.ts
```

### Granular Control

```json
{
  "adapter": "hono",
  "suffixes": {
    "controller": true,
    "service": "Svc",
    "middleware": false
  }
}
```

```bash
asena g c User        # → UserController.ts (true → default)
asena g s Auth        # → AuthSvc.ts (custom)
asena g m Logger      # → Logger.ts (false → no suffix)
asena g config DB     # → DBConfig.ts (undefined → default)
```

## Best Practices

### ❌ Things to Avoid

**Invalid TypeScript Identifiers**

```json
// ❌ Invalid - Contains special characters
{
  "controller": "Ctrl-",
  "service": "Svc_",
  "middleware": "Mid@ware"
}
```

Suffixes must be valid TypeScript class name segments (letters and numbers only).

**Empty Strings**

```json
// ❌ Invalid - Empty string
{
  "controller": "",
  "service": ""
}
```

Use `false` instead of empty strings to disable suffixes.

## Configuration Comparison

| Config Value | `asena g c User` Result |
|:------------|:------------------------|
| `undefined` (no config) | `UserController.ts` |
| `true` (global) | `UserController.ts` |
| `false` (global) | `User.ts` |
| `{ controller: true }` | `UserController.ts` |
| `{ controller: false }` | `User.ts` |
| `{ controller: "Ctrl" }` | `UserCtrl.ts` |
| `{}` (empty object) | `UserController.ts` |

## Manual Configuration

Edit `.asena/config.json` directly to modify suffix settings:

```bash
nano .asena/config.json
# or
code .asena/config.json
```

**Example:**

```json
{
  "adapter": "hono",
  "suffixes": {
    "controller": true,
    "service": "Svc",
    "middleware": false
  }
}
```

After saving, generate components immediately:

```bash
asena g c Product     # → ProductController.ts
asena g s Payment     # → PaymentSvc.ts
asena g m Auth        # → Auth.ts
```

::: info No Restart Required
Configuration changes are applied immediately.
:::

## Related Commands

```bash
# Create new project with suffix config
asena create my-project

# Add config to existing project
asena init

# Generate components
asena g c Product       # Controller
asena g s Auth          # Service
asena g m Logger        # Middleware
asena g config Database # Config
asena g ws Chat         # WebSocket
```

## Related Documentation

- [CLI Configuration](/docs/cli/configuration) - Complete CLI configuration reference
- [CLI Commands](/docs/cli/commands) - Available CLI commands
- [Controllers](/docs/concepts/controllers) - Controller patterns
- [Services](/docs/concepts/services) - Service patterns
- [Middleware](/docs/concepts/middleware) - Middleware patterns

---

**Next Steps:**
- Explore [CLI Commands](/docs/cli/commands) to start generating components
- Learn about [Controllers](/docs/concepts/controllers) and other components
