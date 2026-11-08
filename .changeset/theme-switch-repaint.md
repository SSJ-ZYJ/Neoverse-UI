---
'@neoverse-ui/glass-runtime': patch
'@neoverse-ui/motion': patch
---

Stop theme switches from scheduling hundreds of identical Glass repaints. Colour-only transitions now count as static, style mutations outside Glass surfaces are ignored, and edge repaints are capped at roughly 60 fps, so high-refresh displays no longer churn identical frames or garbage-collect during the switch.

`@neoverse-ui/motion` excludes the fixed Glass canvases from the theme view-transition snapshot: they are viewport-sized GPU composites, and capturing them stalled the transition under inspector instrumentation. The tier-owned CSS material stays live during the crossfade, so blur, backdrop-dependent colour and the fade itself are unchanged.
