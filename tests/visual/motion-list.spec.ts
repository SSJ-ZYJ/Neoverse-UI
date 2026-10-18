import { expect, test } from '@playwright/test';

test('list reorder visibly travels through intermediate positions', async ({ page }) => {
  await page.goto('/frame?theme=dark&lang=en#motion');
  const group = page.locator('[data-motion-presence-group]');
  await expect(group).toBeVisible();
  await group.scrollIntoViewIfNeeded();
  await expect(group.locator('.nv-enter-active')).toHaveCount(0);
  const items = group.locator('[data-motion-presence-group-item]');
  const originalOrder = await items.allTextContents();
  const frames = await page.evaluate(async () => {
    const item = document.querySelector<HTMLElement>('[data-motion-presence-group-item]');
    const button = document.querySelector<HTMLButtonElement>('[data-motion-presence-shuffle]');
    if (!item || !button) throw new Error('Missing list demo');
    button.click();
    await Promise.resolve();
    const move = item
      .getAnimations()
      .find(
        (animation) =>
          animation instanceof CSSTransition && animation.transitionProperty === 'transform',
      );
    if (!move)
      throw new Error('Reorder must animate transform instead of cutting to its destination');
    move.pause();
    const duration = Number(move.effect?.getTiming().duration);
    // Seek the actual browser transition: deterministic even on a slow GPU.
    const positions = [0, 0.1, 0.25, 0.5, 0.8, 1].map((progress) => {
      move.currentTime = duration * progress;
      const rect = item.getBoundingClientRect();
      return { x: rect.x, y: rect.y };
    });
    move.finish();
    return positions;
  });
  const start = frames[0];
  const end = frames.at(-1);
  if (!start || !end) throw new Error('Missing movement samples');
  expect(Math.hypot(end.x - start.x, end.y - start.y)).toBeGreaterThan(20);
  expect(new Set(frames.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`)).size).toBe(
    6,
  );
  await expect(items).toHaveText([...originalOrder.slice(1), ...originalOrder.slice(0, 1)]);
  await page.locator('[data-motion-presence-shuffle]').click();
  await expect(items).toHaveText([...originalOrder.slice(2), ...originalOrder.slice(0, 2)]);
});

test('entrance replay shows a staggered fade and rise', async ({ page }, testInfo) => {
  await page.goto('/frame?theme=dark&lang=en#motion');
  const group = page.locator('[data-motion-presence-group]');
  await expect(group).toBeVisible();
  await group.scrollIntoViewIfNeeded();
  await expect(group.locator('.nv-enter-active')).toHaveCount(0);
  const order = await group.locator('[data-motion-presence-group-item]').allTextContents();
  const frames = await page.evaluate(async () => {
    document.querySelector<HTMLButtonElement>('[data-motion-presence-replay]')?.click();
    // Vue installs the from state on mount and removes it after two frames.
    for (let index = 0; index < 3; index += 1) await new Promise(requestAnimationFrame);
    return [...document.querySelectorAll<HTMLElement>('[data-motion-presence-group-item]')].map(
      (item) => {
        const animations = item
          .getAnimations()
          .filter((animation) => animation instanceof CSSTransition);
        const opacity = animations.find(
          (animation) => (animation as CSSTransition).transitionProperty === 'opacity',
        );
        if (!opacity) throw new Error('Entrance replay must animate opacity');
        for (const animation of animations) {
          animation.pause();
          animation.currentTime = 60;
        }
        const style = getComputedStyle(item);
        return {
          delay: opacity.effect?.getTiming().delay,
          opacity: Number(style.opacity),
          translate: style.translate,
        };
      },
    );
  });
  expect(frames.map((frame) => frame.delay)).toEqual([0, 40, 80, 120, 160]);
  expect(frames[0]?.opacity).toBeGreaterThan(0.1);
  expect(frames.at(-1)?.opacity).toBe(0);
  expect(frames[0]?.translate).not.toBe(frames.at(-1)?.translate);
  await group.screenshot({
    path: testInfo.outputPath('stagger-mid-entrance.png'),
    animations: 'allow',
  });
  await page.evaluate(() => {
    for (const item of document.querySelectorAll('[data-motion-presence-group-item]')) {
      for (const animation of item.getAnimations()) animation.finish();
    }
  });
  await expect(group.locator('[data-motion-presence-group-item]')).toHaveText(order);
  await expect(group.locator('.nv-enter-active')).toHaveCount(0);
});
