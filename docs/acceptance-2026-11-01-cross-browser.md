# 2026-11-01 cross-browser release-candidate findings

## Source, invocation and outcome

[Run 41277876420](https://github.com/SSJ-ZYJ/Neoverse-UI/actions/runs/41277876420)
checked out `608a7acae156d69078479fd10b8495f6e6ce5b72` on Ubuntu 24.04 using
Bun 1.4.0 and Playwright 1.60.0. It was dispatched through the existing CI entry:

```sh
gh workflow run ci.yml --repo SSJ-ZYJ/Neoverse-UI --ref dev -f cross_browser_only=true
```

The workflow installed dependencies, built the packages and Playground, installed
both browsers, recorded provenance, then ran:

```sh
bunx playwright test --config=playwright.cross-browser.config.ts --workers=1 --retries=0 --trace=retain-on-failure --reporter=list,html,json
```

The job started at 05:41:07 UTC and ended at 06:01:25 UTC. GitHub's check annotation
states: `The job has exceeded the maximum execution time of 20m0s`. The workflow
and browser job concluded `cancelled`. The artifact upload succeeded after test
cancellation. There was no final Playwright JSON/HTML report in the uploaded files.

The partial console log contains these completed cases; these are log counts, not
a completed-suite summary:

| Engine | Planned | Passed | Failed | Unfinished or not started |
| --- | --- | --- | --- | --- |
| Firefox | 134 | 128 | 6 | 0 |
| WebKit | 134 | 98 | 10 | 26 |
| Total | 268 | 226 | 16 | 26 |

Sixteen failures were already recorded before the job deadline. A longer job
alone would not resolve those failures. Cross-browser acceptance remains open.

## Captured failures

All 16 failed cases retained `trace.zip` and `error-context.md` in
[artifact 13072825043](https://github.com/SSJ-ZYJ/Neoverse-UI/actions/runs/41277876420/artifacts/13072825043).
The artifact also includes eight form screenshots. Its configured retention is
seven days, expiring on 2026-11-08. Trace event JSON was inspected without opening
a local browser or running a local build.

| Engine / cases | Test | Observed assertion signal |
| --- | --- | --- |
| Firefox / 2 themes | `component-interactions.spec.ts:344`, React Select fallback scroll/resize | Expected overlay top to move by more than 60px; it moved 3px. The recorded side flipped from top to bottom while the trigger moved by 140px; the trigger-to-panel gap remained about 8px. Separate placement changes from the absolute-motion assertion in a narrow replay. |
| Firefox / 1 | `glass-scheduling.spec.ts:3` | Expected `html[data-neoverse-glass-renderer="webgl"]`; no renderer attribute was present. Renderer activation/support needs its own signal before attributing this to repaint scheduling. |
| Firefox / 1 | `overlay-tracking.spec.ts:153`, React fallback at zoom 1.5 | Expected position error below 2px; the final captured error was about 8.70px. |
| Firefox / 2 themes | `react-parity.spec.ts:236`, terminal history reading | Expected transcript `scrollTop` 0; captured values included 1262 and 1046. The original wheel/resize/append sequence needs a narrow replay. |
| WebKit / 4 adapter/theme combinations | `choice-control-behavior.spec.ts:42`, RadioGroup | After focusing the second radio and pressing ArrowRight, the first radio remained inactive instead of focused. |
| WebKit / 2 themes | `component-interactions.spec.ts:180`, Vue fallback Popover/menu | Light: visible fallback panel retained opacity 0 instead of 1. Dark: the trigger click timed out at 30 seconds while waiting for stability. |
| WebKit / 2 modes | `overlay-tracking.spec.ts:99`, Vue tracking cleanup | Expected one pending animation frame after opening; the trace recorded 61. The test ended during later polling/evaluation. This observation alone does not establish an overlay listener or frame leak. |
| WebKit / 2 zoom levels | `overlay-tracking.spec.ts:153`, Vue native positioning | Expected position error below 2px; final captured errors were about 5.81px and 8.72px at zoom 1 and 1.5. |

These are captured symptoms. Product defects, test assumptions and environment
limitations have not yet been separated by a deterministic narrow replay. No
component code, assertion thresholds, retries or workflow time limits were changed
to obtain a passing result.

## Next remote diagnosis

The existing full-run command provides a red signal, but takes too long for a
diagnosis loop. Before proposing fixes, establish separate remote commands for
the failed paths on the recorded source, preserving one worker and zero retries.
For example, in the prepared remote checkout:

```sh
bunx playwright test --config=playwright.cross-browser.config.ts tests/visual/choice-control-behavior.spec.ts --project=webkit --grep RadioGroup --workers=1 --retries=0 --trace=retain-on-failure
bunx playwright test --config=playwright.cross-browser.config.ts tests/visual/overlay-tracking.spec.ts --project=firefox --grep 'React tracks an anchor.*fallback / 1.5' --workers=1 --retries=0 --trace=retain-on-failure
```

These narrowed commands are proposed follow-up loops and have not been executed.
Only after they reproduce the same symptoms should hypotheses, targeted probes
and fixes be selected. The 26 unfinished WebKit cases also need coverage in a
subsequent complete run. Local browser, WebGL, WSL and build execution remain
excluded by the current project execution constraints.

## Release interpretation

Preparation commit `59262b08e19471a8b3741d99e214484943755a19` changes only
Changesets, verification tooling and documentation; the package, Playground and
browser-test sources match this cross-browser baseline. Its ordinary
[CI run 41278138700](https://github.com/SSJ-ZYJ/Neoverse-UI/actions/runs/41278138700)
passed release quality and all eight package smokes, 998 Linux Chromium cases
(68 skipped), and 62 Windows cases. Those successes do not close these Firefox/
WebKit findings. Keep the candidate at release preparation until the findings
have been resolved or explicitly reviewed with their remaining coverage limits.
