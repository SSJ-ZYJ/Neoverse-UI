import { expect, type Locator, test } from '@playwright/test';
import { expectNoPageOverflow } from '../support/e2e';
import { chooseOption, showInspector, switchToChinese } from '../support/playground';

test.describe('playground', () => {
  test('empty-state Inspector filters scenarios and applies an independent appearance', async ({
    page,
  }, testInfo) => {
    await page.goto('/?theme=light&lang=en#data-display-empty-state');
    const stage = page.locator('#data-display-empty-state');
    const cases = stage.locator('[data-empty-state-case]');
    await expect(cases).toHaveCount(4);
    const mobile = testInfo.project.name === 'mobile';
    const inspector = await showInspector(page, mobile);
    const content = inspector.getByRole('group', { name: 'Content' });
    const appearance = inspector.getByRole('group', { name: 'Appearance' });
    await chooseOption(content, 'category', 'No results');
    await expect(cases).toHaveCount(1);
    const search = stage.locator('[data-empty-state-case="search"]');
    const state = search.getByRole('region');
    await expect(state).toHaveCSS('border-top-style', 'dashed');
    await chooseOption(appearance, 'variant', 'Compact row');
    await expect(state).toHaveCSS('border-top-width', '0px');
    await expect(state).toHaveCSS('min-height', '0px');
    await inspector.getByRole('button', { name: 'Reset specimen' }).click();
    await expect(cases).toHaveCount(4);
    await expect(state).toHaveCSS('border-top-style', 'dashed');
    if (mobile) await page.keyboard.press('Escape');
    await search.getByRole('button', { name: 'Clear filter' }).click();
    await expect(search.getByText('Project brief')).toBeVisible();
    await search.getByRole('button', { name: 'Restore filter' }).click();
    await expect(state).toBeVisible();
  });

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

  test('Card surface edits keep the same card and restore its component default', async ({
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
    const content = card.getByRole('heading', { name: 'Reference card' });
    const initialContent = await content.elementHandle();
    const inspector = await showInspector(page, mobile);
    await chooseOption(inspector, 'surface', 'Elevated');
    await expect(card).toHaveAttribute('data-surface', 'elevated');
    await expect(card).toHaveCSS('backdrop-filter', 'none');
    expect(await content.evaluate((node, before) => node === before, initialContent)).toBe(true);
    await chooseOption(inspector, 'surface', 'None');
    await expect(card).toHaveAttribute('data-surface', 'none');
    expect(await measureCard()).toEqual(initialGeometry);
    expect(await content.evaluate((node, before) => node === before, initialContent)).toBe(true);
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

  test('the Inspector edits a real Button and resets activation state without remounting it', async ({
    page,
  }, testInfo) => {
    const mobile = testInfo.project.name === 'mobile';
    await page.goto('/?theme=light&lang=en#controls-button', { waitUntil: 'domcontentloaded' });
    const live = page.locator('[data-design-lab-region="specimen"]');
    const button = live.locator('.ui-button');
    const inspector = page.locator('#design-lab-inspector');
    await expect(live).toBeFocused();
    await expect(page.locator('[data-design-lab-region="module"]')).toHaveCount(0);
    await expect(button).toHaveCSS('height', '36px');
    await page.keyboard.press('Tab');
    await expect(button).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(live.locator('output')).toHaveText('Activations: 1');
    const instance = await button.elementHandle();

    if (mobile) await page.locator('[data-playground-inspector-trigger]').click();
    const size = inspector.getByRole('combobox', { name: 'Size' });
    await size.press('ArrowDown');
    const large = inspector.getByRole('option', { name: 'Large' });
    await page.keyboard.press('End');
    await expect(large).toBeFocused();
    await Promise.all([
      page.waitForFunction(() => {
        const target = document.querySelector('#controls-button .ui-button');
        if (!target) return false;
        const height = Number.parseFloat(getComputedStyle(target).height);
        return height > 36 && height < 44;
      }),
      page.keyboard.press('Enter'),
    ]);
    await expect(size).toBeFocused();
    await expect(size.locator('..')).toContainText('Large');
    await expect(button).toHaveCSS('height', '44px');
    const sizeField = inspector.locator('[data-specimen-control="size"]');
    await expect(sizeField).toContainText('Modified');
    const initialRadius = await button.evaluate(
      (element) => getComputedStyle(element).borderTopLeftRadius,
    );
    await chooseOption(inspector, 'corner', 'Square');
    await expect(button).toHaveCSS('border-top-left-radius', '0px');
    await chooseOption(inspector, 'corner', 'Pill');
    await expect(button).not.toHaveCSS('border-top-left-radius', initialRadius);
    await expect(button).toHaveCSS('height', '44px');
    await chooseOption(inspector, 'surface', 'None');
    await expect(button).toHaveCSS('backdrop-filter', 'none');
    await chooseOption(inspector, 'variant', 'Success');
    await expect(button).toHaveAccessibleName('Mark complete');
    await expect(live.locator('output')).toHaveText('Activations: 1');
    const disabled = inspector.getByRole('switch', { name: 'Disabled' });
    await disabled.press('Space');
    await expect(button).toBeDisabled();
    await disabled.press('Space');
    await expect(button).toBeEnabled();
    await inspector.getByRole('switch', { name: 'Loading' }).press('Space');
    await expect(button).toBeDisabled();
    await expect(button).toHaveAttribute('aria-busy', 'true');

    await inspector.getByRole('button', { name: 'Reset specimen' }).press('Enter');
    if (mobile) await page.keyboard.press('Escape');
    await expect(button).toBeEnabled();
    await expect(button).toHaveAccessibleName('Run example');
    await expect(button).toHaveCSS('height', '36px');
    await expect(button).toHaveCSS('border-top-left-radius', initialRadius);
    await expect(sizeField).not.toContainText('Modified');
    await expect(live.locator('output')).toHaveText('Activations: 0');
    expect(await button.evaluate((node, initialNode) => node === initialNode, instance)).toBe(true);
  });

  test('the Inspector switches an appearance variant on a presentational component', async ({
    page,
  }, testInfo) => {
    const mobile = testInfo.project.name === 'mobile';
    await page.goto('/?theme=light&lang=en#status-feedback-badge', {
      waitUntil: 'domcontentloaded',
    });
    const badge = page.locator('[data-design-lab-region="specimen"] .ui-badge');
    await expect(badge).toHaveText('Neutral');
    const inspector = await showInspector(page, mobile);
    await expect(inspector.locator('[data-specimen-control="variant"]')).toBeVisible();
    await chooseOption(inspector, 'variant', 'Danger');
    await expect(badge).toHaveText('Danger');
    await expect(badge).toHaveClass(/ui-badge--danger/);
    await inspector.getByRole('button', { name: 'Reset specimen' }).click();
    await expect(badge).toHaveText('Neutral');
    await expect(badge).toHaveClass(/ui-badge--neutral/);
  });

  test('a reload returns an edited specimen to its initial state', async ({ page }, testInfo) => {
    const mobile = testInfo.project.name === 'mobile';
    await page.goto('/?theme=light&lang=en#status-feedback-badge', {
      waitUntil: 'domcontentloaded',
    });
    const badge = page.locator('[data-design-lab-region="specimen"] .ui-badge');
    await expect(badge).toHaveText('Neutral');
    await chooseOption(await showInspector(page, mobile), 'variant', 'Danger');
    await expect(badge).toHaveText('Danger');

    // Editing is page-lifetime state: a reload must not resurrect the previous
    // selection from the shared preference record.
    await page.reload();
    await expect(badge).toHaveText('Neutral');
    await expect(badge).toHaveClass(/ui-badge--neutral/);
  });

  test('the Inspector and SegmentedControl share a selection and honor disabled options', async ({
    page,
  }, testInfo) => {
    const mobile = testInfo.project.name === 'mobile';
    await page.goto('/?lang=en#controls-segmented-control', { waitUntil: 'domcontentloaded' });
    const live = page.locator('#controls-segmented-control');
    const overview = live.getByRole('radio', { name: 'Overview' });
    const activity = live.getByRole('radio', { name: 'Activity' });
    await expect(live.getByRole('radio', { name: 'Details' })).toBeDisabled();
    await overview.press('ArrowRight');
    await expect(activity).toBeChecked();
    await expect(activity).toBeFocused();

    const inspector = await showInspector(page, mobile);
    const selected = inspector.getByRole('combobox', { name: 'Selected option' });
    await expect(selected).toHaveText('Activity');
    await chooseOption(inspector, 'modelValue', 'Overview');
    const disabled = inspector.getByRole('switch', { name: 'Disabled' });
    await disabled.press('Space');
    await expect(selected).toBeDisabled();
    if (mobile) await page.keyboard.press('Escape');
    await expect(overview).toBeChecked();
    await expect(activity).toBeDisabled();

    await showInspector(page, mobile);
    await inspector.getByRole('button', { name: 'Reset specimen' }).click();
    if (mobile) await page.keyboard.press('Escape');
    await expect(activity).toBeEnabled();
    await expect(overview).toBeChecked();
  });
});
