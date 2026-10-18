import { expect, test } from '@playwright/test';

for (const theme of ['light', 'dark'] as const) {
  test(`step stages use circular nodes and a compact current badge / ${theme}`, async ({
    page,
  }, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.route('**/*', (route) =>
      route.request().resourceType() === 'font' ? route.abort() : route.continue(),
    );
    await page.goto(`/frame?theme=${theme}&lang=zh#data-display-step-flow`, {
      waitUntil: 'domcontentloaded',
    });
    const flow = page.locator('#data-display-step-flow .ui-step-flow');
    await expect(flow).toBeVisible();
    const current = flow.locator('[aria-current="step"]');
    await expect(current).toHaveCount(1);
    await expect(current.locator('.ui-badge--info')).toContainText('当前步骤');
    await expect(
      flow.locator('.ui-step-flow__item--complete .ui-step-flow__marker svg'),
    ).toBeVisible();
    const geometry = await flow.evaluate((element) => {
      const current = element.querySelector('[aria-current="step"]');
      const content = current?.querySelector('.ui-step-flow__content');
      const badge = current?.querySelector('.ui-badge');
      if (!content || !badge) throw new Error('Current stage is incomplete');
      const accent = getComputedStyle(content, '::after');
      return {
        overflow: element.scrollWidth > element.clientWidth + 1,
        hasSideBar: Number.parseFloat(accent.width) === 2 && Number.parseFloat(accent.height) > 16,
        badgeWidth: badge.getBoundingClientRect().width,
        contentWidth: content.getBoundingClientRect().width,
        markers: [...element.querySelectorAll('.ui-step-flow__marker')].map((marker) => {
          const rect = marker.getBoundingClientRect();
          return {
            width: rect.width,
            height: rect.height,
            radius: Number.parseFloat(getComputedStyle(marker).borderTopLeftRadius),
          };
        }),
      };
    });
    expect(geometry.overflow).toBe(false);
    expect(geometry.hasSideBar).toBe(false);
    expect(geometry.badgeWidth).toBeLessThan(geometry.contentWidth);
    for (const marker of geometry.markers) {
      expect(marker.width).toBeCloseTo(marker.height, 1);
      expect(marker.radius).toBeGreaterThanOrEqual(marker.width / 2);
    }
    await flow.screenshot({ path: testInfo.outputPath(`step-stages-${theme}.png`) });
  });
}
