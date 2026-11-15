import { expect, test } from '@playwright/test';
import { expectNoPageOverflow } from '../support/e2e';

test.describe('motion', () => {
  test('list reorder moves every item to its new position', async ({ page }) => {
    await page.goto('/frame?theme=light&lang=en#motion', { waitUntil: 'domcontentloaded' });
    const group = page.locator('[data-motion-presence-group]');
    const items = group.locator('[data-motion-presence-group-item]');

    await expect(group).toBeVisible();
    const original = await items.allTextContents();
    expect(original.length).toBeGreaterThan(1);

    await page.locator('[data-motion-presence-shuffle]').click();
    await expect(items).toHaveText([...original.slice(1), original[0] ?? '']);

    await page.locator('[data-motion-presence-shuffle]').click();
    await expect(items).toHaveText([...original.slice(2), ...original.slice(0, 2)]);
  });

  test('reduced motion keeps the reorder complete and immediate', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/frame?theme=light&lang=en#motion', { waitUntil: 'domcontentloaded' });
    const group = page.locator('[data-motion-presence-group]');
    const items = group.locator('[data-motion-presence-group-item]');
    const original = await items.allTextContents();

    await page.locator('[data-motion-presence-shuffle]').click();
    await expect(items).toHaveText([...original.slice(1), original[0] ?? '']);
  });

  test('replaying the entrance keeps the list content intact', async ({ page }) => {
    await page.goto('/frame?theme=light&lang=en#motion', { waitUntil: 'domcontentloaded' });
    const group = page.locator('[data-motion-presence-group]');
    const items = group.locator('[data-motion-presence-group-item]');
    const original = await items.allTextContents();

    await page.locator('[data-motion-presence-replay]').click();
    await expect(items).toHaveText(original);
    for (const item of await items.all()) await expect(item).toBeVisible();
  });

  test('a language switch reflows the width specimen without wrapping its copy', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto('/?lang=en#motion', { waitUntil: 'domcontentloaded' });
    const stage = page.locator('[data-motion-width-stage]');
    await expect(stage).toBeVisible();
    await stage.scrollIntoViewIfNeeded();
    const targets = stage.locator('[data-motion-width-target]');
    await expect(targets).toHaveCount(3);

    const measure = () =>
      targets.evaluateAll((elements) =>
        elements.map((element) => ({
          width: element.getBoundingClientRect().width,
          height: element.getBoundingClientRect().height,
        })),
      );
    const before = await measure();

    await page
      .locator('.playground-shell__toolbar')
      .getByRole('radiogroup', { name: 'Language', exact: true })
      .getByRole('radio', { name: '中文', exact: true })
      .check();

    await expect
      .poll(async () => (await measure()).map((box) => Math.round(box.width)).join(','))
      .not.toBe(before.map((box) => Math.round(box.width)).join(','));
    const after = await measure();
    after.forEach((box, index) => {
      expect(box.height).toBeLessThanOrEqual((before[index]?.height ?? 0) + 1);
    });
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
    await expectNoPageOverflow(page);
  });
});

test('page dissolve swaps the specimen and clears the particle layer', async ({ page }) => {
  await page.goto('/frame?theme=light&lang=en#foundation-motion-page', {
    waitUntil: 'domcontentloaded',
  });
  const trigger = page.locator('[data-motion-page-dissolve]');
  const stage = page.locator('#foundation-motion-page .playground-motion-stage');

  await expect(stage).toContainText('{ dissolveSource }');
  await trigger.click();
  await expect(stage).toContainText('{ particle }');
  await expect(trigger).toBeEnabled();
  await expect(page.locator('html')).not.toHaveAttribute('data-neoverse-particle-transitioning');
  await expect(page.locator('.nv-particle-canvas')).toHaveCount(0);
});

test('page dissolve honors reduced motion without keeping a particle layer', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/frame?theme=light&lang=en#foundation-motion-page', {
    waitUntil: 'domcontentloaded',
  });
  const trigger = page.locator('[data-motion-page-dissolve]');
  const stage = page.locator('#foundation-motion-page .playground-motion-stage');

  await expect(stage).toContainText('{ dissolveSource }');
  await trigger.click();
  await expect(stage).toContainText('{ particle }');
  await expect(trigger).toBeEnabled();
  await expect(page.locator('html')).not.toHaveAttribute('data-neoverse-particle-transitioning');
  await expect(page.locator('.nv-particle-canvas')).toHaveCount(0);
});

test('React presence removes the exited region and returns it on show', async ({ page }) => {
  await page.goto('/react-fixture?theme=light&lang=en', { waitUntil: 'domcontentloaded' });
  const presence = page.locator('[data-react-adapter="UiPresence"]');
  const toggle = page.locator('[data-react-presence-toggle]');

  await expect(presence).toBeVisible();
  await toggle.click();
  await expect(presence).toHaveCount(0);
  await toggle.click();
  await expect(presence).toBeVisible();
});
