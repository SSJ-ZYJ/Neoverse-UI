import { expect, test } from '@playwright/test';

for (const theme of ['light', 'dark']) {
  test(`field feedback stays softly colored and readable / ${theme}`, async ({
    page,
  }, testInfo) => {
    // Field state assertions need the mounted form, not every image/network
    // resource to finish loading. Avoid unrelated load-event stalls.
    await page.goto(`/frame?theme=${theme}&lang=zh#forms`, {
      waitUntil: 'domcontentloaded',
    });
    const section = page.locator('#forms-field-states');
    const error = section.locator('.ui-field[data-validation="error"] .ui-field__message');
    const success = section.locator('.ui-field[data-validation="success"] .ui-field__message');
    await expect(error).toBeVisible();
    await expect(success).toBeVisible();
    await expect(section.locator('.ui-field__required')).toHaveCSS(
      'color',
      await error.evaluate((element) => getComputedStyle(element).color),
    );
    const colors = await section.evaluate((element) => {
      const resolve = (state: string) => {
        const message = element.querySelector(
          `.ui-field[data-validation="${state}"] .ui-field__message`,
        );
        if (!message) throw new Error('Missing field feedback');
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) throw new Error('No color context');
        context.fillStyle = getComputedStyle(message).color;
        context.fillRect(0, 0, 1, 1);
        return [...context.getImageData(0, 0, 1, 1).data];
      };
      return { error: resolve('error'), success: resolve('success') };
    });
    expect(colors.error[0]).toBeGreaterThan(200);
    expect(colors.success[1]).toBeGreaterThan(130);
    expect(colors.error[3]).toBe(255);
    expect(colors.success[3]).toBe(255);
    await section.screenshot({ path: testInfo.outputPath(`field-feedback-${theme}.png`) });
  });
}
