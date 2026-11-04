import { expect, type Locator, test } from '@playwright/test';

const backgroundAlpha = (thumb: Locator) =>
  thumb.evaluate((element) => {
    const color = getComputedStyle(element).backgroundColor;
    const context = document.createElement('canvas').getContext('2d');
    if (!context) throw new Error('Cannot inspect scrollbar colour');
    context.fillStyle = color;
    context.fillRect(0, 0, 1, 1);
    return context.getImageData(0, 0, 1, 1).data[3] ?? 0;
  });

for (const theme of ['light', 'dark'] as const) {
  test(`${theme}: document scrollbar stays painted during hover and a stationary drag`, async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'Hover requires a fine pointer.');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/frame?theme=${theme}&lang=en#scrollbar-component`, {
      waitUntil: 'domcontentloaded',
    });
    const track = page.locator('[data-ui-scrollbar-fixture]');
    const thumb = track.locator('.ui-scrollbar__thumb');
    await page.evaluate(() => window.scrollTo(0, 300));
    await expect(track).toHaveAttribute('data-visible', 'true');
    expect(await backgroundAlpha(thumb)).toBeGreaterThan(0);
    const bounds = await thumb.boundingBox();
    if (!bounds) throw new Error('The scrollbar thumb is missing');
    await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    await page.waitForTimeout(1400);
    await expect(track).toHaveAttribute('data-visible', 'true');
    expect(await backgroundAlpha(thumb)).toBeGreaterThan(0);
    await page.mouse.down();
    await expect(track).toHaveClass(/ui-scrollbar--dragging/);
    await page.waitForTimeout(1400);
    await expect(track).toHaveAttribute('data-visible', 'true');
    expect(await backgroundAlpha(thumb)).toBeGreaterThan(0);
    await page.mouse.up();
    await page.mouse.move(bounds.x - 32, bounds.y);
    await expect(track).toHaveAttribute('data-visible', 'false');
  });

  // Native scrollbar hover/press repaint is engine-owned and stays hidden in
  // headless Chromium's overlay mode, so assert the utility's applied paint and
  // clip through the engine's scrollbar pseudos. The custom overlay above
  // verifies the same hover/drag paint contract on real DOM pixels.
  test(`${theme}: native immersive scrollbar applies its painted, clipped thumb`, async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'WebKit scrollbar pseudos are Chromium-only.');
    await page.goto(`/frame?theme=${theme}&lang=en#scrollbar-component`, {
      waitUntil: 'domcontentloaded',
    });
    const viewport = page.locator('[data-scrollbar-preview-viewport]');
    await viewport.scrollIntoViewIfNeeded();
    const state = await viewport.evaluate((element) => {
      const bar = getComputedStyle(element, '::-webkit-scrollbar');
      const track = getComputedStyle(element, '::-webkit-scrollbar-track');
      const thumb = getComputedStyle(element, '::-webkit-scrollbar-thumb');
      return {
        width: Number.parseFloat(bar.width),
        trackBackground: track.backgroundColor,
        thumbBackground: thumb.backgroundColor,
        thumbClip: thumb.backgroundClip,
        thumbBorder: Number.parseFloat(thumb.borderTopWidth),
        thumbMinHeight: Number.parseFloat(thumb.minHeight),
      };
    });
    expect(state.width).toBeGreaterThan(0);
    expect(state.thumbClip).toBe('padding-box');
    expect(state.thumbBorder).toBeGreaterThan(0);
    expect(state.thumbMinHeight).toBeGreaterThan(0);
    expect(state.trackBackground, 'the native lane must stay transparent').toBe('rgba(0, 0, 0, 0)');
    const alpha = await page.evaluate((background) => {
      const context = document.createElement('canvas').getContext('2d');
      if (!context) throw new Error('Cannot inspect scrollbar colour');
      context.fillStyle = background;
      context.fillRect(0, 0, 1, 1);
      return context.getImageData(0, 0, 1, 1).data[3] ?? 0;
    }, state.thumbBackground);
    expect(
      alpha,
      'the thumb must stay painted instead of inheriting a transparent lane',
    ).toBeGreaterThan(0);
  });
}
