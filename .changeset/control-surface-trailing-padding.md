---
'@neoverse-ui/tokens': patch
---

Add the missing `components.controlSurface.trailingPadding` entry to the public token-name map. The `--neoverse-control-surface-trailing-padding` variable was already defined in the token CSS and consumed by the Tailwind ControlSurface rules, but consumers could not reference it by name from `cssVariables`. This is an additive type-level change; existing keys are unchanged.

The React adapter also gains shared `resolveAriaInvalid` and `ButtonMaterialShell` internals, and the glass-runtime `backend` option now documents that `webgl` and `auto` select the same rendering path. Neither changes public behaviour, so no version bump is recorded for those packages.
