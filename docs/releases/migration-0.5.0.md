# Migrating to 0.5.0 (Three-Material Architecture)

Status: adopted

[Chinese](../zh-CN/releases/migration-0.5.0.md)

The 0.5.0 release line completes the three-material architecture across Solid,
Frosted, and Aurora Glass. Upgrade Tokens, Tailwind, Motion, Overlay Runtime,
Glass Runtime, and the framework adapter together. Packages have independent
versions: use the coordinated release plan, not `0.5.0` for every dependency.

## Material scope and breaking API changes

| Removed or changed | Replacement |
| --- | --- |
| `MaterialMode` | `Material` (`'glass' \| 'solid' \| 'frosted'`) from `@neoverse-ui/tokens` |
| `MaterialSurfaceRole` | `SurfaceRole` from `@neoverse-ui/tokens` |
| `surfaceClasses`, `materialSurfacePresets` | `getSurfaceClass(selection, role)` from `@neoverse-ui/tokens`, `@neoverse-ui/vue`, or `@neoverse-ui/react` |
| Automatic `.material-auto`, `.material-solid-*`, `.material-glass-*` selectors | Semantic role markers (`.material-role-*`) resolved under `data-neoverse-material` scopes |
| `surface="chrome"`, `.ui-surface-chrome`, `--neoverse-control-chrome-*`, `--neoverse-effect-floating-chrome-*` | Explicit `surface="glass-subtle"` or automatic `surface="auto"` with `--neoverse-control-surface-*` |
| Hardcoded material option arrays | `materials`, `defaultMaterial`, `materialAttribute`, `isMaterial`, and `materialCatalog` from `@neoverse-ui/tokens` |

Set `data-neoverse-material="solid" | "frosted" | "glass"` on `<html>`, a subtree, or an individual surface. Omitting the attribute defaults to Aurora Glass. Unknown values do not block an ancestor scope.

## Migrating components from explicit Glass to automatic material

1. Replace `surface="glass-elevated"` or `surface="glass-subtle"` with `surface="auto"` (or omit `surface`) on `UiButton`, `UiCard`, `UiControlSurface`, `UiSegmentedControl`, `UiDock`, and `UiTerminalSurface` whenever the component should follow the document or subtree material scope.
2. Keep explicit `surface="glass-*"`, `surface="frosted"`, `surface="solid"`, `surface="elevated"`, or `surface="none"` only when a surface must stay pinned regardless of the surrounding material scope.
3. Remove consumer CSS workarounds that read Glass-only variables (such as `--neoverse-material-background-fallback` or `--neoverse-material-glass-subtle-filter`) on surfaces that now switch to Solid or Frosted, or guard those rules to Glass scopes.

## Build, stylesheet, and local sync compatibility

- **Local `file:` consumer sync path**: the shared synchronization CLI moved from `scripts/sync-consumer.ts` to `scripts/sync/sync-consumer.ts`. Update consumer scripts (such as `Neoverse-Slides` `apps/web/scripts/sync-neoverse-ui-styles.ts`) to invoke `../Neoverse-UI/scripts/sync/sync-consumer.ts`.
- **CSS cascade layer order**: keep `@layer neoverse` after Tailwind `components` and `utilities` (for example `@layer properties, theme, base, components, utilities, neoverse;`). Avoid matching internal `@neoverse-ui/tailwind/dist/index.css` file paths or ordering `neoverse` ahead of `components` and `utilities`.
- **Package versus checkout mode**: tarball or registry acceptance must resolve the installed public entries without aliases to a sibling checkout's `dist`. Use the local synchronization command only for checkout-relative `file:` package directories; copy a static stylesheet, when needed, from the installed public `@neoverse-ui/tailwind/index.css` entry.
- **Nuxt Autoprefixer**: `@neoverse-ui/tailwind` ships pre-prefixed CSS using modern `@supports` capability checks for Frosted and Glass. Disable Nuxt's built-in Autoprefixer (`postcss: { plugins: { autoprefixer: false } }`) if PostCSS reports a parse error on `@supports`.
- **Optional Glass Runtime**: mounting `@neoverse-ui/glass-runtime` on a pure Solid or Frosted page allocates zero canvases, WebGL contexts, shader programs, or buffers. It activates automatically only when an eligible Glass surface is drawn, pauses while `document.hidden` is true, and releases GPU resources once the last eligible Glass surface disappears.

## Material maturity

`contracts/component-matrix.json` keeps `materialMaturity` at `glass: "existing"`, `solid: "existing"`, and `frosted: "experimental"`. Frosted uses native CSS `backdrop-filter` with automatic `@supports`, `prefers-reduced-transparency: reduce`, and `forced-colors: active` degradation. Engineering verification does not promote Frosted: real downstream and cross-platform evidence, visual acceptance, and the final release gate are all required.

## Verification order

1. Update all directly consumed `@neoverse-ui/*` packages together and refresh the lockfile or local sync output.
2. Run the consumer's typecheck and production build on Windows and Linux.
3. Verify SSR HTML and client hydration under `solid`, `frosted`, and `glass` scopes with zero hydration warnings.
4. Check navigation, forms, overlays, terminals, and page backdrops in Light and Dark themes, plus Reduced Motion, Reduced Transparency, and Forced Colors.
5. Confirm that pure Solid and pure Frosted routes create zero `[data-neoverse-glass-renderer-canvas]` elements.
