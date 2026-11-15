# Migrating from 0.3.0 to 0.3.1 / 0.4.0

Status: adopted

[Chinese](../zh-CN/releases/migration-0.3.1.md)

The latest published baseline is the 0.3.1 / 0.4.0 coordinated release from 2026-11-05. Package versions remain independent; `0.3.1` is a release label, not a version shared by every package.

| Package | Previous | Current |
| --- | --- | --- |
| Tokens, Tailwind, Overlay Runtime | 0.3.0 | 0.3.1 |
| Vue, React | 0.3.0 | 0.4.0 |
| Motion, Glass Runtime | 0.2.1 | 0.2.2 |
| Giscus Theme | 0.2.0 | 0.2.0 (unchanged) |

Upgrade adapter JavaScript, Tokens and compiled Tailwind CSS together. Vue still requires `>=3.5.0 <4.0.0`; React requires `>=19.0.0 <20.0.0`.

Consumers upgrading from 0.2.x must first apply the [0.3.0 migration requirements](migration-0.3.0.md).

## Removed scrollbar names

| Removed | Replacement |
| --- | --- |
| `--neoverse-scrollbar-immersive-track-border-width` | `--neoverse-scrollbar-immersive-rail-inset` |
| `cssVariables.components.scrollbar.immersive.trackBorderWidth` | `.railInset` in the same map |
| `--neoverse-effect-rail-thumb-glow`, `--neoverse-scrollbar-immersive-thumb-glow` | Remove glow overrides; tune shared thumb ink and background values |
| `cssVariables.components.scrollbar.immersive.thumbGlow` | Remove the lookup; tune `.thumb`, `.thumbHover` or background entries |
| `--neoverse-effect-rail-thumb-hover-shadow`, `--neoverse-scrollbar-overlay-thumb-hover-shadow` | Remove outer-shadow overrides; tune thumb ink and overlay widths |
| `cssVariables.components.scrollbar.overlay.thumbHoverShadow` | Remove the lookup; tune immersive ink or overlay width entries |

`--neoverse-scrollbar-overlay-thumb-width` and its hover counterpart now drive both rails. Native thumb border widths derive from those values. Tokens also exports `cssVariables.components.scrollbar.immersive.thumbHoverBorderWidth` and `cssVariables.components.controlSurface.trailingPadding`.

## Shared elevation

`--neoverse-shadow-float` is the shared elevation for Input, Textarea, Select, Disclosure and Table. Button, navigation and segmented-control shadows are unchanged. Consumers that overrode those controls' shadows should compare the combined contact and ambient layers against their own surfaces.

## Scrollbar first paint

The first-paint scrollbar guarantee requires server-rendered `UiScrollbar` markup and the shipped stylesheet. Client-only rails use the mount-time path. `hideNative={false}` opts out, and pages without scripting retain native bars.

## Material blend token

`--neoverse-material-edge-refraction-blend` supplies the dark theme's `overlay` value for consumer-owned refraction passes. The variable does not change the blend mode of shipped components. Painted strokes require the explicit attribute and exclude button surfaces; see [material standards](../architecture/material-standards.md).

## Verification order

1. Inventory directly consumed packages, lockfile versions, root overrides and copied CSS.
2. Upgrade all directly consumed UI packages together; refresh the lockfile and regenerated vendor CSS.
3. Run the consumer's typecheck and production build.
4. Review light, dark and system themes at desktop and mobile widths; check scrollbars, overlays, terminal contrast, forms, reduced motion and reduced transparency.
5. Record real consumer evidence before promoting a component's maturity.

Versioning and publication remain release-owner operations. This guide does not run Changesets, publish packages or change consumer dependency sources.
