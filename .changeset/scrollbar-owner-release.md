---
'@neoverse-ui/overlay-runtime': patch
---

Make a native scrollbar owner release idempotent.

`acquireNativeScrollbarHiding()` now returns a release function that ignores repeated calls. Previously a duplicate unmount could decrement the shared reference count twice and drop the `ui-scrollbar-target` class while another `UiScrollbar` was still mounted.
