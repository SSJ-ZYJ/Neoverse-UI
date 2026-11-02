---
'@neoverse-ui/glass-runtime': patch
'@neoverse-ui/tailwind': patch
'@neoverse-ui/tokens': patch
---

Add shared Aurora Glass edge rendering to inset form controls, disclosures and table
outlines and visible grid lines. Preserve the table's single backdrop filter,
native form interactions, clipping, and local Select-panel fallback.
Avoid the competing dark lower inset shadow on form controls in both themes
when the WebGL edge is active, while keeping interaction and fallback shadows.
Keep the table's directional lower catch visible above its last-row cell fills.
