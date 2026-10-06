# Migrating from 0.1.x to 0.2.0

Neoverse UI 0.2.0 intentionally removes transitional aliases and compatibility wrappers. Consumers should migrate to the canonical APIs below before switching package versions. No compatibility layer is provided.

## Package-level breaking changes

### @neoverse-ui/motion

The semantic Motion API is now role-based.

| 0.1.x | 0.2.0 |
| --- | --- |
| `motionTransitions` | `motionRoles` |
| `MotionTransition` | `MotionRole` |
| `micro` | `feedback` |
| transition `property` fields | removed; component CSS owns transitioned properties |

The canonical durations also changed:

| Token | 0.1.x | 0.2.0 |
| --- | ---: | ---: |
| `fast` | 180ms | 140ms |
| `standard` | 360ms | 240ms |
| `expressive` | 760ms | 420ms |

Use the `feedback`, `state`, and `spatial` roles instead of reconstructing component transitions in consumer code.

0.2.0 also makes Motion the single owner of enter/exit presence and page-change choreography. The additive `enter` / `exit` roles, `presenceVariants`, framework Presence adapters, and `startViewTransition()` all consume the same Motion tokens; consumers should not duplicate those durations or keyframes locally.

Vue exports `UiPresence`, `presence`, and `staggerStyle`; React exports `UiPresence` and `useUiPresence`. `startViewTransition(update, options?)` can use Particle Dissolve (`particleDissolvePresets`), View Transition crossfade, or a direct update when reduced motion or browser support requires it. Particle capture is optional; the synthetic pipeline does not reproduce outgoing content. See the [Motion guide](../packages/motion/README.md) for the public options and fallback contracts.

### @neoverse-ui/tokens

Component token names now have one canonical TypeScript namespace under `cssVariables.components`.

Remove uses of:

- `cssVariables.control`
- `cssVariables.scrollbar`
- `cssVariables.skeleton`

Use the corresponding entries under `cssVariables.components`. `cssVariables.components.segmentedControl.focusShadow` is also removed; segmented controls use the shared focus-ring contract instead of stacking a component-specific shadow on top of `:focus-visible`.

Typography is now a semantic family + scale model. Direct CSS variable migrations are:

| 0.1.x | 0.2.0 |
| --- | --- |
| `--neoverse-typography-display-*` | `--neoverse-typography-display-lg-*` |
| `--neoverse-typography-heading-*` | `--neoverse-typography-display-md-*` |
| `--neoverse-typography-subtitle-*` | `--neoverse-typography-title-lg-*` |
| `--neoverse-typography-body-*` | `--neoverse-typography-body-md-*` |
| `--neoverse-typography-label-*` | `--neoverse-typography-label-md-*` |

The TypeScript map is exposed through `cssVariables.typography.family` and `cssVariables.typography.scale`.

The Glass material scale contains exactly three presets:

- `subtle`
- `elevated`
- `immersive`

The `card` Glass material and all `--neoverse-material-glass-card-*` variables are removed. Standard cards use the elevated Glass material.

Theme selection also has one canonical root contract. Replace root `.light` / `.dark` theme classes with:

```html
<html data-theme="light">
<html data-theme="dark">
<html data-theme="system">
```

### @neoverse-ui/tailwind

The removed Glass aliases are not emitted by the public CSS bundle:

- `.material-glass-card`
- `.glass-card`
- `.glass-surface`

Use `.material-glass-subtle`, `.material-glass-elevated`, or `.material-glass-immersive`. Prefer framework `surface` props over attaching implementation classes directly.

The old typography utilities remain mapped to the equivalent canonical semantic scales for utility-level source stability, but direct token consumers should migrate to the 0.2.0 token names above.

### @neoverse-ui/vue

`UiGlassSurface` is removed. Use `UiSurface` or `UiCard`:

```vue
<!-- 0.1.x -->
<UiGlassSurface variant="elevated">
  ...
</UiGlassSurface>

<!-- 0.2.0 -->
<UiSurface surface="glass-elevated">
  ...
</UiSurface>
```

For semantic cards:

```vue
<UiCard surface="glass-elevated">
  ...
</UiCard>
```

The following exports are removed:

- `UiGlassSurface`
- `GlassSurfaceProps`
- `GlassSurfaceVariant`
- `glassVariantToSurface`

`SurfacePreset` no longer accepts `glass-card`. Replace it with `glass-elevated`.

`UiControlSurface` no longer accepts the historical `variant` prop. Use `surface`.

`UiCard` now defaults to `surface="glass-elevated"` and owns its canonical card geometry. Consumers should not recreate its padding or radius contract around `UiSurface`.

When `UiAction as="button"` is used, it now follows native button semantics: `type` is supported, `disabled` is forwarded as the native disabled attribute, and `aria-disabled` is reserved for non-button targets.

New `UiSurface` controls such as `glassNesting` and `contentOverflow` are additive and should be used only when a composition intentionally owns those policies.

### @neoverse-ui/glass-runtime

The renderer discovers only the three canonical `material-glass-*` presets. Historical `glass-card`, `glass-surface`, and old `--glass-*` edge fallbacks are removed.

Nested Glass is no longer flattened implicitly. Independent Glass surfaces keep their own material plane; only an element explicitly marked with the framework `glassNesting="inherit"` contract borrows the parent Glass plane.

## New public packages

`@neoverse-ui/react` and `@neoverse-ui/giscus-theme` are public package boundaries in the 0.2.0 release line. They are additions rather than 0.1.x migration aliases.

## Consumer migration order

1. Replace removed Motion, Token, Glass, and Vue APIs in application source.
2. Replace `glass-card` with `glass-elevated` where the element is a semantic card.
3. Move theme selection to `data-theme`.
4. Run the consumer's typecheck and build before changing package versions.
5. Upgrade all directly consumed `@neoverse-ui/*` packages together when validating the 0.2.0 release candidate.

Do not add local compatibility aliases in consumer projects. If a migration reveals a missing canonical capability, fix that capability in Neoverse UI instead.
