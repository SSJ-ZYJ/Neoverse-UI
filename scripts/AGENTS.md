# scripts structure

Read this file before changing `scripts/`. Global constraints are in [AGENTS.md](../AGENTS.md); documentation rules are in [docs/AGENTS.md](../docs/AGENTS.md).

```text
scripts/
  check.ts                  sequential gate runner and summary
  gates/                    static repository contract checks
  release/                  Changeset, registry and package verification
  requests/                 component request CLI and intake
  dev/                      development loop and Tailwind CLI lookup
  sync/                     local consumer synchronization
```

Only the `check.ts` entry stays at the root. Every other script belongs to the domain directory that owns its lifecycle; a new top-level file needs an explicit reason.

## gates/

| File | Responsibility |
| --- | --- |
| `check-budgets.ts` | Source, CSS and test line budgets with REVIEW/NEAR/AT LIMIT bands and dated exceptions |
| `check-budgets.test.ts` | Covers classification, content units, severity bands and exception validation |
| `quality-budgets.json` | Single owner of limit values and exception records |
| `check-docs.ts` | Docs structure registry, status lines, links, translation pairs and hashes, English-only prose and contract evidence paths |
| `check-component-contracts.ts` | Matrix schema, public exports, React runtime coverage, evidence and docs rows |
| `check-framework-parity.ts` | Vue/React components, structures, literal unions and normalized binding names |
| `check-material-standards.ts` | Shared component selectors must reference token-owned material variables |
| `check-source-language.ts` | English comments and identifiers; Chinese only in localized values |
| `check-test-registry.ts` | Test scope registry, metadata evidence, browser spec table and cross-browser config agree |
| `check-test-registry.test.ts` | Covers registry parsing, glob rules and two-way metadata evidence |
| `check-tailwind-usage.ts` | Application source must use semantic utilities instead of primitive values |
| `check-text-integrity.ts` | UTF-8 text, line endings, BOM and replacement-character integrity |
| `react-runtime-fixture.ts` | Collects React adapter markers from the Design Lab fixture |
| `react-runtime-fixture.test.ts` | Covers marker collection and error reporting |

## release/

| File | Responsibility |
| --- | --- |
| `check-changeset-targets.ts` | Changesets may only target publishable packages |
| `check-changeset-targets.test.ts` | Runs the check in an isolated fixture repository |
| `check-release-registry.ts` | Package-name availability on the registry before publication |
| `verify-packages.ts` | Build, pack, install and API-check local tarballs |
| `verify-published.ts` | Compare published manifests, tarballs and installation with the source |
| `verify-published.test.ts` | Covers registry metadata validation |
| `release-api-smoke.ts` | Shared API checks for local and published releases |
| `release-api-smoke.test.ts` | Covers the release API contract |

## requests/

| File | Responsibility |
| --- | --- |
| `component-requests.ts` | Request CLI: submit, list, status, triage, implement and check |
| `component-requests.test.ts` | Covers lifecycle, archive moves, locking and JSON output |
| `component-request-intake.ts` | Submission schema, idempotency and cross-process locking |
| `component-request-intake.test.ts` | Covers intake validation in temporary directories |

## dev/

| File | Responsibility |
| --- | --- |
| `dev.ts` | Build once, then run the Playground, Vite watch and CSS watch |
| `dev-watch.ts` | Rebuild Tokens, Motion and Tailwind CSS on source edits |
| `tailwind-cli.ts` | Locate the installed `@tailwindcss/cli` executable |
| `tailwind-cli.test.ts` | Covers platform-specific CLI lookup |

## sync/

| File | Responsibility |
| --- | --- |
| `sync-consumer.ts` | Rebuild and verify every installed local `file:` consumer copy |
| `sync-consumer.test.ts` | Covers synchronization against a temporary consumer |

## Rules

- A new static check belongs in `gates/`, a release-only check or verifier in `release/`, request tooling in `requests/`, development orchestration in `dev/` and consumer synchronization in `sync/`.
- Wire a new gate into `scripts/check.ts` and `package.json` in the same change, and add it to the table above.
- Scale limits and exceptions live only in `gates/quality-budgets.json`. An exception carries a date, a ceiling the file must stay within, and a removal condition; a file back inside the hard limit loses its exception.
- Scripts resolve the repository root with `../..` from their domain directory. Do not use the current working directory for repository paths.
- Use Bun APIs and Node built-ins already present. Do not add a dependency for one check.
- A script that writes to the repository must be lock-protected, idempotent and tested against a temporary directory.
- Do not edit generated package `dist` output or release artifacts from here.