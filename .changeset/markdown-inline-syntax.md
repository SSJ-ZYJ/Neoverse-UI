---
'@neoverse-ui/tokens': patch
'@neoverse-ui/tailwind': patch
---

Style Markdown inline semantics in `.neoverse-prose`: bold, italic, bold italic, inline code, strikethrough and links. Struck and bold text nested in a link keeps the link color, so combined states stay readable without changing the existing prose layout. Add CJK fallbacks to the default code font stack so Chinese inline code no longer falls back to the system serif font, and give inline code a dedicated font role that prioritizes Maple Mono NF CN.
