---
'@neoverse-ui/tokens': patch
'@neoverse-ui/tailwind': patch
---

Make breadcrumb hover read as a link plate instead of a tint on the text line.
The link now grows its own box by `--neoverse-breadcrumb-link-plate-inset` and
returns the same space with a negative margin, so hover answers on padding while
the trail geometry stays exactly where it was. The plate fills that box in
`--neoverse-effect-hover-field` — the shared wash plain footer links use — fades
in while growing from `--neoverse-breadcrumb-link-plate-rest-scale`, deepens on
press, and the label rises to the primary text role. The label stays out of the
accent ramp on purpose: accent text on the accent plate measures about 2.5:1 in
Light, so the hover state would fail the contrast the rest state keeps.

The container keeps `overflow: clip` with `--neoverse-breadcrumb-clip-margin`
instead of hard `overflow: hidden`, so the focus ring is no longer cut, and its
value now covers the padded link box. Breadcrumb links leave the shared quiet
control wash list in `control-feedback.css` because they no longer read
`--neoverse-quiet-control-feedback`.
