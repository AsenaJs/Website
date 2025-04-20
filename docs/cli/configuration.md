# ⚙️ Asena Cli configration

All asena projects comes with `asena-config.ts` files which helps you to make configration. In this page We're gonna show the basic configrations of an asena project. It's important to check config file depending on your project.

Default configration of the asena project is shown belove.

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

We're gonna  walk throat for each variable of config file

**sourceFolder**: Shows the source folder of project. Asena looks for components under this folder.

**rootFile**: This is the file where asena project started.

**buildOptions**: In shortly you can check the official bun website to see all options. Asena supports all bun options by default.

**outdir**: Folder name where the build files located. 

**sourcemap**: Controls generation and embedding of source maps for debugging.

**target**: Specifies the compilation target

**minify**: Turns on all code‑shrinking passes

**whitespace**: Removes unnecessary whitespace.

**syntax**:Applies smarter condensation transforms

**identifiers**: Renames local variables, function names, and other identifiers to shorter names


[To see more](https://bun.sh/docs/bundler)