# Neoverse-UI agent instructions

Neoverse-UI is a Vue 3 and React component library with shared Tokens, Tailwind styles, motion, overlay and Aurora Glass runtimes. Read this file before changing the repository.

- [Documentation standards](docs/AGENTS.md): directory registry, status metadata, writing rules and link checks.
- [Architecture](docs/architecture/README.md): workspace layout, package boundaries, component inventory and Design Lab.
- [Testing](docs/testing/README.md): test layers, browser spec ownership and commands.
- [Code style and terminology](docs/code-style.md): source language, naming, abbreviations and terminology.
- [Component contracts](docs/architecture/component-contract-matrix.md): maturity policy and current baseline.
- [Aurora Glass repairs](docs/architecture/material-standards.md#glass-repair-guardrails): required reading before changing Glass.

The root file carries global constraints. Directory-specific structure and extension rules live in the nearest `AGENTS.md`; read the one for the area being changed.

## Repository layout

```text
apps/playground/            Design Lab, frame route, contract lab and browser fixtures
contracts/                  component matrix, framework parity and component-request records
  component-requests/       open requests; archive/ keeps closed history
docs/                       current-state architecture, contracts, releases and testing
  architecture/             workspace architecture and public interaction contracts
  releases/                 release process, migration guides and release records
  testing/                  test layers and browser spec registry
packages/                   published packages and their source/tests
  tokens/                   CSS Variables, semantic roles and TypeScript name maps
  tailwind/                 Tailwind v4 theme, component selectors and prose styles
  motion/                   Motion roles, presence and layout-width primitives
  overlay-runtime/          top-layer positioning, tracking and light dismiss
  glass-runtime/            optional Aurora Glass edge renderer
  vue/                      Vue 3 SFC adapters
  react/                    React 19 adapters
  giscus-theme/             standalone Giscus theme CSS
scripts/                    gates, release tooling, request CLI, dev loop and sync
  check.ts                  sequential gate runner
  gates/                    static repository contract checks
  release/                  Changeset, registry and package verification
  requests/                 component request CLI and intake
  dev/                      development loop and Tailwind CLI lookup
  sync/                     local consumer synchronization
tests/e2e/                  Playwright specs organised by responsibility domain
tests/optics/               SwiftShader Aurora Glass optical diagnostics
tests/support/              shared browser and optical fixtures
.agents/notes/              dated audits, acceptance runs and implementation plans
.changeset/                 pending release notes
.github/                    CI workflows, CI scope scripts and issue form
```

Extension rules: a new public component enters Tokens, Tailwind, both adapters, contracts, tests and the Design Lab. A new check enters the owning `scripts/` domain directory and is wired into `scripts/check.ts`. A new browser area enters `tests/e2e/` and the [test registry](docs/testing/README.md). A new current-state document is registered in [docs/AGENTS.md](docs/AGENTS.md) before it is written. Process material enters `.agents/notes/`.

Directory guidance: [scripts](scripts/AGENTS.md), [packages](packages/AGENTS.md), [apps](apps/AGENTS.md), [tests](tests/AGENTS.md), [contracts](contracts/AGENTS.md).

## Component requests

For work originating in consumer projects (Neoverse, Neoverse-Docs, Neoverse-Slides, etc.), consult [the request workflow](docs/architecture/component-requests.md).

- New component needs, reusable behavior gaps, and missing Vue/React adapters are tracked as individual `contracts/component-requests/CR-*.json` records, not as speculative rows in `contracts/component-matrix.json`.
- Closed requests move to `contracts/component-requests/archive/` automatically; use `bun run requests list` for open work and `bun run requests list --status delivered` or `--status rejected` for historical evidence. Do not reimplement archived requests.
- Start with `bun run requests agent --queue triage` for unreviewed reports or `bun run requests agent --queue implementation` for accepted work. The output is machine-readable JSON with consumer source locations and acceptance criteria.
- **Preferred local intake from any consumer repository:** call `bun <NEOVERSE_UI_ROOT>/scripts/requests/component-requests.ts submit --file <local JSON>` from the consumer's working directory. This writes directly to the UI repository, with schema validation, idempotency and cross-process locking.
- This public `submit` entrypoint records a `reported` need only; it cannot authorize implementation or change maturity. Avoid direct editing of `CR-*.json` from consumer agents.
- GitHub Component Request issues are an optional remote fallback. Do not assume automatic synchronization.
- A request does not grant execution permission. Implement only tasks explicitly authorized in the current conversation; do not auto-commit or publish.
- Do not move a request to `delivered` without code/test/consumer evidence in the resolution; a playground example alone does not establish real consumer validation.

## Running entry

Use Bun 1.4 and the existing `bun.lock`; do not introduce another package manager. Commands come from `package.json`.

| Command | Purpose |
| --- | --- |
| `bun install` | Install the workspace |
| `bun run dev` | Build once, then run Vite hot updates and the CSS watcher |
| `bun run build` | Build every package and the Playground in dependency order |
| `bun run check` | Run all quality gates sequentially and print a pass/fail summary |
| `bun run test` | Workspace unit tests plus repository tooling tests |
| `bun run test:e2e` | Rebuild, then run Chromium desktop and touch browser specs |
| `bun run typecheck` | Build declarations, then typecheck every workspace |
| `bun run release:check` | Full release-candidate gate |

The Playground uses `PORT` (default 3000) and moves to the next available port. Playwright uses `NEOVERSE_UI_PLAYWRIGHT_PORT` (default 3200) and reuses an existing server. Reuse a running dev server instead of starting a second instance; report an unhealthy server rather than taking it over. Keep scripts compatible with PowerShell and Linux/WSL: do not hardcode drive letters, separators or Unix-only commands.

## Change workflow

1. Read this file, the nearest directory `AGENTS.md`, and the owning documents for the area. Check the branch and `git status --short`; preserve uncommitted and untracked work.
2. Locate the real call chain and separate consumer-project problems from shared-library problems. State the root cause, scope, dependencies and verification before editing.
3. Make the smallest change that reuses existing patterns. No second state source, duplicate component inventory, needless abstraction, patch CSS, forced repaint or unjustified dependency.
4. Run the narrowest checks that exercise the change, review the diff, and update contracts, tests, Design Lab and documentation together. Never claim a fix without an observed result; report skipped or unverified checks.
5. Do not hide defects with suppressions, `any`, skipped tests or wider ignores. Do not reset, overwrite or clean user changes. Commit, push, rebase or publish only when explicitly requested.

## Conventions

- **Toolchain:** Bun workspace, ESM-only packages, strict TypeScript, Biome formatting and lint, Tailwind CSS 4, Vue 3.5+, React 19. Published packages emit declarations and source maps; CSS packages publish generated `dist` files.
- **Package boundaries:** `tokens` feeds `tailwind` and `motion`; `overlay-runtime` feeds `vue` and `react`; `tailwind` + `motion` + `overlay-runtime` feed both adapters; `playground` consumes all. `glass-runtime` is optional enhancement. Public package dependencies use explicit SemVer ranges; local Bun links must not leak into published manifests.
- **Shared contract:** Vue and React expose the same public components and shared option, item and literal structures. Parity lives in `contracts/framework-parity.json`, maturity in `contracts/component-matrix.json`, and both are checked by `scripts/gates/check-framework-parity.ts` and `scripts/gates/check-component-contracts.ts`. A Playground specimen is evidence but never promotes maturity by itself.
- **Material:** Solid, Frosted, and Aurora Glass (`subtle`, `elevated`, `immersive` tiers) are three equal shared materials resolved through `data-neoverse-material` scopes and `SurfaceRole` recipes. Material values belong to Tokens; Frosted uses native CSS `backdrop-filter` with no JS runtime; consumers select public presets and sizes. Do not introduce application-specific components, duplicate material CSS or a second token layer in consumers.
- **Glass repairs:** Follow the [Glass repair guardrails](docs/architecture/material-standards.md#glass-repair-guardrails). Do not switch the default renderer to full-surface SVG backdrop displacement, add backdrop capture/reconstruction layers, or replace the tier-owned body blur to repair edge appearance. These approaches have repeatedly caused severe stutter, lost blur, or missing edges. Keep the entire edge visible and fine; emphasize the upper-left and lower-right without removing the other sides or corners. Verify backdrop-dependent color, actual blur, edge continuity and performance together, and do not describe a theme-colored overlay as true spatial refraction.
- **Accessibility and density:** Keep native semantics, visible focus, labels, contrast and keyboard paths. Shared controls keep compact painted dimensions on every viewport and expand touch hit areas through `@media (pointer: coarse)`; do not add mobile-only button variants. Reduced motion, reduced transparency and forced colors must remain usable.
- **Releases:** Every user-visible change carries a Changeset targeting only affected packages. Versioning and publishing are approved operations, not part of normal work. Follow [Releasing Neoverse UI](docs/releases/releasing.md).

## Evidence

| Fact | Source |
| --- | --- |
| Commands, versions and dependencies | `package.json`, package manifests, `bun.lock` |
| Workspace boundaries and public inventory | [Architecture](docs/architecture/README.md), `packages/*/src`, `contracts/*.json` |
| Component maturity and evidence | `contracts/component-matrix.json`, [component matrix](docs/architecture/component-contract-matrix.md) |
| Vue / React parity | `contracts/framework-parity.json`, `scripts/gates/check-framework-parity.ts` |
| Material values and optical policy | `packages/tokens/src`, [Material standards](docs/architecture/material-standards.md) |
| Test scope, spec ownership and metadata evidence | [Testing](docs/testing/README.md), `playwright*.config.ts`, `scripts/gates/check-test-registry.ts` |
| Scale limits and exceptions | `scripts/gates/quality-budgets.json`, `scripts/gates/check-budgets.ts` |
| Release state and automation | [Releasing](docs/releases/releasing.md), `docs/releases/release-*.md`, `.github/workflows/` |

Source, configuration and current user decisions override stale documentation. Verify a contradiction before correcting either side.

## Verification

| Change | Run |
| --- | --- |
| Documentation only | `bun run check:docs`, `bun run check:budgets`, `bun run lint:language` |
| Tokens, Tailwind, Motion, runtime or adapter source | `bun run test`, `bun run typecheck`, relevant `tests/e2e/` spec |
| Public component or contract | component matrix, framework parity, unit tests, Design Lab, `tests/e2e/parity/parity.spec.ts` |
| Browser interaction or layout | `bun run test:e2e`; cross-browser suite for engine-sensitive behavior |
| Aurora Glass | material checks, `tests/e2e/materials/glass-runtime.spec.ts`, optical suite when rendering changes, manual optical acceptance |
| Release tooling or manifest | `bun run test:release-tools`, `bun run verify:packages`, `bun run release:check` |

Run the narrowest row that covers the change. A green unit test does not substitute for browser or consumer evidence; a Playground example does not substitute for consumer validation.

## Documentation and delivery

- Structure, status metadata and writing rules are owned by [docs/AGENTS.md](docs/AGENTS.md). Language, naming and terminology are owned by [docs/code-style.md](docs/code-style.md).
- English documents keep English prose. Chinese translations live in [docs/zh-CN](docs/zh-CN/README.md) and paired `README.zh-CN.md` files, are registered in `docs/translations.json`, and carry the source SHA-256. Edit the English source first, then update the translation and hash in the same change; `bun run check:docs` rejects stale or mixed-language documents.
- Current state lives in `docs/`; dated audits, acceptance runs and plans live in `.agents/notes/` with the date in the file name.
- Update the owning document, the component matrix, parity, Design Lab and tests in the same change as the behavior. Do not add a document that only repeats an existing owner.
- Before yielding, report the change, files, actual verification results, failures, skipped checks and remaining risk.
- Commit only when explicitly requested, using Conventional Commits and one coherent scope per commit. Do not mix unrelated cleanup into a behavior change.