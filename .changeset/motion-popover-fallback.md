---
'@neoverse-ui/motion': patch
---

Keep open fallback overlay and select panels at their visible resting state in browsers without the Popover API. Include the existing fallback-open classes in the presence selectors, using forgiving `:is()` so an unsupported `:popover-open` does not invalidate them, and retain reduced-motion timing for these panels.
