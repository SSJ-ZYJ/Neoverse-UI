# @neoverse-ui/motion

## 0.2.2

### Patch Changes

- 7ca8673: Keep open fallback overlay and select panels at their visible resting state in browsers without the Popover API. Include the existing fallback-open classes in the presence selectors, using forgiving `:is()` so an unsupported `:popover-open` does not invalidate them, and retain reduced-motion timing for these panels.
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
- Updated dependencies [8508c04]
- Updated dependencies [ca93ad8]
  - @neoverse-ui/tokens@0.3.1

## 0.2.1

### Patch Changes

- c95d08e: Animate Vue TransitionGroup FLIP transforms so reordered list items move continuously instead of jumping to their new positions.
- Updated dependencies [c95d08e]
- Updated dependencies [c95d08e]
- Updated dependencies [c95d08e]
- Updated dependencies [a2439f4]
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

## Unreleased

### Patch Changes

- Reduced page-transition particle count using wider shared grid spacing.

## 0.2.0

### Minor Changes

- 5674b0f: Establish the 0.2.0 canonical design-system contracts.

  This release line intentionally removes compatibility APIs from 0.1.x: Motion uses semantic roles, Tokens use canonical component and typography namespaces, Glass is reduced to subtle/elevated/immersive, Vue removes UiGlassSurface and the glass-card preset, the Glass runtime drops historical aliases, and theme selection uses data-theme only.

  It also promotes the React adapter and Giscus theme packages to public package boundaries, adds first-class tokenized `UiTable` and `UiDisclosure` contracts across Vue and React, and includes the refined component, material, accessibility, and Design Lab contracts validated for the 0.2.0 migration.

  Motion now owns the shared enter/exit Presence engine and interruptible page View Transitions, including optional WebGL2 Particle Dissolve with capture/synthetic pipelines, crossfade fallback, and reduced-motion handling. Vue exposes `UiPresence`, `presence`, and `staggerStyle`; React exposes `UiPresence` and `useUiPresence`. Framework adapters share Motion presets and lifecycle cleanup rather than defining separate animation recipes.

### Patch Changes

- Updated dependencies [5674b0f]
  - @neoverse-ui/tokens@0.2.0
