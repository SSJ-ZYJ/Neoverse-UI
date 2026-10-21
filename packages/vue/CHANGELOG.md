# @neoverse-ui/vue

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

- c95d08e: Use `glass-elevated` as the default Glass tier for `UiDock` in both adapters. Explicit `surface` choices remain unchanged.
- c95d08e: Preserve Dock language controls at their 0.2.0 proportions while keeping them vertically centered. Enlarge standalone segmented-control insets without changing embedded control geometry or typography. Keep segmented-control selection plates still until their initial measurements finish, preserving transitions for subsequent user input.
- c95d08e: Add a large `UiBadge` size and show it in the Design Lab. Share one token-driven font family and weight across all sizes while retaining the existing size and spacing progression.
- 86416ac: Calculate anchored overlay placement with zoom-scaled rendered dimensions; keep Popover and DropdownMenu `aria-expanded` aligned with disabled visibility in Vue and React, and avoid focusing hidden menu items.
- a7a5891: Synchronize Select popover visibility, accessibility state, and overlay tracking when disabled or readonly props change while open.
- c95d08e: Use circular stage markers and the shared info Badge for the current StepFlow status instead of a vertical accent inside its content card. Preserve step semantics, completion checks, custom status slots, and responsive layout.
- a28b636: Preserve terminal transcript following when viewport reflow emits native scroll events before ResizeObserver. Existing readers keep their position; a transcript that was following the bottom continues through consumer column and content reflow without requiring another command.
- c95d08e: Replace native number-input spinners with token-driven chevron buttons in Vue and React. Preserve native numeric input, min/max/step constraints and form events; expose incrementLabel/decrementLabel for accessible localized labels.
- c95d08e: Keep tooltip backdrop blur fully applied from the first entrance frame by animating only the label and leaving the material sampling root clear.
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
