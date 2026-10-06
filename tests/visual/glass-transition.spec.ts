import { expect, type Page, test } from '@playwright/test';

type CardFrame = {
  pixels: number[];
  screenshot: Buffer;
  rect: { x: number; y: number; width: number; height: number };
  state: {
    cardFilter: string;
    incoming: boolean;
    incomingOpacity: string | null;
    incomingWillChange: string | null;
    animationFinished: boolean;
    particleCanvas: boolean;
    particleTransitioning: boolean;
    sourceWillChange: string | null;
  };
};

async function captureCardFromViewport(page: Page): Promise<CardFrame> {
  const frame = await page.evaluate(async () => {
    const card = document.querySelector<HTMLElement>('[data-card-default]');
    if (card === null) throw new Error('Card fixture is missing');

    const source = document.querySelector<HTMLElement>('[data-neoverse-motion-incoming]');
    const persistentSource = document.querySelector<HTMLElement>('[data-neoverse-dissolve]');
    const cardRect = card.getBoundingClientRect();
    const animations = source?.getAnimations() ?? [];
    const particleEnter = (animation: Animation) =>
      (animation as Animation & { animationName?: string }).animationName ===
      'neoverse-motion-particle-enter';
    const cardRectValue = {
      x: cardRect.x,
      y: cardRect.y,
      width: cardRect.width,
      height: cardRect.height,
    };

    const particleCanvas = document.querySelector<HTMLElement>('.nv-particle-canvas');

    return {
      rect: cardRectValue,
      state: {
        cardFilter: getComputedStyle(card).backdropFilter,
        incoming: source !== null,
        incomingOpacity: source === null ? null : getComputedStyle(source).opacity,
        incomingWillChange: source === null ? null : getComputedStyle(source).willChange,
        animationFinished:
          source !== null &&
          animations.some(
            (animation) =>
              particleEnter(animation) &&
              animation.playState === 'finished' &&
              getComputedStyle(source).opacity === '1',
          ),
        particleCanvas: particleCanvas !== null,
        particleTransitioning: document.documentElement.hasAttribute(
          'data-neoverse-particle-transitioning',
        ),
        sourceWillChange:
          persistentSource === null ? null : getComputedStyle(persistentSource).willChange,
      },
    };
  });

  // Capture the whole viewport, then crop its saved pixels. Element or clip screenshots can
  // trigger an extra repaint that hides the backdrop-compositing change under test.
  const particleCanvasLocator = page.locator('.nv-particle-canvas');
  const particleCanvas =
    (await particleCanvasLocator.count()) > 0 ? await particleCanvasLocator.elementHandle() : null;
  const previousCanvasStyle =
    particleCanvas === null ? null : await particleCanvas.getAttribute('style');
  await particleCanvas?.evaluate((canvas) => {
    canvas.style.setProperty('visibility', 'hidden', 'important');
    canvas.style.setProperty('opacity', '0', 'important');
  });

  let screenshot: Buffer;
  try {
    screenshot = await page.screenshot({ animations: 'allow', scale: 'css' });
  } finally {
    // The renderer may reuse a detached canvas on the next transition, so restore its full style.
    await particleCanvas?.evaluate((canvas, style) => {
      if (style === null) {
        canvas.removeAttribute('style');
      } else {
        canvas.setAttribute('style', style);
      }
    }, previousCanvasStyle);
  }
  const pixels = await page.evaluate(
    async ({ imageData, rect }) => {
      const image = new Image();
      image.src = `data:image/png;base64,${imageData}`;
      await image.decode();

      const left = Math.max(0, Math.floor(rect.x));
      const top = Math.max(0, Math.floor(rect.y));
      const right = Math.min(image.width, Math.ceil(rect.x + rect.width));
      const bottom = Math.min(image.height, Math.ceil(rect.y + rect.height));
      const width = right - left;
      const height = bottom - top;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (context === null) throw new Error('Could not read the viewport screenshot');
      context.drawImage(image, left, top, width, height, 0, 0, width, height);
      return Array.from(context.getImageData(0, 0, width, height).data);
    },
    { imageData: screenshot.toString('base64'), rect: frame.rect },
  );

  return { ...frame, pixels, screenshot } as CardFrame;
}

function comparePixels(before: number[], after: number[]) {
  if (before.length !== after.length) throw new Error('Card crop dimensions changed');

  let changed = 0;
  let totalDelta = 0;
  let totalChannelDelta = 0;
  for (let index = 0; index < before.length; index += 4) {
    const beforeRed = before[index];
    const beforeGreen = before[index + 1];
    const beforeBlue = before[index + 2];
    const afterRed = after[index];
    const afterGreen = after[index + 1];
    const afterBlue = after[index + 2];
    if (
      beforeRed === undefined ||
      beforeGreen === undefined ||
      beforeBlue === undefined ||
      afterRed === undefined ||
      afterGreen === undefined ||
      afterBlue === undefined
    ) {
      throw new Error('Screenshot pixel buffer ended unexpectedly');
    }

    const redDelta = Math.abs(beforeRed - afterRed);
    const greenDelta = Math.abs(beforeGreen - afterGreen);
    const blueDelta = Math.abs(beforeBlue - afterBlue);
    const maxDelta = Math.max(redDelta, greenDelta, blueDelta);
    if (maxDelta > 2) changed += 1;
    totalDelta += redDelta + greenDelta + blueDelta;
    totalChannelDelta += 3;
  }

  const totalPixels = before.length / 4;
  return {
    changedRatio: changed / totalPixels,
    meanChannelDelta: totalDelta / totalChannelDelta,
  };
}

test('particle transition keeps the card Glass color stable through cleanup', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'desktop',
    'The transition crop uses the desktop card fixture.',
  );

  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'no-preference' });
  await page.goto('/?theme=light&lang=en', { waitUntil: 'domcontentloaded' });
  const webgl2Available = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    return canvas.getContext('webgl2') !== null;
  });
  test.skip(!webgl2Available, 'This assertion requires the WebGL2 particle renderer.');

  /* This test isolates compositing stability, not choreography speed. Give the
     finished incoming card a wide observation window before particle cleanup
     so slow software renderers cannot race the transient state assertion. */
  await page.evaluate(() => {
    document.documentElement.style.setProperty('--neoverse-motion-particle-duration', '2400ms');
  });
  const cardNavigation = page.locator('a[href="#card"]');
  await expect(cardNavigation).toBeVisible();
  await cardNavigation.click();

  await page.waitForFunction(() => {
    const incoming = document.querySelector<HTMLElement>('[data-neoverse-motion-incoming]');
    const enterAnimation = incoming
      ?.getAnimations()
      .find(
        (animation) =>
          (animation as Animation & { animationName?: string }).animationName ===
          'neoverse-motion-particle-enter',
      );
    return (
      document.documentElement.hasAttribute('data-neoverse-particle-transitioning') &&
      document.querySelector('.nv-particle-canvas') !== null &&
      enterAnimation?.playState === 'finished' &&
      incoming !== null &&
      getComputedStyle(incoming).opacity === '1'
    );
  });

  const before = await captureCardFromViewport(page);
  expect(before.state.particleCanvas, 'navigation should use its WebGL particle overlay').toBe(
    true,
  );
  expect(before.state.particleTransitioning).toBe(true);
  expect(before.state.incoming).toBe(true);
  expect(before.state.incomingOpacity).toBe('1');
  expect(before.state.animationFinished).toBe(true);
  expect(before.state.cardFilter).not.toBe('none');

  await page.waitForFunction(
    () =>
      !document.documentElement.hasAttribute('data-neoverse-particle-transitioning') &&
      document.querySelector('[data-neoverse-motion-incoming]') === null &&
      document.querySelector('.nv-particle-canvas') === null,
  );
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())));

  const after = await captureCardFromViewport(page);
  expect(after.state.particleTransitioning).toBe(false);
  expect(after.state.incoming).toBe(false);

  await testInfo.attach('card-before-cleanup-viewport.png', {
    body: before.screenshot,
    contentType: 'image/png',
  });
  await testInfo.attach('card-after-cleanup-viewport.png', {
    body: after.screenshot,
    contentType: 'image/png',
  });

  const diff = comparePixels(before.pixels, after.pixels);
  expect(
    diff.changedRatio,
    `card pixels changed ${(diff.changedRatio * 100).toFixed(2)}% (mean channel delta ${diff.meanChannelDelta.toFixed(2)})`,
  ).toBeLessThanOrEqual(0.01);

  expect(
    before.state.incomingWillChange,
    'the opacity entrance must retain the same compositing boundary after its animation finishes',
  ).toBe('opacity');
  expect(
    after.state.sourceWillChange,
    'the dissolve source must keep that boundary after the particle state is removed',
  ).toBe('opacity');
});
