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
