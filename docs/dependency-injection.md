# Dependency injection

You can inject services into your controllers using the `Inject` decorator:

```typescript
import { Controller, Get, Inject, type Context } from "@asenajs/asena";
import { ItemService } from "../service/ItemService";

@Controller("/v1")
export class DependencyInjectionController {

    @Inject(ItemService)
    private itemService: ItemService;

    @Get("/items")
    public getItems(context: Context) {
        return context.send({ items: this.itemService.getItems() });
    }
}
```

## Expressions in Inject

Also we can use expressions in `Inject` decorator:

```typescript
import { Controller, Get, Inject, type Context } from "@asenajs/asena";
import { ItemService } from "../service/ItemService";


@Controller("/v1")

export class DependencyInjectionController {

    @Inject(ItemService, (service: ItemService) => service.getItems())
    private items: string[];

    @Get("/items")
    public getItems(context: Context) {
        return context.send({ items: this.items });
    }
}
```

## Strategy

You can use the `Strategy` to inject different services into your controllers or services.

First you need to define your service interface:

```typescript
// src/service/TestService.ts
export interface TestService {
  testValue: string;
  test: () => void;
}
```

Then you can implement your service.

**Note:** Do not forget to add `Implements` decorator. With this decorator, Asena will understand that this class is an implementation of the service.


```typescript
// src/service/TestService1.ts
import { Service, Implements } from "@asenajs/asena";
import type { TestService } from './TestService.ts';

@Service()
@Implements('TestService')
export class TestService1 implements TestService {

    public testValue = 'i am test value';

    public test(): void {
        console.log('TestService1', this.testValue);
    }

}
```

and here is the second service:

```typescript
// src/service/TestService2.ts
import { Service, Implements } from "@asenajs/asena";

@Service()
@Implements('TestService')
export class TestService2 implements TestService {

    public testValue = 'i am test value 2';

    public test(): void {
        console.log('TestService2', this.testValue);
    }

}
```

Finally, you can inject your service into your controller:

```typescript
// src/controllers/TestController.ts
import { Controller, Get, Strategy, type Context } from "@asenajs/asena";

@Controller("/v1")
export class TestController {

    @Strategy('TestService')
    private services: TestService[];

    @Get("/test")
    public getTest(context: Context) {
        this.services.forEach(service => service.test());
        return context.send({ message: 'test' });
    }
}
```

## Expressions in Strategy

You can also use expressions in `Strategy` decorator:

```typescript
// src/controllers/TestController.ts
import { Controller, Get, Strategy, type Context } from "@asenajs/asena";

@Controller("/v1")
export class TestController {

    @Strategy('TestService', (services: TestService) => service.testValue)
    private testValues: string[];

    @Get("/test")
    public getTest(context: Context) {
        return context.send({ message: this.testValues });
    }
}
```