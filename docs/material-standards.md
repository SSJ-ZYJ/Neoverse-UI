# Aurora Glass material and interaction standards

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

Light restores the 0.2.0 directional edge: the shader combines theme accent
colours, varies chroma with effective opacity, and caps fragment alpha at 0.34.
The light canvas uses normal composition and the release's WebGL blend factors;
large surfaces use edge opacities 0.46 / 0.5 / 0.54. Chroma and gain remain
optional multipliers, both defaulting to 1 in light mode.

Light keeps that mint-to-indigo direction but caps its cool excess: 72% of the
blue lead over the red/green content is trimmed, so the right catch stays cool
without the release's threefold margin that read as a blue band on pale pages.
The cap applies to light surfaces only; dark composition is unchanged.

This is a translucent, theme-coloured highlight composited over the backdrop,
not a sampled or displaced image of the background. Its apparent colour and
contrast depend on both the theme accents and the pixels underneath. Dark
retains its overlay response. Both themes share one canvas; CSS continues to
own the body tint, blur and shadows.

Opacity, clipping and overlay occlusion still apply. Light follows the 0.2.0
edge profile for controls and surfaces; dark buttons retain their focused
catches. Reduced transparency disables the renderer. The CSS fallback uses
alpha-only gradient masks and backdrop brightness. Native SVG displacement
remains an explicit alternative through `backend: 'native'` (Playground:
`?glass=native`).

The 0.2.0 reference test checks the released light edge samples on middle grey
and the dark response on grey and pale backdrops. Runtime tests cover theme
switching, canvas reuse and unchanged body blur; live-canvas tests exercise the
different light and dark composition models against changing background pixels. The grey backdrop case also bounds how far blue may lead the green and red content, so the cool edge cannot regress into a cast.

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
`inset` uses Light optics; status colours use shared semantic
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
visible silhouette does not shrink into the backdrop. Both themes mix the semantic status colour with
transparency; no fixed white backing is added in light mode. Light labels use
vivid midtone blue, mint, amber and red ink through the shared label effect roles,
while dark labels use luminous status ink. Both are exposed
through the per-variant `--neoverse-badge-*-foreground` tokens. The shared
`--neoverse-badge-backdrop-filter` controls background blur for all five variants.
Reduced transparency, forced colours, and browsers without backdrop-filter use
an opaque semantic field with no background filter.

Light semantic status colours are pale blue, mint, yellow and pink across the
library, not Badge-only overrides. Their `*-foreground` roles provide contrasting
ink on these fields. Text-only validation, terminal feedback and destructive menu
items use shared `status-*-text` effect roles so pale fields do not turn into
illegible text. Dark status colours and text-only feedback retain their palette.

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

Run `bun run check:materials`, package tests, build, typecheck, style and semantic
utility lint, and focused browser contract tests. Browser contracts inspect actual
filter, background alpha, activation and recovery rather than accepting CSS source
alone. Screenshot acceptance belongs to the user; this change does not regenerate
baselines or assert real consumer validation.

## Remaining literals and ownership

| Location | Remaining literals | Purpose / policy |
| --- | --- | --- |
| `tokens/src/material.css`, `effects.css`, `control-effects.css`, theme sources | Tier optics, semantic alpha scale, edge kernels, palette colours | Canonical shared standards; component tokens only alias these roles |
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
colour recipes; themes cannot replace the tier filters/alpha. The matrix links this
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
