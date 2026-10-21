# @neoverse-ui/overlay-runtime

## 0.3.0

### Minor Changes

- bf1b739: Add shared Checkbox, RadioGroup, Switch, Field, Popover and DropdownMenu contracts across Vue and React, including validation and readonly states. Field exposes explicit control bindings for accessible descriptions, messages and native required/disabled state.
  
  Require Vue 3.5 or later to match the SSR-stable useId API used by Field and choice controls.
  
  Introduce the framework-independent Overlay Runtime and reuse it for Select positioning and dismiss behavior. Ship the corresponding form/overlay tokens and consumer CSS, validate public exports from packed packages, and harden Glass context recovery and observer cleanup.
  
  Keep controlled overlay state authoritative when a parent rejects a dismiss request, and capture the mounted React panel for listener cleanup.
  
  Use native checkbox checked state for React Switch accessibility so uncontrolled form resets cannot leave stale aria-checked state.

### Patch Changes

- dd5f374: Correct fallback anchored-overlay coordinates when a translucent or filtered ancestor establishes the containing block for a fixed overlay. Preserve native Popover positioning and existing visual styles.
- 86416ac: Calculate anchored overlay placement with zoom-scaled rendered dimensions; keep Popover and DropdownMenu `aria-expanded` aligned with disabled visibility in Vue and React, and avoid focusing hidden menu items.
