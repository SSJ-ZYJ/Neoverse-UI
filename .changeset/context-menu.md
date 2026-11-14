---
"@neoverse-ui/overlay-runtime": minor
"@neoverse-ui/tokens": minor
"@neoverse-ui/vue": minor
"@neoverse-ui/react": minor
---

Add a cursor-anchored context menu primitive.

`@neoverse-ui/overlay-runtime` now accepts a `point` anchor alongside the existing element trigger. A point is a zero-size rect, so a panel opened at the cursor reuses the same viewport flip, clamping and CSS-zoom compensation as an anchored overlay. `trigger` is optional, `focusReturn` names where focus goes when a point-anchored overlay closes, and an all-zero layout box is skipped by the fallback containing-block correction instead of doubling the offset.

`@neoverse-ui/vue` and `@neoverse-ui/react` add `UiContextMenu`. Entries are `item`, `separator` or `heading`; items carry `tone`, `disabled`, `shortcut`, `children`, and optional `checked`/`group`/`selection` for radio and checkbox rows. An item with `children` opens a submenu in its own manual popover, flush with the panel edge and aligned to the row that opened it, the way a native submenu behaves; it carries the same glass material, flips to the inline start when the viewport has no room, and follows the panel while it moves. Because a nested popover would otherwise light-dismiss the parent, the context menu itself opens as a manual popover and the runtime's new `manual` and `containedElements` options let it own outside dismissal while treating the submenu as inside. `aria-haspopup="menu"`, `aria-expanded` and `aria-controls` track the submenu, ArrowRight enters while ArrowLeft returns, and both surfaces vanish together. The panel reuses the shared glass material and the presence engine, and exposes `role="menu"` with `menuitem`/`menuitemradio`/`menuitemcheckbox` rows, ArrowUp/ArrowDown wrapping, Home/End, Escape, outside dismissal and focus restoration. The panel grows from the edge it rests against, so a menu that flips above its pointer does not slide in from the wrong side.

Fallback submenus use viewport layout bounds rather than the parent's containing-block-relative CSS coordinates, keeping the parent row clickable in Firefox and WebKit without the Popover API. React also moves the menu panel to `document.body` after hydration to escape clipped consumer surfaces while retaining SSR markup.

`@neoverse-ui/react` now also declares `react-dom` as a peer alongside `react`, because the context menu portals its panel and submenu into the document body. Install `react-dom` at the same major as `react` if the consumer does not provide it already.

`@neoverse-ui/tokens` adds the `context-menu` component namespace for the check column, shortcut column, heading and separator colours; every value aliases an existing role. The Design Lab ships a cursor specimen and browser checks cover pointer opening, keyboard navigation, selection, focus restoration, viewport clamping and the untouched native menu outside a registered zone.
