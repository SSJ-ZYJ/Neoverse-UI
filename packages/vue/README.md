# @neoverse-ui/vue

Vue 3 components for the Neoverse UI design system, with Aurora Glass as the shared glass material. Light, Standard, and Immersive are its tiers, not separate styles. Use the [Tokens `glassMaterial` metadata](../tokens/README.md#aurora-glass) for localized display labels; `glass-*` surface identifiers remain stable. See [material standards](../../docs/material-standards.md).

```sh
bun add @neoverse-ui/vue
```

```ts
import { UiButton, UiCard, UiDisclosure, UiDock, UiNotice, UiTable, UiTooltipSurface } from '@neoverse-ui/vue';
```

Consumers without their own Tailwind build can import the packaged design-system styles. This entry forwards to the compiled shared consumer bundle, including Tokens, Motion, Material, component selectors, and the utilities required by the adapters:

```css
@import '@neoverse-ui/vue/index.css';
```

`UiDock` is a public floating-navigation shell built on the shared `UiControlSurface` contract. Consumers provide their own `UiNavigationItem` children, route state, icons, and optional `trailing` controls; the Dock owns chrome, scale, compact layout, divider geometry, and shared navigation-indicator behavior.

Vue `>=3.5 <4` is required as a peer dependency. Field and choice-control IDs use the [SSR-stable `useId` API introduced in Vue 3.5](https://blog.vuejs.org/posts/vue-3-5#useid). The shared Tailwind, Motion, Tokens, and Overlay Runtime layers are installed through the package dependency graph.

## Public components

`UiButton`, `UiIconButton`, `UiAction`, `UiBreadcrumb`, `UiNavigationItem`, `UiSegmentedControl`, `UiControlSurface`, `UiDock`, `UiSurface`, `UiCard`, `UiInput`, `UiTextarea`, `UiSelect`, `UiCheckbox`, `UiRadioGroup`, `UiSwitch`, `UiField`, `UiPopover`, `UiDropdownMenu`, `UiTable`, `UiDisclosure`, `UiBadge`, `UiStatusIndicator`, `UiSkeleton`, `UiScrollbar`, `UiNotice`, `UiTooltipSurface`, `UiPresence`, `UiTerminalSurface`, `UiTerminalLine`, `UiTerminalTranscript`, `UiTerminalPrompt`, `UiTerminalEcho`, `UiStatCard`, `UiTimeline`, and `UiStepFlow` are exported from the package root.

`UiTooltipSurface` animates its label while keeping the material plate and backdrop blur fully applied from the first frame. Keep opacity and filter animations off its root: they isolate the plate from the real backdrop and make blur appear only after entrance ends. Positioning, trigger state, and disclosure semantics remain consumer-owned.

`UiBadge` sizes `sm` / `md` / `lg` share `--neoverse-badge-font-family` and `--neoverse-badge-font-weight`. Their font sizes follow the shared label scale (13 / 14 / 16px at a 16px root); size-specific line heights and padding retain the existing geometry.

Terminal composition (Aurora Glass window, output lines, scrollback, and native terminal input) is documented in [Terminal composition](../../docs/terminal-composition.md). The embedded transcript uses `scrollbar-immersive`; `UiScrollbar` is reserved for document scrolling. A server-rendered `UiScrollbar` publishes `data-hide-native`, so the native bar disappears on the first paint instead of after hydration; wrapping it in `ClientOnly` keeps the older post-mount swap.

`UiTerminalEcho` displays recorded command `text` with the live prompt's `segments`, `symbol`, `error` state and `#segment` rendering, without an input or tab stop. Capture segment values when committing history; do not bind old commands to the live directory.

## Metrics, milestones, and steps

```vue
<script setup lang="ts">
import { UiStatCard, UiStepFlow, UiTimeline, type StepFlowItem, type TimelineItem } from '@neoverse-ui/vue';

const milestones: readonly TimelineItem[] = [
  { id: 'design', title: 'Design', description: 'Shared contract', time: 'October 1', dateTime: '2026-10-01' },
  { id: 'release', title: 'Release', description: 'Consumer validation', time: 'October 12', dateTime: '2026-10-12' },
];
const steps: readonly StepFlowItem[] = [
  { id: 'plan', title: 'Plan', status: 'complete', statusLabel: 'Completed' },
  { id: 'build', title: 'Build', description: 'Implement the contract', status: 'current', statusLabel: 'Current' },
  { id: 'verify', title: 'Verify', status: 'pending', statusLabel: 'Pending' },
];
</script>

<template>
  <div class="ui-stat-grid">
    <UiStatCard label="Latency" :value="0" unit="ms" footnote="Includes zero-valued metrics" />
    <UiStatCard label="Coverage" :value="98.6" unit="%" trend="+2.4% this month" />
  </div>
  <UiTimeline :items="milestones" aria-label="Milestones" />
  <UiStepFlow :items="steps" aria-label="Delivery steps" />
</template>
```

- `UiStatCard` uses `UiSurface` (`surface="glass-elevated"` by default) and a native definition list. `value` is a string or number, including zero. `unit`, `trend`, and `footnote` are optional text; `label`, `value`, `trend`, and `footnote` named slots customize content. Trend meaning, formatting, and localization belong to the consumer. `.ui-stat-grid` fits two to four cards within the available width and stacks on narrow containers.
- `UiTimeline` is a vertical ordered list; items require a stable unique `id` and `title`, with optional `description`, `time`, and machine-readable `dateTime`. The `#item="{ item, index }"` slot replaces the body without replacing the list or decorative axis. No horizontal variant is exported.
- `UiStepFlow` is a static ordered list, not a stepper controller. Items require a stable unique `id` and `title`, with optional `description`, `status` (`pending`, `current`, `complete`), and localized `statusLabel`. The consumer owns progression and should mark at most one item current. Current items expose `aria-current="step"`; status shapes are distinct and use `statusLabel` as their accessible name when supplied. `#item="{ item, index }"` and `#status="{ item, index }"` customize the body and localized state. Containers below 48rem use vertical steps; wider containers use an equal-width horizontal layout.
- String props are rendered as text, never HTML. All three components reuse existing theme/typography Tokens and introduce no motion. They are Vue Consumer Driven components; React adapters, release visual approval, and real Neoverse-Slides adoption are not claimed.
- Design Lab deep links: `#data-display-stat-card`, `#data-display-timeline`, and `#data-display-step-flow`. Import the packaged stylesheet above for the component selectors and `.ui-stat-grid`.

The responsive step threshold is resolved from the shared Tailwind `--breakpoint-md` at build time (48rem by default); metric minimum width derives from `--neoverse-layout-container-md`. The zero-config `index.css` entry is already compiled. Consumers using the `components.css` / `theme.css` source facades must compile them through Tailwind rather than load the facades as plain browser stylesheets.


## Forms and overlays

```vue
<UiField
  v-slot="{ controlAttrs }"
  control-id="email"
  label="Email"
  description="Used for release notifications."
  :message="emailError"
  :validation="emailError ? 'error' : 'none'"
  required
>
  <UiInput v-bind="controlAttrs" v-model="email" type="email" :validation="emailError ? 'error' : 'none'" />
</UiField>

<UiCheckbox v-model="notifications" name="notifications">Release notifications</UiCheckbox>
<UiPopover aria-label="Project details">
  <template #trigger>Details</template>
  <p>Project details</p>
</UiPopover>
<UiDropdownMenu :items="actions" aria-label="Project actions" @select="onAction">
  <template #trigger>Actions</template>
</UiDropdownMenu>
```

`controlAttrs` contains the supplied `controlId`, rendered description/message IDs through `aria-describedby`, and native `required`/`disabled` flags when enabled. `descriptionId` and `messageId` override the SSR-stable defaults. Bind these attributes to the actual control; ordinary children remain supported without automatic rewriting. Merge any additional consumer description IDs explicitly. Field does not validate values or reset controlled state.

Choice controls use `v-model<boolean>` or `v-model<string | number>` for RadioGroup. Native names and values remain part of form submission; a consumer resetting `v-model` also owns synchronizing its form state. `readonly` keeps controls focusable and prevents changes.

`UiInput type="number"` renders themed up/down buttons while retaining the native numeric input, keyboard arrows, and `min`/`max`/`step` constraints. `increment-label` and `decrement-label` localize their accessible names (defaults: `Increase value` / `Decrease value`). With `step="any"`, buttons change the value by 1 and retain its fractional part. Disabled and readonly inputs disable both buttons.

Popover is non-modal and has no focus trap. Popover/DropdownMenu support `v-model:open`, `default-open`, `disabled`, and placement; Select shares the same positioning runtime. See the repository's form and overlay contracts for dismissal and focus policy.

## Presence

```vue
<script setup lang="ts">
import { UiPresence, presence, staggerStyle } from '@neoverse-ui/vue';
</script>

<UiPresence :show="open" variant="pop" origin="top">Panel content</UiPresence>

<Transition name="nv">
  <span v-if="open" v-bind="presence('rise')">Content</span>
</Transition>
```

`UiPresence` retains its children through the shared exit animation, then unmounts, with a token-based timeout fallback. `presence(variant, origin?)` binds the shared preset attributes to native Vue transitions; `staggerStyle(index, options?)` sets entry delays for `TransitionGroup name="nv"` children. Presets, timing, and reduced-motion behavior belong to `@neoverse-ui/motion`.

For the complete component API and architecture guidance, see the [Neoverse-UI repository](https://github.com/SSJ-ZYJ/Neoverse-UI).
