import { expect, test } from 'bun:test';
import { presenceVanishClassName } from '@neoverse-ui/motion';
import { Window } from 'happy-dom';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { UiPresence } from '../components/motion/presence.js';

function installBrowser() {
  const browser = new Window();
  const globals: Record<string, unknown> = {
    document: browser.document,
    getComputedStyle: browser.getComputedStyle.bind(browser),
    HTMLElement: browser.HTMLElement,
    IS_REACT_ACT_ENVIRONMENT: true,
    Node: browser.Node,
    cancelAnimationFrame: () => undefined,
    requestAnimationFrame: (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    },
    window: browser,
  };
  const previous = new Map<string, PropertyDescriptor | undefined>();
  for (const [name, value] of Object.entries(globals)) {
    previous.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
    Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
  }
  const container = browser.document.createElement('div');
  browser.document.body.append(container);
  const restore = async (root: Root | undefined) => {
    if (root) await act(async () => root?.unmount());
    await browser.happyDOM.close();
    for (const [name, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else Reflect.deleteProperty(globalThis, name);
    }
  };
  return { browser, container, restore };
}

function Fixture({ show }: { show: boolean }) {
  return (
    <UiPresence show={show} as="span" data-testid="presence" variant="pop" origin="top">
      <span data-testid="presence-child">Content</span>
    </UiPresence>
  );
}

function presence(container: { querySelector: (selector: string) => Element | null }) {
  return container.querySelector('[data-testid="presence"]');
}

function vanishEvent(): Event {
  const EventConstructor = (globalThis.window as unknown as { Event: typeof Event }).Event;
  const event = new EventConstructor('animationend');
  Object.defineProperty(event, 'animationName', { value: presenceVanishClassName });
  return event;
}

test('UiPresence plays the exit class and unmounts on the matching animation end', async () => {
  const { container, restore } = installBrowser();
  let root: Root | undefined;
  try {
    await act(async () => {
      root = createRoot(container as unknown as Element);
      root.render(<Fixture show />);
    });
    const mounted = presence(container);
    expect(mounted?.className).toContain('nv-appear');

    await act(async () => root?.render(<Fixture show={false} />));
    const leaving = presence(container);
    expect(leaving).toBe(mounted);
    expect(leaving?.className).toContain('nv-vanish');

    await act(async () => {
      const event = vanishEvent();
      leaving?.dispatchEvent(event);
    });
    expect(presence(container)).toBeNull();
  } finally {
    await restore(root);
  }
});

test('a re-open during the exit cancels the departure without remounting', async () => {
  const { container, restore } = installBrowser();
  let root: Root | undefined;
  try {
    await act(async () => {
      root = createRoot(container as unknown as Element);
      root.render(<Fixture show />);
    });
    const mounted = presence(container);

    await act(async () => root?.render(<Fixture show={false} />));
    expect(presence(container)?.className).toContain('nv-vanish');

    await act(async () => root?.render(<Fixture show />));
    expect(presence(container)).toBe(mounted);
    expect(presence(container)?.className).not.toContain('nv-vanish');
    expect(presence(container)?.className).toContain('nv-appear');
  } finally {
    await restore(root);
  }
});

test('an animation end from a descendant cannot unmount the presence owner', async () => {
  const { container, restore } = installBrowser();
  let root: Root | undefined;
  try {
    await act(async () => {
      root = createRoot(container as unknown as Element);
      root.render(<Fixture show />);
    });

    await act(async () => root?.render(<Fixture show={false} />));
    const leaving = presence(container);
    const descendant = leaving?.firstElementChild;
    if (descendant === undefined || descendant === null) {
      throw new Error('The fixture must render a descendant');
    }

    await act(async () => {
      descendant.dispatchEvent(vanishEvent());
    });
    expect(presence(container)).toBe(leaving);
    expect(presence(container)?.className).toContain('nv-vanish');
  } finally {
    await restore(root);
  }
});

test('UiPresence stays unmounted until it is shown and then plays the entrance', async () => {
  const { container, restore } = installBrowser();
  let root: Root | undefined;
  try {
    await act(async () => {
      root = createRoot(container as unknown as Element);
      root.render(<Fixture show={false} />);
    });
    expect(presence(container)).toBeNull();

    await act(async () => root?.render(<Fixture show />));
    expect(presence(container)?.className).toContain('nv-appear');
  } finally {
    await restore(root);
  }
});
