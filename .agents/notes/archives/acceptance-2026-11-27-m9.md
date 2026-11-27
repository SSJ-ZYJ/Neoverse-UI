# 2026-11-27 M9 engineering acceptance

Status: historical

## Scope and conclusion

**Pending Verification; not Engineering Ready.** Candidate changes are uncommitted on top of `a0b0cfed8b6c44df6da55e363615e09a43becf65`. The starting `dev` worktree was clean and three commits ahead of `origin/dev`. This record replaces the supplied milestone inventory for current checks; no tracked M8 delivery report was present at intake. No consumer checkout, remote run, release version, tag, or publication was changed.

| Batch | Implementation or finding | Readiness impact |
| --- | --- | --- |
| M9.0 repository | Reconciled actual budgets and scoped CI; reviewed package edges, test discovery, scripts, contracts and archive ownership. No mechanical splits or larger exceptions. | Budget and registry gates passed; review warnings remain. |
| M9.1 browsers | Made toast color measurement portable, observed animation lifecycle and actual keyboard focus, and replaced unreliable discrete display exits with visibility transitions. | Windows Firefox startup remains independent of the product; browser matrix results are recorded below. |
| M9.2 consumers | Built real Portal and Slides with candidate tarballs installed, not symlinks. Exercised SSR and hydration on their production outputs. | Published-mode consumer migration is not complete; no qualifying real React SSR consumer. |
| M9.3 materials | Expanded Firefox/WebKit discovery to material switching and overlay layering. Kept renderer and visual tokens unchanged. | Optical diagnostics passed; acceptance and real-device performance remain separate. |
| M9.4 release | Publication now requires Chromium, Windows, SwiftShader smoke, Firefox and WebKit on the publication commit, including version-only changes; shards reuse one build. Packed Tokens smoke checks the material catalog and surface-selection API. | Workflow and package checks are local evidence, not a published release. |
| M9.5 engineering | Recorded original and candidate test discovery, local gates and exact remote provenance. | No GitHub Actions evidence for the uncommitted candidate. |

## Browser findings

The reported Windows Firefox failures reproduced on `browser.newContext().newPage()` before loading an app or a URL. Playwright 1.65.1 finds Firefox 159.0 (`firefox-1572`); Node 26.13.1 and Bun 1.4.5 both fail, and Node reproduces with headed and headless launches. `DEBUG=pw:browser` reports socket/tab subprocess spawn error `-2147024891` (`0x80070005`, access denied) before `Target crashed`. The exact denying policy was not established. No sandbox or system policy was changed. WSL Firefox 159.0 opened `about:blank`; a separate headed suite ran in the pinned Ubuntu 24.04 Playwright image.

| Reported WebKit issue | Observed disposition |
| --- | --- |
| Vue Toast canvas | Test-only `OffscreenCanvas` reference failed; detached 1 × 1 DOM canvas preserves the same color assertions. |
| React Toast canvas | Same shared test probe and fix; no rendering path change. |
| Navigation indicator | Explicit normal motion keeps the property and duration assertions under the reduced-motion default. |
| Vue ContextMenu submenu | Normal-motion opt-in and settled-state sampling keep the seam and replay assertions. |
| React ContextMenu submenu | Same; the no-replay check observes rest instead of sleeping. |
| Theme reveal reversal | Same live animation and keyboard/pointer behavior; step its JavaScript playback clock so a software compositor cannot consume the sample window. |
| Scoped Morph/WAAPI | Windows WebKit did not animate when both fixture pages settled at the same height; make the fixture sizes explicit and record the actual resize keyframes. The focused Windows WebKit and Linux Firefox checks passed. Headed Linux WebKit lost its page during the first scoped preset, before reaching Morph. |
| React Dropdown native Tab | Open with Enter, confirm initial menu focus, allow native Tab order, then assert collapsed state and focus outside. |
| React Dropdown fallback Tab | Same contract; both Vue modes also reproduced the pointer-open fixture race and use the same keyboard check. |

The initial Windows WebKit run covered 209 discovered cases (206 passed, 2 failed, 1 capability skip). Its two failures were Morph resize sampling and the Vue ContextMenu material cascade test sending ArrowRight before initial focus settled. The initial Linux Firefox run covered 209 cases (204 passed, 4 failed, 1 skip): Breadcrumb release, both Dialog scrim exits, and React Toast pointer dismiss. Breadcrumb releases the anchor before leaving it so the platform does not start URL drag. The manual-dismiss React fixture disables demo expiry in contract mode.

Linux Firefox's `CSS.supports('transition-behavior', 'allow-discrete')` returns true, but a minimal element with `transition: display 2s allow-discrete` immediately became `display:none` on close and reported zero animations. The same probe produced both display and translate animations in Linux WebKit and Chromium. Dialog scrim and Drawer host now use `visibility` with existing motion durations, keeping pointer and focus release independent of paint.

Both caret tests subsequently passed on Linux Firefox and WebKit by pausing the real flight at creation before sampling it. The tests still assert the clip geometry, reversal and no flight under reduced motion.
Initial Linux WebKit (two workers, headed) completed 209 cases: 192 passed, 16 failed, one capability skip. The failures included caret sampling, navigation press feedback, SegmentedControl, appearance and page choreography, and all four ContextMenu move modes; some tests lost their page to a browser crash. A passing focused Windows run does not classify those Linux failures as host-only.

The Linux WebKit scoped transition crashed with only a real click and a wait for `ViewTransition.finished`, with no style polling. The pinned image reproduced `Target crashed` on a one-element page with only `document.startViewTransition`, both with the root snapshot and a named region. Headless WebKit finished the minimal transition; disabling DMA-BUF or forcing software GL did not repair headed WebKit under this Xvfb environment. The smoke workflow now runs headless WebKit against the same assertions and retains Xvfb for Firefox WebGL. The focused headless rerun passed all nine selected cases: caret in both adapters, pressed feedback, simultaneous appearance switching, theme reversal and scoped Morph. This establishes a browser/display-stack failure for the crashes, not for every interaction failure.

The subsequent Windows WebKit targeted set passed 15 cases (including both toast fixtures, all four Dropdown modes, caret, theme reversal and the corrected Vue ContextMenu material scenario); the scoped Morph assertion alone failed in that set. The modal-only follow-up passed 20 Chromium desktop/touch cases and 18 Linux Firefox/WebKit cases. The two remaining Linux layering assertions expected Chromium's initial Tab position; a fresh four-case check per platform passed after asserting that focus starts inside the dialog and can navigate to the close control. Drawer entrance/exit translation and focus return remain covered.

## Repository and release review

- `packages/tailwind/src/theme.css`: 858 lines / 860 exception. Its explicit public utility names are not one-to-one Token aliases, and most of the sheet is scoped material behavior. Generated aliases alone would not remove the hard-budget exception without another map for irregular names and explicit cascade handling. Retain the existing exception without expansion.
- Changesets policy changes now select package checks in addition to metadata. The Version Packages job requires successful scoped verification or reusable merged-PR CI evidence. `publish` mode never accepts reused PR evidence instead of running on the publication SHA.
- `packages/tokens/src/foundation/fonts.css`: 1512 lines / 1512 exception. The old Playground font file and 2300-line exception are absent. The Token sheet maintains pinned font subset URLs and Unicode ranges, with multiple font sources and descriptors. Deterministic generation requires matching upstream subset inventories, a reproducible refresh and proof of identical ranges/order; no network-dependent build or duplicated data source was introduced. The packed CSS uses jsDelivr; a representative Inter WOFF2 returned HTTP 200 with `font/woff2`.
- No source/runtime consumer path into another adapter's private code was found. The root static component gate reads the source material registry before builds so it can check contracts without relying on possibly stale `dist`. Published package dependency edges are acyclic; component layout, framework parity and repository test registry check their own boundaries.
- Changesets status (read-only): 102 entries, including the Tailwind overlay-exit patch. Vue/React `0.4.0 → 0.5.0`, Tokens/Tailwind/Overlay Runtime `0.3.1 → 0.4.0`, Motion/Glass Runtime `0.2.2 → 0.3.0`, Giscus Theme `0.2.0 → 0.2.1`, no Playground bump. No final consolidation or versioning. Local tarballs retain their current manifest versions. Inspected eight tarballs: TypeScript packages carry source maps; CSS-only packages carry no maps; no cache, test or process artifacts were present.

## Real consumers

| Consumer snapshot | Verified using installed tarballs | Remaining constraint |
| --- | --- | --- |
| XCA-Portal `16fd42c16017fe4e551f417b30b2c44a31823380` | Six tarballs through loopback install, installed Vue/Motion/CSS resolution, Nuxt production build, SSR headers and mobile menu navigation, Escape and focus return with zero observed hydration warnings. Typecheck passed with genuine snapshot SHA supplied using the existing `GITHUB_SHA` fallback. | Plain Git-less export makes Nuxt infer public `buildInfo` as a string (eight type diagnostics); that path is unrelated to UI types. Existing local mode aliases to sibling sources. Authorization, content breadth and material-switch acceptance remain. |
| Neoverse-Slides uncommitted source export | Six tarballs, Nuxt typecheck/build, two production Slidev decks, prerendered filters, hydrated navigation, live search, Select dismissal and theme switch without observed hydration warnings. | Repository has no `HEAD`. `ui:sync` calls the retired checkout-only `scripts/sync-consumer.ts`; the isolated validation copied CSS from the installed public entry before invoking Nuxt. Slidev `vite.config.ts` still matches the private `dist/index.css` filename and declares its own layer order. Full consumer build wrapper was not green. |
| Neoverse-Doc `f1da71c447f0efbc1402ac612202e2bc47a3580b` | Read-only Next/React dependency inspection. | It does not install Neoverse UI, so it cannot validate the React adapter upgrade. No real alternate React SSR consumer was found in the inspected local candidates. Package SSR and adapter hydration smokes do not substitute for one. |

The actual consumer pipelines still pin older UI commits: Portal `63a48789f6b65fa44aea22e4189015232d3961b6`, Slides `eda31c32d6881541c847256eaacb60c3719f2763`. The tarball exercises do not change those pins or establish a green consumer CI upgrade.

The consumer runs used the tarballs from before the final Tailwind overlay exit repair. The final package smoke was rerun on the revised artifacts; that does not replace a repeat of the real consumer scenarios.

No consumer currently exposed a three-material toolbar in the inspected sources. Existing explicit Glass in the Portal window-edge header and Slides embedded preview has a clear paint/overflow purpose. Review ordinary cards, the Slides filter/sidebar wrappers, and Portal About/auth surfaces for automatic scope; do not migrate intentional optical composition merely to remove an attribute. Both consumers use client Glass initialization; conditional allocation is distinct from lazy chunk loading. Consumer-level Frosted blur performance and the three-material override paths remain unverified.

## Material and M10 evidence

The [material standards](../../../docs/architecture/material-standards.md), [component contracts](../../../docs/architecture/component-contract-matrix.md) and [test registry](../../../docs/testing/README.md) remain the inventory. Frosted is still `experimental`. Existing Design Lab controls cover theme, global and local material, background, zoom, state, test compositions and isolated preview. Use `#materials-foundation` for nested comparisons and `#forms-input` with the Optical background for a reproducible baseline. Six rendered Chromium references were reviewed and published in the [private visual baseline](http://127.0.0.1:6543/a/7izh4mbhy23mejgcdmyosviqpu/); no automated screenshot expectations were updated.

| M10 review target | Material / theme / state | Classification and scope |
| --- | --- | --- |
| `UiInput`, inspect other fields after confirmation | Solid and Frosted, Light and Dark, keyboard Focus | The nested border and focus ring read as two contours against the optical field in the reference. Review shared field/focus Tokens and recipe first; design judgment, not a confirmed failure or a reason to reduce visibility. |
| Design Lab theme/material/background SegmentedControl | Light Solid versus Light Frosted, Selected and Rest | Selected emphasis is more subdued in the Solid reference. Compare it with the shared Solid selection recipe before proposing a component-local override. |
| `UiSwitch` Inspector controls | Dark Frosted versus Dark Solid, Rest; verify Disabled separately | Inspect matte thumb/track separation before changing shared control tokens. The captured controls are off, not disabled; no disabled-state conclusion. |
| Dialog, Card and nested Surface | Both themes, Frosted nested panel versus floating overlay, Rest and Focus | Review blur separation over high-detail backgrounds; retain the rule that floating overlays sample independently. This is manual review scope, not a confirmed visual issue. |

Linux SwiftShader ran all 32 diagnostics with zero failures. Chromium focused field checks observed zero Glass canvases in Solid/Frosted and one in Glass, on both themes. A 12-frame per-material diagnostic at 1440 × 900 saw median 16.7 ms for all three and a Glass peak 83.4 ms versus 16.8 ms Frosted and 16.7 ms Solid; this is not a real-device benchmark or evidence to retune optics. Manual cross-device accessibility and optical acceptance remain open.

The checks exercised both adapters' overlay focus and dismiss paths, desktop material switching, and the production optical renderer. They do not establish that every public component/state, all nine scope pairs at multiple depths, all six directed transitions under rapid switching, Inspector Reset/session cleanup, simultaneous appearance updates, accessibility preference combinations, or nested Frosted sampling pass on the final three-engine candidate. These remain acceptance items rather than changes to the material contract.

## Local commands and discovery

| Command | Observed result |
| --- | --- |
| `bun run release:check` in isolated Windows and Linux copies | Both passed: build, lint, typecheck, contracts/parity, material/layout gates, docs, budgets, 684 unit/tooling tests and 8 clean-consumer tarballs each; zero failed. Existing advisory lint findings remain. |
| `node --test .github/scripts/ci-classify.test.mjs .github/scripts/ci-evidence.test.mjs`; `bash -n .github/scripts/ci-scope.sh`; `actionlint -shellcheck=` | 19 passed, zero failed; shell and workflow syntax passed. |
| `bunx playwright test --list --shard=N/3` | 257, 257 and 256 cases; 770 total. Firefox and WebKit now discover 224 each across 13 specs. |
| `bunx playwright test --workers=2 --reporter=dot` (Windows Chromium, pre-follow-up) | 755 passed, 2 flaky, 13 documented skips, zero final failures. The drawer's translate end event raced the host's discrete display exit; observe both translate starts, settled entry and final focus/visibility instead. |
| `bunx playwright test --config=playwright.cross-browser.config.ts --project=webkit` (Windows, targeted initial regressions) | 12 passed, zero failed. Full initial run and subsequent follow-up results are separate. |
| Headed Linux focused caret, Breadcrumb and material switching (`--grep`, one worker) | 10 passed, zero failed across Firefox and WebKit. The equivalent Chromium desktop/touch run passed 9 with 1 existing desktop-only skip. |
| Headed Linux WebKit risk rerun (`--grep`, one worker) | 1 passed, 15 failed on the pre-caret-fix test set and crashing display backend; later passing cases are recorded separately. |
| `bunx playwright test --config=playwright.cross-browser.config.ts --project=firefox --headed --workers=3 --retries=0` (Linux) | 222 passed, 1 failed, 1 capability skip. Theme reveal's manual click sampled its position before layout settled. The revised real-pointer test passed 4/4 Firefox repetitions, 1/1 headless WebKit, and 2/2 Chromium desktop/touch; no post-fix full Firefox run. |
| `bunx playwright test --config=playwright.cross-browser.config.ts --project=webkit --workers=3 --retries=0` (Linux headless) | Discovered 224 cases; the full local attempt timed out before a final count. Neither this run nor the focused passes provides a complete WebKit result. |
| Linux focused ContextMenu retarget (`--grep 'second right-click'`, no retries) | 12 passed: 4 each in Chromium, headed Firefox and headless WebKit. Pause the real WAAPI slide early on its decelerating curve and assert painted position, full opacity, settlement and dismissal; no timing extension. The material fade case also passed separately in headless WebKit. |
| Chromium modal regression set (`--grep`, no retries) | 20 passed across desktop and touch after the CSS repair, with no failures. |
| `bunx playwright test --config=playwright.optics.config.ts` (Linux SwiftShader) | 32 passed, zero failed. |

## CI provenance and remaining approvals

- [Run 45840251881](https://github.com/SSJ-ZYJ/Neoverse-UI/actions/runs/45840251881), `5b9ff877210b8e8b2ca81ae38f9acc86f5c75048`: Linux quality failed on Biome formatting; all three browser shards, Windows and optical smoke were skipped. Aggregate Linux failed.
- [Run 45764765070](https://github.com/SSJ-ZYJ/Neoverse-UI/actions/runs/45764765070), `3e880a0ba9a8c833ddaf86464632439e72cba046`: Linux quality, each of the three Chromium shards, optical smoke and Windows succeeded. Firefox/WebKit did not run in this CI workflow. This historical result is not candidate evidence.
- Main ruleset requires both existing aggregate contexts and strict up-to-date checks. Candidate publication additionally waits for the Firefox/WebKit workflow, not just those context names. Remote verification on the candidate needs an authorized commit/push and, where applicable, browser dispatch. Windows sandbox remediation, consumer repository changes, versioning, tags and publication remain outside the work performed here.
