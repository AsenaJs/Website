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

## Complete Chat Example

```typescript
interface ChatData {
  username: string;
  room: string;
}

@WebSocket({ path: '/chat', name: 'ChatSocket' })
export class ChatSocket extends AsenaWebSocketService<ChatData> {
  private users = new Map<string, { username: string; socket: Socket<ChatData> }>();
  private rooms = new Map<string, Set<string>>(); // room -> socketIds

  protected async onOpen(ws: Socket<ChatData>): Promise<void> {
    const username = ws.data?.username || 'Anonymous';
    const room = ws.data?.room || 'general';

    // Store user
    this.users.set(ws.id, { username, socket: ws });

    // Add to room
    if (!this.rooms.has(room)) {
      this.rooms.set(room, new Set());
    }
    this.rooms.get(room)!.add(ws.id);

    // Notify room
    this.broadcastToRoom(room, JSON.stringify({
      type: 'user_joined',
      username,
      room,
      totalUsers: this.rooms.get(room)!.size
    }), ws.id);

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'welcome',
      message: `Welcome to ${room}, ${username}!`,
      users: Array.from(this.rooms.get(room)!)
        .map(id => this.users.get(id)?.username)
        .filter(Boolean)
    }));
  }

  protected async onMessage(ws: Socket<ChatData>, message: string): Promise<void> {
    const user = this.users.get(ws.id);
    const room = ws.data?.room || 'general';

    try {
      const data = JSON.parse(message);

      if (data.type === 'message') {
        // Broadcast message to room
        this.broadcastToRoom(room, JSON.stringify({
          type: 'message',
          username: user?.username,
          message: data.message,
          timestamp: new Date().toISOString()
        }));
      }

      if (data.type === 'typing') {
        // Notify others in room
        this.broadcastToRoom(room, JSON.stringify({
          type: 'typing',
          username: user?.username
        }), ws.id);
      }
    } catch (error) {
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
    }
  }

  protected async onClose(ws: Socket<ChatData>): Promise<void> {
    const user = this.users.get(ws.id);
    const room = ws.data?.room || 'general';

    // Remove from users
    this.users.delete(ws.id);

    // Remove from room
    if (this.rooms.has(room)) {
      this.rooms.get(room)!.delete(ws.id);

      // Notify room
      this.broadcastToRoom(room, JSON.stringify({
        type: 'user_left',
        username: user?.username,
        totalUsers: this.rooms.get(room)!.size
      }));

      // Clean up empty rooms
      if (this.rooms.get(room)!.size === 0) {
        this.rooms.delete(room);
      }
    }
  }

  private broadcastToRoom(room: string, message: string, excludeId?: string) {
    const socketIds = this.rooms.get(room);
    if (!socketIds) return;

    for (const socketId of socketIds) {
      if (excludeId && socketId === excludeId) continue;

      const user = this.users.get(socketId);
      if (user) {
        user.socket.send(message);
      }
    }
  }
}
```

## Client-Side Connection

### JavaScript/TypeScript Client

```typescript
// Connect to WebSocket
const ws = new WebSocket('ws://localhost:3000/chat');

// Listen for connection
ws.addEventListener('open', () => {
  console.log('Connected to chat!');

  // Send message
  ws.send(JSON.stringify({
    type: 'message',
    message: 'Hello everyone!'
  }));
});

// Listen for messages
ws.addEventListener('message', (event) => {
  const data = JSON.parse(event.data);

  if (data.type === 'message') {
    console.log(`${data.username}: ${data.message}`);
  }

  if (data.type === 'user_joined') {
    console.log(`${data.username} joined the chat`);
  }
});

// Handle disconnection
ws.addEventListener('close', () => {
  console.log('Disconnected from chat');
});

// Handle errors
ws.addEventListener('error', (error) => {
  console.error('WebSocket error:', error);
});
```

### With Custom Data

```typescript
// Client connects with custom data in URL query
const username = 'John';
const room = 'tech';
const ws = new WebSocket(`ws://localhost:3000/chat?username=${username}&room=${room}`);
```

## Broadcasting

### Broadcast to All Clients

```typescript
@WebSocket({ path: '/notifications', name: 'NotificationSocket' })
export class NotificationSocket extends AsenaWebSocketService<void> {
  private sockets = new Map<string, Socket<void>>();

  protected async onOpen(ws: Socket<void>): Promise<void> {
    this.sockets.set(ws.id, ws);
  }

  protected async onClose(ws: Socket<void>): Promise<void> {
    this.sockets.delete(ws.id);
  }

  // Public method to broadcast notifications
  broadcastNotification(notification: any) {
    const message = JSON.stringify(notification);

    for (const socket of this.sockets.values()) {
      socket.send(message);
    }
  }
}
```

### Selective Broadcasting

```typescript
// Broadcast to specific users
broadcastToUsers(userIds: string[], message: string) {
  for (const [socketId, user] of this.users.entries()) {
    if (userIds.includes(user.userId)) {
      user.socket.send(message);
    }
  }
}
```

## Authentication

```typescript
interface AuthenticatedData {
  userId: string;
  token: string;
}

@WebSocket({ path: '/private', name: 'PrivateSocket' })
export class PrivateSocket extends AsenaWebSocketService<AuthenticatedData> {
  @Inject(AuthService)
  private authService: AuthService;

  protected async onOpen(ws: Socket<AuthenticatedData>): Promise<void> {
    const token = ws.data?.token;

    if (!token) {
      ws.send(JSON.stringify({ type: 'error', message: 'Unauthorized' }));
      ws.close();
      return;
    }

    try {
      // Verify token
      const user = await this.authService.verifyToken(token);

      // Socket is authenticated
      ws.send(JSON.stringify({
        type: 'authenticated',
        userId: user.id
      }));
    } catch (error) {
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid token' }));
      ws.close();
    }
  }
}
```

## Room/Channel Management

```typescript
@WebSocket({ path: '/chat', name: 'ChatSocket' })
export class ChatSocket extends AsenaWebSocketService<{ username: string }> {
  private rooms = new Map<string, Set<Socket>>();

  joinRoom(socket: Socket, roomId: string) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    this.rooms.get(roomId)!.add(socket);
  }

  leaveRoom(socket: Socket, roomId: string) {
    this.rooms.get(roomId)?.delete(socket);
  }

  broadcastToRoom(roomId: string, message: string, excludeSocket?: Socket) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    for (const socket of room) {
      if (socket !== excludeSocket) {
        socket.send(message);
      }
    }
  }
}
```

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

### 1. Use JSON for Messages

```typescript
// ✅ Good: Structured JSON messages
ws.send(JSON.stringify({ type: 'update', data: { count: 42 } }));

// ❌ Bad: Raw strings
ws.send('update:42');
```

### 2. Handle Errors Gracefully

```typescript
// ✅ Good: Try-catch in onMessage
protected async onMessage(ws: Socket, message: string) {
  try {
    const data = JSON.parse(message);
    // Process data
  } catch (error) {
    ws.send(JSON.stringify({ type: 'error', message: 'Invalid format' }));
  }
}
```

### 3. Clean Up on Close

```typescript
// ✅ Good: Remove from maps on close
protected async onClose(ws: Socket) {
  this.users.delete(ws.id);
  this.rooms.forEach(room => room.delete(ws.id));
}
```

### 4. Validate Messages

```typescript
// ✅ Good: Validate message structure
protected async onMessage(ws: Socket, message: string) {
  const data = JSON.parse(message);

  if (!data.type || typeof data.type !== 'string') {
    ws.send(JSON.stringify({ type: 'error', message: 'Invalid message' }));
    return;
  }

  // Process valid message
}
```

## Related Documentation

- [Ergenecore Adapter](/docs/adapters/ergenecore)
- [Hono Adapter](/docs/adapters/hono)
- [Services](/docs/concepts/services)
- [Dependency Injection](/docs/concepts/dependency-injection)

---

**Next Steps:**
- Build a real-time application
- Explore [Services](/docs/concepts/services)
- Learn about [Middleware](/docs/concepts/middleware)
