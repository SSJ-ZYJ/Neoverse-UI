---
"@neoverse-ui/tokens": patch
"@neoverse-ui/giscus-theme": patch
---

Raise the light `text-muted` contrast to body-text AA.

`--neoverse-color-text-muted` was aliased to `neutral-500` (`#6c7f90`), which measures 3.90:1 on the light canvas. That is AA only for large text, while the same token colors placeholders, field descriptions and read-only hints. The light theme now resolves the role to `#5d6f80` (4.89:1 on the canvas, same hue), leaving `neutral-500` and the dark theme's `#7f93a8` untouched.

The token change also darkens the muted-colored non-text roles (breadcrumb separators, disclosure indicators, neutral status dots, textarea resize handles, timeline connectors). They require 3:1 and keep passing.

`@neoverse-ui/giscus-theme` follows the same values: the light `fg-subtle` and syntax comment colors move to `#5d6f80`, and the dark ones to `#7f93a8`. Its contract script now asserts `fg-subtle` against the widget canvas at 4.5:1, because the cross-origin iframe cannot be covered by the Design Lab browser checks. The darker decorative gutter mark stays dimmer than the comment text in both themes.
