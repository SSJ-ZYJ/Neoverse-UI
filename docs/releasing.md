# Releasing Neoverse UI

Neoverse UI publishes the following public packages under the npm `@neoverse-ui` organization scope:

- `@neoverse-ui/tokens`
- `@neoverse-ui/motion`
- `@neoverse-ui/glass-runtime`
- `@neoverse-ui/tailwind`
- `@neoverse-ui/vue`

`@neoverse-ui/react` and `@neoverse-ui/playground` are private workspaces and are not published.

## Release gates

Before any npm publish, the repository must pass:

```sh
bun install --frozen-lockfile
bun run release:check
```

`release:check` runs the workspace checks and build, packs every public package, verifies package metadata and exported files, rejects leaked `workspace:` protocols and test/playground artifacts, and installs the tarballs into a temporary clean consumer for JS, CSS, and TypeScript smoke tests.

Public publishing is intentionally blocked until the repository has a chosen root license, the root `package.json` and every public package declare the same SPDX `license` value, and each public package carries the same `LICENSE` text in its tarball. Do not bypass this gate for the first release.

## Normal development flow

Code changes that affect a public package should include a Changeset:

```sh
bun changeset
```

Choose the affected packages and the appropriate SemVer bump. Commit the generated `.changeset/*.md` file with the code change.

After changes land on `main`, `.github/workflows/release.yml` uses Changesets to select one of three modes:

- `version` — create or update the **Version Packages** pull request.
- `publish` — pack and publish versions that have not reached npm yet.
- `none` — no release work is required.

The version script runs `changeset version` and then refreshes `bun.lock`, so workspace versions used by Bun packing stay aligned with the versioned package manifests.

## First release bootstrap

The first public release is different from later releases because npm Trusted Publisher settings can only be attached after the package exists on npm.

1. Choose the repository license, add the root `LICENSE`, copy the same license text into every public package directory, and add the same SPDX `license` value to the root and public package manifests.
2. Run `bun changeset status` and resolve all accumulated pre-release Changesets into the intended first public version. Do not publish a version while leaving Changesets that describe content already included in that same release.
3. Run `bun run release:check` and require it to pass without exceptions.
4. Confirm the intended first versions and package contents with:

   ```sh
   bun run release:pack
   ```

5. Authenticate this machine against the official npm registry. The local machine may use an install mirror globally, so specify npmjs explicitly instead of changing the global registry:

   ```sh
   npm login --scope=@neoverse-ui --registry=https://registry.npmjs.org/
   ```

6. Publish the already-verified pack directory:

   ```sh
   bun changeset publish --from-pack-dir .release
   ```

   Package-level `publishConfig.registry` and `publishConfig.access` force the public packages to `https://registry.npmjs.org/` with public access.

7. Verify that all five intended first-release versions are visible under the `neoverse-ui` npm organization and can be installed from a fresh directory.
8. Push the release commit/tags only after the registry state is verified.

Never use the Tencent/npm install mirror as the publication endpoint.

## Enable npm Trusted Publishing after bootstrap

After the five packages exist, configure a Trusted Publisher for each package in npm with:

- GitHub owner: `SSJ-ZYJ`
- Repository: `Neoverse-UI`
- Workflow filename: `release.yml`
- Environment name: `npm`
- Allowed actions: enable direct `npm publish` in addition to the default staged-publish permission, because the Changesets publish action performs a normal npm publish

Then configure GitHub:

1. In **Settings → Actions → General**, allow GitHub Actions to create and approve pull requests so the Version Packages PR can be maintained.
2. Create an `npm` Environment. A required reviewer can be added if publication should always require explicit approval.
3. Add the repository variable `NPM_TRUSTED_PUBLISHING_ENABLED` with value `true` only after every public package has its Trusted Publisher configured.
4. Add the repository variable `RELEASE_AUTOMATION_ENABLED` with value `true` only after the first-release bootstrap is complete and the accumulated pre-release Changesets have been resolved.

The release workflow stays dormant until `RELEASE_AUTOMATION_ENABLED` is enabled. In publish mode it always runs the verification/pack job, while the actual npm publish job additionally requires `NPM_TRUSTED_PUBLISHING_ENABLED=true`. The publish job uses a GitHub-hosted runner, Node 24, a current npm CLI, and `id-token: write`; no long-lived `NPM_TOKEN` is required.

## Subsequent releases

After Trusted Publishing is enabled, the normal release path is:

```text
feature/fix + changeset
        ↓
main
        ↓
Version Packages PR
        ↓
review + merge
        ↓
release workflow verifies and packs tarballs
        ↓
npm Trusted Publishing (OIDC)
        ↓
Git tags + GitHub Releases
```

Do not run `npm publish` directly from individual workspace source directories. The release path packs first, verifies the exact tarballs, and publishes only those verified artifacts; internal public-package dependencies remain explicit SemVer ranges in the published manifests.
