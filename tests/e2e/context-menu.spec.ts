import type { Locator, Page } from '@playwright/test';
import { adapters, disablePopoverApi, expect, openContextMenuAtZone, test } from '../support/e2e';

type SubmenuLog = { count: number };
function motionLog(page: Page): Promise<SubmenuLog | undefined> {
  return page.evaluate(
    () => (window as Window & { __submenuMotions?: SubmenuLog }).__submenuMotions,
  );
}
async function recordSubmenuMotion(page: Page): Promise<void> {
  await page.evaluate(() => {
    const log: SubmenuLog = { count: 0 };
    (window as Window & { __submenuMotions?: SubmenuLog }).__submenuMotions = log;
    document.addEventListener(
      'transitionstart',
      (e) => {
        if (
          e.target instanceof Element &&
          e.target.matches('.ui-context-menu__submenu') &&
          (e as TransitionEvent).propertyName === 'opacity'
        )
          log.count += 1;
      },
      true,
    );
  });
}

async function resetSubmenuMotion(page: Page): Promise<void> {
  await page.evaluate(() => {
    const log = (window as Window & { __submenuMotions?: SubmenuLog }).__submenuMotions;
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

test.describe('context menu', () => {
  for (const adapter of adapters) {
    test(`${adapter.name}: an open context menu and submenu follow their invocation material`, async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(adapter.url('light', 'overlays'));
      const trigger = page.locator('[data-context-menu-keyboard]');
      const scope = trigger.locator('xpath=..');
      const setMaterial = (mode: string) =>
        scope.evaluate(
          (element, mode) => element.setAttribute('data-neoverse-material', mode),
          mode,
        );
      await setMaterial('solid');
      await trigger.press('Enter');
      const panel = page.locator('.ui-context-menu');
      const submenu = page.locator('.ui-context-menu__submenu');
      await expect(panel).toBeVisible();
      await panel.locator('[data-entry-id="theme"]').press('ArrowRight');
      await expect(submenu).toBeVisible();
      await expect(panel).toHaveCSS('backdrop-filter', 'none');
      await expect(submenu).toHaveCSS('backdrop-filter', 'none');
      await setMaterial('glass');
      await expect(panel).toHaveCSS('backdrop-filter', /blur\(18px\)/);
      await expect(submenu).toHaveCSS('backdrop-filter', /blur\(18px\)/);
      await setMaterial('frosted');
      await expect(panel).toHaveCSS('backdrop-filter', /blur\(12px\)/);
      await expect(submenu).toHaveCSS('backdrop-filter', /blur\(12px\)/);
      await setMaterial('solid');
      await expect(panel).toHaveCSS('backdrop-filter', 'none');
      await expect(submenu).toHaveCSS('backdrop-filter', 'none');
    });

    test(`${adapter.name}: keyboard opening anchors the menu to the invoking button`, async ({
      page,
    }) => {
      await page.goto(adapter.url('light', 'overlays'));
      const trigger = page.locator('[data-context-menu-keyboard]');
      await trigger.evaluate((element) => element.scrollIntoView({ block: 'center' }));
      await trigger.focus();
      // A point-anchored menu uses the button's bounds at keyboard activation.
      const invocation = await trigger.evaluateHandle((button) => {
        const origin = { left: 0, bottom: 0 };
        button.addEventListener(
          'click',
          () => {
            const rect = button.getBoundingClientRect();
            origin.left = rect.left;
            origin.bottom = rect.bottom;
          },
          { capture: true, once: true },
        );
        return origin;
      });
      await trigger.press('Enter');
      const panel = page.locator('.ui-context-menu');
      await expect(panel.locator('[data-entry-id="copy"]')).toBeFocused();
      await expect(panel).toHaveCSS('opacity', '1');
      // The entrance can reach full opacity before its geometry settles.
      await expect(async () => {
        const delta = await panel.evaluate((menu, origin) => {
          const menuRect = menu.getBoundingClientRect();
          return { x: menuRect.left - origin.left, y: menuRect.top - origin.bottom };
        }, invocation);
        expect(Math.abs(delta.x)).toBeLessThan(2);
        expect(delta.y).toBeGreaterThanOrEqual(0);
        expect(delta.y).toBeLessThan(16);
      }).toPass({ timeout: 5000 });
      await invocation.dispose();
      await page.keyboard.press('Escape');
      await expect(trigger).toBeFocused();
    });

    for (const fallback of [false, true]) {
      test(`${adapter.name}: a second right-click slides the open context menu / ${fallback ? 'fallback' : 'native'}`, async ({
        page,
      }) => {
        if (fallback) await disablePopoverApi(page);
        await page.emulateMedia({ reducedMotion: 'no-preference' });
        await page.goto(adapter.url('light', 'overlays'));
        await page.addStyleTag({ content: ':root { --neoverse-motion-spatial-duration: 800ms; }' });
        const zone = page.locator('[data-context-menu-zone]');
        await zone.scrollIntoViewIfNeeded();
        const bounds = await zone.boundingBox();
        if (bounds === null) throw new Error('Missing context menu zone');
        const panel = await openContextMenuAtZone(page, { x: bounds.width - 28, y: 16 });
        await expect(panel).toHaveCSS('opacity', '1');
        const start = await panel.evaluate((element) => element.getBoundingClientRect().left);
        await page.mouse.click(bounds.x + 24, bounds.y + 16, { button: 'right' });
        await expect
          .poll(() =>
            panel.evaluate(
              (element, { from, to }) => {
                const x = element.getBoundingClientRect().left;
                return x < from - 4 && x > to + 8 && getComputedStyle(element).opacity === '1';
              },
              { from: start, to: bounds.x + 24 },
            ),
          )
          .toBe(true);
        await expect
          .poll(() =>
            panel.evaluate(
              (element, x) => Math.abs(element.getBoundingClientRect().left - x),
              bounds.x + 24,
            ),
          )
          .toBeLessThan(2);
        await page.mouse.click(2, 2, { button: 'right' });
        await expect(panel).toBeHidden();
      });
    }
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
    test(`${adapter.name}: hovering a submenu opener keeps the same highlight as other rows`, async ({
      page,
      hasTouch,
    }) => {
      test.skip(hasTouch, 'The hover wash only applies to hover-capable pointers');
      await page.goto(adapter.url('light', 'overlays'));
      const panel = await openContextMenuAtZone(page);
      const rowHighlight = (row: Locator) =>
        row.evaluate(async (element) => {
          const wash = getComputedStyle(element, '::after');
          void wash.backgroundColor;
          await Promise.all(element.getAnimations({ subtree: true }).map((item) => item.finished));
          return [getComputedStyle(element).backgroundColor, wash.backgroundColor];
        });
      const ordinary = panel.locator('[data-entry-id="copy"]');
      const opener = panel.locator('[data-entry-id="theme"]');
      await ordinary.hover();
      const expected = await rowHighlight(ordinary);
      expect(expected[1]).not.toBe('rgba(0, 0, 0, 0)');

      await opener.hover();
      await expect(opener).toHaveAttribute('aria-expanded', 'true');
      await expectSubmenuAtRest(page);
      await expect(opener).toHaveAttribute('aria-expanded', 'true');
      expect(await rowHighlight(opener)).toEqual(expected);
      await page.locator('.ui-context-menu__submenu [data-entry-id]').first().hover();
      await expect(opener).toHaveAttribute('aria-expanded', 'true');
      expect(await rowHighlight(opener)).toEqual(expected);
    });

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
        if (!parent || !column) throw new Error('Both menu levels must be laid out');
        const pr = parent.getBoundingClientRect();
        const cr = column.getBoundingClientRect();
        const onStart = cr.left < pr.left;
        const seamX = onStart ? pr.left + 2 : pr.right - 2;
        const stack = document.elementsFromPoint(seamX, (pr.top + pr.bottom) / 2);
        return {
          overlap: onStart ? cr.right - pr.left : pr.right - cr.left,
          topmost: stack[0]?.className ?? '',
        };
      });
      // The overlapping submenu covers the parent's rim at the seam.
      expect(seam.overlap).toBeGreaterThanOrEqual(3);
      expect(seam.overlap).toBeLessThanOrEqual(6);
      expect(seam.topmost).toContain('ui-context-menu__submenu');
      await expect.poll(() => submenuMotionCount(page)).toBeGreaterThan(0);

      await resetSubmenuMotion(page);
      await panel.getByRole('menuitem', { name: 'Language' }).hover();
      await expect(submenu).toHaveAttribute('aria-label', 'Language');
      await expect.poll(() => submenuMotionCount(page)).toBeGreaterThan(0);

      // Activating the already-open row must not restart the entrance.
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
    await dispatchContextMenu(zone, { x: box.x + 24, y: box.y + 16 });
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
      const hit = await themeRow.evaluate((row) => {
        const r = row.getBoundingClientRect();
        const h = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return { clickable: row === h || row.contains(h), obstruction: h?.className };
      });
      expect(hit.clickable, `Theme row is obscured by ${hit.obstruction}`).toBe(true);
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
    await dispatchContextMenu(zone, { x: viewport.width - 2, y: viewport.height - 2 });
    const panel = page.locator('.ui-context-menu');
    await expect(panel).toBeVisible();
    const bounds = await panel.boundingBox();
    if (bounds === null) throw new Error('The context menu must be laid out');
    expect(bounds.x >= 0 && bounds.y >= 0).toBe(true);
    expect(
      bounds.x + bounds.width <= viewport.width && bounds.y + bounds.height <= viewport.height,
    ).toBe(true);
  });

  async function dispatchContextMenu(zone: Locator, point: { x: number; y: number }) {
    await zone.evaluate(
      (el, p) =>
        el.dispatchEvent(
          new MouseEvent('contextmenu', {
            bubbles: true,
            cancelable: true,
            clientX: p.x,
            clientY: p.y,
          }),
        ),
      point,
    );
  }

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
});
