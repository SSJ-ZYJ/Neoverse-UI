---
'@neoverse-ui/tokens': patch
'@neoverse-ui/tailwind': patch
'@neoverse-ui/vue': minor
'@neoverse-ui/react': minor
---

Navigation placement no longer changes the indicator identity. The start rail now
aliases `--neoverse-navigation-item-indicator-color` through
`--neoverse-navigation-item-start-indicator-color`, so a bottom bar and a start
rail resolve to the same colour instead of drifting between the primary and
secondary accents.

The selected navigation plate samples the page behind it. The new
`--neoverse-navigation-item-filter` (exposed as
`cssVariables.components.navigationItem.filter`) applies the Light Aurora Glass
blur to the persistent selection plate, so an active item reads as a frosted
surface over an optical or photographic backdrop instead of a flat tint.
Reduced transparency falls back to the opaque Light tint and disables the blur.

Navigation icons now follow the item size. The new
`--neoverse-navigation-item-icon-size-sm/md/lg` tokens (exposed as
`cssVariables.components.navigationItem.iconSizes`) keep compact and large
items optically consistent with their box, so a large compact item no longer
keeps the medium glyph.

Choice controls now answer press with one continuous state flow. The active
fill eases in from the centre at lower opacity while the checkbox check draws
itself and the switch thumb travels on the shared state curve. The rejected
press-shadow swap, plate compression and spring overshoot are gone. Reduced
motion keeps the instant state change.

Modal dialogs re-assert unlayered viewport positioning so they stay centred
even when the page is scrolled. Disclosure press deepens its existing inset
field instead of replacing its shadow with the press-shadow effect.

`UiTextarea` now forwards `class` and `style` to `ui-textarea-shell` instead of
the inner textarea, matching the visual box that owns the bloom, resize handle
and Glass edge. A consumer `max-w-*` or width style therefore keeps the handle
and shadow attached to the visible field; previously the shell stayed at the
container width and the resize dots could sit far outside the textarea. Vue and
React adapters behave the same.
