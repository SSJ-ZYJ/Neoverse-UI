---
"@neoverse-ui/tokens": minor
"@neoverse-ui/glass-runtime": minor
---

Complete M8 three-material runtime integration, unified material registry, and Glass Runtime structural governance for v0.5.0.

### Tokens (`@neoverse-ui/tokens`)

- Export `materialCatalog` and `MaterialDescriptor` as the single localized material registry derived alongside `materials`, `defaultMaterial`, `materialAttribute`, and `isMaterial` (reusing `glassMaterial.name` for Aurora Glass).

### Glass Runtime (`@neoverse-ui/glass-runtime`)

- Pause scheduled edge repaints and activation probes while `document.hidden` is true, and refresh cleanly on `visibilitychange` when the page becomes visible again.
- Decompose internal renderer responsibilities into focused modules (`glass-renderer.ts`, `frame-scheduler.ts`, `surface-observer.ts`, `mutation-filter.ts`, `occlusion-cache.ts`, `scene-colors.ts`, `webgl-surface-pass.ts`) and move unit tests under `src/tests/` without altering optical shaders, compositing, or public exports.
