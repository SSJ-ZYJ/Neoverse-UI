---
'@neoverse-ui/tokens': minor
'@neoverse-ui/tailwind': minor
'@neoverse-ui/vue': minor
'@neoverse-ui/react': minor
'@neoverse-ui/overlay-runtime': minor
'@neoverse-ui/glass-runtime': minor
---

Adopt role-based automatic surfaces and three material scopes. Frosted is an experimental foundation preview, without Aurora Glass edge rendering. Upgrade Tokens, Tailwind and the adapters together; upgrade Glass Runtime when using optional edges and Overlay Runtime when using portaled components.

Breaking changes for the pre-1.0 release: import `Material` instead of `MaterialMode` and `SurfaceRole` instead of `MaterialSurfaceRole`. Replace `surfaceClasses` and `materialSurfacePresets` with `getSurfaceClass(selection, role)`. Automatic markup no longer includes `material-auto`, Solid recipe classes, or explicit Glass tier classes. Explicit `glass-*` selections and `surface="none"` keep their meaning.

Minor bumps follow the independent package versions: Vue and React advance from 0.4.x to 0.5.0; other changed packages advance from their own current versions.
