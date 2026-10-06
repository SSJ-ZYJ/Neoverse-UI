import { expect, test } from '@playwright/test';
import { presenceVariants } from '../../packages/motion/src/index';
import { layoutBreakpoints } from '../../packages/tokens/src/index';

const presentationViewports = [
  { label: 'mobile 390', width: 390, height: 844 },
  { label: 'desktop 1280', width: 1280, height: 900 },
  { label: 'desktop 1600', width: 1600, height: 900 },
  { label: 'desktop 1920', width: 1920, height: 1080 },
  { label: 'desktop 2560', width: 2560, height: 1080 },
] as const;

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

test('playground presentation density scales with desktop viewport width', async ({ page }) => {
  await page.goto('/#controls', { waitUntil: 'domcontentloaded' });

  const readRootFontSize = async (width: number): Promise<number> => {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(25);
    return page.evaluate(() =>
      Number.parseFloat(getComputedStyle(document.documentElement).fontSize),
    );
  };

  const expectedRootSizes = new Map([
    [1280, 17],
    [1600, 18],
    [1920, 19],
    [2560, 20],
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

  expect(metrics.rootSize).toBeCloseTo(19, 1);
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
  await page.getByRole('radio', { name: 'Raised' }).click();
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
        [1920, 3],
        [2560, 4],
      ]),
    },
    {
      moduleId: 'typography',
      selector: '.playground-specimen-grid',
      expected: new Map([
        [1280, 2],
        [1600, 2],
        [1920, 3],
        [2560, 3],
      ]),
    },
  ] as const;

  for (const scenario of scenarios) {
    for (const [width, expectedColumns] of scenario.expected) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(`/?lang=en#${scenario.moduleId}`, { waitUntil: 'domcontentloaded' });
      await expect(page.locator(scenario.selector).first()).toBeVisible();

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

  expect(desktopMetrics.rootSize).toBeCloseTo(19, 1);
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
  expect(desktopMetrics.headerMinHeight).toBeCloseTo(desktopMetrics.rootSize * 2.5, 1);

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

test('module toolbar keeps elevated Glass but uses the denser toolbar material token', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/?theme=dark&lang=zh#materials', { waitUntil: 'domcontentloaded' });

  const material = await page.locator('.playground-shell__toolbar').evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      surface: element.getAttribute('data-surface'),
      mode: element.getAttribute('data-toolbar-mode'),
      transparency: style.getPropertyValue('--neoverse-material-transparency').trim(),
      toolbarTransparency: style
        .getPropertyValue('--neoverse-playground-toolbar-module-transparency')
        .trim(),
      elevatedTransparency: style
        .getPropertyValue('--neoverse-material-glass-elevated-transparency')
        .trim(),
    };
  });

  expect(material.surface).toBe('glass-elevated');
  expect(material.mode).toBe('module');
  expect(material.transparency).toBe(material.toolbarTransparency);
  expect(material.transparency).not.toBe(material.elevatedTransparency);
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
  expect(metrics.buttonEdge).toBeLessThan(0.2);
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

test('playground visibly applies the Neoverse UI brand icon and favicon', async ({ page }) => {
  await page.goto('/?lang=zh', { waitUntil: 'domcontentloaded' });

  const brandIcon = page.locator('[data-playground-brand-icon]');
  await expect(brandIcon).toBeVisible();
  await expect
    .poll(() =>
      brandIcon.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0),
    )
    .toBe(true);

  const favicon = page.locator('link[rel~="icon"]');
  await expect(favicon).toHaveAttribute('href', /^data:image\/svg\+xml/);
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
  expect(metrics.detailsBorderStyle).toBe('solid');
  expect(metrics.detailsBoxShadow).not.toBe('none');
  expect(metrics.detailsBackgroundImage).toBe('none');

  await expect(page.locator('[data-reading-table]')).toHaveClass(/ui-table/);
  await expect(page.locator('[data-reading-disclosure]')).toHaveClass(/ui-disclosure/);
  await expect(page.locator('[data-reading-disclosure]')).toHaveClass(/material-glass-elevated/);
  await expect(page.locator('[data-reading-prose] .playground-data-table-surface')).toHaveClass(
    /material-glass-elevated/,
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

for (const theme of ['light', 'dark'] as const) {
  test(`standalone data display components keep native semantics and shared card material / ${theme}`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/?theme=${theme}&lang=en#data-display-table`, {
      waitUntil: 'domcontentloaded',
    });

    const table = page.locator('#data-display-table [data-data-display-table]');
    await expect(table).toHaveClass(/ui-table/);
    await expect(table.locator('caption')).toHaveText('Package compatibility matrix');
    await expect(table.locator('thead th')).toHaveCount(3);
    await expect(table.locator('tbody tr')).toHaveCount(3);
    const tableMaterial = await table.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        borderWidth: style.borderTopWidth,
        backgroundImage: style.backgroundImage,
        boxShadow: style.boxShadow,
        backdropFilter: style.backdropFilter,
      };
    });
    expect(tableMaterial.borderWidth).toBe('0px');
    expect(tableMaterial.backgroundImage).toBe('none');
    expect(tableMaterial.boxShadow).toBe('none');
    expect(tableMaterial.backdropFilter).toBe('none');
    expect(
      await table.locator('..').evaluate((element) => getComputedStyle(element).borderRadius),
    ).toBe('0px');

    const tableSurface = page.locator('#data-display-table .playground-data-table-surface');
    await expect(tableSurface).toHaveClass(/material-glass-elevated/);
    const cardMaterial = await tableSurface.evaluate((element) => {
      const style = getComputedStyle(element);
      const edge = getComputedStyle(element, '::before');
      return {
        boxShadow: style.boxShadow,
        backdropFilter: style.backdropFilter,
        edgeBackgroundImage: edge.backgroundImage,
      };
    });
    expect(cardMaterial.boxShadow).not.toBe('none');
    expect(cardMaterial.backdropFilter).not.toBe('none');
    expect(cardMaterial.edgeBackgroundImage).not.toBe('none');

    const tableBackdrop = page.locator('#data-display-table .playground-material-backdrop--inset');
    const tableBackdropMaterial = await tableBackdrop.evaluate((element) => {
      const style = getComputedStyle(element);
      const edge = getComputedStyle(element, '::before');
      return {
        boxShadow: style.boxShadow,
        edgeBackgroundImage: edge.backgroundImage,
        edgeOpacity: edge.opacity,
        edgeBackdropFilter: edge.backdropFilter,
      };
    });
    expect(tableBackdropMaterial.boxShadow).not.toBe('none');
    expect(tableBackdropMaterial.edgeBackgroundImage).not.toBe('none');
    expect(Number(tableBackdropMaterial.edgeOpacity)).toBeGreaterThan(0);
    expect(tableBackdropMaterial.edgeBackdropFilter).not.toBe('none');

    const captionMaterial = await table.locator('caption').evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        backgroundImage: style.backgroundImage,
        backgroundColor: style.backgroundColor,
        boxShadow: style.boxShadow,
      };
    });
    expect(captionMaterial.backgroundImage).toBe('none');
    expect(captionMaterial.backgroundColor).toBe('rgba(0, 0, 0, 0)');
    expect(captionMaterial.boxShadow).toBe('none');

    const cellMaterial = await table
      .locator('tbody td')
      .first()
      .evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          backgroundImage: style.backgroundImage,
          boxShadow: style.boxShadow,
          backdropFilter: style.backdropFilter,
        };
      });
    expect(cellMaterial.backgroundImage).toBe('none');
    expect(cellMaterial.boxShadow).toBe('none');
    expect(cellMaterial.backdropFilter).toBe('none');

    const headerMaterial = await table
      .locator('thead th')
      .first()
      .evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          backgroundImage: style.backgroundImage,
          backgroundColor: style.backgroundColor,
          boxShadow: style.boxShadow,
        };
      });
    const bodyBackgroundColor = await table
      .locator('tbody td')
      .first()
      .evaluate((element) => getComputedStyle(element).backgroundColor);
    expect(bodyBackgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(
      await table
        .locator('thead th')
        .first()
        .evaluate((element) => {
          const style = getComputedStyle(element);
          return [style.borderBlockStartWidth, style.borderInlineStartWidth];
        }),
    ).toEqual(['1px', '1px']);
    expect(headerMaterial.backgroundImage).toBe(cellMaterial.backgroundImage);
    expect(headerMaterial.backgroundColor).not.toBe(bodyBackgroundColor);
    expect(headerMaterial.boxShadow).toBe('none');

    await page.goto(`/?theme=${theme}&lang=en#data-display-disclosure`, {
      waitUntil: 'domcontentloaded',
    });
    const closed = page.locator('#data-display-disclosure [data-data-display-disclosure="closed"]');
    const open = page.locator('#data-display-disclosure [data-data-display-disclosure="open"]');
    await expect(closed).not.toHaveAttribute('open', '');
    await expect(open).toHaveAttribute('open', '');
    await expect(closed).toHaveClass(/material-glass-elevated/);
    await expect(open).toHaveClass(/material-glass-elevated/);
    await expect(closed.locator(':scope > summary')).toHaveClass(/ui-disclosure__summary/);

    const disclosureMaterial = await closed.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        backgroundImage: style.backgroundImage,
        boxShadow: style.boxShadow,
        backdropFilter: style.backdropFilter,
        edgeBackgroundImage: getComputedStyle(element, '::before').backgroundImage,
      };
    });
    expect(disclosureMaterial.backgroundImage).toBe('none');
    expect(disclosureMaterial.edgeBackgroundImage).not.toBe('none');
    expect(disclosureMaterial.boxShadow).not.toBe('none');
    expect(disclosureMaterial.backdropFilter).not.toBe('none');

    const closedSummary = closed.locator(':scope > summary');
    const summaryRest = await closedSummary.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        backgroundImage: style.backgroundImage,
        backgroundColor: style.backgroundColor,
      };
    });
    const supportsHover = await page.evaluate(() => window.matchMedia('(hover: hover)').matches);
    if (supportsHover) {
      const closedBackgroundRest = await closed.evaluate(
        (element) => getComputedStyle(element).backgroundColor,
      );
      const closedShadowRest = await closed.evaluate(
        (element) => getComputedStyle(element).boxShadow,
      );
      const indicatorRest = await closedSummary.evaluate(
        (element) => getComputedStyle(element, '::after').color,
      );
      await closedSummary.hover();
      const summaryHover = await closedSummary.evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          backgroundImage: style.backgroundImage,
          backgroundColor: style.backgroundColor,
        };
      });
      const indicatorHover = await closedSummary.evaluate(
        (element) => getComputedStyle(element, '::after').color,
      );
      expect(summaryHover).toEqual(summaryRest);
      await expect
        .poll(() => closed.evaluate((element) => getComputedStyle(element).backgroundColor))
        .not.toBe(closedBackgroundRest);
      await expect
        .poll(() => closed.evaluate((element) => getComputedStyle(element).boxShadow))
        .not.toBe(closedShadowRest);
      expect(indicatorHover).toBe(indicatorRest);
    }

    await closed.locator(':scope > summary').press('Enter');
    await expect(closed).toHaveAttribute('open', '');
  });
}

for (const theme of ['light', 'dark'] as const) {
  test(`form controls keep material state hierarchy without opacity-only disabled styling / ${theme}`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/?theme=${theme}&lang=en#forms-input`, {
      waitUntil: 'domcontentloaded',
    });

    const rest = page.locator('#forms-input [data-form-input]');
    const disabled = page.locator('#forms-input #forms-email-disabled');
    await expect(rest).toBeVisible();
    await expect(disabled).toBeDisabled();

    const restState = await rest.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        borderWidth: style.borderTopWidth,
        backgroundColor: style.backgroundColor,
        backgroundImage: style.backgroundImage,
        boxShadow: style.boxShadow,
        backdropFilter: style.backdropFilter,
      };
    });
    expect(restState.borderWidth).toBe('0px');
    expect(restState.backgroundImage).not.toBe('none');
    expect(restState.boxShadow).not.toBe('none');
    expect(restState.backdropFilter).not.toBe('none');

    await rest.focus();
    const focusedState = await rest.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        backgroundColor: style.backgroundColor,
        boxShadow: style.boxShadow,
      };
    });
    expect(focusedState.backgroundColor).not.toBe(restState.backgroundColor);
    expect(focusedState.boxShadow).not.toBe(restState.boxShadow);

    const disabledState = await disabled.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        opacity: style.opacity,
        cursor: style.cursor,
        backgroundColor: style.backgroundColor,
      };
    });
    expect(disabledState.opacity).toBe('1');
    expect(disabledState.cursor).toBe('not-allowed');
    expect(disabledState.backgroundColor).not.toBe(restState.backgroundColor);
  });
}

for (const theme of ['light', 'dark'] as const) {
  test(`feedback surfaces stay borderless while retaining material depth / ${theme}`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/?theme=${theme}&lang=en#status-feedback-badge`, {
      waitUntil: 'domcontentloaded',
    });

    const badge = page.locator('#status-feedback-badge .ui-badge--info');
    const statusDot = page.locator('#status-feedback-indicator .ui-status-indicator__dot').first();
    const notice = page.locator('#status-feedback-notice .ui-notice--info');
    const tooltip = page.locator(
      '#status-feedback-tooltip [data-qa-context="gradient"] .ui-tooltip-surface--accent',
    );
    const neutralTooltip = page.locator(
      '#status-feedback-tooltip [data-qa-context="gradient"] .ui-tooltip-surface--neutral',
    );

    await expect(badge).toBeVisible();
    await expect(statusDot).toBeVisible();
    await expect(notice).toBeVisible();
    await expect(tooltip).toBeVisible();
    await expect(neutralTooltip).toBeVisible();

    const badgeStyle = await badge.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        borderWidth: style.borderTopWidth,
        backgroundImage: style.backgroundImage,
        boxShadow: style.boxShadow,
      };
    });
    expect(badgeStyle.borderWidth).toBe('0px');
    expect(badgeStyle.backgroundImage).not.toBe('none');
    expect(badgeStyle.boxShadow).not.toBe('none');
    expect(
      badgeStyle.backgroundImage.match(/radial-gradient/g)?.length ?? 0,
    ).toBeGreaterThanOrEqual(4);

    const semanticBadgeBackgrounds = await page
      .locator(
        '#status-feedback-badge :is(.ui-badge--info, .ui-badge--success, .ui-badge--warning, .ui-badge--danger)',
      )
      .evaluateAll((elements) =>
        elements.map((element) => getComputedStyle(element).backgroundImage),
      );
    expect(semanticBadgeBackgrounds).toHaveLength(4);
    expect(new Set(semanticBadgeBackgrounds).size).toBe(4);

    const noticeStyle = await notice.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        borderWidth: style.borderTopWidth,
        backgroundImage: style.backgroundImage,
        boxShadow: style.boxShadow,
        backdropFilter: style.backdropFilter,
      };
    });
    expect(noticeStyle.borderWidth).toBe('0px');
    expect(noticeStyle.backgroundImage).not.toBe('none');
    expect(noticeStyle.boxShadow).not.toBe('none');
    expect(noticeStyle.backdropFilter).not.toBe('none');

    const tooltipStyle = await tooltip.evaluate((element) => {
      const style = getComputedStyle(element);
      const edge = getComputedStyle(element, '::before');
      const arrow = getComputedStyle(element, '::after');
      return {
        borderColor: style.borderTopColor,
        borderWidth: style.borderTopWidth,
        boxShadow: style.boxShadow,
        backdropFilter: style.backdropFilter,
        edgeBackgroundImage: edge.backgroundImage,
        edgeOpacity: Number(edge.opacity),
        arrowBorderWidth: arrow.borderTopWidth,
        arrowBoxShadow: arrow.boxShadow,
      };
    });
    expect(tooltipStyle.borderColor).toBe('rgba(0, 0, 0, 0)');
    expect(tooltipStyle.borderWidth).toBe('0px');
    expect(tooltipStyle.boxShadow).not.toBe('none');
    expect(
      tooltipStyle.boxShadow.includes('inset'),
      'accent Tooltip must not render a continuous inset top stroke',
    ).toBe(false);
    expect(tooltipStyle.edgeBackgroundImage).not.toBe('none');
    expect(tooltipStyle.edgeOpacity).toBeGreaterThan(0);
    expect(tooltipStyle.arrowBorderWidth).toBe('0px');
    expect(tooltipStyle.arrowBoxShadow.includes('inset')).toBe(false);
    expect(tooltipStyle.backdropFilter).not.toBe('none');

    const neutralArrowContrast = await neutralTooltip.evaluate((element) => {
      const body = getComputedStyle(element).backgroundColor;
      const arrow = getComputedStyle(element, '::after').backgroundColor;
      const alphaOf = (value: string): number => {
        const modern = value.match(/\/\s*([\d.]+)\)/);
        if (modern) return Number(modern[1]);
        const legacy = value.match(/rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)/);
        if (legacy) return Number(legacy[1]);
        return 1;
      };
      return {
        body,
        arrow,
        bodyAlpha: alphaOf(body),
        arrowAlpha: alphaOf(arrow),
      };
    });
    expect(
      neutralArrowContrast.arrow,
      'neutral Tooltip pointer must carry a visible fill',
    ).not.toBe('rgba(0, 0, 0, 0)');
    expect(
      neutralArrowContrast.arrowAlpha,
      'small neutral Tooltip pointer needs denser fill than the broad body plane',
    ).toBeGreaterThan(neutralArrowContrast.bodyAlpha);

    expect(await statusDot.evaluate((element) => getComputedStyle(element).boxShadow)).not.toBe(
      'none',
    );
  });
}

test('design QA matrices compare canonical components across shared backdrop contexts', async ({
  page,
}) => {
  for (const theme of ['light', 'dark'] as const) {
    await page.goto(`/?theme=${theme}&lang=en#controls-button`, {
      waitUntil: 'domcontentloaded',
    });

    const buttonMatrix = page.locator('#controls-button [data-qa-matrix]').first();
    await expect(buttonMatrix.locator('[data-qa-context]')).toHaveCount(3);
    await expect(buttonMatrix.locator('[data-qa-context="gradient"]')).toBeVisible();
    await expect(buttonMatrix.locator('[data-qa-context="neutral"]')).toBeVisible();
    await expect(buttonMatrix.locator('[data-qa-context="reduced"]')).toBeVisible();

    const backdropMetrics = await buttonMatrix.evaluate((matrix) => {
      const read = (id: string) => {
        const stage = matrix.querySelector<HTMLElement>(`[data-qa-stage="${id}"]`);
        if (!stage) throw new Error(`Missing QA stage: ${id}`);
        const style = getComputedStyle(stage);
        return {
          backgroundColor: style.backgroundColor,
          backgroundImage: style.backgroundImage,
          borderWidth: style.borderTopWidth,
          boxShadow: style.boxShadow,
        };
      };
      return {
        gradient: read('gradient'),
        neutral: read('neutral'),
        reduced: read('reduced'),
      };
    });

    expect(backdropMetrics.gradient.backgroundImage).not.toBe('none');
    expect(backdropMetrics.neutral.backgroundImage).toBe('none');
    expect(backdropMetrics.gradient.backgroundColor).not.toBe(
      backdropMetrics.neutral.backgroundColor,
    );
    expect(backdropMetrics.gradient.borderWidth).toBe('0px');
    expect(backdropMetrics.neutral.borderWidth).toBe('0px');
    expect(backdropMetrics.reduced.borderWidth).toBe('0px');
    expect(backdropMetrics.reduced.boxShadow).not.toBe('none');

    const reducedButton = buttonMatrix
      .locator('[data-qa-context="reduced"] .ui-button.material-glass-subtle')
      .first();
    await expect(reducedButton).toBeVisible();
    const reducedButtonStyle = await reducedButton.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        backdropFilter: style.backdropFilter,
        backgroundColor: style.backgroundColor,
      };
    });
    expect(reducedButtonStyle.backdropFilter).toBe('none');
    expect(reducedButtonStyle.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');

    const firstStateRow = page.locator('#controls-button [data-specimen-state-row]').first();
    const stateShell = await firstStateRow.evaluate((element) => {
      const preview = element.querySelector<HTMLElement>('[data-specimen-preview]');
      if (!preview) throw new Error('Missing state preview');
      const rowStyle = getComputedStyle(element);
      const previewStyle = getComputedStyle(preview);
      return {
        rowBorder: rowStyle.borderTopWidth,
        rowShadow: rowStyle.boxShadow,
        previewBorder: previewStyle.borderTopWidth,
        previewShadow: previewStyle.boxShadow,
      };
    });
    expect(stateShell.rowBorder).toBe('0px');
    expect(stateShell.previewBorder).toBe('0px');
    expect(stateShell.rowShadow).not.toBe('none');
    expect(stateShell.previewShadow).not.toBe('none');

    await page.goto(`/?theme=${theme}&lang=en#forms-input`, {
      waitUntil: 'domcontentloaded',
    });
    const formMatrix = page.locator('[data-forms-qa] [data-qa-matrix]');
    await expect(formMatrix.locator('[data-qa-context]')).toHaveCount(3);
    await expect(formMatrix.locator('[data-qa-context] .ui-input')).toHaveCount(3);
    await expect(formMatrix.locator('[data-qa-context] .ui-select')).toHaveCount(3);
    await expect(formMatrix.locator('[data-qa-context] .ui-textarea')).toHaveCount(3);

    await page.goto(`/?theme=${theme}&lang=en#card-card`, { waitUntil: 'domcontentloaded' });
    const cardMatrix = page.locator('[data-card-qa] [data-qa-matrix]');
    await expect(cardMatrix.locator('[data-qa-context] .ui-card')).toHaveCount(3);
    await page.goto(`/?theme=${theme}&lang=en#status-feedback-tooltip`, {
      waitUntil: 'domcontentloaded',
    });
    const tooltipMatrix = page.locator('#status-feedback-tooltip [data-qa-matrix]');
    await expect(tooltipMatrix.locator('[data-qa-context]')).toHaveCount(3);
    await expect(tooltipMatrix.locator('[data-qa-context] .ui-tooltip-surface')).toHaveCount(6);

    const tooltipPointerGeometry = await tooltipMatrix
      .locator('[data-qa-context="gradient"] .ui-tooltip-surface')
      .evaluateAll((elements) =>
        elements.map((element) => {
          const arrow = getComputedStyle(element, '::after');
          const arrowBottom = Number.parseFloat(arrow.bottom);
          return {
            arrowBottom,
            arrowLeftToken: getComputedStyle(element)
              .getPropertyValue('--ui-tooltip-arrow-left')
              .trim(),
            arrowTransform: arrow.transform,
          };
        }),
      );
    for (const geometry of tooltipPointerGeometry) {
      expect(geometry.arrowBottom, 'Tooltip pointer must sit below the surface body').toBeLessThan(
        0,
      );
      expect(geometry.arrowLeftToken, 'Tooltip pointer anchor stays centered').toBe('50%');
      expect(geometry.arrowTransform, 'Tooltip pointer compensates for its own width').not.toBe(
        'none',
      );
    }
  }
});

test('prose and reading fixtures keep mobile overflow inside their content regions', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?lang=en#foundation-prose', { waitUntil: 'domcontentloaded' });

  const foundationMetrics = await page.locator('[data-foundation-prose]').evaluate((element) => ({
    proseWidth: (element as HTMLElement).getBoundingClientRect().width,
    viewportWidth: document.documentElement.clientWidth,
    rootScrollWidth: document.documentElement.scrollWidth,
  }));

  expect(foundationMetrics.proseWidth).toBeLessThanOrEqual(foundationMetrics.viewportWidth);
  expect(foundationMetrics.rootScrollWidth).toBe(foundationMetrics.viewportWidth);

  await page.goto('/?lang=en#composition-reading', { waitUntil: 'domcontentloaded' });
  const readingMetrics = await page.evaluate(() => {
    const pre = document.querySelector<HTMLElement>('#reading-panel pre');
    const tableScroll = document.querySelector<HTMLElement>(
      '[data-reading-prose] [data-ui-table-region]',
    );
    const longInline = document.querySelector<HTMLElement>('[data-reading-long-inline]');
    if (pre === null || tableScroll === null || longInline === null) {
      throw new Error('Reading overflow fixtures are missing');
    }

    return {
      viewportWidth: document.documentElement.clientWidth,
      rootScrollWidth: document.documentElement.scrollWidth,
      preClientWidth: pre.clientWidth,
      preScrollWidth: pre.scrollWidth,
      tableWidth: tableScroll.getBoundingClientRect().width,
      inlineClientWidth: longInline.clientWidth,
      inlineScrollWidth: longInline.scrollWidth,
    };
  });

  expect(readingMetrics.rootScrollWidth).toBe(readingMetrics.viewportWidth);
  expect(readingMetrics.preScrollWidth).toBeGreaterThan(readingMetrics.preClientWidth);
  expect(readingMetrics.tableWidth).toBeLessThanOrEqual(readingMetrics.viewportWidth);
  expect(readingMetrics.inlineScrollWidth).toBeLessThanOrEqual(readingMetrics.inlineClientWidth);
});

test('overview catalogue searches public component API names', async ({ page }) => {
  await page.goto('/?lang=en', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-specimen-search]').fill('UiTooltipSurface');

  const result = page.locator('[data-specimen-catalogue] a[href="#status-feedback-tooltip"]');
  await expect(result).toBeVisible();
  await expect(page.locator('[data-specimen-catalogue] a')).toHaveCount(1);
});

test('control specimens expose the complete interactive state matrix', async ({ page }) => {
  await page.goto('/?lang=en#controls', { waitUntil: 'domcontentloaded' });

  const buttonSection = page.locator('#controls-button');
  const requiredStates = ['Default', 'Hover', 'Active', 'Focus', 'Disabled', 'Loading'];
  for (const label of requiredStates) {
    await expect(
      buttonSection.locator(`[data-specimen-state-row][data-specimen-label="${label}"]`),
    ).toBeVisible();
  }

  const disabledButton = buttonSection
    .locator('[data-specimen-state-row][data-specimen-label="Disabled"] .ui-button')
    .first();
  await expect(disabledButton).toBeDisabled();

  const loadingButton = buttonSection
    .locator('[data-specimen-state-row][data-specimen-label="Loading"] .ui-button')
    .first();
  await expect(loadingButton).toBeDisabled();
  await expect(loadingButton).toHaveAttribute('aria-busy', 'true');

  for (const sectionId of [
    'controls-button',
    'controls-icon-button',
    'controls-action',
    'controls-segmented-control',
  ]) {
    const rows = page.locator(`#${sectionId} [data-specimen-state-row]`);
    const rowCount = await rows.count();
    expect(rowCount, `${sectionId} should expose state specimens`).toBeGreaterThan(0);
    for (let index = 0; index < rowCount; index += 1) {
      const row = rows.nth(index);
      const specimenLabel = await row.getAttribute('data-specimen-label');
      expect(specimenLabel, `${sectionId} state ${index} should have a label`).not.toBeNull();
      await expect(row).toHaveAttribute('aria-label', specimenLabel ?? '');
    }
  }

  const disabledIconButton = page
    .locator('#controls-icon-button [data-specimen-state-row][data-specimen-label="Disabled"]')
    .locator('.ui-button')
    .first();
  await expect(disabledIconButton).toBeDisabled();

  const loadingIconButton = page
    .locator('#controls-icon-button [data-specimen-state-row][data-specimen-label="Loading"]')
    .locator('.ui-button')
    .first();
  await expect(loadingIconButton).toBeDisabled();
  await expect(loadingIconButton).toHaveAttribute('aria-busy', 'true');

  const disabledAction = page
    .locator('#controls-action [data-specimen-state-row][data-specimen-label="Disabled"]')
    .locator('.ui-action')
    .first();
  await expect(disabledAction).toHaveAttribute('aria-disabled', 'true');
  await expect(disabledAction).toHaveAttribute('tabindex', '-1');
  await expect(disabledAction).not.toHaveAttribute('href');

  const disabledSegments = page
    .locator(
      '#controls-segmented-control [data-specimen-state-row][data-specimen-label="Disabled"] .ui-segmented-control',
    )
    .first();
  await expect(disabledSegments).toHaveAttribute('aria-disabled', 'true');
  await expect(disabledSegments.locator('[role="radio"]')).toHaveCount(3);
  await expect(disabledSegments.locator('[role="radio"]:disabled')).toHaveCount(3);

  const loadingSegments = page
    .locator(
      '#controls-segmented-control [data-specimen-state-row][data-specimen-label="Loading"] .ui-segmented-control',
    )
    .first();
  await expect(loadingSegments).toHaveAttribute('aria-busy', 'true');
  await expect(loadingSegments.locator('[role="radio"]:disabled')).toHaveCount(3);

  const focusButton = buttonSection
    .locator('[data-specimen-state-row][data-specimen-label="Focus"] .ui-button')
    .first();
  await focusButton.focus();
  const focusStyle = await focusButton.evaluate((element) => {
    const style = getComputedStyle(element);
    return { outline: style.outlineStyle, shadow: style.boxShadow };
  });
  expect(focusStyle.outline !== 'none' || focusStyle.shadow !== 'none').toBe(true);

  const hoverButton = buttonSection
    .locator('[data-specimen-state-row][data-specimen-label="Hover"] .ui-button')
    .first();
  await hoverButton.hover();
  await expect(hoverButton).toBeVisible();
});

test('default cards keep a visible material fill in light and dark themes', async ({ page }) => {
  for (const theme of ['light', 'dark'] as const) {
    await page.goto(`/?theme=${theme}&lang=en#card`, { waitUntil: 'domcontentloaded' });

    const card = page.locator('[data-card-default]');
    await expect(card).toHaveAttribute('data-surface', 'glass-elevated');
    const backgroundColor = await card.evaluate(
      (element) => getComputedStyle(element).backgroundColor,
    );
    expect(backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(backgroundColor).not.toBe('transparent');

    const elevated = page.locator('#card-card .ui-card[data-surface="elevated"]');
    const elevatedStyle = await elevated.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        borderWidth: style.borderTopWidth,
        backgroundColor: style.backgroundColor,
        boxShadow: style.boxShadow,
      };
    });
    expect(elevatedStyle.borderWidth).toBe('0px');
    expect(elevatedStyle.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(elevatedStyle.boxShadow).not.toBe('none');

    const optOut = page.locator('[data-card-transparent-optout]');
    await expect(optOut).toHaveAttribute('data-surface', 'none');

    const optOutShell = optOut.locator('..');
    const shellStyle = await optOutShell.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        borderWidth: style.borderTopWidth,
        backgroundColor: style.backgroundColor,
      };
    });
    expect(shellStyle.borderWidth).toBe('0px');
    expect(shellStyle.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
  }
});

test('surface presets expose their native material without preview-only hairline borders', async ({
  page,
}) => {
  for (const theme of ['light', 'dark'] as const) {
    await page.goto(`/?theme=${theme}&lang=en#materials-surface`, {
      waitUntil: 'domcontentloaded',
    });

    for (const preset of ['solid', 'subtle', 'elevated', 'inset'] as const) {
      const surface = page.locator(`[data-surface-preset="${preset}"]`);
      await expect(surface).toBeVisible();
      const metrics = await surface.evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          borderWidth: style.borderTopWidth,
          backgroundColor: style.backgroundColor,
          backgroundImage: style.backgroundImage,
          boxShadow: style.boxShadow,
        };
      });

      expect(metrics.borderWidth).toBe('0px');
      expect(
        metrics.backgroundColor !== 'rgba(0, 0, 0, 0)' || metrics.backgroundImage !== 'none',
      ).toBe(true);

      if (preset === 'elevated' || preset === 'inset') {
        expect(metrics.boxShadow).not.toBe('none');
      }
    }
  }
});

test('in-page module anchors do not reset the workspace scroll position', async ({ page }) => {
  await page.goto('/#controls', { waitUntil: 'domcontentloaded' });

  const workspace = page.locator('[data-design-lab-workspace]');
  await workspace.evaluate((element) => element.scrollTo({ top: 900, behavior: 'auto' }));
  await page.evaluate(() => {
    window.location.hash = 'controls-action';
  });
  await page.waitForTimeout(100);

  expect(await workspace.evaluate((element) => element.scrollTop)).toBeGreaterThan(100);
  await expect(page).toHaveURL(/#controls-action$/);
});

test('specimen preview links do not navigate or reset the workspace scroll', async ({ page }) => {
  await page.goto('/?lang=en#controls', { waitUntil: 'domcontentloaded' });
  const workspace = page.locator('[data-design-lab-workspace]');
  const samples = [
    page.locator('#controls-action a[href="#controls-action"]').first(),
    page.locator('#controls-navigation-item a[href="#controls-navigation-item"]').first(),
    page.locator('#controls-breadcrumb a[href="#top"]').first(),
  ];

  for (const sample of samples) {
    await sample.scrollIntoViewIfNeeded();
    await sample.click({ trial: true });
    const before = await workspace.evaluate((element) => element.scrollTop);
    expect(before).toBeGreaterThan(100);
    // Avoid Playwright's second auto-scroll: only the anchor's click handler
    // should be allowed to change the workspace position in this assertion.
    await sample.evaluate((element) => (element as HTMLElement).click());
    await expect(page).toHaveURL(/#controls$/);
    const after = await workspace.evaluate((element) => element.scrollTop);
    expect(after).toBeGreaterThan(100);
    // Native scroll anchoring may shift a few pixels while late assets settle.
    // An actual placeholder jump or scroll reset is substantially larger.
    expect(Math.abs(after - before)).toBeLessThanOrEqual(64);
  }
});

test('real section navigation still follows its anchor', async ({ page }) => {
  await page.goto('/?lang=en#controls', { waitUntil: 'domcontentloaded' });
  await page
    .locator('nav.playground-floating-interaction-surface a[href="#controls-action"]')
    .click();
  await expect(page).toHaveURL(/#controls-action$/);
  await expect(page.locator('#controls-action')).toBeInViewport();
});

test('reading composition keeps its real cross-module link', async ({ page }) => {
  await page.goto('/?lang=en#composition', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-reading-surface-link]').click();
  await expect(page).toHaveURL(/#materials-surface$/);
  await expect(page.locator('#materials-surface')).toBeVisible();
});

test('composition preview actions do not navigate to placeholder anchors', async ({ page }) => {
  await page.goto('/?lang=en#consumer-parity', { waitUntil: 'domcontentloaded' });
  const sample = page.locator('[data-consumer-parity="hero-actions"] a').first();
  await sample.click();
  await expect(page).toHaveURL(/#consumer-parity$/);
});

test('mobile playground header preserves title width and stays within the viewport', async ({
  page,
}) => {
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/?lang=en#controls', { waitUntil: 'domcontentloaded' });

    const metrics = await page.evaluate(() => {
      const title = document.querySelector<HTMLElement>('#module-title');
      const header = document.querySelector<HTMLElement>('[data-playground-page] > header');
      if (title === null || header === null) {
        throw new Error('Playground mobile header fixtures are missing');
      }

      return {
        documentOverflow:
          document.documentElement.scrollWidth - document.documentElement.clientWidth,
        bodyOverflow: document.body.scrollWidth - document.body.clientWidth,
        titleClientWidth: title.clientWidth,
        titleScrollWidth: title.scrollWidth,
        headerRight: header.getBoundingClientRect().right,
        viewportWidth: document.documentElement.clientWidth,
      };
    });

    expect(metrics.documentOverflow, `document overflow at ${width}px`).toBeLessThanOrEqual(0);
    expect(metrics.bodyOverflow, `body overflow at ${width}px`).toBeLessThanOrEqual(0);
    expect(metrics.titleClientWidth, `title width at ${width}px`).toBeGreaterThan(80);
    expect(
      metrics.titleScrollWidth - metrics.titleClientWidth,
      `title truncation at ${width}px`,
    ).toBeLessThanOrEqual(1);
    expect(metrics.headerRight, `header edge at ${width}px`).toBeLessThanOrEqual(
      metrics.viewportWidth,
    );
    await expect(page.locator('[data-back-to-overview]')).toBeHidden();
  }
});

test('closed mobile navigation is inert and restores focus to its trigger', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
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
  const drawerMetrics = await navigation.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {
      left: rect.left,
      top: rect.top,
      rightGap: document.documentElement.clientWidth - rect.right,
      bottomGap: document.documentElement.clientHeight - rect.bottom,
      radius: Number.parseFloat(getComputedStyle(element).borderTopLeftRadius),
    };
  });
  expect(drawerMetrics.left).toBeGreaterThan(0);
  expect(drawerMetrics.top).toBeGreaterThan(0);
  expect(drawerMetrics.rightGap).toBeGreaterThan(0);
  expect(drawerMetrics.bottomGap).toBeGreaterThan(0);
  expect(drawerMetrics.radius).toBeGreaterThan(0);

  await page.keyboard.press('Escape');
  expect(await navigation.evaluate((element) => (element as HTMLElement).inert)).toBe(true);
  await expect
    .poll(() => trigger.evaluate((element) => document.activeElement === element))
    .toBe(true);
});

test('mobile color palettes keep horizontal density inside their own scroll regions', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#colors', { waitUntil: 'domcontentloaded' });

  const metrics = await page.evaluate(() => {
    const strip = document.querySelector<HTMLElement>('[data-color-palette-strip]');
    if (strip === null) {
      throw new Error('Color palette strip is missing');
    }

    return {
      documentOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      stripClientWidth: strip.clientWidth,
      stripScrollWidth: strip.scrollWidth,
    };
  });

  expect(metrics.documentOverflow).toBeLessThanOrEqual(0);
  expect(metrics.stripScrollWidth).toBeGreaterThan(metrics.stripClientWidth);
});

test('color swatches expose full token names without truncation', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/?lang=en#colors', { waitUntil: 'domcontentloaded' });

  const clipped = await page.locator('[data-color-swatch-cell]').evaluateAll((cells) =>
    cells.flatMap((cell) =>
      [
        ...cell.querySelectorAll<HTMLElement>(
          '[data-color-swatch-label], [data-color-swatch-variable], [data-color-swatch-class]',
        ),
      ]
        .filter((element) => {
          const style = getComputedStyle(element);
          return style.textOverflow === 'ellipsis' || style.whiteSpace === 'nowrap';
        })
        .map((element) => element.textContent?.trim() ?? ''),
    ),
  );

  expect(clipped).toEqual([]);

  const typography = await page
    .locator('[data-color-swatch-cell]')
    .first()
    .evaluate((cell) => {
      const label = cell.querySelector<HTMLElement>('[data-color-swatch-label]');
      const variable = cell.querySelector<HTMLElement>('[data-color-swatch-variable]');
      if (label === null || variable === null) {
        throw new Error('Color swatch typography is missing');
      }

      const labelStyle = getComputedStyle(label);
      const variableStyle = getComputedStyle(variable);
      return {
        labelFontSize: Number.parseFloat(labelStyle.fontSize),
        variableFontSize: Number.parseFloat(variableStyle.fontSize),
        variableOverflowWrap: variableStyle.overflowWrap,
        variableWordBreak: variableStyle.wordBreak,
      };
    });

  expect(typography.variableFontSize).toBeLessThan(typography.labelFontSize);
  expect(typography.variableOverflowWrap).toBe('break-word');
  expect(typography.variableWordBreak).toBe('normal');
  await expect(page.getByText('Secondary foreground').first()).toBeVisible();
  await expect(
    page.getByText('--neoverse-color-accent-secondary-foreground').first(),
  ).toBeVisible();
});

test('isolated scrollbar fixture renders the real UiScrollbar overlay', async ({ page }) => {
  await page.goto('/frame?theme=light&lang=en#scrollbar-component', {
    waitUntil: 'domcontentloaded',
  });

  const scrollbar = page.locator('[data-ui-scrollbar-fixture]');
  await expect(scrollbar).toHaveCount(1);
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeGreaterThan(
    await page.evaluate(() => window.innerHeight),
  );

  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight }));
  await expect.poll(() => scrollbar.getAttribute('data-visible')).toBe('true');
});

test('React runtime fixture renders and updates the public adapter set', async ({ page }) => {
  await page.goto('/react-fixture?lang=en', { waitUntil: 'domcontentloaded' });

  const adapters = page.locator('[data-react-adapter]');
  await expect(adapters).toHaveCount(6);
  for (const adapter of [
    'UiSurface',
    'UiAction',
    'UiButton',
    'UiIconButton',
    'UiNotice',
    'UiCard',
  ]) {
    await expect(page.locator(`[data-react-adapter="${adapter}"]`)).toBeVisible();
  }

  const button = page.locator('[data-react-adapter="UiButton"]');
  await expect(button).toContainText('Count 0');
  await button.click();
  await expect(button).toContainText('Count 1');
  await expect(button).toHaveClass(/ui-button/);
});

test('motion playground exercises semantic roles and the current presence contract', async ({
  page,
}) => {
  await page.goto('/?lang=en#motion', { waitUntil: 'domcontentloaded' });

  const roleDurations = await page.evaluate(() => {
    const style = getComputedStyle(document.documentElement);
    return {
      feedback: style.getPropertyValue('--neoverse-motion-feedback-duration').trim(),
      state: style.getPropertyValue('--neoverse-motion-state-duration').trim(),
      spatial: style.getPropertyValue('--neoverse-motion-spatial-duration').trim(),
      enter: style.getPropertyValue('--neoverse-motion-enter-duration').trim(),
      exit: style.getPropertyValue('--neoverse-motion-exit-duration').trim(),
    };
  });
  for (const duration of Object.values(roleDurations)) {
    expect(duration).not.toBe('');
    expect(duration).not.toBe('0ms');
    expect(duration).not.toBe('0s');
  }

  const specimens = page.locator('[data-motion-presence-specimen]');
  await expect(specimens).toHaveCount(presenceVariants.length);
  const renderedVariants = await specimens.evaluateAll((elements) =>
    elements.map((element) => element.getAttribute('data-neoverse-motion')),
  );
  expect(renderedVariants).toEqual([...presenceVariants]);

  const vuePresence = page.locator('[data-motion-presence-adapter="vue"]');
  await expect(vuePresence).toHaveAttribute('data-neoverse-motion', 'veil');
  await expect(vuePresence).toHaveClass(/nv-appear/);

  const staggeredItems = page.locator('[data-motion-presence-group-item]');
  await expect(staggeredItems).toHaveCount(5);
  const staggerDelays = await staggeredItems.evaluateAll((elements) =>
    elements.map((element) =>
      (element as HTMLElement).style.getPropertyValue('--neoverse-motion-enter-delay'),
    ),
  );
  expect(staggerDelays[0]).toBe('');
  expect(staggerDelays.slice(1)).toEqual(['40ms', '80ms', '120ms', '160ms']);

  const toggle = page.locator('[data-motion-presence-toggle]');
  await toggle.click();
  await expect(specimens).toHaveCount(0);
  await expect(vuePresence).toHaveCount(0);

  await toggle.click();
  await expect(specimens).toHaveCount(presenceVariants.length);
  await expect(page.locator('[data-motion-presence-adapter="vue"]')).toBeVisible();

  await page.emulateMedia({ reducedMotion: 'reduce' });
  const reducedDurations = await page.evaluate(() => {
    const style = getComputedStyle(document.documentElement);
    return {
      feedback: style.getPropertyValue('--neoverse-motion-feedback-duration').trim(),
      state: style.getPropertyValue('--neoverse-motion-state-duration').trim(),
      spatial: style.getPropertyValue('--neoverse-motion-spatial-duration').trim(),
      enter: style.getPropertyValue('--neoverse-motion-enter-duration').trim(),
      exit: style.getPropertyValue('--neoverse-motion-exit-duration').trim(),
      particle: style.getPropertyValue('--neoverse-motion-particle-duration').trim(),
    };
  });
  expect(new Set(Object.values(reducedDurations))).toEqual(new Set(['1ms']));
});

test('floating dock keeps balanced geometry across desktop presentation scales', async ({
  page,
}) => {
  for (const width of [1280, 1600, 1920, 2560]) {
    await page.setViewportSize({ width, height: 1080 });
    await page.goto('/?theme=dark&lang=en#consumer-parity', { waitUntil: 'domcontentloaded' });

    const metrics = await page
      .locator('[data-consumer-parity="floating-navigation"]')
      .evaluate((dock) => {
        const active = dock.querySelector<HTMLElement>(
          '.consumer-parity-dock__item.ui-navigation-item--active',
        );
        const icon = active?.querySelector<HTMLElement>('.ui-action__leading > svg');
        const indicator = active?.querySelector<HTMLElement>('.ui-navigation-item__indicator');
        const trailing = dock.querySelector<HTMLElement>('.ui-control-surface__group--trailing');
        const option = trailing?.querySelector<HTMLElement>('.ui-segmented-control__option');
        if (!active || !icon || !indicator || !trailing || !option) {
          throw new Error('Floating dock geometry nodes are missing');
        }

        const dockRect = dock.getBoundingClientRect();
        const activeRect = active.getBoundingClientRect();
        const iconRect = icon.getBoundingClientRect();
        const indicatorRect = indicator.getBoundingClientRect();
        const trailingRect = trailing.getBoundingClientRect();
        const optionRect = option.getBoundingClientRect();
        const items = [...dock.querySelectorAll<HTMLElement>('.consumer-parity-dock__item')];
        const itemRects = items.map((item) => item.getBoundingClientRect());
        const itemGaps = itemRects.slice(1).flatMap((rect, index) => {
          const previous = itemRects[index];
          return previous ? [rect.left - previous.right] : [];
        });
        const rootFontSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
        const navigationFontSize = Number.parseFloat(getComputedStyle(active).fontSize);

        return {
          usesSharedDock: dock.classList.contains('ui-dock'),
          documentOverflow:
            document.documentElement.scrollWidth - document.documentElement.clientWidth,
          navigationHeight: activeRect.height,
          navigationFontRatio: navigationFontSize / rootFontSize,
          minimumItemGapRatio: Math.min(...itemGaps) / rootFontSize,
          indicatorContentGap: indicatorRect.top - iconRect.bottom,
          leadingOuterGap: activeRect.left - dockRect.left,
          topOuterGap: activeRect.top - dockRect.top,
          trailingOuterGap: dockRect.right - trailingRect.right,
          optionHeight: optionRect.height,
          trailingInsideDock: trailingRect.right <= dockRect.right + 0.1,
        };
      });

    expect(metrics.usesSharedDock, `viewport ${width}`).toBe(true);
    expect(metrics.documentOverflow, `viewport ${width}`).toBeLessThanOrEqual(0);
    expect(metrics.trailingInsideDock, `viewport ${width}`).toBe(true);
    expect(
      metrics.minimumItemGapRatio,
      `navigation item spacing at viewport ${width}`,
    ).toBeGreaterThanOrEqual(0.2);
    expect(
      metrics.navigationFontRatio,
      `navigation label density at viewport ${width}`,
    ).toBeLessThanOrEqual(0.72);
    expect(
      metrics.indicatorContentGap / metrics.navigationHeight,
      `indicator breathing room at viewport ${width}`,
    ).toBeGreaterThanOrEqual(0.13);
    expect(
      Math.abs(metrics.leadingOuterGap - metrics.topOuterGap),
      `leading edge inset balance at viewport ${width}`,
    ).toBeLessThanOrEqual(0.75);
    expect(
      Math.abs(metrics.trailingOuterGap - metrics.topOuterGap),
      `trailing edge inset balance at viewport ${width}`,
    ).toBeLessThanOrEqual(0.75);
    expect(
      metrics.optionHeight / metrics.navigationHeight,
      `segmented option density at viewport ${width}`,
    ).toBeLessThanOrEqual(0.9);
  }
});

test('dock is discoverable as a standalone component specimen', async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name !== 'desktop',
    'This assertion defines the desktop Dock specimen.',
  );

  await page.goto('/?theme=dark&lang=en#dock-component', { waitUntil: 'domcontentloaded' });

  const specimen = page.locator('#dock-component');
  await expect(specimen).toBeVisible();
  const docks = specimen.locator('.ui-dock');
  await expect(docks).toHaveCount(2);
  await expect(docks.first()).toHaveAttribute('data-surface', 'chrome');
  await expect(docks.first()).toHaveClass(/ui-control-surface--scale-lg/);
  await expect(docks.nth(1)).toHaveClass(/ui-dock--compact/);
  await expect(docks.nth(1)).toHaveClass(/ui-control-surface--scale-md/);
  await expect(docks.first().locator('.ui-control-surface__group--trailing')).toHaveCount(1);
  await expect(specimen.locator('[data-specimen-state-row]')).toHaveCount(0);

  const geometry = await specimen
    .locator('[data-dock-specimen="standard"] [data-dock-preview]')
    .evaluate((preview) => {
      const dock = preview.querySelector<HTMLElement>('.ui-dock');
      if (dock === null) throw new Error('Standard Dock is missing');
      const previewRect = preview.getBoundingClientRect();
      const dockRect = dock.getBoundingClientRect();
      return {
        previewClientWidth: preview.clientWidth,
        previewScrollWidth: preview.scrollWidth,
        dockWidth: dockRect.width,
        dockInsidePreview:
          dockRect.left >= previewRect.left - 0.1 && dockRect.right <= previewRect.right + 0.1,
        documentOverflow:
          document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });

  expect(geometry.previewScrollWidth).toBeLessThanOrEqual(geometry.previewClientWidth + 1);
  expect(geometry.dockWidth).toBeLessThan(geometry.previewClientWidth);
  expect(geometry.dockInsidePreview).toBe(true);
  expect(geometry.documentOverflow).toBeLessThanOrEqual(0);
});

test('state-row previews use a tokenized presentation scale inside a dedicated stage', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'This assertion defines desktop specimen scale.');

  await page.goto('/?theme=dark&lang=zh#controls-navigation-item', {
    waitUntil: 'domcontentloaded',
  });

  const preview = page
    .locator('#controls-navigation-item [data-specimen-state-row] [data-specimen-preview]')
    .first();
  const navigationItem = preview.locator('.ui-navigation-item').first();
  const metrics = await navigationItem.evaluate((element) => {
    const previewContent = element.closest('.playground-specimen-preview__content');
    const stateRow = element.closest<HTMLElement>('[data-specimen-state-row]');
    const copyHeading = stateRow?.querySelector<HTMLElement>('[data-specimen-copy] h3');
    const copyHint = stateRow?.querySelector<HTMLElement>('[data-specimen-copy] p');
    if (!(previewContent instanceof HTMLElement))
      throw new Error('Missing specimen preview content');
    if (!(copyHeading instanceof HTMLElement) || !(copyHint instanceof HTMLElement))
      throw new Error('Missing specimen copy');
    const rect = element.getBoundingClientRect();
    return {
      rootFontSize: Number.parseFloat(getComputedStyle(document.documentElement).fontSize),
      copyHeadingFontSize: Number.parseFloat(getComputedStyle(copyHeading).fontSize),
      copyHintFontSize: Number.parseFloat(getComputedStyle(copyHint).fontSize),
      zoom: Number.parseFloat(getComputedStyle(previewContent).zoom),
      stageBackground: getComputedStyle(previewContent.parentElement as HTMLElement)
        .backgroundImage,
      renderedHeight: rect.height,
      cssHeight: Number.parseFloat(getComputedStyle(element).height),
      documentOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });

  expect(metrics.zoom).toBeGreaterThan(1);
  expect(metrics.zoom).toBeLessThanOrEqual(1.3);
  expect(metrics.stageBackground).toContain('radial-gradient');
  expect(metrics.copyHeadingFontSize / metrics.rootFontSize).toBeGreaterThanOrEqual(0.8);
  expect(metrics.copyHeadingFontSize / metrics.rootFontSize).toBeLessThan(1);
  expect(metrics.copyHintFontSize / metrics.rootFontSize).toBeGreaterThanOrEqual(0.8);
  expect(metrics.copyHintFontSize / metrics.rootFontSize).toBeLessThan(1);
  expect(metrics.copyHeadingFontSize).toBeCloseTo(metrics.copyHintFontSize, 1);
  expect(metrics.renderedHeight / metrics.cssHeight).toBeCloseTo(metrics.zoom, 1);
  expect(metrics.documentOverflow).toBeLessThanOrEqual(0);

  for (const selector of [
    '#controls-button [data-specimen-preview]',
    '#controls-segmented-control [data-specimen-preview]',
  ]) {
    await expect(page.locator(selector).first()).toBeVisible();
    const zoom = await page
      .locator(`${selector} .playground-specimen-preview__content`)
      .first()
      .evaluate((element) => Number.parseFloat(getComputedStyle(element).zoom));
    expect(zoom).toBeCloseTo(metrics.zoom, 2);
  }
});

test('icon button geometry follows the canonical size selectors', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Desktop component geometry contract.');
  await page.goto('/?theme=light&lang=en#controls-icon-button', {
    waitUntil: 'domcontentloaded',
  });

  const md = page.locator('#controls-icon-button .ui-icon-button--md').first();
  const stretch = page.locator('#controls-button .ui-icon-button--stretch').first();
  const sm = page.locator('#controls-density [data-density-controls] .ui-icon-button--sm').first();
  const smButton = page
    .locator('#controls-density [data-density-controls] .ui-button--sm:not(.ui-icon-button)')
    .first();

  await expect(md).toBeVisible();
  await expect(stretch).toBeVisible();
  await expect(sm).toBeVisible();
  await expect(smButton).toBeVisible();

  const geometry = await page.evaluate(() => {
    const read = (selector: string) => {
      const element = document.querySelector<HTMLElement>(selector);
      if (!element) throw new Error(`Missing geometry fixture: ${selector}`);
      const rect = element.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    };

    const stretchElement = document.querySelector<HTMLElement>(
      '#controls-button .ui-icon-button--stretch',
    );
    const stretchParent = stretchElement?.parentElement;
    if (!stretchParent) throw new Error('Missing stretch IconButton row');
    const stretchParentRect = stretchParent.getBoundingClientRect();

    return {
      md: read('#controls-icon-button .ui-icon-button--md'),
      stretch: read('#controls-button .ui-icon-button--stretch'),
      stretchParent: { width: stretchParentRect.width, height: stretchParentRect.height },
      sm: read('#controls-density [data-density-controls] .ui-icon-button--sm'),
      smButton: read(
        '#controls-density [data-density-controls] .ui-button--sm:not(.ui-icon-button)',
      ),
    };
  });

  expect(geometry.md.width).toBeCloseTo(geometry.md.height, 1);
  expect(geometry.sm.width).toBeCloseTo(geometry.sm.height, 1);
  expect(geometry.sm.height).toBeCloseTo(geometry.smButton.height, 1);
  expect(geometry.stretch.height).toBeCloseTo(geometry.stretchParent.height, 1);
  expect(geometry.stretch.width).toBeGreaterThan(geometry.md.width);
});

test('shared navigation indicator stays aligned inside the scaled specimen stage', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Desktop scaled specimen geometry.');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?theme=light&lang=zh#controls-surface', {
    waitUntil: 'domcontentloaded',
  });

  const surface = page.locator('#controls-surface .ui-control-surface--shared-indicator').last();
  await expect(surface).toHaveAttribute('data-neoverse-navigation-indicator-ready', 'true');

  const readAlignment = () =>
    surface.evaluate((element) => {
      const active = element.querySelector<HTMLElement>('.ui-navigation-item--active');
      const marker = active?.querySelector<HTMLElement>('.ui-navigation-item__indicator');
      const shared = element.querySelector<HTMLElement>('.ui-control-surface__indicator');
      const preview = element.closest<HTMLElement>('.playground-specimen-preview__content');
      if (!active || !marker || !shared || !preview) {
        throw new Error('Shared navigation indicator fixture is incomplete');
      }
      const markerRect = marker.getBoundingClientRect();
      const sharedRect = shared.getBoundingClientRect();
      return {
        previewZoom: Number.parseFloat(getComputedStyle(preview).zoom),
        x: Math.abs(sharedRect.x - markerRect.x),
        y: Math.abs(sharedRect.y - markerRect.y),
        width: Math.abs(sharedRect.width - markerRect.width),
        height: Math.abs(sharedRect.height - markerRect.height),
      };
    });

  const initial = await readAlignment();
  expect(initial.previewZoom).toBeGreaterThan(1);
  expect(initial.x).toBeLessThanOrEqual(0.2);
  expect(initial.y).toBeLessThanOrEqual(0.2);
  expect(initial.width).toBeLessThanOrEqual(0.2);
  expect(initial.height).toBeLessThanOrEqual(0.2);

  const components = surface.getByRole('link', { name: '组件' });
  await components.click();
  await expect(components).toHaveAttribute('aria-current', 'page');

  const moved = await readAlignment();
  expect(moved.x).toBeLessThanOrEqual(0.2);
  expect(moved.y).toBeLessThanOrEqual(0.2);
  expect(moved.width).toBeLessThanOrEqual(0.2);
  expect(moved.height).toBeLessThanOrEqual(0.2);
});

for (const theme of ['light', 'dark'] as const) {
  test(`grouped controls preserve concentric corners at both scales / ${theme}`, async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'Desktop control corner geometry.');
    await page.goto(`/?theme=${theme}&lang=en#controls-surface`, {
      waitUntil: 'domcontentloaded',
    });
    const geometry = await page
      .locator('#controls-surface .ui-control-surface')
      .evaluateAll((surfaces) =>
        surfaces
          .filter((surface) => surface.textContent?.includes('scale='))
          .map((surface) => {
            const button = surface.querySelector('.ui-button');
            if (!(surface instanceof HTMLElement) || !(button instanceof HTMLElement)) {
              throw new Error('Scale example is missing a control');
            }
            const parent = surface.getBoundingClientRect();
            const scale = parent.width / surface.offsetWidth;
            const innerRadius = Number.parseFloat(getComputedStyle(button).borderTopLeftRadius);
            const radiusProbe = document.createElement('span');
            radiusProbe.style.position = 'absolute';
            radiusProbe.style.borderRadius = 'var(--neoverse-control-surface-inner-radius)';
            surface.append(radiusProbe);
            const expectedInnerRadius = Number.parseFloat(
              getComputedStyle(radiusProbe).borderTopLeftRadius,
            );
            radiusProbe.remove();
            return { scale, innerRadius, expectedInnerRadius };
          }),
      );
    expect(geometry).toHaveLength(2);
    expect(geometry[1]?.scale).toBeGreaterThan(geometry[0]?.scale ?? 0);
    for (const item of geometry) {
      expect(item.innerRadius).toBeCloseTo(item.expectedInnerRadius, 0);
    }
  });
}
for (const theme of ['light', 'dark'] as const) {
  test(`segmented plates and CSS refraction share concentric corners / ${theme}`, async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'Desktop corner geometry.');
    await page.goto(`/?theme=${theme}&lang=en#controls-segmented-control`, {
      waitUntil: 'domcontentloaded',
    });
    const segmented = page
      .locator('#controls-segmented-control .ui-segmented-control[data-surface="glass-subtle"]')
      .first();
    const corners = await segmented.evaluate((element) => {
      if (!(element instanceof HTMLElement)) throw new Error('Missing segmented control root');
      const slider = element.querySelector<HTMLElement>('.ui-segmented-control__slider');
      if (slider === null) throw new Error('Missing active plate');
      const root = element.getBoundingClientRect();
      const plate = slider.getBoundingClientRect();
      const scale = root.width / element.offsetWidth;
      return {
        outer: Number.parseFloat(getComputedStyle(element).borderTopLeftRadius),
        inner: Number.parseFloat(getComputedStyle(slider).borderTopLeftRadius),
        inset: (plate.top - root.top) / scale,
      };
    });
    expect(corners.inner).toBeCloseTo(corners.outer - corners.inset, 0);

    await page.goto(`/?theme=${theme}&lang=en#controls-surface`, {
      waitUntil: 'domcontentloaded',
    });
    const localEdge = page
      .locator('#controls-surface .ui-control-surface[data-neoverse-glass-edge-pass="css"]')
      .first();
    const cssEdge = await localEdge.evaluate((element) => {
      const root = getComputedStyle(element);
      const edge = getComputedStyle(element, '::before');
      return {
        radius: root.borderTopLeftRadius,
        inset: edge.top,
        edgeRadius: edge.borderTopLeftRadius,
      };
    });
    expect(cssEdge.inset).toBe('0px');
    expect(cssEdge.edgeRadius).toBe(cssEdge.radius);
  });
}

test('light segmented selections keep a visible well, raised plate, and aligned tab indicator', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Desktop light-theme material contract.');
  await page.goto('/?theme=light&lang=en#controls-segmented-control', {
    waitUntil: 'domcontentloaded',
  });

  const segmented = page
    .locator('#controls-segmented-control .ui-segmented-control[data-surface="glass-subtle"]')
    .first();

  await page.evaluate(() => {
    document.documentElement.removeAttribute('data-neoverse-glass-renderer');
  });
  const readShellEdge = () =>
    segmented.evaluate((element) => {
      const root = getComputedStyle(element);
      const edge = getComputedStyle(element, '::before');
      return {
        borderColor: root.borderTopColor,
        display: edge.display,
        opacity: Number.parseFloat(edge.opacity) || 0,
        backgroundImage: edge.backgroundImage,
      };
    });
  const edgeAtRest = await readShellEdge();
  expect(edgeAtRest.borderColor).toBe('rgba(0, 0, 0, 0)');
  expect(edgeAtRest.display).toBe('block');
  expect(edgeAtRest.opacity).toBeGreaterThan(0);
  expect(edgeAtRest.backgroundImage).not.toBe('none');

  const material = await segmented.evaluate((element) => {
    const colorAlpha = (value: string): number => {
      if (value === 'transparent') return 0;
      const slash = value.match(/\/\s*([\d.]+)\s*\)$/);
      if (slash?.[1] !== undefined) return Number.parseFloat(slash[1]);
      const rgba = value.match(/^rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)$/);
      if (rgba?.[1] !== undefined) return Number.parseFloat(rgba[1]);
      return 1;
    };

    const slider = element.querySelector<HTMLElement>('.ui-segmented-control__slider');
    if (slider === null) throw new Error('Missing active segmented plate');
    const activeOption = element.querySelector<HTMLElement>(
      '.ui-segmented-control__option--active',
    );
    if (activeOption === null) throw new Error('Missing active segmented option');
    const rootStyle = getComputedStyle(element);
    const sliderStyle = getComputedStyle(slider);
    return {
      wellAlpha: colorAlpha(rootStyle.backgroundColor),
      plateAlpha: colorAlpha(sliderStyle.backgroundColor),
      plateInsetLayers: sliderStyle.boxShadow.match(/inset/g)?.length ?? 0,
      plateShadow: sliderStyle.boxShadow,
    };
  });

  expect(material.wellAlpha).toBeGreaterThan(0);
  expect(material.plateAlpha).toBeGreaterThan(material.wellAlpha);
  expect(material.plateInsetLayers).toBeGreaterThanOrEqual(1);
  expect(material.plateShadow).not.toBe('none');

  const readWellState = () =>
    segmented.evaluate((element) => {
      const style = getComputedStyle(element);
      const perceivedLightness = (value: string): number => {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const context = canvas.getContext('2d');
        if (context === null) throw new Error('Unable to create color sampling context');
        context.clearRect(0, 0, 1, 1);
        context.fillStyle = value;
        context.fillRect(0, 0, 1, 1);
        const [red = 0, green = 0, blue = 0, alphaByte = 255] = context.getImageData(
          0,
          0,
          1,
          1,
        ).data;
        const alpha = alphaByte / 255;
        const composite = (channel: number) => (channel * alpha + 255 * (1 - alpha)) / 255;
        return composite(red) * 0.2126 + composite(green) * 0.7152 + composite(blue) * 0.0722;
      };
      return {
        backgroundColor: style.backgroundColor,
        backgroundImage: style.backgroundImage,
        borderColor: style.borderTopColor,
        boxShadow: style.boxShadow,
        backdropFilter: style.backdropFilter,
        lightness: perceivedLightness(style.backgroundColor),
      };
    });

  const restingWellState = await readWellState();

  await segmented.hover();
  const edgeOnHover = await readShellEdge();
  expect(edgeOnHover.borderColor).toBe(edgeAtRest.borderColor);
  expect(edgeOnHover.display).toBe(edgeAtRest.display);
  expect(edgeOnHover.opacity).toBe(edgeAtRest.opacity);
  expect(edgeOnHover.backgroundImage).toBe(edgeAtRest.backgroundImage);

  const hoveredWellState = await readWellState();
  expect(hoveredWellState.lightness).toBeCloseTo(restingWellState.lightness, 3);
  expect(hoveredWellState.backgroundColor).toBe(restingWellState.backgroundColor);
  expect(hoveredWellState.borderColor).toBe(restingWellState.borderColor);
  expect(hoveredWellState.boxShadow).toBe(restingWellState.boxShadow);
  expect(hoveredWellState.backdropFilter).toBe(restingWellState.backdropFilter);
  expect(hoveredWellState.backgroundImage).toBe(restingWellState.backgroundImage);

  const activeOption = segmented.locator('.ui-segmented-control__option--active');
  await activeOption.focus();
  const focusVisual = await activeOption.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
      boxShadow: style.boxShadow,
    };
  });
  expect(focusVisual.outlineStyle).not.toBe('none');
  expect(Number.parseFloat(focusVisual.outlineWidth)).toBeGreaterThan(0);
  expect(focusVisual.boxShadow).toBe('none');

  await page.goto('/?theme=light&lang=en#controls-surface', {
    waitUntil: 'domcontentloaded',
  });
  const tabs = page.locator('#controls-surface .ui-control-surface--shared-indicator').last();
  await tabs.locator('.ui-navigation-item').nth(1).click();
  const selection = await tabs.evaluate((element) => {
    const colorAlpha = (value: string): number => {
      if (value === 'transparent') return 0;
      const slash = value.match(/\/\s*([\d.]+)\s*\)$/);
      if (slash?.[1] !== undefined) return Number.parseFloat(slash[1]);
      const rgba = value.match(/^rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)$/);
      if (rgba?.[1] !== undefined) return Number.parseFloat(rgba[1]);
      return 1;
    };

    const active = element.querySelector<HTMLElement>('.ui-navigation-item--active');
    const indicator = element.querySelector<HTMLElement>('.ui-control-surface__indicator');
    if (active === null || indicator === null) throw new Error('Missing shared tab selection');
    const style = getComputedStyle(element);
    const spatialDuration = style.getPropertyValue('--neoverse-motion-spatial-duration').trim();
    const expectedDuration = spatialDuration.endsWith('ms')
      ? Number.parseFloat(spatialDuration) / 1000
      : Number.parseFloat(spatialDuration);
    return {
      borderAlpha: colorAlpha(getComputedStyle(active).borderTopColor),
      duration: Number.parseFloat(getComputedStyle(indicator).transitionDuration) || 0,
      expectedDuration,
    };
  });

  expect(selection.borderAlpha).toBeLessThanOrEqual(0.05);
  expect(selection.duration).toBeCloseTo(selection.expectedDuration, 3);
  await expect
    .poll(
      () =>
        tabs.evaluate((element) => {
          const target = element.querySelector<HTMLElement>(
            '.ui-navigation-item--active .ui-navigation-item__indicator',
          );
          const indicator = element.querySelector<HTMLElement>('.ui-control-surface__indicator');
          if (target === null || indicator === null) {
            throw new Error('Missing shared tab selection');
          }
          const targetRect = target.getBoundingClientRect();
          const indicatorRect = indicator.getBoundingClientRect();
          return Math.abs(
            indicatorRect.left + indicatorRect.width / 2 - (targetRect.left + targetRect.width / 2),
          );
        }),
      { timeout: Math.ceil(selection.expectedDuration * 4000 + 250) },
    )
    .toBeLessThanOrEqual(1.5);
});

test('shadow token specimens always place a full-width preview above their text', async ({
  page,
}) => {
  await page.goto('/?theme=dark&lang=en#shadow', { waitUntil: 'domcontentloaded' });
  const specimens = page.locator('#shadow-primitive .playground-shadow-token');
  await expect(specimens).toHaveCount(7);
  const geometry = await specimens.evaluateAll((elements) =>
    elements.map((element) => {
      const preview = element.querySelector<HTMLElement>('[data-preview="shadow"]');
      const copy = element.querySelector<HTMLElement>(':scope > span:last-child');
      if (preview === null || copy === null) throw new Error('Incomplete shadow specimen');
      const sample = preview.getBoundingClientRect();
      const label = copy.getBoundingClientRect();
      const card = element.getBoundingClientRect();
      return {
        layout: getComputedStyle(element).display,
        previewWidth: sample.width,
        availableWidth: card.width,
        previewBottom: sample.bottom,
        copyTop: label.top,
        copyFits: copy.scrollWidth <= copy.clientWidth + 1,
      };
    }),
  );
  expect(geometry.every((item) => item.layout === 'grid')).toBe(true);
  expect(geometry.every((item) => item.previewWidth > item.availableWidth * 0.8)).toBe(true);
  expect(geometry.every((item) => item.copyTop >= item.previewBottom)).toBe(true);
  expect(geometry.every((item) => item.copyFits)).toBe(true);
});

for (const theme of ['light', 'dark'] as const) {
  test(`reading composition keeps prose on the shared Glass material without solid rules / ${theme}`, async ({
    page,
  }) => {
    await page.goto(`/?theme=${theme}&lang=en#composition-reading`, {
      waitUntil: 'domcontentloaded',
    });
    const tableRegion = page.locator('[data-reading-prose] [data-ui-table-region]');
    await expect(tableRegion).not.toHaveAttribute('data-surface');
    const tableSurface = page.locator('[data-reading-prose] .playground-data-table-surface');
    await expect(tableSurface).toHaveAttribute('data-surface', 'glass-elevated');
    const article = page.locator('[data-reading-composition] article');
    await expect(article).toHaveAttribute('data-surface', 'glass-elevated');
    const proseMaterial = await article.evaluate((element, activeTheme) => {
      const quote = element.querySelector('blockquote');
      const inlineCode = element.querySelector('p code');
      const prose = element.querySelector('[data-reading-prose]');
      if (quote === null || inlineCode === null || prose === null)
        throw new Error('Missing prose material samples');
      const articleStyle = getComputedStyle(element);
      const quoteStyle = getComputedStyle(quote);
      const inlineCodeStyle = getComputedStyle(inlineCode);
      const inlineCodeProbe = document.createElement('span');
      inlineCodeProbe.style.position = 'fixed';
      inlineCodeProbe.style.insetInlineStart = '-9999px';
      inlineCodeProbe.style.background =
        activeTheme === 'light'
          ? 'var(--neoverse-surface-inset-hover-background)'
          : 'var(--neoverse-surface-inset-sheen), var(--neoverse-surface-inset-alternate-fill)';
      element.append(inlineCodeProbe);
      const inlineCodeProbeStyle = getComputedStyle(inlineCodeProbe);
      const expectedInlineCodeBackground = inlineCodeProbeStyle.backgroundImage;
      const expectedInlineCodeBackgroundColor = inlineCodeProbeStyle.backgroundColor;
      inlineCodeProbe.remove();
      return {
        articleBackground: articleStyle.backgroundImage,
        articleBackgroundColor: articleStyle.backgroundColor,
        articleFilter: articleStyle.backdropFilter,
        proseBackground: getComputedStyle(prose).backgroundImage,
        proseFilter: getComputedStyle(prose).backdropFilter,
        articleShadow: articleStyle.boxShadow,
        quoteBackground: quoteStyle.backgroundImage,
        quoteBackgroundColor: quoteStyle.backgroundColor,
        quoteShadow: quoteStyle.boxShadow,
        quoteBorder: quoteStyle.borderTopWidth,
        quoteFilter: quoteStyle.backdropFilter,
        inlineCodeBackground: inlineCodeStyle.backgroundImage,
        inlineCodeBackgroundColor: inlineCodeStyle.backgroundColor,
        inlineCodeShadow: inlineCodeStyle.boxShadow,
        inlineCodeBorder: inlineCodeStyle.borderTopWidth,
        expectedInlineCodeBackground,
        expectedInlineCodeBackgroundColor,
      };
    }, theme);
    // UiSurface owns the sampled Glass color plane; prose owns typography and
    // does not add another background or backdrop blur to that plane.
    expect(proseMaterial.articleBackground).toBe('none');
    expect(proseMaterial.articleBackgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(proseMaterial.articleFilter).toContain('blur(');
    expect(proseMaterial.proseBackground).toBe('none');
    expect(proseMaterial.proseFilter).toBe('none');
    expect(proseMaterial.articleShadow).not.toBe('none');
    expect(proseMaterial.quoteBackground).not.toBe('none');
    expect(proseMaterial.quoteBorder).toBe('0px');
    expect(proseMaterial.quoteFilter).not.toBe('none');
    expect(proseMaterial.inlineCodeBackground).not.toBe('none');
    expect(proseMaterial.inlineCodeBorder).toBe('0px');
    expect(proseMaterial.inlineCodeBackground).toBe(proseMaterial.expectedInlineCodeBackground);
    expect(proseMaterial.inlineCodeBackgroundColor).toBe(
      proseMaterial.expectedInlineCodeBackgroundColor,
    );
    expect(proseMaterial.quoteBackgroundColor).not.toBe(proseMaterial.inlineCodeBackgroundColor);
    expect(proseMaterial.quoteShadow).not.toBe(proseMaterial.inlineCodeShadow);
    const metrics = await tableRegion.evaluate((element) => {
      const table = element.querySelector('table');
      const cell = element.querySelector('tbody td');
      const zebraRow = element.querySelector('tbody tr:nth-child(even)');
      const zebraFirstCell = zebraRow?.querySelector('td:first-child') ?? null;
      const zebraLastCell = zebraRow?.querySelector('td:last-child') ?? null;
      if (
        table === null ||
        cell === null ||
        zebraRow === null ||
        zebraFirstCell === null ||
        zebraLastCell === null
      ) {
        throw new Error('Missing reading table');
      }
      const tableStyle = getComputedStyle(table);
      const surface = element.closest<HTMLElement>('.playground-data-table-surface');
      if (surface === null) throw new Error('Missing reading table surface');
      const surfaceStyle = getComputedStyle(surface);
      const zebraRowStyle = getComputedStyle(zebraRow);
      const zebraFirstCellStyle = getComputedStyle(zebraFirstCell);
      const zebraLastCellStyle = getComputedStyle(zebraLastCell);
      return {
        surfaceFilter: surfaceStyle.backdropFilter,
        filter: tableStyle.backdropFilter,
        background: tableStyle.backgroundImage,
        border: tableStyle.borderTopWidth,
        cellBorder: getComputedStyle(cell).borderRightWidth,
        zebraRowBackground: zebraRowStyle.backgroundColor,
        zebraCellBackground: zebraFirstCellStyle.backgroundColor,
        bottomStartRadius: zebraFirstCellStyle.borderBottomLeftRadius,
        bottomEndRadius: zebraLastCellStyle.borderBottomRightRadius,
        documentOverflow:
          document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });
    expect(metrics.surfaceFilter).not.toBe('none');
    expect(metrics.filter).toBe('none');
    expect(metrics.background).toBe('none');
    expect(metrics.border).toBe('0px');
    expect(metrics.cellBorder).not.toBe('0px');
    expect(metrics.zebraRowBackground).toBe('rgba(0, 0, 0, 0)');
    expect(metrics.zebraCellBackground).not.toBe('rgba(0, 0, 0, 0)');
    expect(metrics.bottomStartRadius).not.toBe('0px');
    expect(metrics.bottomEndRadius).not.toBe('0px');
    expect(metrics.documentOverflow).toBeLessThanOrEqual(0);
  });
}

test('floating dock keeps hovered and active navigation plates visually separated', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Mouse hover regression is desktop-specific.');
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/?theme=dark&lang=zh#consumer-parity', { waitUntil: 'domcontentloaded' });

  const dock = page.locator('[data-consumer-parity="floating-navigation"]');
  const items = dock.locator('.consumer-parity-dock__item');
  await items.nth(1).hover();

  const metrics = await dock.evaluate((element) => {
    const navItems = [...element.querySelectorAll<HTMLElement>('.consumer-parity-dock__item')];
    const active = navItems[0];
    const hovered = navItems[1];
    if (!active || !hovered) throw new Error('Adjacent navigation items are missing');
    const activeRect = active.getBoundingClientRect();
    const hoveredRect = hovered.getBoundingClientRect();
    return {
      gap: hoveredRect.left - activeRect.right,
      rootFontSize: Number.parseFloat(getComputedStyle(document.documentElement).fontSize),
      activeBackground: getComputedStyle(active).backgroundImage,
      hoveredBackground: getComputedStyle(hovered).backgroundColor,
    };
  });

  expect(metrics.gap).toBeGreaterThanOrEqual(metrics.rootFontSize * 0.2);
  expect(metrics.activeBackground).not.toBe('none');
  expect(metrics.hoveredBackground).not.toBe('rgba(0, 0, 0, 0)');
});
test('Glass preview stages reuse one controlled gradient without raster backdrops', async ({
  page,
}, testInfo) => {
  await page.goto('/?theme=light&lang=en#materials', { waitUntil: 'domcontentloaded' });

  const stages = page.locator('[data-glass-preview-stage]');
  await expect(stages).toHaveCount(3);

  const readStages = () =>
    stages.evaluateAll((elements) =>
      elements.map((element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return {
          backgroundImage: style.backgroundImage,
          backgroundColor: style.backgroundColor,
          width: rect.width,
          height: rect.height,
        };
      }),
    );

  const lightStages = await readStages();
  expect(new Set(lightStages.map(({ backgroundImage }) => backgroundImage)).size).toBe(1);
  expect(
    lightStages.every(
      ({ backgroundImage }) =>
        backgroundImage.includes('radial-gradient') && !backgroundImage.includes('url('),
    ),
  ).toBe(true);
  expect(
    Math.max(...lightStages.map(({ width }) => width)) -
      Math.min(...lightStages.map(({ width }) => width)),
  ).toBeLessThanOrEqual(1);
  expect(
    Math.max(...lightStages.map(({ height }) => height)) -
      Math.min(...lightStages.map(({ height }) => height)),
  ).toBeLessThanOrEqual(1);

  if (testInfo.project.name === 'mobile') {
    await page.getByRole('button', { name: /Cycle theme/ }).click();
  } else {
    await page.getByRole('radio', { name: 'Dark' }).click();
  }

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  const darkStages = await readStages();
  expect(new Set(darkStages.map(({ backgroundImage }) => backgroundImage)).size).toBe(1);
  expect(darkStages.every(({ backgroundImage }) => !backgroundImage.includes('url('))).toBe(true);
});

test('shell segmented controls keep their own Glass surface inside the Glass header', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Pointer hover regression is desktop-specific.');

  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/?theme=dark&lang=zh#controls', { waitUntil: 'domcontentloaded' });

  const control = page.locator('[data-playground-page] > header .ui-segmented-control').first();
  const inactive = control
    .locator('.ui-segmented-control__option:not(.ui-segmented-control__option--active)')
    .first();
  await expect(control).toHaveAttribute('data-surface', 'glass-subtle');
  await expect(inactive).toBeVisible();

  const controlSurface = await control.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      backgroundColor: style.backgroundColor,
      backgroundImage: style.backgroundImage,
      borderColor: style.borderColor,
      borderStyle: style.borderStyle,
      boxShadow: style.boxShadow,
      backdropFilter: style.backdropFilter,
    };
  });
  expect(
    controlSurface.backgroundColor !== 'rgba(0, 0, 0, 0)' ||
      controlSurface.backgroundImage !== 'none' ||
      (controlSurface.borderStyle !== 'none' &&
        controlSurface.borderColor !== 'rgba(0, 0, 0, 0)') ||
      controlSurface.boxShadow !== 'none' ||
      controlSurface.backdropFilter !== 'none',
  ).toBe(true);

  const readOptionPlate = () =>
    inactive.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        backgroundColor: style.backgroundColor,
        backgroundImage: style.backgroundImage,
        borderColor: style.borderColor,
        borderStyle: style.borderStyle,
        boxShadow: style.boxShadow,
      };
    });

  const resting = await readOptionPlate();
  expect(resting.backgroundColor).toBe('rgba(0, 0, 0, 0)');
  expect(resting.backgroundImage).toBe('none');
  expect(resting.borderColor).toBe('rgba(0, 0, 0, 0)');
  expect(resting.boxShadow).toBe('none');

  await inactive.hover();
  const hovered = await readOptionPlate();
  expect(
    hovered.backgroundColor !== 'rgba(0, 0, 0, 0)' ||
      hovered.backgroundImage !== 'none' ||
      (hovered.borderStyle !== 'none' && hovered.borderColor !== 'rgba(0, 0, 0, 0)') ||
      hovered.boxShadow !== 'none',
  ).toBe(true);
});

test('system theme keeps the gradient preview backdrop synchronized with the preferred color scheme', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/?theme=system&lang=en#materials', { waitUntil: 'domcontentloaded' });

  const backdrop = page.locator('[data-glass-preview-stage]').first();
  await expect(backdrop).toBeVisible();
  const dark = await backdrop.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      backgroundImage: style.backgroundImage,
      backgroundColor: style.backgroundColor,
    };
  });
  expect(dark.backgroundImage).toContain('radial-gradient');
  expect(dark.backgroundImage).not.toContain('url(');

  await page.emulateMedia({ colorScheme: 'light' });
  await expect
    .poll(() => backdrop.evaluate((element) => getComputedStyle(element).backgroundColor))
    .not.toBe(dark.backgroundColor);
});

test('Playground keeps the 100% zoom presentation baseline across responsive widths', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'desktop',
    'The baseline is covered once from the desktop project.',
  );

  for (const viewport of presentationViewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/?theme=light&lang=en#controls', { waitUntil: 'domcontentloaded' });

    const metrics = await page.evaluate(() => {
      const shell = document.querySelector<HTMLElement>('main:not([data-design-lab-region])');
      if (shell === null) {
        throw new Error('Playground shell is missing');
      }

      return {
        devicePixelRatio: window.devicePixelRatio,
        visualViewportScale: window.visualViewport?.scale ?? 1,
        shellWidth: shell.getBoundingClientRect().width,
        viewportWidth: window.innerWidth,
        documentOverflow:
          document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });

    expect(metrics.devicePixelRatio, viewport.label).toBe(1);
    expect(metrics.visualViewportScale, viewport.label).toBe(1);
    expect(metrics.shellWidth, viewport.label).toBeCloseTo(metrics.viewportWidth, 1);
    expect(metrics.documentOverflow, viewport.label).toBeLessThanOrEqual(0);
  }
});

test('high-risk Playground surfaces stay inside local overflow regions across themes and widths', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'desktop',
    'Responsive coverage runs once from the desktop project.',
  );

  const routes = [
    { moduleId: 'controls', selector: '[data-design-lab-region="module"]' },
    { moduleId: 'composition', selector: '[data-design-lab-region="module"]' },
    { moduleId: 'consumer-parity', selector: '[data-consumer-parity="floating-navigation"]' },
  ] as const;

  for (const theme of ['light', 'dark'] as const) {
    for (const viewport of presentationViewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      for (const route of routes) {
        await page.goto(`/?theme=${theme}&lang=en#${route.moduleId}`, {
          waitUntil: 'domcontentloaded',
        });
        const target = page.locator(route.selector).first();
        await expect(target, `${theme} ${viewport.label} ${route.moduleId}`).toBeVisible();

        const metrics = await page.evaluate((selector) => {
          const workspace = document.querySelector<HTMLElement>('[data-design-lab-workspace]');
          const target = document.querySelector<HTMLElement>(selector);
          if (workspace === null || target === null) {
            throw new Error(`Responsive fixture is missing: ${selector}`);
          }

          const rect = target.getBoundingClientRect();
          return {
            workspaceOverflow: workspace.scrollWidth - workspace.clientWidth,
            documentOverflow:
              document.documentElement.scrollWidth - document.documentElement.clientWidth,
            bodyOverflow: document.body.scrollWidth - document.body.clientWidth,
            targetLeft: rect.left,
            targetRight: rect.right,
            viewportWidth: window.innerWidth,
          };
        }, route.selector);

        expect(
          metrics.workspaceOverflow,
          `${theme} ${viewport.label} ${route.moduleId}`,
        ).toBeLessThanOrEqual(1);
        expect(
          metrics.documentOverflow,
          `${theme} ${viewport.label} ${route.moduleId}`,
        ).toBeLessThanOrEqual(0);
        expect(
          metrics.bodyOverflow,
          `${theme} ${viewport.label} ${route.moduleId}`,
        ).toBeLessThanOrEqual(0);
        expect(
          metrics.targetLeft,
          `${theme} ${viewport.label} ${route.moduleId}`,
        ).toBeGreaterThanOrEqual(-1);
        expect(
          metrics.targetRight,
          `${theme} ${viewport.label} ${route.moduleId}`,
        ).toBeLessThanOrEqual(metrics.viewportWidth + 1);
      }
    }
  }
});

test('keyboard focus remains visible on representative Playground controls in both themes', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'desktop',
    'Keyboard focus coverage runs once from the desktop project.',
  );

  const focusTargets = [
    '#controls-button [data-specimen-state-row][data-specimen-label="Focus"] .ui-button',
    '#controls-icon-button [data-specimen-state-row][data-specimen-label="Focus"] .ui-button',
    '#controls-action [data-specimen-state-row][data-specimen-label="Focus"] .ui-action',
    '#controls-navigation-item [data-specimen-state-row][data-specimen-label="Focus"] .ui-navigation-item',
    '#controls-segmented-control [data-specimen-state-row][data-specimen-label="Focus"] [role="radio"]',
  ];

  for (const theme of ['light', 'dark'] as const) {
    await page.goto(`/frame?theme=${theme}&lang=en#controls`, { waitUntil: 'domcontentloaded' });
    for (const selector of focusTargets) {
      const target = page.locator(selector).first();
      await expect(target, `${theme} ${selector}`).toBeVisible();
      await target.focus();
      const focusState = await target.evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          isFocusVisible: element.matches(':focus-visible'),
          outlineStyle: style.outlineStyle,
          outlineWidth: style.outlineWidth,
          boxShadow: style.boxShadow,
        };
      });

      expect(focusState.isFocusVisible, `${theme} ${selector}`).toBe(true);
      expect(
        focusState.outlineWidth !== '0px' ||
          focusState.outlineStyle !== 'none' ||
          focusState.boxShadow !== 'none',
        `${theme} ${selector}`,
      ).toBe(true);
    }
  }
});
