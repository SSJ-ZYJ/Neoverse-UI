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
      await expect(page.getByRole('banner')).toBeInViewport({ ratio: 1 });
      expect(await page.evaluate(() => window.scrollY)).toBe(0);
    }
  });

  test('each drawer traps focus when open and restores focus on Escape', async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'mobile',
      'The drawer only exists below the xl breakpoint.',
    );
    await page.goto('/?lang=en#controls-button', { waitUntil: 'domcontentloaded' });
    for (const [name, triggerAttribute] of [
      ['Explorer', 'data-playground-nav-trigger'],
      ['Inspector', 'data-playground-inspector-trigger'],
    ] as const) {
      const trigger = page.locator(`[${triggerAttribute}]`);
      const drawer = page.getByRole('dialog', { name });
      await expect(trigger).toBeVisible();
      await expect(drawer).toBeHidden();

      await trigger.press('Enter');
      await expect(drawer).toBeVisible();
      await expect(drawer.getByRole('button', { name: `Close ${name}` })).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(drawer.locator(':focus')).toHaveCount(1);
      await page.keyboard.press('Shift+Tab');
      await page.keyboard.press('Shift+Tab');
      await expect(page.locator('header.playground-shell__toolbar :focus')).toHaveCount(0);

      await page.keyboard.press('Escape');
      await expect(drawer).toBeHidden();
      await expect(trigger).toBeFocused();

      await trigger.click();
      await expect(drawer).toBeVisible();
      const outsideX = name === 'Explorer' ? 380 : 10;
      await page.mouse.click(outsideX, 400);
      await expect(drawer).toBeHidden();
      await expect(trigger).toBeFocused();
    }
  });

  test('the Explorer finds specimens by API and browser history restores focus and selection', async ({
    page,
  }, testInfo) => {
    await page.goto('/?lang=en#forms', { waitUntil: 'domcontentloaded' });
    const mobile = testInfo.project.name === 'mobile';
    if (mobile) await page.getByRole('button', { name: 'Open Explorer' }).click();
    const explorer = page.locator('[data-playground-navigation]');
    const components = explorer.getByRole('button', { name: 'Components' });
    await components.press('Enter');
    await expect(components).toHaveAttribute('aria-expanded', 'false');
    await expect(explorer.locator('a[href="#forms"]')).toBeHidden();

    const search = explorer.getByRole('searchbox');
    await search.fill('no matching specimen');
    await expect(explorer.getByRole('status')).toContainText('No modules or specimens');
    await search.fill('UiSelect');
    const select = explorer.locator('a[href="#forms-select"]');
    await select.press('Enter');
    await expect(page).toHaveURL(/#forms-select$/);
    await expect(page.locator('#forms-select')).toBeFocused();

    if (mobile) await page.getByRole('button', { name: 'Open Inspector' }).click();
    const inspector = page.locator('#design-lab-inspector');
    await expect(inspector.getByText('UiSelect', { exact: true })).toBeVisible();
    if (mobile) await page.keyboard.press('Escape');
    await page.goBack();
    await expect(page).toHaveURL(/#forms$/);
    await expect(page.locator('[data-stage-heading]')).toBeFocused();
    await page.goForward();
    await expect(page).toHaveURL(/#forms-select$/);
    await expect(page.locator('#forms-select')).toBeFocused();
    if (mobile) await page.getByRole('button', { name: 'Open Explorer' }).click();
    await expect(select).toHaveAttribute('aria-current', 'location');
  });

  test('the Inspector opens the selected specimen in an isolated frame', async ({
    page,
  }, testInfo) => {
    await page.goto('/?theme=dark&lang=en#controls-button', { waitUntil: 'domcontentloaded' });
    if (testInfo.project.name === 'mobile') {
      await page.getByRole('button', { name: 'Open Inspector' }).click();
    }
    await page.getByRole('link', { name: 'Open isolated preview' }).click();
    await expect(page).toHaveURL(/\/frame\?theme=dark&lang=en#controls-button$/);
    await expect(page.locator('#controls-button')).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('[data-design-lab-workspace]')).toHaveCount(0);
  });

  test('the desktop toolbar switches theme and language without resizing the stage', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/?theme=light&lang=en#controls', { waitUntil: 'domcontentloaded' });
    const stage = page.locator('[data-design-lab-workspace]');
    const original = await stage.boundingBox();
    await page
      .getByRole('radiogroup', { name: 'Playground theme' })
      .getByRole('radio', { name: 'Dark' })
      .click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page
      .getByRole('radiogroup', { name: 'Language' })
      .getByRole('radio', { name: '中文' })
      .click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
    await expect(page).toHaveURL(/theme=light&lang=zh#controls$/);
    await expect(page.getByRole('complementary', { name: '检查器' })).toBeVisible();
    expect(await stage.boundingBox()).toEqual(original);
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

  for (const width of [390, 1024, 1440, 1920]) {
    test(`the shell keeps its content inside the viewport at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/?lang=en#controls', { waitUntil: 'domcontentloaded' });
      await expect(page.locator('[data-design-lab-region="module"]')).toBeVisible();
      const stage = page.locator('[data-design-lab-workspace]');
      expect(
        await stage.evaluate((element) => element.scrollWidth - element.clientWidth),
      ).toBeLessThanOrEqual(1);
      if (width >= 1280) {
        const explorer = page.getByRole('complementary', { name: 'Explorer' });
        const inspector = page.getByRole('complementary', { name: 'Inspector' });
        await expect(explorer).toBeVisible();
        await expect(inspector).toBeVisible();
        const bounds = await stage.boundingBox();
        expect(bounds?.width).toBeGreaterThan((await explorer.boundingBox())?.width ?? Infinity);
        expect(bounds?.width).toBeGreaterThan((await inspector.boundingBox())?.width ?? Infinity);
        expect((await explorer.boundingBox())?.height).toBe(bounds?.height);
        expect((await inspector.boundingBox())?.height).toBe(bounds?.height);
      } else {
        await expect(page.getByRole('button', { name: 'Open Explorer' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Open Inspector' })).toBeVisible();
      }
      await expectNoPageOverflow(page);
      expect(await page.evaluate(() => window.scrollY)).toBe(0);
    });
  }
});
