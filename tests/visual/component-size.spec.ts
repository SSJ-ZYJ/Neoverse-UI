import { expect, test } from '@playwright/test';

/** Verify real browser geometry, not just token strings. */
for (const theme of ['light', 'dark'] as const) {
  test(`React uses the same consumer default sizes in ${theme} mode`, async ({ page }) => {
    await page.goto('/react-fixture?lang=en', { waitUntil: 'domcontentloaded' });
    await page.evaluate((value) => {
      document.documentElement.dataset.theme = value;
    }, theme);
    const button = page.locator('[data-react-adapter="UiButton"]');
    await expect(button).toBeVisible();
    await expect(button).toHaveCSS('height', '40px');
    await expect(button).toHaveCSS('font-size', '14px');
    await expect(page.locator('[data-react-adapter="UiIconButton"]')).toHaveCSS('width', '40px');
    await expect(page.locator('[data-react-adapter="UiAction"]')).toHaveCSS('height', '40px');
    await expect(page.locator('[data-react-adapter="UiInput"]')).toHaveCSS('font-size', '14px');
  });

  test(`component defaults are readable at a consumer's 16px root in ${theme} mode`, async ({
    page,
  }) => {
    await page.goto(`/frame?theme=${theme}&lang=en#controls`, {
      waitUntil: 'domcontentloaded',
    });
    await expect(page.locator('#controls-button .ui-button--md').first()).toBeVisible();

    const geometry = await page.evaluate(() => {
      const measure = (selector: string) => {
        const element = document.querySelector<HTMLElement>(selector);
        if (!element) throw new Error(`Missing specimen: ${selector}`);
        const style = getComputedStyle(element);
        return {
          width: Number.parseFloat(style.width),
          height: Number.parseFloat(style.height),
          fontSize: Number.parseFloat(style.fontSize),
        };
      };
      return {
        button: measure('#controls-button .ui-button--md'),
        iconButton: measure('#controls-icon-button .ui-icon-button--md'),
        action: measure('#controls-action .ui-action--md'),
        navigation: measure('#controls-navigation-item .ui-navigation-item.ui-action--md'),
        segment: measure('#controls-segmented-control .ui-segmented-control__option'),
      };
    });

    expect(geometry.button.height).toBeCloseTo(40, 1);
    expect(geometry.button.fontSize).toBeCloseTo(14, 1);
    expect(geometry.iconButton.height).toBeCloseTo(40, 1);
    expect(geometry.iconButton.width).toBeCloseTo(40, 1);
    expect(geometry.action.height).toBeCloseTo(40, 1);
    expect(geometry.action.fontSize).toBeCloseTo(14, 1);
    expect(geometry.navigation.height).toBeCloseTo(32, 1);
    expect(geometry.navigation.fontSize).toBeCloseTo(14, 1);
    expect(geometry.segment.height).toBeCloseTo(32, 1);
    expect(geometry.segment.fontSize).toBeCloseTo(14, 1);

    await page.goto(`/frame?theme=${theme}&lang=en#forms`, {
      waitUntil: 'domcontentloaded',
    });
    await expect(page.locator('.ui-input').first()).toBeVisible();
    const form = await page.evaluate(() => {
      const measure = (selector: string) => {
        const element = document.querySelector<HTMLElement>(selector);
        if (!element) throw new Error(`Missing specimen: ${selector}`);
        const style = getComputedStyle(element);
        return {
          width: Number.parseFloat(style.width),
          height: Number.parseFloat(style.height),
          fontSize: Number.parseFloat(style.fontSize),
        };
      };
      return {
        input: measure('.ui-input:not([data-appearance="terminal"])'),
        choice: measure('.ui-checkbox .ui-choice__control'),
        switch: measure('.ui-switch .ui-choice__control'),
      };
    });
    expect(form.input.height).toBeCloseTo(40, 1);
    expect(form.input.fontSize).toBeCloseTo(14, 1);
    expect(form.choice.width).toBeCloseTo(20, 1);
    expect(form.switch.width).toBeCloseTo(44, 1);
    expect(form.switch.height).toBeCloseTo(24, 1);
  });
}
