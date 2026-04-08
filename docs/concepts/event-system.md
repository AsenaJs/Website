---
title: Event System
description: Decoupled, event-driven architecture with fire-and-forget pattern and wildcard matching
outline: deep
---

# Event System

Asena's Event System provides a decoupled, event-driven architecture for your application. It allows different parts of your application to communicate without tight coupling, making your code more maintainable and testable.

## Key Features

- **🔥 Fire-and-Forget Pattern** - Events are emitted without waiting for handlers (Spring-like behavior)
- **🎯 Wildcard Pattern Matching** - Support for flexible event patterns (`*`, `user.*`, `*.error`)
- **🛡️ Error Isolation** - Handler errors don't affect other handlers or the emitter
- **⚡ Async Support** - Both sync and async handlers with smart Promise detection
- **🔗 IoC Integration** - Full dependency injection support for event services
- **📦 Zero Dependencies** - Built with native TypeScript and Bun APIs
- **⚙️ High Performance** - Optimized pattern matching and execution

---

## Quick Start

### 1. Create an Event Service

```typescript
import { EventService, On } from '@asenajs/asena/decorators';

@EventService({ prefix: 'user' })
export class UserEventService {
  @On('created')
  handleUserCreated(eventName: string, data: any) {
    console.log('User created:', data);
  }

  @On('updated')
  handleUserUpdated(eventName: string, data: any) {
    console.log('User updated:', data);
  }

  // Wildcard: catches user.login.error, user.register.error, etc.
  @On('*.error')
  handleUserError(eventName: string, data: any) {
    console.error('User error:', eventName, data);
  }
}
```

### 2. Emit Events from Your Services

```typescript
import { Service, Inject, emitter } from '@asenajs/asena/decorators';
import type { EventEmitter } from '@asenajs/asena';

@Service()
export class UserService {
  @Inject(emitter())
  private emitter!: EventEmitter;

  async createUser(name: string) {
    const user = { id: Math.random(), name };

    // Save user to database...

    // Emit event (fire-and-forget, returns immediately)
    this.emitter.emit('user.created', user);

    return user;
  }
}
```

### 3. That's It!

The event system automatically:
- Scans for `@EventService` classes during bootstrap
- Registers all `@On` handlers
- Matches patterns when events are emitted
- Executes handlers without blocking

::: tip
Handlers run in the background. If a handler throws an error, it won't affect other handlers or your service code.
:::

---

## Core Features

### Fire-and-Forget Pattern

Events are emitted **without waiting** for handlers to complete. This is similar to Spring's `@EventListener` behavior.

```typescript
@Service()
export class OrderService {
  @Inject(emitter())
  private emitter!: EventEmitter;

  async createOrder(userId: string, items: any[]) {
    const order = { id: 123, userId, items };

    console.log('1. Saving order...');
    await this.saveToDatabase(order);

    console.log('2. Emitting event...');
    this.emitter.emit('order.created', order);
    console.log('3. Event emitted (not waiting)');

    console.log('4. Continuing...');
    return order;
  }
}

@EventService()
export class OrderEventService {
  @On('order.created')
  async sendConfirmationEmail(eventName: string, data: any) {
    // This runs in the background
    await Bun.sleep(3000);
    console.log('5. Email sent (after 3 seconds)');
  }
}

// Output:
// 1. Saving order...
// 2. Emitting event...
// 3. Event emitted (not waiting)
// 4. Continuing...
// ... 3 seconds later ...
// 5. Email sent (after 3 seconds)
```

::: info
The `emit()` method returns immediately. Async handlers run in the background without blocking your code.
:::

---

### Wildcard Pattern Matching

Use wildcards to match multiple events with a single handler:

| Pattern | Matches | Examples |
|---------|---------|----------|
| `*` | All events | Any event |
| `user.*` | All user events | `user.created`, `user.updated`, `user.deleted` |
| `*.error` | All error events | `user.error`, `db.error`, `auth.error` |
| `user.*.created` | Nested patterns | `user.admin.created`, `user.guest.created` |

```typescript
@EventService()
export class GlobalEventService {
  // Log all events
  @On('*')
  logAllEvents(eventName: string) {
    console.log('Event:', eventName);
  }

  // Handle all error events
  @On('*.error')
  handleAllErrors(eventName: string, data: any) {
    console.error('Error event:', eventName, data);
    // Send to error tracking service
  }

  // Handle all user-related events
  @On('user.*')
  trackUserEvents(eventName: string, data: any) {
    console.log('User event:', eventName);
    // Track analytics
  }
}
```

::: warning Performance Note
Wildcard patterns are slower than exact matches. Use them sparingly for cross-cutting concerns like logging and monitoring.
:::

---

### Error Isolation

Errors in one handler don't affect other handlers or the emitter:

```typescript
@EventService()
export class TestService {
  @On('test.event')
  handler1() {
    console.log('Handler 1 - success');
  }

  @On('test.event')
  handler2() {
    console.log('Handler 2 - will throw error');
    throw new Error('Something went wrong!');
  }

  @On('test.event')
  handler3() {
    console.log('Handler 3 - success');
  }
}

// When 'test.event' is emitted:
// Handler 1 executes successfully ✓
// Handler 2 throws error (caught and logged) ✗
// Handler 3 executes successfully ✓
```

::: tip
Errors are automatically caught and logged. Your application continues running normally.
:::

---

## Decorators

### `@EventService(params?)`

Marks a class as an event service containing event handlers.

**Parameters:**
- `params` (optional): Configuration object or prefix string
  - `prefix?: string` - Prefix for all handlers in this class
  - `name?: string` - Custom component name (defaults to class name)

**Examples:**

```typescript
// No prefix
@EventService()
class GlobalEventService { }

// With prefix (object)
@EventService({ prefix: 'user' })
class UserEventService { }

// With prefix (shorthand)
@EventService('order')
class OrderEventService { }

// With custom name
@EventService({ prefix: 'payment', name: 'PaymentEvents' })
class PaymentEventService { }
```

---

### `@On(params)`

Marks a method as an event handler.

**Parameters:**
- `params`: Event pattern or configuration object
  - `event: string` - Event pattern to match
  - `skip?: boolean` - Skip this handler (useful for debugging)

**Method Signature:**
```typescript
(eventName: string, data?: any) => void | Promise<void>
```

**Pattern Examples:**

```typescript
@EventService({ prefix: 'user' })
class UserEventService {
  // Exact match: handles 'user.created'
  @On('created')
  handleCreated(eventName: string, data: any) {
    console.log('User created:', data);
  }

  // Wildcard: handles all 'user.*' events
  @On('*')
  logAllUserEvents(eventName: string, data: any) {
    console.log('User event:', eventName);
  }

  // Nested wildcard: handles 'user.*.error'
  @On('*.error')
  handleErrors(eventName: string, data: any) {
    console.error('Error:', eventName, data);
  }

  // Temporarily disabled (for debugging)
  @On({ event: 'deleted', skip: true })
  handleDeleted(eventName: string, data: any) {
    // Not called
  }
}
```

**Pattern Building with Prefix:**

| Prefix | Event Pattern | Final Pattern |
|--------|--------------|---------------|
| `''` | `user.created` | `user.created` |
| `user` | `created` | `user.created` |
| `user` | `*.updated` | `user.*.updated` |
| `user` | `*` | `user.*` |

---

### `emitter()`

Utility function for injecting EventEmitter.

```typescript
import { Service, Inject, emitter } from '@asenajs/asena/decorators';
import type { EventEmitter } from '@asenajs/asena';

@Service()
class UserService {
  @Inject(emitter())
  private emitter!: EventEmitter;

  createUser(name: string) {
    this.emitter.emit('user.created', { name });
  }
}
```

---

### `EventEmitter.emit()`

Emits an event to all matching handlers.

**Signature:**
```typescript
emit(eventName: string, data?: any): boolean
```

**Parameters:**
- `eventName: string` - Event name to emit
- `data?: any` - Optional data to pass to handlers

**Returns:** `boolean` - `true` if any handler matched, `false` otherwise

**Examples:**

```typescript
@Service()
class UserService {
  @Inject(emitter())
  private emitter!: EventEmitter;

  createUser(name: string) {
    const user = { id: 123, name };

    // Emit with data
    this.emitter.emit('user.created', user);

    // Emit without data
    this.emitter.emit('app.started');

    // Check if event was handled
    if (!this.emitter.emit('user.created', user)) {
      console.warn('No handlers registered for user.created');
    }

    return user;
  }
}
```

---

## Event Patterns

### Naming Convention

Use **dot-notation** for hierarchical event names:

```typescript
// ✅ Good
'user.created'
'user.updated'
'user.deleted'
'order.placed'
'order.payment.completed'
'order.payment.failed'

// ❌ Bad
'userCreated'
'user_created'
'CREATE_USER'
```

### Pattern Organization

Group related events using prefixes:

```typescript
@EventService({ prefix: 'user' })
class UserEventService {
  @On('created')       // Handles 'user.created'
  @On('updated')       // Handles 'user.updated'
  @On('deleted')       // Handles 'user.deleted'
}

@EventService({ prefix: 'order' })
class OrderEventService {
  @On('placed')        // Handles 'order.placed'
  @On('cancelled')     // Handles 'order.cancelled'
  @On('completed')     // Handles 'order.completed'
}
```

### Wildcard Strategy

Use wildcards for cross-cutting concerns:

```typescript
@EventService()
class MonitoringService {
  // Global error monitoring
  @On('*.error')
  handleAllErrors(eventName: string, data: any) {
    this.errorTracker.log(eventName, data);
  }

  // Critical events only
  @On('*.critical.*')
  handleCritical(eventName: string, data: any) {
    this.alertService.sendAlert(eventName, data);
  }

  // Audit logging for specific domain
  @On('user.*')
  auditUserEvents(eventName: string, data: any) {
    this.auditLog.save(eventName, data);
  }
}
```

---

## Advanced Usage

### Event Chaining

Handlers can emit other events, creating event chains:

```typescript
@EventService()
class OrderEventService {
  @Inject(emitter())
  private emitter!: EventEmitter;

  @On('order.placed')
  handleOrderPlaced(eventName: string, data: any) {
    console.log('Order placed:', data);
    // Chain: emit payment event
    this.emitter.emit('payment.process', { orderId: data.id });
  }

  @On('payment.process')
  async handlePayment(eventName: string, data: any) {
    console.log('Processing payment:', data.orderId);
    // Chain: emit inventory event
    this.emitter.emit('inventory.reserve', data);
  }

  @On('inventory.reserve')
  handleInventory(eventName: string, data: any) {
    console.log('Reserving inventory:', data.orderId);
    // Final event
    this.emitter.emit('notification.send', {
      message: 'Order confirmed!',
    });
  }
}

// Flow: order.placed → payment.process → inventory.reserve → notification.send
```

---

### Multiple Listeners

Multiple services can listen to the same event independently:

```typescript
@EventService()
class EmailService {
  @On('user.created')
  sendWelcomeEmail(eventName: string, data: any) {
    console.log('Sending welcome email to:', data.email);
  }
}

@EventService()
class AnalyticsService {
  @On('user.created')
  trackUserCreation(eventName: string, data: any) {
    console.log('Tracking user creation:', data.id);
  }
}

@EventService()
class NotificationService {
  @On('user.created')
  sendNotification(eventName: string, data: any) {
    console.log('Sending notification:', data.name);
  }
}

// When 'user.created' is emitted:
// → All 3 handlers are called independently
// → Errors in one handler don't affect others
// → Execution order is NOT guaranteed
```

::: warning
Don't rely on handler execution order. If you need sequential operations, use event chaining instead.
:::

---

### Dependency Injection in Event Services

Event services support full dependency injection:

```typescript
@Service()
class DatabaseService {
  save(data: any) {
    console.log('Saving to database:', data);
  }
}

@Service()
class LoggerService {
  log(message: string) {
    console.log('[Logger]', message);
  }
}

@EventService({ prefix: 'user' })
class UserEventService {
  @Inject('DatabaseService')
  private db!: DatabaseService;

  @Inject('LoggerService')
  private logger!: LoggerService;

  @Inject(emitter())
  private emitter!: EventEmitter;

  @On('created')
  async handleUserCreated(eventName: string, data: any) {
    // Use injected dependencies
    this.logger.log(`User created: ${data.name}`);
    this.db.save(data);

    // Emit another event
    this.emitter.emit('email.send', { to: data.email });
  }
}
```

---

## Examples

### User Registration Flow

```typescript
@EventService({ prefix: 'user' })
export class UserEventService {
  @Inject('EmailService')
  private emailService!: EmailService;

  @Inject('AnalyticsService')
  private analytics!: AnalyticsService;

  @On('registered')
  async handleUserRegistered(eventName: string, data: any) {
    console.log('User registered:', data.email);

    // Send welcome email
    await this.emailService.sendWelcomeEmail(data.email);

    // Track analytics
    this.analytics.track('user_registered', {
      userId: data.id,
      source: data.source,
    });
  }
}

@Service()
export class AuthService {
  @Inject(emitter())
  private emitter!: EventEmitter;

  async register(email: string, password: string) {
    // Create user
    const user = await this.createUser(email, password);

    // Emit event (fire-and-forget)
    this.emitter.emit('user.registered', {
      id: user.id,
      email: user.email,
      source: 'web',
    });

    return user;
  }
}
```

---

### Order Processing Pipeline

```typescript
@EventService({ prefix: 'order' })
export class OrderEventService {
  @Inject(emitter())
  private emitter!: EventEmitter;

  @Inject('PaymentService')
  private payment!: PaymentService;

  @Inject('InventoryService')
  private inventory!: InventoryService;

  @On('placed')
  handleOrderPlaced(eventName: string, data: any) {
    console.log('Order placed:', data.orderId);
    this.emitter.emit('order.payment.process', data);
  }

  @On('payment.process')
  async handlePaymentProcess(eventName: string, data: any) {
    try {
      await this.payment.charge(data.orderId);
      this.emitter.emit('order.payment.success', data);
    } catch (error) {
      this.emitter.emit('order.payment.failed', {
        ...data,
        error: error.message,
      });
    }
  }

  @On('payment.success')
  handlePaymentSuccess(eventName: string, data: any) {
    console.log('Payment successful:', data.orderId);
    this.emitter.emit('order.inventory.reserve', data);
  }

  @On('payment.failed')
  handlePaymentFailed(eventName: string, data: any) {
    console.error('Payment failed:', data.orderId);
    this.emitter.emit('notification.send', {
      type: 'payment_failed',
      orderId: data.orderId,
    });
  }

  @On('inventory.reserve')
  async handleInventoryReserve(eventName: string, data: any) {
    await this.inventory.reserve(data.orderId);
    this.emitter.emit('order.completed', data);
  }

  @On('completed')
  handleOrderCompleted(eventName: string, data: any) {
    console.log('Order completed:', data.orderId);
    this.emitter.emit('notification.send', {
      type: 'order_completed',
      orderId: data.orderId,
    });
  }
}

// Flow:
// order.placed
//   → order.payment.process
//     → order.payment.success
//       → order.inventory.reserve
//         → order.completed
//           → notification.send
```

---

### Error Monitoring

```typescript
@EventService()
export class ErrorMonitoringService {
  @Inject('LoggerService')
  private logger!: LoggerService;

  @Inject('AlertService')
  private alerts!: AlertService;

  // Monitor all error events
  @On('*.error')
  handleAllErrors(eventName: string, data: any) {
    this.logger.error(`Error event: ${eventName}`, data);
  }

  // Critical errors only
  @On('*.critical.error')
  handleCriticalErrors(eventName: string, data: any) {
    this.logger.error(`CRITICAL: ${eventName}`, data);

    // Alert team
    this.alerts.sendAlert({
      level: 'critical',
      event: eventName,
      data,
    });
  }

  // Database errors
  @On('db.*.error')
  handleDatabaseErrors(eventName: string, data: any) {
    this.logger.error(`Database error: ${eventName}`, data);
    // Track DB error metrics
  }
}
```

---

### Audit Logging

```typescript
@EventService()
export class AuditService {
  @Inject('DatabaseService')
  private db!: DatabaseService;

  // Log all user events
  @On('user.*')
  logUserEvents(eventName: string, data: any) {
    this.db.save('audit_logs', {
      event: eventName,
      userId: data.id || data.userId,
      timestamp: new Date(),
      data,
    });
  }

  // Log all admin actions
  @On('admin.*')
  logAdminActions(eventName: string, data: any) {
    this.db.save('admin_audit_logs', {
      event: eventName,
      adminId: data.adminId,
      action: eventName.split('.')[1],
      timestamp: new Date(),
      data,
    });
  }
}
```

---

### Real-time Notifications

```typescript
@EventService()
export class NotificationService {
  @Inject('WebSocketService')
  private ws!: WebSocketService;

  @Inject('EmailService')
  private email!: EmailService;

  // Send notifications for important events
  @On('user.created')
  @On('order.completed')
  @On('payment.success')
  notifyUser(eventName: string, data: any) {
    // Real-time notification via WebSocket
    this.ws.sendToUser(data.userId, {
      type: 'notification',
      event: eventName,
      message: this.formatMessage(eventName, data),
    });
  }

  // Email notifications for critical events
  @On('*.critical.*')
  sendEmailNotification(eventName: string, data: any) {
    this.email.send({
      to: data.email || data.userEmail,
      subject: `Critical Event: ${eventName}`,
      body: JSON.stringify(data, null, 2),
    });
  }

  private formatMessage(eventName: string, data: any): string {
    switch (eventName) {
      case 'user.created':
        return 'Welcome to our platform!';
      case 'order.completed':
        return `Order #${data.orderId} completed`;
      case 'payment.success':
        return 'Payment successful';
      default:
        return eventName;
    }
  }
}
```

---

## Best Practices

### 1. Use Dot-Notation for Event Names

```typescript
// ✅ Good
'user.created'
'order.payment.completed'
'notification.sent'

// ❌ Bad
'userCreated'
'user_created'
'USER_CREATED'
```

### 2. Organize Events by Domain

```typescript
// ✅ Good: Organized by domain with prefix
@EventService({ prefix: 'user' })
class UserEventService { }

@EventService({ prefix: 'order' })
class OrderEventService { }

@EventService({ prefix: 'payment' })
class PaymentEventService { }
```

### 3. Keep Handlers Lightweight

Event handlers should be fast and non-blocking:

```typescript
// ✅ Good - Quick operation
@On('user.created')
handleUserCreated(eventName: string, data: any) {
  this.logger.log('User created:', data.id);
  this.emitter.emit('email.send', data);
}

// ❌ Bad - Slow blocking operation
@On('user.created')
async handleUserCreated(eventName: string, data: any) {
  // Don't do heavy work in event handlers
  await this.sendEmail(data.email);
  await this.generateReport(data.id);
  await this.updateAnalytics(data);
}

// ✅ Better - Emit separate events for heavy work
@On('user.created')
handleUserCreated(eventName: string, data: any) {
  this.emitter.emit('email.send', data);
  this.emitter.emit('report.generate', data);
  this.emitter.emit('analytics.update', data);
}
```

### 4. Use Wildcards Sparingly

Wildcard patterns are slower than exact matches:

```typescript
// ✅ Good - Specific patterns
@On('user.created')
@On('user.updated')
@On('user.deleted')

// ⚠️ Use with caution - Matches all user events
@On('user.*')

// ⚠️ Use with extreme caution - Matches ALL events
@On('*')
```

::: warning
Only use wildcards for cross-cutting concerns like logging, monitoring, and error handling.
:::

### 5. Don't Rely on Handler Order

Handler execution order is not guaranteed:

```typescript
// ❌ Bad - Assuming order
@On('user.created')
handler1() { /* Step 1 */ }

@On('user.created')
handler2() { /* Step 2 - assumes handler1 completed */ }

// ✅ Good - Use event chaining for ordered operations
@On('user.created')
handler1(eventName: string, data: any) {
  // Do step 1
  this.emitter.emit('user.created.step2', data);
}

@On('user.created.step2')
handler2(eventName: string, data: any) {
  // Do step 2
}
```

### 6. Return Values are Ignored

```typescript
// ⚠️ Return value is ignored
@On('user.created')
handleUserCreated(eventName: string, data: any) {
  return { success: true }; // This is ignored
}

// ✅ Use events or service return values for responses
@Service()
class UserService {
  @Inject(emitter())
  private emitter!: EventEmitter;

  async createUser(name: string) {
    const user = { id: 123, name };

    // Emit event
    this.emitter.emit('user.created', user);

    // Return value to caller
    return user;
  }
}
```

### 7. Use Descriptive Event Data

Pass meaningful data to handlers:

```typescript
// ✅ Good - Clear, descriptive data
this.emitter.emit('user.created', {
  id: user.id,
  name: user.name,
  email: user.email,
  createdAt: new Date(),
});

// ❌ Bad - Unclear data
this.emitter.emit('user.created', user.id);

// ❌ Bad - Too much data
this.emitter.emit('user.created', {
  ...user,
  ...user.profile,
  ...user.settings,
  database: this.db, // Never pass services
});
```

---

## Troubleshooting

### Events Not Being Handled

**Check:**
1. Is your class decorated with `@EventService()`?
2. Are your methods decorated with `@On()`?
3. Is the pattern correct? (exact match or wildcard)
4. Is `skip: true` set on the handler?
5. Check console for errors during handler execution

### Performance Issues

**Solutions:**
1. Use exact patterns instead of wildcards when possible
2. Keep handlers lightweight
3. Avoid heavy computations in handlers
4. Use event chaining for complex workflows

### Events Firing Out of Order

**Remember:** Handler execution order is not guaranteed. Use event chaining for ordered operations.

### Async Handlers Not Completing

**Remember:** Fire-and-forget pattern means `emit()` doesn't wait for async handlers. This is by design.

---

## Related

- [Dependency Injection](/docs/concepts/dependency-injection.md) - Understanding DI in Asena
- [Services](/docs/concepts/services.md) - Creating services
- [Ulak](/docs/concepts/ulak.md) - WebSocket messaging system
