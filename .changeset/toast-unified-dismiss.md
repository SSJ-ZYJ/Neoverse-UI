---
"@neoverse-ui/tokens": patch
"@neoverse-ui/tailwind": patch
"@neoverse-ui/glass-runtime": patch
"@neoverse-ui/vue": patch
"@neoverse-ui/react": patch
---

Render a unified circular Aurora Glass / Solid auto-adaptive dismiss button with an SVG close icon straddling the upper-right corner of all `UiToast` presentations (`compact`, `action`, and `notification`), keeping the toast surface and dismiss badge as sibling material planes for live backdrop refraction and clean WebGL corner occlusion across Vue and React; reuse the shared `.neoverse-prose a` link style for unstyled Toast action links/buttons, trim leftover right-column clearance in `toast.css`, and reset light-only status text and label foreground tokens in dark theme so system-dark mode keeps Toast indicators and actions legible.
