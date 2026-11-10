import { expect, test } from '@playwright/test';
import { measureContrast } from '../support/contrast';

const roles = [
  { selector: '.text-primary', floor: 7, level: 'AAA for body text' },
  { selector: '.text-secondary', floor: 4.5, level: 'AA for body text' },
  { selector: '.text-muted', floor: 4.5, level: 'AA for body text' },
] as const;

for (const theme of ['light', 'dark'] as const) {
  test(`${theme} theme keeps text roles above their contrast floors`, async ({ page }) => {
    await page.goto(`/frame?theme=${theme}&lang=en#typography`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#foundation-typography')).toBeVisible();

    const samples = await page.evaluate(
      measureContrast,
      roles.map((role) => role.selector),
    );

    for (const role of roles) {
      const matches = samples.filter((sample) => sample.selector === role.selector);
      expect(matches.length, `${role.selector} must render at least once`).toBeGreaterThan(0);
      for (const sample of matches) {
        expect(
          sample.ratio,
          `${role.selector} "${sample.text}" needs ${role.floor}:1 (${role.level}); ` +
            `foreground ${sample.foreground} on ${sample.background}`,
        ).toBeGreaterThanOrEqual(role.floor);
      }
    }
  });
}

test('both themes resolve different text colors for the same roles', async ({ page }) => {
  const read = async (theme: 'light' | 'dark') => {
    await page.goto(`/frame?theme=${theme}&lang=en#typography`, { waitUntil: 'domcontentloaded' });
    const samples = await page.evaluate(measureContrast, ['.text-primary', '.text-secondary']);
    return samples.map((sample) => sample.foreground);
  };

  const light = await read('light');
  const dark = await read('dark');
  expect(light.length).toBeGreaterThan(0);
  expect(dark.length).toBeGreaterThan(0);
  expect(new Set(light)).not.toEqual(new Set(dark));
});
