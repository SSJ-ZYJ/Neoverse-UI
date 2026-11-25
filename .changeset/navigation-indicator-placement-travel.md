---
'@neoverse-ui/tokens': patch
'@neoverse-ui/tailwind': patch
---

Move the navigation indicator as one bar when its placement changes: position it by its centre and interpolate its transform, so switching between start and bottom in an Inspector slides and rotates the same bar instead of jumping to new geometry.
