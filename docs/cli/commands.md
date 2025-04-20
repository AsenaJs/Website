# 📖 Commands

### ```asena create```

The Create command bootstraps new Asena projects with a complete development environment setup.

#### Features

- **Interactive Setup**: Uses inquirer for a user-friendly setup experience
- **Project Structure**: Creates the basic project structure with necessary files and directories
- **Default Components**: Generates default controller and server setup
- **Development Tools**: Optional integration of:
    - ESLint configuration
    - Prettier setup
- **Dependency Management**: Automatically installs required dependencies

```bash
✔ Enter your project name: ProjectName
✔ Do you want to setup ESLint? Yes
✔ Do you want to setup Prettier? Yes
⠙ Creating asena project...
```

### ```asena generate```

Note: You can also use `asena g` as a shortcut.

The generate command allows you to quickly and consistently create project components.

#### Features

- **Multi-Component Support**: Ability to generate controllers, services, and middlewares
- **Automatic Code Generation**: Creates template code with base structure and necessary imports
- **Project Structure Integration**: Places generated files in the correct directories
- **Shortcuts**: Command aliases for faster usage (g, c, s, m)


| **Component** | **Full Command**              | **Shortcut Command** | **Description**              |
|---------------|-------------------------------|-----------------------|--------------------------|
| Controller    | `asena generate controller`   | `asena g c`           | Generates a controller   |
| Service       | `asena generate service`      | `asena g s`           | Generates a service      |
| Middleware    | `asena generate middleware`   | `asena g m`           | Generates a middleware   |

After executing these commands, the created component is placed under the relevant folder. For example:

```bash
asena g m
```
After executing the command, the component will be created in the middleware folder under the source folder. Assuming we have created a middleware named MiddlewareExample and our source folder is ``src``, the middleware can be found in the path ``src/middleware/MiddlewareExample.ts``. The middleware to be created is as shown below:

```typescript
import {Middleware} from '@asenajs/asena/server'; 
import {type Context,MiddlewareService} from '@asenajs/hono-adapter'; 

@Middleware()
export class MiddlewareExample extends MiddlewareService{

	public handle(context:Context, next:Function) {
		context.setValue("testValue","test");

		next();
	}
}
```

### ```asena dev start```

The Dev command enables development mode with enhanced debugging capabilities.

#### Features

- **Build Integration**: Automatically builds the project before starting

After executing this command, the project is automatically compiled and started. For example:

```bash
asena dev start
```
Output:

```bash
Build completed successfully.
2025-04-09 22:17:19 [info]: 	
    ___    _____  ______ _   __ ___ 
   /   |  / ___/ / ____// | / //   |
  / /| |  \__ \ / __/  /  |/ // /| |
 / ___ | ___/ // /___ / /|  // ___ |
/_/  |_|/____//_____//_/ |_//_/  |_|  
                             
2025-04-09 22:17:20 [info]: 	Adapter: HonoAdapter implemented 
2025-04-09 22:17:20 [info]: 	All components registered and ready to use 
2025-04-09 22:17:20 [info]: 	No configs found 
2025-04-09 22:17:20 [info]: 	Controller: AsenaController found: 
2025-04-09 22:17:20 [info]: 	Successfully registered GET route for PATH: / 
2025-04-09 22:17:20 [info]: 	Controller: AsenaController successfully registered. 
2025-04-09 22:17:20 [info]: 	No websockets found 
2025-04-09 22:17:20 [info]: 	Server started on port 3000 
```

You can see the controllers name if your identifiers value in asena-config.ts is false

### ```asena build```

The Build command handles project deployment preparation.

#### Features

- **Configuration Processing**: Reads and processes the Asena configuration file
- **Code Generation**: Creates a temporary build file that combines all controllers and components
- **Import Management**: Handles import statements and organizes them based on the project structure. No need to add controllers manually to root file
- **Server Integration**: Processes the AsenaServer configuration and integrates components

### ```asena init```

The Init command helps set up project configuration with default settings(no need if you used ```asena create```).

#### Features

- **Configuration Generation**: Creates `asena-config` configuration file
- **Default Values**: Provides sensible defaults for quick start

Default asena-config.ts file:
```typescript
import {defineConfig} from "@asenajs/asena-cli";

export default defineConfig({
  sourceFolder: 'src',
  rootFile: 'src/index.ts',
  buildOptions: {
    outdir: 'dist',
    sourcemap: 'linked',
    target: 'bun',
    minify: {
      whitespace: true,
      syntax: true,
      identifiers: false,
    },
  },
});

```