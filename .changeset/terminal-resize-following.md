---
"@neoverse-ui/vue": patch
---

Preserve terminal transcript following when viewport reflow emits native scroll events before ResizeObserver. Existing readers keep their position; a transcript that was following the bottom continues through consumer column and content reflow without requiring another command.
