---
'@neoverse-ui/tokens': minor
'@neoverse-ui/glass-runtime': patch
---

Standardize the shared material's display name as Aurora Glass across the Design Lab, current documentation, package descriptions, and style comments. Light, Standard, and Immersive remain tiers of the same material, and Tokens keep the localized Chinese display names for interfaces presented in Chinese.

Export `glassMaterial` from `@neoverse-ui/tokens` so consumer projects can obtain the canonical bilingual material name and tier labels directly. Preserve existing `glass-*` surface values, CSS classes and variables, package names, rendering behavior, and optical values.

Refresh the affected native Windows and Linux desktop/mobile visual baselines for the canonical name, including text wrapping and linked layout changes. Generate Linux captures with the real pinned font responses cached to exclude intermittent CDN fallback rendering; retain the existing screenshot thresholds.
