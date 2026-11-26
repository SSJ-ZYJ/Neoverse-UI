---
"@neoverse-ui/tokens": minor
"@neoverse-ui/tailwind": minor
---

Establish complete, equal Solid, Frosted, and Aurora Glass material foundations and surface recipes across all seven `SurfaceRole`s in light and dark themes.

### Tokens (`@neoverse-ui/tokens`)

- Added `material-solid.css` and `material-frosted.css` alongside expanded light/dark theme palettes and TypeScript maps (`cssVariables.material.solid`, `cssVariables.material.frosted`) with zero Glass optical parameter leakage.
- Completed Solid tonal hierarchy with `control-in-group`, `raised-nested`, `nested-shadow`, `compact-overlay`, `disabled`, filled semantic action tones (`danger`, `success`, `warning`, `accent`), and precomposed status plates.
- Established Frosted role-specific blur, saturation, and opacity scales (`panel` 16px/76%, `overlay` 20px/82%, `compactOverlay` 14px/84%, `group` 12px/68%, `control` 10px/74%, `table` 14px/78%, `field` 8px/80%), matte borders, calm shadows, nested fills, and 100% opaque theme-owned fallbacks.
- **Breaking:** Removed the temporary M5 Frosted preview tokens (`--neoverse-material-frosted-fallback`, `--neoverse-material-frosted-fill`, `--neoverse-material-frosted-filter`, `--neoverse-material-frosted-shadow`) in favor of the complete per-role Frosted token contract.

### Tailwind (`@neoverse-ui/tailwind`)

- Replaced binary `@scope (.material-static-scope)` and `@scope (.material-glass-default)` aliases with symmetrical `@scope (.material-solid-scope)`, `@scope (.material-frosted-scope)`, and `@scope (.material-glass-scope)` boundaries.
- Added dedicated `material-solid.css` and `material-frosted.css` recipes covering all seven `SurfaceRole`s, nested panel stepping in Solid, nested blur suppression with independent floating overlay sampling in Frosted, opaque-first `@supports` capability gating, `prefers-reduced-transparency`, `prefers-reduced-motion`, and `forced-colors` fallbacks.
- Wired Frosted and Solid recipes across buttons (including `danger`, `success`, `warning`, `accent`, and ghost exclusion), form controls, tables, disclosures, tabs, segmented controls, navigation items, pagination, skeletons, prose, tooltips, toasts, dialogs, drawers, docks, terminals, step flows, empty states, status indicators, and scrollbars.
- Scoped WebGL form/table shadow rules and reduced-transparency Glass tints inside `@scope (.material-glass-scope)` to prevent cross-material leakage on mixed pages.
