import { expect, test } from 'bun:test';
import { Window } from 'happy-dom';
import { act } from 'react';
import { hydrateRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { UiScrollbar } from './scrollbar';

test('document scrollbar stays visible while hovered or dragged and hides afterwards', async () => {
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
  Object.defineProperty(browser, 'innerHeight', { configurable: true, value: 800 });
  Object.defineProperty(browser.document.documentElement, 'scrollHeight', {
    configurable: true,
    value: 1600,
  });
  Object.defineProperty(browser.document.documentElement, 'clientHeight', {
    configurable: true,
    value: 800,
  });
  const container = browser.document.createElement('div');
  browser.document.body.append(container);
  const fixture = <UiScrollbar autoHideMs={40} hideNative={false} />;
  container.innerHTML = renderToString(fixture);
  let root: Root | undefined;
  const waitForHide = () => new Promise<void>((resolve) => setTimeout(resolve, 100));
  try {
    await act(async () => {
      root = hydrateRoot(container as unknown as Element, fixture);
    });
    const track = container.querySelector('.ui-scrollbar');
    const thumb = container.querySelector('.ui-scrollbar__thumb');
    if (!track || !thumb) throw new Error('Scrollbar elements are missing');
    Object.defineProperty(thumb, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({ top: 0, bottom: 400, height: 400 }),
    });

    await act(async () => {
      track.dispatchEvent(new browser.PointerEvent('pointerenter', { pointerType: 'mouse' }));
      await waitForHide();
    });
    expect(track.getAttribute('data-visible')).toBe('true');
    await act(async () => {
      track.dispatchEvent(new browser.PointerEvent('pointerleave', { pointerType: 'mouse' }));
      await waitForHide();
    });
    expect(track.getAttribute('data-visible')).toBe('false');

    await act(async () => {
      browser.dispatchEvent(new browser.Event('scroll'));
      thumb.dispatchEvent(
        new browser.PointerEvent('pointerdown', { button: 0, clientY: 20, pointerId: 1 }),
      );
      thumb.dispatchEvent(
        new browser.PointerEvent('pointerdown', { button: 0, clientY: 20, pointerId: 2 }),
      );
      thumb.dispatchEvent(new browser.PointerEvent('pointerup', { pointerId: 2 }));
      await waitForHide();
    });
    expect(track.className).toContain('ui-scrollbar--dragging');
    expect(track.getAttribute('data-visible')).toBe('true');
    await act(async () => {
      thumb.dispatchEvent(new browser.PointerEvent('pointerup', { pointerId: 1 }));
      await waitForHide();
    });
    expect(track.getAttribute('data-visible')).toBe('false');
  } finally {
    if (root) await act(async () => root?.unmount());
    await browser.happyDOM.close();
    for (const [name, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else Reflect.deleteProperty(globalThis, name);
    }
  }
});
