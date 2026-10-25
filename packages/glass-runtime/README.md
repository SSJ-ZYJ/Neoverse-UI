# @neoverse-ui/glass-runtime

Shared optional directional Aurora Glass (极光玻璃) edges for Neoverse UI. Aurora Glass is the single shared glass material; its Light / 轻薄, Standard / 标准, and Immersive / 厚实 tiers share the same name. Obtain display labels from `glassMaterial` in `@neoverse-ui/tokens`; see [material standards](../../docs/material-standards.md). Package and renderer identifiers remain stable.

The renderer reuses the 0.2.0 directional RGB response: left catches favour
cyan/green and right catches favour blue/violet, with the released normal-based
corner and fringe calculations. Preserve the full RGB contribution, including its
neutral component; minimum-channel subtraction and peak normalization change the
released colour balance. Shared chroma roles retain the release's nearly neutral
dark response independently of brighter edge opacity.
A scalar-only gain loses this directional colour and is not the Aurora Glass contract.

The shared WebGL canvas encodes each channel response as (1 + g_rgb) / 2.
CSS overlay produces C_backdrop + g_rgb * min(C_backdrop, 1 - C_backdrop).
At unit exposure the response matches the released blend at middle grey and follows highlight
headroom on pale backgrounds. Black and zero source channels stay zero. Actual DOM,
gradients, images, canvas and video remain live inputs; no backdrop screenshot
or ancestor CSS reconstruction is required. The response consumes shared theme
colour roles instead of a second hard-coded palette.
The shared edge gain is 2.5 in light mode and 1 in dark mode, applied after alpha
limiting so pale cards and buttons receive the stronger exposure consistently.

Opacity, clipping and overlay occlusion still apply. Button highlights concentrate
at upper-left and lower-right, with quieter continuous vertical sides. Base fill,
blur and button tone are independent of the edge response. Reduced transparency
disables the renderer. The CSS fallback uses alpha-only gradient masks and live
backdrop brightness. Native SVG displacement remains an explicit alternative
through backend: 'native' (Playground: ?glass=native).

The 0.2.0 reference test compares channel-gain ordering at the released four sides
and four rounded corners in light and dark modes; a neutral brightness mask fails.
The live-canvas regression calibrates per-channel gains and checks source changes,
black, zero channels and final clipping independently. Button tests guard the two
dominant lit corners and unchanged central frost. Coverage checks include 32/40/48px
rectangles and circles on muted and pale backdrops. Circular catches follow the
edge normal so bounding-box corner distances cannot truncate their arcs.

```sh
bun add @neoverse-ui/glass-runtime
```

```ts
import { createGlassRenderer } from '@neoverse-ui/glass-runtime';

const renderer = createGlassRenderer();
renderer.mount();
```

For material contracts and runtime guidance, see the [Neoverse-UI repository](https://github.com/SSJ-ZYJ/Neoverse-UI).
