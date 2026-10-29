import { expect, test } from '@playwright/test';

for (const theme of ['light', 'dark']) {
  for (const hash of ['', '#controls', '#controls-action']) {
    test(`playground preserves ${hash || 'overview'} reading position on reload in ${theme} theme`, async ({
      page,
    }) => {
      await page.goto(`/?theme=${theme}&lang=en${hash}`);
      const workspace = page.locator('[data-design-lab-workspace]');
      const content = page.locator(hash ? '#controls-segmented-control' : '[data-overview-hero]');
      await expect(content).toBeAttached();
      await page.evaluate(() => document.fonts.ready.then(() => undefined));
      if (hash === '#controls-action') {
        await expect
          .poll(() => workspace.evaluate((element) => element.scrollTop))
          .toBeGreaterThan(0);
      }
      await workspace.evaluate((element) => element.scrollTo({ top: 760, behavior: 'instant' }));
      await expect.poll(() => workspace.evaluate((element) => element.scrollTop)).toBe(760);

      for (let reload = 0; reload < 2; reload += 1) {
        await page.reload();
        await expect(content).toBeAttached();
        await page.evaluate(() =>
          document.fonts.ready.then(() => new Promise(requestAnimationFrame)),
        );
        await expect.poll(() => workspace.evaluate((element) => element.scrollTop)).toBe(760);
      }
    });
  }
}

test('module navigation starts at the top without restoring a previous reload position', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?lang=en#controls');
  const workspace = page.locator('[data-design-lab-workspace]');
  await expect(page.locator('#controls-segmented-control')).toBeAttached();
  await workspace.evaluate((element) => element.scrollTo({ top: 760, behavior: 'instant' }));
  await expect.poll(() => workspace.evaluate((element) => element.scrollTop)).toBe(760);

  await page.evaluate(() => {
    window.location.hash = 'materials';
  });
  await expect(page.locator('[data-glass-preview-stage]').first()).toBeAttached();
  await expect.poll(() => workspace.evaluate((element) => element.scrollTop)).toBe(0);

  await page.goto('/?lang=en#controls');
  await expect(page.locator('#controls-segmented-control')).toBeAttached();
  await expect.poll(() => workspace.evaluate((element) => element.scrollTop)).toBe(0);
});

test('reload preserves a reading position near the bottom after fonts load', async ({ page }) => {
  await page.goto('/?lang=en#controls');
  const workspace = page.locator('[data-design-lab-workspace]');
  await expect(page.locator('#controls-segmented-control')).toBeAttached();
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  const top = await workspace.evaluate((element) => {
    element.scrollTop = element.scrollHeight - element.clientHeight - 100;
    return element.scrollTop;
  });
  expect(top).toBeGreaterThan(760);

  await page.reload();
  await expect(page.locator('#controls-segmented-control')).toBeAttached();
  await page.evaluate(() => document.fonts.ready.then(() => new Promise(requestAnimationFrame)));
  await expect.poll(() => workspace.evaluate((element) => element.scrollTop)).toBe(top);
});

test('reload releases scroll anchoring when the reader interacts', async ({ page }) => {
  await page.goto('/?lang=en#controls');
  const workspace = page.locator('[data-design-lab-workspace]');
  await expect(page.locator('#controls-segmented-control')).toBeAttached();
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  await workspace.evaluate((element) => {
    element.scrollTop = 760;
  });
  await page.reload();
  await expect(page.locator('#controls-segmented-control')).toBeAttached();
  await expect
    .poll(() => workspace.evaluate((element) => element.style.overflowAnchor))
    .toBe('none');
  await workspace.dispatchEvent('wheel', { deltaY: 10 });
  await expect.poll(() => workspace.evaluate((element) => element.style.overflowAnchor)).toBe('');
});
