# @neoverse-ui/glass-runtime

## 0.2.2

### Patch Changes

- 9052731: Standardize the shared material's display name as Aurora Glass across the Design Lab, current documentation, package descriptions, and style comments. Light, Standard, and Immersive remain tiers of the same material, and Tokens keep the localized Chinese display names for interfaces presented in Chinese.
  
  Export `glassMaterial` from `@neoverse-ui/tokens` so consumer projects can obtain the canonical bilingual material name and tier labels directly. Preserve existing `glass-*` surface values, CSS classes and variables, package names, rendering behavior, and optical values.
  
  Refresh the affected native Windows and Linux desktop/mobile visual baselines for the canonical name, including text wrapping and linked layout changes. Generate Linux captures with the real pinned font responses cached to exclude intermittent CDN fallback rendering; retain the existing screenshot thresholds.
- f2e1bc2: Add shared Aurora Glass edge rendering to inset form controls, disclosures and table
  outlines and visible grid lines. Preserve the table's single backdrop filter,
  native form interactions, clipping, and local Select-panel fallback.
  Avoid the competing dark lower inset shadow on form controls in both themes
  when the WebGL edge is active, while keeping interaction and fallback shadows.
  Keep the table's directional lower catch visible above its last-row cell fills.
- e8bea14: Stop scheduling repeated WebGL edge paints for background-position animations and for transformed/opacity-animated content inside an isolated, fully clipped Glass boundary. The live CSS backdrop keeps rendering that decoration while edge geometry stays unchanged. Preserve tracking for surface/ancestor motion, unclipped content, layout changes, custom properties and unknown effects; resume when clipping changes during an existing animation.
- 7adec09: Keep an Aurora Glass refresh proportional to the surfaces the fixed canvas can
  show. Offscreen surfaces are skipped before computed style and the ancestor
  opacity chain are resolved, the opacity chain is resolved once per frame, and
  repeated occlusion hit tests reuse one per-frame probe cache. Interaction latency
  on pages with many form controls and tables improves, most visibly in WebKit,
  where a document-wide refresh previously resolved style for every surface.
- ca93ad8: Preserve highlight luminance when neutralizing theme chroma in the middle of long
  light Glass surfaces, removing the extra brightness loss between corner catches.
- f32b6ad: Fix Glass runtime builds by typing the per-window CSS feature-detection API.
- a621b25: Restore the 0.2.0 light Glass directional colour, opacity response and normal canvas blending, together with its surface edge densities. Keep dark rendering and CSS-owned body blur unchanged.
  
  Cap the light edge's cool excess. The restored indigo right catch carried a blue lead of roughly three times the red and green content, which read as a blue band over pale pages. Light now trims 72% of that excess before compositing: the mint-to-indigo direction survives, the cast does not. The cap is gated to light surfaces, so dark Glass keeps its response without a change in blend mode, uniforms or canvas output.
  
  The grey-backdrop case in the visual suite bounds how far blue may lead the green and red content, so the cool edge cannot silently regress into a cast.
- ca68501: Keep a continuous, fine light-mode Glass edge while moderately emphasizing its upper-left and lower-right corners.
- fefd23a: Keep the light Aurora Glass rim translucent instead of painting a saturated
  cyan stroke on pale backdrops. The light fragment mixes 70% toward the neutral
  edge light and leaves the theme accents as a 30% tint, the former 1.35 light
  alpha gain is removed, and large light surfaces use 0.36 / 0.38 / 0.40 edge
  opacities. Dark composition, geometry, blur and the 0.34 alpha ceiling are
  unchanged.
- 8508c04: Keep immersive scrollbar thumbs painted in hover and drag states, preserve their
  native padding-box clip, and keep Vue and React document rails visible while the
  pointer rests on them or a drag is held. Restart automatic hiding after the
  interaction ends.
  
  Detect overlapping Glass surfaces that cross an edge between the renderer's
  fixed hit-test points. Pointer-transparent overlays that are guaranteed to be
  above ordinary Glass surfaces can opt into the edge mask with
  `data-neoverse-glass-occluder="topmost"`. The edge shader, backdrop sampling,
  body blur, and optical colours are unchanged.

## 0.2.1

### Patch Changes

- Restore live-backdrop directional RGB edges with theme-aware exposure, clipping and
  circular-surface coverage. Add the explicit `backend: 'native'` SVG displacement
  alternative while retaining the default WebGL path and CSS fallback. Preserve
  live DOM/canvas/video backdrops, reduced-transparency behavior and observer cleanup.

- bf1b739: Add shared Checkbox, RadioGroup, Switch, Field, Popover and DropdownMenu contracts across Vue and React, including validation and readonly states. Field exposes explicit control bindings for accessible descriptions, messages and native required/disabled state.
  
  Require Vue 3.5 or later to match the SSR-stable useId API used by Field and choice controls.
  
  Introduce the framework-independent Overlay Runtime and reuse it for Select positioning and dismiss behavior. Ship the corresponding form/overlay tokens and consumer CSS, validate public exports from packed packages, and harden Glass context recovery and observer cleanup.
  
  Keep controlled overlay state authoritative when a parent rejects a dismiss request, and capture the mounted React panel for listener cleanup.
  
  Use native checkbox checked state for React Switch accessibility so uncontrolled form resets cannot leave stale aria-checked state.

## 0.2.0

### Minor Changes

- 5674b0f: Establish the 0.2.0 canonical design-system contracts.

  This release line intentionally removes compatibility APIs from 0.1.x: Motion uses semantic roles, Tokens use canonical component and typography namespaces, Glass is reduced to subtle/elevated/immersive, Vue removes UiGlassSurface and the glass-card preset, the Glass runtime drops historical aliases, and theme selection uses data-theme only.

  It also promotes the React adapter and Giscus theme packages to public package boundaries, adds first-class tokenized `UiTable` and `UiDisclosure` contracts across Vue and React, and includes the refined component, material, accessibility, and Design Lab contracts validated for the 0.2.0 migration.

  Motion now owns the shared enter/exit Presence engine and interruptible page View Transitions, including optional WebGL2 Particle Dissolve with capture/synthetic pipelines, crossfade fallback, and reduced-motion handling. Vue exposes `UiPresence`, `presence`, and `staggerStyle`; React exposes `UiPresence` and `useUiPresence`. Framework adapters share Motion presets and lifecycle cleanup rather than defining separate animation recipes.
