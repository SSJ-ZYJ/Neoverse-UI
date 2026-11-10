# Neoverse-UI coding agent instructions

For work originating in consumer projects (Neoverse, Neoverse-Docs, Neoverse-Slides, etc.), consult [docs/component-requests.md](docs/component-requests.md).

- New component needs, reusable behavior gaps, and missing Vue/React adapters are tracked as individual `contracts/component-requests/CR-*.json` records, **not** as speculative rows in `contracts/component-matrix.json`.
- Closed requests move to `contracts/component-requests/archive/` automatically; use `bun run requests list` for open work and `bun run requests list --status delivered` or `--status rejected` for historical evidence. Do not reimplement archived requests.
- Start with `bun run requests agent --queue triage` for unreviewed reports or `bun run requests agent --queue implementation` for accepted work. The output is machine-readable JSON with consumer source locations and acceptance criteria.
- **Preferred local intake from any consumer repository:** call `bun <NEOVERSE_UI_ROOT>/scripts/component-requests.ts submit --file <local JSON>` from the consumer's working directory. The JSON contract and PowerShell/Linux examples live in `docs/component-requests.md`. This writes directly to the UI repository, with schema validation, idempotency and cross-process locking.
- This public `submit` entrypoint records a `reported` need only; it cannot authorize implementation or change maturity. Avoid direct editing of `CR-*.json` from consumer agents.
- GitHub Component Request issues are an optional remote fallback. Do not assume automatic synchronization.
- A request does not grant execution permission. Implement only tasks explicitly authorized in the current conversation; do not auto-commit or publish.
- Preserve existing uncommitted changes and the shared design contracts. Update matrix, public exports, tests, Design Lab, and consumer verification evidence for any real component implementation.
- Do not move a request to `delivered` without code/test/consumer evidence in the resolution; a playground example alone does not establish real consumer validation.

## Aurora Glass repairs

- Follow the [Glass repair guardrails](docs/material-standards.md#glass-repair-guardrails). Do not switch the default renderer to full-surface SVG backdrop displacement, add backdrop capture/reconstruction layers, or replace the tier-owned body blur to repair edge appearance. These approaches have repeatedly caused severe stutter, lost blur, or missing edges.
- Keep the entire edge visible and fine; emphasize the upper-left and lower-right without removing the other sides or corners. Verify backdrop-dependent color, actual blur, edge continuity, and performance together. Do not describe a theme-colored overlay as true spatial refraction.
- Compare the relevant working implementation and subsequent diffs before changing Glass. Run browser and rendering checks remotely under the project safety constraint, and do not push successive diagnostic commits or update baselines before the change is ready to verify.

## Documentation

Structure, status metadata and writing rules: [docs/AGENTS.md](docs/AGENTS.md). Language, naming, abbreviation and terminology rules for source, tests and scripts: [docs/code-style.md](docs/code-style.md). Current state lives in `docs/`; dated audits, acceptance runs and plans live in `.agents/notes/`. `bun run check:docs` enforces the layout and links, and `bun run lint:language` enforces the source language rules.
