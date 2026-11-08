# Documentation standards

Status: adopted

This file governs how repository documentation is organised and written. The
root [AGENTS.md](../AGENTS.md) keeps its engineering constraints; where the two
overlap, the root file wins. This file does not change what a document says, only
where it lives and how it is maintained.

## Directory structure

```text
docs/                          current state of the repository
  AGENTS.md                    this file
  architecture.md              workspace layout and package responsibilities
  component-contract-matrix.md component maturity policy and current baseline
  component-requests.md        cross-project component request intake
  consumer-sizing.md           consumer component sizing baseline
  form-control-contract.md     form control behaviour and accessibility
  framework-parity.md          Vue / React equivalents
  material-standards.md        Aurora Glass optical and interaction contract
  overlay-contract.md          overlay positioning and dismissal
  terminal-composition.md      terminal composition and history behaviour
  releasing.md                 release process, gates and automation
  migration-0.2.0.md           historical upgrade path
  migration-0.3.0.md           current upgrade guide
  release-0.3.0.md             published release record
  release-0.3.1.md             published release record
.agents/notes/
  archives/                    dated audits, acceptance runs and incident records
  plans/                       dated implementation plans
```

Process material belongs in `.agents/notes/`: audits, acceptance runs, incident
records, measurement snapshots and implementation plans are records of what
happened on a date, not descriptions of the current repository. Name them
`<type>-<date>.md`.

`docs/` describes what the repository does now. A document that only records a
past investigation is kept in `.agents/notes/archives/` and linked from the
current-state document that relies on it.

Register a new topic in the structure above before writing it. Do not add a file
to `docs/` that the structure does not list.

## Content ownership

| Fact | Maintained in |
| --- | --- |
| Repository engineering constraints and agent intake | [AGENTS.md](../AGENTS.md) |
| Project overview, install and usage | [README.md](../README.md) |
| Workspace layout, package responsibilities, module boundaries | [architecture.md](architecture.md) |
| Component maturity policy and current status | [component-contract-matrix.md](component-contract-matrix.md) |
| Component request schema and intake commands | [component-requests.md](component-requests.md) |
| Consumer sizing baseline | [consumer-sizing.md](consumer-sizing.md) |
| Form control contract | [form-control-contract.md](form-control-contract.md) |
| Vue / React equivalents | [framework-parity.md](framework-parity.md) |
| Aurora Glass material contract | [material-standards.md](material-standards.md) |
| Overlay contract | [overlay-contract.md](overlay-contract.md) |
| Terminal composition contract | [terminal-composition.md](terminal-composition.md) |
| Release process, gates and automation | [releasing.md](releasing.md) |
| Upgrade steps between published versions | `migration-*.md`, newest adopted |
| What a specific release shipped | `release-*.md`, newest adopted |

One fact, one place. Link to the owning document instead of restating it.

## Status metadata

Every file starts with a level-one heading, a blank line, then a status line:

```text
Status: adopted
```

- `adopted` — describes the current repository state.
- `historical` — kept for its design rationale; the file names the document that
  replaced it.

Current-state documents do not carry dates. A dated observation, baseline or
verification run is process material and belongs in `.agents/notes/`, which keeps
the date in the file name and in the record itself.

## Writing

- One level-one heading per file; keep heading levels consecutive.
- Lead with the conclusion, then the evidence.
- Use tables for comparisons and mappings; label code fences with a language.
- Repository links use relative paths, external links use full URLs, and link
  text names the target.
- Write facts, not intentions. An unknown value is written as unverified together
  with the observation that would settle it.
- Do not describe a component, script or workflow that the repository does not
  contain.

## Checks

`bun run check:docs` verifies the status line, rejects dated process records
inside `docs/`, resolves every relative link in `docs/` and `.agents/notes/`, and
requires repository-relative `evidence` paths in `contracts/component-matrix.json`
to name files that still exist. It runs as part of `bun run lint` and
`bun run release:check`.

Documentation that describes a behaviour change ships in the same commit as the
change.
