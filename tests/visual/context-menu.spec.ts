import { expect, type Page, test } from '@playwright/test';

const adapters = [
  { name: 'Vue', url: '/frame?theme=light&lang=en#overlays' },
  { name: 'React', url: '/react-fixture?lang=en' },
] as const;

async function disablePopoverApi(page: Page) {
  await page.addInitScript(() => {
    Reflect.deleteProperty(HTMLElement.prototype, 'showPopover');
    Reflect.deleteProperty(HTMLElement.prototype, 'hidePopover');
  });
}

async function openMenuAtZone(page: Page, offset = { x: 24, y: 16 }) {
  const zone = page.locator('[data-context-menu-zone]');
  await zone.scrollIntoViewIfNeeded();
  const box = await zone.boundingBox();
  if (!box) throw new Error('Context menu zone must be laid out');
  await page.mouse.click(box.x + offset.x, box.y + offset.y, { button: 'right' });
  const panel = page.locator('.ui-context-menu');
  await expect(panel).toBeVisible();
  return panel;
}

for (const adapter of adapters) {
  for (const mode of ['native', 'fallback'] as const) {
    test(`${adapter.name} opens a cursor context menu and restores focus / ${mode}`, async ({
      page,
    }) => {
      if (mode === 'fallback') await disablePopoverApi(page);
      await page.goto(adapter.url, { waitUntil: 'domcontentloaded' });

      const panel = await openMenuAtZone(page);
      await expect(panel).toHaveAttribute('role', 'menu');
      const side = await panel.getAttribute('data-neoverse-overlay-side');
      expect(side === 'top' || side === 'bottom').toBe(true);

      const items = panel.locator('.ui-context-menu__item');
      // The specimen opens by pointer, which keeps focus in the region; the arrow key
      // then enters the panel at its first row.
      // 样例以指针打开，焦点留在区域；随后方向键从首行进入面板。
      await expect(items.first()).not.toBeFocused();
      await page.keyboard.press('ArrowDown');
      await expect(items.first()).toBeFocused();

      await items.first().press('ArrowDown');
      await expect(items.nth(1)).toBeFocused();
      await items.nth(1).press('Home');
      await expect(items.first()).toBeFocused();
      await items.first().press('End');
      await expect(items.last()).toBeFocused();

      await page.keyboard.press('Escape');
      await expect(panel).toBeHidden();
      const focusInsidePanel = await panel.evaluate((element) =>
        element.contains(document.activeElement),
      );
      expect(focusInsidePanel).toBe(false);
    });
  }
}

test('the Design Lab specimen shows checkable rows, a submenu and a disabled row', async ({
  page,
}) => {
  await page.goto('/frame?theme=light&lang=en#overlays', { waitUntil: 'domcontentloaded' });

  const panel = await openMenuAtZone(page);
  await expect(panel.getByRole('menuitemcheckbox', { name: 'Show details' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await expect(panel.getByRole('menuitem', { name: 'Disabled action' })).toBeDisabled();

  const themeRow = panel.getByRole('menuitem', { name: 'Theme' });
  await expect(themeRow).toHaveAttribute('aria-haspopup', 'menu');
  // The panel's own layout width, unaffected by the presence transform.
  // 面板自身的布局宽度，不受入场变换影响。
  const topWidth = await panel.evaluate((element) => (element as HTMLElement).offsetWidth);
  await themeRow.click();

  // The submenu is its own manual popover teleported to the body.
  // 二级菜单是传送到 body 的独立 manual 浮层。
  const submenu = page.locator('.ui-context-menu__submenu');
  await expect(submenu).toBeVisible();
  await expect(submenu.getByRole('menuitemradio')).toHaveCount(3);
  await expect(submenu.getByRole('menuitemradio', { name: 'system' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  // The column is flush with the panel edge and aligned to the row that opened it, the way
  // a native submenu is; it carries its own glass material so no row shows the page through.
  // 该列贴着面板边缘并与打开它的行对齐，与原生二级菜单一致；它自带玻璃材质，行间不会透出页面。
  // Poll until the column settles: it is placed after it is shown, so the first frame still
  // carries the entrance transform.
  // 轮询到该列落定：它在显示后定位，首帧仍带入场变换。
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const panelEl = [...document.querySelectorAll<HTMLElement>('.ui-context-menu')].find(
            (el) => el.matches(':popover-open'),
          );
          const column = document.querySelector<HTMLElement>('.ui-context-menu__submenu');
          const opener = column?.ownerDocument.querySelector<HTMLElement>(
            '.ui-context-menu__item[data-open="true"]',
          );
          if (!panelEl || !column || !opener) return null;
          const panelRect = panelEl.getBoundingClientRect();
          const columnRect = column.getBoundingClientRect();
          const openerRect = opener.getBoundingClientRect();
          // The column's padding sits above its first row, so the first row is what lines up
          // with the parent item, the way a native submenu does.
          // 该列的内边距位于首行之上，因此与父项对齐的是首行，与原生二级菜单一致。
          const firstRow = column.querySelector<HTMLElement>('.ui-context-menu__item');
          const firstRowTop = firstRow?.getBoundingClientRect().top ?? columnRect.top;
          return {
            gap: Math.round(Math.abs(columnRect.left - panelRect.right)),
            align: Math.round(Math.abs(firstRowTop - openerRect.top)),
            backdrop: getComputedStyle(column).backdropFilter,
            panelWidth: panelEl.offsetWidth,
          };
        }),
      { message: 'submenu settles flush and aligned' },
    )
    .toEqual(
      expect.objectContaining({
        // Sub-pixel rounding is expected; a real misplacement is tens of pixels.
        // 允许亚像素取整；真正的错位是数十像素。
        gap: expect.any(Number),
        align: expect.any(Number),
      }),
    );

  // The panel re-anchors while the page settles, and the column follows it; wait for two
  // identical reads before asserting so a mid-flight position never fails the check.
  // 面板在页面稳定过程中会重新定位，该列跟随它；等到两次读数一致再断言，避免中途位置导致失败。
  const readGeometry = () =>
    page.evaluate(() => {
      const panelEl = [...document.querySelectorAll<HTMLElement>('.ui-context-menu')].find((el) =>
        el.matches(':popover-open'),
      );
      const column = document.querySelector<HTMLElement>('.ui-context-menu__submenu');
      const opener = column?.ownerDocument.querySelector<HTMLElement>(
        '.ui-context-menu__item[data-open="true"]',
      );
      const firstRow = column?.querySelector<HTMLElement>('.ui-context-menu__item') ?? null;
      if (!panelEl || !column || !opener || !firstRow) return null;
      return {
        gap: Math.abs(column.getBoundingClientRect().left - panelEl.getBoundingClientRect().right),
        align: Math.abs(firstRow.getBoundingClientRect().top - opener.getBoundingClientRect().top),
        panelWidth: panelEl.offsetWidth,
      };
    });
  await expect
    .poll(async () => {
      const first = await readGeometry();
      await page.waitForTimeout(120);
      const second = await readGeometry();
      if (!first || !second) return null;
      return Math.max(first.gap, second.gap) < 2 && Math.max(first.align, second.align) < 2;
    })
    .toBe(true);

  const settled = await page.evaluate(() => {
    const panelEl = [...document.querySelectorAll<HTMLElement>('.ui-context-menu')].find((el) =>
      el.matches(':popover-open'),
    );
    const column = document.querySelector<HTMLElement>('.ui-context-menu__submenu');
    const opener = column?.ownerDocument.querySelector<HTMLElement>(
      '.ui-context-menu__item[data-open="true"]',
    );
    const firstRow = column?.querySelector<HTMLElement>('.ui-context-menu__item') ?? null;
    if (!panelEl || !column || !opener || !firstRow) return null;
    return {
      gap: Math.abs(column.getBoundingClientRect().left - panelEl.getBoundingClientRect().right),
      align: Math.abs(firstRow.getBoundingClientRect().top - opener.getBoundingClientRect().top),
      backdrop: getComputedStyle(column).backdropFilter,
      panelWidth: panelEl.offsetWidth,
    };
  });
  if (settled === null) throw new Error('Panel, column and opener must be laid out');
  expect(settled.gap).toBeLessThan(2);
  expect(settled.align).toBeLessThan(2);
  expect(settled.backdrop).not.toBe('none');
  // The submenu is a separate surface, so opening it never widens the panel.
  // 二级菜单是独立表面，展开它不会加宽面板。
  expect(settled.panelWidth).toBeLessThanOrEqual(topWidth + 1);
  await expect(themeRow).toHaveAttribute('aria-expanded', 'true');
  await expect(themeRow).toHaveAttribute('aria-controls', (await submenu.getAttribute('id')) ?? '');

  await submenu.getByRole('menuitemradio', { name: 'dark' }).click();
  await expect(panel).toBeHidden();
  await expect(page.locator('[data-context-menu-zone]')).toContainText('Theme: dark');
});

test('context menu selection reports the chosen item and closes the panel', async ({ page }) => {
  await page.goto('/frame?theme=light&lang=en#overlays', { waitUntil: 'domcontentloaded' });

  const panel = await openMenuAtZone(page);
  await panel.locator('.ui-context-menu__item').first().click();
  await expect(panel).toBeHidden();
  await expect(page.locator('#overlays-context-menu [data-overlay-selection]')).toContainText(
    'copy',
  );
});

test('context menu clamps inside the viewport when opened at the bottom-right corner', async ({
  page,
}) => {
  await page.goto('/frame?theme=light&lang=en#overlays', { waitUntil: 'domcontentloaded' });

  const zone = page.locator('[data-context-menu-zone]');
  await zone.scrollIntoViewIfNeeded();
  const viewport = page.viewportSize();
  if (!viewport) throw new Error('Viewport size is required');
  // Dispatch at the viewport corner so the pointer anchor sits outside the panel bounds.
  // Playwright's dispatchEvent drops pointer coordinates, so construct the event in-page.
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
  if (!bounds) throw new Error('Context menu panel must be laid out');
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.y).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.height);
  await expect(panel).toHaveAttribute('data-neoverse-overlay-side', 'top');
});

test('the page keeps its native menu outside a registered zone', async ({ page }) => {
  await page.goto('/frame?theme=light&lang=en#overlays', { waitUntil: 'domcontentloaded' });

  const prevented = await page.evaluate(() => {
    const target = document.querySelector('#overlays-context-menu [data-overlay-selection]');
    if (!target) throw new Error('Selection output is required');
    const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    target.dispatchEvent(event);
    return event.defaultPrevented;
  });
  expect(prevented).toBe(false);
  await expect(page.locator('.ui-context-menu')).toBeHidden();
});
