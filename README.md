# Neoverse UI

A lightweight Bun monorepo for the Neoverse design tokens, Tailwind foundation, Material system, Motion system, Vue/React adapters, and Design Lab.

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
| `@neoverse-ui/motion` | Stable | Framework-agnostic motion scale, semantic roles, Presence engine, and page-transition choreography |
| `@neoverse-ui/giscus-theme` | Consumer Validation | Standalone light/dark themes for the cross-origin Giscus widget |
| `@neoverse-ui/glass-runtime` | Experimental | Shared WebGL Glass edge renderer with CSS fallback |
| `@neoverse-ui/vue` | Consumer Validation | Vue 3 SFC components |
| `@neoverse-ui/react` | Consumer Validation | React adapters for shared actions and surfaces |
| `apps/playground` | Consumer Validation | Vue-driven Design Lab and visual reference surface |

The current Vue component set is `UiButton`, `UiIconButton`, `UiAction`, `UiBreadcrumb`, `UiNavigationItem`, `UiSegmentedControl`, `UiControlSurface`, `UiDock`, `UiSurface`, `UiCard`, `UiInput`, `UiTextarea`, `UiSelect`, `UiTable`, `UiDisclosure`, `UiBadge`, `UiStatusIndicator`, `UiSkeleton`, `UiScrollbar`, `UiNotice`, `UiTooltipSurface`, and `UiPresence`. `UiDock` is the reusable floating-navigation shell; routing data, active destination state, and trailing controls remain consumer-owned. `UiSurface` is the canonical material primitive. The consumer-validated React adapter currently exposes `UiButton`, `UiIconButton`, `UiAction`, `UiBreadcrumb`, `UiDock`, `UiSurface`, `UiCard`, `UiInput`, `UiTextarea`, `UiSelect`, `UiTable`, `UiDisclosure`, `UiNotice`, and `UiPresence`. Vue and React share Tokens, Tailwind, Material, Motion, accessibility expectations, and API semantics; they do not share framework component code.

## Architecture at a glance

```text
Tokens (CSS Variables + names)
  -> Tailwind semantic foundation + Motion CSS
  -> Vue components / React adapters
  -> Design Lab and consumer validation

Glass Runtime -> one shared WebGL Edge Pass per Document
             -> CSS remains the material baseline and fallback
```

See [docs/architecture.md](docs/architecture.md) for package boundaries and runtime rules.

## Installation

Vue consumers normally start with the component package:

```sh
bun add @neoverse-ui/vue
```

The package dependency graph installs the shared Tailwind, Motion, and Tokens layers. Lower-level packages can also be installed directly when a consumer only needs a specific layer.

Packages are versioned with Changesets. The 0.1.x → 0.2.0 breaking-change migration is documented in [docs/migration-0.2.0.md](docs/migration-0.2.0.md); release preparation and npm Trusted Publishing are documented in [docs/releasing.md](docs/releasing.md).

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

`bun run dev` starts the playground server at `http://localhost:3000`, a Vite client watcher, and source rebuilds for the generated token, motion, and Tailwind stylesheets. `bun run check` is the full pre-commit gate: it auto-fixes Biome lint/format/imports, verifies text encoding integrity, runs the style and Tailwind-usage lints, typechecks every workspace, and runs all unit and contract tests. Visual regression is opt-in via `test:visual` because it rebuilds the workspace and drives a browser; use `test:visual:update` only when a reviewed visual change is intentional.

## Tokens and Tailwind Foundation

`@neoverse-ui/tokens` owns the framework-agnostic CSS Variables. Its source layers cover primitives, semantic roles, geometry, typography, layout, Material, Motion, component contracts, and light/dark theme mappings. The organized TypeScript API is exposed through `cssVariables.components`; component-owned tokens have a single canonical namespace and are not duplicated through alternate flat maps.

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

The component selector facade is part of the shared Tailwind layer. It includes the Button, IconButton, Action, NavigationItem, SegmentedControl, ControlSurface, Table, Disclosure, Badge, StatusIndicator, Skeleton, Scrollbar, and Glass material contracts; it does not create project-specific mobile, dock, or docs components.

### Package entries

`@neoverse-ui/tailwind` exposes:

| Entry | Contents |
| --- | --- |
| `.` / `./index.css` | Zero-config compiled consumer bundle (Tailwind utilities + theme, scanned over the Vue/React component sources) |
| `./theme.css` | Semantic theme + Material utilities (needs a Tailwind build that also scans the component sources) |
| `./components.css` | Component selector CSS (Button, Action, NavigationItem, SegmentedControl, ControlSurface, Table, Disclosure, Badge, StatusIndicator, Skeleton, Scrollbar, Glass contracts) |
| `./prose.css` | Standalone `.neoverse-prose` reading-content semantics |

`dist/playground.css` exists only for this repository's Design Lab and is not part of the Consumer API.

Consumers running their own Tailwind 4 build should import the theme and scan the component sources:

```css
@import 'tailwindcss';
@import '@neoverse-ui/tokens/css';
@import '@neoverse-ui/tailwind/theme.css';

@source '../../../node_modules/@neoverse-ui/vue/dist';
```

The explicit `@source` into `node_modules` replaces the vendor-junction workaround. Consumers without their own Tailwind build can import the framework adapter stylesheet, such as `@neoverse-ui/vue/index.css` or `@neoverse-ui/react/index.css`; both forward to the compiled zero-config `@neoverse-ui/tailwind/index.css` consumer bundle.

Until the packages publish to a registry, Bun `file:` dependencies plus the vendor junction and the `overrides` block in the Neoverse `package.json` remain dev-time limitations that disappear on publish.

## Material and Glass

Normal surfaces use semantic Tailwind composition. Glass has exactly three material presets: `material-glass-subtle`, `material-glass-elevated`, and `material-glass-immersive`, each with an opaque CSS fallback, tokenized tint, backdrop filter, and directional edge field.

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

`@neoverse-ui/motion` exposes the shared duration/easing scale and semantic roles `feedback`, `state`, `spatial`, `enter`, and `exit`. The old standalone entrance/emphasis recipe classes were removed. Shared Button, Surface, Navigation, SegmentedControl, Scrollbar, and ControlSurface CSS consumes the role variables directly. The Presence engine supplies `fade`, `rise`, `sink`, `pop`, `veil`, `slide-start`, and `slide-end`; Vue exports `UiPresence`, `presence`, and `staggerStyle`, while React exports `UiPresence` and `useUiPresence`. Reduced-motion collapses durations and removes spatial distance while preserving state correctness.

`startViewTransition(update, options?)` coordinates page changes, including interruptible Particle Dissolve, View Transition crossfade, and direct-update fallbacks. Mark the outgoing region with `data-neoverse-dissolve`; the optional WebGL2 particle pipeline uses capture when supported or synthetic dust otherwise. See the [Motion API and pipeline guide](packages/motion/README.md) for presets, capture support, and lifecycle guarantees.

Set `data-theme="light"`, `data-theme="dark"`, or `data-theme="system"` on the root element. The Design Lab keeps separate light and dark visual baselines. Theme selection has one canonical root contract: `data-theme`.

## Design Lab and visual regression

The playground serves the real Vue components and built Tailwind CSS. At 100% browser zoom, the main shell scales its presentation root from 17px at 1280 to 18px at 1600, 19px at 1920, and 20px at 2560; the isolated `/frame` route stays at the canonical 16px component baseline. Persistent sidebar navigation begins at 1280px and becomes a drawer below that breakpoint.

Playground specimens share `LabSpecimenSection` for subsection hierarchy and use content-width-aware `playground-token-grid` / `playground-specimen-grid` layouts. Shared specimen rows and panels consume `UiSurface` material presets instead of duplicating raw Glass implementation classes. These helpers belong to the Design Lab and are not public package API.

Visual tests use the stable `/frame` route and `[data-design-lab-region="module"]` region, covering representative Foundation, Material, control, feedback, card, and consumer-parity scenarios in both themes. Playwright uses a 1920×1080 desktop viewport at 100% CSS-pixel scaling and a 390px touch viewport; shell regressions additionally exercise 1280 / 1600 / 1920 responsive geometry and the complete control state matrix. Animations are disabled and assets are awaited before each screenshot.

Baselines live under `tests/visual/snapshots/`. A screenshot change should correspond to an intentional token, Material, component, or specimen-composition change and be reviewed with the generated diff.

## Changesets

Create a release note with:

```sh
bun run changeset
```

The public packages use independent versions. `apps/playground` is the only internal workspace excluded from package releases.
