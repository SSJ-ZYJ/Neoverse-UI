# @neoverse-ui/tokens

## 0.3.1

### Patch Changes

- 9052731: Standardize the shared material's display name as Aurora Glass across the Design Lab, current documentation, package descriptions, and style comments. Light, Standard, and Immersive remain tiers of the same material, and Tokens keep the localized Chinese display names for interfaces presented in Chinese.
  
  Export `glassMaterial` from `@neoverse-ui/tokens` so consumer projects can obtain the canonical bilingual material name and tier labels directly. Preserve existing `glass-*` surface values, CSS classes and variables, package names, rendering behavior, and optical values.
  
  Refresh the affected native Windows and Linux desktop/mobile visual baselines for the canonical name, including text wrapping and linked layout changes. Generate Linux captures with the real pinned font responses cached to exclude intermittent CDN fallback rendering; retain the existing screenshot thresholds.
- fefd23a: Add a shared compact floating elevation for form controls, disclosures and the
  table. `--neoverse-shadow-float` combines a close contact layer with a short
  ambient falloff in both themes, and the Input, Textarea, Select, Disclosure and
  UiTable recipes alias it alongside their existing edge and Light-tier bloom.
  Choice plates keep the smaller shared control elevation; button, navigation and
  segmented-control shadows are unchanged.
- 243c24a: Add the missing `components.controlSurface.trailingPadding` entry to the public token-name map. The `--neoverse-control-surface-trailing-padding` variable was already defined in the token CSS and consumed by the Tailwind ControlSurface rules, but consumers could not reference it by name from `cssVariables`. This is an additive type-level change; existing keys are unchanged.
  
  The React adapter also gains shared `resolveAriaInvalid` and `ButtonMaterialShell` internals, and the glass-runtime `backend` option now documents that `webgl` and `auto` select the same rendering path. Neither changes public behaviour, so no version bump is recorded for those packages.
- b949ca0: Publish `--neoverse-material-edge-refraction-blend` for the dark Glass edge, so a refraction pass reads `overlay` there and keeps the light theme's default `normal` composition. The value follows the existing `--neoverse-material-edge-refraction-gain` hook: both are theme-level edge optics that consumers apply themselves, and neither changes any shipped component by itself.
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
- a621b25: Restore the 0.2.0 light Glass directional colour, opacity response and normal canvas blending, together with its surface edge densities. Keep dark rendering and CSS-owned body blur unchanged.
  
  Cap the light edge's cool excess. The restored indigo right catch carried a blue lead of roughly three times the red and green content, which read as a blue band over pale pages. Light now trims 72% of that excess before compositing: the mint-to-indigo direction survives, the cast does not. The cap is gated to light surfaces, so dark Glass keeps its response without a change in blend mode, uniforms or canvas output.
  
  The grey-backdrop case in the visual suite bounds how far blue may lead the green and red content, so the cool edge cannot silently regress into a cast.
- fefd23a: Keep the light Aurora Glass rim translucent instead of painting a saturated
  cyan stroke on pale backdrops. The light fragment mixes 70% toward the neutral
  edge light and leaves the theme accents as a 30% tint, the former 1.35 light
  alpha gain is removed, and large light surfaces use 0.36 / 0.38 / 0.40 edge
  opacities. Dark composition, geometry, blur and the 0.34 alpha ceiling are
  unchanged.
- ca93ad8: Restore the light segmented control's 0.3.0 selected-button outline and gradient
  while preserving the current global accent and dark theme treatment.
- f2e1bc2: Refresh the light theme's primary accent with a clearer azure blue and coordinated
  hover and active colors. Derive soft accents, interactive borders and focus rings
  from the primary accent so they follow the shared theme color.
- 8508c04: Keep immersive scrollbar thumbs painted in hover and drag states, preserve their
  native padding-box clip, and keep Vue and React document rails visible while the
  pointer rests on them or a drag is held. Restart automatic hiding after the
  interaction ends.
  
  Detect overlapping Glass surfaces that cross an edge between the renderer's
  fixed hit-test points. Pointer-transparent overlays that are guaranteed to be
  above ordinary Glass surfaces can opt into the edge mask with
  `data-neoverse-glass-occluder="topmost"`. The edge shader, backdrop sampling,
  body blur, and optical colours are unchanged.
- ca93ad8: Keep segmented option hover on the neutral foreground instead of borrowing the
  selected accent, and hold both that label color and the hover wash through press so
  only the press shadow and scale respond. The selected accent is reserved for the
  active option via `cssVariables.components.segmentedControl.hoverForeground`.

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
