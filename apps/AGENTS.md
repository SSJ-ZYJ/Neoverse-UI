# apps structure

Read this file before changing the Design Lab. Global constraints are in [AGENTS.md](../AGENTS.md); browser test ownership is in [docs/testing/README.md](../docs/testing/README.md).

```text
apps/playground/
  src/index.ts              Bun.serve shell, /frame document, health endpoint, port selection
  src/main.ts               Vite browser entry: Vue app, shell styles, Glass mount
  src/App.vue               selects the shell or the isolated frame
  src/LabWorkspace.vue      shell route, preferences, drawer and scroll coordination
  src/Lab{Toolbar,Explorer,Stage,Inspector}.vue  persistent chrome and preview regions
  src/modules/              one module per Design Lab area; not public API
  src/previews/              focused renderers and scenes shared with QA galleries
  src/contract-lab.ts       maturity, parity and runtime status derived from contracts
  src/theme-runtime.ts      framework-neutral theme resolution and persistence
  src/theme-state.ts        Vue binding over the shared theme runtime
  src/react-fixture.tsx     React runtime fixture and contract-lab entry
  src/lab-*.ts              specimen catalogue, module metadata and content
  src/lab-specimens/         editable specimen definitions grouped by component family
  src/playground-*.ts       shell preferences, content and shared types
  src/*.vue                 shell, specimen and fixture components
  src/styles/               shell CSS and Playground-only token overrides
  src/assets/               wordmark and site icon
  vite.config.ts            browser bundles for the shell and React fixture
```

## Responsibilities

- The Playground is a consumer and a contract host. It demonstrates components; it is not a second component library and its helpers are not public API.
- Module specimens select material through public `UiSurface`, `UiCard` or `UiControlSurface` props. Do not attach Aurora Glass implementation classes to specimens.
- `contract-lab.ts` derives component maturity, visual status, runtime validation and framework parity from `contracts/`. Do not maintain a handwritten component inventory.
- `theme-runtime.ts` is the single theme resolver for `/`, `/frame` and `/react-fixture`. `theme-state.ts` only mirrors the resolved value into Vue state.
- Interaction specimens expose stable `data-contract-state` and `data-specimen-state-row` markers for automation. These attributes are test instrumentation, not package API.
- Specimens render at the normal consumer root size and without extra CSS zoom. Component `scale` or `size` props are opt-in and must be visible in the example.

## Rules

- Commands come from `apps/playground/package.json`. The root `bun run dev` sequences build, server and watchers; do not start a second server on an occupied port.
- The shell uses `PORT` (default 3000) and selects the next available port. Playwright starts its own server on `NEOVERSE_UI_PLAYWRIGHT_PORT` (default 3200) or reuses an existing one.
- Register each focused renderer on its existing `labSpecimens` entry in `lab-modules.ts`. Keep complete galleries and stable fixture anchors in `modules/`; the Stage does not mount a module to render a specimen.
- Shell CSS belongs in `src/styles/`; shared component styling belongs in `packages/tailwind`. Do not fix a shared component from the shell.
- Browser checks assert observable behavior and deterministic geometry or contrast contracts. Optical acceptance remains manual against [Material standards](../docs/architecture/material-standards.md).