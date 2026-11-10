---
'@neoverse-ui/glass-runtime': patch
---

Keep animation-driven edge repaints out of the frame-signature dedup.

The scene signature only covers geometry, classes and inline styles, so an
active transform, opacity or particle animation never changed it. A frame that
the signature then deduplicated left the fixed edge canvas painting the previous
frame: a surface that started moving kept a stationary rim, and the particle
transition's temporary opacity layer left a small colour shift behind once it
was released. Animations that can move or reveal an edge now repaint before the
signature check, while resting scenes keep the dedup and the roughly 60 fps cap.
