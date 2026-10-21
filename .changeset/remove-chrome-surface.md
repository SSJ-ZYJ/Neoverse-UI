---
'@neoverse-ui/tokens': minor
'@neoverse-ui/tailwind': minor
'@neoverse-ui/vue': minor
'@neoverse-ui/react': minor
---

Remove the separate chrome surface and use glass-subtle for Dock by default, retaining Dock grouping and embedded control geometry. Explicit surface="chrome" and ui-surface-chrome consumers must migrate to glass-subtle and material-glass-subtle. Remove the chrome-specific material/effect tokens and TypeScript exports; use shared Glass material and control-surface geometry tokens instead. No compatibility aliases are retained.
