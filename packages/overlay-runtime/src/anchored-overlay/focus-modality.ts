const installedDocuments = new WeakSet<Document>();
const modalityByDocument = new WeakMap<Document, 'pointer' | 'keyboard'>();
const managedPointerOrigin = new WeakSet<HTMLElement>();

const modifierKeys = new Set(['Shift', 'Control', 'Alt', 'Meta']);
const focusableSelector = [
  'a[href]',
  'button:not(:disabled)',
  'input:not([type="hidden"]):not(:disabled)',
  'select:not(:disabled)',
  'textarea:not(:disabled)',
  'summary',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

type FocusVisibleOptions = FocusOptions & { focusVisible?: boolean };

/** Tracks whether the latest user input in `ownerDocument` came from a pointer or keyboard. */
export function installFocusModality(ownerDocument: Document | null | undefined): void {
  if (!ownerDocument || installedDocuments.has(ownerDocument)) return;
  installedDocuments.add(ownerDocument);

  ownerDocument.addEventListener(
    'pointerdown',
    () => {
      modalityByDocument.set(ownerDocument, 'pointer');
    },
    true,
  );

  ownerDocument.addEventListener(
    'keydown',
    (event) => {
      if (modifierKeys.has(event.key)) return;
      modalityByDocument.set(ownerDocument, 'keyboard');
      const active = ownerDocument.activeElement as HTMLElement | null;
      if (active !== null && managedPointerOrigin.has(active)) {
        if (typeof active.removeAttribute === 'function') {
          active.removeAttribute('data-neoverse-focus-origin');
        }
        managedPointerOrigin.delete(active);
      }
    },
    true,
  );

  ownerDocument.addEventListener(
    'focusout',
    (event) => {
      const target = event.target as HTMLElement | null;
      if (target !== null && managedPointerOrigin.has(target)) {
        if (typeof target.removeAttribute === 'function') {
          target.removeAttribute('data-neoverse-focus-origin');
        }
        managedPointerOrigin.delete(target);
      }
    },
    true,
  );
}

/** Records a pointer interaction synchronously before a synthetic click or toggle fires. */
export function markPointerModality(ownerDocument: Document | null | undefined): void {
  if (!ownerDocument) return;
  installFocusModality(ownerDocument);
  modalityByDocument.set(ownerDocument, 'pointer');
}

/** Reports whether focus moves in `ownerDocument` should show keyboard focus indicators. */
export function isKeyboardModality(ownerDocument: Document | null | undefined): boolean {
  if (!ownerDocument) return true;
  return modalityByDocument.get(ownerDocument) !== 'pointer';
}

/** Focuses `target` while aligning `data-neoverse-focus-origin` and `focusVisible` with input modality. */
export function focusElement(
  target: HTMLElement | null | undefined,
  options: { preventScroll?: boolean; modality?: 'auto' | 'keyboard' | 'pointer' } = {},
): void {
  if (!target || target.isConnected === false || typeof target.focus !== 'function') return;
  const doc = target.ownerDocument;
  if (doc && typeof doc.addEventListener === 'function') installFocusModality(doc);
  const modality =
    options.modality === 'keyboard' || options.modality === 'pointer'
      ? options.modality
      : isKeyboardModality(doc)
        ? 'keyboard'
        : 'pointer';

  if (modality === 'pointer') {
    if (typeof target.setAttribute === 'function') {
      target.setAttribute('data-neoverse-focus-origin', 'pointer');
    }
    managedPointerOrigin.add(target);
  } else if (managedPointerOrigin.has(target) && typeof target.removeAttribute === 'function') {
    target.removeAttribute('data-neoverse-focus-origin');
    managedPointerOrigin.delete(target);
  }

  target.focus({
    preventScroll: options.preventScroll ?? true,
    focusVisible: modality === 'keyboard',
  } as FocusVisibleOptions);
}

function isTabbable(element: HTMLElement, view: Window | null): boolean {
  if (element.tabIndex < 0 || element.hasAttribute('disabled')) return false;
  if (element.closest('[hidden], [inert], [aria-disabled="true"]')) return false;
  const style = view?.getComputedStyle(element);
  return style === undefined || (style.display !== 'none' && style.visibility !== 'hidden');
}

/** Keeps `Tab` and `Shift+Tab` inside a non-top-layer modal dialog container. */
export function trapModalTabKey(event: KeyboardEvent, container: HTMLElement): boolean {
  if (event.key !== 'Tab' || event.defaultPrevented) return false;
  const view = container.ownerDocument.defaultView;
  const tabbables = Array.from(container.querySelectorAll<HTMLElement>(focusableSelector)).filter(
    (element) => isTabbable(element, view),
  );
  const active = container.ownerDocument.activeElement;
  if (tabbables.length === 0) {
    event.preventDefault();
    focusElement(container, { modality: 'keyboard' });
    return true;
  }

  const first = tabbables[0] as HTMLElement;
  const last = tabbables[tabbables.length - 1] as HTMLElement;
  const focused =
    active !== null && typeof (active as HTMLElement).focus === 'function'
      ? (active as HTMLElement)
      : null;
  if (focused === null || !container.contains(focused) || focused === container) {
    event.preventDefault();
    focusElement(event.shiftKey ? last : first, { modality: 'keyboard' });
    return true;
  }
  if (event.shiftKey && focused === first) {
    event.preventDefault();
    focusElement(last, { modality: 'keyboard' });
    return true;
  }
  if (!event.shiftKey && focused === last) {
    event.preventDefault();
    focusElement(first, { modality: 'keyboard' });
    return true;
  }
  return false;
}
