import { expect, test } from 'bun:test';
import {
  focusElement,
  installFocusModality,
  isKeyboardModality,
  markPointerModality,
  trapModalTabKey,
} from './index.js';

function createFakeDocument() {
  const listeners = new Map<string, Array<(event: unknown) => void>>();
  let active: unknown = null;
  const doc = {
    get activeElement() {
      return active;
    },
    set activeElement(value: unknown) {
      active = value;
    },
    addEventListener(type: string, handler: (event: unknown) => void) {
      const list = listeners.get(type) ?? [];
      list.push(handler);
      listeners.set(type, list);
    },
    dispatch(type: string, event: unknown) {
      for (const handler of listeners.get(type) ?? []) handler(event);
    },
  };
  return doc;
}

test('focusElement suppresses pointer focus rings until keyboard input resumes', () => {
  const doc = createFakeDocument();
  const attributes = new Map<string, string>();
  const focusCalls: Array<Record<string, unknown>> = [];
  const target = {
    isConnected: true,
    ownerDocument: doc,
    setAttribute(name: string, value: string) {
      attributes.set(name, value);
    },
    removeAttribute(name: string) {
      attributes.delete(name);
    },
    focus(options: Record<string, unknown>) {
      focusCalls.push(options);
      doc.activeElement = target;
    },
  } as unknown as HTMLElement;

  installFocusModality(doc as unknown as Document);
  markPointerModality(doc as unknown as Document);
  expect(isKeyboardModality(doc as unknown as Document)).toBe(false);

  focusElement(target);
  expect(attributes.get('data-neoverse-focus-origin')).toBe('pointer');
  expect(focusCalls.at(-1)?.focusVisible).toBe(false);

  doc.dispatch('keydown', { key: 'Shift' });
  expect(isKeyboardModality(doc as unknown as Document)).toBe(false);

  doc.dispatch('keydown', { key: 'ArrowDown' });
  expect(isKeyboardModality(doc as unknown as Document)).toBe(true);

  focusElement(target);
  expect(attributes.has('data-neoverse-focus-origin')).toBe(false);
  expect(focusCalls.at(-1)?.focusVisible).toBe(true);
});

test('trapModalTabKey wraps between the first and last tabbable controls', () => {
  const doc = createFakeDocument() as unknown as Document & {
    defaultView: Window & typeof globalThis;
    activeElement: unknown;
  };
  const makeButton = () => {
    const attrs = new Map<string, string>();
    const el = {
      tabIndex: 0,
      isConnected: true,
      ownerDocument: doc,
      hasAttribute: () => false,
      closest: () => null,
      setAttribute: (name: string, value: string) => attrs.set(name, value),
      removeAttribute: (name: string) => attrs.delete(name),
      focus: () => {
        (doc as { activeElement: unknown }).activeElement = el;
      },
    };
    return el as unknown as HTMLElement;
  };

  const first = makeButton();
  const last = makeButton();
  const container = {
    ownerDocument: doc,
    contains: (node: unknown) => node === first || node === last,
    querySelectorAll: () => [first, last],
    focus: () => undefined,
  } as unknown as HTMLElement;
  doc.defaultView = {
    getComputedStyle: () => ({ display: 'inline-flex', visibility: 'visible' }),
  } as unknown as Window & typeof globalThis;

  (doc as { activeElement: unknown }).activeElement = last;
  let prevented = false;
  const handledForward = trapModalTabKey(
    {
      key: 'Tab',
      shiftKey: false,
      defaultPrevented: false,
      preventDefault: () => (prevented = true),
    } as unknown as KeyboardEvent,
    container,
  );
  expect(handledForward).toBe(true);
  expect(prevented).toBe(true);
  expect(doc.activeElement).toBe(first);

  prevented = false;
  const handledBackward = trapModalTabKey(
    {
      key: 'Tab',
      shiftKey: true,
      defaultPrevented: false,
      preventDefault: () => (prevented = true),
    } as unknown as KeyboardEvent,
    container,
  );
  expect(handledBackward).toBe(true);
  expect(prevented).toBe(true);
  expect(doc.activeElement).toBe(last);
});
