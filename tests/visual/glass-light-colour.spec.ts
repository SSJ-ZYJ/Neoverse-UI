import { expect, type Page, type TestInfo, test } from '@playwright/test';

test.use({ launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] } });

const tiers = ['subtle', 'elevated', 'immersive'] as const;

type TierMetrics = {
  tier: string;
  maxLift: number;
  rightEdge: [number, number, number];
};

async function measureLightEdges(
  page: Page,
  backdrop: string,
  testInfo?: TestInfo,
): Promise<TierMetrics[]> {
  await page.route('**/*', (route) =>
    route.request().resourceType() === 'font' ? route.abort() : route.continue(),
  );
  await page.goto('/frame?theme=light&lang=en#materials', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-glass-variant="elevated"]').waitFor();
  await expect(page.locator('html')).toHaveAttribute('data-neoverse-glass-renderer', 'webgl');
  const actualStage = page.locator('[data-glass-preview-stage]').nth(1);
  await actualStage.scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  const stageBounds = await actualStage.boundingBox();
  if (stageBounds && testInfo) {
    await page.screenshot({ path: testInfo.outputPath('playground-light.png'), clip: stageBounds });
  }

  await page.evaluate(
    ({ background, variants }) => {
      document.querySelector<HTMLElement>('#app')?.style.setProperty('display', 'none');
      const stage = document.createElement('div');
      stage.style.cssText = `position:fixed;inset:0;padding:24px;background:${background}`;
      for (const [index, tier] of variants.entries()) {
        const card = document.createElement('article');
        card.className = `ui-surface material-glass-${tier}`;
        card.dataset.colourEdge = tier;
        card.style.cssText = `position:absolute;left:24px;top:${24 + index * 200}px;width:340px;height:172px;border-radius:28px`;
        stage.append(card);
      }
      document.body.append(stage);
    },
    { background: backdrop, variants: [...tiers] },
  );
  await page.waitForTimeout(200);

  const bounds = await page.locator('[data-colour-edge]').evaluateAll((elements) =>
    elements.map((element) => {
      const rect = element.getBoundingClientRect();
      return {
        tier: element.getAttribute('data-colour-edge') ?? '',
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      };
    }),
  );

  const lit = await page.screenshot();
  await page
    .locator('[data-neoverse-glass-renderer-canvas]')
    .evaluate((element) => ((element as HTMLElement).style.visibility = 'hidden'));
  const unlit = await page.screenshot();

  return page.evaluate(
    async ({ lit, unlit, bounds }) => {
      const decode = async (png: string) => {
        const bitmap = await createImageBitmap(
          await (await fetch(`data:image/png;base64,${png}`)).blob(),
        );
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Missing pixel context');
        context.drawImage(bitmap, 0, 0);
        bitmap.close();
        return context.getImageData(0, 0, canvas.width, canvas.height);
      };
      const a = await decode(lit);
      const b = await decode(unlit);
      const pixel = (image: ImageData, x: number, y: number): [number, number, number] => {
        const offset = (y * image.width + x) * 4;
        return [image.data[offset] ?? 0, image.data[offset + 1] ?? 0, image.data[offset + 2] ?? 0];
      };
      // Walk perpendicular to an edge and keep the brightest lift, so the
      // measurement follows the contour instead of a fixed inset.
      const scan = (points: number[][], normal: number[]) => {
        let sum: [number, number, number] = [0, 0, 0];
        let samples = 0;
        let peak = 0;
        for (const [pointX = 0, pointY = 0] of points) {
          let best: [number, number, number] | undefined;
          let bestLift = -1;
          for (let step = -6; step <= 5; step += 1) {
            const x = pointX + (normal[0] ?? 0) * step;
            const y = pointY + (normal[1] ?? 0) * step;
            const current = pixel(a, x, y);
            const base = pixel(b, x, y);
            const lift = Math.max(current[0] - base[0], current[1] - base[1], current[2] - base[2]);
            if (lift > bestLift) {
              bestLift = lift;
              best = [current[0] - base[0], current[1] - base[1], current[2] - base[2]];
            }
          }
          if (best && bestLift > 3) {
            sum = [sum[0] + best[0], sum[1] + best[1], sum[2] + best[2]];
            samples += 1;
            peak = Math.max(peak, bestLift);
          }
        }
        const mean: [number, number, number] =
          samples === 0 ? [0, 0, 0] : [sum[0] / samples, sum[1] / samples, sum[2] / samples];
        return { mean, peak };
      };

      return bounds.map((rect) => {
        const top: number[][] = [];
        const bottom: number[][] = [];
        const left: number[][] = [];
        const right: number[][] = [];
        const horizontalSpan = Math.max(rect.width - 40, 1);
        const verticalSpan = Math.max(rect.height - 40, 1);
        for (let x = 40; x < 40 + horizontalSpan; x += 2) {
          top.push([rect.x + x, rect.y]);
          bottom.push([rect.x + x, rect.y + rect.height - 1]);
        }
        for (let y = 40; y < 40 + verticalSpan; y += 2) {
          left.push([rect.x, rect.y + y]);
          right.push([rect.x + rect.width - 1, rect.y + y]);
        }
        const edges = [
          scan(top, [0, -1]),
          scan(bottom, [0, 1]),
          scan(left, [-1, 0]),
          scan(right, [1, 0]),
        ];
        const rightEdge = edges[3]?.mean;
        return {
          tier: rect.tier,
          maxLift: Math.max(...edges.map((edge) => edge.peak)),
          rightEdge: rightEdge
            ? [Math.round(rightEdge[0]), Math.round(rightEdge[1]), Math.round(rightEdge[2])]
            : [0, 0, 0],
        };
      });
    },
    { lit: lit.toString('base64'), unlit: unlit.toString('base64'), bounds },
  );
}

for (const [backdrop, background] of [
  ['cool', 'linear-gradient(110deg,#c3deef,#d7cbee)'],
  ['warm', 'linear-gradient(110deg,#efd8bc,#e6c5b8)'],
] as const) {
  test(`${backdrop}: each light glass tier has a visible directional contour`, async ({
    page,
  }, testInfo) => {
    const metrics = await measureLightEdges(page, background, testInfo);
    await testInfo.attach('edge-colour-metrics', {
      body: JSON.stringify(metrics),
      contentType: 'application/json',
    });
    for (const value of metrics) {
      expect(
        value.maxLift,
        `${value.tier} keeps a visible narrow highlight`,
      ).toBeGreaterThanOrEqual(8);
    }
  });
}

test('grey: the light contour stays cool without reading as a blue cast', async ({
  page,
}, testInfo) => {
  const metrics = await measureLightEdges(page, '#a0a0a0', testInfo);
  await testInfo.attach('edge-hue-metrics', {
    body: JSON.stringify(metrics),
    contentType: 'application/json',
  });
  for (const value of metrics) {
    expect(value.maxLift, `${value.tier} keeps a visible narrow highlight`).toBeGreaterThanOrEqual(
      8,
    );
    // Blue may lead red and green, but only by the accent's own direction. The
    // former indigo-only profile reached more than three times the lead and read
    // as a blue band on pale pages.
    const [red = 0, green = 0, blue = 0] = value.rightEdge;
    expect(
      blue,
      `${value.tier} keeps its cool edge below the blue cast threshold`,
    ).toBeLessThanOrEqual(Math.max(red, green) * 2);
    expect(blue, `${value.tier} still keeps a cool direction`).toBeGreaterThan(0);
  }
});
