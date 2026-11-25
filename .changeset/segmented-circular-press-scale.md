---
'@neoverse-ui/tokens': patch
'@neoverse-ui/tailwind': patch
'@neoverse-ui/motion': patch
---

Restrict vertical press squishing on `UiSegmentedControl` thumbs to elongated `pill` capsules. Circular (`icon` or equal-aspect) and `rounded` thumbs now scale uniformly around their center when pressed or dragged, with dedicated `--neoverse-control-segmented-circular-press-scale` and `--neoverse-control-segmented-pill-press-scale-y` tokens.
