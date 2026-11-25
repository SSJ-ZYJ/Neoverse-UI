---
'@neoverse-ui/motion': minor
---

Add `animateDisclosure()` for mounted disclosure regions.

The helper animates one region between zero and its natural height on the `state` role, applies `hidden`, `inert`, and `aria-hidden` while closed, continues from the height currently on screen when reversed, and restores inline `height`/`overflow` when the run settles. Reduced motion, a missing duration token, or no Web Animations API applies the target state immediately.

The Design Lab uses it for the Explorer's specimen leaf lists, so expanding and collapsing a module no longer snaps, and the Motion module's Disclosure motion specimen demonstrates the primitive.