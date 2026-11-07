# @neoverse-ui/motion

The single motion contract for Neoverse UI: tokens, the presence engine, and the
page-change choreography. Everything animated in the library resolves to what is
shipped here — components never hardcode durations, easings, or keyframes.

```sh
bun add @neoverse-ui/motion
```

Import the shared motion layer with:

```css
@import '@neoverse-ui/motion/css';
```

`@neoverse-ui/tokens` is installed as an internal runtime dependency.

## Layers

1. **Token scale** (`@neoverse-ui/tokens`): durations (`fast` / `standard` /
   `expressive`), easings (`linear` / `standard` / `emphasized` / `accelerate`),
   travel distances, presence geometry, and the particle-dissolve timing. Under
   `prefers-reduced-motion` the whole scale collapses to instant.
2. **Semantic roles**: `feedback`, `state`, `spatial`, `enter`, and `exit`.
   Components reference a role, never a raw value, so one token edit retunes
   the system.
3. **Presence engine** (`.nv-*` classes): one enter/exit contract for every
   framework, driven by the `data-neoverse-motion` preset attribute.
4. **Layout width motion**: `captureLayoutWidths` / `animateLayoutWidths` keep a
   group of boxes in step when their content changes size.
5. **Page-change choreography**: the WebGL particle dissolve with a CSS
   snapshot fallback, orchestrated by `startViewTransition()`.

## Presence engine

Pick a preset, and elements arrive and leave along the same path — an exit is
literally the enter reversed, which is what keeps motion feeling continuous.

```vue
<script setup>
import { presence } from '@neoverse-ui/vue';
</script>

<Transition name="nv">
  <span v-if="open" v-bind="presence('pop', 'top')">…</span>
</Transition>
```

Presets: `fade`, `rise`, `sink`, `pop`, `veil`, `slide-start`, `slide-end`.
`pop` grows from the origin edge — point the origin at the launching edge with
`presence('pop', 'top')` so a popover grows out of its trigger (edge to edge).

- `<TransitionGroup name="nv">` adds FLIP continuity: repositioned siblings
  glide (`nv-move`) instead of teleporting. Stagger entries with
  `staggerStyle(index)` from `@neoverse-ui/vue` (exits stay immediate).
- `.nv-appear` (or `presenceAppearClassName`) plays the preset on first
  render with zero JavaScript — mount-time entrances for spinners, check
  marks, tooltips.
- `.nv-vanish` + `useUiPresence()` / `<UiPresence show>` in React: an
  animation-driven exit that unmounts on `animationend`.
- `.nv-presence`: zero-JS enter/exit for top-layer `[popover]` surfaces via
  `@starting-style` + `allow-discrete`. Enter and exit are both interruptible:
  CSS transitions re-target from the current frame, and entering/exiting
  elements of the same list animate in parallel.

## Layout width motion

A language, theme, or label swap changes how much room a group of boxes needs.
Animating that size change keeps the group on one curve instead of letting each
box — or the grid around it — jump.

```ts
import { animateLayoutWidths, captureLayoutWidths } from '@neoverse-ui/motion';

const samples = captureLayoutWidths(document.querySelectorAll('[data-resizing]'));
// …swap the content…
animateLayoutWidths(samples);
```

The two phases are required: the natural width only exists after the update.

- Only boxes with client rects are sampled, so a hidden breakpoint or a detached
  node never becomes an animation target.
- Every natural endpoint is resolved before the first animation starts. Animating
  one box changes the surrounding grid, which would otherwise skew the endpoint
  read for the boxes that follow.
- The animation is written as a `width` keyframe pair on the `spatial` role and
  releases its fill when it ends, so each box returns to automatic sizing.
- Boxes that **grow** keep their replacement copy on one line while the width
  catches up: `white-space: nowrap` and `overflow: clip` are applied inline,
  then removed at the end of the run or on cancellation. Without this lock the
  new, longer copy wraps inside the still-narrow box, raising its height and
  shifting the surrounding layout until the animation finishes. Shrinking boxes
  are left untouched.
- A box whose width did not change (within `tolerance`, 0.5px by default) is left
  alone. Calling `animateLayoutWidths` again during a run continues from the frame
  it reached, because the captured width is read from the animated style.
- Reduced motion, a missing duration token, or no Web Animations API resolves to
  no animation and the natural width.
- Endpoints are measured from the rendered layout, so consumers must let their
  fonts finish loading (`document.fonts.ready`) before measuring — a font swap
  during the update changes the natural width after the animation has started.

`captureLayoutWidths` and `animateLayoutWidths` are framework-agnostic; the Vue
adapter is `useLayoutWidthMotion` from `@neoverse-ui/vue`. The Design Lab's
`foundation-motion-width` specimen shows the result on a language switch.

## Page-change choreography

```ts
import { startViewTransition } from '@neoverse-ui/motion';

await startViewTransition(() => {
  route.content = next; // swap the DOM
});
```

Preference order:

1. **WebGL particle dissolve** — if the browser has WebGL2, the element marked
   `data-neoverse-dissolve` is rasterized (HTML-in-Canvas capture where
   available, synthetic theme-colored dust otherwise) and erodes into fine
   dust on a pointer-transparent fullscreen canvas; the incoming region fades
   in late (`--neoverse-motion-particle-enter-delay/-duration`). The shared
   sampling spacing favors a lighter field; tune further with
   `particleDissolvePresets` (`high` / `medium`).
2. **Crossfade** — without WebGL2 the View Transition's own crossfade runs,
   timed by the spatial role. A dissolve that cannot be particles simply
   fades.
3. **Plain update** — reduced motion, or no View Transition support: the DOM
   update runs directly.

Force a pipeline with `particle: 'capture' | 'synthetic' | 'crossfade' | false`.

Guarantees:

- **Interruptible** — a new call skips the running choreography at its current
  frame; rapid navigation never queues.
- **Parallel** — every layer is `pointer-events: none` while animating; the
  new page is interactive while the old one is still dissolving.
- **Stable chrome** — give persistent elements `view-transition-name` so they
  never flash between states.

## Token reference

| Group | Values |
| --- | --- |
| Durations | `fast` 140ms · `standard` 240ms · `expressive` 420ms |
| Easings | `linear` · `standard` · `emphasized` · `accelerate` |
| Distances | `near` · `mid` · `far` (space-2 / space-4 / space-8) |
| Particle | `duration` 910ms · `enter-delay` 455ms · `enter-duration` 234ms |

For architecture and contribution guidance, see the
[Neoverse-UI repository](https://github.com/SSJ-ZYJ/Neoverse-UI).
