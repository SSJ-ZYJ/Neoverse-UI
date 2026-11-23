---
'@neoverse-ui/tokens': patch
'@neoverse-ui/tailwind': patch
---

Make the interface title scale fixed and strictly ordered. `--neoverse-typography-title-lg-size` is now `--neoverse-font-size-xl` (20px) instead of a fluid clamp that collapsed to 16px below 1032px and fell under `title-md` below 1161px, and `--neoverse-typography-title-sm-size` aliases `--neoverse-font-size-md`. `.ui-dialog__title` becomes the `title-md` consumer, replacing its direct `--neoverse-font-size-lg` reference.
