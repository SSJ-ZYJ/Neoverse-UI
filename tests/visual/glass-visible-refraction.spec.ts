import { expect, test } from '@playwright/test';

for (const theme of ['light', 'dark'] as const) {
  test(`${theme}: opt-in native glass visibly bends backdrop detail at its edge`, async ({
    page,
  }, testInfo) => {
    await page.route('**/*', (route) =>
      route.request().resourceType() === 'font' ? route.abort() : route.continue(),
    );
    await page.goto(`/frame?glass=native&theme=${theme}&lang=en#materials`);
    await page.evaluate(() => {
      document.querySelector<HTMLElement>('#app')?.style.setProperty('display', 'none');
      const stage = document.createElement('div');
      stage.dataset.visibleRefractionStage = '';
      stage.style.cssText =
        'position:fixed;left:24px;top:24px;width:340px;height:240px;background:repeating-linear-gradient(45deg,#5574ba 0 16px,#bd67a1 16px 32px)';
      const card = document.createElement('div');
      card.dataset.visibleRefraction = '';
      card.className = 'material-glass-elevated';
      card.style.cssText =
        'position:absolute;left:20px;top:30px;width:300px;height:160px;border-radius:24px';
      stage.append(card);
      document.body.append(stage);
    });
    const card = page.locator('[data-visible-refraction]');
    await page.waitForTimeout(200);
    const bent = await card.screenshot({ path: testInfo.outputPath('visible-refraction.png') });
    await page
      .locator('[data-visible-refraction-stage]')
      .screenshot({ path: testInfo.outputPath('refraction-scene.png') });
    await card.evaluate((element) =>
      (element as HTMLElement).style.setProperty('--neoverse-material-refraction-strength', '0'),
    );
    await page.waitForTimeout(100);
    const frost = await card.screenshot();
    const bounds = await card.boundingBox();
    if (!bounds) throw new Error('Missing refraction specimen');
    await card.evaluate((element) => ((element as HTMLElement).style.visibility = 'hidden'));
    const raw = await page.screenshot({ clip: bounds });
    const detail = await page.evaluate(
      async ({ bent, frost, raw }) => {
        const decode = async (data: string) => {
          const bitmap = await createImageBitmap(
            await (await fetch(`data:image/png;base64,${data}`)).blob(),
          );
          const canvas = document.createElement('canvas');
          canvas.width = bitmap.width;
          canvas.height = bitmap.height;
          const context = canvas.getContext('2d');
          if (!context) throw new Error('Cannot inspect refraction pixels');
          context.drawImage(bitmap, 0, 0);
          bitmap.close();
          return context.getImageData(0, 0, canvas.width, canvas.height);
        };
        const a = await decode(bent);
        const b = await decode(frost);
        const exposed = await decode(raw);
        const deviation = (image: ImageData, y: number) => {
          const values = Array.from(
            { length: 200 },
            (_, x) => image.data[(y * image.width + 50 + x) * 4] ?? 0,
          );
          const mean = values.reduce((s, v) => s + v, 0) / values.length;
          return Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length);
        };
        let edge = 0;
        let centre = 0;
        for (let x = 50; x < 250; x++) {
          for (let c = 0; c < 3; c++) {
            edge +=
              Math.abs(
                (a.data[(a.width + x) * 4 + c] ?? 0) - (b.data[(b.width + x) * 4 + c] ?? 0),
              ) / 600;
            centre = Math.max(
              centre,
              Math.abs(
                (a.data[(80 * a.width + x) * 4 + c] ?? 0) -
                  (b.data[(80 * b.width + x) * 4 + c] ?? 0),
              ),
            );
          }
        }
        const normalize = (values: number[]) => {
          const mean = values.reduce((s, v) => s + v, 0) / values.length;
          const spread = Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length);
          return values.map((value) => (value - mean) / Math.max(spread, 0.01));
        };
        const line = (image: ImageData, shift: number) =>
          normalize(
            Array.from(
              { length: 200 },
              (_, x) => image.data[(image.width + 50 + x + shift) * 4] ?? 0,
            ),
          );
        const refracted = line(a, 0);
        const best = Array.from({ length: 33 }, (_, i) => i - 16)
          .map((shift) => {
            const source = line(exposed, shift);
            return {
              shift,
              error: refracted.reduce((sum, value, i) => sum + (value - (source[i] ?? 0)) ** 2, 0),
            };
          })
          .sort((a, b) => a.error - b.error)[0];
        return {
          edge,
          centre,
          edgeDetail: deviation(a, 1),
          bodyDetail: deviation(a, 80),
          shift: best?.shift ?? 0,
        };
      },
      {
        bent: bent.toString('base64'),
        frost: frost.toString('base64'),
        raw: raw.toString('base64'),
      },
    );
    expect(detail.edge, 'refraction must visibly change real backdrop pixels').toBeGreaterThan(8);
    expect(detail.edgeDetail, 'the bevel must retain background detail').toBeGreaterThan(10);
    expect(
      Math.abs(detail.shift),
      'background detail bends rather than only becoming sharper',
    ).toBeGreaterThanOrEqual(2);
    expect(detail.bodyDetail, 'the centre stays frosted').toBeLessThan(4);
    expect(detail.centre, 'refraction must leave the central plate unchanged').toBeLessThanOrEqual(
      1,
    );
  });
}
