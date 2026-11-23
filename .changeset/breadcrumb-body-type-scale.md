---
'@neoverse-ui/tokens': patch
'@neoverse-ui/tailwind': patch
---

Raise the breadcrumb trail to the body reading role. The trail previously took
`label-sm` — 13px at a 16px root — with the semibold label weight, so it read as a
badge and sat below every other navigation surface (tabs, pagination and
navigation items are 14px). It now uses `--neoverse-typography-body-md-*` at the
regular weight with the snug leading, which renders 16px on a 20px line at a
16px root.

Spacing follows the type: `--neoverse-breadcrumb-gap` and
`--neoverse-breadcrumb-item-gap` move to `space-2`, and the separator takes the
14px `body-sm` size instead of `label-sm` so it stays subordinate to the labels.

The hover plate keeps its proportion to the label instead of growing with the
type: `--neoverse-breadcrumb-link-plate-inset` drops from `space-1` to half of
it, so the padded link box stays 24px tall — two pixels above and below the
20px line — instead of the 28px a full `space-1` inset produced. The plate
geometry contract is unchanged: the container carries the same inset, the link
gives the space back with an equal negative margin, and the trail keeps its
footprint.
