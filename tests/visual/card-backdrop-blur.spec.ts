import { expect, test } from '@playwright/test';

for (const theme of ['light', 'dark'] as const) {
  for (const fixture of [
    {
      name: 'card',
      route: '#card',
      selector: '[data-card-default]',
      backdrop: '.playground-material-backdrop',
    },
    {
      name: 'overview panel',
      route: '',
      selector: '.playground-overview-group',
      backdrop: '.playground-shell',
    },
    {
      name: 'overview panel after navigation',
      route: '#card',
      selector: '.playground-overview-group',
      backdrop: '.playground-shell',
      navigate: true,
    },
    ...(['subtle', 'elevated', 'immersive'] as const).map((tier) => ({
      name: `Glass specimen ${tier}`,
      route: '#materials',
      selector: `[data-glass-variant="${tier}"]`,
      backdrop: '.playground-material-backdrop',
    })),
  ]) {
    test(`${fixture.name} actually blurs the Design Lab backdrop / ${theme}`, async ({ page }) => {
      await page.emulateMedia({
        colorScheme: theme,
        reducedMotion: 'navigate' in fixture ? 'no-preference' : 'reduce',
      });
      await page.goto(`/?theme=${theme}&lang=en${fixture.route}`, {
        waitUntil: 'domcontentloaded',
      });
      if ('navigate' in fixture) {
        const back = page.getByRole('button', { name: 'Back to overview', exact: true });
        if (await back.isVisible()) {
          await back.click();
        } else {
          await page.locator('[data-playground-nav-trigger]').click();
          await page.getByRole('link', { name: 'Overview', exact: true }).click();
        }
        await expect
          .poll(() => page.locator('html').getAttribute('data-neoverse-particle-transitioning'))
          .toBeNull();
        await expect
          .poll(() => page.locator('html').getAttribute('data-neoverse-transitioning'))
          .toBeNull();
      }
      const card = page.locator(fixture.selector).first();
      await expect(card).toBeVisible();
      await card.evaluate((element, backdrop) => {
        // A high-frequency backdrop makes blur observable independently of tint or edges.
        const stage = element.closest<HTMLElement>(backdrop);
        if (!stage) throw new Error('Card backdrop missing');
        stage.style.backgroundImage =
          'repeating-linear-gradient(90deg, rgb(32 48 64 / 55%) 0 4px, rgb(192 208 224 / 55%) 4px 8px)';
        document
          .querySelector<HTMLElement>('[data-neoverse-glass-renderer-canvas]')
          ?.style.setProperty('visibility', 'hidden');
      }, fixture.backdrop);
      const blurred = await card.screenshot({ animations: 'disabled' });
      await card.evaluate((element) => {
        const unblurredFilter = getComputedStyle(element).backdropFilter.replace(
          /blur\([^)]*\)/g,
          'blur(0px)',
        );
        (element as HTMLElement).style.setProperty('backdrop-filter', unblurredFilter, 'important');
        (element as HTMLElement).style.setProperty(
          '-webkit-backdrop-filter',
          unblurredFilter,
          'important',
        );
      });
      const unblurred = await card.screenshot({ animations: 'disabled' });
      const pixels = await page.evaluate(
        async ({ a, b }) => {
          const decode = async (base64: string) => {
            const bitmap = await createImageBitmap(
              await (await fetch(`data:image/png;base64,${base64}`)).blob(),
            );
            const canvas = document.createElement('canvas');
            canvas.width = bitmap.width;
            canvas.height = bitmap.height;
            const context = canvas.getContext('2d');
            if (!context) throw new Error('Cannot decode card screenshot');
            context.drawImage(bitmap, 0, 0);
            return context.getImageData(0, 0, canvas.width, canvas.height);
          };
          const front = await decode(a);
          const back = await decode(b);
          let total = 0;
          let count = 0;
          for (let y = 24; y < front.height - 24; y++) {
            for (let x = 24; x < front.width - 24; x++) {
              const offset = (y * front.width + x) * 4;
              for (let c = 0; c < 3; c++) {
                total += Math.abs((front.data[offset + c] ?? 0) - (back.data[offset + c] ?? 0));
                count++;
              }
            }
          }
          const edgeStrength = (image: ImageData) => {
            let edges = 0;
            let samples = 0;
            // The lower strip contains backdrop only, so readable text cannot
            // mask an unblurred stripe leaking through a translucent ancestor.
            for (let y = image.height - 24; y < image.height - 12; y++) {
              for (let x = 24; x < image.width - 24; x++) {
                const offset = (y * image.width + x) * 4;
                for (let c = 0; c < 3; c++) {
                  edges += Math.abs(
                    (image.data[offset + c] ?? 0) - (image.data[offset + c + 4] ?? 0),
                  );
                  samples++;
                }
              }
            }
            return edges / samples;
          };
          return { delta: total / count, sharpness: edgeStrength(front) / edgeStrength(back) };
        },
        { a: blurred.toString('base64'), b: unblurred.toString('base64') },
      );
      expect(
        pixels.delta,
        'The rendered card must smooth its backdrop, not just report a CSS blur',
      ).toBeGreaterThan(10);
      expect(
        pixels.sharpness,
        'Fine backdrop stripes must be smoothed, not just tinted',
      ).toBeLessThan(0.1);
    });
  }
}
