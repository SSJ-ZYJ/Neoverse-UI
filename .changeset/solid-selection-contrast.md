---
"@neoverse-ui/tokens": minor
"@neoverse-ui/tailwind": patch
---

Recolor dark Solid and keep its foreground hierarchy aligned with Glass: the selection plate is a soft azure mixed from the deep accent and the Raised surface with the primary text ink, Control, Raised and Overlay step down one level, and dividers sit closer to the surface. Status badges keep their semantic hue on the Solid tint (bright ink in Dark, deep ink in Light), while neutral badge and Notice text returns to the secondary role, and a `surface="none"` SegmentedControl follows the surrounding Solid selection recipe. Light Solid surfaces and every Glass tier are unchanged.