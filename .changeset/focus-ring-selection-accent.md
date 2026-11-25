---
'@neoverse-ui/tokens': patch
'@neoverse-ui/tailwind': patch
---

Keep the default keyboard focus ring on the primary azure accent in both themes, and retune it locally only where the control's own accent is mint. A blue Button keeps a blue ring, while a selected SegmentedControl or navigation item now focuses with the same green accent as its label instead of a blue outline.
