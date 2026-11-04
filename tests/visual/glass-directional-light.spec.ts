import { expect, test } from '@playwright/test';

test.use({ launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] } });

test('light Glass keeps a continuous edge with stronger upper-left and lower-right corners', async ({
  page,
}, testInfo) => {
  await page.route('**/*', (route) =>
    route.request().resourceType() === 'font' ? route.abort() : route.continue(),
  );
  await page.goto('/frame?theme=light&lang=en#materials', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('html')).toHaveAttribute('data-neoverse-glass-renderer', 'webgl');
  const boxes = await page.evaluate(() => {
    document.querySelector<HTMLElement>('#app')?.style.setProperty('display', 'none');
    const stage = document.createElement('div');
    stage.style.cssText = 'position:fixed;inset:0;background:rgb(128 128 128)';
    const cases = [
      { name: 'subtle surface', className: 'ui-surface material-glass-subtle', y: 20 },
      { name: 'elevated surface', className: 'ui-surface material-glass-elevated', y: 150 },
      { name: 'immersive surface', className: 'ui-surface material-glass-immersive', y: 280 },
      { name: 'button', className: 'ui-button ui-button--secondary material-glass-subtle', y: 410 },
    ];
    for (const item of cases) {
      const element = document.createElement(item.name === 'button' ? 'button' : 'article');
      element.className = item.className;
      element.style.cssText = `position:absolute;left:20px;top:${item.y}px;width:300px;height:100px;border-radius:24px;border:0!important;background:transparent!important;box-shadow:none!important;backdrop-filter:none!important;--neoverse-material-edge-refraction-opacity:0.5`;
      stage.append(element);
    }
    document.body.append(stage);
    return cases.map((item) => ({ name: item.name, x: 20, y: item.y, width: 300, height: 100 }));
  });
  await page.waitForTimeout(350);
  const withEdge = await page.screenshot();
  const canvas = page.locator('[data-neoverse-glass-renderer-canvas]');
  await canvas.evaluate((element) => ((element as HTMLElement).style.visibility = 'hidden'));
  const withoutEdge = await page.screenshot();
  const metrics = await page.evaluate(
    async ({ withEdge, withoutEdge, boxes }) => {
      const decode = async (data: string) => {
        const bitmap = await createImageBitmap(
          await (await fetch(`data:image/png;base64,${data}`)).blob(),
        );
        const target = document.createElement('canvas');
        target.width = bitmap.width;
        target.height = bitmap.height;
        const context = target.getContext('2d');
        if (!context) throw new Error('Missing pixel context');
        context.drawImage(bitmap, 0, 0);
        bitmap.close();
        return context.getImageData(0, 0, target.width, target.height);
      };
      const lit = await decode(withEdge);
      const plain = await decode(withoutEdge);
      return boxes.map((box) => {
        const peak = (left: number, top: number, right: number, bottom: number) => {
          let value = 0;
          for (let y = top; y < bottom; y += 1) {
            for (let x = left; x < right; x += 1) {
              const offset = ((box.y + y) * lit.width + box.x + x) * 4;
              for (let channel = 0; channel < 3; channel += 1) {
                value = Math.max(
                  value,
                  Math.abs((lit.data[offset + channel] ?? 0) - (plain.data[offset + channel] ?? 0)),
                );
              }
            }
          }
          return value;
        };
        const difference = (x: number, y: number) => {
          const offset = ((box.y + y) * lit.width + box.x + x) * 4;
          return Math.max(
            ...[0, 1, 2].map((channel) =>
              Math.abs((lit.data[offset + channel] ?? 0) - (plain.data[offset + channel] ?? 0)),
            ),
          );
        };
        const edges: number[] = [];
        for (let x = 28; x < box.width - 28; x += 4) {
          edges.push(
            Math.max(...[0, 1, 2].map((y) => difference(x, y))),
            Math.max(...[1, 2, 3].map((y) => difference(x, box.height - y))),
          );
        }
        for (let y = 28; y < box.height - 28; y += 4) {
          edges.push(
            Math.max(...[0, 1, 2].map((x) => difference(x, y))),
            Math.max(...[1, 2, 3].map((x) => difference(box.width - x, y))),
          );
        }
        return {
          name: box.name,
          upperLeft: peak(0, 0, 26, 26),
          lowerRight: peak(box.width - 26, box.height - 26, box.width, box.height),
          upperMiddle: peak(box.width / 2 - 12, 0, box.width / 2 + 12, 5),
          upperRight: peak(box.width - 26, 0, box.width, 26),
          lowerLeft: peak(0, box.height - 26, 26, box.height),
          edgeCoverage: edges.filter((value) => value >= 4).length / edges.length,
          interior: peak(box.width / 2 - 12, 8, box.width / 2 + 12, 16),
        };
      });
    },
    { withEdge: withEdge.toString('base64'), withoutEdge: withoutEdge.toString('base64'), boxes },
  );
  await testInfo.attach('light-directional-edge-metrics', {
    body: JSON.stringify(metrics),
    contentType: 'application/json',
  });
  for (const metric of metrics) {
    expect(metric.interior, JSON.stringify(metrics)).toBeLessThanOrEqual(1);
    expect(metric.upperLeft, JSON.stringify(metrics)).toBeGreaterThan(metric.upperMiddle * 1.2);
    expect(metric.lowerRight, JSON.stringify(metrics)).toBeGreaterThan(metric.upperMiddle);
    expect(Math.min(metric.upperLeft, metric.lowerRight), JSON.stringify(metrics)).toBeGreaterThan(
      4,
    );
    expect(Math.min(metric.upperRight, metric.lowerLeft), JSON.stringify(metrics)).toBeGreaterThan(
      4,
    );
    expect(metric.edgeCoverage, JSON.stringify(metrics)).toBeGreaterThanOrEqual(0.9);
  }
});
