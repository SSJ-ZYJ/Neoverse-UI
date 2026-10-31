# @neoverse-ui/glass-runtime

Shared optional directional Aurora Glass (极光玻璃) edges for Neoverse UI. Aurora Glass is the single shared glass material; its Light / 轻薄, Standard / 标准, and Immersive / 厚实 tiers share the same name. Obtain display labels from `glassMaterial` in `@neoverse-ui/tokens`; see [material standards](../../docs/material-standards.md). Package and renderer identifiers remain stable.

Light restores the 0.2.0 directional edge: the shader combines theme accent
colours, varies chroma with effective opacity, and caps fragment alpha at 0.34.
The light canvas uses normal composition and the release's WebGL blend factors;
large surfaces use edge opacities 0.46 / 0.5 / 0.54. Chroma and gain remain
optional multipliers, both defaulting to 1 in light mode.

Light keeps that mint-to-indigo direction but caps its cool excess: 72% of the
blue lead over the red/green content is trimmed, so the right catch stays cool
without the release's threefold margin that read as a blue band on pale pages.
The cap applies to light surfaces only; dark composition is unchanged.

This is a translucent, theme-coloured highlight composited over the backdrop,
not a sampled or displaced image of the background. Its apparent colour and
contrast depend on both the theme accents and the pixels underneath. Dark
retains its overlay response. Both themes share one canvas; CSS continues to
own the body tint, blur and shadows.

Opacity, clipping and overlay occlusion still apply. Light follows the 0.2.0
edge profile for controls and surfaces; dark buttons retain their focused
catches. Reduced transparency disables the renderer. The CSS fallback uses
alpha-only gradient masks and backdrop brightness. Native SVG displacement
remains an explicit alternative through `backend: 'native'` (Playground:
`?glass=native`).

Animation tracking redraws moving edges and occluders. Background-position-only
effects stay in CSS; transformed or fading descendants also stay in CSS when
their nearest Glass surface isolates and clips both axes and they contain no
nested Glass. Unknown effects remain tracked. Hidden subtrees do not sustain a
frame loop; visibility and clipping mutations trigger reevaluation, including
animations that are already running. These rules do not change the edge shader.

The 0.2.0 reference test checks the released light edge samples on middle grey
and the dark response on grey and pale backdrops. Runtime tests cover theme
switching, canvas reuse and unchanged body blur; live-canvas tests exercise the
different light and dark composition models against changing background pixels. The grey backdrop case also bounds how far blue may lead the green and red content, so the cool edge cannot regress into a cast.

```sh
bun add @neoverse-ui/glass-runtime
```

```ts
import { createGlassRenderer } from '@neoverse-ui/glass-runtime';

const renderer = createGlassRenderer();
renderer.mount();
```

For material contracts and runtime guidance, see the [Neoverse-UI repository](https://github.com/SSJ-ZYJ/Neoverse-UI).
