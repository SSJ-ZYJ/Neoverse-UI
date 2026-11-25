---
'@neoverse-ui/motion': patch
'@neoverse-ui/tailwind': patch
---

Land the SegmentedControl thumb on its committed option while a theme or locale view transition owns the page. The incoming snapshot now carries the new selection, so rapidly switching the theme icons no longer uncovers the previous position and slides the thumb back.
