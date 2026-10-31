import { expect, test } from '@playwright/test';

// Keep the side/corner anchor positions from the independently built 0.2.0 fixture.
// Sample all four sides and all four rounded corners; the centre has no fill.
const anchors = [
  [0, 80],
  [299, 80],
  [100, 0],
  [100, 179],
  [7, 7],
  [292, 7],
  [7, 172],
  [292, 172],
];
// Light samples reflect the reduced blue cast introduced in 7f43d37, captured
// by CI 41216161288 at 124fc11 on middle grey. All three attempts in both
// projects produced identical anchors. Keep the original three-level tolerance.
// Dark still uses independently reconstructed 0.2.0 release samples from black
// and [96,112,136] captures; its nearly neutral edge must not turn saturated blue.
// The fixture uses opacity .5 in light and .24 in dark.
const reference = {
  light: [
    [134, 167, 158],
    [151, 150, 163],
    [139, 177, 175],
    [139, 175, 175],
    [136, 178, 171],
    [140, 146, 151],
    [136, 152, 152],
    [149, 155, 166],
  ],
  dark: [
    [141, 142, 141],
    [143, 144, 145],
    [143, 146, 146],
    [144, 147, 146],
    [144, 147, 147],
    [136, 137, 137],
    [136, 137, 137],
    [145, 147, 147],
  ],
};
for (const theme of ['light', 'dark'] as const) {
  // Light samples describe source-over at middle grey, not overlay's transfer
  // curve on pale colours. Do not extrapolate them.
  const backdrops = theme === 'light' ? (['reference'] as const) : (['reference', 'pale'] as const);
  for (const backdrop of backdrops) {
    test(`${theme}/${backdrop}: directional chroma matches its reference on the live backdrop`, async ({
      page,
    }, testInfo) => {
      await page.route('**/*', (route) =>
        route.request().resourceType() === 'font' ? route.abort() : route.continue(),
      );
      await page.goto(`/frame?theme=${theme}&lang=en#materials`, {
        waitUntil: 'domcontentloaded',
      });
      await page.locator('[data-glass-variant="elevated"]').waitFor();
      await page.evaluate(
        ({ backdrop, theme }) => {
          // Compare the reference RGB balance independently of theme exposure.
          document.documentElement.style.setProperty(
            '--neoverse-material-edge-refraction-gain',
            '1',
          );
          document.querySelector<HTMLElement>('#app')?.style.setProperty('display', 'none');
          document.body.style.background =
            backdrop === 'pale' ? 'rgb(224 232 240)' : 'rgb(128 128 128)';
          const card = document.createElement('article');
          card.className = 'ui-surface material-glass-elevated';
          card.style.cssText =
            'position:fixed;left:32px;top:32px;width:300px;height:180px;border-radius:24px;border:0!important;background:transparent!important;box-shadow:none!important;--neoverse-material-filter:blur(0px)';
          card.style.setProperty(
            '--neoverse-material-edge-refraction-opacity',
            theme === 'light' ? '0.5' : '0.24',
          );
          document.body.append(card);
        },
        { backdrop, theme },
      );
      await expect(page.locator('html')).toHaveAttribute('data-neoverse-glass-renderer', 'webgl');
      await expect
        .poll(
          async () => {
            // Capture the full compositor, including the independent fixed Glass canvas.
            const screenshot = await page.screenshot({
              path: testInfo.outputPath('glass-edge.png'),
            });
            const pixels = await page.evaluate(
              async ({ screenshot, anchors }) => {
                const bitmap = await createImageBitmap(
                  await (await fetch(`data:image/png;base64,${screenshot}`)).blob(),
                );
                const canvas = document.createElement('canvas');
                canvas.width = bitmap.width;
                canvas.height = bitmap.height;
                const context = canvas.getContext('2d');
                if (!context) throw new Error('Cannot inspect the reference edge');
                context.drawImage(bitmap, 0, 0);
                bitmap.close();
                const image = context.getImageData(32, 32, 300, 180);
                return anchors.map(([x, y]) =>
                  Array.from(
                    image.data.slice(
                      ((y ?? 0) * 300 + (x ?? 0)) * 4,
                      ((y ?? 0) * 300 + (x ?? 0)) * 4 + 3,
                    ),
                  ),
                );
              },
              { screenshot: screenshot.toString('base64'), anchors },
            );
            const base = backdrop === 'pale' ? [224, 232, 240] : [128, 128, 128];
            return Math.max(
              ...pixels.flatMap((rgb, index) =>
                rgb.map((value, channel) => {
                  const source = base[channel] ?? 128;
                  const gain = ((reference[theme][index]?.[channel] ?? 128) - 128) / 127;
                  const expected = source + gain * Math.min(source, 255 - source);
                  return Math.abs(value - expected);
                }),
              ),
            );
          },
          {
            message: `${theme}: sides and corners must retain the reference RGB balance`,
          },
        )
        .toBeLessThanOrEqual(3);
    });
  }
}
