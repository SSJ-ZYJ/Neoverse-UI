# @neoverse-ui/vue

Vue 3 components for the Neoverse UI design system.

```sh
bun add @neoverse-ui/vue
```

```ts
import { UiButton, UiCard, UiDock, UiNotice, UiTooltipSurface } from '@neoverse-ui/vue';
```

Consumers without their own Tailwind build can import the packaged design-system styles. This entry forwards to the compiled shared consumer bundle, including Tokens, Motion, Material, component selectors, and the utilities required by the adapters:

```css
@import '@neoverse-ui/vue/index.css';
```

`UiDock` is a public floating-navigation shell built on the shared `UiControlSurface` contract. Consumers provide their own `UiNavigationItem` children, route state, icons, and optional `trailing` controls; the Dock owns chrome, scale, compact layout, divider geometry, and shared navigation-indicator behavior.

Vue `>=3.4 <4` is required as a peer dependency. The shared Tailwind, Motion, and Tokens layers are installed through the package dependency graph.

For the complete component API and architecture guidance, see the [Neoverse-UI repository](https://github.com/SSJ-ZYJ/Neoverse-UI).
