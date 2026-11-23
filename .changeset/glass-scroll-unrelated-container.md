---
'@neoverse-ui/glass-runtime': patch
---

Ignore scroll events from unrelated sub-containers that contain no Glass surfaces.

Container-level scroll events inside regions without Glass surfaces or occluders
no longer schedule frames or invalidate the frame signature, avoiding redundant
WebGL and chroma edge repaints during rapid scrolling on non-Glass pages.
