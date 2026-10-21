import { expect, test } from '@playwright/test';

for (const theme of ['light', 'dark'] as const) {
  test(`${theme}: default Glass preserves the released directional edge`, async ({
    page,
  }, testInfo) => {
    await page.goto(`/frame?theme=${theme}&lang=en#materials`);
    await expect(page.locator('html')).toHaveAttribute('data-neoverse-glass-renderer', 'webgl');
    await expect(page.locator('[data-neoverse-glass-renderer-canvas]')).toHaveCount(1);
    await expect(page.locator('[data-neoverse-glass-native-filter]')).toHaveCount(0);
    await page
      .locator('[data-glass-preview-stage]')
      .nth(1)
      .screenshot({ path: testInfo.outputPath('glass-elevated.png') });
  });

  test(`${theme}: CSS fallback retains the directional refraction field`, async ({ page }) => {
    await page.goto(`/frame?glass=webgl&theme=${theme}&lang=en#materials`);
    await page.evaluate(() =>
      document.documentElement.removeAttribute('data-neoverse-glass-renderer'),
    );
    const edge = await page.locator('[data-glass-variant="elevated"]').evaluate((element) => {
      const field = getComputedStyle(element, '::before');
      return {
        opacity: Number(field.opacity),
        image: field.maskImage,
        filter: field.backdropFilter,
      };
    });
    expect(edge.opacity).toBeGreaterThan(0);
    expect(edge.image).toContain('radial-gradient');
    expect(edge.filter).toContain('brightness(');
  });

  test(`${theme}: the rendered edge stays narrow and leaves the centre untouched`, async ({
    page,
  }) => {
    await page.goto(`/frame?glass=webgl&theme=${theme}&lang=en#materials`);
    await page.evaluate(() => {
      document.querySelector<HTMLElement>('#app')?.style.setProperty('display', 'none');
      document.body.style.background = 'rgb(96 112 136)';
      const card = document.createElement('div');
      card.className = 'material-glass-elevated';
      card.dataset.edgeProbe = '';
      card.style.cssText =
        'position:fixed;left:32px;top:32px;width:240px;height:140px;border-radius:24px';
      document.body.append(card);
    });
    const card = page.locator('[data-edge-probe]');
    await expect(page.locator('html')).toHaveAttribute('data-neoverse-glass-renderer', 'webgl');
    await page.waitForTimeout(100);
    const withEdge = await card.screenshot();
    await page.locator('[data-neoverse-glass-renderer-canvas]').evaluate((canvas) => {
      (canvas as HTMLElement).style.visibility = 'hidden';
    });
    const withoutEdge = await card.screenshot();
    const delta = await page.evaluate(
      async ({ withEdge, withoutEdge }) => {
        const decode = async (data: string) => {
          const image = await createImageBitmap(
            await (await fetch(`data:image/png;base64,${data}`)).blob(),
          );
          const canvas = document.createElement('canvas');
          canvas.width = image.width;
          canvas.height = image.height;
          const context = canvas.getContext('2d');
          if (!context) throw new Error('Cannot inspect the edge pixels');
          context.drawImage(image, 0, 0);
          image.close();
          return context.getImageData(0, 0, canvas.width, canvas.height);
        };
        const a = await decode(withEdge);
        const b = await decode(withoutEdge);
        let rim = 0;
        let inner = 0;
        for (let y = 32; y < a.height - 32; y++) {
          for (let x = 0; x < a.width; x++) {
            const distance = Math.min(x, a.width - 1 - x);
            for (let c = 0; c < 3; c++) {
              const i = (y * a.width + x) * 4 + c;
              const change = Math.abs((a.data[i] ?? 0) - (b.data[i] ?? 0));
              if (distance < 2) rim = Math.max(rim, change);
              if (distance >= 4) inner = Math.max(inner, change);
            }
          }
        }
        return { rim, inner };
      },
      { withEdge: withEdge.toString('base64'), withoutEdge: withoutEdge.toString('base64') },
    );
    expect(delta.rim, 'the perimeter must catch light').toBeGreaterThan(1);
    expect(delta.inner, 'no broad sampled band inside the glass').toBeLessThanOrEqual(1);
  });
}
