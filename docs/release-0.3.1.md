# Neoverse UI 0.3.1 release notes

Release candidate, prepared on 2026-11-01. The versions below are the pending
Changesets plan, not a statement that versioning or npm publication has completed.
The earlier preparation candidate passed ordinary CI, but subsequent Glass and
cross-browser repair commits have not passed all visual checks. Cross-browser
acceptance also remains open. See the [findings](acceptance-2026-11-01-cross-browser.md)
and the later verification status below before advancing the release review.

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
- Restore Vue IME-aware Input/Textarea models and rejected controlled choice or
  number-input updates. Both adapters support arrow-key entry into Select;
  WebKit choice labels retain a full-row native input hit area.
- Position segmented-control sliders in the selected content-sized grid column
  before hydration, then retain measured geometry for later animated changes.
- Unify immersive native and overlay scrollbar geometry and neutral ink. Hide
  native document bars on the first paint when the rail is rendered on the server;
  shared ownership prevents one adapter's unmount from restoring another's bar.
- Name the material Aurora Glass / 极光玻璃 and export the bilingual `glassMaterial`
  descriptor from Tokens. Existing `glass-*` surface identifiers retain their names.
- Adjust the light Glass edge response and reduce its blue cast; its appearance
  and backdrop-colour behavior remain under review. Avoid
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

The first-paint scrollbar guarantee requires server-rendered `UiScrollbar` markup
and the shipped stylesheet. Client-only rails use the existing mount-time path;
`hideNative={false}` opts out and scripting-disabled pages retain native bars.

`--neoverse-material-edge-refraction-blend` supplies the dark theme's `overlay`
value for consumer-owned refraction passes. The token does not itself change the
blend mode of shipped components. Painted strokes require the explicit attribute
and exclude button surfaces; see [material standards](material-standards.md).

## Verification and remaining release work

The source baseline is `608a7acae156d69078479fd10b8495f6e6ce5b72`.
[CI run 41217436163](https://github.com/SSJ-ZYJ/Neoverse-UI/actions/runs/41217436163)
passed Linux release quality, all three Linux Chromium visual shards and Windows
keyboard/overlay/theme interactions. Its Firefox/WebKit job was skipped. This run
does not cover the later Changeset, verification-tool or release-document changes.

The preparation commit `59262b08e19471a8b3741d99e214484943755a19` was pushed to
`dev`. [CI run 41278138700](https://github.com/SSJ-ZYJ/Neoverse-UI/actions/runs/41278138700)
passed the full Linux release quality gate, including 34 release-tool tests and
all eight clean-consumer package smokes with the new API assertions. Its three
Linux Chromium shards reported 998 passed and 68 skipped, with no failures;
Windows reported 62 passed. Package, Playground and browser-test source is
unchanged from `608a7ac`; the preparation changes cover Changesets, tooling and
documentation. Final versioned artifacts still require the Release workflow's gates.

Before history consolidation, changes through `594d011` included Glass and overlay repairs. In
[CI run 41300016963](https://github.com/SSJ-ZYJ/Neoverse-UI/actions/runs/41300016963),
the Linux quality and Windows checks passed, but visual shards 1 and 3 failed;
shard 2 was still running when this status was recorded. The focused
[light-edge run 41300022981](https://github.com/SSJ-ZYJ/Neoverse-UI/actions/runs/41300022981)
also failed on Linux and Windows. These failures leave the later source candidate
unverified. Glass appearance, background colour, complete edges and replacement
baselines still require repair and verification; the earlier successful run does
not cover those later changes.

[Cross-browser run 41277876420](https://github.com/SSJ-ZYJ/Neoverse-UI/actions/runs/41277876420)
checked out the `608a7ac` source baseline and was cancelled at the job's 20-minute
limit. Its partial log records Firefox 128 passed / 6 failed and WebKit 98 passed /
10 failed, with 26 WebKit cases unfinished or not started. All 16 failure traces
were retained. These results require targeted remote diagnosis; they do not establish
cross-browser acceptance. Details and the artifact are in the
[cross-browser findings](acceptance-2026-11-01-cross-browser.md).

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
the published 0.3.0 baseline remains valid. Full artifact smokes for the new
verification script still require remote execution after this preparation is committed.

On the same date, the official npm registry reported all eight package names
registered and none of the seven planned versions present. Both repository release
automation variables were `true`; the `npm` Environment retained its required
reviewer. These read-only checks do not inspect each package's authenticated npm
Trusted Publisher configuration or authorize publication.

Before publication:

- Commit the candidate preparation and review its PR to `main`.
- Review the generated Version Packages PR: the seven planned bumps, all package
  changelogs, internal dependency ranges and `bun.lock` must agree.
- Require the final versioned commit's release quality, package-content/clean-consumer
  smokes, Chromium visual shards and Windows interactions to pass.
- Review the npm Trusted Publisher identity for each releasing package and approve
  the verified artifact through the existing `npm` Environment reviewer gate.
- Keep real-consumer results, manual AT/IME and maintainer visual acceptance
  separate from automated CI. The historical [overlay record](acceptance-2026-10-29-overlays.md)
  and [consumer record](consumer-migration-2026-10-29.md) do not establish acceptance
  of this final candidate. Component maturity and pending matrix evidence remain
  unchanged; unresolved coverage must be carried into the release review.

A read-only local consumer snapshot on 2026-11-01 found the following. No consumer
files were changed, and these source/configuration observations are not run results.

| Consumer | Observed source | Candidate evidence still needed |
| --- | --- | --- |
| XCA-Portal | HEAD `e804c33`; staged quality workflow pins UI `59262b08e19471a8b3741d99e214484943755a19`; Vue uses sibling `file:` packages. | Commit the consumer slice and obtain a successful run for that exact combination. |
| Neoverse-Doc | HEAD `4c7de67`; React dependency remains npm `0.3.0`. | Validate the target React candidate independently of the historical 0.3.0 result. |
| Neoverse-Slides | Local `main` has no first commit; workflow pins UI `eda31c32d6881541c847256eaacb60c3719f2763`. | Establish a reproducible consumer commit and validate it with the target UI candidate. |

The contract snapshot retains 36 public components: 21 Stable and 15 Consumer
Validation. Seven lack release-level visual evidence and nine lack validated
consumer evidence; React-specific coverage retains 27 visual and 29 consumer
pending entries. These dimensions overlap. In particular, Field and Popover
retain Playground visual status and pending React visual/consumer evidence;
automated CI does not itself promote their maturity.

After publication, require `bun run verify:published` against the exact versioned
manifests, official npm tarballs and dependency graph without local overrides.
Confirm all seven new Git tags and GitHub Releases, then replace this candidate
status with the actual publication run and outcome. The complete workflow is in
[Releasing Neoverse UI](releasing.md).
