---
'@neoverse-ui/motion': patch
---

Keep the particle dissolve's HTML-in-Canvas capture alive in Chrome 157+. The
157 stable `drawElementImage()` refuses to draw unless the canvas carries
`content="drawable"` and the element it draws carries `drawable`, so the old
`layoutsubtree`-only capture threw `InvalidStateError`, uploaded an empty
texture, and every page transition silently degraded to the crossfade. The
capture canvas now opts in with both spellings (Chromium 147-156 ignores
`content`, 157+ ignores `layoutsubtree`), and the sanitized clone is marked
drawable before it is laid out inside that canvas.