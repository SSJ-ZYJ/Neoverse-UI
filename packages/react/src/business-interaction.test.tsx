import { expect, test } from 'bun:test';
import { Window } from 'happy-dom';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { UiDialog, UiToast } from './index';

test('Dialog and Toast defer browser-only portals until mounted', () => {
  const dialog = renderToStaticMarkup(
    <UiDialog open title="Review changes" onOpenChange={() => undefined}>
      Review details
    </UiDialog>,
  );
  const toast = renderToStaticMarkup(
    <UiToast open message="Saved" dismissLabel="Dismiss" onOpenChange={() => undefined} />,
  );
  expect(dialog).toBe('');
  expect(toast).toBe('');
});

test('Toast renders an accessible close button across all presentations and notifies on click', async () => {
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

  try {
    for (const presentation of ['compact', 'action', 'notification'] as const) {
      const updates: boolean[] = [];
      await act(async () => {
        root.render(
          <UiToast
            open
            presentation={presentation}
            duration={presentation === 'notification' ? 0 : 4000}
            message="Changes saved."
            dismissLabel="Dismiss notification"
            action={presentation === 'action' ? <button type="button">View</button> : undefined}
            onOpenChange={(nextOpen) => updates.push(nextOpen)}
          />,
        );
      });

      const dismiss = browser.document.querySelector('button[aria-label="Dismiss notification"]');
      expect(dismiss).not.toBeNull();
      expect(dismiss?.querySelector('svg')).not.toBeNull();
      expect(dismiss?.textContent?.trim()).toBe('');

      await act(async () => {
        dismiss?.dispatchEvent(new browser.MouseEvent('click', { bubbles: true }));
      });
      expect(updates).toEqual([false]);
    }
  } finally {
    await act(async () => root.unmount());
    await browser.happyDOM.close();
    for (const [name, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else Reflect.deleteProperty(globalThis, name);
    }
  }
});
