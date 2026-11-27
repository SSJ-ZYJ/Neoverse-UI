import { expect, test } from '@playwright/test';
import { chooseOption, showInspector } from '../../support/playground';

test.describe('playground shell navigation and links', () => {
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
    await expect(page.locator('#controls-button [data-specimen-state-row]').first()).toBeVisible();
    await expect(page.locator('[data-design-lab-region="specimen"]')).toHaveCount(0);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('[data-design-lab-workspace]')).toHaveCount(0);
  });

  test('the isolated preview link keeps its label and arrow on one line when switching to English', async ({
    page,
  }, testInfo) => {
    const mobile = testInfo.project.name === 'mobile';
    await page.goto('/?theme=light&lang=zh&fps=0#controls-button', {
      waitUntil: 'domcontentloaded',
    });
    const inspector = await showInspector(page, mobile);
    const link = inspector.locator('a[href^="/frame"]');
    await expect(link).toHaveAccessibleName('打开独立预览');
    await page.evaluate(() => document.fonts.ready.then(() => undefined));
    const measure = () =>
      link.evaluate((element) => {
        const label = element.querySelector('.truncate');
        const arrow = element.querySelector('svg');
        if (!label || !arrow) throw new Error('Preview link must have a label and arrow');
        const text = document.createRange();
        text.selectNodeContents(label);
        const box = text.getBoundingClientRect();
        return {
          width: element.getBoundingClientRect().width,
          lines: new Set(Array.from(text.getClientRects(), ({ top }) => top)).size,
          extraGap:
            arrow.getBoundingClientRect().left -
            box.right -
            Number.parseFloat(getComputedStyle(element).columnGap),
          clipped: label.scrollWidth > label.clientWidth,
        };
      });
    const before = await measure();
    expect(before.lines).toBe(1);
    expect(before.clipped).toBe(false);
    expect(before.extraGap).toBeCloseTo(0, 0);

    if (mobile) {
      await page.keyboard.press('Escape');
      await page.getByRole('button', { name: /切换语言/ }).click();
      await expect(page.locator('html')).toHaveAttribute('lang', 'en');
      await showInspector(page, mobile);
    } else {
      await page
        .getByRole('radiogroup', { name: '语言' })
        .getByRole('radio', { name: '英文' })
        .click();
    }
    await expect(link).toHaveAccessibleName('Open isolated preview');
    expect((await measure()).lines).toBe(1);
    await expect.poll(async () => (await measure()).clipped).toBe(false);
    const after = await measure();
    expect(after.lines).toBe(1);
    expect(after.clipped).toBe(false);
    expect(after.extraGap).toBeCloseTo(0, 0);
    expect(after.width).toBeGreaterThan(before.width);
  });

  test('the desktop toolbar switches theme and language without resizing the stage', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/?theme=light&lang=en#controls', { waitUntil: 'domcontentloaded' });
    const explorer = page.locator('.playground-explorer');
    const groupLabel = page.locator('.playground-explorer__section-label').first();
    const moduleLink = page.locator('.playground-explorer__module-link').first();

    // English shows one language; the Chinese interface adds an English line.
    await expect(groupLabel).toHaveText('Foundations');
    await expect(page.locator('.playground-catalogue-label__secondary')).toHaveCount(0);
    await expect(moduleLink).toHaveText('Colors');
    await expect(explorer).not.toContainText('（');
    expect(
      await explorer.evaluate((element) => element.scrollWidth - element.clientWidth),
    ).toBeLessThanOrEqual(1);

    const stage = page.locator('[data-design-lab-workspace]');
    const toolbar = page.locator('.playground-shell__toolbar');
    const original = await stage.boundingBox();
    await toolbar
      .getByRole('radiogroup', { name: 'Playground theme' })
      .getByRole('radio', { name: 'Dark' })
      .click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await toolbar
      .getByRole('radiogroup', { name: 'Language' })
      .getByRole('radio', { name: '中文' })
      .click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');

    await expect(groupLabel).toContainText('设计基础');
    await expect(groupLabel.locator('.playground-catalogue-label__secondary')).toHaveText(
      'Foundations',
    );

    const measureDisclosure = (id: string) =>
      explorer.locator(`#${id}`).evaluate((toggle) => {
        const count = toggle.querySelector('.playground-explorer__count');
        const chevron = toggle.querySelector('svg');
        if (count === null || chevron === null) throw new Error('Disclosure has no count or icon');
        const countBox = count.getBoundingClientRect();
        const iconBox = chevron.getBoundingClientRect();
        return {
          countEnd: countBox.right,
          iconCenter: iconBox.x + iconBox.width / 2,
          centerOffset: countBox.y + countBox.height / 2 - (iconBox.y + iconBox.height / 2),
        };
      });
    const disclosures = await Promise.all([
      measureDisclosure('explorer-group-materials'),
      measureDisclosure('explorer-module-shadow'),
    ]);
    const [section, module] = disclosures;
    expect(Math.abs(section.countEnd - module.countEnd)).toBeLessThan(1);
    expect(Math.abs(section.iconCenter - module.iconCenter)).toBeLessThan(1);
    for (const { centerOffset } of disclosures) expect(Math.abs(centerOffset)).toBeLessThan(1);

    await expect(moduleLink.locator('.playground-catalogue-label__secondary')).toHaveText('Colors');
    expect(
      await page
        .locator('.playground-explorer__leaf .playground-catalogue-label__secondary')
        .count(),
    ).toBeGreaterThan(0);
    await expect(explorer).not.toContainText('（');
    const measureLabel = (selector: string) =>
      explorer.locator(selector).evaluate((element) => {
        const suffix = element.querySelector('.playground-catalogue-label__secondary');
        const row = element.closest('a, button')?.getBoundingClientRect();
        if (suffix === null || row === undefined || element.firstChild === null) {
          throw new Error('Bilingual label must be laid out in a row');
        }
        const range = document.createRange();
        range.selectNodeContents(element.firstChild);
        const primary = range.getBoundingClientRect();
        range.selectNodeContents(suffix);
        const secondary = range.getBoundingClientRect();
        return {
          start: primary.left,
          secondaryStart: secondary.left,
          lineGap: secondary.top - primary.bottom,
          primarySize: Number.parseFloat(getComputedStyle(element).fontSize),
          suffixSize: Number.parseFloat(getComputedStyle(suffix).fontSize),
          inlineOverflow: secondary.right - element.getBoundingClientRect().right,
          blockOverflow: secondary.bottom - row.bottom,
        };
      });
    const labels = await Promise.all([
      measureLabel('#explorer-group-materials .playground-explorer__section-label'),
      measureLabel('a[href="#materials"] .ui-navigation-item__label'),
    ]);
    for (const label of labels) {
      expect(label.suffixSize).toBeLessThan(label.primarySize);
      expect(label.lineGap).toBeGreaterThanOrEqual(-1);
      expect(Math.abs(label.secondaryStart - label.start)).toBeLessThan(1);
      expect(label.inlineOverflow).toBeLessThan(1);
      expect(label.blockOverflow).toBeLessThan(1);
    }
    expect(Math.abs(labels[0].start - labels[1].start)).toBeLessThan(1);

    expect(
      await explorer.evaluate((element) => element.scrollWidth - element.clientWidth),
    ).toBeLessThanOrEqual(1);
    await expect(page).toHaveURL(/theme=light&lang=zh#controls$/);
    await expect(page.getByRole('complementary', { name: '检查器' })).toBeVisible();
    expect(await stage.boundingBox()).toEqual(original);
  });

  test('English Explorer labels stay complete without resizing the stage', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/?theme=dark&lang=en', { waitUntil: 'domcontentloaded' });
    const explorer = page.locator('.playground-explorer');
    await expect(explorer).toBeVisible();

    const clippedLabels = await explorer.evaluate((element) =>
      [...element.querySelectorAll('.ui-navigation-item__label')]
        .filter((label) => label.scrollWidth - label.clientWidth > 1)
        .map((label) => label.textContent?.trim() ?? ''),
    );
    expect(clippedLabels).toEqual([]);

    const stage = page.locator('[data-design-lab-workspace]');
    const original = await stage.boundingBox();
    await page
      .getByRole('radiogroup', { name: 'Language' })
      .getByRole('radio', { name: '中文' })
      .click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
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

  test('the Materials presets leaf opens its editable Inspector session', async ({
    page,
  }, testInfo) => {
    const mobile = testInfo.project.name === 'mobile';
    await page.goto('/?theme=light&lang=en#materials', { waitUntil: 'domcontentloaded' });
    if (mobile) await page.getByRole('button', { name: 'Open Explorer' }).click();
    const navigation = page.locator('[data-playground-navigation]');
    const disclosure = navigation.locator('#explorer-module-materials');
    if ((await disclosure.getAttribute('aria-expanded')) === 'false') await disclosure.click();
    const leaf = navigation.locator('a[href="#materials-surface"]');
    await expect(leaf).toBeVisible();

    await leaf.click();
    await expect(page).toHaveURL(/#materials-surface$/);
    const stage = page.locator('[data-design-lab-region="specimen"]');
    await expect(stage.locator('[data-surface="glass-subtle"]')).toBeVisible();

    const inspector = await showInspector(page, mobile);
    await chooseOption(inspector, 'surface', 'Elevated');
    await expect(stage.locator('[data-surface="elevated"]')).toBeVisible();
    await expect(stage.locator('[data-surface="glass-subtle"]')).toHaveCount(0);
    if (mobile) await page.keyboard.press('Escape');
    await expect(stage.locator('[data-surface="elevated"]')).toBeVisible();
  });

  test('differently named single specimens stay direct Explorer leaves', async ({
    page,
  }, testInfo) => {
    const mobile = testInfo.project.name === 'mobile';
    for (const [moduleId, specimenId] of [
      ['card', 'card-card'],
      ['dock', 'dock-component'],
      ['scrollbar', 'scrollbar-component'],
      ['terminal', 'terminal-composition'],
    ] as const) {
      await page.goto(`/?lang=en#${moduleId}`, { waitUntil: 'domcontentloaded' });
      if (mobile) await page.getByRole('button', { name: 'Open Explorer' }).click();
      const navigation = page.locator('[data-playground-navigation]');
      await expect(navigation.locator(`#explorer-module-${moduleId}`)).toHaveCount(0);
      const leaf = navigation.locator(`a[href="#${specimenId}"]`);
      await expect(leaf).toBeVisible();
      await leaf.click();
      await expect(page).toHaveURL(new RegExp(`#${specimenId}$`));
      await expect(page.locator(`#${specimenId}`)).toBeVisible();
    }
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
});
