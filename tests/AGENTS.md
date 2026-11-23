# tests structure

Read this file before changing browser or optical tests. The layer registry and command table are in [docs/testing/README.md](../docs/testing/README.md); global constraints are in [AGENTS.md](../AGENTS.md).

```text
tests/
  e2e/        Playwright specs, one file per product module
  optics/     SwiftShader Aurora Glass optical diagnostics
  support/    shared browser, contrast and optical helpers
```

## e2e

Specs are organised by product module, not by component. The ownership table lives in the [testing registry](../docs/testing/README.md#browser-specs); do not duplicate it here.

`tests/support/e2e.ts` owns the shared adapters, theme iteration, overflow assertions and fixture helpers; `tests/support/playground.ts` holds the Inspector and language helpers shared by the playground specs. A helper used by one spec stays in that spec.

## optics

`tests/optics/glass.spec.ts` runs only under `playwright.optics.config.ts` with Chromium and SwiftShader. It reports optical measurements and attaches failures; it is not a release pass/fail signal and does not replace manual acceptance.

## Rules

- Add a spec only for an area that no existing spec owns, and register it in the testing registry in the same change.
- A test title describes an observable user outcome: actor, action, expected result. Do not encode a CSS class or implementation detail.
- Tests run in both Playwright projects (1920×1080 desktop and 390px touch). A layout-specific test skips itself with a stated reason.
- Use computed-style and geometry assertions for deterministic contracts. Do not add screenshot baselines, pixel probes or animation-frame accounting.
- Do not depend on English copy for automation; use `data-contract-*` or `data-specimen-*` markers.
- A browser test must fail if its user-visible outcome breaks. A test that only proves wiring, source text or a default echoes something is removed.
- Keep the server contract: Playwright starts `bun apps/playground/src/index.ts` on `NEOVERSE_UI_PLAYWRIGHT_PORT` or reuses a running instance. Do not add a second server launcher.