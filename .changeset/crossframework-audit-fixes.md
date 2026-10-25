---
'@neoverse-ui/overlay-runtime': patch
'@neoverse-ui/vue': patch
'@neoverse-ui/react': patch
---

Close anchored overlays when keyboard focus leaves them. Chromium keeps an open popover when focus walks out of the panel, and the fallback path had no dismissal at all, so Tab past the last item left Select listboxes and DropdownMenu panels open with `aria-expanded` still true. The shared runtime now listens for `focusout` on the document and dismisses when focus lands outside both the panel and its trigger, gated on a real element `relatedTarget` so pointer-driven dismissal is not counted twice.

Release an open Select's overlay tracking when the React adapter unmounts. The runtime holds window `resize`/`scroll` and document `keydown`/`pointerdown` listeners keyed by the panel element; without a cleanup path the React adapter leaked them for the page lifetime, while the Vue adapter already closed on `onBeforeUnmount`.

Restore Vue controlled choice inputs when the parent rejects an update. `UiCheckbox`, `UiSwitch` and the number-input branch bound `:checked`/`:value` directly, so a rejected `update:modelValue` left the native control flipped and, for `UiSwitch`, `aria-checked` out of sync with application state. The adapter now compares against the current prop after the parent's write lands and rolls back only genuinely rejected values.

Give `UiScrollbar` one reference-counted owner for the document-level native hiding class, shared by both adapters. Vue previously removed `ui-scrollbar-target` on every unmount, breaking other mounted instances; React had its own private counter. The shared helper preserves a class that the page already carried.
