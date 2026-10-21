import { expect, test } from '@playwright/test';

for (const theme of ['light', 'dark'] as const) {
  for (const locale of ['en', 'zh'] as const) {
    test(`core button specimens retain natural widths and circular shapes / ${theme} / ${locale}`, async ({
      page,
    }) => {
      await page.goto(`/frame?theme=${theme}&lang=${locale}#controls`);
      const circles = page.locator('#controls-button [data-button-shape="circle"]');
      await expect(circles).toHaveCount(3);
      const shapes = await circles.evaluateAll((elements) =>
        elements.map((element) => {
          const rect = element.getBoundingClientRect();
          return {
            width: rect.width,
            height: rect.height,
            radius: Number.parseFloat(getComputedStyle(element).borderTopLeftRadius),
          };
        }),
      );
      for (const [index, shape] of shapes.entries()) {
        expect(shape.width).toBeCloseTo([32, 40, 48][index] ?? 0, 1);
        expect(shape.height).toBeCloseTo(shape.width, 1);
        expect(shape.radius).toBeGreaterThanOrEqual(shape.width / 2);
      }
      const extraWidths = await page
        .locator(
          '#controls-button .playground-preview-columns .ui-button, #controls-action .playground-preview-columns .ui-action:not(.ui-action--stretch)',
        )
        .evaluateAll((elements) =>
          elements.map((element) => {
            const content = element.querySelector('.ui-button__content, .ui-action__content');
            if (!content) throw new Error('Missing button content');
            const style = getComputedStyle(element);
            const zoom = Number.parseFloat(style.zoom);
            const naturalWidth =
              content.getBoundingClientRect().width +
              (Number.parseFloat(style.paddingLeft) +
                Number.parseFloat(style.paddingRight) +
                Number.parseFloat(style.borderLeftWidth) +
                Number.parseFloat(style.borderRightWidth)) *
                zoom;
            return element.getBoundingClientRect().width - naturalWidth;
          }),
        );
      expect(extraWidths.length).toBeGreaterThan(0);
      for (const extraWidth of extraWidths) expect(Math.abs(extraWidth)).toBeLessThan(2);
      expect(
        await page
          .locator('#controls-button .ui-button--stretch')
          .first()
          .evaluate((element) => element.parentElement?.getBoundingClientRect().width ?? 0),
      ).toBeLessThan(300);
    });
  }
}

/** Verify real browser geometry, not just token strings. */
for (const theme of ['light', 'dark'] as const) {
  for (const locale of ['en', 'zh'] as const) {
    test(`Badge shares font family and weight while sizes increase / ${theme} / ${locale}`, async ({
      page,
    }, testInfo) => {
      await page.goto(`/?theme=${theme}&lang=${locale}#status-feedback-badge`, {
        waitUntil: 'domcontentloaded',
      });
      const label = locale === 'zh' ? '尺寸' : 'Sizes';
      const sizeRow = page.locator(`#status-feedback-badge [data-specimen-label="${label}"]`);
      await expect(sizeRow).toBeVisible();
      const heights = await sizeRow
        .locator('.ui-badge')
        .evaluateAll((badges) =>
          badges.map((badge) => Number.parseFloat(getComputedStyle(badge).height)),
        );
      expect(heights).toHaveLength(3);
      const [small, medium, large] = heights;
      if (small === undefined || medium === undefined || large === undefined) {
        throw new Error('Expected all three Badge sizes');
      }
      expect(large).toBeGreaterThan(Math.max(small, medium));
      const typography = await sizeRow.locator('.ui-badge').evaluateAll((badges) =>
        badges.map((badge) => {
          const style = getComputedStyle(badge);
          return { family: style.fontFamily, weight: style.fontWeight, size: style.fontSize };
        }),
      );
      expect(new Set(typography.map(({ family }) => family)).size).toBe(1);
      expect(typography.map(({ weight }) => weight)).toEqual(['650', '650', '650']);
      expect(typography.map(({ size }) => size)).toEqual(['13px', '14px', '16px']);
      await sizeRow.screenshot({ path: testInfo.outputPath(`badge-${theme}-${locale}.png`) });
      await sizeRow.evaluate((row) => {
        (row as HTMLElement).style.setProperty('--neoverse-badge-font-family', 'monospace');
        (row as HTMLElement).style.setProperty('--neoverse-badge-font-weight', '500');
      });
      for (const badge of await sizeRow.locator('.ui-badge').all()) {
        await expect(badge).toHaveCSS('font-family', 'monospace');
        await expect(badge).toHaveCSS('font-weight', '500');
      }
    });
  }
}

for (const theme of ['light', 'dark'] as const) {
  test(`React uses the same consumer default sizes in ${theme} mode`, async ({ page }) => {
    await page.goto(`/react-fixture?theme=${theme}&lang=en`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    const button = page.locator('[data-react-adapter="UiButton"]');
    await expect(button).toBeVisible();
    await expect(button).toHaveCSS('height', '40px');
    await expect(button).toHaveCSS('font-size', '14px');
    await expect(page.locator('[data-react-adapter="UiDock"]')).toHaveCSS('zoom', '1.1');
    await expect(page.locator('[data-react-adapter="UiIconButton"]')).toHaveCSS('width', '40px');
    await expect(page.locator('[data-react-adapter="UiAction"]')).toHaveCSS('height', '40px');
    await expect(page.locator('[data-react-adapter="UiInput"]')).toHaveCSS('font-size', '14px');
  });

  test(`component defaults are readable at a consumer's 16px root in ${theme} mode`, async ({
    page,
  }) => {
    await page.goto(`/frame?theme=${theme}&lang=en#controls`, {
      waitUntil: 'domcontentloaded',
    });
    await expect(page.locator('#controls-button .ui-button--md').first()).toBeVisible();

    const geometry = await page.evaluate(() => {
      const measure = (selector: string) => {
        const element = document.querySelector<HTMLElement>(selector);
        if (!element) throw new Error(`Missing specimen: ${selector}`);
        const style = getComputedStyle(element);
        return {
          width: Number.parseFloat(style.width),
          height: Number.parseFloat(style.height),
          fontSize: Number.parseFloat(style.fontSize),
        };
      };
      return {
        button: measure('#controls-button .ui-button--md'),
        iconButton: measure('#controls-icon-button .ui-icon-button--md'),
        action: measure('#controls-action .ui-action--md'),
        navigation: measure('#controls-navigation-item .ui-navigation-item.ui-action--md'),
        segment: measure('#controls-segmented-control .ui-segmented-control__option'),
      };
    });

    expect(geometry.button.height).toBeCloseTo(40, 1);
    expect(geometry.button.fontSize).toBeCloseTo(14, 1);
    expect(geometry.iconButton.height).toBeCloseTo(40, 1);
    expect(geometry.iconButton.width).toBeCloseTo(40, 1);
    expect(geometry.action.height).toBeCloseTo(40, 1);
    expect(geometry.action.fontSize).toBeCloseTo(14, 1);
    expect(geometry.navigation.height).toBeCloseTo(32, 1);
    expect(geometry.navigation.fontSize).toBeCloseTo(14, 1);
    expect(geometry.segment.height).toBeCloseTo(32, 1);
    expect(geometry.segment.fontSize).toBeCloseTo(14, 1);

    await page.goto(`/frame?theme=${theme}&lang=en#forms`, {
      waitUntil: 'domcontentloaded',
    });
    await expect(page.locator('.ui-input').first()).toBeVisible();
    const form = await page.evaluate(() => {
      const measure = (selector: string) => {
        const element = document.querySelector<HTMLElement>(selector);
        if (!element) throw new Error(`Missing specimen: ${selector}`);
        const style = getComputedStyle(element);
        return {
          width: Number.parseFloat(style.width),
          height: Number.parseFloat(style.height),
          fontSize: Number.parseFloat(style.fontSize),
        };
      };
      return {
        input: measure('.ui-input:not([data-appearance="terminal"])'),
        choice: measure('.ui-checkbox .ui-choice__control'),
        switch: measure('.ui-switch .ui-choice__control'),
      };
    });
    expect(form.input.height).toBeCloseTo(40, 1);
    expect(form.input.fontSize).toBeCloseTo(14, 1);
    expect(form.choice.width).toBeCloseTo(20, 1);
    expect(form.switch.width).toBeCloseTo(44, 1);
    expect(form.switch.height).toBeCloseTo(24, 1);
  });
}
