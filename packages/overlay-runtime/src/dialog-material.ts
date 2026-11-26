const materialAttribute = 'data-neoverse-material';
const scopedModeProperty = '--neoverse-dialog-material-mode';
const materialChanges = { attributeFilter: [materialAttribute] };
const ancestryChanges = { ...materialChanges, childList: true };

function setMaterialAttribute(element: Element, value: string | null) {
  if (element.getAttribute(materialAttribute) === value) return;
  if (value === null) element.removeAttribute(materialAttribute);
  else element.setAttribute(materialAttribute, value);
}

/** Carry the source's CSS-resolved material to a dialog and scrim portaled together. */
export function bridgeDialogMaterialScope(source: HTMLElement, dialog: HTMLDialogElement) {
  const host = dialog.parentElement;
  const destination = host?.parentElement;
  const view = dialog.ownerDocument.defaultView;
  if (!host || !destination || !view) return;

  const readMode = (element: Element) =>
    view.getComputedStyle(element).getPropertyValue(scopedModeProperty).trim();
  const sync = () => {
    // Let the same CSS scope validate an explicit panel override at the source.
    setMaterialAttribute(source, dialog.getAttribute(materialAttribute));
    const mode = readMode(source);
    setMaterialAttribute(host, mode && mode !== readMode(destination) ? mode : null);
  };
  const observer = new view.MutationObserver((records) => {
    if (records.some((record) => record.type === 'childList')) observeAncestry();
    sync();
  });
  function observeAncestry() {
    observer.disconnect();
    observer.observe(dialog, materialChanges);
    for (let parent = source.parentNode; parent; parent = parent.parentNode) {
      observer.observe(parent, ancestryChanges);
    }
  }

  sync();
  observeAncestry();
  return () => observer.disconnect();
}
