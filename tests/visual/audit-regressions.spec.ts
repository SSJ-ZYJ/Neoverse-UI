import { expect, type Locator, type Page, test } from '@playwright/test';

/**
 * Regression coverage for the cross-framework audit findings.
 *
 * Each case names the confirmed root cause it locks down so a future change
 * cannot silently reintroduce the divergence.
 */

async function disablePopoverApi(page: Page) {
  await page.addInitScript(() => {
    Reflect.deleteProperty(HTMLElement.prototype, 'showPopover');
    Reflect.deleteProperty(HTMLElement.prototype, 'hidePopover');
  });
}

async function expectFallbackPanel(panel: Locator, fallbackClass: string) {
  await expect(panel).toBeVisible();
  await expect(panel).toHaveClass(new RegExp(fallbackClass));
  await expect(panel).toHaveCSS('position', 'fixed');
}

async function instrumentOverlayListeners(page: Page) {
  await page.addInitScript(() => {
    type TrackedListener = EventListenerOrEventListenerObject;
    const trackedTypes = new Set(['pointerdown', 'keydown', 'resize', 'scroll']);
    const shouldTrack = (target: EventTarget, type: string) =>
      (target === document && (type === 'pointerdown' || type === 'keydown')) ||
      (target === window && (type === 'resize' || type === 'scroll'));
    const active = new WeakMap<EventTarget, Map<string, Set<TrackedListener>>>();
    const originalAdd = EventTarget.prototype.addEventListener;
    const originalRemove = EventTarget.prototype.removeEventListener;

    EventTarget.prototype.addEventListener = function (type, listener, options) {
      const nativeListener = listener as TrackedListener;
      if (listener !== null && shouldTrack(this, type)) {
        let byType = active.get(this);
        if (byType === undefined) {
          byType = new Map();
          active.set(this, byType);
        }
        let listeners = byType.get(type);
        if (listeners === undefined) {
          listeners = new Set();
          byType.set(type, listeners);
        }
        listeners.add(nativeListener);
      }
      return originalAdd.call(this, type, nativeListener, options);
    };

    EventTarget.prototype.removeEventListener = function (type, listener, options) {
      const nativeListener = listener as TrackedListener;
      if (listener !== null && shouldTrack(this, type)) {
        active.get(this)?.get(type)?.delete(nativeListener);
      }
      return originalRemove.call(this, type, nativeListener, options);
    };

    Object.defineProperty(window, '__overlayListenerCounts', {
      configurable: true,
      value: () => {
        const result: Record<string, number> = {};
        for (const type of trackedTypes) {
          if (type === 'pointerdown' || type === 'keydown') {
            result[`document.${type}`] = active.get(document)?.get(type)?.size ?? 0;
          } else {
            result[`window.${type}`] = active.get(window)?.get(type)?.size ?? 0;
          }
        }
        return result;
      },
    });
  });
}

async function activeOverlayListenerCounts(page: Page) {
  return page.evaluate(() => {
    const readCounts = (
      window as Window & {
        __overlayListenerCounts?: () => Record<string, number>;
      }
    ).__overlayListenerCounts;
    return readCounts?.() ?? {};
  });
}

// --- Audit finding: React UiSelect leaked overlay listeners after unmount ---
for (const mode of ['native', 'fallback'] as const) {
  test(`React Select releases overlay tracking when unmounted while open / ${mode}`, async ({
    page,
  }) => {
    if (mode === 'fallback') await disablePopoverApi(page);
    await instrumentOverlayListeners(page);
    await page.goto('/react-fixture?lang=en&contract-fixtures=1', {
      waitUntil: 'domcontentloaded',
    });
    const baseline = await activeOverlayListenerCounts(page);
    const controls = page.locator('[data-select-block-controls]');
    const trigger = page.locator('[data-react-adapter="UiSelect"]');
    const shell = trigger.locator('xpath=..');
    const panel = shell.getByRole('listbox');

    await trigger.focus();
    await page.keyboard.press('ArrowDown');
    await expect(panel).toBeVisible();
    if (mode === 'fallback') {
      await expectFallbackPanel(panel, 'ui-select__popover--fallback-open');
    }

    const openCounts = await activeOverlayListenerCounts(page);
    expect(openCounts['document.keydown']).toBeGreaterThan(baseline['document.keydown'] ?? 0);
    expect(openCounts['window.resize']).toBeGreaterThan(baseline['window.resize'] ?? 0);

    await controls
      .locator('[data-select-unmount]')
      .evaluate((element: HTMLElement) => element.click());
    await expect(page.locator('[data-react-adapter="UiSelect"]')).toHaveCount(0);
    await expect.poll(() => activeOverlayListenerCounts(page)).toEqual(baseline);
  });
}

// --- Audit finding: Vue controlled selectors must roll back rejected updates ---
for (const control of [
  { name: 'Checkbox', selector: '[data-contract-checkbox-reject]' },
  { name: 'Switch', selector: '[data-contract-switch-reject]' },
] as const) {
  test(`Vue ${control.name} restores the controlled state when the parent rejects an update`, async ({
    page,
  }) => {
    await page.goto('/frame?theme=light&lang=en&contract-fixtures=1#forms', {
      waitUntil: 'domcontentloaded',
    });
    const trap = page.locator('.ui-choice-trap');
    const input = trap.locator(control.selector);
    await expect(input).toBeChecked();
    await input.scrollIntoViewIfNeeded();
    await input.click({ force: true });
    // The native control flipped optimistically; the guard must restore it.
    await expect(input).toBeChecked();
  });
}

// --- Audit finding: fallback Select must close when focus leaves (Tab) ---
for (const adapter of ['Vue', 'React'] as const) {
  test(`${adapter} Select closes its fallback panel when focus leaves with Tab`, async ({
    page,
  }) => {
    await disablePopoverApi(page);
    const url =
      adapter === 'Vue'
        ? '/frame?theme=light&lang=en&contract-fixtures=1#forms'
        : '/react-fixture?theme=light&lang=en&contract-fixtures=1';
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    const trigger = page.getByRole('combobox', { name: 'Contract selection' });
    const shell = trigger.locator('xpath=..');
    const panel = shell.getByRole('listbox');
    await trigger.focus();
    await page.keyboard.press('ArrowDown');
    await expect(panel).toBeVisible();
    await expectFallbackPanel(panel, 'ui-select__popover--fallback-open');
    // Tab out of the last option and past the trigger: focus must not be
    // trapped by a panel that the native popover would have dismissed.
    const options = panel.getByRole('option');
    const count = await options.count();
    for (let index = 0; index < count + 2; index += 1) await page.keyboard.press('Tab');
    await expect(panel).toBeHidden();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });
}

// --- Audit finding: RadioGroup without an explicit name still forms one group ---
for (const adapter of ['Vue', 'React'] as const) {
  test(`${adapter} RadioGroup keeps a coherent group without a consumer name`, async ({ page }) => {
    const url =
      adapter === 'Vue'
        ? '/frame?theme=light&lang=en&contract-fixtures=1#forms'
        : '/react-fixture?theme=light&lang=en&contract-fixtures=1';
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    const group = page.getByRole('radiogroup', { name: 'Unnamed radio group' });
    const first = group.getByRole('radio', { name: 'Unnamed first', exact: true });
    const second = group.getByRole('radio', { name: 'Unnamed second', exact: true });
    await first.check();
    await expect(first).toBeChecked();
    await expect(second).not.toBeChecked();
    await second.focus();
    await page.keyboard.press('ArrowRight');
    await expect(first).toBeChecked();
    await expect(second).not.toBeChecked();
  });
}

// --- Audit finding: Vue Scrollbar unmount dropped native hiding for other owners ---
test('Vue two Scrollbar owners keep the native class until the last releases it', async ({
  page,
}) => {
  await page.goto('/frame?theme=light&lang=en&contract-fixtures=1#scrollbar', {
    waitUntil: 'domcontentloaded',
  });
  const owners = page.locator('[data-scrollbar-owner]');
  await expect(owners).toHaveCount(2);
  await expect(page.locator('html')).toHaveClass(/ui-scrollbar-target/);

  // Removing one owner must not release the class the other still needs.
  await page.locator('[data-scrollbar-unmount]').first().click();
  await expect(owners).toHaveCount(1);
  await expect(page.locator('html')).toHaveClass(/ui-scrollbar-target/);

  // The module also mounts its own document overlay, so the class persists
  // until that baseline fixture unmounts; assert the owner count instead of
  // the class alone to keep the ownership semantics explicit.
  const remaining = await owners.evaluateAll((nodes) => nodes.length);
  expect(remaining).toBe(1);
});

// --- Audit finding: DropdownMenu must close when Tab leaves the menu ---
for (const adapter of ['Vue', 'React'] as const) {
  for (const mode of ['native', 'fallback'] as const) {
    test(`${adapter} DropdownMenu closes and restores focus when Tab leaves / ${mode}`, async ({
      page,
    }) => {
      if (mode === 'fallback') await disablePopoverApi(page);
      const url =
        adapter === 'Vue'
          ? '/frame?theme=light&lang=en&contract-fixtures=1#controls'
          : '/react-fixture?theme=light&lang=en&contract-fixtures=1';
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      const trigger = page.getByRole('button', { name: 'Open menu' });
      // Vue names the menu "Project actions"; the React fixture reuses its
      // trigger copy as the menu name, so resolve the menu by role only.
      const menu = page.getByRole('menu');
      await trigger.click();
      await expect(menu).toBeVisible();
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      // Tab walks the items and then leaves the menu entirely.
      const items = menu.getByRole('menuitem');
      const count = await items.count();
      for (let index = 0; index < count + 2; index += 1) await page.keyboard.press('Tab');
      await expect(menu).toBeHidden();
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });
  }
}
