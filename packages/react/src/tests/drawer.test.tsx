import { expect, spyOn, test } from 'bun:test';
import { Window } from 'happy-dom';
import { act, createRef } from 'react';
import { createRoot } from 'react-dom/client';
import { UiDrawer, type UiDrawerProps } from '../index.js';

async function withDrawer(
  verify: (fixture: {
    browser: Window;
    container: InstanceType<Window['HTMLDivElement']>;
    getDrawer: () => InstanceType<Window['HTMLDialogElement']>;
    requests: boolean[];
    render: (props: UiDrawerProps) => Promise<void>;
  }) => Promise<void>,
) {
  const browser = new Window();
  const globals = {
    window: browser,
    document: browser.document,
    IS_REACT_ACT_ENVIRONMENT: true,
  };
  const previous = new Map<string, PropertyDescriptor | undefined>();
  for (const [name, value] of Object.entries(globals)) {
    previous.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
    Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
  }
  const container = browser.document.createElement('div');
  browser.document.body.append(container);
  const root = createRoot(container as unknown as Element);
  const ref = createRef<HTMLDialogElement>();
  const requests: boolean[] = [];
  const onOpenChange = (open: boolean) => requests.push(open);
  const render = async (props: UiDrawerProps) => {
    await act(async () => {
      root.render(
        <UiDrawer
          id="filters"
          aria-labelledby="filters-title"
          className="custom-drawer"
          onOpenChange={onOpenChange}
          {...props}
          ref={ref}
        >
          <h2 id="filters-title">Filters</h2>
          <button type="button">Apply</button>
        </UiDrawer>,
      );
    });
  };
  const getDrawer = () => {
    const dialog = browser.document.querySelector('dialog');
    if (!dialog) throw new Error('Missing Drawer');
    expect(ref.current).toBe(dialog as unknown as HTMLDialogElement);
    return dialog;
  };
  try {
    await render({});
    await verify({ browser, container, getDrawer, requests, render });
  } finally {
    await act(async () => root.unmount());
    await browser.happyDOM.close();
    for (const [name, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else Reflect.deleteProperty(globalThis, name);
    }
  }
}

test('keeps a controlled modal Drawer in the document layer and an inline Drawer unfocused', () =>
  withDrawer(async ({ browser, container, getDrawer, requests, render }) => {
    const closedModal = getDrawer();
    expect(closedModal.open).toBe(false);
    expect(closedModal.id).toBe('filters');
    expect(closedModal.getAttribute('aria-labelledby')).toBe('filters-title');
    expect(closedModal.querySelector('h2')?.textContent).toBe('Filters');
    expect([...closedModal.classList]).toEqual(
      expect.arrayContaining(['ui-drawer', 'material-role-compact-overlay', 'custom-drawer']),
    );
    expect(closedModal.dataset.side).toBe('left');
    expect(closedModal.dataset.neoverseGlassEdgePass).toBe('css');
    expect(closedModal.parentElement?.parentElement).toBe(browser.document.body);
    expect(closedModal.parentElement?.hasAttribute('inert')).toBe(true);

    const opener = browser.document.createElement('button');
    browser.document.body.append(opener);
    opener.focus();
    await render({ modal: false, side: 'right' });
    const inline = getDrawer();
    const show = spyOn(inline, 'show');
    const showModal = spyOn(inline, 'showModal');
    await render({ open: true, modal: false, side: 'right' });
    expect(inline.open).toBe(true);
    expect(show).not.toHaveBeenCalled();
    expect(showModal).not.toHaveBeenCalled();
    expect(inline.dataset.side).toBe('right');
    expect(inline.dataset.modal).toBe('false');
    expect(inline.dataset.neoverseGlassEdgePass).toBeUndefined();
    expect(inline.parentElement).toBe(container);
    expect(browser.document.activeElement).toBe(opener);
    inline.dispatchEvent(new browser.Event('cancel', { cancelable: true }));
    expect(requests).toEqual([]);

    await render({ width: '18rem' });
    const dialog = getDrawer();
    const showDocumentModal = spyOn(dialog, 'show');
    const showTopLayerModal = spyOn(dialog, 'showModal');
    await render({ open: true, width: '18rem' });
    expect(dialog.open).toBe(true);
    expect(showDocumentModal).toHaveBeenCalledTimes(1);
    expect(showTopLayerModal).not.toHaveBeenCalled();
    const host = dialog.parentElement;
    if (!(host instanceof browser.HTMLDivElement)) throw new Error('Missing Drawer host');
    expect(host.style.getPropertyValue('--neoverse-drawer-width')).toBe('18rem');
    expect(dialog.contains(browser.document.activeElement)).toBe(true);

    opener.focus();
    const toolbarEscape = new browser.KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    opener.dispatchEvent(toolbarEscape);
    expect(toolbarEscape.defaultPrevented).toBe(false);
    expect(requests).toEqual([]);
    dialog.focus();
    const tab = new browser.KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
      cancelable: true,
    });
    dialog.dispatchEvent(tab);
    expect(tab.defaultPrevented).toBe(true);
    const apply = dialog.querySelector('button');
    if (!apply) throw new Error('Missing Apply button');
    expect(browser.document.activeElement).toBe(apply);
    const escapeEvent = new browser.KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    browser.document.activeElement?.dispatchEvent(escapeEvent);
    expect(escapeEvent.defaultPrevented).toBe(true);
    expect(requests).toEqual([false]);
    expect(dialog.open).toBe(true);

    dialog.close();
    await browser.happyDOM.waitUntilComplete();
    expect(requests).toEqual([false, false]);
    expect(dialog.open).toBe(true);
    await render({ open: false });
    expect(dialog.open).toBe(false);
    expect(browser.document.activeElement).toBe(opener);
    expect(requests).toEqual([false, false]);
  }));

test('dismisses modal Drawers only for a complete primary backdrop click', () =>
  withDrawer(async ({ browser, getDrawer, requests, render }) => {
    await render({ open: true });
    const dialog = getDrawer();
    const backdrop = browser.document.querySelector('.ui-drawer__backdrop');
    if (!backdrop) throw new Error('Missing Drawer backdrop');
    const pointer = (target: typeof backdrop | typeof dialog, type: string, button = 0) => {
      target.dispatchEvent(new browser.PointerEvent(type, { button, isPrimary: true }));
    };
    const click = (button = 0) => {
      backdrop.dispatchEvent(new browser.MouseEvent('click', { button, detail: 1 }));
    };
    const gesture = (
      start: typeof backdrop | typeof dialog,
      end: typeof backdrop | typeof dialog,
      button = 0,
    ) => {
      pointer(start, 'pointerdown', button);
      pointer(end, 'pointerup', button);
      click(button);
    };

    click();
    gesture(dialog, dialog);
    gesture(dialog, backdrop);
    gesture(backdrop, dialog);
    gesture(backdrop, backdrop, 2);
    pointer(backdrop, 'pointerdown');
    pointer(backdrop, 'pointercancel');
    pointer(backdrop, 'pointerup');
    click();
    expect(requests).toEqual([]);

    await render({ open: true, closeOnOutside: false });
    gesture(backdrop, backdrop);
    expect(requests).toEqual([]);
    await render({ open: true });
    gesture(backdrop, backdrop);
    expect(requests).toEqual([false]);
    expect(dialog.open).toBe(true);
    await render({ open: true, modal: false });
    expect(browser.document.querySelector('.ui-drawer__backdrop')).toBeNull();
    gesture(backdrop, backdrop);
    expect(requests).toEqual([false]);
  }));
