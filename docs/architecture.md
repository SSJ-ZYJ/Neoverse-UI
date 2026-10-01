# Architecture

## Workspace principles

The repository is a Bun workspace. Public-package dependencies use explicit SemVer ranges that match the registry contract, while Bun links matching local workspaces during development; root scripts call package scripts in dependency order rather than relying on a task orchestrator. Published packages are ESM-only. TypeScript packages emit declarations and source maps, while CSS packages publish generated files from `dist`.

## Package boundaries and maturity

| Package / app | Maturity | Boundary |
| --- | --- | --- |
| `@neoverse-ui/tokens` | Stable | Framework-agnostic CSS Variables and token-name maps |
| `@neoverse-ui/tailwind` | Stable | Tailwind v4 semantic theme and shared component selectors |
| `@neoverse-ui/motion` | Stable | CSS motion aliases and reduced-motion policy |
| `@neoverse-ui/glass-runtime` | Experimental | Optional static WebGL Glass Edge Pass |
| `@neoverse-ui/vue` | Consumer Validation | Vue 3 SFC integration |
| `@neoverse-ui/react` | Consumer Validation | React 19 adapters for consumer-validated shared components |
| `apps/playground` | Consumer Validation | Design Lab, frame route, and visual baselines |

The dependency direction is:

```text
tokens -> tailwind
tokens -> motion
tailwind + motion -> vue
tailwind -> react
tokens + tailwind + motion + vue + react -> playground
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
    shared-control.css  button.css       action.css
    breadcrumb.css      navigation-item.css control-surface.css
    status-indicator.css segmented-control.css badge.css
    skeleton.css        scrollbar.css
  themes/
    light.css            dark.css
```

`cssVariables.components` follows that ownership. The legacy flat control, scrollbar, and skeleton maps remain aliases for compatibility. The build emits the public `@neoverse-ui/tokens/css` entry after primitives, semantic roles, foundation layers, light mapping, component defaults, and the canonical dark mapping.

## Tailwind Foundation

`@neoverse-ui/tailwind` imports the token and Motion CSS, maps semantic values through Tailwind v4 `@theme inline`, and exposes the component selector facade. Component CSS is kept in `src/components/*.css`; `copy-theme.ts` flattens it for the generated package entries. The package does not own application source paths.

The foundation provides semantic utilities such as `bg-surface-raised`, `text-primary`, `border-subtle`, `rounded-control`, `shadow-card`, and `ring-focus`. Business source is checked for accidental primitive color, radius, and shadow utilities.

### Package entries

| Entry | Contents |
| --- | --- |
| `.` / `./index.css` | Compiled zero-config consumer bundle: Tailwind utilities over the Vue/React `src` trees + the theme |
| `./theme.css` | Semantic theme + Material utilities (source of the compiled bundle) |
| `./components.css` | Component selector facade flattened from `src/components/*.css` |
| `./prose.css` | Standalone `.neoverse-prose` content semantics for headings, lists, definitions, code, quotes, tables, disclosures, and inline reading states; reading width remains a separate layout role |

The playground-only compiled bundle is emitted as `dist/playground.css` and is not exported; the package does not own application source paths — the compiled entry exists only so consumers without their own Tailwind build still receive a complete utility set.

## Vue components

`@neoverse-ui/vue` contains the current Vue 3 SFC components:

```text
UiButton
UiIconButton
UiAction
UiBreadcrumb
UiNavigationItem
UiSegmentedControl
UiControlSurface
UiDock
UiSurface
UiCard
UiGlassSurface  # compatibility wrapper
UiBadge
UiStatusIndicator
UiNotice
UiTooltipSurface
UiSkeleton
UiScrollbar
```

They compose shared Tailwind classes, expose semantic props and slots, and preserve native interaction semantics. `UiAction` defaults to a real anchor and accepts an injected framework link renderer; `UiNavigationItem` adds current-page, compact-label, and selection-indicator contracts without owning route state. Components that own a visual plane consume the shared `surface` contract instead of hard-coding Glass as an intrinsic component trait. `UiButton`, `UiAction`, `UiIconButton`, and `UiSegmentedControl` keep `glass-subtle` as their compatibility default, while `UiNavigationItem` defaults to `none` so grouped navigation inherits the parent chrome rather than creating nested Glass. `UiSegmentedControl` keeps its active slider and keyboard interaction independent from the outer Surface, so `surface="none"` can be used inside a composition that already owns the chrome. `UiSurface` is the generic polymorphic material primitive. `UiCard` owns standard card geometry (`rounded-card` + base card padding) while consuming the same `surface` contract; standard cards should therefore use `UiCard surface="..."` rather than rebuilding card geometry around `UiSurface`. `UiControlSurface` owns one grouped-control chrome boundary and optional trailing separation. It also owns grouped-surface behavior policy: `hoverMode="static"` keeps parent material stable while descendants hover, and `edgeMode="local"` requests a locally rendered Glass edge without exposing renderer attributes to consumers. `UiDock` specializes that contract for reusable floating navigation: it owns Dock layout, chrome, scale, compact composition, and trailing separation while route data, destination state, icons, and trailing controls stay consumer-owned. `UiStatusIndicator` leaves live-region announcements to the caller. `UiGlassSurface` remains a compatibility wrapper that maps its historical Glass `variant` onto the shared Surface contract. Product route lists, fixed dock positioning, cross-item state, and page content remain composition responsibilities.

## React components

`@neoverse-ui/react` contains the consumer-validated React 19 adapters:

```text
UiButton
UiIconButton
UiAction
UiBreadcrumb
UiDock
UiSurface
UiCard
UiNotice
```

React adapters share the same Tailwind component selectors, Surface presets, native interaction semantics, and accessibility expectations as Vue. They intentionally cover concrete React consumer needs rather than claiming full framework parity. `UiAction` supports `asChild` routing composition, `UiBreadcrumb` exposes a custom item renderer seam, `UiDock` exposes the same shared Dock shell while leaving navigation content and active state to the consumer, and native controls preserve refs and platform attributes. Additional adapters are added only when a real consumer requires them.

Display-only semantic primitives do not gain a `surface` prop merely for API symmetry. `UiBadge` owns status/semantic color, `UiStatusIndicator` owns presence language, `UiSkeleton` owns loading geometry/effect, and `UiScrollbar` owns document-scroll runtime. Consumers should wrap those primitives in `UiSurface`, `UiCard`, or `UiControlSurface` when a material plane is needed instead of making every primitive a Glass surface.

`UiScrollbar` owns the document-level immersive scrollbar runtime: geometry measurement, auto-hide, thumb dragging, track jumps, route/layout refreshes, and native-scrollbar visibility through the `hideNative` prop. Consumers may pass a `refreshKey` when a route transition changes the scrollable document.

## Material / Glass policy

Material values are token-owned. Ordinary Surface Solid, Subtle, and Elevated use Tailwind composition. Glass uses `material-glass-subtle`, `material-glass-elevated`, `material-glass-card`, and `material-glass-immersive`, with CSS as the complete baseline: opaque fallback, tint, backdrop sampling, saturation, directional refraction field, shadow, and reduced-transparency behavior.

Independent Glass surfaces must render their own tint, border, backdrop filter, and shadow **before hover**, including when nested inside a Glass layout. Vue and React `UiSurface` therefore default to `glassNesting="local"`; `UiCard` and `UiGlassSurface` also retain their own material without a nesting override. Only a layout grouping that deliberately borrows its parent's Glass plane should set `glassNesting="inherit"` (Vue: `glass-nesting="inherit"`). A component that intentionally has no material should use `surface="none"` instead. Never flatten all unmarked nested Glass elements: that silently removes real card surfaces in the Playground and consumer compositions. Normal-state material and reduced-transparency fallbacks must remain independently testable, without relying on hover or the optional WebGL renderer.

`@neoverse-ui/glass-runtime` is an optional shared renderer, not a prerequisite for any base component. Its policy is:

| Variant | Default | WebGL policy |
| --- | --- | --- |
| Subtle | CSS baseline | automatically discovered when the renderer is mounted |
| Elevated | CSS baseline | automatically discovered when the renderer is mounted |
| Card | CSS baseline | automatically discovered when the renderer is mounted |
| Immersive | CSS baseline | automatically discovered when the renderer is mounted |

`createGlassRenderer()` creates at most one non-interactive Canvas per Document, prefers WebGL2, falls back to WebGL1, and keeps CSS active if neither context works. It renders independent eligible Glass surfaces, including nested ones, when they are visible, non-zero, on-screen, and not hidden by computed style. Device Pixel Ratio is capped by `maxDevicePixelRatio` (default 2).

WebGL draws one directional edge per independently materialized Glass surface, including surfaces nested inside Glass containers. Only explicitly inherited nested groupings suppress their own edge. Components with a dedicated edge recipe, such as `UiSegmentedControl`, and masked scrolling navigation groups can keep the CSS edge by opting out of WebGL using `data-neoverse-glass-edge-pass="css"`. While WebGL owns a surface's edge, its CSS `::before` stays disabled to prevent a duplicate ring; when WebGL is unavailable, CSS supplies the fallback edge. Reduced transparency disables both refraction passes.

The renderer listens for DOM, resize, scroll, and theme changes. `webglcontextlost` immediately removes the renderer marker and hides the Canvas so CSS takes over; `webglcontextrestored` rebuilds the shared pass. `prefers-reduced-transparency` keeps the renderer on CSS. The root `data-neoverse-glass-renderer` attribute and the Canvas `data-neoverse-glass-renderer-canvas` attribute expose the active state for development diagnostics.

Compositions that need the complete CSS Glass edge while the shared renderer
paints other surfaces may set `data-neoverse-glass-edge-pass="css"`. The
renderer skips that surface, preserving the library's backdrop-filtered
directional edge field without double-painting it with the Canvas pass.

## Motion

`@neoverse-ui/motion` is framework-agnostic. It owns the base duration/easing scale plus `feedback`, `state`, and `spatial` semantic roles. Shared component CSS consumes those roles directly; the package does not ship generic entrance-animation recipes or framework runtime animation code. Reduced motion removes spatial distance and collapses durations so component state remains predictable.

## Density and touch strategy

Controls retain compact painted dimensions on every viewport. Shared Button and SegmentedControl CSS uses `@media (pointer: coarse)` to add an invisible 8px hit-area expansion with pseudo-elements. Disabled pseudo hit areas do not intercept input. No `mobile-button`, `docs-button`, or other application-specific component is introduced. The same core components serve desktop and touch; `focus-visible`, keyboard navigation, and disabled behavior remain explicit component contracts.

## Design Lab and visual regression

`apps/playground` uses Bun.serve for the HTML shell, `/frame` theme-isolated documents, built Tailwind CSS, and the Vite browser bundle. The main shell uses the optional presentation root-size role so 100% browser zoom remains readable on wide desktops: 1280 / 1600 / 1920 / 2560 CSS-pixel viewports resolve to 17 / 18 / 19 / 20px. The isolated `/frame` route stays at the canonical 16px component baseline. Persistent navigation begins at the shared `xl` / 1280px breakpoint; narrower layouts keep the same module content behind drawer navigation.

Playground-only composition helpers keep specimen structure consistent without becoming Consumer API. `LabSpecimenSection` owns subsection heading, description, spacing, and optional action placement. `playground-token-grid` and `playground-specimen-grid` use the available content width rather than fixed viewport column counts, while `playground-specimen-panel` and `playground-specimen-row` provide shared specimen geometry. Module specimens select material through `UiSurface surface="..."` instead of directly attaching Glass implementation classes; the Playground shell itself may still use Material classes because its sidebar and sticky header are application chrome boundaries. `StateRow` exposes stable `data-specimen-state-row` markers only for Design Lab validation; these markers are not public component API.

`tests/visual/playground-shell.spec.ts` validates shell scaling, navigation breakpoints, deep links, content overflow, interactive state coverage, and representative geometry across 1280 / 1600 / 1920 desktop widths. `tests/visual/design-lab.spec.ts` captures only `[data-design-lab-region="module"]`, with fixed light/dark query parameters, reduced motion, awaited fonts/images, disabled animation/caret, and separate Playwright projects for a 1920×1080 desktop viewport at 100% CSS-pixel scaling and 390px touch. The desktop module region remains constrained by the semantic content-width role rather than stretching to the full viewport.

The generated baselines are stored in `tests/visual/snapshots/`. This is intentionally a small Playwright layer rather than a second component-testing architecture. Update baselines only after confirming that the token, Material, component, or specimen-composition change is intentional.

## Theme model

Consumers set `data-theme="light"`, `data-theme="dark"`, or `data-theme="system"` on the root. Light values are mapped from `themes/light.css`; one canonical dark declaration body is emitted for explicit dark and system-dark selectors. Root `.light` and `.dark` classes remain compatible when the data attribute is absent.

## Verification commands

```sh
bun run check
bun run test:visual
```

`bun run check` auto-fixes Biome lint/format/imports, runs the style and Tailwind-usage lints, typechecks every workspace, and runs all unit and contract tests. `bun run test:visual:update` is the explicit baseline-update command. Generated package CSS and TypeScript declarations are rebuilt before the visual server starts.
