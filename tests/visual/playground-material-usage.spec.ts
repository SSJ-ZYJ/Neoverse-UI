import { expect, test } from '@playwright/test';

const modules = [
  'colors',
  'typography',
  'layout-shape',
  'motion',
  'materials',
  'shadow',
  'controls',
  'dock',
  'status-feedback',
  'forms',
  'data-display',
  'card',
  'scrollbar',
  'composition',
  'consumer-parity',
  'terminal',
];

for (const theme of ['light', 'dark'] as const) {
  test(`Playground compositions use shared material owners / ${theme}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: theme });
    const violations: string[] = [];
    for (const module of modules) {
      await page.goto(`/?theme=${theme}&lang=en#${module}`, { waitUntil: 'domcontentloaded' });
      const region = page.locator('[data-design-lab-region="module"]');
      await expect(region).toBeVisible();
      const outdated = await region.evaluate((root) => {
        const errors: string[] = [];
        for (const element of root.querySelectorAll(
          ':is(.bg-surface-raised, .bg-surface-subtle):is(.rounded-card, .rounded-panel, .rounded-control)',
        )) {
          // These are token/geometry swatches, not composition material owners.
          if (element.closest('[data-token-preview]')) continue;
          errors.push(`local painted panel: ${element.tagName.toLowerCase()}.${element.className}`);
        }
        for (const element of root.querySelectorAll('.ui-surface[data-surface="subtle"]')) {
          if (
            element.hasAttribute('data-surface-preset') ||
            element.querySelector('[data-card-transparent-optout]')
          )
            continue;
          errors.push(`legacy subtle composition: ${element.className}`);
        }
        for (const element of root.querySelectorAll('.ui-disclosure[class*="material-glass-"]')) {
          errors.push(`Disclosure overrides its shared inset material: ${element.className}`);
        }
        for (const element of root.querySelectorAll(
          '.playground-data-table-surface, [data-contract-matrix]',
        )) {
          if (element.getAttribute('data-surface') !== 'none')
            errors.push('Table wrapper adds an independent Glass plate');
        }
        for (const element of root.querySelectorAll(
          '[data-surface^="glass-"], .ui-surface-inset',
        )) {
          if (
            element.matches('.ui-button--ghost, [data-neoverse-glass-nesting="inherit"]') ||
            element.closest(
              '.playground-reduced-transparency-preview, [data-material-custom-preview]',
            )
          )
            continue;
          // Tooltip keeps its sampling root transparent; the unified pointer/body
          // plate is rendered by ::before, not by the root's backdrop-filter.
          if (element.matches('.ui-tooltip-surface')) {
            const plate = getComputedStyle(element, '::before');
            if (
              !plate.backdropFilter.includes('blur(') ||
              plate.backgroundColor === 'rgba(0, 0, 0, 0)'
            ) {
              errors.push(`Tooltip unified plate lost its material: ${element.className}`);
            }
            continue;
          }
          const tier = element.getAttribute('data-surface');
          const tiers: Record<string, readonly [number, number]> = {
            'glass-subtle': [12, 0.15],
            'glass-elevated': [18, 0.2],
            'glass-immersive': [24, 0.3],
          };
          const expected = tiers[tier === 'inset' ? 'glass-subtle' : (tier ?? '')];
          if (!expected) continue;
          const style = getComputedStyle(element);
          const blur = Number(style.backdropFilter.match(/blur\(([\d.]+)px\)/)?.[1]);
          // Dark buttons intentionally halve blur to keep their colored fill legible;
          // other Glass owners retain the canonical tier blur.
          const blurScale = element.matches('.ui-button')
            ? Number(style.getPropertyValue('--neoverse-control-button-blur-scale')) || 1
            : 1;
          const alpha = Number(
            style.backgroundColor.match(/\/\s*([\d.]+)\s*\)/)?.[1] ??
              style.backgroundColor.match(/rgba\([^)]*,\s*([\d.]+)\)/)?.[1] ??
              1,
          );
          if (
            Math.abs(blur - expected[0] * blurScale) > 0.01 ||
            Math.abs(alpha - (expected[1] ?? 1)) > 0.005
          )
            errors.push(
              `nonstandard ${tier} optics: ${element.className} (${style.backdropFilter}, ${style.backgroundColor})`,
            );
        }
        return errors;
      });
      violations.push(...new Set(outdated.map((error) => `${module}: ${error}`)));
    }
    expect(violations).toEqual([]);
  });
}

for (const theme of ['light', 'dark'] as const) {
  test(`scrollbar preview uses standard cards and retains local scrolling / ${theme}`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: theme });
    await page.goto(`/?theme=${theme}&lang=en#scrollbar`, { waitUntil: 'domcontentloaded' });
    const cards = page.locator('[aria-labelledby="scrollbar-preview-title"] .ui-card');
    await expect(cards).toHaveCount(2);
    for (const card of await cards.all()) {
      const material = await card.evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          surface: element.getAttribute('data-surface'),
          filter: style.backdropFilter,
          color: style.backgroundColor,
        };
      });
      expect(material.surface).toBe('glass-elevated');
      expect(material.filter).toContain('blur(18px)');
      expect(material.color).toMatch(/(?:\/\s*0\.2\)|,\s*0\.2\))/);
    }
    const viewport = page.locator(
      '[aria-labelledby="scrollbar-preview-title"] .scrollbar-immersive',
    );
    await viewport.evaluate((element) => {
      element.scrollTop = 100;
    });
    expect(await viewport.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  });
}
