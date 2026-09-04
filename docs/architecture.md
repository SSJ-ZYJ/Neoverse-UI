# Architecture

## Workspace principles

The repository is a Bun workspace. Internal dependencies use `workspace:*`; root scripts call package scripts in dependency order rather than relying on a task orchestrator. Published packages are ESM-only. TypeScript packages emit declarations and source maps, while CSS packages publish generated files from `dist`.

## Package boundaries and maturity

| Package / app | Maturity | Boundary |
| --- | --- | --- |
| `@neoverse-ui/tokens` | Stable | Framework-agnostic CSS Variables and token-name maps |
| `@neoverse-ui/tailwind` | Stable | Tailwind v4 semantic theme and shared component selectors |
| `@neoverse-ui/motion` | Stable | CSS motion aliases and reduced-motion policy |
| `@neoverse-ui/glass-runtime` | Experimental | Optional static WebGL Glass Edge Pass |
| `@neoverse-ui/vue` | Consumer Validation | Vue 3 SFC integration |
| `@neoverse-ui/react` | Planned | Empty React integration boundary |
| `apps/playground` | Consumer Validation | Design Lab, frame route, and visual baselines |

The dependency direction is:

```text
tokens -> tailwind
tokens -> motion
tailwind + motion -> vue
tokens + tailwind + motion + vue -> playground
glass-runtime -> playground (optional enhancement)
```

Vue and React are intended to share Token names, Tailwind foundation, Material values, Motion aliases, accessibility expectations, and API semantics. They are not expected to share Vue or React component source code.

## Tokens

`@neoverse-ui/tokens` owns the raw CSS Variable contract and TypeScript names. The source is layered so theme mapping stays separate from reusable roles:

```text
packages/tokens/src/
  primitives.css  semantic.css  geometry.css  typography.css
  material.css    layout.css    motion.css
  components/
    shared-control.css  button.css  segmented-control.css
    badge.css            skeleton.css scrollbar.css
  themes/
    light.css            dark.css
```

`cssVariables.components` follows that ownership. The legacy flat control, scrollbar, and skeleton maps remain aliases for compatibility. The build emits the public `@neoverse-ui/tokens/css` entry after primitives, semantic roles, foundation layers, light mapping, component defaults, and the canonical dark mapping.

## Tailwind Foundation

`@neoverse-ui/tailwind` imports the token and Motion CSS, maps semantic values through Tailwind v4 `@theme inline`, and exposes the component selector facade. Component CSS is kept in `src/components/*.css`; `copy-theme.ts` flattens it for the generated package entries. The package does not own application source paths.

The foundation provides semantic utilities such as `bg-surface-raised`, `text-primary`, `border-subtle`, `rounded-control`, `shadow-card`, and `ring-focus`. Business source is checked for accidental primitive color, radius, and shadow utilities.

## Vue components

`@neoverse-ui/vue` contains the current Vue 3 SFC components:

```text
UiButton
UiIconButton
UiSegmentedControl
UiCard
UiGlassSurface
UiBadge
UiSkeleton
```

They compose shared Tailwind classes, expose semantic props and slots, and preserve native button/keyboard behavior. `UiGlassSurface` accepts a Glass `variant`; the mounted runtime automatically discovers each eligible top-level Glass surface while CSS remains the baseline and fallback. React remains Planned and has no implementation to document beyond its reserved package boundary.

## Material / Glass policy

Material values are token-owned. Ordinary Surface Solid, Subtle, and Elevated use Tailwind composition. Glass uses `material-glass-subtle`, `material-glass-elevated`, and `material-glass-immersive`, with CSS as the complete baseline: opaque fallback, tint, backdrop sampling, saturation, directional refraction field, shadow, and reduced-transparency behavior.

`@neoverse-ui/glass-runtime` is an optional shared renderer, not a prerequisite for any base component. Its policy is:

| Variant | Default | WebGL policy |
| --- | --- | --- |
| Subtle | CSS baseline | automatically discovered when the renderer is mounted |
| Elevated | CSS baseline | automatically discovered when the renderer is mounted |
| Immersive | CSS baseline | automatically discovered when the renderer is mounted |

`createGlassRenderer()` creates at most one non-interactive Canvas per Document, prefers WebGL2, falls back to WebGL1, and keeps CSS active if neither context works. It renders top-level eligible surfaces that are visible, non-zero, on-screen, and not hidden by computed style. Device Pixel Ratio is capped by `maxDevicePixelRatio` (default 2).

The renderer listens for DOM, resize, scroll, and theme changes. `webglcontextlost` immediately removes the renderer marker and hides the Canvas so CSS takes over; `webglcontextrestored` rebuilds the shared pass. `prefers-reduced-transparency` keeps the renderer on CSS. The root `data-neoverse-glass-renderer` attribute and the Canvas `data-neoverse-glass-renderer-canvas` attribute expose the active state for development diagnostics.

## Motion

`@neoverse-ui/motion` is framework-agnostic. It owns the CSS entry and TypeScript names for duration, easing, transition-property, and spatial values. It does not own DOM animation or framework runtime code. Reduced motion removes spatial distance and collapses durations so component transitions remain predictable.

## Density and touch strategy

Controls retain compact painted dimensions on every viewport. Shared Button and SegmentedControl CSS uses `@media (pointer: coarse)` to add an invisible 8px hit-area expansion with pseudo-elements. Disabled pseudo hit areas do not intercept input. No `mobile-button`, `docs-button`, or other application-specific component is introduced. The same core components serve desktop and touch; `focus-visible`, keyboard navigation, and disabled behavior remain explicit component contracts.

## Design Lab and visual regression

`apps/playground` uses Bun.serve for the HTML shell, `/frame` theme-isolated documents, built Tailwind CSS, and the Vite browser bundle. The frame renders one stable module at a time from the actual Vue components. `tests/visual/design-lab.spec.ts` captures only `[data-design-lab-region="module"]`, with fixed light/dark query parameters, reduced motion, awaited fonts/images, disabled animation/caret, and separate Playwright projects for 1280px desktop and 390px touch.

The generated baselines are stored in `tests/visual/snapshots/`. This is intentionally a small Playwright layer rather than a second component-testing architecture. Update baselines only after confirming that the token, Material, or component change is intentional.

## Theme model

Consumers set `data-theme="light"`, `data-theme="dark"`, or `data-theme="system"` on the root. Light values are mapped from `themes/light.css`; one canonical dark declaration body is emitted for explicit dark and system-dark selectors. Root `.light` and `.dark` classes remain compatible when the data attribute is absent.

## Verification commands

```sh
bun run check
bun run test:visual
```

`bun run check` auto-fixes Biome lint/format/imports, runs the style and Tailwind-usage lints, typechecks every workspace, and runs all unit and contract tests. `bun run test:visual:update` is the explicit baseline-update command. Generated package CSS and TypeScript declarations are rebuilt before the visual server starts.
