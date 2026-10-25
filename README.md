<div align="center">

<h1>
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/images/neoverse-white.svg">
    <source media="(prefers-color-scheme: light)" srcset="docs/images/neoverse.svg">
    <img src="docs/images/neoverse.svg" alt="Neoverse" width="320">
  </picture>
</h1>

**Neoverse UI** is a component library for Vue 3 and React, with Glass surfaces, light and dark themes, and shared interactions. Use it for personal sites, documentation, tools, and pages with terminal or data displays.

[Vue guide](packages/vue/README.md) · [React guide](packages/react/README.md) · [Report an issue](https://github.com/SSJ-ZYJ/Neoverse-UI/issues)

</div>

Vue and React provide the same 35 components, sharing themes, styles, and motion. Use the components directly, or build your own layouts with CSS variables and Tailwind CSS.

## Installation

Requires Vue **3.5+** or React **19**. Install the package for your framework:

```sh
# Vue
npm install @neoverse-ui/vue

# React
npm install @neoverse-ui/react
```

You can also use pnpm, Yarn, or Bun. Shared styling and motion dependencies are installed with the component package.

This README describes the current source. For a published release, check the package changelog for the features available in your installed version.

## Using Vue

Import the stylesheet once in your application entry:

```ts
import '@neoverse-ui/vue/index.css';
```

Then use the components:

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { UiButton, UiCard, UiField, UiInput } from '@neoverse-ui/vue';

const name = ref('');
const saved = ref(false);
</script>

<template>
  <UiCard as="section">
    <h2>Profile</h2>
    <UiField control-id="name" label="Display name" description="The name shown on your page">
      <template #default="{ controlAttrs }">
        <UiInput v-bind="controlAttrs" v-model="name" placeholder="Enter your name" />
      </template>
    </UiField>
    <UiButton @click="saved = true">{{ saved ? 'Saved' : 'Save' }}</UiButton>
  </UiCard>
</template>
```

## Using React

Import the stylesheet once in your application entry:

```ts
import '@neoverse-ui/react/index.css';
```

Components follow React's prop and event conventions:

```tsx
import { useState } from 'react';
import { UiButton, UiCard, UiField, UiInput } from '@neoverse-ui/react';

export function Profile() {
  const [name, setName] = useState('');
  const [saved, setSaved] = useState(false);

  return (
    <UiCard as="section">
      <h2>Profile</h2>
      <UiField controlId="name" label="Display name" description="The name shown on your page">
        {controlAttrs => (
          <UiInput
            {...controlAttrs}
            value={name}
            onChange={event => setName(event.currentTarget.value)}
            placeholder="Enter your name"
          />
        )}
      </UiField>
      <UiButton onClick={() => setSaved(true)}>{saved ? 'Saved' : 'Save'}</UiButton>
    </UiCard>
  );
}
```

With frameworks such as Next.js, place components that use state or event handlers inside a client boundary. Import global styles through the entry point supported by your framework.

## Components

All of these components are available in both Vue and React:

| Use case | Components |
| --- | --- |
| Buttons and actions | `UiButton`, `UiIconButton`, `UiAction` |
| Surfaces and containers | `UiSurface`, `UiCard`, `UiControlSurface` |
| Navigation and selection | `UiDock`, `UiNavigationItem`, `UiBreadcrumb`, `UiSegmentedControl` |
| Forms | `UiField`, `UiInput`, `UiTextarea`, `UiSelect`, `UiCheckbox`, `UiRadioGroup`, `UiSwitch` |
| Popovers and menus | `UiPopover`, `UiDropdownMenu` |
| Status and feedback | `UiBadge`, `UiStatusIndicator`, `UiNotice`, `UiTooltipSurface`, `UiSkeleton` |
| Data and progress | `UiTable`, `UiDisclosure`, `UiStatCard`, `UiTimeline`, `UiStepFlow` |
| Terminal interfaces | `UiTerminalSurface`, `UiTerminalTranscript`, `UiTerminalLine`, `UiTerminalPrompt`, `UiTerminalEcho` |
| Scrolling and transitions | `UiScrollbar`, `UiPresence` |

Buttons offer `primary`, `secondary`, and `ghost` variants, with `sm`, `md`, and `lg` sizes. Icon buttons use `label` for their accessible name. Form controls support disabled, read-only, and validation states. Segmented controls and menus support keyboard navigation.

`UiDock` groups navigation items and trailing controls; your application manages routing and the current destination. Terminal components provide command entry, suggestions, and output display. Output follows the tail as it grows and preserves your position when you scroll up to read history. Your application supplies command execution and completion candidates.

More examples: [Forms](docs/form-control-contract.md) · [Overlays](docs/overlay-contract.md) · [Terminals](docs/terminal-composition.md) · [Vue / React equivalents](docs/framework-parity.md)

## Themes and materials

Set `data-theme` on the root element to `light`, `dark`, or `system`:

```html
<html lang="en" data-theme="system">...</html>
```

The theme also follows the system preference when no value is set.

Components with a `surface` prop can use plain or Glass surfaces:

| `surface` | Use |
| --- | --- |
| `none` | Transparent containers |
| `solid`, `subtle`, `elevated`, `inset` | Content surfaces and layout layers |
| `glass-subtle` | Lightweight controls and thin Glass layers |
| `glass-elevated` | Cards, floating navigation, and main content containers |
| `glass-immersive` | Stronger background blur and material depth |

Some controls accept only the Glass presets and `none`; see their component types for available options. Glass needs visible background content to show its effect. Surfaces remain readable when transparency effects are unavailable or the user prefers reduced transparency.

Components respect the system's reduced-motion preference. Switching themes preserves component dimensions and layout.

## Styling and customization

The `index.css` imports above include the styles needed by the components, so you can use them without a Tailwind build. The bundle includes utilities used by the components; any additional Tailwind utilities in your application need your own build.

If your project already uses **Tailwind CSS 4**, use these imports to share the theme while generating your application utilities:

```css
@import 'tailwindcss';
@import '@neoverse-ui/tokens/css';
@import '@neoverse-ui/tailwind/theme.css';

/* Adjust the path relative to this stylesheet. Use react instead of vue for React. */
@source '../node_modules/@neoverse-ui/vue/dist';
```

With this setup, you can omit the component package's `index.css` import. Use semantic utilities such as `text-primary`, `bg-surface-raised`, and `rounded-control`, or customize the theme through `--neoverse-*` CSS variables.

You can also install individual packages for the features you need:

| Package | Provides |
| --- | --- |
| [`@neoverse-ui/tokens`](packages/tokens/README.md) | CSS variables for color, type, spacing, and more, with TypeScript name maps |
| [`@neoverse-ui/tailwind`](packages/tailwind/README.md) | Tailwind theme, component styles, and reading typography |
| [`@neoverse-ui/motion`](packages/motion/README.md) | Enter and exit animations, list transitions, and page transitions |
| [`@neoverse-ui/glass-runtime`](packages/glass-runtime/README.md) | Optional Glass edge rendering enhancement |
| [`@neoverse-ui/giscus-theme`](packages/giscus-theme/README.md) | Light and dark themes for Giscus comments |

## Documentation and feedback

- [Vue guide](packages/vue/README.md) and [React guide](packages/react/README.md): component props and composition examples.
- [Migration guide](docs/migration-0.3.0.md): changes to consider when upgrading an existing project.
- [Issues](https://github.com/SSJ-ZYJ/Neoverse-UI/issues): report a bug or request a component. Include your framework, component version, and reproduction steps.

Neoverse UI is released under the [MIT license](LICENSE).
