# Releasing Neoverse UI

Neoverse UI publishes the following public packages under the npm `@neoverse-ui` organization scope:

- `@neoverse-ui/tokens`
- `@neoverse-ui/motion`
- `@neoverse-ui/glass-runtime`
- `@neoverse-ui/tailwind`
- `@neoverse-ui/vue`
- `@neoverse-ui/react`
- `@neoverse-ui/giscus-theme`

`apps/playground` is an internal workspace and is never published.

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

## Release gates

Before any npm publication, the repository must pass:

```sh
bun install --frozen-lockfile
bun run release:check
bun run test:visual
git diff --check
bun changeset status
```

`release:check` runs non-mutating Biome checks, text/style/Tailwind checks, typechecks, tests, and build. It verifies every public package, rejects leaked `workspace:` protocols and source/test/playground artifacts, and installs the generated package contents into a temporary clean consumer for JS, CSS, and TypeScript smoke tests. The full Playwright gate must also finish with zero failures; conditional skips must have a documented design reason. Review expected/actual/diff images before accepting intentional snapshot changes, then rerun without snapshot updates. The release workflow runs these visual gates before packing.

The repository and all public packages use the MIT license. `scripts/verify-packages.ts` verifies the public package metadata and package contents before release.

## Changesets

Code changes that affect a public package must include a Changeset:

```sh
bun changeset
```

Choose the affected packages and the appropriate SemVer bump. Commit the generated `.changeset/*.md` file with the code change.

For the 0.2.0 line, breaking changes from 0.1.x use a `minor` bump because every public package is still pre-1.0. The migration contract is documented in [migration-0.2.0.md](migration-0.2.0.md).

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

For the 0.2.0 release, `@neoverse-ui/react` and `@neoverse-ui/giscus-theme` need that first-publication bootstrap. This RC phase checks their metadata, exports, dependency ranges, and packed contents only; it does not publish them. Their verified 0.2.0 artifacts must be published during the approved release before configuring Trusted Publishers.

Before that first publication:

1. Confirm the package is listed as public in its `package.json` and carries the repository MIT license.
2. Run `bun changeset status` and ensure the intended version is represented by the pending Changesets.
3. Run `bun run release:check` and require it to pass without exceptions.
4. Inspect the intended version and package contents before approving any publish step.
5. Authenticate against the official npm registry only when publication is explicitly approved.
6. Publish only the already-verified package artifacts.
7. Verify the registry state before pushing release tags.

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
3. Add the repository variable `NPM_TRUSTED_PUBLISHING_ENABLED=true` only after every public package has its Trusted Publisher configured.
4. Add `RELEASE_AUTOMATION_ENABLED=true` only after the first-publication bootstrap is complete and all accumulated pre-release Changesets have been resolved.

The release workflow stays dormant until `RELEASE_AUTOMATION_ENABLED` is enabled. In publish mode it always runs package verification first. The publication job additionally requires `NPM_TRUSTED_PUBLISHING_ENABLED=true` and uses OIDC instead of a long-lived `NPM_TOKEN`.

Keep both variables disabled and leave the `npm` Environment unconfigured during RC preparation. The initial release sequence is:

```text
Code and visual gates pass
  → approved RC commit
  → approved Version Packages (all seven packages to 0.2.0)
  → React / Giscus Theme first-publication bootstrap
  → npm Trusted Publisher configuration for every public package
  → GitHub npm Environment
  → NPM_TRUSTED_PUBLISHING_ENABLED=true
  → RELEASE_AUTOMATION_ENABLED=true
```

While automation is disabled, Version Packages is an explicitly approved manual step. Review and merge its resulting version changes before bootstrap. npm OIDC requirements and publisher fields are documented in the [official Trusted Publishing guide](https://docs.npmjs.com/trusted-publishers/); the split Changesets v2 actions are designed for Changesets v3 and support the workflow's publish-plan and packed-artifact handoff.

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
