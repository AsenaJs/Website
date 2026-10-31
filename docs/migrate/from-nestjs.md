---
title: Coming from NestJS
description: NestJS concepts mapped to Asena side by side - modules, injection, controllers, guards, pipes, interceptors, exception filters, config, testing, WebSockets and microservices
outline: deep
---

# Coming from NestJS

Asena uses many of the same decorator names as NestJS, but the wiring underneath is different:
there are no modules, dependencies go on fields instead of constructors, and the HTTP server is
an adapter on Bun. This page maps each NestJS concept to its Asena counterpart, and says plainly
where there is none.

## At a Glance

| NestJS | Asena |
|:-------|:------|
| `@Module({ controllers, providers, imports })` | Nothing to declare: the container scans `sourceFolder` |
| `@Injectable()` | `@Service()` |
| Constructor injection | `@Inject(Class)` on a field |
| `@Controller('users')`, `@Get(':id')` | `@Controller('/users')`, `@Get('/:id')` |
| `@Param()`, `@Body()`, `@Query()` | `context.getParam()`, `context.getBody()`, or a route context contract |
| Guards | Middleware |
| `ValidationPipe` + DTO classes | Route context contracts |
| Interceptors | Middleware with code after `await next()`; `@PostProcessor` |
| Exception filters | `onError` on the `@Config` class |
| `HttpException` | `HttpException` from `@asenajs/asena/adapter` |
| `@nestjs/config` | `@Value('ENV_KEY')` |
| `onModuleInit` / `onApplicationShutdown` | `@OnStart` / `@OnStop` |
| `Test.createTestingModule()` | `mockComponent`, `createWebTest`, `createTestApp` |
| `@WebSocketGateway` | `@WebSocket` + `AsenaWebSocketService` |
| `@MessagePattern`, `@EventPattern`, `ClientProxy` | The same two decorators on a `@MessageController`, and `ulak` |
| Node.js, Express or Fastify | Bun only, with the Ergenecore or Hono adapter |

## Modules and Providers

NestJS builds the dependency graph from modules: every provider is listed in a module, and a
module exports what other modules may import. Asena has no module layer. A decorated class is
found by the component scan and can be injected anywhere.

::: code-group

```typescript [NestJS]
@Module({
  imports: [DatabaseModule],
  controllers: [UserController],
  providers: [UserService, UserRepository],
  exports: [UserService],
})
export class UserModule {}

// main.ts
const app = await NestFactory.create(AppModule);
await app.listen(3000);
```

```typescript [Asena]
// src/index.ts - no module, no providers array
import { AsenaServerFactory } from '@asenajs/asena';
import { createErgenecoreAdapter } from '@asenajs/ergenecore';
import { logger } from './logger';

const server = await AsenaServerFactory.create({
  adapter: createErgenecoreAdapter(),
  logger,
  port: 3000,
});

await server.start();
```

:::

**No direct equivalent:** module encapsulation. Every component is visible to every other
component; Asena relies on [layering conventions](/docs/best-practices) rather than module
boundaries. Dynamic modules (`forRoot()`, `forRootAsync()`) do not exist either. Official
packages are configured by extending one of their classes instead, and components shipped in a
package are handed in through the [`imports`](/docs/concepts/dependency-injection#registering-components-from-packages) option.

## Dependency Injection

::: code-group

```typescript [NestJS]
@Injectable()
export class UserService {
  constructor(private readonly users: UserRepository) {}

  async findById(id: string) {
    const user = await this.users.findById(id);

    if (!user) throw new NotFoundException('User not found');

    return user;
  }
}
```

```typescript [Asena]
import { Service } from '@asenajs/asena/decorators';
import { Inject } from '@asenajs/asena/decorators/ioc';
import { HttpException } from '@asenajs/asena/adapter';

@Service()
export class UserService {
  @Inject(UserRepository)
  private users: UserRepository;

  async findById(id: string) {
    const user = await this.users.findById(id);

    if (!user) throw new HttpException(404, { message: 'User not found' });

    return user;
  }
}
```

:::

- Fields are injected after the constructor runs. Code that needs them goes in an `@OnStart`
  method, not the constructor.
- `@Inject('Name')` injects by registered name, the closest thing to a string token.
- `@Strategy('Name')` injects every implementation of an interface as an array, which covers
  most multi-provider setups.
- `Scope.SINGLETON` (default) and `Scope.PROTOTYPE` exist.

**No direct equivalent:** custom providers. There is no `useValue`, `useFactory` or `useClass`;
the container only holds decorated classes. Build the value inside a service and inject the
service. There is also no `Scope.REQUEST`. A prototype is created per injection point, not per
request; per-request data goes on the context with `context.setValue()`.

Learn more: [Dependency Injection](/docs/concepts/dependency-injection)

## Controllers and Routes

NestJS hands route data to parameter decorators. Asena passes one `Context`, and a route context
contract replaces `@Body()` with a validated, typed `context.input`.

::: code-group

```typescript [NestJS]
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findById(id);
  }

  @Post()
  @HttpCode(201)
  create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }
}
```

```typescript [Asena]
import { Controller } from '@asenajs/asena/decorators';
import { Get, Post } from '@asenajs/asena/decorators/http';
import { Inject } from '@asenajs/asena/decorators/ioc';
import { Context } from '@asenajs/ergenecore';
import { z } from 'zod';

class CreateUserContext extends Context.define({
  body: z.object({ name: z.string().min(1) }),
}) {}

@Controller('/users')
export class UserController {
  @Inject(UserService)
  private userService: UserService;

  @Get('/:id')
  async findOne(context: Context) {
    return context.send(await this.userService.findById(context.getParam('id')));
  }

  @Post('/')
  async create(context: CreateUserContext) {
    return context.send(await this.userService.create(context.input.body), 201);
  }
}
```

:::

Learn more: [Controllers](/docs/concepts/controllers) · [Context](/docs/concepts/context)

## Guards, Pipes and Interceptors

NestJS has a separate building block for each step of a request. Asena has middleware and
validation, which run in this order:

<DocDiagram id="request-pipeline" />

### Guards → Middleware

A guard becomes a middleware that throws, or returns `false` for a plain `403`. Attach it to a
controller, a route, or globally.

::: code-group

```typescript [NestJS]
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    if (!request.headers.authorization) throw new UnauthorizedException();

    return true;
  }
}

@Controller('admin')
@UseGuards(AuthGuard)
export class AdminController {}
```

```typescript [Asena]
import { Controller, Middleware } from '@asenajs/asena/decorators';
import { HttpException } from '@asenajs/asena/adapter';
import { MiddlewareService, type Context } from '@asenajs/ergenecore';

@Middleware()
export class AuthMiddleware extends MiddlewareService {
  async handle(context: Context, next: () => Promise<void>) {
    const token = context.headers['authorization'];

    if (!token) throw new HttpException(401, { message: 'Unauthorized' });

    context.setValue('userId', token.slice('Bearer '.length));
    await next();
  }
}

@Controller({ path: '/admin', middlewares: [AuthMiddleware] })
export class AdminController {}
```

:::

**No direct equivalent:** `Reflector` and custom metadata such as `@Roles('admin')`. Pass the
rule to the middleware another way, for example one middleware class per role.

### Pipes → Route context contracts

`ValidationPipe` with class-validator DTOs becomes a contract with Zod or any Standard Schema
library. Coercion and transforms (`z.coerce.number()`, `.transform()`) do the job of
`ParseIntPipe` and friends. See the `CreateUserContext` above.

Learn more: [Route Context Contracts](/docs/concepts/validation#route-context-contracts)

### Interceptors → Middleware and PostProcessors

Code after `await next()` runs once the handler has finished, which covers timing, logging and
tracing:

```typescript
import { Middleware } from '@asenajs/asena/decorators';
import { MiddlewareService, type Context } from '@asenajs/ergenecore';

@Middleware()
export class TimingMiddleware extends MiddlewareService {
  async handle(context: Context, next: () => Promise<void>) {
    const start = performance.now();

    await next();
    console.log(`${context.req.method} ${context.req.url} took ${(performance.now() - start).toFixed(1)}ms`);
  }
}
```

For behaviour around service methods rather than requests, a
[`@PostProcessor`](/docs/concepts/post-processor) can wrap every component as it leaves the
container.

**No direct equivalent:** mapping the handler's result in an interceptor
(`map(data => ({ data }))`). Shape the response in the handler or the service.

## Exception Filters → `onError`

One `onError` method on the `@Config` class sees every error a route throws: `HttpException`s,
validation failures and unexpected errors.

::: code-group

```typescript [NestJS]
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();
    const status = exception instanceof HttpException ? exception.getStatus() : 500;

    response.status(status).json({ statusCode: status });
  }
}

app.useGlobalFilters(new AllExceptionsFilter());
```

```typescript [Asena]
import { Config } from '@asenajs/asena/decorators';
import { isHttpException, isValidationError } from '@asenajs/asena/adapter';
import { ConfigService, type Context } from '@asenajs/ergenecore';

@Config()
export class AppConfig extends ConfigService {
  globalMiddlewares() {
    return [TimingMiddleware];
  }

  onError(error: Error, context: Context) {
    if (isValidationError(error)) return context.send({ message: 'Invalid request' }, 400);
    if (isHttpException(error)) return error.getResponse?.() ?? context.send({ error: error.message }, error.status);

    return context.send({ message: 'Internal server error' }, 500);
  }
}
```

:::

There is one error hook per application rather than filters per controller or route. Unmatched
routes go to a separate `onNotFound` hook.

Learn more: [Error Handling](/docs/guides/error-handling)

## Configuration

::: code-group

```typescript [NestJS]
@Injectable()
export class MailService {
  private readonly host: string;
  private readonly port: number;

  constructor(config: ConfigService) {
    this.host = config.getOrThrow<string>('SMTP_HOST');
    this.port = config.get<number>('SMTP_PORT', 587);
  }
}
```

```typescript [Asena]
import { Service } from '@asenajs/asena/decorators';
import { Value } from '@asenajs/asena/decorators/ioc';

@Service()
export class MailService {
  @Value('SMTP_HOST') // required: boot fails when unset
  private host: string;

  @Value('SMTP_PORT', { parse: Number, default: 587 })
  private port: number;
}
```

:::

Bun loads `.env` files on its own, so there is no config module to import.

**No direct equivalent:** schema validation of the whole environment at boot, or typed
namespaces like `registerAs()`. Parse what you need in a service of your own.

Learn more: [Configuration](/docs/guides/configuration) · [`@Value`](/docs/concepts/dependency-injection#value-configuration-injection)

## Lifecycle Hooks

| NestJS | Asena |
|:-------|:------|
| `onModuleInit`, `onApplicationBootstrap` | `@OnStart()` on any method |
| `onModuleDestroy`, `beforeApplicationShutdown`, `onApplicationShutdown` | `@OnStop()` on any method |
| `app.enableShutdownHooks()` | On by default: `server.start()` installs the signal handlers |

Learn more: [Component Lifecycle](/docs/concepts/lifecycle)

## Testing

`Test.createTestingModule()` with `overrideProvider()` maps onto three levels:

| NestJS | Asena |
|:-------|:------|
| A testing module with every dependency overridden by hand | `mockComponent(Class)` mocks every injected field automatically |
| A testing module with controllers and mocked services, plus supertest | `createWebTest({ controllers })` |
| `createNestApplication()` with `overrideProvider()` | `createTestApp({ components, overrides })` |

```typescript
import { expect, test } from 'bun:test';
import { mockComponent } from '@asenajs/asena/test';

test('throws 404 for a missing user', async () => {
  const { instance, mocks } = mockComponent(UserService);

  mocks.users.findById.mockResolvedValue(null);

  await expect(instance.findById('x')).rejects.toMatchObject({ status: 404 });
});
```

Tests use Bun's own runner; there is no Jest setup.

Learn more: [Testing Overview](/docs/testing/overview)

## WebSockets

::: code-group

```typescript [NestJS]
@WebSocketGateway({ namespace: 'chat' })
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('message')
  handleMessage(@MessageBody() message: string) {
    this.server.emit('message', message);
  }
}
```

```typescript [Asena]
import { WebSocket } from '@asenajs/asena/decorators';
import { AsenaWebSocketService, type Socket } from '@asenajs/asena/web-socket';

@WebSocket({ path: '/chat' })
export class ChatSocket extends AsenaWebSocketService<void> {
  protected async onOpen(ws: Socket<void>) {
    ws.subscribe('lobby');
  }

  protected async onMessage(ws: Socket<void>, message: string) {
    ws.publish('lobby', message);
  }
}
```

:::

Asena WebSockets are native Bun WebSockets, not Socket.IO. There are no named events: a
namespace receives every message in `onMessage`, and rooms are Bun's publish/subscribe topics.
`publish()` skips the sender. Scaling across instances uses a
[WebSocket transport](/docs/concepts/websocket#multi-pod-websocket) such as Redis.

**No direct equivalent:** `@SubscribeMessage` routing by event name, and Socket.IO
acknowledgements. Dispatch on a field of the message yourself.

Learn more: [WebSocket](/docs/concepts/websocket)

## Microservices

The decorator names are the same. A `@MessageController` prefix applies to both kinds of
handler, and the client side is `ulak` instead of `ClientProxy`.

::: code-group

```typescript [NestJS]
@Controller()
export class OrderController {
  @MessagePattern('order.create')
  create(@Payload() data: CreateOrderDto) {
    return this.orderService.create(data);
  }

  @EventPattern('order.created')
  async onCreated(@Payload() event: OrderEvent) {
    await this.orderService.index(event);
  }
}

// caller
const order = await firstValueFrom(this.client.send('order.create', dto));
```

```typescript [Asena]
import { MessageController, Service } from '@asenajs/asena/decorators';
import { Inject } from '@asenajs/asena/decorators/ioc';
import { MessagePattern, EventPattern } from '@asenajs/asena/microservice';
import { ulak, type Ulak } from '@asenajs/asena/messaging';

@MessageController('order')
export class OrderHandler {
  @Inject(OrderService)
  private orderService: OrderService;

  @MessagePattern('create') // order.create
  async create(data: CreateOrderDto) {
    return this.orderService.create(data);
  }

  @EventPattern('created') // order.created
  async onCreated(event: OrderEvent) {
    await this.orderService.index(event);
  }
}

// caller
@Service()
export class CheckoutService {
  @Inject(ulak.messages('order'))
  private orders: Ulak.Messages<'order'>;

  async checkout(dto: CreateOrderDto) {
    return this.orders.send<{ id: string }>('create', dto);
  }
}
```

:::

`send()` returns a promise rather than an Observable. The transport is set once in the `@Config`
class's `transport()` method.

**No direct equivalent:** the TCP, NATS, MQTT, gRPC and RabbitMQ transports. Asena ships
[Redis Streams](/docs/packages/redis) and [Kafka](/docs/packages/kafka) transports, plus an
in-memory one for tests, and the transport SPI is public if you need another.

Learn more: [Microservices](/docs/concepts/microservices)

## Next

- [Key Concepts](/docs/key-concepts) - the container, scopes and bootstrap in one page
- [Best Practices](/docs/best-practices) - layout, layering and the silent traps
- [Benchmarks](/docs/benchmarks) - Asena and NestJS on identical workloads
