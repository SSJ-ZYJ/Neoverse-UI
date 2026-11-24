# @neoverse-ui/motion

[Chinese](README.zh-CN.md)

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
   `expressive`), easings (`linear` / `standard` / `emphasized` / `accelerate` /
   `spring`), travel distances, presence geometry, and the particle-dissolve
   timing. Under `prefers-reduced-motion` the whole scale collapses to instant.
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

Presets: `fade`, `rise`, `sink`, `pop`, `veil`, `bloom`, `haze`, `sway`,
`spring`, `slide-start`, `slide-end`.
`pop` grows from the origin edge — point the origin at the launching edge with
`presence('pop', 'top')` so a popover grows out of its trigger (edge to edge).
`veil`, `bloom`, and `haze` carry the blur pass; `bloom` also grows from the far
scale, `haze` settles over the expressive duration without travel, `sway` lands
slightly tilted, and `spring` travels a short distance on a curve that passes
its endpoint once.

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

### Fallback profiles

Blur is a depth cue, not a requirement. Set `data-neoverse-motion-fallback`
(`presenceFallbackAttribute`) on any ancestor to force the declared fallback:

| Profile | Result |
| --- | --- |
| `no-filter` | Skips the blur passes; `veil` and `haze` arrive through near scale, `bloom` keeps its far scale. Also applied automatically by `@supports not (filter: blur(1px))` and usable as a low-power opt-out. |
| `fade-only` | Reproduces an engine without individual `translate` / `scale` / `rotate` properties: every preset collapses to its opacity change. |

`presenceFallbacks` lists both values. The Design Lab's Presence specimen renders
the same presets under each profile so the result is visible, not described.

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

## Appearance and control size transitions

`animateAppearanceChange` takes the update rather than owning the application's
theme or language state. Keep the control and surrounding UI mounted, and
update the live DOM inside the callback:

```ts
import { animateAppearanceChange, attachLayoutSizeMotion } from '@neoverse-ui/motion';

await animateAppearanceChange(
  () => { document.documentElement.dataset.theme = 'dark'; },
  {
    kind: 'theme-reveal',
    origin: themeControl,
    theme: { current: readAppliedPalette, next: 'dark' },
  },
);

await animateAppearanceChange(
  () => renderLocale('en'), // Update the UI and documentElement.lang together.
  { kind: 'locale' },
);

// Mark the descendants that should resize with `data-neoverse-size-motion`.
const detach = attachLayoutSizeMotion(controlGroup);
// Call detach() when the group unmounts.
```

- `theme-reveal` uses the trigger's center (even on keyboard activation) and a
  feathered circle. `theme-fade` preserves a uniform crossfade; it also runs
  when a usable origin or animated mask is unavailable. The reveal duration and
  feather width are `--neoverse-motion-theme-reveal-duration` and
  `--neoverse-motion-theme-reveal-feather`.
- Appearance motion animates only an outgoing snapshot; the live incoming DOM
  stays clickable beneath it. A new appearance request interrupts the current
  effect rather than queuing, without dropping the earlier DOM update.
  Pass `theme.current` and `theme.next` as resolved palette keys on each theme
  request. A request for the currently covered palette reverses the visible
  effect in place, without discarding the snapshot or repainting the viewport
  from a fresh start. Read the applied palette in `current`; the control can
  show the latest requested selection immediately. On reversal the update
  callback commits the requested palette once the old snapshot covers the
  live page again. Keep that callback scoped to applying the palette.
  The snapshot owns the palette interpolation. Color and shadow transitions
  started by the callback commit to their end values before the live page is
  revealed; existing effects and layout motion keep running.
- `locale` fades the outgoing view over the updated UI. Set the new content and
  `document.documentElement.lang` in the same render batch. In Vue, return
  `nextTick()` after the state update. In React, commit the update with
  `flushSync` inside the callback. With reduced motion, updates apply immediately;
  without View Transitions, the theme falls back to a token color transition
  and the language updates directly.
- `attachLayoutSizeMotion` animates the actual `width` and `height` of the same
  elements. Pass `targets` to select a scoped group, and `attributes` when
  data attributes drive its sizes. The default watches `class`, `style`, and
  `hidden`, plus content changes. Keep the group small, use stable DOM nodes,
  and detach on unmount. New elements, viewport resizes, and native resize
  gestures do not animate. Explicit CSS `zoom` changes can use a `zoom`
  transition on the spatial role.
  Mark a compact label inside a target with `data-neoverse-size-motion-label`,
  or pass its selector as `singleLineLabels`. During a size change, including
  a language change, the label stays on one line and clips only the text that
  does not yet fit. The label uses its normal typography and full text at rest
  without reserving space for other translations. Do not mark content intended
  to wrap, such as a description.

### Keep translated actions on one line

For compact actions with a trailing icon, let the current label set the natural
width and keep it on one line. Keep the icon in a non-shrinking slot, use the
component's gap, and let the text alone truncate in a very narrow container.
Do not set the label track to the longest translation unless the surrounding
layout needs a fixed-width control; otherwise short labels leave a large gap
before the icon. For fixed-width controls, reserve space outside the label
and icon pair, and render only the current translation as the accessible label.
For intentional width animation, use the temporary no-wrap behavior in
`attachLayoutSizeMotion` or the dedicated layout width primitive.

The Transitions specimen (`foundation-motion-playground`) demonstrates all
three effects. The Inspector's isolated preview link follows its visible label.

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
| Easings | `linear` · `standard` · `emphasized` · `accelerate` · `spring` |
| Distances | `near` · `mid` · `far` (space-2 / space-4 / space-8) |
| Particle | `duration` 910ms · `enter-delay` 455ms · `enter-duration` 234ms |

For architecture and contribution guidance, see the
[Neoverse-UI repository](https://github.com/SSJ-ZYJ/Neoverse-UI).
