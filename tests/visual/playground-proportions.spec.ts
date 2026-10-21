import { expect, test } from '@playwright/test';

for (const theme of ['light', 'dark'] as const) {
  for (const locale of ['en', 'zh'] as const) {
    for (const route of ['/', '/frame'] as const) {
      test(`all modules preserve component proportions / ${theme} / ${locale} / ${route}`, async ({
        page,
      }, testInfo) => {
        test.setTimeout(60_000);
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.goto(`/?theme=${theme}&lang=${locale}`, { waitUntil: 'domcontentloaded' });
        const modules = await page
          .locator('[data-playground-navigation] a[href^="#"]')
          .evaluateAll((links) => [
            ...new Set(
              links.flatMap((link) => {
                const href = link.getAttribute('href');
                return href ? [href] : [];
              }),
            ),
          ]);
        expect(modules.length).toBeGreaterThan(0);
        const widths =
          testInfo.project.name === 'desktop' ? [1280, 1600, 1920, 2560] : [320, 390, 768];
        const anomalies: { width: number; module: string; issues: string[] }[] = [];
        for (const width of widths) {
          await page.setViewportSize({ width, height: 1080 });
          for (const module of modules) {
            await page.goto(`${route}?theme=${theme}&lang=${locale}${module}`, {
              waitUntil: 'domcontentloaded',
            });
            const region = page.locator('[data-design-lab-region="module"]');
            await expect(region).toBeVisible();
            const issues = await region.evaluate((region) => {
              const issues: string[] = [];
              const controls = region.querySelectorAll<HTMLElement>(
                '.ui-button, .ui-action, .ui-control-surface, .ui-segmented-control, .ui-input, .ui-textarea, .ui-select, .ui-choice__control, .ui-skeleton',
              );
              for (const control of controls) {
                const rect = control.getBoundingClientRect();
                if (!control.checkVisibility() || rect.height < 8 || rect.width < 8) continue;
                const cssHeight = Number.parseFloat(getComputedStyle(control).height);
                if (!Number.isFinite(cssHeight) || cssHeight < 8) continue;
                // Explicit library scale examples may enlarge. Preview wrappers may not.
                let componentScale = 1;
                for (
                  let ancestor: HTMLElement | null = control;
                  ancestor && ancestor !== region;
                  ancestor = ancestor.parentElement
                ) {
                  if (ancestor.matches('.ui-control-surface, .ui-action--scale-lg')) {
                    componentScale *= Number.parseFloat(getComputedStyle(ancestor).zoom);
                  }
                }
                const ratio = rect.height / cssHeight / componentScale;
                if (Math.abs(ratio - 1) > 0.025) {
                  issues.push(`${control.classList[0]} magnified ${ratio.toFixed(3)}x`);
                }
              }
              for (const icon of region.querySelectorAll<SVGElement>(
                '.ui-icon-button svg, .ui-action__leading > svg, .ui-action__trailing > svg',
              )) {
                const rect = icon.getBoundingClientRect();
                if (
                  rect.width > 0 &&
                  rect.height > 0 &&
                  Math.abs(rect.width / rect.height - 1) > 0.025
                ) {
                  issues.push(`distorted icon ${rect.width.toFixed(1)}x${rect.height.toFixed(1)}`);
                }
              }
              if (document.documentElement.scrollWidth > document.documentElement.clientWidth + 1) {
                issues.push('document horizontal overflow');
              }
              return [...new Set(issues)];
            });
            if (issues.length) anomalies.push({ width, module, issues });
          }
        }
        expect(anomalies, 'No implicit magnification, distorted icons, or page overflow').toEqual(
          [],
        );
      });
    }
  }
}

test('Dock specimens keep navigation at normal component proportions', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Checks the desktop specimen presentation.');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?theme=dark&lang=zh#dock', { waitUntil: 'domcontentloaded' });
  const dock = page.locator('[data-dock-specimen="standard"] .ui-dock');
  await expect(dock).toBeVisible();
  const geometry = await dock.evaluate((element) => {
    const item = element.querySelector<HTMLElement>('.ui-navigation-item');
    if (!item) throw new Error('Dock navigation item is missing');
    const rect = element.getBoundingClientRect();
    const itemStyle = getComputedStyle(item);
    return {
      rootFontSize: Number.parseFloat(getComputedStyle(document.documentElement).fontSize),
      height: rect.height,
      itemHeight: item.getBoundingClientRect().height,
      itemCssHeight: Number.parseFloat(itemStyle.height),
      itemFontSize: Number.parseFloat(itemStyle.fontSize),
      scale: Number.parseFloat(getComputedStyle(element).zoom),
    };
  });
  await testInfo.attach('Dock geometry', {
    body: JSON.stringify(geometry),
    contentType: 'application/json',
  });
  await dock.screenshot({ path: testInfo.outputPath('dock-proportions.png') });
  expect(
    geometry.height,
    'Dock must stay within four root em at normal browser zoom',
  ).toBeLessThanOrEqual(geometry.rootFontSize * 4);
  expect(
    geometry.itemHeight / geometry.itemCssHeight,
    'Specimens retain the explicit Dock scale',
  ).toBeCloseTo(geometry.scale, 1);
  expect(geometry.scale).toBe(1.1);
});

for (const theme of ['light', 'dark'] as const) {
  test(`enlarging Dock preserves geometry and embedded type compensation / ${theme}`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/frame?theme=${theme}&lang=zh#dock`, { waitUntil: 'domcontentloaded' });
    const dock = page.locator('[data-dock-specimen="standard"] .ui-dock');
    await expect(dock).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const normalScale = await dock.evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).zoom),
    );
    const readGeometry = () =>
      dock.evaluate((element) => {
        const selectors = [
          '.ui-navigation-item',
          '.ui-action__leading > svg',
          '.ui-navigation-item__label',
          '.ui-segmented-control__option',
          '.ui-control-surface__group--trailing',
        ];
        return [
          element,
          ...selectors.map((selector) => {
            const node = element.querySelector(selector);
            if (!node) throw new Error(`Missing scale specimen ${selector}`);
            return node;
          }),
        ].map((node) => {
          const rect = node.getBoundingClientRect();
          const style = getComputedStyle(node);
          return {
            width: rect.width,
            height: rect.height,
            fontSize: style.fontSize,
            padding: style.padding,
            gap: style.gap,
            radius: style.borderTopLeftRadius,
          };
        });
      });
    const normal = await readGeometry();
    await dock.evaluate((element) => {
      element.classList.replace('ui-control-surface--scale-md', 'ui-control-surface--scale-lg');
    });
    const enlarged = await readGeometry();
    const scale = await dock.evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).zoom),
    );
    expect(scale).toBe(1.3);
    const scaleRatio = scale / normalScale;
    for (const [index, original] of normal.entries()) {
      const scaled = enlarged[index];
      if (!scaled) throw new Error('Scaled geometry is missing');
      // The 0.2.0 embedded language control keeps its optical type compensation
      // in lg while the shell, icons and option geometry retain the same scale.
      const typeFactor = index === 4 ? 0.9 : 1;
      expect(parseFloat(scaled.fontSize)).toBeCloseTo(
        parseFloat(original.fontSize) * typeFactor,
        2,
      );
      expect(scaled.padding).toBe(original.padding);
      expect(scaled.gap).toBe(original.gap);
      expect(scaled.radius).toBe(original.radius);
      // Chromium rounds borders and glyph metrics before applying CSS zoom.
      // Explicit SVG dimensions retain the tighter subpixel bound.
      const tolerance = index === 2 ? 0.35 : 1.05;
      if (index === 2 || index === 4 || index === 5) {
        expect(Math.abs(scaled.width - original.width * scaleRatio)).toBeLessThan(tolerance);
      }
      const heightScale = scaleRatio;
      expect(Math.abs(scaled.height - original.height * heightScale)).toBeLessThan(tolerance);
    }
  });
}
