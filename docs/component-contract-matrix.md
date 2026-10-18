# Component Contract Matrix

The component matrix is the maturity baseline for Neoverse-UI 0.3.x. The machine-readable source of truth lives in `contracts/component-matrix.json`; this document explains the policy and presents the current state.

## Contract pipeline

Every public component must move through the same contract pipeline:

```text
Token -> CSS Contract -> Framework Adapter -> Unit/Contract Test -> React Runtime -> Visual Validation -> Consumer Validation
```

A Playground specimen is useful evidence, but it does not by itself make a component Stable.

## Tracks

- **Canonical Shared**: core framework-shared components. Vue and React adapters are both required and must stay contract-compatible.
- **Consumer Driven**: framework adapters are added when a real consumer needs them. Vue/React component-count symmetry is not a release requirement.

## Maturity

- **Stable**: required adapters are stable, unit coverage exists, the component is covered by release visual checks, and at least one real consumer validates the contract.
- **Consumer Validation**: the implementation is usable and tested, but real consumer validation or release-gate visual coverage is still incomplete.
- **Partial**: one or more required contract layers are incomplete.

Column values:

- **Tokens / CSS / Vue / React / Unit**: `Stable`, `Partial`, or `—`.
- **Runtime**: `Validated` means the React adapter is exercised in the real browser runtime fixture; `Pending` means the React adapter exists but still relies on static/unit coverage; `—` means there is no React adapter.
- **Visual**: `Release` means covered by Playwright release gates; `Playground` means represented in the Design Lab but not yet a release-gate visual contract.
- **Consumer**: `Validated` means a real Neoverse consumer exercises the API; `Pending` means validation is still fixture/Playground-only.

## Current matrix

| Component | Track | Maturity | Tokens | CSS | Vue | React | Unit | Runtime | Visual | Consumer |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `UiButton` | Canonical Shared | Stable | Stable | Stable | Stable | Stable | Stable | Validated | Release | Validated |
| `UiIconButton` | Canonical Shared | Stable | Stable | Stable | Stable | Stable | Stable | Validated | Release | Validated |
| `UiAction` | Canonical Shared | Stable | Stable | Stable | Stable | Stable | Stable | Validated | Release | Validated |
| `UiSurface` | Canonical Shared | Stable | Stable | Stable | Stable | Stable | Stable | Validated | Release | Validated |
| `UiCard` | Canonical Shared | Stable | Stable | Stable | Stable | Stable | Stable | Validated | Release | Validated |
| `UiCheckbox` | Canonical Shared | Consumer Validation | Stable | Stable | Stable | Stable | Stable | Validated | Playground | Pending |
| `UiRadioGroup` | Canonical Shared | Consumer Validation | Stable | Stable | Stable | Stable | Stable | Validated | Playground | Pending |
| `UiSwitch` | Canonical Shared | Consumer Validation | Stable | Stable | Stable | Stable | Stable | Validated | Playground | Pending |
| `UiField` | Canonical Shared | Consumer Validation | Stable | Stable | Stable | Stable | Stable | Validated | Playground | Pending |
| `UiInput` | Canonical Shared | Consumer Validation | Stable | Stable | Stable | Stable | Stable | Validated | Release | Pending |
| `UiTextarea` | Canonical Shared | Consumer Validation | Stable | Stable | Stable | Stable | Stable | Validated | Release | Pending |
| `UiSelect` | Canonical Shared | Consumer Validation | Stable | Stable | Stable | Stable | Stable | Validated | Release | Pending |
| `UiTable` | Canonical Shared | Consumer Validation | Stable | Stable | Stable | Stable | Stable | Validated | Release | Pending |
| `UiDisclosure` | Canonical Shared | Consumer Validation | Stable | Stable | Stable | Stable | Stable | Validated | Release | Pending |
| `UiPresence` | Canonical Shared | Consumer Validation | Stable | Stable | Stable | Stable | Stable | Validated | Playground | Pending |
| `UiPopover` | Canonical Shared | Consumer Validation | Stable | Stable | Stable | Stable | Stable | Validated | Playground | Pending |
| `UiDropdownMenu` | Canonical Shared | Consumer Validation | Stable | Stable | Stable | Stable | Stable | Validated | Playground | Pending |
| `UiBreadcrumb` | Consumer Driven | Consumer Validation | Stable | Stable | Stable | Stable | Stable | Validated | Release | Pending |
| `UiControlSurface` | Consumer Driven | Stable | Stable | Stable | Stable | — | Stable | — | Release | Validated |
| `UiDock` | Consumer Driven | Stable | Stable | Stable | Stable | Stable | Stable | Validated | Release | Validated |
| `UiNavigationItem` | Consumer Driven | Stable | Stable | Stable | Stable | — | Stable | — | Release | Validated |
| `UiSegmentedControl` | Consumer Driven | Stable | Stable | Stable | Stable | — | Stable | — | Release | Validated |
| `UiBadge` | Consumer Driven | Stable | Stable | Stable | Stable | — | Stable | — | Release | Validated |
| `UiStatusIndicator` | Consumer Driven | Stable | Stable | Stable | Stable | — | Stable | — | Release | Validated |
| `UiNotice` | Consumer Driven | Stable | Stable | Stable | Stable | Stable | Stable | Validated | Release | Validated |
| `UiTooltipSurface` | Consumer Driven | Consumer Validation | Stable | Stable | Stable | — | Stable | — | Release | Pending |
| `UiSkeleton` | Consumer Driven | Stable | Stable | Stable | Stable | — | Stable | — | Release | Validated |
| `UiScrollbar` | Consumer Driven | Stable | Stable | Stable | Stable | — | Stable | — | Release | Validated |
| `UiTerminalPrompt` | Consumer Driven | Stable | Stable | Stable | Stable | — | Stable | — | Release | Validated |
| `UiTerminalSurface` | Consumer Driven | Stable | Stable | Stable | Stable | — | Stable | — | Release | Validated |
| `UiTerminalLine` | Consumer Driven | Stable | Stable | Stable | Stable | — | Stable | — | Release | Validated |
| `UiTerminalTranscript` | Consumer Driven | Stable | Stable | Stable | Stable | — | Stable | — | Release | Validated |
| `UiStatCard` | Consumer Driven | Stable | Stable | Stable | Stable | — | Stable | — | Release | Validated |
| `UiTimeline` | Consumer Driven | Stable | Stable | Stable | Stable | — | Stable | — | Release | Validated |
| `UiStepFlow` | Consumer Driven | Stable | Stable | Stable | Stable | — | Stable | — | Release | Validated |

## Change policy

`UiInput type="number"` includes shared token-driven increment/decrement buttons in Vue and React. `tests/visual/number-input.spec.ts` covers the Design Lab material controls and React runtime fixture at desktop/mobile sizes, including both themes for the material controls. This is Playground/runtime evidence; real consumer validation remains pending.

A new public component must be added to the matrix in the same change that exports it. Canonical Shared components cannot be marked complete while either Vue or React is missing, and every Canonical Shared React adapter must appear in the browser runtime fixture. A component cannot be promoted to Stable without release visual coverage and real consumer validation.

`bun run check:contracts` validates matrix schema invariants, public Vue/React export coverage, Canonical Shared parity, React runtime fixture markers, Stable maturity requirements, and the presence of a documentation row for every registered component.


Material tiers, customization, component audit and hover/press policy: [Material standards](material-standards.md).
