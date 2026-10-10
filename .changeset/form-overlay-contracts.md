---
'@neoverse-ui/tokens': minor
'@neoverse-ui/tailwind': minor
'@neoverse-ui/overlay-runtime': minor
'@neoverse-ui/vue': minor
'@neoverse-ui/react': minor
'@neoverse-ui/glass-runtime': patch
---

Add shared Checkbox, RadioGroup, Switch, Field, Popover and DropdownMenu contracts across Vue and React, including validation and readonly states. Field exposes explicit control bindings for accessible descriptions, messages and native required/disabled state.

Require Vue 3.5 or later to match the SSR-stable useId API used by Field and choice controls.

Introduce the framework-independent Overlay Runtime and reuse it for Select positioning and dismiss behavior. Ship the corresponding form/overlay tokens and consumer CSS, validate public exports from packed packages, and harden Glass context recovery and observer cleanup.

Keep controlled overlay state authoritative when a parent rejects a dismiss request, and capture the mounted React panel for listener cleanup.

Use native checkbox checked state for React Switch accessibility so uncontrolled form resets cannot leave stale aria-checked state.
