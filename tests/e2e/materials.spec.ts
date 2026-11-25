import { expect, test } from '@playwright/test';
import { expectNoPageOverflow, themes } from '../support/e2e';

test.describe('materials', () => {
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
      const tint = primary.locator('.ui-button__tone-field');
      const rest = await tint.evaluate((element) => getComputedStyle(element).backgroundColor);
      const blur = await primary.evaluate((element) => getComputedStyle(element).backdropFilter);
      const shadow = await primary.evaluate((element) => getComputedStyle(element).boxShadow);
      expect(blur).toContain('blur(');
      expect(rest).toMatch(/^rgba\(/);

      if (!testInfo.project.use.hasTouch) await primary.hover();
      const ready = await tint.evaluate((element) => getComputedStyle(element).backgroundColor);
      if (!testInfo.project.use.hasTouch) expect(ready).not.toBe(rest);
      await expect(primary).toHaveCSS('box-shadow', shadow);

      await primary.focus();
      await page.keyboard.down('Space');
      try {
        await expect(tint).not.toHaveCSS('background-color', ready);
        await expect(primary).toHaveCSS('backdrop-filter', blur);
        await expect(primary).toHaveCSS('box-shadow', shadow);
        await expect(primary).toHaveCSS('border-top-color', 'rgba(0, 0, 0, 0)');
      } finally {
        await page.keyboard.up('Space');
      }
      await expect(tint).toHaveCSS('background-color', ready);
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

test('the React fixture wires the same three Glass tiers', async ({ page }) => {
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
  }
});

test('reduced transparency removes the renderer and the tier blur', async ({ page }) => {
  const client = await page.context().newCDPSession(page);
  await client.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }],
  });
  await page.goto('/frame?theme=dark&lang=en#materials', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('[data-neoverse-glass-renderer-canvas]')).toHaveCount(0);

  const surface = page.locator('[data-surface="glass-elevated"]').first();
  await expect(surface).toBeVisible();
  const fallback = await surface.evaluate((element) => {
    const style = getComputedStyle(element);
    return { filter: style.backdropFilter, background: style.backgroundColor };
  });
  expect(fallback.filter).toBe('none');
  expect(fallback.background).not.toContain('rgba(0, 0, 0, 0)');
  await expectNoPageOverflow(page);
});
