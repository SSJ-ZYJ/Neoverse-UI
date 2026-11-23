---
'@neoverse-ui/tokens': patch
'@neoverse-ui/tailwind': patch
---

Prevent a dark strip from flashing at the rounded end of badges during Chromium repaints. Badge shadows now stay inside the border; the semantic tint, Light-tier backdrop blur, and entrance motion are unchanged.
