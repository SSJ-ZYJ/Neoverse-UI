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

    test(`Aurora Glass previews survive scrolling in the ${theme} theme`, async ({ page }) => {
      await page.goto(`/frame?theme=${theme}&lang=en#materials`, { waitUntil: 'domcontentloaded' });
      const stage = page.locator('[data-glass-variant]').last();
      await stage.scrollIntoViewIfNeeded();

      await expect(stage).toBeVisible();
      await page.mouse.wheel(0, -400);
      await expect(stage).toBeVisible();
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

  test('reduced transparency keeps the material previews readable', async ({ page }) => {
    await page.addInitScript(() => {
      const matchMedia = window.matchMedia.bind(window);
      window.matchMedia = (query) => {
        const media = matchMedia(query);
        if (query === '(prefers-reduced-transparency: reduce)') {
          Object.defineProperty(media, 'matches', { value: true });
        }
        return media;
      };
    });
    await page.goto('/frame?theme=dark&lang=en#materials', { waitUntil: 'domcontentloaded' });

    const stages = page.locator('[data-glass-preview-stage]');
    await expect(stages.first()).toBeVisible();
    const first = stages.first();
    await expect(first).not.toBeEmpty();
    await expectNoPageOverflow(page);
  });
});
