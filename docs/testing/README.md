# Testing

Status: adopted

This file is the registry for repository test layers, the browser spec ownership, and the commands that run them. Package implementations own their unit tests; this document owns only how the layers are organized and verified.

## Layers

| Layer | Location | Contract |
| --- | --- | --- |
| Unit and contract | `packages/*/src/*.test.ts`, `apps/playground/src/*.test.ts` | Public behavior and package-local invariants |
| Repository tooling | `scripts/*.test.ts` | Contract checks, release tooling, request intake and docs rules |
| Browser end-to-end | `tests/e2e/` | Observable user outcomes in the Design Lab |
| Cross-browser | `playwright.cross-browser.config.ts` | Firefox and WebKit interaction coverage |
| Optical diagnostics | `tests/optics/` | Software-rendered Aurora Glass measurements |
| Checks | `scripts/gates/` | Static repository contracts such as docs, parity and materials |

A test asserts an observable user outcome: a panel opens, focus returns, a value is submitted, a link navigates, a control keeps its token size. Geometry, color contrast and material-tier wiring stay as computed-style assertions because they are deterministic across engines and describe a contract. Pixel probes, screenshot baselines and animation-frame accounting were removed: genuine optical quality (directional light, chroma retention, refraction) is verified by manual acceptance against [Material standards](../architecture/material-standards.md), not by the e2e gate. Tests use both Playwright projects (1920×1080 desktop and 390px touch), and a test that only applies to one layout skips itself with a stated reason.

## Browser specs

`tests/e2e/` is organised by product module, not by component: one spec per area, with the shared adapter and fixture helpers in `tests/support/e2e.ts`.

| Spec | Covers |
| --- | --- |
| `forms.spec.ts` | Field wiring, text submission and IME, Select keyboard and controlled rejection, choice controls, number inputs, accessibility roles |
| `overlays.spec.ts` | Popover, dropdown and context menu lifecycle, dismissal, focus return, anchor tracking, viewport clamping, tooltip content |
| `navigation.spec.ts` | Breadcrumb, dock, segmented control, step flow |
| `surfaces.spec.ts` | Disclosure, table, skeleton, timeline, stat card, scrollbar |
| `terminal.spec.ts` | Transcript composition, suggestions, IME guard, tail following, reader intent |
| `motion.spec.ts` | List reorder, entrance replay, page dissolve, React presence exit, reduced motion, layout width on a language switch |
| `materials.spec.ts` | Aurora Glass previews render, stay readable across themes, lose blur and canvas under reduced transparency, and each tier wires its own blur, saturation and tint in both adapters |
| `glass-runtime.spec.ts` | One shared noninteractive renderer canvas, fixed placement, theme stability, context loss/restore, runtime reduced transparency, forced colors and adapter lifecycle |
| `layout.spec.ts` | Control size baseline in both adapters, badge type scale, 24px minimum target, no implicit specimen magnification |
| `contrast.spec.ts` | WCAG contrast floors for the primary, secondary and muted text roles in both themes |
| `playground.spec.ts` | Shell navigation, deep links, drawer, scroll restoration, responsive overflow |
| `parity.spec.ts` | Every React adapter renders, theme resolution, shared control names |

The cross-browser configuration runs the interaction specs that do not depend on the Chromium-only optical harness: forms, overlays, navigation, surfaces, motion and parity. Terminal IME and scroll-tail timing, Glass and materials, layout and contrast probes, and the Playground shell stay Chromium-only because they either depend on that rendering harness or duplicate an existing cross-engine contract at disproportionate CI cost. Extending the list requires running both Firefox and WebKit before the spec enters the registry. `tests/optics/glass.spec.ts` runs separately under Chromium with SwiftShader and reports optical diagnostics rather than a release pass/fail signal.

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

The stages cover Biome auto-fix, text integrity, source language, documentation standards, Stylelint, Tailwind usage, material standards, component contracts, framework parity, component requests, changeset targets, typecheck with builds, and all unit and contract tests.