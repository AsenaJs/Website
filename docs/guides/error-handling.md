---
title: Error Handling
description: Handle errors in one place with @ExceptionHandler - @Catch by exception type, @NotFound for unmatched routes, the same handlers across HTTP, events and microservices
outline: deep
---

# Error Handling

An `@ExceptionHandler` class is where an Asena application decides what a failure means. Its
`@Catch(...types)` methods answer errors by type, and its `@NotFound()` method answers a request
that matched no route. The same `@Catch` sees a failure wherever the framework dispatched the
code that threw: an HTTP request, an `@On` event handler, or a `@MessagePattern` /
`@EventPattern` handler. It works the same on Ergenecore and the Hono adapter.

<div class="card-grid">
  <a class="info-card" href="#exception-handlers">
    <span class="ic-kicker">01</span>
    <div class="ic-title">Exception Handlers</div>
    <p class="ic-desc">An <code>@ExceptionHandler</code> class with <code>@Catch</code> methods.</p>
  </a>
  <a class="info-card" href="#choosing-a-handler">
    <span class="ic-kicker">02</span>
    <div class="ic-title">Choosing a Handler</div>
    <p class="ic-desc">Most specific wins, one handler per type, one catch-all.</p>
  </a>
  <a class="info-card" href="#the-resolution-chain">
    <span class="ic-kicker">03</span>
    <div class="ic-title">The Chain</div>
    <p class="ic-desc">Who answers when a handler declines, returns nothing or throws.</p>
  </a>
  <a class="info-card" href="#scopes">
    <span class="ic-kicker">04</span>
    <div class="ic-title">Scopes</div>
    <p class="ic-desc">HTTP, <code>@On</code> events and microservice handlers.</p>
  </a>
  <a class="info-card" href="#not-found">
    <span class="ic-kicker">05</span>
    <div class="ic-title">Not Found</div>
    <p class="ic-desc"><code>@NotFound()</code> for routes that never matched.</p>
  </a>
  <a class="info-card" href="#throwing-http-exceptions">
    <span class="ic-kicker">06</span>
    <div class="ic-title">HTTP Exceptions</div>
    <p class="ic-desc"><code>HttpException</code> and the ready-made status exceptions.</p>
  </a>
</div>

## Exception Handlers

### A first handler

The service throws a domain error. The controller does not catch it. The exception handler
decides what the caller sees.

```typescript
// src/errors/OrderErrors.ts
export abstract class OrderError extends Error {}

export class OrderNotFoundError extends OrderError {
  public constructor(public readonly orderId: string) {
    super(`Order ${orderId} not found`);
    this.name = 'OrderNotFoundError';
  }
}
```

```typescript
// src/services/OrderService.ts
import { Service } from '@asenajs/asena/decorators';
import { Inject } from '@asenajs/asena/decorators/ioc';
import { OrderRepository } from '../repositories/OrderRepository';
import { OrderNotFoundError } from '../errors/OrderErrors';

@Service()
export class OrderService {
  @Inject(OrderRepository)
  private orderRepository: OrderRepository;

  public async findById(id: string) {
    const order = await this.orderRepository.findById(id);

    if (!order) {
      throw new OrderNotFoundError(id);
    }

    return order;
  }
}
```

```typescript
// src/controllers/OrderController.ts
import { Controller } from '@asenajs/asena/decorators';
import { Get } from '@asenajs/asena/decorators/http';
import { Inject } from '@asenajs/asena/decorators/ioc';
import type { Context } from '@asenajs/ergenecore'; // or '@asenajs/hono-adapter'
import { OrderService } from '../services/OrderService';

@Controller('/orders')
export class OrderController {
  @Inject(OrderService)
  private orderService: OrderService;

  @Get('/:id')
  public async getById(context: Context) {
    return context.send(await this.orderService.findById(context.getParam('id')));
  }
}
```

```typescript
// src/exceptions/ApiExceptionHandler.ts
import { ExceptionHandler } from '@asenajs/asena/decorators';
import { Catch, type ExceptionContext } from '@asenajs/asena/exception';
import type { Context } from '@asenajs/ergenecore'; // or '@asenajs/hono-adapter'
import { OrderNotFoundError } from '../errors/OrderErrors';

@ExceptionHandler()
export class ApiExceptionHandler {
  @Catch(OrderNotFoundError)
  public orderNotFound(error: OrderNotFoundError, ctx: ExceptionContext<Context>) {
    if (ctx.scope !== 'http') return;

    return ctx.context.send({ error: 'ORDER_NOT_FOUND', id: error.orderId }, 404);
  }
}
```

A `@Catch` method receives the thrown value and an [`ExceptionContext`](#scopes). On HTTP it
answers by returning a `Response`. It may be `async`.

### What an exception handler is

- **An ordinary component.** It is found by the component scan and resolved from the container,
  so `@Inject` works in it: a logger, an audit service, a metrics client.
- **Several are allowed.** Their handlers are merged into one table, so error handling can be
  split by domain (`OrderExceptionHandler`, `PaymentExceptionHandler`) instead of piling up in one
  file. What is not allowed is two of them catching the [same type](#one-handler-per-type).
- **Inert until something matches.** An application with no `@Catch` at all runs exactly the
  code path it would without the feature.

### Imports

| What | From |
|:-----|:-----|
| `ExceptionHandler` | `@asenajs/asena/decorators` |
| `Catch`, `NotFound`, `ExceptionContext` and the per-scope context types | `@asenajs/asena/exception` |
| `HttpException`, the [status exceptions](#ready-made-status-exceptions), `ContractValidationError`, `isHttpException`, `isValidationError`, `NotFoundRequest` | `@asenajs/asena/adapter` |
| `ValidationError` (thrown by validator classes) | `@asenajs/ergenecore` or `@asenajs/hono-adapter` |

---

## Choosing a Handler

### Most specific wins

The thrown value's constructor chain is walked upward, and the first `@Catch` found on it
answers. No handler declares an order; the class hierarchy is the order.

```typescript
import { ExceptionHandler } from '@asenajs/asena/decorators';
import { Catch, type ExceptionContext } from '@asenajs/asena/exception';
import { HttpException, type HttpExceptionLike, type ValidationErrorLike } from '@asenajs/asena/adapter';
import { ValidationError, type Context } from '@asenajs/ergenecore';

@ExceptionHandler()
export class ApiExceptionHandler {
  @Catch(ValidationError)
  public validation(error: ValidationErrorLike, ctx: ExceptionContext<Context>) {
    if (ctx.scope !== 'http') return;

    return ctx.context.send({ error: 'VALIDATION_FAILED', issues: error.issues }, 400);
  }

  @Catch(HttpException)
  public http(error: HttpExceptionLike, ctx: ExceptionContext<Context>) {
    if (ctx.scope !== 'http') return;

    return error.getResponse?.() ?? ctx.context.send({ error: error.message }, error.status);
  }

  @Catch(Error)
  public unexpected(_error: Error, ctx: ExceptionContext<Context>) {
    if (ctx.scope !== 'http') return;

    return ctx.context.send({ error: 'Internal Server Error' }, 500);
  }
}
```

| Thrown | Answered by |
|:-------|:------------|
| a failed validator (`ValidationError`, itself an HTTP exception) | `validation` |
| `new NotFoundException()` | `http` |
| `new TypeError('...')` | `unexpected` |

`@Catch(HttpException)` is matched by more than identity. It also receives:

- hono's `HTTPException`, which `hono/basic-auth`, `hono/bearer-auth` and `hono/jwt` throw, and
  which the Hono adapter's `ValidationError` extends;
- an `HttpException` built by a second copy of `@asenajs/asena` in the same project.

Both carry the `HttpException` brand rather than the class. The brand is only consulted when no
narrower `@Catch` matched, and `@Catch(Error)` never shadows it. Type the parameter as
`HttpExceptionLike`, not `HttpException`: the guaranteed members are `status`, `message` and an
optional `getResponse()`.

One method can list several types: `@Catch(OrderNotFoundError, CustomerNotFoundError)`.

### One handler per type

An exception type is caught in exactly one place across the whole application. A second `@Catch`
on the same type fails the boot rather than picking one silently:

```
Duplicate @Catch(OrderNotFoundError) detected — already handled by OrderExceptionHandler.notFound(),
conflicts with ApiExceptionHandler.missing(). An exception type may be caught in exactly one place;
delete one of them, or narrow one to a subclass.
```

A subclass and its base in two different handlers is fine: `@Catch(OrderNotFoundError)` in one
class and `@Catch(OrderError)` in another both register, and the subclass wins for its own errors.

### `@Catch()` is not `@Catch(Error)`

`@Catch()` with no arguments is the catch-all. It is a separate slot, not another spelling of
`@Catch(Error)`:

| Thrown | `@Catch(Error)` | `@Catch()` |
|:-------|:----------------|:-----------|
| `new TypeError()` | matches | receives it only when there is no `@Catch(Error)` |
| `'boom'`, `null`, `{}` | **no match** | matches |
| `ValidationError`, `HttpException` with no narrower `@Catch` | matches | matches |

So a typed handler can read `error.message` without checking first: values that are not `Error`s
only ever reach the catch-all. Both may exist side by side. Only **one** catch-all is allowed per
application; a second one fails the boot.

A catch-all also receives every `ValidationError` and `HttpException` that no narrower `@Catch`
claimed, which replaces the adapter's own 400 and status envelopes. The boot log says so:

```
@Catch() catch-all ApiExceptionHandler.fallback() will receive every error, including ValidationError and
HttpException — narrow it with @Catch(HttpException) if the adapter's envelopes should be kept.
```

To keep those envelopes, declare `@Catch(HttpException)` next to it, or
[decline](#the-resolution-chain) them inside the catch-all:

```typescript
@Catch()
public fallback(error: unknown, ctx: ExceptionContext<Context>) {
  if (ctx.scope !== 'http' || isHttpException(error)) return;

  return ctx.context.send({ error: 'Internal Server Error' }, 500);
}
```

### Custom errors and abstract bases

Any class works as a `@Catch` argument, including an abstract one. Catching a domain base answers
every subclass that has no handler of its own:

```typescript
@Catch(OrderError)
public order(error: OrderError, ctx: ExceptionContext<Context>) {
  if (ctx.scope !== 'http') return;

  return ctx.context.send({ error: error.name, message: error.message }, 409);
}
```

### Inheritance

`@Catch` and `@NotFound` methods declared on a base class are inherited by an `@ExceptionHandler`
subclass, and a subclass overrides one by declaring a method with the same name. The boot log
lists the handlers a class inherited. Two subclasses of one base both inherit its `@Catch`
methods, so they collide on those types like any other [duplicate](#one-handler-per-type).

### Boot checks

Everything below fails or warns during startup, before the server binds a port:

| Problem | Result |
|:--------|:-------|
| Two `@Catch` on the same type | boot fails, naming both methods |
| Two `@Catch()` catch-alls | boot fails |
| Two `@NotFound()` methods | boot fails |
| `@Catch(undefined)`, usually a circular import between the handler and the error's module | fails when the class is decorated |
| An `@ExceptionHandler` with no `@Catch` or `@NotFound` method | warning: it is registered but never called |

---

## The Resolution Chain

An error raised while handling an HTTP request goes through three links. Each one either answers
or **declines** by returning nothing, which hands the error to the next:

```
@Catch  →  @Config.onError  →  adapter default
```

Unmatched routes use the same shape: `@NotFound()` → `@Config.onNotFound` → the adapter's 404.
[`@Config.onError` and `onNotFound`](#config-onerror-and-onnotfound) are deprecated; most
applications have only the first and last links.

What a `@Catch` does on HTTP decides what happens next:

| The `@Catch` method | Result |
|:--------------------|:-------|
| returns a `Response` | the request is answered with it |
| returns `undefined` | declines: the next link answers |
| returns anything else | logged as an error, then treated as a decline |
| throws | its own error is logged, then treated as a decline; the next link still sees the **original** error |
| does not exist for this type | the next link answers |

A handler that throws can never make a request hang or disappear: the framework still answers,
and still records the original failure.

Declining is useful on its own. A `@Catch` that records something and returns nothing leaves the
answer to the adapter:

```typescript
@Catch(PaymentGatewayError)
public async gateway(error: PaymentGatewayError) {
  await this.alerts.notify('payment-gateway', error);
}
```

### The adapter default

When no link answered, the adapter answers from the error itself, identically on both adapters:

| Error | Response |
|:------|:---------|
| `HttpException`, a status exception, hono's `HTTPException` | the exception's own status, body and headers (`getResponse()`) |
| a failed validator or contract | `400` with the [validation envelope](#validation-errors) |
| anything else | `500` `{"error":"Internal Server Error"}` |

The thrown message of an unexpected error is never echoed to the caller. It is written to the
log with its stack instead.

### Adapter logging

One rule, both adapters: **the framework's default log fires exactly when the framework's
default response fires.**

| | a handler answered | nothing answered, or every link declined or threw |
|:--|:--|:--|
| response | yours | the framework's |
| log | none | `5xx` ERROR + stack · `4xx` DEBUG (INFO when the logger has no `debug`) · `404` INFO |

If your `@Catch` returns a `Response`, you own the response and therefore the record: log it
there, with your correlation id, and the adapter stays out of the way. If it declines or throws,
the adapter is the one answering, so it writes the original error rather than letting it
disappear. The same holds for `@NotFound()`.

The level split exists so a wall of 401s from a bot cannot flood the error stream: only `5xx`
carries a stack. An unmatched route logs `Route not found:` with `{ path, method, status }` at
INFO, low enough that a scanner walking `/wp-admin` and `/.env` cannot fill the warning stream,
high enough that a mistyped route in a deployed client is visible without turning on debug.

Pass `logErrors: false` (`createHonoAdapter` / `createErgenecoreAdapter`) to silence all of it,
including the 404 line. There is no setting that forces a log line for a request your own handler
answered.

---

## Scopes

The second argument of a `@Catch` method says where the error was raised. `ctx.scope` is the
discriminant, and narrowing on it gives the fields of that scope:

| `ctx.scope` | Raised by | Fields |
|:------------|:----------|:-------|
| `'http'` | a controller, a middleware or a validator | `context`: the adapter's request context |
| `'event'` | an `@On` handler | `event`, `data`, `source` (`UserEventService.onCreated`; absent for a handler registered on the emitter directly) |
| `'microservice'` | a `@MessagePattern` or `@EventPattern` handler, or its `onReceive` interceptors | `kind` (`'message'` or `'event'`), `message`, `data`, `source`, `transport` |

The generic of `ExceptionContext<Context>` types `ctx.context` as your adapter's `Context`.

```typescript
@Catch(DatabaseUnavailableError)
public async database(error: DatabaseUnavailableError, ctx: ExceptionContext<Context>) {
  await this.alerts.notify('database', error);

  switch (ctx.scope) {
    case 'http':
      return ctx.context.send({ error: 'Service Unavailable' }, 503);
    case 'microservice':
      return ctx.kind === 'message' ? { ok: false, retryable: true } : undefined;
    case 'event':
      return;
  }
}
```

No other code path reaches `@Catch`: WebSocket handlers, scheduled tasks and lifecycle hooks keep
their own error handling.

### HTTP

A `Response` answers the request; anything else declines, as described in
[The Resolution Chain](#the-resolution-chain).

### `@MessagePattern`: the return value is the reply

A value other than `undefined` becomes the reply, and the caller's `ulak.send()` resolves with it
as if the handler had returned it. Returning `undefined`, or throwing, hands the **original**
error to the transport, which replies `ok: false`, so the caller sees `REMOTE_ERROR`.

The `@Catch` sits outside the [interceptor](/docs/concepts/microservices) chain, so an
interceptor's `onReceive` still sees the failure before the `@Catch` turns it into a reply.

### `@EventPattern` and `@On`: observe-only

An event has no caller waiting for an answer, so a `@Catch` in these scopes can only observe. It
runs, and then the original failure continues **exactly as if no `@Catch` existed**:

| Scope | What still happens |
|:------|:-------------------|
| `@EventPattern` | the error is rethrown to the transport, so its retry and DLQ policy applies: no ack, redelivery up to `maxRetries`, then the dead-letter queue |
| `@On` | the `[EventDispatchService]` error line is logged; the other handlers of the same event keep running |

That holds whether the `@Catch` returns nothing, returns a value or throws. A returned value has
no effect, and since it can only mean the handler expected it to count, it is logged as a warning
naming the method:

```
@Catch handler ApiExceptionHandler.database() returned a value for an event failure — a return value
has no effect in event scopes (@On, @EventPattern); the original error continues unchanged.
```

Use these scopes for alerting, metrics and audit. To stop an event from being retried, handle the
error inside the event handler itself.

### Headless applications

Without an HTTP adapter, `@Catch` still receives `@On`, `@MessagePattern` and `@EventPattern`
failures. A `@NotFound()` method is ignored, with a warning at boot.

---

## Not Found

A request that matched no route is not an error: nothing threw, the router simply had nowhere to
send it. It therefore **never reaches `@Catch`**, not even the catch-all. It has its own hook,
`@NotFound()`, so a catch-all never has to ask which of the two it is looking at, and a 404 can
never be swallowed by a handler written for exceptions.

```typescript
import { ExceptionHandler } from '@asenajs/asena/decorators';
import { NotFound } from '@asenajs/asena/exception';
import type { NotFoundRequest } from '@asenajs/asena/adapter';
import type { Context } from '@asenajs/ergenecore'; // or '@asenajs/hono-adapter'

@ExceptionHandler()
export class ApiExceptionHandler {
  @NotFound()
  public missing(context: Context, request: NotFoundRequest) {
    return context.send({
      type: 'about:blank',
      title: 'Not Found',
      status: 404,
      instance: request.path,
    }, 404);
  }
}
```

The signature is `(context, request) => Response | void`. `request.path` is the path only, with no
origin and no query string, and `request.method` is the upper-case verb. Both are normalised by the
adapter, so the same body works on Ergenecore and the Hono adapter.

- **One per application.** Every unmatched route looks the same, so there is nothing to
  discriminate on; a second `@NotFound()` fails the boot.
- **It can decline.** Returning nothing, returning something that is not a `Response`, or throwing
  hands the request to `@Config.onNotFound` and then the adapter's 404. A throw is logged first.
- **Global middlewares run before it** on both adapters, so a 404 still carries CORS headers and
  anything else you apply to every request.
- **Missing static files reach it too.** A file `@StaticServe` cannot find is answered by the
  same handler. The per-route `StaticServeService.onNotFound` still runs first when you declare
  one; it observes the miss and does not answer it.

With nothing answering, **both** adapters answer `404` with `Content-Type: application/json`:

```json
{ "error": "Not Found" }
```

and write one INFO line, `Route not found:` with `{ path, method, status }`.

::: info Not the same as a domain 404
`@NotFound()` is about routing. When the route exists but the record does not, throw: that is an
application decision, and a `@Catch` answers it.

```typescript
import { NotFoundException } from '@asenajs/asena/adapter';

throw new NotFoundException({ error: 'ORDER_NOT_FOUND', id });
```
:::

---

## Throwing HTTP Exceptions

`HttpException` is the class to throw for a deliberate HTTP status. It comes from
`@asenajs/asena/adapter`, the framework core rather than an adapter, so the same import and the
same throw work on Ergenecore and Hono:

```typescript
import { HttpException } from '@asenajs/asena/adapter';

throw new HttpException(429, 'Too Many Requests', {
  headers: { 'Retry-After': '60' },
});
```

With no `@Catch` matching it, the adapter answers from the exception's own status, body and
headers. Thrown from a middleware, it reaches `@Catch` exactly like a throw from a controller.

### HttpException API

```typescript
new HttpException(status, body, options?)
```

| Parameter | Type | Required | Description |
|:----------|:-----|:---------|:------------|
| `status` | `HttpStatusCode \| number` | Yes | HTTP status code. The `ClientErrorStatusCode` / `ServerErrorStatusCode` enums are accepted. |
| `body` | `string \| object` | No (default `''`) | Response body. An object is serialized and gets `Content-Type: application/json` automatically. |
| `options` | `HttpExceptionInit` | No | Extends `ResponseInit` (headers, statusText) with `cause?: Error` for wrapping the original failure. |

```typescript
throw new HttpException(400, { error: 'Invalid input', field: 'email' });

throw new HttpException(503, 'Service Unavailable', { statusText: 'Maintenance Mode' });

throw new HttpException(500, 'Database Error', { cause: originalError });
```

::: warning `message` is the body as a *string* — do not re-wrap it
`body` is what the caller receives. `message` is the same thing flattened to a string, which for
an object body is the **serialized JSON**:

```typescript
const error = new HttpException(404, { error: 'Order not found' });

error.message              // '{"error":"Order not found"}'   <- a string, not an object
error.getResponse()        // 404, body {"error":"Order not found"}
```

So a handler that answers `context.send({ error: error.message }, error.status)` double-encodes an
object body into `{"error":"{\"error\":\"Order not found\"}"}`. Pick one style and stay with it:

- **The exception owns the body**: throw whatever shape you want and answer with
  `error.getResponse()`. Works for hono's `HTTPException` too, which has no `body` at all.
- **The handler owns the body**: throw a **string** and build the envelope from `error.message`
  and `error.status`. Use this when every error in your API must share one shape.

`error.body` exists only on `HttpException` itself, not on `HttpExceptionLike`, so a handler that
reads it is assuming it threw the exception itself.
:::

### Ready-made status exceptions

`@asenajs/asena/adapter` exports one `HttpException` subclass per commonly thrown status. Each
takes `(body?, options?)`, and `body` defaults to the reason phrase, so
`throw new NotFoundException()` answers `404 Not Found`.

| Status | Class |
|:-------|:------|
| 400 | `BadRequestException` |
| 401 | `UnauthorizedException` |
| 403 | `ForbiddenException` |
| 404 | `NotFoundException` |
| 405 | `MethodNotAllowedException` |
| 406 | `NotAcceptableException` |
| 408 | `RequestTimeoutException` |
| 409 | `ConflictException` |
| 410 | `GoneException` |
| 412 | `PreconditionFailedException` |
| 413 | `PayloadTooLargeException` |
| 415 | `UnsupportedMediaTypeException` |
| 418 | `ImATeapotException` |
| 422 | `UnprocessableEntityException` |
| 500 | `InternalServerErrorException` |
| 501 | `NotImplementedException` |
| 502 | `BadGatewayException` |
| 503 | `ServiceUnavailableException` |
| 504 | `GatewayTimeoutException` |
| 505 | `HttpVersionNotSupportedException` |

They exist so a status can be caught by type. `@Catch(ConflictException)` singles out one status,
which a bare `HttpException` carrying a runtime number cannot; `@Catch(HttpException)` still
receives every one of them that has no narrower handler. `error.name` is the concrete class name,
so logs identify it.

### Hono's `HTTPException`

`@asenajs/hono-adapter` exports hono's `HTTPException`, and hono packages that throw it
(`hono/basic-auth`, `hono/bearer-auth`, `hono/jwt`, hono's validator) work unchanged. It is a
different class from `HttpException`, but the Hono adapter brands it, so `@Catch(HttpException)`
and `isHttpException()` both recognise it and the adapter answers it from its own status.

**Import it from `@asenajs/hono-adapter`, never from `hono/http-exception`.** The brand is
installed on the prototype of the copy of `hono` the adapter resolved. If a project resolves *two*
copies, `HTTPException` from the other copy is recognised by neither `@Catch(HttpException)` nor
`isHttpException()`, and every deliberate `401`/`403` thrown from it becomes a `500`, silently,
with the API still responding. `hono` is a peer dependency of the adapter, so a project normally
resolves exactly one copy; importing from the adapter is the guarantee on top of that.

`HttpException` from `@asenajs/asena/adapter` sidesteps the question: it brands each *instance*,
so it is recognised no matter which copy of the framework constructed it.

If you suspect a duplicate, `bun pm ls --all | grep hono` shows a nested
`@asenajs/hono-adapter/node_modules/hono` when there is one, and the adapter writes a startup
warning if it finds itself resolving one. Removing the duplicate from the lockfile is not enough;
the stale `node_modules` directory has to go too: `rm -rf node_modules bun.lock && bun install`.

### `isHttpException()` outside `@Catch`

`@Catch(HttpException)` already matches by brand. Where you branch on an error by hand, in a
catch-all or a `try`/`catch`, use `isHttpException()` rather than `instanceof`, which misses hono's
`HTTPException` and anything built by a second copy of the framework:

```typescript
import { isHttpException } from '@asenajs/asena/adapter';

if (isHttpException(error)) {
  return error.getResponse?.() ?? context.send({ error: error.message }, error.status);
}
```

The guard narrows to `HttpExceptionLike`: `status`, an optional `getResponse()` and the usual
`Error` members.

### Authentication errors

The [asena-auth](/docs/packages/auth#route-guards) guard rejects with a core `HttpException`, so it
reaches `@Catch(HttpException)` like any other:

| Situation | Status | Body | Header |
|:----------|:-------|:-----|:-------|
| No session on a `@Protected` / `@Roles` route | 401 | `Unauthorized` | `WWW-Authenticate: Bearer` |
| A session without any of the route's roles | 403 | `Forbidden` | - |
| `requireAuthSession(context)` without a session | 401 | `Authentication required` | - |

The challenge header travels in the exception's response, so a handler that answers with
`error.getResponse()` keeps it. A handler that builds its own envelope drops it unless it copies
the header across:

```typescript
@Catch(HttpException)
public http(error: HttpExceptionLike, ctx: ExceptionContext<Context>) {
  if (ctx.scope !== 'http') return;

  const challenge = error.getResponse?.().headers.get('WWW-Authenticate');

  return ctx.context.send(
    { error: error.message },
    { status: error.status, headers: challenge ? { 'WWW-Authenticate': challenge } : {} },
  );
}
```

---

## Validation Errors

A failed request validation is thrown like any other error, so a `@Catch` can give it the same
envelope as the rest of your API. Two classes are involved:

| Validation | Thrown | Import |
|:-----------|:-------|:-------|
| [Route context contract](/docs/concepts/validation#route-context-contracts) | `ContractValidationError` | `@asenajs/asena/adapter` |
| [Validator class](/docs/concepts/validation) (`@Middleware({ validator: true })`) | `ValidationError` | your adapter package |

Both carry status 400, both are HTTP exceptions, and both satisfy `isValidationError()` and the
`ValidationErrorLike` type: `target` (which part of the request failed) and `issues`
(`{ path, message, code? }`, adapter-agnostic). Catch them together:

```typescript
import { ExceptionHandler } from '@asenajs/asena/decorators';
import { Catch, type ExceptionContext } from '@asenajs/asena/exception';
import { ContractValidationError, type ValidationErrorLike } from '@asenajs/asena/adapter';
import { ValidationError, type Context } from '@asenajs/ergenecore'; // or '@asenajs/hono-adapter'

@ExceptionHandler()
export class ValidationExceptionHandler {
  @Catch(ValidationError, ContractValidationError)
  public validation(error: ValidationErrorLike, ctx: ExceptionContext<Context>) {
    if (ctx.scope !== 'http') return;

    return ctx.context.send({
      success: false,
      message: 'Validation failed',
      target: error.target,
      errors: error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message })),
    }, 400);
  }
}
```

Because both are HTTP exceptions, a `@Catch(HttpException)` receives them when nothing narrower
does, and answers them with their own status.

::: tip Reaching the original error
`error.cause` holds what the validator produced: the `ZodError` for a validator class, the
Standard Schema issues for a contract. Zod 4 removed `ZodError.errors`; the field is `issues`.
:::

With nothing answering, the adapter falls back to the error's own envelope. A validator class
answers Zod's flattened error:

```json
{
  "error": "Validation failed",
  "details": { "formErrors": [], "fieldErrors": { "email": ["Invalid email"] } },
  "target": "json"
}
```

and a contract answers its issues:

```json
{
  "error": "Validation failed",
  "target": "body",
  "issues": [{ "message": "Too small: expected number to be >0", "path": ["quantity"] }]
}
```

The failure is logged like any other 4xx. A validator `hook` that returns a `Response` answers
the request itself, and no `@Catch` is consulted. See
[Validation](/docs/concepts/validation#validation-error-responses).

---

## `@Config.onError` and `onNotFound` {#config-onerror-and-onnotfound}

::: warning Deprecated, removed in 1.0
`onError` and `onNotFound` on the `@Config` class are deprecated and will be removed in 1.0. Use
`@Catch` and `@NotFound()` methods in an `@ExceptionHandler` class instead.
:::

Until then they keep working as the last link before the adapter default: `onError` runs after
every `@Catch` declined, `onNotFound` after `@NotFound()` declined. Each logs a deprecation
warning at boot. See [Configuration](/docs/guides/configuration#onerror-and-onnotfound).

---

## Best Practices

### 1. Throw from services, answer in one place

Services throw domain errors and ready-made status exceptions. Controllers stay thin and do not
catch them. The exception handler is the one place that maps them to responses, so the mapping is
not repeated in every route.

```typescript
// ❌ Each route translates errors itself
@Get('/:id')
public async getById(context: Context) {
  try {
    return context.send(await this.orderService.findById(context.getParam('id')));
  } catch (error) {
    if (error instanceof OrderNotFoundError) return context.send({ error: 'Not found' }, 404);
    throw error;
  }
}

// ✅ The route does its job; ApiExceptionHandler answers OrderNotFoundError
@Get('/:id')
public async getById(context: Context) {
  return context.send(await this.orderService.findById(context.getParam('id')));
}
```

### 2. Keep one response format

Return errors in a consistent shape, whichever handler answers:

```typescript
{
  "success": false,
  "message": "Human-readable error message",
  "error": "ERROR_CODE",
  "details": { /* optional additional context */ }
}
```

### 3. Do not leak internals

::: danger Never Leak Sensitive Information
- **Don't expose stack traces** in production
- **Don't return internal error messages** to clients
- **Don't include database queries** or system paths
- **Do sanitize error messages** before sending to clients
:::

```typescript
@Catch(Error)
public unexpected(error: Error, ctx: ExceptionContext<Context>) {
  if (ctx.scope !== 'http') return;

  this.logger.error('Unexpected error', {
    path: ctx.context.req.url,
    method: ctx.context.req.method,
    error,
  });

  return ctx.context.send({
    success: false,
    message: 'An error occurred. Please try again later.',
    ...(process.env.NODE_ENV === 'development' && { debug: error.message }),
  }, 500);
}
```

A handler that answers also owns the log line: the adapter writes nothing for a request a
`@Catch` answered.

### 4. Use specific status codes

| Status Code | When to Use |
|:------------|:------------|
| `400` | Bad Request - Invalid input data |
| `401` | Unauthorized - Authentication required |
| `403` | Forbidden - User doesn't have permission |
| `404` | Not Found - Resource doesn't exist |
| `409` | Conflict - Resource already exists |
| `422` | Unprocessable Entity - Validation failed |
| `429` | Too Many Requests - Rate limit exceeded |
| `500` | Internal Server Error - Unexpected server error |
| `503` | Service Unavailable - Temporary downtime |

### 5. Degrade gracefully

Not every failure has to fail the request. Where partial data is still useful, settle the calls
and report what is missing:

```typescript
@Get('/dashboard')
public async getDashboard(context: Context) {
  const [orders, invoices] = await Promise.allSettled([
    this.orderService.findRecent(),
    this.invoiceService.findOpen(),
  ]);

  return context.send({
    orders: orders.status === 'fulfilled' ? orders.value : [],
    invoices: invoices.status === 'fulfilled' ? invoices.value : [],
    warnings: [
      orders.status === 'rejected' && 'Failed to load orders',
      invoices.status === 'rejected' && 'Failed to load invoices',
    ].filter(Boolean),
  });
}
```

### 6. Observe events, do not try to recover them

In `@On` and `@EventPattern` scopes a `@Catch` is for alerting and metrics. Return nothing there:
the original failure continues whatever the handler does, and a returned value only adds a
warning.

## Related

- [Configuration](/docs/guides/configuration) - The `@Config` class and its deprecated error hooks
- [Middleware](/docs/concepts/middleware) - Throwing from middleware
- [Validation](/docs/concepts/validation) - Validators, contracts and their errors
- [Event System](/docs/concepts/event-system) - `@On` handlers and error isolation
- [Microservices](/docs/concepts/microservices) - `@MessagePattern`, `@EventPattern` and delivery semantics
- [Context API](/docs/concepts/context) - Understanding request context
- [Logger Package](/docs/packages/logger) - Structured logging with AsenaLogger
