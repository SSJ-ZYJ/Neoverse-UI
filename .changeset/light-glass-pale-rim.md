---
'@neoverse-ui/tokens': patch
'@neoverse-ui/glass-runtime': patch
---

Keep the light Aurora Glass rim translucent instead of painting a saturated
cyan stroke on pale backdrops. The light fragment mixes 70% toward the neutral
edge light and leaves the theme accents as a 30% tint, the former 1.35 light
alpha gain is removed, and large light surfaces use 0.36 / 0.38 / 0.40 edge
opacities. Dark composition, geometry, blur and the 0.34 alpha ceiling are
unchanged.