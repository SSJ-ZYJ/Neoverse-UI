import { expect, test } from '@playwright/test';

const themes = ['light', 'dark'] as const;
const modules = [
  'typography',
  'surface',
  'glass',
  'button',
  'icon-button',
  'card',
  'segmented-control',
  'density',
] as const;

const freezeMotion = `
  *, *::before, *::after {
    animation-delay: 0s !important;
    animation-duration: 0s !important;
    animation-iteration-count: 1 !important;
    caret-color: transparent !important;
    transition-delay: 0s !important;
    transition-duration: 0s !important;
  }
`;

const waitForStableAssets = async (): Promise<void> => {
  await document.fonts?.ready;
  const images = [...document.images];
  await Promise.all(
    images.map(
      (image) =>
        image.complete ||
        new Promise<void>((resolve) => {
          image.addEventListener('load', () => resolve(), { once: true });
          image.addEventListener('error', () => resolve(), { once: true });
        }),
    ),
  );
};

for (const theme of themes) {
  for (const moduleId of modules) {
    test(`${moduleId} / ${theme}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(`/frame?theme=${theme}&lang=en#${moduleId}`, {
        waitUntil: 'domcontentloaded',
      });
      await page.addStyleTag({ content: freezeMotion });
      await page.evaluate(waitForStableAssets);
      await page.evaluate(() => window.scrollTo(0, 0));

      const region = page.locator('[data-design-lab-region="module"]');
      await expect(region).toBeVisible();
      await expect(region).toHaveScreenshot(`${moduleId}-${theme}.png`);
    });
  }
}

for (const theme of themes) {
  test(`button press glow / ${theme}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/frame?theme=${theme}&lang=en#button`, {
      waitUntil: 'domcontentloaded',
    });
    await page.addStyleTag({ content: freezeMotion });
    await page.evaluate(waitForStableAssets);

    const button = page.locator('.ui-button--primary').first();
    await expect(button).toBeVisible();
    const box = await button.boundingBox();
    expect(box).not.toBeNull();
    if (box === null) {
      return;
    }

    await page.mouse.move(box.x + box.width * 0.65, box.y + box.height * 0.5);
    await page.mouse.down();
    try {
      await expect(button).toHaveScreenshot(`button-press-${theme}.png`);
    } finally {
      await page.mouse.up();
    }
  });
}

for (const theme of themes) {
  test(`floating toolbar refraction / ${theme}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/frame?theme=${theme}&lang=zh#composition`, {
      waitUntil: 'domcontentloaded',
    });
    await page.addStyleTag({ content: freezeMotion });
    await page.evaluate(waitForStableAssets);

    const renderer = await page.locator('html').getAttribute('data-neoverse-glass-renderer');
    const surface = page.locator('#composition-floating-toolbar > .material-glass-immersive');
    await expect(surface).toBeVisible();
    const edge = await surface.evaluate((element) => {
      const style = getComputedStyle(element, '::before');
      return {
        display: style.display,
        opacity: Number(style.opacity),
        backgroundImage: style.backgroundImage,
        backgroundClip: getComputedStyle(element).backgroundClip,
      };
    });

    expect(edge.display).toBe(renderer === 'webgl' ? 'none' : 'block');
    expect(edge.opacity).toBeGreaterThan(0);
    expect(edge.backgroundImage).toContain('radial-gradient');
    if (renderer === 'webgl') {
      expect(edge.backgroundClip).toBe('padding-box');
    }
  });
}

const compositionSurfaceContracts = [
  { id: 'composition-control-cluster', selector: ':scope > .material-glass-subtle', glass: true },
  { id: 'composition-project-card', selector: ':scope > .ui-card', glass: false },
  {
    id: 'composition-floating-toolbar',
    selector: ':scope > .material-glass-immersive',
    glass: true,
  },
  {
    id: 'composition-docs-article-header',
    selector: ':scope > .material-glass-elevated',
    glass: true,
  },
  { id: 'composition-docs-navigation-group', selector: ':scope > nav', glass: false },
  { id: 'composition-docs-toolbar', selector: ':scope > .material-glass-subtle', glass: true },
  { id: 'composition-docs-content-surface', selector: ':scope > article', glass: false },
] as const;

for (const theme of themes) {
  test(`composition panels retain visible Glass edge treatment / ${theme}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto(`/frame?theme=${theme}&lang=zh#composition`, {
      waitUntil: 'domcontentloaded',
    });
    await page.addStyleTag({ content: freezeMotion });
    await page.evaluate(waitForStableAssets);
    await page.waitForTimeout(120);

    const panels = await page.evaluate((contracts) => {
      const renderer = document.documentElement.getAttribute('data-neoverse-glass-renderer');
      return contracts.map(({ id, selector, glass }) => {
        const section = document.getElementById(id);
        const element = section?.querySelector<HTMLElement>(selector);
        if (element === null || element === undefined) {
          return { id, missing: true, expectedGlass: glass, glass, renderer };
        }

        const style = getComputedStyle(element);
        const before = getComputedStyle(element, '::before');

        return {
          id,
          missing: false,
          expectedGlass: glass,
          renderer,
          hasGlassMaterial: [...element.classList].some((name) =>
            name.startsWith('material-glass-'),
          ),
          beforeDisplay: before.display,
          backgroundClip: style.backgroundClip,
          edgePass: element.getAttribute('data-neoverse-glass-edge-pass'),
          edgePassActive: element.getAttribute('data-neoverse-glass-edge-pass-active'),
          refractionOpacity: Number(
            style.getPropertyValue('--neoverse-material-edge-refraction-opacity'),
          ),
        };
      });
    }, compositionSurfaceContracts);

    expect(panels).toHaveLength(compositionSurfaceContracts.length);
    for (const panel of panels) {
      expect(panel).toMatchObject({
        missing: false,
        expectedGlass: panel.expectedGlass,
        hasGlassMaterial: panel.expectedGlass,
        edgePass: null,
        edgePassActive: null,
      });
      if (panel.expectedGlass) {
        expect(panel.refractionOpacity).toBeGreaterThan(0);
        if (panel.renderer === 'webgl') {
          expect(panel.beforeDisplay).toBe('none');
          expect(panel.backgroundClip).toBe('padding-box');
        } else {
          expect(panel.beforeDisplay).toBe('block');
        }
      }
    }
  });
}

for (const theme of themes) {
  test(`icon button icons stay geometrically centered / ${theme}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/frame?theme=${theme}&lang=zh#icon-button`, {
      waitUntil: 'domcontentloaded',
    });
    await page.addStyleTag({ content: freezeMotion });
    await page.evaluate(waitForStableAssets);

    const centers = await page.locator('#icon-button .ui-button svg').evaluateAll((icons) =>
      icons.map((icon) => {
        const button = icon.closest('button');
        if (button === null) {
          return null;
        }

        const buttonRect = button.getBoundingClientRect();
        const iconRect = icon.getBoundingClientRect();
        return {
          x: iconRect.left + iconRect.width / 2 - (buttonRect.left + buttonRect.width / 2),
          y: iconRect.top + iconRect.height / 2 - (buttonRect.top + buttonRect.height / 2),
        };
      }),
    );

    expect(centers.length).toBeGreaterThan(0);
    for (const center of centers) {
      expect(center).not.toBeNull();
      if (center !== null) {
        expect(Math.abs(center.x)).toBeLessThan(0.1);
        expect(Math.abs(center.y)).toBeLessThan(0.1);
      }
    }
  });
}

for (const theme of themes) {
  test(`ghost button keeps a visible material boundary / ${theme}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/frame?theme=${theme}&lang=zh#card`, {
      waitUntil: 'domcontentloaded',
    });
    await page.addStyleTag({ content: freezeMotion });
    await page.evaluate(waitForStableAssets);

    const boundary = await page.locator('#card .ui-button--ghost').evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        borderColor: style.borderColor,
        boxShadow: style.boxShadow,
        refractionOpacity: Number(
          style.getPropertyValue('--neoverse-material-edge-refraction-opacity'),
        ),
      };
    });

    expect(boundary.borderColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(boundary.boxShadow).not.toBe('none');
    expect(boundary.refractionOpacity).toBeGreaterThan(0);
  });
}

test.describe('wide Composition WebGL edge', () => {
  test.use({
    viewport: { width: 1775, height: 586 },
    deviceScaleFactor: 1,
    hasTouch: false,
    isMobile: false,
  });

  for (const theme of themes) {
    test(`keeps the Composition edge visible without a hard rim / ${theme}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.goto(`/frame?theme=${theme}&lang=zh#composition`, {
        waitUntil: 'domcontentloaded',
      });
      await page.addStyleTag({ content: freezeMotion });
      await page.evaluate(waitForStableAssets);

      const runtime = await page.locator('html').getAttribute('data-neoverse-glass-renderer');
      test.skip(
        !(await page.evaluate(() => {
          const canvas = document.createElement('canvas');
          return canvas.getContext('webgl2') !== null || canvas.getContext('webgl') !== null;
        })),
        'The visible Composition edge contract is only applicable when WebGL is available.',
      );
      expect(runtime).toBe('webgl');

      const surface = page.locator('#composition-floating-toolbar > .material-glass-immersive');
      await expect(surface).toBeVisible();
      await surface.scrollIntoViewIfNeeded();
      await page.waitForTimeout(120);

      const edge = await surface.evaluate((element) => {
        const style = getComputedStyle(element, '::before');
        return {
          beforeDisplay: style.display,
          edgePass: element.getAttribute('data-neoverse-glass-edge-pass'),
          edgePassActive: element.getAttribute('data-neoverse-glass-edge-pass-active'),
        };
      });
      expect(edge).toEqual({
        beforeDisplay: 'none',
        edgePass: null,
        edgePassActive: null,
      });
      const clip = await surface.evaluate((element) => getComputedStyle(element).backgroundClip);
      expect(clip).toBe('padding-box');
    });
  }
});

test.describe('wide WebGL Glass edge', () => {
  test.use({
    viewport: { width: 1775, height: 586 },
    deviceScaleFactor: 1,
    hasTouch: false,
    isMobile: false,
  });

  for (const theme of themes) {
    test(`keeps the explicit WebGL edge diffuse / ${theme}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.goto(`/frame?theme=${theme}&lang=zh#glass`, {
        waitUntil: 'domcontentloaded',
      });
      await page.addStyleTag({ content: freezeMotion });
      await page.evaluate(waitForStableAssets);

      const runtime = await page.locator('html').getAttribute('data-neoverse-glass-renderer');
      test.skip(
        runtime !== 'webgl',
        'The diffuse WebGL contract is only applicable when WebGL is available.',
      );

      const surface = page.locator('#glass .material-glass-elevated');
      await expect(surface).toBeVisible();
      await surface.scrollIntoViewIfNeeded();
      await page.waitForTimeout(120);

      const clip = await surface.evaluate((element) => getComputedStyle(element).backgroundClip);
      expect(clip).toBe('padding-box');

      const screenshot = await surface.screenshot({ type: 'png' });
      const profile = await page.evaluate(async (encoded) => {
        const image = new Image();
        image.src = `data:image/png;base64,${encoded}`;
        await image.decode();

        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext('2d');
        if (context === null) {
          throw new Error('Canvas 2D context is unavailable for the WebGL edge profile.');
        }
        context.drawImage(image, 0, 0);
        const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
        const luminance = (x: number, y: number): number => {
          const offset = (y * canvas.width + x) * 4;
          const red = pixels[offset] ?? 0;
          const green = pixels[offset + 1] ?? 0;
          const blue = pixels[offset + 2] ?? 0;
          return red * 0.2126 + green * 0.7152 + blue * 0.0722;
        };

        const centerX = Math.floor(canvas.width / 2);
        const centerY = Math.floor(canvas.height / 2);
        const lines = [
          Array.from({ length: 9 }, (_, offset) => luminance(centerX, offset)),
          Array.from({ length: 9 }, (_, offset) => luminance(canvas.width - 1 - offset, centerY)),
          Array.from({ length: 9 }, (_, offset) => luminance(centerX, canvas.height - 1 - offset)),
          Array.from({ length: 9 }, (_, offset) => luminance(offset, centerY)),
        ];
        const innerRimJumps = lines.flatMap((line) =>
          line.slice(1, 5).map((value, index) => Math.abs(value - (line[index + 2] ?? value))),
        );

        return { maxInnerRimLumaJump: Math.max(...innerRimJumps) };
      }, screenshot.toString('base64'));

      expect(profile.maxInnerRimLumaJump).toBeLessThan(30);
    });
  }
});

test('button press surface is transparent on the first frame / dark', async ({ page }) => {
  await page.goto('/frame?theme=dark&lang=en#icon-button', {
    waitUntil: 'domcontentloaded',
  });
  await page.evaluate(waitForStableAssets);

  const button = page.locator('.ui-button--secondary').first();
  await expect(button).toBeVisible();
  const box = await button.boundingBox();
  expect(box).not.toBeNull();
  if (box === null) {
    return;
  }

  await page.mouse.move(0, 0);
  await page.waitForTimeout(250);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(250);
  await page.mouse.down();
  try {
    const press = await button.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        active: element.matches(':active'),
        backgroundColor: style.backgroundColor,
      };
    });

    expect(press.active).toBe(true);
    expect(press.backgroundColor).toBe('rgba(0, 0, 0, 0)');
  } finally {
    await page.mouse.up();
  }
});

test('touch density keeps the compact control geometry and adds a transparent hit area', async ({
  page,
}) => {
  test.skip(
    !(await page.evaluate(() => window.matchMedia('(pointer: coarse)').matches)),
    'The touch contract is only applicable to coarse pointers.',
  );

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/frame?theme=light&lang=en#density', { waitUntil: 'domcontentloaded' });
  await page.addStyleTag({ content: freezeMotion });
  await page.evaluate(waitForStableAssets);

  const touchControls = page.locator('[data-pointer-profile="touch"] [data-density-controls]');
  const buttonContract = await touchControls
    .locator('.ui-button')
    .first()
    .evaluate((element) => {
      const pseudo = getComputedStyle(element, '::before');
      const rect = element.getBoundingClientRect();
      return {
        height: rect.height,
        inset: pseudo.inset,
        pointerEvents: pseudo.pointerEvents,
        hitTarget: document.elementFromPoint(rect.left - 4, rect.top + rect.height / 2) === element,
      };
    });
  const segmentContract = await touchControls
    .locator('.ui-segmented-control__option')
    .first()
    .evaluate((element) => {
      const pseudo = getComputedStyle(element, '::before');
      const rect = element.getBoundingClientRect();
      return {
        inset: pseudo.inset,
        pointerEvents: pseudo.pointerEvents,
        hitTarget: document.elementFromPoint(rect.left - 4, rect.top + rect.height / 2) === element,
      };
    });

  expect(buttonContract).toMatchObject({
    height: 28,
    inset: '-8px',
    pointerEvents: 'auto',
    hitTarget: true,
  });
  expect(segmentContract).toMatchObject({
    inset: '-8px',
    pointerEvents: 'auto',
    hitTarget: true,
  });
});
