import { expect, test } from '@playwright/test';
import { layoutBreakpoints } from '../../packages/tokens/src/index';

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
    const search = document.querySelector<HTMLElement>('[data-specimen-search]');
    const specimenTitle = document.querySelector<HTMLElement>('[data-specimen-catalogue] h4');

    if (
      navigationItem === null ||
      hero === null ||
      heroTitle === null ||
      heroBody === undefined ||
      heroBody === null ||
      groupCard === null ||
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
  expect(metrics.searchHeight).toBeGreaterThanOrEqual(metrics.rootSize * 3.2);
  expect(metrics.specimenTitleFontSize).toBeGreaterThanOrEqual(metrics.rootSize * 0.84);
  expect(metrics.documentOverflow).toBeLessThanOrEqual(0);
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
        [1920, 4],
      ]),
    },
    {
      moduleId: 'shadow',
      selector: '.playground-token-grid',
      expected: new Map([
        [1280, 2],
        [1600, 3],
        [1920, 4],
      ]),
    },
    {
      moduleId: 'typography',
      selector: '.playground-specimen-grid',
      expected: new Map([
        [1280, 2],
        [1600, 2],
        [1920, 3],
      ]),
    },
  ] as const;

  for (const scenario of scenarios) {
    for (const [width, expectedColumns] of scenario.expected) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(`/?lang=en#${scenario.moduleId}`, { waitUntil: 'domcontentloaded' });

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
        rowCounts.every((count) => count === expectedColumns),
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
    const navigation = document.querySelector<HTMLElement>('[data-playground-navigation]');
    const pageRegion = document.querySelector<HTMLElement>('[data-playground-page]');
    const header = pageRegion?.querySelector<HTMLElement>('header');

    if (navigation === null || pageRegion === null || header === undefined || header === null) {
      throw new Error('Semantic Playground layout regions are missing');
    }

    return {
      rootSize,
      navigationWidth: navigation.getBoundingClientRect().width,
      pageWidth: pageRegion.getBoundingClientRect().width,
      pageMaxWidth: Number.parseFloat(getComputedStyle(pageRegion).maxWidth),
      headerMinHeight: Number.parseFloat(getComputedStyle(header).minHeight),
    };
  });

  expect(desktopMetrics.rootSize).toBeCloseTo(19, 1);
  expect(desktopMetrics.navigationWidth).toBeCloseTo(desktopMetrics.rootSize * 13, 1);
  expect(desktopMetrics.pageMaxWidth).toBeCloseTo(desktopMetrics.rootSize * 88, 1);
  expect(desktopMetrics.pageWidth).toBeLessThanOrEqual(desktopMetrics.pageMaxWidth);
  expect(desktopMetrics.pageMaxWidth - desktopMetrics.pageWidth).toBeLessThanOrEqual(
    desktopMetrics.rootSize,
  );
  expect(desktopMetrics.headerMinHeight).toBeCloseTo(desktopMetrics.rootSize * 3.5, 1);

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

test('playground keeps drawer navigation until the xl shell breakpoint', async ({ page }) => {
  await page.setViewportSize({ width: layoutBreakpoints.xl - 1, height: 900 });
  await page.goto('/?lang=en#controls', { waitUntil: 'domcontentloaded' });

  const navigation = page.locator('[data-playground-navigation]');
  const trigger = page.locator('[data-playground-nav-trigger]');
  const workspace = page.locator('[data-design-lab-workspace]');

  await expect(trigger).toBeVisible();
  expect(await navigation.evaluate((element) => (element as HTMLElement).inert)).toBe(true);
  expect(await navigation.evaluate((element) => getComputedStyle(element).position)).toBe('fixed');
  expect(
    await workspace.evaluate((element) => element.getBoundingClientRect().width),
  ).toBeGreaterThan(layoutBreakpoints.xl - 24);

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

test('legacy top-level module links resolve to their consolidated destination', async ({
  page,
}) => {
  await page.goto('/#spacing', { waitUntil: 'domcontentloaded' });

  await expect(page).toHaveURL(/#layout-shape$/);
  await expect(page.locator('#module-title')).toBeVisible();
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

test('playground demo actions stay inside the playground instead of navigating to GitHub', async ({
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
  await expect(page).toHaveURL(/\/react-fixture\?lang=en#react-runtime-fixture$/);

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
      definitionTermWeight: definitionTermStyle.fontWeight,
      definitionDescriptionMargin: definitionDescriptionStyle.marginInlineStart,
      nestedListMarginBlock: nestedListStyle.marginBlock,
      abbreviationDecorationStyle: abbreviationStyle.textDecorationStyle,
      detailsBorderStyle: detailsStyle.borderStyle,
    };
  });

  expect(metrics.hasProseClass).toBe(true);
  expect(metrics.hasReadingRole).toBe(true);
  expect(metrics.maxWidth).not.toBe('none');
  expect(metrics.blockquoteBackground).not.toBe('rgba(0, 0, 0, 0)');
  expect(metrics.blockquoteBorderWidth).not.toBe('0px');
  expect(metrics.codeFontFamily).not.toBe(metrics.bodyFontFamily);
  expect(metrics.tableCellPaddingInline).not.toBe('0px');
  expect(metrics.tableCaptionColor).not.toBe('rgba(0, 0, 0, 0)');
  expect(Number.parseInt(metrics.definitionTermWeight, 10)).toBeGreaterThanOrEqual(600);
  expect(metrics.definitionDescriptionMargin).not.toBe('0px');
  expect(metrics.nestedListMarginBlock).not.toBe('0px');
  expect(metrics.abbreviationDecorationStyle).toBe('dotted');
  expect(metrics.detailsBorderStyle).not.toBe('none');

  const summary = page.locator('[data-reading-prose] summary');
  await summary.focus();
  const focusedSummary = await summary.evaluate((element) => {
    const style = getComputedStyle(element as HTMLElement);
    return { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth };
  });
  expect(focusedSummary.outlineStyle).not.toBe('none');
  expect(focusedSummary.outlineWidth).not.toBe('0px');

  await summary.press('Enter');
  await expect(page.locator('[data-reading-prose] details')).toHaveAttribute('open', '');
  expect(
    await summary.evaluate((element) => getComputedStyle(element as HTMLElement).marginBlockEnd),
  ).not.toBe('0px');
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
    const tableScroll = document.querySelector<HTMLElement>('[data-reading-table-scroll]');
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
    await expect(card).toHaveAttribute('data-surface', 'glass-card');
    const backgroundColor = await card.evaluate(
      (element) => getComputedStyle(element).backgroundColor,
    );
    expect(backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(backgroundColor).not.toBe('transparent');

    const optOut = page.locator('[data-card-transparent-optout]');
    await expect(optOut).toHaveAttribute('data-surface', 'none');
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

test('semantic motion roles drive live feedback, state, and spatial transitions', async ({
  page,
}) => {
  await page.goto('/?lang=en#motion', { waitUntil: 'domcontentloaded' });

  const feedback = page.locator('[data-motion-semantic="feedback"]');
  const state = page.locator('[data-motion-semantic="state"]');
  const spatial = page.locator('[data-motion-semantic="spatial"]');
  const before = await Promise.all(
    [feedback, state, spatial].map((locator) =>
      locator.evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          translate: style.translate,
          opacity: style.opacity,
          backgroundColor: style.backgroundColor,
          duration: style.transitionDuration,
        };
      }),
    ),
  );

  await page.locator('[data-motion-semantic-toggle]').click();
  await page.waitForTimeout(450);

  const after = await Promise.all(
    [feedback, state, spatial].map((locator) =>
      locator.evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          translate: style.translate,
          opacity: style.opacity,
          backgroundColor: style.backgroundColor,
          duration: style.transitionDuration,
        };
      }),
    ),
  );

  expect(before[0]?.duration).not.toBe('0s');
  expect(before[1]?.duration).not.toBe('0s');
  expect(before[2]?.duration).not.toBe('0s');
  expect(after[0]?.opacity).not.toBe(before[0]?.opacity);
  expect(after[1]?.backgroundColor).not.toBe(before[1]?.backgroundColor);
  expect(after[2]?.opacity).not.toBe(before[2]?.opacity);
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
test('main playground swaps the material backdrop when switching to dark theme', async ({
  page,
}) => {
  await page.goto('/?theme=light&lang=en#materials', { waitUntil: 'domcontentloaded' });

  const backdrop = page.locator('[style*="material-background-"]').first();
  await expect(backdrop).toBeVisible();
  await expect(backdrop).toHaveAttribute('style', /material-background-light/);

  await page.getByRole('radio', { name: 'Dark' }).click();

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(backdrop).toHaveAttribute('style', /material-background-dark/);
});

test('system theme keeps the material backdrop synchronized with the preferred color scheme', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/?theme=system&lang=en#materials', { waitUntil: 'domcontentloaded' });

  const backdrop = page.locator('[style*="material-background-"]').first();
  await expect(backdrop).toHaveAttribute('style', /material-background-dark/);

  await page.emulateMedia({ colorScheme: 'light' });
  await expect(backdrop).toHaveAttribute('style', /material-background-light/);
});
