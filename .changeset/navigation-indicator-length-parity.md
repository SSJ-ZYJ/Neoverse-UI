---
'@neoverse-ui/tokens': patch
'@neoverse-ui/tailwind': patch
---

Keep the navigation indicator's length when its placement rotates: the start rail now takes its length from the bottom bar's width token, so both placements paint 20px normally and 12px compactly instead of stretching the rail to the item height.
