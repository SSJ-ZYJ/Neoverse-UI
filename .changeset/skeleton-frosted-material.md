---
'@neoverse-ui/tokens': patch
'@neoverse-ui/tailwind': patch
---

Unify skeleton placeholders on a translucent neutral frosted material with background blur. Reuse ancestor Glass blur for nested placeholders to avoid hundreds of additional filters in dense grids. Keep reduced-transparency and forced-colors fallbacks opaque.

Allow rectangular placeholders to honor custom heights below the text-line minimum while retaining a default height when none is supplied.
