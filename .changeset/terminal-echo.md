---
'@neoverse-ui/react': minor
'@neoverse-ui/vue': minor
'@neoverse-ui/tailwind': minor
---

Add `UiTerminalEcho` to Vue and React for recorded commands, with plain-text `text`, prompt `symbol` and `segments`, an `error` state, and custom segment rendering. Export Vue `TerminalEchoProps` and React `UiTerminalEchoProps`.

Add shared `.ui-terminal-echo` styling in Tailwind, also distributed through the Vue and React stylesheets. Recorded commands reuse prompt context and terminal tokens without an input, caret or focus target, while retaining text selection, wrapping and forced-colors support. This adds a read-only display component; it does not replace or change the live `UiTerminalPrompt` API.
