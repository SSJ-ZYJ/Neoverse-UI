---
'@neoverse-ui/tailwind': patch
'@neoverse-ui/vue': patch
'@neoverse-ui/react': patch
---

Fix mirrored text-box carets and extend the shared breathing and gliding caret to all text-selectable form controls (`UiInput`, `UiTextarea` and `UiTerminalPrompt`). The caret overlay now paints above the input's Aurora Glass layer instead of being blurred behind it, aligns vertically across ASCII and CJK glyphs, tracks `selectionchange` and resizes immediately on `keydown`/hold instead of waiting for `keyup`, suppresses Chromium's transient index-0 flash on pointer focus, and glides continuously from its live visual pixel on rapid left/right steps, reversals and two-axis textarea line hops.
