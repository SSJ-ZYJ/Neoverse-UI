---
'@neoverse-ui/vue': patch
'@neoverse-ui/react': patch
---

Restore Vue's native composition-aware model updates for UiInput and UiTextarea so unfinished IME text is not committed or overwritten by consumer rerenders. Preserve the existing string-valued number-input updates and native React text-input conventions.

Allow ArrowDown and ArrowUp to enter UiSelect's listbox in Vue and React, focusing the selected enabled option or the first/last enabled option. Associate each combobox with its listbox using SSR-stable IDs, retain controlled selection ownership, and respect prevented consumer key events and disabled/readonly states.
