# Migrating from 0.2.x to the published 0.3.0 baseline

The 0.3.0 baseline was published on 2026-10-21; the official Registry was rechecked on 2026-10-25. The exact versions below are available on npm; later source-only React parity and `UiTerminalEcho` additions are outside this release. See [release evidence](release-0.3.0.md). The previous [0.1.x → 0.2.0 guide](migration-0.2.0.md) remains applicable to older consumers.

## Package coordination and availability

Packages have independent versions: `.changeset/config.json` has no fixed or linked version group. The merged version plan is:

| Package | Release version | Consumer impact |
| --- | --- | --- |
| `@neoverse-ui/tokens` | 0.3.0 | Form/overlay and terminal roles; chrome removal; shared visual and sizing updates |
| `@neoverse-ui/tailwind` | 0.3.0 | Matching compiled CSS and component styles |
| `@neoverse-ui/vue` | 0.3.0 | Vue 3.5 requirement, forms/overlays, terminal and presentation adapters |
| `@neoverse-ui/react` | 0.3.0 | Shared form/overlay contracts and surface cutover |
| `@neoverse-ui/overlay-runtime` | 0.3.0 | Shared anchored-overlay runtime |
| `@neoverse-ui/glass-runtime` | 0.2.1 | Live backdrop edges, optional native backend, recovery and cleanup |
| `@neoverse-ui/motion` | 0.2.1 | Vue list-reorder FLIP motion fix |
| `@neoverse-ui/giscus-theme` | 0.2.0 (unchanged) | No new publication required |

Do not assign `0.3.0` to every package. The versioned manifests already contain the coordinated internal ranges. A `^0.2.0` range does not admit `0.3.x`, so changing only a top-level adapter while retaining old overrides is not a coordinated upgrade. See [the release notes](release-0.3.0.md) and run `bun run verify:published` after publication to verify the exact registry versions and installation.

Vue and React now depend on Overlay Runtime alongside Motion and Tailwind; Tailwind brings Tokens and Motion. Ordinary adapter consumers do not need to import the runtime themselves. Direct runtime consumers should use its [public guide](../packages/overlay-runtime/README.md).

**Publication evidence:** All eight versions above are present on the official Registry, and [Release 39613361164](https://github.com/SSJ-ZYJ/Neoverse-UI/actions/runs/39613361164) completed publication and Registry installation checks. For subsequent releases, follow [release preparation and publishing](releasing.md): `bun run check:release-registry` checks package-name availability only; it does not establish current Trusted Publisher configuration or authorization.

## Required source cutover

### Removed chrome surface

Replace the removed public surface and CSS class in Vue, React, and direct CSS compositions:

| Removed | Canonical alternative |
| --- | --- |
| `surface="chrome"` / React `surface="chrome"` | `surface="glass-subtle"` for an explicit subtle Glass plane |
| `ui-surface-chrome` | `material-glass-subtle` |
| Chrome-specific material/effect tokens and TypeScript token exports | Shared Glass material tokens and control-surface geometry tokens |

No compatibility aliases are retained. Remove consumer chrome recipes rather than recreating the deleted material under a local alias. Use framework `surface` props where possible; see [material standards](material-standards.md).

The earlier `remove-chrome-surface` Changeset described a subtle Dock default, but the later `dock-elevated-glass` change and both current adapters set **`UiDock`'s default to `glass-elevated`**. Choose `glass-subtle` explicitly when that lighter plane is intended. Dock grouping and embedded control geometry remain shared responsibilities, not a reason to restore chrome.

### Framework requirements and styles

- Vue now requires **`>=3.5.0 <4.0.0`**. Upgrade the consumer's Vue runtime/tooling coherently before adopting the new adapter: Field and choice controls use Vue's SSR-stable `useId`.
- React's 0.3.0 manifest requires **`>=19.0.0 <20.0.0`**. That release does not include the later source-only React terminal/presentation adapters; see [current framework parity](framework-parity.md) for the unreleased additions.
- Keep adapter code, Tokens, and compiled consumer CSS from the same approved release plan. Consumers without a Tailwind build can use the adapter `index.css` entry; do not retain an old copied vendor stylesheet after upgrading JS. Setup examples live in the [Vue](../packages/vue/README.md) and [React](../packages/react/README.md) guides.

## Forms and anchored overlays

`UiCheckbox`, `UiRadioGroup`, `UiSwitch`, `UiField`, `UiPopover`, and `UiDropdownMenu` have shared Vue/React contracts. Adopt the canonical controls instead of carrying local substitutes, but keep application validation and state in the consumer.

For Field compositions, bind Vue's scoped-slot `controlAttrs` with `v-bind`, or spread React's function-child `controlAttrs` onto the actual input. Supply `control-id` / `controlId` for label association. The bindings include a supplied control ID, descriptions/messages that are currently rendered, and enabled native `required`/`disabled` flags. Ordinary children are not cloned or automatically wired. Merge extra consumer `aria-describedby` IDs explicitly and pass the control's `validation` separately. Field does not validate values or reset controlled state.

Preserve native names and values for submission. Vue `v-model` and React controlled state must be reset by the application; React uncontrolled native choice inputs retain browser reset behavior. `readonly` / `readOnly` remains focusable and submittable. Use the existing [form-control contract](form-control-contract.md) and package examples for binding syntax and validation states rather than introducing a wrapper compatibility API.

Select now shares Overlay Runtime positioning/tracking with Popover and DropdownMenu. Remove duplicate consumer positioning/dismiss implementations when switching to these adapters. Controlled `open` remains authoritative: dismiss requests must update consumer state if closure is accepted; a parent that retains `open=true` keeps the panel open. Verify Escape, outside activation, trigger focus restoration, keyboard menu navigation, scrolling/resizing, and the fixed-position fallback without the native Popover API. Popover is non-modal and does not trap focus; it is not a modal-dialog replacement. See the [overlay contract](overlay-contract.md) for the precise behavior and ownership boundaries.

## Terminal and presentation consumers

The terminal primitives and semantic roles are included in Vue 0.3.0. It exports `UiTerminalSurface`, `UiTerminalLine`, `UiTerminalTranscript`, and `UiTerminalPrompt`; use `cssVariables.components.terminal` and the shared `--neoverse-terminal-*` roles rather than a consumer-owned brand palette. Terminal rendering is presentation, not a shell emulator or command runtime.

For shell-style command entry previously built around `UiInput`, cut over to `UiTerminalPrompt`: the editor is a borderless native input within the outer terminal Glass surface. `UiInput` remains the canonical form input, not a terminal compatibility wrapper. Command execution, Enter handling, and history remain consumer-owned. React **0.3.0** does not export these terminal adapters; the current source adds them separately. Follow [terminal composition](terminal-composition.md) for current examples, transcript following, theme roles, and the Maple font fallback contract; fonts are not bundled by this addition.

**XCA acceptance:** [CR-20261010-2A6D0E6E](../contracts/component-requests/archive/CR-20261010-2A6D0E6E.json) was delivered and archived on 2026-10-23. Published Tokens 0.3.0 contains the variables; the user confirmed local/npm Token parity and accepted XCA's local `file:` consumer evidence without requiring a dependency-source switch. See the [dated acceptance](acceptance-2026-10-20-terminal-tokens.md); do not reopen or reimplement this request.

Vue 0.3.0 also adds `UiStatCard`, `UiTimeline`, and `UiStepFlow`. Their [archived delivery resolutions](../contracts/component-requests/archive/) record completed release visual and real Slides consumer validation on 2026-10-13; the component matrix records them as Stable. React adapters for these components exist in later source, not in React 0.3.0; Vue consumer evidence does not establish React consumer validation.

## Practical upgrade and verification order

1. Inventory directly consumed packages, lockfile versions, root overrides, local `file:`/link dependencies, and copied CSS. Identify chrome references, shell-style `UiInput` compositions, and local form/overlay substitutes.
2. Prepare the source cutover and framework prerequisites against a deliberately synchronized local workspace where permitted. Follow [consumer sizing and local synchronization](consumer-sizing.md) for local artifacts; rebuilding this repository alone does not refresh stale installed copies. XCA's accepted local dependency mode need not be changed to satisfy its archived Token request.
3. Use the coordinated published baseline above for a 0.2.x → 0.3.0 migration. For later source-only APIs, release owners must review their own Changesets plan, complete gates, and authorize versioning/publication; this guide performs none of those operations.
4. Upgrade all directly consumed UI packages to the approved coordinated versions, resolve transitive versions and overrides, refresh the lockfile, and regenerate copied/vendor CSS. Do not use one assumed version for every package or manually force unpublished transitive dependencies.
5. Run the consumer's typecheck and production build. Check SSR/hydration IDs where applicable, Field label/description/message associations, required/disabled/readonly submission, controlled and uncontrolled resets, and overlay behavior on native and fallback paths.
6. Review real pages in light/dark/system themes and at desktop/mobile widths with the normal root font size. Inspect Dock geometry/default material, terminal contrast and scrollback, forms, Badge/Skeleton/Tooltip material changes, reduced motion/transparency, and forced-colors behavior where supported. Shared sizing expectations and existing consumer checks are linked in [consumer sizing](consumer-sizing.md).
7. Record actual consumer evidence before closing a request or promoting maturity. A passing Playground specimen, a local sync, or this migration guide alone is not release or consumer acceptance evidence.

Do not add shims for removed APIs. Report a missing canonical capability through the existing component-request workflow instead of silently maintaining a second design contract.
