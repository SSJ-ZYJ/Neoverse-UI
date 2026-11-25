---
"@neoverse-ui/tokens": minor
"@neoverse-ui/motion": minor
"@neoverse-ui/tailwind": minor
"@neoverse-ui/overlay-runtime": minor
"@neoverse-ui/vue": minor
"@neoverse-ui/react": minor
---

Unify overlay panel surface optics, typography, menu hover feedback, modal scrim/layering, focus modality, and expanded placements and scenarios across Popover, DropdownMenu, ContextMenu (including submenus), Select popovers, and Dialog.

- Standardize all floating panels (`.ui-overlay-panel`) and submenus on `material-glass-elevated` with unified `14px` body-sm typography, compact menu padding, and unobstructed `1.25px` directional Aurora Glass rim highlights while removing outer/inset legacy shadows and dark borders that covered the glass edge.
- Route all clickable menu/option rows through the shared `control-feedback` `--neoverse-quiet-control-feedback` wash with consistent foreground contrast, and align interactive overlay buttons onto `<UiButton>`.
- Upgrade `UiDialog` to share `.ui-overlay-panel`, `material-glass-elevated`, and `.nv-presence` enter/exit discrete transitions at `--neoverse-layout-layer-modal` (`show()` + `.ui-dialog__backdrop` dimmed scrim + scoped Tab trapping) so higher-layer browser extensions stay unobstructed above the modal, and expose `size` (`sm | md | lg`) and `role` (`dialog | alertdialog`).
- Add shared pointer/keyboard focus modality tracking (`focusElement`) and single-Tab exit (`tabindex="-1"` on menu/listbox items) across `overlay-runtime`, `UiDropdownMenu`, `UiContextMenu`, `UiSelect`, `UiPopover`, and `UiDialog`, suppressing pointer-initiated visual focus rings until keyboard navigation begins.
- Expand `OverlayPlacement` (`auto`, `bottom-start`, `bottom`, `bottom-end`, `top-start`, `top`, `top-end`, `left-start`, `left-end`, `right-start`, and `right-end`) and add `triggerSize`, `checked`, and `shortcut` support on `UiPopover` / `UiDropdownMenu`.
