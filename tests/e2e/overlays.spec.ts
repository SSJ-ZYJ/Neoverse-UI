import { expect, type Page, test } from '@playwright/test';
import {
  adapters,
  disablePopoverApi,
  expectPanelClosed,
  expectPanelOpen,
  openContextMenuAtZone,
} from '../support/e2e';

async function popoverParts(page: Page, adapterName: string) {
  const shell =
    adapterName === 'Vue'
      ? page.locator('#overlays-popover [data-overlay-popover]')
      : page.locator('[data-react-adapter="UiPopover"]');
  const trigger = shell.locator('.ui-popover__trigger');
  return { shell, trigger, panel: shell.locator('.ui-popover__content') };
}

async function menuParts(page: Page, adapterName: string) {
  const shell =
    adapterName === 'Vue'
      ? page.locator('#overlays-popover [data-overlay-dropdown]')
      : page.locator('[data-react-adapter="UiDropdownMenu"]');
  const trigger = shell.locator('.ui-dropdown-menu__trigger');
  return { shell, trigger, panel: shell.locator('.ui-dropdown-menu__panel') };
}

type SubmenuMotionLog = { count: number };

function motionLog(page: Page): Promise<SubmenuMotionLog | undefined> {
  return page.evaluate(
    () => (window as Window & { __submenuMotions?: SubmenuMotionLog }).__submenuMotions,
  );
}

async function recordSubmenuMotion(page: Page): Promise<void> {
  await page.evaluate(() => {
    const log: SubmenuMotionLog = { count: 0 };
    (window as Window & { __submenuMotions?: SubmenuMotionLog }).__submenuMotions = log;
    document.addEventListener(
      'transitionstart',
      (event) => {
        if (
          event.target instanceof Element &&
          event.target.matches('.ui-context-menu__submenu') &&
          (event as TransitionEvent).propertyName === 'opacity'
        ) {
          log.count += 1;
        }
      },
      true,
    );
  });
}

async function resetSubmenuMotion(page: Page): Promise<void> {
  await page.evaluate(() => {
    const log = (window as Window & { __submenuMotions?: SubmenuMotionLog }).__submenuMotions;
    if (log !== undefined) log.count = 0;
  });
}

async function submenuMotionCount(page: Page): Promise<number> {
  return (await motionLog(page))?.count ?? 0;
}

async function expectSubmenuAtRest(page: Page): Promise<void> {
  await expect
    .poll(() =>
      page.evaluate(() => {
        const parent = document.querySelector('.ui-context-menu');
        const column = document.querySelector('.ui-context-menu__submenu');
        if (parent === null || column === null) return false;
        return [parent, column].every(
          (element) =>
            element.getAttribute('data-neoverse-motion-replay') !== 'from' &&
            element
              .getAnimations({ subtree: false })
              .every((animation) => animation.playState !== 'running'),
        );
      }),
    )
    .toBe(true);
}

test.describe('overlays', () => {
  for (const adapter of adapters) {
    for (const mode of ['native', 'fallback'] as const) {
      test(`${adapter.name}: popover dismisses with Escape and returns focus / ${mode}`, async ({
        page,
      }) => {
        if (mode === 'fallback') await disablePopoverApi(page);
        await page.goto(adapter.url('light', 'overlays'), { waitUntil: 'domcontentloaded' });
        const { trigger, panel } = await popoverParts(page, adapter.name);

        await trigger.click();
        await expectPanelOpen(panel);
        await expect(trigger).toHaveAttribute('aria-expanded', 'true');

        await page.keyboard.press('Escape');
        await expectPanelClosed(panel, trigger);
        await expect(trigger).toBeFocused();
      });

      test(`${adapter.name}: dropdown supports roving focus and Escape / ${mode}`, async ({
        page,
      }) => {
        if (mode === 'fallback') await disablePopoverApi(page);
        await page.goto(adapter.url('light', 'overlays'), { waitUntil: 'domcontentloaded' });
        const { trigger, panel } = await menuParts(page, adapter.name);

        await trigger.click();
        await expectPanelOpen(panel);
        await expect(panel.getByRole('menuitem', { name: 'Open' })).toBeFocused();
        await page.keyboard.press('ArrowDown');
        await expect(panel.getByRole('menuitem', { name: 'Archive' })).toBeFocused();
        await page.keyboard.press('ArrowDown');
        await expect(panel.getByRole('menuitem', { name: 'Remove' })).toBeFocused();
        await page.keyboard.press('ArrowDown');
        await expect(panel.getByRole('menuitem', { name: 'Open' })).toBeFocused();
        await page.keyboard.press('End');
        await expect(panel.getByRole('menuitem', { name: 'Remove' })).toBeFocused();

        await page.keyboard.press('Escape');
        await expectPanelClosed(panel, trigger);
        await expect(trigger).toBeFocused();
      });

      test(`${adapter.name}: an open menu replaces the open popover / ${mode}`, async ({
        page,
      }) => {
        if (mode === 'fallback') await disablePopoverApi(page);
        await page.goto(adapter.url('light', 'overlays'), { waitUntil: 'domcontentloaded' });
        const popover = await popoverParts(page, adapter.name);
        const menu = await menuParts(page, adapter.name);

        await popover.trigger.click();
        await expectPanelOpen(popover.panel);
        await menu.trigger.click();
        await expect(popover.panel).toBeHidden();
        await expectPanelOpen(menu.panel);

        await page.mouse.click(5, 5);
        await expectPanelClosed(menu.panel, menu.trigger);
      });

      test(`${adapter.name}: dropdown releases focus and closes when Tab leaves / ${mode}`, async ({
        page,
      }) => {
        if (mode === 'fallback') await disablePopoverApi(page);
        await page.goto(adapter.url('light', 'overlays'), { waitUntil: 'domcontentloaded' });
        const { trigger, panel } = await menuParts(page, adapter.name);

        await trigger.click();
        await expectPanelOpen(panel);
        const count = await panel.getByRole('menuitem').count();
        for (let index = 0; index < count + 2; index += 1) await page.keyboard.press('Tab');
        await expectPanelClosed(panel, trigger);
      });
    }

    test(`${adapter.name}: a disabled trigger closes its panel and keeps ARIA aligned`, async ({
      page,
    }) => {
      await page.goto(adapter.url('light', 'overlays'), { waitUntil: 'domcontentloaded' });
      const controlled = page.locator('[data-overlay-controlled-popover]');
      const controlledTrigger = controlled.locator('.ui-popover__trigger');
      const controlledPanel = controlled.locator('.ui-popover__content');
      const menu = await menuParts(page, adapter.name);
      const togglePopover = page.locator('[data-overlay-toggle-disabled]');
      const toggleMenu = page.locator('[data-overlay-toggle-menu-disabled]');

      await controlledTrigger.click();
      await expectPanelOpen(controlledPanel);
      await togglePopover.evaluate((button: HTMLElement) => button.click());
      await expect(controlledTrigger).toBeDisabled();
      await expectPanelClosed(controlledPanel, controlledTrigger);

      await togglePopover.evaluate((button: HTMLElement) => button.click());
      await expect(controlledTrigger).toBeEnabled();

      await page.locator('[data-overlay-unmount]').click();
      await expect(controlled).toHaveCount(0);

      await menu.trigger.click();
      await expectPanelOpen(menu.panel);
      await toggleMenu.evaluate((button: HTMLElement) => button.click());
      await expect(menu.trigger).toBeDisabled();
      await expectPanelClosed(menu.panel, menu.trigger);
      await expect(menu.panel.locator('.ui-dropdown-menu__item').first()).not.toBeFocused();
    });

    test(`${adapter.name}: a controlled popover rejects dismissal and unmounts cleanly`, async ({
      page,
    }) => {
      await page.goto(adapter.url('light', 'overlays'), { waitUntil: 'domcontentloaded' });
      const shell = page.locator('[data-overlay-controlled-popover]');
      const trigger = shell.locator('.ui-popover__trigger');
      const panel = shell.locator('.ui-popover__content');
      const attempts = page.locator('[data-overlay-controlled] [data-overlay-dismiss-attempts]');

      await trigger.click();
      await expectPanelOpen(panel);
      await page.keyboard.press('Escape');
      await expect(attempts).toHaveText('1');
      await expectPanelOpen(panel);
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await expect(trigger).toBeFocused();

      await page
        .locator('[data-overlay-unmount]')
        .evaluate((button: HTMLElement) => button.click());
      await expect(shell).toHaveCount(0);
    });

    test(`${adapter.name}: the panel follows a moving anchor`, async ({ page }) => {
      await page.setViewportSize({ width: 1000, height: 700 });
      await page.goto(adapter.url('light', 'overlays'), { waitUntil: 'domcontentloaded' });
      const shell = page.locator('[data-overlay-controlled-popover]');
      const trigger = shell.locator('.ui-popover__trigger');
      const panel = shell.locator('.ui-popover__content');

      await shell.evaluate((element) => {
        Object.assign((element as HTMLElement).style, {
          position: 'fixed',
          left: '100px',
          top: '180px',
          zIndex: '2147483647',
        });
      });
      await page.evaluate(() => document.fonts.ready);
      await trigger.click();
      await expectPanelOpen(panel);

      const offset = () =>
        panel.evaluate((element) => {
          const anchor = element.parentElement?.querySelector('.ui-popover__trigger');
          if (!anchor) throw new Error('The overlay trigger is missing');
          return Math.abs(
            element.getBoundingClientRect().left - anchor.getBoundingClientRect().left,
          );
        });
      await expect.poll(offset).toBeLessThan(2);

      await shell.evaluate((element) => {
        (element as HTMLElement).style.transform = 'translate(120px, 50px)';
      });
      await expect
        .poll(() => trigger.evaluate((element) => element.getBoundingClientRect().left))
        .toBeGreaterThan(210);
      await expect.poll(offset).toBeLessThan(2);
    });
  }

  test('context menu opens at the pointer and supports keyboard entry', async ({ page }) => {
    await page.goto('/frame?theme=light&lang=en#overlays', { waitUntil: 'domcontentloaded' });
    const panel = await openContextMenuAtZone(page);
    const items = panel.locator('.ui-context-menu__item');

    await expect(panel).toHaveAttribute('role', 'menu');
    await expect(items.first()).not.toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(items.first()).toBeFocused();
    await items.first().press('ArrowDown');
    await expect(items.nth(1)).toBeFocused();
    await items.nth(1).press('End');
    await expect(items.last()).toBeFocused();
    await page.keyboard.press('Home');
    await expect(items.first()).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();
    expect(await panel.evaluate((element) => element.contains(document.activeElement))).toBe(false);
  });

  test('context menu selection reports the item and closes the panel', async ({ page }) => {
    await page.goto('/frame?theme=light&lang=en#overlays', { waitUntil: 'domcontentloaded' });
    const panel = await openContextMenuAtZone(page);

    await panel.getByRole('menuitem').first().click();
    await expect(panel).toBeHidden();
    await expect(page.locator('#overlays-context-menu [data-overlay-selection]')).toContainText(
      'copy',
    );
  });

  test('context menu exposes checkable rows, a submenu and a disabled row', async ({ page }) => {
    await page.goto('/frame?theme=light&lang=en#overlays', { waitUntil: 'domcontentloaded' });
    const panel = await openContextMenuAtZone(page);

    await expect(panel.getByRole('menuitemcheckbox', { name: 'Show details' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await expect(panel.getByRole('menuitem', { name: 'Disabled action' })).toBeDisabled();

    const themeRow = panel.getByRole('menuitem', { name: 'Theme' });
    await expect(themeRow).toHaveAttribute('aria-haspopup', 'menu');
    await themeRow.click();

    const submenu = page.locator('.ui-context-menu__submenu');
    await expect(submenu).toBeVisible();
    await expect(submenu.getByRole('menuitemradio')).toHaveCount(3);
    await expect(submenu.getByRole('menuitemradio', { name: 'system' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await expect(themeRow).toHaveAttribute('aria-expanded', 'true');

    await submenu.getByRole('menuitemradio', { name: 'dark' }).click();
    await expect(panel).toBeHidden();
    await expect(page.locator('[data-context-menu-zone]')).toContainText('Theme: dark');
  });

  for (const adapter of adapters) {
    test(`${adapter.name}: a cursor submenu keeps the parent rim behind it and animates on open and switch`, async ({
      page,
    }) => {
      await page.goto(adapter.url('light', 'overlays'), { waitUntil: 'domcontentloaded' });
      const panel = await openContextMenuAtZone(page);
      await recordSubmenuMotion(page);
      const submenu = page.locator('.ui-context-menu__submenu');

      await panel.getByRole('menuitem', { name: 'Theme' }).hover();
      await expect(submenu).toBeVisible();
      await expect(submenu).toHaveAttribute('aria-label', 'Theme');
      // Both menu levels animate their geometry. Waiting only for the column's
      // translate to reach zero still samples the parent's or column's scale
      // transition, giving transient gaps or an overlap above the real 4px.
      await expectSubmenuAtRest(page);

      const seam = await page.evaluate(() => {
        const parent = document.querySelector('.ui-context-menu');
        const column = document.querySelector('.ui-context-menu__submenu');
        if (parent === null || column === null)
          throw new Error('Both menu levels must be laid out');
        const parentRect = parent.getBoundingClientRect();
        const columnRect = column.getBoundingClientRect();
        const onStart = columnRect.left < parentRect.left;
        const seamX = onStart ? parentRect.left + 2 : parentRect.right - 2;
        const stack = document.elementsFromPoint(seamX, (parentRect.top + parentRect.bottom) / 2);
        return {
          overlap: onStart
            ? columnRect.right - parentRect.left
            : parentRect.right - columnRect.left,
          topmost: stack[0]?.className ?? '',
        };
      });
      // One edge width of overlap covers the rim and lands in the Glass occluder sample.
      expect(seam.overlap).toBeGreaterThanOrEqual(3);
      expect(seam.overlap).toBeLessThanOrEqual(6);
      expect(seam.topmost).toContain('ui-context-menu__submenu');
      await expect.poll(() => submenuMotionCount(page)).toBeGreaterThan(0);

      await resetSubmenuMotion(page);
      await panel.getByRole('menuitem', { name: 'Language' }).hover();
      await expect(submenu).toHaveAttribute('aria-label', 'Language');
      await expect.poll(() => submenuMotionCount(page)).toBeGreaterThan(0);

      // A touch fires pointerenter before click; the running entrance must not restart.
      await resetSubmenuMotion(page);
      await panel.getByRole('menuitem', { name: 'Language' }).click();
      await page.waitForTimeout(150);
      expect(await submenuMotionCount(page)).toBe(0);
    });
  }

  for (const adapter of adapters) {
    test(`${adapter.name}: an open submenu follows a parent positioning correction`, async ({
      page,
    }) => {
      await page.goto(adapter.url('light', 'overlays'), { waitUntil: 'domcontentloaded' });
      const panel = await openContextMenuAtZone(page);
      await panel.getByRole('menuitem', { name: 'Theme' }).hover();
      const submenu = page.locator('.ui-context-menu__submenu');
      await expect(submenu).toBeVisible();
      await expectSubmenuAtRest(page);

      const initialLeft = await panel.evaluate((element) =>
        Number.parseFloat(getComputedStyle(element).left),
      );
      // The overlay runtime can correct the parent's CSS position after the
      // column opened. Its painted rim must remain behind the column.
      await panel.evaluate((element, left) => {
        element.style.setProperty('--neoverse-overlay-left', `${left + 14}px`);
      }, initialLeft);
      await expect
        .poll(() => panel.evaluate((element) => element.getBoundingClientRect().left))
        .toBeGreaterThan(initialLeft + 10);
      await expect
        .poll(() =>
          page.evaluate(() => {
            const parent = document.querySelector('.ui-context-menu');
            const column = document.querySelector('.ui-context-menu__submenu');
            if (parent === null || column === null) return false;
            const parentRect = parent.getBoundingClientRect();
            const columnRect = column.getBoundingClientRect();
            const opensLeft = columnRect.left < parentRect.left;
            const overlap = opensLeft
              ? columnRect.right - parentRect.left
              : parentRect.right - columnRect.left;
            return overlap >= 3 && overlap <= 6;
          }),
        )
        .toBe(true);
    });
  }

  test('a touch opens a cursor submenu with an entrance', async ({ page, hasTouch }) => {
    test.skip(!hasTouch, 'Touch input is required');
    await page.goto('/frame?theme=light&lang=en#overlays', { waitUntil: 'domcontentloaded' });
    const zone = page.locator('[data-context-menu-zone]');
    await zone.scrollIntoViewIfNeeded();
    const box = await zone.boundingBox();
    if (box === null) throw new Error('The context menu zone must be laid out');
    await zone.evaluate(
      (element, point) => {
        element.dispatchEvent(
          new MouseEvent('contextmenu', {
            bubbles: true,
            cancelable: true,
            clientX: point.x,
            clientY: point.y,
          }),
        );
      },
      { x: box.x + 24, y: box.y + 16 },
    );
    const panel = page.locator('.ui-context-menu');
    await expect(panel).toBeVisible();
    await recordSubmenuMotion(page);
    await panel.getByRole('menuitem', { name: 'Theme' }).tap();
    await expect(page.locator('.ui-context-menu__submenu')).toBeVisible();
    await expect.poll(() => submenuMotionCount(page)).toBeGreaterThan(0);
  });

  test('a cursor submenu stays visible and animated without the Popover API', async ({
    page,
    hasTouch,
  }) => {
    await disablePopoverApi(page);
    await page.goto('/frame?theme=light&lang=en#overlays', { waitUntil: 'domcontentloaded' });
    const panel = await openContextMenuAtZone(page);
    await recordSubmenuMotion(page);
    const themeRow = panel.getByRole('menuitem', { name: 'Theme' });
    if (hasTouch) await themeRow.tap();
    else await themeRow.click();
    const submenu = page.locator('.ui-context-menu__submenu');
    await expect(submenu).toBeVisible();
    await expect
      .poll(() => submenu.evaluate((element) => Number(getComputedStyle(element).opacity)))
      .toBeGreaterThan(0.9);
    await expect.poll(() => submenuMotionCount(page)).toBeGreaterThan(0);
  });

  test('context menu stays inside the viewport at the bottom-right corner', async ({ page }) => {
    await page.goto('/frame?theme=light&lang=en#overlays', { waitUntil: 'domcontentloaded' });
    const zone = page.locator('[data-context-menu-zone]');
    await zone.scrollIntoViewIfNeeded();
    const viewport = page.viewportSize();
    if (viewport === null) throw new Error('A viewport is required');

    await zone.evaluate(
      (element, point) => {
        element.dispatchEvent(
          new MouseEvent('contextmenu', {
            bubbles: true,
            cancelable: true,
            clientX: point.x,
            clientY: point.y,
          }),
        );
      },
      { x: viewport.width - 2, y: viewport.height - 2 },
    );

    const panel = page.locator('.ui-context-menu');
    await expect(panel).toBeVisible();
    const bounds = await panel.boundingBox();
    if (bounds === null) throw new Error('The context menu must be laid out');
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.y).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.height);
  });

  test('the page keeps its native menu outside a registered zone', async ({ page }) => {
    await page.goto('/frame?theme=light&lang=en#overlays', { waitUntil: 'domcontentloaded' });
    const prevented = await page.evaluate(() => {
      const target = document.querySelector('#overlays-context-menu [data-overlay-selection]');
      if (target === null) throw new Error('The selection output is required');
      const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
      target.dispatchEvent(event);
      return event.defaultPrevented;
    });

    expect(prevented).toBe(false);
    await expect(page.locator('.ui-context-menu')).toBeHidden();
  });

  test('the tooltip surface renders its message', async ({ page }) => {
    await page.goto('/frame?theme=light&lang=en#status-feedback-tooltip', {
      waitUntil: 'domcontentloaded',
    });
    const tooltip = page.locator('#status-feedback-tooltip .ui-tooltip-surface').first();
    await expect(tooltip).toBeVisible();
    await expect(tooltip).not.toBeEmpty();
  });
});
