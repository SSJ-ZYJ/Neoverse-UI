import { expect, test } from '@playwright/test';

test('decorative descendant animation does not keep repainting a stationary Glass edge', async ({
  page,
}) => {
  await page.addInitScript(() => {
    let clears = 0;
    for (const prototype of [WebGLRenderingContext.prototype, WebGL2RenderingContext.prototype]) {
      const clear = prototype.clear;
      prototype.clear = function (mask) {
        if (
          this.canvas instanceof HTMLCanvasElement &&
          this.canvas.hasAttribute('data-neoverse-glass-renderer-canvas')
        )
          clears += 1;
        return clear.call(this, mask);
      };
    }
    Reflect.set(window, '__glassClears', () => clears);
  });
  await page.goto('/react-fixture?theme=light&lang=en', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('html')).toHaveAttribute('data-neoverse-glass-renderer', 'webgl');
  await page.evaluate(() => {
    // Keep the actual shared renderer, while removing unrelated Lab animations
    // from this stationary-surface scheduling measurement.
    const app = document.getElementById('react-root');
    if (app) app.style.display = 'none';
    const surface = document.createElement('article');
    surface.className = 'material-glass-elevated';
    surface.dataset.glassSchedulingSurface = '';
    surface.style.cssText =
      'position:fixed;left:80px;top:80px;width:180px;height:100px;border-radius:16px;overflow:hidden;isolation:isolate';
    document.body.append(surface);
  });
  const surface = page.locator('[data-glass-scheduling-surface]');
  await expect(surface).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const count = Reflect.get(window, '__glassClears') as () => number;
        const before = count();
        await new Promise((resolve) => setTimeout(resolve, 200));
        return count() - before;
      }),
    )
    .toBe(0);
  await page.addStyleTag({
    content:
      '@keyframes glass-decoration { from { background-position: 0px 0px; } to { background-position: 100px 0px; } }',
  });
  await surface.evaluate((element) => {
    const decoration = document.createElement('span');
    decoration.style.cssText =
      'display:block;width:1px;height:1px;animation:glass-decoration 1s linear infinite';
    decoration.dataset.glassDecoration = '';
    element.append(decoration);
  });
  await expect
    .poll(() =>
      page.evaluate(
        () => document.querySelector('[data-glass-decoration]')?.getAnimations()[0]?.playState,
      ),
    )
    .toBe('running');
  const draws = await page.evaluate(async () => {
    const count = Reflect.get(window, '__glassClears') as () => number;
    await new Promise((resolve) => setTimeout(resolve, 300));
    const before = count();
    await new Promise((resolve) => setTimeout(resolve, 300));
    return count() - before;
  });
  await page.locator('[data-glass-decoration]').evaluate((element) => {
    (element as HTMLElement).style.animation = 'none';
  });
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const count = Reflect.get(window, '__glassClears') as () => number;
        const before = count();
        await new Promise((resolve) => setTimeout(resolve, 200));
        return count() - before;
      }),
    )
    .toBe(0);
  expect(draws).toBe(0);
  await expect(page.locator('html')).toHaveAttribute('data-neoverse-glass-renderer', 'webgl');
  // A clipped loading glyph changes content pixels, not the surface geometry.
  await page.addStyleTag({
    content: '@keyframes glass-glyph-spin { to { transform: rotate(360deg); } }',
  });
  await page.locator('[data-glass-decoration]').evaluate((element) => {
    (element as HTMLElement).style.cssText =
      'display:block;width:24px;height:24px;background:linear-gradient(90deg,white,black);animation:glass-glyph-spin 1s linear infinite';
  });
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const count = Reflect.get(window, '__glassClears') as () => number;
        const before = count();
        await new Promise((resolve) => setTimeout(resolve, 300));
        return count() - before;
      }),
    )
    .toBe(0);
  const beforeUnclip = await page.evaluate(() =>
    (Reflect.get(window, '__glassClears') as () => number)(),
  );
  await expect(page.locator('html')).toHaveAttribute('data-neoverse-glass-renderer', 'webgl');
  await surface.evaluate((element) => {
    (element as HTMLElement).style.overflow = 'visible';
  });
  await expect
    .poll(() => page.evaluate(() => (Reflect.get(window, '__glassClears') as () => number)()))
    .toBeGreaterThan(beforeUnclip + 2);
  await surface.evaluate((element) => {
    (element as HTMLElement).style.overflow = 'hidden';
  });
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const count = Reflect.get(window, '__glassClears') as () => number;
        const before = count();
        await new Promise((resolve) => setTimeout(resolve, 200));
        return count() - before;
      }),
    )
    .toBe(0);
  await page.locator('[data-glass-decoration]').evaluate((element) => {
    (element as HTMLElement).style.animation = 'none';
  });
  await page.addStyleTag({
    content:
      '@keyframes glass-surface-shift { from { transform: translateX(0); } to { transform: translateX(24px); } }',
  });
  const beforeMotion = await page.evaluate(() =>
    (Reflect.get(window, '__glassClears') as () => number)(),
  );
  await surface.evaluate((element) => {
    (element as HTMLElement).style.animation = 'glass-surface-shift 1s linear infinite';
  });
  await expect
    .poll(() => page.evaluate(() => (Reflect.get(window, '__glassClears') as () => number)()))
    .toBeGreaterThan(beforeMotion + 2);
  await surface.evaluate((element) => {
    (element as HTMLElement).style.animation = 'none';
  });
});
