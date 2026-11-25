import type { Page } from '@playwright/test';
import {
  adapters,
  disablePopoverApi,
  expect,
  expectPanelClosed,
  expectPanelOpen,
  openContextMenuAtZone,
  test,
} from '../support/e2e';

test.describe('modal and transient feedback', () => {
  for (const adapter of adapters) {
    test(`${adapter.name}: Escape closes the modal and restores focus`, async ({ page }) => {
      await page.goto(adapter.url('light', 'overlays'));
      const trigger =
        adapter.name === 'Vue'
          ? page.locator('#overlays-dialog [data-dialog-open]')
          : page.locator('[data-react-adapter="UiDialog"] [data-dialog-open]');
      // WebKit does not move focus to a button on pointer activation, so a
      // clicked trigger never owned focus for the dialog to return. Keyboard
      // activation exercises the return-to-invoker contract on every engine.
      await trigger.focus();
      await trigger.press('Enter');
      const dialog = page.locator('dialog.ui-dialog');
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveAttribute('aria-labelledby', /dialog-title|title/);
      const title = dialog.locator('.ui-dialog__title');
      await expect(title).toHaveCSS('font-size', '18px');
      await title.evaluate((element) =>
        element.style.setProperty('--neoverse-typography-title-md-size', '26px'),
      );
      await expect(title).toHaveCSS('font-size', '26px');
      await page.keyboard.press('Escape');
      await expect(dialog).toBeHidden();
      await expect(trigger).toBeFocused();
    });

    for (const theme of ['light', 'dark'] as const) {
      test(`${adapter.name}: feedback stays compact, exposes its action and fits long notifications / ${theme}`, async ({
        page,
      }) => {
        await page.goto(adapter.url(theme, 'status-feedback'));
        const fixture = page.locator(
          adapter.name === 'Vue' ? '#status-feedback-toast' : '[data-react-adapter="UiToast"]',
        );
        await fixture.locator('[data-toast-open="compact"]').click();
        const toast = page.locator('.ui-toast[role="status"]');
        await expect(toast.getByRole('button')).toHaveCount(0);
        await expect(toast).toHaveCSS('backdrop-filter', /blur\(18px\)/);
        const { alpha, width, height } = await toast.evaluate((element) => {
          const { backgroundColor } = getComputedStyle(element);
          const alpha =
            backgroundColor.match(/\/\s*([\d.]+)\s*\)/)?.[1] ??
            backgroundColor.match(/^rgba\(.*,\s*([\d.]+)\s*\)/)?.[1];
          const { width, height } = element.getBoundingClientRect();
          return {
            alpha: alpha === undefined ? 1 : Number(alpha),
            width,
            height,
          };
        });
        expect(alpha).toBeCloseTo(0.2);
        expect(width).toBeLessThan(230);
        expect(height).toBeLessThanOrEqual(42);

        await fixture.locator('[data-toast-open="action"]').click();
        const action = toast.locator('[data-toast-action]');
        await expect(action).toBeVisible();
        await expect(toast.getByRole('button')).toHaveCount(1);
        await action.click();
        await expect(fixture.locator('[data-toast-details]')).toBeVisible();
        await expect(toast).toBeHidden();

        await fixture.locator('[data-toast-open="notification"]').click();
        await expect(toast.getByRole('button')).toBeVisible();
        const notification = await toast.evaluate((element) => {
          const { left, right, height } = element.getBoundingClientRect();
          return { left, right, height, viewport: document.documentElement.clientWidth };
        });
        expect(notification.height).toBeGreaterThan(height);
        expect(notification.left).toBeGreaterThan(0);
        expect(notification.right).toBeLessThan(notification.viewport);
        await toast.getByRole('button').click();
        await expect(toast).toBeHidden();
      });
    }
  }
});

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
        await page.goto(adapter.url('light', 'overlays'));
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
        await page.goto(adapter.url('light', 'overlays'));
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
        await page.goto(adapter.url('light', 'overlays'));
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
        await page.goto(adapter.url('light', 'overlays'));
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
      await page.goto(adapter.url('light', 'overlays'));
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
      await page.goto(adapter.url('light', 'overlays'));
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
      await page.goto(adapter.url('light', 'overlays'));
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
    await page.goto('/frame?theme=light&lang=en#overlays');
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
    await page.goto('/frame?theme=light&lang=en#overlays');
    const panel = await openContextMenuAtZone(page);

    await panel.getByRole('menuitem').first().click();
    await expect(panel).toBeHidden();
    await expect(page.locator('#overlays-context-menu [data-overlay-selection]')).toContainText(
      'copy',
    );
  });

  test('context menu exposes checkable rows, a submenu and a disabled row', async ({ page }) => {
    await page.goto('/frame?theme=light&lang=en#overlays');
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
      await page.goto(adapter.url('light', 'overlays'));
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
      await page.goto(adapter.url('light', 'overlays'));
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
    await page.goto('/frame?theme=light&lang=en#overlays');
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

  for (const adapter of adapters) {
    test(`${adapter.name}: a cursor submenu stays visible and animated without the Popover API`, async ({
      page,
      hasTouch,
    }) => {
      await disablePopoverApi(page);
      await page.goto(adapter.url('light', 'overlays'));
      const panel = await openContextMenuAtZone(page);
      await recordSubmenuMotion(page);
      const themeRow = panel.getByRole('menuitem', { name: 'Theme' });
      if (hasTouch) await themeRow.tap();
      else await themeRow.click();
      const submenu = page.locator('.ui-context-menu__submenu');
      await expect(submenu).toBeVisible();
      await expectSubmenuAtRest(page);
      // The body-level submenu must not cover the parent row when the fallback
      // panel's CSS position is relative to a transformed containing block.
      const hitCheck = await themeRow.evaluate((row) => {
        const rect = row.getBoundingClientRect();
        const hit = document.elementFromPoint(
          rect.left + rect.width / 2,
          rect.top + rect.height / 2,
        );
        return {
          clickable: row === hit || row.contains(hit),
          obstruction: hit?.className,
        };
      });
      expect(hitCheck.clickable, `Theme row is obscured by ${hitCheck.obstruction}`).toBe(true);
      await expect
        .poll(() => submenu.evaluate((element) => Number(getComputedStyle(element).opacity)))
        .toBeGreaterThan(0.9);
      await expect.poll(() => submenuMotionCount(page)).toBeGreaterThan(0);
    });
  }

  test('context menu stays inside the viewport at the bottom-right corner', async ({ page }) => {
    await page.goto('/frame?theme=light&lang=en#overlays');
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
    await page.goto('/frame?theme=light&lang=en#overlays');
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
    await page.goto('/frame?theme=light&lang=en#status-feedback-tooltip');
    const tooltip = page.locator('#status-feedback-tooltip .ui-tooltip-surface').first();
    await expect(tooltip).toBeVisible();
    await expect(tooltip).not.toBeEmpty();
  });

  for (const theme of ['light', 'dark'] as const) {
    test(`tooltip variants stay distinct on a solid ${theme} backdrop`, async ({ page }) => {
      await page.goto(`/frame?theme=${theme}&lang=en#status-feedback-tooltip`);

      for (const context of ['neutral', 'reduced']) {
        const stage = page.locator(`#status-feedback-tooltip [data-qa-stage="${context}"]`);
        await expect(stage.getByRole('tooltip').last()).toBeVisible();
        const surfaces = await stage.evaluate((element) => {
          const hasShape = CSS.supports('clip-path', 'shape(from 0 0, line to 100% 100%, close)');
          const canvas = document.createElement('canvas').getContext('2d', {
            willReadFrequently: true,
          });
          if (!canvas) throw new Error('A 2D canvas context is required');
          const composite = (color: string) => {
            canvas.fillStyle = color;
            canvas.fillRect(0, 0, 1, 1);
            const [red = 0, green = 0, blue = 0] = canvas.getImageData(0, 0, 1, 1).data;
            return { tone: 0.2126 * red + 0.7152 * green + 0.0722 * blue, blue: blue - red };
          };
          return Array.from(element.querySelectorAll('[role="tooltip"]'), (tooltip) => {
            const plate = getComputedStyle(tooltip, hasShape ? '::before' : null);
            canvas.clearRect(0, 0, 1, 1);
            composite(getComputedStyle(document.body).backgroundColor);
            const background = composite(getComputedStyle(element).backgroundColor);
            const surface = composite(plate.backgroundColor);
            return {
              toneDifference: surface.tone - background.tone,
              blueShift: surface.blue - background.blue,
              backdropFilter: plate.backdropFilter,
            };
          });
        });
        const [neutral, accent] = surfaces;
        if (!neutral || !accent) throw new Error('Both tooltip variants are required');
        const direction = theme === 'light' ? -1 : 1;
        expect(neutral.toneDifference * direction, context).toBeGreaterThanOrEqual(11);
        expect(neutral.blueShift, context).toBeGreaterThanOrEqual(16);
        const accentSeparation = (accent.toneDifference - neutral.toneDifference) * direction;
        expect(accentSeparation, context).toBeGreaterThanOrEqual(3);
        for (const { backdropFilter } of surfaces) {
          if (context === 'neutral') {
            expect(backdropFilter).toContain('blur(12px)');
          } else {
            expect(backdropFilter).toBe('none');
          }
        }
      }
    });
  }
});
