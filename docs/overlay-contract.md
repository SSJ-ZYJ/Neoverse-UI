# Overlay Contract

Neoverse-UI uses one overlay contract for anchored top-layer UI. Popover, DropdownMenu, and Select share the same framework-agnostic positioning runtime and the same Glass depth language.

## Runtime ownership

`@neoverse-ui/overlay-runtime` owns:

- trigger-relative viewport positioning,
- `auto`, `bottom-start`, and `bottom-end` placement,
- automatic upward flip when the lower viewport cannot fit an auto-placed panel,
- viewport clamping,
- CSS zoom compensation,
- optional trigger-width matching,
- scroll and resize tracking while a panel is open,
- native Popover API detection,
- fixed-position fallback behavior when Popover is unavailable.

Framework adapters do not duplicate those algorithms.

## Top-layer behavior

The preferred browser path uses `popover="auto"`. This supplies native top-layer stacking and light dismiss. The fallback path keeps the same runtime-computed `position: fixed`, `top`, and `left` contract and only changes visibility through the fallback class.

Generic Glass material helpers must not replace top-layer positioning with `position: relative`. Overlay panels and Select popovers therefore own their positioning context directly.

## Dismiss and focus

- Escape closes an open overlay.
- Native light dismiss closes an auto Popover when the user activates outside it.
- Escape and explicit item selection restore focus to the trigger.
- A disabled trigger cannot open its panel.
- Controlled and uncontrolled framework state must behave equivalently; in Vue, an omitted Boolean `open` prop must remain `undefined` so it does not accidentally become a controlled `false`.

A dismiss is a request to change controlled `open`. After the parent update, adapters reconcile the real panel with the authoritative prop. If the parent keeps `open=true`, the panel remains open instead of leaving an expanded trigger next to a hidden panel. Native toggle events are reconciled through the same policy. Tracking and dismissal cleanup capture the mounted panel so unmounting does not depend on a ref that has already been cleared.

## Popover

`UiPopover` exposes a button trigger and a `role="dialog"` panel. The caller provides the accessible label for the dialog content. Popover does not impose menu semantics or focus trapping.

## DropdownMenu

`UiDropdownMenu` exposes:

- `aria-haspopup="menu"` on the trigger,
- `role="menu"` on the panel,
- native button menu items with `role="menuitem"`,
- ArrowUp / ArrowDown wrapping,
- Home / End navigation,
- disabled-item skipping,
- first-enabled-item focus on open,
- close + trigger focus restoration after selection.

## Select reuse

`UiSelect` keeps its existing combobox/listbox contract, but its panel positioning and tracking are delegated to the same overlay runtime. Select must not reintroduce an independent fixed/absolute positioning implementation.

## Validation

The contract is covered at three levels:

1. runtime unit tests for placement, flip, clamp, and oversized panels;
2. Vue/React component contract tests for roles, attributes, and disabled state;
3. Playwright browser tests for real Popover behavior, Escape, light dismiss, focus restoration, keyboard navigation, viewport containment, and the existing Select top-layer regression.

Dedicated interaction tests also disable `HTMLElement.prototype.showPopover` / `hidePopover` before mounting the Vue/React fixtures, forcing the fixed-position fallback rather than relying on the browser's default support. Additional controlled/readonly/reset scenarios are opt-in through `contract-fixtures=1`; they do not alter the default Design Lab layout.

Any new anchored overlay primitive should reuse this runtime before adding a new positioning implementation.
