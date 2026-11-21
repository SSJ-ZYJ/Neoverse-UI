# Architecture

Status: adopted

[Chinese documentation](../zh-CN/README.md)

## Workspace principles

The repository is a Bun workspace. Public-package dependencies use explicit SemVer ranges that match the registry contract, while Bun links matching local workspaces during development; root scripts call package scripts in dependency order rather than relying on a task orchestrator. Published packages are ESM-only. TypeScript packages emit declarations and source maps, while CSS packages publish generated files from `dist`.

## Package boundaries and maturity

| Package / app | Maturity | Boundary |
| --- | --- | --- |
| `@neoverse-ui/tokens` | Stable | Framework-agnostic CSS Variables and token-name maps |
| `@neoverse-ui/tailwind` | Stable | Tailwind v4 semantic theme and shared component selectors |
| `@neoverse-ui/motion` | Stable | CSS motion aliases and reduced-motion policy |
| `@neoverse-ui/overlay-runtime` | Consumer Validation | Framework-agnostic top-layer positioning, tracking, and dismiss runtime |
| `@neoverse-ui/glass-runtime` | Consumer Validation | Optional Glass edge rendering with WebGL and CSS fallback |
| `@neoverse-ui/vue` | Consumer Validation | Vue 3 SFC integration |
| `@neoverse-ui/react` | Consumer Validation | React 19 adapters for consumer-validated shared components |
| `@neoverse-ui/giscus-theme` | Published 0.2.0 | Standalone light/dark Giscus theme CSS |
| `apps/playground` | Consumer Validation | Design Lab, frame route, and browser e2e fixtures |

The dependency direction is:

```text
tokens -> tailwind
tokens -> motion
overlay-runtime -> vue
overlay-runtime -> react
tailwind + motion + overlay-runtime -> vue
tailwind + motion + overlay-runtime -> react
tokens + tailwind + motion + overlay-runtime + vue + react -> playground
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
    shared-control.css   button.css          action.css
    breadcrumb.css       navigation-item.css control-surface.css
    form-control.css     overlay.css         disclosure.css
    table.css
    status-indicator.css segmented-control.css badge.css
    skeleton.css         scrollbar.css       notice.css
    tooltip.css          prose.css
  themes/
    light.css            dark.css
```

`cssVariables.components` follows that ownership. The build emits the public `@neoverse-ui/tokens/css` entry after primitives, semantic roles, foundation layers, light mapping, component defaults, and the canonical dark mapping.

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
UiCheckbox
UiRadioGroup
UiSwitch
UiField
UiInput
UiTextarea
UiSelect
UiPopover
UiDialog
UiToast
UiDropdownMenu
UiContextMenu
UiTable
UiDisclosure
UiTabs
UiAvatar
UiPagination
UiEmptyState
UiBadge
UiStatusIndicator
UiNotice
UiTooltipSurface
UiSkeleton
UiScrollbar
UiPresence
UiTerminalSurface
UiTerminalLine
UiTerminalTranscript
UiTerminalPrompt
UiTerminalEcho
UiStatCard
UiTimeline
UiStepFlow
```

They compose shared Tailwind classes, expose semantic props and slots, and preserve native interaction semantics. `UiAction` defaults to a real anchor and accepts an injected framework link renderer; `UiNavigationItem` adds current-page, compact-label, and selection-indicator contracts without owning route state. Components that own a visual plane consume the shared `surface` contract instead of hard-coding Aurora Glass as an intrinsic component trait. `UiButton`, `UiAction`, `UiIconButton`, and `UiSegmentedControl` use `glass-subtle` as their canonical default, while `UiNavigationItem` defaults to `none` so grouped navigation inherits the parent chrome rather than creating nested Aurora Glass. `UiSegmentedControl` keeps its active slider and keyboard interaction independent from the outer Surface, so `surface="none"` can be used inside a composition that already owns the chrome. `UiSurface` is the generic polymorphic material primitive. `UiCard` owns standard card geometry (`rounded-card` + base card padding) while consuming the same `surface` contract; standard cards should therefore use `UiCard surface="..."` rather than rebuilding card geometry around `UiSurface`. `UiControlSurface` owns one grouped-control chrome boundary and optional trailing separation. It also owns grouped-surface behavior policy: `hoverMode="static"` keeps parent material stable while descendants hover, and `edgeMode="local"` requests a locally rendered Aurora Glass edge without exposing renderer attributes to consumers. `UiDock` defaults to `glass-elevated`, while `UiControlSurface` defaults to `glass-subtle`; the separate `chrome` preset and `ui-surface-chrome` renderer have been removed without an alias. `UiDock` specializes that contract for reusable floating navigation: it owns Dock layout, chrome, scale, compact composition, and trailing separation while route data, destination state, icons, and trailing controls stay consumer-owned. `UiStatusIndicator` leaves live-region announcements to the caller. Product route lists, fixed dock positioning, cross-item state, and page content remain composition responsibilities.

## React components

The current source of `@neoverse-ui/react` provides the same 43 components listed above, including consumer-driven navigation, feedback, terminal, presentation and scrollbar adapters. This is a source inventory, not an assertion that all adapters exist in npm React 0.3.0 or have real React product acceptance; see [framework parity](framework-parity.md) and the [published baseline](../releases/release-0.3.1.md).

React adapters share the same Tailwind component selectors, Surface presets, native interaction semantics, and accessibility expectations as Vue. Canonical Shared and Consumer Driven remain distinct maturity tracks even where both adapters now exist. `UiAction` supports `asChild` routing composition, `UiBreadcrumb` exposes a custom item renderer seam, and `UiDock` shares ControlSurface's navigation indicator while leaving navigation content and active state to the consumer. Native controls preserve refs and platform attributes. Form controls share the state and accessibility rules documented in [`form-control-contract.md`](./form-control-contract.md). Top-layer controls share the positioning and dismiss rules documented in [`overlay-contract.md`](./overlay-contract.md).

Framework parity is declared in `contracts/framework-parity.json` and validated by `scripts/gates/check-framework-parity.ts`. The current contract covers all 43 components, shared option/item structures, and shared literal unions, including Consumer Driven adapters. Framework-native binding names are normalized explicitly—for example Vue `modelValue` maps to React `value`/`checked`, while Vue `readonly` maps to React `readOnly`. This parity does not promote maturity or replace real consumer evidence. The React Runtime Fixture is checked against `component-matrix.json` rather than a handwritten component list, so a newly runtime-validated adapter cannot silently miss browser coverage.

## Overlay runtime

`@neoverse-ui/overlay-runtime` owns framework-agnostic anchored-overlay behavior. It computes viewport coordinates, supports automatic top/bottom flipping and edge clamping, accounts for CSS zoom, tracks scroll/resize while open, and uses the native Popover API when available. Browsers without Popover support keep the same fixed-position contract through the fallback class rather than falling back to container-relative absolute positioning.

`UiPopover`, `UiDropdownMenu`, and `UiSelect` all consume this runtime instead of owning independent positioning algorithms. Framework adapters remain responsible for state bindings, focus policy, ARIA roles, and menu keyboard semantics. Generic Aurora Glass rules deliberately exclude top-layer panels from their normal `position: relative` context so runtime-owned viewport coordinates remain authoritative.

Display-only semantic primitives do not gain a `surface` prop merely for API symmetry. `UiBadge` owns status/semantic color, `UiStatusIndicator` owns presence language, `UiSkeleton` owns loading geometry/effect, and `UiScrollbar` owns document-scroll runtime. Consumers should wrap those primitives in `UiSurface`, `UiCard`, or `UiControlSurface` when a material plane is needed instead of making every primitive an Aurora Glass surface.

`UiScrollbar` owns the document-level immersive scrollbar runtime: geometry measurement, auto-hide, thumb dragging, track jumps, route/layout refreshes, and native-scrollbar visibility through the `hideNative` prop. Consumers may pass a `refreshKey` when a route transition changes the scrollable document.

Scrolling containers use the `scrollbar-immersive` utility instead of a second rail instance. Both layers draw one rail: the utility keeps the `UiScrollbar` lane width, thumb widths, neutral ink ladder, and inset edge highlight from the shared `--neoverse-scrollbar-*` tokens, so a container and the document read the same. Accent enters the grip only while dragging, and neither layer paints an outer shadow: a wide bloom hazes the canvas, and an outer shadow on the native thumb paints a stray arc around its cap. Because Chromium disables `::-webkit-scrollbar` styling as soon as `scrollbar-width` or `scrollbar-color` is set, the standard properties are scoped to `@supports not selector(::-webkit-scrollbar)` and only engines without the pseudo-elements receive the platform "thin" fallback.

## Material / Aurora Glass policy

Material values are token-owned. Ordinary Surface Solid, Subtle, and Elevated use Tailwind composition. Aurora Glass is the single glass material, with Light, Standard, and Immersive tiers: `material-glass-subtle`, `material-glass-elevated`, and `material-glass-immersive`. These stable technical identifiers do not name separate styles. Consumers import `glassMaterial` from `@neoverse-ui/tokens` for `name.zh/en` and `tiers.subtle/elevated/immersive` short names; see [material standards](material-standards.md). CSS supplies the complete baseline: opaque fallback, tint, backdrop sampling, saturation, directional refraction field, shadow, and reduced-transparency behavior.

Independent Aurora Glass surfaces must render their own tint, border, backdrop filter, and shadow **before hover**, including when nested inside an Aurora Glass layout. Vue and React `UiSurface` therefore default to `glassNesting="local"`; `UiCard` also retains its own material without a nesting override. Only a layout grouping that deliberately borrows its parent's Aurora Glass plane should set `glassNesting="inherit"` (Vue: `glass-nesting="inherit"`). A component that intentionally has no material should use `surface="none"` instead. Never flatten all unmarked nested Aurora Glass elements: that silently removes real card surfaces in the Playground and consumer compositions. Normal-state material and reduced-transparency fallbacks must remain independently testable, without relying on hover or the optional WebGL renderer.

`@neoverse-ui/glass-runtime` is an optional shared renderer, not a prerequisite for any base component. Follow the [Glass repair guardrails](material-standards.md#glass-repair-guardrails) when changing it. Its policy is:

| Tier | Default | Runtime policy |
| --- | --- | --- |
| Light (`subtle`) | CSS baseline | automatically discovered when the renderer is mounted |
| Standard (`elevated`) | CSS baseline | automatically discovered when the renderer is mounted |
| Immersive (`immersive`) | CSS baseline | automatically discovered when the renderer is mounted |

The WebGL edge blends with live backdrop pixels instead of sampling or
displacing neighboring pixels. CSS owns the body tint, blur, and shadows.
For directional lighting, fallback behavior, and optical limits, see
[Aurora Glass edge reflection](material-standards.md#aurora-glass-edge-reflection).

For whole-page position/opacity transitions the renderer exposes an opt-in
`suspend()` / `resume()` lightweight path: it retains the last painted frame and
skips per-frame enumeration and occlusion probes until one full refresh on
resume. Size, stacking and top-layer changes still need a full refresh. The
contract and recommended wiring live in the
[glass-runtime README](../../packages/glass-runtime/README.md#pausing-edge-repaints-for-page-transitions).

Unit tests verify runtime ownership, composition, scheduling and accessibility
transitions. Chromium integration tests check tier blur, shared canvas placement,
painted strokes and the CSS fallback when WebGL is absent. A separate Linux
Chromium + SwiftShader suite measures lit/unlit pixel deltas, edge continuity,
corner emphasis and interior leakage in fixed diagnostic scenes. This is an
optical regression signal, not proof of spatial refraction or final appearance:
historical 0.2.0 color reference matching, dynamic background response and
real-device performance remain subject to manual acceptance.

## Motion

`@neoverse-ui/motion` is framework-agnostic. It owns the base duration/easing scale plus `feedback`, `state`, and `spatial` semantic roles. Shared component CSS consumes those roles directly; the package does not ship generic entrance-animation recipes or framework runtime animation code. It also owns the DOM behavior that CSS cannot express: the page-change choreography, and the layout width primitives `captureLayoutWidths` / `animateLayoutWidths`, which reconcile a group of boxes whose content changes size. The width primitives sample every rendered box before the update, resolve all natural endpoints before the first animation starts, animate on the `spatial` role, and let an interrupted run continue from the frame it reached because the sample reads the animated style. Boxes that grow temporarily lock their copy to one line (`white-space: nowrap`, `overflow: clip`, restored on finish or cancellation); otherwise the longer replacement text wraps inside the still-narrow box and its height jumps mid-animation. Endpoint measurement assumes fonts have finished loading. Framework adapters stay in the component packages: Vue exposes `useLayoutWidthMotion`, which owns the pre/post update phases, viewport-resize and reduced-motion termination, and unmount cleanup. Reduced motion removes spatial distance and collapses durations so component state remains predictable.

## Density and touch strategy

Controls retain compact painted dimensions on every viewport. Shared Button and SegmentedControl CSS uses `@media (pointer: coarse)` to add an invisible 8px hit-area expansion with pseudo-elements. Disabled pseudo hit areas do not intercept input. No `mobile-button`, `docs-button`, or other application-specific component is introduced. The same core components serve desktop and touch; `focus-visible`, keyboard navigation, and disabled behavior remain explicit component contracts.

## Design Lab

`apps/playground` uses Bun.serve for the HTML shell, `/frame` theme-isolated documents, built Tailwind CSS, and the Vite browser bundle. The shell and isolated `/frame` use the normal consumer root size (16px). `App.vue` selects the shell or independent frame. `LabWorkspace` owns the active hash, preferences, drawer state, and Preview Stage scroll restoration on reload.

Design Lab 2.0 keeps its toolbar fixed above three independently scrollable areas: Explorer, Preview Stage, and Inspector. The Explorer groups the existing module and specimen catalogue under Components, Foundations, Compositions, Presets, and Validation. Search matches module or specimen names in either language, API names, and tags without maintaining another inventory. Explorer module headings with registered specimens expand or collapse their leaf items instead of navigating into a multi-component gallery; module-level deep links remain available for QA and existing links.

The ordinary Design Lab shell and its Stage use a flat semantic canvas. A specimen route mounts exactly the preview declared by that catalogue entry. The keyed Stage section owns the deep-link anchor and focus target; leaving the route unmounts the instance. A preview may be a single Vue adapter or a deliberately composed scene. It does not select children from a gallery or use CSS to hide sibling specimens.

Every entry in `labSpecimens` declares a `FocusedPreview`: either a localized renderer for a read-only Inspector or a `SpecimenDefinition` that opens one editable `SpecimenSession`. A read-only preview still supports native interactions and can own local Vue state without creating an Inspector session. Button, SegmentedControl, Input, Card, and Dock retain editable sessions. To add a specimen, register its explicit renderer on the catalogue entry and retain its stable QA anchor in the owning module. Interactive definitions provide typed initial props, an initial state factory, and editable controls. The session rejects undeclared edits, invalid values, and edits to temporarily disabled fields.

Module URLs and `/frame` render the full QA galleries, including fixed state matrices and optical fixtures. The isolated frame retains the diagnostic comparison backdrops. The Inspector opens that gallery at the specimen anchor, without transferring local edits. `/react-fixture` remains the React contract host. Neither isolated entry mounts the shell.

The focused Scrollbar specimen demonstrates `scrollbar-immersive` on a local scroll container. The document-bound `UiScrollbar` and its ownership checks stay in the frame; the focused renderer does not bind the shell document to demonstrate a container scrollbar.

Effective props are the session's overrides over the specimen's explicit initial props. Omitted props are resolved by the component, not the Playground. The Inspector marks changed values and can remove an override to inherit the component default where the specimen leaves the prop unset. Preview events and the editor share one specimen-owned value for controlled inputs and selections. Reset clears overrides and restores the specimen's initial interaction state without remounting its component. Leaving a specimen discards its session; navigation history restores selection, not edits. Locale, theme, and browser hover, focus, and press do not participate in this session.

At the shared `xl` / 1280px breakpoint, the Explorer and Inspector become persistent columns. Below it, the same panels open as native modal dialogs with the background inert, keyboard focus inside the dialog, and focus returned to the opening control on dismissal. Selecting an item closes the drawer and moves focus to the module heading or specimen without creating a history entry for the drawer itself.

Explorer and Inspector links explicitly join the tab order so the same navigation is available in WebKit when it skips links with implicit tab stops.

Playground-only composition helpers keep specimen structure consistent without becoming consumer API. `LabSpecimenSection` owns subsection heading, description, spacing, and optional action placement. `playground-token-grid` and `playground-specimen-grid` use the available content width rather than fixed viewport column counts, while `playground-specimen-panel` and `playground-specimen-row` provide shared specimen geometry. Module specimens select material through `UiSurface surface=\"...\"` instead of directly attaching Aurora Glass implementation classes; the toolbar and side panels are application chrome boundaries. `StateRow` exposes stable `data-specimen-state-row` markers only for Design Lab validation; these markers are not public component API.

The Motion module's `foundation-motion-width` specimen demonstrates the shared layout width motion with real content: the Design Lab language control is the trigger, and `useLayoutWidthMotion` keeps the brand, navigation, and preference boxes on one `spatial` curve without scaling text. The stage stacks its boxes below the `md` breakpoint so a width change cannot switch the flex-wrap row count mid-animation. It is registered in the specimen catalogue, so deep links cover it.

`LabToolbar` uses `useLayoutWidthMotion` for preference controls whose labels change with the locale. Navigation fades the Stage heading with the shared `state` motion role and gives the focused specimen a short `spatial` offset. The specimen tree itself does not fade because opacity would introduce a Glass backdrop root. It renders at its normal consumer size; wide content can use the Stage width or scroll locally. The shell does not snapshot the Stage or start the WebGL particle effect outside its dedicated Motion specimen. Drawer travel uses the shared `spatial` role. Reduced motion removes the Stage and drawer transitions.

Use `?fps=1` to enable the optional FPS diagnostic; the default shell does not sample animation frames for the counter.

`StateRow layout="wide"` reserves a full row for multi-component comparisons;
nested QA matrices receive the same space automatically. Preview content wraps
within the stage instead of imposing its max-content width. Shared
`playground-preview-columns` grids use the available container width for tier,
form and composition examples. Specimen cards size to their own content rather
than stretching their preview to match the tallest neighbouring card.

Specimen and QA stages render components without additional CSS zoom. Standard and compact Dock specimens, including the consumer-parity composition, explicitly use `scale="md"`; larger scales belong only in labeled scale-comparison examples. This prevents stage enlargement from stacking with component scaling and the shell's presentation root size.

Default component geometry is consumer-owned by the shared tokens: Button and Action sizes are 32 / 40 / 48px at a normal 16px root, navigation and segmented options start at 32px with 14px labels, and grouped controls use a 36px track. Consumers should select public sizes instead of overriding internal selectors. Explicit composition scaling remains opt-in. Local `file:` consumers use `scripts/sync/sync-consumer.ts` to build and verify every installed copy before serving CSS; see [consumer sizing](consumer-sizing.md).

The validation area also acts as the Playground Contract Lab. `apps/playground/src/contract-lab.ts` derives component maturity, release-visual status, runtime validation, and framework parity from the repository contracts instead of maintaining a second component inventory. Interaction-heavy specimens declare stable state ids and browser checks; `StateRow` exposes non-localized `data-contract-state` markers so automation does not depend on English copy. The Contract Lab table mirrors the component matrix and exposes explicit Vue and React runtime-validation entry points. These `data-contract-*` attributes are development/test instrumentation only and are not part of the public package API.

Test layers, spec ownership and commands are maintained in the [testing registry](../testing/README.md).

## Theme model

Consumers set `data-theme="light"`, `data-theme="dark"`, or `data-theme="system"` on the root. Light values are mapped from `themes/light.css`; one canonical dark declaration body is emitted for explicit dark and system-dark selectors. `data-theme` is the only supported theme-selection contract.

The Playground resolves and applies that contract through one framework-neutral engine, `apps/playground/src/theme-runtime.ts`. Mode precedence is `?theme=` → the shared `neoverse-design-lab.preferences` record → the system default; the engine owns the `data-theme` write, the Motion transition attributes, and the `prefers-color-scheme` observer, and it reports resolved changes to subscribers. `theme-state.ts` is only the Vue binding that mirrors the resolved value into a ref, and the React Runtime Fixture imports the same engine, so `/`, `/frame`, and `/react-fixture` cannot drift in mode resolution, persistence, URL synchronization, or transition behavior. Theme vocabulary (`themeModes`, `defaultThemeMode`) and every color come from that module and the token layer; surfaces never hardcode a theme literal or a palette value.

## Verification

Commands, gate composition and the sequential check runner are owned by the [testing registry](../testing/README.md#check-runner).

Material tiers, customization, component audit and hover/press policy: [Material standards](material-standards.md).
