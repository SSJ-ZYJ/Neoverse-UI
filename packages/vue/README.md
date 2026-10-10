# @neoverse-ui/vue

Vue 3 components for the Neoverse UI design system.

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

`UiButton`, `UiIconButton`, `UiAction`, `UiBreadcrumb`, `UiNavigationItem`, `UiSegmentedControl`, `UiControlSurface`, `UiDock`, `UiSurface`, `UiCard`, `UiInput`, `UiTextarea`, `UiSelect`, `UiCheckbox`, `UiRadioGroup`, `UiSwitch`, `UiField`, `UiPopover`, `UiDropdownMenu`, `UiTable`, `UiDisclosure`, `UiBadge`, `UiStatusIndicator`, `UiSkeleton`, `UiScrollbar`, `UiNotice`, `UiTooltipSurface`, and `UiPresence` are exported from the package root.

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
