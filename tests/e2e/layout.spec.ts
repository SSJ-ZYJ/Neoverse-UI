import { expect, type Locator, test } from '@playwright/test';

const box = (locator: Locator) =>
  locator.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return {
      width: rect.width,
      height: rect.height,
      radius: Number.parseFloat(style.borderTopLeftRadius),
      fontSize: Number.parseFloat(style.fontSize),
      zoom: style.zoom,
    };
  });

test.describe('layout', () => {
  test('buttons, icon buttons and segmented options keep their token baseline', async ({
    page,
  }) => {
    await page.goto('/frame?theme=light&lang=en#controls', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#controls-button')).toBeVisible();

    const rootFont = await page.evaluate(() =>
      Number.parseFloat(getComputedStyle(document.documentElement).fontSize),
    );
    expect(rootFont).toBeCloseTo(16, 1);

    const circles = page.locator('#controls-button [data-button-shape="circle"]');
    await expect(circles).toHaveCount(3);
    const sizes = [32, 40, 48];
    for (let index = 0; index < sizes.length; index += 1) {
      const shape = await box(circles.nth(index));
      expect(shape.width).toBeCloseTo(sizes[index] ?? 0, 0);
      expect(shape.height).toBeCloseTo(shape.width, 0);
      expect(shape.radius).toBeGreaterThanOrEqual(shape.width / 2);
      expect(shape.zoom).toBe('1');
    }

    const button = await box(page.locator('#controls-button .ui-button').first());
    expect(button.height).toBeCloseTo(40, 0);
    expect(button.fontSize).toBeCloseTo(14, 0);

    const segment = await box(
      page.locator('#controls-segmented-control .ui-segmented-control__option').first(),
    );
    expect(segment.height).toBeCloseTo(32, 0);
    expect(segment.fontSize).toBeCloseTo(14, 0);
  });

  test('form controls keep the 40px input baseline', async ({ page }) => {
    await page.goto('/frame?theme=light&lang=en#forms', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.ui-input').first()).toBeVisible();

    const input = await box(page.locator('.ui-input').first());
    expect(input.height).toBeCloseTo(40, 0);
    expect(input.fontSize).toBeCloseTo(14, 0);
    expect(input.zoom).toBe('1');
  });

  test('badge sizes follow the 13/14/16 scale with one weight and family', async ({ page }) => {
    await page.goto('/frame?theme=light&lang=en#status-feedback', {
      waitUntil: 'domcontentloaded',
    });
    await expect(page.locator('.ui-badge').first()).toBeVisible();

    const typography = await page.locator('.ui-badge').evaluateAll((badges) =>
      badges.map((badge) => {
        const style = getComputedStyle(badge);
        return { size: style.fontSize, weight: style.fontWeight, family: style.fontFamily };
      }),
    );
    expect(new Set(typography.map((entry) => entry.size))).toEqual(
      new Set(['13px', '14px', '16px']),
    );
    expect(new Set(typography.map((entry) => entry.weight))).toEqual(new Set(['650']));
    expect(new Set(typography.map((entry) => entry.family)).size).toBe(1);
  });

  test('interactive controls keep a 24px minimum target', async ({ page }) => {
    await page.goto('/frame?theme=light&lang=en#controls', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#controls-button')).toBeVisible();

    const undersized = await page
      .locator('.ui-button, .ui-icon-button, .ui-segmented-control__option')
      .evaluateAll((elements) =>
        elements
          .map((element) => {
            const rect = element.getBoundingClientRect();
            return {
              label: (element.textContent ?? element.getAttribute('aria-label') ?? '').trim(),
              width: rect.width,
              height: rect.height,
            };
          })
          .filter((entry) => entry.width > 0 && Math.min(entry.width, entry.height) < 24),
      );
    expect(undersized).toEqual([]);
  });

  test('module specimens render at their natural scale', async ({ page }) => {
    for (const module of ['controls', 'forms', 'status-feedback', 'terminal'] as const) {
      await page.goto(`/?lang=en#${module}`, { waitUntil: 'domcontentloaded' });
      const region = page.locator('[data-design-lab-region="module"]');
      await expect(region).toBeVisible();
      const scale = await region.evaluate((element) => ({
        zoom: getComputedStyle(element).zoom,
        fontSize: getComputedStyle(document.documentElement).fontSize,
      }));
      expect(scale.zoom, `${module} must not scale its specimens`).toBe('1');
      expect(Number.parseFloat(scale.fontSize), `${module} root size`).toBeCloseTo(16, 1);
    }
  });
});
