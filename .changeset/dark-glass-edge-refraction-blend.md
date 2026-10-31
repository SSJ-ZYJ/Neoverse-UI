---
'@neoverse-ui/tokens': patch
---

Publish `--neoverse-material-edge-refraction-blend` for the dark Glass edge, so a refraction pass reads `overlay` there and keeps the light theme's default `normal` composition. The value follows the existing `--neoverse-material-edge-refraction-gain` hook: both are theme-level edge optics that consumers apply themselves, and neither changes any shipped component by itself.
