<div align="center">

<h1>
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/images/neoverse-white.svg">
    <source media="(prefers-color-scheme: light)" srcset="docs/images/neoverse.svg">
    <img src="docs/images/neoverse.svg" alt="Neoverse" width="320">
  </picture>
</h1>

**Aurora Glass surfaces for Vue and React.**

One component library with shared Tokens, Tailwind styles, Motion, overlays and terminal primitives.

<p align="center">
  <a href="https://vuejs.org"><img alt="Vue 3" src="https://img.shields.io/badge/Vue-3-42b883?style=flat&amp;labelColor=132134&amp;logo=vue.js&amp;logoColor=f4f8fc"></a>
  <a href="https://react.dev"><img alt="React 19" src="https://img.shields.io/badge/React-19-61dafb?style=flat&amp;labelColor=132134&amp;logo=react&amp;logoColor=f4f8fc"></a>
  <a href="https://www.typescriptlang.org"><img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-strict-8c9bff?style=flat&amp;labelColor=132134&amp;logo=typescript&amp;logoColor=f4f8fc"></a>
  <a href="https://tailwindcss.com"><img alt="Tailwind CSS 4" src="https://img.shields.io/badge/Tailwind-4-38bdf8?style=flat&amp;labelColor=132134&amp;logo=tailwindcss&amp;logoColor=f4f8fc"></a>
  <a href="https://bun.sh"><img alt="Bun" src="https://img.shields.io/badge/Bun-runtime-f7df1e?style=flat&amp;labelColor=132134&amp;logo=bun&amp;logoColor=f4f8fc"></a>
</p>

[Vue guide](packages/vue/README.md) · [React guide](packages/react/README.md) · [Documentation](docs/architecture/README.md) · [Chinese](README.zh-CN.md)

</div>

## Design language

| Area | What it gives you |
| --- | --- |
| **Aurora Glass** | One shared glass material with Light, Standard and Immersive depth tiers. |
| **Theme** | `light`, `dark` and `system` through one `data-theme` contract. |
| **Tokens** | Color, type, spacing, radius and material values as CSS variables. |
| **Tailwind** | Semantic utilities such as `bg-surface-raised`, `text-primary` and `rounded-control`. |
| **Motion** | Shared durations, easings, presence and page transitions; reduced motion respected. |
| **Density** | Compact painted geometry with larger touch hit areas on coarse pointers. |

Aurora Glass is one material, not three separate styles:

| Surface | Tier | Use |
| --- | --- | --- |
| `glass-subtle` | Light | Buttons, compact controls, thin layers |
| `glass-elevated` | Standard | Cards, floating navigation, main containers |
| `glass-immersive` | Immersive | Stronger blur and material depth |

The CSS baseline works without JavaScript. `@neoverse-ui/glass-runtime` is an optional edge renderer; reduced transparency and reduced motion stay readable and usable.

## Install

Requires Vue **3.5+** or React **19**.

```sh
npm install @neoverse-ui/vue
npm install @neoverse-ui/react
```

Use pnpm, Yarn or Bun if you prefer. Shared styling and motion dependencies arrive with the component package.

## Quick start

Import the stylesheet once, then use the components.

```ts
import '@neoverse-ui/vue/index.css';
```

```vue
<script setup lang="ts">
import { UiButton, UiCard, UiField, UiInput } from '@neoverse-ui/vue';
</script>

<template>
  <UiCard surface="glass-elevated">
    <UiField control-id="name" label="Display name">
      <template #default="{ controlAttrs }">
        <UiInput v-bind="controlAttrs" placeholder="Your name" />
      </template>
    </UiField>
    <UiButton>Save</UiButton>
  </UiCard>
</template>
```

React follows the same composition with React props and events:

```tsx
import '@neoverse-ui/react/index.css';
import { UiButton, UiCard, UiField, UiInput } from '@neoverse-ui/react';

<UiCard surface="glass-elevated">
  <UiField controlId="name" label="Display name">
    {controlAttrs => <UiInput {...controlAttrs} placeholder="Your name" />}
  </UiField>
  <UiButton>Save</UiButton>
</UiCard>
```

## Components

The current source exposes the same **37 components** in both frameworks:

| Group | Components |
| --- | --- |
| Actions | `UiButton`, `UiIconButton`, `UiAction` |
| Surfaces | `UiSurface`, `UiCard`, `UiControlSurface` |
| Navigation | `UiDock`, `UiNavigationItem`, `UiBreadcrumb`, `UiSegmentedControl` |
| Forms | `UiField`, `UiInput`, `UiTextarea`, `UiSelect`, `UiCheckbox`, `UiRadioGroup`, `UiSwitch` |
| Overlays | `UiPopover`, `UiDropdownMenu`, `UiContextMenu` |
| Feedback | `UiBadge`, `UiStatusIndicator`, `UiNotice`, `UiTooltipSurface`, `UiSkeleton` |
| Data | `UiTable`, `UiDisclosure`, `UiStatCard`, `UiTimeline`, `UiStepFlow` |
| Terminal | `UiTerminalSurface`, `UiTerminalTranscript`, `UiTerminalLine`, `UiTerminalPrompt`, `UiTerminalEcho` |
| Scroll and presence | `UiScrollbar`, `UiPresence` |

Buttons use `primary`, `secondary` and `ghost`; sizes are `sm`, `md` and `lg`. Forms support disabled, read-only and validation states. Menus and segmented controls support keyboard navigation.

## Theme

Set one attribute on the root:

```html
<html lang="en" data-theme="system">...</html>
```

Use `light`, `dark` or `system`. Changing the theme preserves component dimensions and layout.

## Tailwind

Import the shared theme when your application already builds Tailwind CSS 4:

```css
@import 'tailwindcss';
@import '@neoverse-ui/tokens/css';
@import '@neoverse-ui/tailwind/theme.css';

@source '../node_modules/@neoverse-ui/vue/dist';
```

Then omit the component package's `index.css` import. Use semantic utilities or customize through `--neoverse-*` variables.

## Packages

| Package | Provides |
| --- | --- |
| [`@neoverse-ui/vue`](packages/vue/README.md) | Vue 3 components |
| [`@neoverse-ui/react`](packages/react/README.md) | React 19 adapters |
| [`@neoverse-ui/tokens`](packages/tokens/README.md) | CSS variables and name maps |
| [`@neoverse-ui/tailwind`](packages/tailwind/README.md) | Tailwind theme and component styles |
| [`@neoverse-ui/motion`](packages/motion/README.md) | Motion roles and page transitions |
| [`@neoverse-ui/overlay-runtime`](packages/overlay-runtime/README.md) | Top-layer positioning and dismissal |
| [`@neoverse-ui/glass-runtime`](packages/glass-runtime/README.md) | Optional Aurora Glass edge rendering |
| [`@neoverse-ui/giscus-theme`](packages/giscus-theme/README.md) | Giscus light and dark themes |

## Documentation

- [Vue guide](packages/vue/README.md) and [React guide](packages/react/README.md): APIs and composition examples.
- [Forms](docs/architecture/form-control-contract.md), [overlays](docs/architecture/overlay-contract.md) and [terminal](docs/architecture/terminal-composition.md): interaction contracts.
- [Material standards](docs/architecture/material-standards.md): Aurora Glass optics and repair guardrails.
- [Migration guide](docs/releases/migration-0.3.1.md): upgrading from the 0.3.0 baseline.
- [Component requests](docs/architecture/component-requests.md): reporting reusable gaps from consumer projects.

## Development

```sh
bun install
bun run dev
```

The Design Lab uses Vite hot updates for Vue, React and CSS. Ordinary component and style edits keep the page open and preserve unrelated state. Shared entry-point changes outside a hot-update boundary can still reload the page.

`bun run check` runs the quality gates. Architecture, testing and release rules live in [AGENTS.md](AGENTS.md) and [docs](docs/AGENTS.md).

## License

Neoverse-UI is released under the [Star And Thank Author License 2.0](LICENSE).
