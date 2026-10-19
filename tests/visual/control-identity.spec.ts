import { expect, test } from '@playwright/test';

for (const theme of ['light', 'dark'] as const) {
  test(`sidebar selection retains its semantic background through interaction in ${theme}`, async ({
    page,
  }, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/?theme=${theme}&lang=en#dock`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveCSS('color-scheme', theme);
    if (testInfo.project.name === 'mobile') {
      await page.locator('[data-playground-nav-trigger]').click();
    }
    const navigation = page.locator('#design-lab-navigation');
    const selected = navigation.locator('a[href="#dock"]');
    await expect(selected).toHaveAttribute('aria-current', 'page');
    await selected.scrollIntoViewIfNeeded();
    const expected = await selected.evaluate((element) => {
      const reference = document.createElement('span');
      reference.style.backgroundColor = 'var(--neoverse-color-accent-soft)';
      element.append(reference);
      const background = getComputedStyle(reference).backgroundColor;
      reference.remove();
      return background;
    });
    expect(expected).not.toBe('rgba(0, 0, 0, 0)');
    await expect(selected).toHaveCSS('background-color', expected);
    await expect(selected).toHaveCSS('background-image', 'none');
    if (testInfo.project.name === 'desktop') {
      await selected.hover();
      await expect(selected).toHaveCSS('background-color', expected);
    }
    const bounds = await selected.boundingBox();
    if (!bounds) throw new Error('Selected sidebar item is missing');
    await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    await page.mouse.down();
    await expect(selected).toHaveCSS('background-color', expected);
    // Releasing outside keeps the drawer open and avoids activating navigation.
    await page.mouse.move(bounds.x + bounds.width + 2, bounds.y + bounds.height / 2);
    await page.mouse.up();
    await expect(selected).toHaveCSS('background-color', expected);
    await selected.focus();
    await expect(selected).toBeFocused();
    await expect(selected).toHaveCSS('background-color', expected);
    await expect(navigation.locator('a[href="#controls"]')).toHaveCSS(
      'background-color',
      'rgba(0, 0, 0, 0)',
    );
  });
}

// Legacy Dock sizing, Glass tiers and filled-button optical assertions were
// superseded by dock-language-proportions, dock-consumer-size, button-glass,
// and glass-dark-visibility. Keep interaction-specific contracts here.
for (const theme of ['light', 'dark'] as const) {
  test(`${theme}: segmented selection retains its accent field without changing tier optics`, async ({
    page,
  }) => {
    await page.goto(`/frame?theme=${theme}&lang=en#controls`, { waitUntil: 'domcontentloaded' });
    const group = page
      .locator('#controls-button .ui-segmented-control[data-surface="glass-subtle"]')
      .first();
    const slider = group.locator('.ui-segmented-control__slider');
    await expect(slider).toBeVisible();
    expect(await slider.evaluate((element) => getComputedStyle(element).backgroundImage)).not.toBe(
      'none',
    );
    const base = await group.evaluate((element) => ({
      fill: getComputedStyle(element).backgroundColor,
      filter: getComputedStyle(element).backdropFilter,
    }));
    await group.getByRole('radio', { name: 'Two', exact: true }).click();
    expect(
      await group.evaluate((element) => ({
        fill: getComputedStyle(element).backgroundColor,
        filter: getComputedStyle(element).backdropFilter,
      })),
    ).toEqual(base);
  });
}
