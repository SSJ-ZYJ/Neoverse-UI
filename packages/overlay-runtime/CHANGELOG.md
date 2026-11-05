# @neoverse-ui/overlay-runtime

## 0.3.1

### Patch Changes

- 3971d18: Close anchored overlays when keyboard focus leaves them. Chromium keeps an open popover when focus walks out of the panel, and the fallback path had no dismissal at all, so Tab past the last item left Select listboxes and DropdownMenu panels open with `aria-expanded` still true. The shared runtime now listens for `focusout` on the document and dismisses when focus lands outside both the panel and its trigger, gated on a real element `relatedTarget` so pointer-driven dismissal is not counted twice.
  
  Release an open Select's overlay tracking when the React adapter unmounts. The runtime holds window `resize`/`scroll` and document `keydown`/`pointerdown` listeners keyed by the panel element; without a cleanup path the React adapter leaked them for the page lifetime, while the Vue adapter already closed on `onBeforeUnmount`.
  
  Restore Vue controlled choice inputs when the parent rejects an update. `UiCheckbox`, `UiSwitch` and the number-input branch bound `:checked`/`:value` directly, so a rejected `update:modelValue` left the native control flipped and, for `UiSwitch`, `aria-checked` out of sync with application state. The adapter now compares against the current prop after the parent's write lands and rolls back only genuinely rejected values.
  
  Give `UiScrollbar` one reference-counted owner for the document-level native hiding class, shared by both adapters. Vue previously removed `ui-scrollbar-target` on every unmount, breaking other mounted instances; React had its own private counter. The shared helper preserves a class that the page already carried.
- 3f188b8: Clamp anchored overlays to the nominal layout viewport instead of the
  document's expanded overflow. A panel that reaches the right or bottom edge no
  longer escapes the visible area on layouts whose viewport grows with the
  scrollable content.
- ca68501: Keep fallback overlay coordinates aligned after their presence entrance finishes. Containing-block correction now excludes the panel's own CSS scale and translate, including its transform origin and CSS zoom, instead of treating that intentional visual motion as an ancestor offset. Previously opening a scaled panel could permanently shift its resting position by several pixels, even when the trigger never moved.
  
  Preserve the existing native-popover path, viewport clamping, asynchronous geometry tracking and normal entrance motion. No adapter props or public exports change.
- e8bea14: Keep open anchored overlays aligned when content grows asynchronously or their trigger moves without a window scroll/resize event. Track geometry only while open, avoid position writes when geometry is unchanged, and cancel the animation frame when tracking stops or either element disconnects. Retain native/fallback positioning, CSS zoom compensation and controlled dismissal ownership.
  
  Associate Popover and DropdownMenu triggers with unique panel IDs through `aria-controls` in Vue and React. Generate IDs with each framework's SSR-stable `useId` and retain them through hydration, open/close cycles and rerenders. This does not add modal focus trapping or alter public props.
  
  Explicitly size the transparent native choice input to the full visual row. WebKit otherwise retains its intrinsic checkbox dimensions despite `inset: 0`, leaving the visible Vue Checkbox/Switch label outside the input's hit area. Preserve native focus policies and keyboard interaction.

## 0.3.0

### Minor Changes

- bf1b739: Add shared Checkbox, RadioGroup, Switch, Field, Popover and DropdownMenu contracts across Vue and React, including validation and readonly states. Field exposes explicit control bindings for accessible descriptions, messages and native required/disabled state.
  
  Require Vue 3.5 or later to match the SSR-stable useId API used by Field and choice controls.
  
  Introduce the framework-independent Overlay Runtime and reuse it for Select positioning and dismiss behavior. Ship the corresponding form/overlay tokens and consumer CSS, validate public exports from packed packages, and harden Glass context recovery and observer cleanup.
  
  Keep controlled overlay state authoritative when a parent rejects a dismiss request, and capture the mounted React panel for listener cleanup.
  
  Use native checkbox checked state for React Switch accessibility so uncontrolled form resets cannot leave stale aria-checked state.

### Patch Changes

- dd5f374: Correct fallback anchored-overlay coordinates when a translucent or filtered ancestor establishes the containing block for a fixed overlay. Preserve native Popover positioning and existing visual styles.
- 86416ac: Calculate anchored overlay placement with zoom-scaled rendered dimensions; keep Popover and DropdownMenu `aria-expanded` aligned with disabled visibility in Vue and React, and avoid focusing hidden menu items.
