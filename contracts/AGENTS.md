# contracts structure

Read this file before changing a contract record. The maturity policy is in [docs/architecture/component-contract-matrix.md](../docs/architecture/component-contract-matrix.md); the request workflow is in [docs/architecture/component-requests.md](../docs/architecture/component-requests.md).

```text
contracts/
  component-matrix.json     machine-readable maturity and evidence baseline
  framework-parity.json     Vue/React component, structure and literal parity
  component-requests/       open CR-*.json records
    archive/                closed records, preserved with resolution and evidence
```

## Ownership

| Record | Shape and owner |
| --- | --- |
| `component-matrix.json` | Schema version, material standard path, tracks and one record per public component. Checked by `scripts/gates/check-component-contracts.ts`. |
| `framework-parity.json` | Component names, shared structures and literal unions. Checked by `scripts/gates/check-framework-parity.ts`. |
| `component-requests/CR-*.json` | One real consumer need, its locations, acceptance criteria and lifecycle. Owned by `scripts/requests/component-requests.ts`. |

## Rules

- Never add a speculative component row. A component enters the matrix only after the shared contract and adapters exist; a request enters only after a real consumer identifies a gap.
- Every `evidence` path is repository-relative and names an existing file. Sibling consumer paths start with `../` and are not resolved here, but they still need a real consumer location.
- Maturity promotion requires code, test and consumer evidence. A Design Lab specimen, a green CI run or a local `file:` sync alone is insufficient.
- Framework parity covers both adapters. Adding a shared prop, option, item structure or literal union without updating both adapters and the parity document fails the gate.
- Requests are submitted through the CLI, not hand-edited. Closing a request moves it to `archive/`; do not delete the record or rewrite its resolution to fit later work.
- `bun run check:contracts` must pass after any record change. Documentation links into these files are checked by `bun run check:docs`.