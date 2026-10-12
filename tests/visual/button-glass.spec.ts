import { expect, test } from '@playwright/test';

const alpha = (cssColor: string): number => {
  const match = cssColor.match(/(?:\/|,)\s*(\d*\.?\d+)\s*\)$/);
  return match ? Number(match[1]) : 1;
};

for (const theme of ['light', 'dark'] as const) {
  test(`filled buttons sample a translucent, blurred plate / ${theme}`, async ({ page }) => {
    await page.goto(`/frame?theme=${theme}&lang=en#controls`, {
      waitUntil: 'domcontentloaded',
    });

    const gradient = page.locator('[data-qa-context="gradient"]').first();
    const primary = gradient.locator('.ui-button--primary').first();
    const secondary = gradient.locator('.ui-button--secondary').first();
    const ghost = gradient.locator('.ui-button--ghost').first();
    await expect(primary).toBeVisible();

    for (const button of [primary, secondary]) {
      const style = await button.evaluate((element) => {
        const computed = getComputedStyle(element);
        return {
          backgroundColor: computed.backgroundColor,
          backgroundImage: computed.backgroundImage,
          backdropFilter: computed.backdropFilter,
        };
      });
      expect(alpha(style.backgroundColor)).toBeGreaterThan(0);
      expect(alpha(style.backgroundColor)).toBeLessThan(0.5);
      expect(style.backgroundImage).toBe('none');
      expect(style.backdropFilter).toMatch(/blur\(\d+px\)/);
    }

    const before = alpha(
      await secondary.evaluate((element) => getComputedStyle(element).backgroundColor),
    );
    await secondary.hover();
    await expect
      .poll(
        async () =>
          alpha(await secondary.evaluate((element) => getComputedStyle(element).backgroundColor)),
        { timeout: 2_000 },
      )
      .toBeCloseTo(before, 3);

    const ghostStyle = await ghost.evaluate((element) => {
      const computed = getComputedStyle(element);
      return { color: computed.backgroundColor, filter: computed.backdropFilter };
    });
    expect(alpha(ghostStyle.color)).toBe(0);
    expect(ghostStyle.filter).toBe('none');
  });
}
