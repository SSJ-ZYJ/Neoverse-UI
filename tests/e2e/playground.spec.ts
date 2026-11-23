import { expect, test } from '@playwright/test';
import { expectNoPageOverflow } from '../support/e2e';
import { chooseOption, showInspector } from '../support/playground';

test.describe('playground', () => {
  test('the explorer opens a module overview before disclosing its specimens', async ({
    page,
  }, testInfo) => {
    await page.goto('/?lang=en', { waitUntil: 'domcontentloaded' });
    const mobile = testInfo.project.name === 'mobile';
    const openExplorer = async () => {
      if (mobile) await page.getByRole('button', { name: 'Open Explorer' }).click();
    };
    await openExplorer();
    const explorer = page.locator('[data-playground-navigation]');
    await expect(explorer.locator('a[href="#data-display-tabs"]')).toBeHidden();

    await explorer.locator('a[href="#data-display"]').click();
    await expect(page).toHaveURL(/#data-display$/);
    await expect(page.locator('[data-design-lab-region="module"]')).toBeVisible();

    await openExplorer();
    await expect(explorer.locator('a[href="#data-display-tabs"]')).toBeVisible();
    await explorer.locator('a[href="#data-display-tabs"]').click();
    await expect(page).toHaveURL(/#data-display-tabs$/);
    await expect(page.locator('[data-design-lab-region="specimen"]')).toBeVisible();
    await expect(page.locator('#data-display-tabs')).toBeVisible();
    await expect(page.locator('#data-display-avatar')).toHaveCount(0);

    // A module with one browsable specimen is a single destination instead of
    // a disclosure that would repeat the same label one level deeper.
    await openExplorer();
    await expect(explorer.locator('#explorer-module-card')).toHaveCount(0);
    await explorer.locator('a[href="#card"]').click();
    await expect(page).toHaveURL(/#card$/);
    await expect(page.locator('[data-design-lab-region="module"]')).toBeVisible();
  });

  test('Explorer hides redundant aggregate comparisons while preserving individual component entries', async ({
    page,
  }, testInfo) => {
    await page.goto('/?lang=en', { waitUntil: 'domcontentloaded' });
    if (testInfo.project.name === 'mobile') {
      await page.getByRole('button', { name: 'Open Explorer' }).click();
    }
    const explorer = page.locator('[data-playground-navigation]');
    await explorer.locator('#explorer-module-forms').click();
    await expect(explorer.locator('a[href="#forms-choice-controls"]')).toHaveCount(0);
    await expect(explorer.locator('a[href="#forms-checkbox"]')).toBeVisible();
    await expect(explorer.locator('a[href="#forms-radio-group"]')).toBeVisible();
    await expect(explorer.locator('a[href="#forms-switch"]')).toBeVisible();

    await explorer.locator('#explorer-module-layout-shape').click();
    await expect(explorer.locator('a[href="#foundation-layout-shape"]')).toHaveCount(0);
    await expect(explorer.locator('a[href="#layout-shape-spacing"]')).toBeVisible();
    await expect(explorer.locator('a[href="#layout-shape-radius"]')).toBeVisible();
    await expect(explorer.locator('a[href="#layout-shape-border"]')).toBeVisible();
  });

  test('the Explorer selection bar shares the accent of its plate', async ({ page }, testInfo) => {
    await page.goto('/?lang=en#controls-navigation-item', { waitUntil: 'domcontentloaded' });
    if (testInfo.project.name === 'mobile') {
      await page.getByRole('button', { name: 'Open Explorer' }).click();
    }
    // Module rows mark the page, specimen rows mark the location within it.
    const active = page.locator('.playground-explorer__link[aria-current]').first();
    await expect(active).toBeVisible();

    const colors = await active.evaluate((node) => {
      const probe = document.createElement('span');
      probe.style.color = 'var(--neoverse-color-accent-primary)';
      document.body.append(probe);
      const accent = getComputedStyle(probe).color;
      probe.remove();
      const bar = node.querySelector('.ui-navigation-item__indicator');
      return { accent, bar: bar === null ? null : getComputedStyle(bar).backgroundColor };
    });

    // The Explorer owns a blue selection plate, so its start rail must resolve
    // the same accent. The library default pairs the mint plate with the mint
    // bar; a surface that retunes one retunes the other.
    expect(colors.bar).toBe(colors.accent);
  });
  for (const [selected, absent] of [
    ['controls-icon-button', 'controls-action'],
    ['forms-textarea', 'forms-select'],
    ['status-feedback-notice', 'status-feedback-toast'],
    ['data-display-step-flow', 'data-display-tabs'],
    ['foundation-prose', 'typography-scale'],
    ['foundation-motion-width', 'foundation-motion-page'],
    ['composition-project-card', 'composition-control-cluster'],
    ['composition-reading', 'composition-docs-content-surface'],
  ] as const) {
    test(`opens only the selected specimen: ${selected}`, async ({ page }) => {
      await page.goto(`/?lang=en#${selected}`, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('[data-design-lab-region="specimen"]')).toBeVisible();
      await expect(page.locator(`#${selected}`)).toBeVisible();
      await expect(page.locator(`#${absent}`)).toHaveCount(0);
    });
  }

  test('the focused stage remains a plain canvas in both themes', async ({ page }) => {
    for (const theme of ['light', 'dark'] as const) {
      await page.goto(`/?theme=${theme}&lang=en#forms-textarea`, {
        waitUntil: 'domcontentloaded',
      });
      await expect(page.locator('#forms-textarea')).toBeVisible();
      const workspace = page.locator('[data-design-lab-workspace]');
      expect(await workspace.evaluate((element) => getComputedStyle(element).backgroundImage)).toBe(
        'none',
      );
      expect(
        await page
          .locator('.playground-shell')
          .evaluate((element) => getComputedStyle(element).backgroundImage),
      ).toBe('none');
      await expect(
        workspace.locator('.playground-material-backdrop, [data-qa-matrix]'),
      ).toHaveCount(0);
      await expect(workspace.locator('.ui-textarea')).toHaveCount(1);
      await expect(workspace.locator('.ui-input, .ui-select')).toHaveCount(0);
    }
  });

  test('the stage background switcher repaints the workspace and survives a reload', async ({
    page,
  }) => {
    await page.goto('/?theme=light&lang=en#forms-textarea', { waitUntil: 'domcontentloaded' });
    const workspace = page.locator('[data-design-lab-workspace]');
    const control = page.getByRole('radiogroup', { name: 'Stage background' });
    await expect(control).toBeVisible();
    await expect(workspace).toHaveAttribute('data-stage-background', 'canvas');
    expect(await workspace.evaluate((element) => getComputedStyle(element).backgroundImage)).toBe(
      'none',
    );

    await control.getByRole('radio', { name: 'Gradient' }).click();
    await expect(workspace).toHaveAttribute('data-stage-background', 'gradient');
    expect(
      await workspace.evaluate((element) => getComputedStyle(element).backgroundImage),
    ).toContain('radial-gradient');

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(workspace).toHaveAttribute('data-stage-background', 'gradient');
    await expect(control.getByRole('radio', { name: 'Gradient' })).toHaveAttribute(
      'aria-checked',
      'true',
    );

    await control.getByRole('radio', { name: 'Solid' }).click();
    await expect(workspace).toHaveAttribute('data-stage-background', 'canvas');
  });

  test('the stage move handle moves the specimen and Home recenters it', async ({ page }) => {
    // The entrance animation offsets the content for its first frames; reduced
    // motion keeps the measured centre stable for the recenter assertion.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/?theme=light&lang=en#controls-button', { waitUntil: 'domcontentloaded' });
    const movable = page.locator('.playground-stage__specimen-content > *');
    const grip = page.locator('[data-stage-move-handle]');
    await expect(grip).toBeVisible();
    const before = await movable.boundingBox();
    const handle = await grip.boundingBox();
    if (before === null || handle === null) throw new Error('Missing stage geometry');

    await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
    await page.mouse.down();
    await page.mouse.move(handle.x + handle.width / 2 + 48, handle.y + handle.height / 2 + 36, {
      steps: 6,
    });
    await page.mouse.up();

    const moved = await movable.boundingBox();
    expect(moved?.x ?? 0).toBeGreaterThan(before.x + 24);
    expect(moved?.y ?? 0).toBeGreaterThan(before.y + 16);

    await grip.focus();
    await page.keyboard.press('Home');
    await expect
      .poll(async () => {
        const box = await movable.boundingBox();
        if (box === null) return Number.POSITIVE_INFINITY;
        return Math.max(Math.abs(box.x - before.x), Math.abs(box.y - before.y));
      })
      .toBeLessThan(2);
  });

  for (const [id, selector] of [
    ['controls-icon-button', '.ui-icon-button'],
    ['controls-action', '.ui-action'],
    ['status-feedback-badge', '.ui-badge'],
    ['status-feedback-indicator', '.ui-status-indicator'],
    ['status-feedback-skeleton', '.ui-skeleton'],
    ['status-feedback-notice', '.ui-notice'],
    ['status-feedback-tooltip', '.ui-tooltip-surface'],
    ['data-display-avatar', '.ui-avatar'],
    ['data-display-stat-card', '.ui-stat-card'],
    ['data-display-disclosure', '.ui-disclosure'],
    ['forms-select', '.ui-select'],
    ['forms-field-states', '.ui-field'],
  ] as const) {
    test(`a focused ${id} mounts only one representative component`, async ({ page }) => {
      await page.goto(`/?lang=en#${id}`, { waitUntil: 'domcontentloaded' });
      const stage = page.locator('[data-design-lab-region="specimen"]');
      await expect(stage).toBeVisible();
      await expect(stage.locator(selector)).toHaveCount(1);
      await expect(stage.locator('.playground-material-backdrop, [data-qa-matrix]')).toHaveCount(0);
    });
  }

  test('new foundation leaves show their own content and keep a usable width', async ({ page }) => {
    for (const id of [
      'layout-shape-spacing',
      'layout-shape-radius',
      'layout-shape-border',
      'shadow-primitive',
      'shadow-alias',
      'materials-glass',
      'data-display-step-flow',
    ]) {
      await page.goto(`/?lang=en#${id}`, { waitUntil: 'domcontentloaded' });
      const specimen = page.locator(`#${id}`);
      await expect(specimen).toBeVisible();
      expect((await specimen.boundingBox())?.width).toBeGreaterThan(0);
    }
  });

  test('the isolated frame keeps diagnostic backdrops and the complete form matrix', async ({
    page,
  }) => {
    await page.goto('/frame?theme=light&lang=en#forms-input', {
      waitUntil: 'domcontentloaded',
    });
    await expect(page.locator('[data-qa-matrix]')).toBeVisible();
    await expect(page.locator('[data-qa-stage="gradient"]')).toBeVisible();
    await expect(page.locator('[data-qa-stage="neutral"]')).toBeVisible();
    await expect(page.locator('[data-qa-stage="reduced"]')).toBeVisible();
    await expect(page.locator('[data-form-input]')).toBeVisible();
  });
  test('individual choice controls are independent while the combined fixture remains available', async ({
    page,
  }) => {
    for (const [id, target, unrelated] of [
      ['forms-checkbox', 'data-form-checkbox', 'data-form-radio-group'],
      ['forms-radio-group', 'data-form-radio-group', 'data-form-switch'],
      ['forms-switch', 'data-form-switch', 'data-form-checkbox'],
    ] as const) {
      await page.goto(`/?lang=en#${id}`, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('[data-design-lab-region="specimen"]')).toBeVisible();
      await expect(page.locator(`#${id}`)).toBeAttached();
      await expect(page.locator(`[${target}]`)).toHaveCount(1);
      await expect(page.locator(`[${unrelated}]`)).toHaveCount(0);
    }
    await page.goto('/frame?theme=light&lang=en#forms-choice-controls', {
      waitUntil: 'domcontentloaded',
    });
    for (const fixture of ['data-form-checkbox', 'data-form-radio-group', 'data-form-switch']) {
      await expect(page.locator(`[${fixture}]`)).toHaveCount(1);
    }
  });

  test('Popover and DropdownMenu have separate leaf previews without changing overlay fixtures', async ({
    page,
  }) => {
    await page.goto('/?lang=en#overlays-popover', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-overlay-popover]')).toBeVisible();
    await expect(page.locator('[data-overlay-dropdown]')).toHaveCount(0);

    await page.goto('/?lang=en#overlays-dropdown-menu', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-overlay-dropdown]')).toBeVisible();
    await expect(page.locator('[data-overlay-popover]')).toHaveCount(0);

    await page.goto('/frame?theme=light&lang=en#overlays-popover', {
      waitUntil: 'domcontentloaded',
    });
    await expect(page.locator('[data-overlay-popover]')).toBeVisible();
    await expect(page.locator('[data-overlay-dropdown]')).toBeVisible();
  });
  test('module and isolated QA routes still expose the original complete gallery', async ({
    page,
  }) => {
    await page.goto('/?lang=en#controls', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-design-lab-region="module"]')).toBeVisible();
    await expect(page.locator('#controls-icon-button')).toBeVisible();
    await expect(page.locator('#controls-segmented-control')).toBeVisible();

    await page.goto('/frame?lang=en&theme=light#controls-icon-button', {
      waitUntil: 'domcontentloaded',
    });
    await expect(page.locator('#controls-icon-button')).toBeVisible();
    await expect(page.locator('#controls-segmented-control')).toBeVisible();
  });

  test('the overview keeps the chosen material after reload and opens a module', async ({
    page,
  }) => {
    await page.goto('/?theme=dark&lang=en', { waitUntil: 'domcontentloaded' });
    const sample = page.locator('[data-overview-hero] .playground-overview-hero__sample');
    await expect(sample).toHaveAttribute('data-surface', 'glass-subtle');

    await page
      .getByRole('radiogroup', { name: 'Preview material' })
      .getByRole('radio')
      .nth(1)
      .click();
    await expect(sample).toHaveAttribute('data-surface', 'glass-elevated');

    await page.reload();
    await expect(sample).toHaveAttribute('data-surface', 'glass-elevated');

    await sample.getByRole('button', { name: 'Components' }).click();
    await expect(page).toHaveURL(/#controls-button$/);
    await expect(page.locator('[data-design-lab-region="specimen"]')).toBeVisible();
    await expect(page.locator('iframe')).toHaveCount(0);
  });

  test('expanding an Explorer module and selecting a specimen resets stage scroll', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/?lang=en#controls', { waitUntil: 'domcontentloaded' });
    const workspace = page.locator('[data-design-lab-workspace]');
    await expect(page.locator('#controls-segmented-control')).toBeAttached();
    await workspace.evaluate((element) => element.scrollTo({ top: 760, behavior: 'instant' }));

    const navigation = page.locator('[data-playground-navigation]');
    await navigation.locator('#explorer-module-materials').click();
    await navigation.locator('a[href="#materials-surface"]').click();
    await expect(page).toHaveURL(/#materials-surface$/);
    await expect(page.locator('[data-design-lab-region="specimen"]')).toBeVisible();
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
      await expect(page.locator('[data-design-lab-region="specimen"]')).toBeVisible();
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
      const scrim = await drawer.evaluate((el) => {
        const { backgroundColor, backdropFilter, clipPath } = getComputedStyle(el, '::backdrop');
        return { backgroundColor, backdropFilter, clipPath };
      });
      expect(scrim.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
      expect(scrim.backdropFilter).toMatch(/^blur\(/);
      expect(scrim.clipPath).toContain('evenodd');
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
    await expect(button).toHaveCSS('height', '32px');
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
    await page.keyboard.press('Enter');
    await expect(size).toBeFocused();
    await expect(size.locator('..')).toContainText('Large');
    await expect(button).toHaveCSS('height', '48px');
    const sizeField = inspector.locator('[data-specimen-control="size"]');
    await expect(sizeField).toContainText('Modified');
    const initialRadius = await button.evaluate(
      (element) => getComputedStyle(element).borderTopLeftRadius,
    );
    await chooseOption(inspector, 'corner', 'Square');
    await expect(button).toHaveCSS('border-top-left-radius', '0px');
    await chooseOption(inspector, 'corner', 'Pill');
    await expect(button).not.toHaveCSS('border-top-left-radius', initialRadius);
    await expect(button).toHaveCSS('height', '48px');
    await chooseOption(inspector, 'surface', 'None');
    await expect(button).toHaveCSS('backdrop-filter', 'none');
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
    await expect(button).toHaveCSS('height', '32px');
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

  test('an edited specimen keeps its selection after a reload', async ({ page }, testInfo) => {
    const mobile = testInfo.project.name === 'mobile';
    await page.goto('/?theme=light&lang=en#status-feedback-badge', {
      waitUntil: 'domcontentloaded',
    });
    const badge = page.locator('[data-design-lab-region="specimen"] .ui-badge');
    await expect(badge).toHaveText('Neutral');
    await chooseOption(await showInspector(page, mobile), 'variant', 'Danger');
    await expect(badge).toHaveText('Danger');

    await page.reload();
    await expect(badge).toHaveText('Danger');
    await expect(badge).toHaveClass(/ui-badge--danger/);

    await (await showInspector(page, mobile))
      .getByRole('button', { name: 'Reset specimen' })
      .click();
    await expect(badge).toHaveText('Neutral');
    await page.reload();
    await expect(badge).toHaveText('Neutral');
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

      await page.goto('/?lang=en#dock-component', { waitUntil: 'domcontentloaded' });
      await expect(stage.getByRole('navigation', { name: 'Dock navigation' })).toBeVisible();
      expect(
        await stage.evaluate((element) => element.scrollWidth - element.clientWidth),
      ).toBeLessThanOrEqual(1);
      await expectNoPageOverflow(page);
    });
  }
});
