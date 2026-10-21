# @neoverse-ui/react

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
