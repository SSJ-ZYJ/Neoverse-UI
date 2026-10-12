import { expect, test } from '@playwright/test';

// Geometry from the published 0.2.0 sources (c989c13). Embedded language
// options keep this footprint independently of standalone control sizing.
for (const theme of ['light', 'dark'] as const) {
  test(`Dock language options retain 0.2.0 geometry / ${theme}`, async ({ page }, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: theme });
    await page.goto(`/frame?theme=${theme}&lang=zh#consumer-parity`, {
      waitUntil: 'domcontentloaded',
    });
    const dock = page.locator('[data-consumer-parity="floating-navigation"]');
    const language = dock.locator('.consumer-parity-dock__language');
    await expect(language).toBeVisible();
    const geometry = await language.evaluate((element) => {
      const options = [...element.querySelectorAll<HTMLElement>('.ui-segmented-control__option')];
      const rootSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
      const dock = element.closest<HTMLElement>('.ui-dock');
      if (!dock) throw new Error('Language control is missing its Dock');
      const navigation = dock.querySelector('.ui-navigation-item');
      if (!navigation) throw new Error('Dock navigation missing');
      return {
        zoom: Number.parseFloat(getComputedStyle(dock).zoom),
        large: dock.classList.contains('ui-control-surface--scale-lg'),
        rootSize,
        navigationHeight: Number.parseFloat(getComputedStyle(navigation).height),
        navigationFontSize: Number.parseFloat(getComputedStyle(navigation).fontSize),
        groupHeight: Number.parseFloat(
          getComputedStyle(element.parentElement as HTMLElement).height,
        ),
        options: options.map((option) => {
          const style = getComputedStyle(option);
          return {
            height: Number.parseFloat(style.height),
            fontSize: Number.parseFloat(style.fontSize),
            padding: Number.parseFloat(style.paddingInlineStart),
            minWidth: style.minWidth,
          };
        }),
      };
    });
    expect(geometry.zoom).toBe(testInfo.project.name === 'desktop' ? 1.3 : 1);
    expect(geometry.navigationHeight / geometry.rootSize).toBeCloseTo(2, 2);
    expect(geometry.navigationFontSize / geometry.rootSize).toBeCloseTo(0.875, 3);
    expect(geometry.groupHeight / geometry.rootSize).toBeCloseTo(1.875, 2);
    for (const option of geometry.options) {
      expect(option.height / geometry.rootSize).toBeCloseTo(1.5, 2);
      expect(option.padding / geometry.rootSize).toBeCloseTo(0.375, 3);
      if (geometry.large)
        expect(Number.parseFloat(option.minWidth) / geometry.rootSize).toBeCloseTo(2, 3);
      else expect(option.minWidth).toBe('max-content');
      expect(option.fontSize / geometry.rootSize).toBeCloseTo(0.7 * (geometry.large ? 0.9 : 1), 3);
    }
    for (const option of await language.getByRole('radio').all()) {
      await option.click();
      await expect(option).toHaveAttribute('aria-checked', 'true');
      await expect
        .poll(() =>
          language.evaluate((element) => {
            const slider = element.querySelector('.ui-segmented-control__slider');
            const active = element.querySelector('[aria-checked="true"]');
            if (!slider || !active) throw new Error('Selected language geometry missing');
            const plate = slider.getBoundingClientRect();
            const label = active.getBoundingClientRect();
            return Math.max(
              Math.abs(plate.left - label.left),
              Math.abs(plate.width - label.width),
              Math.abs(plate.height - label.height),
            );
          }),
        )
        .toBeLessThan(1);
    }
  });
}
