---
'@neoverse-ui/vue': patch
'@neoverse-ui/react': patch
---

Return a SegmentedControl's roving tab stop to its checked option when focus leaves the group.

An externally controlled value change while focus was elsewhere left `tabindex="0"` on the previously focused option, so Tab entered the radiogroup on an unchecked segment. Clearing the focus candidate on `focusout` keeps the tab stop on the checked option without changing in-group arrow-key behavior.