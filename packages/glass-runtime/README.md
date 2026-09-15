# @neoverse-ui/glass-runtime

Shared WebGL glass-edge enhancement runtime for Neoverse UI. CSS remains the material baseline and fallback when the runtime is unavailable.

```sh
bun add @neoverse-ui/glass-runtime
```

```ts
import { createGlassRenderer } from '@neoverse-ui/glass-runtime';

const renderer = createGlassRenderer();
renderer.mount();
```

For material contracts and runtime guidance, see the [Neoverse-UI repository](https://github.com/SSJ-ZYJ/Neoverse-UI).
