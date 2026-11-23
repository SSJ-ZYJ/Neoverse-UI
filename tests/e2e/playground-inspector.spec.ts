import { expect, type Locator, test } from '@playwright/test';
import { expectNoPageOverflow } from '../support/e2e';
import { chooseOption, showInspector, switchToChinese } from '../support/playground';

test.describe('playground', () => {
  test('preview and Inspector edits are discarded when Explorer history changes specimen', async ({
    page,
  }, testInfo) => {
    const mobile = testInfo.project.name === 'mobile';
    await page.goto('/?lang=en#forms-input', { waitUntil: 'domcontentloaded' });
    const live = page.locator('[data-design-lab-region="specimen"]');
    const input = live.locator('input');
    await live.getByRole('textbox').fill('From the stage');
    const inspector = await showInspector(page, mobile);
    const value = inspector.getByRole('textbox', { name: 'Value' });
    await expect(value).toHaveValue('From the stage');
    await value.fill('From the Inspector');
    await expect(input).toHaveValue('From the Inspector');
    await chooseOption(inspector, 'validation', 'Error');
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(input).toHaveValue('From the Inspector');
    await inspector.getByRole('switch', { name: 'Read-only' }).press('Space');
    await expect(input).toHaveAttribute('readonly', '');
    await expect(value).toBeDisabled();
    if (mobile) await page.keyboard.press('Escape');
    await input.press('a');
    await expect(input).toHaveValue('From the Inspector');

    if (mobile) await page.locator('[data-playground-nav-trigger]').click();
    const explorer = page.locator('[data-playground-navigation]');
    await explorer.locator('a[href="#forms-select"]').click();
    await expect(page.locator('#forms-select')).toBeFocused();
    await expect(live).toBeVisible();
    await expect(page.locator('#forms-input')).toHaveCount(0);
    await showInspector(page, mobile);
    await expect(inspector.getByRole('combobox', { name: 'Value' })).toHaveText('Native');
    if (mobile) await page.keyboard.press('Escape');
    const runtime = live.getByRole('combobox');
    await expect(runtime).toHaveText('Native');
    await runtime.press('Enter');
    await live.getByRole('option', { name: 'Remote' }).click();
    await expect(runtime).toHaveText('Remote');
    await showInspector(page, mobile);
    await expect(inspector.getByRole('combobox', { name: 'Value' })).toHaveText('Remote');
    if (mobile) await page.keyboard.press('Escape');
    await page.goBack();
    await expect(page).toHaveURL(/#forms-input$/);
    await expect(live).toBeFocused();
    await expect(input).toHaveValue('Neoverse Studio');
    await expect(input).not.toHaveAttribute('aria-invalid', 'true');
    await expect(input).toBeEditable();
    await page.goForward();
    await expect(page).toHaveURL(/#forms-select$/);
    await expect(page.locator('#forms-select')).toBeFocused();
    await expect(runtime).toHaveText('Native');
    await showInspector(page, mobile);
    await expect(inspector.getByRole('combobox', { name: 'Value' })).toHaveText('Native');
    if (mobile) {
      await page.keyboard.press('Escape');
      await page.locator('[data-playground-nav-trigger]').click();
    }
    await explorer.locator('#explorer-module-data-display').click();
    await explorer.locator('a[href="#data-display-timeline"]').click();
    await expect(live).toBeFocused();
    await showInspector(page, mobile);
    await expect(
      inspector.getByText('This specimen is read-only.', { exact: false }),
    ).toBeVisible();
    await expect(inspector.locator('[data-specimen-control]')).toHaveCount(0);
  });

  test('Select synchronizes with the Inspector and resets without remounting', async ({
    page,
  }, testInfo) => {
    const mobile = testInfo.project.name === 'mobile';
    await page.goto('/?theme=light&lang=en#forms-select', { waitUntil: 'domcontentloaded' });
    const live = page.locator('#forms-select');
    const runtime = live.locator('[data-form-select]');
    await runtime.press('ArrowDown');
    const remote = live.getByRole('option', { name: 'Remote' });
    await page.keyboard.press('End');
    await expect(remote).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(runtime).toBeFocused();
    await expect(runtime).toHaveText('Remote');
    const instance = await runtime.elementHandle();

    const inspector = await showInspector(page, mobile);
    const valueField = inspector.locator('[data-specimen-control="modelValue"]');
    const value = valueField.getByRole('combobox');
    await expect(value).toHaveText('Remote');
    await expect(valueField).toContainText('Modified');
    await chooseOption(inspector, 'modelValue', 'Native');
    await expect(runtime).toHaveText('Native');
    await expect(valueField).not.toContainText('Modified');
    await chooseOption(inspector, 'modelValue', 'Remote');
    await expect(runtime).toHaveText('Remote');

    for (const name of ['Disabled', 'Read-only']) {
      const toggle = inspector.getByRole('switch', { name });
      await toggle.press('Space');
      await expect(value).toBeDisabled();
      await expect(runtime).toBeDisabled();
      if (mobile) await page.keyboard.press('Escape');
      await runtime.press('ArrowDown');
      await runtime.click({ force: true });
      await expect(runtime).toHaveAttribute('aria-expanded', 'false');
      await expect(runtime).toHaveText('Remote');
      await showInspector(page, mobile);
      await toggle.press('Space');
      await expect(value).toBeEnabled();
      await expect(runtime).toBeEnabled();
      await expect(value).toHaveText('Remote');
    }

    if (mobile) await page.keyboard.press('Escape');
    await switchToChinese(page, mobile);
    await expect(runtime).toHaveText('远程');
    await showInspector(page, mobile);
    await expect(value).toHaveText('远程');
    await inspector
      .locator('[data-specimen-control="readonly"]')
      .getByRole('switch')
      .press('Space');
    const reset = inspector.getByRole('button', { name: '重置示例' });
    await reset.press('Enter');
    await expect(reset).toBeFocused();
    await expect(value).toBeEnabled();
    await expect(value).toHaveText('原生');
    await expect(runtime).toBeEnabled();
    await expect(runtime).toHaveText('原生');
    expect(await runtime.evaluate((node, initialNode) => node === initialNode, instance)).toBe(
      true,
    );
  });

  test('Checkbox shares its checked state and keeps disabled edits until reset or navigation', async ({
    page,
  }, testInfo) => {
    const mobile = testInfo.project.name === 'mobile';
    const url = '/?theme=dark&lang=en';
    await page.goto(`${url}#forms-checkbox`, { waitUntil: 'domcontentloaded' });
    const live = page.locator('#forms-checkbox');
    const checkbox = live.getByRole('checkbox');
    const label = live.getByText('Release notifications');
    await expect(checkbox).toBeChecked();
    await label.click({ force: true });
    await expect(checkbox).not.toBeChecked();
    const instance = await checkbox.elementHandle();

    const inspector = await showInspector(page, mobile);
    const checked = inspector.getByRole('switch', { name: 'Checked' });
    const disabled = inspector.getByRole('switch', { name: 'Disabled' });
    await expect(checked).not.toBeChecked();
    await checked.press('Space');
    await expect(checkbox).toBeChecked();
    if (mobile) await page.keyboard.press('Escape');
    await checkbox.press('Space');
    await expect(checkbox).toBeFocused();
    await expect(checkbox).not.toBeChecked();
    await showInspector(page, mobile);
    await expect(checked).not.toBeChecked();

    await disabled.press('Space');
    await expect(checked).toBeDisabled();
    await expect(checkbox).toBeDisabled();
    if (mobile) await page.keyboard.press('Escape');
    await label.click({ force: true });
    await live.focus();
    await page.keyboard.press('Tab');
    await expect(checkbox).not.toBeFocused();
    await expect(checkbox).not.toBeChecked();
    await showInspector(page, mobile);
    await disabled.press('Space');
    await expect(checked).toBeEnabled();
    await expect(checkbox).toBeEnabled();
    await expect(checkbox).not.toBeChecked();
    await disabled.press('Space');

    const reset = inspector.getByRole('button', { name: 'Reset specimen' });
    await reset.press('Enter');
    await expect(reset).toBeFocused();
    await expect(checked).toBeChecked();
    await expect(checkbox).toBeChecked();
    await expect(checkbox).toBeEnabled();
    expect(await checkbox.evaluate((node, initialNode) => node === initialNode, instance)).toBe(
      true,
    );

    await checked.press('Space');
    await disabled.press('Space');
    if (mobile) await page.keyboard.press('Escape');
    await page.goto(`${url}#forms-choice-controls`);
    const aggregate = page.locator('#forms-choice-controls').getByRole('checkbox');
    await expect(aggregate).toBeChecked();
    await expect(aggregate).toBeEnabled();
    await aggregate.press('Space');
    await expect(aggregate).not.toBeChecked();
    await page.goBack();
    await expect(live).toBeFocused();
    await expect(checkbox).toBeChecked();
    await expect(checkbox).toBeEnabled();
    await page.goForward();
    await expect(aggregate).toBeChecked();
  });

  test('Tabs keep keyboard selection, the panel and the indicator in sync with the Inspector', async ({
    page,
  }, testInfo) => {
    const mobile = testInfo.project.name === 'mobile';
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/?theme=light&lang=en#data-display-tabs', { waitUntil: 'domcontentloaded' });
    const live = page.locator('#data-display-tabs');
    const tablist = live.getByRole('tablist');
    const overview = tablist.getByRole('tab', { name: 'Overview' });
    const activity = tablist.getByRole('tab', { name: 'Activity' });
    const disabled = tablist.getByRole('tab', { name: 'Disabled' });
    const panel = live.getByRole('tabpanel');
    await expect(disabled).toBeDisabled();
    await overview.focus();
    for (const [key, selected, value] of [
      ['ArrowRight', activity, 'activity'],
      ['ArrowLeft', overview, 'overview'],
      ['End', activity, 'activity'],
      ['Home', overview, 'overview'],
    ] as const) {
      await page.keyboard.press(key);
      await expect(selected).toBeFocused();
      await expect(selected).toHaveAttribute('tabindex', '0');
      await expect(selected).toHaveAttribute('aria-selected', 'true');
      await expect(panel).toHaveText(value);
    }
    await expect(disabled).toHaveAttribute('aria-selected', 'false');
    await activity.click();
    await expect(panel).toHaveAccessibleName('Activity');
    const indicator = live.locator('.ui-tabs__indicator');
    const instance = await tablist.elementHandle();
    const indicatorInstance = await indicator.elementHandle();
    await expect(indicator).toHaveAttribute('data-ready', 'true');
    const indicatorDistance = async (tab: Locator) => {
      const [plate, target] = await Promise.all([indicator.boundingBox(), tab.boundingBox()]);
      return plate && target ? Math.abs(plate.x - target.x) : Infinity;
    };
    await expect.poll(() => indicatorDistance(activity)).toBeLessThanOrEqual(1);

    const inspector = await showInspector(page, mobile);
    const editor = inspector.locator('[data-specimen-control="modelValue"]');
    const selected = editor.getByRole('combobox');
    await expect(selected).toHaveText('Activity');
    await selected.press('ArrowDown');
    await expect(editor.getByRole('option')).toHaveCount(2);
    await editor.getByRole('option', { name: 'Overview' }).click();
    await expect(selected).toBeFocused();
    await expect(overview).toHaveAttribute('aria-selected', 'true');
    await expect(panel).toHaveAccessibleName('Overview');
    await expect(panel).toHaveText('overview');
    await expect.poll(() => indicatorDistance(overview)).toBeLessThanOrEqual(1);
    await chooseOption(inspector, 'modelValue', 'Activity');
    if (mobile) await page.keyboard.press('Escape');

    const dark = mobile
      ? page.getByRole('button', { name: /Cycle theme/ })
      : page
          .getByRole('radiogroup', { name: 'Playground theme' })
          .getByRole('radio', { name: 'Dark' });
    await dark.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await switchToChinese(page, mobile);
    await expect(tablist.getByRole('tab', { name: '动态', selected: true })).toBeVisible();
    await showInspector(page, mobile);
    await expect(selected).toHaveText('动态');
    const reset = inspector.getByRole('button', { name: '重置示例' });
    await reset.press('Enter');
    await expect(reset).toBeFocused();
    await expect(selected).toHaveText('概览');
    await expect(panel).toHaveAccessibleName('概览');
    expect(await tablist.evaluate((node, before) => node === before, instance)).toBe(true);
    expect(await indicator.evaluate((node, before) => node === before, indicatorInstance)).toBe(
      true,
    );

    await chooseOption(inspector, 'modelValue', '动态');
    if (mobile) await page.keyboard.press('Escape');
    await page.goto(new URL('#data-display-avatar', page.url()).href);
    const avatar = page.locator('#data-display-avatar');
    await expect(avatar).toBeFocused();
    await page.goBack();
    await expect(live).toBeFocused();
    await expect(tablist.getByRole('tab', { name: '概览', selected: true })).toBeVisible();
    await expect(panel).toHaveText('overview');
    await page.goForward();
    await expect(avatar).toBeFocused();
  });

  test('Card surface edits restore the component default and respect reduced transparency', async ({
    page,
  }, testInfo) => {
    const mobile = testInfo.project.name === 'mobile';
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/?theme=dark&lang=en#card-card', { waitUntil: 'domcontentloaded' });
    const live = page.locator('#card-card');
    const card = live.locator('article');
    await expect(card).toHaveAttribute('data-surface', 'glass-elevated');
    await expect(card).toHaveCSS('backdrop-filter', /blur\(/);
    await expect(live.locator('.playground-stage__specimen-content')).toHaveCSS(
      'animation-name',
      'none',
    );
    await page.evaluate(() => document.fonts.ready.then(() => undefined));
    const measureCard = () =>
      card.evaluate((element) => {
        const { x, y, width, height } = element.getBoundingClientRect();
        const { borderTopWidth, borderBottomWidth } = getComputedStyle(element);
        return {
          width,
          centerX: x + width / 2,
          centerY: y + height / 2,
          heightInsideBorder: height - parseFloat(borderTopWidth) - parseFloat(borderBottomWidth),
        };
      });
    const initialGeometry = await measureCard();
    const inspector = await showInspector(page, mobile);
    await chooseOption(inspector, 'surface', 'None');
    await expect(card).toHaveAttribute('data-surface', 'none');
    expect(await measureCard()).toEqual(initialGeometry);
    await chooseOption(inspector, 'surface', 'Component default');
    await expect(card).toHaveAttribute('data-surface', 'glass-elevated');
    if (mobile) await page.keyboard.press('Escape');

    const client = await page.context().newCDPSession(page);
    await client.send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }],
    });
    await expect(card).toHaveCSS('backdrop-filter', 'none');
    await expect(page.locator('[data-neoverse-glass-renderer-canvas]')).toHaveCount(0);
    await expect(card).toContainText('Reference card');
  });

  test('Dock selection and its shared indicator follow real navigation and Inspector edits', async ({
    page,
  }, testInfo) => {
    const mobile = testInfo.project.name === 'mobile';
    await page.goto('/?lang=en#dock-component', { waitUntil: 'domcontentloaded' });
    const dock = page.locator('#dock-component nav');
    const projects = dock.getByRole('button', { name: 'Projects' });
    await projects.press('Enter');
    await expect(projects).toHaveAttribute('aria-current', 'location');
    await expect(dock).toHaveAttribute('data-neoverse-navigation-indicator-ready', 'true');

    const inspector = await showInspector(page, mobile);
    await expect(inspector.getByRole('combobox', { name: 'Active destination' })).toHaveText(
      'Projects',
    );
    await chooseOption(inspector, 'destination', 'Focus');
    await inspector.getByRole('switch', { name: 'Navigation indicator' }).press('Space');
    await expect(dock.locator('.ui-control-surface__indicator')).toHaveCount(0);
    await inspector.getByRole('switch', { name: 'Compact' }).press('Space');
    if (mobile) await page.keyboard.press('Escape');
    await expect(dock.getByRole('button', { name: 'Focus' })).toHaveAttribute(
      'aria-current',
      'location',
    );
    await expect(projects).not.toHaveAttribute('aria-current', 'location');
    await expectNoPageOverflow(page);
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
    await expect(page.locator('#controls-button [data-specimen-state-row]').first()).toBeVisible();
    await expect(page.locator('[data-design-lab-region="specimen"]')).toHaveCount(0);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('[data-design-lab-workspace]')).toHaveCount(0);
  });

  test('the desktop toolbar switches theme and language without resizing the stage', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/?theme=light&lang=en#controls', { waitUntil: 'domcontentloaded' });
    const explorer = page.locator('.playground-explorer');
    const groupLabel = page.locator('.playground-explorer__section-label').first();
    const moduleLink = page.locator('.playground-explorer__module-link').first();

    // The muted second line is a Chinese reading aid; English shows one language.
    await expect(groupLabel.locator('.playground-catalogue-label > span').first()).toHaveText(
      'Foundations',
    );
    await expect(page.locator('.playground-catalogue-label__secondary')).toHaveCount(0);
    await expect(moduleLink).toHaveText('Colors');
    await expect(explorer).not.toContainText('（');
    expect(
      await explorer.evaluate((element) => element.scrollWidth - element.clientWidth),
    ).toBeLessThanOrEqual(1);

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

    const primaryLabel = groupLabel.locator('.playground-catalogue-label > span').first();
    const secondaryLabel = groupLabel.locator('.playground-catalogue-label__secondary');
    await expect(primaryLabel).toHaveText('设计基础');
    await expect(secondaryLabel).toHaveText('Foundations');
    const primarySize = await primaryLabel.evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).fontSize),
    );
    const secondarySize = await secondaryLabel.evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).fontSize),
    );
    expect(secondarySize).toBeLessThan(primarySize);
    const primaryBox = await primaryLabel.boundingBox();
    const secondaryBox = await secondaryLabel.boundingBox();
    if (primaryBox === null || secondaryBox === null) throw new Error('The label must be laid out');
    expect(secondaryBox.y).toBeGreaterThanOrEqual(primaryBox.y + primaryBox.height - 1);

    const heading = page.locator('.playground-explorer__section-toggle').first();
    const headingCenters = await heading.evaluate((toggle) => {
      const first = toggle.querySelector('.playground-catalogue-label > span:first-child');
      const count = toggle.querySelector('.playground-explorer__count');
      if (!(first instanceof HTMLElement) || !(count instanceof HTMLElement)) return null;
      const firstBox = first.getBoundingClientRect();
      const countBox = count.getBoundingClientRect();
      return {
        first: (firstBox.top + firstBox.bottom) / 2,
        count: (countBox.top + countBox.bottom) / 2,
      };
    });
    if (headingCenters === null) throw new Error('The heading count must be laid out');
    expect(Math.abs(headingCenters.count - headingCenters.first)).toBeLessThan(2);

    const headingRightEdges = await heading.evaluate((toggle) => {
      const chevron = toggle.querySelector('.playground-explorer__chevron');
      const disclosure = document.querySelector('.playground-explorer__disclosure');
      if (!(chevron instanceof Element) || !(disclosure instanceof Element)) return null;
      return {
        chevron: chevron.getBoundingClientRect().right,
        disclosure: disclosure.getBoundingClientRect().right,
      };
    });
    if (headingRightEdges === null) {
      throw new Error('The heading chevron and module disclosure must be laid out');
    }
    expect(Math.abs(headingRightEdges.chevron - headingRightEdges.disclosure)).toBeLessThan(2);

    await expect(moduleLink.locator('.playground-catalogue-label__secondary')).toHaveText('Colors');
    expect(
      await page
        .locator('.playground-explorer__leaf .playground-catalogue-label__secondary')
        .count(),
    ).toBeGreaterThan(0);
    await expect(explorer).not.toContainText('（');
    const suffixAlignment = await moduleLink.evaluate((link) => {
      const label = link.querySelector('.ui-navigation-item__label');
      const suffix = link.querySelector('.playground-catalogue-label__secondary');
      if (!(label instanceof HTMLElement) || !(suffix instanceof HTMLElement)) return null;
      const range = document.createRange();
      range.selectNodeContents(label.firstChild as Node);
      const primary = range.getBoundingClientRect();
      const secondary = suffix.getBoundingClientRect();
      return {
        primaryFontSize: Number.parseFloat(getComputedStyle(label).fontSize),
        suffixFontSize: Number.parseFloat(getComputedStyle(suffix).fontSize),
        primaryBottom: primary.bottom,
        primaryCenter: (primary.top + primary.bottom) / 2,
        suffixBottom: secondary.bottom,
        suffixCenter: (secondary.top + secondary.bottom) / 2,
      };
    });
    if (suffixAlignment === null) throw new Error('The link suffix must be laid out');
    expect(suffixAlignment.suffixFontSize).toBeLessThan(suffixAlignment.primaryFontSize);
    expect(Math.abs(suffixAlignment.suffixBottom - suffixAlignment.primaryBottom)).toBeLessThan(2);
    expect(suffixAlignment.suffixCenter).toBeGreaterThan(suffixAlignment.primaryCenter);

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
