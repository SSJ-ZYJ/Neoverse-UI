# @neoverse-ui/tokens

## 0.3.0

### Minor Changes

- bf1b739: Add shared Checkbox, RadioGroup, Switch, Field, Popover and DropdownMenu contracts across Vue and React, including validation and readonly states. Field exposes explicit control bindings for accessible descriptions, messages and native required/disabled state.
  
  Require Vue 3.5 or later to match the SSR-stable useId API used by Field and choice controls.
  
  Introduce the framework-independent Overlay Runtime and reuse it for Select positioning and dismiss behavior. Ship the corresponding form/overlay tokens and consumer CSS, validate public exports from packed packages, and harden Glass context recovery and observer cleanup.
  
  Keep controlled overlay state authoritative when a parent rejects a dismiss request, and capture the mounted React panel for listener cleanup.
  
  Use native checkbox checked state for React Switch accessibility so uncontrolled form resets cannot leave stale aria-checked state.
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
- c95d08e: Keep light Disclosure edges on the shared directional Glass highlights instead of stacking a dark inset outline. Preserve dark-theme edges and existing hover, press, open, and blur behavior.
- c95d08e: Use softer coral and mint text roles for light-mode error and success feedback instead of the dark status foreground palette.
- c1af554: Fix Maple Mono webfont source descriptors so browsers load the shipped monospace fallback when Maple Mono NF CN is not installed, instead of discarding the font source and falling back to Chinese sans text.
- bf1b739: Unify skeleton placeholders on a translucent neutral frosted material with background blur. Reuse ancestor Glass blur for nested placeholders to avoid hundreds of additional filters in dense grids. Keep reduced-transparency and forced-colors fallbacks opaque.
  
  Allow rectangular placeholders to honor custom heights below the text-line minimum while retaining a default height when none is supplied.
- f2500fe: Use the existing darker mint palette role for the light terminal command marker and cursor so they remain readable on pale Glass backdrops, while keeping dark terminal colors unchanged. Add explicit Light, Dark, System and dynamic-theme contrast regression coverage.
- c95d08e: Replace native number-input spinners with token-driven chevron buttons in Vue and React. Preserve native numeric input, min/max/step constraints and form events; expose incrementLabel/decrementLabel for accessible localized labels.
- c95d08e: Match ControlSurface and Dock trailing-group side insets to standalone segmented controls. Derive horizontal clearance from the shared segmented inset and boundary while retaining embedded control height, vertical spacing, and typography.

## Unreleased

- Restore the released Badge surface/shadow recipes and remove the added outline.
- Use pastel blue, mint, yellow and pink for light semantic status colours, paired
  with contrasting foregrounds and shared text-only feedback roles. Dark colours
  remain unchanged.

## 0.2.0

### Minor Changes

- 5674b0f: Establish the 0.2.0 canonical design-system contracts.

  This release line intentionally removes compatibility APIs from 0.1.x: Motion uses semantic roles, Tokens use canonical component and typography namespaces, Glass is reduced to subtle/elevated/immersive, Vue removes UiGlassSurface and the glass-card preset, the Glass runtime drops historical aliases, and theme selection uses data-theme only.

  It also promotes the React adapter and Giscus theme packages to public package boundaries, adds first-class tokenized `UiTable` and `UiDisclosure` contracts across Vue and React, and includes the refined component, material, accessibility, and Design Lab contracts validated for the 0.2.0 migration.

  Motion now owns the shared enter/exit Presence engine and interruptible page View Transitions, including optional WebGL2 Particle Dissolve with capture/synthetic pipelines, crossfade fallback, and reduced-motion handling. Vue exposes `UiPresence`, `presence`, and `staggerStyle`; React exposes `UiPresence` and `useUiPresence`. Framework adapters share Motion presets and lifecycle cleanup rather than defining separate animation recipes.
