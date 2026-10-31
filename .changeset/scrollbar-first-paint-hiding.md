---
'@neoverse-ui/tailwind': patch
'@neoverse-ui/vue': patch
'@neoverse-ui/react': patch
---

Hide the document scrollbar on the first paint for server-rendered `UiScrollbar` rails. The rail now publishes `data-hide-native` in markup, and the shipped stylesheet removes the native bar whenever such a rail is in the document, gated by `@media (scripting: enabled)`. Previously the native bar stayed visible until the ownership class was added on mount, so reloading a scrollable page painted a native bar and then swapped it for the immersive rail, shifting layout by the native scrollbar width.

Client-only renders keep the existing post-mount path through `acquireNativeScrollbarHiding`, and pages without scripting keep native bars. `hideNative={false}` still opts out. Consumers that want the first-paint guarantee must render the rail during SSR rather than behind a client-only gate.
