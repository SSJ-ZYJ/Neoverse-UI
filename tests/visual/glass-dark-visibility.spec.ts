import { expect, test } from '@playwright/test';

for (const mode of ['dark', 'system'] as const) {
  test(`${mode}: Glass keeps coloured catches and buttons favour opposing lit corners`, async ({
    page,
  }, testInfo) => {
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.route('**/*', (route) =>
      route.request().resourceType() === 'font' ? route.abort() : route.continue(),
    );
    await page.goto('/frame?theme=dark&lang=en#materials', { waitUntil: 'domcontentloaded' });
    await page.locator('[data-glass-variant="elevated"]').waitFor();
    await expect(page.locator('html')).toHaveAttribute('data-neoverse-glass-renderer', 'webgl');
    await page.evaluate((mode) => {
      if (mode === 'system') document.documentElement.removeAttribute('data-theme');
      document.querySelector<HTMLElement>('#app')?.style.setProperty('display', 'none');
      document.body.style.background = 'rgb(18 23 34)';
      for (const [index, tier] of ['subtle', 'elevated', 'immersive'].entries()) {
        const card = document.createElement('article');
        card.className = `ui-surface material-glass-${tier}`;
        card.style.cssText = `position:fixed;left:32px;top:${32 + index * 128}px;width:300px;height:100px;border-radius:20px`;
        document.body.append(card);
      }
      const button = document.createElement('button');
      button.className = 'ui-button ui-button--secondary ui-button--md material-glass-subtle';
      button.style.cssText = 'position:fixed;left:32px;top:430px;width:180px;border-radius:12px';
      button.innerHTML =
        '<span class="ui-button__edge-field"></span><span class="ui-button__tone-field"></span><span class="ui-button__content">Button</span>';
      document.body.append(button);
    }, mode);
    const canvas = page.locator('[data-neoverse-glass-renderer-canvas]');
    await expect(async () => {
      const withEdge = await page.screenshot({ path: testInfo.outputPath('dark-glass.png') });
      await canvas.evaluate((el) => ((el as HTMLElement).style.visibility = 'hidden'));
      const withoutEdge = await page.screenshot();
      await canvas.evaluate((el) => (el as HTMLElement).style.removeProperty('visibility'));
      const metrics = await page.evaluate(
        async ({ withEdge, withoutEdge }) => {
          const decode = async (data: string) => {
            const bitmap = await createImageBitmap(
              await (await fetch(`data:image/png;base64,${data}`)).blob(),
            );
            const canvas = document.createElement('canvas');
            canvas.width = bitmap.width;
            canvas.height = bitmap.height;
            const context = canvas.getContext('2d');
            if (!context) throw new Error('Cannot inspect dark Glass');
            context.drawImage(bitmap, 0, 0);
            bitmap.close();
            return context.getImageData(0, 0, canvas.width, canvas.height);
          };
          const a = await decode(withEdge);
          const b = await decode(withoutEdge);
          return [0, 1, 2, 3].map((index) => {
            const y = index === 3 ? 430 : 32 + index * 128;
            const w = index === 3 ? 180 : 300;
            const h = index === 3 ? 40 : 100;
            const sample = (x: number, dy: number) =>
              [0, 1, 2].map((c) => {
                const i = ((y + dy) * a.width + 32 + x) * 4 + c;
                return (a.data[i] ?? 0) - (b.data[i] ?? 0);
              });
            const sides = [
              [0, h / 2],
              [w - 1, h / 2],
              [w / 2, 0],
              [w / 2, h - 1],
            ].map(([x, dy]) => sample(x ?? 0, dy ?? 0));
            return {
              lift: Math.min(...sides.map((rgb) => Math.max(...rgb))),
              colour: Math.max(...sides.map((rgb) => Math.max(...rgb) - Math.min(...rgb))),
              centre: Math.max(...sample(w / 2, h / 2).map(Math.abs)),
              litCorners: Math.min(
                ...[
                  [3, 3],
                  [w - 4, h - 4],
                ].map(([x, dy]) => Math.max(...sample(x ?? 0, dy ?? 0))),
              ),
              quietEdge: Math.max(
                ...[
                  [w - 4, 3],
                  [3, h - 4],
                  [w / 2, 0],
                  [w / 2, h - 1],
                ].map(([x, dy]) => Math.max(...sample(x ?? 0, dy ?? 0))),
              ),
            };
          });
        },
        { withEdge: withEdge.toString('base64'), withoutEdge: withoutEdge.toString('base64') },
      );
      for (const [index, metric] of metrics.entries()) {
        if (index < 3) expect(metric.lift, JSON.stringify(metrics)).toBeGreaterThanOrEqual(1);
        // This backdrop is blue-grey: a real gain may increase its channel
        // differences. Hue/black preservation is checked against live source
        // channels in glass-backdrop-gain.spec.ts, not a grey output oracle.
        if (index === 3) {
          expect(metric.litCorners, JSON.stringify(metrics)).toBeGreaterThan(2);
          expect(
            metric.quietEdge,
            'button highlights belong at top-left and bottom-right',
          ).toBeLessThan(metric.litCorners * 0.35);
        }
        expect(metric.centre, 'the edge must leave the frosted body untouched').toBeLessThanOrEqual(
          1,
        );
      }
    }).toPass({ timeout: 3_000 });
  });
}
