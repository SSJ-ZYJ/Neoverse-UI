import { expect, test } from '@playwright/test';
import { measureContrast } from '../../support/contrast';
import { expectNoPageOverflow, themes } from '../../support/e2e';

test.describe('materials', { tag: '@chromium-materials' }, () => {
  for (const theme of themes) {
    test(`Aurora Glass previews render in the ${theme} theme`, async ({ page }) => {
      await page.goto(`/frame?theme=${theme}&lang=en#materials`, { waitUntil: 'domcontentloaded' });

      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      const stages = page.locator('[data-glass-preview-stage]');
      await expect(stages.first()).toBeVisible();
      const count = await stages.count();
      expect(count).toBeGreaterThan(0);
      for (let index = 0; index < count; index += 1) {
        await expect(stages.nth(index)).toBeVisible();
      }
      await expect(page.locator('[data-glass-variant]').first()).toBeVisible();
      await expectNoPageOverflow(page);
    });

    test(`the inset preset separates from the canvas without a border in ${theme}`, async ({
      page,
    }) => {
      await page.goto(`/frame?theme=${theme}&lang=en#materials-surface`, {
        waitUntil: 'domcontentloaded',
      });
      const inset = page.locator('[data-surface-preset="inset"]');
      await expect(inset).toBeVisible();
      await expect.soft(inset).toHaveCSS('border-width', '0px', { timeout: 500 });
      const toneDifference = await inset.evaluate((element) => {
        const style = getComputedStyle(element);
        const context = new OffscreenCanvas(1, 1).getContext('2d');
        if (!context) throw new Error('Cannot resolve the preset colors without a canvas');
        const luminance = () => {
          const [red = 0, green = 0, blue = 0] = context.getImageData(0, 0, 1, 1).data;
          return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
        };
        context.fillStyle = style.getPropertyValue('--neoverse-color-surface-canvas').trim();
        context.fillRect(0, 0, 1, 1);
        const canvasTone = luminance();
        context.fillStyle = style.backgroundColor;
        context.fillRect(0, 0, 1, 1);
        return luminance() - canvasTone;
      });
      const separation = theme === 'light' ? -toneDifference : toneDifference;
      expect(separation).toBeGreaterThanOrEqual(9);
      expect(separation).toBeLessThanOrEqual(17);
      await expect(inset).toHaveCSS('backdrop-filter', /blur\(12px\)/);

      for (const preset of ['none', 'solid', 'subtle', 'elevated']) {
        await expect(page.locator(`[data-surface-preset="${preset}"]`)).toHaveCSS(
          'border-width',
          '0px',
        );
      }
      if (theme === 'light') {
        for (const preset of ['glass-subtle', 'glass-elevated', 'glass-immersive']) {
          await expect(page.locator(`[data-surface-preset="${preset}"]`)).toHaveCSS(
            'border-color',
            'rgba(0, 0, 0, 0)',
          );
        }
      }
    });

    test(`a neutral notice separates from a solid ${theme} canvas`, async ({ page }) => {
      await page.goto(`/?theme=${theme}&lang=en#status-feedback-notice`, {
        waitUntil: 'domcontentloaded',
      });
      const notice = page.locator('[data-design-lab-region="specimen"] .ui-notice');
      await expect(notice).toBeVisible();
      const difference = await notice.evaluate((element) => {
        const style = getComputedStyle(element);
        const context = new OffscreenCanvas(1, 1).getContext('2d');
        if (!context) throw new Error('A 2D canvas context is required');
        const compositeTone = (color: string) => {
          context.fillStyle = color;
          context.fillRect(0, 0, 1, 1);
          const [red = 0, green = 0, blue = 0] = context.getImageData(0, 0, 1, 1).data;
          return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
        };
        const canvasTone = compositeTone(style.getPropertyValue('--neoverse-color-surface-canvas'));
        return compositeTone(style.backgroundColor) - canvasTone;
      });
      expect(theme === 'light' ? -difference : difference).toBeGreaterThanOrEqual(8);
      await expect(notice).toHaveCSS('backdrop-filter', /blur\(12px\)/);
      await expect(notice).toHaveCSS('border-top-width', '0px');
    });
  }

  for (const theme of themes) {
    test(`replayed badges keep their blur and inset edge in ${theme}`, async ({ page }) => {
      await page.goto(`/frame?theme=${theme}&lang=en#motion`, { waitUntil: 'domcontentloaded' });
      const replay = page.locator('[data-motion-presence-replay]');
      const badge = page.locator('[data-motion-presence-group-item]').first();
      await replay.click();

      await expect(badge).toHaveCSS('backdrop-filter', /^blur\(12px\)/);
      const shadows = await badge.evaluate((element) =>
        getComputedStyle(element)
          .boxShadow.replace(/\([^()]*\)/g, '')
          .split(','),
      );
      for (const shadow of shadows) expect(shadow).toMatch(/\binset\b/);
    });

    test(`a glass button deepens its tint without changing depth in ${theme}`, async ({
      page,
    }, testInfo) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(`/frame?theme=${theme}&lang=en#controls-button`, {
        waitUntil: 'domcontentloaded',
      });
      const primary = page
        .locator('[data-qa-stage="neutral"]')
        .locator('[data-contract-button="primary"]');
      await expect(primary).toBeVisible();
      await primary.scrollIntoViewIfNeeded();
      const readPaint = () =>
        primary.evaluate((element) => {
          const style = getComputedStyle(element);
          return {
            feedback: style.backgroundImage,
            fill: style.backgroundColor,
            clip: style.backgroundClip,
            blur: style.backdropFilter,
            shadow: style.boxShadow,
          };
        });
      const { feedback: rest, blur, shadow, fill, clip } = await readPaint();
      expect(blur).toContain('blur(');
      expect(rest).toMatch(/^linear-gradient\(/);
      expect(clip).toBe('border-box');

      if (!testInfo.project.use.hasTouch) await primary.hover();
      const { feedback: ready } = await readPaint();
      if (!testInfo.project.use.hasTouch) expect(ready).not.toBe(rest);
      await expect(primary).toHaveCSS('box-shadow', shadow);

      await primary.focus();
      await page.keyboard.down('Space');
      try {
        await expect(primary).not.toHaveCSS('background-image', ready);
        await expect(primary).toHaveCSS('background-color', fill);
        await expect(primary).toHaveCSS('background-clip', clip);
        await expect(primary).toHaveCSS('backdrop-filter', blur);
        await expect(primary).toHaveCSS('box-shadow', shadow);
        await expect(primary).toHaveCSS('border-top-color', 'rgba(0, 0, 0, 0)');
      } finally {
        await page.keyboard.up('Space');
      }
      await expect(primary).toHaveCSS('background-image', ready);
    });

    test(`primary button keyboard focus keeps the primary ring in ${theme}`, async ({ page }) => {
      await page.goto(`/frame?theme=${theme}&lang=en#controls-button`, {
        waitUntil: 'domcontentloaded',
      });
      const primary = page
        .locator('[data-qa-stage="neutral"]')
        .locator('[data-contract-button="primary"]');
      await expect(primary).toBeVisible();
      await primary.focus();

      const { outlineColor, expected } = await primary.evaluate((element) => {
        const probe = document.createElement('span');
        probe.style.color = 'var(--neoverse-color-focus-ring)';
        document.body.append(probe);
        const expected = getComputedStyle(probe).color;
        probe.remove();
        return { outlineColor: getComputedStyle(element).outlineColor, expected };
      });
      expect(outlineColor).toBe(expected);
    });

    test(`quiet buttons reveal a deeper tint while held without acquiring a glass plate in ${theme}`, async ({
      page,
    }, testInfo) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(`/frame?theme=${theme}&lang=en#controls-button`, {
        waitUntil: 'domcontentloaded',
      });
      for (const button of [
        page.locator('[data-qa-stage="neutral"] [data-contract-button="ghost"]'),
        page.locator('[data-qa-stage="reduced"] [data-contract-button="ghost"]'),
        page.locator('[data-contract-button="unplated"]'),
      ]) {
        await page.mouse.move(0, 0);
        await expect(button).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
        if (!testInfo.project.use.hasTouch) {
          await button.hover();
          await expect(button).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
        }
        const ready = await button.evaluate((element) => getComputedStyle(element).backgroundColor);
        await button.focus();
        await page.keyboard.down('Space');
        try {
          await expect(button).not.toHaveCSS('background-color', ready);
          await expect(button).toHaveCSS('backdrop-filter', 'none');
          await expect(button).toHaveCSS('box-shadow', 'none');
        } finally {
          await page.keyboard.up('Space');
        }
        await expect(button).toHaveCSS('background-color', ready);
      }
    });
  }

  test('Aurora Glass tiers wire their own blur, saturation and tint', async ({ page }) => {
    const expected = [
      { surface: 'glass-subtle', blur: 12, saturation: 1.32 },
      { surface: 'glass-elevated', blur: 18, saturation: 1.45 },
      { surface: 'glass-immersive', blur: 24, saturation: 1.65 },
    ] as const;

    for (const theme of themes) {
      await page.goto(`/frame?theme=${theme}&lang=en#materials`, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('[data-surface="glass-subtle"]').first()).toBeVisible();

      const tiers = await page.evaluate(
        (surfaces) => {
          const read = (surface: string) => {
            const element = document.querySelector(`[data-surface="${surface}"]`);
            if (element === null) return null;
            const style = getComputedStyle(element);
            const plate = getComputedStyle(element, '::before');
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            if (context === null) throw new Error('A 2D canvas context is required');
            context.fillStyle = style.backgroundColor;
            context.fillRect(0, 0, 1, 1);
            return {
              backdrop: style.backdropFilter,
              alpha: context.getImageData(0, 0, 1, 1).data[3] ?? 0,
              plateOpacity: Number.parseFloat(plate.opacity),
            };
          };
          return surfaces.map((surface) => read(surface));
        },
        expected.map((tier) => tier.surface),
      );

      for (const [index, tier] of expected.entries()) {
        const measured = tiers[index];
        expect(measured, `${tier.surface} must render in the ${theme} theme`).not.toBeNull();
        if (measured === null || measured === undefined) continue;
        expect(measured.backdrop).toContain(`blur(${tier.blur}px)`);
        expect(measured.backdrop).toContain(`saturate(${tier.saturation})`);
        expect(measured.alpha).toBeGreaterThan(0);
        if (index > 0) {
          const previous = tiers[index - 1];
          expect(measured.alpha).toBeGreaterThan(previous?.alpha ?? 0);
          expect(measured.plateOpacity).toBeGreaterThan(previous?.plateOpacity ?? 0);
        }
      }
    }
  });
});

test('the React fixture wires the same three Glass tiers', { tag: '@chromium-materials' }, async ({
  page,
}) => {
  await page.goto('/react-fixture?theme=light&lang=en&contract-fixtures=1', {
    waitUntil: 'domcontentloaded',
  });
  await expect(page.locator('[data-material-tier-fixtures]')).toBeVisible();

  const expected = [
    { tier: 'glass-subtle', blur: 12, saturation: 1.32 },
    { tier: 'glass-elevated', blur: 18, saturation: 1.45 },
    { tier: 'glass-immersive', blur: 24, saturation: 1.65 },
  ] as const;
  for (const tier of expected) {
    const card = page.locator(`[data-tier-card="${tier.tier}"]`);
    await expect(card).toBeVisible();
    const backdrop = await card.evaluate((element) => getComputedStyle(element).backdropFilter);
    expect(backdrop).toContain(`blur(${tier.blur}px)`);
    expect(backdrop).toContain(`saturate(${tier.saturation})`);
    await expect(card).toHaveCSS('background-clip', 'border-box');
    const action = page.locator(`[data-tier-action="${tier.tier}"]`);
    await expect(action).toHaveCSS('background-image', /^linear-gradient\(/);
    await expect(action).toHaveCSS('background-clip', 'border-box');
  }
});

test('the browser transparency preference removes blur but preserves only opted-in edge strokes', {
  tag: '@chromium-materials',
}, async ({ page }) => {
  await page.goto('/frame?theme=dark&lang=en#materials', { waitUntil: 'domcontentloaded' });
  const surface = page.locator('[data-surface="glass-elevated"]').first();
  await expect(surface).toBeVisible();
  expect(
    await surface.evaluate(
      (element) => element.closest('.playground-reduced-transparency-preview') === null,
    ),
  ).toBe(true);
  await expect(surface).toHaveCSS('backdrop-filter', /blur\(18px\)/);
  const sampledBackground = await surface.evaluate(
    (element) => getComputedStyle(element).backgroundColor,
  );

  const client = await page.context().newCDPSession(page);
  await client.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }],
  });
  await expect
    .poll(() => page.evaluate(() => matchMedia('(prefers-reduced-transparency: reduce)').matches))
    .toBe(true);
  await expect(page.locator('[data-neoverse-glass-renderer-canvas]')).toHaveCount(0);
  await expect(surface).toHaveCSS('backdrop-filter', 'none');
  await expect(surface).not.toHaveCSS('background-color', sampledBackground);

  // A continuous 1px inset stroke differs from the directional fallback highlights.
  const paintedStroke = /\b0px 0px 0px 1px inset\b/;
  await expect(surface).not.toHaveCSS('box-shadow', paintedStroke);
  await surface.evaluate((element) => element.setAttribute('data-neoverse-glass-edge-stroke', ''));
  await expect(surface).toHaveCSS('box-shadow', paintedStroke);
  await expect(surface).toHaveCSS('backdrop-filter', 'none');
  await expectNoPageOverflow(page);
});

test('the selected navigation row keeps readable ink on its Solid plate', async ({
  page,
}, testInfo) => {
  const mobile = testInfo.project.name === 'mobile';
  for (const theme of themes) {
    await page.goto(`/?theme=${theme}&lang=zh&fps=0&material=solid#controls-button`, {
      waitUntil: 'domcontentloaded',
    });
    if (mobile) await page.locator('[data-playground-nav-trigger]').click();
    const row = page.locator('.playground-explorer__leaf[aria-current]');
    await expect(row).toBeVisible();
    const [sample] = await page.evaluate(measureContrast, [
      '.playground-explorer__leaf[aria-current]',
    ]);
    expect(sample?.ratio, `${theme} navigation selection contrast`).toBeGreaterThanOrEqual(4.5);
    const secondary = page.locator(
      '.playground-explorer__leaf[aria-current] .playground-catalogue-label__secondary',
    );
    await expect(secondary).toHaveCSS('color', /rgb\(/);
  }
});

test('a pure Solid page keeps automatic surfaces opaque and respects explicit Glass', async ({
  page,
}) => {
  await page.goto('/frame?theme=light&lang=en&fps=0&material=solid#forms-textarea', {
    waitUntil: 'domcontentloaded',
  });
  const root = page.locator('html');
  await expect(root).toHaveAttribute('data-neoverse-material', 'solid');
  await expect(page.locator('[data-neoverse-glass-renderer-canvas]')).toHaveCount(0);
  await expect(page.locator('#forms-notes')).toHaveCSS('backdrop-filter', 'none');

  await page.evaluate(() => {
    const preset = document.createElement('div');
    preset.id = 'explicit-glass-probe';
    preset.className = 'ui-surface material-glass-elevated';
    preset.dataset.surface = 'glass-elevated';
    preset.style.cssText = 'position:fixed;top:16px;left:16px;width:180px;height:120px';
    document.body.append(preset);
  });
  await expect(page.locator('#explicit-glass-probe')).toHaveCSS('backdrop-filter', /blur\(18px\)/);
});

test('Vue resolves automatic surface roles without changing theme or explicit presets', async ({
  page,
}) => {
  await page.goto('/frame?theme=light&lang=en#materials', { waitUntil: 'domcontentloaded' });
  const sample = (role: string) => page.locator(`[data-contract-material="${role}"]`);
  await sample('card').scrollIntoViewIfNeeded();
  await expect(sample('card')).toHaveCSS('backdrop-filter', /blur\(18px\)/);
  await expect(sample('button')).toHaveCSS('backdrop-filter', /blur\(12px\)/);
  await expect(sample('group')).toHaveCSS('backdrop-filter', /blur\(12px\)/);
  await expect(sample('borrow')).toHaveCSS('backdrop-filter', 'none');
  const root = page.locator('html');
  await root.evaluate((element) => element.setAttribute('data-neoverse-material', 'solid'));
  await expect(root).toHaveAttribute('data-theme', 'light');
  const fills: string[] = [];
  for (const role of ['card', 'group', 'button']) {
    await expect(sample(role)).toHaveCSS('backdrop-filter', 'none');
    fills.push(await sample(role).evaluate((element) => getComputedStyle(element).backgroundColor));
  }
  expect(new Set(fills).size).toBe(fills.length);
  await expect(sample('card')).not.toHaveCSS('box-shadow', 'none');
  await expect(sample('group')).toHaveCSS('box-shadow', 'none');
  await sample('group').evaluate((el) => el.setAttribute('data-neoverse-material', 'unknown'));
  await expect(sample('group')).toHaveCSS('backdrop-filter', 'none');
  await sample('group').evaluate((el) => el.setAttribute('data-neoverse-material', 'glass'));
  await expect(sample('group')).toHaveCSS('backdrop-filter', /blur\(12px\)/);
  await sample('group').evaluate((el) => el.removeAttribute('data-neoverse-material'));
  expect(await sample('card').evaluate((el) => getComputedStyle(el, '::before').content)).toBe(
    'none',
  );
  await expect(sample('borrow')).toHaveCSS('backdrop-filter', /blur\(12px\)/);
  await expect(sample('nested-glass')).toHaveCSS('backdrop-filter', /blur\(18px\)/);
  await expect(sample('explicit-glass')).toHaveCSS('backdrop-filter', /blur\(24px\)/);
  await expect(sample('none')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(sample('none')).toHaveCSS('backdrop-filter', 'none');

  await root.evaluate((el) => el.removeAttribute('data-neoverse-material'));
  await expect(sample('card')).toHaveCSS('backdrop-filter', /blur\(18px\)/);
  await expect(sample('borrow')).toHaveCSS('backdrop-filter', 'none');
  await expect(sample('solid')).toHaveCSS('backdrop-filter', 'none');
});

test('React uses the same Solid and explicit Glass material boundaries', async ({ page }) => {
  await page.goto('/react-fixture?theme=dark&lang=en', { waitUntil: 'domcontentloaded' });
  const sample = (role: string) => page.locator(`[data-contract-material="${role}"]`);
  for (const role of ['card', 'button', 'group']) {
    await expect(sample(role)).toHaveCSS('backdrop-filter', 'none');
    await expect(sample(role)).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  }
  await expect(sample('nested-glass')).toHaveCSS('backdrop-filter', /blur\(18px\)/);
  await expect(sample('explicit-glass')).toHaveCSS('backdrop-filter', /blur\(24px\)/);
  await expect(sample('none')).toHaveCSS('backdrop-filter', 'none');
  await expect(sample('none')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
});

test('automatic and explicit Glass tabs keep distinct material behavior in both adapters', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const [url, automatic, explicit] of [
    [
      '/frame?theme=light&lang=en#materials-core',
      '[data-core-material="solid"] [data-core-role="tabs"]',
      '[data-core-material="solid"] [data-core-role="explicit-glass-tabs"]',
    ],
    [
      '/react-fixture?theme=light&lang=en',
      '[data-react-adapter="UiTabs"]',
      '[data-tabs-sample="glass"]',
    ],
  ] as const) {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    const picked = page.locator(automatic).getByRole('tablist');
    const explicitGlass = page.locator(explicit).getByRole('tablist');
    await page.locator('html').evaluate((element) => {
      element.setAttribute('data-neoverse-material', 'solid');
    });
    await expect(picked).toHaveCSS('backdrop-filter', 'none');
    await expect(picked.locator('.ui-tabs__indicator')).toHaveCSS('backdrop-filter', 'none');
    await expect(explicitGlass).toHaveCSS('backdrop-filter', /blur\(/);
    const first = picked.getByRole('tab').first();
    await first.press('ArrowRight');
    await expect(first).toHaveAttribute('aria-selected', 'false');
    await expect(picked.getByRole('tab', { selected: true })).toBeFocused();
  }
});

test('status and loading planes in Solid stay legible without optical depth', async ({ page }) => {
  for (const theme of themes) {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/react-fixture?theme=${theme}&lang=en&material=solid&contract-fixtures=1`, {
      waitUntil: 'domcontentloaded',
    });
    const selector = (name: string) => `[data-react-adapter="Ui${name}"]`;
    for (const name of ['Avatar', 'Badge', 'Skeleton', 'StatCard']) {
      const plate = page.locator(selector(name));
      await expect(plate).toHaveCSS('backdrop-filter', 'none');
      await expect(plate).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    }
    const [badge] = await page.evaluate(measureContrast, [selector('Badge')]);
    expect(badge?.ratio).toBeGreaterThanOrEqual(4.5);
    await expect(page.locator(selector('StatCard'))).not.toHaveCSS('box-shadow', 'none');
    await expect(page.locator(selector('Badge'))).toHaveCSS('box-shadow', 'none');
    const marks = await page
      .locator('[data-contract-form] .ui-choice__native:checked + .ui-choice__control')
      .evaluateAll((elements) => {
        const canvas = document.createElement('canvas').getContext('2d', {
          willReadFrequently: true,
        });
        if (!canvas) throw new Error('Cannot resolve the selection paint without a canvas');
        const alpha = (value: string) => {
          canvas.clearRect(0, 0, 1, 1);
          canvas.fillStyle = value;
          canvas.fillRect(0, 0, 1, 1);
          return canvas.getImageData(0, 0, 1, 1).data[3];
        };
        return elements.map((element) => ({
          fill: getComputedStyle(element, '::after').backgroundColor,
          rest: getComputedStyle(element).backgroundColor,
          fillAlpha: alpha(getComputedStyle(element, '::after').backgroundColor),
        }));
      });
    expect(marks.length).toBeGreaterThanOrEqual(3);
    for (const mark of marks) {
      expect(mark.fillAlpha).toBe(255);
      expect(mark.fill).not.toBe(mark.rest);
    }
  }
});

test('Prose uses Solid reading planes and retains native disclosure behavior', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/frame?theme=light&lang=en#foundation-prose', {
    waitUntil: 'domcontentloaded',
  });
  const prose = page.locator('[data-foundation-prose]');
  const quote = prose.locator('blockquote');
  await expect(quote).toHaveCSS('backdrop-filter', /blur\(/);
  await prose.evaluate((element) => element.setAttribute('data-neoverse-material', 'solid'));
  for (const tag of ['blockquote', 'pre', 'table', 'details']) {
    await expect(prose.locator(tag)).toHaveCSS('backdrop-filter', 'none');
  }
  const table = prose.getByRole('table');
  const body = table.getByRole('cell');
  const bodyFill = await body.evaluate((element) => getComputedStyle(element).backgroundColor);
  await expect(table.getByRole('columnheader')).not.toHaveCSS('background-color', bodyFill);
  await prose.locator('summary').press('Enter');
  await expect(prose.locator('kbd').first()).toBeVisible();
  await quote.evaluate((element) => element.setAttribute('data-neoverse-material', 'glass'));
  await expect(quote).toHaveCSS('backdrop-filter', /blur\(/);
});

test('Solid tooltip paints its body and pointer with the same color', async ({ page }) => {
  await page.goto('/react-fixture?theme=dark&lang=en&material=solid', {
    waitUntil: 'domcontentloaded',
  });
  const tooltip = page.locator('[data-react-adapter="UiTooltipSurface"]');
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toHaveCSS('backdrop-filter', 'none');
  const pointer = await tooltip.evaluate((element) => {
    const body = getComputedStyle(element);
    const arrow = getComputedStyle(element, '::after');
    return {
      body: body.backgroundColor,
      arrow: arrow.backgroundColor,
      height: Number.parseFloat(arrow.height),
      filter: arrow.backdropFilter,
    };
  });
  expect(pointer.height).toBeGreaterThan(0);
  expect(pointer.body).not.toBe('rgba(0, 0, 0, 0)');
  expect(pointer.arrow).toBe(pointer.body);
  expect(pointer.filter).toBe('none');
});

test('Solid form selection remains visible in forced colors', {
  tag: '@chromium-materials',
}, async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
  await page.goto('/react-fixture?theme=light&lang=en&material=solid&contract-fixtures=1', {
    waitUntil: 'domcontentloaded',
  });
  const form = page.locator('[data-contract-form]');
  const checkbox = form.locator('[data-contract-checkbox]');
  const plate = form.locator('[data-contract-checkbox] + .ui-choice__control');
  await checkbox.focus();
  await expect(plate).toHaveCSS('outline-style', 'solid');
  const paints = await plate.evaluate((element) => [
    getComputedStyle(element).backgroundColor,
    getComputedStyle(element, '::after').backgroundColor,
  ]);
  expect(paints[0]).not.toBe(paints[1]);
  await expect(checkbox).toBeChecked();
  await checkbox.press('Space');
  await expect(checkbox).not.toBeChecked();
});

for (const theme of themes) {
  test(`core material planes and focus stay consistent in ${theme}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/frame?theme=${theme}&lang=en#materials-core`, {
      waitUntil: 'domcontentloaded',
    });
    const scene = page.locator('[data-core-material="solid"]');
    const role = (name: string) => scene.locator(`[data-core-role="${name}"]`);
    const glass = page.locator('[data-core-material="glass"]');
    await expect(glass.locator('[data-core-role="card"]')).toHaveCSS(
      'backdrop-filter',
      /blur\(18px\)/,
    );

    const plates = [
      'card',
      'group',
      'primary',
      'secondary',
      'input',
      'select',
      'segmented',
      'table',
      'dock',
    ];
    for (const name of plates) {
      await expect(role(name)).toHaveCSS('backdrop-filter', 'none');
      expect(
        await role(name).evaluate((element) => {
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          if (!context) throw new Error('2D canvas unavailable');
          context.fillStyle = getComputedStyle(element).backgroundColor;
          context.fillRect(0, 0, 1, 1);
          return context.getImageData(0, 0, 1, 1).data[3];
        }),
        `${name} paints an opaque plate`,
      ).toBe(255);
    }
    await expect(role('ghost')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await expect(role('segmented').locator('.ui-segmented-control__slider')).toHaveCSS(
      'backdrop-filter',
      'none',
    );
    await expect(role('dock').locator('[aria-current="page"]')).toHaveCSS(
      'backdrop-filter',
      'none',
    );
    await expect(role('table').locator('th').first()).not.toHaveCSS(
      'background-color',
      await role('table')
        .locator('td')
        .first()
        .evaluate((element) => getComputedStyle(element).backgroundColor),
    );
    const samples = await page.evaluate(measureContrast, [
      '[data-core-material="solid"] [data-core-role="primary"]',
      '[data-core-material="solid"] [data-core-role="secondary"]',
      '[data-core-material="solid"] [data-core-role="input"]',
      '[data-core-material="solid"] [data-core-role="select"]',
      '[data-core-material="solid"] [data-core-role="table"] :is(th, td)',
      '[data-core-material="solid"] [data-core-role="dock"] [aria-current="page"]',
    ]);
    expect(samples.length).toBeGreaterThanOrEqual(9);
    for (const sample of samples) expect(sample.ratio, sample.selector).toBeGreaterThanOrEqual(4.5);

    const vueSelect = role('select');
    await scene.evaluate((el) => el.setAttribute('data-neoverse-material', 'glass'));
    await expect(vueSelect).toHaveCSS('backdrop-filter', 'none');
    await vueSelect.press('Enter');
    const listbox = scene.getByRole('listbox');
    await expect(listbox).toBeVisible();
    await expect(listbox).toHaveCSS('backdrop-filter', 'none');
    const overlayFill = await listbox.evaluate(
      (element) => getComputedStyle(element).backgroundColor,
    );
    await page.keyboard.press('Escape');
    await expect(listbox).toBeHidden();
    await expect(vueSelect).toBeFocused();
    await scene.evaluate((el) => el.setAttribute('data-neoverse-material', 'solid'));

    await role('primary').press('Enter');
    const dialog = page.locator('dialog[data-core-role="dialog"][open]');
    await expect(dialog).toHaveCSS('backdrop-filter', 'none');
    await expect(dialog).toHaveCSS('background-color', overlayFill);
    const scrim = page.locator('.ui-dialog__backdrop[data-open="true"]');
    await expect(scrim).toHaveCSS('opacity', '1');
    const solidScrim = await scrim.evaluate((element) => getComputedStyle(element).backgroundColor);
    await scene.evaluate((el) => el.setAttribute('data-neoverse-material', 'glass'));
    await expect(dialog).toHaveCSS('backdrop-filter', /blur\(18px\)/);
    await scene.evaluate((el) => el.setAttribute('data-neoverse-material', 'frosted'));
    await expect(dialog).toHaveCSS('backdrop-filter', /blur\(20px\)/);
    await expect(dialog).not.toHaveCSS('background-color', overlayFill);
    await expect(scrim).not.toHaveCSS('background-color', solidScrim);
    await scene.evaluate((el) => el.setAttribute('data-neoverse-material', 'solid'));
    await expect(dialog).toHaveCSS('backdrop-filter', 'none');
    await expect(scrim).toHaveCSS('background-color', solidScrim);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(role('primary')).toBeFocused();

    await page.goto(`/react-fixture?theme=${theme}&lang=en&contract-fixtures=1`, {
      waitUntil: 'domcontentloaded',
    });
    // The opposite scope is local to the portaled dialog and must survive a Glass root.
    const reactDialogSource = page.locator('[data-react-adapter="UiDialog"]');
    await expect(reactDialogSource).toBeVisible();
    await reactDialogSource.evaluate((el) => el.setAttribute('data-neoverse-material', 'solid'));
    const reactOpen = reactDialogSource.locator('[data-dialog-open]');
    await reactOpen.press('Enter');
    const reactDialog = page.locator('dialog.ui-dialog[open]');
    await expect(reactDialog).toHaveCSS('backdrop-filter', 'none');
    await expect(reactDialog).toHaveCSS('background-color', overlayFill);
    await page.keyboard.press('Escape');
    await expect(reactOpen).toBeFocused();

    await page.locator('html').evaluate((el) => el.setAttribute('data-neoverse-material', 'solid'));
    for (const name of ['UiInput', 'UiSelect', 'UiSegmentedControl', 'UiTable', 'UiDock']) {
      await expect(page.locator(`[data-react-adapter="${name}"]`)).toHaveCSS(
        'backdrop-filter',
        'none',
      );
    }
    const reactSelect = page.locator('[data-react-adapter="UiSelect"]');
    await reactSelect.press('Enter');
    await expect(page.getByRole('listbox')).toHaveCSS('background-color', overlayFill);
    await page.keyboard.press('Escape');
    await expect(reactSelect).toBeFocused();
  });
}
