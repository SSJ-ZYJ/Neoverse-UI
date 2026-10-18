import { expect, test } from '@playwright/test';
import { readMaterialFilter } from './material-observation';

const alpha = (cssColor: string): number => {
  const match = cssColor.match(/(?:\/|,)\s*(\d*\.?\d+)\s*\)$/);
  return match ? Number(match[1]) : 1;
};

for (const theme of ['light', 'dark'] as const) {
  test(`filled buttons sample a translucent, blurred plate / ${theme}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.route('**/*', (route) =>
      route.request().resourceType() === 'font' ? route.abort() : route.continue(),
    );
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
      expect(await button.evaluate(readMaterialFilter)).toMatch(/blur\(\d+px\)/);
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

    await page.mouse.move(0, 0);
    await secondary.scrollIntoViewIfNeeded();
    await expect(page.locator('html')).toHaveAttribute('data-neoverse-glass-renderer', 'webgl');
    const bounds = await secondary.boundingBox();
    if (!bounds) throw new Error('Missing rendered button bounds');
    const radius = await secondary.evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).borderTopLeftRadius),
    );
    const canvas = page.locator('[data-neoverse-glass-renderer-canvas]');
    // Capture the full compositor: an element-only screenshot can omit the
    // independent Glass canvas above the actual Vue button.
    const withEdge = await page.screenshot();
    await canvas.evaluate((element) => ((element as HTMLElement).style.visibility = 'hidden'));
    const withoutEdge = await page.screenshot();
    await canvas.evaluate((element) => (element as HTMLElement).style.removeProperty('visibility'));
    const delta = await page.evaluate(
      async ({ withEdge, withoutEdge, bounds, radius }) => {
        const decode = async (data: string) => {
          const bitmap = await createImageBitmap(
            await (await fetch(`data:image/png;base64,${data}`)).blob(),
          );
          const canvas = document.createElement('canvas');
          canvas.width = bitmap.width;
          canvas.height = bitmap.height;
          const context = canvas.getContext('2d');
          if (!context) throw new Error('Cannot inspect button edge pixels');
          context.drawImage(bitmap, 0, 0);
          bitmap.close();
          return context.getImageData(0, 0, canvas.width, canvas.height);
        };
        const a = await decode(withEdge);
        const b = await decode(withoutEdge);
        let centre = 0;
        const corners = [0, 0, 0, 0];
        const left = Math.round(bounds.x);
        const top = Math.round(bounds.y);
        const width = Math.floor(bounds.width);
        const height = Math.floor(bounds.height);
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const corner =
              x < radius && y < radius
                ? 0
                : x >= width - radius && y >= height - radius
                  ? 1
                  : x >= width - radius && y < radius
                    ? 2
                    : x < radius && y >= height - radius
                      ? 3
                      : -1;
            if (corner < 0) continue;
            for (let c = 0; c < 3; c++) {
              const i = ((top + y) * a.width + left + x) * 4 + c;
              corners[corner] = Math.max(
                corners[corner] ?? 0,
                Math.abs((a.data[i] ?? 0) - (b.data[i] ?? 0)),
              );
            }
          }
        }
        for (let y = 8; y < height - 8; y++) {
          for (let x = 0; x < width; x++) {
            const distance = Math.min(x, width - 1 - x);
            for (let c = 0; c < 3; c++) {
              const i = ((top + y) * a.width + left + x) * 4 + c;
              const change = Math.abs((a.data[i] ?? 0) - (b.data[i] ?? 0));
              if (distance >= 8) centre = Math.max(centre, change);
            }
          }
        }
        return {
          centre,
          lit: Math.min(corners[0] ?? 0, corners[1] ?? 0),
          quiet: Math.max(corners[2] ?? 0, corners[3] ?? 0),
        };
      },
      {
        withEdge: withEdge.toString('base64'),
        withoutEdge: withoutEdge.toString('base64'),
        bounds,
        radius,
      },
    );
    expect(delta.centre, 'the refraction must stay at the perimeter').toBeLessThanOrEqual(1);
    expect(delta.lit, 'both opposing lit corners must remain visible').toBeGreaterThan(3);
    expect(delta.quiet, 'the other corners must not close into a bright ring').toBeLessThan(
      delta.lit * 0.45,
    );
  });
}
