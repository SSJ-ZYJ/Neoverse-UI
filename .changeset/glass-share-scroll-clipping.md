---
'@neoverse-ui/glass-runtime': patch
---

Share ancestor clipping measurements across Glass surfaces in the same paint to reduce layout reads during scrolling. Moving scrollports still get fresh clipping bounds on the next paint.
