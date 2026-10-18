import { expect, test } from '@playwright/test';

for (const theme of ['light', 'dark'] as const) {
  for (const backdrop of ['muted', 'pale'] as const) {
    test(`${theme}/${backdrop}: rectangular buttons and circular icon buttons have broad opposing catches`, async ({
      page,
    }, testInfo) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.route('**/*', (route) =>
        route.request().resourceType() === 'font' ? route.abort() : route.continue(),
      );
      await page.goto(`/frame?theme=${theme}&lang=en#materials`, { waitUntil: 'domcontentloaded' });
      await page.locator('[data-refraction-control="right"]').waitFor();
      await expect(page.locator('html')).toHaveAttribute('data-neoverse-glass-renderer', 'webgl');
      if (backdrop === 'pale') {
        const scene = page.locator('[data-refraction-preview] .playground-refraction-scene');
        await scene.scrollIntoViewIfNeeded();
        const clip = await scene.boundingBox();
        if (!clip) throw new Error('Missing real Glass control preview');
        await page.screenshot({ clip, path: testInfo.outputPath('actual-controls.png') });
      }
      await page.evaluate((backdrop) => {
        const rectangle = document.querySelector('[data-refraction-control="left"]');
        const circle = document.querySelector('[data-refraction-control="right"]');
        if (!rectangle || !circle) throw new Error('Missing real button specimens');
        document.querySelector<HTMLElement>('#app')?.style.setProperty('display', 'none');
        document.body.style.background =
          backdrop === 'pale'
            ? 'linear-gradient(90deg,#d5eaf4,#c9ece6,#dedcf7)'
            : 'rgb(96 112 136)';
        for (const [index, size] of [32, 40, 48].entries()) {
          for (const round of [false, true]) {
            const button = (round ? circle : rectangle).cloneNode(true) as HTMLElement;
            button.dataset.coverageButton = round ? 'circle' : 'rectangle';
            button.style.cssText = `position:fixed;left:${round ? 216 : 24}px;top:${32 + index * 96}px;width:${round ? size : 144}px;height:${size}px;min-height:0;${round ? 'border-radius:50%' : ''}`;
            document.body.append(button);
          }
        }
      }, backdrop);
      const boxes = await page.locator('[data-coverage-button]').evaluateAll((elements) =>
        elements.map((el) => {
          const box = el.getBoundingClientRect();
          return {
            kind: (el as HTMLElement).dataset.coverageButton,
            x: box.x,
            y: box.y,
            width: box.width,
            height: box.height,
          };
        }),
      );
      const lit = await page.screenshot({ path: testInfo.outputPath('buttons.png') });
      await page
        .locator('[data-neoverse-glass-renderer-canvas]')
        .evaluate((el) => ((el as HTMLElement).style.visibility = 'hidden'));
      const unlit = await page.screenshot();
      const metrics = await page.evaluate(
        async ({ lit, unlit, boxes }) => {
          const read = async (data: string) => {
            const bitmap = await createImageBitmap(
              await (await fetch(`data:image/png;base64,${data}`)).blob(),
            );
            const canvas = document.createElement('canvas');
            canvas.width = bitmap.width;
            canvas.height = bitmap.height;
            const context = canvas.getContext('2d');
            if (!context) throw new Error('Cannot inspect button arcs');
            context.drawImage(bitmap, 0, 0);
            bitmap.close();
            return context.getImageData(0, 0, canvas.width, canvas.height);
          };
          const a = await read(lit),
            b = await read(unlit);
          return boxes.map((box) => {
            const difference = (x: number, y: number) =>
              Math.max(
                ...[0, 1, 2].map((c) => {
                  const i = (Math.floor(box.y + y) * a.width + Math.floor(box.x + x)) * 4 + c;
                  return Math.abs((a.data[i] ?? 0) - (b.data[i] ?? 0));
                }),
              );
            const edge: number[] = [];
            if (box.kind === 'circle') {
              for (let angle = 0; angle < 360; angle += 5) {
                edge.push(
                  Math.max(
                    ...[0.25, 0.75, 1.25, 1.75].map((inset) => {
                      const r = box.width / 2 - inset,
                        radians = (angle * Math.PI) / 180;
                      return difference(
                        box.width / 2 + Math.cos(radians) * r,
                        box.height / 2 + Math.sin(radians) * r,
                      );
                    }),
                  ),
                );
              }
            } else {
              for (let x = 12; x < box.width - 12; x += 2)
                edge.push(difference(x, 0), difference(x, box.height - 1));
              for (let y = 12; y < box.height - 12; y += 2)
                edge.push(difference(0, y), difference(box.width - 1, y));
            }
            return {
              ...box,
              coverage: edge.filter((value) => value >= 4).length / edge.length,
              peak: Math.max(...edge),
              centre: difference(box.width / 2, box.height / 2),
            };
          });
        },
        { lit: lit.toString('base64'), unlit: unlit.toString('base64'), boxes },
      );
      for (const metric of metrics) {
        expect(metric.coverage, JSON.stringify(metrics)).toBeGreaterThanOrEqual(
          metric.kind === 'circle' ? 0.55 : 0.35,
        );
        expect(metric.centre, 'light stays at the perimeter').toBeLessThanOrEqual(1);
      }
    });
  }
}
