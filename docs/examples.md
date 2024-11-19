# Example

Here is a simple example of a controller with service and middleware:

## Middleware
This middleware sets a value to the context object.
```typescript
// src/middleware/TestMiddleware.ts
import {type Context, Middleware, MiddlewareService} from "@asenajs/asena";

@Middleware()
export class TestMiddleware extends MiddlewareService {

    public handle(context: Context, next: Function) {
        context.setValue("testValue", "test");

        next();
    }
}
```

## Service
Basic service with a getter and setter.

```typescript
import {Service} from "@asenajs/asena";

@Service()
export class HelloService {

    private _foo: string = "bar";

    public get foo(): string {
        return this._foo;
    }

    public set foo(value: string) {
        this._foo = value;
    }
}

```

## Controller
Controller with a GET route that uses the middleware and service.

```typescript
// src/controller/TestController.ts
import {type Context, Controller, Get, Inject} from "@asenajs/asena";
import {HelloService} from "../service/HelloService.ts";
import {TestMiddleware} from "../middleware/TestMiddleware.ts";

@Controller("/v1")
export class TestController {

    @Inject(HelloService)
    private helloService: HelloService

    @Get("foo")
    public async getFoo(context: Context) {
        return context.send(this.helloService.foo);
    }

    @Get({path: "world", middlewares: [TestMiddleware]})
    public async getHello(context: Context) {
        const testValue: string = context.getValue("testValue");

        return context.send(testValue);
    }
}
```

## Index
The main file that starts the server.

```typescript
// src/index.ts
import {AsenaServer, DefaultLogger} from "@asenajs/asena";

await new AsenaServer().logger(new DefaultLogger()).port(3000).start();
```

then run
```bash
asena-cli dev start
```

You should see the following output:
```text

Build completed successfully.  
2024-11-19 17:58:35 [info]:     
    ___    _____  ______ _   __ ___ 
   /   |  / ___/ / ____// | / //   |
  / /| |  \__ \ / __/  /  |/ // /| |
 / ___ | ___/ // /___ / /|  // ___ |
/_/  |_|/____//_____//_/ |_//_/  |_|  
                             
2024-11-19 17:58:35 [info]:     IoC initialized 
2024-11-19 17:58:35 [info]:     No server services found 
2024-11-19 17:58:35 [info]:     Controller: V1 found 
2024-11-19 17:58:35 [info]:     Successfully registered GET route for PATH: /v1/foo 
2024-11-19 17:58:35 [info]:     Successfully registered GET route for PATH: /v1/world 
2024-11-19 17:58:35 [info]:     No websockets found 
2024-11-19 17:58:35 [info]:     Server started on port 3000 
```

and you see the result on your browser `http://localhost:3000/v1/foo` with "bar" message.