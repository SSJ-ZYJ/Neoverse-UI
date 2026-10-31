# Overlay Contract

Neoverse-UI uses one overlay contract for anchored top-layer UI. Popover, DropdownMenu, and Select share the same framework-agnostic positioning runtime and the same Aurora Glass depth language.

## Runtime ownership

`@neoverse-ui/overlay-runtime` owns:

- trigger-relative viewport positioning,
- `auto`, `bottom-start`, and `bottom-end` placement,
- automatic upward flip when the lower viewport cannot fit an auto-placed panel,
- viewport clamping,
- CSS zoom compensation,
- optional trigger-width matching,
- scroll and resize tracking while a panel is open,
- geometry tracking for asynchronously resized content and trigger movement without scroll/resize,
- native Popover API detection,
- fixed-position fallback behavior when Popover is unavailable.

Framework adapters do not duplicate those algorithms.

While open, one animation frame samples the trigger's viewport rectangle and the
panel's layout dimensions. Only changed geometry requests a positioning write;
unchanged frames do not rewrite coordinates. This includes layout shifts and
translated ancestors, and preserves the existing CSS zoom and viewport clamping
rules. Closing, disabling, unmounting or disconnecting either element cancels the
frame and removes tracking/dismiss listeners. No document-wide mutation observer
or second positioning algorithm is installed. This does not add general rotated
or scaled containing-block support to the fallback contract.

## Top-layer behavior

The preferred browser path uses `popover="auto"`. This supplies native top-layer stacking and light dismiss. The fallback path keeps the same runtime-computed `position: fixed`, `top`, and `left` contract and only changes visibility through the fallback class.

Generic Aurora Glass material helpers must not replace top-layer positioning with `position: relative`. Overlay panels and Select popovers therefore own their positioning context directly.

## Dismiss and focus

- Escape closes an open overlay.
- Native light dismiss closes an auto Popover when the user activates outside it.
- Escape and explicit item selection restore focus to the trigger.
- A disabled trigger cannot open its panel.
- Controlled and uncontrolled framework state must behave equivalently; in Vue, an omitted Boolean `open` prop must remain `undefined` so it does not accidentally become a controlled `false`.

A dismiss is a request to change controlled `open`. After the parent update, adapters reconcile the real panel with the authoritative prop. If the parent keeps `open=true`, the panel remains open instead of leaving an expanded trigger next to a hidden panel. Native toggle events are reconciled through the same policy. Tracking and dismissal cleanup capture the mounted panel so unmounting does not depend on a ref that has already been cleared.

## Popover

`UiPopover` exposes a button trigger and a `role="dialog"` panel. The caller provides the accessible label for the dialog content. Popover does not impose menu semantics or focus trapping.

The trigger's `aria-controls` references the panel's generated ID, including while
closed. Vue and React use their own SSR-stable `useId`; multiple instances receive
distinct IDs and hydration/open/close cycles retain the association. IDs are
internal implementation details, so consumers must not depend on their format.

## DropdownMenu

`UiDropdownMenu` exposes:

- `aria-haspopup="menu"` on the trigger,
- `aria-controls` referencing an SSR-stable panel ID, with the same lifetime rules as Popover,
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

`overlay-tracking.spec.ts` covers trigger translation, async content growth,
zoom, ID associations, idle position writes and cancellation on disable/unmount.
It retains normal Motion while forcing only the optional renderer to use its CSS
fallback, keeping geometry/lifetime assertions independent from WebGL scheduling.
The optional renderer's enhanced-mode browser acceptance remains a separate gate.
Both adapters additionally render server markup and hydrate it in their
`overlay-hydration.test` suites; these are DOM hydration checks, not assistive
technology acceptance. The cross-browser configuration also selects the tracking,
audit, form semantics/behavior and overlay regression suites alongside its
existing interaction suites.

Any new anchored overlay primitive should reuse this runtime before adding a new positioning implementation.
