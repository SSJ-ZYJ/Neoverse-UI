---
'@neoverse-ui/tokens': patch
'@neoverse-ui/tailwind': patch
---

Rebalance `UiControlSurface` `md` and `lg` scale tokens from `1` / `1.3` to `1.08` / `1.18` while leaving `UiDock` scales (`1.1` / `1.3`) unchanged, keep `sm` navigation item font and icon tokens proportional inside `.ui-control-surface--scale-lg`, and match generic navigation `UiControlSurface` horizontal padding to its block inset while keeping `UiDock` on `--neoverse-control-surface-navigation-edge-inset`.
