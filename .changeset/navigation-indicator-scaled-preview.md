---
"@neoverse-ui/vue": patch
"@neoverse-ui/react": patch
---

Keep the shared navigation indicator on its active item when a preview magnifies the surface with an ancestor `scale` transform. Indicator geometry now divides out both CSS `zoom` and rendered `scale`, so the bar no longer doubles its offset and clips out of the group after a selection.
