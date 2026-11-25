import { expect, type Locator, type Page } from '@playwright/test';

/** Captures computed view-transition state while switching a page transition preset. */
export async function capturePagePreset(page: Page, specimen: Locator, variant: string) {
  const [frame] = await Promise.all([
    page.waitForFunction((expected) => {
      const root = document.documentElement;
      if (root.getAttribute('data-neoverse-page-transition') !== expected) return;
      const incoming = getComputedStyle(root, '::view-transition-new(nv-page)');
      if (incoming.animationName === 'none') return;
      const figure = document.querySelector('[data-motion-page-figure]') as HTMLElement | null;
      return {
        scope: root.getAttribute('data-neoverse-page-scope'),
        direction: root.getAttribute('data-neoverse-page-direction'),
        backgroundMode: root.getAttribute('data-neoverse-page-background'),
        animationName: incoming.animationName,
        delay: Number.parseFloat(incoming.animationDelay),
        backgroundColor: incoming.backgroundColor,
        maskImage: incoming.maskImage,
        contentTargeted: Boolean(
          document.querySelector('[data-motion-page-content][data-neoverse-page-target]'),
        ),
        stageTargeted: Boolean(
          document.querySelector('[data-motion-page-stage][data-neoverse-page-target]'),
        ),
        figureName: figure?.style.getPropertyValue('view-transition-name') ?? '',
        morphGroupDuration: Number.parseFloat(
          getComputedStyle(root, '::view-transition-group(nv-morph-stage-figure)')
            .animationDuration,
        ),
      };
    }, variant),
    specimen.locator(`[data-motion-page-variant="${variant}"]`).click(),
  ]);
  return frame.jsonValue();
}

/** Verifies page dissolve swaps the region and leaves no active particle canvas behind. */
export async function expectPageDissolveSwap(page: Page) {
  await page.goto('/frame?theme=light&lang=en#foundation-motion-page');
  const trigger = page.locator('[data-motion-page-dissolve]');
  const stage = page.locator('#foundation-motion-page .playground-motion-stage');

  await expect(stage).toContainText('{ dissolveSource }');
  await trigger.click();
  await expect(stage).toContainText('{ particle }');
  await expect(trigger).toBeEnabled();
  await expect(page.locator('html')).not.toHaveAttribute('data-neoverse-particle-transitioning');
  await expect(page.locator('.nv-particle-canvas')).toHaveCount(0);
}
