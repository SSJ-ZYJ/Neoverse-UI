# @neoverse-ui/vue

Vue 3 components for the Neoverse UI design system.

```sh
bun add @neoverse-ui/vue
```

```ts
import { UiButton, UiCard, UiNotice, UiTooltipSurface } from '@neoverse-ui/vue';
```

Consumers without their own Tailwind build can import the packaged component styles:

```css
@import '@neoverse-ui/vue/index.css';
```

Vue `>=3.4 <4` is required as a peer dependency. The shared Tailwind, Motion, and Tokens layers are installed through the package dependency graph.

For the complete component API and architecture guidance, see the [Neoverse-UI repository](https://github.com/SSJ-ZYJ/Neoverse-UI).
