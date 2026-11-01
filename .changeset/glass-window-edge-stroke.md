---
'@neoverse-ui/tokens': patch
'@neoverse-ui/tailwind': patch
---

Add an opt-in painted stroke for Aurora Glass surfaces anchored to the window edge, where a dark backdrop cannot supply enough light for a readable refracted silhouette. Set `data-neoverse-glass-edge-stroke` on a `material-glass-subtle`, `material-glass-elevated` or `material-glass-immersive` surface to enable it; button surfaces are excluded.

Publish `--neoverse-material-edge-stroke` with a transparent default and a dark-theme inset border plus top highlight. The stroke composes with the CSS material shadows, remains present with the native or WebGL renderer, and survives the reduced-transparency fallback. Surfaces without the attribute retain their existing appearance.
