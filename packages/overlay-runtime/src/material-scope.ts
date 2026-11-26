const materialAttribute = 'data-neoverse-material';
const scopedMaterialProperty = '--neoverse-scope-material';
const materialChanges = { attributeFilter: [materialAttribute] };
const ancestryChanges = { ...materialChanges, childList: true };

function setMaterialAttribute(element: Element, value: string | null) {
  if (element.getAttribute(materialAttribute) === value) return;
  if (value === null) element.removeAttribute(materialAttribute);
  else element.setAttribute(materialAttribute, value);
}

/** Carry the invocation scope to a portaled host without moving its overlay. */
export function bridgePortalMaterialScope(
  source: HTMLElement,
  host: HTMLElement,
  panelOverride?: HTMLElement,
) {
  const view = host.ownerDocument.defaultView;
  if (!view) return;

  const sync = () => {
    // Let CSS validate an explicit panel override on the local invocation marker.
    if (panelOverride) setMaterialAttribute(source, panelOverride.getAttribute(materialAttribute));
    const material = view.getComputedStyle(source).getPropertyValue(scopedMaterialProperty).trim();
    setMaterialAttribute(host, material || null);
  };
  const observer = new view.MutationObserver((records) => {
    if (records.some((record) => record.type === 'childList')) observeAncestry();
    sync();
  });
  function observeAncestry() {
    observer.disconnect();
    if (panelOverride) observer.observe(panelOverride, materialChanges);
    else observer.observe(source, materialChanges);
    for (let parent = source.parentElement; parent; parent = parent.parentElement) {
      observer.observe(parent, ancestryChanges);
    }
  }

  sync();
  observeAncestry();
  return () => observer.disconnect();
}

/** Carry the invocation scope to a Dialog panel and its separate scrim. */
export function bridgeDialogMaterialScope(source: HTMLElement, dialog: HTMLDialogElement) {
  const host = dialog.parentElement;
  if (host) return bridgePortalMaterialScope(source, host, dialog);
}
