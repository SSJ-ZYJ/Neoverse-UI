# packages structure

Read this file before changing a published package. Global constraints are in [AGENTS.md](../AGENTS.md); architecture and contract ownership are in [docs/architecture/README.md](../docs/architecture/README.md).

```text
packages/
  tokens/           framework-agnostic CSS Variables, semantic roles and name maps
    src/foundation/ primitives, geometry, typography, layout, motion, fonts and base TS maps
    src/semantic/   semantic roles, effects and surface/control effect maps
    src/materials/  Glass, Solid and Frosted token sheets and surface preset contracts
    src/components/ domain-grouped component CSS and TS token maps
    src/themes/     light and canonical dark mappings
    src/tests/      token contract and variable tests
  tailwind/         Tailwind v4 theme, material recipes, component selectors and prose styles
    src/materials/  shared scope, Solid and Frosted surface recipes
    src/components/ domain-grouped component stylesheets (controls, forms, surfaces, navigation, overlays, feedback, display, terminal, prose)
  motion/           motion roles, presence and layout-width primitives
  overlay-runtime/  top-layer positioning, tracking and light dismiss
  glass-runtime/    optional Aurora Glass edge renderer with WebGL and CSS fallback (`src/rendering/`, `src/tests/`)
  vue/              Vue 3 SFC adapters (`src/components/<category>/`, `src/tests/`)
  react/            React 19 adapters (`src/components/<category>/`, `src/tests/`)
  giscus-theme/     standalone light/dark Giscus theme CSS
```

Each package keeps source in `src/`, unit tests under `src/tests/` (or beside source in small runtime packages), generated output in `dist/`, and public guidance in its `README.md`. `package.json` and the package README own commands, entries and consumer examples.

## Boundaries

| Package | May depend on | Owns |
| --- | --- | --- |
| `tokens` | nothing in the workspace | CSS Variable values, semantic roles, token-name maps |
| `tailwind` | `tokens`, `motion` | Tailwind theme, component selectors, prose and compiled CSS entries |
| `motion` | nothing in the workspace | Motion roles, presence, page choreography, layout-width primitives |
| `overlay-runtime` | nothing in the workspace | Anchored placement, tracking, viewport flipping and light dismiss |
| `glass-runtime` | nothing in the workspace | Optional edge rendering and its lifecycle |
| `vue` | `tokens`, `tailwind`, `motion`, `overlay-runtime` | Vue adapters and native binding semantics |
| `react` | `tokens`, `tailwind`, `motion`, `overlay-runtime` | React adapters, refs and native binding semantics |
| `giscus-theme` | `tokens` output only | Standalone widget theme CSS |

No package imports from `apps/playground` or `tests/`. Vue and React do not import each other's source; shared behavior belongs in a framework-agnostic package or in Tailwind selectors.

## Rules

- Public exports are additive unless an approved breaking release says otherwise. Remove obsolete exports, aliases and shims in the same cutover instead of keeping both paths.
- Keep each package's TypeScript `src/index` re-export-only. Add one component per file under the owning Vue or React `src/components/<category>/` directory; follow the [adapter source layout](../docs/architecture/README.md#adapter-source-layout).
- A new public component changes Tokens, Tailwind, both adapters, `contracts/framework-parity.json`, `contracts/component-matrix.json`, unit and browser tests, the Design Lab and the owning document together.
- Component CSS belongs to `packages/tailwind/src/components/<domain>/*.css` and shared material surface recipes to `packages/tailwind/src/materials/*.css`; adapters compose selectors and never hard-code material values. Material values belong to `packages/tokens`. Do not maintain separate Solid, Frosted and Glass copies of component stylesheets.
- A package README describes current consumer behavior and links to the owning document instead of restating the contract.
- Build output under `dist/` is generated. Do not hand-edit it, copy it between packages or commit local build artefacts.
- Each user-visible package change needs a Changeset for every affected published package. Do not add `apps/playground` to a Changeset.
- Run the package's own `bun run test` and `typecheck` before repository-level checks. Browser behavior is verified through [tests](../tests/AGENTS.md), not a package-local DOM test alone.