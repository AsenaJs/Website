---
title: PostProcessor
description: Intercept and transform every component during IoC bootstrap with @PostProcessor
outline: deep
---

# PostProcessor

PostProcessor is Asena's component interception system. It lets you hook into the IoC bootstrap process to transform instances, collect metadata, or add cross-cutting behavior to components — similar to Spring's `BeanPostProcessor` or AOP interceptors.

## When to Use PostProcessor

- **Metadata Collection** — Gather information from components at bootstrap (e.g., auto-generating API documentation)
- **Instance Transformation** — Wrap instances with Proxies for tracing, logging, or monitoring
- **AOP Patterns** — Add cross-cutting concerns without modifying individual components

::: tip Use @OnStart for a single component
If you just need initialization logic for a single component, use [`@OnStart`](/docs/concepts/lifecycle) instead. PostProcessor is for cross-cutting concerns that apply to **multiple** components.
:::

## Quick Start

```typescript
import { PostProcessor } from '@asenajs/asena/decorators';
import type { ComponentPostProcessor } from '@asenajs/asena/ioc/types';

@PostProcessor()
export class LoggingPostProcessor implements ComponentPostProcessor {

  postProcess<T>(instance: T, Class: any): T {
    console.log(`Component initialized: ${Class.name}`);
    return instance;
  }

}
```

Asena automatically discovers and registers the PostProcessor during bootstrap. The `postProcess()` method is called for every component that gets created.

## ComponentPostProcessor Interface

```typescript
import type { ComponentPostProcessor } from '@asenajs/asena/ioc/types';

export interface ComponentPostProcessor {
  postProcess<T>(instance: T, Class: any): T | Promise<T>;
}
```

| Parameter | Type | Description |
|:----------|:-----|:------------|
| `instance` | `T` | The component instance with every `@Inject` / `@Strategy` field populated. Its `@OnStart` has **not** run yet |
| `Class` | `any` | The original class constructor (for reading metadata) |
| **Returns** | `T \| Promise<T>` | The processed instance. Return `null`/`undefined` to keep the original |

## @PostProcessor Decorator

```typescript
import { PostProcessor } from '@asenajs/asena/decorators';

@PostProcessor()                          // Default
@PostProcessor({ name: 'MyProcessor' })   // Named
```

Accepts optional `ComponentParams`:

| Parameter | Type | Default | Description |
|:----------|:-----|:--------|:------------|
| `name` | `string` | Class name | Component name for IoC |

## Lifecycle

PostProcessor runs at a specific point in the component initialization chain:

```
Constructor → @Inject (DI) → @Strategy → postProcess()   … later, from server.start() → @OnStart
```

1. Component is instantiated (`new`)
2. Dependencies are injected (`@Inject`)
3. Strategy arrays are resolved (`@Strategy`)
4. **PostProcessors run** — every injected field is populated at this point
5. Much later, once the whole graph exists, [`@OnStart`](/docs/concepts/lifecycle) hooks run from `server.start()`

::: info Execution Order
If multiple PostProcessors are registered, they execute in FIFO order (first registered, first executed). Each processor's output becomes the next processor's input (chaining).
:::

::: warning Changed in 0.10.0
Up to 0.9.x `@PostConstruct` ran *before* `postProcess()`. Start hooks now run after it, and
against the **post-processed** instance — a processor that returns a proxy hands the hook the
same object every other component was injected with. A processor that relied on the wrapped
instance already having run its own initialization no longer can; do that work in
`postProcess()` itself, or in the processor's own `@OnStart` (see below).
:::

## Two Modes of Operation

### Mode 1: Instance Transformation

Return a modified or wrapped instance. Useful for tracing, monitoring, or adding behavior.

```typescript
import { PostProcessor } from '@asenajs/asena/decorators';
import type { ComponentPostProcessor } from '@asenajs/asena/ioc/types';

@PostProcessor()
export class TracingPostProcessor implements ComponentPostProcessor {

  postProcess<T>(instance: T, Class: any): T {
    return new Proxy(instance as object, {
      get(target, prop, receiver) {
        const value = Reflect.get(target, prop, receiver);

        if (typeof value === 'function') {
          return function (...args: any[]) {
            console.log(`[TRACE] ${Class.name}.${String(prop)}() called`);
            return value.apply(target, args);
          };
        }

        return value;
      },
    }) as T;
  }

}
```

### Mode 2: Metadata Collection

Collect information from components without modifying them. Return the original instance unchanged.

```typescript
import { PostProcessor } from '@asenajs/asena/decorators';
import type { ComponentPostProcessor } from '@asenajs/asena/ioc/types';

@PostProcessor()
export class ComponentRegistryPostProcessor implements ComponentPostProcessor {

  private readonly registry: Map<string, any> = new Map();

  postProcess<T>(instance: T, Class: any): T {
    // Collect metadata — don't modify the instance
    this.registry.set(Class.name, {
      name: Class.name,
      methods: Object.getOwnPropertyNames(Class.prototype),
    });

    return instance; // Return unchanged
  }

  getRegistry() {
    return this.registry;
  }

}
```

## Real-World Example: OpenAPI PostProcessor

The `@asenajs/asena-openapi` package uses a PostProcessor to automatically generate OpenAPI specs from your existing controllers and validators. Here's a simplified version:

```typescript
import { PostProcessor } from '@asenajs/asena/decorators';
import { OnStart } from '@asenajs/asena/decorators/ioc';
import { Inject } from '@asenajs/asena/decorators/ioc';
import type { ComponentPostProcessor } from '@asenajs/asena/ioc/types';
import { extractControllerRouteInfo, isController, isValidator } from '@asenajs/asena/utils';

@PostProcessor()
export class OpenApiPostProcessor implements ComponentPostProcessor {

  @Inject(ICoreServiceNames.ASENA_ADAPTER)
  private adapter: AsenaAdapter<any, any>;

  private controllers: { instance: any; Class: any }[] = [];
  private validators = new Map<string, any>();

  @OnStart()
  public onInit(): void {
    // Register the /openapi endpoint during initialization
    this.adapter.registerRoute({
      method: 'GET',
      path: '/openapi',
      handler: async (context: any) => {
        const spec = await this.generateSpec();
        return context.send(spec);
      },
    });
  }

  public postProcess<T>(instance: T, Class: any): T {
    // Mode 2: Collect controllers and validators
    if (isController(Class)) {
      this.controllers.push({ instance, Class });
    }

    if (isValidator(Class)) {
      this.validators.set(Class.name, instance);
    }

    return instance; // Return unchanged
  }

  private async generateSpec() {
    // Generate OpenAPI 3.1 spec from collected controllers + validators
    for (const { instance, Class } of this.controllers) {
      const { basePath, routes } = extractControllerRouteInfo(instance);
      // ... build spec from route metadata and validator schemas
    }
  }

}
```

**How it works:**

1. `@OnStart` registers the `/openapi` GET endpoint on the adapter
2. `postProcess()` is called for every component — it selectively collects controllers and validators
3. When `/openapi` is requested, the spec is lazily generated from collected metadata
4. The original instances are never modified

::: tip Full Source
See the full implementation: [OpenApiPostProcessor.ts on GitHub](https://github.com/AsenaJs/asena-openapi/blob/master/lib/postprocessor/OpenApiPostProcessor.ts)
:::

## Bootstrap Priority

PostProcessors are registered in a special **Phase A** during bootstrap, before all other components:

1. **Phase A:** PostProcessor classes and their dependencies are created. PostProcessors are **NOT** post-processed themselves (prevents infinite loops)
2. **Phase B:** All remaining components are created. Post-processing is now active, so every component goes through `postProcess()`

This guarantees that PostProcessors are ready before any user component is created.

::: warning PostProcessor dependencies are not post-processed
Dependencies of PostProcessors (services injected via `@Inject`) are also created in Phase A and are **not** post-processed. Keep PostProcessor dependencies minimal.
:::

::: warning Phase A keeps the old start-hook timing
Phase B components have their [`@OnStart`](/docs/concepts/lifecycle) deferred to `server.start()`.
Phase A components — the processors and their dependencies — run theirs at **construction**, as
they always did, because `postProcess()` reads state the processor's own start hook sets up.
Deferring it would wrap every Phase B component against an uninitialised processor.

Two consequences: a processor's `@OnStart` cannot reach the microservice transports (they are not
connected yet), and because it counts as started from construction, its `@OnStop` runs on
`server.stop()` even if `start()` was never called.
:::

## Dependency Injection in PostProcessors

PostProcessors are full IoC components — you can inject other services:

```typescript
@PostProcessor()
export class MetricsPostProcessor implements ComponentPostProcessor {

  @Inject(ICoreServiceNames.ASENA_ADAPTER)
  private adapter: AsenaAdapter<any, any>;

  @Inject('MetricsService')
  private metrics: MetricsService;

  postProcess<T>(instance: T, Class: any): T {
    this.metrics.trackComponent(Class.name);
    return instance;
  }

}
```

## @OnStart vs @PostProcessor

| Aspect | [`@OnStart`](/docs/concepts/lifecycle) | `@PostProcessor` |
|:-------|:-----------------|:-----------------|
| **Type** | Method decorator | Class decorator |
| **Scope** | Single component | All components |
| **When** | From `server.start()`, once the whole graph exists | At construction, right after DI |
| **Counterpart** | `@OnStop` | None |
| **Purpose** | Component initialization | Cross-cutting concerns |
| **Can transform** | No (runs on self) | Yes (returns modified instance) |
| **Use case** | Setup resources, validate config | Tracing, metadata collection, AOP |

## Best Practices

### 1. Use Mode 2 for Most Cases

```typescript
// ✅ Good: Collect metadata, return unchanged
postProcess<T>(instance: T, Class: any): T {
  if (isController(Class)) {
    this.controllers.push(Class.name);
  }
  return instance;
}

// ⚠️ Careful: Only transform when truly needed (tracing, monitoring)
postProcess<T>(instance: T, Class: any): T {
  return new Proxy(instance, { /* ... */ });
}
```

### 2. Be Selective

```typescript
// ✅ Good: Only process relevant components
postProcess<T>(instance: T, Class: any): T {
  if (!isController(Class)) return instance; // Skip non-controllers
  // ... process controller
  return instance;
}

// ❌ Bad: Processing every single component
postProcess<T>(instance: T, Class: any): T {
  // Heavy processing on ALL components
  return this.expensiveOperation(instance);
}
```

### 3. Keep Dependencies Minimal

```typescript
// ✅ Good: Minimal dependencies (remember: deps aren't post-processed)
@PostProcessor()
export class SimpleProcessor implements ComponentPostProcessor {
  postProcess<T>(instance: T, Class: any): T { /* ... */ }
}

// ❌ Bad: Many dependencies (all created in Phase A, not post-processed)
@PostProcessor()
export class HeavyProcessor implements ComponentPostProcessor {
  @Inject('ServiceA') private a: ServiceA;
  @Inject('ServiceB') private b: ServiceB;
  @Inject('ServiceC') private c: ServiceC;
  // ...
}
```

## Related

- [Services](/docs/concepts/services) - Service layer architecture
- [Dependency Injection](/docs/concepts/dependency-injection) - IoC container
- [Component Lifecycle](/docs/concepts/lifecycle) - `@OnStart` / `@OnStop` and why PostProcessors start earlier
- [OpenAPI](/docs/packages/openapi) - PostProcessor in action
- [Configuration](/docs/guides/configuration) - Server configuration
