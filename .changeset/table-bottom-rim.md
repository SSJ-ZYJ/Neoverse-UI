---
'@neoverse-ui/tailwind': patch
---

Stop the table from painting a duplicated lower line below the shared renderer's
bottom rim. The final row's local inset catch and the table's CSS edge highlight
are now limited to the CSS edge path; while the WebGL/native renderer owns the
perimeter, the shared canvas supplies the bottom rim and the local catch is
hidden in both themes. The explicit `data-neoverse-glass-edge-pass="css"`
fallback, tables inside a native top layer, the table grid lines and the tier
fills are unchanged.
