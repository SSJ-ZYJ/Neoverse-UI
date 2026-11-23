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
effects stay in CSS; transformed or fading descendants also stay in CSS when
their nearest Glass surface isolates and clips both axes and they contain no
nested Glass. Shared selection indicators (`.ui-control-surface__indicator`,
`.ui-navigation-item__indicator`) are decorative content confined to their
surface, so their transitions never schedule edge frames. Unknown effects remain
tracked. Hidden subtrees do not sustain a frame loop; visibility and clipping
mutations trigger reevaluation, including animations that are already running.
These rules do not change the edge shader.

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
