# @neoverse-ui/react

## 0.4.0

### Minor Changes

- f32b6ad: Add `triggerVariant` to `UiPopover` and `UiDropdownMenu` so overlay triggers can reuse the shared ghost button classes; the default stays `secondary`.

### Patch Changes

- 3971d18: Close anchored overlays when keyboard focus leaves them. Chromium keeps an open popover when focus walks out of the panel, and the fallback path had no dismissal at all, so Tab past the last item left Select listboxes and DropdownMenu panels open with `aria-expanded` still true. The shared runtime now listens for `focusout` on the document and dismisses when focus lands outside both the panel and its trigger, gated on a real element `relatedTarget` so pointer-driven dismissal is not counted twice.
  
  Release an open Select's overlay tracking when the React adapter unmounts. The runtime holds window `resize`/`scroll` and document `keydown`/`pointerdown` listeners keyed by the panel element; without a cleanup path the React adapter leaked them for the page lifetime, while the Vue adapter already closed on `onBeforeUnmount`.
  
  Restore Vue controlled choice inputs when the parent rejects an update. `UiCheckbox`, `UiSwitch` and the number-input branch bound `:checked`/`:value` directly, so a rejected `update:modelValue` left the native control flipped and, for `UiSwitch`, `aria-checked` out of sync with application state. The adapter now compares against the current prop after the parent's write lands and rolls back only genuinely rejected values.
  
  Give `UiScrollbar` one reference-counted owner for the document-level native hiding class, shared by both adapters. Vue previously removed `ui-scrollbar-target` on every unmount, breaking other mounted instances; React had its own private counter. The shared helper preserves a class that the page already carried.
- 7ca8673: Restore Vue's native composition-aware model updates for UiInput and UiTextarea so unfinished IME text is not committed or overwritten by consumer rerenders. Preserve the existing string-valued number-input updates and native React text-input conventions.
  
  Allow ArrowDown and ArrowUp to enter UiSelect's listbox in Vue and React, focusing the selected enabled option or the first/last enabled option. Associate each combobox with its listbox using SSR-stable IDs, retain controlled selection ownership, and respect prevented consumer key events and disabled/readonly states.
- e8bea14: Keep open anchored overlays aligned when content grows asynchronously or their trigger moves without a window scroll/resize event. Track geometry only while open, avoid position writes when geometry is unchanged, and cancel the animation frame when tracking stops or either element disconnects. Retain native/fallback positioning, CSS zoom compensation and controlled dismissal ownership.
  
  Associate Popover and DropdownMenu triggers with unique panel IDs through `aria-controls` in Vue and React. Generate IDs with each framework's SSR-stable `useId` and retain them through hydration, open/close cycles and rerenders. This does not add modal focus trapping or alter public props.
  
  Explicitly size the transparent native choice input to the full visual row. WebKit otherwise retains its intrinsic checkbox dimensions despite `inset: 0`, leaving the visible Vue Checkbox/Switch label outside the input's hit area. Preserve native focus policies and keyboard interaction.
- b124942: Add 15 React adapters for the existing navigation, feedback, skeleton, terminal, presentation and scrollbar components. React `UiDock` now shares the ControlSurface navigation indicator and supports `navigationIndicator` (enabled by default), matching the existing Vue behavior. Also add React `UiAction.decoration`, allow React `UiSurface.as` to accept any React element type, and export Vue `SkeletonVariant`. Together with the separately documented `UiTerminalEcho` addition, Vue and React each expose the same 36 public components.
  
  Preserve terminal history readers when upward scrolling and a column resize happen together in Vue and React; explicit reading intent cancels pending tail following.
- 8508c04: Keep immersive scrollbar thumbs painted in hover and drag states, preserve their
  native padding-box clip, and keep Vue and React document rails visible while the
  pointer rests on them or a drag is held. Restart automatic hiding after the
  interaction ends.
  
  Detect overlapping Glass surfaces that cross an edge between the renderer's
  fixed hit-test points. Pointer-transparent overlays that are guaranteed to be
  above ordinary Glass surfaces can opt into the edge mask with
  `data-neoverse-glass-occluder="topmost"`. The edge shader, backdrop sampling,
  body blur, and optical colours are unchanged.
- 2e2da45: Hide the document scrollbar on the first paint for server-rendered `UiScrollbar` rails. The rail now publishes `data-hide-native` in markup, and the shipped stylesheet removes the native bar whenever such a rail is in the document, gated by `@media (scripting: enabled)`. Previously the native bar stayed visible until the ownership class was added on mount, so reloading a scrollable page painted a native bar and then swapped it for the immersive rail, shifting layout by the native scrollbar width.
  
  Client-only renders keep the existing post-mount path through `acquireNativeScrollbarHiding`, and pages without scripting keep native bars. `hideNative={false}` still opts out. Consumers that want the first-paint guarantee must render the rail during SSR rather than behind a client-only gate.
- b949ca0: Seat the segmented control's active slider in the selected option's content-sized grid column before hydration. The slider now spans `grid-column: var(--segment-active-column, calc(var(--segment-index) + 1) / span 1)` with a `100%` width and a `0` translation fallback, so a content-sized control no longer paints an equal-width track over the wrong option on the first frame or after a font swap.
  
  Vue and React publish `--segment-active-column: 1 / -1` once they have measured the options, then keep the measured offset and width so later selection changes still animate. The declared `--segment-active-offset` fallback drops from an index-based guess to `0`, which matches the grid column that is already positioned.
- 473c304: Keep Select keyboard entry focus reliable. ArrowDown and ArrowUp now retry the
  option focus across animation frames until it sticks, instead of racing the
  panel's `allow-discrete` display flip, so reopening a panel always lands on the
  selected option.
- 7ca8673: Add `UiTerminalEcho` to Vue and React for recorded commands, with plain-text `text`, prompt `symbol` and `segments`, an `error` state, and custom segment rendering. Export Vue `TerminalEchoProps` and React `UiTerminalEchoProps`.
  
  Add shared `.ui-terminal-echo` styling in Tailwind, also distributed through the Vue and React stylesheets. Recorded commands reuse prompt context and terminal tokens without an input, caret or focus target, while retaining text selection, wrapping and forced-colors support. This adds a read-only display component; it does not replace or change the live `UiTerminalPrompt` API.
- 58a2416: Add a Vue `UiTerminalSurface` `#header` slot and equivalent optional React `header` prop for consumer-owned window chrome. Custom content replaces only the shared header's contents, without duplicating fallback title, status or actions. The header element, material, padding, accessible surface label and body remain shared and unchanged; absent Vue slots and nullish React props retain the existing header.
- Updated dependencies [fefd23a]
- Updated dependencies [3971d18]
- Updated dependencies [ca93ad8]
- Updated dependencies [f2e1bc2]
- Updated dependencies [b10d0aa]
- Updated dependencies [2e2da45]
- Updated dependencies [7ca8673]
- Updated dependencies [3f188b8]
- Updated dependencies [ca68501]
- Updated dependencies [e8bea14]
- Updated dependencies [8508c04]
- Updated dependencies [2e2da45]
- Updated dependencies [b949ca0]
- Updated dependencies [ca93ad8]
- Updated dependencies [fefd23a]
- Updated dependencies [7ca8673]
  - @neoverse-ui/tailwind@0.3.1
  - @neoverse-ui/overlay-runtime@0.3.1
  - @neoverse-ui/motion@0.2.2

## 0.3.0

### Minor Changes

- bf1b739: Add shared Checkbox, RadioGroup, Switch, Field, Popover and DropdownMenu contracts across Vue and React, including validation and readonly states. Field exposes explicit control bindings for accessible descriptions, messages and native required/disabled state.
  
  Require Vue 3.5 or later to match the SSR-stable useId API used by Field and choice controls.
  
  Introduce the framework-independent Overlay Runtime and reuse it for Select positioning and dismiss behavior. Ship the corresponding form/overlay tokens and consumer CSS, validate public exports from packed packages, and harden Glass context recovery and observer cleanup.
  
  Keep controlled overlay state authoritative when a parent rejects a dismiss request, and capture the mounted React panel for listener cleanup.
  
  Use native checkbox checked state for React Switch accessibility so uncontrolled form resets cannot leave stale aria-checked state.
- c95d08e: Remove the separate chrome surface and use glass-subtle for Dock by default, retaining Dock grouping and embedded control geometry. Explicit surface="chrome" and ui-surface-chrome consumers must migrate to glass-subtle and material-glass-subtle. Remove the chrome-specific material/effect tokens and TypeScript exports; use shared Glass material and control-surface geometry tokens instead. No compatibility aliases are retained.

### Patch Changes

- c95d08e: Use `glass-elevated` as the default Glass tier for `UiDock` in both adapters. Explicit `surface` choices remain unchanged.
- 86416ac: Calculate anchored overlay placement with zoom-scaled rendered dimensions; keep Popover and DropdownMenu `aria-expanded` aligned with disabled visibility in Vue and React, and avoid focusing hidden menu items.
- a7a5891: Synchronize Select popover visibility, accessibility state, and overlay tracking when disabled or readonly props change while open.
- c95d08e: Replace native number-input spinners with token-driven chevron buttons in Vue and React. Preserve native numeric input, min/max/step constraints and form events; expose incrementLabel/decrementLabel for accessible localized labels.
- Updated dependencies [c95d08e]
- Updated dependencies [dd5f374]
- Updated dependencies [c95d08e]
- Updated dependencies [c95d08e]
- Updated dependencies [a2439f4]
- Updated dependencies [c95d08e]
- Updated dependencies [c95d08e]
- Updated dependencies [c95d08e]
- Updated dependencies [bf1b739]
- Updated dependencies [bf1b739]
- Updated dependencies [c95d08e]
- Updated dependencies [86416ac]
- Updated dependencies [a28b636]
- Updated dependencies [c95d08e]
- Updated dependencies [bf1b739]
- Updated dependencies [c95d08e]
- Updated dependencies [a2439f4]
- Updated dependencies [c95d08e]
- Updated dependencies [c95d08e]
- Updated dependencies [c95d08e]
- Updated dependencies [c95d08e]
  - @neoverse-ui/tailwind@0.3.0
  - @neoverse-ui/overlay-runtime@0.3.0
  - @neoverse-ui/motion@0.2.1

## 0.2.0

### Minor Changes

- 5674b0f: Establish the 0.2.0 canonical design-system contracts.

  This release line intentionally removes compatibility APIs from 0.1.x: Motion uses semantic roles, Tokens use canonical component and typography namespaces, Glass is reduced to subtle/elevated/immersive, Vue removes UiGlassSurface and the glass-card preset, the Glass runtime drops historical aliases, and theme selection uses data-theme only.

  It also promotes the React adapter and Giscus theme packages to public package boundaries, adds first-class tokenized `UiTable` and `UiDisclosure` contracts across Vue and React, and includes the refined component, material, accessibility, and Design Lab contracts validated for the 0.2.0 migration.

  Motion now owns the shared enter/exit Presence engine and interruptible page View Transitions, including optional WebGL2 Particle Dissolve with capture/synthetic pipelines, crossfade fallback, and reduced-motion handling. Vue exposes `UiPresence`, `presence`, and `staggerStyle`; React exposes `UiPresence` and `useUiPresence`. Framework adapters share Motion presets and lifecycle cleanup rather than defining separate animation recipes.

### Patch Changes

- Updated dependencies [5674b0f]
  - @neoverse-ui/motion@0.2.0
  - @neoverse-ui/tailwind@0.2.0
