import { expect, type Locator, test } from '@playwright/test';

const themes = ['light', 'dark'] as const;

async function expectNoHorizontalOverflow(locator: Locator, name: string) {
  const dimensions = await locator.evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
  }));

  expect(
    dimensions.scrollWidth,
    `${name} should fit its own width (${dimensions.scrollWidth}/${dimensions.clientWidth}px)`,
  ).toBeLessThanOrEqual(dimensions.clientWidth + 1);
}

for (const theme of themes) {
  test(`React Breadcrumb and Dock visual states / ${theme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
    await page.goto(`/react-fixture?theme=${theme}&lang=en`, { waitUntil: 'domcontentloaded' });

    const fixture = page.locator('[data-react-navigation-fixture]');
    await expect(fixture).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    await page.evaluate(() => document.fonts.ready);
    await fixture.scrollIntoViewIfNeeded();

    const defaultBreadcrumb = fixture.locator('[data-navigation="default"]');
    const customBreadcrumb = fixture.locator('[data-navigation="custom"]');
    await expect(defaultBreadcrumb).toHaveAttribute('aria-label', 'Page path');
    await expect(defaultBreadcrumb.locator('.ui-breadcrumb__item')).toHaveCount(3);
    await expect(defaultBreadcrumb.locator('.ui-breadcrumb__separator')).toHaveText(['›', '›']);
    await expect(defaultBreadcrumb.locator('[aria-current="page"]')).toHaveText('Current chapter');
    await expect(customBreadcrumb.locator('.ui-breadcrumb__separator')).toHaveText(['/', '/']);
    await expect(customBreadcrumb.locator('[aria-current="page"]')).toHaveText('Current chapter');

    const dock = fixture.locator('[data-react-adapter="UiDock"]');
    const dockTrailing = dock.locator('.ui-control-surface__group--trailing');
    await expect(dock).toHaveAttribute('aria-label', 'Quick navigation');
    await expect(dock).not.toHaveClass(/ui-dock--compact/);
    await expect(dock.getByRole('link')).toHaveCount(2);
    await expect(dockTrailing.getByRole('button')).toHaveText('Count 0');
    await expect(dock.locator('.ui-control-surface__divider')).toHaveCount(1);
    const ghostStyle = await page
      .getByRole('button', { name: 'Acknowledge', exact: true })
      .evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          color: style.color,
          backgroundColor: style.backgroundColor,
          borderColor: style.borderColor,
          boxShadow: style.boxShadow,
          backdropFilter: style.backdropFilter,
        };
      });
    const quietNavigationActions = [
      page.getByRole('link', { name: 'Back to Design Lab', exact: true }),
      dock.getByRole('link', { name: 'Home', exact: true }),
      dock.getByRole('link', { name: 'Documentation', exact: true }),
      fixture.locator('[data-dock-div]').getByRole('link', { name: 'Home', exact: true }),
    ];
    for (const action of quietNavigationActions) {
      const actualStyle = await action.evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          color: style.color,
          backgroundColor: style.backgroundColor,
          borderColor: style.borderColor,
          boxShadow: style.boxShadow,
          backdropFilter: style.backdropFilter,
        };
      });
      expect(actualStyle).toEqual(ghostStyle);
    }

    for (const [locator, name] of [
      [fixture, 'navigation fixture'],
      [defaultBreadcrumb, 'default Breadcrumb'],
      [customBreadcrumb, 'custom Breadcrumb'],
      [dock, 'normal Dock'],
    ] as const) {
      await expectNoHorizontalOverflow(locator, name);
    }
    const documentWidth = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(documentWidth.scrollWidth).toBeLessThanOrEqual(documentWidth.clientWidth + 1);

    await expect(fixture).toHaveScreenshot(`react-navigation-${theme}-default.png`);

    const defaultHome = defaultBreadcrumb.getByRole('link', { name: 'Home' });
    const defaultDocs = defaultBreadcrumb.getByRole('link', { name: 'Documentation' });
    await defaultHome.focus();
    await expect(defaultHome).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(defaultDocs).toBeFocused();
    await expect(defaultDocs).toHaveCSS('outline-style', 'solid');

    const customHome = customBreadcrumb.getByRole('link', { name: 'Home' });
    const customDocs = customBreadcrumb.getByRole('link', { name: 'Documentation' });
    await customHome.focus();
    await expect(customHome).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(customDocs).toBeFocused();

    const dockHome = dock.getByRole('link', { name: 'Home' });
    const dockDocs = dock.getByRole('link', { name: 'Documentation' });
    const trailingButton = dockTrailing.getByRole('button');
    await dockHome.focus();
    await expect(dockHome).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(dockDocs).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(trailingButton).toBeFocused();
    await expect(trailingButton).toHaveCSS('outline-style', 'solid');
    await fixture.scrollIntoViewIfNeeded();
    await expect(fixture).toHaveScreenshot(`react-navigation-${theme}-focus.png`);

    await fixture.locator('[data-dock-compact-toggle]').click();
    await fixture.locator('[data-dock-trailing-toggle]').click();
    await expect(dock).toHaveClass(/ui-dock--compact/);
    await expect(dockTrailing).toHaveCount(0);
    await expect(dock.locator('.ui-control-surface__divider')).toHaveCount(0);
    await expect(dock.getByRole('link')).toHaveCount(2);
    await expectNoHorizontalOverflow(dock, 'compact Dock without trailing controls');
    await expectNoHorizontalOverflow(fixture, 'navigation fixture with compact Dock');

    await dockDocs.focus();
    await page.keyboard.press('Tab');
    const secondaryDockHome = fixture
      .locator('[data-dock-div]')
      .getByRole('link', { name: 'Home' });
    await expect(secondaryDockHome).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(fixture.locator('[data-dock-compact-toggle]')).toBeFocused();
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await fixture.scrollIntoViewIfNeeded();
    await expect(fixture).toHaveScreenshot(`react-navigation-${theme}-compact-hidden.png`);
  });
}
