---
'@neoverse-ui/overlay-runtime': patch
'@neoverse-ui/vue': patch
'@neoverse-ui/react': patch
'@neoverse-ui/tailwind': patch
---

Keep open anchored overlays aligned when content grows asynchronously or their trigger moves without a window scroll/resize event. Track geometry only while open, avoid position writes when geometry is unchanged, and cancel the animation frame when tracking stops or either element disconnects. Retain native/fallback positioning, CSS zoom compensation and controlled dismissal ownership.

Associate Popover and DropdownMenu triggers with unique panel IDs through `aria-controls` in Vue and React. Generate IDs with each framework's SSR-stable `useId` and retain them through hydration, open/close cycles and rerenders. This does not add modal focus trapping or alter public props.

Explicitly size the transparent native choice input to the full visual row. WebKit otherwise retains its intrinsic checkbox dimensions despite `inset: 0`, leaving the visible Vue Checkbox/Switch label outside the input's hit area. Preserve native focus policies and keyboard interaction.
