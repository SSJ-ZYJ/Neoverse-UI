---
'@neoverse-ui/react': minor
'@neoverse-ui/vue': patch
---

Complete React adapters for the existing navigation, feedback, skeleton, terminal, presentation and scrollbar components. Dock now shares the ControlSurface navigation indicator and supports `navigationIndicator`. Both frameworks expose the same 35 components and Vue also exports `SkeletonVariant`.

Preserve terminal history readers when upward scrolling and a column resize happen together in Vue and React; explicit reading intent cancels pending tail following.
