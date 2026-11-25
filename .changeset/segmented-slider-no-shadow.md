---
'@neoverse-ui/tokens': patch
---

Remove the shadow from the `UiSegmentedControl` slider by defaulting `--neoverse-control-segmented-active-shadow` to `var(--neoverse-shadow-none)` across themes, keeping the embedded selection plate flat inside its clipped well while leaving the shared `choice-selected-shadow` role for Tabs, Pagination, and NavigationItem untouched.
