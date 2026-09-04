# Neoverse UI

A lightweight Bun monorepo for the Neoverse design tokens, Tailwind foundation, Material system, motion aliases, Vue components, and Design Lab.

## Requirements

- Bun 1.4.0
- TypeScript
- Tailwind CSS 4

Bun is the package manager, workspace manager, and script runner for this repository.

## Current workspace

| Package / app | Maturity | Current responsibility |
| --- | --- | --- |
| `@neoverse-ui/tokens` | Stable | CSS Variables and TypeScript token-name maps |
| `@neoverse-ui/tailwind` | Stable | Tailwind v4 semantic theme and component CSS |
| `@neoverse-ui/motion` | Stable | Framework-agnostic motion aliases and reduced-motion CSS |
| `@neoverse-ui/glass-runtime` | Experimental | Shared WebGL Glass edge renderer with CSS fallback |
| `@neoverse-ui/vue` | Consumer Validation | Vue 3 SFC components |
| `@neoverse-ui/react` | Planned | Reserved React integration boundary; no components yet |
| `apps/playground` | Consumer Validation | Vue-driven Design Lab and visual reference surface |

The current Vue component set is `UiButton`, `UiIconButton`, `UiSegmentedControl`, `UiCard`, `UiGlassSurface`, `UiBadge`, and `UiSkeleton`. React has no runtime implementation yet. Vue and the future React adapter share Tokens, Tailwind, Material, Motion, and API semantics; they do not share framework component code.

## Architecture at a glance

```text
Tokens (CSS Variables + names)
  -> Tailwind semantic foundation + Motion CSS
  -> Vue components / future React adapter
  -> Design Lab and consumer validation

Glass Runtime -> one shared WebGL Edge Pass per Document
             -> CSS remains the material baseline and fallback
```

See [docs/architecture.md](docs/architecture.md) for package boundaries and runtime rules.

## Commands

```sh
bun install
bun run dev
bun run build
bun run lint
bun run typecheck
bun run test
bun run check
bun run format
bun run test:visual
bun run test:visual:update
```

`bun run dev` starts the playground server at `http://localhost:3000`, a Vite client watcher, and source rebuilds for the generated token, motion, and Tailwind stylesheets. `bun run check` is the full pre-commit gate: it auto-fixes Biome lint/format/imports, runs the style and Tailwind-usage lints, typechecks every workspace, and runs all unit and contract tests. Visual regression is opt-in via `test:visual` because it rebuilds the workspace and drives a browser; use `test:visual:update` only when a reviewed visual change is intentional.

## Tokens and Tailwind Foundation

`@neoverse-ui/tokens` owns the framework-agnostic CSS Variables. Its source layers cover primitives, semantic roles, geometry, typography, layout, Material, Motion, component contracts, and light/dark theme mappings. The organized TypeScript API is exposed through `cssVariables.components`; the older `cssVariables.control`, `cssVariables.scrollbar`, and `cssVariables.skeleton` names remain compatibility aliases.

`@neoverse-ui/tailwind` maps those values into semantic Tailwind utilities such as:

```text
bg-surface-raised  text-primary  border-subtle
rounded-control    shadow-card   ring-focus
```

Consumers that compile their own Tailwind CSS should import the shared theme and their own source paths:

```css
@import 'tailwindcss';
@import '@neoverse-ui/tailwind/theme.css';

@source './src';
```

The component selector facade is part of the shared Tailwind layer. It includes the Button, IconButton, SegmentedControl, Badge, Skeleton, Scrollbar, and Glass material contracts; it does not create project-specific mobile or docs components.

## Material and Glass

Normal surfaces use semantic Tailwind composition. Glass uses `material-glass-subtle`, `material-glass-elevated`, and `material-glass-immersive` with an opaque CSS fallback, tokenized tint, backdrop filter, and directional edge field.

The three Glass variants keep the CSS material baseline and are discovered automatically by a mounted renderer. There is no per-surface `edgePass` flag: the renderer paints the shared directional WebGL edge for every eligible top-level Glass surface in the document.

Mount the runtime once per Document when the enhancement is wanted:

```ts
import { createGlassRenderer } from '@neoverse-ui/glass-runtime';

const renderer = createGlassRenderer();
renderer.mount();
```

The runtime prefers WebGL2, falls back to WebGL1, and then leaves the CSS path authoritative when WebGL is unavailable. It also handles context loss/restore, `prefers-reduced-transparency`, a DPR cap of 2, and invisible/off-screen surfaces.

For diagnostics, inspect `data-neoverse-glass-renderer` on the Document root and `data-neoverse-glass-renderer-canvas` on the shared canvas.

## Controls and touch density

Button, IconButton, SegmentedControl, and toolbar controls keep their compact painted geometry. Under `pointer: coarse`, the shared component CSS adds a transparent 8px hit-area expansion using pseudo-elements; it does not introduce mobile-only component APIs. Desktop and touch use the same Vue components. Native keyboard behavior, `focus-visible`, and disabled states remain part of the core component contract.

The Design Lab `density` module shows fine-pointer and coarse-pointer profiles side by side. The Playwright mobile project also checks that the visual height stays compact while the transparent hit area is present.

## Motion and themes

`@neoverse-ui/motion` exposes `duration-fast`, `duration-standard`, `duration-expressive`, `ease-standard`, and `ease-emphasized`, plus CSS Variable aliases for micro, state, and spatial transitions. Its reduced-motion rules remove spatial travel and collapse durations to a minimal value.

Set `data-theme="light"`, `data-theme="dark"`, or `data-theme="system"` on the root element. The Design Lab keeps separate light and dark visual baselines. The root `.light` and `.dark` classes remain supported when `data-theme` is absent.

## Design Lab and visual regression

The playground serves the real Vue components and built Tailwind CSS. Visual tests use the stable `/frame` route and `[data-design-lab-region="module"]` region, covering Typography, Surface, Glass, Button, IconButton, Card, SegmentedControl, and Control Density in both themes at 1280px desktop and 390px touch viewport sizes. Animations are disabled and assets are awaited before each screenshot.

Baselines live under `tests/visual/snapshots/`. A screenshot change should correspond to an intentional token, Material, or component change and be reviewed with the generated diff.

## Changesets

Create a release note with:

```sh
bun run changeset
```

The public packages use independent versions. The playground and the planned React boundary are excluded from releases.
