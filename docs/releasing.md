# Releasing Neoverse UI

Status: adopted

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

The 0.3.0 baseline was published on 2026-10-21: Tokens, Tailwind, Vue, React and
Overlay Runtime at 0.3.0, Motion and Glass Runtime at 0.2.1, and unchanged Giscus
Theme at 0.2.0. On 2026-10-25 all eight official-registry `latest` versions matched
these manifests. [Release run 39613361164](https://github.com/SSJ-ZYJ/Neoverse-UI/actions/runs/39613361164)
completed publication and official-registry installation verification; the seven
new package tags point to `dfb84a7`. See [release notes](release-0.3.0.md).
Later source changes and pending Changesets are not part of that published baseline.

The [0.3.1 / 0.4.0 coordinated release](release-0.3.1.md) was published on
2026-11-05: Tokens, Tailwind and Overlay Runtime at 0.3.1; Vue and React at
0.4.0; Motion and Glass Runtime at 0.2.2; Giscus Theme unchanged at 0.2.0.
`0.3.1` is a release label, not a version shared by the workspace.
[PR #8](https://github.com/SSJ-ZYJ/Neoverse-UI/pull/8) merged `dev` into `main`
as `fedafc4`, [PR #9](https://github.com/SSJ-ZYJ/Neoverse-UI/pull/9) produced the
versioned commit `a7eb5757ae8f7dc18ae782e6173698272589ba01`, and
[release run 42055594494](https://github.com/SSJ-ZYJ/Neoverse-UI/actions/runs/42055594494)
passed release quality, all three Chromium shards, the Windows gate, packing and
`Publish to npm` on that commit. The seven package tags point to `a7eb5757`, and
`bun run verify:published` passed as the last step of the publish job.
That document retains the candidate-era plan, token migration and cross-browser
evidence as dated history. A complete cross-browser run needs
`cross_browser_shards=6`, because one job is capped at 20 minutes.

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
On 2026-10-21 all eight names were registered, including Overlay Runtime at 0.2.0;
its name no longer requires bootstrap for the 0.3.0 release. This does not establish
that its Trusted Publisher identity is configured correctly.
The terminal token request was delivered and archived on 2026-10-23 after published
Tokens 0.3.0 contents and XCA-Portal's accepted local `file:` consumption were verified.
The user accepted local/npm Token parity without changing dependency sources; see
[terminal token acceptance](../.agents/notes/archives/acceptance-2026-10-20-terminal-tokens.md) and the
[archived resolution](../contracts/component-requests/archive/CR-20261010-2A6D0E6E.json).

## Release gates

Before any npm publication, the repository must pass:

```sh
bun install --frozen-lockfile
bun run release:check
bun run test:e2e
git diff --check
bun changeset status
```

`release:check` runs non-mutating Biome checks, text/style/Tailwind checks, typechecks, tests, and build. It verifies every public package, rejects leaked `workspace:` protocols and source/test/playground artifacts, and checks that packed internal runtime dependency ranges include the corresponding workspace release versions before installing local overrides. It then installs the generated package contents into a temporary clean consumer for JS, CSS, and TypeScript smoke tests. Local overrides prove package usability, not npm availability. The full Playwright gate must also finish with zero failures; conditional skips must have a documented design reason. The release workflow runs these browser gates before packing.

`verify:published` selects API checks from each package's exact manifest version.
Registry packages at 0.3.1 or later must expose React parity, Vue `UiTerminalEcho`,
the React terminal header type, material names and the new token-map entries.
Published 0.3.0 packages retain their older API baseline. Local tarballs always
exercise the new assertions, including before manifest versioning. Both modes
retain JS/CSS/type checks, and published mode still verifies exact versions and
the resolved dependency graph. Future API additions must extend this shared,
version-aware baseline rather than remain excluded from published verification.

Run release gates in an isolated checkout/copy when another `bun dev` is active.
The development watcher intentionally writes readable CSS to the same `dist`
paths as production builds; concurrent writes can replace a minified package
artifact during verification. Do not stop a user's development service or relax
package checks to accept that race. Exclude `dist` and `*.tsbuildinfo` together
when preparing a clean validation copy, then install with the frozen lockfile.

The repository and all public packages use the MIT license. `scripts/verify-packages.ts` verifies the public package metadata and package contents before release.

### 2026-10-25 Batch A baseline audit

- Validated source based on local `dev` `f35c566` plus this audit's non-visual
  fixes. The one unpushed commit remains unpushed; no versioning or publication ran.
- Isolated Windows (Bun 1.4.4) and native Linux/WSL (Bun 1.4.0) both passed
  `release:check`, including lint, all workspace typechecks/unit/contract tests,
  builds and eight local-tarball clean-consumer JS/CSS/type smokes.
- `verify:published` initially failed because candidate-only Echo/React exports
  were required from npm 0.3.0. Separating those assertions from the published
  baseline preserved candidate checks; official-registry installation then passed
  for all eight packages on both platforms.
- Non-update Playwright runs: Windows **112 passed**, Linux **94 passed**, zero
  failures. Both covered `terminal-composition`, `terminal-surface`,
  `terminal-resize`, `terminal-theme-contract`, `react-parity` and
  `component-interactions`; Windows additionally covered `control-identity`,
  `dock-language-proportions` and `react-theme`. No screenshot baselines changed.
  This was targeted coverage, not a rerun of the full visual suite.
- Linux ran on Arch/WSL using Playwright's Ubuntu 24.04 fallback Chromium build;
  it is local native Linux evidence, not a new GitHub Actions run. The latest
  successful remote Linux/Windows run remains
  [40107362521 at 34bd4a1](https://github.com/SSJ-ZYJ/Neoverse-UI/actions/runs/40107362521).
- Neoverse-Doc retained UI 0.1.0. Three tarballs were replaced only by exact npm
  versions with identical SHA-512 integrity. Frozen installation, typecheck and
  production build passed (93 HTML pages, 72 Mermaid assets); generated Giscus
  source CSS was restored after the build. Remaining historical artifacts still
  block standalone clean-checkout installation; see [consumer audit](consumer-sizing.md#2026-10-25-consumer-dependency-audit).

### CI and browser checks

CI and Release call `.github/workflows/verify.yml` on their exact checked-out commit.
CI handles PRs and `dev` pushes without an open PR. Both workflows classify changed
paths into documentation, metadata, source quality, and rendered UI impact.
Ordinary documentation and the dated process material under `.agents/notes/` run
metadata checks without build or browser work, so `check:docs` validates their
status lines and links; the Linux aggregate check still runs. Changesets,
archived component requests, and CI config changes take the same metadata gate.
Contract-matrix documentation and non-browser quality scripts run source
verification, but not Playwright. Unknown file types conservatively select both
source and browser gates.

Release also scopes ordinary `main` pushes, but does not repeat a browser matrix
that already ran: CI gated the pull request that produced the commit, and Release
repacks that exact tree. Once mode selection succeeds with a mode other than
`publish`, Release skips its own `verify` job entirely if
`.github/scripts/ci-evidence.mjs` confirms that
this commit is the one GitHub recorded as landing a pull request on `main`
(`merge_commit_sha`) and that the pull request head has a completed, successful
`CI` pull-request run. That skip assumes the protected `main` branch stays strictly
up to date, so the merged tree is the tree CI tested; the lookup fails closed, and
a direct push, a bypassed or failing CI run, or an API error all keep the
verification. Without that evidence, Release runs the browser checks its own change
scope selects, because the browser matrix is then the only proof of the rendered
UI. When its Changesets mode is `publish`, it always runs source quality before
packing even if the triggering commit changed only documentation, because that job
builds the package and Playground assets the pack step publishes, and `publish`
always needs the verified build to download.
A `version` run continues through the Changesets version workflow without forcing
checks for unrelated changes. Publication automation remains opt-in.

Linux runs `release:check` once for source changes. It uploads the built package
and Playground assets when browser shards run or a release needs to pack them.
Three Ubuntu 24.04 browser jobs then download that same build and run the complete
Playwright suite with `--shard=1/3`, `2/3`, or `3/3`, two workers each.
`Verify workspace (Linux)` remains the required aggregate gate, checking only
the jobs selected by change scope and rejecting any selected failed job.
Windows reuses the validated playground assets Linux already built, then runs its
own four-file keyboard/overlay/theme browser gate only for UI-impacting
changes; it does not duplicate Linux's `release:check` static analysis or unit
test matrix.

These OS jobs do not run equivalent browser workloads. In failed run
[39412200952](https://github.com/SSJ-ZYJ/Neoverse-UI/actions/runs/39412200952),
Linux ran 718 browser cases while Windows ran 62. Release quality took 68 seconds
on Linux versus 107 seconds on Windows; the Linux bottleneck was its 21m35s full
browser step, including two retries of deterministic screenshot mismatches. The
current CI retry budget is one attempt: a second retry only tripled the cost of
failures that reproduce identically.

The browser suite keeps no screenshot baselines. `tests/e2e/` asserts observable
behaviour plus the deterministic rendering contracts (control sizes, target size,
text contrast, material-tier wiring), while the optical look of Aurora Glass is
verified by manual acceptance against [Material standards](material-standards.md)
before release.

Historical record: the 2026-10-20 repair corrected Maple Mono's invalid double
`format()` descriptor. Browsers previously discarded its source, so Linux
machines without Maple Mono NF CN rendered terminal text in the Chinese sans
fallback. Font loading and equal narrow/wide glyph advances remain part of manual
terminal acceptance. The screenshot baseline workflow from that period has been
retired with the rest of the pixel suite.

Run the browser suite the same way CI does:

```sh
bun install --frozen-lockfile
bun run build
bunx playwright install --with-deps chromium
bunx playwright test
```

Failed Linux shards and Windows browser checks upload `test-results/` and the
HTML report with shard/attempt-specific artifact names. There are no screenshot
baselines to update: a rendering change is accepted manually against
[Material standards](material-standards.md).

Historical local CI verification on 2026-10-20 (screenshot suite, now retired):

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
  manual material acceptance, authenticated publisher audit, or publication.

## Changesets

Code changes that affect a public package must include a Changeset:

```sh
bun changeset
```

Choose the affected packages and the appropriate SemVer bump. Commit the generated `.changeset/*.md` file with the code change.

For the 0.2.0 line, breaking changes from 0.1.x use a `minor` bump because every public package is still pre-1.0. The migration contract is documented in [migration-0.2.0.md](migration-0.2.0.md).

For migration to the published 0.3.0 baseline, use [migration-0.3.0.md](migration-0.3.0.md).
Packages are not fixed or linked as one version group: that release used minor bumps
for Tokens, Tailwind, Overlay Runtime and both adapters, patch bumps for Motion and
Glass Runtime, and no Giscus Theme bump. Pending Changesets describe later source
changes; inspect their actual release plan rather than assigning one version to every dependency.

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

All eight names were registered when checked on 2026-10-21. The following procedure
is for future missing package names, not a requirement to republish Overlay Runtime
0.2.0. A missing package has no Trusted Publisher yet; do not try to bootstrap an
entire dependency graph through OIDC.

During an explicitly approved release:

1. Run `bun changeset status`, obtain approval for versioning, and review the resulting
   Version Packages changes (including `bun.lock` and internal SemVer ranges).
2. Run `bun run release:check` and the browser gates on those exact versioned artifacts.
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

The `main` ruleset must require both Linux and Windows aggregate checks from the CI
caller (`Verify workspace / Verify workspace (Linux)` and
`Verify workspace / Verify workspace (Windows)`). Confirm their exact names in the
latest PR check runs before configuring them. CI runs on documentation PRs as well,
so required contexts cannot remain pending because the entire workflow was filtered.

Versioning and publication stay dormant until `RELEASE_AUTOMATION_ENABLED` is enabled;
verification still runs on every `main` push. The publication job additionally requires
`NPM_TRUSTED_PUBLISHING_ENABLED=true` and uses OIDC instead of a long-lived `NPM_TOKEN`.

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

## Changeset validation and release completion

`bun run check:changesets` uses the Changesets parser to validate YAML, bump types
and workspace package names. Private-only records are rejected because private
workspace versioning is disabled. Empty records and mixed public/private records
are accepted. This check runs before mode selection, in `release:check`, and in the
local `check` command; CLI regression tests run with `bun run test:release-tools`.

In publish mode, Release runs the reusable Linux quality gate, downloads that
verified build, checks registry prerequisites and packs it; the browser matrix is
repeated only when the commit has no confirmed CI evidence. Outside publish mode,
a commit whose CI evidence is confirmed skips the release verification entirely.
The `npm` Environment then gates OIDC publication. Version PRs use conventional
`chore(release): version packages` titles and commits.

After publication, `bun run verify:published` must pass. This is also an automatic
step after the publish action. It polls the official registry every 10 seconds for
up to five minutes, allowing exact versions, `latest` tags and tarballs to propagate.
Missing versions/tarballs, stale tags and transient registry errors are retried;
authentication failures and incorrect package contents fail immediately.
It checks official tarball origins and internal runtime ranges, then installs all eight packages from
the official registry without local overrides. The existing JS/CSS/TypeScript smoke
is reused, and resolved internal package versions must match the release plan.
Check the seven new package tags and GitHub Releases as well. Do not rerun versioning
to retry a failed publication: investigate the failed job and actual registry state.

An npm package name being registered is not proof of publishing authorization, and
a successful version-mode workflow is not proof that the publish job ran. Consumer
upgrades and request delivery evidence remain separate from this library release.
