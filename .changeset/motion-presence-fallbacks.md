---
'@neoverse-ui/motion': minor
'@neoverse-ui/tokens': patch
---

Add four presence presets and give every preset a declared fallback.

`bloom` grows out of a blurred field, `haze` pulls focus out of a heavier fog
over the expressive duration, `sway` lands slightly tilted, and `spring` travels
a short distance on a curve that passes its endpoint once. The engine now
transitions the individual `rotate` property alongside `opacity`, `translate`,
`scale` and `filter`, so exits return along the same tilted path; the enter frame
pins `rotate` to `0deg`, which leaves elements without their own rotation
unchanged. Tokens add `--neoverse-motion-easing-spring`, the bloom and haze blur
radii, the sway angle, and the fallback scales the blur presets use when the
filter pass is unavailable.

`data-neoverse-motion-fallback` (`presenceFallbackAttribute`) selects a declared
profile on any ancestor: `no-filter` drops the blur passes and keeps the arrival
through scale, `fade-only` reproduces an engine without individual transform
properties. `@supports not (filter: blur(1px))` applies the same `no-filter`
values automatically, and the Design Lab's Presence specimen switches between
profiles so the fallback is visible rather than described.
