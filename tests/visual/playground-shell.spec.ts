import { expect, test } from '@playwright/test';
import { layoutBreakpoints } from '../../packages/tokens/src/index';

test('toolbar segmented options hug their labels and keep the active slider aligned', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Desktop toolbar uses segmented controls.');
  await page.goto('/?theme=dark&lang=zh#controls', { waitUntil: 'domcontentloaded' });

  const theme = page.getByRole('radiogroup', { name: '实验室主题' });
  await expect(theme).toBeVisible();
  const options = theme.getByRole('radio');
  const dimensions = await options.evaluateAll((elements) =>
    elements.map((element) => {
      const style = getComputedStyle(element);
      return {
        width: element.getBoundingClientRect().width,
        height: Number.parseFloat(style.height),
        fontSize: Number.parseFloat(style.fontSize),
      };
    }),
  );
  expect(dimensions).toHaveLength(3);
  const [systemOption, lightOption, darkOption] = dimensions;
  if (!systemOption || !lightOption || !darkOption) {
    throw new Error('Theme segment options are missing');
  }
  expect(systemOption.width).toBeGreaterThan(lightOption.width + 14);
  expect(lightOption.width).toBeCloseTo(darkOption.width, 0);
  for (const item of dimensions) {
    expect(item.height / item.fontSize).toBeLessThan(2.3);
  }

  const alignedSliderDelta = async () =>
    theme.evaluate((root) => {
      const active = root.querySelector<HTMLElement>('[role="radio"][aria-checked="true"]');
      const slider = root.querySelector<HTMLElement>('.ui-segmented-control__slider');
      if (!active || !slider) throw new Error('Selected segment or slider missing');
      const item = active.getBoundingClientRect();
      const plate = slider.getBoundingClientRect();
      return Math.max(Math.abs(item.left - plate.left), Math.abs(item.right - plate.right));
    });

  await expect.poll(alignedSliderDelta).toBeLessThan(1.5);
  await theme.getByRole('radio', { name: '浅色' }).click();
  await expect.poll(alignedSliderDelta).toBeLessThan(1.5);
  await theme.getByRole('radio', { name: '跟随系统' }).click();
  await expect.poll(alignedSliderDelta).toBeLessThan(1.5);
});

test('desktop playground uses the 1920x1080 100% baseline and fills the viewport', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'This assertion defines the desktop baseline.');

  await page.goto('/?lang=en', { waitUntil: 'domcontentloaded' });

  const metrics = await page.evaluate(() => {
    const shell = document.querySelector<HTMLElement>('main:not([data-design-lab-region])');
    if (shell === null) {
      throw new Error('Playground shell is missing');
    }

    return {
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
      shellWidth: shell.getBoundingClientRect().width,
    };
  });

  expect(metrics).toEqual({
    innerWidth: 1920,
    innerHeight: 1080,
    devicePixelRatio: 1,
    shellWidth: 1920,
  });
});

test('playground uses the consumer root size at every viewport width', async ({ page }) => {
  await page.goto('/#controls', { waitUntil: 'domcontentloaded' });

  const readRootFontSize = async (width: number): Promise<number> => {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(25);
    return page.evaluate(() =>
      Number.parseFloat(getComputedStyle(document.documentElement).fontSize),
    );
  };

  const expectedRootSizes = new Map([
    [1280, 16],
    [1600, 16],
    [1920, 16],
    [2560, 16],
  ]);

  for (const [width, expected] of expectedRootSizes) {
    expect(await readRootFontSize(width), `viewport ${width}`).toBeCloseTo(expected, 1);
  }
});

test('overview desktop presentation uses the expanded semantic scale', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'desktop',
    'This assertion defines the desktop Overview scale.',
  );

  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/?lang=zh', { waitUntil: 'domcontentloaded' });

  const metrics = await page.evaluate(() => {
    const rootSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
    const navigationItem = document.querySelector<HTMLElement>(
      '[data-playground-navigation] .ui-navigation-item',
    );
    const hero = document.querySelector<HTMLElement>('[data-overview-hero]');
    const heroTitle = document.querySelector<HTMLElement>('#overview-title');
    const heroBody = hero?.querySelector<HTMLElement>('header p:last-child');
    const groupCard = document.querySelector<HTMLElement>('[data-overview-groups] > *');
    const groupAction = document.querySelector<HTMLElement>('[data-overview-groups] .ui-button');
    const search = document.querySelector<HTMLElement>('[data-specimen-search]');
    const specimenTitle = document.querySelector<HTMLElement>('[data-specimen-catalogue] h4');

    if (
      navigationItem === null ||
      hero === null ||
      heroTitle === null ||
      heroBody === undefined ||
      heroBody === null ||
      groupCard === null ||
      groupAction === null ||
      search === null ||
      specimenTitle === null
    ) {
      throw new Error('Expanded Overview scale fixtures are missing');
    }

    return {
      rootSize,
      navigationFontSize: Number.parseFloat(getComputedStyle(navigationItem).fontSize),
      heroPaddingInline: Number.parseFloat(getComputedStyle(hero).paddingInlineStart),
      heroTitleFontSize: Number.parseFloat(getComputedStyle(heroTitle).fontSize),
      heroBodyFontSize: Number.parseFloat(getComputedStyle(heroBody).fontSize),
      groupCardHeight: groupCard.getBoundingClientRect().height,
      groupActionHeight: groupAction.getBoundingClientRect().height,
      groupActionBackgroundColor: getComputedStyle(groupAction).backgroundColor,
      groupActionBackgroundImage: getComputedStyle(groupAction).backgroundImage,
      groupActionSurface: groupAction.dataset.surface,
      searchHeight: search.getBoundingClientRect().height,
      specimenTitleFontSize: Number.parseFloat(getComputedStyle(specimenTitle).fontSize),
      documentOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });

  expect(metrics.rootSize).toBeCloseTo(16, 1);
  expect(metrics.navigationFontSize).toBeGreaterThanOrEqual(metrics.rootSize * 0.84);
  expect(metrics.heroPaddingInline).toBeGreaterThanOrEqual(metrics.rootSize * 1.9);
  expect(metrics.heroTitleFontSize).toBeGreaterThanOrEqual(metrics.rootSize * 2.9);
  expect(metrics.heroBodyFontSize).toBeGreaterThanOrEqual(metrics.rootSize * 1.1);
  expect(metrics.groupCardHeight).toBeGreaterThanOrEqual(metrics.rootSize * 8);
  expect(metrics.groupActionHeight).toBeGreaterThanOrEqual(metrics.rootSize * 2);
  expect(metrics.groupActionSurface).toBe('glass-subtle');
  expect(
    metrics.groupActionBackgroundImage !== 'none' ||
      !['rgba(0, 0, 0, 0)', 'transparent'].includes(metrics.groupActionBackgroundColor),
  ).toBe(true);
  expect(metrics.searchHeight).toBeGreaterThanOrEqual(metrics.rootSize * 3.2);
  expect(metrics.specimenTitleFontSize).toBeGreaterThanOrEqual(metrics.rootSize * 0.84);
  expect(metrics.documentOverflow).toBeLessThanOrEqual(0);
});

test('overview showcase switches real material presets and opens the component module', async ({
  page,
}) => {
  await page.goto('/?theme=dark&lang=en', { waitUntil: 'domcontentloaded' });
  const sample = page.locator('[data-overview-hero] .playground-overview-hero__sample');
  await expect(sample).toHaveAttribute('data-surface', 'glass-subtle');
  // UiSegmentedControl renders buttons with role="radio", and each label is
  // composed from the shared glass material name and tier. Select through the
  // radiogroup's accessible name instead of the tier copy, which the Aurora
  // Glass naming renamed.
  const presets = page.getByRole('radiogroup', { name: 'Preview material' });
  await presets.getByRole('radio').nth(1).click();
  await expect(sample).toHaveAttribute('data-surface', 'glass-elevated');
  await sample.getByRole('button', { name: 'Components' }).click();
  await expect(page).toHaveURL(/#controls$/);
});

test('mobile toolbar keeps actions aligned and preserves theme and language switching', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'This layout applies to compact navigation.');
  await page.goto('/?theme=dark&lang=en#controls', { waitUntil: 'domcontentloaded' });
  const themeButton = page.getByRole('button', { name: /Cycle theme/ });
  const languageButton = page.getByRole('button', { name: /Switch language/ });
  await expect(themeButton).toBeVisible();
  await expect(languageButton).toBeVisible();

  const geometry = await page.locator('.playground-shell__toolbar').evaluate((toolbar) => {
    const title = toolbar.querySelector<HTMLElement>('#module-title');
    const actions = toolbar.querySelector<HTMLElement>('.playground-shell__toolbar-actions');
    if (title === null || actions === null) throw new Error('Compact toolbar is incomplete');
    const titleRect = title.getBoundingClientRect();
    const actionsRect = actions.getBoundingClientRect();
    const toolbarRect = toolbar.getBoundingClientRect();
    return {
      centerDelta: Math.abs(
        titleRect.top + titleRect.height / 2 - (actionsRect.top + actionsRect.height / 2),
      ),
      actionsInside: actionsRect.right <= toolbarRect.right + 1,
      documentOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });
  expect(geometry.centerDelta).toBeLessThan(12);
  expect(geometry.actionsInside).toBe(true);
  expect(geometry.documentOverflow).toBeLessThanOrEqual(0);
  await themeButton.click();
  await expect(page).toHaveURL(/theme=system/);
  await languageButton.click();
  await expect(page).toHaveURL(/lang=zh/);
});

test('design lab density grids respond to available content width', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'This assertion defines desktop content density.');
  const scenarios = [
    {
      moduleId: 'materials',
      selector: '.playground-token-grid',
      expected: new Map([
        [1280, 2],
        [1600, 3],
        [1920, 3],
        [2560, 4],
      ]),
    },
    {
      moduleId: 'shadow',
      selector: '.playground-token-grid',
      expected: new Map([
        [1280, 2],
        [1600, 3],
        [1920, 4],
        [2560, 4],
      ]),
    },
    {
      moduleId: 'typography',
      selector: '.playground-specimen-grid',
      expected: new Map([
        [1280, 1],
        [1600, 2],
        [1920, 2],
        [2560, 2],
      ]),
    },
  ] as const;

  for (const scenario of scenarios) {
    for (const [width, expectedColumns] of scenario.expected) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(`/?lang=en#${scenario.moduleId}`, { waitUntil: 'domcontentloaded' });
      await expect(page.locator(scenario.selector).first()).toBeVisible();
      await page.evaluate(() => document.fonts.ready);

      const rowCounts = await page.locator(scenario.selector).evaluateAll((grids) =>
        grids.map((grid) => {
          const children = [...grid.children].filter((child) => {
            const rect = child.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0;
          });
          const firstTop = children[0]?.getBoundingClientRect().top;
          if (firstTop === undefined) return 0;
          return children.filter(
            (child) => Math.abs(child.getBoundingClientRect().top - firstTop) <= 1,
          ).length;
        }),
      );

      expect(rowCounts.length, `${scenario.moduleId} grids at ${width}px`).toBeGreaterThan(0);
      expect(
        rowCounts.every((count) =>
          scenario.moduleId === 'materials' && width === 2560
            ? count >= 3 && count <= 4
            : count === expectedColumns,
        ),
        `${scenario.moduleId} first-row density at ${width}px`,
      ).toBe(true);
    }
  }
});

test('playground shell consumes semantic page and sidebar layout roles', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/?lang=en#motion', { waitUntil: 'domcontentloaded' });

  const desktopMetrics = await page.evaluate(() => {
    const rootSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
    const shell = document.querySelector<HTMLElement>('.playground-shell');
    const navigation = document.querySelector<HTMLElement>('[data-playground-navigation]');
    const pageRegion = document.querySelector<HTMLElement>('[data-playground-page]');
    const header = pageRegion?.querySelector<HTMLElement>('header');

    if (
      shell === null ||
      navigation === null ||
      pageRegion === null ||
      header === undefined ||
      header === null
    ) {
      throw new Error('Semantic Playground layout regions are missing');
    }

    const shellStyle = getComputedStyle(shell);
    const navigationRect = navigation.getBoundingClientRect();

    return {
      rootSize,
      shellPaddingInline: Number.parseFloat(shellStyle.paddingInlineStart),
      shellGap: Number.parseFloat(shellStyle.columnGap),
      navigationWidth: navigationRect.width,
      navigationLeft: navigationRect.left,
      navigationTop: navigationRect.top,
      navigationRadius: Number.parseFloat(getComputedStyle(navigation).borderTopLeftRadius),
      pageWidth: pageRegion.getBoundingClientRect().width,
      pageMaxWidth: Number.parseFloat(getComputedStyle(pageRegion).maxWidth),
      headerMinHeight: Number.parseFloat(getComputedStyle(header).minHeight),
      headerRadius: Number.parseFloat(getComputedStyle(header).borderTopLeftRadius),
    };
  });

  expect(desktopMetrics.rootSize).toBeCloseTo(16, 1);
  expect(desktopMetrics.navigationWidth).toBeCloseTo(desktopMetrics.rootSize * 13, 1);
  expect(desktopMetrics.pageMaxWidth).toBeCloseTo(desktopMetrics.rootSize * 88, 1);
  expect(desktopMetrics.pageWidth).toBeLessThanOrEqual(desktopMetrics.pageMaxWidth);
  expect(desktopMetrics.pageMaxWidth - desktopMetrics.pageWidth).toBeLessThanOrEqual(
    desktopMetrics.shellPaddingInline * 2 + desktopMetrics.shellGap + desktopMetrics.rootSize,
  );
  expect(desktopMetrics.navigationLeft).toBeGreaterThanOrEqual(
    desktopMetrics.shellPaddingInline - 1,
  );
  expect(desktopMetrics.navigationTop).toBeGreaterThanOrEqual(
    desktopMetrics.shellPaddingInline - 1,
  );
  expect(desktopMetrics.navigationRadius).toBeGreaterThan(0);
  expect(desktopMetrics.headerRadius).toBeGreaterThan(0);
  expect(desktopMetrics.headerMinHeight).toBeCloseTo(desktopMetrics.rootSize * 3, 1);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: 'domcontentloaded' });

  const mobileMetrics = await page.evaluate(() => {
    const rootSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
    const navigation = document.querySelector<HTMLElement>('[data-playground-navigation]');
    if (navigation === null) {
      throw new Error('Playground navigation is missing');
    }

    return {
      rootSize,
      navigationWidth: navigation.getBoundingClientRect().width,
    };
  });

  expect(mobileMetrics.rootSize).toBeCloseTo(16, 1);
  expect(mobileMetrics.navigationWidth).toBeCloseTo(mobileMetrics.rootSize * 18, 1);
});

test('desktop overview toolbar collapses to a compact floating control bar', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/?theme=dark&lang=zh', { waitUntil: 'domcontentloaded' });

  const metrics = await page.locator('.playground-shell__toolbar').evaluate((element) => {
    const toolbar = element as HTMLElement;
    const pageRegion = toolbar.closest<HTMLElement>('[data-playground-page]');
    const segmented = toolbar.querySelector<HTMLElement>('.ui-segmented-control');
    if (pageRegion === null || segmented === null) {
      throw new Error('Overview toolbar fixtures are missing');
    }

    const toolbarRect = toolbar.getBoundingClientRect();
    const pageRect = pageRegion.getBoundingClientRect();
    const pageStyle = getComputedStyle(pageRegion);
    return {
      mode: toolbar.dataset.toolbarMode,
      surface: toolbar.dataset.surface,
      toolbarWidth: toolbarRect.width,
      pageWidth: pageRect.width,
      toolbarRightGap: pageRect.right - toolbarRect.right,
      pagePaddingRight: Number.parseFloat(pageStyle.paddingRight),
      toolbarRadius: Number.parseFloat(getComputedStyle(toolbar).borderTopLeftRadius),
      segmentedRadius: Number.parseFloat(getComputedStyle(segmented).borderTopLeftRadius),
    };
  });

  expect(metrics.mode).toBe('overview');
  expect(metrics.surface).toBe('glass-subtle');
  expect(metrics.toolbarWidth).toBeLessThan(metrics.pageWidth * 0.6);
  expect(metrics.toolbarRightGap).toBeCloseTo(metrics.pagePaddingRight, 1);
  expect(metrics.toolbarRadius).toBeGreaterThan(metrics.segmentedRadius);
});

test('module toolbar keeps the canonical elevated Glass material', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/?theme=dark&lang=zh#materials', { waitUntil: 'domcontentloaded' });

  const material = await page.locator('.playground-shell__toolbar').evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      surface: element.getAttribute('data-surface'),
      mode: element.getAttribute('data-toolbar-mode'),
      transparency: style.getPropertyValue('--neoverse-material-transparency').trim(),
      elevatedTransparency: style
        .getPropertyValue('--neoverse-material-glass-elevated-transparency')
        .trim(),
    };
  });

  expect(material.surface).toBe('glass-elevated');
  expect(material.mode).toBe('module');
  // The current shell uses the shared elevated tier, not a local denser override.
  expect(material.transparency).toBe(material.elevatedTransparency);
});

test('resting Playground Glass stays outside View Transition capture layers', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/?theme=light&lang=zh#motion', { waitUntil: 'domcontentloaded' });

  const state = await page.evaluate(() => {
    const toolbar = document.querySelector<HTMLElement>('.playground-shell__toolbar');
    const pageRegion = document.querySelector<HTMLElement>('[data-playground-page]');
    const navigation = document.querySelector<HTMLElement>('.playground-shell__navigation');
    if (toolbar === null || pageRegion === null || navigation === null) {
      throw new Error('Missing Playground Glass transition fixtures');
    }

    const toolbarStyle = getComputedStyle(toolbar);
    return {
      toolbarBackdropFilter: toolbarStyle.backdropFilter,
      toolbarViewTransitionName: toolbarStyle.viewTransitionName,
      pageViewTransitionName: getComputedStyle(pageRegion).viewTransitionName,
      navigationViewTransitionName: getComputedStyle(navigation).viewTransitionName,
    };
  });

  expect(state.toolbarBackdropFilter).not.toBe('none');
  expect(state.toolbarViewTransitionName).toBe('none');
  expect(state.pageViewTransitionName).toBe('none');
  expect(state.navigationViewTransitionName).toBe('none');

  const activeNames = await page.evaluate(() => {
    document.documentElement.setAttribute('data-neoverse-view-transitioning', '');
    const toolbar = document.querySelector<HTMLElement>('.playground-shell__toolbar');
    const pageRegion = document.querySelector<HTMLElement>('[data-playground-page]');
    const navigation = document.querySelector<HTMLElement>('.playground-shell__navigation');
    if (toolbar === null || pageRegion === null || navigation === null) {
      throw new Error('Missing Playground Glass transition fixtures');
    }
    const names = {
      toolbar: getComputedStyle(toolbar).viewTransitionName,
      page: getComputedStyle(pageRegion).viewTransitionName,
      navigation: getComputedStyle(navigation).viewTransitionName,
    };
    document.documentElement.removeAttribute('data-neoverse-view-transitioning');
    return names;
  });

  expect(activeNames.toolbar).toBe('playground-toolbar');
  // The page body is owned by the particle/crossfade choreography rather than
  // a named shared snapshot. Only persistent Glass chrome receives a stable
  // View Transition name while the fallback transition is active.
  expect(activeNames.page).toBe('none');
  expect(activeNames.navigation).toBe('playground-navigation');
});

test('normal Playground chrome keeps a translucent Glass plane and a blurred sidebar fade', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/?theme=dark&lang=en#controls', { waitUntil: 'domcontentloaded' });

  const metrics = await page.evaluate(() => {
    const alphaFromColor = (color: string): number => {
      const slashAlpha = color.match(/\/\s*([\d.]+)(%)?\s*\)?$/);
      if (slashAlpha?.[1] !== undefined) {
        const value = Number.parseFloat(slashAlpha[1]);
        return slashAlpha[2] === '%' ? value / 100 : value;
      }
      const match = color.match(/rgba?\(([^)]+)\)/);
      if (match?.[1] === undefined) return 1;
      const channels = match[1]
        .trim()
        .split(/[\s,/]+/)
        .filter(Boolean);
      return channels.length >= 4 ? Number.parseFloat(channels[3] ?? '1') : 1;
    };

    const navigationHeader = document.querySelector<HTMLElement>(
      '.playground-shell__navigation-header',
    );
    const navigationGroup = document.querySelector<HTMLElement>('.playground-navigation-group');
    const navigationScroll = document.querySelector<HTMLElement>(
      '.playground-shell__navigation-scroll',
    );
    const specimenSection = document.querySelector<HTMLElement>('.playground-specimen-section');
    if (
      navigationHeader === null ||
      navigationGroup === null ||
      navigationScroll === null ||
      specimenSection === null
    ) {
      throw new Error('Playground Glass fixtures are missing');
    }

    const fade = getComputedStyle(navigationHeader, '::after');
    const navigationStyle = getComputedStyle(navigationGroup);
    const navigationScrollStyle = getComputedStyle(navigationScroll);
    const specimenStyle = getComputedStyle(specimenSection);

    return {
      fadeBackground: fade.backgroundImage,
      fadeBackgroundAlpha: alphaFromColor(fade.backgroundColor),
      fadeFilter: fade.backdropFilter,
      fadeMask: fade.maskImage,
      fadeTop: Number.parseFloat(fade.top),
      headerHeight: navigationHeader.getBoundingClientRect().height,
      headerZIndex: Number.parseFloat(getComputedStyle(navigationHeader).zIndex),
      fadeZIndex: Number.parseFloat(fade.zIndex),
      navigationMask: navigationScrollStyle.maskImage,
      navigationAlpha: alphaFromColor(navigationStyle.backgroundColor),
      navigationFilter: navigationStyle.backdropFilter,
      navigationNesting: navigationGroup.dataset.neoverseGlassNesting,
      specimenAlpha: alphaFromColor(specimenStyle.backgroundColor),
      specimenFilter: specimenStyle.backdropFilter,
    };
  });

  expect(metrics.fadeBackground).toBe('none');
  expect(metrics.fadeBackgroundAlpha).toBe(0);
  expect(metrics.fadeFilter).not.toBe('none');
  expect(metrics.fadeMask).toContain('linear-gradient');
  expect(metrics.fadeTop).toBeLessThan(metrics.headerHeight);
  expect(metrics.headerZIndex).toBeGreaterThan(metrics.fadeZIndex);
  expect(metrics.navigationMask).toContain('linear-gradient');
  expect(metrics.navigationAlpha).toBeGreaterThan(0);
  expect(metrics.navigationAlpha).toBeLessThan(1);
  expect(metrics.navigationFilter).not.toBe('none');
  expect(metrics.navigationNesting).toBe('local');
  expect(metrics.specimenAlpha).toBeGreaterThan(0);
  expect(metrics.specimenAlpha).toBeLessThan(1);
  expect(metrics.specimenFilter).not.toBe('none');
});

test('light Glass hierarchy uses material density instead of bright nested rims', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1640, height: 930 });
  await page.goto('/?theme=light&lang=zh#consumer-parity', { waitUntil: 'domcontentloaded' });

  const metrics = await page.evaluate(() => {
    const alpha = (value: string): number => {
      const slash = value.match(/\/\s*([\d.]+)\s*\)$/)?.[1];
      if (slash !== undefined) return Number.parseFloat(slash);
      const comma = value.match(/,\s*([\d.]+)\s*\)$/)?.[1];
      return comma === undefined ? 1 : Number.parseFloat(comma);
    };
    const toolbar = document.querySelector<HTMLElement>('.playground-shell__toolbar');
    const nested = document.querySelector<HTMLElement>('.playground-navigation-group');
    const button = document.querySelector<HTMLElement>(
      '[data-consumer-parity="hero-actions"] .ui-button',
    );
    if (toolbar === null || nested === null || button === null) {
      throw new Error('Missing light hierarchy fixture');
    }
    const toolbarStyle = getComputedStyle(toolbar);
    const nestedStyle = getComputedStyle(nested);
    const buttonStyle = getComputedStyle(button);
    return {
      toolbarAlpha: alpha(toolbarStyle.backgroundColor),
      nestedAlpha: alpha(nestedStyle.backgroundColor),
      toolbarEdge: Number.parseFloat(
        toolbarStyle.getPropertyValue('--neoverse-material-edge-refraction-opacity'),
      ),
      nestedEdge: Number.parseFloat(
        nestedStyle.getPropertyValue('--neoverse-material-edge-refraction-opacity'),
      ),
      buttonEdge: Number.parseFloat(
        buttonStyle.getPropertyValue('--neoverse-material-edge-refraction-opacity'),
      ),
      buttonEdgeToken: Number.parseFloat(
        buttonStyle.getPropertyValue('--neoverse-control-button-edge-refraction-opacity'),
      ),
      buttonBorderAlpha: alpha(buttonStyle.borderTopColor),
      buttonInsetLayers: (buttonStyle.boxShadow.match(/inset/g) ?? []).length,
    };
  });

  expect(metrics.toolbarAlpha).toBeGreaterThan(metrics.nestedAlpha);
  // Large Glass planes use the restored refractive edge field. Hierarchy is
  // expressed by density and relative edge strength rather than by forcing
  // every surface below one historical absolute opacity threshold.
  expect(metrics.toolbarEdge).toBeGreaterThanOrEqual(metrics.nestedEdge);
  expect(metrics.nestedEdge).toBeGreaterThan(metrics.buttonEdge);
  expect(metrics.buttonEdge).toBeCloseTo(metrics.buttonEdgeToken, 3);
  expect(metrics.buttonBorderAlpha).toBeLessThan(0.13);
  expect(metrics.buttonInsetLayers).toBeLessThanOrEqual(1);
});

test('reduced transparency removes sidebar blur and fade masking', async ({ page }) => {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }],
  });
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/?theme=dark&lang=en#controls', { waitUntil: 'domcontentloaded' });

  const metrics = await page.evaluate(() => {
    const header = document.querySelector<HTMLElement>('.playground-shell__navigation-header');
    const scroll = document.querySelector<HTMLElement>('.playground-shell__navigation-scroll');
    if (header === null || scroll === null) {
      throw new Error('Sidebar fade fixtures are missing');
    }
    return {
      filter: getComputedStyle(header, '::after').backdropFilter,
      mask: getComputedStyle(scroll).maskImage,
    };
  });

  expect(metrics.filter).toBe('none');
  expect(metrics.mask).toBe('none');
});

test('floating Playground interaction surfaces do not clip child hover and focus effects', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?theme=dark&lang=zh#card', { waitUntil: 'domcontentloaded' });

  const trigger = page.locator('[data-playground-nav-trigger]');
  await trigger.click();

  const cardLink = page.getByRole('link', { name: '卡片', exact: true });
  await expect(cardLink).toBeVisible();
  await cardLink.hover();

  const navigationMetrics = await cardLink.evaluate((element) => {
    const group = element.closest<HTMLElement>('.playground-navigation-group');
    if (group === null) {
      throw new Error('Navigation group is missing');
    }
    const style = getComputedStyle(group);
    return {
      overflow: style.overflow,
      zIndex: Number.parseFloat(style.zIndex),
      semanticOverflow: group.dataset.neoverseSurfaceOverflow,
    };
  });

  expect(navigationMetrics.semanticOverflow).toBe('visible');
  expect(navigationMetrics.overflow).toBe('visible');
  expect(navigationMetrics.zIndex).toBeGreaterThan(0);

  await page.goto('/?theme=dark&lang=zh#controls', { waitUntil: 'domcontentloaded' });
  const specimenMetrics = await page
    .locator('.playground-specimen-section')
    .first()
    .evaluate((element) => ({
      overflow: getComputedStyle(element).overflow,
      semanticOverflow: (element as HTMLElement).dataset.neoverseSurfaceOverflow,
    }));
  expect(specimenMetrics.semanticOverflow).toBe('visible');
  expect(specimenMetrics.overflow).toBe('visible');

  const toolbarMetrics = await page.locator('.playground-shell__toolbar').evaluate((element) => ({
    overflow: getComputedStyle(element).overflow,
    semanticOverflow: (element as HTMLElement).dataset.neoverseSurfaceOverflow,
  }));
  expect(toolbarMetrics.semanticOverflow).toBe('clip');
  expect(toolbarMetrics.overflow).toBe('hidden');
});

test('playground keeps drawer navigation until the xl shell breakpoint', async ({ page }) => {
  await page.setViewportSize({ width: layoutBreakpoints.xl - 1, height: 900 });
  await page.goto('/?lang=en#controls', { waitUntil: 'domcontentloaded' });

  const navigation = page.locator('[data-playground-navigation]');
  const trigger = page.locator('[data-playground-nav-trigger]');

  await expect(trigger).toBeVisible();
  expect(await navigation.evaluate((element) => (element as HTMLElement).inert)).toBe(true);
  expect(await navigation.evaluate((element) => getComputedStyle(element).position)).toBe('fixed');
  const drawerMetrics = await page.evaluate(() => {
    const shell = document.querySelector<HTMLElement>('.playground-shell');
    const workspace = document.querySelector<HTMLElement>('[data-design-lab-workspace]');
    if (shell === null || workspace === null) {
      throw new Error('Playground drawer layout fixtures are missing');
    }

    const shellPadding = Number.parseFloat(getComputedStyle(shell).paddingInlineStart);
    return {
      shellPadding,
      workspaceWidth: workspace.getBoundingClientRect().width,
      viewportWidth: document.documentElement.clientWidth,
    };
  });
  expect(drawerMetrics.workspaceWidth).toBeCloseTo(
    drawerMetrics.viewportWidth - drawerMetrics.shellPadding * 2,
    0,
  );

  await page.setViewportSize({ width: layoutBreakpoints.xl, height: 900 });
  await page.reload({ waitUntil: 'domcontentloaded' });

  await expect(trigger).toBeHidden();
  expect(await navigation.evaluate((element) => (element as HTMLElement).inert)).toBe(false);
  expect(await navigation.evaluate((element) => getComputedStyle(element).position)).toBe(
    'relative',
  );
});

test('isolated frame keeps the canonical 16px component baseline', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/frame?theme=dark&lang=en#controls', { waitUntil: 'domcontentloaded' });

  expect(
    await page.evaluate(() =>
      Number.parseFloat(getComputedStyle(document.documentElement).fontSize),
    ),
  ).toBeCloseTo(16, 1);
});

test('playground shows the Neoverse wordmark and site icon', async ({ page }) => {
  await page.goto('/?lang=zh', { waitUntil: 'domcontentloaded' });

  const brandLogo = page.locator('[data-playground-brand-logo]');
  await expect(brandLogo).toBeVisible();
  await expect(brandLogo).toHaveAttribute('aria-label', 'Neoverse UI');
  await expect(brandLogo).toHaveCSS('mask-image', /\/assets\/neoverse-wordmark\.svg/);
  const wordmarkUrl = await brandLogo.evaluate((element: HTMLElement) => {
    const match = getComputedStyle(element).maskImage.match(/url\(["']?(.*?)["']?\)/);
    return match?.[1] === undefined ? null : new URL(match[1], window.location.href).href;
  });
  if (wordmarkUrl === null) {
    throw new Error('Neoverse wordmark mask did not resolve to an asset URL');
  }
  expect((await page.request.get(wordmarkUrl)).status()).toBe(200);

  const favicon = page.locator('link[rel~="icon"]');
  await expect(favicon).toHaveAttribute('type', 'image/png');
  await expect(favicon).toHaveAttribute('href', /\/assets\/neoverse-site-icon\.png/);
  const siteIconUrl = await favicon.evaluate((link: HTMLLinkElement) => link.href);
  const siteIconResponse = await page.request.get(siteIconUrl);
  expect(siteIconResponse.status()).toBe(200);
  expect(siteIconResponse.headers()['content-type']).toContain('image/png');
});

test('main playground renders the selected module directly instead of through an adaptive iframe', async ({
  page,
}) => {
  await page.goto('/#controls', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('iframe')).toHaveCount(0);
  await expect(page.locator('[data-design-lab-region="module"]')).toBeVisible();
});

test('fresh specimen deep links resolve their owner module and keep the specimen hash', async ({
  page,
}) => {
  for (const specimenId of [
    'foundation-typography',
    'controls-action',
    'status-feedback-notice',
    'composition-reading',
  ] as const) {
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

test('every catalogue specimen deep link renders a real focusable fixture', async ({ page }) => {
  await page.goto('/?lang=en', { waitUntil: 'domcontentloaded' });

  const specimenHashes = await page
    .locator('[data-specimen-catalogue] a[href^="#"]')
    .evaluateAll((links) =>
      links
        .map((link) => link.getAttribute('href'))
        .filter((href): href is string => href !== null),
    );

  expect(specimenHashes.length).toBeGreaterThan(0);
  expect(new Set(specimenHashes).size).toBe(specimenHashes.length);

  for (const hash of specimenHashes) {
    const specimenId = hash.slice(1);
    await page.goto(`/?lang=en${hash}`, { waitUntil: 'domcontentloaded' });

    const specimen = page.locator(`#${specimenId}`);
    await expect(specimen, specimenId).toBeVisible();
    await expect(page, specimenId).toHaveURL(new RegExp(`#${specimenId}$`));
    await expect
      .poll(() => specimen.evaluate((element) => document.activeElement === element), {
        message: `${specimenId} should receive focus after deep-link resolution`,
      })
      .toBe(true);
  }
});

test('composition keeps scrolling inside the workspace without creating root-page blank space', async ({
  page,
}) => {
  await page.goto('/?lang=en#composition', { waitUntil: 'domcontentloaded' });

  const metrics = await page.evaluate(() => {
    const workspace = document.querySelector<HTMLElement>('[data-design-lab-workspace]');
    if (workspace === null) {
      throw new Error('Playground workspace is missing');
    }
    return {
      viewportHeight: window.innerHeight,
      documentHeight: document.documentElement.scrollHeight,
      bodyHeight: document.body.scrollHeight,
      workspaceClientHeight: workspace.clientHeight,
      workspaceScrollHeight: workspace.scrollHeight,
    };
  });

  expect(metrics.workspaceScrollHeight).toBeGreaterThan(metrics.workspaceClientHeight);
  expect(metrics.documentHeight).toBe(metrics.viewportHeight);
  expect(metrics.bodyHeight).toBe(metrics.viewportHeight);

  await page.evaluate(() => window.scrollTo({ top: 10_000, behavior: 'auto' }));
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
});

test('playground demo actions keep intentional navigation without placeholder jumps', async ({
  page,
}) => {
  await page.goto('/?lang=en#composition-reading', { waitUntil: 'domcontentloaded' });

  const readingAction = page.locator('[data-reading-surface-link]');
  await expect(readingAction).toHaveAttribute('href', '#materials-surface');
  await readingAction.click();
  await expect(page).toHaveURL(/#materials-surface$/);
  await expect(page.locator('#materials-surface')).toBeVisible();

  await page.goto('/react-fixture?lang=en', { waitUntil: 'domcontentloaded' });
  const reactAction = page.locator('[data-react-adapter="UiAction"]');
  await expect(reactAction).toHaveAttribute('href', '#react-runtime-fixture');
  await reactAction.click();
  await expect(page).toHaveURL(/\/react-fixture\?lang=en$/);

  expect(await page.locator('a[href^="https://github.com/"]').count()).toBe(0);
});

test('React runtime validation returns to the consumer parity section', async ({ page }) => {
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

test('reading composition consumes the prose foundation with an independent reading width role', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/?lang=en#composition-reading', { waitUntil: 'domcontentloaded' });

  const metrics = await page.locator('[data-reading-prose]').evaluate((element) => {
    const prose = element as HTMLElement;
    const blockquote = prose.querySelector<HTMLElement>('blockquote');
    const inlineCode = prose.querySelector<HTMLElement>('p code');
    const tableCell = prose.querySelector<HTMLElement>('tbody td');
    const tableCaption = prose.querySelector<HTMLElement>('caption');
    const firstTableHeader = prose.querySelector<HTMLElement>('thead th:first-child');
    const lastTableHeader = prose.querySelector<HTMLElement>('thead th:last-child');
    const definitionTerm = prose.querySelector<HTMLElement>('dt');
    const definitionDescription = prose.querySelector<HTMLElement>('dd');
    const nestedList = prose.querySelector<HTMLElement>('li ul');
    const abbreviation = prose.querySelector<HTMLElement>('abbr[title]');
    const details = prose.querySelector<HTMLElement>('details');

    if (
      blockquote === null ||
      inlineCode === null ||
      tableCell === null ||
      tableCaption === null ||
      firstTableHeader === null ||
      lastTableHeader === null ||
      definitionTerm === null ||
      definitionDescription === null ||
      nestedList === null ||
      abbreviation === null ||
      details === null
    ) {
      throw new Error('Reading composition is missing prose semantic fixtures');
    }

    const proseStyle = getComputedStyle(prose);
    const blockquoteStyle = getComputedStyle(blockquote);
    const inlineCodeStyle = getComputedStyle(inlineCode);
    const tableCellStyle = getComputedStyle(tableCell);
    const tableCaptionStyle = getComputedStyle(tableCaption);
    const firstTableHeaderStyle = getComputedStyle(firstTableHeader);
    const lastTableHeaderStyle = getComputedStyle(lastTableHeader);
    const definitionTermStyle = getComputedStyle(definitionTerm);
    const definitionDescriptionStyle = getComputedStyle(definitionDescription);
    const nestedListStyle = getComputedStyle(nestedList);
    const abbreviationStyle = getComputedStyle(abbreviation);
    const detailsStyle = getComputedStyle(details);

    return {
      hasProseClass: prose.classList.contains('neoverse-prose'),
      hasReadingRole: prose.classList.contains('max-w-reading'),
      maxWidth: proseStyle.maxWidth,
      blockquoteBackground: blockquoteStyle.backgroundColor,
      blockquoteBorderWidth: blockquoteStyle.borderInlineStartWidth,
      codeFontFamily: inlineCodeStyle.fontFamily,
      bodyFontFamily: proseStyle.fontFamily,
      tableCellPaddingInline: tableCellStyle.paddingInline,
      tableCaptionColor: tableCaptionStyle.color,
      tableHeaderStartRadius: firstTableHeaderStyle.borderStartStartRadius,
      tableHeaderEndRadius: lastTableHeaderStyle.borderStartEndRadius,
      definitionTermWeight: definitionTermStyle.fontWeight,
      definitionDescriptionMargin: definitionDescriptionStyle.marginInlineStart,
      nestedListMarginBlock: nestedListStyle.marginBlock,
      abbreviationDecorationStyle: abbreviationStyle.textDecorationStyle,
      detailsBorderStyle: detailsStyle.borderStyle,
      detailsBoxShadow: detailsStyle.boxShadow,
      detailsBackgroundImage: detailsStyle.backgroundImage,
    };
  });

  expect(metrics.hasProseClass).toBe(true);
  expect(metrics.hasReadingRole).toBe(true);
  expect(metrics.maxWidth).not.toBe('none');
  expect(metrics.blockquoteBackground).not.toBe('rgba(0, 0, 0, 0)');
  // Prose callouts use material fill/shadow instead of a single-color rule.
  expect(metrics.blockquoteBorderWidth).toBe('0px');
  expect(metrics.codeFontFamily).not.toBe(metrics.bodyFontFamily);
  expect(metrics.tableCellPaddingInline).not.toBe('0px');
  expect(metrics.tableCaptionColor).not.toBe('rgba(0, 0, 0, 0)');
  expect(metrics.tableHeaderStartRadius).not.toBe('0px');
  expect(metrics.tableHeaderEndRadius).not.toBe('0px');
  expect(Number.parseInt(metrics.definitionTermWeight, 10)).toBeGreaterThanOrEqual(600);
  expect(metrics.definitionDescriptionMargin).not.toBe('0px');
  expect(metrics.nestedListMarginBlock).not.toBe('0px');
  expect(metrics.abbreviationDecorationStyle).toBe('dotted');
  expect(metrics.detailsBorderStyle).toBe('none');
  expect(metrics.detailsBoxShadow).not.toBe('none');
  expect(metrics.detailsBackgroundImage).toBe('none');

  await expect(page.locator('[data-reading-table]')).toHaveClass(/ui-table/);
  await expect(page.locator('[data-reading-disclosure]')).toHaveClass(/ui-disclosure/);
  await expect(page.locator('[data-reading-disclosure]')).not.toHaveClass(/material-glass-/);
  expect(
    await page
      .locator('[data-reading-disclosure]')
      .evaluate((element) => getComputedStyle(element).backdropFilter),
  ).toContain('blur(12px)');
  await expect(page.locator('[data-reading-prose] .playground-data-table-surface')).toHaveAttribute(
    'data-surface',
    'none',
  );

  const summary = page.locator('[data-reading-disclosure] > .ui-disclosure__summary');
  await summary.focus();
  const focusedSummary = await summary.evaluate((element) => {
    const style = getComputedStyle(element as HTMLElement);
    return { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth };
  });
  expect(focusedSummary.outlineStyle).not.toBe('none');
  expect(focusedSummary.outlineWidth).not.toBe('0px');

  await summary.press('Enter');
  await expect(page.locator('[data-reading-disclosure]')).toHaveAttribute('open', '');
  expect(
    await summary.evaluate((element) => getComputedStyle(element as HTMLElement).marginBlockEnd),
  ).not.toBe('0px');
});
