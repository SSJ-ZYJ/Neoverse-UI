---
'@neoverse-ui/tokens': patch
'@neoverse-ui/tailwind': patch
---

Restore the selected Choice field and give it its own azure colour. The flowing fill used the Glass edge's `::before`, which the WebGL renderer hides, so checked Checkbox, RadioGroup and Switch controls painted only the neutral plate. The fill now uses `::after`, sits below the edge and the mark, and stays translucent: 46% transparency in Light with a deep azure mark, 28% in Dark with a white mark. Every mark keeps at least 3:1 non-text contrast, and reduced transparency swaps in the fully opaque field.