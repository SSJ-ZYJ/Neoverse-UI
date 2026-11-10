import { expect, test } from '@playwright/test';

const glassPage = '/frame?theme=light&lang=en#materials';
const canvasSelector = '[data-neoverse-glass-renderer-canvas]';

test.describe('Aurora Glass runtime', () => {
  test('the shared renderer mounts one fixed noninteractive canvas', async ({ page }) => {
    await page.goto(glassPage, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('data-neoverse-glass-renderer', 'webgl');
    await expect(page.locator(canvasSelector)).toHaveCount(1);

    const properties = await page.locator(canvasSelector).evaluate((canvas) => {
      const style = getComputedStyle(canvas);
      return {
        position: style.position,
        inset: style.inset,
        pointerEvents: style.pointerEvents,
        zIndex: style.zIndex,
        hidden: canvas.getAttribute('aria-hidden'),
      };
    });
    expect(properties).toEqual({
      position: 'fixed',
      inset: '0px',
      pointerEvents: 'none',
      zIndex: '2147483646',
      hidden: 'true',
    });
  });

  test('the CSS edge and backdrop blur remain when WebGL is unavailable', async ({ page }) => {
    await page.addInitScript(() => {
      const getContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (
        this: HTMLCanvasElement,
        kind,
        ...arguments_
      ) {
        if (kind === 'webgl' || kind === 'webgl2' || kind === 'experimental-webgl') {
          return null;
        }
        return Reflect.apply(getContext, this, [kind, ...arguments_]);
      } as typeof HTMLCanvasElement.prototype.getContext;
    });
    await page.goto(glassPage, { waitUntil: 'domcontentloaded' });
    const surface = page.locator('[data-surface="glass-elevated"]').first();
    await expect(surface).toBeVisible();
    await expect(page.locator(canvasSelector)).toHaveCount(0);
    await expect(page.locator('html')).not.toHaveAttribute('data-neoverse-glass-renderer', 'webgl');

    const material = await surface.evaluate((element) => ({
      filter: getComputedStyle(element).backdropFilter,
      edgeDisplay: getComputedStyle(element, '::before').display,
    }));
    expect(material.filter).toContain('blur(18px)');
    expect(material.edgeDisplay).not.toBe('none');
  });

  test('painted strokes affect opted-in dark surfaces without altering the body blur', async ({
    page,
  }) => {
    await page.goto('/frame?theme=dark&lang=en#materials', {
      waitUntil: 'domcontentloaded',
    });
    const surface = page.locator('[data-surface="glass-elevated"]').first();
    await expect(surface).toBeVisible();

    const original = await surface.evaluate((element) => {
      const style = getComputedStyle(element);
      return { shadow: style.boxShadow, filter: style.backdropFilter };
    });
    await surface.evaluate((element) =>
      element.setAttribute('data-neoverse-glass-edge-stroke', ''),
    );
    const optedIn = await surface.evaluate((element) => {
      const style = getComputedStyle(element);
      return { shadow: style.boxShadow, filter: style.backdropFilter };
    });

    expect(optedIn.shadow).not.toBe(original.shadow);
    expect(optedIn.shadow).not.toBe('none');
    expect(optedIn.filter).toBe(original.filter);
    expect(optedIn.filter).toContain('blur(18px)');
  });
});
