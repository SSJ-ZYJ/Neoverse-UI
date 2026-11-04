---
'@neoverse-ui/overlay-runtime': patch
---

Clamp anchored overlays to the nominal layout viewport instead of the
document's expanded overflow. A panel that reaches the right or bottom edge no
longer escapes the visible area on layouts whose viewport grows with the
scrollable content.
