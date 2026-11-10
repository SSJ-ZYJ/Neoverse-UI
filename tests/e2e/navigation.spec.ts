import { expect, test } from '@playwright/test';

test.describe('navigation', () => {
  test('breadcrumb links navigate and update the current item', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/react-fixture?theme=light&lang=en', { waitUntil: 'domcontentloaded' });

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
    expect(errors).toEqual([]);
  });

  test('dock keeps native links, trailing content and the compact composition', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/react-fixture?theme=light&lang=zh', { waitUntil: 'domcontentloaded' });

    const dock = page.locator('[data-react-adapter="UiDock"]');
    await expect(dock).toHaveAttribute('aria-label', '快捷导航');
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
    await expect(dock.getByRole('link')).toHaveCount(2);

    await page.locator('[data-dock-trailing-toggle]').click();
    await expect(trailing.getByRole('button')).toHaveText('计数 1');
    expect(errors).toEqual([]);
  });

  test('segmented control supports keyboard selection and skips disabled values', async ({
    page,
  }) => {
    await page.goto('/react-fixture?theme=light&lang=en&contract-fixtures=1', {
      waitUntil: 'domcontentloaded',
    });
    const group = page.locator('[data-react-adapter="UiSegmentedControl"]');
    const radios = group.getByRole('radio');

    await radios.first().focus();
    await radios.first().press('ArrowRight');
    await expect(radios.nth(2)).toBeFocused();
    await expect(radios.nth(2)).toHaveAttribute('aria-checked', 'true');
    await radios.nth(2).press('Home');
    await expect(radios.first()).toHaveAttribute('aria-checked', 'true');
    await radios.first().press('End');
    await expect(radios.nth(2)).toHaveAttribute('aria-checked', 'true');
    await radios.nth(2).press('ArrowRight');
    await expect(radios.first()).toHaveAttribute('aria-checked', 'true');
  });

  test('segmented control reconciles rejected, loading and disabled updates', async ({ page }) => {
    await page.goto('/react-fixture?theme=light&lang=en&contract-fixtures=1', {
      waitUntil: 'domcontentloaded',
    });
    const group = page.locator('[data-react-adapter="UiSegmentedControl"]');
    const radios = group.getByRole('radio');

    await page.locator('[data-parity-reject]').click();
    await radios.nth(2).click();
    await expect(radios.first()).toHaveAttribute('aria-checked', 'true');
    await expect(radios.nth(2)).toHaveAttribute('aria-checked', 'false');

    await page.locator('[data-parity-loading]').click();
    await expect(group).toHaveAttribute('aria-busy', 'true');
    for (const radio of await radios.all()) await expect(radio).toBeDisabled();
    await page.locator('[data-parity-loading]').click();

    await page.locator('[data-parity-disabled]').click();
    for (const radio of await radios.all()) await expect(radio).toBeDisabled();
    await page.locator('[data-parity-disabled]').click();
    await page.locator('[data-parity-options]').click();
    await expect(
      page.locator('[data-parity-uncontrolled]').getByRole('radio', { checked: true }),
    ).toHaveText('C');
  });

  test('Vue segmented control selects with pointer and keyboard in one group', async ({ page }) => {
    await page.goto('/frame?theme=light&lang=en#controls', { waitUntil: 'domcontentloaded' });
    const group = page.locator('#controls-segmented-control .ui-segmented-control').first();
    const radios = group.getByRole('radio');

    await expect(radios.first()).toHaveAttribute('aria-checked', 'true');
    await expect(radios.nth(1)).toBeDisabled();
    await radios.nth(2).click();
    await expect(radios.nth(2)).toHaveAttribute('aria-checked', 'true');
    await expect(radios.first()).toHaveAttribute('aria-checked', 'false');

    await radios.nth(2).press('ArrowRight');
    await expect(radios.first()).toBeFocused();
    await expect(radios.first()).toHaveAttribute('aria-checked', 'true');
  });

  test('step flow marks exactly one current stage', async ({ page }) => {
    await page.goto('/frame?theme=light&lang=en#data-display-step-flow', {
      waitUntil: 'domcontentloaded',
    });
    const flow = page.locator('#data-display-step-flow .ui-step-flow');

    await expect(flow).toBeVisible();
    await expect(flow.locator('[aria-current="step"]')).toHaveCount(1);
    await expect(flow.locator('.ui-step-flow__item--complete')).not.toHaveCount(0);
  });

  test('dock navigation item reports the current page and keeps its links reachable', async ({
    page,
  }) => {
    await page.goto('/frame?theme=light&lang=en#dock', { waitUntil: 'domcontentloaded' });
    const dock = page.locator('#dock .ui-dock').first();
    const links = dock.getByRole('link');

    await expect(links.first()).toBeVisible();
    const active = dock.locator('[aria-current="page"]');
    await expect(active).toHaveCount(1);
    const href = await active.getAttribute('href');
    expect(href).toBeTruthy();
    await active.focus();
    await expect(active).toBeFocused();
  });
});
