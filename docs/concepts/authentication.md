---
title: Authentication
description: The auth contract in core - the @Protected / @Public / @Roles marks, AuthSession and AuthUser, getAuthSession / requireAuthSession and the AsenaAuthProvider interface, and the package that enforces them
outline: deep
---

# Authentication

`@asenajs/asena/auth` is the auth **contract**: the guard marks, the session shapes, two session
readers and the provider interface. Core records the marks and never acts on them.
[`@asenajs/asena-auth`](/docs/packages/auth) enforces them and ships the providers.

The contract lives in core so that the pieces never have to know each other: a controller, a
provider and the enforcer each depend on core alone, and the marks on a controller stay the same
when the provider behind them changes.

## What Core Ships

| Export | Kind | Role |
|:-------|:-----|:-----|
| `Protected`, `Public`, `Roles` | Decorators | Mark a controller or a handler |
| `AuthUser`, `AuthSession` | Types | What a provider resolves for a request |
| `getAuthSession`, `requireAuthSession` | Functions | Read the session from the context |
| `AsenaAuthProvider` | Interface | What a provider implements |
| `AUTH_PROVIDER_KEY` | Constant | `'AsenaAuthProvider'`, the interface key providers register under |
| `AUTH_SESSION_CONTEXT_KEY` | Constant | `'authSession'`, the context key the session travels under |

`RolesResolver`, `GuardMark`, `collectGuardMetadata` and `effectiveGuardMark` are exported for
enforcers; an application does not need them.

## The Marks

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

- `@Protected()` asks for any session. `@Protected({ provider: 'Partner' })` names the provider
  that must resolve it.
- `@Roles('admin', 'editor')` asks for a session holding at least one of the roles, and implies
  `@Protected`. `@Roles()` with no role throws at decoration time.
- `@Public()` opens a route to anonymous requests, cancelling a class or an inherited mark.
- A method mark **replaces** the class mark for that route. Roles never flow down from a class
  mark; the provider name does.
- When marks stack on one target, the decorator written on top wins.
- Marks are inherited and override per class and per method name, so a `@Public()` subclass opens
  what its `@Protected` base guards. See [Inheritance](/docs/concepts/inheritance#auth-marks-override-instead-of-adding-up).

## Core Never Enforces Them

A mark is metadata. Without an enforcer in the container, a `@Protected` route is served to anyone.
asena-auth's guard is the enforcer, and it reaches the container through
[`imports`](/docs/concepts/dependency-injection#registering-components-from-packages):

```typescript
import { AsenaServerFactory } from '@asenajs/asena';
import { authComponents } from '@asenajs/asena-auth';

const server = await AsenaServerFactory.create({
  adapter,
  logger,
  imports: [...authComponents],
});
```

Two checks catch a missing guard. The boot logs a warning when asena-auth's provider registry is
imported without the guard, and [`asena doctor`](/docs/cli/commands#asena-doctor) fails
`auth-enforcement` when `Protected` or `Roles` is imported from `@asenajs/asena/auth` but neither
`authComponents` nor `AuthGuard` is imported from `@asenajs/asena-auth`.

The guard runs between the controller middlewares and the route's own:

```text
global middlewares → controller middlewares → auth guard → route middlewares → validator → handler
```

An anonymous request to a protected route never reaches its route middlewares, its validator or
its handler, so an invalid body from an anonymous client is a 401, not a 400. See
[Middleware Execution Order](/docs/concepts/middleware#middleware-execution-order).

The marks only apply to `@Controller` classes. asena-auth ignores them on a `@WebSocket` namespace,
a `@FrontendController` or a service, and the boot logs a warning. Sockets authenticate with
asena-auth's `AuthWebSocketMiddleware` instead - see [WebSocket](/docs/concepts/websocket#authenticating-sockets).

## Reading the Session

```typescript
interface AuthUser {
  id: string;
  roles?: string[];
  [key: string]: unknown;
}

interface AuthSession<TUser extends AuthUser = AuthUser> {
  user: TUser;
  session: { id: string; userId: string; createdAt: Date; expiresAt: Date };
}
```

`getAuthSession(context)` reads the session without deciding anything:

| `getAuthSession` returns | Meaning |
|:-------------------------|:--------|
| an `AuthSession` | A provider resolved a session for this request |
| `null` | The request was resolved as anonymous |
| `undefined` | Nothing resolved it: the route is not protected and no session middleware ran |

`requireAuthSession(context)` returns the session or throws a 401 `HttpException`:

```typescript
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

The session sits on the context under `authSession`, a key core's `AsenaVariables` already
declares - see [Context](/docs/concepts/context#the-authsession-slot).

## Writing a Provider

A provider turns a request into a session:

```typescript
interface AsenaAuthProvider<TUser extends AuthUser = AuthUser> {
  getSession(request: Request): Promise<AuthSession<TUser> | null>;
  getRoles(session: AuthSession<TUser>): string[];
}
```

`getSession` returns `null` when the request carries no valid credentials; the enforcer answers
that with a 401. `getRoles` is what `@Roles` is checked against. A class implementing the interface
and registered under `AUTH_PROVIDER_KEY` joins asena-auth's providers next to its own - here, API
keys for machine clients:

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

`@Protected({ provider: 'ApiKeyAuth' })` and `@Roles(...)` then work against it. How several
providers share one application, and which one a route without a provider name uses, is on the
package page under [Multiple Providers](/docs/packages/auth#multiple-providers).

## Related

- [Asena Auth](/docs/packages/auth) - The providers, sessions, cookies and the guard
- [Middleware](/docs/concepts/middleware#middleware-execution-order) - Where the guard runs
- [Inheritance](/docs/concepts/inheritance) - How the marks behave in subclasses
- [WebSocket](/docs/concepts/websocket#authenticating-sockets) - Authenticating socket upgrades
- [asena doctor](/docs/cli/commands#asena-doctor) - The `auth-enforcement` check
