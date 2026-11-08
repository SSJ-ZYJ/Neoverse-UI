---
'@neoverse-ui/glass-runtime': patch
---

Keep scroll repaints that the frame cap defers instead of discarding them.

The fixed rim canvas is painted in viewport coordinates, so a scroll frame that
the ~60 fps cap skipped was never rescheduled once the gesture stopped. The rim
stayed at the previous offset, detached from its surface on high-refresh
displays and after a single programmatic scroll. A deferred frame now stays
pending and paints on the next frame that clears the interval; resting scenes
still stop reserving frames.