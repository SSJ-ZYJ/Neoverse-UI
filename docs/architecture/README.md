# Architecture

Status: adopted

[Chinese documentation](../zh-CN/README.md)

## Workspace principles

The repository is a Bun workspace. Public-package dependencies use explicit SemVer ranges that match the registry contract, while Bun links matching local workspaces during development; root scripts call package scripts in dependency order rather than relying on a task orchestrator. Published packages are ESM-only. TypeScript packages emit declarations and source maps, while CSS packages publish generated files from `dist`.

## Package boundaries and maturity

| Package / app | Maturity | Boundary |
| --- | --- | --- |
| `@neoverse-ui/tokens` | Stable | Framework-agnostic CSS Variables, token-name maps, and surface preset contracts |
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
tokens + tailwind + motion + overlay-runtime -> vue
tokens + tailwind + motion + overlay-runtime -> react
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
    tooltip.css          prose.css           terminal.css
  themes/
    light.css            dark.css
```

The TypeScript `cssVariables` map composes foundation domains from
`src/foundation/` and one token map per component from the category directories
under `src/components/`. The CSS build emits `@neoverse-ui/tokens/css` in order:
primitives, semantic roles, foundation layers, light mapping, component defaults,
then the canonical dark mapping.

Tokens defines Material, Surface Role, and explicit surface selections. Both
adapters emit the same unresolved role. Tailwind selects a Solid, Frosted, or
Aurora Glass recipe from the nearest valid DOM scope. The optional edge runtime
enhances positively eligible Glass surfaces only. Portaled overlays reuse the
invocation scope without a provider. See [material selection](material-standards.md#shared-material-selection).

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
UiDrawer
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

The adapters compose Tailwind classes and preserve native interaction.
`UiAction` defaults to an anchor and accepts a framework link renderer.
`UiNavigationItem` owns current-page semantics and selection feedback, not route
state; its default `surface="none"` lets the surrounding chrome own the plane.
`UiSurface` is the generic material primitive; `UiCard` adds standard card
radius and padding. Button, Card, ControlSurface, SegmentedControl, and Dock
default to `surface="auto"`; see their [shared recipes](material-standards.md#solid-material).

SegmentedControl keeps its roving tab stop on the checked option while focus
is outside the group. Its selection and keyboard interaction remain available
with `surface="none"`. ControlSurface owns grouped chrome and trailing
separation. `hoverMode="static"` holds the surface steady as descendants hover,
and `edgeMode="local"` requests the CSS Aurora Glass edge. Dock specializes
that composition for reusable floating navigation; routing, destination state,
icons, and trailing controls stay consumer-owned. The shared indicator divides
out CSS `zoom` and ancestor `scale` to commit geometry in the group's layout
pixels. `UiStatusIndicator` leaves live-region announcements to the caller.

## React components

The current source of `@neoverse-ui/react` provides the same components listed above, including consumer-driven navigation, feedback, terminal, presentation and scrollbar adapters. This is a source inventory, not an assertion that all adapters exist in npm React 0.3.0 or have real React product acceptance; see [framework parity](framework-parity.md) and the [published baseline](../releases/release-0.3.1.md).

React adapters share the same Tailwind component selectors, Surface presets, native interaction semantics, and accessibility expectations as Vue. Canonical Shared and Consumer Driven remain distinct maturity tracks even where both adapters now exist. `UiAction` supports `asChild` routing composition, `UiBreadcrumb` exposes a custom item renderer seam, and `UiDock` shares ControlSurface's navigation indicator while leaving navigation content and active state to the consumer. Native controls preserve refs and platform attributes. Form controls share the state and accessibility rules documented in [`form-control-contract.md`](./form-control-contract.md). Top-layer controls share the positioning and dismiss rules documented in [`overlay-contract.md`](./overlay-contract.md).

Framework parity is declared in `contracts/framework-parity.json` and validated by `scripts/gates/check-framework-parity.ts`. The contract covers public components, shared option/item structures, and shared literal unions, including Consumer Driven adapters. Framework-native binding names are normalized explicitly—for example Vue `modelValue` maps to React `value`/`checked`, while Vue `readonly` maps to React `readOnly`. This parity does not promote maturity or replace real consumer evidence. The React Runtime Fixture is checked against `component-matrix.json` rather than a handwritten component list, so a newly runtime-validated adapter cannot silently miss browser coverage.

### Tabs appearance

`UiTabs` accepts the same `variant` values in Vue and React:

| Value | Use |
| --- | --- |
| Omitted | Automatic material track with a moving selection plate |
| `glass` | Explicit Aurora Glass track and moving selection plate |
| `underline` | Full-width baseline and a moving underline with rounded ends for page sections or dense content |
| `pill` | Compact rounded track with a solid selection pill for cards and side panels |

The underline variant uses the standard compact tab radius for hover feedback.

Changing the variant changes only the presentation. The selected value,
keyboard navigation, and tab-to-panel associations use the same contract.

## Adapter source layout

Vue and React use matching `src/components/<category>/` directories:
`actions`, `display`, `forms`, `motion`, `navigation`, `overlays`, `surfaces`,
and `terminal`. Give each public or private component its own file. Keep
category-specific helpers next to the components that use them. The package
entry re-exports the public API; internal modules import from the owning
source files, not the package entry. Category paths are not public imports.

`bun run check:component-layout` enforces categorized adapter files,
one component per React file, and re-export-only TypeScript package entries.

## Overlay runtime

`@neoverse-ui/overlay-runtime` owns framework-agnostic anchored-overlay behavior. It computes viewport coordinates, supports automatic top/bottom flipping and edge clamping, accounts for CSS zoom, tracks scroll/resize while open, and uses the native Popover API when available. Browsers without Popover support keep the same fixed-position contract through the fallback class rather than falling back to container-relative absolute positioning.

`UiPopover`, `UiDropdownMenu`, and `UiSelect` all consume this runtime instead of owning independent positioning algorithms. Framework adapters remain responsible for state bindings, focus policy, ARIA roles, and menu keyboard semantics. Generic Aurora Glass rules deliberately exclude top-layer panels from their normal `position: relative` context so runtime-owned viewport coordinates remain authoritative.

Display-only semantic primitives do not gain a `surface` prop merely for API symmetry. `UiBadge` owns status/semantic color, `UiStatusIndicator` owns presence language, `UiSkeleton` owns loading geometry/effect, and `UiScrollbar` owns document-scroll runtime. Consumers should wrap those primitives in `UiSurface`, `UiCard`, or `UiControlSurface` when a material plane is needed instead of making every primitive an Aurora Glass surface.

`UiAvatar` paints either an image, derived initials, or a neutral person glyph. `placeholder="icon"` selects the glyph for a source-less identity and accepts a consumer `icon` slot or prop to replace it; the default remains `initials`, so a named person still shows their letters. Both placeholders centre on a 1:1 line box rather than a normal line height, which keeps capitals and the glyph optically centred at every size.

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

`@neoverse-ui/motion` is framework-agnostic. It owns the base duration/easing scale plus `feedback`, `state`, and `spatial` semantic roles. Shared component CSS consumes those roles directly, and the same stylesheet ships the presence engine: the `data-neoverse-motion` presets, the `.nv-*` enter/exit classes and top-layer `.nv-presence`. Every preset resolves to the same frame variables, so an exit returns along the path the entrance took. Declared fallback profiles (`data-neoverse-motion-fallback`) cover engines without the filter pass or individual transform properties, and `@supports not (filter: blur(1px))` applies the filter fallback automatically. It also owns the DOM behavior that CSS cannot express: page-change choreography in `startViewTransition` (eight standard View Transition presets with scoped `nv-page` region snapshots and WAAPI fallbacks, plus the optional WebGL particle `dissolve`), and the layout width primitives `captureLayoutWidths` / `animateLayoutWidths`, which reconcile a group of boxes whose content changes size. The width primitives sample every rendered box before the update, resolve all natural endpoints before the first animation starts, animate on the `spatial` role, and let an interrupted run continue from the frame it reached because the sample reads the animated style. Boxes that grow temporarily lock their copy to one line (`white-space: nowrap`, `overflow: clip`, restored on finish or cancellation); otherwise the longer replacement text wraps inside the still-narrow box and its height jumps mid-animation. Endpoint measurement assumes fonts have finished loading. Framework adapters stay in the component packages: Vue exposes `useLayoutWidthMotion`, which owns the pre/post update phases, viewport-resize and reduced-motion termination, and unmount cleanup. Reduced motion removes spatial distance and collapses durations so component state remains predictable.

Mounted disclosure regions use the reusable `animateDisclosure()` primitive. It animates one region between zero and its natural height on the `state` role, applies `hidden`/`inert`/`aria-hidden` while closed, continues from the visible frame when reversed, and restores the consumer's inline `height` and `overflow` when it settles. The Explorer's specimen leaf lists use it, and the Motion module's Disclosure motion specimen demonstrates it; the animation is not owned by the shell.

In the Motion specimen, spacing that leaves with the list is inside the animated
region, so applying `hidden` at the end of the exit does not shift the hint.

## Density and touch strategy

Controls retain compact painted dimensions on every viewport. Shared Button and SegmentedControl CSS uses `@media (pointer: coarse)` to add an invisible 8px hit-area expansion with pseudo-elements. Disabled pseudo hit areas do not intercept input. No `mobile-button`, `docs-button`, or other application-specific component is introduced. The same core components serve desktop and touch; `focus-visible`, keyboard navigation, and disabled behavior remain explicit component contracts.

## Design Lab

`apps/playground` uses Bun.serve for the HTML shell, `/frame` theme-isolated documents, built Tailwind CSS, and the Vite browser bundle. The shell and isolated `/frame` use the normal consumer root size (16px). `App.vue` selects the shell or independent frame. `LabWorkspace` owns the active hash, preferences, drawer state, and Preview Stage scroll restoration on reload.

The Vite development server serves shared styles from a separate build cache. The CSS watcher serializes rebuilds and atomically replaces the served stylesheet only after compilation succeeds; package builds do not clear the development cache.

Before the browser entry runs, the shell uses the workspace grid and chrome styles with noninteractive placeholders. A pre-paint script applies the same theme and language precedence as the mounted workspace, including the stored theme and stage background on reload. The toolbar, Explorer and Inspector mount independently of the initial preview. Scroll restoration waits for the preview to render so the stage has its full scroll height.

Design Lab 2.0 keeps its toolbar fixed above three independently scrollable areas: Explorer, Preview Stage, and Inspector. The Explorer orders the catalogue into Foundations, Materials & elevation, Components, Compositions, and a separated Lab tools section. A section states design intent, a module is a family that can be read on its own, and QA or theme tooling never mixes with design content. Search matches module or specimen names in either language, API names, and tags without maintaining another inventory.

Explorer section and module rows share a leading label inset and align their counts and chevrons in the same trailing columns. In the Chinese interface, section and module names display English below Chinese in smaller, muted text, with wrapping instead of truncation. Specimen names retain a compact inline English suffix. The reading aid is hidden from the accessible name; the English interface shows the English name alone. Module rows navigate to the module overview while a separate disclosure expands their specimens; a module with a single browsable specimen renders as one destination, so the tree never repeats the same label at a third level.

The three shell scroll containers and the isolated frame document use a native
scroll-position hint. Offscreen rendering containment is confined to passive
gallery content; interactive previews retain visible focus and overlay overflow.

The ordinary Design Lab shell and its Stage use a flat semantic canvas by default. A persisted stage-background control repaints only the centre column with the existing Playground field tokens — solid, tint, gradient or optical — so a component can be judged against a coloured or textured backdrop without opening the isolated frame; every other shell contract keeps the flat default. The overview's Preview material choice uses the same preference record, so a reload keeps the selected tier. A specimen route mounts exactly the preview declared by that catalogue entry. The keyed Stage section owns the deep-link anchor and focus target; leaving the route unmounts the instance. A preview may be a single Vue adapter or a deliberately composed scene. It does not select children from a gallery or use CSS to hide sibling specimens.

The Stage background picker uses the shared SegmentedControl with
`surface="glass-elevated"`. The Playground defines the backdrop presets, not
the selector's casing, selection plate, or interaction styles.

Focus still moves to the stage for deep links and history, but the shell paints the visible ring only after keyboard input; pointer navigation and the initial load stay ring-free, and the module heading receives the same designed ring as a specimen title. Composition specimens frame their scene at a declared measure — the reading width by default, a narrower measure for sidebar scenes — and start below the heading, while single-component specimens remain centered on the stage.

Compositions sit directly on the selected Stage backdrop. They do not add a
decorative card or an independent backdrop around the scene; a card or toolbar
that is itself the specimen retains its configured material. Button, IconButton,
and Action preview sessions let the Inspector switch corners without adding
a corner prop to their public API.

A focused specimen exposes a move handle in the stage header: drag it, or use the arrow keys with Shift for a larger step, to place the component anywhere inside the stage; Home or a double-click recenters it. Movement translates the preview directly, so it never joins the specimen's tab order, never wraps the component in a shrink-to-fit container, and never creates a backdrop root around nested Aurora Glass. The isolated `/frame` route paints its comparison stages with the same optical field, so a specimen keeps one backdrop language between the shell and its isolated render.

Focused previews start at 100%. The Stage zoom slider scales continuously from
25% to 400% on a logarithmic track, so a drag changes the same ratio at every
size and fine control stays available near 100%. The minus and plus buttons
step by 10%, and Ctrl + wheel over the preview zooms around the pointer. The
percentage button restores original size and position. Zoom is visual only: the
specimen keeps its 100% layout and is scaled for inspection, so text, rows, and
percentage widths never reflow.
A magnified preview is never clipped to an inner box, so its shadows paint in
full; drag any non-interactive part of it, or use the move handle, to pan it.
The stage chrome and specimen heading keep their own layer above the preview, so
a magnified body never covers the stage tools or the title.
The workspace remains the only scroll port, so the page itself never scrolls
sideways. Zoom does not change Inspector settings. Opening another specimen
restores 100%. Fallback overlay panels inside a scaled preview convert the
rendered scale when they position, so a Select still opens against its trigger.

Every entry in `labSpecimens` declares a `FocusedPreview`: either a localized renderer for a read-only Inspector or a `SpecimenDefinition` that opens one editable `SpecimenSession`. A read-only preview can still support native interactions without exposing a session to the Inspector. Every component specimen whose public API exposes an appearance variant has an editable session: Button, IconButton, Action, SegmentedControl, NavigationItem, ControlSurface, Dock, Badge, StatusIndicator, Skeleton, Notice, Toast, TooltipSurface, Avatar, Table, Disclosure, EmptyState, StatCard, Surface (including the three Aurora Glass tiers), Card, Input, Textarea, Select, Checkbox, RadioGroup, Switch, Field and Tabs. Data-only specimens (Breadcrumb, Pagination, Timeline, StepFlow) and the four overlay specimens stay read-only; overlays own focus, placement and light dismiss, which an Inspector value cannot reproduce. To add a specimen, register its explicit renderer on the catalogue entry and retain its stable QA anchor in the owning module. Interactive definitions live in the `lab-specimens/` family files and are re-exported through `lab-interactive-specimens.ts`; they provide typed initial props, an initial state factory, and editable controls. The session rejects undeclared edits, invalid values, and edits to temporarily disabled fields.

The Stage provides a shared backdrop for module galleries and focused
specimens. Materials also uses a local comparison scene: the module and its
editable Core material comparison specimen render the same components under
adjacent Glass and Solid scopes. The Lab theme and theme-isolated `/frame`
links expose the Light and Dark palettes without a second theme resolver.

Module URLs and `/frame` render the full QA galleries, including fixed state matrices and optical fixtures. The Inspector opens the isolated gallery at the specimen anchor without transferring local edits. `/react-fixture` remains the React contract host. Neither isolated entry mounts the shell.

`UiEmptyState` shares four `variant` values across Vue and React: `default`
uses the centered layout and the standard Aurora Glass card preset (`glass-elevated`).
`outlined` frames the centered content with a
strong dashed border, `compact` aligns content in a dense row and wraps actions
when space runs out, and `subtle` uses the shared subtle Surface with actions
below its text.
Variants do not require an icon or action, and do not change the accessible name
or description.
The two centered variants use a thin neutral outline to distinguish their
optional icon tile from the surrounding surface.

The Empty State specimen and Data Display gallery compare onboarding, no
results, passive activity, and restricted access. The Inspector's Content
group selects a scenario; its Appearance group uses that scenario's default
variant or overrides it independently.

The Card module has one editable Card specimen. Its Inspector changes the
`surface` prop without replacing the card or its contents. The gallery compares
default, elevated, and transparent surfaces using the same card content and
keeps the backdrop QA matrix separate from the comparison.

ControlSurface previews and gallery specimens use automatic Aurora Glass edge
rendering. Only the edge-mode comparison requests the local CSS edge explicitly.

Focused compositions may reuse individual scenes from QA, but do not mount the
gallery containing them. Aurora Glass mode shows one Atlas workspace composed
of the control cluster and project card. The older `#foundation-layout-shape`
link remains a read-only overview of the three focused geometry groups; the full
token sets and comparison anchors remain in the layout and shape QA gallery.

The focused Spacing specimen and its QA gallery share the same token-backed
rulers and layout examples. The rulers compare lengths from a common origin
and report rendered CSS pixels. The layout examples distinguish responsive
container padding from the gap between grid items.

The Colors module and focused specimen share a responsive gallery. Primitive
palettes group shade steps below one CSS variable pattern per family. Semantic
colors use role lists with the theme swatch, CSS variable, and Tailwind utility
together. Both layouts wrap instead of scrolling sideways and render without
per-swatch backdrop filters or Glass edges.

The Typography module's type scale opens with the six Markdown heading levels.
Each row renders the shipped `.neoverse-prose` heading, its `#` marker, and the
`--neoverse-prose-heading-h*-size` role that owns its size. The role tokens stay
separate from the interface title scale, so a page heading never inherits a
component title size.

The interface title scale is fixed, not fluid: `title-sm` is `--neoverse-font-size-md`
(16px), `title-md` is `--neoverse-font-size-lg` (18px) and `title-lg` is
`--neoverse-font-size-xl` (20px), so the three roles stay strictly ordered at
every viewport width. `.ui-dialog__title` is the `title-md` consumer; component
titles such as `.ui-step-flow__title` and `.ui-timeline__title` use `title-sm`.

The inline syntax rows below the heading scale place each Markdown marker beside
its rendered semantic element. Bold, italic, bold italic, inline code,
strikethrough and links share the one `.neoverse-prose` layer; bold and deleted
text nested in a link keep the link's theme-aware blue. A rounded 2px
underline fades in on hover or keyboard focus and fades out when either ends.
Reduced motion removes the fade, and forced colors keep a native underline.

The focused Scrollbar specimen demonstrates `scrollbar-immersive` on a local scroll container. The document-bound `UiScrollbar` and its ownership checks stay in the frame; the focused renderer does not bind the shell document to demonstrate a container scrollbar.

Effective props are the session's overrides over the specimen's explicit initial props. Omitted props are resolved by the component, not the Playground. The Inspector marks changed values and can remove an override to inherit the component default where the specimen leaves the prop unset. Preview events and the editor share one specimen-owned value for controlled inputs and selections. Reset clears overrides and restores the specimen's initial interaction state without remounting its component. The session lives in memory only: leaving a specimen discards it, a reload starts again from the specimen's initial state, and navigation history restores selection rather than edits. Locale, theme, and browser hover, focus, and press do not participate in this session.

Select and Checkbox suspend their value editors while the specimen is disabled;
Select does the same while read-only. Neither clears the current value. The
Tabs editor lists enabled tabs only; the preview retains its disabled tab so
keyboard navigation still demonstrates skipping it. Variant-specific state
editors appear only for the variant that owns them, so SegmentedControl lists
its selected option, selected theme, or selected language one at a time instead
of offering controls that cannot affect the current preview.

### Composition presets

Control Cluster, Floating Toolbar, Project Card, and Docs Toolbar use the same
`SpecimenSession` and Inspector as editable components. A composition's ID is
its existing `labSpecimens` ID. Its definition binds one real scene renderer to
declared field controls and a nonempty list of `CompositionPreset<Id, Props, State>`
baselines. The first preset is the default. Preset IDs are stable, unique within
the scene, and independent of their localized labels.

A composition preset specifies its complete scene configuration and initial
controlled state, not the defaults of its public child components. The session
validates the baselines against the declared field controls and keeps immutable
copies. Inspector edits remain in session-local overrides and controlled state.
Selecting a preset clears both editable layers in one update. Reset does the
same without changing the selected preset. Neither operation remounts the
scene root or its persistent controls; optional sections mount and unmount as
their configuration changes.

| Composition | Built-in presets (default first) | Editable fields |
| --- | --- | --- |
| Control Cluster | Default Workspace, Compact Workspace | Density, surface, status visibility, Focus / Review / Archive |
| Floating Toolbar | Standard Toolbar, Compact Toolbar | Density, surface, Share / Publish group visibility, Canvas / Inspect / History |
| Project Card | Detailed Card, Overview Card | Content detail, card surface, status badge, delivery progress (0–100) |
| Docs Toolbar | Reading Toolbar, Editing Toolbar | Density, surface, Copy link visibility, Read / Edit / Preview |

Modes are controlled by the focused composition session; the isolated scenes
use their default configuration and own their mode locally without an
Inspector. Project Card uses one value for its percent label and native
progress element. Compact layouts use token spacing and the same component
sizes. The padding transition uses the spatial motion role and is disabled
when reduced motion is requested.

A configuration change moves focus only when it removes the control that owns
it: the scene focuses a stable control in the same action group, and otherwise
leaves focus where it is. Inspector-driven changes therefore keep focus in the
Inspector, while Reset keeps focus on a surviving scene control. The scenes do
not poll focus or observe the document; the policy runs once per hide.

At the shared `xl` / 1280px breakpoint, the Explorer and Inspector become persistent columns. Below it, the same panels open as native modal dialogs with the background inert, keyboard focus inside the dialog, and focus returned to the opening control on dismissal. Selecting an item closes the drawer and moves focus to the module heading or specimen without creating a history entry for the drawer itself.

The native backdrop dims the page outside the drawer without filtering it.
Its cutout moves with the panel so the drawer's Light-tier Glass blurs the
page rather than the scrim. The drawer uses a local CSS edge throughout its
top-layer transition; inline controls borrow the panel's backdrop.

Explorer and Inspector links explicitly join the tab order so the same navigation is available in WebKit when it skips links with implicit tab stops.

Playground-only composition helpers keep specimen structure consistent without becoming consumer API. `LabSpecimenSection` owns section spacing and the header divider. `LabSpecimenHeader` owns specimen typography across module sections, nested examples and state rows: section headings use `title-lg` (20px) with `body-md` descriptions, and nested headings use `title-md` (18px) with `body-sm` descriptions. This does not change the type scale inside the examples. `playground-token-grid` and `playground-specimen-grid` use the available content width rather than fixed viewport column counts, while `playground-specimen-panel` and `playground-specimen-row` provide shared specimen geometry. Module specimens select material through `UiSurface surface="..."` instead of directly attaching Aurora Glass implementation classes; the toolbar and side panels are application chrome boundaries. `StateRow` exposes stable `data-specimen-state-row` markers only for Design Lab validation; these markers are not public component API.

Changing the shell language fades the outgoing snapshot over the live UI with
the `state` role. The live UI keeps its DOM, focus, route, and specimen session.
The outgoing capture excludes the viewport Glass canvases, as the theme
transition does.
Without the View Transition API or with reduced motion, the copy changes
immediately.

The shell, isolated frame, and React Runtime Fixture animate the width and
height of existing controls when DOM updates change their natural size. This
covers Inspector sizes and resets, density and scale changes, and content
changes in persistent controls. The animation runs on the `spatial` role
without scaling text or replacing elements. Initial and newly mounted sizes,
native resize gestures, and viewport resizing are not animated.
Language changes use the same size motion beneath the outgoing snapshot.
Compact labels, including StatusIndicator labels during Inspector status changes,
stay on one line and reveal their full text as space becomes available.
Intentional multiline Explorer labels are not constrained. The overview hero's
glass sample is also a size-motion target: translation changes its copy length,
so its height animates on the `spatial` role instead of jumping between layouts.
Its multiline copy is never locked to one line.

`@neoverse-ui/motion` exposes the appearance transition and size observer
independently of the Playground. The [Motion package guide](../../packages/motion/README.md#appearance-and-control-size-transitions)
describes consumer setup and the single-line translated-label strategy used by
the Inspector's isolated preview link.

ControlSurface and Dock also transition their `scale` through shared CSS in
consumer applications. The zoom transition is disabled when reduced motion
is requested.

The Motion module's Transitions specimen (`foundation-motion-playground`) exposes the live
theme reveal and crossfade side by side, the language crossfade with the layout
width motion on the brand, navigation, and preference boxes, and a shared size
control for a text button and an icon button. The width group stacks its boxes
below the `md` breakpoint so a width change cannot switch the flex-wrap row
count mid-animation. It runs in the shell and
isolated frame. Appearance changes in the isolated frame do not overwrite
shell preferences.

Navigation fades the Stage heading with the `state` role and gives the focused
specimen a short `spatial` offset. Route changes do not snapshot the Stage
outside the dedicated Motion specimen. Drawer travel uses the `spatial` role.
Reduced motion disables the spatial animations.

The shell toolbar shows the FPS counter before the theme and language controls.
The counter pauses while the document is hidden. Use `?fps=0` to disable it
without sampling frames. The isolated frame does not mount the counter.

`StateRow layout="wide"` reserves a full row for multi-component comparisons;
nested QA matrices receive the same space automatically. Preview content wraps
within the stage instead of imposing its max-content width. Shared
`playground-preview-columns` grids use the available container width for tier,
form and composition examples. Specimen cards size to their own content rather
than stretching their preview to match the tallest neighbouring card.

Specimen and QA stages render components without additional CSS zoom. Standard and compact Dock specimens, including the consumer-parity composition, explicitly use `scale="md"`; larger scales belong only in labeled scale-comparison examples. This prevents stage enlargement from stacking with component scaling and the shell's presentation root size.

Shared tokens own default component geometry; use public sizes instead of overriding internal selectors. Explicit composition scaling remains opt-in. Local `file:` consumers use `scripts/sync/sync-consumer.ts` to build and verify every installed copy before serving CSS; see [consumer sizing](consumer-sizing.md).

The validation area also acts as the Playground Contract Lab. `apps/playground/src/contract-lab.ts` derives component maturity, release-visual status, runtime validation, and framework parity from the repository contracts instead of maintaining a second component inventory. Interaction-heavy specimens declare stable state ids and browser checks; `StateRow` exposes non-localized `data-contract-state` markers so automation does not depend on English copy. The Contract Lab table mirrors the component matrix and exposes explicit Vue and React runtime-validation entry points. These `data-contract-*` attributes are development/test instrumentation only and are not part of the public package API.

Test layers, spec ownership and commands are maintained in the [testing registry](../testing/README.md).

## Theme model

Consumers set `data-theme="light"`, `data-theme="dark"`, or `data-theme="system"` on the root. Light values are mapped from `themes/light.css`; one canonical dark declaration body is emitted for explicit dark and system-dark selectors. `data-theme` is the only supported theme-selection contract.

The Playground resolves and applies that contract through one framework-neutral
engine, `apps/playground/src/theme-runtime.ts`. On a fresh navigation, the
order is `?theme=` → the shared `neoverse-design-lab.preferences` record →
the system default; on reload the stored choice takes priority. The engine
owns `data-theme` and the `prefers-color-scheme` observer and reports resolved
changes to subscribers, including the Vue `theme-state.ts` binding.

The shell reveals the new palette from the center of the desktop theme
control or the compact toggle to the farthest viewport corner. A feathered
circular mask follows a 640ms symmetric curve. Pointer and keyboard activation
use the same origin. `?theme-motion=fade` selects the original toolbar
crossfade, also used for changes without a control origin. If view
transitions are unavailable, the theme uses the existing token color
transition. Reduced motion applies the palette immediately. The outgoing
snapshot does not block pointer input. A new appearance request interrupts the
previous effect without dropping its pending preference update.
When switching back between the two palettes during a reveal or fade, the
same snapshot reverses from its current progress. The toolbar shows the latest
choice immediately; the live palette commits once the reversed snapshot covers
it, avoiding a full-viewport color jump.
Palette updates settle their new color and shadow transitions while the
snapshot still covers them. Glass controls do not replay the previous tint
after the reveal. The segmented thumb keeps interpolating its feedback fill
when pressed or released, independently of selection travel.

## Verification

Commands, gate composition and the sequential check runner are owned by the [testing registry](../testing/README.md#check-runner).

Material tiers, customization, component audit and hover/press policy: [Material standards](material-standards.md).
