# apps structure

Read this file before changing the Design Lab. Global constraints are in [AGENTS.md](../AGENTS.md); browser test ownership is in [docs/testing/README.md](../docs/testing/README.md).

```text
apps/playground/
  src/index.ts              Bun.serve shell, /frame document, health endpoint, port selection
  src/main.ts               Vite browser entry: Vue app, shell styles, Glass mount
  src/react-fixture.tsx     React runtime fixture entry
  src/app/                  App root, document shell, pre-paint startup, lazy loading, asset wait
  src/runtime/              framework-neutral theme, material, glass, preferences and scroll engines
  src/content/              localized bilingual copy and locale resolution
  src/features/
    workspace/              shell layout, toolbar, FPS indicator, board and overview hero
    explorer/               navigation tree, disclosure list and bilingual labels
    inspector/              specimen Inspector panel and control fields
    stage/                  preview stage, zoom/pan, stage background and section chrome
    specimens/              declarative specimen/composition session engine and editable definitions
    catalogue/              module and specimen registry metadata
  src/catalogue/            domain-grouped QA galleries and focused previews
    foundations/            colors, typography, prose and token tables
    layout/                 spacing, radius, border, density and shadow
    materials/              Solid, Frosted and Aurora Glass matrices, comparisons, cards and surfaces
    motion/                 motion tokens, presence, disclosure, transitions and page choreography
    controls/               buttons, actions, segmented control, navigation, breadcrumb and dock
    forms/                  inputs, selects, choices and form contract fixtures
    overlays/               dialog, drawer, popover, dropdown, context menu and toast/tooltip
    feedback/               badges, status indicators, notices and skeletons
    display/                data display, tables, tabs, empty state and scrollbar
    terminal/               terminal composition and transcript scenes
    compositions/           shared workspace scenes, contract lab, parity and Giscus preview
  src/fixtures/             Vue/React text-control and React runtime contract fixture sections
  src/tests/                Playground unit tests (covered by bun test src/tests)
  src/styles/               shell CSS and Playground-only token overrides
  src/assets/               wordmark and site icon
  vite.config.ts            development routes, hot updates and production browser bundles
```

## Responsibilities

- The Playground is a consumer and a contract host. It demonstrates components; it is not a second component library and its helpers are not public API.
- Module specimens select material through public `UiSurface`, `UiCard` or `UiControlSurface` props, or through `data-neoverse-material` scopes. Do not attach Aurora Glass implementation classes directly to specimens.
- `catalogue/compositions/contract-lab.ts` derives component maturity, visual status, runtime validation and framework parity from `contracts/`. Do not maintain a handwritten component inventory.
- `runtime/theme-runtime.ts` and `runtime/material-runtime.ts` are the single theme and material resolvers for `/`, `/frame` and `/react-fixture`. `runtime/preference-segments.ts` derives material options and names from `materialCatalog` in `@neoverse-ui/tokens`.
- Interaction specimens expose stable `data-contract-state` and `data-specimen-state-row` markers for automation. These attributes are test instrumentation, not package API.
- Specimens render at the normal consumer root size and without extra CSS zoom. Component `scale` or `size` props are opt-in and must be visible in the example.

## Rules

- Commands come from `apps/playground/package.json`. The root `bun run dev` builds and starts the Vite dev server and CSS watcher; do not start a second server on an occupied port.
- The shell uses `PORT` (default 3000) and selects the next available port. Playwright starts its own server on `NEOVERSE_UI_PLAYWRIGHT_PORT` (default 3200) or reuses an existing one.
- Register each focused renderer on its existing `labSpecimens` entry in `features/catalogue/lab-modules.ts`. Keep complete galleries and stable fixture anchors in `catalogue/<domain>/`; the Stage does not mount a module to render a specimen.
- Keep each directory under `src/` within the scale budget (15 soft / 25 hard) and avoid generic bucket names (`utils`, `helpers`, `common`, `misc`).
- Shell CSS belongs in `src/styles/`; shared component styling belongs in `packages/tailwind`. Do not fix a shared component from the shell.
- Browser checks assert observable behavior and deterministic geometry or contrast contracts. Optical acceptance remains manual against [Material standards](../docs/architecture/material-standards.md).
