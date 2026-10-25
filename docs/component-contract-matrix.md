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
- **Consumer Driven**: framework adapters are added when a real consumer needs them. Both adapters are now available for the current public component set; consumer-driven status still records the origin of these components.

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
| `UiField` | Canonical Shared | Consumer Validation | Stable | Stable | Stable | Stable | Stable | Validated | Playground | Validated |
| `UiInput` | Canonical Shared | Consumer Validation | Stable | Stable | Stable | Stable | Stable | Validated | Release | Validated |
| `UiTextarea` | Canonical Shared | Consumer Validation | Stable | Stable | Stable | Stable | Stable | Validated | Release | Pending |
| `UiSelect` | Canonical Shared | Consumer Validation | Stable | Stable | Stable | Stable | Stable | Validated | Release | Validated |
| `UiTable` | Canonical Shared | Consumer Validation | Stable | Stable | Stable | Stable | Stable | Validated | Release | Pending |
| `UiDisclosure` | Canonical Shared | Consumer Validation | Stable | Stable | Stable | Stable | Stable | Validated | Release | Pending |
| `UiPresence` | Canonical Shared | Consumer Validation | Stable | Stable | Stable | Stable | Stable | Validated | Playground | Pending |
| `UiPopover` | Canonical Shared | Consumer Validation | Stable | Stable | Stable | Stable | Stable | Validated | Playground | Validated |
| `UiDropdownMenu` | Canonical Shared | Consumer Validation | Stable | Stable | Stable | Stable | Stable | Validated | Playground | Pending |
| `UiBreadcrumb` | Consumer Driven | Consumer Validation | Stable | Stable | Stable | Stable | Stable | Validated | Release | Pending |
| `UiControlSurface` | Consumer Driven | Stable | Stable | Stable | Stable | Stable | Stable | Validated | Release | Validated |
| `UiDock` | Consumer Driven | Stable | Stable | Stable | Stable | Stable | Stable | Validated | Release | Validated |
| `UiNavigationItem` | Consumer Driven | Stable | Stable | Stable | Stable | Stable | Stable | Validated | Release | Validated |
| `UiSegmentedControl` | Consumer Driven | Stable | Stable | Stable | Stable | Stable | Stable | Validated | Release | Validated |
| `UiBadge` | Consumer Driven | Stable | Stable | Stable | Stable | Stable | Stable | Validated | Release | Validated |
| `UiStatusIndicator` | Consumer Driven | Stable | Stable | Stable | Stable | Stable | Stable | Validated | Release | Validated |
| `UiNotice` | Consumer Driven | Stable | Stable | Stable | Stable | Stable | Stable | Validated | Release | Validated |
| `UiTooltipSurface` | Consumer Driven | Consumer Validation | Stable | Stable | Stable | Stable | Stable | Validated | Release | Validated |
| `UiSkeleton` | Consumer Driven | Stable | Stable | Stable | Stable | Stable | Stable | Validated | Release | Validated |
| `UiScrollbar` | Consumer Driven | Stable | Stable | Stable | Stable | Stable | Stable | Validated | Release | Validated |
| `UiTerminalPrompt` | Consumer Driven | Stable | Stable | Stable | Stable | Stable | Stable | Validated | Release | Validated |
| `UiTerminalEcho` | Consumer Driven | Consumer Validation | Stable | Stable | Stable | Stable | Stable | Validated | Release | Validated |
| `UiTerminalSurface` | Consumer Driven | Stable | Stable | Stable | Stable | Stable | Stable | Validated | Release | Validated |
| `UiTerminalLine` | Consumer Driven | Stable | Stable | Stable | Stable | Stable | Stable | Validated | Release | Validated |
| `UiTerminalTranscript` | Consumer Driven | Stable | Stable | Stable | Stable | Stable | Stable | Validated | Release | Validated |
| `UiStatCard` | Consumer Driven | Stable | Stable | Stable | Stable | Stable | Stable | Validated | Release | Validated |
| `UiTimeline` | Consumer Driven | Stable | Stable | Stable | Stable | Stable | Stable | Validated | Release | Validated |
| `UiStepFlow` | Consumer Driven | Stable | Stable | Stable | Stable | Stable | Stable | Validated | Release | Validated |

The existing Stable / Release / Consumer statuses above retain previously established Vue or shared-component evidence. They do not certify the newly added React adapters in real products. `reactValidation` in the machine-readable matrix separately records their browser runtime as validated and their release visual / real consumer validation as pending. See [framework parity](framework-parity.md) for scope and evidence.

`UiTerminalEcho` additionally has Vue/React prompt-context screenshots and XCA recorded-command consumer evidence. Its React `reactValidation.visual` is validated, while `reactValidation.consumer` remains pending; no real React product consumption or automatic Stable promotion is claimed.

The [2026-10-25 governance audit](consumer-validation-2026-10-25.md) separates the
evidence for every Consumer Validation component by framework. Vue Input/Select/Field
now have real Slides workflow evidence; Vue Popover has XCA menu evidence and Vue
TooltipSurface has real Neoverse Pulse data evidence. These update only the
aggregate consumer field, not React consumer validation or component maturity.
All 15 targets remain Consumer Validation; the Stable count remains 21.
React Breadcrumb's existing release screenshots were rerun and are explicitly
recorded in `reactValidation.visual`. No target has validated real React product
consumption. Four existing Consumer Parity module snapshots still omit the Echo
matrix row and fail on both platforms; they were not updated to hide that drift.

## Change policy

`UiInput type="number"` includes shared token-driven increment/decrement buttons in Vue and React. `tests/visual/number-input.spec.ts` covers bounds, steps and locked states; `tests/visual/form-control-behavior.spec.ts` covers text/selection state and Field composition. Real Vue consumption is validated in Slides search and filters; real React product consumption and independent React form release visuals remain pending.

A new public component must be added to the matrix in the same change that exports it. Canonical Shared components cannot be marked complete while either Vue or React is missing, and every Canonical Shared React adapter must appear in the browser runtime fixture. A component cannot be promoted to Stable without release visual coverage and real consumer validation.

`bun run check:contracts` validates matrix schema invariants, public Vue/React export coverage, Canonical Shared parity, React runtime fixture markers, Stable maturity requirements, and the presence of a documentation row for every registered component.


Material tiers, customization, component audit and hover/press policy: [Material standards](material-standards.md).
