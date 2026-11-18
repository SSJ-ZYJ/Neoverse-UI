---
'@neoverse-ui/overlay-runtime': patch
'@neoverse-ui/vue': patch
'@neoverse-ui/react': patch
---

Release keyboard focus when a manual anchored overlay closes. Firefox leaves focus inside a hidden
`popover="manual"` panel, so a dismissed context menu kept a menu row focused off-screen; the runtime
now returns focus to the configured owner, then the trigger, then the element that held focus before
the panel opened, and blurs the closed row when none of them applies. `AnchoredOverlayOptions` gains
`previousFocus`, and both adapters supply it.
