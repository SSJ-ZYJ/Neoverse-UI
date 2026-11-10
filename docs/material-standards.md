# Aurora Glass material and interaction standards

Status: adopted

Components use shared material and effect roles. Concrete optical values belong to
`packages/tokens/src/material.css`, `effects.css`, and `control-effects.css`; component tokens are compatibility
aliases and consumers never need a second material implementation.

## One material, three tiers

**Aurora Glass / 极光玻璃** is the only display name for the shared glass
material. Light / 轻薄, Standard / 标准, and Immersive / 厚实 are tiers of that
same material, not separate glass styles. The `glass-*` surface values, CSS
classes/variables, package names, and existing TypeScript APIs are stable
technical identifiers and do not designate other glass styles.

Consumers obtain the shared name and short tier names from Tokens:

```ts
import { glassMaterial } from '@neoverse-ui/tokens';

glassMaterial.name.zh; // 极光玻璃
glassMaterial.name.en; // Aurora Glass
glassMaterial.tiers.subtle; // { zh: '轻薄', en: 'Light' }
glassMaterial.tiers.elevated; // { zh: '标准', en: 'Standard' }
glassMaterial.tiers.immersive; // { zh: '厚实', en: 'Immersive' }
```

The tier keys map to the stable surface values below. Blur, frost, refraction,
and transparency describe optical properties, not additional material names.

| Tier | Surface | Blur | Background opacity | Default use |
| --- | --- | --- | --- | --- |
| Light / 轻薄 | `glass-subtle` | 12px | 15% | Buttons, compact controls, inset/form/reading surfaces, chrome |
| Standard / 标准 | `glass-elevated` | 18px | 20% | Cards, popovers, select panels, terminal |
| Immersive / 厚实 | `glass-immersive` | 24px | 30% | Explicit immersive surfaces |

Opacity means the alpha of the background fill, not CSS `opacity` on the whole
element. Both themes use an opaque base tint and apply the tier alpha exactly once.
The same tier has the same base alpha across components. Dark filled buttons scale
the selected tier's blur by `--neoverse-control-button-blur-scale` (0.5), giving
6/9/12px sampling so compact controls retain softened background detail. Light
buttons use scale 1; saturation, contrast and brightness remain tier-owned.
Two independent
surfaces layered together still composite; grouping owners explicitly use
`surface="none"` or `glassNesting="inherit"` for borrowed material. Ghost controls
have no independent plate. Reduced transparency uses an opaque tint and no blur.

## Aurora Glass edge reflection

Light uses a directional edge: the shader combines theme accent
colors, varies chroma with effective opacity, and caps fragment alpha at 0.34.
The light canvas uses normal composition and the release's WebGL blend factors;
large surfaces use edge opacities 0.36 / 0.38 / 0.40, and no extra light alpha
gain multiplies the tier value. Chroma and gain remain optional multipliers,
both defaulting to 1 in light mode. The upper-left tinted catch reads strongest;
the lower-right indigo catch stays above the straight middle. It does not reach
parity with the upper-left by raising the ceiling, because a raised ceiling
thickens the whole pale rim instead of only that corner.

The light fragment keeps only 30% of that theme mix and resolves the rest toward
the neutral edge light. A pale backdrop already carries the page's cool hue, so
the previous full-saturation mix added a visible cyan band on top of it; the
neutral majority keeps the rim translucent and lets the backdrop's own color
show through. The theme accents remain visible as the minority tint and at the
directional corners.

Light keeps that tinted direction but caps its cool excess: 72% of the blue lead
over the red/green content is trimmed, so the right catch stays cool without the
release's threefold margin that read as a blue band on pale pages. The cap
applies to light surfaces only; dark composition is unchanged.

This is a translucent, theme-colored highlight composited over the backdrop,
not a sampled or displaced image of the background. Its apparent color and
contrast depend on both the theme accents and the pixels underneath. Dark
retains its overlay response. Both themes share one canvas; CSS continues to
own the body tint, blur and shadows.

Opacity, clipping and overlay occlusion still apply. Light retains a continuous
fine edge while moderately emphasizing the upper-left and lower-right corners;
dark buttons retain their focused catches. Reduced transparency disables the renderer. The CSS fallback uses
alpha-only gradient masks and backdrop brightness. The historical `backend: 'native'`
option remains available for compatibility, but must not be used as the repair
approach prohibited below.

The canvas is fixed to the viewport and the rim is painted in viewport
coordinates, so every scroll request has to reach it. The frame cap defers a
repaint by at most one interval and never drops the request; a discarded request
would leave the rim painting the previous offset, detached from a surface that
has already scrolled.

### Painted stroke for window-anchored chrome

The refracted rim only brightens pixels the backdrop already carries, so a
surface sitting on an empty page area has no rim to show. Surfaces anchored to
the window edge, where that is the normal case, opt into a painted stroke with
`data-neoverse-glass-edge-stroke`. The stroke comes from
`--neoverse-material-edge-stroke`, which is `0 0 transparent` by default and
therefore inert for every other surface; dark themes resolve it to the strong
border role plus a top catch. The renderer path keeps the stroke ahead of the
runtime shadow, and the reduced-transparency fallback keeps it ahead of the
material highlights. The stroke is geometry, not refraction: it does not track
backdrop color, which is what keeps a nav bar's silhouette readable while it
scrolls over both empty and content-heavy areas.

Token and runtime tests guard tier optics, shader composition, frame scheduling,
canvas ownership and reduced-transparency transitions. Chromium integration tests
also verify the CSS blur and fallback when WebGL is unavailable. The isolated
Linux Chromium + SwiftShader optical suite records actual lit/unlit edge
pixels across both themes, three tiers and four backdrops; the short CI suite
checks measurable edge regressions. Historical 0.2.0 color-reference matching,
true backdrop response and overall appearance are not established by those
diagnostic measurements and still require manual rendering acceptance.

### Glass repair guardrails

Glass repairs must preserve all of the following at once: the actual tier-owned
background blur, a continuous narrow edge on all four sides and corners, color
that responds to the underlying content, and interactive performance. The upper-left
and lower-right catches may be stronger, but the other edges must remain visible;
an uninterrupted bright strip across the top is not the desired profile.

The following repair approaches are prohibited. These are observed regressions,
not alternative styles to retry when a different test fails:

- Do not switch the default renderer to full-surface SVG displacement in
  `backdrop-filter`, or replace the existing blur with a generated filter. The
  historical opt-in `native` backend is not a solution for this repair and must
  not be promoted into the default path.
- Do not add a page screenshot, cloned DOM, reconstructed backdrop or continuous
  capture layer to simulate refraction; prior capture layers caused stutter and
  dark or grey edges. Do not paint a fixed white, mint or blue outline or a
  theme-colored highlight and call it a sample of the backdrop.
- Do not strengthen the entire top edge to make the corners brighter: this makes
  that edge look thicker than the others. Do not apply full corner-only focus or
  let the top, bottom, sides or the other two corners disappear. The two stronger
  corners must remain part of one continuous, fine silhouette.
- Do not replace the established compositing with another blend mode or change
  its gain in isolation. An unverified overlay experiment made the light edge
  disappear; a colored source-over layer can also mask the true backdrop. A
  change must preserve visible edges and their response to the actual background.
- Do not compensate for a failed edge by removing, overriding, or replacing the
  tier-owned body blur, changing opacity to an opaque fill, or adding a bright
  border. Keep blur, color, edges and performance together as one contract.
- Do not fix a visual mismatch by only changing an assertion or relaxing a
  check. Unit mocks, computed styles, a single grey background, and passing
  color thresholds do not establish a correct rendered appearance or performance.

Before changing the effect, compare the relevant historical implementation and
the changes made after it; retain independently accepted corrections rather than
blindly reverting an entire commit. The light edge in `7f43d37` uses a
theme-colored source-over highlight. The preceding `eda31c3` uses a
backdrop-dependent overlay transfer. Neither description proves spatial
displacement, so do not describe either as sampled backdrop refraction. A later
full-focus experiment caused the other edges to disappear; partial focus then
restored part of the original contour. Preserve useful corner adjustments when
comparing earlier commits rather than restoring an old appearance wholesale.

Keep the current CSS body blur and the renderer's scheduling optimizations while
evaluating a change. Verify all three surface tiers and representative controls
over changing, colored and patterned backgrounds, including live DOM and canvas
content. Inspect rendered blur and edge continuity rather than computed styles
alone; check the light and dark themes and interactive responsiveness. Run
browser, WebGL, build and performance checks remotely under the project safety
constraint. Record the manual optical acceptance only after the actual candidate
has passed the relevant checks; report any missing verification or visual review
explicitly.
Do not push successive diagnostic commits or trigger repeated failing CI runs while
the repair is still being developed.

## Selection and customization

Existing Vue and React control adapters accept all three Aurora Glass surface tiers.
Vue SegmentedControl supports all three; there is no existing React SegmentedControl
adapter in the current matrix, and this material migration does not add one.
Dock defaults to `glass-elevated`; ControlSurface defaults to `glass-subtle`. The `chrome` preset and
`ui-surface-chrome` class have been removed; replace explicit uses with
`glass-subtle` / `material-glass-subtle`. There is no compatibility alias.
The `--neoverse-control-chrome-*` and `--neoverse-effect-floating-chrome-*` tokens
and their TypeScript exports are removed. Customize the selected Aurora Glass tier for
material and `--neoverse-control-surface-*` for grouping geometry instead.
`inset` uses Light optics; status colors use shared semantic
effect roles. Typography, geometry, and native control semantics remain independent.

```vue
<UiButton surface="glass-elevated">Save</UiButton>
<UiButton surface="glass-subtle" class="my-tool">Open</UiButton>
```

```css
/* Global tier customization. The existing public token names remain supported. */
:root {
  --neoverse-material-glass-elevated-blur: 22px;
  --neoverse-material-glass-elevated-transparency: 25%;
}

/* Subtree or single-instance customization; composition happens at the owner. */
.my-tool {
  --neoverse-material-glass-subtle-blur: 16px;
  --neoverse-material-glass-subtle-transparency: 18%;
}
```

Changing a tier's blur or alpha updates all its material owners without independently
overriding `backdrop-filter`. `cssVariables.material.glass` exposes the public names;
`cssVariables.effects` exposes the interaction vocabulary.

## Interaction policy

- Hover is available only on hover-capable devices. It uses foreground, local light,
  and shadow; it does not change the Aurora Glass base alpha or filter.
- Press takes precedence over hover, uses the shared press light/shadow, and restores
  hover or rest on release. It does not select an option until native activation.
- Selected, checked, and expanded states persist independently of transient press.
  Native click, Enter, Space, cancellation, and disabled semantics are retained.
- Disabled/loading controls cannot activate or show hover/press feedback. Their
  child content shares 0.6 opacity; native editable fields use an equivalent shared
  foreground-alpha role. The material owner remains at opacity 1. Readonly
  controls retain focus and text selection where their native semantics permit it.
- Focus rings are independent. Reduced motion removes animation but retains state
  feedback. Reduced transparency retains feedback over the opaque fallback.

Status tint, scrollbar affordances, Skeleton/StatusIndicator pulses, and Terminal ANSI
opacity are semantic effects, not alternative Aurora Glass tiers. Their optical weights use
the shared effect scale. Gradient positions, clipping masks, animation endpoints
(`opacity: 0/1`), and layout dimensions are structural values, not material alpha.

## Preserve component identity

Tier standardization changes only the Aurora Glass base blur and alpha. Established primary/
secondary hierarchy, selected accent fields, directional edge light and floating
Dock shadows live in shared `control-effects.css` roles. Compatibility component
tokens reference those roles; they do not define optical recipes themselves.
`cssVariables.effects.controls` exposes these roles for customization.

Badge uses a real thin border, a shared 10% semantic field in both themes,
and the shared subtle edge highlight, inner glow and bloom composition.
Its background filter aliases the shared Light tier of Aurora Glass (12px blur); labels
stay sharp. It adds no surface gradient or outline. Every variant uses
the same border geometry; the existing `sm` / `md` / `lg` size classes and optical
label alignment remain intact. Neutral uses secondary text as its tint source,
with the same fill and border strengths as the four status variants, so its
visible silhouette does not shrink into the backdrop. Both themes mix the semantic status color with
transparency; no fixed white backing is added in light mode. Light labels use
vivid midtone blue, mint, amber and red ink through the shared label effect roles,
while dark labels use luminous status ink. Both are exposed
through the per-variant `--neoverse-badge-*-foreground` tokens. The shared
`--neoverse-badge-backdrop-filter` controls background blur for all five variants.
Reduced transparency, forced colors, and browsers without backdrop-filter use
an opaque semantic field with no background filter.

Light semantic status colors are pale blue, mint, yellow and pink across the
library, not Badge-only overrides. Their `*-foreground` roles provide contrasting
ink on these fields. Text-only validation, terminal feedback and destructive menu
items use shared `status-*-text` effect roles so pale fields do not turn into
illegible text. Dark status colors and text-only feedback retain their palette.

Disclosure panels use the shared inset outline roles in every state, together
with the shared control shadow. The inset outline separates the panel from pale
or textured backdrops without changing its dimensions, Aurora Glass fill or blur. Vue,
React and prose `details` consume the same styles.

Timeline and StepFlow use `UiSurface` with the Light tier of Aurora Glass for their markers and content.
Timeline dates precede each title; thin rails remain continuous between markers.
StepFlow uses circular numbered markers, replacing completed numbers with a check.
Current steps use a quiet accent contour and the shared info Badge for their status
label, with no full-height side accent inside the content card; other status labels
remain text and future steps retain neutral markers. Container-based horizontal/vertical layout, native
list/date semantics and consumer-owned state remain unchanged.

A selected SegmentedControl slider and a selected navigation item use a local accent
field. Dock trailing groups retain a local grouping wash. These fields express
selection or grouping, never create another backdrop filter, and remain consistent
through hover and press. The surrounding Aurora Glass plate keeps its tier alpha/filter.
Unselected segmented options hover and press on the neutral foreground
(`segmentedControl.hoverForeground`) and keep that hover wash while pressed; only
the press shadow and scale respond. The secondary accent stays reserved for the
active option, so pressing never flips the label color or previews selection.

Checkbox, RadioGroup and Switch use a pale blue selected field in Light mode,
with blue-grey checks and compact radio dots. Dark mode uses a translucent blue
wash and a fine illuminated edge, retaining visible backdrop color through the
selected controls. White marks remain readable. Reduced transparency restores an
opaque selected field. Both themes use a porcelain Switch thumb. A quiet top catch adds
depth. The Switch
keeps the same outer footprint, with a smaller thumb and even inset. Unchecked
controls retain their neutral Aurora Glass plate; disabled controls use neutral plates
and muted indicators. The selection field and keyboard focus are component tokens,
independent of Button labels and secondary accent colors. Native state semantics
remain unchanged.

Light error and success text feedback uses coral and mint midtones rather than
the deep foreground colors intended for pastel status fields. Field messages,
required markers and terminal text feedback share those theme-owned text roles.
The flat Playground sidebar uses the shared `--neoverse-color-accent-soft` selected
fill without the raised navigation gradient or shadow. This fill persists through
hover, press, release and focus; inactive entries keep their resting background.

Dark Button/Action/IconButton keep `ui-button__tone-field` transparent at rest:
neither a white fill nor a pale grey gradient covers the sampled Aurora Glass plate.
Their Aurora Glass tint uses neutral black through `components.button.glassTint` in dark
mode, preserving the selected tier's single background alpha with compact blur sampling. The body
therefore reveals the live blurred backdrop without imposing a navy hue.
Buttons explicitly disable native appearance and reset the platform background;
the selected material alone supplies the sampled fill and backdrop filter.
Primary hierarchy uses the existing foreground and shadow roles. Hover and press
reuse the shared selection field and retain their distinct shadow/press feedback.
The decorative field owns no backdrop filter, layout or hit testing;
disabled/loading retain the resting field while content alone is attenuated.
Ghost and `surface="none"` hide this field. The Aurora Glass owner continues to use one
tier background alpha and the compact sampling filter.

Dock's original desktop `lg` scale is 1.3, with a 0.9 optical type factor for
navigation and embedded segmented labels. Compact Dock remains `md` at 1. These
are geometry contracts, not material parameters. The original language option
height, inline/block padding and gap remain unchanged; the previous specimen
override to `md` and removal of the large type factor were reverted.

The light segmented selection plate retains its 0.3.0 pale outline and selected
gradient. The well keeps its tier-owned blur, and inactive options remain
transparent. The dark selection keeps its existing edge treatment.

Regression contracts compare the established light/dark command shadows and shared Aurora Glass Dock depth,
require the selected accent field at rest, and check that changing selection leaves
the Aurora Glass base unchanged. This keeps material cleanup from silently redesigning
controls.

| Component | Preserved visual role | Shared role / source |
| --- | --- | --- |
| Button, Action, IconButton | Command/primary depth, pointer light and quiet Ghost feedback | `command-*`, `primary-*`, `quiet-command-*` in `control-effects.css` |
| SegmentedControl | Shell depth and theme-specific selected accent field/fill/edge | `choice-rest-shadow`, `choice-selected-*` |
| Dock, ControlSurface | Selected Aurora Glass tier depth/boundary and local trailing group contrast | Aurora Glass material tokens, `control-surface-*`, `grouped-inset-*` |
| NavigationItem | Persistent selection at rest, hover and press | `selection-*`; distinct shared press feedback |
| Skeleton, Badge, Tooltip, Scrollbar | Highlight, edge, accent depth and thumb state effects | `placeholder-*`, `label-edge`, `accent-*`, `rail-*` |
| StatusIndicator | Established 42% glow, 88% pulse and separate glow/pulse spread | Status roles in `effects.css` |

## Audit and verification

The family rows cover all 32 matrix entries. `components/*.css` refers to both
`packages/tokens/src/components/` aliases and `packages/tailwind/src/components/`
rendering rules; Vue/React adapter sources are scanned separately.

| Component family / source | Previous divergence | Shared destination | Verification |
| --- | --- | --- | --- |
| Button, Action, IconButton, NavigationItem / `components/button.css`, both adapters | Light 18px, Dark 36px, separate layered fills | Selected Aurora Glass tier; shared hover/press roles | Tier/state/disabled tests |
| SegmentedControl / `components/segmented-control.css` | 6px filter and theme-specific shell | Selected Aurora Glass tier; independent selection indicator | Tier/selection/press tests |
| ControlSurface, Dock | Separate chrome fill removed | ControlSurface defaults to `glass-subtle`; Dock defaults to `glass-elevated`; both retain grouped ownership | Composition and tier tests |
| Skeleton | Hardcoded 12px and independent pulse alpha | Light tier blur, shared neutral foreground tint for visible placeholders, shared loading/pulse roles | Fallback and inherited blur tests |
| Input, Textarea, Select, Checkbox, RadioGroup, Switch, Disclosure, Table, Prose | Inset fill became denser on hover/focus/open | Light inset base; shared interaction shadow | Form/disclosure/inset tests |
| Popover, Select panel, menus, Tooltip | Panel fill/filter tier mismatch; tooltip arrow denser than body | Standard panel; Light tooltip and matching arrow | Overlay/focus/fallback tests |
| Badge | Borderless flat tint / added outline / fixed white backing | Shared border, Aurora Glass shadows, Light-tier Aurora Glass blur and quiet semantic tint in both themes | Browser theme parity, geometry, backdrop pixels and semantic ink checks |
| Notice | Per-status full-surface gradients | Shared semantic status tint at Light alpha | Status material checks |
| Scrollbar | Per-component blend weights | Shared effect alpha vocabulary; semantic thumb states | Token and interaction checks |
| StatusIndicator | Independent pulse/glow opacity | Shared pulse/glow vocabulary | Loading/reduced-motion checks |
| TerminalSurface, TerminalPrompt, TerminalLine, TerminalTranscript | CSS 0.25/0.5/0.75 literals; extra header plane | Shared ANSI effect roles; transparent header | ANSI and surface checks |
| Breadcrumb, Field, Presence | No independent material plate | Shared foreground, focus/press and presence roles; 0/1 visibility endpoints | Adapter/unit/native behavior tests |
| Playground | Local material overrides and unlabeled samples | Shared tiers; live per-sample computed annotations | Annotation/customization tests |

Tables sample the Light inset backdrop once on the table, including prose tables.
Cells retain their semantic fills, grid lines, and interaction shadows without
separate backdrop filters, so long tables keep continuous frost across cell boundaries.
Cells in the final table row also reuse the lower directional material catch,
which remains above their fills without adding a dark outer border.
The optional WebGL renderer also draws the Light edge around Input, Textarea,
Select, Checkbox, RadioGroup, Switch and Disclosure, and around tables and their
existing internal grid lines. Table grid geometry follows visible cell borders, including
spanning cells and horizontal clipping; captions remain outside the table rim.
The Select panel uses the Standard edge. The existing CSS edge field supplies a
local fallback for the Select panel in the browser top layer, and for Select,
choice controls and the Textarea shell when the shared canvas is unavailable.
Native text inputs and disclosures retain their existing inset shadows without
the optional renderer; tables retain their grid lines and cell fills. While the
shared canvas owns the table perimeter, the final row's local lower catch and the
table's CSS edge highlight are suppressed so they cannot paint a second mint
line below the renderer's rim; the CSS edge path keeps both. The shared
canvas also cannot reach native text inputs, tables or disclosures inside a browser
top-layer popover or modal, so those retain their CSS material there. Reduced
transparency disables the added edge fields. None of these paths adds per-cell
background blur.

With the WebGL edge active in either theme, form controls use the existing
directional inset highlights without the additional dark lower inset shadow.
Inputs, Select, Disclosure and the table add the shared
`--neoverse-shadow-float` elevation: a close contact layer plus a short ambient
falloff, paired with the Light-tier bloom so the plane reads as lifted instead
of inset. A resizable Textarea applies the same outer shadow on its clipping
shell. Choice plates keep the smaller shared control elevation.
Hover, focus, validation and disabled states keep their own feedback. Explicit
CSS edge passes, top-layer controls and reduced-transparency fallbacks retain
their normal inset shadows. The `formControl.webgl*` token names allow the
WebGL-state shadows to be customized independently in both themes.

Run `bun run check:materials`, package tests, build, typecheck, style and semantic
utility lint. The browser gate asserts that each tier wires its own blur,
saturation and tint (`tests/e2e/materials.spec.ts`) and that text keeps its
contrast floors (`tests/e2e/contrast.spec.ts`); it does not sample pixels. Optical
acceptance of the rendered light is manual, against the values recorded below.
Screenshot acceptance belongs to the user.

### Retired edge-contract measurements

Recorded 2026-11-02, repaired 2026-11-03 and 2026-11-04. The pixel-level Glass
suite that produced these values left the browser gate on 2026-11-10; the numbers
remain the reference for manual optical acceptance.

Repaired without changing the compositing model:

- `glass-directional-light`: the lower-right catch reads weaker than the mint
  upper-left because the 72% cool-excess trim removes its blue lead. Raising the
  light alpha ceiling to 0.39 to force parity thickened the pale cyan rim and was
  rejected on 2026-11-04; the ceiling is back at 0.34. The contract now asserts
  the upper-left catch clearly exceeds the straight middle (`×1.2`) while the
  lower-right indigo catch still exceeds it; measured upper-left/lower-right/
  middle is `61/58/34` at elevated and `61/58/35` at immersive, edge coverage is
  `1.0`, and the interior stays `0`.
- Light pale rim (2026-11-04): the light fragment now mixes 70% toward the
  neutral edge light, the former 1.35 light alpha gain is removed, and large
  surfaces use 0.36 / 0.38 / 0.40 edge opacities. On the light terminal this
  changed the left rim from `208 251 255` (cyan lead `43`) to `217 245 255`
  (cyan lead `28`, matching the `22` of the surface underneath) and the pale
  rim no longer reads as a solid cyan stroke. The 54 affected win32 light
  screenshot baselines were regenerated; dark baselines are unchanged. The
  matching Linux captures were not regenerated: the three Linux Chromium shards
  pass at `8e342b2` (run 41951145986) within the configured 1% pixel-ratio
  tolerance, so this is tolerance-based acceptance, not regenerated pixel parity.
- Table bottom rim (2026-11-04): the light table repeated the local mint inset
  catch on the final row while the shared canvas also painted the perimeter,
  producing a 2-3px green line below the rounded bottom. The catch is now
  limited to the CSS edge path; measured bottom-rim centre changed from
  `201 242 236` (a dark mint seam) to `218 247 245` (a light neutral highlight)
  while the top rim stays at `227 240 253`. Both themes use the renderer-owned
  bottom rim; the explicit CSS fallback and tables inside a native top layer
  keep the local catch. Affected win32 table baselines were regenerated for both
  themes; the Linux captures were not regenerated and pass within the same 1%
  pixel-ratio tolerance at `8e342b2`.
- Uniform chroma field: the corner catch existed, but the former probe sampled a
  fixed 150 ms after inserting the button and raced the renderer's next refresh.
  It was changed to poll until the chroma canvas carried the corner paint.
- Native scrollbar: Chromium's overlay scrollbars stay hidden at rest and do not
  repaint `:active` under synthetic input, so the native pixel contract was not
  observable. The check compared the applied engine pseudos instead (width,
  painted thumb, `padding-box` clip, transparent lane); the custom overlay
  verified hover and drag paint on real DOM pixels.

The four light-model contracts were re-scoped on 2026-11-03:

- Backdrop gain: the light rim is a translucent theme highlight. Over black the
  contract bounds the theme catch (`chroma ≤ 64`, measured ~50) instead of
  forbidding it; near-white keeps a bounded edge (`Δ ≤ 20`, measured 15).
  Hue/saturation retention against the backdrop was retired for light.
- Light multicolor: the additive rim does not amplify the source's dominant
  channel, so the `0.4` lift expectation was retired. The contract keeps the
  live-backdrop change and bounds the theme cast (`hue ≤ 16°`, measured max
  14.03; `saturation ≥ 0.62`, measured min 0.66).
- Playground visibility: the hue-retention ratio compared the theme rim with the
  frosted inner and was retired. The visible-edge brightness floor is 5 (measured
  min 6.11) with coverage `≥ 0.8`.
- Chroma field, sharp source: the check asserted the body-blur transfer instead
  of raw sampling: the rim follows the muted blurred source, stays
  orange-dominant for the raw blue strip, the body carries the strip, and the raw
  pixel exists only outside the rim.

A CSS-only light rim (inset body plate + backdrop brightness) was prototyped and
measured but rejected for the default: the 3px brightness ring reads as a white
border on pale pages. The default keeps the WebGL theme edge.

The choice indicator is not part of this contract: its light field resolves from
the azure accent, so the pale-floor expectation follows the current palette. In
the fixture, React selection steps over the disabled radio instead of clicking
it.

## Remaining literals and ownership

| Location | Remaining literals | Purpose / policy |
| --- | --- | --- |
| `tokens/src/material.css`, `effects.css`, `control-effects.css`, theme sources | Tier optics, semantic alpha scale, edge kernels, palette colors | Canonical shared standards; component tokens only alias these roles |
| Component tokens | Sizes, radii, typography, durations, endpoint 0/1 and transparent/none | Existing geometry and visibility; not independently tuned optical intensity |
| `tailwind/src/components/skeleton.css` | Shimmer angle and stop positions | Spatial distribution of a shared highlight, not alpha; pulse opacity is shared |
| `motion/src/motion.css` | `opacity: 0/1`, `blur(0)` | Presence visibility/filter endpoints; veil blur is a shared motion role |
| `glass-runtime/src/index.ts` `getDefaultEdgeValues` | Edge width/softness/opacity defaults | Existing compatibility fallback when the CSS contract is absent; ordinary rendering reads the resolved shared edge tokens first. This fallback does not set any component's base blur/alpha |
| Playground decorative canvas, layout thumbnails, clipping masks | Gradient coordinates, mask shape and decorative background | Examples of geometry/environment; ordinary component Aurora Glass plates have no local material override; the explicitly labeled Custom specimen is an intentional user-controlled override |

ControlSurface/Dock trailing groups borrow the container plate and retain their local
grouping contrast; they have no independent backdrop filter.
Options inside SegmentedControl own no independent Aurora Glass. Table cells own the Light
inset planes; its Playground wrapper is `surface="none"`. Disclosure previews use the
component's actual inset standard rather than adding a second Standard-tier Aurora Glass class.
Terminal body/header and prompt/line/transcript borrow the TerminalSurface plate.
A caller can still explicitly request an independent nested Aurora Glass surface.

`check:materials` scans component token recipes, Tailwind component values and both
adapter sources. It rejects literal blur/alpha/intensity and independent component
color recipes; themes cannot replace the tier filters/alpha. The matrix links this
standard without changing component maturity or claiming consumer delivery.

## Local validation evidence (2026-10-11)

- Full build, TypeScript checks, package unit/contract tests, material/style/text/
  Tailwind/framework-parity checks pass. Package verification passes for 8 packages.
- Browser evidence: the six-file focused suite passed 88 cases with 4 device-capability
  skips; Choice/Notice and customization rerun passed all 4 cases, and the final
  disabled/fallback rerun passed all 6 cases. The targeted legacy Design Lab
  interaction suite passed 25 cases with 3 pointer-capability skips. The final complete
  material suite passed 32 cases with 2 pointer/touch-capability skips.
  Browser contracts cover both adapters, both themes, desktop/mobile, actual 12/18/24px
  and 15/20/30% optics, global/subtree/instance overrides, selected plus press, release,
  exit, touch cancellation, single native activation, disabled/loading/readonly,
  overlay focus/dismissal, opaque and reduced-motion fallbacks, and unchanged geometry.
- Existing optical source assertions that required denser hover/dark recipes were
  replaced with shared-contract and actual computed-style checks. Screenshot baselines
  were not changed. Visual acceptance and real consumer integration remain separate.

### Control identity correction

- Restored decorative roles instead of replacing each control's depth and selected
  treatment with the generic rest/hover/selected shadows. Component aliases still
  contain no independent material recipes; the three Aurora Glass tier parameters remain.
- Final targeted browser runs: 59 passed / 5 capability skips, then 14 passed /
  2 capability skips. They cover preserved Vue/React command and primary shadows,
  both themes, desktop/mobile, selected segment/navigation fields, Dock geometry
  and indicator movement, parent hover isolation, native press/cancel/disabled
  behavior, tier overrides, and the existing sidebar enter/exit/focus repairs.
- Full build and typecheck, 40 token tests, 172 Tailwind selectors, material/component/
  parity contracts, style lint, text/utility lint, targeted Biome checks and diff
  whitespace checks passed. Global Biome lint retains the existing non-null warning;
  global format checking also flags the two existing SVG assets, which were untouched.
- The legacy `button press glow` screenshot checks still differ: their current
  tier-labeled specimen is 128×33, while the baselines are 80×38 (desktop) and 70×33
  (mobile), with additional material differences. Functional press contracts pass.
  These four screenshot failures are recorded separately; no baseline was updated.

### Dock proportion and dark command follow-up

- Confirmed and reverted the desktop Dock specimen override from `lg` to `md`,
  together with the removed 0.9 large-label compensation. Language option geometry
  retains its original values. Normal Dock uses 1.3; compact Dock uses 1.
- Restored dark command neutral sheen and primary rest/hover/press fields in shared
  effect roles and a non-interactive decorative span in both adapters. Aurora Glass base
  alpha/filter and the accepted SegmentedControl selection styling remain intact.
- Final material/identity/default-geometry browser suite: 58 passed, 2 device skips.
  Dock scale/specimen rerun: 5 passed, 1 desktop-only skip. Exact dark decorative
  recipes, pointer restoration and the original language geometry are covered.
- Full build and typecheck, Vue tests (66), React tests (27), token/material tests
  (40), 172 Tailwind selectors, style/material/parity contracts and targeted Biome
  checks passed. React content tests now locate the semantic content slot rather
  than depending on decorative sibling positions. No screenshot baseline changed.

### Sidebar selected background correction

- Replaced the sidebar's transparent selected-fill override with the existing shared
  accent-soft color. Its flat treatment keeps the gradient and shadow disabled.
- Computed-style checks reproduce the missing background before the fix in both
  themes and viewport modes, then pass for rest, hover, press, release and focus.
  The focused sidebar suite passes all 16 cases, including drawer/scrim motion,
  outside-only dimming and focus restoration. Playground build, targeted Biome,
  style lint, material contracts and diff whitespace checks pass. No screenshot
  baseline changed; visual acceptance remains with the user.

### Light Disclosure edge correction (2026-10-16)

- The light Disclosure composed a dark 1px inset outline over its Aurora Glass catches.
  Its light theme now aliases the shared directional edge roles directly; the
  existing dark outline is explicitly retained for both Dark and System modes.
  Fill, blur, inner glow, geometry, and native disclosure interactions are unchanged.
- The focused edge regression first reproduced the light-only dark ring, then
  passed all 8 desktop/mobile, Light/Dark, and explicit/System cases. It checks
  closed, hover, press, and open states, including retained Aurora Glass highlights.
  Light/Dark screenshots were inspected; 38 token/material unit tests, package
  builds, Playground typecheck, style lint, and shared contracts passed.
- The separate existing table/disclosure material test still fails in both
  viewport projects because it expects a per-cell blur. The current table samples
  its backdrop once at the table, leaving cell filters as `none`; this correction
  does not change the table or its test.
