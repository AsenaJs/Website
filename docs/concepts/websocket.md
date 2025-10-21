---
title: WebSocket
description: Real-time bidirectional communication with namespace support
outline: deep
---

# WebSocket

Asena provides built-in WebSocket support with namespace management, allowing you to create real-time, bidirectional communication between clients and your server.

## Creating a WebSocket Service

Create a WebSocket service by extending `AsenaWebSocketService` and decorating it with `@WebSocket`:

```typescript
import { WebSocket } from '@asenajs/asena/web-socket';
import { AsenaWebSocketService } from '@asenajs/asena/web-socket';
import type { Socket } from '@asenajs/asena/web-socket';

@WebSocket({ path: '/chat', name: 'ChatSocket' })
export class ChatSocket extends AsenaWebSocketService<void> {
  protected async onOpen(ws: Socket<void>): Promise<void> {
    console.log('Client connected:', ws.id);
    ws.send('Welcome to chat!');
  }

  protected async onMessage(ws: Socket<void>, message: string): Promise<void> {
    console.log('Received:', message);
    ws.send(`Echo: ${message}`);
  }

  protected async onClose(ws: Socket<void>): Promise<void> {
    console.log('Client disconnected:', ws.id);
  }
}
```

## WebSocket Lifecycle Methods

### onOpen(socket)

Called when a client connects.

```typescript
protected async onOpen(ws: Socket): Promise<void> {
  console.log(`New connection: ${ws.id}`);
  ws.send(JSON.stringify({ type: 'welcome', message: 'Connected!' }));
}
```

### onMessage(socket, message)

Called when a message is received.

```typescript
protected async onMessage(ws: Socket, message: string): Promise<void> {
  const data = JSON.parse(message);

  if (data.type === 'ping') {
    ws.send(JSON.stringify({ type: 'pong' }));
  }
}
```

### onClose(socket)

Called when a client disconnects.

```typescript
protected async onClose(ws: Socket): Promise<void> {
  console.log(`Client disconnected: ${ws.id}`);
  // Cleanup logic
}
```

## Socket API

### ws.send(message)

Send a message to the client.

```typescript
ws.send('Hello client!');
ws.send(JSON.stringify({ type: 'update', data: { count: 42 } }));
```

### ws.id

Unique identifier for the socket connection.

```typescript
console.log(`Socket ID: ${ws.id}`);
```

### ws.data

Custom data attached to the socket (typed).

```typescript
interface UserData {
  userId: string;
  username: string;
}

@WebSocket({ path: '/chat', name: 'ChatSocket' })
export class ChatSocket extends AsenaWebSocketService<UserData> {
  protected async onOpen(ws: Socket<UserData>): Promise<void> {
    console.log(`User connected: ${ws.data?.username}`);
  }
}
```

## Built-in Room Management

::: tip Asena's Built-in Features
Asena provides **automatic room management** with built-in pub/sub pattern. You don't need to manually manage `Map<string, Socket[]>` or track connections yourself - Asena handles everything for you!

**Key built-in features:**
- `ws.subscribe(room)` - Automatically joins room and tracks membership
- `ws.publish(room, data)` - Broadcasts to all room subscribers
- `ws.unsubscribe(room)` - Leaves room with automatic cleanup
- `this.sockets` - All connected sockets (managed automatically)
- `this.rooms` - All rooms and their members (managed automatically)
- `this.to(room, data)` - Broadcast from service level
- `this.in(data)` - Broadcast to all connected clients
:::

### Subscribing to Rooms

When a client connects, use `subscribe()` to join a room. Asena automatically tracks the socket in that room:

```typescript
interface ChatData {
  username: string;
  room: string;
}

@WebSocket({ path: '/chat', name: 'ChatSocket' })
export class ChatSocket extends AsenaWebSocketService<ChatData> {
  protected async onOpen(ws: Socket<ChatData>): Promise<void> {
    const room = ws.data?.room || 'general';
    const username = ws.data?.username || 'Anonymous';

    // Subscribe to room - Asena tracks this automatically
    ws.subscribe(room);

    // Welcome the user
    ws.send(JSON.stringify({
      type: 'welcome',
      message: `Welcome to ${room}, ${username}!`
    }));

    // Notify others in the room using publish
    ws.publish(room, JSON.stringify({
      type: 'user_joined',
      username,
      timestamp: new Date().toISOString()
    }));
  }
}
```

### Publishing Messages

Use `ws.publish()` to broadcast messages to all subscribers of a room:

```typescript
protected async onMessage(ws: Socket<ChatData>, message: string): Promise<void> {
  const room = ws.data?.room || 'general';
  const username = ws.data?.username;

  try {
    const data = JSON.parse(message);

    if (data.type === 'message') {
      // Broadcast to all subscribers in the room
      ws.publish(room, JSON.stringify({
        type: 'message',
        username,
        message: data.message,
        timestamp: new Date().toISOString()
      }));
    }
  } catch (error) {
    ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
  }
}
```

### Unsubscribing from Rooms

When a client disconnects or leaves a room, use `unsubscribe()`:

```typescript
protected async onClose(ws: Socket<ChatData>): Promise<void> {
  const room = ws.data?.room || 'general';
  const username = ws.data?.username;

  // Notify room before leaving
  ws.publish(room, JSON.stringify({
    type: 'user_left',
    username
  }));

  // Unsubscribe - Asena handles cleanup automatically
  ws.unsubscribe(room);
}
```

### Accessing Room Members

You can access all sockets in a room using the built-in `this.rooms` map:

```typescript
protected async onMessage(ws: Socket<ChatData>, message: string): Promise<void> {
  const room = ws.data?.room || 'general';

  // Get all sockets in this room
  const roomMembers = this.getSocketsByRoom(room);

  ws.send(JSON.stringify({
    type: 'room_info',
    totalUsers: roomMembers?.length || 0
  }));
}
```

## Broadcasting

### Broadcast to All Clients

Use the built-in `this.in()` method to broadcast to all connected clients:

```typescript
@WebSocket({ path: '/notifications', name: 'NotificationSocket' })
export class NotificationSocket extends AsenaWebSocketService<void> {
  // No need to manually track sockets - Asena does it for you!

  // Public method to broadcast notifications
  broadcastNotification(notification: any) {
    const message = JSON.stringify(notification);

    // Broadcast to all connected clients
    this.in(message);
  }

  // You can also access all sockets via this.sockets (built-in)
  getConnectedUsers() {
    return Array.from(this.sockets.keys());
  }
}
```

### Broadcast to Specific Room

Use `this.to(room, data)` to broadcast to a specific room from the service level:

```typescript
@WebSocket({ path: '/chat', name: 'ChatSocket' })
export class ChatSocket extends AsenaWebSocketService<{ room: string }> {
  // Broadcast to a specific room
  notifyRoom(room: string, notification: any) {
    this.to(room, JSON.stringify(notification));
  }

  // Example: Admin sends announcement to a room
  sendAnnouncement(room: string, message: string) {
    this.to(room, JSON.stringify({
      type: 'announcement',
      message,
      timestamp: new Date().toISOString()
    }));
  }
}
```

### Private Messages

Send a message to a specific user using their socket ID:

```typescript
sendPrivateMessage(targetSocketId: string, message: string) {
  const targetSocket = this.sockets.get(targetSocketId);

  if (targetSocket) {
    targetSocket.send(JSON.stringify({
      type: 'private_message',
      message
    }));
  }
}
```

## WebSocket Middleware

Just like controllers, WebSocket services support middleware! This is the **recommended way** to handle authentication, logging, and rate limiting.

### Creating WebSocket Middleware

```typescript
import { Middleware } from '@asenajs/asena/server';
import type { Context, MiddlewareService } from '@asenajs/ergenecore';

@Middleware()
export class WsAuthMiddleware implements MiddlewareService {
  async handle(context: Context, next: () => Promise<void>): Promise<boolean | Response> {
    // Check query params for token
    const url = new URL(context.req.url);
    const token = url.searchParams.get('token');

    // Or check Authorization header
    const authHeader = context.req.headers.get('Authorization');
    const tokenFromHeader = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : null;

    const finalToken = token || tokenFromHeader;

    if (!finalToken) {
      return context.send({ error: 'Unauthorized' }, 401);
    }

    // Verify token (replace with your auth logic)
    if (finalToken !== 'valid-token') {
      return context.send({ error: 'Invalid token' }, 401);
    }

    // Pass user data to WebSocket using setWebSocketValue
    context.setWebSocketValue({
      userId: '123',
      username: 'john_doe'
    });

    await next();
  }
}
```

::: tip context.setWebSocketValue()
This is the key method! Use `context.setWebSocketValue()` in middleware to pass authenticated user data to your WebSocket service. The data will be available in `ws.data.values`.
:::

### Using Middleware in WebSocket

```typescript
import { WebSocket } from '@asenajs/asena/server';
import { AsenaWebSocketService, type Socket } from '@asenajs/asena/web-socket';
import { WsAuthMiddleware } from '../middlewares/WsAuthMiddleware';

interface UserData {
  userId: string;
  username: string;
}

@WebSocket({
  path: '/private',
  middlewares: [WsAuthMiddleware], // Add middleware here
  name: 'PrivateSocket'
})
export class PrivateSocket extends AsenaWebSocketService<UserData> {
  protected async onOpen(ws: Socket<UserData>): Promise<void> {
    // Access authenticated user data from middleware
    const { userId, username } = ws.data.values;

    console.log(`Authenticated user connected: ${username}`);

    ws.send(JSON.stringify({
      type: 'authenticated',
      userId,
      username
    }));
  }

  protected async onMessage(ws: Socket<UserData>, message: string): Promise<void> {
    const { username } = ws.data.values;
    console.log(`Message from ${username}:`, message);
  }
}
```

### Multiple Middleware

You can use multiple middleware, just like in controllers:

```typescript
import { WsLoggingMiddleware } from '../middlewares/WsLoggingMiddleware';
import { WsAuthMiddleware } from '../middlewares/WsAuthMiddleware';
import { WsRateLimitMiddleware } from '../middlewares/WsRateLimitMiddleware';

@WebSocket({
  path: '/admin',
  middlewares: [
    WsLoggingMiddleware,      // Runs first
    WsAuthMiddleware,          // Then authentication
    WsRateLimitMiddleware      // Finally rate limiting
  ],
  name: 'AdminSocket'
})
export class AdminSocket extends AsenaWebSocketService<AdminData> {
  protected async onOpen(ws: Socket<AdminData>): Promise<void> {
    // Only authenticated and rate-limited users reach here
    const userData = ws.data.values;

    ws.send(JSON.stringify({
      type: 'admin-welcome',
      user: userData,
      permissions: ['read', 'write', 'delete']
    }));
  }
}
```

::: info Middleware Execution Order
Middleware executes in the order specified in the array, **before** the WebSocket connection is established. If any middleware returns a response or doesn't call `next()`, the connection is rejected.
:::

### Client-Side Example

Connect with authentication:

```typescript
// With query parameter
const ws = new WebSocket('ws://localhost:3000/private?token=valid-token');

// Or with Authorization header (if your WebSocket client supports it)
const ws = new WebSocket('ws://localhost:3000/private', {
  headers: {
    'Authorization': 'Bearer valid-token'
  }
});
```

## Using WebSocket in Services

You can inject a WebSocket service into other services to send messages from anywhere in your application:

```typescript
import { Service } from '@asenajs/asena/server';
import { Inject } from '@asenajs/asena/ioc';
import { ChatSocket } from './ChatSocket';

@Service('NotificationService')
export class NotificationService {
  @Inject(ChatSocket)
  private chatSocket: ChatSocket;

  async sendSystemMessage(room: string, message: string) {
    // Broadcast from outside the WebSocket service
    this.chatSocket.to(room, JSON.stringify({
      type: 'system_message',
      message,
      timestamp: new Date().toISOString()
    }));
  }

  async notifyAllUsers(message: string) {
    // Broadcast to all connected clients
    this.chatSocket.in(JSON.stringify({
      type: 'notification',
      message
    }));
  }
}
```

::: tip Service Injection
This is a powerful pattern! You can send WebSocket messages from controllers, services, or background jobs by injecting the WebSocket service.
:::

## Real-World Example: Notification System

Here's a simple notification system showing how to use WebSocket with service injection:

### WebSocket Service

```typescript
import { WebSocket } from '@asenajs/asena/server';
import { AsenaWebSocketService, type Socket } from '@asenajs/asena/web-socket';

interface NotificationData {
  userId: string;
}

@WebSocket({ path: '/ws/notifications', name: 'NotificationSocket' })
export class NotificationSocket extends AsenaWebSocketService<NotificationData> {
  protected async onOpen(ws: Socket<NotificationData>): Promise<void> {
    const userId = ws.data?.userId;

    // Subscribe to user's personal notification channel
    ws.subscribe(`user:${userId}`);

    // Subscribe to global announcements
    ws.subscribe('announcements');

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connected',
      message: 'Connected to notification system'
    }));
  }

  protected async onClose(ws: Socket<NotificationData>): Promise<void> {
    const userId = ws.data?.userId;

    // Unsubscribe from channels - Asena handles cleanup
    ws.unsubscribe(`user:${userId}`);
    ws.unsubscribe('announcements');
  }

  protected async onMessage(ws: Socket<NotificationData>, message: string): Promise<void> {
    try {
      const data = JSON.parse(message);

      if (data.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
      }
    } catch (error) {
      console.error('Invalid message format');
    }
  }
}
```

### Using WebSocket from a Service

Now you can send notifications from any service in your application:

```typescript
import { Service } from '@asenajs/asena/server';
import { Inject } from '@asenajs/asena/ioc';
import { NotificationSocket } from '../websocket/NotificationSocket';

@Service('UserService')
export class UserService {
  @Inject(NotificationSocket)
  private notificationSocket: NotificationSocket;

  async updateUserProfile(userId: string, data: any): Promise<void> {
    // ... update user in database

    // Notify the user via WebSocket
    this.notificationSocket.to(`user:${userId}`, JSON.stringify({
      type: 'profile_updated',
      message: 'Your profile has been updated',
      timestamp: new Date().toISOString()
    }));
  }

  async sendGlobalAnnouncement(message: string): Promise<void> {
    // Broadcast to all users subscribed to announcements
    this.notificationSocket.to('announcements', JSON.stringify({
      type: 'announcement',
      message,
      timestamp: new Date().toISOString()
    }));
  }
}
```

### Using from a Controller

You can also trigger notifications from HTTP endpoints:

```typescript
import { Controller } from '@asenajs/asena/server';
import { Post } from '@asenajs/asena/web';
import { Inject } from '@asenajs/asena/ioc';
import type { Context } from '@asenajs/ergenecore/types';

@Controller('/admin')
export class AdminController {
  @Inject(NotificationSocket)
  private notificationSocket: NotificationSocket;

  @Post('/announcement')
  async sendAnnouncement(context: Context) {
    const { message } = await context.getBody();

    // Broadcast to all connected clients
    this.notificationSocket.to('announcements', JSON.stringify({
      type: 'announcement',
      message,
      timestamp: new Date().toISOString()
    }));

    return context.json({ success: true });
  }
}
```

::: info Key Takeaways
This example demonstrates:
- **Built-in room management** with `subscribe()` / `unsubscribe()`
- **Service injection** to send WebSocket messages from anywhere
- **Multiple channels** (user-specific and global)
- **Controller integration** for HTTP → WebSocket communication
- Asena handles all socket/room tracking automatically
:::

## Error Handling

```typescript
@WebSocket({ path: '/chat', name: 'ChatSocket' })
export class ChatSocket extends AsenaWebSocketService<void> {
  protected async onMessage(ws: Socket<void>, message: string): Promise<void> {
    try {
      const data = JSON.parse(message);

      // Process message
      if (!data.type) {
        throw new Error('Message type is required');
      }

      // Handle different message types
      switch (data.type) {
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong' }));
          break;
        default:
          throw new Error(`Unknown message type: ${data.type}`);
      }
    } catch (error) {
      ws.send(JSON.stringify({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }
}
```

## Best Practices

### 1. Use Built-in Room Management

```typescript
// ✅ Good: Use Asena's built-in subscribe/unsubscribe
protected async onOpen(ws: Socket) {
  ws.subscribe('room-1');
  ws.publish('room-1', 'Hello room!');
}

protected async onClose(ws: Socket) {
  ws.unsubscribe('room-1');
}

// ❌ Bad: Manually managing rooms with Map
private rooms = new Map<string, Set<Socket>>(); // Don't do this!
```

::: warning Avoid Manual Room Management
Asena automatically tracks sockets in rooms when you use `subscribe()` and `unsubscribe()`. Manual Map-based room management can lead to memory leaks and synchronization issues.
:::

### 2. Use Broadcasting Methods

```typescript
// ✅ Good: Use built-in broadcasting
this.to('room-1', 'Message to room');  // Broadcast to specific room
this.in('Message to all');             // Broadcast to all clients

// ✅ Good: Use publish from socket level
ws.publish('room-1', 'Message from user');

// ❌ Bad: Manual iteration over sockets
for (const socket of this.sockets.values()) {
  socket.send(message); // Inefficient and error-prone
}
```

### 3. Let Asena Handle Cleanup

```typescript
// ✅ Good: Asena handles cleanup automatically
protected async onClose(ws: Socket) {
  // Just unsubscribe from rooms
  ws.unsubscribe('room-1');

  // Asena automatically:
  // - Removes socket from this.sockets
  // - Cleans up room references
  // - Handles connection termination
}

// ❌ Bad: Manual cleanup (unnecessary and error-prone)
protected async onClose(ws: Socket) {
  this.sockets.delete(ws.id);           // Asena does this!
  this.rooms.forEach(r => r.delete(ws)); // Asena does this too!
}
```

## Breaking Circular Dependencies with Ulak

When building complex applications, you may encounter **circular dependency** issues when:

1. **WebSocket services need to inject business services** for domain logic
2. **Business services need to inject WebSocket services** to send real-time updates

::: danger Circular Dependency Problem
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
:::

### The Solution: Ulak Message Broker

**Ulak** (Turkish: Messenger/Courier) is Asena's centralized WebSocket message broker that breaks this circular dependency by acting as a mediator between services and WebSocket connections.

```typescript
// ✅ No circular dependency with Ulak
import { Service, Inject, ulak } from '@asenajs/asena';
import type { Ulak } from '@asenajs/asena';

@Service('UserService')
export class UserService {
  // Inject scoped Ulak namespace instead of WebSocket service
  @Inject(ulak('/notifications'))
  private notifications: Ulak.NameSpace<'/notifications'>;

  async createUser(name: string, email: string) {
    const user = await this.saveUser(name, email);

    // Send messages to WebSocket clients without injecting the WebSocket service
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

::: tip When to Use Ulak
Use **Ulak** when you need to:
- Send WebSocket messages from services, controllers, or background jobs
- Avoid circular dependencies between WebSocket handlers and domain services
- Broadcast to multiple namespaces from a single service
- Build scalable real-time features with clean separation of concerns

**Continue using direct WebSocket injection** (this guide's approach) when:
- You only need simple, one-way communication patterns
- You're not facing circular dependency issues
- Your WebSocket logic is self-contained
:::

### Ulak Key Features

- **Three injection styles**: Scoped namespace (recommended), expression-based, or direct Ulak injection
- **Unified API**: `broadcast()`, `to()`, `toSocket()`, `toMany()` for messaging
- **Error handling**: Structured `UlakError` with specific error codes
- **Bulk operations**: Send multiple messages efficiently with `bulkSend()`

For complete documentation, see [Ulak - WebSocket Messaging System](/docs/concepts/ulak).

## Related Documentation

- [Ulak - WebSocket Messaging System](/docs/concepts/ulak) - Break circular dependencies
- [Ergenecore Adapter](/docs/adapters/ergenecore)
- [Hono Adapter](/docs/adapters/hono)
- [Services](/docs/concepts/services)
- [Dependency Injection](/docs/concepts/dependency-injection)

---

**Next Steps:**
- Build a real-time application
- Explore [Services](/docs/concepts/services)
- Learn about [Middleware](/docs/concepts/middleware)
