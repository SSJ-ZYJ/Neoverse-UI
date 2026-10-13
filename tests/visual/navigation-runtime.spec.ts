import { expect, test } from '@playwright/test';

for (const theme of ['light', 'dark'] as const) {
  test(`React Breadcrumb preserves navigation and updates current items / ${theme}`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`/react-fixture?theme=${theme}&lang=en`);
    const breadcrumb = page.locator('[data-navigation="default"]');
    await expect(breadcrumb).toHaveAttribute('aria-label', 'Page path');
    await expect(breadcrumb.locator('li')).toHaveCount(3);
    await expect(breadcrumb.locator('[aria-current="page"]')).toHaveText('Current chapter');
    await expect(breadcrumb.locator('.ui-breadcrumb__separator[aria-hidden="true"]')).toHaveCount(
      2,
    );
    const home = breadcrumb.getByRole('link', { name: 'Home' });
    await home.focus();
    await home.press('Enter');
    await expect(page).toHaveURL(/#react-navigation-home$/);
    await page.locator('[data-breadcrumb-toggle]').click();
    await expect(breadcrumb.locator('[aria-current="page"]')).toHaveText('Home');
    await expect(breadcrumb.getByRole('link', { name: 'Home' })).toHaveCount(0);
    await expect(breadcrumb.getByRole('link', { name: 'Documentation' })).toHaveAttribute(
      'href',
      '#react-navigation-docs',
    );
    await expect(page.locator('[data-navigation="custom"] [aria-current="page"]')).toHaveText(
      'Home',
    );
    await page.locator('[data-breadcrumb-toggle]').click();
    await expect(breadcrumb.locator('[aria-current="page"]')).toHaveText('Documentation');
    expect(errors).toEqual([]);
  });

  test(`React Dock preserves native links, trailing updates and compact composition / ${theme}`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`/react-fixture?theme=${theme}&lang=zh`);
    const dock = page.locator('[data-react-adapter="UiDock"]');
    await expect(dock).toHaveAttribute('aria-label', '快捷导航');
    await expect(dock).toHaveAttribute('data-surface', 'chrome');
    await expect(dock).toHaveAttribute('data-neoverse-surface-hover', 'static');
    await expect(dock).toHaveAttribute('data-neoverse-glass-edge-pass', 'css');
    await expect(dock).toHaveClass(/ui-control-surface--scale-md/);
    await expect(page.locator('[data-dock-div]')).toHaveJSProperty('tagName', 'DIV');
    const home = dock.getByRole('link', { name: '首页' });
    await home.focus();
    await home.press('Enter');
    await expect(page).toHaveURL(/#react-navigation-home$/);
    const trailing = dock.locator('.ui-control-surface__group--trailing');
    await trailing.getByRole('button').click();
    await expect(trailing.getByRole('button')).toHaveText('计数 1');
    await page.locator('[data-dock-compact-toggle]').click();
    await expect(dock).toHaveClass(/ui-dock--compact/);
    await page.locator('[data-dock-trailing-toggle]').click();
    await expect(trailing).toHaveCount(0);
    await expect(dock.locator('.ui-control-surface__divider')).toHaveCount(0);
    await expect(dock.getByRole('link')).toHaveCount(2);
    await page.locator('[data-dock-trailing-toggle]').click();
    await expect(trailing.getByRole('button')).toHaveText('计数 1');
    await expect(dock.locator('.ui-control-surface__divider')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    expect(errors).toEqual([]);
  });
}
