---
'@neoverse-ui/glass-runtime': patch
---

Stop scheduling repeated WebGL edge paints for background-position animations and for transformed/opacity-animated content inside an isolated, fully clipped Glass boundary. The live CSS backdrop keeps rendering that decoration while edge geometry stays unchanged. Preserve tracking for surface/ancestor motion, unclipped content, layout changes, custom properties and unknown effects; resume when clipping changes during an existing animation.
