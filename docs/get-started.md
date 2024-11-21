---
outline: deep
---

# Getting Start

First, create a new project using Bun:

```bash
bun init
````

For decorators working properly, you need to add some settings to your tsconfig. Here is an recommended file:

```json
{
  "compilerOptions": {
    // Enable latest features
    "lib": [
      "ESNext",
      "DOM"
    ],
    "target": "ESNext",
    "module": "ESNext",
    "moduleDetection": "force",
    "jsx": "react-jsx",
    "allowJs": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    // Bundler mode
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "noEmit": true,
    // Best practices
    "strict": false,
    "skipLibCheck": true,
    "noFallthroughCasesInSwitch": true,
    // Some stricter flags
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noPropertyAccessFromIndexSignature": true
  }
}

```

Then, install the required packages:

```bash

bun add @asenajs/asena hono winston
```

Add @asenajs/asena-cli to your package. This package provides a CLI for creating and managing Asena projects.

```bash
bun add -D @asenajs/asena-cli
````

Then, create a new .asenarc.json file using the CLI:

```bash

## Creates a .asenarc.json file with default values (requires manual updates). Source folder is 'src'.
asena init
```

`Note`: Built options directly copy of bun options, you can check bun documentation for more
options. [Bun Documentation](https://bun.sh/docs/bundler#reference)

Create index.ts file under your src folder:

```typescript
// src/index.ts
import {AsenaServer, DefaultLogger} from "@asenajs/asena";

await new AsenaServer().logger(new DefaultLogger()).port(3000).start();
```

To run asena you need at least one controller. Create a new controller:

```typescript
// src/controllers/TestController.ts
import {type Context, Controller, Get} from "@asenajs/asena";

@Controller("/hello")
export class TestController {

    @Get("/world")
    public async getHello(context: Context) {
        return context.send("Hello World");
    }
}
```

Finally, run the project:

```bash

## only for fast developing purposes
asena dev start 
````

or you can simply build then run your bundled project

```bash
asena build
## then go to dist folder and run the project this way it will consume less memory 
bun index.asena.js
```
