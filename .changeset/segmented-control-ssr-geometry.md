---
'@neoverse-ui/tailwind': patch
'@neoverse-ui/vue': patch
'@neoverse-ui/react': patch
---

Seat the segmented control's active slider in the selected option's content-sized grid column before hydration. The slider now spans `grid-column: var(--segment-active-column, calc(var(--segment-index) + 1) / span 1)` with a `100%` width and a `0` translation fallback, so a content-sized control no longer paints an equal-width track over the wrong option on the first frame or after a font swap.

Vue and React publish `--segment-active-column: 1 / -1` once they have measured the options, then keep the measured offset and width so later selection changes still animate. The declared `--segment-active-offset` fallback drops from an index-based guess to `0`, which matches the grid column that is already positioned.
