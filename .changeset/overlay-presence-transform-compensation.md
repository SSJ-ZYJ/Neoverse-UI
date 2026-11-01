---
'@neoverse-ui/overlay-runtime': patch
---

Keep fallback overlay coordinates aligned after their presence entrance finishes. Containing-block correction now excludes the panel's own CSS scale and translate, including its transform origin and CSS zoom, instead of treating that intentional visual motion as an ancestor offset. Previously opening a scaled panel could permanently shift its resting position by several pixels, even when the trigger never moved.

Preserve the existing native-popover path, viewport clamping, asynchronous geometry tracking and normal entrance motion. No adapter props or public exports change.
