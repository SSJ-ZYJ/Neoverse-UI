import { expect, test } from '@playwright/test';

test('directional Glass scrolling never rebuilds background paint textures', async ({ page }) => {
  await page.addInitScript(() => {
    const scope = window as unknown as Window & { glassBackgroundPaints: number };
    scope.glassBackgroundPaints = 0;
    const source = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
    if (!source?.set) throw new Error('Image source setter is missing');
    const setSource = source.set;
    Object.defineProperty(HTMLImageElement.prototype, 'src', {
      ...source,
      set(value: string) {
        if (value.startsWith('data:image/svg+xml')) scope.glassBackgroundPaints++;
        setSource.call(this, value);
      },
    });
  });
  await page.goto('/frame?glass=webgl&theme=light&lang=en#materials');
  for (const fraction of [0, 0.25, 0.5, 0.75, 1, 0]) {
    await page.evaluate(
      (fraction) =>
        window.scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * fraction),
      fraction,
    );
    await page.waitForTimeout(150);
  }
  const result = await page.evaluate(async () => {
    const scope = window as unknown as Window & { glassBackgroundPaints: number };
    const initial = scope.glassBackgroundPaints;
    scope.glassBackgroundPaints = 0;
    const max = document.documentElement.scrollHeight - innerHeight;
    for (let i = 0; i < 32; i++) {
      await new Promise(requestAnimationFrame);
      window.scrollTo(0, max * (i < 16 ? i / 15 : (31 - i) / 15));
    }
    await new Promise(requestAnimationFrame);
    return { initial, repaints: scope.glassBackgroundPaints };
  });
  expect(result.initial, 'the directional edge does not rasterize background textures').toBe(0);
  expect(result.repaints, 'scroll positions change geometry without sampling images').toBe(0);
});

test('scrolling preserves Glass filters without rebuilding maps or switching material planes', async ({
  page,
}) => {
  await page.goto('/frame?glass=webgl&theme=dark&lang=zh#materials');
  await page.waitForTimeout(600);
  const result = await page.evaluate(async () => {
    let definitions = 0;
    let materialChanges = 0;
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of [...record.addedNodes, ...record.removedNodes]) {
          if (node.nodeName === 'filter') definitions++;
        }
        if (
          record.type === 'attributes' &&
          record.target instanceof HTMLElement &&
          record.target.matches(
            '.material-glass-subtle, .material-glass-elevated, .material-glass-immersive',
          )
        ) {
          materialChanges++;
        }
      }
    });
    observer.observe(document, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['style', 'data-neoverse-glass-refraction'],
    });
    const candidates = [document.scrollingElement, ...document.querySelectorAll<HTMLElement>('*')];
    const scroller =
      candidates
        .filter(
          (element): element is HTMLElement =>
            element instanceof HTMLElement &&
            element.scrollHeight > element.clientHeight + 200 &&
            ['auto', 'scroll'].includes(getComputedStyle(element).overflowY),
        )
        .sort((a, b) => b.clientHeight - a.clientHeight)[0] ?? document.scrollingElement;
    if (scroller === null) throw new Error('Scrollable materials fixture is missing');
    const range = scroller.scrollHeight - scroller.clientHeight;
    for (const fraction of [0, 0.5, 1, 0.5, 0]) {
      scroller.scrollTop = range * fraction;
      await new Promise<void>((resolve) => setTimeout(resolve, 100));
    }
    observer.disconnect();
    return { range, definitions, materialChanges };
  });
  expect(result.range).toBeGreaterThan(200);
  expect(result.definitions, 'translation must not invalidate rounded geometry maps').toBe(0);
  expect(result.materialChanges, 'scroll must not switch the backdrop filter pipeline').toBe(0);
});

test('cards and buttons keep canonical CSS frost without extra sampling fields', async ({
  page,
}) => {
  await page.goto('/frame?glass=webgl&theme=dark&lang=en#materials');
  await page.locator('[data-refraction-control="left"]').scrollIntoViewIfNeeded();
  await expect(page.locator('[data-neoverse-glass-refraction-edge]')).toHaveCount(0);
  await expect
    .poll(() =>
      page.locator('[data-refraction-control="left"]').evaluate((element) => {
        const style = getComputedStyle(element);
        const tierBlur = Number.parseFloat(style.getPropertyValue('--neoverse-material-blur'));
        const controlScale = Number.parseFloat(
          style.getPropertyValue('--neoverse-control-button-blur-scale'),
        );
        const actualBlur = Number.parseFloat(
          style.backdropFilter.match(/blur\(([-\d.]+)px\)/)?.[1] ?? 'NaN',
        );
        return Number.isFinite(actualBlur) && Math.abs(actualBlur - tierBlur * controlScale) < 0.01;
      }),
    )
    .toBe(true);
  const cards = await page.locator('[data-glass-variant]').evaluateAll((elements) =>
    elements.map((element) => ({
      filter: getComputedStyle(element).backdropFilter,
      native: element.hasAttribute('data-neoverse-glass-refraction'),
    })),
  );
  for (const card of cards) {
    expect(card.filter).toMatch(/^blur\((12|18|24)px\) saturate\(/);
    expect(card.native, 'independent cards retain native CSS sampling').toBe(false);
  }
});

test('scrolling a card across the viewport edge preserves its visible frost pixels', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      options?: unknown,
    ) {
      if (type === 'webgl' || type === 'webgl2') return null;
      return Reflect.apply(original, this, [type, options]);
    } as typeof original;
  });
  await page.goto('/frame?glass=webgl&theme=dark&lang=en#materials');
  const card = page.locator('[data-glass-variant="elevated"]');
  await card.evaluate((element) => {
    const stage = document.createElement('div');
    stage.style.cssText =
      'position:relative;height:2200px;background:repeating-linear-gradient(90deg,#f5b36b 0 64px,#315387 64px 128px)';
    (element as HTMLElement).style.cssText =
      'position:absolute;left:40px;top:300px;width:280px;height:160px;min-height:0';
    element.replaceChildren();
    stage.append(element);
    document.querySelector<HTMLElement>('#app')?.style.setProperty('display', 'none');
    document.body.append(stage);
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(300);
  const beforeBounds = await card.boundingBox();
  // Full viewport captures preserve the scroll/compositing path; element
  // screenshots can scroll the card back into view and conceal the regression.
  const before = await page.screenshot();
  await page.evaluate(() => window.scrollTo(0, 340));
  await page.waitForTimeout(200);
  const afterBounds = await card.boundingBox();
  const after = await page.screenshot();
  if (beforeBounds === null || afterBounds === null) throw new Error('Card bounds are missing');
  expect(beforeBounds.y).toBe(300);
  expect(afterBounds.y).toBe(-40);
  const differences = await page.evaluate(
    async ({ before, after, beforeBounds, afterBounds }) => {
      const read = async (source: string) => {
        const image = await createImageBitmap(
          await (await fetch(`data:image/png;base64,${source}`)).blob(),
        );
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext('2d');
        if (context === null) throw new Error('Cannot inspect frost pixels');
        context.drawImage(image, 0, 0);
        image.close();
        return context.getImageData(0, 0, canvas.width, canvas.height);
      };
      const a = await read(before);
      const b = await read(after);
      let centre = 0;
      let centreCount = 0;
      let edge = 0;
      let edgeCount = 0;
      for (let y = 70; y < 150; y++) {
        for (let x = 4; x < 276; x++) {
          const offsetA =
            (Math.round(beforeBounds.y + y) * a.width + Math.round(beforeBounds.x + x)) * 4;
          const offsetB =
            (Math.round(afterBounds.y + y) * b.width + Math.round(afterBounds.x + x)) * 4;
          const difference =
            (Math.abs((a.data[offsetA] ?? 0) - (b.data[offsetB] ?? 0)) +
              Math.abs((a.data[offsetA + 1] ?? 0) - (b.data[offsetB + 1] ?? 0)) +
              Math.abs((a.data[offsetA + 2] ?? 0) - (b.data[offsetB + 2] ?? 0))) /
            3;
          if (x < 12 || x > 268) {
            edge += difference;
            edgeCount++;
          } else {
            centre += difference;
            centreCount++;
          }
        }
      }
      return { centre: centre / centreCount, edge: edge / edgeCount };
    },
    {
      before: before.toString('base64'),
      after: after.toString('base64'),
      beforeBounds,
      afterBounds,
    },
  );
  expect(differences.centre, 'viewport clipping must not change the frost plane').toBeLessThan(1);
  expect(differences.edge, 'viewport clipping must not shift the visible bevel').toBeLessThan(1);
});
