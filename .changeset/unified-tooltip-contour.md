---
'@neoverse-ui/tailwind': patch
---

Render TooltipSurface's rounded body and downward pointer as one clipped Glass plate in browsers supporting CSS shape(). Share backdrop sampling and the existing refractive contour, removing the separate pointer fill and the rectangular shadow seam. Preserve pointer position, layout geometry, and opaque accessibility fallbacks.

Release the veil entrance filter after playback so the unified plate can keep sampling the real background in gradient and neutral previews.

Mask the filtered output to the rounded body and pointer so the empty strip beside the pointer cannot blur the surrounding backdrop, including the reduced-transparency preview.

Use explicit horizontal and vertical mask coordinates so every mask tile retains its intended position and the right side remains fully covered.
