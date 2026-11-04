import { expect, test } from '@playwright/test';

type EdgeSide = {
  side: 'top' | 'bottom' | 'left' | 'right';
  mean: number;
  coverage: number;
  colours: Array<{ inner: [number, number, number]; edge: [number, number, number] }>;
};

test('reference card has no gaps in its long top and bottom rims', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'The regression uses a wide reference card.');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?glass=webgl&theme=light&lang=zh#card', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('html')).toHaveAttribute('data-neoverse-glass-renderer', 'webgl');
  await page.addStyleTag({ content: '.playground-qa-matrix { grid-template-columns: 1fr; }' });
  const card = page.locator('[data-qa-context="gradient"] .ui-card');
  await card.evaluate((element) => {
    element.style.width = '784px';
    element.style.maxWidth = '100%';
    element.style.minHeight = '144px';
  });
  await card.scrollIntoViewIfNeeded();
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(220);
  const bounds = await card.boundingBox();
  expect(bounds).not.toBeNull();
  expect((bounds?.width ?? 0) / (bounds?.height ?? 1)).toBeGreaterThan(5);
  const lit = await card.screenshot({ animations: 'disabled', scale: 'css' });
  const canvases = page.locator(
    '[data-neoverse-glass-renderer-canvas], [data-neoverse-glass-chroma-canvas]',
  );
  const visibility = await canvases.evaluateAll((nodes) =>
    nodes.map((node) => (node as HTMLElement).style.visibility),
  );
  let body: Buffer;
  try {
    await canvases.evaluateAll((nodes) => {
      for (const node of nodes) (node as HTMLElement).style.visibility = 'hidden';
    });
    body = await card.screenshot({ animations: 'disabled', scale: 'css' });
  } finally {
    await canvases.evaluateAll((nodes, values) => {
      nodes.forEach((node, index) => {
        (node as HTMLElement).style.visibility = values[index] ?? '';
      });
    }, visibility);
  }
  const gaps = await page.evaluate(
    async ({ lit, body }) => {
      const decode = async (value: string) => {
        const bitmap = await createImageBitmap(
          await (await fetch(`data:image/png;base64,${value}`)).blob(),
        );
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Cannot measure the reference card rim.');
        context.drawImage(bitmap, 0, 0);
        bitmap.close();
        return context.getImageData(0, 0, canvas.width, canvas.height);
      };
      const edge = await decode(lit);
      const base = await decode(body);
      return (['top', 'bottom'] as const).map((side) => {
        let run = 0;
        let longestGap = 0;
        for (let x = 28; x < edge.width - 28; x++) {
          let strongest = 0;
          for (let inset = 0; inset <= 3; inset++) {
            const y = side === 'top' ? inset : edge.height - 1 - inset;
            const offset = (y * edge.width + x) * 4;
            for (let channel = 0; channel < 3; channel++) {
              strongest = Math.max(
                strongest,
                Math.abs((edge.data[offset + channel] ?? 0) - (base.data[offset + channel] ?? 0)),
              );
            }
          }
          run = strongest >= 3 ? 0 : run + 1;
          longestGap = Math.max(longestGap, run);
        }
        return { side, longestGap };
      });
    },
    { lit: lit.toString('base64'), body: body.toString('base64') },
  );
  await testInfo.attach('reference-card-rim-gaps', {
    body: JSON.stringify(gaps),
    contentType: 'application/json',
  });
  for (const gap of gaps)
    expect(gap.longestGap, `${gap.side} rim gap in CSS pixels`).toBeLessThanOrEqual(8);
});

test('light Playground Glass keeps a visible edge on its pale backdrop', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'The comparison uses the desktop Playground.');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?glass=webgl&theme=light&lang=zh#materials', {
    waitUntil: 'domcontentloaded',
  });
  await expect(page.locator('html')).toHaveAttribute('data-neoverse-glass-renderer', 'webgl');
  const canvas = page.locator('[data-neoverse-glass-renderer-canvas]');
  const results = [];

  const readSides = async (lit: Buffer, body: Buffer) =>
    (await page.evaluate(
      async ({ lit, body }) => {
        const decode = async (value: string) => {
          const image = await createImageBitmap(
            await (await fetch(`data:image/png;base64,${value}`)).blob(),
          );
          const canvas = document.createElement('canvas');
          canvas.width = image.width;
          canvas.height = image.height;
          const context = canvas.getContext('2d');
          if (!context) throw new Error('Cannot inspect Playground Glass pixels');
          context.drawImage(image, 0, 0);
          image.close();
          return context.getImageData(0, 0, canvas.width, canvas.height);
        };
        const edge = await decode(lit);
        const base = await decode(body);
        const pixel = (image: ImageData, x: number, y: number): [number, number, number] => {
          const offset = (y * image.width + x) * 4;
          return [
            image.data[offset] ?? 0,
            image.data[offset + 1] ?? 0,
            image.data[offset + 2] ?? 0,
          ];
        };
        const difference = (x: number, y: number) => {
          const offset = (y * edge.width + x) * 4;
          return Math.max(
            ...[0, 1, 2].map(
              (channel) => (edge.data[offset + channel] ?? 0) - (base.data[offset + channel] ?? 0),
            ),
          );
        };
        const measure = (side: 'top' | 'bottom' | 'left' | 'right') => {
          const horizontal = side === 'top' || side === 'bottom';
          const length = horizontal ? edge.width : edge.height;
          const changes = [];
          const colours = [];
          for (let position = 28; position < length - 28; position += 4) {
            const samples = [0, 1, 2].map((inset) => {
              const x = horizontal ? position : side === 'left' ? inset : edge.width - 1 - inset;
              const y = horizontal ? (side === 'top' ? inset : edge.height - 1 - inset) : position;
              return { change: difference(x, y), colour: pixel(edge, x, y) };
            });
            const strongest = samples.reduce((best, sample) =>
              sample.change > best.change ? sample : best,
            );
            changes.push(strongest.change);
            const x = horizontal ? position : side === 'left' ? 5 : edge.width - 6;
            const y = horizontal ? (side === 'top' ? 5 : edge.height - 6) : position;
            colours.push({ inner: pixel(base, x, y), edge: strongest.colour });
          }
          return {
            side,
            mean: changes.reduce((sum, value) => sum + value, 0) / changes.length,
            coverage: changes.filter((value) => value >= 4).length / changes.length,
            colours,
          };
        };
        return (['top', 'bottom', 'left', 'right'] as const).map(measure);
      },
      { lit: lit.toString('base64'), body: body.toString('base64') },
    )) as EdgeSide[];

  for (const tier of ['subtle', 'elevated', 'immersive']) {
    const surface = page.locator(`[data-glass-variant="${tier}"]`);
    await surface.evaluate((element) =>
      element.scrollIntoView({ block: 'center', inline: 'nearest' }),
    );
    let sides: EdgeSide[] = [];
    // The renderer repaints on scroll; retry until the scrolled surface's rim
    // has actually been painted instead of racing a single fixed delay.
    for (let attempt = 0; attempt < 8; attempt += 1) {
      await page.waitForTimeout(220);
      const lit = await surface.screenshot({ animations: 'disabled' });
      await canvas.evaluate((element) => ((element as HTMLElement).style.visibility = 'hidden'));
      const body = await surface.screenshot({ animations: 'disabled' });
      await canvas.evaluate((element) =>
        (element as HTMLElement).style.removeProperty('visibility'),
      );
      sides = await readSides(lit, body);
      if (sides.every((side) => side.mean >= 5 && side.coverage >= 0.8)) break;
      await page.waitForTimeout(120);
    }
    results.push({ tier, sides });
  }
  await testInfo.attach('playground-light-edge-visibility', {
    body: JSON.stringify(results),
    contentType: 'application/json',
  });
  for (const result of results) {
    for (const side of result.sides) {
      expect
        .soft(side.mean, `${result.tier}/${side.side}: visible edge brightness`)
        .toBeGreaterThanOrEqual(5);
      expect
        .soft(side.coverage, `${result.tier}/${side.side}: continuous visible edge`)
        .toBeGreaterThanOrEqual(0.8);
    }
  }
});
