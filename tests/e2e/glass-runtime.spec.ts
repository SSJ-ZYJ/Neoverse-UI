import { expect, test } from '@playwright/test';
import { expectNoPageOverflow } from '../support/e2e';

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

  test('suspend freezes the edge canvas through a page translation and resume realigns it once', async ({
    page,
  }) => {
    // Read back the WebGL canvas after compositing; the drawing buffer is
    // otherwise cleared before toDataURL runs. Test-only readback aid.
    await page.addInitScript(() => {
      const getContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (
        this: HTMLCanvasElement,
        kind: string,
        ...arguments_: unknown[]
      ) {
        if (kind === 'webgl' || kind === 'webgl2') {
          return Reflect.apply(getContext, this, [
            kind,
            { ...(arguments_[0] as object), preserveDrawingBuffer: true },
          ]);
        }
        return Reflect.apply(getContext, this, [kind, ...arguments_]);
      } as typeof HTMLCanvasElement.prototype.getContext;
      const probe = Document.prototype.elementsFromPoint;
      (window as Window & { __occlusionProbes?: number }).__occlusionProbes = 0;
      Document.prototype.elementsFromPoint = function (
        this: Document,
        ...arguments_: [number, number]
      ) {
        const scope = window as Window & { __occlusionProbes?: number };
        scope.__occlusionProbes = (scope.__occlusionProbes ?? 0) + 1;
        return probe.apply(this, arguments_);
      };
    });
    await page.goto(glassPage, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('data-neoverse-glass-renderer', 'webgl');
    const canvas = page.locator(canvasSelector);
    const surface = page.locator('[data-surface="glass-elevated"]').first();
    await surface.scrollIntoViewIfNeeded();
    await expect(surface).toBeVisible();
    const readCanvas = () =>
      canvas.evaluate((element) => (element as HTMLCanvasElement).toDataURL());
    const probes = () =>
      page.evaluate(
        () => (window as Window & { __occlusionProbes?: number }).__occlusionProbes ?? 0,
      );
    await page.waitForFunction(() => '__neoverseGlassRenderer' in window);
    const settleFrames = () =>
      page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() =>
              requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
            ),
          ),
      );
    // Let the scroll-triggered repaint land so the captured frame is stable.
    await settleFrames();

    const before = await readCanvas();
    expect(before.length).toBeGreaterThan(1000);
    await page.evaluate(() => {
      (
        window as Window & { __neoverseGlassRenderer?: { suspend(): void } }
      ).__neoverseGlassRenderer?.suspend();
    });
    const probesAtSuspend = await probes();
    // Shift the surface a modest amount that keeps it inside the viewport on
    // both desktop and mobile, so its WebGL edge visibly moves on resume.
    await surface.evaluate((element) => {
      (element as HTMLElement).style.transform = 'translate(32px, 24px)';
    });
    await settleFrames();
    // No occlusion hit tests and no repaint while the page translation runs.
    expect(await probes()).toBe(probesAtSuspend);
    expect(await readCanvas()).toBe(before);

    await page.evaluate(() => {
      (
        window as Window & { __neoverseGlassRenderer?: { resume(): void } }
      ).__neoverseGlassRenderer?.resume();
    });
    const after = await readCanvas();
    expect(after).not.toBe(before);
    expect(await probes()).toBeGreaterThan(probesAtSuspend);
    // The resume frame matches a full per-frame refresh of the settled scene.
    await page.evaluate(() => {
      (
        window as Window & { __neoverseGlassRenderer?: { refresh(force?: boolean): void } }
      ).__neoverseGlassRenderer?.refresh(true);
    });
    expect(await readCanvas()).toBe(after);
  });
});

test('a theme switch keeps the shared renderer canvas', async ({ page }) => {
  await page.goto(glassPage, { waitUntil: 'domcontentloaded' });
  const canvas = page.locator(canvasSelector);
  await expect(canvas).toHaveCount(1);

  await page.evaluate(() => {
    const current = document.querySelector('[data-neoverse-glass-renderer-canvas]');
    (window as Window & { __glassCanvas?: Element | null }).__glassCanvas = current;
    document.documentElement.dataset.theme = 'dark';
  });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(
    page.evaluate(
      () =>
        (window as Window & { __glassCanvas?: Element | null }).__glassCanvas ===
        document.querySelector('[data-neoverse-glass-renderer-canvas]'),
    ),
  ).resolves.toBe(true);
  await expect(canvas).toHaveCount(1);
});

test('a real context loss falls back to CSS and restore builds one new canvas', async ({
  page,
}) => {
  await page.goto(glassPage, { waitUntil: 'domcontentloaded' });
  const canvas = page.locator(canvasSelector);
  await canvas.evaluate((element) => {
    const gl = (element as HTMLCanvasElement).getContext('webgl2');
    const extension = gl?.getExtension('WEBGL_lose_context');
    if (!gl || !extension) throw new Error('The live renderer must expose WEBGL_lose_context');
    (window as Window & { __glassContext?: WebGL2RenderingContext }).__glassContext = gl;
    (window as Window & { __glassLoss?: WEBGL_lose_context }).__glassLoss = extension;
    extension.loseContext();
  });
  await expect(canvas).toHaveCSS('display', 'none');
  await expect(page.locator('html')).not.toHaveAttribute('data-neoverse-glass-renderer', 'webgl');

  await page.evaluate(() =>
    (window as Window & { __glassLoss?: WEBGL_lose_context }).__glassLoss?.restoreContext(),
  );
  await expect(page.locator(canvasSelector)).toHaveCount(1);
  await expect(canvas).toHaveCSS('display', 'block');
  await expect(page.locator('html')).toHaveAttribute('data-neoverse-glass-renderer', 'webgl');
  expect(
    await page.evaluate(
      () =>
        (window as Window & { __glassContext?: WebGL2RenderingContext }).__glassContext !==
        document
          .querySelector<HTMLCanvasElement>('[data-neoverse-glass-renderer-canvas]')
          ?.getContext('webgl2'),
    ),
  ).toBe(true);
});

test('runtime reduced transparency releases and restores the shared canvas', async ({ page }) => {
  await page.addInitScript(() => {
    const original = window.matchMedia.bind(window);
    const listeners = new Set<(event: MediaQueryListEvent) => void>();
    let reduced = false;
    const media = {
      get matches() {
        return reduced;
      },
      media: '(prefers-reduced-transparency: reduce)',
      onchange: null,
      addEventListener(type: string, listener: (event: MediaQueryListEvent) => void) {
        if (type === 'change') listeners.add(listener);
      },
      removeEventListener(type: string, listener: (event: MediaQueryListEvent) => void) {
        if (type === 'change') listeners.delete(listener);
      },
    } as unknown as MediaQueryList;
    window.matchMedia = (query) =>
      query === '(prefers-reduced-transparency: reduce)' ? media : original(query);
    (
      window as Window & { __setReducedTransparency?: (value: boolean) => void }
    ).__setReducedTransparency = (value) => {
      reduced = value;
      for (const listener of listeners) listener({ matches: value } as MediaQueryListEvent);
    };
  });
  await page.goto(glassPage, { waitUntil: 'domcontentloaded' });
  const canvas = page.locator(canvasSelector);
  await expect(canvas).toHaveCount(1);

  await page.evaluate(() =>
    (
      window as Window & { __setReducedTransparency?: (value: boolean) => void }
    ).__setReducedTransparency?.(true),
  );
  await expect(canvas).toHaveCount(0);
  await expect(page.locator('[data-surface="glass-elevated"]').first()).toBeVisible();

  await page.evaluate(() =>
    (
      window as Window & { __setReducedTransparency?: (value: boolean) => void }
    ).__setReducedTransparency?.(false),
  );
  await expect(canvas).toHaveCount(1);
});

test('both adapters mount one shared renderer under reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const url of [
    '/frame?theme=light&lang=en#materials',
    '/react-fixture?theme=light&lang=en&contract-fixtures=1',
  ]) {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('data-neoverse-glass-renderer', 'webgl');
    await expect(page.locator(canvasSelector)).toHaveCount(1);
  }
});

test('forced colors keeps the glass surfaces usable without a page overflow', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await page.goto(glassPage, { waitUntil: 'domcontentloaded' });
  const surface = page.locator('[data-surface="glass-elevated"]').first();
  await expect(surface).toBeVisible();
  const style = await surface.evaluate((element) => {
    const computed = getComputedStyle(element);
    return {
      color: computed.color,
      forcedColorAdjust: computed.forcedColorAdjust,
    };
  });
  expect(style.color).not.toBe('rgba(0, 0, 0, 0)');
  expect(style.forcedColorAdjust).toBe('auto');
  await expectNoPageOverflow(page);
});

test('WAAPI layout size motion keeps WebGL edges aligned with resizing and shifted controls', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.addInitScript(() => {
    const origGetUniformLocation = WebGL2RenderingContext.prototype.getUniformLocation;
    const origClear = WebGL2RenderingContext.prototype.clear;
    const origUniform4f = WebGL2RenderingContext.prototype.uniform4f;
    const names = new WeakMap<WebGLUniformLocation, string>();
    WebGL2RenderingContext.prototype.getUniformLocation = function (program, name) {
      const location = origGetUniformLocation.call(this, program, name);
      if (location) names.set(location, name);
      return location;
    };
    const scope = window as Window & {
      __glassFrames?: Array<{ rects: number[][] }>;
    };
    scope.__glassFrames = [];
    let current: { rects: number[][] } | null = null;
    WebGL2RenderingContext.prototype.clear = function (...args) {
      current = { rects: [] };
      scope.__glassFrames?.push(current);
      return origClear.apply(this, args);
    };
    WebGL2RenderingContext.prototype.uniform4f = function (location, a, b, c, d) {
      if (location && names.get(location) === 'u_rect' && current) {
        current.rects.push([a, b, c, d]);
      }
      return origUniform4f.call(this, location, a, b, c, d);
    };
  });

  await page.goto('/?theme=light&lang=en&fps=0#foundation-motion-playground', {
    waitUntil: 'domcontentloaded',
  });
  await expect(page.locator('html')).toHaveAttribute('data-neoverse-glass-renderer', 'webgl');
  await page.evaluate(() => document.fonts.ready);

  const tracePromise = page.evaluate(() => {
    const scope = window as Window & { __glassFrames?: Array<{ rects: number[][] }> };
    scope.__glassFrames = [];
    const start = performance.now();
    const channel = new MessageChannel();
    const samples: Array<{ maxErr: number; width: number }> = [];
    let pending: { targets: number[][] } | null = null;
    channel.port1.onmessage = () => {
      if (!pending) return;
      const latest = scope.__glassFrames?.at(-1);
      if (latest) {
        for (const dom of pending.targets) {
          let bestErr = Number.POSITIVE_INFINITY;
          for (const rect of latest.rects) {
            const err = Math.max(
              Math.abs((rect[0] ?? 0) - (dom[0] ?? 0)),
              Math.abs((rect[1] ?? 0) - (dom[1] ?? 0)),
              Math.abs((rect[2] ?? 0) - (dom[2] ?? 0)),
              Math.abs((rect[3] ?? 0) - (dom[3] ?? 0)),
            );
            if (err < bestErr) bestErr = err;
          }
          samples.push({ maxErr: bestErr, width: dom[2] ?? 0 });
        }
      }
      pending = null;
    };
    return new Promise<typeof samples>((resolve) => {
      const step = () => {
        const text = document.querySelector('[data-motion-size-sample="text"]');
        const icon = document.querySelector('[data-motion-size-sample="icon"]');
        if (text && icon) {
          const t = text.getBoundingClientRect();
          const i = icon.getBoundingClientRect();
          pending = {
            targets: [
              [t.left, t.top, t.width, t.height],
              [i.left, i.top, i.width, i.height],
            ],
          };
          channel.port2.postMessage(null);
        }
        if (performance.now() - start < 450) requestAnimationFrame(step);
        else setTimeout(() => resolve(samples), 30);
      };
      requestAnimationFrame(step);
    });
  });

  await page.locator('[data-motion-size-control]').getByRole('radio', { name: 'Large' }).click();
  const samples = await tracePromise;
  expect(samples.length).toBeGreaterThan(4);
  const maxError = Math.max(...samples.map((entry) => entry.maxErr));
  expect(maxError).toBeLessThanOrEqual(0.5);
});

test('rotated glass surfaces upload tilted basis vectors matching their local dimensions', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const origGetUniformLocation = WebGL2RenderingContext.prototype.getUniformLocation;
    const origClear = WebGL2RenderingContext.prototype.clear;
    const origUniform4f = WebGL2RenderingContext.prototype.uniform4f;
    const origUniform2f = WebGL2RenderingContext.prototype.uniform2f;
    const names = new WeakMap<WebGLUniformLocation, string>();
    WebGL2RenderingContext.prototype.getUniformLocation = function (program, name) {
      const location = origGetUniformLocation.call(this, program, name);
      if (location) names.set(location, name);
      return location;
    };
    const scope = window as Window & {
      __lastRotatedDraw?: { basis: number[]; size: number[] };
    };
    let currentBasis: number[] = [];
    let currentSize: number[] = [];
    WebGL2RenderingContext.prototype.clear = function (...args) {
      currentBasis = [];
      currentSize = [];
      return origClear.apply(this, args);
    };
    WebGL2RenderingContext.prototype.uniform2f = function (location, a, b) {
      if (location && names.get(location) === 'u_rect_size') currentSize = [a, b];
      return origUniform2f.call(this, location, a, b);
    };
    WebGL2RenderingContext.prototype.uniform4f = function (location, a, b, c, d) {
      if (location && names.get(location) === 'u_basis') {
        currentBasis = [a, b, c, d];
        if (Math.abs(b) > 0.01) {
          scope.__lastRotatedDraw = { basis: currentBasis, size: currentSize };
        }
      }
      return origUniform4f.call(this, location, a, b, c, d);
    };
  });

  await page.goto(glassPage, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('html')).toHaveAttribute('data-neoverse-glass-renderer', 'webgl');
  await page.waitForFunction(() => '__neoverseGlassRenderer' in window);

  const rotated = await page.evaluate(() => {
    const card = document.createElement('div');
    card.className = 'material-glass-elevated';
    card.style.cssText =
      'position:fixed;left:120px;top:120px;width:240px;height:100px;rotate:-5deg;';
    document.body.append(card);
    (
      window as Window & { __neoverseGlassRenderer?: { refresh(force?: boolean): void } }
    ).__neoverseGlassRenderer?.refresh(true);
    const draw = (window as Window & { __lastRotatedDraw?: { basis: number[]; size: number[] } })
      .__lastRotatedDraw;
    card.remove();
    return draw;
  });

  expect(rotated).toBeDefined();
  expect(rotated?.size[0]).toBeCloseTo(240, 0);
  expect(rotated?.size[1]).toBeCloseTo(100, 0);
  const rad = (-5 * Math.PI) / 180;
  expect(rotated?.basis[0]).toBeCloseTo(Math.cos(rad), 2);
  expect(rotated?.basis[1]).toBeCloseTo(Math.sin(rad), 2);
});

test('open native top-layer popovers keep local CSS edges without duplicate WebGL draws', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const origGetUniformLocation = WebGL2RenderingContext.prototype.getUniformLocation;
    const origClear = WebGL2RenderingContext.prototype.clear;
    const origUniform4f = WebGL2RenderingContext.prototype.uniform4f;
    const names = new WeakMap<WebGLUniformLocation, string>();
    WebGL2RenderingContext.prototype.getUniformLocation = function (program, name) {
      const location = origGetUniformLocation.call(this, program, name);
      if (location) names.set(location, name);
      return location;
    };
    const scope = window as Window & { __latestGlRects?: number[][] };
    let current: number[][] = [];
    WebGL2RenderingContext.prototype.clear = function (...args) {
      current = [];
      scope.__latestGlRects = current;
      return origClear.apply(this, args);
    };
    WebGL2RenderingContext.prototype.uniform4f = function (location, a, b, c, d) {
      if (location && names.get(location) === 'u_rect') current.push([a, b, c, d]);
      return origUniform4f.call(this, location, a, b, c, d);
    };
  });

  await page.goto('/frame?theme=light&lang=en#overlays', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('html')).toHaveAttribute('data-neoverse-glass-renderer', 'webgl');

  const popover = page.locator('.ui-overlay-panel[popover]').first();
  test.skip((await popover.count()) === 0, 'No native popover fixture on overlays frame');

  const result = await popover.evaluate((panel) => {
    (panel as HTMLElement).showPopover();
    (
      window as Window & { __neoverseGlassRenderer?: { refresh(force?: boolean): void } }
    ).__neoverseGlassRenderer?.refresh(true);
    const rect = panel.getBoundingClientRect();
    const beforeDisplay = getComputedStyle(panel, '::before').display;
    const glRects = (window as Window & { __latestGlRects?: number[][] }).__latestGlRects ?? [];
    const matchedGl = glRects.some(
      (entry) =>
        Math.abs((entry[0] ?? 0) - rect.left) < 1 &&
        Math.abs((entry[1] ?? 0) - rect.top) < 1 &&
        Math.abs((entry[2] ?? 0) - rect.width) < 1 &&
        Math.abs((entry[3] ?? 0) - rect.height) < 1,
    );
    (panel as HTMLElement).hidePopover();
    return { beforeDisplay, matchedGl };
  });

  expect(result.beforeDisplay).toBe('block');
  expect(result.matchedGl).toBe(false);
});
