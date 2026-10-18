import { expect, test } from '@playwright/test';

// Geometry from the published 0.2.0 sources (c989c13). Embedded language
// options keep this footprint independently of standalone control sizing.
for (const theme of ['light', 'dark'] as const) {
  test(`Dock language options retain 0.2.0 geometry / ${theme}`, async ({ page }, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: theme });
    await page.route('**/*', (route) =>
      route.request().resourceType() === 'font' ? route.abort() : route.continue(),
    );
    await page.goto(`/frame?theme=${theme}&lang=zh#consumer-parity`, {
      waitUntil: 'domcontentloaded',
    });
    const dock = page.locator('[data-consumer-parity="floating-navigation"]');
    const language = dock.locator('.consumer-parity-dock__language');
    await expect(language).toBeVisible();
    const geometry = await language.evaluate((element) => {
      const options = [...element.querySelectorAll<HTMLElement>('.ui-segmented-control__option')];
      const rootSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
      const dockRoot = element.closest<HTMLElement>('.ui-dock');
      if (!dockRoot) throw new Error('Language control is missing its Dock');
      const primaryGroup = dockRoot.querySelector<HTMLElement>(
        '.ui-control-surface__group--primary',
      );
      if (!primaryGroup) throw new Error('Dock navigation group missing');
      const primaryBounds = primaryGroup.getBoundingClientRect();
      const languageBounds = element.getBoundingClientRect();
      const navigation = dockRoot.querySelector('.ui-navigation-item');
      if (!navigation) throw new Error('Dock navigation missing');
      const trailingGroup = dockRoot.querySelector<HTMLElement>(
        '.ui-control-surface__group--trailing',
      );
      if (!trailingGroup) throw new Error('Dock trailing group missing');
      const trailingBounds = trailingGroup.getBoundingClientRect();
      const firstOption = options[0];
      const lastOption = options.at(-1);
      if (!firstOption || !lastOption) throw new Error('Dock language options missing');
      const firstBounds = firstOption.getBoundingClientRect();
      const lastBounds = lastOption.getBoundingClientRect();
      const zoom = Number.parseFloat(getComputedStyle(dockRoot).zoom);
      return {
        insets: {
          inlineStart: (firstBounds.left - trailingBounds.left) / zoom,
          inlineEnd: (trailingBounds.right - lastBounds.right) / zoom,
          blockStart: (firstBounds.top - trailingBounds.top) / zoom,
          blockEnd: (trailingBounds.bottom - lastBounds.bottom) / zoom,
        },
        verticalCenterOffset:
          (languageBounds.top + languageBounds.bottom - primaryBounds.top - primaryBounds.bottom) /
          2,
        zoom: Number.parseFloat(getComputedStyle(dockRoot).zoom),
        large: dockRoot.classList.contains('ui-control-surface--scale-lg'),
        compact: dockRoot.classList.contains('ui-dock--compact'),
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
            paddingBlock: Number.parseFloat(style.paddingBlockStart),
            paddingInline: Number.parseFloat(style.paddingInlineStart),
            minWidth: style.minWidth,
          };
        }),
      };
    });
    expect(geometry.zoom).toBe(1.1);
    expect(
      Math.abs(geometry.verticalCenterOffset),
      'Dock language control should be vertically centered with navigation',
    ).toBeLessThan(1);
    expect(geometry.insets.inlineStart / geometry.rootSize).toBeCloseTo(0.3125, 2);
    expect(geometry.insets.inlineEnd / geometry.rootSize).toBeCloseTo(0.3125, 2);
    expect(geometry.insets.blockStart / geometry.rootSize).toBeCloseTo(0.1875, 2);
    expect(geometry.insets.blockEnd / geometry.rootSize).toBeCloseTo(0.1875, 2);
    expect(geometry.navigationHeight / geometry.rootSize).toBeCloseTo(2, 2);
    expect(geometry.navigationFontSize / geometry.rootSize).toBeCloseTo(0.875 * 0.95, 3);
    expect(geometry.groupHeight / geometry.rootSize).toBeCloseTo(1.875, 2);
    for (const option of geometry.options) {
      expect(option.height / geometry.rootSize).toBeCloseTo(1.5, 2);
      expect(option.paddingBlock / geometry.rootSize).toBeCloseTo(0.2, 3);
      expect(option.paddingInline / geometry.rootSize).toBeCloseTo(0.375, 3);
      if (!geometry.compact)
        expect(Number.parseFloat(option.minWidth) / geometry.rootSize).toBeCloseTo(2, 3);
      else expect(option.minWidth).toBe('max-content');
      expect(option.fontSize / geometry.rootSize).toBeCloseTo(0.7 * (geometry.large ? 0.9 : 1), 3);
    }
    await testInfo.attach('Dock geometry', {
      body: JSON.stringify(geometry, null, 2),
      contentType: 'application/json',
    });
    await dock.screenshot({ path: testInfo.outputPath('dock-language-proportions.png') });
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
