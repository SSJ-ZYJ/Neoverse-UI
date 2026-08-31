# Architecture

## Workspace principles

The repository uses Bun workspaces declared in the root `package.json`. Internal dependencies use `workspace:*`. There is no task orchestrator: root scripts call Bun workspace scripts in dependency order.

Published packages are ESM-only and emit only the artifacts their public contract requires. TypeScript packages emit declarations and source maps. CSS packages publish compiled CSS from `dist`.

## Package responsibilities

### `@neoverse-ui/tokens`

Owns raw design-token CSS Variables and TypeScript names for colors, geometry, layout, typography, Material effects, and base Motion duration/easing values. It has no workspace dependencies. Its CSS output is consumed by the Tailwind and Motion packages.

### `@neoverse-ui/tailwind`

Owns the Tailwind v4 CSS-first Foundation. `src/theme.css` imports the complete Motion CSS entry, maps semantic variables through `@theme inline`, and defines the custom Glass Material utilities plus the shared component selectors for button hierarchy, segmented controls, and skeleton surfaces. It contains no workspace-specific source paths. `src/index.css` adds Tailwind, scans workspace sources for the compiled playground stylesheet, and publishes the generated CSS.

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

Tokens define light values in `:root`, dark values under `.dark`, and dark system-preference values under `@media (prefers-color-scheme: dark)` when `.light` is absent. Consumers set `data-theme="light"`, `data-theme="dark"`, or `data-theme="system"` on the root element. Root `.light` and `.dark` classes remain compatible when `data-theme` is absent.

The Tailwind package maps these variables into semantic namespaces such as `bg-surface-raised`, `text-primary`, `border-subtle`, `rounded-control`, `shadow-card`, and `ring-focus`. Generic Tailwind palette and geometric utilities remain fallbacks, but business source is checked for primitive color, radius, and shadow utilities.

## Surface / Glass Material System

Material effect values are owned by `@neoverse-ui/tokens/src/material.css`. Surface Solid, Subtle, and Elevated are composed from normal Tailwind utilities. Only Glass Subtle, Elevated, and Immersive use `material-glass-*` custom utilities; controls reuse the same filter, inner-glow, bloom, and edge-highlight tokens through their semantic aliases.

Glass utilities apply an opaque Surface fallback first, then progressively enhance with a tokenized tint, `backdrop-filter`, saturation, and chromatic ambient bloom. In supported browsers, the material remains one continuous backdrop-sampled plane with a transparent host border; a narrow inset field adds directional, softened refraction without expanding beyond the silhouette or drawing a uniform outer ring. The optional Glass runtime masks that CSS edge field only after its shared WebGL Canvas has activated, leaving the CSS field as the progressive-enhancement fallback. `prefers-reduced-transparency: reduce` disables the backdrop filter and refraction field while retaining the fallback surface, inner glow, and shadow. A Glass descendant of another Glass is downgraded to `surface-raised` and does not apply a second filter or refraction layer.
