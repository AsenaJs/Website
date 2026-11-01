---
title: Asena Auth
description: Authentication for Asena - native server-side sessions and Better Auth behind the @asenajs/asena/auth contract, with @Protected / @Public / @Roles guards enforced before validators
outline: deep
---

# Asena Auth

`@asenajs/asena-auth` adds authentication to AsenaJS behind core's `@asenajs/asena/auth` contract. It ships two providers: **native opaque sessions** stored on the server, and **[Better Auth](https://www.better-auth.com)**. The contract's `@Protected` / `@Public` / `@Roles` marks become a route guard that answers 401 or 403 before the route's middlewares and its validator run. It works the same on Ergenecore and the Hono adapter.

<div class="card-grid">
  <a class="info-card" href="#quick-start">
    <span class="ic-kicker">01</span>
    <div class="ic-title">Quick Start</div>
    <p class="ic-desc">A provider, a login route and a protected route.</p>
  </a>
  <a class="info-card" href="#route-guards">
    <span class="ic-kicker">02</span>
    <div class="ic-title">Route Guards</div>
    <p class="ic-desc"><code>@Protected</code>, <code>@Public</code>, <code>@Roles</code> and where they run.</p>
  </a>
  <a class="info-card" href="#session-lifecycle">
    <span class="ic-kicker">03</span>
    <div class="ic-title">Session Lifecycle</div>
    <p class="ic-desc">Logout, rotation and per-device revocation.</p>
  </a>
  <a class="info-card" href="#bearer-tokens-and-websocket">
    <span class="ic-kicker">04</span>
    <div class="ic-title">Bearer and WebSocket</div>
    <p class="ic-desc">Header tokens and authenticated socket upgrades.</p>
  </a>
  <a class="info-card" href="#better-auth-provider">
    <span class="ic-kicker">05</span>
    <div class="ic-title">Better Auth</div>
    <p class="ic-desc">Better Auth behind the same guards.</p>
  </a>
  <a class="info-card" href="#testing">
    <span class="ic-kicker">06</span>
    <div class="ic-title">Testing</div>
    <p class="ic-desc">A header-driven provider for tests.</p>
  </a>
</div>

## Features

- **Two Providers, One Contract** - native sessions (`@Auth`) and Better Auth (`@BetterAuth`); any class implementing core's `AsenaAuthProvider` can join them
- **Guards Before Validation** - an anonymous request never reaches route middlewares, the validator or a `Context.define` contract
- **Server-Side Sessions** - random opaque tokens, only their SHA-256 stored, sliding expiry with an absolute cap
- **Session Management** - logout, rotation, listing a user's sessions, revoking one device or all of them
- **Cookie and Bearer** - an HttpOnly cookie for browsers, `Authorization: Bearer` for everything else, a cross-site check for cookie sessions
- **WebSocket Upgrades** - rejected before the upgrade; browsers send the token as a subprotocol
- **Fails at Boot** - ambiguous providers, unknown provider names and guard marks it cannot enforce stop the boot with a message that says what to change
- **Test Provider** - `@asenajs/asena-auth/testing` turns a request header into a session
- **Zero Runtime Dependencies** - tokens and password hashing use Bun's built-ins; `better-auth` is an optional peer

## Installation

```bash
bun add @asenajs/asena-auth
```

For the Better Auth provider:

```bash
bun add @asenajs/asena-auth better-auth
```

**Requirements:**
- [Bun](https://bun.sh) v1.4 or higher
- [@asenajs/asena](https://github.com/AsenaJs/Asena) v0.12.2 or higher
- [@asenajs/ergenecore](/docs/adapters/ergenecore) v5.0.2 or higher, or [@asenajs/hono-adapter](/docs/adapters/hono) v5.0.3 or higher
- [better-auth](https://www.better-auth.com) v1.2 or higher, below v2 - optional peer dependency, only for the Better Auth provider

## Quick Start

The snippets type the context with Ergenecore's `Context`; on the Hono adapter, import `Context` from `@asenajs/hono-adapter` instead.

### 1. Create the Provider

Extend `AsenaAuthService` and decorate it with `@Auth`. Every duration is in seconds.

```typescript
// src/auth/AppAuth.ts
import { AsenaAuthService, Auth } from '@asenajs/asena-auth';

@Auth({ sessionTtl: 3600 })
export class AppAuth extends AsenaAuthService {}
```

The provider registers under its class name, `AppAuth`. Sessions live in an in-process `MemoryAuthStore` until you pass a [`store`](#custom-session-store).

### 2. Issue a Session at Login

```typescript
// src/controllers/AuthController.ts
import { Controller } from '@asenajs/asena/decorators';
import { Post } from '@asenajs/asena/decorators/http';
import { Inject } from '@asenajs/asena/decorators/ioc';
import { applySessionCookie } from '@asenajs/asena-auth';
import type { Context } from '@asenajs/ergenecore';
import { AppAuth } from '../auth/AppAuth';
import { UserService } from '../services/UserService';

@Controller('/auth')
export class AuthController {
  @Inject(AppAuth)
  private auth: AppAuth;

  @Inject(UserService)
  private userService: UserService;

  @Post('/login')
  async login(context: Context) {
    const { email, password } = await context.getBody<{ email: string; password: string }>();
    const user = await this.userService.verifyCredentials(email, password);

    if (!user) {
      return context.send({ error: 'Invalid email or password' }, 401);
    }

    const { token } = await this.auth.createSession({ id: user.id, roles: user.roles });

    await applySessionCookie(context, this.auth, token);

    return context.send({ token });
  }
}
```

`createSession(user)` stores a session and returns its opaque token. `applySessionCookie` writes the token as the `asena_session` cookie for browsers; the token in the body is for clients that send `Authorization: Bearer <token>`. `verifyCredentials` is your code - [Passwords](#passwords) shows one.

The user you hand to `createSession` needs an `id` and is stored as a plain-data snapshot: keep it small, and keep functions out of it (`createSession` throws a `TypeError` on one).

### 3. Register the Package Components

The guard and the middlewares ship inside the package, so they reach the container through [`imports`](/docs/concepts/dependency-injection#registering-components-from-packages):

```typescript
// src/index.ts
import { AsenaServerFactory } from '@asenajs/asena';
import { authComponents } from '@asenajs/asena-auth';

const server = await AsenaServerFactory.create({
  adapter,
  logger,
  imports: [...authComponents],
});

await server.start();
```

| Component | Role |
|:----------|:-----|
| `AuthGuard` | Post-processor: reads the guard marks at boot and puts the guard in front of every protected route |
| `AuthGuardMiddleware` | The guard itself: answers 401 / 403 |
| `AuthProviderRegistry` | Finds the providers, picks the primary, checks every protected route at boot |
| `AuthSessionMiddleware` | Optional global middleware: [sessions on public routes](#optional-sessions-on-public-routes) |
| `AuthWebSocketMiddleware` | Authenticates [WebSocket upgrades](#websocket) |

::: warning `@Protected` is only a mark
Without `AuthGuard` in the container nothing enforces it. When the registry is imported without the guard, the boot logs
`[asena-auth] AuthGuard is not imported: @Protected/@Roles routes are not enforced and not validated. Add it to imports (or import authComponents).`
:::

### 4. Protect a Route

```typescript
// src/controllers/MeController.ts
import { Protected, requireAuthSession } from '@asenajs/asena/auth';
import { Controller } from '@asenajs/asena/decorators';
import { Get } from '@asenajs/asena/decorators/http';
import type { Context } from '@asenajs/ergenecore';

@Protected()
@Controller('/me')
export class MeController {
  @Get('/')
  async me(context: Context) {
    const { user } = requireAuthSession(context);

    return context.send({ id: user.id, roles: user.roles });
  }
}
```

```bash
curl -i http://localhost:3000/me
# 401, WWW-Authenticate: Bearer

curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/me
# 200 {"id":"u1","roles":["user"]}
```

A browser that logged in sends the `asena_session` cookie instead. When a request carries both, the Bearer token wins.

## Route Guards

The three marks come from core's `@asenajs/asena/auth`:

```typescript
import { Protected, Public, Roles } from '@asenajs/asena/auth';
import { Controller } from '@asenajs/asena/decorators';
import { Delete, Get } from '@asenajs/asena/decorators/http';
import type { Context } from '@asenajs/ergenecore';

@Protected()
@Controller('/projects')
export class ProjectController {
  @Get('/')
  list(context: Context) {
    return context.send({ projects: [] });
  }

  @Roles('admin')
  @Delete('/:id')
  remove(context: Context) {
    return context.send({ deleted: context.getParam('id') });
  }

  @Public()
  @Get('/featured')
  featured(context: Context) {
    return context.send({ projects: [] });
  }
}
```

- A class mark covers every route of the controller; a method mark **replaces** it for that route.
- `@Roles(...)` implies `@Protected` and is any-of: a session holding at least one of the roles passes, any other session gets **403** (without `WWW-Authenticate`). `@Roles()` with no role throws at decoration time.
- Roles of a class mark never flow down to a method that has its own mark. The provider name does: `@Roles('admin')` under `@Protected({ provider: 'Partner' })` still asks `Partner`.
- When marks stack on one target, the decorator written on top wins.
- Marks are inherited, and a `@Public()` subclass opens what its `@Protected` base guards - see [Inheritance](/docs/concepts/inheritance).
- Marks only apply to `@Controller` classes. On a service or a `@WebSocket` namespace they are ignored and the boot logs a warning; sockets use [`AuthWebSocketMiddleware`](#websocket).

### Roles and Typed Users

The default resolver reads `user.roles` when it is an array, else splits `user.role` on commas (the Better Auth admin plugin's shape), else returns `[]`. The `roles` option replaces it - here, to let higher roles imply lower ones:

```typescript
import type { AuthUser } from '@asenajs/asena/auth';
import { AsenaAuthService, Auth } from '@asenajs/asena-auth';

export interface AppUser extends AuthUser {
  email: string;
  roles: string[];
}

const implied: Record<string, string[]> = {
  owner: ['owner', 'admin', 'member'],
  admin: ['admin', 'member'],
};

@Auth({
  roles: ({ user }) => (user.roles ?? []).flatMap((role) => implied[role] ?? [role]),
})
export class AppAuth extends AsenaAuthService<AppUser> {}
```

The type parameter types `createSession(user)`; handlers pass it to the session readers: `requireAuthSession<AppUser>(context).user.email`.

### Where the Guard Runs

```text
globalMiddlewares()            ← AuthSessionMiddleware, when you register it
  ↓
Controller middlewares
  ↓
Auth guard                     ← 401 / 403 stop here
  ↓
Route middlewares
  ↓
Validator or Context.define contract
  ↓
Handler
```

An anonymous request to a protected route never reaches the route's own middlewares, its validator or the handler: an invalid body from an anonymous client is a 401, not a 400. See [Middleware Execution Order](/docs/concepts/middleware#middleware-execution-order) and [Route Context Contracts](/docs/concepts/validation#route-context-contracts).

## Reading the Session

Core's `getAuthSession(context)` reads the session without deciding anything; `requireAuthSession(context)` returns it or throws a 401 `HttpException`.

| `getAuthSession` returns | Meaning |
|:-------------------------|:--------|
| an `AuthSession` | A provider resolved a session for this request |
| `null` | The request was resolved as anonymous, e.g. by `AuthSessionMiddleware` on a public route |
| `undefined` | Nothing resolved it: the route is not protected and no session middleware ran |

```typescript
interface AuthSession<TUser extends AuthUser = AuthUser> {
  user: TUser;
  session: { id: string; userId: string; createdAt: Date; expiresAt: Date };
}
```

`user` is what `createSession` stored, or what [`loadUser`](#fresh-users-with-loaduser) returned. For a native session, `session.id` is the SHA-256 of the token: safe to show the user, and what [`revokeSessionById`](#session-lifecycle) takes.

## Passwords

The provider hashes and verifies passwords with `Bun.password`. A `UserService` built on it:

```typescript
// src/services/UserService.ts
import { Service } from '@asenajs/asena/decorators';
import { Inject } from '@asenajs/asena/decorators/ioc';
import { AppAuth } from '../auth/AppAuth';
import { UserRepository } from '../repositories/UserRepository';

@Service()
export class UserService {
  @Inject(AppAuth)
  private auth: AppAuth;

  @Inject(UserRepository)
  private users: UserRepository;

  async register(email: string, password: string) {
    return this.users.create({ email, passwordHash: await this.auth.hashPassword(password) });
  }

  async verifyCredentials(email: string, password: string) {
    const user = await this.users.findByEmail(email);

    return user && (await this.auth.verifyPassword(password, user.passwordHash)) ? user : null;
  }
}
```

`hashPassword` uses bcrypt with cost 12; `hashing: { algorithm: 'argon2id' }` (or `argon2d` / `argon2i`) switches it. `verifyPassword` reads the algorithm from the hash, so stored hashes keep verifying after a switch. Both also exist as standalone functions, `hashPassword(password, options?)` and `verifyPassword(password, hash)`.

## Session Lifecycle

```typescript
// src/controllers/AccountController.ts
import { Protected, requireAuthSession } from '@asenajs/asena/auth';
import { Controller } from '@asenajs/asena/decorators';
import { Delete, Get, Post } from '@asenajs/asena/decorators/http';
import { Inject } from '@asenajs/asena/decorators/ioc';
import { clearSessionCookie } from '@asenajs/asena-auth';
import type { Context } from '@asenajs/ergenecore';
import { AppAuth } from '../auth/AppAuth';

@Protected()
@Controller('/account')
export class AccountController {
  @Inject(AppAuth)
  private auth: AppAuth;

  @Post('/logout')
  async logout(context: Context) {
    await this.auth.logout(context);

    return context.send({ ok: true });
  }

  @Post('/rotate')
  async rotate(context: Context) {
    return context.send({ token: await this.auth.rotateSession(context) });
  }

  @Get('/sessions')
  async sessions(context: Context) {
    const { user } = requireAuthSession(context);
    const sessions = await this.auth.listUserSessions(user.id);

    return context.send(sessions.map(({ session }) => session));
  }

  @Delete('/sessions/:id')
  async revoke(context: Context) {
    const { user } = requireAuthSession(context);
    const id = context.getParam('id');
    const own = await this.auth.listUserSessions(user.id);

    if (!own.some(({ session }) => session.id === id)) {
      return context.send({ error: 'Not found' }, 404);
    }

    await this.auth.revokeSessionById(id);

    return context.send({ ok: true });
  }

  @Post('/logout-everywhere')
  async logoutEverywhere(context: Context) {
    await this.auth.revokeUserSessions(requireAuthSession(context).user.id);
    await clearSessionCookie(context, this.auth);

    return context.send({ ok: true });
  }
}
```

| Method | What it does |
|:-------|:-------------|
| `createSession(user)` | Stores a new session; returns `{ token, session }` |
| `logout(ctx)` | Ends the request's session (the Bearer token, else the cookie) and clears the cookie; without a session it only clears the cookie |
| `rotateSession(ctx, user?)` | Replaces the request's session and returns the new token; re-issues the cookie when the old token came from it. Throws when the request has no session |
| `listUserSessions(userId)` | The user's live sessions, each with the user stored at `createSession`; needs a store with `listByUser` |
| `revokeSessionById(id)` | Ends one session by its `session.id` - one device |
| `revokeSession(token)` | Ends one session by its token |
| `revokeUserSessions(userId)` | Ends every session of the user |
| `getSession(request)` | Resolves a raw `Request` - what the guard calls |
| `cookieName` / `cookieOptions` | The session cookie as configured |

A revoked session is a 401 on its very next request: every request reads the store. A few details worth knowing:

- **Rotate after a privilege change.** Rotation is a fresh authentication: `createdAt` restarts, and with it `absoluteTtl`. Without `user`, the new session keeps the stored user. The old session ends only once the new one exists, and `getAuthSession(ctx)` returns the new one for the rest of the request.
- **An id from the client is untrusted.** `revokeSessionById` revokes whatever id it gets; check ownership first, as the snippet does.
- **`logout` ends one session.** With a Bearer token and a different session in the cookie, the Bearer session ends and the cookie is cleared; the cookie's session expires on its own. A cross-site request cannot end a cookie session (see [CSRF](#cross-site-requests)) - it only gets the cookie cleared.

## Optional Sessions on Public Routes

Guards resolve the session on protected routes only. To read it on public routes too, register `AuthSessionMiddleware` globally:

```typescript
// src/config/AppConfig.ts
import { Config } from '@asenajs/asena/decorators';
import { AuthSessionMiddleware } from '@asenajs/asena-auth';
import { ConfigService } from '@asenajs/ergenecore';

@Config()
export class AppConfig extends ConfigService {
  public globalMiddlewares() {
    return [AuthSessionMiddleware];
  }
}
```

```typescript
// src/controllers/FeedController.ts
import { getAuthSession } from '@asenajs/asena/auth';
import { Controller } from '@asenajs/asena/decorators';
import { Get } from '@asenajs/asena/decorators/http';
import type { Context } from '@asenajs/ergenecore';

@Controller('/feed')
export class FeedController {
  @Get('/')
  feed(context: Context) {
    const session = getAuthSession(context);

    return context.send({ user: session?.user.id ?? null });
  }
}
```

- It never rejects: an anonymous request gets `null`, and guards still decide.
- The provider is asked once per request; a guard that follows reuses what the middleware resolved.
- It uses the primary (or only) provider. A route that names another provider asks that provider itself - a primary-provider session never opens it.
- It also re-issues a [slid](#security-defaults) session cookie on public routes.

## Bearer Tokens and WebSocket

### Bearer

A token is 32 random bytes (`tokenBytes`) in unpadded base64url - 43 characters, valid as a header value, a cookie value and a WebSocket subprotocol. `Authorization: Bearer <token>` (scheme case-insensitive) wins over the cookie. A Bearer session slides in the store like any other; no cookie is written for it.

`bearer: false` makes the provider cookie-only. It also turns off the WebSocket subprotocol token, which arrives as that same header.

### WebSocket

Put `AuthWebSocketMiddleware` on the namespace. The session lands in `ws.data.values.authSession`, next to whatever earlier middlewares stored:

```typescript
// src/sockets/ChatSocket.ts
import type { AuthSession } from '@asenajs/asena/auth';
import { WebSocket } from '@asenajs/asena/decorators';
import { AsenaWebSocketService, type Socket } from '@asenajs/asena/web-socket';
import { AuthWebSocketMiddleware } from '@asenajs/asena-auth';

interface ChatData {
  authSession: AuthSession;
}

@WebSocket({ path: '/chat', name: 'ChatSocket', middlewares: [AuthWebSocketMiddleware] })
export class ChatSocket extends AsenaWebSocketService<ChatData> {
  protected async onOpen(ws: Socket<ChatData>): Promise<void> {
    ws.send(`Welcome, ${ws.data.values.authSession.user.id}`);
  }
}
```

A browser cannot set headers on a WebSocket, so it sends the token as the subprotocol pair `bearer, <token>`:

```typescript
const socket = new WebSocket('wss://api.example.com/chat', ['bearer', token]);
```

- The socket opens with `bearer` as its negotiated protocol.
- A page on the same origin can rely on the session cookie instead. A cross-site upgrade carrying only the cookie never opens.
- Server-side clients can send `Authorization: Bearer <token>`.
- Without a session the upgrade is answered 401 with `WWW-Authenticate: Bearer`, and the socket never opens.
- A subprotocol token wins over a cookie session the global `AuthSessionMiddleware` resolved, and an invalid subprotocol token is refused even when the cookie is valid.

## Better Auth Provider

Better Auth handles sign-up, sign-in, OAuth and the rest; the package puts its sessions behind the same guards. Extend `BetterAuthService` and hand `@BetterAuth` your `betterAuth({...})` instance:

```typescript
// src/auth/AppBetterAuth.ts
import { BetterAuth, BetterAuthService } from '@asenajs/asena-auth';
import { betterAuth } from 'better-auth';
import { bearer } from 'better-auth/plugins';

@BetterAuth(() => ({
  auth: betterAuth({
    // database, secret, social providers: your Better Auth configuration
    emailAndPassword: { enabled: true },
    plugins: [bearer()],
  }),
}))
export class AppBetterAuth extends BetterAuthService {}
```

Mount Better Auth's handler with a controller whose prefix equals Better Auth's `basePath` (default `/api/auth`):

```typescript
// src/controllers/AuthApiController.ts
import { Controller } from '@asenajs/asena/decorators';
import { Inject } from '@asenajs/asena/decorators/ioc';
import { BetterAuthController } from '@asenajs/asena-auth';
import { AppBetterAuth } from '../auth/AppBetterAuth';

@Controller('/api/auth')
export class AuthApiController extends BetterAuthController {
  @Inject(AppBetterAuth)
  protected readonly authService!: AppBetterAuth;
}
```

Every request below the prefix, whatever its method, reaches Better Auth with the raw `Request`, and its `Response` is returned unchanged. From there on, `@Protected`, `@Roles`, the session readers and both middlewares work as with the native provider:

- The thunk is the usual form: it runs when the provider is constructed, not when the module is imported. It registers under the class name; the object form takes a `name`. The other options are `primary` and `roles`.
- Better Auth reads its own session cookie. `Authorization: Bearer` and the WebSocket subprotocol token need its [`bearer` plugin](https://www.better-auth.com/docs/plugins/bearer); without it, only the cookie authenticates.
- When Better Auth refreshes a session while resolving it, its `Set-Cookie` headers are forwarded on the response.
- The default roles resolver splits the admin plugin's comma-separated `user.role`.
- Session lifetime, cookies and CSRF protection are Better Auth's configuration; the native options (`sessionTtl`, `cookie`, `csrf`, ...) do not apply.
- The package never imports `better-auth`; an app without the Better Auth provider does not install it.

## Multiple Providers

Register several providers and name the one a route needs:

```typescript
import { Protected } from '@asenajs/asena/auth';
import { Controller } from '@asenajs/asena/decorators';
import { Get } from '@asenajs/asena/decorators/http';
import { AsenaAuthService, Auth } from '@asenajs/asena-auth';
import type { Context } from '@asenajs/ergenecore';

@Auth({ primary: true })
export class AppAuth extends AsenaAuthService {}

@Auth({ name: 'Partner', cookie: { name: 'partner_session' } })
export class PartnerAuth extends AsenaAuthService {}

@Protected({ provider: 'Partner' })
@Controller('/partner')
export class PartnerController {
  @Get('/orders')
  orders(context: Context) {
    return context.send({ orders: [] });
  }
}
```

- A provider is known by its registered name: the class name, or `name` in the object form.
- Routes without a provider name, and both session middlewares, use the provider marked `primary: true` - or the only one, when there is one.
- `@Protected({ provider })` asks only that provider; a session from any other provider is a 401 there.
- Give each native provider its own cookie name; otherwise they share one cookie.

### Third-Party Providers

Any class implementing core's `AsenaAuthProvider` and registered under `AUTH_PROVIDER_KEY` joins the registry the same way - here, API keys for machine clients:

```typescript
// src/auth/ApiKeyAuth.ts
import { AUTH_PROVIDER_KEY } from '@asenajs/asena/auth';
import type { AsenaAuthProvider, AuthSession } from '@asenajs/asena/auth';
import { Service } from '@asenajs/asena/decorators';
import { Implements, Inject } from '@asenajs/asena/decorators/ioc';
import { ApiClientService } from '../services/ApiClientService';

@Service('ApiKeyAuth')
@Implements(AUTH_PROVIDER_KEY)
export class ApiKeyAuth implements AsenaAuthProvider {
  @Inject(ApiClientService)
  private clients: ApiClientService;

  async getSession(request: Request): Promise<AuthSession | null> {
    const client = await this.clients.findByKey(request.headers.get('x-api-key'));

    if (!client) {
      return null;
    }

    return {
      user: { id: client.id, roles: client.scopes },
      session: { id: client.keyId, userId: client.id, createdAt: client.createdAt, expiresAt: client.expiresAt },
    };
  }

  getRoles(session: AuthSession): string[] {
    return session.user.roles ?? [];
  }
}
```

`@Protected({ provider: 'ApiKeyAuth' })` and `@Roles(...)` then work against it.

### Boot Errors

The registry checks every protected route at boot. A problem stops the boot with core's `@OnStart hook 'AuthProviderRegistry.onStart()' failed`, carrying one of these as its cause:

| Situation | Message |
|:----------|:--------|
| Several providers, none primary, a route without a provider name | `[asena-auth] Route GET /me (MeController.me) is protected without a provider name, but 2 auth providers are registered (AppAuth, Partner) and none is primary. Add primary: true to one of them or use @Protected({ provider }).` |
| A route names a provider that does not exist | `[asena-auth] Route GET /partner/orders (PartnerController.orders) asks for auth provider 'Partner', which is not registered. Registered: AppAuth.` |
| Two providers marked primary | `[asena-auth] More than one auth provider is primary (AppAuth, Partner). Keep primary: true on exactly one.` |
| A protected route, no provider at all | `[asena-auth] Route GET /me (MeController.me) is protected but no auth provider is registered. Add an @Auth or @BetterAuth service.` |

With several providers and none primary, `authComponents` cannot be imported whole either: its two session middlewares need one provider to use, and the boot says so:

```text
[asena-auth] AuthWebSocketMiddleware is registered, but 2 auth providers are (AppAuth, Partner) and none is primary, so it cannot pick one. Mark one provider primary: true (@Auth({ primary: true }) or @BetterAuth({ primary: true })), or import only what the app uses instead of authComponents, e.g. imports: [AuthGuard, AuthGuardMiddleware, AuthProviderRegistry], and when the app uses AuthWebSocketMiddleware, add a subclass that names its provider: @Middleware() class MyAuthWebSocketMiddleware extends AuthWebSocketMiddleware { protected providerName = 'AppAuth'; }.
```

The subclass it describes:

```typescript
// src/middlewares/PartnerSessionMiddleware.ts
import { Middleware } from '@asenajs/asena/decorators';
import { AuthSessionMiddleware } from '@asenajs/asena-auth';

@Middleware()
export class PartnerSessionMiddleware extends AuthSessionMiddleware {
  protected providerName = 'Partner';
}
```

Import `[AuthGuard, AuthGuardMiddleware, AuthProviderRegistry]` and register `PartnerSessionMiddleware` in `globalMiddlewares()` in place of `AuthSessionMiddleware`. `AuthWebSocketMiddleware` takes `providerName` the same way.

## Configuration

### Options

`@Auth` takes these options (`AuthOptions`, plus `name` in the object form). Durations are in seconds.

| Option | Type | Default | Description |
|:-------|:-----|:--------|:------------|
| `name` | `string` | class name | Registered name, what `@Protected({ provider })` refers to; object form only |
| `primary` | `boolean` | `false` | Provider for routes and middlewares that name none, when several are registered |
| `sessionTtl` | `number` | `604800` (7 days) | Session lifetime; also the cookie's `Max-Age` |
| `absoluteTtl` | `number \| false` | `2592000` (30 days) | Hard cap from the session's creation; sliding never extends past it. `false` disables it |
| `sliding` | `boolean` | `true` | Extend a session once less than half of its lifetime is left |
| `cookie` | `CookieOptions` | see below | The session cookie |
| `bearer` | `boolean` | `true` | Accept `Authorization: Bearer`; `false` also disables the WebSocket subprotocol token |
| `csrf` | `{ trustedOrigins?: string[] } \| false` | on | Cross-site check for cookie sessions; see [Cross-Site Requests](#cross-site-requests) |
| `loadUser` | `(userId: string) => Promise<TUser \| null>` | - | Reload the user on every authenticated request; see [below](#fresh-users-with-loaduser) |
| `roles` | `(session) => string[]` | `user.roles`, else comma-split `user.role` | Roles resolver for `@Roles` |
| `store` | `AuthSessionStore` | `MemoryAuthStore` | Where sessions live; see [Custom Session Store](#custom-session-store) |
| `sweepInterval` | `number` | `60` | How often the default `MemoryAuthStore` removes expired rows |
| `tokenBytes` | `number` | `32` | Random bytes per token |
| `hashing` | `{ algorithm?, cost? }` | bcrypt, cost 12 | Algorithm for `hashPassword`: `'bcrypt'`, `'argon2id'`, `'argon2d'` or `'argon2i'`; `cost` applies to bcrypt |

`absoluteTtl` smaller than `sessionTtl` stops the boot:
`AppAuth: absoluteTtl (60) is smaller than sessionTtl (3600). Raise absoluteTtl, lower sessionTtl, or set absoluteTtl: false.`

### Cookie Options

| Option | Type | Default |
|:-------|:-----|:--------|
| `name` | `string` | `'asena_session'` |
| `path` | `string` | `'/'` |
| `secure` | `boolean` | `true` |
| `sameSite` | `'strict' \| 'lax' \| 'none'` | `'lax'` |
| `domain` | `string` | unset - a host-only cookie |

`HttpOnly` is always set.

### Lazy Options

`@Auth` also accepts a thunk, resolved when the provider is constructed, so options can come from the environment:

```typescript
@Auth(() => ({
  sessionTtl: Number(process.env.SESSION_TTL ?? 86_400),
  cookie: { domain: process.env.COOKIE_DOMAIN },
}))
export class AppAuth extends AsenaAuthService {}
```

A thunk registers under the class name; use the object form's `name` to choose another.

### Fresh Users with `loadUser`

By default a session carries the user snapshot taken at `createSession`, so a role change applies from the user's next login. `loadUser` reloads the user on every authenticated request instead:

```typescript
import { findUserById } from '../db/users';

@Auth({ loadUser: (userId) => findUserById(userId) })
export class AppAuth extends AsenaAuthService {}
```

Its result replaces the stored user for that request, and roles are resolved from it: a demotion applies on the next request. A result of `null` (or `undefined`) ends the session and deletes its row. `listUserSessions` and a `rotateSession` without `user` keep using the stored snapshot.

## Security Defaults

- **Opaque tokens, hashed at rest.** 32 random bytes per token; the store keeps only its SHA-256, which is also the session id. A leaked store yields no usable token.
- **A strict cookie.** `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`, `Max-Age` = `sessionTtl`.
- **Sliding with a cap.** A session is extended once less than half of its lifetime is left, never past `createdAt + absoluteTtl`. A slid cookie session gets its cookie re-issued once, after the handler, with `Max-Age` capped at the remaining lifetime.
- **Challenges on 401.** Guard and WebSocket rejections carry `WWW-Authenticate: Bearer`; a missing role is a 403.
- **Fail closed.** Provider misconfigurations stop the boot (see [Boot Errors](#boot-errors)). A guard mark this version does not understand stops it too, instead of leaving the route open:
  `[asena-auth] ReportController carries a guard mark with access 'restricted', which this @asenajs/asena-auth version does not enforce. The boot stops instead of leaving the route unguarded; upgrade @asenajs/asena-auth.`
  A protected request whose route the guard cannot identify is a 500 with an error log, never a pass.

### Cross-Site Requests

Cookie sessions get a cross-site check, on by default. A request that is state-changing (anything but `GET`, `HEAD`, `OPTIONS`) or a WebSocket upgrade, carrying its token in the cookie and coming cross-site, is treated as having no cookie - a 401 on a protected route.

- **Cross-site** means a `Sec-Fetch-Site` other than `same-origin` or `none`; without that header, an `Origin` that differs from the request URL's origin. A request with neither header is a non-browser client and passes.
- A same-site subdomain is not same-origin; list it in `trustedOrigins` when it should pass.
- Bearer tokens are exempt. `csrf: false` disables the check.

```typescript
@Auth({ csrf: { trustedOrigins: ['https://app.example.com'] } })
export class AppAuth extends AsenaAuthService {}
```

::: tip Behind a TLS-terminating proxy
The app then sees `http://` request URLs while browsers send an `https://` `Origin`. Browsers that send `Sec-Fetch-Site` pass on that header alone; for browsers that do not, list your public `https://` origin in `trustedOrigins`. `X-Forwarded-*` headers are not read.
:::

## Custom Session Store

Sessions live in a `MemoryAuthStore` by default: in-process, gone on restart, not shared between instances. For more than one instance, implement `AuthSessionStore` over your database or Redis:

```typescript
interface AuthSessionStore<TUser = AuthUser> {
  create(session: StoredSession<TUser>): Promise<void>;
  get(id: string): Promise<StoredSession<TUser> | null>;
  delete(id: string): Promise<void>;
  deleteByUser(userId: string): Promise<void>;
  touch(id: string, expiresAt: number): Promise<void>;
  listByUser?(userId: string): Promise<StoredSession<TUser>[]>;
  onStart?(): void | Promise<void>;
  onStop?(): void | Promise<void>;
}

interface StoredSession<TUser = AuthUser> {
  id: string;        // sha256(token), hex
  userId: string;
  user: TUser;       // plain data
  createdAt: number; // epoch milliseconds
  expiresAt: number; // epoch milliseconds
}
```

- `get` may return an expired row; the provider checks expiry itself.
- `touch` moves `expiresAt` when a session slides.
- `listByUser` is optional and may return expired rows. Without it, `listUserSessions` throws, naming your store.
- `onStart` / `onStop` run once per store object, even when several providers share it.

Pass a store with `@Auth({ store })`. A store that needs injected services is set from the provider's own `onStart`, before `super.onStart()`:

```typescript
import { Inject } from '@asenajs/asena/decorators/ioc';
import { AsenaAuthService, Auth } from '@asenajs/asena-auth';
import { SessionRepository } from '../repositories/SessionRepository';
import { SqlSessionStore } from './SqlSessionStore';

@Auth({ sessionTtl: 3600 })
export class AppAuth extends AsenaAuthService {
  @Inject(SessionRepository)
  private sessions: SessionRepository;

  public override async onStart(): Promise<void> {
    this.setStore(new SqlSessionStore(this.sessions));
    await super.onStart();
  }
}
```

## Testing

`@asenajs/asena-auth/testing` ships a provider that turns a request header into a session, so a test needs no login step:

```typescript
import { describe, test } from 'bun:test';
import { createWebTest } from '@asenajs/asena/test';
import { createErgenecoreAdapter } from '@asenajs/ergenecore';
import { authComponents } from '@asenajs/asena-auth';
import { TestAuth, TestAuthProvider } from '@asenajs/asena-auth/testing';
import { ProjectController } from '../src/controllers/ProjectController';

@TestAuth({
  users: {
    ada: { id: 'u1', roles: ['admin'] },
    bob: { id: 'u2', roles: ['user'] },
  },
})
class AppTestAuth extends TestAuthProvider {}

describe('ProjectController', () => {
  test('guards by role', async () => {
    const { app } = await createWebTest({
      adapter: createErgenecoreAdapter(),
      controllers: [ProjectController],
      components: [...authComponents, AppTestAuth],
    });

    try {
      await app.get('/projects').expectStatus(401);
      await app.get('/projects', { headers: { 'x-test-user': 'bob' } }).expectStatus(200);
      await app.delete('/projects/1', { headers: { 'x-test-user': 'bob' } }).expectStatus(403);
      await app.delete('/projects/1', { headers: { 'x-test-user': 'ada' } }).expectStatus(200);
    } finally {
      await app.stop();
    }
  });
});
```

- The `x-test-user` header names a key of `users`; a missing header or an unknown key is no session. `users` is read on every request, so a test may change it between requests.
- `@TestAuth` also takes `header` (another header name), `primary` and `name`, so it can stand in for one provider among several.
- With [`createTestApp`](/docs/testing/test-app), hand the components in through `imports: [...authComponents]`; [`createWebTest`](/docs/testing/web-test) has no `imports`, so they go into `components`.
- It drives `AuthWebSocketMiddleware` too: send the header on the upgrade.

To test a real provider, resolve it from the app and create a session:

```typescript
await using app = await createTestApp({
  adapter: createErgenecoreAdapter(),
  components: [AppAuth, MeController],
  imports: [...authComponents],
});
const auth = await app.resolve<AppAuth>('AppAuth');
const { token } = await auth.createSession({ id: 'u1', roles: ['user'] });

await app.get('/me', { headers: { authorization: `Bearer ${token}` } }).expectStatus(200);
```

::: warning Tests only
`TestAuthProvider` trusts a request header. It is published only under the `/testing` subpath; never register it in an application.
:::

## Helpers and Constants

| Export | Description |
|:-------|:------------|
| `applySessionCookie(ctx, provider, token)` | Writes the session cookie with the provider's cookie options |
| `clearSessionCookie(ctx, provider)` | Deletes the session cookie with the same path, domain, `secure` and `sameSite` |
| `getRawRequest(ctx)` | The web `Request` behind a context, on either adapter |
| `withSubprotocolToken(request)` | A copy of an upgrade request with the `bearer, <token>` subprotocol moved into `Authorization` |
| `defaultRolesResolver(session)` | The default roles resolver |
| `generateToken(bytes?)` / `hashToken(token)` | Token generation (base64url) and its SHA-256 hex |
| `hashPassword(password, options?)` / `verifyPassword(password, hash)` | Standalone password hashing |
| `MemoryAuthStore` | The default in-process store; `new MemoryAuthStore(sweepInterval?)` |
| `AUTH_REGISTRY_NAME` | `'AsenaAuthProviderRegistry'` - inject the registry by it; `select(name?)` returns a provider |
| `AUTH_GUARD_NAME` / `AUTH_GUARD_MIDDLEWARE_NAME` | Registered names of the guard components |
| `WS_TOKEN_SUBPROTOCOL` | `'bearer'` |

## Limitations

- **Write the session cookie through the helpers.** In a request whose session slid, the re-issued cookie is written after the handler. `applySessionCookie`, `clearSessionCookie`, `logout` and `rotateSession` cancel it; a bare `ctx.setCookie('asena_session', ...)` is overwritten by it.
- **No custom WebSocket subprotocol alongside the token.** The token must be the first two subprotocol entries, and the socket negotiates `bearer`; an app speaking its own subprotocol (for example `graphql-ws`) on the same socket has to authenticate by cookie.
- **`MemoryAuthStore` is per process.** Use a [shared store](#custom-session-store) when more than one instance serves the app.
- **One interface per provider class.** `@Auth` and `@BetterAuth` register the class under `AUTH_PROVIDER_KEY`; it cannot also `@Implements` another interface.
- **The guard needs `ctx.routePattern`.** It identifies the matched route through the adapter's route pattern. Both official adapters report it; on an adapter that does not, protected routes answer 500.

## Related

- [Dependency Injection](/docs/concepts/dependency-injection#registering-components-from-packages) - Registering package components with `imports`
- [Middleware](/docs/concepts/middleware) - Middleware levels and execution order
- [Validation](/docs/concepts/validation) - Validators and route context contracts
- [WebSocket](/docs/concepts/websocket) - Namespaces, middleware and `ws.data`
- [Inheritance](/docs/concepts/inheritance) - How decorators behave in subclasses
- [createTestApp](/docs/testing/test-app) and [createWebTest](/docs/testing/web-test) - Booting an app in tests
