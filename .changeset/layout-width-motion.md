---
'@neoverse-ui/motion': minor
'@neoverse-ui/vue': minor
---

Add the shared layout width motion for boxes whose content changes size.

`@neoverse-ui/motion` now exports `captureLayoutWidths` and `animateLayoutWidths`. The pair samples every rendered box before a layout-changing update, resolves all natural endpoints before the first animation starts, and animates the changed widths on the `spatial` role with a `width` keyframe pair, so an interrupted run continues from the frame it reached and releases its fill when it ends. Hidden boxes, unchanged widths, reduced motion, and missing duration tokens resolve to no animation.

`@neoverse-ui/vue` now exports `useLayoutWidthMotion`. It wires the two update phases (sample and cancel in the pre-flush, animate in the post-flush) and ends a running motion on viewport resize, a reduced-motion change, or unmount. Nothing plays on first render or hydration.

Growing boxes now keep their replacement copy on one line while the width catches up: `white-space: nowrap` and `overflow: clip` are applied inline for the run and restored on finish or cancellation. Without it, longer labels wrapped inside the still-narrow box, changing its height and shifting the surrounding layout mid-animation — the visible hitch on a narrow-to-wide language switch. Shrinking boxes are unaffected.

This moves the language-switch width reconciliation out of consumer code: the navigation shell no longer measures brand, navigation, and preference widths itself. The Design Lab ships a `foundation-motion-width` specimen and binds the same composable to its own toolbar controls; browser checks cover both switch directions, unchanged line counts and container heights, restored inline styles, and one shared duration per resized group.
