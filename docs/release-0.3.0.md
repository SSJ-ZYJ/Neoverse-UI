# Neoverse UI 0.3.0 release notes

Published on 2026-10-21. [Release run 39613361164](https://github.com/SSJ-ZYJ/Neoverse-UI/actions/runs/39613361164)
completed npm publication and official-registry installation verification. On
2026-10-25 the eight official npm `latest` versions matched the table below; the
seven new package tags point to `dfb84a7`. Giscus Theme retains its earlier 0.2.0 tag.
A Version Packages merge alone is not publication evidence.

## Coordinated versions

| Packages | Version |
| --- | --- |
| Tokens, Tailwind, Vue, React, Overlay Runtime | 0.3.0 |
| Motion, Glass Runtime | 0.2.1 |
| Giscus Theme | 0.2.0 (unchanged) |

## Required migration

- Vue requires `>=3.5.0 <4.0.0`; React remains `>=19.0.0 <20.0.0`.
- Remove `surface="chrome"`, `ui-surface-chrome` and chrome-specific tokens.
  Explicit subtle surfaces use `glass-subtle` / `material-glass-subtle`.
  `UiDock` now defaults to `glass-elevated`. No compatibility aliases are retained.
- Upgrade adapter JS, Tokens and compiled CSS together. Remove stale overrides
  that force `^0.2.0` Tokens beneath a 0.3.0 adapter.
- Bind `UiField`'s `controlAttrs` to its real input. Validation, controlled resets,
  application data and routing remain consumer responsibilities.

See [the migration guide](migration-0.3.0.md) for complete API and upgrade details.

## Additions and fixes

- Shared Vue/React Checkbox, RadioGroup, Switch, Field, Popover and DropdownMenu;
  Overlay Runtime also owns Select positioning and dismissal. Fixes cover zoomed
  positioning, controlled dismissal and disabled/readonly visibility and ARIA state.
- Vue terminal Surface, Line, Transcript and Prompt, semantic theme roles, readable
  light prompt/cursor colors, Maple webfont loading and transcript reflow following.
- Vue StatCard, Timeline and StepFlow presentation components and public types.
- Shared control sizing at a normal root size; Dock grouping/proportions, themed
  number-input steppers, Badge sizes/colors, Skeleton frost and unified Tooltip contour.
- Glass Runtime live-backdrop directional edges, theme-aware gain, optional native
  SVG displacement, context recovery and observer ownership cleanup.
- Motion list-reorder FLIP transitions.

Component maturity remains defined by the [contract matrix](component-contract-matrix.md).
Forms and overlays retain Consumer Validation status where real-consumer acceptance
is incomplete. Terminal/presentation additions were Vue-only in this release;
later React parity and `UiTerminalEcho` source additions are not included in npm 0.3.0.

## Release verification

CI and Release use the same reusable verification workflow: Linux release quality,
three Linux browser shards, Windows quality and keyboard/overlay/theme interactions.
Changeset parsing uses the Changesets parser; private-only targets, unknown workspace
packages and malformed records fail before release mode selection and in PR quality checks.

After publication, `bun run verify:published` checks every exact version and `latest`
tag, published internal ranges and official tarball origins. It waits up to five
minutes for registry metadata and tarballs to propagate, polling every 10 seconds.
Authentication and package-content failures still fail immediately. It installs all eight
packages from npm without local overrides, then reuses the package JS/CSS/TypeScript
smokes and verifies resolved internal dependency versions. Consumer-project upgrades
and their acceptance records are separate follow-up work.
