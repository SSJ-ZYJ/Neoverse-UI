---
'@neoverse-ui/glass-runtime': patch
---

Use the same backdrop-dependent WebGL edge compositing in light and dark themes where color dodge is supported. Give the dark upper-left and lower-right arcs more lift without brightening the straight edges. Keep tier blur and the overlay fallback unchanged.
