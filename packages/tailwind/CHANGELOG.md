# @neoverse-ui/tailwind

## 0.3.1

### Patch Changes

- fefd23a: Add a shared compact floating elevation for form controls, disclosures and the
  table. `--neoverse-shadow-float` combines a close contact layer with a short
  ambient falloff in both themes, and the Input, Textarea, Select, Disclosure and
  UiTable recipes alias it alongside their existing edge and Light-tier bloom.
  Choice plates keep the smaller shared control elevation; button, navigation and
  segmented-control shadows are unchanged.
- ca93ad8: Give Glass form controls a subtle shared elevation in light and dark themes,
  including the resizable textarea shell, while preserving their edge and state
  feedback.
- f2e1bc2: Add shared Aurora Glass edge rendering to inset form controls, disclosures and table
  outlines and visible grid lines. Preserve the table's single backdrop filter,
  native form interactions, clipping, and local Select-panel fallback.
  Avoid the competing dark lower inset shadow on form controls in both themes
  when the WebGL edge is active, while keeping interaction and fallback shadows.
  Keep the table's directional lower catch visible above its last-row cell fills.
- b10d0aa: Add an opt-in painted stroke for Aurora Glass surfaces anchored to the window edge, where a dark backdrop cannot supply enough light for a readable refracted silhouette. Set `data-neoverse-glass-edge-stroke` on a `material-glass-subtle`, `material-glass-elevated` or `material-glass-immersive` surface to enable it; button surfaces are excluded.
  
  Publish `--neoverse-material-edge-stroke` with a transparent default and a dark-theme inset border plus top highlight. The stroke composes with the CSS material shadows, remains present with the native or WebGL renderer, and survives the reduced-transparency fallback. Surfaces without the attribute retain their existing appearance.
- 2e2da45: Unify the native `scrollbar-immersive` utility with the `UiScrollbar` overlay so a scrollable container and the document read as one control. The utility now keeps the overlay lane width, thumb widths, ink ladder, and inset edge highlight from the shared `--neoverse-scrollbar-*` tokens, and the lane stays transparent so the canvas shows through as it does behind the overlay.
  
  Chromium silently ignores `::-webkit-scrollbar` styling as soon as `scrollbar-width` or `scrollbar-color` is declared, which flattened the immersive rail to the platform "thin" bar with a painted track. The standard properties are now scoped to `@supports not selector(::-webkit-scrollbar)`, so Chromium and Safari keep the token-driven rail and only engines without the pseudo-elements receive the standard fallback.
  
  The rail palette is rebuilt as one neutral ink instead of a lit object. The former three-stop `edge-light` → accent gradient washed out to near-white on light glass, turned distinctly cyan at the bottom on dark glass, and its 12px accent bloom hazed the content underneath. The thumb is now a flat ink derived from `text-secondary` (44% rest, 60% hover) that darkens in light themes and lifts in dark ones, and accent reaches the grip only while dragging. Outer shadows are gone because they paint a stray arc around the native thumb cap; the only remaining shadow is a 1px inset crown.
  
  Tokens replace `--neoverse-scrollbar-immersive-track-border-width` with `--neoverse-scrollbar-immersive-rail-inset`, derive `--neoverse-scrollbar-immersive-thumb-border-width` from `--neoverse-scrollbar-overlay-thumb-width`, and add `--neoverse-scrollbar-immersive-thumb-hover-border-width` for the expanded thumb. `--neoverse-effect-rail-thumb-glow`, `--neoverse-effect-rail-thumb-hover-shadow`, their `--neoverse-scrollbar-*` aliases, and the `thumbGlow` / `thumbHoverShadow` map entries are removed; consumers that overrode them should set the ink tokens instead. Consumers that overrode the removed track-border token should set the rail inset instead, and overriding either overlay thumb width now moves both rails together.
  
  The Playground scrollbar module documents the shared geometry, lists the thumb width tokens, and describes the hover and drag states the palette actually renders.
- e8bea14: Keep open anchored overlays aligned when content grows asynchronously or their trigger moves without a window scroll/resize event. Track geometry only while open, avoid position writes when geometry is unchanged, and cancel the animation frame when tracking stops or either element disconnects. Retain native/fallback positioning, CSS zoom compensation and controlled dismissal ownership.
  
  Associate Popover and DropdownMenu triggers with unique panel IDs through `aria-controls` in Vue and React. Generate IDs with each framework's SSR-stable `useId` and retain them through hydration, open/close cycles and rerenders. This does not add modal focus trapping or alter public props.
  
  Explicitly size the transparent native choice input to the full visual row. WebKit otherwise retains its intrinsic checkbox dimensions despite `inset: 0`, leaving the visible Vue Checkbox/Switch label outside the input's hit area. Preserve native focus policies and keyboard interaction.
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
- ca93ad8: Keep segmented option hover on the neutral foreground instead of borrowing the
  selected accent, and hold both that label color and the hover wash through press so
  only the press shadow and scale respond. The selected accent is reserved for the
  active option via `cssVariables.components.segmentedControl.hoverForeground`.
- fefd23a: Stop the table from painting a duplicated lower line below the shared renderer's
  bottom rim. The final row's local inset catch and the table's CSS edge highlight
  are now limited to the CSS edge path; while the WebGL/native renderer owns the
  perimeter, the shared canvas supplies the bottom rim and the local catch is
  hidden in both themes. The explicit `data-neoverse-glass-edge-pass="css"`
  fallback, tables inside a native top layer, the table grid lines and the tier
  fills are unchanged.
- 7ca8673: Add `UiTerminalEcho` to Vue and React for recorded commands, with plain-text `text`, prompt `symbol` and `segments`, an `error` state, and custom segment rendering. Export Vue `TerminalEchoProps` and React `UiTerminalEchoProps`.
  
  Add shared `.ui-terminal-echo` styling in Tailwind, also distributed through the Vue and React stylesheets. Recorded commands reuse prompt context and terminal tokens without an input, caret or focus target, while retaining text selection, wrapping and forced-colors support. This adds a read-only display component; it does not replace or change the live `UiTerminalPrompt` API.
- Updated dependencies [9052731]
- Updated dependencies [fefd23a]
- Updated dependencies [243c24a]
- Updated dependencies [b949ca0]
- Updated dependencies [ca93ad8]
- Updated dependencies [f2e1bc2]
- Updated dependencies [b10d0aa]
- Updated dependencies [2e2da45]
- Updated dependencies [a621b25]
- Updated dependencies [fefd23a]
- Updated dependencies [ca93ad8]
- Updated dependencies [f2e1bc2]
- Updated dependencies [7ca8673]
- Updated dependencies [8508c04]
- Updated dependencies [ca93ad8]
  - @neoverse-ui/tokens@0.3.1
  - @neoverse-ui/motion@0.2.2

## 0.3.0

### Minor Changes

- bf1b739: Add shared Checkbox, RadioGroup, Switch, Field, Popover and DropdownMenu contracts across Vue and React, including validation and readonly states. Field exposes explicit control bindings for accessible descriptions, messages and native required/disabled state.
  
  Require Vue 3.5 or later to match the SSR-stable useId API used by Field and choice controls.
  
  Introduce the framework-independent Overlay Runtime and reuse it for Select positioning and dismiss behavior. Ship the corresponding form/overlay tokens and consumer CSS, validate public exports from packed packages, and harden Glass context recovery and observer cleanup.
  
  Keep controlled overlay state authoritative when a parent rejects a dismiss request, and capture the mounted React panel for listener cleanup.
  
  Use native checkbox checked state for React Switch accessibility so uncontrolled form resets cannot leave stale aria-checked state.
- a28b636: Add Vue consumer-driven UiStatCard, UiTimeline, and UiStepFlow presentation components with public prop/item types and shared themed CSS.
  
  Metric cards reuse UiSurface Glass and display typography with optional units, trends, footnotes, and a responsive grid. Timelines retain ordered-list and date semantics with a continuous vertical axis. Step flows support localized optional state, current-step semantics, and container-responsive horizontal/vertical layouts without owning progression.
  
  Release visual gates and real Neoverse-Slides adoption are validated in docs/acceptance-2026-10-13.md. Package publication remains a separate step.
- c95d08e: Remove the separate chrome surface and use glass-subtle for Dock by default, retaining Dock grouping and embedded control geometry. Explicit surface="chrome" and ui-surface-chrome consumers must migrate to glass-subtle and material-glass-subtle. Remove the chrome-specific material/effect tokens and TypeScript exports; use shared Glass material and control-surface geometry tokens instead. No compatibility aliases are retained.
- a2439f4: Add theme-aware terminal roles and reusable Vue terminal Surface, Line, Transcript, and Prompt compositions. A Tokyo Night-inspired context with full-height shade bands, rounded joins, theme-derived segment colors, and customizable segment content accompanies a borderless native command editor. No third-party theme code or fonts are bundled.
  
  Use the Maple code-font role throughout the terminal, preferring Maple Mono NF CN for consistent Chinese and Latin glyphs when installed.

### Patch Changes

- c95d08e: Redesign Checkbox, RadioGroup and Switch with a pale blue selected field and blue-grey marks in light mode, a translucent blue wash and white marks in dark mode, a smaller radio dot and a porcelain Switch thumb. Preserve neutral unchecked/disabled states, reduced-transparency fallbacks, outer geometry, native form semantics and shared token ownership.
- c95d08e: Unify all five Badge variants across light and dark themes, including neutral fill and border strength. Remove the light-only white backing and expose semantic foreground tokens for each status variant without changing Badge geometry. Use vivid midtone status ink in light mode. Add shared Light Glass background blur with an override token and opaque accessibility fallbacks.
- c95d08e: Restore light-theme segmented options and grouped buttons to the 0.2.0 compact-control radius.
- a2439f4: Use readable control sizes at a normal consumer root font size. Align button/action sizes, navigation and segmented labels, form typography, and scaled grouped controls without relying on Playground root enlargement.
- c95d08e: Preserve Dock language controls at their 0.2.0 proportions while keeping them vertically centered. Enlarge standalone segmented-control insets without changing embedded control geometry or typography. Keep segmented-control selection plates still until their initial measurements finish, preserving transitions for subsequent user input.
- c95d08e: Set Dock md/lg scales to 1.1/1.3 with a restrained navigation label scale through shared tokens. Keep Playground standard and compact examples aligned with the consumer's md scale without changing generic ControlSurface sizing.
- bf1b739: Make primary and secondary buttons translucent with theme-specific frosted fills and backdrop blur, preserving ghost-button and disabled-link states.
- c95d08e: Add a large `UiBadge` size and show it in the Design Lab. Share one token-driven font family and weight across all sizes while retaining the existing size and spacing progression.
- bf1b739: Unify skeleton placeholders on a translucent neutral frosted material with background blur. Reuse ancestor Glass blur for nested placeholders to avoid hundreds of additional filters in dense grids. Keep reduced-transparency and forced-colors fallbacks opaque.
  
  Allow rectangular placeholders to honor custom heights below the text-line minimum while retaining a default height when none is supplied.
- c95d08e: Use circular stage markers and the shared info Badge for the current StepFlow status instead of a vertical accent inside its content card. Preserve step semantics, completion checks, custom status slots, and responsive layout.
- c95d08e: Replace native number-input spinners with token-driven chevron buttons in Vue and React. Preserve native numeric input, min/max/step constraints and form events; expose incrementLabel/decrementLabel for accessible localized labels.
- c95d08e: Keep tooltip backdrop blur fully applied from the first entrance frame by animating only the label and leaving the material sampling root clear.
- c95d08e: Match ControlSurface and Dock trailing-group side insets to standalone segmented controls. Derive horizontal clearance from the shared segmented inset and boundary while retaining embedded control height, vertical spacing, and typography.
- c95d08e: Render TooltipSurface's rounded body and downward pointer as one clipped Glass plate in browsers supporting CSS shape(). Share backdrop sampling and the existing refractive contour, removing the separate pointer fill and the rectangular shadow seam. Preserve pointer position, layout geometry, and opaque accessibility fallbacks.
  
  Release the veil entrance filter after playback so the unified plate can keep sampling the real background in gradient and neutral previews.
  
  Mask the filtered output to the rounded body and pointer so the empty strip beside the pointer cannot blur the surrounding backdrop, including the reduced-transparency preview.
  
  Use explicit horizontal and vertical mask coordinates so every mask tile retains its intended position and the right side remains fully covered.
- Updated dependencies [c95d08e]
- Updated dependencies [c95d08e]
- Updated dependencies [c95d08e]
- Updated dependencies [a2439f4]
- Updated dependencies [c95d08e]
- Updated dependencies [c95d08e]
- Updated dependencies [c95d08e]
- Updated dependencies [bf1b739]
- Updated dependencies [bf1b739]
- Updated dependencies [c95d08e]
- Updated dependencies [c95d08e]
- Updated dependencies [c95d08e]
- Updated dependencies [c1af554]
- Updated dependencies [c95d08e]
- Updated dependencies [bf1b739]
- Updated dependencies [a2439f4]
- Updated dependencies [f2500fe]
- Updated dependencies [c95d08e]
- Updated dependencies [c95d08e]
  - @neoverse-ui/tokens@0.3.0
  - @neoverse-ui/motion@0.2.1

## Unreleased

- Restore the 0.1.0 Badge border, quiet tint and shared Glass shadow composition,
  with uniform geometry across variants and pastel light-mode fields.
- Keep text-only validation, terminal feedback and destructive menu items readable
  with the lighter semantic status palette.

## 0.2.0

### Minor Changes

- 5674b0f: Establish the 0.2.0 canonical design-system contracts.

  This release line intentionally removes compatibility APIs from 0.1.x: Motion uses semantic roles, Tokens use canonical component and typography namespaces, Glass is reduced to subtle/elevated/immersive, Vue removes UiGlassSurface and the glass-card preset, the Glass runtime drops historical aliases, and theme selection uses data-theme only.

  It also promotes the React adapter and Giscus theme packages to public package boundaries, adds first-class tokenized `UiTable` and `UiDisclosure` contracts across Vue and React, and includes the refined component, material, accessibility, and Design Lab contracts validated for the 0.2.0 migration.

  Motion now owns the shared enter/exit Presence engine and interruptible page View Transitions, including optional WebGL2 Particle Dissolve with capture/synthetic pipelines, crossfade fallback, and reduced-motion handling. Vue exposes `UiPresence`, `presence`, and `staggerStyle`; React exposes `UiPresence` and `useUiPresence`. Framework adapters share Motion presets and lifecycle cleanup rather than defining separate animation recipes.

### Patch Changes

- Updated dependencies [5674b0f]
  - @neoverse-ui/tokens@0.2.0
  - @neoverse-ui/motion@0.2.0
