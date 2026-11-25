---
'@neoverse-ui/tokens': patch
'@neoverse-ui/tailwind': patch
---

Keep slotted SVG icons on the owning control's size token for `UiButton`, `UiIconButton` and `UiSegmentedControl`, take the native `UiTable` caption out of the rounded glass plate so the title sits above the surface without a background strip or clipped corners, keep the plate radius on `.ui-table-region` as the only box that can clip a table's square cell fills back into its corners while leaving the caption's band square so the label's first glyph is never shaved, and align the `UiBreadcrumb` hover plate with the global quiet-control wash using a wider horizontal inset than its block inset.
