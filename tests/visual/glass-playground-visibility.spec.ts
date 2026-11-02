import { expect, test } from '@playwright/test';
import { measureColourRetention } from '../support/glass-colour-metrics';

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

  for (const tier of ['subtle', 'elevated', 'immersive']) {
    const surface = page.locator(`[data-glass-variant="${tier}"]`);
    await surface.scrollIntoViewIfNeeded();
    await page.waitForTimeout(220);
    const lit = await surface.screenshot({ animations: 'disabled' });
    await canvas.evaluate((element) => ((element as HTMLElement).style.visibility = 'hidden'));
    const body = await surface.screenshot({ animations: 'disabled' });
    await canvas.evaluate((element) => (element as HTMLElement).style.removeProperty('visibility'));

    const sides = await page.evaluate(
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
    );
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
        .toBeGreaterThanOrEqual(6);
      expect
        .soft(side.coverage, `${result.tier}/${side.side}: continuous visible edge`)
        .toBeGreaterThanOrEqual(0.8);
      const colours = side.colours
        .map(({ inner, edge }) => measureColourRetention(inner, edge))
        .filter((value) => value.saturationRetention !== null && value.hueDifference !== null);
      if (colours.length > 0) {
        const retained = colours.filter(
          (value) => (value.saturationRetention ?? 0) >= 0.75 && (value.hueDifference ?? 360) <= 15,
        );
        expect
          .soft(
            retained.length / colours.length,
            `${result.tier}/${side.side}: retain inner colour`,
          )
          .toBeGreaterThanOrEqual(0.8);
      }
    }
  }
});
