import { expect, test } from 'bun:test';
import { Window } from 'happy-dom';
import { act, useState } from 'react';
import { hydrateRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { UiButton } from './index';
import { UiTerminalSurface } from './terminal';

test('terminal surface retains default title, status, actions and body for nullish headers', async () => {
  for (const header of [undefined, null]) {
    const html = renderToString(
      <UiTerminalSurface
        title="Session"
        header={header}
        status="Connected"
        actions={<UiButton>Close</UiButton>}
      >
        <p>Ready</p>
      </UiTerminalSurface>,
    );
    const browser = new Window();
    try {
      browser.document.body.innerHTML = html;
      const surface = browser.document.querySelector('section');
      expect(surface?.getAttribute('aria-label')).toBe('Session');
      expect(surface?.querySelector('.ui-terminal-surface__title')?.textContent).toBe('Session');
      expect(surface?.querySelector('.ui-terminal-surface__status')?.textContent).toBe('Connected');
      expect(surface?.querySelector('[role="toolbar"]')?.getAttribute('aria-label')).toBe(
        'Session actions',
      );
      expect(surface?.querySelector('button')?.textContent).toBe('Close');
      expect(surface?.querySelector('.ui-terminal-surface__body')?.textContent).toBe('Ready');
    } finally {
      await browser.happyDOM.close();
    }
  }
});

test('terminal custom header replaces fallback controls while preserving the accessible surface and interactive body', async () => {
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
  function Fixture() {
    const [closed, setClosed] = useState(false);
    return (
      <UiTerminalSurface
        title="Fallback title"
        ariaLabel="Workspace console"
        header={<UiButton onClick={() => setClosed(true)}>Close window</UiButton>}
        status="Fallback status"
        actions={<UiButton>Fallback action</UiButton>}
      >
        <p>{closed ? 'Closed' : 'Ready'}</p>
      </UiTerminalSurface>
    );
  }
  const container = browser.document.createElement('div');
  browser.document.body.append(container);
  container.innerHTML = renderToString(<Fixture />);
  let root: Root | undefined;
  try {
    await act(async () => {
      root = hydrateRoot(container as unknown as Element, <Fixture />);
    });
    const surface = container.querySelector('section');
    expect(surface?.getAttribute('aria-label')).toBe('Workspace console');
    expect(surface?.classList.contains('material-glass-elevated')).toBe(true);
    expect(container.querySelectorAll('header')).toHaveLength(1);
    expect(container.querySelector('header')?.textContent).toBe('Close window');
    expect(container.querySelectorAll('button')).toHaveLength(1);
    expect(container.querySelector('[role="toolbar"]')).toBeNull();
    expect(container.textContent).not.toContain('Fallback');
    expect(container.querySelector('.ui-terminal-surface__body')?.textContent).toBe('Ready');
    await act(async () => {
      container
        .querySelector('header button')
        ?.dispatchEvent(new browser.MouseEvent('click', { bubbles: true }));
    });
    expect(container.querySelector('.ui-terminal-surface__body')?.textContent).toBe('Closed');
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
