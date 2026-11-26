---
"@neoverse-ui/motion": minor
"@neoverse-ui/glass-runtime": patch
---

Add the `material-fade` appearance snapshot kind for whole-page material switches and allocate Aurora Glass optics on demand. A page whose automatic surfaces all resolve to Solid now mounts no canvas, WebGL context, shader program or buffer; the shared renderer activates when a Glass surface appears and releases the context, native SVG filters and cached maps after the last one disappears. `mount`, `refresh`, `suspend`, `resume` and `destroy` keep their existing contract.