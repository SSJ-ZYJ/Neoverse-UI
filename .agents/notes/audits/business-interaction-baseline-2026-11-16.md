# Business interaction baseline and ContextMenu request audit

Status: historical
Date: 2026-11-16

## Current implementation

Neoverse-UI now has shared Vue and React `UiDialog` and `UiToast` components, token-owned materials, Design Lab specimens, matrix/parity contracts, and browser tests. Both remain `consumer-validation`; no real XCA-Portal consumer validation or release visual-gate promotion is claimed. `UiToast` is a single controlled message, not a global toast queue.

## ContextMenu request mismatch

`contracts/component-requests/CR-20261108-9C1D88B5.json` remains `reported` despite the shared component existing and XCA-Portal consuming it in `app/features/context-menu/components/ContextMenuHost.vue`. The original acceptance criteria require `popover=auto`. The actual Vue and React `UiContextMenu` use **manual popovers** for the parent and nested submenu, which must remain open together so submenu interaction does not dismiss the parent. Portal integration coverage is in `tests/e2e/site/context-menu.spec.ts` and `context-menu-panel.spec.ts`.

Do not mark the request `delivered` without reviewing and reconciling its original acceptance criteria against the intentional two-panel design, then rerunning the relevant consumer tests. Record resolution through the request CLI rather than directly editing the CR. Do not implement a second context menu just to satisfy the old record.
