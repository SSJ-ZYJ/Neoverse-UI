---
'@neoverse-ui/tokens': patch
'@neoverse-ui/tailwind': patch
---

Keep segmented option hover on the neutral foreground instead of borrowing the
selected accent, and hold both that label color and the hover wash through press so
only the press shadow and scale respond. The selected accent is reserved for the
active option via `cssVariables.components.segmentedControl.hoverForeground`.