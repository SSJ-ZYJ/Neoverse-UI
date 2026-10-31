---
'@neoverse-ui/react': minor
'@neoverse-ui/vue': minor
---

Add a Vue `UiTerminalSurface` `#header` slot and equivalent optional React `header` prop for consumer-owned window chrome. Custom content replaces only the shared header's contents, without duplicating fallback title, status or actions. The header element, material, padding, accessible surface label and body remain shared and unchanged; absent Vue slots and nullish React props retain the existing header.
