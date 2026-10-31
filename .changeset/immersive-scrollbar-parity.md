---
'@neoverse-ui/tokens': minor
'@neoverse-ui/tailwind': patch
---

Unify the native `scrollbar-immersive` utility with the `UiScrollbar` overlay so a scrollable container and the document read as one control. The utility now keeps the overlay lane width, thumb widths, ink ladder, and inset edge highlight from the shared `--neoverse-scrollbar-*` tokens, and the lane stays transparent so the canvas shows through as it does behind the overlay.

Chromium silently ignores `::-webkit-scrollbar` styling as soon as `scrollbar-width` or `scrollbar-color` is declared, which flattened the immersive rail to the platform "thin" bar with a painted track. The standard properties are now scoped to `@supports not selector(::-webkit-scrollbar)`, so Chromium and Safari keep the token-driven rail and only engines without the pseudo-elements receive the standard fallback.

The rail palette is rebuilt as one neutral ink instead of a lit object. The former three-stop `edge-light` → accent gradient washed out to near-white on light glass, turned distinctly cyan at the bottom on dark glass, and its 12px accent bloom hazed the content underneath. The thumb is now a flat ink derived from `text-secondary` (44% rest, 60% hover) that darkens in light themes and lifts in dark ones, and accent reaches the grip only while dragging. Outer shadows are gone because they paint a stray arc around the native thumb cap; the only remaining shadow is a 1px inset crown.

Tokens replace `--neoverse-scrollbar-immersive-track-border-width` with `--neoverse-scrollbar-immersive-rail-inset`, derive `--neoverse-scrollbar-immersive-thumb-border-width` from `--neoverse-scrollbar-overlay-thumb-width`, and add `--neoverse-scrollbar-immersive-thumb-hover-border-width` for the expanded thumb. `--neoverse-effect-rail-thumb-glow`, `--neoverse-effect-rail-thumb-hover-shadow`, their `--neoverse-scrollbar-*` aliases, and the `thumbGlow` / `thumbHoverShadow` map entries are removed; consumers that overrode them should set the ink tokens instead. Consumers that overrode the removed track-border token should set the rail inset instead, and overriding either overlay thumb width now moves both rails together.

The Playground scrollbar module documents the shared geometry, lists the thumb width tokens, and describes the hover and drag states the palette actually renders.
