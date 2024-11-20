# Controller
Controllers are the main entry point for the application. They are responsible for handling requests and returning responses.

## Basic usage
Here is an example of a simple controller:

```typescript
import { Controller, Get, type Context } from "@asenajs/asena";

@Controller("/v1")
export class BasicController {

    @Get("/")
    public baseGet(context: Context) {
        return context.send("Hello World!");
    }
}
```
This controller returns "Hello World!" when a GET request is made to the `/v1` route.

## Context
The `AsenaContext` interface represents the context for Asena and provides various methods to interact with the request and response objects.

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `req` | `R` | The request object. |
| `res` | `S` | The response object. |
| `headers` | `Record<string, string>` | Headers associated with the request. |

#### Methods

| Method | Return Type | Description |
|--------|-------------|-------------|
| `getArrayBuffer()` | `Promise<ArrayBuffer>` | Retrieves the request body as an ArrayBuffer. |
| `getParseBody()` | `Promise<any>` | Parses and retrieves the request body. |
| `getBlob()` | `Promise<Blob>` | Retrieves the request body as a Blob. |
| `getFormData()` | `Promise<FormData>` | Retrieves the request body as FormData. |
| `getParam(s: string)` | `string` | Retrieves a parameter from the request. |
| `getBody<U>()` | `Promise<U>` | Retrieves the request body as a specified type. |
| `getQuery(query: string)` | `Promise<string>` | Retrieves a query parameter from the request. |
| `getQueryAll(query: string)` | `Promise<string[]>` | Retrieves all values of a query parameter from the request. |
| `getCookie(name: string, secret?: string \| BufferSource)` | `Promise<string \| false>` | Retrieves a cookie from the request. |
| `setCookie(name: string, value: string, options?: CookieExtra<any>)` | `Promise<void>` | Sets a cookie in the response. |
| `deleteCookie(name: string, options?: CookieExtra<any>)` | `Promise<void>` | Deletes a cookie from the response. |
| `getValue<T>(key: string)` | `T` | Retrieves a value from the context. |
| `setValue(key: string, value: any)` | `void` | Sets a value in the context. |
| `setWebSocketValue(value: any)` | `void` | Sets a value for WebSocket communication. |
| `getWebSocketValue<T>()` | `T` | Retrieves a value for WebSocket communication. |
| `html(data: string)` | `Response \| Promise<Response>` | Sends an HTML response. |
| `send(data: string \| any, status?: SendOptions \| number)` | `Response \| Promise<Response>` | Sends a response. |
| `redirect(url: string)` | `void` | Redirects the request to a new URL. |



## Controllers with services

In basic example we create a `Get` route for the `/v1` route. You can also create `Post`, `Put`, `Delete`, `Patch` and `Options` routes:

Lets have look at an example for `Post` route:

```typescript
import { Controller, Get, Post, type Context } from "@asenajs/asena";

@Controller("/v1")
export class AdvancedController {

    private items:string[] = [];

    @Get("/items")
    public getItems(context: Context) {
        return context.send({items:this.items});
    }

    @Post("/items")
    public async setItem(context:Context){
        const { item } = await context.getBody<{item:string}>();
        this.items.push(item);

        return context.send("Item added succesfuly");
    }
}
```

Lets make this example with a ItemService:

First we need to create a service for our items:

```typescript
import { Service } from "@asenajs/asena";

@Service()
export class ItemService {

    private items: string[] = [];

    public getItems(): string[] {
        return this.items;
    }

    public setItems(items: string[]): void {
        this.items = items;
    }

    public pushItem(item: string): void {
        this.items.push(item);
    }

    public deleteItem(item: string): boolean {
        const index = this.items.indexOf(item);
        if (index > -1) {
            this.items.splice(index, 1);
            return true;
        }
        return false;
    }

    public searchItem(query: string): string[] {
        return this.items.filter(item => item.includes(query));
    }
}
```
And then we can use this service in our controller:

```typescript
import { Controller, Get, Inject, Post, Delete, type Context } from "@asenajs/asena";
import { ItemService } from "../service/ItemService";

@Controller("/v1")
export class AdvancedController {

    @Inject(ItemService)
    private itemService: ItemService;

    @Get("/items")
    public getItems(context: Context) {
        return context.send({ items: this.itemService.getItems() });
    }

    @Get("/items/:id")
    public getItem(context: Context) {
        const id = context.getParam("id");
        const item = this.itemService.searchItem(id);

        return context.send({ item });
    }

    @Post("/items")
    public async setItem(context: Context) {
        const { item } = await context.getBody<{ item: string }>();
        this.itemService.pushItem(item);
        return context.send("Item added successfully");
    }

    @Delete("/items/:id")
    public async deleteItem(context: Context) {
        const id = context.getParam("id");
        const success = this.itemService.deleteItem(id);

        return context.send({ success });
    }

    @Get("/items/search")
    public async searchItems(context: Context) {
        const query = await context.getQuery("item");
        const results = this.itemService.searchItem(query);
        return context.send({ results });
    }
}
```

## Dependency injection

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