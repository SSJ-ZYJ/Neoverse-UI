import { expect, test } from '@playwright/test';

for (const missing of ['saturation blend', 'rounded path'] as const) {
  test(`the existing light edge remains available without ${missing}`, async ({ page }) => {
    await page.addInitScript((unsupported) => {
      if (unsupported === 'saturation blend') {
        const supports = CSS.supports.bind(CSS);
        CSS.supports = ((property: string, value?: string) =>
          property === 'mix-blend-mode' && value === 'saturation'
            ? false
            : value === undefined
              ? supports(property)
              : supports(property, value)) as typeof CSS.supports;
      } else {
        Reflect.deleteProperty(Path2D.prototype, 'roundRect');
      }
    }, missing);
    await page.goto('/frame?theme=light&lang=en#materials', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('data-neoverse-glass-renderer', 'webgl');
    await expect(page.locator('[data-neoverse-glass-renderer-canvas]')).toHaveCount(1);
    // A source-colour signal must never be drawn without its blend operation.
    await expect(page.locator('[data-neoverse-glass-chroma-canvas]')).toHaveCount(0);
  });
}

test('the light colour field follows the composited backdrop without altering neutral white', async ({
  page,
}, testInfo) => {
  await page.goto('/frame?theme=light&lang=en#materials', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('html')).toHaveAttribute('data-neoverse-glass-renderer', 'webgl');
  await page.evaluate(() => {
    document.querySelector<HTMLElement>('#app')?.style.setProperty('display', 'none');
    const backdrop = document.createElement('div');
    backdrop.dataset.chromaBackdrop = '';
    backdrop.style.cssText = 'position:fixed;inset:0;background:rgb(176 96 32)';
    const surface = document.createElement('article');
    surface.className = 'ui-surface material-glass-elevated';
    surface.style.cssText =
      'position:fixed;left:32px;top:32px;width:300px;height:180px;border-radius:24px;background:transparent!important;border:0!important;box-shadow:none!important;--neoverse-material-filter:blur(0px)';
    document.body.append(backdrop, surface);
  });
  await expect(page.locator('[data-neoverse-glass-chroma-canvas]')).toHaveCount(1);
  await page.waitForTimeout(150);
  const all = await page.screenshot();
  const hiddenChroma = await page.addStyleTag({
    content: '[data-neoverse-glass-chroma-canvas]{visibility:hidden!important}',
  });
  const primary = await page.screenshot();
  await hiddenChroma.evaluate((element) => (element as HTMLElement).remove());
  await page.locator('[data-chroma-backdrop]').evaluate((element) => {
    (element as HTMLElement).style.background = 'rgb(240 240 240)';
  });
  await page.waitForTimeout(100);
  const white = await page.screenshot();
  const hiddenOnWhite = await page.addStyleTag({
    content: '[data-neoverse-glass-chroma-canvas]{visibility:hidden!important}',
  });
  const whitePrimary = await page.screenshot();
  await hiddenOnWhite.evaluate((element) => (element as HTMLElement).remove());
  const samples = await page.evaluate(
    async ({ all, primary, white, whitePrimary }) => {
      const read = async (value: string) => {
        const bitmap = await createImageBitmap(
          await (await fetch(`data:image/png;base64,${value}`)).blob(),
        );
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Missing colour field pixel context');
        context.drawImage(bitmap, 0, 0);
        bitmap.close();
        return [
          [182, 211],
          [39, 39],
        ].map(([x = 0, y = 0]) => Array.from(context.getImageData(x, y, 1, 1).data).slice(0, 3));
      };
      return {
        all: await read(all),
        primary: await read(primary),
        white: await read(white),
        whitePrimary: await read(whitePrimary),
      };
    },
    {
      all: all.toString('base64'),
      primary: primary.toString('base64'),
      white: white.toString('base64'),
      whitePrimary: whitePrimary.toString('base64'),
    },
  );
  await testInfo.attach('chroma-field-pixels', {
    body: JSON.stringify(samples),
    contentType: 'application/json',
  });
  expect(
    Math.max(
      ...samples.all.map((value, index) => (value[0] ?? 0) - (samples.primary[index]?.[0] ?? 0)),
    ),
    'the orange source contributes a stronger red highlight',
  ).toBeGreaterThan(3);
  expect(
    Math.max(
      ...samples.white.flatMap((value, index) =>
        value.map((channel, c) => Math.abs(channel - (samples.whitePrimary[index]?.[c] ?? 0))),
      ),
    ),
    'the colour field leaves neutral white unchanged',
  ).toBeLessThanOrEqual(1);
});

test('a uniform coloured backdrop does not turn a whole button edge into a coloured ring', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'The comparison uses the desktop layout.');
  test.fixme(
    true,
    'Known light-edge drift; see docs/material-standards.md#open-edge-contract-failures.',
  );
  await page.goto('/frame?theme=light&lang=en#materials', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    document.querySelector<HTMLElement>('#app')?.style.setProperty('display', 'none');
    document.body.style.background = 'rgb(202 232 225)';
    const button = document.createElement('button');
    button.className = 'ui-button ui-button--secondary material-glass-subtle';
    button.style.cssText =
      'position:fixed;left:40px;top:40px;width:140px;height:80px;border-radius:16px';
    document.body.append(button);
  });
  await expect(page.locator('[data-neoverse-glass-chroma-canvas]')).toHaveCount(1);
  await page.waitForTimeout(150);
  const lit = await page.screenshot();
  const hidden = await page.addStyleTag({
    content: '[data-neoverse-glass-chroma-canvas]{visibility:hidden!important}',
  });
  const plain = await page.screenshot();
  await hidden.evaluate((element) => (element as HTMLElement).remove());
  const metrics = await page.evaluate(
    async ({ lit, plain }) => {
      const read = async (value: string) => {
        const image = await createImageBitmap(
          await (await fetch(`data:image/png;base64,${value}`)).blob(),
        );
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Cannot inspect the button edge');
        context.drawImage(image, 0, 0);
        image.close();
        return context.getImageData(0, 0, canvas.width, canvas.height);
      };
      const front = await read(lit);
      const base = await read(plain);
      const peak = (x: number, y: number, radius: number) => {
        let value = 0;
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const offset = ((y + dy) * front.width + x + dx) * 4;
            for (let c = 0; c < 3; c++) {
              value = Math.max(
                value,
                Math.abs((front.data[offset + c] ?? 0) - (base.data[offset + c] ?? 0)),
              );
            }
          }
        }
        return value;
      };
      return {
        top: peak(110, 40, 1),
        bottom: peak(110, 119, 1),
        left: peak(40, 80, 1),
        right: peak(179, 80, 1),
        upperLeft: peak(45, 45, 3),
        lowerRight: peak(174, 114, 3),
      };
    },
    { lit: lit.toString('base64'), plain: plain.toString('base64') },
  );
  await testInfo.attach('button-chroma-distribution', {
    body: JSON.stringify(metrics),
    contentType: 'application/json',
  });
  expect(Math.max(metrics.top, metrics.bottom)).toBeLessThanOrEqual(2);
  expect(Math.max(metrics.upperLeft, metrics.lowerRight)).toBeGreaterThan(1);
});

test('a sharp live colour directly beneath a wide edge is not replaced by the blurred body', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'The comparison uses a wide desktop surface.');
  test.fixme(
    true,
    'Known light-edge drift; see docs/material-standards.md#open-edge-contract-failures.',
  );
  await page.goto('/frame?theme=light&lang=en#materials', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    document.querySelector<HTMLElement>('#app')?.style.setProperty('display', 'none');
    const backdrop = document.createElement('canvas');
    backdrop.dataset.sharpBackdrop = '';
    backdrop.width = innerWidth;
    backdrop.height = innerHeight;
    backdrop.style.cssText = 'position:fixed;inset:0;width:100%;height:100%';
    const context = backdrop.getContext('2d');
    if (!context) throw new Error('Missing live backdrop context');
    context.fillStyle = 'rgb(176 96 32)';
    context.fillRect(0, 0, backdrop.width, backdrop.height);
    const surface = document.createElement('article');
    surface.className = 'ui-surface material-glass-elevated';
    surface.style.cssText =
      'position:fixed;left:30px;top:32px;width:1320px;height:160px;border-radius:20px';
    document.body.append(backdrop, surface);
  });
  const paint = async (colour: string) => {
    await page.evaluate((value) => {
      const backdrop = document.querySelector<HTMLCanvasElement>('[data-sharp-backdrop]');
      const context = backdrop?.getContext('2d');
      if (!context) throw new Error('Missing live backdrop context');
      // Repaint a small strip behind the edge without any DOM mutation or
      // change to the much larger orange region that the body blur averages.
      context.fillStyle = value;
      context.fillRect(260, 189, 220, 6);
    }, colour);
    await page.waitForTimeout(100);
    return page.screenshot();
  };
  const orange = await paint('rgb(200 90 40)');
  const blue = await paint('rgb(40 90 200)');
  const pixels = await page.evaluate(
    async ({ orange, blue }) => {
      const sample = async (encoded: string) => {
        const image = await createImageBitmap(
          await (await fetch(`data:image/png;base64,${encoded}`)).blob(),
        );
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Cannot inspect sharp backdrop pixels');
        context.drawImage(image, 0, 0);
        image.close();
        return Array.from(context.getImageData(360, 191, 1, 1).data).slice(0, 3);
      };
      return { orange: await sample(orange), blue: await sample(blue) };
    },
    { orange: orange.toString('base64'), blue: blue.toString('base64') },
  );
  await testInfo.attach('sharp-backdrop-response', {
    body: JSON.stringify(pixels),
    contentType: 'application/json',
  });
  expect(pixels.orange[0], 'the orange source produces an orange edge').toBeGreaterThan(
    pixels.orange[2] ?? 0,
  );
  expect(pixels.blue[2], 'the blue source must not remain orange').toBeGreaterThan(
    pixels.blue[0] ?? 0,
  );
});
