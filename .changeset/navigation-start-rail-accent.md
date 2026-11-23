---
'@neoverse-ui/tailwind': patch
---

Resolve the navigation start rail's colour alias on the item instead of the
document. `--neoverse-navigation-item-start-indicator-color` still defaults to
`--neoverse-navigation-item-indicator-color`, but a surface that retunes the
shared indicator colour now moves the bottom bar and the start rail together. A
`:root` alias substitutes once against the document default, which left a start
rail on the library mint while the surface's plate and bottom bar followed its
own accent.

Set `--neoverse-navigation-item-start-indicator-color` on the navigation surface
itself to keep a deliberately different rail colour.
