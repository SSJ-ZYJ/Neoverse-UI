---
'@neoverse-ui/glass-runtime': patch
---

Keep an Aurora Glass refresh proportional to the surfaces the fixed canvas can
show. Offscreen surfaces are skipped before computed style and the ancestor
opacity chain are resolved, the opacity chain is resolved once per frame, and
repeated occlusion hit tests reuse one per-frame probe cache. Interaction latency
on pages with many form controls and tables improves, most visibly in WebKit,
where a document-wide refresh previously resolved style for every surface.
