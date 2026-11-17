# Business interaction baseline and ContextMenu request audit

Status: historical
Date: 2026-11-16

## Current implementation

Neoverse-UI now has shared Vue and React `UiDialog` and `UiToast` components, token-owned materials, Design Lab specimens, matrix/parity contracts, and browser tests. Both remain `consumer-validation`; no real XCA-Portal consumer validation or release visual-gate promotion is claimed. `UiToast` is a single controlled message, not a global toast queue.

## ContextMenu request mismatch

`contracts/component-requests/CR-20261108-9C1D88B5.json` was `reported` at audit time despite the shared component existing and XCA-Portal consuming it in `app/features/context-menu/components/ContextMenuHost.vue`. The original acceptance criteria required `popover=auto`. The actual Vue and React `UiContextMenu` use **manual popovers** for the parent and nested submenu, which must remain open together so submenu interaction does not dismiss the parent. Portal integration coverage is in `tests/e2e/site/context-menu.spec.ts` and `context-menu-panel.spec.ts`.

Do not mark the request `delivered` without reviewing and reconciling its original acceptance criteria against the intentional two-panel design, then rerunning the relevant consumer tests. Record resolution through the request CLI rather than directly editing the CR. Do not implement a second context menu just to satisfy the old record.

## Resolution (2026-11-17)

- The acceptance criterion now requires `popover=manual` for the parent and nested submenu so they can stay open together; the `popover=auto` expectation was replaced because it contradicts the real consumer interaction and the public submit API only appends criteria.
- Code evidence: `packages/vue/src/UiContextMenu.vue:387,451` and `packages/react/src/overlays.tsx:711,785`; UI unit suites (Vue 107, React 63) and the context-menu browser scenarios pass.
- Consumer evidence: XCA-Portal `ContextMenuHost.vue`; `tests/e2e/site/context-menu.spec.ts` and `context-menu-panel.spec.ts` 23 passed, covering the terminal and home-title callers, submenus, both themes, reduced motion and forced colors.
- Closed through the request CLI with the resolution above. `UiContextMenu.consumer` is now `validated` in the component matrix; React consumer validation remains pending.
