import { expect, test } from '@playwright/test';

test('both themes share the refraction geometry across real surfaces and buttons', async ({
  page,
}) => {
  await page.goto('/frame?glass=webgl&theme=light&lang=en#materials');
  const parameters = () =>
    page.locator('[data-glass-variant], [data-refraction-control]').evaluateAll((elements) =>
      elements.map((element) => {
        const style = getComputedStyle(element);
        return ['width', 'softness'].map((role) =>
          style.getPropertyValue(`--neoverse-material-edge-refraction-${role}`).trim(),
        );
      }),
    );
  const light = await parameters();
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  expect(await parameters()).toEqual(light);
});

test('explicit exposure customization retains the canonical frost and fill', async ({ page }) => {
  await page.goto('/frame?glass=webgl&theme=light&lang=en#materials');
  await page.evaluate(() => {
    document.querySelector<HTMLElement>('#app')?.style.setProperty('display', 'none');
    document.body.style.background = 'rgb(112 96 152)';
    const surface = document.createElement('div');
    surface.className = 'material-glass-elevated';
    surface.dataset.brightGlassProbe = '';
    surface.style.cssText =
      'position:fixed;left:30px;top:30px;width:280px;height:160px;border-radius:24px;--neoverse-material-backdrop-brightness:1.04;--neoverse-material-backdrop-contrast:0.92';
    document.body.append(surface);
  });
  const surface = page.locator('[data-bright-glass-probe]');
  await page.waitForTimeout(150);
  const bounds = await surface.boundingBox();
  if (bounds === null) throw new Error('Glass bounds are missing');
  const exposed = await page.screenshot({ clip: bounds });
  const optics = await surface.evaluate((element) => ({
    filter: getComputedStyle(element).backdropFilter,
    fill: getComputedStyle(element).backgroundColor,
  }));
  await surface.evaluate((element) =>
    (element as HTMLElement).style.setProperty('--neoverse-material-backdrop-brightness', '1'),
  );
  await surface.evaluate((element) =>
    (element as HTMLElement).style.setProperty('--neoverse-material-backdrop-contrast', '1'),
  );
  await page.waitForTimeout(150);
  const neutral = await page.screenshot({ clip: bounds });
  const gain = await page.evaluate(
    async ({ exposed, neutral }) => {
      const read = async (data: string) => {
        const bitmap = await createImageBitmap(
          await (await fetch(`data:image/png;base64,${data}`)).blob(),
        );
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const context = canvas.getContext('2d');
        if (context === null) throw new Error('Pixel context is missing');
        context.drawImage(bitmap, 0, 0);
        bitmap.close();
        return context.getImageData(0, 0, canvas.width, canvas.height);
      };
      const a = await read(exposed);
      const b = await read(neutral);
      let total = 0;
      let count = 0;
      for (let y = 30; y < a.height - 30; y++)
        for (let x = 30; x < a.width - 30; x++)
          for (let c = 0; c < 3; c++) {
            const i = (y * a.width + x) * 4 + c;
            total += (a.data[i] ?? 0) - (b.data[i] ?? 0);
            count++;
          }
      return total / count;
    },
    { exposed: exposed.toString('base64'), neutral: neutral.toString('base64') },
  );
  expect(gain, 'background exposure must change body pixels, not only the border').toBeGreaterThan(
    3,
  );
  expect(gain, 'the body must retain colour rather than wash out').toBeLessThan(12);
  expect(optics.filter).toContain('blur(18px)');
  expect(optics.fill).toMatch(/(?:0\.2|20%)/);
});

test('real native-refraction module switches keep the particle overlay and finish', async ({
  page,
}) => {
  await page.goto('/?glass=native&theme=light&lang=en#materials');
  await expect(page.locator('[data-glass-variant]').first()).toBeVisible();
  const navigationTrigger = page.locator('[data-playground-nav-trigger]');
  if (await navigationTrigger.isVisible()) await navigationTrigger.click();
  await page.locator('a[href="#card"]').click();
  await expect(page.locator('.nv-particle-canvas')).toHaveCount(1);
  await expect(page.locator('[data-card-default]')).toBeVisible();
  await expect(
    page.locator('[data-neoverse-glass-refraction-edge], [data-neoverse-glass-refraction-defs]'),
  ).toHaveCount(0);
  await expect(page.locator('html[data-neoverse-particle-transitioning]')).toHaveCount(0, {
    timeout: 5000,
  });
  await expect(page.locator('.nv-particle-canvas')).toHaveCount(0);
});
