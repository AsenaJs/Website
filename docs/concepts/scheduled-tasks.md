---
title: Scheduled Tasks
description: Cron-based background jobs with @Schedule and CronRunner, powered by Bun's native cron
outline: deep
---

# Scheduled Tasks

Asena provides built-in cron-based task scheduling using Bun's native `Bun.cron.parse()` for expression validation. Decorate a class with `@Schedule` and implement the `AsenaSchedule` interface to create scheduled tasks that run automatically.

## Quick Start

```typescript
import { Schedule } from '@asenajs/asena/decorators';
import type { AsenaSchedule } from '@asenajs/asena/schedule';

@Schedule({ cron: '0 3 * * *' }) // Every day at 3:00 AM
export class DatabaseCleanup implements AsenaSchedule {

  public async execute() {
    console.log('Running database cleanup...');
    // cleanup logic here
  }

}
```

Asena automatically discovers and registers the scheduled task during bootstrap. The `execute()` method runs on the specified cron schedule.

## @Schedule Decorator

The `@Schedule` decorator marks a class as a scheduled task component.

```typescript
import { Schedule } from '@asenajs/asena/decorators';

@Schedule({
  cron: '*/5 * * * *',  // Required: cron expression
  name: 'MyTask',       // Optional: component name for IoC
})
```

### Cron Expression Format

Uses 5-field cron format:

```
┌───────────── minute (0-59)
│ ┌───────────── hour (0-23)
│ │ ┌───────────── day of month (1-31)
│ │ │ ┌───────────── month (1-12)
│ │ │ │ ┌───────────── day of week (0-6, Sun-Sat)
│ │ │ │ │
* * * * *
```

| Field | Values | Special Characters |
|:------|:-------|:-------------------|
| Minute | 0-59 | `*` `,` `-` `/` |
| Hour | 0-23 | `*` `,` `-` `/` |
| Day of Month | 1-31 | `*` `,` `-` `/` |
| Month | 1-12 | `*` `,` `-` `/` |
| Day of Week | 0-6 (Sun=0) or MON-SUN | `*` `,` `-` `/` |

**Common patterns:**

| Expression | Description |
|:-----------|:------------|
| `* * * * *` | Every minute |
| `*/5 * * * *` | Every 5 minutes |
| `0 * * * *` | Every hour |
| `0 9 * * *` | Daily at 9:00 AM |
| `0 9 * * MON-FRI` | Weekdays at 9:00 AM |
| `0 0 1 * *` | First day of every month at midnight |
| `0 0 * * 0` | Every Sunday at midnight |

::: tip Cron Validation
Asena validates cron expressions with Bun's native `Bun.cron.parse()` **inside the
`@Schedule` decorator**, i.e. when the module is imported - before
`AsenaServerFactory.create()` is ever reached. An invalid expression throws immediately,
so the server can never start with a misconfigured schedule.

`Bun.cron.parse()` also accepts the usual nicknames (`@hourly`, `@daily`, `@weekly`,
`@monthly`, `@yearly`) in place of the 5-field form.
:::

## AsenaSchedule Interface

Your scheduled task class must implement the `AsenaSchedule` interface:

```typescript
import type { AsenaSchedule } from '@asenajs/asena/schedule';

export interface AsenaSchedule {
  execute(): Promise<void> | void;
}
```

### Error Handling

If `execute()` throws an error, it is caught and logged by the framework. The schedule continues running — a single failure does not stop future executions.

```typescript
@Schedule({ cron: '*/10 * * * *' })
export class ReportTask implements AsenaSchedule {

  public async execute() {
    try {
      await generateReport();
    } catch (error) {
      // Error is also caught by the framework,
      // but you can add custom handling here
      await notifyAdmin(error);
    }
  }

}
```

## Dependency Injection

Scheduled task classes are full IoC components. You can inject services just like in controllers or services:

```typescript
import { Schedule } from '@asenajs/asena/decorators';
import { Inject } from '@asenajs/asena/decorators/ioc';
import type { AsenaSchedule } from '@asenajs/asena/schedule';

@Schedule({ cron: '0 */6 * * *' }) // Every 6 hours
export class CacheWarmup implements AsenaSchedule {

  @Inject('ProductService')
  private productService: ProductService;

  @Inject('AppRedis')
  private redis: AppRedis;

  public async execute() {
    const products = await this.productService.getPopularProducts();

    for (const product of products) {
      await this.redis.set(
        `product:${product.id}`,
        JSON.stringify(product),
        3600, // 1 hour TTL
      );
    }
  }

}
```

## CronRunner Service

`CronRunner` is a core framework service that manages all scheduled tasks. You can inject it to monitor and interact with registered jobs.

```typescript
import { Controller } from '@asenajs/asena/decorators';
import { Get } from '@asenajs/asena/decorators/http';
import { Inject } from '@asenajs/asena/decorators/ioc';
import { ICoreServiceNames } from '@asenajs/asena/ioc/types';
import type { CronRunner } from '@asenajs/asena/schedule';
import type { Context } from '@asenajs/hono-adapter'; // or '@asenajs/ergenecore'

@Controller('/api/cron')
export class CronController {

  @Inject(ICoreServiceNames.CRON_RUNNER)
  private cronRunner: CronRunner;

  @Get('/status')
  public async status(context: Context) {
    return context.send({
      jobNames: this.cronRunner.getJobNames(),
      jobCount: this.cronRunner.jobCount,
      hasRunningJobs: this.cronRunner.hasRunningJobs,
    });
  }

}
```

### CronRunner API

| Property/Method | Type | Description |
|:-----------------|:-----|:------------|
| `getJobNames()` | `string[]` | Get all registered job names |
| `registerJob(name, cron, fn)` | `void` | Register a job programmatically |
| `startAll()` / `stopAll()` | `void` | Start or stop every registered job |
| `clearJobs()` | `void` | Stop and drop all registered jobs |
| `jobCount` | `number` | Number of registered jobs |
| `hasRunningJobs` | `boolean` | Whether any job is **scheduled** (started and not stopped) - not whether one is executing right now |

::: info Lifecycle
CronRunner starts all registered jobs when the server is ready and stops them during graceful shutdown. You don't need to manage the start/stop lifecycle manually.

Relative to [component lifecycle hooks](/docs/concepts/lifecycle): jobs start **after** every `@OnStart` has returned, and stop **before** any `@OnStop` runs — the first step of `server.stop()` is "take no new work". A job already executing when shutdown begins is not cancelled; `stopAll()` only unschedules future runs.
:::

## Real-World Examples

### Database Cleanup

```typescript
import { Schedule } from '@asenajs/asena/decorators';
import { Inject } from '@asenajs/asena/decorators/ioc';
import type { AsenaSchedule } from '@asenajs/asena/schedule';

@Schedule({ cron: '0 2 * * *' }) // Daily at 2:00 AM
export class SessionCleanup implements AsenaSchedule {

  @Inject('SessionRepository')
  private sessionRepo: SessionRepository;

  public async execute() {
    const expiredCount = await this.sessionRepo.deleteExpired();
    console.log(`Cleaned up ${expiredCount} expired sessions`);
  }

}
```

### Health Check Reporter

```typescript
@Schedule({ cron: '*/5 * * * *' }) // Every 5 minutes
export class HealthReporter implements AsenaSchedule {

  @Inject('AppRedis')
  private redis: AppRedis;

  @Inject('NotificationService')
  private notifications: NotificationService;

  public async execute() {
    const redisOk = await this.redis.testConnection();

    if (!redisOk) {
      await this.notifications.alert('Redis connection lost');
    }
  }

}
```

## Best Practices

### 1. Keep execute() Fast

```typescript
// ✅ Good: Offload heavy work to services
@Schedule({ cron: '0 * * * *' })
export class ReportSchedule implements AsenaSchedule {
  @Inject('ReportService')
  private reportService: ReportService;

  async execute() {
    await this.reportService.generateHourlyReport();
  }
}

// ❌ Bad: Heavy logic directly in execute()
@Schedule({ cron: '0 * * * *' })
export class ReportSchedule implements AsenaSchedule {
  async execute() {
    const data = await fetchAllRecords(); // complex logic here
    await processData(data);
    await sendEmails(data);
    // ...hundreds of lines
  }
}
```

### 2. Use CronRunner for Monitoring

```typescript
// ✅ Good: Expose schedule status via health endpoint
@Get('/health')
async health(context: Context) {
  return context.send({
    scheduledJobs: this.cronRunner.jobCount,
    running: this.cronRunner.hasRunningJobs,
  });
}
```

### 3. Handle Errors Gracefully

```typescript
// ✅ Good: Catch and handle errors in execute()
async execute() {
  try {
    await this.cleanup();
  } catch (error) {
    await this.logger.error('Cleanup failed', error);
    // Schedule continues running even if this execution fails
  }
}
```

## Related

- [Services](/docs/concepts/services) - Business logic layer
- [Dependency Injection](/docs/concepts/dependency-injection) - IoC container
- [Component Lifecycle](/docs/concepts/lifecycle) - Cron jobs start after the hooks and stop before them
- [Configuration](/docs/guides/configuration) - Server configuration
- [Redis](/docs/packages/redis) - Cache warming from a scheduled task
