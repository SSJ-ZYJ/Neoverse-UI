---
'@neoverse-ui/glass-runtime': patch
---

Keep Aurora Glass edge repaints within the existing frame limit during browser zoom and viewport resizing. The last resize still paints at the final geometry and pixel ratio, and unchanged canvas dimensions are not reassigned.
