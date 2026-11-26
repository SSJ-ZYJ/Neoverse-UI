import { adapters, disablePopoverApi, expect, test } from '../support/e2e';

test.describe('overlay layering', () => {
  for (const adapter of adapters) {
    for (const material of ['glass', 'solid', 'frosted'] as const) {
      test(`${adapter.name}: a ${material} drawer slides in and out`, async ({ page }) => {
        await page.emulateMedia({ reducedMotion: 'no-preference' });
        const url = new URL(adapter.url('light', 'overlays'), 'http://localhost');
        url.searchParams.set('material', material);
        await page.goto(`${url.pathname}${url.search}${url.hash}`);
        const trigger = page.locator('[data-drawer-open]');
        const drawer = page.locator('[data-drawer-panel]');
        const transitions = await drawer.evaluateHandle((panel) => {
          const completed: string[] = [];
          panel.addEventListener('transitionend', (event) => {
            if (event.target !== panel || event.propertyName !== 'translate') return;
            completed.push(panel.parentElement?.getAttribute('data-open') === 'true' ? 'enter' : 'exit');
          });
          return completed;
        });

        await trigger.press('Enter');
        await expect.poll(() => transitions.jsonValue()).toEqual(['enter']);
        await expect(drawer).toBeVisible();
        await page.keyboard.press('Escape');
        await expect.poll(() => transitions.jsonValue()).toEqual(['enter', 'exit']);
        await expect(drawer).toBeHidden();
        await expect(trigger).toBeFocused();
        await transitions.dispose();
      });
    }

    test(`${adapter.name}: a drawer covers page overlays but leaves a higher toolbar usable`, async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(adapter.url('light', 'overlays'));
      const trigger = page.locator('[data-drawer-open]');
      const drawer = page.locator('[data-drawer-panel]');
      const close = drawer.locator('[data-drawer-close]');
      await trigger.focus();
      await trigger.press('Enter');
      await expect(close).toBeFocused();

      const { x: overlapX, y: overlapY } = await close.evaluate((element) => {
        const { x, y, width, height } = element.getBoundingClientRect();
        return { x: x + width / 2, y: y + height / 2 };
      });
      await page.evaluate(
        ({ x, y }) => {
          const toolbar = document.createElement('button');
          toolbar.id = 'drawer-competing-toolbar';
          toolbar.textContent = 'External toolbar';
          toolbar.style.cssText = `position: fixed; left: ${x - 8}px; top: ${y - 8}px;
            width: 16px; height: 16px; z-index: var(--neoverse-layout-layer-overlay)`;
          toolbar.onclick = () => {
            toolbar.textContent = 'Toolbar activated';
          };
          document.body.append(toolbar);
        },
        { x: overlapX, y: overlapY },
      );
      const toolbar = page.locator('#drawer-competing-toolbar');
      await page.mouse.click(overlapX, overlapY);
      await expect(drawer).toBeHidden();
      await expect(toolbar).toHaveText('External toolbar');
      await expect(trigger).toBeFocused();

      await toolbar.evaluate((element) => {
        element.style.zIndex = '2147483647';
      });
      await trigger.press('Enter');
      await expect(drawer).toBeVisible();
      await page.mouse.click(overlapX, overlapY);
      await expect(toolbar).toHaveText('Toolbar activated');
      await toolbar.press('Escape');
      await expect(drawer).toBeVisible();
      await toolbar.evaluate((element) => element.remove());
      await close.click();
      await expect(drawer).toBeHidden();
      await expect(trigger).toBeFocused();

      await trigger.press('Enter');
      await expect(drawer).toBeVisible();
      const { x, y } = await drawer.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return { x: rect.left > innerWidth - rect.right ? 1 : innerWidth - 2, y: innerHeight / 2 };
      });
      await page.mouse.click(x, y);
      await expect(drawer).toBeHidden();
      await expect(trigger).toBeFocused();
    });
  }

  test('a fallback context menu still accepts a click over the next specimen', async ({ page }) => {
    await disablePopoverApi(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/frame?theme=light&lang=en#overlays', { waitUntil: 'domcontentloaded' });

    const section = page.locator('#overlays-context-menu');
    const zone = section.locator('[data-context-menu-asset-zone]');
    await zone.evaluate((element) => element.scrollIntoView({ block: 'center' }));
    const bounds = await zone.boundingBox();
    if (!bounds) throw new Error('The context menu specimen must be laid out.');
    await zone.click({ button: 'right', position: { x: 28, y: bounds.height - 10 } });
    await page.mouse.move(2, 2);

    const menu = section.getByRole('menu');
    const action = menu.getByRole('menuitem').and(page.locator('[data-entry-id="remove"]'));
    const next = page.locator('#overlays-dialog');
    await expect(action).toBeVisible();
    const actionBounds = await action.boundingBox();
    const nextBounds = await next.boundingBox();
    if (!actionBounds || !nextBounds) {
      throw new Error('The menu and the next specimen must overlap.');
    }
    const left = Math.max(actionBounds.x, nextBounds.x);
    const right = Math.min(actionBounds.x + actionBounds.width, nextBounds.x + nextBounds.width);
    const top = Math.max(actionBounds.y, nextBounds.y);
    const bottom = Math.min(actionBounds.y + actionBounds.height, nextBounds.y + nextBounds.height);
    expect(right).toBeGreaterThan(left);
    expect(bottom).toBeGreaterThan(top);
    await page.mouse.click((left + right) / 2, (top + bottom) / 2);
    await expect(menu).toBeHidden();
    await expect(section.locator('[data-overlay-selection]')).toContainText('remove');
  });
});
