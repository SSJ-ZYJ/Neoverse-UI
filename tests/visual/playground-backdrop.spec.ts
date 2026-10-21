import { expect, test } from '@playwright/test';

for (const theme of ['light', 'dark'] as const) {
  test(`decorated preview backgrounds stay inside their stage in ${theme} theme`, async ({
    page,
  }) => {
    await page.goto(`/?theme=${theme}&lang=zh#dock-component`, {
      waitUntil: 'domcontentloaded',
    });

    const specimen = page.locator('#dock-component');
    await expect(specimen).toBeVisible();
    const backdrop = specimen.locator('.playground-material-backdrop');
    const background = await backdrop.evaluate(
      (element) => getComputedStyle(element).backgroundImage,
    );
    expect(background, 'The outer container must not duplicate the stage grid').not.toContain(
      'repeating-linear-gradient',
    );
    expect(background, 'The outer container must not duplicate the stage circles').not.toContain(
      'circle at',
    );

    const stages = specimen.locator('[data-dock-preview]');
    await expect(stages).toHaveCount(2);
    for (const stage of await stages.all()) {
      const image = await stage.evaluate((element) => getComputedStyle(element).backgroundImage);
      expect(image).toContain('repeating-linear-gradient');
      expect(image).toContain('circle at');
      const geometry = await stage.evaluate((element) => {
        const header = element.parentElement?.querySelector('header');
        if (!header) throw new Error('Dock specimen header missing');
        return {
          headerBottom: header.getBoundingClientRect().bottom,
          previewTop: element.getBoundingClientRect().top,
        };
      });
      expect(geometry.headerBottom).toBeLessThan(geometry.previewTop);
    }

    await page.goto(`/?theme=${theme}&lang=zh#card`, { waitUntil: 'domcontentloaded' });
    const cardBackdrop = page.locator('.playground-material-backdrop').first();
    await expect(cardBackdrop).toBeVisible();
    const cardImage = await cardBackdrop.evaluate(
      (element) => getComputedStyle(element).backgroundImage,
    );
    expect(cardImage, 'A standalone material preview retains the observation grid').toContain(
      'repeating-linear-gradient',
    );
  });
}
