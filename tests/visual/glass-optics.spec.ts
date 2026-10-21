import { expect, test } from '@playwright/test';

test('zero edge opacity disables the directional edge', async ({ page }) => {
  await page.goto('/frame?glass=webgl&theme=light&lang=en#materials');
  const card = page.locator('[data-glass-variant="elevated"]');
  await card.scrollIntoViewIfNeeded();
  await card.evaluate((element) =>
    (element as HTMLElement).style.setProperty('--neoverse-material-edge-refraction-opacity', '0'),
  );
  await page.waitForTimeout(150);
  const disabled = await card.screenshot({ animations: 'disabled' });
  await page
    .locator('[data-neoverse-glass-renderer-canvas]')
    .evaluate((element) => ((element as HTMLElement).style.visibility = 'hidden'));
  const body = await card.screenshot({ animations: 'disabled' });
  expect(
    disabled.equals(body),
    'no displaced paint may survive an explicit zero edge opacity',
  ).toBe(true);
});

test('bitmap detail stays frosted inside the narrow directional edge', async ({ page }) => {
  await page.goto('/frame?glass=webgl&theme=light&lang=en#materials');
  const bitmap = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 240;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('No bitmap context');
    for (let x = 0; x < 320; x += 16) {
      context.fillStyle = x % 32 === 0 ? '#5574ba' : '#bd67a1';
      context.fillRect(x, 0, 16, 240);
    }
    return canvas.toDataURL('image/png').split(',')[1] ?? '';
  });
  await page.route('**/_glass_backdrop.png', (route) =>
    route.fulfill({ contentType: 'image/png', body: Buffer.from(bitmap, 'base64') }),
  );
  await page.evaluate(() => {
    document.querySelector<HTMLElement>('#app')?.style.setProperty('display', 'none');
    const stage = document.createElement('div');
    stage.style.cssText =
      'position:fixed;left:24px;top:24px;width:320px;height:240px;background:url("/_glass_backdrop.png") 0 0 / 320px 240px';
    const card = document.createElement('div');
    card.className = 'material-glass-elevated';
    card.style.cssText =
      'position:absolute;left:20px;top:30px;width:280px;height:160px;border-radius:24px';
    stage.append(card);
    document.body.append(stage);
  });
  await page.waitForTimeout(500);
  const shot = await page.screenshot();
  const detail = await page.evaluate(async (data) => {
    const image = await createImageBitmap(
      await (await fetch(`data:image/png;base64,${data}`)).blob(),
    );
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('No pixel context');
    context.drawImage(image, 0, 0);
    image.close();
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    const deviation = (y: number) => {
      const values = Array.from(
        { length: 160 },
        (_, x) => pixels.data[(y * pixels.width + 104 + x) * 4] ?? 0,
      );
      const mean = values.reduce((s, v) => s + v, 0) / values.length;
      return Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length);
    };
    return { edge: deviation(60), body: deviation(134) };
  }, shot.toString('base64'));
  expect(detail.edge, 'no clear bitmap band inside the narrow edge').toBeLessThan(8);
  expect(detail.body, 'the card body retains its frost').toBeLessThan(8);
});

test('light frost keeps the pale blue backdrop visible rather than clipping its blurred body to white', async ({
  page,
}) => {
  await page.goto('/frame?glass=webgl&theme=light&lang=en#materials');
  await page.evaluate(() => {
    document.querySelector<HTMLElement>('#app')?.style.setProperty('display', 'none');
    document.body.style.background = 'rgb(220 234 246)';
    const card = document.createElement('div');
    card.className = 'material-glass-elevated';
    card.style.cssText =
      'position:fixed;left:24px;top:24px;width:280px;height:160px;border-radius:24px';
    document.body.append(card);
  });
  await page.waitForTimeout(200);
  const shot = await page.screenshot();
  const colour = await page.evaluate(async (data) => {
    const image = await createImageBitmap(
      await (await fetch(`data:image/png;base64,${data}`)).blob(),
    );
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('No pixel context');
    context.drawImage(image, 0, 0);
    image.close();
    return Array.from(context.getImageData(160, 100, 1, 1).data);
  }, shot.toString('base64'));
  expect(
    (colour[2] ?? 0) - (colour[1] ?? 0),
    'pale blue must remain perceptibly blue after frosting',
  ).toBeGreaterThan(10);
});

test('the directional edge does not expose a broad clear band over a patterned backdrop', async ({
  page,
}) => {
  await page.goto('/frame?glass=webgl&theme=light&lang=en#materials');
  await page.evaluate(() => {
    document.querySelector<HTMLElement>('#app')?.style.setProperty('display', 'none');
    const stage = document.createElement('div');
    stage.style.cssText =
      'position:fixed;left:24px;top:24px;width:320px;height:240px;background:repeating-linear-gradient(45deg,#5574ba 0 16px,#bd67a1 16px 32px)';
    stage.dataset.opticalStage = '';
    const card = document.createElement('div');
    card.className = 'material-glass-elevated';
    card.dataset.opticalCard = '';
    card.style.cssText =
      'position:absolute;left:20px;top:30px;width:280px;height:160px;border-radius:24px';
    stage.append(card);
    document.body.append(stage);
  });
  await page.waitForTimeout(500);
  const card = page.locator('[data-optical-card]');
  const bounds = await card.boundingBox();
  if (bounds === null) throw new Error('Optical card is missing');
  const lit = await page.screenshot();
  await page
    .locator('[data-neoverse-glass-renderer-canvas]')
    .evaluate((e) => ((e as HTMLElement).style.visibility = 'hidden'));
  const body = await page.screenshot();
  await card.evaluate((e) => ((e as HTMLElement).style.visibility = 'hidden'));
  const raw = await page.screenshot();
  const optics = await page.evaluate(
    async ({ lit, body, raw, bounds }) => {
      const read = async (data: string) => {
        const image = await createImageBitmap(
          await (await fetch(`data:image/png;base64,${data}`)).blob(),
        );
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext('2d');
        if (context === null) throw new Error('Cannot inspect optics');
        context.drawImage(image, 0, 0);
        image.close();
        return context.getImageData(0, 0, canvas.width, canvas.height);
      };
      const images = await Promise.all([lit, body, raw].map(read));
      const sample = (image: ImageData, y: number, shift = 0) =>
        Array.from(
          { length: 160 },
          (_, x) =>
            image.data[
              (Math.round(bounds.y + y) * image.width + Math.round(bounds.x + 60 + x + shift)) * 4
            ] ?? 0,
        );
      const deviation = (values: number[]) => {
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        return Math.sqrt(values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length);
      };
      const [edgeImage, bodyImage, rawImage] = images;
      if (!edgeImage || !bodyImage || !rawImage) throw new Error('Optical images are missing');
      const edge = sample(edgeImage, 6);
      const frost = sample(bodyImage, 80);
      const exposed = sample(rawImage, 80);
      return {
        bodyDetail: deviation(frost) / deviation(exposed),
        edgeDetail: deviation(edge),
        bodyEdgeDetail: deviation(sample(bodyImage, 6)),
      };
    },
    {
      lit: lit.toString('base64'),
      body: body.toString('base64'),
      raw: raw.toString('base64'),
      bounds,
    },
  );
  expect(optics.bodyDetail, 'frost must visibly soften the actual pattern').toBeLessThan(0.2);
  expect(optics.edgeDetail, 'the inner edge retains the same frost as the plate').toBeLessThan(8);
  expect(Math.abs(optics.edgeDetail - optics.bodyEdgeDetail)).toBeLessThan(1);
});
