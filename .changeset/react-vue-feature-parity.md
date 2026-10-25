---
'@neoverse-ui/react': minor
'@neoverse-ui/vue': patch
---

Add 15 React adapters for the existing navigation, feedback, skeleton, terminal, presentation and scrollbar components. React `UiDock` now shares the ControlSurface navigation indicator and supports `navigationIndicator` (enabled by default), matching the existing Vue behavior. Also add React `UiAction.decoration`, allow React `UiSurface.as` to accept any React element type, and export Vue `SkeletonVariant`. Together with the separately documented `UiTerminalEcho` addition, Vue and React each expose the same 36 public components.

Preserve terminal history readers when upward scrolling and a column resize happen together in Vue and React; explicit reading intent cancels pending tail following.
