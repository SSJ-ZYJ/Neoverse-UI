---
"@neoverse-ui/motion": minor
"@neoverse-ui/glass-runtime": patch
"@neoverse-ui/overlay-runtime": minor
"@neoverse-ui/react": minor
"@neoverse-ui/tailwind": patch
"@neoverse-ui/tokens": patch
"@neoverse-ui/vue": minor
---

Animate dialogs, popovers, dropdown menus, context menus, submenus, and Select panels from their visual source and back. Vue and React Dialog accept a `motionSource` element when the focused opener is not the intended source. Reduced motion skips the shared-element transform.

Apply Dialog's translucent fill above the scrim without changing the elevated glass blur or dimming the foreground panel.

Slide an open context menu to the next right-click location without replaying its enter and exit animations.

Keep submenu opener hover feedback consistent with other menu rows by painting one highlight while expanded.

Restore a continuous, directional glass rim on native and fallback overlay panels without painting a duplicate edge in the shared canvas.

Deepen the Dialog-only scrim in both themes without changing the translucent panel fill.