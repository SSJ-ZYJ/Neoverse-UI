import { expect, type Locator, type Page, test } from '@playwright/test';

const themes = ['light', 'dark'] as const;

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
  await expect(panel).toHaveCSS('opacity', '1');
  await expect(panel).toHaveCSS('scale', '1');
  await expect(panel).toHaveCSS('translate', '0px');
  expect(await panel.evaluate((element) => element.matches(':popover-open'))).toBe(false);
}

async function describedTexts(control: Locator) {
  return control.evaluate((element) =>
    (element.getAttribute('aria-describedby') ?? '')
      .split(/\s+/)
      .filter(Boolean)
      .map((id) => document.getElementById(id)?.textContent?.trim() ?? null),
  );
}

async function formDataValues(form: Locator) {
  return form.evaluate((element) =>
    Object.fromEntries(
      Array.from(new FormData(element as HTMLFormElement).entries(), ([name, value]) => [
        name,
        String(value),
      ]),
    ),
  );
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

async function reactSelectAnchorGeometry(page: Page) {
  return page.evaluate(() => {
    const trigger = document.querySelector<HTMLElement>('[data-react-adapter="UiSelect"]');
    const panel = trigger?.parentElement?.querySelector<HTMLElement>('.ui-select__popover');
    if (trigger === null || trigger === undefined || panel === null || panel === undefined) {
      throw new Error('React select trigger or fallback panel is missing.');
    }

    const triggerRect = trigger.getBoundingClientRect();
    const side = panel.dataset.neoverseOverlaySide;
    const panelRect = panel.getBoundingClientRect();
    return {
      side,
      triggerTop: triggerRect.top,
      triggerWidth: triggerRect.width,
      overlayTop: panelRect.top,
      overlayWidth: panelRect.width,
      verticalGap:
        side === 'top' ? triggerRect.top - panelRect.bottom : panelRect.top - triggerRect.bottom,
      leftOffset: panelRect.left - triggerRect.left,
    };
  });
}

for (const theme of themes) {
  test(`Vue Field connects native control state and messages / ${theme}`, async ({ page }) => {
    await page.goto(`/frame?theme=${theme}&lang=en&contract-fixtures=1#forms`, {
      waitUntil: 'domcontentloaded',
    });

    const validationField = page.locator('#forms-field-states [data-contract-state="validation"]');
    const requiredEmail = validationField.locator('input[type="email"]');
    await expect(requiredEmail).toHaveAttribute('id', 'forms-validation-error');
    await expect(requiredEmail).toHaveAttribute('required', '');
    await expect(validationField.locator('label[for="forms-validation-error"]')).toBeVisible();
    expect(await describedTexts(requiredEmail)).toContain('Enter a valid release email.');

    const readonlyField = page.locator('#forms-field-states [data-contract-state="readonly"]');
    const readonlyInput = readonlyField.locator('input');
    await expect(readonlyInput).toHaveAttribute('readonly', '');
    await expect(readonlyInput).not.toBeDisabled();
    await expect(readonlyInput).toHaveValue('workspace@neoverse.dev');
    expect(await describedTexts(readonlyInput)).toContain(
      'This value is managed by the workspace.',
    );

    const successField = page.locator('#forms-field-states .ui-field').filter({
      hasText: 'Validation passed.',
    });
    expect(await describedTexts(successField.locator('input[type="checkbox"]'))).toContain(
      'Validation passed.',
    );

    const disabledField = page.locator('#forms-field-states [data-contract-state="disabled"]');
    await expect(disabledField.locator('input[role="switch"]')).toBeDisabled();
  });

  test(`React Field connects its label and description / ${theme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme });
    await page.goto('/react-fixture?lang=en&contract-fixtures=1', {
      waitUntil: 'domcontentloaded',
    });

    const field = page.locator('[data-react-adapter="UiField"]').first();
    const input = field.locator('[data-react-adapter="UiInput"]');
    await expect(input).toHaveAttribute('id', 'react-runtime-email');
    await expect(input).toHaveAttribute('required', '');
    await expect(field.locator('label[for="react-runtime-email"]')).toBeVisible();
    expect(await describedTexts(input)).toContain(
      'Field labels, validation state, and native input share one contract.',
    );
  });

  test(`Vue Popover and menu keep fallback dismissal and focus / ${theme}`, async ({ page }) => {
    await disablePopoverApi(page);
    await page.goto(`/frame?theme=${theme}&lang=en&contract-fixtures=1#controls`, {
      waitUntil: 'domcontentloaded',
    });
    expect(
      await page.evaluate(
        () =>
          typeof HTMLElement.prototype.showPopover === 'undefined' &&
          typeof HTMLElement.prototype.hidePopover === 'undefined',
      ),
    ).toBe(true);

    const popover = page.locator('#controls-overlays [data-overlay-popover]');
    const popoverTrigger = popover.locator('.ui-popover__trigger');
    const popoverPanel = popover.locator('.ui-popover__content');
    const menu = page.locator('#controls-overlays [data-overlay-dropdown]');
    const menuTrigger = menu.locator('.ui-dropdown-menu__trigger');
    const menuPanel = menu.locator('.ui-dropdown-menu__panel');

    await popoverTrigger.click();
    await expectFallbackPanel(popoverPanel, 'ui-overlay-panel--fallback-open');
    await page.keyboard.press('Escape');
    await expect(popoverPanel).toBeHidden();
    await expect(popoverTrigger).toBeFocused();

    await popoverTrigger.click();
    await expect(popoverPanel).toBeVisible();
    await menuTrigger.click();
    await expect(popoverPanel).toBeHidden();
    await expectFallbackPanel(menuPanel, 'ui-overlay-panel--fallback-open');
    await expect(menu.getByRole('menuitem', { name: 'Open' })).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(menu.getByRole('menuitem', { name: 'Archive' })).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(menu.getByRole('menuitem', { name: 'Remove' })).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(menu.getByRole('menuitem', { name: 'Open' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(menuPanel).toBeHidden();
    await expect(menuTrigger).toBeFocused();

    await menuTrigger.click();
    await expect(menuPanel).toBeVisible();
    await page.mouse.click(5, 5);
    await expect(menuPanel).toBeHidden();
    await popoverTrigger.click();
    await expectFallbackPanel(popoverPanel, 'ui-overlay-panel--fallback-open');
    await page.mouse.click(5, 5);
    await expect(popoverPanel).toBeHidden();
  });

  test(`React Popover and menu keep fallback dismissal and focus / ${theme}`, async ({ page }) => {
    await disablePopoverApi(page);
    await page.emulateMedia({ colorScheme: theme });
    await page.goto('/react-fixture?lang=en&contract-fixtures=1', {
      waitUntil: 'domcontentloaded',
    });
    expect(
      await page.evaluate(
        () =>
          typeof HTMLElement.prototype.showPopover === 'undefined' &&
          typeof HTMLElement.prototype.hidePopover === 'undefined',
      ),
    ).toBe(true);

    const popover = page.locator('[data-react-adapter="UiPopover"]');
    const popoverTrigger = popover.locator('.ui-popover__trigger');
    const popoverPanel = popover.locator('.ui-popover__content');
    const menu = page.locator('[data-react-adapter="UiDropdownMenu"]');
    const menuTrigger = menu.locator('.ui-dropdown-menu__trigger');
    const menuPanel = menu.locator('.ui-dropdown-menu__panel');

    await popoverTrigger.click();
    await expectFallbackPanel(popoverPanel, 'ui-overlay-panel--fallback-open');
    await page.keyboard.press('Escape');
    await expect(popoverPanel).toBeHidden();
    await expect(popoverTrigger).toBeFocused();

    await popoverTrigger.click();
    await expect(popoverPanel).toBeVisible();
    await menuTrigger.click();
    await expect(popoverPanel).toBeHidden();
    await expectFallbackPanel(menuPanel, 'ui-overlay-panel--fallback-open');
    await expect(menu.getByRole('menuitem', { name: 'Open' })).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(menu.getByRole('menuitem', { name: 'Archive' })).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(menu.getByRole('menuitem', { name: 'Remove' })).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(menu.getByRole('menuitem', { name: 'Open' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(menuPanel).toBeHidden();
    await expect(menuTrigger).toBeFocused();

    await menuTrigger.click();
    await expect(menuPanel).toBeVisible();
    await page.mouse.click(5, 5);
    await expect(menuPanel).toBeHidden();
    await popoverTrigger.click();
    await expectFallbackPanel(popoverPanel, 'ui-overlay-panel--fallback-open');
    await page.mouse.click(5, 5);
    await expect(popoverPanel).toBeHidden();
  });

  test(`Vue Select closes and restores focus in fallback mode / ${theme}`, async ({ page }) => {
    await disablePopoverApi(page);
    await page.goto(`/frame?theme=${theme}&lang=en&contract-fixtures=1#forms`, {
      waitUntil: 'domcontentloaded',
    });

    const trigger = page.locator('#forms-runtime');
    const select = trigger.locator('xpath=..');
    const panel = select.locator('.ui-select__popover');
    await trigger.click();
    await expectFallbackPanel(panel, 'ui-select__popover--fallback-open');
    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();
    await expect(trigger).toBeFocused();

    await trigger.click();
    await expect(panel).toBeVisible();
    await panel.getByRole('option', { name: 'Remote' }).click();
    await expect(select.locator('.ui-select__value')).toHaveText('Remote');
    await expect(panel).toBeHidden();
    await expect(trigger).toBeFocused();

    await trigger.click();
    await expect(panel).toBeVisible();
    const outsideTrigger = page.locator('#forms-runtime-value');
    await outsideTrigger.click();
    await expect(panel).toBeHidden();
    await expect(outsideTrigger.locator('xpath=..').locator('.ui-select__popover')).toBeVisible();
  });

  test(`React Select closes and restores focus in fallback mode / ${theme}`, async ({ page }) => {
    await disablePopoverApi(page);
    await page.emulateMedia({ colorScheme: theme });
    await page.goto('/react-fixture?lang=en&contract-fixtures=1', {
      waitUntil: 'domcontentloaded',
    });

    const trigger = page.locator('[data-react-adapter="UiSelect"]');
    const select = trigger.locator('xpath=..');
    const panel = select.locator('.ui-select__popover');
    await trigger.click();
    await expectFallbackPanel(panel, 'ui-select__popover--fallback-open');
    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();
    await expect(trigger).toBeFocused();

    await trigger.click();
    await expect(panel).toBeVisible();
    await panel.getByRole('option', { name: 'Remote' }).click();
    await expect(select.locator('.ui-select__value')).toHaveText('Remote');
    await expect(panel).toBeHidden();
    await expect(trigger).toBeFocused();

    await trigger.click();
    await expect(panel).toBeVisible();
    await page.locator('[data-react-adapter="UiInput"]').first().click();
    await expect(panel).toBeHidden();
  });

  test(`React Select fallback tracks scroll and responsive resize / ${theme}`, async ({ page }) => {
    await disablePopoverApi(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/react-fixture?lang=en&contract-fixtures=1', {
      waitUntil: 'domcontentloaded',
    });
    const trigger = page.locator('[data-react-adapter="UiSelect"]');
    const panel = trigger.locator('xpath=..').locator('.ui-select__popover');
    await trigger.click();
    await expectFallbackPanel(panel, 'ui-select__popover--fallback-open');
    const initial = await reactSelectAnchorGeometry(page);
    expect(Math.abs(initial.verticalGap)).toBeLessThan(20);
    expect(Math.abs(initial.leftOffset)).toBeLessThan(2);
    const initialViewportWidth = await page.evaluate(() => window.innerWidth);
    const scrollBounds = await page.evaluate(() => ({
      scrollY: window.scrollY,
      maxScrollY: document.documentElement.scrollHeight - window.innerHeight,
    }));
    expect(scrollBounds.maxScrollY).toBeGreaterThan(scrollBounds.scrollY + 80);

    const scrollTarget =
      scrollBounds.scrollY > scrollBounds.maxScrollY / 2
        ? Math.max(0, scrollBounds.scrollY - 140)
        : Math.min(scrollBounds.maxScrollY, scrollBounds.scrollY + 140);
    expect(Math.abs(scrollTarget - scrollBounds.scrollY)).toBeGreaterThan(60);
    await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), scrollTarget);
    await expect
      .poll(async () =>
        Math.abs((await page.evaluate(() => window.scrollY)) - scrollBounds.scrollY),
      )
      .toBeGreaterThan(60);
    await expect
      .poll(async () => {
        const current = await reactSelectAnchorGeometry(page);
        return Math.abs(current.verticalGap - initial.verticalGap);
      })
      .toBeLessThan(2);
    const afterScroll = await reactSelectAnchorGeometry(page);
    expect(initial.side).toBeDefined();
    expect(Math.abs(afterScroll.triggerTop - initial.triggerTop)).toBeGreaterThan(60);
    expect(
      Math.abs(afterScroll.overlayTop - initial.overlayTop),
      `Fallback overlay should track document scroll: ${JSON.stringify({ initial, afterScroll })}`,
    ).toBeGreaterThan(60);
    expect(Math.abs(afterScroll.verticalGap - initial.verticalGap)).toBeLessThan(2);
    expect(Math.abs(afterScroll.leftOffset - initial.leftOffset)).toBeLessThan(2);
    expect(Math.abs(afterScroll.overlayWidth - afterScroll.triggerWidth)).toBeLessThan(2);

    const resizedViewportWidth = initialViewportWidth <= 390 ? 640 : 390;
    await page.setViewportSize({ width: resizedViewportWidth, height: 844 });
    // The responsive fixture moves the trigger below the viewport. Restore it
    // before testing anchored geometry; an offscreen anchor is viewport-clamped.
    await trigger.scrollIntoViewIfNeeded();
    await expect
      .poll(async () => {
        const current = await reactSelectAnchorGeometry(page);
        return Math.abs(current.overlayWidth - current.triggerWidth);
      })
      .toBeLessThan(2);
    await expect
      .poll(async () => {
        const current = await reactSelectAnchorGeometry(page);
        return Math.abs(current.verticalGap - afterScroll.verticalGap);
      })
      .toBeLessThan(2);
    const afterResize = await reactSelectAnchorGeometry(page);
    expect(Math.abs(afterResize.triggerWidth - afterScroll.triggerWidth)).toBeGreaterThan(2);
    expect(Math.abs(afterResize.verticalGap - afterScroll.verticalGap)).toBeLessThan(2);
    expect(Math.abs(afterResize.verticalGap)).toBeLessThan(20);
    expect(Math.abs(afterResize.leftOffset - afterScroll.leftOffset)).toBeLessThan(2);
    expect(Math.abs(afterResize.overlayWidth - afterResize.triggerWidth)).toBeLessThan(2);
  });

  test(`Vue Choice preserves readonly submission and consumer reset / ${theme}`, async ({
    page,
  }) => {
    await page.goto(`/frame?theme=${theme}&lang=en&contract-fixtures=1#forms`, {
      waitUntil: 'domcontentloaded',
    });
    const form = page.locator('[data-contract-form]');
    const notifications = form.locator('[data-contract-checkbox]');
    const channel = form.locator('[data-contract-radio]');
    const sync = form.locator('[data-contract-switch]');
    const lockedCheckbox = form.locator('[data-contract-readonly-checkbox]');
    const lockedGroup = form.locator('[data-contract-readonly-radio]');
    const lockedSwitch = form.locator('[data-contract-readonly-switch]');

    await expect(notifications).toBeChecked();
    await expect(channel.locator('input[value="2"]')).toBeChecked();
    await expect(sync).toBeChecked();
    await expect(lockedCheckbox).toHaveAttribute('aria-disabled', 'true');
    await expect(lockedGroup).toHaveAttribute('aria-disabled', 'true');
    await expect(lockedSwitch).toHaveAttribute('aria-disabled', 'true');
    await lockedCheckbox.click({ force: true });
    await lockedCheckbox.focus();
    await page.keyboard.press('Space');
    await lockedGroup.locator('input[value="1"]').click({ force: true });
    await lockedGroup.locator('input[value="2"]').focus();
    await page.keyboard.press('ArrowRight');
    await lockedSwitch.click({ force: true });
    await lockedSwitch.focus();
    await page.keyboard.press('Space');
    await expect(lockedCheckbox).toBeChecked();
    await expect(lockedGroup.locator('input[value="2"]')).toBeChecked();
    await expect(lockedSwitch).toBeChecked();
    await expect(await formDataValues(form)).toEqual({
      notifications: 'yes',
      channel: '2',
      sync: 'yes',
      locked: 'yes',
      'locked-channel': '2',
      'locked-sync': 'yes',
    });
    await expect(form.locator('[data-contract-disabled-checkbox]')).toBeDisabled();

    await notifications.uncheck();
    await channel.locator('input[value="1"]').check();
    await sync.uncheck();
    await expect(form.locator('[data-contract-form-state]')).toContainText(
      'false / 1 / false / number',
    );
    await form.locator('[data-contract-reset]').click();
    await expect(form.locator('[data-contract-form-state]')).toContainText(
      'true / 2 / true / number',
    );
    await expect(notifications).toBeChecked();
    await expect(channel.locator('input[value="2"]')).toBeChecked();
    await expect(sync).toBeChecked();
  });

  test(`React Choice preserves readonly submission and reset contracts / ${theme}`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: theme });
    await page.goto('/react-fixture?lang=en&contract-fixtures=1', {
      waitUntil: 'domcontentloaded',
    });
    const form = page.locator('[data-contract-form]');
    const notifications = form.locator('[data-contract-checkbox]');
    const channel = form.locator('[data-contract-radio]');
    const sync = form.locator('[data-contract-switch]');
    const lockedCheckbox = form.locator('[data-contract-readonly-checkbox]');
    const lockedGroup = form.locator('[data-contract-readonly-radio]');
    const lockedSwitch = form.locator('[data-contract-readonly-switch]');

    await expect(notifications).toBeChecked();
    await expect(channel.locator('input[value="2"]')).toBeChecked();
    await expect(sync).toBeChecked();
    await lockedCheckbox.click({ force: true });
    await lockedCheckbox.focus();
    await page.keyboard.press('Space');
    await lockedGroup.locator('input[value="1"]').click({ force: true });
    await lockedGroup.locator('input[value="2"]').focus();
    await page.keyboard.press('ArrowRight');
    await lockedSwitch.click({ force: true });
    await lockedSwitch.focus();
    await page.keyboard.press('Space');
    await expect(lockedCheckbox).toBeChecked();
    await expect(lockedGroup.locator('input[value="2"]')).toBeChecked();
    await expect(lockedSwitch).toBeChecked();
    await expect(await formDataValues(form)).toEqual({
      notifications: 'yes',
      channel: '2',
      sync: 'yes',
      locked: 'yes',
      'locked-channel': '2',
      'locked-sync': 'yes',
    });
    await expect(form.locator('[data-contract-disabled-checkbox]')).toBeDisabled();

    await notifications.uncheck();
    await channel.locator('input[value="1"]').check();
    await sync.uncheck();
    await expect(form.locator('[data-contract-form-state]')).toContainText(
      'false / 1 / false / number',
    );
    await form.locator('[data-contract-reset]').click();
    await expect(form.locator('[data-contract-form-state]')).toContainText(
      'true / 2 / true / number',
    );
    await expect(notifications).toBeChecked();
    await expect(channel.locator('input[value="2"]')).toBeChecked();
    await expect(sync).toBeChecked();

    const uncontrolled = page.locator('[data-contract-uncontrolled-form]');
    const uncontrolledCheckbox = uncontrolled.locator('input[name="notifications"]');
    const uncontrolledSwitch = uncontrolled.locator('input[name="sync"]');
    const uncontrolledRoleSwitch = uncontrolled.getByRole('switch', {
      name: 'Uncontrolled synchronization',
    });
    await uncontrolledCheckbox.uncheck();
    await uncontrolled.locator('input[name="channel"][value="1"]').check();
    await uncontrolledSwitch.uncheck();
    await expect(uncontrolledRoleSwitch).not.toBeChecked();
    await expect(uncontrolledSwitch).not.toHaveAttribute('aria-checked');
    await page.getByRole('button', { name: 'Increase count' }).click();
    await expect(uncontrolledRoleSwitch).not.toBeChecked();
    await expect(uncontrolledSwitch).not.toHaveAttribute('aria-checked');
    await uncontrolled.locator('button[type="reset"]').click();
    await expect(uncontrolledCheckbox).toBeChecked();
    await expect(uncontrolled.locator('input[name="channel"][value="2"]')).toBeChecked();
    await expect(uncontrolledRoleSwitch).toBeChecked();
    await expect(uncontrolledSwitch).toBeChecked();
    await expect(uncontrolledSwitch).not.toHaveAttribute('aria-checked');
  });
}

for (const mode of ['native', 'fallback'] as const) {
  test(`Vue controlled Popover stays open when parent rejects dismiss / ${mode}`, async ({
    page,
  }) => {
    if (mode === 'fallback') await disablePopoverApi(page);
    await page.goto('/frame?theme=light&lang=en&contract-fixtures=1#controls', {
      waitUntil: 'domcontentloaded',
    });
    const controlled = page.locator('[data-overlay-controlled-popover]');
    const container = page.locator('[data-overlay-controlled]');
    const trigger = controlled.locator('.ui-popover__trigger');
    const panel = controlled.locator('.ui-popover__content');
    await trigger.click();
    await expect(panel).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    if (mode === 'fallback') {
      await expectFallbackPanel(panel, 'ui-overlay-panel--fallback-open');
    } else {
      expect(await panel.evaluate((element) => element.matches(':popover-open'))).toBe(true);
    }

    await page.keyboard.press('Escape');
    await expect(container.locator('[data-overlay-dismiss-attempts]')).toHaveText('1');
    await expect(panel).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    await page.locator('main').click({ position: { x: 5, y: 5 } });
    await expect(container.locator('[data-overlay-dismiss-attempts]')).toHaveText('2');
    await expect(panel).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  test(`React controlled Popover stays open and releases tracking after unmount / ${mode}`, async ({
    page,
  }) => {
    if (mode === 'fallback') await disablePopoverApi(page);
    await instrumentOverlayListeners(page);
    await page.goto('/react-fixture?lang=en&contract-fixtures=1', {
      waitUntil: 'domcontentloaded',
    });
    const baseline = await activeOverlayListenerCounts(page);
    const controlled = page.locator('[data-overlay-controlled-popover]');
    const container = page.locator('[data-overlay-controlled]');
    const trigger = controlled.locator('.ui-popover__trigger');
    const panel = controlled.locator('.ui-popover__content');
    await trigger.click();
    await expect(panel).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    if (mode === 'fallback') {
      await expectFallbackPanel(panel, 'ui-overlay-panel--fallback-open');
    } else {
      expect(await panel.evaluate((element) => element.matches(':popover-open'))).toBe(true);
    }

    await page.keyboard.press('Escape');
    await expect(container.locator('[data-overlay-dismiss-attempts]')).toHaveText('1');
    await expect(panel).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const openCounts = await activeOverlayListenerCounts(page);
    expect(openCounts['document.keydown']).toBeGreaterThan(baseline['document.keydown'] ?? 0);
    expect(openCounts['window.resize']).toBeGreaterThan(baseline['window.resize'] ?? 0);

    await page.locator('[data-overlay-unmount]').click();
    await expect(controlled).toHaveCount(0);
    await expect.poll(() => activeOverlayListenerCounts(page)).toEqual(baseline);
  });
}
