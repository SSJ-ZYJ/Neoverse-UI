---
"@neoverse-ui/glass-runtime": patch
"@neoverse-ui/motion": patch
"@neoverse-ui/overlay-runtime": patch
"@neoverse-ui/react": patch
"@neoverse-ui/vue": patch
---

Fix native Node.js ESM imports for Glass Runtime, Motion, Overlay Runtime, and React, including React server rendering. The packages now emit explicit relative JavaScript paths. Vue publishes bundled declarations so consumers can resolve its component types with TypeScript's Node16 and NodeNext module resolution without skipping library checks. Public import and stylesheet paths are unchanged.
