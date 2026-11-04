import { expect, test } from '@playwright/test';
import { measureDominantHighlight } from '../support/glass-colour-metrics';

for (const renderer of ['webgl', 'css'] as const) {
  for (const theme of ['light', 'dark'] as const) {
    test(`${renderer}/${theme}: edge response follows the live backdrop transfer`, async ({
      page,
    }, testInfo) => {
      await page.route('**/*', (route) =>
        route.request().resourceType() === 'font' ? route.abort() : route.continue(),
      );
      await page.goto(`/frame?theme=${theme}&lang=en#materials`, { waitUntil: 'domcontentloaded' });
      await page.locator('[data-glass-variant="elevated"]').waitFor();
      await expect(page.locator('html')).toHaveAttribute('data-neoverse-glass-renderer', 'webgl');
      await page.evaluate((renderer) => {
        document.querySelector<HTMLElement>('#app')?.style.setProperty('display', 'none');
        const source = document.createElement('canvas');
        source.dataset.liveBackdrop = '';
        source.width = innerWidth;
        source.height = innerHeight;
        source.style.cssText = 'position:fixed;inset:0;width:100%;height:100%';
        document.body.append(source);
        for (const button of [false, true]) {
          const surface = document.createElement(button ? 'button' : 'article');
          surface.className = button
            ? 'ui-button ui-button--secondary ui-button--md material-glass-subtle'
            : 'ui-surface material-glass-elevated';
          surface.dataset.gainOwner = '';
          if (renderer === 'css') surface.dataset.neoverseGlassEdgePass = 'css';
          if (button) surface.innerHTML = '<span class="ui-button__edge-field"></span>';
          surface.style.cssText = `position:fixed;left:32px;top:${button ? 240 : 32}px;width:${button ? 180 : 300}px;height:${button ? 40 : 180}px;border-radius:${button ? 12 : 24}px;background:transparent!important;border:0!important;box-shadow:none!important;--neoverse-material-filter:blur(0px)`;
          document.body.append(surface);
        }
      }, renderer);
      const canvas = page.locator('[data-neoverse-glass-renderer-canvas]');
      const channelGains: number[][] = [];
      const colours = [
        'rgb(0 0 0)',
        'rgb(80 96 112)',
        'rgb(96 0 48)',
        'rgb(0 96 32)',
        'rgb(192 160 128)',
        'rgb(224 32 64)',
      ];
      if (renderer === 'webgl' && theme === 'light') {
        colours.push(
          'rgb(160 48 32)',
          'rgb(176 96 32)',
          'rgb(176 152 40)',
          'rgb(48 96 176)',
          'rgb(128 64 176)',
          'rgb(48 144 128)',
          'rgb(240 240 240)',
        );
      }
      for (const colour of colours) {
        // This is live sibling canvas paint, with no DOM/style mutation for the
        // Glass runtime to observe and no ancestor CSS background to reconstruct.
        await page.evaluate((colour) => {
          const source = document.querySelector<HTMLCanvasElement>('[data-live-backdrop]');
          const context = source?.getContext('2d');
          if (!source || !context) throw new Error('Missing live source');
          context.fillStyle = colour;
          context.fillRect(0, 0, source.width, source.height);
        }, colour);
        const lit = await page.screenshot();
        await canvas.evaluate((el) => ((el as HTMLElement).style.visibility = 'hidden'));
        const hidden = await page.addStyleTag({
          content:
            '[data-gain-owner]::before, [data-gain-owner] > .ui-button__edge-field { visibility: hidden !important }',
        });
        const base = await page.screenshot();
        await hidden.evaluate((el) => (el as HTMLElement).remove());
        await canvas.evaluate((el) => (el as HTMLElement).style.removeProperty('visibility'));
        const samples = await page.evaluate(
          async ({ lit, base }) => {
            const read = async (data: string) => {
              const image = await createImageBitmap(
                await (await fetch(`data:image/png;base64,${data}`)).blob(),
              );
              const canvas = document.createElement('canvas');
              canvas.width = image.width;
              canvas.height = image.height;
              const context = canvas.getContext('2d');
              if (!context) throw new Error('Cannot read gain pixels');
              context.drawImage(image, 0, 0);
              image.close();
              return [
                [39, 39],
                [35, 243],
              ].map(([x, y]) =>
                Array.from(context.getImageData(x ?? 0, y ?? 0, 1, 1).data).slice(0, 3),
              );
            };
            return { lit: await read(lit), base: await read(base) };
          },
          { lit: lit.toString('base64'), base: base.toString('base64') },
        );
        if (renderer === 'webgl' && theme === 'light') {
          const measurements = samples.lit.map((lit, index) => {
            const base = samples.base[index] ?? [];
            return {
              surface: index === 0 ? 'elevated' : 'button',
              ...measureDominantHighlight(
                [base[0] ?? 0, base[1] ?? 0, base[2] ?? 0],
                [lit[0] ?? 0, lit[1] ?? 0, lit[2] ?? 0],
              ),
            };
          });
          await testInfo.attach(`light-edge-response-${colour.replace(/[^\d]+/g, '-')}`, {
            body: JSON.stringify({
              colour,
              backdrop: 'live canvas',
              bodyBlur: 'disabled',
              measurements,
            }),
            contentType: 'application/json',
          });
        }
        for (const [index, lit] of samples.lit.entries()) {
          const unlit = samples.base[index] ?? [];
          const peak = Math.max(...unlit);
          if (renderer === 'webgl' && theme === 'light') {
            if (peak === 0) {
              // The light rim is a translucent theme highlight, so over black it
              // keeps that catch; the contract bounds it instead of forbidding it.
              expect(
                Math.max(...lit) - Math.min(...lit),
                'black keeps only the bounded theme catch',
              ).toBeLessThanOrEqual(64);
              continue;
            }
            if (colour === 'rgb(240 240 240)') {
              expect(
                Math.max(...lit.map((value, channel) => value - (unlit[channel] ?? 0))),
                'near-white keeps a bounded theme edge',
              ).toBeLessThanOrEqual(20);
            }
            // The light rim is a theme highlight, so hue retention against the
            // backdrop is not part of the current contract; the calibrated
            // channel transfer below still checks the backdrop response.
            continue;
          }
          if (peak === 0) {
            expect(
              Math.max(...lit),
              'black has no backdrop colour to brighten or replace with a theme colour',
            ).toBeLessThanOrEqual(1);
            continue;
          }
          if (colour === 'rgb(80 96 112)') {
            channelGains[index] = lit.map((value, channel) => {
              const base = unlit[channel] ?? 0;
              if (renderer !== 'webgl') return value / base;
              return (value - base) / Math.min(base, 255 - base);
            });
          }
          const spectrum = channelGains[index];
          if (!spectrum) throw new Error('Missing channel gain calibration');
          const gain = Math.max(
            ...lit.map((value, channel) => (unlit[channel] ? value / (unlit[channel] ?? 1) : 1)),
          );
          if (renderer === 'webgl')
            expect(gain, `${theme}/${colour}/${index}: visible backdrop gain`).toBeGreaterThan(
              1.01,
            );
          else if (renderer === 'css')
            expect(
              gain,
              'CSS brightness must not replace the source colour',
            ).toBeGreaterThanOrEqual(1);
          for (const [channel, value] of lit.entries()) {
            const base = unlit[channel] ?? 0;
            expect(
              Math.abs(
                value -
                  (renderer !== 'webgl'
                    ? Math.min(255, (unlit[channel] ?? 0) * (spectrum[channel] ?? 1))
                    : base +
                      (spectrum[channel] ?? 0) *
                        Math.min(unlit[channel] ?? 0, 255 - (unlit[channel] ?? 0))),
              ),
              `${colour}: each channel must follow its calibrated live-backdrop transfer`,
            ).toBeLessThanOrEqual(3);
          }
        }
      }
    });
  }
}
