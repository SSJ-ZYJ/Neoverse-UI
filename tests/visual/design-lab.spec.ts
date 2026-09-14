import { expect, test } from '@playwright/test';

const themes = ['light', 'dark'] as const;
const modules = [
  'typography',
  'materials',
  'controls',
  'status-feedback',
  'card',
  'consumer-parity',
] as const;

const freezeMotion = `
  *, *::before, *::after {
    animation-delay: 0s !important;
    animation-duration: 0s !important;
    animation-iteration-count: 1 !important;
    caret-color: transparent !important;
    transition-delay: 0s !important;
    transition-duration: 0s !important;
  }
`;

const waitForStableAssets = async (): Promise<void> => {
  await document.fonts?.ready;
  const images = [...document.images];
  await Promise.all(
    images.map(
      (image) =>
        image.complete ||
        new Promise<void>((resolve) => {
          image.addEventListener('load', () => resolve(), { once: true });
          image.addEventListener('error', () => resolve(), { once: true });
        }),
    ),
  );
};

for (const theme of themes) {
  for (const moduleId of modules) {
    test(`${moduleId} / ${theme}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(`/frame?theme=${theme}&lang=en#${moduleId}`, {
        waitUntil: 'domcontentloaded',
      });
      await page.addStyleTag({ content: freezeMotion });
      await page.evaluate(waitForStableAssets);
      await page.evaluate(() => window.scrollTo(0, 0));

      const region = page.locator('[data-design-lab-region="module"]');
      await expect(region).toBeVisible();
      await expect(region).toHaveScreenshot(`${moduleId}-${theme}.png`);
    });
  }
}

test('consumer parity exposes destination and current-page semantics', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/frame?theme=dark&lang=en#consumer-parity', {
    waitUntil: 'domcontentloaded',
  });
  await page.evaluate(waitForStableAssets);

  const heroActions = page.locator('[data-consumer-parity="hero-actions"] a');
  await expect(heroActions).toHaveCount(6);
  await expect(heroActions).toHaveText([
    'Website',
    'Blog',
    'Linux.Do',
    'RedNote',
    'Email',
    'GitHub',
  ]);
  expect(
    await heroActions.evaluateAll((elements) =>
      elements.map((element) =>
        [...element.classList].find((className) => className.startsWith('ui-button--')),
      ),
    ),
  ).toEqual([
    'ui-button--primary',
    'ui-button--secondary',
    'ui-button--secondary',
    'ui-button--secondary',
    'ui-button--secondary',
    'ui-button--secondary',
  ]);

  const navigation = page.getByRole('navigation', { name: 'Primary navigation' });
  await expect(navigation).toBeVisible();
  await expect(navigation.getByRole('link', { name: 'Home' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await navigation.getByRole('link', { name: 'Projects' }).click();
  await expect(navigation.getByRole('link', { name: 'Projects' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(navigation.getByRole('link', { name: 'Home' })).not.toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(page.getByRole('radiogroup', { name: 'Language' })).toBeVisible();

  const pulseAnimation = await page
    .locator('.ui-status-indicator--pulse .ui-status-indicator__dot')
    .evaluate((element) => getComputedStyle(element, '::after').animationName);
  expect(pulseAnimation).toBe('none');
});

test('active navigation hover does not stack another visual state', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/frame?theme=dark&lang=en#consumer-parity', {
    waitUntil: 'domcontentloaded',
  });
  await page.addStyleTag({ content: freezeMotion });
  await page.evaluate(waitForStableAssets);

  const activeItem = page
    .getByRole('navigation', { name: 'Primary navigation' })
    .getByRole('link', {
      name: 'Home',
    });
  const readVisualState = () =>
    activeItem.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        color: style.color,
        backgroundColor: style.backgroundColor,
        backgroundImage: style.backgroundImage,
        boxShadow: style.boxShadow,
      };
    });

  const beforeHover = await readVisualState();
  await activeItem.hover();
  const duringHover = await readVisualState();

  expect(duringHover).toEqual(beforeHover);
});

test('chrome edge refraction is removed when reduced transparency is requested', async ({
  page,
}) => {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }],
  });
  await page.goto('/frame?theme=dark&lang=en#consumer-parity', {
    waitUntil: 'domcontentloaded',
  });
  await page.evaluate(waitForStableAssets);

  const navigation = page.getByRole('navigation', { name: 'Primary navigation' });
  const reducedState = await navigation.evaluate((element) => {
    const style = getComputedStyle(element);
    const edgeStyle = getComputedStyle(element, '::before');
    return {
      backdropFilter: style.backdropFilter,
      edgeDisplay: edgeStyle.display,
    };
  });

  expect(reducedState.backdropFilter).toBe('none');
  expect(reducedState.edgeDisplay).toBe('none');
});

test('consumer parity dock adapts navigation items to content', async ({ page }) => {
  await page.goto('/frame?theme=dark&lang=en#consumer-parity', {
    waitUntil: 'domcontentloaded',
  });
  await page.evaluate(waitForStableAssets);

  const navigation = page.getByRole('navigation', { name: 'Primary navigation' });
  const typography = await navigation.evaluate((element) => {
    const link = element.querySelector('.consumer-parity-dock__item');
    const label = link?.querySelector('.ui-navigation-item__label');
    if (!link || !label) {
      throw new Error('Dock typography nodes are missing');
    }

    const linkStyle = getComputedStyle(link);
    const labelStyle = getComputedStyle(label);
    const dockStyle = getComputedStyle(element);
    return {
      dockFontFamily: dockStyle.fontFamily,
      dockFontSize: dockStyle.fontSize,
      linkFontFamily: linkStyle.fontFamily,
      linkFontSize: linkStyle.fontSize,
      rootFontSize: Number.parseFloat(getComputedStyle(document.documentElement).fontSize),
      labelDisplay: labelStyle.display,
      labelFlex: labelStyle.flex,
    };
  });
  expect(Number.parseFloat(typography.dockFontSize)).toBeCloseTo(typography.rootFontSize, 1);
  expect(Number.parseFloat(typography.linkFontSize)).toBeCloseTo(typography.rootFontSize * 0.7, 1);
  expect(typography.dockFontFamily).toContain('"Noto Sans SC Variable"');
  expect(typography.linkFontFamily).toContain('"Noto Sans SC Variable"');
  expect(typography.labelDisplay).toBe(
    (page.viewportSize()?.width ?? 0) <= 520 ? 'block' : 'inline',
  );
  expect(typography.labelFlex).toBe('0 1 auto');
  const edgeMaterial = await navigation.evaluate((element) => {
    const style = getComputedStyle(element);
    const chromeEdgeStyle = getComputedStyle(element, '::before');
    const button = element.querySelector('.consumer-parity-dock__item') as HTMLElement | null;
    const activeButton = element.querySelector(
      '.consumer-parity-dock__item.ui-navigation-item--active',
    ) as HTMLElement | null;
    const activeIndicator = activeButton?.querySelector(
      '.ui-navigation-item__indicator',
    ) as HTMLElement | null;
    const activeIcon = activeButton?.querySelector(
      '.ui-action__leading > svg',
    ) as HTMLElement | null;
    const language = element.querySelector('.consumer-parity-dock__language') as HTMLElement | null;
    const languageSlider = language?.querySelector(
      '.ui-segmented-control__slider',
    ) as HTMLElement | null;
    const trailing = language?.parentElement as HTMLElement | null;
    if (
      !button ||
      !activeButton ||
      !activeIndicator ||
      !activeIcon ||
      !language ||
      !languageSlider ||
      !trailing
    ) {
      throw new Error('Dock surface nodes are missing');
    }
    const activeButtonStyle = getComputedStyle(activeButton);
    const activeLabel = activeButton.querySelector(
      '.ui-navigation-item__label',
    ) as HTMLElement | null;
    if (!activeLabel) {
      throw new Error('Active navigation label is missing');
    }
    const languageStyle = getComputedStyle(language);
    const languageSliderStyle = getComputedStyle(languageSlider);
    const languageOption = language.querySelector(
      '.ui-segmented-control__option',
    ) as HTMLElement | null;
    if (!languageOption) {
      throw new Error('Dock language option is missing');
    }
    const languageOptions = [
      ...language.querySelectorAll<HTMLElement>('.ui-segmented-control__option'),
    ];
    if (languageOptions.length === 0) {
      throw new Error('Dock language options are missing');
    }
    const languageOptionStyle = getComputedStyle(languageOption);
    const trailingStyle = getComputedStyle(trailing);
    const primary = element.querySelector(
      '.ui-control-surface__group--primary',
    ) as HTMLElement | null;
    const divider = element.querySelector('.ui-control-surface__divider') as HTMLElement | null;
    const pulse = [...element.querySelectorAll<HTMLElement>('.consumer-parity-dock__item')].at(-1);
    const heroActions = element
      .closest<HTMLElement>('[data-design-lab-region="module"]')
      ?.querySelector<HTMLElement>('[data-consumer-parity="hero-actions"]');
    if (!primary || !divider || !pulse || !heroActions) {
      throw new Error('Dock primary group is missing');
    }
    const itemRects = [...element.querySelectorAll<HTMLElement>('.consumer-parity-dock__item')].map(
      (item) => {
        const rect = item.getBoundingClientRect();
        return {
          left: rect.left,
          right: rect.right,
          width: rect.width,
          height: rect.height,
        };
      },
    );
    const heroActionAspectRatios = [...heroActions.querySelectorAll<HTMLElement>('.ui-action')].map(
      (action) => {
        const rect = action.getBoundingClientRect();
        return rect.width / rect.height;
      },
    );
    const itemGaps = itemRects
      .slice(1)
      .map((item, index) => item.left - (itemRects[index]?.right ?? item.left));
    const primaryRect = primary.getBoundingClientRect();
    const activeButtonRect = activeButton.getBoundingClientRect();
    const activeIndicatorRect = activeIndicator.getBoundingClientRect();
    const activeIconRect = activeIcon.getBoundingClientRect();
    const trailingRect = trailing.getBoundingClientRect();
    const dividerRect = divider.getBoundingClientRect();
    const pulseRect = pulse.getBoundingClientRect();
    const languageRect = language.getBoundingClientRect();
    const sliderRect = languageSlider.getBoundingClientRect();
    const languageOptionRect = languageOption.getBoundingClientRect();
    const optionTextRange = document.createRange();
    optionTextRange.selectNodeContents(languageOption);
    const optionTextRect = optionTextRange.getBoundingClientRect();
    const languageOptionGeometry = languageOptions.map((option) => {
      const optionRect = option.getBoundingClientRect();
      const textRange = document.createRange();
      textRange.selectNodeContents(option);
      const textRect = textRange.getBoundingClientRect();
      const optionStyle = getComputedStyle(option);
      return {
        width: optionRect.width,
        contentPlusPaddingWidth: textRect.width + Number.parseFloat(optionStyle.paddingInline) * 2,
      };
    });
    const languageOptionWidth = Math.max(...languageOptionGeometry.map(({ width }) => width));
    const languageOptionContentWidth = Math.max(
      ...languageOptionGeometry.map(({ contentPlusPaddingWidth }) => contentPlusPaddingWidth),
    );
    const activeLabelRange = document.createRange();
    activeLabelRange.selectNodeContents(activeLabel);
    const activeLabelRect = activeLabelRange.getBoundingClientRect();
    const rootFontSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
    const resolveLength = (variable: string) => {
      const probe = document.createElement('span');
      probe.style.position = 'absolute';
      probe.style.inlineSize = '0';
      probe.style.blockSize = `var(${variable})`;
      element.append(probe);
      const value = Number.parseFloat(getComputedStyle(probe).blockSize);
      probe.remove();
      return value;
    };
    const sliderWithinLanguage =
      sliderRect.left >= languageRect.left &&
      sliderRect.right <= languageRect.right &&
      sliderRect.top >= languageRect.top &&
      sliderRect.bottom <= languageRect.bottom;
    return {
      surface: element.getAttribute('data-surface'),
      chromeClass: element.classList.contains('ui-surface-chrome'),
      dockBackground: style.background,
      dockFilter: style.backdropFilter,
      dockBorder: style.borderColor,
      dockEdgeBackgroundImage: chromeEdgeStyle.backgroundImage,
      dockEdgeOpacity: chromeEdgeStyle.opacity,
      dockEdgeFilter: chromeEdgeStyle.filter,
      dockEdgeBackdropFilter: chromeEdgeStyle.backdropFilter,
      dockEdgeDisplay: chromeEdgeStyle.display,
      buttonSurface: button.getAttribute('data-surface'),
      buttonHasMaterialClass: [...button.classList].some((className) =>
        className.startsWith('material-'),
      ),
      languageSurface: language.getAttribute('data-surface'),
      languageHasMaterialClass: [...language.classList].some((className) =>
        className.startsWith('material-'),
      ),
      languageBorderStyle: languageStyle.borderStyle,
      languageBackground: languageStyle.backgroundColor,
      languagePaddingInline: languageStyle.paddingInline,
      languagePaddingBlock: languageStyle.paddingBlock,
      languageOverflow: languageStyle.overflow,
      trailingBorder: trailingStyle.borderColor,
      trailingBackground: trailingStyle.backgroundColor,
      trailingRadius: Number.parseFloat(trailingStyle.borderTopLeftRadius),
      compactHeightToken: style.getPropertyValue('--neoverse-control-compact-height').trim(),
      controlHeightToken: style
        .getPropertyValue('--neoverse-control-surface-control-height')
        .trim(),
      navigationHeightToken: style
        .getPropertyValue('--neoverse-control-surface-navigation-height')
        .trim(),
      segmentedHeightToken: style
        .getPropertyValue('--neoverse-control-surface-segmented-height')
        .trim(),
      groupHeightToken: style.getPropertyValue('--neoverse-control-surface-group-height').trim(),
      surfacePaddingToken: style.getPropertyValue('--neoverse-control-surface-padding').trim(),
      surfacePaddingBlockToken: style
        .getPropertyValue('--neoverse-control-surface-padding-block')
        .trim(),
      surfacePaddingInlineToken: style
        .getPropertyValue('--neoverse-control-surface-padding-inline')
        .trim(),
      dividerGapToken: style.getPropertyValue('--neoverse-control-surface-divider-gap').trim(),
      compactHeight: resolveLength('--neoverse-control-compact-height'),
      actionHeight: resolveLength('--neoverse-action-height-sm'),
      controlHeight: resolveLength('--neoverse-control-surface-control-height'),
      navigationSurfaceHeight: resolveLength('--neoverse-control-surface-navigation-height'),
      segmentedSurfaceHeight: resolveLength('--neoverse-control-surface-segmented-height'),
      groupHeight: resolveLength('--neoverse-control-surface-group-height'),
      surfacePadding: resolveLength('--neoverse-control-surface-padding'),
      surfacePaddingBlock: resolveLength('--neoverse-control-surface-padding-block'),
      surfacePaddingInline: resolveLength('--neoverse-control-surface-padding-inline'),
      surfaceItemGap: resolveLength('--neoverse-control-surface-item-gap'),
      dividerGap: resolveLength('--neoverse-control-surface-divider-gap'),
      navigationGap: Number.parseFloat(activeButtonStyle.gap),
      navigationGapToken: resolveLength('--neoverse-navigation-item-gap'),
      primaryGap: Number.parseFloat(getComputedStyle(primary).columnGap),
      compactNavigationGapToken: resolveLength('--neoverse-navigation-item-compact-gap'),
      trailingPaddingInline: Number.parseFloat(trailingStyle.paddingInline),
      trailingPaddingBlock: Number.parseFloat(trailingStyle.paddingBlock),
      trailingPaddingInlineToken: resolveLength(
        '--neoverse-control-chrome-trailing-padding-inline',
      ),
      trailingBorderInline: Number.parseFloat(trailingStyle.borderLeftWidth),
      trailingContentInsetInline:
        languageRect.left - trailingRect.left - Number.parseFloat(trailingStyle.borderLeftWidth),
      trailingOuterGap: element.getBoundingClientRect().right - trailingRect.right,
      primaryWidth: primaryRect.width,
      itemRects,
      itemGaps,
      maxNavigationAspectRatio: Math.max(...itemRects.map(({ width, height }) => width / height)),
      maxHeroActionAspectRatio: Math.max(...heroActionAspectRatios),
      activeButtonRect: {
        left: activeButtonRect.left,
        right: activeButtonRect.right,
        top: activeButtonRect.top,
        bottom: activeButtonRect.bottom,
      },
      activeIndicatorRect: {
        left: activeIndicatorRect.left,
        right: activeIndicatorRect.right,
        top: activeIndicatorRect.top,
        bottom: activeIndicatorRect.bottom,
        width: activeIndicatorRect.width,
        height: activeIndicatorRect.height,
      },
      iconIndicatorGap: activeIndicatorRect.top - activeIconRect.bottom,
      activeIndicatorColor: getComputedStyle(activeIndicator).backgroundColor,
      activeIndicatorOpacity: getComputedStyle(activeIndicator).opacity,
      primaryHeight: primaryRect.height,
      trailingHeight: trailingRect.height,
      primaryCenterY: primaryRect.top + primaryRect.height / 2,
      trailingCenterY: trailingRect.top + trailingRect.height / 2,
      itemInsetBlockStart: activeButtonRect.top - element.getBoundingClientRect().top,
      itemInsetBlockEnd: element.getBoundingClientRect().bottom - activeButtonRect.bottom,
      itemInsetInlineStart: activeButtonRect.left - element.getBoundingClientRect().left,
      sliderRadius: Number.parseFloat(languageSliderStyle.borderTopLeftRadius),
      rootFontSize,
      sliderHeight: Number.parseFloat(languageSliderStyle.height),
      optionHeight: Number.parseFloat(languageOptionStyle.height),
      languageOptionWidth,
      languageOptionContentWidth,
      navigationHeight: activeButtonRect.height,
      navigationBoxSizing: activeButtonStyle.boxSizing,
      navigationPaddingBlock: Number.parseFloat(activeButtonStyle.paddingBlock),
      optionPaddingBlock: Number.parseFloat(languageOptionStyle.paddingBlock),
      optionPaddingInline: Number.parseFloat(languageOptionStyle.paddingInline),
      optionFontSize: Number.parseFloat(languageOptionStyle.fontSize),
      optionFontWeight: languageOptionStyle.fontWeight,
      optionLineHeight: languageOptionStyle.lineHeight,
      optionTextCenterDelta:
        optionTextRect.top +
        optionTextRect.height / 2 -
        (languageOptionRect.top + languageOptionRect.height / 2),
      navigationTextCenterDelta:
        activeLabelRect.top +
        activeLabelRect.height / 2 -
        (activeButtonRect.top + activeButtonRect.height / 2),
      sliderInsetInline: sliderRect.left - trailingRect.left,
      sliderInsetBlock: sliderRect.top - trailingRect.top,
      dividerGapBefore: dividerRect.left - pulseRect.right,
      dividerGapAfter: trailingRect.left - dividerRect.right,
      rootHeight: element.getBoundingClientRect().height,
      rootPaddingBlock: Number.parseFloat(style.paddingBlock),
      sliderWithinLanguage,
      sliderWithinOption:
        sliderRect.left >= languageOptionRect.left &&
        sliderRect.right <= languageOptionRect.right &&
        sliderRect.top >= languageOptionRect.top &&
        sliderRect.bottom <= languageOptionRect.bottom,
      optionContentFits:
        optionTextRect.left >= languageOptionRect.left &&
        optionTextRect.right <= languageOptionRect.right &&
        optionTextRect.top >= languageOptionRect.top &&
        optionTextRect.bottom <= languageOptionRect.bottom,
      activeBackground: activeButtonStyle.backgroundColor,
      activeBackgroundImage: activeButtonStyle.backgroundImage,
      hoverMode: element.getAttribute('data-neoverse-surface-hover'),
    };
  });
  expect(edgeMaterial.surface).toBe('chrome');
  expect(edgeMaterial.chromeClass).toBe(true);
  expect(edgeMaterial.dockBackground).toContain('rgba(152, 186, 220, 0.04)');
  expect(edgeMaterial.dockFilter).toContain('blur(12px)');
  expect(edgeMaterial.dockBorder).toBe('rgba(219, 234, 254, 0.08)');
  expect(edgeMaterial.dockEdgeBackgroundImage).not.toBe('none');
  expect(Number.parseFloat(edgeMaterial.dockEdgeOpacity)).toBeGreaterThan(0);
  expect(edgeMaterial.dockEdgeFilter).not.toBe('none');
  expect(edgeMaterial.dockEdgeBackdropFilter).not.toBe('none');
  expect(edgeMaterial.dockEdgeDisplay).not.toBe('none');
  expect(edgeMaterial.buttonSurface).toBe('none');
  expect(edgeMaterial.buttonHasMaterialClass).toBe(false);
  expect(edgeMaterial.languageSurface).toBe('none');
  expect(edgeMaterial.languageHasMaterialClass).toBe(false);
  expect(edgeMaterial.languageBorderStyle).toBe('none');
  expect(edgeMaterial.languageBackground).toBe('rgba(0, 0, 0, 0)');
  expect(edgeMaterial.languagePaddingInline).toBe('0px');
  expect(edgeMaterial.languagePaddingBlock).toBe('0px');
  expect(edgeMaterial.languageOverflow).toBe('visible');
  expect(edgeMaterial.trailingBorder).toBe('rgba(219, 234, 254, 0.09)');
  expect(edgeMaterial.trailingBackground).toBe('rgba(255, 255, 255, 0.03)');
  expect(edgeMaterial.itemRects).toHaveLength(4);
  expect(edgeMaterial.itemRects.every(({ width }) => width > 0)).toBe(true);
  expect(edgeMaterial.groupHeightToken).toMatch(/rem$/);
  expect(edgeMaterial.surfacePaddingToken).toMatch(/rem$/);
  expect(edgeMaterial.surfacePaddingBlockToken).toMatch(/rem$/);
  expect(edgeMaterial.surfacePaddingInlineToken).toMatch(/rem$/);
  expect(edgeMaterial.navigationHeightToken).toMatch(/rem$/);
  expect(edgeMaterial.segmentedHeightToken).toMatch(/rem$/);
  expect(edgeMaterial.dividerGapToken).toMatch(/rem$/);
  expect(edgeMaterial.actionHeight).toBeGreaterThan(edgeMaterial.compactHeight);
  expect(edgeMaterial.controlHeight).toBeCloseTo(edgeMaterial.compactHeight, 2);
  expect(edgeMaterial.navigationSurfaceHeight).toBeCloseTo(edgeMaterial.actionHeight, 2);
  expect(edgeMaterial.segmentedSurfaceHeight).toBeCloseTo(edgeMaterial.compactHeight, 2);
  expect(edgeMaterial.navigationHeight).toBeCloseTo(edgeMaterial.navigationSurfaceHeight, 2);
  expect(edgeMaterial.optionHeight).toBeCloseTo(edgeMaterial.segmentedSurfaceHeight, 2);
  expect(edgeMaterial.sliderHeight).toBeCloseTo(edgeMaterial.segmentedSurfaceHeight, 2);
  expect(edgeMaterial.optionHeight).toBeLessThan(edgeMaterial.navigationHeight);
  expect(edgeMaterial.iconIndicatorGap / edgeMaterial.navigationHeight).toBeGreaterThanOrEqual(
    0.13,
  );
  if ((page.viewportSize()?.width ?? 0) <= 520) {
    expect(edgeMaterial.languageOptionWidth).toBeCloseTo(
      edgeMaterial.languageOptionContentWidth,
      2,
    );
    expect(edgeMaterial.iconIndicatorGap).toBeGreaterThanOrEqual(
      edgeMaterial.activeIndicatorRect.height - 0.1,
    );
  }
  expect(edgeMaterial.navigationBoxSizing).toBe('border-box');
  if ((page.viewportSize()?.width ?? 0) > 520) {
    expect(edgeMaterial.navigationGap).toBeCloseTo(edgeMaterial.navigationGapToken, 2);
    expect(edgeMaterial.navigationGap).toBeGreaterThan(0);
    expect(edgeMaterial.primaryGap).toBeCloseTo(edgeMaterial.surfaceItemGap, 2);
    expect(edgeMaterial.primaryGap).toBeGreaterThan(0);
    expect(edgeMaterial.maxNavigationAspectRatio).toBeLessThanOrEqual(
      edgeMaterial.maxHeroActionAspectRatio * 1.08,
    );
  } else {
    expect(edgeMaterial.navigationGap).toBe(0);
    expect(edgeMaterial.primaryGap).toBeCloseTo(edgeMaterial.compactNavigationGapToken, 2);
    expect(edgeMaterial.primaryGap).toBeGreaterThan(0);
  }
  expect(edgeMaterial.trailingPaddingInline).toBeCloseTo(
    edgeMaterial.trailingPaddingInlineToken,
    2,
  );
  expect(edgeMaterial.trailingContentInsetInline).toBeCloseTo(
    edgeMaterial.trailingPaddingInline,
    2,
  );
  expect(edgeMaterial.trailingPaddingInline).toBeGreaterThan(edgeMaterial.trailingPaddingBlock);
  expect(edgeMaterial.primaryWidth).toBeCloseTo(
    edgeMaterial.itemRects.reduce((total, { width }) => total + width, 0) +
      edgeMaterial.itemGaps.reduce((total, gap) => total + gap, 0),
    1,
  );
  expect(
    edgeMaterial.itemGaps.every((gap) =>
      (page.viewportSize()?.width ?? 0) > 520
        ? Math.abs(gap - edgeMaterial.primaryGap) < 0.1
        : Math.abs(gap - edgeMaterial.primaryGap) < 0.1,
    ),
  ).toBe(true);
  if ((page.viewportSize()?.width ?? 0) > 520) {
    expect(
      new Set(edgeMaterial.itemRects.map(({ width }) => Math.round(width * 100))).size,
    ).toBeGreaterThan(1);
  }
  expect(edgeMaterial.activeIndicatorColor).not.toBe('rgba(0, 0, 0, 0)');
  expect(edgeMaterial.activeIndicatorOpacity).toBe('1');
  expect(edgeMaterial.activeIndicatorRect.width).toBeGreaterThan(0);
  expect(edgeMaterial.activeIndicatorRect.height).toBeGreaterThan(0);
  expect(edgeMaterial.activeIndicatorRect.left).toBeGreaterThanOrEqual(
    edgeMaterial.activeButtonRect.left - 0.1,
  );
  expect(edgeMaterial.activeIndicatorRect.right).toBeLessThanOrEqual(
    edgeMaterial.activeButtonRect.right + 0.1,
  );
  expect(Math.abs(edgeMaterial.primaryHeight - edgeMaterial.trailingHeight)).toBeLessThan(0.25);
  expect(Math.abs(edgeMaterial.primaryCenterY - edgeMaterial.trailingCenterY)).toBeLessThan(0.25);
  expect(edgeMaterial.dividerGapBefore).toBeCloseTo(edgeMaterial.dividerGapAfter, 2);
  expect(edgeMaterial.dividerGapBefore).toBeCloseTo(edgeMaterial.dividerGap, 2);
  expect(edgeMaterial.rootHeight).toBeCloseTo(
    edgeMaterial.groupHeight + edgeMaterial.surfacePaddingBlock * 2 + 2,
    1,
  );
  expect(edgeMaterial.rootPaddingBlock).toBeCloseTo(edgeMaterial.surfacePaddingBlock, 2);
  expect(edgeMaterial.surfacePaddingBlock).toBeCloseTo(edgeMaterial.surfacePadding, 2);
  expect(edgeMaterial.surfacePaddingInline).toBeGreaterThan(edgeMaterial.surfacePaddingBlock);
  expect(edgeMaterial.trailingOuterGap).toBeGreaterThanOrEqual(edgeMaterial.surfacePaddingInline);
  expect(edgeMaterial.itemInsetBlockStart).toBeCloseTo(edgeMaterial.itemInsetBlockEnd, 2);
  expect(edgeMaterial.itemInsetInlineStart).toBeGreaterThan(edgeMaterial.itemInsetBlockStart);
  expect(edgeMaterial.sliderWithinLanguage).toBe(true);
  expect(edgeMaterial.sliderWithinOption).toBe(true);
  expect(edgeMaterial.optionContentFits).toBe(true);
  expect(edgeMaterial.primaryHeight).toBeCloseTo(edgeMaterial.groupHeight, 2);
  expect(edgeMaterial.trailingHeight).toBeCloseTo(edgeMaterial.groupHeight, 2);
  expect(edgeMaterial.optionPaddingBlock).toBeCloseTo(edgeMaterial.rootFontSize * 0.2, 1);
  expect(edgeMaterial.optionPaddingInline).toBeCloseTo(edgeMaterial.rootFontSize * 0.375, 1);
  expect(edgeMaterial.optionFontSize).toBeCloseTo(edgeMaterial.rootFontSize * 0.7, 1);
  expect(edgeMaterial.optionFontWeight).toBe('750');
  expect(edgeMaterial.optionLineHeight).toBe('normal');
  expect(edgeMaterial.optionTextCenterDelta).toBeCloseTo(0, 2);
  if ((page.viewportSize()?.width ?? 0) > 520) {
    expect(edgeMaterial.navigationTextCenterDelta).toBeCloseTo(0, 2);
  }
  expect(edgeMaterial.sliderRadius).toBeLessThan(edgeMaterial.trailingRadius);
  expect(edgeMaterial.activeBackground).toBe('rgba(0, 0, 0, 0)');
  expect(edgeMaterial.activeBackgroundImage).not.toBe('none');
  expect(edgeMaterial.hoverMode).toBe('static');

  const itemIndicators = navigation.locator('.ui-navigation-item__indicator');
  await expect(itemIndicators).toHaveCount(4);
  const initialItem = navigation.getByRole('link', { name: 'Home' });
  const initialItemBox = await initialItem.boundingBox();
  const initialIndicatorBox = await navigation
    .locator('.ui-control-surface__indicator')
    .boundingBox();
  if (!initialItemBox || !initialIndicatorBox) {
    throw new Error('Initial active navigation geometry is missing');
  }
  expect(initialIndicatorBox.x).toBeGreaterThanOrEqual(initialItemBox.x - 0.1);
  expect(initialIndicatorBox.x + initialIndicatorBox.width).toBeLessThanOrEqual(
    initialItemBox.x + initialItemBox.width + 0.1,
  );

  const projectsItem = navigation.getByRole('link', { name: 'Projects' });
  await projectsItem.click();
  await expect(projectsItem).toHaveAttribute('aria-current', 'page');
  await expect(
    navigation.locator(
      '.consumer-parity-dock__item.ui-navigation-item--active .ui-navigation-item__indicator',
    ),
  ).toHaveCount(1);
});

test('dock indicator travels between unequal items and respects reduced motion', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/frame?theme=dark&lang=en#consumer-parity', { waitUntil: 'domcontentloaded' });
  await page.evaluate(waitForStableAssets);
  const dock = page.locator('.consumer-parity-dock');
  await expect(dock.locator('.ui-control-surface__indicator')).toHaveAttribute(
    'data-ready',
    'true',
  );
  for (const label of ['Pulse', 'Projects', 'Home']) {
    const result = await dock.evaluate(async (element, label) => {
      const bar = element.querySelector<HTMLElement>('.ui-control-surface__indicator');
      const target = [...element.querySelectorAll<HTMLElement>('.ui-navigation-item')].find(
        (item) => item.textContent?.trim() === label,
      );
      if (!bar || !target) throw new Error('Navigation geometry missing');
      const start = bar.getBoundingClientRect().x;
      target.click();
      await new Promise(requestAnimationFrame);
      await new Promise(requestAnimationFrame);
      const motion = bar
        .getAnimations()
        .find(
          (animation) =>
            animation instanceof CSSTransition && animation.transitionProperty === 'left',
        );
      if (!motion) throw new Error('No horizontal indicator transition');
      motion.pause();
      motion.currentTime = Number(motion.effect?.getTiming().duration) / 2;
      const middle = bar.getBoundingClientRect().x;
      for (const animation of bar.getAnimations()) animation.finish();
      const end = bar.getBoundingClientRect();
      const button = target.getBoundingClientRect();
      const option = element
        .querySelector('.ui-segmented-control__option')
        ?.getBoundingClientRect();
      if (!option) throw new Error('Language option missing');
      return {
        start,
        middle,
        end: end.x,
        centered: Math.abs(end.x + end.width / 2 - button.x - button.width / 2),
        centerDifference: Math.abs(
          button.top + button.height / 2 - (option.top + option.height / 2),
        ),
        optionHeight: option.height,
        navigationHeight: button.height,
      };
    }, label);
    expect(result.middle).toBeGreaterThan(Math.min(result.start, result.end));
    expect(result.middle).toBeLessThan(Math.max(result.start, result.end));
    expect(result.centered).toBeLessThan(0.1);
    expect(result.centerDifference).toBeLessThan(0.1);
    expect(result.optionHeight).toBeLessThan(result.navigationHeight);
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(dock.locator('.ui-control-surface__indicator')).toHaveCSS(
    'transition-duration',
    '0s',
  );
});

test('consumer parity dock keeps parent Glass stable on item hover', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'Pointer hover is desktop-only.');
  await page.goto('/frame?theme=dark&lang=en#consumer-parity', {
    waitUntil: 'domcontentloaded',
  });
  await page.evaluate(waitForStableAssets);

  const navigation = page.getByRole('navigation', { name: 'Primary navigation' });
  const item = navigation.getByRole('link', { name: 'Home' });
  await expect(item).toBeVisible();
  await page.mouse.move(0, 0);
  await page.waitForTimeout(80);
  const before = await navigation.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      background: style.backgroundColor,
      border: style.borderColor,
      shadow: style.boxShadow,
      edgeDisplay: getComputedStyle(element, '::before').display,
    };
  });
  const box = await item.boundingBox();
  expect(box).not.toBeNull();
  if (box === null) {
    return;
  }

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(260);
  const after = await navigation.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      background: style.backgroundColor,
      border: style.borderColor,
      shadow: style.boxShadow,
      edgeDisplay: getComputedStyle(element, '::before').display,
    };
  });

  expect(after).toEqual(before);
});

for (const theme of themes) {
  test(`button press glow / ${theme}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/frame?theme=${theme}&lang=en#controls`, {
      waitUntil: 'domcontentloaded',
    });
    await page.addStyleTag({ content: freezeMotion });
    await page.evaluate(waitForStableAssets);

    const button = page.locator('#controls-button .ui-button--primary').first();
    await expect(button).toBeVisible();
    const box = await button.boundingBox();
    expect(box).not.toBeNull();
    if (box === null) {
      return;
    }

    await page.mouse.move(box.x + box.width * 0.65, box.y + box.height * 0.5);
    await page.mouse.down();
    try {
      await expect(button).toHaveScreenshot(`button-press-${theme}.png`);
    } finally {
      await page.mouse.up();
    }
  });
}

for (const theme of themes) {
  test(`floating toolbar refraction / ${theme}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/frame?theme=${theme}&lang=zh#composition`, {
      waitUntil: 'domcontentloaded',
    });
    await page.addStyleTag({ content: freezeMotion });
    await page.evaluate(waitForStableAssets);

    const renderer = await page.locator('html').getAttribute('data-neoverse-glass-renderer');
    const surface = page.locator('#composition-floating-toolbar > .material-glass-immersive');
    await expect(surface).toBeVisible();
    const edge = await surface.evaluate((element) => {
      const style = getComputedStyle(element, '::before');
      return {
        display: style.display,
        opacity: Number(style.opacity),
        backgroundImage: style.backgroundImage,
        backgroundClip: getComputedStyle(element).backgroundClip,
      };
    });

    expect(edge.display).toBe(renderer === 'webgl' ? 'none' : 'block');
    expect(edge.opacity).toBeGreaterThan(0);
    expect(edge.backgroundImage).toContain('radial-gradient');
    if (renderer === 'webgl') {
      expect(edge.backgroundClip).toBe('padding-box');
    }
  });
}

const compositionSurfaceContracts = [
  { id: 'composition-control-cluster', selector: ':scope > .material-glass-subtle', glass: true },
  { id: 'composition-project-card', selector: ':scope > .ui-card', glass: false },
  {
    id: 'composition-floating-toolbar',
    selector: ':scope > .material-glass-immersive',
    glass: true,
  },
  {
    id: 'composition-docs-article-header',
    selector: ':scope > .material-glass-elevated',
    glass: true,
  },
  { id: 'composition-docs-navigation-group', selector: ':scope > nav', glass: false },
  { id: 'composition-docs-toolbar', selector: ':scope > .material-glass-subtle', glass: true },
  { id: 'composition-docs-content-surface', selector: ':scope > article', glass: false },
] as const;

for (const theme of themes) {
  test(`composition panels retain visible Glass edge treatment / ${theme}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto(`/frame?theme=${theme}&lang=zh#composition`, {
      waitUntil: 'domcontentloaded',
    });
    await page.addStyleTag({ content: freezeMotion });
    await page.evaluate(waitForStableAssets);
    await page.waitForTimeout(120);

    const panels = await page.evaluate((contracts) => {
      const renderer = document.documentElement.getAttribute('data-neoverse-glass-renderer');
      return contracts.map(({ id, selector, glass }) => {
        const section = document.getElementById(id);
        const element = section?.querySelector<HTMLElement>(selector);
        if (element === null || element === undefined) {
          return { id, missing: true, expectedGlass: glass, glass, renderer };
        }

        const style = getComputedStyle(element);
        const before = getComputedStyle(element, '::before');

        return {
          id,
          missing: false,
          expectedGlass: glass,
          renderer,
          hasGlassMaterial: [...element.classList].some((name) =>
            name.startsWith('material-glass-'),
          ),
          beforeDisplay: before.display,
          backgroundClip: style.backgroundClip,
          edgePass: element.getAttribute('data-neoverse-glass-edge-pass'),
          edgePassActive: element.getAttribute('data-neoverse-glass-edge-pass-active'),
          refractionOpacity: Number(
            style.getPropertyValue('--neoverse-material-edge-refraction-opacity'),
          ),
        };
      });
    }, compositionSurfaceContracts);

    expect(panels).toHaveLength(compositionSurfaceContracts.length);
    for (const panel of panels) {
      expect(panel).toMatchObject({
        missing: false,
        expectedGlass: panel.expectedGlass,
        hasGlassMaterial: panel.expectedGlass,
        edgePass: null,
        edgePassActive: null,
      });
      if (panel.expectedGlass) {
        expect(panel.refractionOpacity).toBeGreaterThan(0);
        if (panel.renderer === 'webgl') {
          expect(panel.beforeDisplay).toBe('none');
          expect(panel.backgroundClip).toBe('padding-box');
        } else {
          expect(panel.beforeDisplay).toBe('block');
        }
      }
    }
  });
}

for (const theme of themes) {
  test(`icon button icons stay geometrically centered / ${theme}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/frame?theme=${theme}&lang=zh#controls`, {
      waitUntil: 'domcontentloaded',
    });
    await page.addStyleTag({ content: freezeMotion });
    await page.evaluate(waitForStableAssets);

    const centers = await page
      .locator('#controls-icon-button .ui-button svg')
      .evaluateAll((icons) =>
        icons.map((icon) => {
          const button = icon.closest('button');
          if (button === null) {
            return null;
          }

          const buttonRect = button.getBoundingClientRect();
          const iconRect = icon.getBoundingClientRect();
          return {
            x: iconRect.left + iconRect.width / 2 - (buttonRect.left + buttonRect.width / 2),
            y: iconRect.top + iconRect.height / 2 - (buttonRect.top + buttonRect.height / 2),
          };
        }),
      );

    expect(centers.length).toBeGreaterThan(0);
    for (const center of centers) {
      expect(center).not.toBeNull();
      if (center !== null) {
        expect(Math.abs(center.x)).toBeLessThan(0.1);
        expect(Math.abs(center.y)).toBeLessThan(0.1);
      }
    }
  });
}

for (const theme of themes) {
  test(`ghost button keeps a theme-appropriate material boundary / ${theme}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/frame?theme=${theme}&lang=zh#card`, {
      waitUntil: 'domcontentloaded',
    });
    await page.addStyleTag({ content: freezeMotion });
    await page.evaluate(waitForStableAssets);

    const boundary = await page.locator('#card .ui-button--ghost').evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        borderColor: style.borderColor,
        boxShadow: style.boxShadow,
        refractionOpacity: Number(
          style.getPropertyValue('--neoverse-material-edge-refraction-opacity'),
        ),
      };
    });

    if (theme === 'dark') {
      expect(boundary.borderColor).toBe('rgba(0, 0, 0, 0)');
    } else {
      expect(boundary.borderColor).not.toBe('rgba(0, 0, 0, 0)');
    }
    expect(boundary.boxShadow).not.toBe('none');
    expect(boundary.refractionOpacity).toBeGreaterThan(0);
  });
}

test.describe('wide Composition WebGL edge', () => {
  test.use({
    viewport: { width: 1775, height: 586 },
    deviceScaleFactor: 1,
    hasTouch: false,
    isMobile: false,
  });

  for (const theme of themes) {
    test(`keeps the Composition edge visible without a hard rim / ${theme}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.goto(`/frame?theme=${theme}&lang=zh#composition`, {
        waitUntil: 'domcontentloaded',
      });
      await page.addStyleTag({ content: freezeMotion });
      await page.evaluate(waitForStableAssets);

      const runtime = await page.locator('html').getAttribute('data-neoverse-glass-renderer');
      test.skip(
        !(await page.evaluate(() => {
          const canvas = document.createElement('canvas');
          return canvas.getContext('webgl2') !== null || canvas.getContext('webgl') !== null;
        })),
        'The visible Composition edge contract is only applicable when WebGL is available.',
      );
      expect(runtime).toBe('webgl');

      const surface = page.locator('#composition-floating-toolbar > .material-glass-immersive');
      await expect(surface).toBeVisible();
      await surface.scrollIntoViewIfNeeded();
      await page.waitForTimeout(120);

      const edge = await surface.evaluate((element) => {
        const style = getComputedStyle(element, '::before');
        return {
          beforeDisplay: style.display,
          edgePass: element.getAttribute('data-neoverse-glass-edge-pass'),
          edgePassActive: element.getAttribute('data-neoverse-glass-edge-pass-active'),
        };
      });
      expect(edge).toEqual({
        beforeDisplay: 'none',
        edgePass: null,
        edgePassActive: null,
      });
      const clip = await surface.evaluate((element) => getComputedStyle(element).backgroundClip);
      expect(clip).toBe('padding-box');
    });
  }
});

test.describe('wide WebGL Glass edge', () => {
  test.use({
    viewport: { width: 1775, height: 586 },
    deviceScaleFactor: 1,
    hasTouch: false,
    isMobile: false,
  });

  for (const theme of themes) {
    test(`keeps the explicit WebGL edge diffuse / ${theme}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.goto(`/frame?theme=${theme}&lang=zh#materials`, {
        waitUntil: 'domcontentloaded',
      });
      await page.addStyleTag({ content: freezeMotion });
      await page.evaluate(waitForStableAssets);

      const runtime = await page.locator('html').getAttribute('data-neoverse-glass-renderer');
      test.skip(
        runtime !== 'webgl',
        'The diffuse WebGL contract is only applicable when WebGL is available.',
      );

      const surface = page.locator('#materials .material-glass-elevated');
      await expect(surface).toBeVisible();
      await surface.scrollIntoViewIfNeeded();
      await page.waitForTimeout(120);

      const clip = await surface.evaluate((element) => getComputedStyle(element).backgroundClip);
      expect(clip).toBe('padding-box');

      const screenshot = await surface.screenshot({ type: 'png' });
      const profile = await page.evaluate(async (encoded) => {
        const image = new Image();
        image.src = `data:image/png;base64,${encoded}`;
        await image.decode();

        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext('2d');
        if (context === null) {
          throw new Error('Canvas 2D context is unavailable for the WebGL edge profile.');
        }
        context.drawImage(image, 0, 0);
        const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
        const luminance = (x: number, y: number): number => {
          const offset = (y * canvas.width + x) * 4;
          const red = pixels[offset] ?? 0;
          const green = pixels[offset + 1] ?? 0;
          const blue = pixels[offset + 2] ?? 0;
          return red * 0.2126 + green * 0.7152 + blue * 0.0722;
        };

        const centerX = Math.floor(canvas.width / 2);
        const centerY = Math.floor(canvas.height / 2);
        // Keep sample distances in CSS pixels and scale the luma jump by the
        // local interior level; both avoid a DPR-dependent absolute threshold.
        const horizontalOffsets = Array.from({ length: 9 }, (_, offset) =>
          Math.min(Math.round(offset * Math.max(devicePixelRatio, 1)), canvas.width - 1),
        );
        const verticalOffsets = Array.from({ length: 9 }, (_, offset) =>
          Math.min(Math.round(offset * Math.max(devicePixelRatio, 1)), canvas.height - 1),
        );
        const lines = [
          verticalOffsets.map((offset) => luminance(centerX, offset)),
          horizontalOffsets.map((offset) => luminance(canvas.width - 1 - offset, centerY)),
          verticalOffsets.map((offset) => luminance(centerX, canvas.height - 1 - offset)),
          horizontalOffsets.map((offset) => luminance(offset, centerY)),
        ];
        const normalizedInnerRimJumps = lines.flatMap((line) => {
          const interiorLuma =
            line.slice(4).reduce((total, value) => total + value, 0) / line.slice(4).length;
          const lumaScale = Math.max(interiorLuma, 16);
          return line
            .slice(1, 5)
            .map((value, index) => Math.abs(value - (line[index + 2] ?? value)) / lumaScale);
        });

        return {
          maxNormalizedInnerRimLumaJump: Math.max(...normalizedInnerRimJumps),
        };
      }, screenshot.toString('base64'));

      expect(profile.maxNormalizedInnerRimLumaJump).toBeLessThan(2);
    });
  }
});

test('button press keeps the glass plate and reaches full press glow / dark', async ({ page }) => {
  await page.goto('/frame?theme=dark&lang=en#controls', {
    waitUntil: 'domcontentloaded',
  });
  await page.evaluate(waitForStableAssets);

  const button = page.locator('.ui-button--secondary').first();
  await expect(button).toBeVisible();
  const box = await button.boundingBox();
  expect(box).not.toBeNull();
  if (box === null) {
    return;
  }

  await page.mouse.move(0, 0);
  await page.waitForTimeout(250);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(250);
  await page.mouse.down();
  /* The press glow fades in over motion-fast; sample after the transition. */
  await page.waitForTimeout(450);
  try {
    const press = await button.evaluate((element) => {
      const style = getComputedStyle(element);
      const alphaMatch = style.backgroundColor.match(/\/\s*([0-9.]+)\)/);
      const pressStyle = getComputedStyle(element, '::after');
      return {
        active: element.matches(':active'),
        backgroundColor: style.backgroundColor,
        backgroundImage: style.backgroundImage,
        backdropFilter: style.backdropFilter,
        backgroundAlpha:
          alphaMatch === null
            ? style.backgroundColor === 'transparent'
              ? 0
              : 1
            : Number(alphaMatch[1]),
        pressGlowBackground: pressStyle.backgroundImage,
        pressGlowOpacity: pressStyle.opacity,
      };
    });

    expect(press.active).toBe(true);
    /* The deployed dark button is an aurora image over a transparent sampled
       backdrop. Press feedback stays in the dedicated ::after glow. */
    expect(press.backgroundColor).toBe('rgba(0, 0, 0, 0)');
    expect(press.backgroundImage).not.toBe('none');
    expect(press.backdropFilter).toContain('blur(36px)');
    expect(press.pressGlowBackground).not.toBe('none');
    expect(press.pressGlowOpacity).toBe('1');
  } finally {
    await page.mouse.up();
  }
});

test('dark button variants mirror the deployed translucent aurora recipe', async ({ page }) => {
  await page.goto('/frame?theme=dark&lang=en#controls', {
    waitUntil: 'domcontentloaded',
  });
  await page.evaluate(waitForStableAssets);

  const surfaces = await page.locator('#controls-button .ui-button').evaluateAll((elements) =>
    elements.slice(0, 3).map((element) => {
      const style = getComputedStyle(element);
      const slashAlpha = style.backgroundColor.match(/\/\s*([0-9.]+)\)/)?.[1];
      const rgbaAlpha = style.backgroundColor.match(/,\s*([0-9.]+)\)$/)?.[1];
      return {
        variant: [...element.classList].find((className) => className.startsWith('ui-button--')),
        backgroundAlpha:
          slashAlpha === undefined
            ? rgbaAlpha === undefined
              ? style.backgroundColor === 'transparent'
                ? 0
                : 1
              : Number(rgbaAlpha)
            : Number(slashAlpha),
        borderColor: style.borderColor,
        backgroundImage: style.backgroundImage,
        backdropFilter: style.backdropFilter,
      };
    }),
  );

  expect(surfaces).toHaveLength(3);
  expect(surfaces.map(({ variant }) => variant)).toEqual([
    'ui-button--primary',
    'ui-button--secondary',
    'ui-button--ghost',
  ]);
  expect(surfaces[0]?.backgroundAlpha).toBe(0);
  expect(surfaces[1]?.backgroundAlpha).toBe(0);
  expect(surfaces[0]?.backgroundImage).not.toBe('none');
  expect(surfaces[1]?.backgroundImage).not.toBe('none');
  expect(surfaces[2]?.borderColor).toBe('rgba(0, 0, 0, 0)');
  expect(surfaces.every(({ backdropFilter }) => backdropFilter.includes('blur(36px)'))).toBe(true);
});

test('touch density keeps the compact control geometry and adds a transparent hit area', async ({
  page,
}) => {
  test.skip(
    !(await page.evaluate(() => window.matchMedia('(pointer: coarse)').matches)),
    'The touch contract is only applicable to coarse pointers.',
  );

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/frame?theme=light&lang=en#controls', { waitUntil: 'domcontentloaded' });
  await page.addStyleTag({ content: freezeMotion });
  await page.evaluate(waitForStableAssets);

  const touchControls = page.locator('[data-pointer-profile="touch"] [data-density-controls]');
  await touchControls.scrollIntoViewIfNeeded();
  const buttonContract = await touchControls
    .locator('.ui-button')
    .first()
    .evaluate((element) => {
      const pseudo = getComputedStyle(element, '::before');
      const rect = element.getBoundingClientRect();
      return {
        height: rect.height,
        inset: pseudo.inset,
        pointerEvents: pseudo.pointerEvents,
        hitTarget: document.elementFromPoint(rect.left - 4, rect.top + rect.height / 2) === element,
      };
    });
  const segmentContract = await touchControls
    .locator('.ui-segmented-control__option')
    .first()
    .evaluate((element) => {
      const pseudo = getComputedStyle(element, '::before');
      const rect = element.getBoundingClientRect();
      return {
        inset: pseudo.inset,
        pointerEvents: pseudo.pointerEvents,
        hitTarget: document.elementFromPoint(rect.left - 4, rect.top + rect.height / 2) === element,
      };
    });

  expect(buttonContract).toMatchObject({
    height: 28,
    inset: '-8px',
    pointerEvents: 'auto',
    hitTarget: true,
  });
  expect(segmentContract).toMatchObject({
    inset: '-8px',
    pointerEvents: 'auto',
    hitTarget: true,
  });
});
