---
title: Ulak - WebSocket Messaging System
description: Centralized WebSocket message broker for breaking circular dependencies
outline: deep
---

# Ulak - WebSocket Messaging System

**Ulak** (Turkish: Messenger/Courier) is Asena's centralized WebSocket message broker that solves the circular dependency problem between services and WebSocket handlers. It provides a unified API for sending messages to WebSocket clients from anywhere in your application.

## The Problem

In traditional architectures, you might face circular dependency issues when:

1. WebSocket handlers need to inject domain services for business logic
2. Domain services need to inject WebSocket handlers to send real-time updates

```typescript
// ❌ This creates a circular dependency
@WebSocket('/notifications')
export class NotificationWebSocket extends AsenaWebSocketService<{}> {
  @Inject(UserService)  // WebSocket needs service
  private userService: UserService;
}

@Service('UserService')
export class UserService {
  @Inject(NotificationWebSocket)  // ❌ Service needs WebSocket - CIRCULAR!
  private notificationWs: NotificationWebSocket;
}
```

## The Solution

Ulak acts as a mediator between your services and WebSocket connections:

```
┌───────────────────────────────────────────┐
│              Application Layer            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ Service1 │  │ Service2 │  │ Service3 │ │
│  │  Inject  │  │  Inject  │  │  Inject  │ │
│  │   Ulak   │  │   Ulak   │  │   Ulak   │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘ │
│       └────────────┬┴──────────────┘      │
└────────────────────┼──────────────────────┘
                     ▼
            ┌─────────────────┐
            │      Ulak       │
            │ (Message Broker)│
            └────────┬────────┘
                     │
         ┌───────────┼───────────┐
         ▼           ▼           ▼
    WebSocket1  WebSocket2  WebSocket3
```

## Getting Started

### Basic Usage

Inject a scoped Ulak namespace in your service:

```typescript
import { Service } from '@asenajs/asena/server';
import { Inject } from '@asenajs/asena/ioc';
import { ulak, type Ulak } from '@asenajs/asena/messaging';

@Service('UserService')
export class UserService {
  // Inject scoped namespace - most ergonomic API
  @Inject(ulak('/notifications'))
  private notifications: Ulak.NameSpace<'/notifications'>;

  async createUser(name: string, email: string) {
    const user = await this.saveUser(name, email);

    // Broadcast to all connected clients
    await this.notifications.broadcast({
      type: 'user_created',
      user
    });

    return user;
  }

  async notifyUser(userId: string, message: string) {
    // Send to specific room
    await this.notifications.to(`user:${userId}`, {
      type: 'notification',
      message
    });
  }

  private async saveUser(name: string, email: string) {
    // Database logic
    return { id: '123', name, email };
  }
}
```

### WebSocket Handler

Your WebSocket handlers continue to work as before:

```typescript
import { WebSocket } from '@asenajs/asena/server';
import { AsenaWebSocketService, type Socket } from '@asenajs/asena/web-socket';
import { Inject } from '@asenajs/asena/ioc';

@WebSocket('/notifications')
export class NotificationWebSocket extends AsenaWebSocketService<{ userId: string }> {
  // ✅ No circular dependency!
  @Inject(UserService)
  private userService: UserService;

  protected async onOpen(socket: Socket<{ userId: string }>) {
    // Subscribe user to their personal room
    socket.subscribe(`user:${socket.data.userId}`);
    console.log(`User ${socket.data.userId} connected`);
  }

  protected async onMessage(socket: Socket<{ userId: string }>, message: string) {
    const data = JSON.parse(message);
    // Use service for business logic
    await this.userService.handleNotification(socket.data.userId, data);
  }
}
```

## Three Ways to Use Ulak

### 1. Scoped Namespace (Recommended)

The most ergonomic API - no namespace repetition:

```typescript
import { Service } from '@asenajs/asena/server';
import { Inject } from '@asenajs/asena/ioc';
import { ulak, type Ulak } from '@asenajs/asena/messaging';

@Service('ChatService')
export class ChatService {
  // ✅ Recommended: Clean, type-safe, no repetition
  @Inject(ulak('/chat'))
  private chat: Ulak.NameSpace<'/chat'>;

  async sendMessage(roomId: string, message: string) {
    // No need to specify namespace again
    await this.chat.to(roomId, { message });
  }

  async broadcastAnnouncement(text: string) {
    await this.chat.broadcast({ type: 'announcement', text });
  }
}
```

### 2. Expression-Based Injection

For advanced scenarios with transformations:

```typescript
import { Service } from '@asenajs/asena/server';
import { Inject } from '@asenajs/asena/ioc';
import { type Ulak } from '@asenajs/asena/messaging';
import { ICoreServiceNames } from '@asenajs/asena';


@Service('NotificationService')
export class NotificationService {
  // ✅ Good: Explicit transformation
  @Inject(ICoreServiceNames.__ULAK__, (ulak: Ulak) => ulak.namespace('/notifications'))
  private notifications: Ulak.NameSpace<'/notifications'>;

  async notifyUser(userId: string, data: any) {
    await this.notifications.to(`user:${userId}`, data);
  }
}
```

### 3. Direct Ulak Injection

For working with multiple or dynamic namespaces:

```typescript
import { Service } from '@asenajs/asena/server';
import { Inject } from '@asenajs/asena/ioc';
import { type Ulak } from '@asenajs/asena/messaging';
import { ICoreServiceNames } from '@asenajs/asena';

@Service('MultiChannelService')
export class MultiChannelService {
  // ✅ Fallback: Useful for multiple namespaces
  @Inject(ICoreServiceNames.__ULAK__)
  private ulak: Ulak;

  async broadcastToAll(message: string) {
    // Must specify namespace each time
    await this.ulak.broadcast('/notifications', { message });
    await this.ulak.broadcast('/chat', { message });
    await this.ulak.broadcast('/dashboard', { message });
  }
}
```

### Multiple Scoped Namespaces

When you need to work with multiple namespaces regularly:

```typescript
import { Service } from '@asenajs/asena/server';
import { Inject } from '@asenajs/asena/ioc';
import { ulak, type Ulak } from '@asenajs/asena/messaging';

@Service('AdminService')
export class AdminService {
  @Inject(ulak('/notifications'))
  private notifications: Ulak.NameSpace<'/notifications'>;

  @Inject(ulak('/admin-alerts'))
  private adminAlerts: Ulak.NameSpace<'/admin-alerts'>;

  @Inject(ulak('/metrics'))
  private metrics: Ulak.NameSpace<'/metrics'>;

  async broadcastSystemMessage(message: string) {
    // Each namespace has its own clean API
    await this.notifications.broadcast({ type: 'system', message });
    await this.adminAlerts.broadcast({ type: 'system_broadcast', message });
  }

  async publishMetric(metric: any) {
    await this.metrics.broadcast(metric);
  }
}
```

## API Reference

### Ulak Core API

#### `broadcast(namespace: string, data: any): Promise<void>`

Broadcast message to all clients in a namespace:

```typescript
await ulak.broadcast('/chat', {
  type: 'announcement',
  text: 'Server maintenance in 5 minutes'
});
```

#### `to(namespace: string, room: string, data: any): Promise<void>`

Send message to specific room:

```typescript
await ulak.to('/chat', 'room-123', {
  type: 'message',
  text: 'Hello room!'
});
```

#### `toSocket(namespace: string, socketId: string, data: any): Promise<void>`

Send message to specific socket:

```typescript
await ulak.toSocket('/notifications', 'socket-abc', {
  type: 'direct_message',
  text: 'Hello!'
});
```

#### `toMany(namespace: string, rooms: string[], data: any): Promise<void>`

Send to multiple rooms at once (parallel execution):

```typescript
await ulak.toMany('/chat', ['room-1', 'room-2', 'room-3'], {
  type: 'update',
  data: { count: 42 }
});
```

#### `broadcastAll(data: any): Promise<void>`

Broadcast to all namespaces:

```typescript
await ulak.broadcastAll({
  type: 'system_shutdown',
  message: 'Server shutting down'
});
```

#### `bulkSend(operations: BulkOperation[]): Promise<BulkResult>`

Execute multiple operations in bulk:

```typescript
const result = await ulak.bulkSend([
  { type: 'broadcast', namespace: '/chat', data: { msg: '1' } },
  { type: 'room', namespace: '/chat', room: 'room-1', data: { msg: '2' } },
  { type: 'socket', namespace: '/chat', socketId: 'socket-1', data: { msg: '3' } }
]);

console.log(`${result.succeeded} succeeded, ${result.failed} failed`);
```

#### `namespace<T>(path: T): Ulak.NameSpace<T>`

Get scoped namespace interface:

```typescript
const chat = ulak.namespace('/chat');
await chat.broadcast({ message: 'Hello' });
```

#### `getNamespaces(): string[]`

Get all registered namespace paths:

```typescript
const namespaces = ulak.getNamespaces();
// ['/chat', '/notifications', '/dashboard']
```

#### `hasNamespace(namespace: string): boolean`

Check if namespace exists:

```typescript
if (ulak.hasNamespace('/chat')) {
  await ulak.broadcast('/chat', { message: 'Hello' });
}
```

#### `getSocketCount(namespace: string): number`

Get active socket count for namespace:

```typescript
const count = ulak.getSocketCount('/chat');
console.log(`${count} clients connected to chat`);
```

### Scoped Namespace API

When using `ulak()` helper or `namespace()` method, you get a scoped API:

#### `broadcast(data: any): Promise<void>`

```typescript
await chat.broadcast({ message: 'Hello everyone!' });
```

#### `to(room: string, data: any): Promise<void>`

```typescript
await chat.to('room-123', { message: 'Hello room!' });
```

#### `toSocket(socketId: string, data: any): Promise<void>`

```typescript
await chat.toSocket('socket-abc', { message: 'Hello!' });
```

#### `toMany(rooms: string[], data: any): Promise<void>`

```typescript
await chat.toMany(['room-1', 'room-2'], { update: true });
```

#### `getSocketCount(): number`

```typescript
const count = chat.getSocketCount();
```

#### `path: string`

```typescript
console.log(chat.path); // '/chat'
```

## Error Handling

Ulak throws structured errors with specific error codes:

```typescript
import { UlakError, UlakErrorCode } from '@asenajs/asena';

try {
  await ulak.broadcast('/non-existent', { message: 'test' });
} catch (error) {
  if (error instanceof UlakError) {
    console.error(`Error code: ${error.code}`);
    console.error(`Namespace: ${error.namespace}`);
    console.error(`Message: ${error.message}`);
    console.error(`Cause:`, error.cause);
  }
}
```

### Error Codes

- `NAMESPACE_NOT_FOUND` - Namespace doesn't exist
- `NAMESPACE_ALREADY_EXISTS` - Namespace already registered
- `INVALID_NAMESPACE` - Invalid namespace format
- `INVALID_MESSAGE` - Invalid message data
- `SEND_FAILED` - Failed to send message
- `BROADCAST_FAILED` - Failed to broadcast
- `SOCKET_NOT_FOUND` - Socket ID not found
- `SERVICE_NOT_INITIALIZED` - Ulak not initialized

### Error Handling Best Practices

```typescript
@Service('ChatService')
export class ChatService {
  @Inject(ulak('/chat'))
  private chat: Ulak.NameSpace<'/chat'>;

  async sendMessage(roomId: string, message: string) {
    try {
      await this.chat.to(roomId, { message });
    } catch (error) {
      if (error instanceof UlakError) {
        if (error.code === UlakErrorCode.NAMESPACE_NOT_FOUND) {
          console.error('Chat namespace not registered');
        } else if (error.code === UlakErrorCode.SEND_FAILED) {
          console.error('Failed to send message, retrying...');
          // Implement retry logic
        }
      }
      throw error; // Re-throw for logging
    }
  }
}
```

## Lifecycle Management

### Unregistering Namespaces

Clean up when a namespace is no longer needed:

```typescript
ulak.unregisterNamespace('/old-chat');
```

### Disposing Ulak

Clean up all resources when shutting down:

```typescript
// Called automatically on server shutdown
ulak.dispose();
```

## Best Practices

### 1. Use Scoped Namespaces

Prefer `ulak()` helper for cleaner code:

```typescript
// ✅ Recommended
@Inject(ulak('/chat'))
private chat: Ulak.NameSpace<'/chat'>;

// ❌ Avoid repetition
@Inject(ICoreServiceNames.__ULAK__)
private ulak: Ulak;
await this.ulak.broadcast('/chat', data);  // Repetitive
```

### 2. Handle Errors Gracefully

Always wrap Ulak calls in try-catch:

```typescript
async notifyUser(userId: string, data: any) {
  try {
    await this.notifications.to(`user:${userId}`, data);
  } catch (error) {
    this.logger.error('Failed to notify user', { userId, error });
    // Don't let notification failures crash the application
  }
}
```

### 3. Use Batch Operations

For multiple operations, use batch methods:

```typescript
// ✅ Good: Parallel execution
await this.chat.toMany(['room-1', 'room-2', 'room-3'], data);

// ❌ Bad: Sequential execution
await this.chat.to('room-1', data);
await this.chat.to('room-2', data);
await this.chat.to('room-3', data);
```

### 5. Type Your Messages

Use TypeScript interfaces for message types:

```typescript
import { Service } from '@asenajs/asena/server';
import { Inject } from '@asenajs/asena/ioc';
import { ulak, type Ulak } from '@asenajs/asena/messaging';

interface ChatMessage {
  type: 'message' | 'announcement' | 'system';
  text: string;
  userId?: string;
  timestamp: number;
}

@Service('ChatService')
export class ChatService {
  @Inject(ulak('/chat'))
  private chat: Ulak.NameSpace<'/chat'>;

  async sendMessage(room: string, message: ChatMessage) {
    await this.chat.to(room, message);
  }
}
```

## Advanced Examples

### Real-Time Notifications System

```typescript
import { Service } from '@asenajs/asena/server';
import { Inject } from '@asenajs/asena/ioc';
import { ulak, type Ulak } from '@asenajs/asena/messaging';

@Service('NotificationService')
export class NotificationService {
  @Inject(ulak('/notifications'))
  private notifications: Ulak.NameSpace<'/notifications'>;

  async notifyUserFollowers(userId: string, event: string) {
    const followers = await this.getFollowers(userId);

    // Send to multiple users at once
    await this.notifications.toMany(
      followers.map(f => `user:${f.id}`),
      {
        type: 'follower_activity',
        event,
        userId
      }
    );
  }

  async notifyAdmins(alert: any) {
    await this.notifications.to('admin-room', {
      type: 'admin_alert',
      ...alert,
      timestamp: Date.now()
    });
  }

  private async getFollowers(userId: string) {
    // Database logic
    return [];
  }
}
```

### Multi-Namespace Dashboard

```typescript
import { Service } from '@asenajs/asena/server';
import { Inject } from '@asenajs/asena/ioc';
import { ulak, type Ulak } from '@asenajs/asena/messaging';

@Service('DashboardService')
export class DashboardService {
  @Inject(ulak('/dashboard'))
  private dashboard: Ulak.NameSpace<'/dashboard'>;

  @Inject(ulak('/metrics'))
  private metrics: Ulak.NameSpace<'/metrics'>;

  async updateDashboard(data: any) {
    // Update dashboard
    await this.dashboard.broadcast({
      type: 'dashboard_update',
      data
    });

    // Track metrics
    await this.metrics.broadcast({
      type: 'metric',
      name: 'dashboard_update',
      value: 1,
      timestamp: Date.now()
    });
  }
}
```

### Background Job Notifications

```typescript
import { Service } from '@asenajs/asena/server';
import { Inject } from '@asenajs/asena/ioc';
import { ulak, type Ulak } from '@asenajs/asena/messaging';

@Service('JobService')
export class JobService {
  @Inject(ulak('/jobs'))
  private jobs: Ulak.NameSpace<'/jobs'>;

  async runLongJob(userId: string) {
    const jobId = crypto.randomUUID();

    // Notify job started
    await this.jobs.to(`user:${userId}`, {
      type: 'job_started',
      jobId
    });

    try {
      // Run long operation
      await this.performLongOperation();

      // Notify completion
      await this.jobs.to(`user:${userId}`, {
        type: 'job_completed',
        jobId,
        result: 'success'
      });
    } catch (error) {
      // Notify failure
      await this.jobs.to(`user:${userId}`, {
        type: 'job_failed',
        jobId,
        error: error.message
      });
    }
  }

  private async performLongOperation() {
    // Long-running task
  }
}
```

## Migration Guide

### From Direct WebSocket Injection

If you were trying to inject WebSocket services directly (causing circular dependencies):

**Before:**
```typescript
@Service('UserService')
export class UserService {
  @Inject(NotificationWebSocket)  // ❌ Circular dependency
  private notificationWs: NotificationWebSocket;

  async createUser(name: string) {
    const user = await this.saveUser(name);
    this.notificationWs.in({ type: 'user_created', user });
  }
}
```

**After:**
```typescript
@Service('UserService')
export class UserService {
  @Inject(ulak('/notifications'))  // ✅ No circular dependency
  private notifications: Ulak.NameSpace<'/notifications'>;

  async createUser(name: string) {
    const user = await this.saveUser(name);
    await this.notifications.broadcast({ type: 'user_created', user });
  }
}
```

## Type Definitions

```typescript
// Ulak core class
class Ulak {
  broadcast(namespace: string, data: any): Promise<void>;
  to(namespace: string, room: string, data: any): Promise<void>;
  toSocket(namespace: string, socketId: string, data: any): Promise<void>;
  toMany(namespace: string, rooms: string[], data: any): Promise<void>;
  broadcastAll(data: any): Promise<void>;
  bulkSend(operations: BulkOperation[]): Promise<BulkResult>;
  namespace<T extends string>(path: T): Ulak.NameSpace<T>;
  getNamespaces(): string[];
  hasNamespace(namespace: string): boolean;
  getSocketCount(namespace: string): number;
  unregisterNamespace(path: string): void;
  dispose(): void;
}

// Scoped namespace interface
namespace Ulak {
  interface NameSpace<T extends string = string> {
    readonly path: T;
    broadcast(data: any): Promise<void>;
    to(room: string, data: any): Promise<void>;
    toSocket(socketId: string, data: any): Promise<void>;
    toMany(rooms: string[], data: any): Promise<void>;
    getSocketCount(): number;
  }
}

// Helper function
function ulak<T extends string>(namespace: T): readonly [string, (ulak: Ulak) => Ulak.NameSpace<T>];

// Error class
class UlakError extends Error {
  code: UlakErrorCode;
  namespace?: string;
  cause?: Error;
}

// Bulk operation types
type BulkOperationType = 'broadcast' | 'room' | 'socket';

interface BulkOperation {
  type: BulkOperationType;
  namespace: string;
  room?: string;
  socketId?: string;
  data: any;
}

interface BulkResult {
  total: number;
  succeeded: number;
  failed: number;
  results: PromiseSettledResult<void>[];
}
```

## See Also

- [WebSocket](/docs/concepts/websocket.md) - Basic WebSocket usage
- [Dependency Injection](/docs/concepts/dependency-injection.md) - Understanding DI in Asena
- [Services](/docs/concepts/services.md) - Creating services
