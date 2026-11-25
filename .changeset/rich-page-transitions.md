---
'@neoverse-ui/tokens': minor
'@neoverse-ui/motion': minor
'@neoverse-ui/tailwind': patch
---

Enrich `@neoverse-ui/motion` page transitions beyond the experimental HTML-in-Canvas particle dissolve with nine standard, zero-experimental presets (`fade`, `glide`, `slide`, `push`, `depth`, `veil`, `curtain`, `iris`, `morph`), shared-background preservation via `contentTarget` / `[data-neoverse-page-content]` and `background: 'auto' | 'shared' | 'surface'`, PPT-style `[data-neoverse-page-morph]` element morphing, directional choreography (`forward`, `backward`, `up`, `down`), scoped region snapshots (`nv-page` via `target`), `iris` trigger origins, non-sticky WAAPI outlet and FLIP morph fallbacks when View Transitions are unavailable, and `stopViewTransition()` / `supportsViewTransition()`.

Add shared `--neoverse-motion-page-*` tokens to `@neoverse-ui/tokens` and bundle the page-transition stylesheet rules through `@neoverse-ui/motion/css` and `@neoverse-ui/tailwind`.
