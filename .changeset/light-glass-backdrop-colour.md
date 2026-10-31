---
'@neoverse-ui/glass-runtime': patch
'@neoverse-ui/tokens': patch
---

Restore the 0.2.0 light Glass directional colour, opacity response and normal canvas blending, together with its surface edge densities. Keep dark rendering and CSS-owned body blur unchanged.

Cap the light edge's cool excess. The restored indigo right catch carried a blue lead of roughly three times the red and green content, which read as a blue band over pale pages. Light now trims 72% of that excess before compositing: the mint-to-indigo direction survives, the cast does not. The cap is gated to light surfaces, so dark Glass keeps its response without a change in blend mode, uniforms or canvas output.

The grey-backdrop case in the visual suite bounds how far blue may lead the green and red content, so the cool edge cannot silently regress into a cast.
