import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

const consumerCss = await readFile(
  new URL('../../packages/tailwind/dist/index.css', import.meta.url),
  'utf8',
);

for (const theme of ['light', 'dark'] as const) {
  for (const locale of ['en', 'zh'] as const) {
    test(`Dock preview matches shipped consumer CSS / ${theme} / ${locale}`, async ({
      page,
      context,
    }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      const consumer = await context.newPage();
      const measure = (element: Element) => {
        const nodes = [
          element,
          ...element.querySelectorAll(
            '.ui-navigation-item, .ui-action__leading > svg, .ui-segmented-control__option, .ui-control-surface__group--trailing',
          ),
        ];
        return nodes.map((node) => {
          const rect = node.getBoundingClientRect();
          return {
            width: rect.width,
            height: rect.height,
            fontSize: getComputedStyle(node).fontSize,
          };
        });
      };
      for (const route of ['/', '/frame']) {
        await page.goto(`${route}?theme=${theme}&lang=${locale}#dock`);
        for (const specimen of ['standard', 'compact']) {
          const dock = page.locator(`[data-dock-specimen="${specimen}"] .ui-dock`);
          await expect(dock).toBeVisible();
          await expect(dock).toHaveCSS('zoom', '1.1');
          const preview = await dock.evaluate(measure);
          const markup = await dock.evaluate((element) => element.outerHTML);
          await consumer.setContent(
            `<!doctype html><html data-theme="${theme}"><head><style>${consumerCss}</style></head><body>${markup}</body></html>`,
          );
          const standalone = consumer.locator('.ui-dock');
          await expect(consumer.locator('html')).toHaveCSS('font-size', '16px');
          const actual = await standalone.evaluate(measure);
          expect(actual).toHaveLength(preview.length);
          for (const [index, expected] of preview.entries()) {
            expect(actual[index]?.fontSize).toBe(expected.fontSize);
            expect(actual[index]?.width).toBeCloseTo(expected.width, 0);
            expect(actual[index]?.height).toBeCloseTo(expected.height, 0);
          }
          // Keep navigation slightly larger than the original 32px target,
          // with restrained labels in both Chinese and English.
          expect(actual[1]?.height).toBeCloseTo(35.2, 0);
          expect(Number.parseFloat(actual[1]?.fontSize ?? '') * 1.1).toBeCloseTo(14.63, 1);
          expect(actual[0]?.height).toBeGreaterThan(45);
          expect(actual[0]?.height).toBeLessThan(55);
          if (specimen === 'compact') {
            expect(
              await standalone.evaluate((element) => element.getBoundingClientRect().right),
            ).toBeLessThanOrEqual(await consumer.evaluate(() => innerWidth));
          }
        }
        await page.goto(`${route}?theme=${theme}&lang=${locale}#consumer-parity`);
        const parity = page.locator('[data-consumer-parity="floating-navigation"]');
        await expect(parity).toHaveCSS('zoom', '1.1');
        await expect(parity).toHaveClass(/ui-control-surface--scale-md/);
      }
      await consumer.close();
    });
  }
}
