---
"@neoverse-ui/tokens": minor
"@neoverse-ui/tailwind": minor
"@neoverse-ui/vue": minor
"@neoverse-ui/react": minor
---

Complete three-material component integration across Solid, Frosted, and Aurora Glass and reorganize package source layouts by domain responsibility.

### Tailwind (`@neoverse-ui/tailwind`)

- Separated shared material surface recipes (`src/materials/{scope,solid,frosted}.css`) from domain-grouped component stylesheets (`src/components/{controls,forms,surfaces,navigation,overlays,feedback,display,terminal,prose}/`) and split `form-control.css` into `field.css`, `text-input.css`, `select.css`, and `choice.css` while preserving CSS layer order and compiled outputs.
- Completed Solid and Frosted adaptations across controls, forms, surfaces, navigation, overlays, feedback, display, terminal, and Prose: fixed disabled filled button contrast (`primary`, `danger`, `success`, `warning`, `accent`), disabled/readonly form and choice states, explicit `surface="frosted"` support on `UiSegmentedControl`, `UiControlSurface`, `UiDock`, and `UiTerminalSurface`, tooltip pointer geometry and Frosted borderless joins, `UiBadge`/`UiNotice` non-`@supports` fallbacks, `UiAvatar` gradient clearing, Prose/table striping, timeline/step-flow/tabs/menu dividers, and `forced-colors: active` parity.

### Tokens (`@neoverse-ui/tokens`)

- Organized internal source files into `foundation/`, `semantic/`, `materials/`, `themes/`, `components/<domain>/`, and `tests/` without changing public exports or generated `@neoverse-ui/tokens/css` variable order.

### Vue (`@neoverse-ui/vue`) & React (`@neoverse-ui/react`)

- Hoisted `data-neoverse-material` onto `UiInput` outer `.ui-input-shell` and `.ui-input-number` wrappers in both adapters, matching `UiTextarea`, `UiSelect`, `UiCheckbox`, and `UiSwitch`.
- Fixed `UiDialog` portal material-scope bridging in Vue (`watchPostEffect`) and React (`useLayoutEffect`) so opening frames and exit animations stay synchronized without flashing; moved React context-menu submenu scope bridging to `useLayoutEffect`.
- Aligned package public exports: `@neoverse-ui/react` now re-exports `getSurfaceClass` and `isGlassSurface`; `@neoverse-ui/vue` now exports `AvatarPlaceholder` and `TabsVariant` types.
