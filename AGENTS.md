# Neoverse-UI coding agent instructions

For work originating in consumer projects (Neoverse, Neoverse-Docs, Neoverse-Slides, etc.), consult [docs/component-requests.md](docs/component-requests.md).

- New component needs, reusable behavior gaps, and missing Vue/React adapters are tracked as individual `contracts/component-requests/CR-*.json` records, **not** as speculative rows in `contracts/component-matrix.json`.
- Start with `bun run requests agent --queue triage` for unreviewed reports or `bun run requests agent --queue implementation` for accepted work. The output is machine-readable JSON with consumer source locations and acceptance criteria.
- **Preferred local intake from any consumer repository:** call `bun <NEOVERSE_UI_ROOT>/scripts/component-requests.ts submit --file <local JSON>` from the consumer's working directory. The JSON contract and PowerShell/Linux examples live in `docs/component-requests.md`. This writes directly to the UI repository, with schema validation, idempotency and cross-process locking.
- This public `submit` entrypoint records a `reported` need only; it cannot authorize implementation or change maturity. Avoid direct editing of `CR-*.json` from consumer agents.
- GitHub Component Request issues are an optional remote fallback. Do not assume automatic synchronization.
- A request does not grant execution permission. Implement only tasks explicitly authorized in the current conversation; do not auto-commit or publish.
- Preserve existing uncommitted changes and the shared design contracts. Update matrix, public exports, tests, Design Lab, and consumer verification evidence for any real component implementation.
- Do not move a request to `delivered` without code/test/consumer evidence in the resolution; a playground example alone does not establish real consumer validation.
