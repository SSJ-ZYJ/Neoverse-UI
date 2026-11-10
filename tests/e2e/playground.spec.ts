import { expect, test } from '@playwright/test';
import { expectNoPageOverflow } from '../support/e2e';

test.describe('playground', () => {
  test('the overview showcase switches material presets and opens a module', async ({ page }) => {
    await page.goto('/?theme=dark&lang=en', { waitUntil: 'domcontentloaded' });
    const sample = page.locator('[data-overview-hero] .playground-overview-hero__sample');
    await expect(sample).toHaveAttribute('data-surface', 'glass-subtle');

    await page
      .getByRole('radiogroup', { name: 'Preview material' })
      .getByRole('radio')
      .nth(1)
      .click();
    await expect(sample).toHaveAttribute('data-surface', 'glass-elevated');

    await sample.getByRole('button', { name: 'Components' }).click();
    await expect(page).toHaveURL(/#controls$/);
    await expect(page.locator('[data-design-lab-region="module"]')).toBeVisible();
    await expect(page.locator('iframe')).toHaveCount(0);
  });

  test('clicking a module in the sidebar selects it and scrolls to the top', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/?lang=en#controls', { waitUntil: 'domcontentloaded' });
    const workspace = page.locator('[data-design-lab-workspace]');
    await expect(page.locator('#controls-segmented-control')).toBeAttached();
    await workspace.evaluate((element) => element.scrollTo({ top: 760, behavior: 'instant' }));

    const navigation = page.locator('[data-playground-navigation]');
    await navigation.locator('a[href="#materials"]').click();
    await expect(page).toHaveURL(/#materials$/);
    await expect(page.locator('[data-glass-preview-stage]').first()).toBeAttached();
    await expect.poll(() => workspace.evaluate((element) => element.scrollTop)).toBe(0);
  });

  test('a reload restores the reading position', async ({ page }) => {
    await page.goto('/?lang=en#controls', { waitUntil: 'domcontentloaded' });
    const workspace = page.locator('[data-design-lab-workspace]');
    await expect(page.locator('#controls-segmented-control')).toBeAttached();
    await page.evaluate(() => document.fonts.ready.then(() => undefined));
    await workspace.evaluate((element) => element.scrollTo({ top: 760, behavior: 'instant' }));
    await expect.poll(() => workspace.evaluate((element) => element.scrollTop)).toBe(760);

    await page.reload();
    await expect(page.locator('#controls-segmented-control')).toBeAttached();
    await page.evaluate(() => document.fonts.ready.then(() => new Promise(requestAnimationFrame)));
    await expect.poll(() => workspace.evaluate((element) => element.scrollTop)).toBe(760);
  });

  test('a specimen deep link resolves its module and moves focus to the specimen', async ({
    page,
  }) => {
    for (const specimenId of [
      'foundation-typography',
      'controls-action',
      'status-feedback-notice',
      'composition-reading',
    ]) {
      await page.goto(`/#${specimenId}`, { waitUntil: 'domcontentloaded' });
      const specimen = page.locator(`#${specimenId}`);
      await expect(page.locator('[data-design-lab-region="module"]')).toBeVisible();
      await expect(specimen).toBeVisible();
      await expect(page).toHaveURL(new RegExp(`#${specimenId}$`));
      await expect
        .poll(() => specimen.evaluate((element) => document.activeElement === element))
        .toBe(true);
    }
  });

  test('the drawer navigation is inert when closed and restores focus on Escape', async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'mobile',
      'The drawer only exists below the xl breakpoint.',
    );
    await page.goto('/?lang=en', { waitUntil: 'domcontentloaded' });
    const navigation = page.locator('#design-lab-navigation');
    const trigger = page.locator('[data-playground-nav-trigger]');

    await expect(trigger).toBeVisible();
    expect(await navigation.evaluate((element) => (element as HTMLElement).inert)).toBe(true);

    await trigger.click();
    expect(await navigation.evaluate((element) => (element as HTMLElement).inert)).toBe(false);
    expect(await navigation.evaluate((element) => element.contains(document.activeElement))).toBe(
      true,
    );

    await page.keyboard.press('Escape');
    expect(await navigation.evaluate((element) => (element as HTMLElement).inert)).toBe(true);
    await expect
      .poll(() => trigger.evaluate((element) => element === document.activeElement))
      .toBe(true);
  });

  test('the mobile toolbar cycles the theme and switches the language', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'The compact toolbar only renders on mobile.');
    await page.goto('/?theme=dark&lang=en', { waitUntil: 'domcontentloaded' });
    const themeButton = page.getByRole('button', { name: /Cycle theme/ });
    const languageButton = page.getByRole('button', { name: /Switch language/ });

    await themeButton.click();
    await expect
      .poll(() =>
        page.evaluate(() => ({
          mode: document.documentElement.dataset.theme ?? 'system',
          stored: JSON.parse(window.localStorage.getItem('neoverse-design-lab.preferences') ?? '{}')
            .theme,
        })),
      )
      .toEqual({ mode: 'system', stored: 'system' });
    await expect(page).toHaveURL(/theme=dark/);

    await languageButton.click();
    await expect(page).toHaveURL(/lang=zh/);
  });

  test('the Giscus module previews both widget themes with the shipped CSS', async ({ page }) => {
    await page.goto('/?lang=en#giscus', { waitUntil: 'domcontentloaded' });
    const section = page.locator('#giscus-themes');
    await expect(section).toBeVisible();
    await expect(page.locator('iframe[data-giscus-preview]')).toHaveCount(2);

    const canvases: string[] = [];
    for (const theme of ['light', 'dark'] as const) {
      const frame = page.frameLocator(`iframe[data-giscus-preview="${theme}"]`);
      await expect(frame.locator('.gsc-comment')).toBeVisible();
      await expect(frame.locator('.gsc-comment-box')).toBeVisible();
      await expect(frame.locator('.gsc-comment-box-textarea')).toBeVisible();
      // The theme paints a frosted plate; an unstyled document reports `none`.
      expect(
        await frame
          .locator('.gsc-comment')
          .evaluate((element) => getComputedStyle(element).backdropFilter),
      ).toContain('blur(');
      canvases.push(
        await frame
          .locator('.giscus-preview-surface')
          .evaluate((element) => getComputedStyle(element).backgroundColor),
      );
    }
    expect(canvases[0]).not.toBe(canvases[1]);
  });

  test('demo actions navigate to their real destinations', async ({ page }) => {
    await page.goto('/?lang=en#composition-reading', { waitUntil: 'domcontentloaded' });
    const action = page.locator('[data-reading-surface-link]');
    await expect(action).toHaveAttribute('href', '#materials-surface');
    await action.click();
    await expect(page).toHaveURL(/#materials-surface$/);
    await expect(page.locator('#materials-surface')).toBeVisible();

    await page.goto('/react-fixture?lang=en', { waitUntil: 'domcontentloaded' });
    const reactAction = page.locator('[data-react-adapter="UiAction"]');
    await expect(reactAction).toHaveAttribute('href', '#react-runtime-fixture');
    await reactAction.click();
    await expect(page).toHaveURL(/\/react-fixture\?lang=en$/);
    expect(await page.locator('a[href^="https://github.com/"]').count()).toBe(0);
  });

  test('the React runtime fixture links back to the consumer parity section', async ({ page }) => {
    for (const locale of ['en', 'zh'] as const) {
      await page.goto(`/react-fixture?lang=${locale}`, { waitUntil: 'domcontentloaded' });
      const returnLink = page.getByRole('link', {
        name: locale === 'zh' ? '返回设计实验室' : 'Back to Design Lab',
      });
      await expect(returnLink).toHaveAttribute('href', `/?lang=${locale}#consumer-parity`);
      await returnLink.click();
      await expect(page).toHaveURL(new RegExp(`\\?lang=${locale}#consumer-parity$`));
      await expect(page.locator('[data-contract-runtime-entry]')).toBeVisible();
    }
  });

  for (const width of [390, 1024, 1440]) {
    test(`the shell keeps its content inside the viewport at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/?lang=en#controls', { waitUntil: 'domcontentloaded' });
      await expect(page.locator('[data-design-lab-region="module"]')).toBeVisible();
      await expectNoPageOverflow(page);
      expect(await page.evaluate(() => window.scrollY)).toBe(0);
    });
  }
});
