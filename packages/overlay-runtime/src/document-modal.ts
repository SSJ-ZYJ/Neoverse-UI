function isTopmostDocumentModal(dialog: HTMLDialogElement): boolean {
  const dialogs = dialog.ownerDocument.querySelectorAll(
    'dialog.ui-dialog[open], .ui-drawer__host[data-open="true"] > dialog.ui-drawer[open]',
  );
  return dialogs.item(dialogs.length - 1) === dialog;
}

function hasOpenNestedPopover(dialog: HTMLDialogElement): boolean {
  return (
    dialog.querySelector(
      ':is(:popover-open, .ui-overlay-panel--fallback-open, .ui-select__popover--fallback-open)',
    ) !== null
  );
}

/** Route modal keys to the active modal, not to a higher-layer external control. */
export function ownsDocumentModalKeyboard(dialog: HTMLDialogElement): boolean {
  const document = dialog.ownerDocument;
  return (
    dialog.open &&
    (document.activeElement === document.body || dialog.contains(document.activeElement)) &&
    isTopmostDocumentModal(dialog) &&
    !hasOpenNestedPopover(dialog)
  );
}
