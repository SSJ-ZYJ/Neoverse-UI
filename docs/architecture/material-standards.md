# Aurora Glass material and interaction standards

Status: adopted

[Chinese summary](../zh-CN/architecture/material-standards.md)

Components use shared material and effect roles. Concrete optical values belong to
`packages/tokens/src/material.css`, `effects.css`, and `control-effects.css`; component tokens are compatibility
aliases and consumers never need a second material implementation.

## One material, three tiers

**Aurora Glass** is the only display name for the shared glass material. Light, Standard, and Immersive are tiers of that same material, not separate glass styles. The `glass-*` surface values, CSS
classes/variables, package names, and existing TypeScript APIs are stable
technical identifiers and do not designate other glass styles.

Consumers obtain the shared name and short tier names from Tokens:

```ts
import { glassMaterial } from '@neoverse-ui/tokens';

glassMaterial.name.zh; // localized Chinese display name
glassMaterial.name.en; // Aurora Glass
glassMaterial.tiers.subtle; // { zh: localized tier name, en: 'Light' }
glassMaterial.tiers.elevated; // { zh: localized tier name, en: 'Standard' }
glassMaterial.tiers.immersive; // { zh: localized tier name, en: 'Immersive' }
```

The tier keys map to the stable surface values below. Blur, frost, refraction,
and transparency describe optical properties, not additional material names.

| Tier | Surface | Blur | Background opacity | Default use |
| --- | --- | --- | --- | --- |
| Light | `glass-subtle` | 12px | 15% | Buttons, compact controls, inset/form/reading surfaces, chrome |
| Standard | `glass-elevated` | 18px | 20% | Cards, popovers, select panels, terminal |
| Immersive | `glass-immersive` | 24px | 30% | Explicit immersive surfaces |

Opacity means the alpha of the background fill, not CSS `opacity` on the whole
element. Both themes use an opaque base tint and apply the tier alpha exactly once.
The same tier has the same base alpha across components. Dark filled buttons scale
the selected tier's blur by `--neoverse-control-button-blur-scale` (0.5), giving
6/9/12px sampling so compact controls retain softened background detail. Light
buttons use scale 1; saturation, contrast and brightness remain tier-owned.
Two independent
surfaces layered together still composite; grouping owners explicitly use
`surface="none"` or `glassNesting="inherit"` for borrowed material. Ghost controls
have no independent plate. Navigation's persistent selection plate is a
component-owned plate rather than transient Ghost feedback, so it samples the
backdrop even when the item's interaction surface is `none`; hover and press
still paint only a local wash. Reduced transparency uses an opaque tint and no
blur.

## Aurora Glass edge reflection

The light shader retains its directional edge profile and 0.34 edge-response
ceiling. Large light surfaces use edge opacities 0.36 / 0.38 / 0.40 without an
extra light alpha gain.

In both themes, the shared WebGL canvas encodes a neutral, partially covered
color-dodge signal. The compositor lifts the existing backdrop channels
proportionally rather than lifting the weaker channels toward white. Dark
surfaces use a higher exposure scale to keep the fine rim visible on dark
backdrops. On large light surfaces, the stronger catches have a soft exposure
shoulder instead of a hard cutoff. The lower-right catch limits the dodge signal
before channels clip, rather than masking the clipped result with lower coverage.
The saturation pass strengthens the live backdrop's hue in both themes, with
additional emphasis near the lower-right arc on large light surfaces. Neither
pass adds a fixed highlight hue.
On larger light surfaces, the upper-left catch also rolls off before clipping,
with a softer peak that fades along the adjoining edges. The rolloff changes
the dodge signal without changing rim width or coverage.

Browsers without color dodge keep the overlay transfer in either theme.
CSS still owns the body tint, blur, and shadows.

The edge reacts to the pixels immediately underneath it, but does not sample
neighboring pixels or bend their position. This is backdrop-dependent
compositing, not spatial refraction.

Opacity, clipping, and overlay occlusion still apply. On large light surfaces,
the upper-left and lower-right catches taper in width independently of the
lighting direction. The lighting also eases from each straight edge into its
arc, so the join does not create a second highlight. The lower-right catch
retains the narrower inward falloff. Dark corners use the same fine contour,
with additional color-dodge lift on the upper-left and lower-right arcs after
the base exposure ceiling. The lift tapers to zero at the straight edges
without changing rim geometry or coverage.
Reduced transparency disables the renderer. The CSS fallback uses alpha-only
gradient masks and backdrop brightness. The historical `backend: 'native'`
option remains available for compatibility, but must not be used as the repair
approach prohibited below.

The canvas is fixed to the viewport and the rim is painted in viewport
coordinates, so every scroll request has to reach it. The frame cap defers a
repaint by at most one interval and never drops the request; a discarded request
would leave the rim painting the previous offset, detached from a surface that
has already scrolled.

The body tint keeps the DOM border box in both the canvas and CSS edge paths.
For axis-aligned magnification, the runtime derives corner scale from the
resolved CSS transform rather than rounded layout dimensions. As the saturation
stroke grows with magnification, its path moves inward to keep the stroke from
extending past the rounded contour.

Whole-page position/opacity transitions can opt into the renderer's
`suspend()` / `resume()` lightweight path, which retains the last painted frame
and defers enumeration and occlusion probes until one full refresh on resume;
see the [glass-runtime README](../../packages/glass-runtime/README.md#pausing-edge-repaints-for-page-transitions)
for the safety boundary.

### Painted stroke for window-anchored chrome

The runtime rim cannot add light where the backdrop provides no color signal.
Surfaces anchored to the window edge can opt into a painted stroke with
`data-neoverse-glass-edge-stroke`. The stroke comes from
`--neoverse-material-edge-stroke`, which is `0 0 transparent` by default and
therefore inert for every other surface; dark themes resolve it to one uniform
strong-border ring. The renderer path keeps the stroke ahead of the
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
The `inset` preset on Surface and Card keeps the Light-tier filter and soft
inset shadow. A translucent, theme-aware fill separates it from the canvas
without a border. This fill belongs to the preset, not to other components
that share the inset material. Prose quotes consume the same plane role, so a
reading callout reads as a distinct surface instead of a bare glass tint. Status
colors use shared semantic effect roles. Typography, geometry, and native control
semantics remain independent.

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

- Hover is available only on hover-capable devices. Hover and press do not
  change the Aurora Glass base alpha or filter.
  Filled Button, Action, IconButton, and overlay triggers paint feedback on the
  same border box as the tier tint. The CSS-only rim clips its own blur without
  clipping the control's focus ring or expanded touch target.
- Press takes precedence over hover and restores hover or rest on release.
  It does not select an option until native activation.
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
and the shared subtle edge highlight and inner glow. It has no outer bloom:
combining that shadow with backdrop blur can leave a dark strip at the rounded
end when Chromium repaints the pill.
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

TooltipSurface uses a pale blue tint for Neutral and a stronger theme accent
tint for Accent. The body and pointer stay distinct on a flat canvas without
changing the Light-tier fill alpha, backdrop filter, or shared refractive
contour. Reduced transparency keeps the tint on an opaque Light-tier base.

Neutral Notice uses a quiet, theme-aware tint so its rounded silhouette stays
visible on a flat backdrop. It retains the Light-tier fill alpha, backdrop
blur, and inset shadows without adding a border. Status variants retain their
semantic tints.

Toast uses the Standard tier in all three `presentation` modes. `compact`
shows a semantic icon and a brief message in a pill. `action` uses a rounded
bar with an inline action and is inferred if an action is supplied without an
explicit presentation. `notification` wraps longer copy, moves any action
below the message, and always shows a dismiss button. Compact and action
toasts dismiss after four seconds by default; notification stays open by
default. Setting `duration` to zero keeps any Toast open and shows its
dismiss button.

Disclosure panels use the shared directional inset edge roles in every state,
together with the shared control shadow. The directional catches separate the
panel from pale or textured backdrops without a uniform inset ring, and they do
not change its dimensions, Aurora Glass fill or blur. Vue, React and prose
`details` consume the same styles.

Inline code in prose uses a quiet, theme-aware tint to stay distinct from
the surrounding text, including when nested in bold text. It keeps the
existing soft edge and adds no border; code blocks use their own material.

Timeline and StepFlow use `UiSurface` with the Light tier of Aurora Glass for their markers and content.
Timeline dates precede each title; thin rails remain continuous between markers.
StepFlow uses circular numbered markers, replacing completed numbers with a check.
Current steps use a quiet accent contour and the shared info Badge for their status
label, with no full-height side accent inside the content card; other status labels
remain text and future steps retain neutral markers. Container-based horizontal/vertical layout, native
list/date semantics and consumer-owned state remain unchanged.

A selected SegmentedControl slider and a selected navigation item use a frosted
translucent ice-azure selection plate in Light (`--neoverse-color-blue-100` to
`--neoverse-color-accent-primary` over `--neoverse-color-blue-300` with primary
text `--neoverse-color-text-primary`) and the primary sky-blue selection fill in
Dark (`--neoverse-effect-primary-rest-field-dark` paired with
`--neoverse-control-primary-foreground`), resolved through
`--neoverse-effect-choice-selected-foreground` with Light-tier backdrop blur
(`12px`), keeping selection vivid, borderless, and legible across both Aurora
Glass and solid surfaces. Dock trailing groups retain a local
grouping wash and match the embedded SegmentedControl shape.
These plates sample and soften the backdrop beneath them while transient hover
and press shift smoothly onto Primary-matched selection feedback
(`--neoverse-effect-choice-selected-hover-*` / `-press-*`, pixel-matched to
Primary button hover/press in Dark and Primary-hue azure intensifies in Light)
rather than stacking a dull neutral ghost wash onto the active plate. The
surrounding Aurora Glass well keeps its tier alpha/filter and shared outer
glass edge.
Unselected segmented options, navigation items, tabs, pagination buttons, menu
items, toast dismiss buttons, and number steppers share the quiet button wash
(`--neoverse-quiet-control-feedback`). Hover adds the wash; press uses a deeper
shade without moving the control or changing its shadow.
Breadcrumb links answer like plain links instead: the link grows its own box by
the plate inset and gives the same space back with a negative margin, and the
container carries the same inset so every padded pixel stays hit-testable while
the trail keeps its geometry. The plate fills that box in the shared hover field,
rises from slightly smaller as it fades in, deepens on press, and the label rises
to the primary text role — accent-on-accent text would drop below 3:1 in Light.
The container clips with `overflow-clip-margin` rather than hard
`overflow: hidden`, which would cut the plate and the focus ring.
A navigation surface owns one accent: a surface that retunes its indicator
retunes the start rail and the bottom bar together, and the placement alias
resolves on the item rather than at the document root. Light pairs the frosted
ice-azure selection plate with `--neoverse-color-accent-primary`, while Dark
pairs the primary sky-blue selection fill with rich cobalt azure
(`--neoverse-color-blue-700`) on `--neoverse-navigation-item-indicator-color`
so the active bar stays vivid and legible against both the sky-blue fill and the
dark canvas.
Current-page, checked, open and selected indicators remain visible, and
activation rather than press commits selection.

Checkbox, RadioGroup and Switch paint an azure selected field in both themes.
Light keeps 46% transparency with a deep azure mark; Dark keeps 28% with a white
mark. The field carries its own colour over any backdrop while the plate still
shows through, and every mark keeps at least 3:1 non-text contrast on the fill.
Dark uses a deeper azure and keeps the fine illuminated edge. Reduced
transparency restores the fully opaque field. Both themes use a porcelain Switch
thumb. A quiet top catch adds
depth. The Switch
keeps the same outer footprint, with a smaller thumb and even inset. Unchecked
controls retain their neutral Aurora Glass plate with the shared 1px control
silhouette; disabled controls use neutral plates and muted indicators. The Switch
thumb keeps a white porcelain fill in Light so it stays lighter than the pale
track; Dark retains its existing neutral porcelain. The selection field and
keyboard focus are component tokens, independent of Button labels and secondary
accent colors. Native state semantics remain unchanged.

Light error and success text feedback uses coral and mint midtones rather than
the deep foreground colors intended for pastel status fields. Field messages,
required markers and terminal text feedback share those theme-owned text roles.
The flat Playground sidebar uses the shared `--neoverse-color-accent-soft` selected
fill without the raised navigation gradient or shadow. The quiet feedback
wash sits over this fill without changing the current destination.

Button, Action, and IconButton share one compact Aurora Glass plate and one
translucent command tint. Primary uses a clear blue tint in both themes, with
deep blue ink in Light and near-black ink in Dark. Secondary uses a neutral tint.
Press uses a deeper shade of the hover tint without changing the shadow,
silhouette, text, or blur. Neither state uses the selected field or a
pointer-positioned light.
The tint sits over the sampled plate without adding another filter, layout geometry,
or hit testing. Disabled and loading controls keep the resting tint and dim only
their content. Ghost and `surface="none"` do not own a material plate; they
paint only a local neutral wash on hover or press.

The sampled plate, tint, and glass rim use the button's outer radius, including
circular icon buttons. The rim replaces the painted stroke; reduced transparency,
forced colors, and browsers without backdrop filters retain a fallback boundary.
Keyboard focus keeps its own outline. Controls resolve that outline from the
primary azure accent (`--neoverse-color-focus-ring`) in both themes, including
SegmentedControl and active navigation items. The border policy for cards, glass
planes, segmented wells, and other compact controls is unchanged.

Dock's original desktop `lg` scale is 1.3, with a 0.9 optical type factor for
navigation and embedded segmented labels. Compact Dock remains `md` at 1. These
are geometry contracts, not material parameters. The original language option
height, inline/block padding and gap remain unchanged; the previous specimen
override to `md` and removal of the large type factor were reverted.

The shared Dock/ControlSurface selection indicator flies between items on a
compositor `transform` (translate + scale from the committed geometry) and
commits the final left/top/width/height once on settle, so a selection adds no
per-frame layout inside the glass plate. The runtime treats selection indicators
as edge-neutral content and does not reserve edge frames for their motion.
Reduced motion commits the target geometry directly without a flight.

SegmentedControl renders a translucent Aurora Glass outer shell with its tier-owned
backdrop blur and shared WebGL/CSS outer glass edge, framing an embedded
selection slider (frosted translucent ice-azure in Light and primary sky-blue in
Dark, `--neoverse-control-segmented-active-filter` at Light-tier `12px` backdrop
blur), paired with `--neoverse-effect-choice-selected-foreground` ink contrast. It
defaults to the `pill` shape and also supports `rounded` via `shape`, with its
geometry and selection tokens decoupled from `ControlSurface`, `Tabs`,
`Pagination`, and `NavigationItem`. The plate shares the well's shape and clips
inside the inner track, independently of the options' expanded touch hit areas,
and omits outer shadow bleed or top stroke lines across both themes
(`--neoverse-control-segmented-active-shadow: var(--neoverse-effect-choice-selected-inset-shadow)`).

On pointer down, the selection plate glides toward the pressed option, briefly
stretches in transit, and compresses while held: capsule (`pill`) plates squish
vertically, while circular (`icon` or equal-aspect) and `rounded` plates shrink
uniformly around their center. During a horizontal drag, the plate follows the
pointer; releasing it selects the nearest enabled option.
A canceled drag or rejected activation returns the plate to the committed
selection. Touch input still permits vertical scrolling. Keyboard and
programmatic changes glide directly to the new selection. Reduced motion
preserves direct dragging but skips animated previews and settling. Hover on
the selected option and feedback during a press or drag transition the plate
directly through the shared Primary-aligned choice hover/press roles (while
keeping the slider glaze active on press or drag), so feedback moves and scales
with the plate without muddying the azure tint. Idle, unselected options and
toast dismiss/stepper controls retain the shared quiet hover feedback.

Both adapters support `variant="text"` (the default content-sized labels),
`variant="icon"` (equal-width segments with decorative `options[].icon`), and
`variant="language"` (equal-width segments with compact text for short names or
language codes). For icons, pass a Vue component or a React node; `label` names
the option for assistive technology and is also the visible fallback without
an icon. Set `ariaLabel` to give a short label a fuller accessible name.
Presentation does not change selection or keyboard behavior.

Regression contracts check that transient button feedback keeps the sampled
plate unchanged, and that command states do not replace persistent selection
or alter shared Aurora Glass Dock depth.

| Component | Preserved visual role | Shared role / source |
| --- | --- | --- |
| Button, Action, IconButton, Toast dismiss | Translucent primary and secondary tints, unified quiet Ghost feedback across ghost buttons, icon dismiss, steppers, and menus | `command-*`, `primary-*`, `quiet-command-*` in `control-effects.css` |
| SegmentedControl | Translucent Aurora Glass outer shell, shared outer glass edge, borderless frosted ice-azure (Light) / primary sky-blue (Dark) selection plate with backdrop blur, Primary-matched selection hover/press, and `pill` / `rounded` shapes | `choice-rest-shadow`, `choice-selected-field`, `choice-selected-fill`, `choice-selected-hover-*`, `choice-selected-press-*`, `choice-selected-border`, `choice-selected-inset-shadow`, `choice-selected-filter`, `choice-selected-foreground` |
| Dock, ControlSurface | Selected Aurora Glass tier depth/boundary and local trailing group contrast | Aurora Glass material tokens, `control-surface-*`, `grouped-inset-*` |
| NavigationItem | Persistent selection matching Primary selection hover/press while unselected items keep the quiet button wash | `choice-selected-*`, `choice-selected-hover-*`, `choice-selected-press-*`, `quiet-command-*` |
| Skeleton, Badge, Tooltip, Scrollbar | Skeleton highlight and pulse without an edge, plus badge/tooltip accent depth and scrollbar thumb state | `placeholder-*`, `label-edge`, `accent-*`, `rail-*` |
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
| Badge | Borderless flat tint / added outline / fixed white backing / flashing outer bloom | Shared border, inset Aurora Glass highlights, Light-tier Aurora Glass blur and quiet semantic tint in both themes | Browser theme parity, geometry, backdrop pixels and semantic ink checks |
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
| `glass-runtime/src/rendering/style-resolution.ts` `getDefaultEdgeValues` | Edge width/softness/opacity defaults | Existing compatibility fallback when the CSS contract is absent; ordinary rendering reads the resolved shared edge tokens first. This fallback does not set any component's base blur/alpha |
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
  Its light theme aliases the shared directional edge roles directly; the dark
  outline was retained at the time and was later aligned with the same roles
  (2026-11-17).
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

### Dark Disclosure edge alignment (2026-11-17)

- The dark Disclosure still composed the generic 1px inset outline over its
  Aurora Glass catches. It read as a uniform luminous ring, unlike the
  directional refraction silhouette shared by every other dark inset surface.
- Dark and System modes now use the same directional inset edge roles as light.
  The boundary comes from the shared refraction field, the directional catches
  and the float shadow; the outline is absent from the closed, hover and open
  recipes. Fill, blur, geometry and native disclosure interactions are unchanged.
- Verified in both themes and closed/open states: the computed edge recipe has no
  uniform inset ring, the top, bottom and side catches remain continuous, and the
  rendered dark panel keeps its silhouette over the patterned Playground backdrop.
