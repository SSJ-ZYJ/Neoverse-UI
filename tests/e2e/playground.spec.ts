import { expect, test } from '@playwright/test';
import { expectNoPageOverflow } from '../support/e2e';
import { switchToChinese } from '../support/playground';

test.describe('playground', () => {
  test('theme expands from its control and language fades without resetting the specimen', async ({
    page,
  }, testInfo) => {
    const mobile = testInfo.project.name === 'mobile';
    await page.goto('/?theme=light&lang=en&fps=0#controls-button');
    const specimen = page.locator('#controls-button');
    const specimenButton = specimen.getByRole('button');
    await specimenButton.click();
    await expect(specimen.locator('output')).toHaveText('Activations: 1');

    const theme = page.locator(
      `[data-playground-theme-control="${mobile ? 'cycle' : 'segments'}"]`,
    );
    const trigger = mobile ? theme : theme.getByRole('radio', { name: 'Dark' });
    const box = await theme.boundingBox();
    if (!box) throw new Error('Theme control has no bounding box');
    const [mask] = await Promise.all([
      page.waitForFunction(() => {
        const snapshot = getComputedStyle(document.documentElement, '::view-transition-old(root)');
        const stops = [...snapshot.maskImage.matchAll(/\)\s+([\d.]+)px/g)];
        const feather = Number(stops[1]?.[1]) - Number(stops[0]?.[1]);
        return feather >= 24 && Number(stops[0]?.[1]) > 0 ? snapshot.maskImage : undefined;
      }),
      trigger.press(mobile ? 'Enter' : 'End'),
    ]);
    const maskImage = await mask.jsonValue();
    if (!maskImage) throw new Error('Theme reveal mask is missing');
    const center = maskImage.match(/at ([\d.]+)px ([\d.]+)px/);
    expect(center).not.toBeNull();
    expect(Number(center?.[1])).toBeCloseTo(box.x + box.width / 2, 1);
    expect(Number(center?.[2])).toBeCloseTo(box.y + box.height / 2, 1);
    const root = page.locator('html');
    await expect(root).toHaveAttribute('data-theme', 'dark');
    await expect(trigger).toBeFocused();

    const [fading] = await Promise.all([
      page.waitForFunction(() => {
        if (document.documentElement.lang !== 'zh-CN') return false;
        const old = getComputedStyle(document.documentElement, '::view-transition-old(root)');
        return Number(old.opacity) > 0 && Number(old.opacity) < 1;
      }),
      switchToChinese(page, mobile),
    ]);
    expect(await fading.jsonValue()).toBe(true);
    await expect(root).toHaveAttribute('data-theme', 'dark');
    await expect(page).toHaveURL(/lang=zh.*#controls-button$/);
    await expect(specimenButton).toHaveAccessibleName('运行示例');
    await expect(specimen.locator('output')).toHaveText('触发次数：1');
  });

  test('reduced motion changes preferences without a viewport animation', async ({
    page,
  }, testInfo) => {
    const mobile = testInfo.project.name === 'mobile';
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/?theme=light&lang=en&fps=0');
    const theme = page.locator(
      `[data-playground-theme-control="${mobile ? 'cycle' : 'segments'}"]`,
    );
    await (mobile ? theme : theme.getByRole('radio', { name: 'Dark' })).click();
    await switchToChinese(page, mobile);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    expect(
      await page.evaluate(
        () =>
          getComputedStyle(document.documentElement, '::view-transition-old(root)').animationName,
      ),
    ).toBe('none');
  });

  test('the stage title adds the English term only in the Chinese interface', async ({ page }) => {
    await page.goto('/?theme=light&lang=zh&fps=0#data-display-tabs');
    const specimenTitle = page.locator('#stage-title');
    await expect(specimenTitle).toHaveAccessibleName('标签页');
    const english = specimenTitle.locator('.playground-stage__title-secondary');
    await expect(english).toHaveText('Tabs');
    await expect(english).toHaveAttribute('lang', 'en');
    await expect(english).toHaveAttribute('aria-hidden', 'true');

    // The reading aid qualifies the title: it must stay smaller and lighter
    // than the localized term it follows.
    const typography = await specimenTitle.evaluate((heading) => {
      const term = heading.querySelector('.playground-stage__title-secondary');
      if (term === null) throw new Error('Stage title has no English term');
      const headingStyle = getComputedStyle(heading);
      const termStyle = getComputedStyle(term);
      return {
        headingSize: Number.parseFloat(headingStyle.fontSize),
        termSize: Number.parseFloat(termStyle.fontSize),
        headingWeight: Number(headingStyle.fontWeight),
        termWeight: Number(termStyle.fontWeight),
      };
    });
    expect(typography.termSize).toBeLessThan(typography.headingSize);
    expect(typography.termWeight).toBeLessThan(typography.headingWeight);

    await page.goto('/?theme=light&lang=zh&fps=0#data-display');
    const moduleTitle = page.locator('#stage-title');
    await expect(moduleTitle).toHaveAccessibleName('数据与渐进披露');
    await expect(moduleTitle.locator('.playground-stage__title-secondary')).toHaveText(
      'Data & Disclosure',
    );

    await page.goto('/?theme=light&lang=en&fps=0#data-display');
    await expect(page.locator('#stage-title')).toHaveAccessibleName('Data & Disclosure');
    await expect(page.locator('.playground-stage__title-secondary')).toHaveCount(0);
  });

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

    // One browsable specimen needs no disclosure. A differently named
    // specimen stays a direct leaf while the module row keeps the gallery.
    await openExplorer();
    await expect(explorer.locator('#explorer-module-card')).toHaveCount(0);
    await expect(explorer.locator('a[href="#card-card"]')).toBeVisible();
    await explorer.locator('a[href="#card"]').click();
    await expect(page).toHaveURL(/#card$/);
    await expect(page.locator('[data-design-lab-region="module"]')).toBeVisible();
  });

  test('the Card gallery compares surface presets without changing the content', async ({
    page,
  }) => {
    await page.goto('/?lang=en#card', { waitUntil: 'domcontentloaded' });
    const comparison = page.locator('#card-card');
    for (const [example, surface] of [
      ['default', 'auto'],
      ['elevated', 'elevated'],
      ['transparent', 'none'],
    ] as const) {
      const card = comparison.locator(`[data-specimen-card-surface="${example}"] .ui-card`);
      await expect(card).toHaveAttribute('data-surface', surface);
      await expect(card.getByRole('heading', { name: 'Reference card' })).toBeVisible();
      await expect(card.getByRole('button', { name: 'Continue' })).toBeVisible();
    }
    await expect(comparison.locator('[data-specimen-card-surface="default"] .ui-card')).toHaveClass(
      /material-glass-elevated/,
    );
    await expect(
      comparison.locator('[data-surface="subtle"] > [data-surface="none"].ui-card'),
    ).toBeVisible();
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

    // The Explorer uses a soft azure selection plate and keeps its start rail on
    // the same primary accent. Any surface that retunes the plate retunes the
    // rail together.
    expect(colors.bar).toBe(colors.accent);
  });
  for (const [selected, absent] of [
    ['controls-icon-button', 'controls-action'],
    ['forms-textarea', 'forms-select'],
    ['status-feedback-notice', 'status-feedback-toast'],
    ['data-display-step-flow', 'data-display-tabs'],
    ['foundation-prose', 'typography-scale'],
    ['foundation-motion-presence', 'foundation-motion-page'],
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

  test('the overview glass sample resizes smoothly when the language changes', async ({
    page,
  }, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/?theme=light&lang=en', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => document.fonts.ready);
    const sample = page.locator('[data-overview-hero] .playground-overview-hero__sample');
    const before = await sample.boundingBox();
    if (!before) throw new Error('The overview glass sample has no box');

    await page.evaluate(() => {
      const root = document.getElementById('app');
      if (!root) throw new Error('Playground root is missing');
      const scope = window as Window & { __overviewSizeMotion?: number };
      scope.__overviewSizeMotion = 0;
      root.addEventListener('neoverse-motion-start', () => {
        const element = document.querySelector(
          '[data-overview-hero] .playground-overview-hero__sample',
        );
        if (element?.getAnimations().length)
          scope.__overviewSizeMotion = (scope.__overviewSizeMotion ?? 0) + 1;
      });
    });
    await switchToChinese(page, testInfo.project.name === 'mobile');
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
    const after = await sample.boundingBox();
    if (!after) throw new Error('The overview glass sample lost its box');
    // English copy is taller than Chinese copy on the sample, so the resize is
    // observable and must be animated instead of jumping between the heights.
    expect(after.height).toBeLessThan(before.height);
    expect(
      await page.evaluate(
        () => (window as Window & { __overviewSizeMotion?: number }).__overviewSizeMotion ?? 0,
      ),
    ).toBeGreaterThan(0);
  });

  test('the overview glass sample skips size motion under reduced motion', async ({
    page,
  }, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/?theme=light&lang=en', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => document.fonts.ready);
    const sample = page.locator('[data-overview-hero] .playground-overview-hero__sample');
    await page.evaluate(() => {
      const root = document.getElementById('app');
      if (!root) throw new Error('Playground root is missing');
      const scope = window as Window & { __overviewSizeMotion?: number };
      scope.__overviewSizeMotion = 0;
      root.addEventListener('neoverse-motion-start', () => {
        const element = document.querySelector(
          '[data-overview-hero] .playground-overview-hero__sample',
        );
        if (element?.getAnimations().length)
          scope.__overviewSizeMotion = (scope.__overviewSizeMotion ?? 0) + 1;
      });
    });
    await switchToChinese(page, testInfo.project.name === 'mobile');
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
    expect(
      await page.evaluate(
        () => (window as Window & { __overviewSizeMotion?: number }).__overviewSizeMotion ?? 0,
      ),
    ).toBe(0);
    expect(await sample.evaluate((element) => element.getAnimations().length)).toBe(0);
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
    await navigation.locator('#explorer-module-data-display').click();
    await navigation.locator('a[href="#data-display-tabs"]').click();
    await expect(page).toHaveURL(/#data-display-tabs$/);
    await expect(page.locator('[data-design-lab-region="specimen"]')).toBeVisible();
    await expect.poll(() => workspace.evaluate((element) => element.scrollTop)).toBe(0);
  });

  for (const theme of ['light', 'dark'] as const) {
    test(`a reload matches the ${theme} workspace while the preview loads`, async ({
      page,
    }, testInfo) => {
      const mobile = testInfo.project.name === 'mobile';
      const queryTheme = theme === 'light' ? 'dark' : 'light';
      await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: queryTheme });
      await page.goto(`/?theme=${queryTheme}&lang=en&fps=0#overlays`);
      await expect(page.locator('#overlays-popover')).toBeAttached();
      if (mobile) {
        const cycle = page.locator('[data-playground-theme-control="cycle"]');
        await cycle.click();
        if (theme === 'light') await cycle.click();
      } else {
        await page
          .locator('[data-playground-theme-control="segments"]')
          .getByRole('radio', { name: theme === 'light' ? 'Light' : 'Dark' })
          .click();
      }
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      await page.getByRole('radio', { name: 'Optical' }).click();

      const layout = async () => {
        const banner = page.getByRole('banner');
        const stage = page.getByRole('main');
        const panels = page.getByRole('complementary');
        return {
          banner: await banner.boundingBox(),
          stage: await stage.boundingBox(),
          panels: await Promise.all((await panels.all()).map((panel) => panel.boundingBox())),
          canvas: await page.locator('body').evaluate((el) => getComputedStyle(el).backgroundColor),
          toolbarTint: await banner.evaluate((el) =>
            getComputedStyle(el).getPropertyValue('--neoverse-material-background'),
          ),
          field: await stage.evaluate((el) => getComputedStyle(el).backgroundImage),
        };
      };
      const mountedLayout = await layout();
      expect(mountedLayout.panels).toHaveLength(mobile ? 0 : 2);
      expect(mountedLayout.field).not.toBe('none');

      const entry = Promise.withResolvers<void>();
      const preview = Promise.withResolvers<void>();
      await page.route(/\/(?:assets\/playground\.js|src\/main\.ts)(?:\?|$)/, async (route) => {
        await entry.promise;
        await route.continue();
      });
      await page.route(/\/OverlaysModule(?:\.vue|-[^/]+\.js)(?:\?|$)/, async (route) => {
        await preview.promise;
        await route.continue();
      });

      try {
        await page.reload({ waitUntil: 'commit' });
        await expect(page.getByRole('banner')).toBeVisible();
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
        await expect.poll(layout).toEqual(mountedLayout);
        entry.resolve();
        await expect(page.locator('[data-design-lab-workspace]')).toBeVisible();
        await expect(page.locator('#overlays-popover')).toHaveCount(0);
        await expect.poll(layout).toEqual(mountedLayout);
        preview.resolve();
        await expect(page.locator('#overlays-popover')).toBeVisible();
      } finally {
        entry.resolve();
        preview.resolve();
      }
    });
  }

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
      await expect
        .poll(() =>
          drawer.evaluate((el) => {
            const backdrop = el.parentElement?.querySelector('.ui-drawer__backdrop');
            return backdrop && getComputedStyle(backdrop, '::before').backgroundColor;
          }),
        )
        .not.toBe('rgba(0, 0, 0, 0)');
      const material = await drawer.evaluate((el) => {
        const backdrop = el.parentElement?.querySelector('.ui-drawer__backdrop');
        if (!backdrop) throw new Error('Drawer backdrop is missing');
        const scrim = getComputedStyle(backdrop, '::before');
        return {
          scrimTint: scrim.backgroundColor,
          scrimFilter: scrim.backdropFilter,
          scrimCutout: scrim.clipPath,
          drawerFilter: getComputedStyle(el).backdropFilter,
          drawerEdge: getComputedStyle(el, '::before').display,
        };
      });
      expect(material.scrimTint).not.toBe('rgba(0, 0, 0, 0)');
      expect(material.scrimFilter).toBe('none');
      expect(material.scrimCutout).toContain('evenodd');
      expect(material.drawerFilter).toContain('blur(12px)');
      expect(material.drawerEdge).not.toBe('none');
      const outsideX = name === 'Explorer' ? 380 : 10;
      await page.mouse.click(outsideX, 400);
      await expect(drawer).toBeHidden();
      await expect(trigger).toBeFocused();
    }
  });

  test('the Explorer animates specimen leaf expansion and collapse', async ({ page }, testInfo) => {
    const mobile = testInfo.project.name === 'mobile';
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/?lang=en#controls', { waitUntil: 'domcontentloaded' });
    if (mobile) await page.getByRole('button', { name: 'Open Explorer' }).click();
    const navigation = page.locator('[data-playground-navigation]');
    const list = page.locator('#explorer-specimens-data-display');
    const toggle = navigation.locator('#explorer-module-data-display');
    await expect(list).toHaveAttribute('hidden', '');
    await expect(list).toHaveAttribute('inert', '');

    const animations = () => list.evaluate((element) => element.getAnimations().length);
    await toggle.click();
    await expect(list).not.toHaveAttribute('hidden', '');
    await expect.poll(animations).toBeGreaterThan(0);
    await expect(list).not.toHaveAttribute('inert', '');
    await expect.poll(animations).toBe(0);
    await expect(list).not.toHaveAttribute('hidden', '');

    await toggle.click();
    await expect.poll(animations).toBeGreaterThan(0);
    await expect(list).toHaveAttribute('inert', '');
    await expect(list).toHaveAttribute('aria-hidden', 'true');
    await expect.poll(animations).toBe(0);
    await expect(list).toHaveAttribute('hidden', '');
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
