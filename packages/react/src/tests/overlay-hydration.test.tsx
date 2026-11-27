import { expect, test } from 'bun:test';
import { materials } from '@neoverse-ui/tokens';
import { Window } from 'happy-dom';
import { act } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { UiButton } from '../components/actions/button';
import { UiInput } from '../components/forms/input';
import { UiSelect } from '../components/forms/select';
import { UiContextMenu } from '../components/overlays/context-menu';
import { UiDropdownMenu } from '../components/overlays/dropdown-menu';
import { UiPopover } from '../components/overlays/popover';
import { UiCard } from '../components/surfaces/card';
import { UiControlSurface } from '../components/surfaces/control-surface';

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
      <UiContextMenu
        open={false}
        ariaLabel="Context actions"
        entries={[{ id: 'copy', label: 'Copy' }]}
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
    expect(container.querySelector('.ui-context-menu')).not.toBeNull();
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
    expect(container.querySelector('.ui-context-menu')).toBeNull();
    expect(browser.document.body.querySelectorAll('.ui-context-menu')).toHaveLength(1);
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

test('React controls hydrate without mismatch across Solid, Frosted and Aurora Glass scopes', async () => {
  for (const material of materials) {
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
    let clicks = 0;
    const fixture = (
      <UiCard as="article">
        <UiControlSurface as="nav" aria-label="Tools">
          <UiButton onClick={() => (clicks += 1)}>Apply</UiButton>
        </UiControlSurface>
        <UiInput defaultValue="Neoverse" aria-label="Name" />
        <UiSelect
          defaultValue="a"
          aria-label="Mode"
          options={[
            { value: 'a', label: 'Alpha' },
            { value: 'b', label: 'Beta' },
          ]}
        />
      </UiCard>
    );
    const container = browser.document.createElement('div');
    browser.document.body.append(container);
    container.innerHTML = renderToString(fixture);
    const button = container.querySelector('button');
    const input = container.querySelector('input');
    const surfaces = Array.from(container.querySelectorAll('[data-surface="auto"]'));
    container.dataset.neoverseMaterial = material;
    const errors: unknown[] = [];
    let root: ReturnType<typeof hydrateRoot> | undefined;
    try {
      await act(async () => {
        root = hydrateRoot(container as unknown as Element, fixture, {
          onRecoverableError: (error) => errors.push(error),
        });
      });
      expect(container.querySelector('button')).toBe(button);
      expect(container.querySelector('input')).toBe(input);
      expect(Array.from(container.querySelectorAll('[data-surface="auto"]'))).toEqual(surfaces);
      await act(async () => {
        button?.click();
      });
      expect(clicks).toBe(1);
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
  }
});
