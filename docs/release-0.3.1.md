# Neoverse UI 0.3.1 / 0.4.0 coordinated release notes

Release candidate, prepared on 2026-11-01 and reviewed again on 2026-11-05. The
versions below are the pending Changesets plan, not a statement that versioning
or npm publication has completed. `0.3.1` is a release label, not a version
shared by every package: only Tokens, Tailwind and Overlay Runtime reach 0.3.1,
Vue and React reach 0.4.0, and Motion and Glass Runtime reach 0.2.2. The
filename keeps the label so existing links continue to resolve.

The current source candidate is `dev` at `5d59332` (PR #8, awaiting merge into
`main`). Linux release quality, all three Chromium visual shards and the Windows
interaction gate pass. Firefox reports 136 passed / 2 skipped; the complete
six-shard WebKit suite reports 136 passed / 0 failed, so cross-browser
acceptance is closed. See the
[findings](acceptance-2026-11-01-cross-browser.md) and the verification status
below before advancing the release review.

## Coordinated versions

| Packages | Previous | Planned |
| --- | --- | --- |
| Tokens, Tailwind, Overlay Runtime | 0.3.0 | 0.3.1 |
| Vue, React | 0.3.0 | 0.4.0 |
| Motion, Glass Runtime | 0.2.1 | 0.2.2 |
| Giscus Theme | 0.2.0 | 0.2.0 (unchanged) |

The packages retain independent versioning. Vue and React take a minor bump
because `triggerVariant` adds a new public prop to `UiPopover` and
`UiDropdownMenu`; the remaining pending records use patch bumps. Review the
scrollbar migration below even when upgrading from
0.3.0: removed token names and map entries affect consumers that referenced them.

Seven packages publish in this release at three different version numbers.
Giscus Theme has no pending changeset and stays at 0.2.0; the private Playground
is not versioned (`privatePackages.version: false`). Internal dependency ranges
(`^0.3.0`, `^0.2.1`) still admit every new version, so
`updateInternalDependencies: "patch"` does not trigger a second round of
dependent bumps. When describing the release, name the package together with its
version rather than saying "upgrade to 0.3.1".

## Additions and fixes

- Complete React parity with 15 adapters for existing navigation, feedback,
  skeleton, terminal, presentation and scrollbar components. React Dock gains
  `navigationIndicator`, Action gains `decoration`, and Surface accepts React
  element types through `as`. Vue exports `SkeletonVariant`.
- Add `UiTerminalEcho` and its props types in both adapters for recorded command
  text. Terminal Surface accepts a Vue `#header` slot or React `header` prop;
  absent custom content retains the existing title, status and actions.
- Keep terminal history reading stable when an upward scroll and resize coincide.
- Track open overlay geometry when triggers move or content grows. Close panels
  when focus leaves, release React Select tracking on unmount, and associate
  Popover, DropdownMenu and Select triggers with SSR-stable panel IDs.
- Clamp anchored panels to the root element's client box instead of
  `window.innerWidth`/`innerHeight`. A panel that reached the right or bottom
  edge previously widened the value meant to clamp it, so mobile layout
  viewports chased their own overflow; at zoom 1.5 the same panel now rests 8px
  inside the edge.
- Restore Vue IME-aware Input/Textarea models and rejected controlled choice or
  number-input updates. Both adapters support arrow-key entry into Select;
  WebKit choice labels retain a full-row native input hit area. Select resolves
  the keyboard target across animation frames, bounded to six, instead of racing
  the panel's `allow-discrete` display flip, so reopening lands on the selected
  option.
- Position segmented-control sliders in the selected content-sized grid column
  before hydration, then retain measured geometry for later animated changes.
  Hover keeps the neutral foreground and holds through press, while the accent is
  reserved for the selected option and the light theme restores its 0.3.0
  selected-button outline and gradient.
- Unify immersive native and overlay scrollbar geometry and neutral ink. Hide
  native document bars on the first paint when the rail is rendered on the server;
  shared ownership prevents one adapter's unmount from restoring another's bar.
  Thumbs stay painted while hovered or dragged and keep their native
  `padding-box` clip. Overlapping Glass rectangles are measured once per frame so
  a surface that crosses an edge between samples still occludes it;
  pointer-transparent overlays can opt in with
  `data-neoverse-glass-occluder="topmost"`.
- Give inset form controls, disclosures and tables the shared Aurora Glass edge
  and visible grid lines. The table keeps a single backdrop filter, and its bottom
  rim is painted once by the renderer instead of repeating the final row's local
  catch. Input, Textarea, Select, Disclosure and Table share the new
  `--neoverse-shadow-float` elevation.
- Refresh the light theme's primary accent to a clearer azure blue and derive soft
  accents, interactive borders and focus rings from it.
- Name the material Aurora Glass / 极光玻璃 and export the bilingual `glassMaterial`
  descriptor from Tokens. Existing `glass-*` surface identifiers retain their names.
- Keep the light Glass rim translucent instead of painting a saturated cyan
  stroke: the light fragment mixes 70% toward the neutral edge light, drops the
  former 1.35 alpha gain and uses 0.36 / 0.38 / 0.40 edge opacities on large
  surfaces. Highlight luminance is preserved where long surfaces neutralize theme
  chroma, and the 54 affected win32 light baselines were regenerated; the
  re-scoped contracts and measured drift are recorded in
  [material standards](material-standards.md#open-edge-contract-failures). Avoid
  repeated edge paints for isolated, clipped decoration animations while retaining
  tracking for surface motion, layout changes and unknown effects.
- Add the opt-in `data-neoverse-glass-edge-stroke` attribute and
  `--neoverse-material-edge-stroke` token for window-anchored Glass chrome. The
  dark-theme stroke remains present with CSS, native and WebGL rendering and the
  reduced-transparency fallback; ordinary surfaces retain their existing behavior.
- Keep fallback panels visible at rest without the Popover API, including reduced
  motion. Motion ships this fix as 0.2.2.

## Upgrade and token migration

Upgrade adapter JavaScript, Tokens and compiled Tailwind CSS together. Vue still
requires `>=3.5.0 <4.0.0`, and React requires `>=19.0.0 <20.0.0`. Retain the
[0.3.0 migration requirements](migration-0.3.0.md) when upgrading from older versions.

| Removed name | Replacement or action |
| --- | --- |
| `--neoverse-scrollbar-immersive-track-border-width` | Use `--neoverse-scrollbar-immersive-rail-inset`. |
| `cssVariables.components.scrollbar.immersive.trackBorderWidth` | Use `.railInset` in the same map. |
| `--neoverse-effect-rail-thumb-glow`, `--neoverse-scrollbar-immersive-thumb-glow` | Remove glow overrides; tune the shared thumb ink/background tokens. |
| `cssVariables.components.scrollbar.immersive.thumbGlow` | Remove the lookup; tune `.thumb`, `.thumbHover` or the background entries. |
| `--neoverse-effect-rail-thumb-hover-shadow`, `--neoverse-scrollbar-overlay-thumb-hover-shadow` | Remove outer-shadow overrides; tune thumb ink and overlay widths. |
| `cssVariables.components.scrollbar.overlay.thumbHoverShadow` | Remove the lookup; tune the immersive ink entries or overlay width entries. |

`--neoverse-scrollbar-overlay-thumb-width` and its `-hover` counterpart now drive
both rails. Native thumb border widths are derived from those values. Tokens also
exports `cssVariables.components.scrollbar.immersive.thumbHoverBorderWidth` and
`cssVariables.components.controlSurface.trailingPadding`.

`--neoverse-shadow-float` is the new shared elevation for Input, Textarea, Select,
Disclosure and Table; button, navigation and segmented-control shadows are
unchanged. Consumers that overrode those controls' shadows should check the
combined contact and ambient layers against their own surfaces.

The first-paint scrollbar guarantee requires server-rendered `UiScrollbar` markup
and the shipped stylesheet. Client-only rails use the existing mount-time path;
`hideNative={false}` opts out and scripting-disabled pages retain native bars.

`--neoverse-material-edge-refraction-blend` supplies the dark theme's `overlay`
value for consumer-owned refraction passes. The token does not itself change the
blend mode of shipped components. Painted strokes require the explicit attribute
and exclude button surfaces; see [material standards](material-standards.md).

## Verification and remaining release work

The current source candidate is `dev` at `8e342b2`.
[CI run 41951145986](https://github.com/SSJ-ZYJ/Neoverse-UI/actions/runs/41951145986)
passed on that exact commit: Linux release quality, Linux Chromium visual shards
1/3, 2/3 and 3/3, and the Windows keyboard/overlay/theme gate. The cross-browser
job was skipped because it runs only on demand, so this result does not cover
Firefox or WebKit.

Earlier runs remain historical and do not verify `8e342b2`. Source baseline
`608a7acae156d69078479fd10b8495f6e6ce5b72` passed
[CI run 41217436163](https://github.com/SSJ-ZYJ/Neoverse-UI/actions/runs/41217436163)
with its Firefox/WebKit job skipped; that run predates the later Changeset,
verification-tool and release-document changes.

The preparation commit `59262b08e19471a8b3741d99e214484943755a19` was pushed to
`dev`. [CI run 41278138700](https://github.com/SSJ-ZYJ/Neoverse-UI/actions/runs/41278138700)
passed the full Linux release quality gate, including 34 release-tool tests and
all eight clean-consumer package smokes with the new API assertions. Its three
Linux Chromium shards reported 998 passed and 68 skipped, with no failures;
Windows reported 62 passed. Package, Playground and browser-test source is
unchanged from `608a7ac`; the preparation changes cover Changesets, tooling and
documentation. Final versioned artifacts still require the Release workflow's gates.

The pre-consolidation candidate `594d011` is no longer an ancestor of `dev`. In
[CI run 41300016963](https://github.com/SSJ-ZYJ/Neoverse-UI/actions/runs/41300016963),
Linux quality and Windows passed while visual shards 1 and 3 failed, and the
focused [light-edge run 41300022981](https://github.com/SSJ-ZYJ/Neoverse-UI/actions/runs/41300022981)
also failed on Linux and Windows. The later Glass repairs, contract re-scoping and
baseline work that produced `8e342b2` superseded those results; they are retained
as history, not as the current candidate status.

[Cross-browser run 41277876420](https://github.com/SSJ-ZYJ/Neoverse-UI/actions/runs/41277876420)
checked out the earlier `608a7ac` baseline and was cancelled at the job's
20-minute limit with Firefox 6 and WebKit 10 failures, 26 WebKit cases unfinished.
Its traces expire on 2026-11-08. On 2026-11-05 the candidate was re-run per engine:

| Run | Scope | Result |
| --- | --- | --- |
| [41991759818](https://github.com/SSJ-ZYJ/Neoverse-UI/actions/runs/41991759818) | Firefox, full suite | 136 passed, 2 skipped, 0 failed |
| [41988652462](https://github.com/SSJ-ZYJ/Neoverse-UI/actions/runs/41988652462) | WebKit, full suite | cancelled at 20m19s after 74 of 134 cases; 59 passed, 15 failed |
| [41992710113](https://github.com/SSJ-ZYJ/Neoverse-UI/actions/runs/41992710113) | WebKit, grep over the failing titles | 18 passed, 10 failed of 28; every failure reproduces in isolation |

The ten reproducible WebKit failures are all 30-second test timeouts: Vue
DropdownMenu, Popover, Select and controlled Popover dismissal (eight cases) and
React text controls (two cases). Captured snapshots show the popover still visible
after selection or dismissal. The same cases passed in 1.2-5.3s in the 2026-11-01
run on `608a7ac`. The trace evidence points at per-interaction page cost rather
than the Playwright upgrade: one failing case shows a 3.4-4.0s click. `dd776c6`
extended `glassSelector` to every inset control, table, disclosure and select
popover, and `acc5db5` probes all visible candidates for each element, so a
document-wide refresh grew with the surface count; WebKit's hit testing and style
resolution are much slower than Chromium's. An instrumented build then measured the
Glass refresh itself at 27-33ms (57 surfaces, 13-15 visible), so the refresh is not
the whole cost. Geometry tracing then found the direct cause: `elementFromPoint` at
the option centre returned a later specimen's legend paragraph rather than the
option, because both wrappers shared `z-index: 1` inside the inset Playground
backdrop and a fixed fallback panel cannot escape that stacking context. Lifting
the wrapper that owns an open fallback overlay, together with the refresh caching,
restored the hit target. The remaining timeouts came from the Playground's
infinite shimmer/pulse/spinner animations: WebKit's software compositor spent
seconds per protocol round trip while they ran, so Playwright never observed a
stable element. Enabling the stylesheets' existing reduced-motion rules in the
cross-browser project made all 24 previously failing overlay cases pass
([42034638263](https://github.com/SSJ-ZYJ/Neoverse-UI/actions/runs/42034638263)).
Chromium visual shards, Windows and Firefox stay green. A complete cross-browser
run now needs six shards per engine (`cross_browser_shards=6`), because a single
job is capped at 20 minutes. The full sharded dual-engine run
([42035390303](https://github.com/SSJ-ZYJ/Neoverse-UI/actions/runs/42035390303))
reports Firefox 136 passed / 2 skipped and WebKit 134 passed with 2 failed. Those
last two were not a scrolling defect: an instrumented replay measured `scrollY =
100` after `window.scrollTo(0, 100)`, one `scroll` event and 3699px of reachable
range, but `data-visible` stayed `false`. The React fixture's `autoHideMs={250}`
let the reveal and the auto-hide collapse before WebKit committed the visible
state; restoring the 1200ms product default fixed both. The complete six-shard
WebKit re-run
([42041056357](https://github.com/SSJ-ZYJ/Neoverse-UI/actions/runs/42041056357))
is **136 passed / 0 failed**. Shard 6/6 stalled in "Install webkit" on its first
attempt and passed after a failed-job rerun. With Chromium, Windows, Linux and
Firefox gates green, cross-browser acceptance is closed for this release; the evidence
is in the [cross-browser findings](acceptance-2026-11-01-cross-browser.md).

The Linux captures for the 2026-11-04 light rim and table bottom were not
regenerated. The three Chromium shards pass at `8e342b2` within the configured 1%
pixel-ratio tolerance, which is tolerance-based acceptance rather than regenerated
pixel parity; maintainer visual acceptance remains separate.

Local preparation runs only lightweight checks. Builds, package installation
smokes and browser execution remain on remote CI. The release API smoke now checks
React parity, Vue Echo, the React terminal header type, material names and new token
map entries for local candidates and for registry packages at 0.3.1 or later.
Registry verification of 0.3.0 retains its older API baseline.

Preparation checks on 2026-11-01 passed: 34 release-tool tests, root TypeScript
`--noEmit` (also including the generated API smoke against current local declarations),
targeted Biome, Changeset target validation, text integrity and diff
whitespace checks. These tests include deliberately incomplete package fixtures
to prove missing React/Vue/token APIs fail registry verification at 0.3.1 while
the published 0.3.0 baseline remains valid. That local evidence predates the
dependency updates in `a305cfd`; the artifact smokes themselves run remotely.

Local checks on 2026-11-05 passed: `bun run check:changesets` reports valid
workspace targets and no private-only records, and `bun run check:release-registry`
reports all eight names registered with exit 0.

On 2026-11-05 the official npm registry reported all eight package names
registered, and direct `npm view` requests found none of the seven planned versions
published. Both repository release automation variables were `true`, and the `npm`
Environment retained its required reviewer. These read-only checks do not inspect
each package's authenticated npm Trusted Publisher configuration or authorize
publication.

Before publication, each gate below remains open unless stated otherwise:

| Gate | Status at `8e342b2` |
| --- | --- |
| Candidate pull request to `main` | Open. `dev` is 37 commits ahead of `main`, and `main` is fully contained in `dev`, so the merge can fast-forward. No pull request has been opened. |
| Version Packages review | Blocked until that merge. `bun changeset status` plans seven bumps; the changelogs, internal dependency ranges and `bun.lock` can only be reviewed after `changeset version` runs on `main`. |
| Final versioned-commit gates | Pending. Release quality, package-content and clean-consumer smokes, the Chromium shards and Windows interactions must pass on the versioned commit, not only on `8e342b2`. |
| Firefox and WebKit | Firefox passes the full suite on `8e342b2`; WebKit is open with ten reproducible timeout failures and an incomplete full run. |
| npm Trusted Publisher and environment | Pending manual review of every releasing package's publisher identity, then approval through the `npm` Environment reviewer gate. |
| Consumer, AT/IME and visual acceptance | Pending. See the consumer snapshot and contract numbers below. |

Real-consumer results, manual AT/IME and maintainer visual acceptance stay separate
from automated CI. The historical [overlay record](acceptance-2026-10-29-overlays.md)
and [consumer record](consumer-migration-2026-10-29.md) do not establish acceptance
of this candidate.

A read-only local consumer snapshot on 2026-11-05 found the following. No consumer
files were changed, and these source/configuration observations are not run results.

| Consumer | Observed source | Candidate evidence still needed |
| --- | --- | --- |
| XCA-Portal | HEAD `77c3416`; workspace has uncommitted changes including the terminal feature; `cinematic.yml` and `images.yml` pin UI `7c8f46b`; Vue uses sibling `file:` packages. | Commit the consumer slice and obtain a successful run for that exact combination against `8e342b2`. |
| Neoverse-Doc | HEAD `4c7de67`; React, Tailwind and Tokens remain npm `0.3.0`, Motion and Glass `0.2.1`; workspace has uncommitted changes. | Validate the target React candidate independently of the historical 0.3.0 result. |
| Neoverse-Slides | Local `main` has no first commit; all files are untracked. | Establish a reproducible consumer commit and validate it with the target UI candidate. |

The contract snapshot retains 36 public components: 21 Stable and 15 Consumer
Validation. Seven carry Playground-level visual status rather than release-level
captures (Checkbox, RadioGroup, Switch, Field, Presence, Popover, DropdownMenu),
and nine lack validated consumer evidence (Checkbox, RadioGroup, Switch, Textarea,
Table, Disclosure, Presence, DropdownMenu, Breadcrumb). Five appear in both lists,
so the dimensions overlap and do not add up. The adapter columns are stable for all
36 components, but neither that status nor a green CI run promotes a component's
maturity on its own.

After publication, require `bun run verify:published` against the exact versioned
manifests, official npm tarballs and dependency graph without local overrides.
Confirm all seven new Git tags and GitHub Releases, then replace this candidate
status with the actual publication run and outcome. The complete workflow is in
[Releasing Neoverse UI](releasing.md).
