# @neoverse-ui/glass-runtime

[Chinese](README.zh-CN.md)

Shared optional directional Aurora Glass edges for Neoverse UI. Aurora Glass is the single shared glass material; its Light, Standard, and Immersive tiers share the same name. Obtain display labels from `glassMaterial` in `@neoverse-ui/tokens`; see [material standards](../../docs/architecture/material-standards.md). Package and renderer identifiers remain stable.

In both themes, the WebGL rim brightens the underlying colors proportionally
where supported. The edge does not sample or displace neighboring pixels.
CSS still owns the surface tint, blur, and shadows;
see [edge reflection](../../docs/architecture/material-standards.md#aurora-glass-edge-reflection).

Opacity, clipping and overlay occlusion still apply. Light has a moderate
upper-left and lower-right focus; dark buttons retain their focused catches.
Reduced transparency disables the renderer. The CSS fallback uses alpha-only
gradient masks and backdrop brightness. The historical `native` backend remains
an explicit API option, but full-surface SVG displacement must not be made the
default or used as the Glass repair described in the
[repair guardrails](../../docs/architecture/material-standards.md#glass-repair-guardrails).

The WebGL renderer also recognizes the shared Input, Textarea, Select, choice
and Disclosure classes, plus `UiTable`, prose tables and prose details. It draws the table perimeter and
visible internal cell borders on the same canvas, while CSS keeps the table's
single backdrop filter. The final row's local lower catch stays on the CSS edge
path only, so the renderer's perimeter is not doubled by a second mint line.
A Select panel in the browser top layer uses a local CSS
edge field because the shared canvas cannot paint above that layer. The optional
historical `native` backend does not extend its displacement filters to these
implicit control, disclosure and table surfaces. Native text inputs, disclosures and table grids inside
top-layer popovers or modals retain their existing inset styling because the
shared canvas cannot reach them.

Animation tracking redraws moving edges and occluders. Background-position-only
and paint-only effects stay in CSS; visual-only animations (transform, opacity,
filter) on non-Glass, non-occluder descendants and `::view-transition` masks
do not spin edge repaints. Layout-affecting CSS/WAAPI animations (including
non-Glass siblings that shift neighboring Glass controls, `details::details-content`
unfolds, and `neoverse-motion-start` events) stay tracked across the document,
and active motion bypasses the passive 60 fps scroll/viewport-resize cap so edges
remain locked to every display refresh. Element `ResizeObserver` callbacks
repaint synchronously before paint, and one final settle frame is always drawn
when motion ends.

Surface geometry tracks 2D CSS transforms (`rotate`, `scale`, `zoom`, `transform`
matrices) via oriented basis vectors rather than an inflated axis-aligned bounding
box, resolves percentage and CSS §4.5 proportionally clamped border radii,
attenuates edge opacity smoothly during `filter: blur(...)` transitions, avoids
clipping `position: fixed` surfaces by non-containing `overflow: hidden`
ancestors, and excludes native top-layer elements (`:popover-open`, `:modal`,
leaving `overlay: auto`) from the document WebGL canvas while keeping them as
occluders so they never paint a duplicate lagging edge behind local CSS rims.

## On-demand optical allocation

`mount()` installs observation only. It allocates the shared canvas, WebGL
context, shader program and buffers when the first drawn, eligible Glass surface
appears, so a page whose automatic surfaces all resolve to Solid keeps no optical
resources. The renderer responds to a Glass surface that mounts later and
releases the canvas, context, native SVG filters and cached maps after the last
eligible surface disappears; `destroy()` always releases them. A suspended
renderer still activates the canvas if the page needs one, but paints on
`resume()` or an explicit `refresh()`.

## Pausing edge repaints for page transitions

`suspend()` and `resume()` are an incremental, opt-in lightweight path for
whole-page position/opacity transitions (for example a route slide). While
suspended, the renderer keeps the last painted frame, withdraws any pending
frame, and skips automatic repaints: no document-wide surface enumeration, no
`elementsFromPoint` occlusion probes, no canvas redraw. `resume()` ends the pause
and runs one full forced refresh so edges, occlusion and theme match the settled
DOM. Both calls are idempotent, and `mount` / `refresh` / `destroy` keep their
existing semantics; existing callers upgrade without changes.

```ts
// Start of a whole-page translate/opacity transition:
renderer.suspend();
// When the transition settles (and from a failsafe timeout, in case the
// transitionend/animationend event never fires in a background tab):
renderer.resume();
```

Safety boundary: the lightweight path is only for position and opacity changes.
The frozen frame does not track geometry, so any size, stacking-order or
top-layer (popover/modal) change while suspended needs a full refresh — call
`refresh()` (which still paints while suspended) or `resume()`. Do not suspend
across transitions that scale surfaces or open overlays. Reduced transparency
and WebGL context loss still release the canvas while suspended; a suspended
mount defers its first paint until `resume()`.

Pointer-transparent overlays that are guaranteed to sit above ordinary Glass
surfaces can opt into edge occlusion with
`data-neoverse-glass-occluder="topmost"`. Do not use this marker on an overlay
that can be underneath those surfaces. The renderer limits each edge pass to six
occluding rectangles; this marker controls visibility and does not sample or
refract background pixels.

During a repaint, edges in the same scrolling region share ancestor clipping
measurements. The renderer remeasures clipping on the next paint so nested
scrolling neither exposes edges outside a scrollport nor leaves stale edges behind.

Browser zoom and viewport resizing share the normal edge repaint limit. The
last resize stays queued, and its paint uses the latest geometry and pixel
ratio. Palette entries remain cached when the resolved root tokens are unchanged.

Runtime unit tests cover WebGL selection, context loss and restore, shared canvas
reuse, frame scheduling and reduced-transparency transitions. Chromium integration
tests check the retained CSS blur, renderer ownership and no-WebGL fallback.
An isolated Linux Chromium + SwiftShader suite records lit/unlit pixel deltas
for edge continuity, corner response and interior leakage across three tiers,
two themes and four fixed backdrops. It is a diagnostic regression signal, not
a validated 0.2.0 color-reference comparison or proof of spatial refraction.
Final appearance, live-backdrop behavior and performance still require
manual rendering acceptance.

```sh
bun add @neoverse-ui/glass-runtime
```

```ts
import { createGlassRenderer } from '@neoverse-ui/glass-runtime';

const renderer = createGlassRenderer();
renderer.mount();
```

For material contracts and runtime guidance, see the [Neoverse-UI repository](https://github.com/SSJ-ZYJ/Neoverse-UI).
