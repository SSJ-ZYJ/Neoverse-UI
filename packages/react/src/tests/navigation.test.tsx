import { expect, test } from 'bun:test';
import { type HTMLElement as HappyHTMLElement, Window } from 'happy-dom';
import { act, type ComponentPropsWithoutRef } from 'react';
import { hydrateRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { UiControlSurface } from '../components/surfaces/control-surface';
import { UiButton, UiCard, UiDock } from '../index';

const fixture = (
  <UiControlSurface navigationIndicator aria-label="Navigation">
    <a className="ui-navigation-item ui-navigation-item--active" href="#first">
      <span className="ui-navigation-item__indicator" />
      First
    </a>
    <a className="ui-navigation-item" href="#second">
      <span className="ui-navigation-item__indicator" />
      Second
    </a>
  </UiControlSurface>
);

function QuickActionsRegion(props: ComponentPropsWithoutRef<'section'>) {
  return <section {...props} />;
}

test('a custom Dock host retains named navigation and its trailing action', () => {
  const html = renderToString(
    <UiDock
      as={QuickActionsRegion}
      aria-label="Quick actions"
      trailing={<button type="button">Save</button>}
    >
      <a href="/overview">Overview</a>
    </UiDock>,
  );
  expect(html).toStartWith('<section aria-label="Quick actions"');
  expect(html).toContain('<a href="/overview">Overview</a>');
  expect(html).toContain('<button type="button">Save</button>');
});

const indicatorRect = (left: number, width = 20) => ({
  bottom: 32,
  height: 2,
  left,
  right: left + width,
  top: 30,
  width,
  x: left,
  y: 30,
  toJSON: () => ({}),
});

const mockRect = (element: object, left: number, width = 20): void => {
  Object.defineProperty(element, 'getBoundingClientRect', {
    configurable: true,
    value: () => indicatorRect(left, width),
  });
};

// happy-dom delivers MutationObserver records on the microtask queue; two turns
// drain the observer callback and the React update it schedules.
const flushObserver = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
};

function installBrowser() {
  const browser = new Window();
  const globals: Record<string, unknown> = {
    window: browser,
    document: browser.document,
    HTMLElement: browser.HTMLElement,
    Node: browser.Node,
    MutationObserver: browser.MutationObserver,
    ResizeObserver: browser.ResizeObserver,
    getComputedStyle: browser.getComputedStyle.bind(browser),
    // A synchronous frame shim keeps ready/measure scheduling deterministic.
    requestAnimationFrame: (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    },
    cancelAnimationFrame: () => {
      // The synchronous frame shim never leaves a pending frame to cancel.
    },
    IS_REACT_ACT_ENVIRONMENT: true,
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

function queryFixture(container: HappyHTMLElement) {
  const group = container.querySelector('.ui-control-surface__group--primary');
  const indicator = container.querySelector(
    '.ui-control-surface__indicator',
  ) as HappyHTMLElement | null;
  const markers = container.querySelectorAll('.ui-navigation-item__indicator');
  const items = container.querySelectorAll('.ui-navigation-item');
  const firstMarker = markers[0];
  const secondMarker = markers[1];
  const firstItem = items[0];
  const secondItem = items[1];
  if (!group || !indicator || !firstMarker || !secondMarker || !firstItem || !secondItem) {
    throw new Error('Indicator fixture elements are missing');
  }
  return { group, indicator, firstMarker, secondMarker, firstItem, secondItem };
}

test('control surface renders the shared indicator hidden until an item is measured', () => {
  const html = renderToString(fixture);
  expect(html).toContain('ui-control-surface__indicator');
  expect(html).toContain('visibility:hidden');
  const plain = renderToString(<UiControlSurface aria-label="Navigation" />);
  expect(plain).not.toContain('ui-control-surface__indicator');
});

test('material scopes keep server-rendered controls intact through hydration', async () => {
  const { browser, container, restore } = installBrowser();
  let root: Root | undefined;
  let clicks = 0;
  const content = (
    <UiCard as="article">
      <UiControlSurface as="nav" aria-label="Tools">
        <UiButton onClick={() => clicks++}>Apply</UiButton>
      </UiControlSurface>
    </UiCard>
  );
  const errors: unknown[] = [];
  try {
    container.innerHTML = renderToString(content);
    const button = container.querySelector('button');
    const surfaces = [...container.querySelectorAll('[data-surface="auto"]')];
    expect(surfaces.map((surface) => surface.tagName)).toEqual(['ARTICLE', 'NAV', 'BUTTON']);
    browser.document.documentElement.dataset.neoverseMaterial = 'solid';
    await act(async () => {
      root = hydrateRoot(container as unknown as Element, content, {
        onRecoverableError: (error) => errors.push(error),
      });
    });
    expect(container.querySelector('button')).toBe(button);
    expect([...container.querySelectorAll('[data-surface="auto"]')]).toEqual(surfaces);
    await act(async () => button?.click());
    expect(clicks).toBe(1);
    expect(errors).toEqual([]);
  } finally {
    await restore(root);
  }
});

test('shared indicator flies on transform and commits the settled geometry', async () => {
  const { browser, container, restore } = installBrowser();
  let root: Root | undefined;
  try {
    container.innerHTML = renderToString(fixture);
    await act(async () => {
      root = hydrateRoot(container as unknown as Element, fixture);
    });
    const { group, indicator, firstMarker, secondMarker, firstItem, secondItem } =
      queryFixture(container);
    mockRect(group, 0);
    mockRect(firstMarker, 10);
    mockRect(secondMarker, 60);

    // Hydration measured happy-dom's zero-sized layout; an observed attribute
    // change lets the observer commit the real first geometry before flight.
    await act(async () => {
      firstItem.setAttribute('aria-current', 'page');
      await flushObserver();
    });
    expect(indicator.style.left).toBe('10px');
    expect(indicator.style.visibility).toBe('visible');

    await act(async () => {
      firstItem.classList.remove('ui-navigation-item--active');
      secondItem.classList.add('ui-navigation-item--active');
      await flushObserver();
    });
    expect(indicator.style.transform).toBe('translate(50px, 0px)');
    expect(indicator.style.left).toBe('10px');

    const end = new browser.Event('transitionend', { bubbles: true });
    Object.defineProperty(end, 'propertyName', { value: 'transform' });
    await act(async () => {
      indicator.dispatchEvent(end);
    });
    expect(indicator.style.left).toBe('60px');
    expect(indicator.style.width).toBe('20px');
    expect(indicator.style.transform).toBe('');

    await act(async () => {
      secondItem.classList.remove('ui-navigation-item--active');
      firstItem.classList.add('ui-navigation-item--active');
      await flushObserver();
    });
    expect(indicator.style.transform).toBe('translate(-50px, 0px)');
    await act(async () => {
      indicator.dispatchEvent(end);
    });
    expect(indicator.style.left).toBe('10px');
    expect(indicator.style.transform).toBe('');
  } finally {
    await restore(root);
  }
});

test('shared indicator takes the destination size before translating one bar', async () => {
  const { browser, container, restore } = installBrowser();
  let root: Root | undefined;
  try {
    container.innerHTML = renderToString(fixture);
    await act(async () => {
      root = hydrateRoot(container as unknown as Element, fixture);
    });
    const { group, indicator, firstMarker, secondMarker, firstItem, secondItem } =
      queryFixture(container);
    mockRect(group, 0);
    mockRect(firstMarker, 10);
    mockRect(secondMarker, 60, 12);

    await act(async () => {
      firstItem.setAttribute('aria-current', 'page');
      await flushObserver();
    });
    expect(indicator.style.width).toBe('20px');

    await act(async () => {
      firstItem.classList.remove('ui-navigation-item--active');
      secondItem.classList.add('ui-navigation-item--active');
      await flushObserver();
    });
    expect(indicator.style.transform).toBe('translate(50px, 0px)');
    expect(indicator.style.width).toBe('12px');
    expect(indicator.style.left).toBe('10px');

    const end = new browser.Event('transitionend', { bubbles: true });
    Object.defineProperty(end, 'propertyName', { value: 'transform' });
    await act(async () => {
      indicator.dispatchEvent(end);
    });
    expect(indicator.style.left).toBe('60px');
    expect(indicator.style.width).toBe('12px');
    expect(indicator.style.transform).toBe('');
  } finally {
    await restore(root);
  }
});

test('shared indicator commits without a flight when motion is reduced', async () => {
  const { browser, container, restore } = installBrowser();
  let root: Root | undefined;
  try {
    container.innerHTML = renderToString(fixture);
    await act(async () => {
      root = hydrateRoot(container as unknown as Element, fixture);
    });
    const { group, indicator, firstMarker, secondMarker, firstItem, secondItem } =
      queryFixture(container);
    mockRect(group, 0);
    mockRect(firstMarker, 10);
    mockRect(secondMarker, 60);
    const computed = browser.getComputedStyle.bind(browser);
    Object.defineProperty(globalThis, 'getComputedStyle', {
      configurable: true,
      writable: true,
      value: (element: HappyHTMLElement) => {
        const style = computed(element);
        if (element !== indicator) return style;
        return { zoom: style.zoom, transitionDuration: '0s' };
      },
    });

    await act(async () => {
      firstItem.setAttribute('aria-current', 'page');
      await flushObserver();
    });
    await act(async () => {
      firstItem.classList.remove('ui-navigation-item--active');
      secondItem.classList.add('ui-navigation-item--active');
      await flushObserver();
    });
    expect(indicator.style.left).toBe('60px');
    expect(indicator.style.transform).toBe('');
  } finally {
    await restore(root);
  }
});
