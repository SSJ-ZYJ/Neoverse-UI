# Releasing Neoverse UI

Neoverse UI publishes the following public packages under the npm `@neoverse-ui` organization scope:

- `@neoverse-ui/tokens`
- `@neoverse-ui/motion`
- `@neoverse-ui/overlay-runtime`
- `@neoverse-ui/glass-runtime`
- `@neoverse-ui/tailwind`
- `@neoverse-ui/vue`
- `@neoverse-ui/react`
- `@neoverse-ui/giscus-theme`

`apps/playground` is an internal workspace and is never published.

The current workspace has eight public packages. The new Overlay Runtime must be included in the same release plan as its Vue/React dependents. The pending form/overlay Changeset proposes the 0.3.x contract line; package versions remain 0.2.0 until the approved versioning step. Historical 0.2.0 bootstrap instructions below describe that earlier release sequence; current registry and Trusted Publisher state must be checked at publication time.

## Release preparation versus publishing

Normal development and release-candidate preparation may create Changesets, run quality gates, build packages, and verify package contents. Those steps do not publish anything.

The following commands are versioning or publication operations and must only run during an explicitly approved release:

```sh
bun run version
bun run release:pack
bun run release
bun changeset version
bun changeset publish
npm publish
```

Do not run them merely to validate a release candidate.

Before an automated OIDC release, also run the read-only first-publication gate:

```sh
bun run check:release-registry
```

It queries only the official npm registry for every public workspace package and reports
`registered`, `bootstrap-required` (HTTP 404), or `unavailable` (network/metadata error).
Missing packages and unverifiable responses return a nonzero exit code. The report lists
the local version and direct runtime dependents so a missing package cannot be hidden
by the all-local package smoke test. This online check is deliberately separate from
the offline-capable `release:check`; the automated `pack` job runs it before quality gates.
It does **not** verify npm permissions, Trusted Publisher configuration, or approve publication.

On 2026-10-20 this check found seven registered packages and
`@neoverse-ui/overlay-runtime` requiring bootstrap, with Vue and React as dependents.
The terminal token request has completed its local code and XCA-Portal validation and is
`blocked` solely on the formal publication criterion. Do not upgrade consumers to
unpublished variables; see [terminal token acceptance](acceptance-2026-10-20-terminal-tokens.md).

## Release gates

Before any npm publication, the repository must pass:

```sh
bun install --frozen-lockfile
bun run release:check
bun run test:visual
git diff --check
bun changeset status
```

`release:check` runs non-mutating Biome checks, text/style/Tailwind checks, typechecks, tests, and build. It verifies every public package, rejects leaked `workspace:` protocols and source/test/playground artifacts, and checks that packed internal runtime dependency ranges include the corresponding workspace release versions before installing local overrides. It then installs the generated package contents into a temporary clean consumer for JS, CSS, and TypeScript smoke tests. Local overrides prove package usability, not npm availability. The full Playwright gate must also finish with zero failures; conditional skips must have a documented design reason. Review expected/actual/diff images before accepting intentional snapshot changes, then rerun without snapshot updates. The release workflow runs these visual gates before packing.

The repository and all public packages use the MIT license. `scripts/verify-packages.ts` verifies the public package metadata and package contents before release.

### CI and visual baselines

The Linux release-quality job runs `release:check` once and uploads the built
Playground JS/CSS. Three Ubuntu 24.04 visual jobs download that same build and run
the complete Playwright suite with `--shard=1/3`, `2/3`, or `3/3`, two workers each.
`Verify workspace (Linux)` remains the aggregate required-check name: it succeeds
only when release quality and every visual shard pass. Windows keeps its separate
`release:check` and four-file keyboard/overlay/theme interaction gate.

These OS jobs do not run equivalent browser workloads. In failed run
[39412200952](https://github.com/SSJ-ZYJ/Neoverse-UI/actions/runs/39412200952),
Linux ran 718 browser cases while Windows ran 62. Release quality took 68 seconds
on Linux versus 107 seconds on Windows; the Linux bottleneck was its 21m35s full
browser step, including two retries of deterministic screenshot mismatches.

Playwright stores native baselines in
`tests/visual/snapshots/{platform}/{projectName}/`. Preserve `win32` images when
updating `linux` images, and vice versa. Both desktop/mobile and light/dark remain
covered, without relaxing pixel-difference thresholds.

The 2026-10-20 repair also corrects Maple Mono's invalid double `format()`
descriptor: browsers previously discarded its source, so Linux machines without
Maple Mono NF CN rendered terminal text in the Chinese sans fallback. Native font
loading and equal narrow/wide glyph advances must pass before accepting terminal
baselines. Controls screenshots cover the module header, navigation and every
component specimen separately: the old mobile image exceeded 21,000 pixels in
height, producing a blank tail beyond Chromium's compositor limit as well as
slow captures. Bounded images retain complete specimen coverage with the default
5-second screenshot assertion and 30-second test timeouts. Motion checks await
real transitions; geometry checks wait for loaded fonts; responsive overflow
permutations run as separate bounded cases.

For a baseline update, use the pinned Playwright dependency and Chromium build in
the target OS, build once, then select only the intentionally changed specs:

```sh
bun install --frozen-lockfile
bun run build
bunx playwright install chromium
bunx playwright test <affected-specs> --update-snapshots
bunx playwright test <affected-specs>
```

On Ubuntu, use `playwright install --with-deps chromium` to include native browser
libraries and fonts. Review the old/new/diff images before accepting a changed
baseline. Never use snapshot updates as the CI test command. Failed Linux shards
and Windows browser checks upload `test-results/` and the HTML report with
shard/attempt-specific artifact names.

Local CI repair verification on 2026-10-20:

- `bun run release:check` passed, including all eight clean-consumer package smokes.
- Native Ubuntu 24.04.5 / Playwright 1.60.0 Chromium ran all three non-update
  shards: 744 passed, 4 flaky (passed on the existing CI retry), 68 conditional
  skips, zero failures. The four remaining flakes were navigation/action
  timeouts; this does not establish a flake-free suite.
- Windows passed the 62-case interaction gate and all 86 screenshot cases without
  retries or snapshot updates. Both platforms' bounded Controls images were
  reviewed; no baseline exceeds 16,384 pixels in height.
- The final 816-case suite partitions into 272 cases per shard with no missing or
  duplicated cases. The count increase comes from splitting existing Controls
  screenshots and responsive overflow permutations, not reducing coverage.
  Actionlint accepted the workflow.

These are local CLI/browser results, not a successful remote GitHub Actions run.

### 2026-10-20 local preparation evidence

- `bun run verify:packages`: all eight packages passed the clean-consumer JS/CSS/type smoke.
- An isolated copied workspace with Motion requiring `@neoverse-ui/tokens@^99.0.0`
  was rejected before local overrides could hide the incompatible packed range.
- The real registry command returned exit 1 for missing Overlay Runtime, with seven
  other names registered. Five simulated registry scenarios covered registered,
  missing, HTTP 503, network failure and mismatched metadata; only registered passed.
- Root `tsc --noEmit`, Biome checks of changed tooling, text integrity and shared
  contract/request checks passed. The release YAML parsed with the registry gate
  preceding packing. This is local CLI evidence, not a remote workflow execution,
  visual regression, authenticated publisher audit, or publication.

## Changesets

Code changes that affect a public package must include a Changeset:

```sh
bun changeset
```

Choose the affected packages and the appropriate SemVer bump. Commit the generated `.changeset/*.md` file with the code change.

For the 0.2.0 line, breaking changes from 0.1.x use a `minor` bump because every public package is still pre-1.0. The migration contract is documented in [migration-0.2.0.md](migration-0.2.0.md).

For the pending 0.3.x line, use [migration-0.3.0.md](migration-0.3.0.md).
Packages are not fixed or linked as one version group: the current plan has minor bumps
for Tokens, Tailwind, Overlay Runtime and both adapters, patch bumps for Motion and
Glass Runtime, and no Giscus Theme bump. Inspect the actual version PR rather than
assigning `0.3.0` to every dependency.

During release-candidate work, validate the pending release plan with:

```sh
bun changeset status
bun run check
bun run verify:packages
```

Do not run `changeset version` until the release is explicitly approved.

## Automated release flow

After release changes land on `main`, `.github/workflows/release.yml` uses Changesets to select one of three modes:

- `version` — create or update the **Version Packages** pull request.
- `publish` — verify, pack, and publish versions that have not reached npm yet.
- `none` — no release work is required.

The version script runs `changeset version` and then refreshes `bun.lock`, so workspace versions used by Bun packing stay aligned with the versioned package manifests.

## First publication of a package

A package that has never existed on npm needs an initial publication before npm Trusted Publisher settings can be attached to it.

For the pending 0.3.x release, `@neoverse-ui/overlay-runtime` needs that bootstrap;
the other seven package names were present in the official registry on 2026-10-20.
Vue and React already declare it as a runtime dependency. Do not try to bootstrap
the whole release through OIDC: a missing package has no Trusted Publisher yet.

During an explicitly approved release:

1. Run `bun changeset status`, obtain approval for versioning, and review the resulting
   Version Packages changes (including `bun.lock` and internal SemVer ranges).
2. Run `bun run release:check` and the visual gates on those exact versioned artifacts.
   Confirm Overlay Runtime is public, MIT licensed, and uses the official registry.
3. Obtain approval for the exact initial package/version/artifact and authenticate
   against the official registry. Publish only the verified Overlay Runtime artifact,
   not the whole dependency graph or an arbitrary workspace source directory.
4. Confirm that exact version exists in the registry, then configure its Trusted
   Publisher with the identity below. Recheck the other seven packages' identities.
5. Require `bun run check:release-registry` to pass, review the `npm` Environment and
   automation variables, then approve the ordinary release for the remaining packages.
6. After publication, verify registry versions and installation without local overrides
   before release tags or consumer upgrades. Only then record terminal-token delivery.

The registry check is safe during RC preparation; authentication, permission changes,
versioning and publication are not. A failed registry check is a release blocker, not
permission to bootstrap automatically.

Never use an install mirror as the publication endpoint.

## npm Trusted Publishing

After a public package exists on npm, configure a Trusted Publisher for that package with:

- GitHub owner: `SSJ-ZYJ`
- Repository: `Neoverse-UI`
- Workflow filename: `release.yml`
- Environment name: `npm`
- Allowed actions: direct npm publication in addition to staged publication when required by the Changesets workflow

Then configure GitHub:

1. In **Settings → Actions → General**, allow GitHub Actions to create and approve pull requests so the Version Packages PR can be maintained.
2. Create an `npm` Environment. Add a required reviewer if publication should always require explicit approval.
3. Add the repository variable `NPM_TRUSTED_PUBLISHING_ENABLED=true` only after every public package, including newly introduced ones, has its Trusted Publisher configured.
4. Add `RELEASE_AUTOMATION_ENABLED=true` only after first-publication prerequisites are complete and the version/release plan is approved.

The release workflow stays dormant until `RELEASE_AUTOMATION_ENABLED` is enabled. In publish mode it always runs package verification first. The publication job additionally requires `NPM_TRUSTED_PUBLISHING_ENABLED=true` and uses OIDC instead of a long-lived `NPM_TOKEN`.

For a new package, keep publication gated by the `npm` Environment and do not merge
a publish-ready change to `main` before bootstrap is approved and complete. Existing
enabled variables are not evidence that a newly added package has a publisher.
Inspect their actual values and environment reviewers; do not change them as an RC check.
If preparation requires suspending automation, obtain approval for that configuration
change rather than relying on documentation defaults.

The registry gate blocks the automated `pack` job while any package name is missing.
It cannot bootstrap packages or inspect authenticated npm publisher settings. A green
registry report must still be paired with explicit Trusted Publisher and environment
review. npm OIDC requirements and publisher fields are documented in the
[official Trusted Publishing guide](https://docs.npmjs.com/trusted-publishers/);
the split Changesets v2 actions are designed for Changesets v3 and support the
workflow's publish-plan and packed-artifact handoff.

## Subsequent releases

After Trusted Publishing is enabled, the normal path is:

```text
feature/fix + changeset
        → main
        → Version Packages PR
        → review + merge
        → release workflow verifies package contents
        → npm Trusted Publishing
        → Git tags + GitHub Releases
```

Do not run `npm publish` directly from individual workspace source directories. The release path verifies the exact public package contents first; internal public-package dependencies remain explicit SemVer ranges in the published manifests.
