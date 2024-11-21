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

