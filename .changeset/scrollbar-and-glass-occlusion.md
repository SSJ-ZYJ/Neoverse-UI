---
'@neoverse-ui/glass-runtime': patch
'@neoverse-ui/react': patch
'@neoverse-ui/tailwind': patch
'@neoverse-ui/tokens': patch
'@neoverse-ui/vue': patch
---

Keep immersive scrollbar thumbs painted in hover and drag states, preserve their
native padding-box clip, and keep Vue and React document rails visible while the
pointer rests on them or a drag is held. Restart automatic hiding after the
interaction ends.

Detect overlapping Glass surfaces that cross an edge between the renderer's
fixed hit-test points. Pointer-transparent overlays that are guaranteed to be
above ordinary Glass surfaces can opt into the edge mask with
`data-neoverse-glass-occluder="topmost"`. The edge shader, backdrop sampling,
body blur, and optical colours are unchanged.
