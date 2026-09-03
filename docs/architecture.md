# Architecture

## Workspace principles

The repository uses Bun workspaces declared in the root `package.json`. Internal dependencies use `workspace:*`. There is no task orchestrator: root scripts call Bun workspace scripts in dependency order.

Published packages are ESM-only and emit only the artifacts their public contract requires. TypeScript packages emit declarations and source maps. CSS packages publish compiled CSS from `dist`.

## Package responsibilities

### `@neoverse-ui/tokens`

Owns raw design-token CSS Variables and TypeScript names for colors, geometry, layout, typography, Material effects, Motion values, and component contracts. It has no workspace dependencies. Its CSS output is consumed by the Tailwind and Motion packages.

The source layers are intentionally separated:

```text
src/
  primitives.css  semantic.css  geometry.css  typography.css
  material.css    layout.css     motion.css
  components/
    shared-control.css  button.css  segmented-control.css
    badge.css            skeleton.css scrollbar.css
  themes/
    light.css            dark.css
```

`semantic.css` contains only generic, theme-invariant relationships and the semantic contract. Button, SegmentedControl, Badge, Skeleton, and Scrollbar variables are owned by their component files. `themes/light.css` contains the light mapping; `themes/dark.css` is a selector-free canonical declaration body. The token build wraps that body for both explicit dark and system dark, so runtime theme selectors stay compatible without maintaining duplicate dark values. The generated public entry remains `@neoverse-ui/tokens/css`; source component and theme files are not separate package exports.

`cssVariables.components` mirrors the source ownership. The older flat `cssVariables.control` map and top-level `scrollbar`/`skeleton` maps remain compatibility aliases and are not removed or renamed.

### `@neoverse-ui/tailwind`

Owns the Tailwind v4 CSS-first Foundation. `src/theme.css` imports the complete Motion CSS entry, maps semantic variables through `@theme inline`, and imports the component selector facade. Button, Badge, SegmentedControl, Skeleton, and Scrollbar implementations live in `src/components/*.css`; `copy-theme.ts` flattens them into the existing `dist/components.css` entry. It contains no workspace-specific source paths. `src/index.css` adds Tailwind, scans workspace sources for the compiled playground stylesheet, and publishes the generated CSS.

### `@neoverse-ui/motion`

Owns framework-agnostic semantic Motion aliases and the `./css` entry. Its CSS imports `@neoverse-ui/tokens/css`, exposes micro/state/spatial duration, easing, and transition-property Variables, and applies `prefers-reduced-motion` overrides. Its TypeScript exports are values and CSS Variable names only; it has no DOM, runtime animation, Vue, or React dependency.

### `@neoverse-ui/glass-runtime`

Owns the optional framework-agnostic static edge renderer for Aurora Glass. A mounted renderer creates at most one transparent, non-interactive Canvas per Document, discovers top-level `material-glass-subtle`, `material-glass-elevated`, and `material-glass-immersive` surfaces, and accepts the production `glass-card` / `glass-surface` aliases. WebGL2 is preferred and WebGL1 is the fallback context. The renderer uses a rounded-rectangle SDF for directional thickness, top-left light, and lower/right chromatic catches; it never captures the page into a texture or replaces CSS background sampling. Size, scroll, theme, and DOM changes schedule a redraw, but there is no sweep or pointer animation. Context loss and reduced transparency remove the Canvas and renderer marker so the CSS material field and opaque fallback remain authoritative.

### `@neoverse-ui/vue`

Owns the Vue 3 SFC component integration. Core components expose semantic props, slots, native accessibility behavior, and Tailwind class composition; Vue is externalized as a peer dependency. Consumers import `@neoverse-ui/tailwind` separately for the semantic CSS foundation.

### `@neoverse-ui/react`

Reserves the future React integration boundary. It intentionally has no runtime exports or component implementation until its integration contract is defined.

### `@neoverse-ui/playground`

Owns the Vue-driven Design Lab and visual reference surface. Bun.serve serves the HTML shell, theme-isolated frame documents, compiled Tailwind CSS, and the Vite browser bundle; the frames consume the real Vue package and are not a marketing page. The browser entry mounts the shared Glass runtime once in each top-level or iframe Document.

## Theme modes

Tokens define light values in `themes/light.css`, while `themes/dark.css` supplies one canonical dark body. The build emits that body under explicit `.dark`/`data-theme="dark"` selectors and under `@media (prefers-color-scheme: dark)` for system mode. Consumers set `data-theme="light"`, `data-theme="dark"`, or `data-theme="system"` on the root element. Root `.light` and `.dark` classes remain compatible when `data-theme` is absent.

The Tailwind package maps these variables into semantic namespaces such as `bg-surface-raised`, `text-primary`, `border-subtle`, `rounded-control`, `shadow-card`, and `ring-focus`. Generic Tailwind palette and geometric utilities remain fallbacks, but business source is checked for primitive color, radius, and shadow utilities.

The token build order is primitives, semantic contract, Material/Motion/typography/geometry/layout foundations, light theme mapping, component defaults, and canonical dark mapping. Tailwind keeps generic semantic/foundation variables in `@theme inline`; component selectors consume component variables directly so no component-specific utility namespace is added.

## Surface / Glass Material System

Material effect values are owned by `@neoverse-ui/tokens/src/material.css`. Surface Solid, Subtle, and Elevated are composed from normal Tailwind utilities. Only Glass Subtle, Elevated, and Immersive use `material-glass-*` custom utilities; controls reuse the same filter, inner-glow, bloom, and edge-highlight tokens through their semantic aliases.

Glass utilities apply an opaque Surface fallback first, then progressively enhance with a tokenized tint, `backdrop-filter`, saturation, and chromatic ambient bloom. In supported browsers, the material remains one continuous backdrop-sampled plane with a transparent host border; a narrow inset field adds directional, softened refraction without expanding beyond the silhouette or drawing a uniform outer ring. The optional Glass runtime masks that CSS edge field only after its shared WebGL Canvas has activated, leaving the CSS field as the progressive-enhancement fallback. `prefers-reduced-transparency: reduce` disables the backdrop filter and refraction field while retaining the fallback surface, inner glow, and shadow. A Glass descendant of another Glass is downgraded to `surface-raised` and does not apply a second filter or refraction layer.
