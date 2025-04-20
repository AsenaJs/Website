# Asena cli examples

In this page we're gonna show you how to create asena simple project and run it step by step.

## Prerequisite
* [bunjs](https://bun.sh/)(v1.2.8 or higher)

### Step #1 Install asena-cli

To install asena-cli globally, run:

```bash
bun install -g @asenajs/asena-cli
```

Verify installation:

```bash
asena --version
```

### Step 2

Create project

```bash
asena create
```

Answer questions according to your needs

```bash
✔ Enter your project name: ProjectName
✔ Do you want to setup ESLint? Yes
✔ Do you want to setup Prettier? Yes
⠙ Creating asena project...
```
Setting up ESLint and Prettier is recommended.

## Step 3: Make sure if the Asena project was created successfully

Change directory to your project folder

```bash
cd ProjectName 
```

Run your project to see if it's created successfully

```bash
asena dev start
```

You should see something like this if your project setted up successfully

```bash
Build completed successfully.
2025-04-20 13:07:16 [info]: 	
    ___    _____  ______ _   __ ___ 
   /   |  / ___/ / ____// | / //   |
  / /| |  \__ \ / __/  /  |/ // /| |
 / ___ | ___/ // /___ / /|  // ___ |
/_/  |_|/____//_____//_/ |_//_/  |_|  
                             
2025-04-20 13:07:16 [info]: 	Adapter: HonoAdapter implemented 
2025-04-20 13:07:16 [info]: 	All components registered and ready to use 
2025-04-20 13:07:16 [info]: 	No configs found 
2025-04-20 13:07:16 [info]: 	Controller: AsenaController found: 
2025-04-20 13:07:16 [info]: 	Successfully registered GET route for PATH: / 
2025-04-20 13:07:16 [info]: 	Controller: AsenaController successfully registered. 
2025-04-20 13:07:16 [info]: 	No websockets found 
2025-04-20 13:07:16 [info]: 	Server started on port 3000 
```

You can send GET request to ``http://localhost:3000/`` and see ``Hello asena`` message to make sure if project runs successfully

## Step #4 Create component

Let's create a controller and return a message from it

To create controller

```bash
asena g c
```

It will ask controller's name. I will name it as TestController.

It will located under ``src/controllers``.

Let's just return ``Hello test controller`` message.

```typescript
import {Controller} from '@asenajs/asena/server'; 
import {Get} from '@asenajs/asena/web'; 
import {type Context} from '@asenajs/hono-adapter'; 

@Controller()
export class TestController{

    @Get("/test")
	public async helloAsena(context:Context){
		return context.send("Hello test controller");
	}
}
```

The run:

```bash
asena dev start
```

The output will be:

```bash
2025-04-20 13:35:26 [info]: 
    ___    _____  ______ _   __ ___ 
   /   |  / ___/ / ____// | / //   |
  / /| |  \__ \ / __/  /  |/ // /| |
 / ___ | ___/ // /___ / /|  // ___ |
/_/  |_|/____//_____//_/ |_//_/  |_|  
                             
2025-04-20 13:35:27 [info]:     Adapter: HonoAdapter implemented 
2025-04-20 13:35:27 [info]:     All components registered and ready to use 
2025-04-20 13:35:27 [info]:     No configs found 
2025-04-20 13:35:27 [info]:     Controller: TestController found: 
2025-04-20 13:35:27 [info]:     Successfully registered GET route for PATH: /test 
2025-04-20 13:35:27 [info]:     Controller: TestController successfully registered. 
2025-04-20 13:35:27 [info]:     Controller: AsenaController found: 
2025-04-20 13:35:27 [info]:     Successfully registered GET route for PATH: / 
2025-04-20 13:35:27 [info]:     Controller: AsenaController successfully registered. 
2025-04-20 13:35:27 [info]:     No websockets found 
2025-04-20 13:35:27 [info]:     Server started on port 3000 
```

You can see our ``/test`` endpoint registered.

You can check if it works by sending a request to `http://localhost:3000/test`.

**NOTE:** Controllers will not appear in the terminal output if you enable identifiers in the config file.

## Step #5 Build project

To build project, run:

```bash
asena build
```

You can find build files inder dist folder because we named it as dist on config file.

You can basically run 

```bash
bun run dist/index.asena.ts
```

**Entry file will be named as ``index.asena.ts``** Because build operation adds .asena at the end of rootFile name