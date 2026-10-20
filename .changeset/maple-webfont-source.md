---
'@neoverse-ui/tokens': patch
---

Fix Maple Mono webfont source descriptors so browsers load the shipped monospace fallback when Maple Mono NF CN is not installed, instead of discarding the font source and falling back to Chinese sans text.
