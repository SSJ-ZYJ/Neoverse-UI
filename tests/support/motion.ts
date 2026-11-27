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

/** Records the real size transition without polling for a running animation frame. */
export function observeStageResize(stage: Locator) {
  return stage.evaluateHandle((element) => {
    const card = element.querySelector('[data-motion-page-card]');
    const outgoing = card?.getAttribute('data-motion-page-card');
    if (!outgoing) throw new Error('The outgoing page needs content');
    // Give the fixture two explicit sizes. Depending on the viewport, both
    // pages can naturally settle at the same height after grid layout.
    const normal = Math.ceil(element.getBoundingClientRect().height);
    const selector = `[data-motion-page-card="${CSS.escape(outgoing)}"]`;
    const style = document.createElement('style');
    style.textContent = `
      [data-motion-page-stage] { block-size: ${normal}px; }
      [data-motion-page-stage]:has(${selector}) { block-size: ${normal + 100}px; }
    `;
    element.before(style);
    const observed = { heightDelta: 0 };
    const animate = element.animate.bind(element);
    element.animate = (...args) => {
      const animation = animate(...args);
      if (animation.effect instanceof KeyframeEffect) {
        const frames = animation.effect.getKeyframes();
        const from = frames.at(0)?.height;
        const to = frames.at(-1)?.height;
        if (typeof from === 'string' && typeof to === 'string') {
          observed.heightDelta = Math.abs(Number.parseFloat(to) - Number.parseFloat(from));
        }
      }
      return animation;
    };
    return observed;
  });
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
