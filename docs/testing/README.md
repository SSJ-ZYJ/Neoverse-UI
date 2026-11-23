# Testing

Status: adopted

This file is the registry for repository test scope, the browser spec ownership, and the commands that run them. Package implementations own their unit tests; this document owns only how test files are registered and verified.

## Scope registry

The table is the single declaration of test scope. A test file must fall inside a registered scope, and a registered scope must match at least one file. `Level` is `unit` for pure logic, `module` for cross-module work or temporary directories, and `system` for browser behavior on a production build. `Runner` is `bun-test` or `playwright`. `Metadata` requires per-file mechanical evidence: `browser` requires the playwright runner, `isolated` requires a `mkdtemp` call, `scene` requires an `@cinematic` tag, and `snapshot` requires `toHaveScreenshot` plus a PNG baseline. Every file in a scope must carry declared evidence, and no file may carry undeclared evidence; malformed or duplicate rows also fail `check:test-registry`.

Registration does not execute a test. Every `bun-test` or `vitest` file must additionally be covered by a `bun test` or `vitest` command reachable from the root `test` script. The checker follows `bun run` calls, expands `--filter` workspace patterns, and stops at cycles; an orphan script that the root entry never calls does not cover a test. Commands resolve against their own package directory, and both runners apply the same rule: with no file target a command covers that package's tests, with an explicit file or directory target it covers only those files. Playwright specs are covered by their config instead.

| Scope | Level | Runner | Args | Metadata |
| --- | --- | --- | --- | --- |
| `packages/*/src/*.test.ts` | unit | bun-test | — | — |
| `packages/*/src/*.test.tsx` | unit | bun-test | — | — |
| `apps/playground/src/*.test.ts` | unit | bun-test | — | — |
| `scripts/dev/*.test.ts` | unit | bun-test | — | — |
| `scripts/gates/*.test.ts` | unit | bun-test | — | — |
| `scripts/release/*.test.ts` | module | bun-test | — | isolated |
| `scripts/requests/*.test.ts` | module | bun-test | — | isolated |
| `scripts/sync/*.test.ts` | module | bun-test | — | isolated |
| `tests/e2e/*.spec.ts` | system | playwright | — | browser |
| `tests/optics/*.spec.ts` | system | playwright | — | browser |

Cross-browser coverage is declared in `playwright.cross-browser.config.ts` and checked against the `tests/e2e` rows. The `scripts/gates/` checks are static repository checks, not tests; their inventory lives in [scripts/AGENTS.md](../../scripts/AGENTS.md).

A test asserts an observable user outcome: a panel opens, focus returns, a value is submitted, a link navigates, a control keeps its token size. Geometry, color contrast and material-tier wiring stay as computed-style assertions because they are deterministic across engines and describe a contract. Pixel probes, screenshot baselines and animation-frame accounting were removed: genuine optical quality (directional light, chroma retention, refraction) is verified by manual acceptance against [Material standards](../architecture/material-standards.md), not by the e2e gate. Tests use both Playwright projects (1920×1080 desktop and 390px touch), and a test that only applies to one layout skips itself with a stated reason.

## Browser specs

`tests/e2e/` is organised by product module, not by component: one spec per area, with the shared adapter and fixture helpers in `tests/support/e2e.ts`.

| Spec | Covers |
| --- | --- |
| `forms.spec.ts` | Field wiring, text submission and IME, Select keyboard and controlled rejection, choice controls, number inputs, accessibility roles |
| `overlays.spec.ts` | Popover, dropdown and context menu lifecycle, dismissal, focus return, anchor tracking, viewport clamping, tooltip content |
| `navigation.spec.ts` | Breadcrumb, dock, segmented control direction keys and roving tab stop, step flow |
| `surfaces.spec.ts` | Disclosure, table, skeleton, timeline, stat card, scrollbar |
| `terminal.spec.ts` | Transcript composition, suggestions, IME guard, tail following, reader intent |
| `motion.spec.ts` | List reorder, entrance replay, page dissolve, React presence exit, reduced motion, layout width on a language switch |
| `materials.spec.ts` | Aurora Glass previews render and stay readable across themes, glass buttons change tint without losing blur on press, reduced transparency removes blur and canvas, and both adapters wire the three tier recipes |
| `glass-runtime.spec.ts` | One shared noninteractive renderer canvas, fixed placement, theme stability, context loss/restore, runtime reduced transparency, forced colors and adapter lifecycle |
| `layout.spec.ts` | Control size baseline in both adapters, badge type scale, 24px minimum target, no implicit specimen magnification |
| `contrast.spec.ts` | WCAG contrast floors for the primary, secondary and muted text roles in both themes |
| `playground.spec.ts` | Explorer search and full catalogue previews, Markdown heading and inline style rendering, single-layer shell specimen panels, preview and specimen persistence across reload, overlay isolation and cleanup, bidirectional Inspector edits, composition presets and reset without remounting, dynamic focus fallback, focused preview and QA gallery isolation, browser history and scroll restoration, keyboard focus, theme and language, stage background switching and persistence, stage specimen dragging and recentering, responsive overflow and reduced motion |
| `parity.spec.ts` | Every React adapter renders, theme resolution, shared control names |

The cross-browser configuration runs the interaction specs that do not depend on the Chromium-only optical harness: forms, overlays, navigation, surfaces, motion and parity. Terminal IME and scroll-tail timing, Glass and materials, layout and contrast probes, and the Playground shell stay Chromium-only because they either depend on that rendering harness or duplicate an existing cross-engine contract at disproportionate CI cost. Extending the list requires running both Firefox and WebKit before the spec enters the registry. `tests/optics/glass.spec.ts` runs separately under Chromium with SwiftShader and reports optical diagnostics rather than a release pass/fail signal.

These specs import the `test` fixture from `tests/support/e2e.ts`, which keeps navigation on `domcontentloaded` and then waits until the document height is stable for ten animation frames. The Design Lab mounts its specimen backdrops after DOM ready, and Firefox's scroll anchoring can move a control between Playwright's scroll and the dispatched click, aiming it at a neighbouring row.

## Commands

| Command | Scope |
| --- | --- |
| `bun run check` | Sequential quality gates, typecheck and all unit/contract tests |
| `bun run test` | Workspace unit tests plus repository tooling tests |
| `bun run test:e2e` | Build, then Chromium desktop and touch browser specs |
| `bun run test:e2e:cross-browser` | Firefox and WebKit interaction specs |
| `bun run test:glass:optics` | Software-rendered Aurora Glass optical diagnostics |
| `bun run check:test-registry` | Browser spec and registry agreement |

`tests/support/e2e.ts` owns the shared browser adapters and fixture helpers. Add a new spec only when it covers a module that no existing spec owns, and register it in the table above in the same change. `bun run check:test-registry` rejects a spec that is missing from this table, a table row whose spec file is gone, and a cross-browser entry that is not registered.

## Check runner

`bun run check` executes `scripts/check.ts`. The runner runs every stage sequentially without stopping at the first failure, then prints a PASS/FAIL summary with durations and totals. Full stdout and stderr go to per-stage files in the printed temporary log directory; failed stages include exit codes and standalone rerun commands. Any failed stage produces a nonzero overall exit code. Individual check scripts and `release:check` remain independently callable.

The stages cover Biome auto-fix, text integrity, source language, documentation standards, Stylelint, Tailwind usage, material standards, component contracts, framework parity, component requests, test registry, changeset targets, typecheck with builds, and all unit and contract tests.