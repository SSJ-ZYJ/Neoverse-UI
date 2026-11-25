# Overlay Contract

Status: adopted

[Chinese](../zh-CN/architecture/overlay-contract.md)

Neoverse-UI uses one overlay contract for anchored top-layer UI. Popover, DropdownMenu, and Select share the same framework-agnostic positioning runtime and the same Aurora Glass depth language.

## Runtime ownership

`@neoverse-ui/overlay-runtime` owns:

- trigger-relative viewport positioning,
- `auto`, `bottom-start`, `bottom`, `bottom-end`, `top-start`, `top`, `top-end`, `left-start`, `left-end`, `right-start`, and `right-end` placement,
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

The fixed fallback is not a top layer. Its layer token orders panels within
their stacking context; it cannot promote them above a sibling of a lower
ancestor context. This applies to every anchored panel, including Select and
ContextMenu submenus. Keep overlay-bearing ancestors out of lower stacking
contexts where possible. If a composition intentionally isolates its layers,
keep the overlay-bearing host unclipped and order it above the siblings it
must cover. Raising individual panel layer values does not resolve an ancestor
conflict.

Generic Aurora Glass material helpers must not replace top-layer positioning with `position: relative`. Overlay panels and Select popovers therefore own their positioning context directly.

The floating panel owns its narrow CSS glass rim in both layer modes. A rounded alpha mask limits the tier's backdrop brightness pass to the perimeter, with stronger coverage at the upper-left and lower-right. The panel retains its separate body blur. The shared WebGL canvas does not draw a second rim for these panels.

## Dismiss and focus

- Escape closes an open overlay.
- Native light dismiss closes an auto Popover when the user activates outside it.
- Escape and explicit item selection restore focus to the trigger.
- A disabled trigger cannot open its panel.
- Controlled and uncontrolled framework state must behave equivalently; in Vue, an omitted Boolean `open` prop must remain `undefined` so it does not accidentally become a controlled `false`.

A dismiss is a request to change controlled `open`. After the parent update, adapters reconcile the real panel with the authoritative prop. If the parent keeps `open=true`, the panel remains open instead of leaving an expanded trigger next to a hidden panel. Native toggle events are reconciled through the same policy. Tracking and dismissal cleanup capture the mounted panel so unmounting does not depend on a ref that has already been cleared.

## Shared-element motion

Popover, DropdownMenu, and Select expand from their trigger's viewport rectangle and collapse back to it. A ContextMenu uses the invocation point; its submenu uses the parent row. Switching rows replays the entrance from the new row, but reactivating the same row does not restart it.

Dialog uses the element focused immediately before opening. Pass `motionSource` in Vue or React to use a different element, such as `event.currentTarget` from a pointer handler, or pass `null` to keep the default presence effect. This prop does not change where focus returns. The source is selected at open time and measured again on dismissal, so a moved trigger remains the destination. A hidden, disconnected, or missing source falls back to the default presence effect.

The real panel moves and scales between rectangles; no DOM clone or backdrop snapshot is used. CSS retains the existing enter/exit timing and top-layer departure where supported. Reduced-motion preferences skip the shared-element geometry.

Dialog uses its own translucent `--neoverse-dialog-background` fill over the scrim instead of the lighter-coverage overlay fill. `--neoverse-dialog-scrim` dims the surrounding page independently of that fill. The panel retains the elevated tier's blur and edge treatment.

Use `UiButton variant="danger"` for destructive confirmations such as Delete. Ordinary confirmations retain `primary`; a dialog's `alertdialog` role does not set action colors.

## Drawer

`UiDrawer` renders a controlled edge panel using `open` (default `false`).
Bind `v-model:open` in Vue or `open` and `onOpenChange` in React. Supply
`aria-label` or `aria-labelledby` and put the drawer controls and content in
the default slot or `children`. `side` accepts `left` (default) and `right`.

With `modal` (default `true`), Drawer mounts at the document root in the same
`--neoverse-layout-layer-modal` layer as Dialog. This keeps it above ordinary
page overlays without covering higher-layer controls such as browser extension
toolbars. The topmost document modal traps Tab and restores focus to the
previously focused element on close. Escape and activating the scrim request
closure; set `closeOnOutside` to `false` to disable scrim dismissal. The drawer
remains open until the caller updates `open`.

Set `modal` to `false` for an inline panel, such as persistent navigation on a
wide screen. Inline panels stay in layout and do not capture or move focus on
open. A `width` CSS length overrides the default modal width. Modal placement
uses the `--neoverse-drawer-width` and `--neoverse-drawer-inset` tokens and
respects reduced-motion and reduced-transparency preferences.

## Popover

`UiPopover` exposes a button trigger and a `role="dialog"` panel. The caller provides the accessible label for the dialog content. Popover does not impose menu semantics or focus trapping.

The trigger is a shared button. `triggerVariant` selects its variant and defaults to `secondary`, so existing consumers keep the same trigger classes. `ghost` reuses the shared ghost button classes: transparent chrome with the standard hover and press washes, for triggers that sit inside ghost chrome such as a page header. `UiDropdownMenu` exposes the same option with the same default.

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
- first-enabled-item focus on open (suppressing visual focus rings on pointer open until keyboard navigation begins),
- single-Tab exit out of the menu (`tabindex="-1"` on menu items and listbox options),
- close + trigger focus restoration after selection.

## Select reuse

`UiSelect` keeps its existing combobox/listbox contract, but its panel positioning and tracking are delegated to the same overlay runtime. Select must not reintroduce an independent fixed/absolute positioning implementation.

## Validation

The contract is covered at three levels:

1. runtime unit tests for placement, flip, clamp, and oversized panels;
2. Vue/React component contract tests for roles, attributes, and disabled state;
3. Playwright browser tests for real Popover behavior, Escape, light dismiss, focus restoration, keyboard navigation, viewport containment, and the existing Select top-layer regression.

Dedicated interaction tests also disable `HTMLElement.prototype.showPopover` / `hidePopover` before mounting the Vue/React fixtures, forcing the fixed-position fallback rather than relying on the browser's default support. Additional controlled/readonly/reset scenarios are opt-in through `contract-fixtures=1`; they do not alter the default Design Lab layout.

`tests/e2e/overlays.spec.ts` covers trigger translation, async content growth,
zoom, ID associations, dismissal, focus return, viewport containment and
cancellation on disable/unmount.
Both adapters additionally render server markup and hydrate it in their
`overlay-hydration.test` suites; these are DOM hydration checks, not assistive
technology acceptance. The cross-browser configuration also selects the tracking,
audit, form semantics/behavior and overlay regression suites alongside its
existing interaction suites.

## Cursor-anchored menus

`AnchoredOverlayOptions` accepts either a `trigger` element or a `point`. A point is a zero-size
rect, so a cursor menu reuses the same flip, viewport clamp and zoom compensation; `placement: 'auto'`
still opens below the pointer and flips above when the lower viewport cannot fit the panel. `trigger`
is optional, and `focusReturn` names the element that receives focus when a point-anchored overlay
closes, because a cursor open has no trigger to return to. `previousFocus` reports the element that
held focus before the panel opened, which the adapter records at show time.

A closed manual popover keeps keyboard focus inside itself in Firefox: the engine only drops focus on
its own schedule, leaving a menu row focused in a hidden surface. Chromium and WebKit move focus out
during `hidePopover()`. A manual overlay is the case where the runtime already owns dismissal, so it
owns the matching focus release: `hideAnchoredOverlay` returns focus to `focusReturn`, then
`trigger`, then `previousFocus`, and blurs the closed row when no owner exists. Light-dismissed
overlays leave focus to the engine.

The fallback containing-block correction reads the panel's own layout box. A panel that has not been
laid out reports an all-zero rect, which would turn the correction into a duplicate offset, so the
correction is skipped in that case. Native popovers are unaffected.

`UiContextMenu` is the adapter for this path. It renders `role="menu"` with `menuitem`,
`menuitemradio` and `menuitemcheckbox` rows, separators and headings, and reuses the DropdownMenu
keyboard contract: ArrowUp/ArrowDown wrapping, Home/End, disabled-item skipping, first-enabled-item
focus on open, Escape and selection closing the panel, and focus restoration. Dismissal reasons stay
`escape` and `outside`; a cursor menu has no trigger, so only the document listeners apply.

A new `point` moves an already-open context menu from its current on-screen position without closing it or replaying the entrance. An additional move can redirect an in-progress slide. The placement rules still apply, and reduced motion repositions immediately. The menu dismisses on an outside secondary click only if no context menu handler claims that event with `preventDefault()`.

`data-neoverse-overlay-side` records which side (`top`, `bottom`, `left`, or `right`) the panel opened on. A cursor menu without measured shared-element geometry uses the opposite edge as its presence origin. All overlay panels (`UiPopover`, `UiDropdownMenu`, `UiContextMenu`, `.ui-context-menu__submenu`, `UiSelect` popovers, and `UiDialog`) share the same `.ui-overlay-panel` typography (`body-sm`), `material-glass-elevated` optical surface with unobstructed directional Glass rim lighting, and `control-feedback` row hover states; modal dialogs stay at `--neoverse-layout-layer-modal` (`show()` + `.ui-dialog__backdrop` scrim transition and scoped Tab trapping) so higher-layer browser extension overlays remain unobstructed above them, while exposing `size` (`sm`, `md`, `lg`) and `role` (`dialog`, `alertdialog`) options.

A row with `children` opens a submenu on click, hover or ArrowRight, and ArrowLeft
returns focus to the parent row. The submenu is a second `popover="manual"` in the
top layer beside the panel, so the parent rows stay visible and the panel keeps its
width. The adapter registers the column with `containedElements` so a pointer press
inside it does not dismiss the parent. Both surfaces dismiss together.

The expanded parent row keeps the regular hover wash when the pointer moves into the submenu. The open state does not add a second background beneath that wash.

The column overlaps the panel edge instead of merely touching it. The submenu
paints above the parent rim at the seam, leaving the uncovered perimeter visible.

`autoFocus` defaults to true. A pointer open passes `false` so the region keeps focus and an editor
keeps its selection highlight; arrow keys then enter the panel at its first or last row. A keyboard
open moves focus into the panel immediately.

Any new anchored overlay primitive should reuse this runtime before adding a new positioning implementation.
