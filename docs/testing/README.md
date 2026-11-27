# Testing

Status: adopted

This file is the registry for repository test scope, the browser spec ownership, and the commands that run them. Package implementations own their unit tests; this document owns only how test files are registered and verified.

## Scope registry

The table is the single declaration of test scope. A test file must fall inside a registered scope, and a registered scope must match at least one file. `Level` is `unit` for pure logic, `module` for cross-module work or temporary directories, and `system` for browser behavior on a production build. `Runner` is `bun-test` or `playwright`. `Metadata` requires per-file mechanical evidence: `browser` requires the playwright runner, `isolated` requires a `mkdtemp` call, `scene` requires an `@cinematic` tag, and `snapshot` requires `toHaveScreenshot` plus a PNG baseline. Every file in a scope must carry declared evidence, and no file may carry undeclared evidence; malformed or duplicate rows also fail `check:test-registry`.

Registration does not execute a test. Every `bun-test` or `vitest` file must additionally be covered by a `bun test` or `vitest` command reachable from the root `test` script. The checker follows `bun run` calls, expands `--filter` workspace patterns, and stops at cycles; an orphan script that the root entry never calls does not cover a test. Commands resolve against their own package directory, and both runners apply the same rule: with no file target a command covers that package's tests, with an explicit file or directory target it covers only those files. Playwright specs are covered by their config instead.

| Scope | Level | Runner | Args | Metadata |
| --- | --- | --- | --- | --- |
| `packages/*/src/*.test.ts` | unit | bun-test | — | — |
| `packages/*/src/tests/*.test.ts` | unit | bun-test | — | — |
| `packages/*/src/tests/*.test.tsx` | unit | bun-test | — | — |
| `apps/playground/src/tests/*.test.ts` | unit | bun-test | — | — |
| `scripts/dev/*.test.ts` | unit | bun-test | — | — |
| `scripts/dev/integration/*.test.ts` | module | bun-test | — | isolated |
| `scripts/gates/*.test.ts` | unit | bun-test | — | — |
| `scripts/release/*.test.ts` | module | bun-test | — | isolated |
| `scripts/requests/*.test.ts` | module | bun-test | — | isolated |
| `scripts/sync/*.test.ts` | module | bun-test | — | isolated |
| `tests/e2e/*/*.spec.ts` | system | playwright | — | browser |
| `tests/optics/*.spec.ts` | system | playwright | — | browser |

Cross-browser coverage is declared in `playwright.cross-browser.config.ts` and checked against the `tests/e2e` rows. The `scripts/gates/` checks are static repository checks, not tests; their inventory lives in [scripts/AGENTS.md](../../scripts/AGENTS.md).

A test asserts an observable user outcome: a panel opens, focus returns, a value is submitted, a link navigates, a control keeps its token size. Geometry, color contrast and material-tier wiring stay as computed-style assertions because they are deterministic across engines and describe a contract. Pixel probes, screenshot baselines and animation-frame accounting were removed: genuine optical quality (directional light, chroma retention, refraction) is verified by manual acceptance against [Material standards](../architecture/material-standards.md), not by the e2e gate. Tests use both Playwright projects (1920×1080 desktop and 390px touch), and a test that only applies to one layout skips itself with a stated reason.

Use the narrowest layer that can detect the regression. Browser specs cover
rendered layout, real interaction, and adapter integration, not fixture wiring
or a second copy of a unit assertion. Repeat a scenario across themes only when
its expected appearance or behavior depends on the theme. For layout, sample
the widths and languages that exercise distinct responsive behavior instead of
running every theme, width, and language combination.

## Browser specs

`tests/e2e/` is organised by responsibility domain (`materials/`, `components/`, `overlays/`, `motion/`, `playground/`, `accessibility/`, `parity/`), split into focused specs when an area outgrows the test-file budget, with the shared adapter and fixture helpers in `tests/support/e2e.ts`.

| Spec | Covers |
| --- | --- |
| `components/forms.spec.ts` | Field wiring, text submission and IME, Select keyboard and controlled rejection, readonly choice submission and consumer reset, number inputs, accessibility roles |
| `overlays/overlays.spec.ts` | Dialog, popover and dropdown lifecycle, dismissal, focus return, anchor tracking, tooltip and toast behavior, unified overlay typography and destructive confirmation |
| `overlays/context-menu.spec.ts` | Cursor menu and submenu lifecycle, keyboard entry, hover wash, parent rim and positioning corrections, viewport clamping, touch and no-Popover fallback, native menu passthrough |
| `overlays/overlay-layering.spec.ts` | Modal drawer and higher-layer toolbar hit testing, anchored fallback overlap and dismissal |
| `components/navigation.spec.ts` | Breadcrumb, dock and step flow, shared navigation indicator inside a magnified preview |
| `components/segmented-control.spec.ts` | Segmented control direction keys and roving tab stop, rejected and disabled reconciliation, held-drag preview and release commit, theme icon and language label geometry, Aurora Glass well |
| `components/surfaces.spec.ts` | Grouped-control scale motion, tabs, pagination, disclosure, table, skeleton, timeline, stat card, scrollbar, avatar initials and placeholder icon |
| `components/terminal.spec.ts` | Transcript composition, suggestions, IME guard, tail following, reader intent |
| `motion/motion.spec.ts` | List reorder, entrance replay, page transitions, page dissolve, disclosure expansion and collapse, React presence exit, reduced motion, layout width on a language switch, theme reveal reversal and thumb color continuity |
| `motion/motion-hierarchy.spec.ts` | Promoted Motion section, right-hand Inspector category switching, distinct-scene zero-flash transitions |
| `materials/materials.spec.ts` | Solid opacity and contrast, Glass tier paint and reduced transparency, adapter/portal paint, Prose and focus |
| `materials/material-scopes.spec.ts` | All nine parent/child material combinations, unknown and removed boundaries, all seven Surface Roles across Solid/Frosted/Glass in Light and Dark, Frosted non-optical isolation and nested blur suppression, contrast, reduced transparency state preservation, forced colors, and scroll stability |
| `materials/component-materials.spec.ts` | Component-level three-material integration across controls, forms, tooltip pointers, avatars, status plates, terminals, Prose, explicit Frosted surfaces, portaled dialog scope bridging, and zero Glass canvas on pure Solid/Frosted pages |
| `materials/glass-runtime.spec.ts` | One shared noninteractive renderer canvas, fixed placement, theme stability, context loss/restore, on-demand allocation (a pure Solid page keeps zero optical resources and releases them), runtime reduced transparency, forced colors and adapter lifecycle |
| `accessibility/layout.spec.ts` | Control size baseline in both adapters, badge type scale, 24px minimum target, no implicit specimen magnification, table caption placement and corner consistency across previews and composition scenes |
| `accessibility/contrast.spec.ts` | WCAG contrast floors for the primary, secondary and muted text roles in both themes |
| `playground/playground.spec.ts` | Explorer disclosure and specimen search, theme and layout continuity on reload, preview persistence and reading position, browser history and deep links, drawer focus, responsive shell overflow |
| `materials/material-switching.spec.ts` | Three-material desktop and touch switching, specimen form/zoom/scroll continuity, last-request-wins, appearance snapshot cleanup, Solid status and selection |
| `playground/playground-stage.spec.ts` | Focused stage canvas, stage background switcher and persistence, specimen move handle and Home recentering, preview zoom, wheel zoom around the pointer, magnified pan without clipping the shadow, chrome and heading above a magnified preview |
| `playground/playground-specimens.spec.ts` | Catalogue previews at their own size, Colors gallery, Markdown heading and inline style rendering, specimen title hierarchy, stage backdrop without painted specimen wrappers, focused and QA galleries |
| `playground/playground-composition.spec.ts` | Composition presets and reset without remounting, dynamic focus fallback, mobile composition drawer, preset geometry at representative widths in both languages, reduced motion, anchored overlay isolation and cleanup |
| `playground/playground-inspector.spec.ts` | Inspector edits shared with Button, Badge, SegmentedControl, Select, Checkbox, Tabs, Card and Dock |
| `playground/playground-shell.spec.ts` | Isolated specimen frame, desktop and mobile toolbar, Giscus themes, direct Explorer leaves, demo destinations, React fixture link |
| `parity/parity.spec.ts` | Every React adapter renders, theme resolution, shared control names |

The cross-browser configuration runs forms, overlays and their layering,
context menu, navigation, segmented control, surfaces, motion, parity, and
engine-neutral material tests for scope resolution, switching, paint and
component integration. `@chromium-materials`
excludes Chromium-specific tier and media-emulation probes from that
configuration. The separate SwiftShader suite runs under Linux Chromium: CI
runs `@optics-smoke` for Glass-impacting changes, and publication requires that
smoke on the publication commit. Run the full diagnostic suite locally when
validating rendering; an optical pass does not replace manual visual acceptance.

These specs import the `test` fixture from `tests/support/e2e.ts`, which keeps navigation on `domcontentloaded` and then waits until the document height is stable for ten animation frames. The Design Lab mounts its specimen backdrops after DOM ready, and Firefox's scroll anchoring can move a control between Playwright's scroll and the dispatched click, aiming it at a neighbouring row.

Readonly choice checks also scroll each target into a stable position before forced
pointer input. The force option is needed for `aria-disabled` controls, but it also
bypasses Playwright's usual stability and hit-target checks.

Tests that assert an animation opt into `reducedMotion: 'no-preference'` rather
than inheriting the cross-browser suite's reduced-motion default. To exercise
keyboard focus release, open the menu with the keyboard, assert that focus
enters it, and then let the engine choose the next Tab stop.

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

The stages cover Biome auto-fix, text integrity, source language, documentation standards, Stylelint, Tailwind usage, material standards, component contracts, component layout, framework parity, component requests, test registry, changeset targets, typecheck with builds, and all unit and contract tests.