---
'@neoverse-ui/tokens': patch
'@neoverse-ui/tailwind': patch
---

Unify all five Badge variants across light and dark themes, including neutral fill and border strength. Remove the light-only white backing and expose semantic foreground tokens for each status variant without changing Badge geometry. Use vivid midtone status ink in light mode. Add shared Light Glass background blur with an override token and opaque accessibility fallbacks.
