---
'@neoverse-ui/tokens': minor
'@neoverse-ui/tailwind': minor
'@neoverse-ui/vue': minor
'@neoverse-ui/react': minor
---

`UiTerminalPrompt` and `UiInput` now draw their own caret instead of relying on the browser blink. The bar is a rounded pill in the theme accent that breathes on a one second cycle from shared caret tokens, holds solid while text is being edited, and glides from its previous position to the new one with a duration that grows with the distance travelled up to the glide token. The bar keeps its width for the whole travel, so a Home/End jump moves a thin caret instead of painting a solid slab across the text it passes. Only opacity animates for the blink, so it also runs under reduced motion; the glide is real motion and stops when reduced motion is requested.

The overlay only takes over for a collapsed caret inside an editable control. Selection, IME composition, masked, email and number inputs, and forced colors keep the native caret. Readonly and disabled text controls remain focusable and selectable where the platform allows it, but they no longer paint an insertion caret at all, so a pointer activation cannot leave a blinking bar in a field that cannot be edited.

`UiInput` renders its native input inside a new `ui-input-shell` wrapper so the caret layer can share the control's padding and scroll offset; `class` and `style` still land on the input itself. `UiTextarea` keeps the native caret, because a multi-line caret needs two-axis mirroring.

`@neoverse-ui/tokens` adds the caret cadence, glide cap and symmetric easing, and points `--neoverse-terminal-cursor` at the theme accent in both themes instead of a mint role. `@neoverse-ui/tailwind` publishes the caret primitives, so hosts that import the component stylesheet get the new caret without extra wiring.