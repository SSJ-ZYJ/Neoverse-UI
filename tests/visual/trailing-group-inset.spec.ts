import { expect, test } from '@playwright/test';

for (const theme of ['light', 'dark'] as const) {
  test(`trailing choices match standalone segmented side insets / ${theme}`, async ({
    page,
  }, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.route('**/*', (route) =>
      route.request().resourceType() === 'font' ? route.abort() : route.continue(),
    );
    await page.goto(`/frame?theme=${theme}&lang=en#controls`, {
      waitUntil: 'domcontentloaded',
    });
    const reference = page.locator('#controls-segmented-control .ui-segmented-control').first();
    const trailing = page.locator(
      '#controls-surface [data-specimen-label="Trailing group"] .ui-control-surface__group--trailing',
    );
    await expect(reference).toBeVisible();
    await expect(trailing).toBeVisible();
    const sideInsets = (element: Element) => {
      const options = element.querySelectorAll('.ui-segmented-control__option');
      const first = options[0];
      const last = options[options.length - 1];
      if (!first || !last) throw new Error('Missing segmented choices');
      const rect = element.getBoundingClientRect();
      return {
        start: first.getBoundingClientRect().left - rect.left,
        end: rect.right - last.getBoundingClientRect().right,
      };
    };
    const expected = await reference.evaluate(sideInsets);
    expect(expected.start).toBeGreaterThan(2);
    const shell = trailing.locator('..');
    for (const scale of [1, 1.3]) {
      await shell.evaluate((element, scale) => {
        element.classList.toggle('ui-control-surface--scale-md', scale === 1);
        element.classList.toggle('ui-control-surface--scale-lg', scale !== 1);
      }, scale);
      for (const label of ['Map', 'List']) {
        await trailing.getByRole('radio', { name: label, exact: true }).click();
        const actual = await trailing.evaluate(sideInsets);
        expect(
          actual.start / scale,
          'Selected plate needs the same left clearance as a segmented control',
        ).toBeCloseTo(expected.start, 1);
        expect(actual.end / scale, 'The last choice needs matching right clearance').toBeCloseTo(
          expected.end,
          1,
        );
        const slider = trailing.locator('.ui-segmented-control__slider');
        const option = trailing.getByRole('radio', { name: label, exact: true });
        const plate = await slider.boundingBox();
        const choice = await option.boundingBox();
        if (!plate || !choice) throw new Error('Missing selected choice geometry');
        // Slider measurements use integer offsetLeft/offsetWidth; CSS zoom
        // scales their at-most-half-layout-pixel rounding error as well.
        const tolerance = scale / 2 + 0.02;
        expect(Math.abs(plate.x - choice.x)).toBeLessThanOrEqual(tolerance);
        expect(Math.abs(plate.width - choice.width)).toBeLessThanOrEqual(tolerance);
      }
    }
    await trailing.screenshot({ path: testInfo.outputPath('trailing-group-insets.png') });
  });
}
