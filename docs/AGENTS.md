# Documentation standards

Status: adopted

This file governs how repository documentation is organised and written. It applies to every Markdown file, including the root [AGENTS.md](../AGENTS.md), README, package guides and `.agents/notes/`. The root file keeps its engineering constraints; where the two overlap, the root file wins.

## Directory structure

```text
docs/                          current state of the repository
  AGENTS.md                    this file
  code-style.md                source language, naming and terminology rules
  translations.json            bilingual source/translation registry
  architecture/                current architecture and public interaction contracts
    README.md                  workspace layout, package boundaries and Design Lab
    component-contract-matrix.md component maturity policy and current baseline
    component-requests.md      cross-project component request intake
    consumer-sizing.md         consumer component sizing baseline
    form-control-contract.md   form control behavior and accessibility
    framework-parity.md        Vue / React equivalents
    material-standards.md      Aurora Glass optical and interaction contract
    overlay-contract.md        overlay positioning and dismissal
    terminal-composition.md    terminal composition and history behavior
  releases/                    process records and upgrade paths
    releasing.md               release process, gates and automation
    migration-0.3.0.md         historical upgrade path for 0.2.x
    migration-0.3.1.md         current upgrade guide
    release-0.3.1.md           latest published release record
  testing/
    README.md                  test layers, browser spec ownership and commands
  zh-CN/                       Chinese translations of consumer-facing documents
    README.md                  Chinese documentation index
    terminology.md             Chinese terminology and wording rules
    architecture/form-control-contract.md
    architecture/material-standards.md
    architecture/overlay-contract.md
    architecture/terminal-composition.md
    releases/migration-0.3.1.md
  images/                      README artwork
.agents/notes/
  archives/                    dated audits, acceptance runs and incident records
  plans/                       dated implementation plans
```

Process material — audits, acceptance runs, incident records, measurement snapshots and plans — belongs in `.agents/notes/` as `<type>-<date>.md`. The structure block above is the registry: `bun run check:docs` rejects a `docs/` file absent from it.

## Content ownership

| Fact | Maintained in |
| --- | --- |
| Repository engineering constraints and agent intake | [AGENTS.md](../AGENTS.md) |
| Source language, naming, abbreviations and terminology | [code-style.md](code-style.md) |
| Project overview, install and usage | [README.md](../README.md) |
| Workspace layout, package responsibilities, module boundaries | [architecture/README.md](architecture/README.md) |
| Component maturity and current status | [component-contract-matrix.md](architecture/component-contract-matrix.md) |
| Component request schema and intake | [component-requests.md](architecture/component-requests.md) |
| Consumer sizing baseline | [consumer-sizing.md](architecture/consumer-sizing.md) |
| Form control contract | [form-control-contract.md](architecture/form-control-contract.md) |
| Vue / React equivalents | [framework-parity.md](architecture/framework-parity.md) |
| Aurora Glass material contract | [material-standards.md](architecture/material-standards.md) |
| Overlay contract | [overlay-contract.md](architecture/overlay-contract.md) |
| Terminal composition contract | [terminal-composition.md](architecture/terminal-composition.md) |
| Test layers, spec ownership and commands | [testing/README.md](testing/README.md) |
| Release process, gates and automation | [releasing.md](releases/releasing.md) |
| Upgrade steps between published versions | `releases/migration-*.md`, newest adopted |
| What the latest release shipped | [release-0.3.1.md](releases/release-0.3.1.md) |
| What an older release shipped | `.agents/notes/archives/release-*.md` |

## Status metadata

Every file starts with a level-one heading, a blank line, then `Status: adopted` for current state or `Status: historical` for a design rationale that names its replacement. Current-state documents do not carry dates; a dated observation, baseline or verification run is process material in `.agents/notes/`, with the date in the file name and in the record.

## Writing

- One level-one heading and consecutive heading levels per file. A heading names its subject, not "Overview" or "Misc". Lead with the conclusion, then the evidence; one paragraph carries one topic. Use numbered steps only for a sequence and tables for comparisons and mappings.
- Write facts, not intentions or marketing. Write an unknown value as unverified together with the observation that would settle it. Do not use "future", "probably" or "should support" in place of a fact.
- A document has exactly one prose language. English contract documents use United States spelling and contain no Chinese prose or Chinese display names; Chinese belongs in the paired `zh-CN` translation. Chinese working records use Chinese prose; identifiers, code, commands and English product names stay in their original form.
- Chinese prose uses full-width punctuation, one space between a Chinese character and a half-width Latin word, digit or unit, and "quotes" rather than 「brackets」. Dates use `2026-11-15`, times `14:30`, ranges `100–900`; `%` and `°` stay attached to the number. Inline code, links and bold text follow the same CJK spacing rule without extra padding. Use relative paths for repository links and full URLs for external links; link text names the target.
- One fact, one place: do not restate another document's rules or checklists, and link to the owning section instead. A historical record names its replacement, keeps its original wording, and is not deleted while it still explains a design decision.

## Translations

English remains the source of truth for every public contract and package guide; Chinese translations serve readers and never become an independent fact owner. Each pair is registered in `docs/translations.json`: a source path and a `zh-CN` translation path, with `README.zh-CN.md` files pairing with the package-level `README.md`.

- A translation starts with `<!-- Source: <source path> -->` and `<!-- Source-SHA256: <sha256> -->`; the hash covers the source byte for byte, and `bun run check:docs` fails when the source changed without a translation review.
- Edit the English source first, then update every registered translation and hash in the same change. A summary translation states its scope and links the English contract for exact values.
- Translations use Chinese prose, full-width punctuation and the terminology in [docs/zh-CN/terminology.md](zh-CN/terminology.md). Identifiers, code, commands and product names keep their source spelling.
- Do not register a translation that is not maintained. Consumer-facing guides are translated first; agent governance, source conventions, test registries, release records and `.agents/notes/` stay English.

## Structure and size

- A directory-level `AGENTS.md` describes that directory's structure, file responsibilities and extension rules at or below 100 lines, with a hard limit of 120; split a subdirectory's guidance into topic documents rather than raising the limit. The root `AGENTS.md` carries global constraints and entry links only. Do not create empty templates, placeholder sections or documents that only duplicate an existing owner.
- A topic document owns one subject. When it grows to cover independent subjects, split it, register the new files in this structure block and link both directions.

## Checks

`bun run check:docs` verifies the status line, rejects dated process records inside `docs/`, rejects Chinese text in English Markdown, resolves relative links in `docs/`, `.agents/notes/`, translations, every `AGENTS.md` and the root README, enforces the directory-level size limit, validates `docs/translations.json` pairs and source hashes, and requires repository-relative `evidence` paths in `contracts/component-matrix.json` to name files that still exist. It runs as part of `bun run lint` and `bun run release:check`.

Documentation that describes a behavior change ships in the same commit as the change.
