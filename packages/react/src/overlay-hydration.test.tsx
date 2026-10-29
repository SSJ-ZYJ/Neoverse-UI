import { expect, test } from 'bun:test';
import { Window } from 'happy-dom';
import { act } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { UiDropdownMenu, UiPopover } from './overlays';

test('overlay panel associations remain unique and unchanged through SSR hydration and interaction', async () => {
  const browser = new Window();
  const globals = {
    window: browser,
    document: browser.document,
    HTMLElement: browser.HTMLElement,
    Node: browser.Node,
    getComputedStyle: browser.getComputedStyle.bind(browser),
    requestAnimationFrame: browser.requestAnimationFrame.bind(browser),
    cancelAnimationFrame: browser.cancelAnimationFrame.bind(browser),
    IS_REACT_ACT_ENVIRONMENT: true,
  };
  const previous = new Map<string, PropertyDescriptor | undefined>();
  for (const [name, value] of Object.entries(globals)) {
    previous.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
    Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
  }
  const fixture = (
    <main>
      <UiPopover trigger="First" ariaLabel="First details">
        Body
      </UiPopover>
      <UiPopover trigger="Second" ariaLabel="Second details">
        Body
      </UiPopover>
      <UiDropdownMenu
        trigger="Actions"
        ariaLabel="Actions"
        items={[{ id: 'open', label: 'Open' }]}
      />
    </main>
  );
  const container = browser.document.createElement('div');
  browser.document.body.append(container);
  container.innerHTML = renderToString(fixture);
  const associations = () =>
    Array.from(container.querySelectorAll('button[aria-expanded]')).map((button) =>
      button.getAttribute('aria-controls'),
    );
  const serverIds = associations();
  const errors: unknown[] = [];
  let root: ReturnType<typeof hydrateRoot> | undefined;
  try {
    expect(serverIds).toHaveLength(3);
    expect(serverIds.every(Boolean)).toBe(true);
    expect(new Set(serverIds).size).toBe(3);
    for (const id of serverIds) {
      expect(container.querySelectorAll(`[id="${id}"]`)).toHaveLength(1);
    }
    await act(async () => {
      root = hydrateRoot(container as unknown as Element, fixture, {
        onRecoverableError: (error) => errors.push(error),
      });
    });
    expect(associations()).toEqual(serverIds);
    await act(async () => {
      container.querySelector('button')?.click();
    });
    expect(container.querySelector('button')?.getAttribute('aria-expanded')).toBe('true');
    expect(associations()).toEqual(serverIds);
    expect(errors).toEqual([]);
  } finally {
    if (root)
      await act(async () => {
        root?.unmount();
      });
    await browser.happyDOM.close();
    for (const [name, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else Reflect.deleteProperty(globalThis, name);
    }
  }
});
