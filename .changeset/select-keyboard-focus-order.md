---
'@neoverse-ui/react': patch
---

Keep Select keyboard entry focus reliable. ArrowDown and ArrowUp now retry the
option focus across animation frames until it sticks, instead of racing the
panel's `allow-discrete` display flip, so reopening a panel always lands on the
selected option.
