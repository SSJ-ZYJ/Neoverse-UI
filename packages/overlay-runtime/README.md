# @neoverse-ui/overlay-runtime

Framework-agnostic DOM runtime for Neoverse UI top-layer overlays.

It owns anchored positioning, Popover API fallback, scroll/resize tracking, and fallback light-dismiss behavior. Framework adapters remain responsible for component state, semantics, and focus policy.

## API

- `resolveAnchoredPosition` computes viewport placement without DOM access.
- `positionAnchoredOverlay` updates the open panel's CSS custom properties.
- `showAnchoredOverlay` opens a panel, positions it, and installs tracking/dismiss handlers.
- `hideAnchoredOverlay` closes a panel and removes its handlers.
- `stopOverlayTracking` removes handlers for a captured panel during cleanup.
- `supportsPopover` and `isOverlayOpen` expose the native/fallback state checks.

`AnchoredOverlayOptions` supplies the trigger and panel elements, their gap/position CSS variable names, optional width matching and placement, a fallback-open class, and an optional dismiss callback. Placement is `auto | bottom-start | bottom-end`; auto can flip upward and all positions clamp to the viewport. The adapter owns panel visibility CSS and component state.

```ts
import { resolveAnchoredPosition } from '@neoverse-ui/overlay-runtime';

const position = resolveAnchoredPosition({
  trigger: { top: 10, right: 110, bottom: 50, left: 10, width: 100, height: 40 },
  overlayWidth: 200,
  overlayHeight: 100,
  viewport: { width: 800, height: 600 },
  gap: 8,
  placement: 'auto',
});
```

The runtime requires a browser DOM only for its element operations. Importing the package and using `resolveAnchoredPosition` is safe in a server consumer. Call cleanup with the captured mounted panel; do not rely on a framework ref still being populated after unmount. Controlled adapters must reconcile a dismiss request against the parent-owned open prop.
