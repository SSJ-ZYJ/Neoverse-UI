import { expect, test } from '@playwright/test';

test.use({ launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] } });

for (const theme of ['light', 'dark'] as const) {
  for (const pointerEvents of ['auto', 'none'] as const) {
    test(`${theme}: an overlapping Glass surface covers the lower edge with pointer-events ${pointerEvents}`, async ({
      page,
    }) => {
      await page.goto(`/frame?theme=${theme}&lang=en#materials`, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('html')).toHaveAttribute('data-neoverse-glass-renderer', 'webgl');
      await page.evaluate((pointer) => {
        document.querySelector<HTMLElement>('#app')?.style.setProperty('display', 'none');
        const stage = document.createElement('div');
        stage.style.cssText = 'position:fixed;inset:0;background:#82919f';
        const scroller = document.createElement('div');
        scroller.dataset.occlusionScroller = '';
        scroller.style.cssText = 'position:absolute;inset:0;overflow:auto';
        const content = document.createElement('div');
        content.style.cssText = 'position:relative;height:1400px';
        const card = document.createElement('div');
        card.className = 'material-glass-elevated';
        card.dataset.occlusionTarget = '';
        card.style.cssText =
          'position:absolute;left:80px;top:100px;width:240px;height:300px;border-radius:16px;--neoverse-material-edge-refraction-opacity:1';
        const overlay = document.createElement('div');
        overlay.className = 'material-glass-elevated';
        overlay.style.cssText = `position:absolute;z-index:1;left:60px;top:120px;width:80px;height:60px;border-radius:12px;pointer-events:${pointer}`;
        if (pointer === 'none') overlay.dataset.neoverseGlassOccluder = 'topmost';
        content.append(card);
        scroller.append(content);
        stage.append(scroller, overlay);
        document.body.append(stage);
      }, pointerEvents);
      const settle = () =>
        page.evaluate(
          () =>
            new Promise<void>((resolve) =>
              requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
            ),
        );
      for (const scrollTop of [0, 24]) {
        await page.locator('[data-occlusion-scroller]').evaluate((element, top) => {
          element.scrollTop = top;
        }, scrollTop);
        await page.locator('[data-occlusion-target]').evaluate((element) => {
          (element as HTMLElement).style.setProperty(
            '--neoverse-material-edge-refraction-opacity',
            '1',
          );
        });
        await settle();
        const withEdge = await page.screenshot();
        await page.locator('[data-occlusion-target]').evaluate((element) => {
          (element as HTMLElement).style.setProperty(
            '--neoverse-material-edge-refraction-opacity',
            '0',
          );
        });
        await settle();
        const withoutEdge = await page.screenshot();
        const difference = await page.evaluate(
          async ({ first, second }) => {
            const decode = async (source: string) => {
              const image = await createImageBitmap(
                await (await fetch(`data:image/png;base64,${source}`)).blob(),
              );
              const canvas = document.createElement('canvas');
              canvas.width = image.width;
              canvas.height = image.height;
              const context = canvas.getContext('2d');
              if (!context) throw new Error('Cannot inspect Glass edge pixels');
              context.drawImage(image, 0, 0);
              image.close();
              return context.getImageData(0, 0, canvas.width, canvas.height);
            };
            const a = await decode(first);
            const b = await decode(second);
            const peak = (top: number, bottom: number) => {
              let max = 0;
              for (let y = top; y < bottom; y++) {
                for (let x = 80; x < 85; x++) {
                  for (let channel = 0; channel < 3; channel++) {
                    const offset = (y * a.width + x) * 4 + channel;
                    max = Math.max(max, Math.abs((a.data[offset] ?? 0) - (b.data[offset] ?? 0)));
                  }
                }
              }
              return max;
            };
            return { covered: peak(135, 165), exposed: peak(230, 260) };
          },
          { first: withEdge.toString('base64'), second: withoutEdge.toString('base64') },
        );
        expect(difference.exposed, 'the unobscured light edge must remain visible').toBeGreaterThan(
          2,
        );
        expect(
          difference.covered,
          'the lower edge must not paint over the upper card',
        ).toBeLessThanOrEqual(2);
      }
    });
  }
}

test('Playground FPS remains non-interactive and participates in Glass occlusion', async ({
  page,
}) => {
  await page.goto('/?theme=light&lang=en', { waitUntil: 'domcontentloaded' });
  const fps = page.locator('[data-playground-fps]');
  await expect(fps).toHaveAttribute('data-neoverse-glass-occluder', 'topmost');
  await expect(fps).toHaveCSS('pointer-events', 'none');
});
