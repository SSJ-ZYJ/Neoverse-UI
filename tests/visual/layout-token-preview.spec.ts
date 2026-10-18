import { expect, test } from '@playwright/test';

const roles = [
  'page',
  'content',
  'reading',
  'reading-wide',
  'padding-inline',
  'padding-block',
  'sidebar',
  'sidebar-drawer',
  'header',
];

for (const theme of ['light', 'dark']) {
  for (const locale of ['en', 'zh']) {
    test(`layout token thumbnails distinguish all nine roles / ${theme} / ${locale}`, async ({
      page,
    }, testInfo) => {
      await page.goto(`/frame?theme=${theme}&lang=${locale}#layout-shape`);
      const section = page.locator('#layout-role');
      const previews = section.locator('.playground-layout-preview');
      await expect(previews).toHaveCount(9);
      expect(
        await previews.evaluateAll((elements) =>
          elements.map((element) => element.getAttribute('data-layout-role')),
        ),
      ).toEqual(roles);
      const images = new Set<string>();
      for (const preview of await previews.all()) {
        images.add((await preview.screenshot({ animations: 'disabled' })).toString('base64'));
      }
      expect(images.size, 'Every role must render a visibly distinct thumbnail').toBe(9);
      const reading = section.locator(
        '[data-layout-role="reading"] .playground-layout-preview__reading',
      );
      const wide = section.locator(
        '[data-layout-role="reading-wide"] .playground-layout-preview__reading',
      );
      expect(
        await wide.evaluate((element) => element.getBoundingClientRect().width),
      ).toBeGreaterThan(await reading.evaluate((element) => element.getBoundingClientRect().width));
      for (const role of ['padding-inline', 'padding-block', 'sidebar-drawer']) {
        const part = role === 'sidebar-drawer' ? 'drawer' : role;
        await expect(
          section.locator(`[data-layout-role="${role}"] .playground-layout-preview__${part}`),
        ).toHaveCSS('opacity', '1');
      }
      await section.screenshot({
        path: testInfo.outputPath(`layout-previews-${theme}-${locale}.png`),
      });
    });
  }
}
