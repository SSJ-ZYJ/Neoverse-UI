---
'@neoverse-ui/tokens': patch
'@neoverse-ui/tailwind': patch
---

Add a shared compact floating elevation for form controls, disclosures and the
table. `--neoverse-shadow-float` combines a close contact layer with a short
ambient falloff in both themes, and the Input, Textarea, Select, Disclosure and
UiTable recipes alias it alongside their existing edge and Light-tier bloom.
Choice plates keep the smaller shared control elevation; button, navigation and
segmented-control shadows are unchanged.
