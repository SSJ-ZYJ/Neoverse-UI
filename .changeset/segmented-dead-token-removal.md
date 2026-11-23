---
'@neoverse-ui/tokens': minor
---

Remove the two SegmentedControl tokens that became dead when hover and press feedback moved to the shared quiet tint: `--neoverse-control-segmented-hover-foreground` and `--neoverse-control-segmented-option-press-scale`. They no longer have a consumer in the shipped CSS, so the unselected label keeps `--neoverse-control-segmented-foreground` at rest, on hover and while pressed, and the selected accent stays on `--neoverse-control-segmented-active-foreground`.

This is a breaking removal of two public token names from the `cssVariables.components.segmentedControl` name map (`hoverForeground`, `optionPressScale`). Consumers that read either key or set either variable must drop it; styling through the shared quiet feedback tokens needs no change.
