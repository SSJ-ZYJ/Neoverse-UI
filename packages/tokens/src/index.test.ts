import { expect, test } from 'bun:test';

import { cssVariables, layoutBreakpoints } from './index.js';

test('exposes semantic color variables under the Neoverse namespace', () => {
  expect(cssVariables.color.surface.canvas).toBe('--neoverse-color-surface-canvas');
  expect(cssVariables.color.text.primary).toBe('--neoverse-color-text-primary');
  expect(cssVariables.color.edgeLight).toBe('--neoverse-color-edge-light');
  expect(cssVariables.color.ambient.ice).toBe('--neoverse-color-ambient-ice');
  expect(cssVariables.color.action.primaryHover).toBe('--neoverse-color-action-primary-hover');
  expect(cssVariables.color.status.danger).toBe('--neoverse-color-status-danger');
});
test('exposes canonical component token namespaces', () => {
  expect(cssVariables.components.button.primary.background).toBe(
    '--neoverse-control-primary-background',
  );
  expect(cssVariables.components.button.ghost.border).toBe('--neoverse-control-ghost-border');
  expect(cssVariables.components.button.disabledOpacity).toBe(
    '--neoverse-control-button-disabled-opacity',
  );
  expect(cssVariables.components.segmentedControl.backgroundColor).toBe(
    '--neoverse-control-segmented-background-color',
  );
  expect(cssVariables.components.segmentedControl.activeBackground).toBe(
    '--neoverse-control-segmented-active-background',
  );
  expect(cssVariables.components.segmentedControl.activeShadow).toBe(
    '--neoverse-control-segmented-active-shadow',
  );
  expect(cssVariables.components.segmentedControl.shellHoverBackgroundColor).toBe(
    '--neoverse-control-segmented-shell-hover-background-color',
  );
  expect(cssVariables.components.segmentedControl.shellHoverBorder).toBe(
    '--neoverse-control-segmented-shell-hover-border',
  );
  expect(cssVariables.components.segmentedControl.edgeRefractionOpacity).toBe(
    '--neoverse-control-segmented-edge-refraction-opacity',
  );
  expect(cssVariables.components.segmentedControl.edgeDisplay).toBe(
    '--neoverse-control-segmented-edge-display',
  );
  expect(cssVariables.components.segmentedControl.optionHoverBackground).toBe(
    '--neoverse-control-hover-background',
  );
  expect(cssVariables.components.segmentedControl.optionPressScale).toBe(
    '--neoverse-control-segmented-option-press-scale',
  );
  expect(cssVariables.components.scrollbar.immersive.size).toBe(
    '--neoverse-scrollbar-immersive-size',
  );
  expect(cssVariables.components.skeleton.fill).toBe('--neoverse-skeleton-fill');
  expect(cssVariables.components.badge.labelOpticalOffset).toBe(
    '--neoverse-badge-label-optical-offset',
  );
  expect(cssVariables.components.badge.background).toBe('--neoverse-badge-background');
  expect(cssVariables.components.badge.info.background).toBe('--neoverse-badge-info-background');
  expect(cssVariables.components.badge.info.shadow).toBe('--neoverse-badge-info-shadow');
  expect(cssVariables.components.notice.info.background).toBe('--neoverse-notice-info-background');
  expect(cssVariables.components.tooltip.accentTint).toBe('--neoverse-tooltip-accent-tint');
  expect(cssVariables.components.table.background).toBe('--neoverse-table-background');
  expect(cssVariables.components.table.radius).toBe('--neoverse-table-radius');
  expect(cssVariables.components.table.gridLine).toBe('--neoverse-table-grid-line');
  expect(cssVariables.components.table.gridLineStrong).toBe('--neoverse-table-grid-line-strong');
  expect(cssVariables.components.disclosure.background).toBe('--neoverse-disclosure-background');
  expect(cssVariables.components.disclosure.hoverFill).toBe('--neoverse-disclosure-hover-fill');
  expect(cssVariables.components.disclosure.edgeActive).toBe('--neoverse-disclosure-edge-active');
  expect(cssVariables.components.disclosure.openShadow).toBe('--neoverse-disclosure-open-shadow');
  expect(cssVariables.components.disclosure.activeIndicatorForeground).toBe(
    '--neoverse-disclosure-active-indicator-foreground',
  );
  expect(cssVariables.components.prose.quoteBackground).toBe('--neoverse-prose-quote-background');
  expect(cssVariables.components.prose.inlineCodeBackground).toBe(
    '--neoverse-prose-inline-code-background',
  );
  expect(cssVariables.components.formControl.focusBackground).toBe(
    '--neoverse-form-control-focus-background',
  );
  expect(cssVariables.components.formControl.disabledBackground).toBe(
    '--neoverse-form-control-disabled-background',
  );
  expect(cssVariables.components.formControl.disabledForeground).toBe(
    '--neoverse-form-control-disabled-foreground',
  );
  expect('control' in cssVariables).toBe(false);
  expect('scrollbar' in cssVariables).toBe(false);
  expect('skeleton' in cssVariables).toBe(false);
});
test('exposes consumer-validated action and navigation component tokens', () => {
  expect(cssVariables.iconSize.sm).toBe('--neoverse-icon-size-sm');
  expect(cssVariables.components.action.height.lg).toBe('--neoverse-action-height-lg');
  expect(cssVariables.components.action.iconSize.md).toBe('--neoverse-action-icon-size-md');
  expect(cssVariables.components.navigationItem.indicatorColor).toBe(
    '--neoverse-navigation-item-indicator-color',
  );
  expect(cssVariables.components.navigationItem.compactGap).toBe(
    '--neoverse-navigation-item-compact-gap',
  );
  expect(cssVariables.components.navigationItem.compactIndicatorInset).toBe(
    '--neoverse-navigation-item-compact-indicator-inset',
  );
  expect(cssVariables.components.navigationItem.paddingBlock.md).toBe(
    '--neoverse-navigation-item-padding-block-md',
  );
  expect(cssVariables.components.navigationItem.fontSize.md).toBe(
    '--neoverse-navigation-item-font-size-md',
  );
  expect(cssVariables.components.navigationItem.iconSize).toBe(
    '--neoverse-navigation-item-icon-size',
  );
  expect(cssVariables.components.breadcrumb.currentForeground).toBe(
    '--neoverse-breadcrumb-current-foreground',
  );
  expect(cssVariables.components.breadcrumb.focusRadius).toBe('--neoverse-breadcrumb-focus-radius');
  expect(cssVariables.components.controlSurface.itemGap).toBe(
    '--neoverse-control-surface-item-gap',
  );
  expect(cssVariables.components.controlSurface.groupHeight).toBe(
    '--neoverse-control-surface-group-height',
  );
  expect(cssVariables.components.controlSurface.navigationHeight).toBe(
    '--neoverse-control-surface-navigation-height',
  );
  expect(cssVariables.components.controlSurface.segmentedHeight).toBe(
    '--neoverse-control-surface-segmented-height',
  );
  expect(cssVariables.components.controlSurface.paddingBlock).toBe(
    '--neoverse-control-surface-padding-block',
  );
  expect(cssVariables.components.controlSurface.paddingInline).toBe(
    '--neoverse-control-surface-padding-inline',
  );
  expect(cssVariables.components.controlSurface.dividerGap).toBe(
    '--neoverse-control-surface-divider-gap',
  );
  expect(cssVariables.components.controlSurface.chromeRefractionGradient).toBe(
    '--neoverse-control-chrome-refraction-gradient',
  );
  expect(cssVariables.components.controlSurface.chromeEdgeRefractionOpacity).toBe(
    '--neoverse-control-chrome-edge-refraction-opacity',
  );
  expect(cssVariables.components.controlSurface.chromeEdgeHighlight).toBe(
    '--neoverse-control-chrome-edge-highlight',
  );
  expect(cssVariables.components.controlSurface.chromeTrailingPaddingInline).toBe(
    '--neoverse-control-chrome-trailing-padding-inline',
  );
  expect(cssVariables.components.statusIndicator.dotSize.md).toBe(
    '--neoverse-status-indicator-dot-size-md',
  );
  expect(cssVariables.components.statusIndicator.success.pulseShadow).toBe(
    '--neoverse-status-indicator-success-pulse-shadow',
  );
});

test('keeps semantic source generic and assigns component token ownership', async () => {
  const semanticCss = await readTokenCss('semantic.css');
  expect(semanticCss).not.toMatch(/--neoverse-(?:control|scrollbar|skeleton|badge)-/);
  expect(semanticCss).not.toMatch(/\[data-theme=|:root\.(?:light|dark)/);

  const ownership = await Promise.all([
    ['components/button.css', '--neoverse-control-primary-background'],
    ['components/action.css', '--neoverse-action-height-md'],
    ['components/navigation-item.css', '--neoverse-navigation-item-active-background'],
    ['components/breadcrumb.css', '--neoverse-breadcrumb-link-foreground'],
    ['components/control-surface.css', '--neoverse-control-surface-padding'],
    ['components/status-indicator.css', '--neoverse-status-indicator-dot-size-sm'],
    ['components/segmented-control.css', '--neoverse-control-segmented-background-color'],
    ['components/badge.css', '--neoverse-badge-background'],
    ['components/notice.css', '--neoverse-notice-neutral-background'],
    ['components/tooltip.css', '--neoverse-tooltip-radius'],
    ['components/skeleton.css', '--neoverse-skeleton-fill'],
    ['components/scrollbar.css', '--neoverse-scrollbar-immersive-size'],
    ['components/form-control.css', '--neoverse-form-control-background'],
    ['components/table.css', '--neoverse-table-background'],
    ['components/disclosure.css', '--neoverse-disclosure-background'],
    ['components/prose.css', '--neoverse-prose-quote-background'],
  ] as const);

  for (const [fileName, token] of ownership) {
    expect(await readTokenCss(fileName)).toContain(`${token}:`);
  }
});

test('keeps feedback surface recipes in the token layer', async () => {
  const [badgeCss, noticeCss, tooltipCss, statusCss] = await Promise.all([
    readCssFile(new URL('../../tailwind/src/components/badge.css', import.meta.url)),
    readCssFile(new URL('../../tailwind/src/components/notice.css', import.meta.url)),
    readCssFile(new URL('../../tailwind/src/components/tooltip.css', import.meta.url)),
    readCssFile(new URL('../../tailwind/src/components/status-indicator.css', import.meta.url)),
  ]);

  expect(badgeCss).not.toContain('color-mix(');
  expect(noticeCss).not.toContain('color-mix(');
  expect(tooltipCss).not.toContain('color-mix(');
  expect(statusCss).not.toContain('color-mix(');

  expect(badgeCss).toContain('border: 0;');
  expect(noticeCss).toContain('border: 0;');
  expect(tooltipCss).toContain('--neoverse-tooltip-arrow-background');
  expect(statusCss).toContain('--ui-status-indicator-pulse-shadow');
});

test('keeps high-traffic component recipes semantic instead of locally hardcoded', async () => {
  const componentFiles = [
    'button.css',
    'action.css',
    'segmented-control.css',
    'navigation-item.css',
    'control-surface.css',
    'dock.css',
    'form-control.css',
    'surface.css',
    'tooltip.css',
    'disclosure.css',
    'table.css',
    'prose.css',
    'badge.css',
    'notice.css',
    'status-indicator.css',
    'skeleton.css',
  ] as const;

  const sources = await Promise.all(
    componentFiles.map((fileName) =>
      readCssFile(new URL(`../../tailwind/src/components/${fileName}`, import.meta.url)),
    ),
  );

  for (const source of sources) {
    expect(source).not.toMatch(/\b\d+(?:\.\d+)?(?:px|rem|ms|%)\b/);
    expect(source).not.toContain('color-mix(');
  }
});

test('keeps inset component states on shared material roles', async () => {
  const [materialCss, formCss, tableCss, disclosureCss, proseCss] = await Promise.all([
    readTokenCss('material.css'),
    readTokenCss('components/form-control.css'),
    readTokenCss('components/table.css'),
    readTokenCss('components/disclosure.css'),
    readTokenCss('components/prose.css'),
  ]);

  expect(materialCss).toContain('--neoverse-surface-inset-rest-background:');
  expect(materialCss).toContain('--neoverse-surface-inset-hover-background:');
  expect(materialCss).toContain('--neoverse-surface-inset-strong-background:');
  expect(materialCss).toContain('--neoverse-surface-inset-disabled-background:');

  expect(formCss).toContain(
    '--neoverse-form-control-hover-background: var(--neoverse-surface-inset-hover-background);',
  );
  expect(formCss).toContain('--neoverse-surface-inset-disabled-background');
  expect(tableCss).toContain(
    '--neoverse-table-header-background: var(--neoverse-surface-inset-header-background);',
  );
  expect(tableCss).toContain('--neoverse-material-glass-subtle-edge-highlight');
  expect(disclosureCss).toContain(
    '--neoverse-disclosure-hover-fill: var(--neoverse-surface-inset-hover-fill);',
  );
  expect(disclosureCss).toContain('--neoverse-disclosure-edge-active:');
  expect(disclosureCss).toContain(
    '--neoverse-disclosure-open-fill: var(--neoverse-surface-inset-strong-fill);',
  );
  expect(proseCss).toContain(
    '--neoverse-prose-quote-background: var(--neoverse-surface-inset-strong-background);',
  );
  expect(proseCss).toContain('--neoverse-surface-inset-edge-active');
  expect(proseCss).toContain('--neoverse-surface-inset-alternate-fill');
  expect(proseCss).toContain('--neoverse-prose-inline-code-shadow:');
  expect(proseCss).toContain('--neoverse-surface-inset-active-highlight');

  expect(formCss).not.toContain('color-mix(');
  expect(tableCss).not.toContain('color-mix(');
  expect(disclosureCss).not.toContain('color-mix(');
  expect(proseCss).not.toContain('color-mix(');
});

test('keeps skeleton motion at a calmer loading pace', async () => {
  const semanticCss = await readTokenCss('components/skeleton.css');
  const duration = semanticCss
    .match(/--neoverse-skeleton-shimmer-duration:\s*([^;]+)/)?.[1]
    ?.trim();

  expect(duration).toBe('1.25s');
  expect(cssVariables.components.skeleton.pulseMidOpacity).toBe(
    '--neoverse-skeleton-pulse-mid-opacity',
  );
  expect(semanticCss).toContain('--neoverse-skeleton-pulse-mid-opacity: 0.58;');

  const skeletonCss = await readCssFile(
    new URL('../../tailwind/src/components/skeleton.css', import.meta.url),
  );
  expect(skeletonCss).toContain('opacity: var(--neoverse-skeleton-pulse-mid-opacity);');
  expect(skeletonCss).not.toContain('opacity: 0.58;');
});

test('keeps immersive scrollbars theme-aware and quiet at rest', async () => {
  const semanticCss = await readTokenCss('components/scrollbar.css');

  expect(semanticCss).toContain('--neoverse-scrollbar-immersive-size: var(--neoverse-space-3);');
  expect(semanticCss).toContain('--neoverse-scrollbar-immersive-track: color-mix(');
  expect(semanticCss).toContain('--neoverse-scrollbar-immersive-thumb: color-mix(');
  expect(semanticCss).toContain('--neoverse-scrollbar-immersive-thumb-hover: color-mix(');
  expect(semanticCss).toContain('var(--neoverse-scrollbar-immersive-thumb-hover) 48%,');
  expect(semanticCss).toContain('var(--neoverse-scrollbar-immersive-thumb-active) 48%,');
  expect(semanticCss).toMatch(/--neoverse-scrollbar-immersive-thumb-edge:\s*inset 0 1px 1px/);
});

test('keeps the light segmented control edges translucent and blurred', async () => {
  const [segmentedCss, sharedControlCss, lightCss, themesCss] = await Promise.all([
    readTokenCss('components/segmented-control.css'),
    readTokenCss('components/shared-control.css'),
    readTokenCss('themes/light.css'),
    readTokenCss('themes/dark.css'),
  ]);
  const semanticCss = `${segmentedCss}\n${sharedControlCss}`;
  expect(semanticCss).toContain(
    '--neoverse-control-segmented-background-color: color-mix(\n      in srgb,\n      var(--neoverse-color-accent-primary) 7%',
  );
  expect(semanticCss).toContain(
    '--neoverse-control-segmented-border: var(--neoverse-control-button-border);',
  );
  expect(semanticCss).toMatch(
    /--neoverse-control-segmented-shadow:\s*var\(--neoverse-control-secondary-shadow\);/,
  );
  expect(semanticCss).toContain(
    '--neoverse-control-segmented-filter: blur(6px) saturate(112%) brightness(102%);',
  );
  expect(semanticCss).toMatch(/--neoverse-control-segmented-foreground:\s*color-mix\(/);
  expect(semanticCss).toMatch(/--neoverse-control-segmented-active-foreground:\s*color-mix\(/);
  expect(semanticCss).toContain(
    '--neoverse-control-segmented-active-background: var(--neoverse-control-active-background);',
  );
  expect(semanticCss).toContain(
    '--neoverse-control-segmented-active-border: var(--neoverse-control-active-border);',
  );
  expect(semanticCss).toContain(
    '--neoverse-control-segmented-active-shadow: var(--neoverse-control-active-shadow);',
  );
  const activeForeground =
    semanticCss.match(/--neoverse-control-segmented-active-foreground:([\s\S]*?);/)?.[1] ?? '';
  expect(activeForeground).toContain('var(--neoverse-color-accent-secondary) 30%');
  expect(activeForeground).not.toContain('var(--neoverse-color-accent-primary)');
  const segmentedShadow =
    sharedControlCss.match(/--neoverse-control-secondary-shadow:([\s\S]*?);/)?.[1] ?? '';
  expect(segmentedShadow).not.toContain('var(--neoverse-color-text-primary)');
  expect(segmentedShadow).not.toContain('var(--neoverse-color-accent-secondary)');
  expect(segmentedShadow).toContain('inset 1px 0 3px');
  expect(segmentedShadow).toContain('0 2px 8px -2px');
  expect(semanticCss).toMatch(/--neoverse-control-active-background:\s*linear-gradient\(/);
  const activeBackground =
    semanticCss.match(/--neoverse-control-active-background:([\s\S]*?);/)?.[1] ?? '';
  expect(activeBackground).toContain('var(--neoverse-color-accent-secondary) 13%');
  expect(activeBackground).toContain('var(--neoverse-color-accent-secondary) 7%');
  expect(activeBackground).not.toContain('var(--neoverse-color-accent-primary)');
  expect(semanticCss).toContain('--neoverse-control-active-border: transparent;');
  expect(semanticCss).toMatch(/--neoverse-control-active-highlight:\s*inset 0 1px 3px/);
  const activeHighlight =
    semanticCss.match(/--neoverse-control-active-highlight:([\s\S]*?);/)?.[1] ?? '';
  expect(activeHighlight).not.toContain('var(--neoverse-color-edge-light)');
  expect(activeHighlight).not.toContain('var(--neoverse-color-text-primary)');
  expect(activeHighlight).not.toContain('var(--neoverse-color-accent-primary)');
  expect(activeHighlight).toContain('var(--neoverse-color-accent-secondary) 14%');
  expect(lightCss).toContain(
    '--neoverse-control-segmented-background-color: var(--neoverse-material-glass-subtle-background);',
  );
  expect(lightCss).toMatch(
    /--neoverse-control-segmented-active-fill:\s*color-mix\(\s*in srgb,\s*var\(--neoverse-color-surface-raised\) 86%/,
  );
  expect(lightCss).toContain('var(--neoverse-color-accent-secondary) 14%');
  expect(lightCss).toContain('--neoverse-control-segmented-border: transparent;');
  expect(lightCss).toMatch(
    /--neoverse-control-segmented-edge-refraction-opacity:\s*var\(\s*--neoverse-material-edge-refraction-opacity-subtle/,
  );
  expect(lightCss).toContain('--neoverse-control-segmented-edge-display: block;');
  expect(lightCss).toContain(
    '--neoverse-control-segmented-shell-hover-background-image: var(\n    --neoverse-control-segmented-background-image\n  );',
  );
  expect(lightCss).toContain(
    '--neoverse-control-segmented-shell-hover-background-color: var(\n    --neoverse-control-segmented-background-color\n  );',
  );
  expect(lightCss).toContain('--neoverse-control-segmented-shell-hover-border: transparent;');
  expect(lightCss).toContain(
    '--neoverse-control-segmented-shell-hover-shadow: var(--neoverse-control-segmented-shadow);',
  );
  expect(lightCss).toContain(
    '--neoverse-control-segmented-active-shadow: var(--neoverse-control-button-filled-shadow);',
  );
  expect(lightCss).toMatch(
    /--neoverse-control-segmented-shadow:\s*inset 0 1px 0 color-mix\(in srgb, var\(--neoverse-color-edge-light\) 46%/,
  );
  expect(semanticCss).toContain(
    '--neoverse-control-active-shadow:\n      var(--neoverse-control-active-highlight),\n      0 2px 7px -2px color-mix(in srgb, var(--neoverse-color-accent-secondary) 24%, transparent);',
  );
  expect(semanticCss).toMatch(/--neoverse-control-secondary-shadow:\s*inset 0 1px 3px/);
  expect(
    themesCss.match(
      /--neoverse-control-active-shadow:\s*var\(--neoverse-control-active-highlight\);/g,
    ),
  ).toHaveLength(1);
  expect(
    themesCss.match(
      /--neoverse-control-segmented-shadow:\s*var\(--neoverse-control-secondary-shadow\);/g,
    ),
  ).toHaveLength(1);
  expect(
    themesCss.match(
      /--neoverse-control-segmented-filter:\s*var\(--neoverse-control-secondary-filter\);/g,
    ),
  ).toHaveLength(1);
  expect(
    themesCss.match(
      /--neoverse-control-segmented-background-image:\s*var\(--neoverse-control-secondary-background\);/g,
    ),
  ).toHaveLength(1);
  expect(
    themesCss.match(/--neoverse-control-active-background:\s*linear-gradient\(/g),
  ).toHaveLength(1);
  expect(themesCss.match(/--neoverse-control-active-border:\s*transparent;/g)).toHaveLength(1);
});

test('keeps dark segmented and navigation surfaces on the original dark recipe', async () => {
  const themesCss = await readTokenCss('themes/dark.css');
  expect(themesCss).toContain('--neoverse-control-segmented-edge-display: none;');
  expect(themesCss).toContain('--neoverse-control-segmented-edge-refraction-opacity: 0;');
  expect(themesCss).toContain(
    '--neoverse-control-segmented-option-radius: var(--neoverse-control-compact-radius);',
  );
  expect(themesCss).toContain(
    '--neoverse-control-segmented-shell-hover-background-image: var(\n    --neoverse-control-segmented-background-image\n  );',
  );
  expect(themesCss).toContain(
    '--neoverse-control-segmented-shell-hover-background-color: var(\n    --neoverse-control-segmented-background-color\n  );',
  );
  expect(themesCss).toContain(
    '--neoverse-control-segmented-shell-hover-border: var(--neoverse-control-segmented-border);',
  );
  expect(themesCss).toContain(
    '--neoverse-control-segmented-shell-hover-shadow: var(--neoverse-control-segmented-shadow);',
  );
  expect(themesCss).toContain(
    '--neoverse-navigation-item-active-background: var(--neoverse-control-active-background);',
  );
  expect(themesCss).toContain('--neoverse-navigation-item-active-fill: transparent;');
  expect(themesCss).toContain(
    '--neoverse-navigation-item-active-border: var(--neoverse-control-active-border);',
  );
  expect(themesCss).toContain(
    '--neoverse-navigation-item-active-shadow: var(--neoverse-control-active-highlight);',
  );
  const activeBackgrounds = themesCss.match(/--neoverse-control-active-background:([\s\S]*?);/g);

  expect(activeBackgrounds).toHaveLength(1);
  for (const activeBackground of activeBackgrounds ?? []) {
    expect(activeBackground).toContain('linear-gradient(');
    expect(activeBackground).toContain('var(--neoverse-color-accent-secondary) 13%');
    expect(activeBackground).toContain('var(--neoverse-color-accent-primary) 7%');
    expect(activeBackground).not.toContain('var(--neoverse-color-blue-900)');
    expect(activeBackground).not.toContain('var(--neoverse-color-text-primary)');
  }

  expect(
    themesCss.match(
      /--neoverse-control-segmented-active-foreground:\s*var\(--neoverse-color-accent-secondary\);/g,
    ),
  ).toHaveLength(1);

  const activeHighlights = themesCss.match(/--neoverse-control-active-highlight:([\s\S]*?);/g);

  expect(activeHighlights).toHaveLength(1);
  for (const activeHighlight of activeHighlights ?? []) {
    expect(activeHighlight).not.toContain('var(--neoverse-color-text-primary)');
    expect(activeHighlight).toContain('var(--neoverse-color-edge-light) 62%');
  }
});

test('keeps dark elevated cards neutral and softly edged', async () => {
  const themesCss = await readTokenCss('themes/dark.css');
  const expectedOverrides = [
    [
      /--neoverse-material-filter-elevated:\s*blur\(28px\) saturate\(145%\) brightness\(106%\) contrast\(103%\);/g,
      1,
    ],
    [
      /--neoverse-material-edge-filter-elevated:\s*blur\(16px\) saturate\(118%\) brightness\(102%\)\s+contrast\(103%\);/g,
      1,
    ],
    [/--neoverse-material-tint-elevated:\s*var\(--neoverse-color-surface-glass\);/g, 1],
    [/--neoverse-material-transparency-elevated:\s*44%;/g, 1],
    [/--neoverse-material-edge-refraction-opacity-elevated:\s*0\.24;/g, 1],
    [/--neoverse-material-refraction-gradient-elevated:\s*linear-gradient\(\s*125deg,/g, 1],
  ];

  for (const [override, count] of expectedOverrides) {
    expect(themesCss.match(override as RegExp)).toHaveLength(count as number);
  }

  for (const token of [
    'tint-elevated',
    'edge-highlight-elevated',
    'inner-glow-elevated',
    'seam-glow-elevated',
    'bloom-elevated',
  ]) {
    const declarations = themesCss.match(
      new RegExp(`--neoverse-material-${token}:([\\s\\S]*?);`, 'g'),
    );

    expect(declarations).toHaveLength(1);
    for (const declaration of declarations ?? []) {
      expect(declaration).not.toMatch(/accent-(?:primary|secondary|tertiary)/);
    }
  }
  expect(themesCss).toContain('var(--neoverse-color-surface-raised)');
});

test('keeps dark subtle state cards neutral and softly grounded', async () => {
  const themesCss = await readTokenCss('themes/dark.css');
  const expectedOverrides: Array<[RegExp, number]> = [
    [
      /--neoverse-material-filter-subtle:\s*blur\(10px\) saturate\(112%\) brightness\(102%\) contrast\(102%\);/g,
      1,
    ],
    [
      /--neoverse-material-edge-filter-subtle:\s*blur\(12px\) saturate\(118%\) brightness\(102%\)\s+contrast\(103%\);/g,
      1,
    ],
    [
      /--neoverse-material-tint-subtle:\s*color-mix\(\s*in srgb,\s*var\(--neoverse-color-surface-raised\) 84%,\s*var\(--neoverse-color-text-primary\) 16%\s*\);/g,
      1,
    ],
    [/--neoverse-material-transparency-subtle:\s*24%;/g, 1],
    [/--neoverse-material-edge-refraction-opacity-subtle:\s*0\.3(?:0)?;/g, 1],
    [
      /--neoverse-material-glass-subtle-shadow:\s*0 0\.75rem 2rem -1\.25rem rgb\(0 0 0 \/ 34%\),\s*0 3px 8px -1px rgb\(0 0 0 \/ 12%\);/g,
      1,
    ],
    [/--neoverse-material-refraction-gradient-subtle:\s*radial-gradient\(/g, 1],
  ];

  for (const [override, count] of expectedOverrides) {
    expect(themesCss.match(override)).toHaveLength(count);
  }

  for (const token of [
    'edge-highlight-subtle',
    'inner-glow-subtle',
    'seam-glow-subtle',
    'bloom-subtle',
  ]) {
    const declarations = themesCss.match(
      new RegExp(`--neoverse-material-${token}:([\\s\\S]*?);`, 'g'),
    );

    expect(declarations).toHaveLength(1);
    for (const declaration of declarations ?? []) {
      expect(declaration).not.toMatch(/accent-(?:primary|secondary|tertiary)/);
    }
  }
});

test('keeps dark primary and secondary buttons on distinct Glass hierarchy', async () => {
  const themesCss = await readTokenCss('themes/dark.css');

  /* Secondary retains the neutral deployed Glass recipe. Primary layers a
     restrained aurora field over that same sampled plane instead of becoming
     an unrelated opaque CTA. */
  const buttonBackground = themesCss.match(
    /--neoverse-control-button-filled-background:\s*linear-gradient\(\s*145deg,\s*rgb\(181 197 213 \/ 13%\),\s*rgb\(127 147 168 \/ 7%\)\s*\);/g,
  );
  expect(buttonBackground).toHaveLength(1);
  expect(themesCss).toContain('--neoverse-control-button-filled-fill: transparent;');

  const primaryBackground = themesCss.match(
    /--neoverse-control-primary-background:([\s\S]*?);/,
  )?.[1];
  expect(primaryBackground).toContain('var(--neoverse-color-accent-secondary)');
  expect(primaryBackground).toContain('var(--neoverse-color-accent-primary)');
  expect(primaryBackground).toContain('var(--neoverse-control-button-filled-background)');
  expect(themesCss).toContain(
    '--neoverse-control-primary-foreground: var(--neoverse-color-text-primary);',
  );

  const primaryHover = themesCss.match(
    /--neoverse-control-primary-hover-background:([\s\S]*?);/,
  )?.[1];
  expect(primaryHover).toContain('var(--neoverse-color-accent-secondary)');
  expect(primaryHover).toContain('var(--neoverse-color-accent-primary)');
  expect(primaryHover).toContain('var(--neoverse-control-button-filled-hover-background)');

  expect(
    themesCss.match(
      /--neoverse-control-secondary-filter:\s*var\(--neoverse-material-filter-subtle\);/g,
    ),
  ).toHaveLength(1);
  expect(
    themesCss.match(
      /--neoverse-control-button-filter:\s*blur\(36px\) saturate\(165%\) brightness\(108%\);/g,
    ),
  ).toHaveLength(1);

  for (const token of [
    'secondary-hover-foreground',
    'secondary-active-foreground',
    'ghost-hover-foreground',
    'ghost-active-foreground',
  ]) {
    expect(
      themesCss.match(
        new RegExp(
          `--neoverse-control-${token}:\\s*var\\(\\s*--neoverse-color-text-primary\\s*\\);`,
          'g',
        ),
      ),
    ).toHaveLength(1);
  }

  expect(
    themesCss.match(
      /--neoverse-control-button-edge:\s*var\(--neoverse-control-button-filled-shadow\);/g,
    ),
  ).toHaveLength(1);
  expect(
    themesCss.match(
      /--neoverse-control-button-edge-active:\s*var\(--neoverse-control-button-filled-hover-shadow\);/g,
    ),
  ).toHaveLength(1);
  expect(themesCss).toContain('--neoverse-control-button-edge-refraction-opacity: 0;');

  const activeBackground = themesCss.match(/--neoverse-control-active-background:([\s\S]*?);/g);
  expect(activeBackground).toHaveLength(1);
  for (const gradient of activeBackground ?? []) {
    expect(gradient).toContain('var(--neoverse-color-accent-secondary)');
    expect(gradient).toContain('var(--neoverse-color-accent-primary)');
  }
});

test('keeps light control buttons grounded by a compact neutral shadow', async () => {
  const [geometryCss, buttonCss, sharedControlCss, themesCss] = await Promise.all([
    readTokenCss('geometry.css'),
    readTokenCss('components/button.css'),
    readTokenCss('components/shared-control.css'),
    readTokenCss('themes/dark.css'),
  ]);
  const semanticCss = `${buttonCss}\n${sharedControlCss}`;
  const controlShadow = 'var(--neoverse-shadow-control)';

  expect(geometryCss).toContain('--neoverse-shadow-control: 0 2px 6px -1px rgb(14 34 44 / 20%);');

  const primaryShadow = semanticCss.match(/--neoverse-control-primary-shadow:([\s\S]*?);/)?.[1];
  expect(primaryShadow).toContain('var(--neoverse-control-active-shadow)');

  const secondaryShadow = semanticCss.match(/--neoverse-control-secondary-shadow:([\s\S]*?);/)?.[1];
  expect(secondaryShadow).toContain(controlShadow);

  expect(semanticCss).toMatch(/--neoverse-control-secondary-background:\s*linear-gradient\(/);
  expect(semanticCss).toMatch(
    /--neoverse-control-primary-hover-shadow:\s*var\(\s*--neoverse-control-active-shadow\s*\);/,
  );
  expect(semanticCss).toMatch(
    /--neoverse-control-button-edge:\s*var\(--neoverse-control-button-filled-shadow\);/,
  );
  expect(semanticCss).toMatch(
    /--neoverse-control-button-edge-active:\s*var\(--neoverse-control-active-shadow\);/,
  );

  expect(
    themesCss.match(/--neoverse-shadow-control:\s*var\(--neoverse-shadow-xs\);/g),
  ).toHaveLength(1);
});

test('aligns light buttons with the pale mint segmented-control surface', async () => {
  const [buttonCss, sharedControlCss, lightCss] = await Promise.all([
    readTokenCss('components/button.css'),
    readTokenCss('components/shared-control.css'),
    readTokenCss('themes/light.css'),
  ]);
  const semanticCss = `${buttonCss}\n${sharedControlCss}`;
  const declaration = (token: string): string =>
    semanticCss.match(new RegExp(`--neoverse-control-${token}:([\\s\\S]*?);`))?.[1] ?? '';

  expect(declaration('primary-background')).toContain('var(--neoverse-control-active-background)');
  expect(declaration('primary-background')).toContain(
    'var(--neoverse-control-button-filled-background)',
  );
  expect(declaration('secondary-background')).not.toContain(
    'var(--neoverse-control-active-background)',
  );
  expect(declaration('secondary-background')).not.toContain('var(--neoverse-color-surface-glass)');
  expect(declaration('secondary-fill')).toContain('var(--neoverse-color-surface-glass)');
  expect(lightCss).toContain(
    '--neoverse-control-button-filled-background: var(--neoverse-control-secondary-background);',
  );
  expect(lightCss).toContain(
    '--neoverse-control-button-filled-fill: var(--neoverse-control-secondary-fill);',
  );
  expect(declaration('primary-foreground')).toMatch(
    /var\(\s*--neoverse-control-segmented-active-foreground\s*\)/,
  );
  for (const token of [
    'primary-hover-background',
    'button-hover-background',
    'button-active-background',
    'button-ghost-active-background',
  ]) {
    expect(declaration(token)).toMatch(/var\(\s*--neoverse-control-active-background\s*\)/);
  }

  for (const token of [
    'secondary-hover-foreground',
    'secondary-active-foreground',
    'ghost-hover-foreground',
    'ghost-active-foreground',
  ]) {
    expect(declaration(token)).toMatch(
      /var\(\s*--neoverse-control-segmented-active-foreground\s*\)/,
    );
  }
});

test('keeps button edges restrained and stable beside segmented controls', async () => {
  const [buttonTokensCss, buttonCss, sharedControlCss, segmentedCss] = await Promise.all([
    readTokenCss('components/button.css'),
    readCssFile(new URL('../../tailwind/src/components/button.css', import.meta.url)),
    readTokenCss('components/shared-control.css'),
    readTokenCss('components/segmented-control.css'),
  ]);
  const declaration = (source: string, token: string): string =>
    source.match(new RegExp(`--neoverse-control-${token}:([\\s\\S]*?);`))?.[1] ?? '';
  const ghostGlass = extractCssBlock(buttonCss, '.ui-button--ghost.material-glass-subtle');
  const ghostDefault = extractCssBlock(buttonCss, '.ui-button--ghost');
  const ghostHover = extractCssBlock(
    buttonCss,
    ".ui-button--ghost:hover:not(:disabled):not([aria-disabled='true'])",
  );
  const buttonSurface = extractCssBlock(buttonCss, '.ui-button.material-glass-subtle');
  const pressLayer = extractCssBlock(buttonCss, '.ui-button.material-glass-subtle::after');

  expect(buttonCss).toMatch(
    /border:\s*var\(--neoverse-border-width-thin\)\s+var\(--neoverse-border-style-solid\)\s+var\(--neoverse-control-button-border\);/,
  );
  expect(buttonSurface).toMatch(/overflow:\s*hidden;/);
  expect(pressLayer).toMatch(/inset:\s*0;/);
  expect(pressLayer).toMatch(/border-radius:\s*inherit;/);
  expect(declaration(buttonTokensCss, 'button-edge')).not.toContain(
    'var(--neoverse-color-edge-light)',
  );
  expect(declaration(buttonTokensCss, 'button-refraction-gradient')).not.toContain(
    'var(--neoverse-color-edge-light)',
  );
  expect(declaration(buttonTokensCss, 'button-edge-carrier')).not.toContain(
    'var(--neoverse-color-edge-light)',
  );
  for (const token of [
    'secondary-background',
    'secondary-hover-background',
    'secondary-shadow',
    'secondary-hover-shadow',
  ]) {
    expect(declaration(sharedControlCss, token)).not.toContain('var(--neoverse-color-edge-light)');
  }

  expect(ghostGlass).toMatch(
    /--neoverse-material-shadow:\s*var\(--neoverse-control-ghost-shadow\);/,
  );
  for (const token of ['ghost-border', 'ghost-hover-border', 'ghost-active-border']) {
    expect(declaration(buttonTokensCss, token).trim()).toBe('transparent');
  }
  expect(ghostGlass).toMatch(/border-color:\s*var\(--neoverse-control-ghost-border\);/);
  expect(ghostGlass).toMatch(/--neoverse-material-edge-refraction-opacity:\s*0;/);
  expect(buttonCss).toMatch(
    /\.ui-button--ghost\s*>\s*\.ui-button__edge-field,[\s\S]*?display:\s*none;/,
  );
  expect(ghostGlass).toMatch(/backdrop-filter:\s*none;/);
  expect(ghostDefault).toMatch(/background:\s*var\(--neoverse-control-ghost-background\);/);
  expect(ghostHover).not.toMatch(/--neoverse-material-edge-refraction-opacity:/);
  expect(ghostHover).not.toMatch(/--neoverse-material-shadow:/);

  expect(declaration(segmentedCss, 'segmented-border')).toMatch(
    /var\(\s*--neoverse-control-button-border\s*\)/,
  );
});

test('keeps secondary and ghost button surfaces visually distinct', async () => {
  const [buttonCss, sharedControlCss] = await Promise.all([
    readTokenCss('components/button.css'),
    readTokenCss('components/shared-control.css'),
  ]);
  const declaration = (source: string, token: string): string =>
    source.match(new RegExp(`--neoverse-control-${token}:([\\s\\S]*?);`))?.[1] ?? '';
  const secondaryBackground = declaration(sharedControlCss, 'secondary-background');
  const secondaryFill = declaration(sharedControlCss, 'secondary-fill');
  const ghostBackground = declaration(buttonCss, 'ghost-background');

  expect(declaration(sharedControlCss, 'button-border').trim()).toBe(
    'var(--neoverse-color-border-default)',
  );
  expect(secondaryFill).toContain('var(--neoverse-color-surface-glass)');
  expect(secondaryBackground).not.toContain('var(--neoverse-color-surface-canvas)');
  expect(ghostBackground.trim()).toBe('transparent');
  expect(`${secondaryBackground}\n${secondaryFill}`).not.toBe(ghostBackground);
});

test('keeps button surfaces independent of theme accents', async () => {
  const [buttonCss, sharedControlCss] = await Promise.all([
    readTokenCss('components/button.css'),
    readTokenCss('components/shared-control.css'),
  ]);
  const semanticCss = `${buttonCss}\n${sharedControlCss}`;
  const buttonTokens = [
    'primary-background',
    'primary-foreground',
    'primary-border',
    'primary-shadow',
    'primary-hover-background',
    'primary-hover-shadow',
    'primary-active-background',
    'button-edge',
    'button-edge-hover',
    'button-edge-active',
    'button-edge-carrier',
    'button-filter',
    'button-refraction-gradient',
    'button-press-glow',
    'button-edge-refraction-opacity',
    'button-hover-background',
    'button-active-background',
    'button-ghost-active-background',
    'secondary-background',
    'secondary-border',
    'secondary-hover-background',
    'secondary-shadow',
    'secondary-hover-shadow',
    'secondary-filter',
  ];

  for (const token of buttonTokens) {
    const declaration = semanticCss.match(
      new RegExp(`--neoverse-control-${token}:([\\s\\S]*?);`),
    )?.[1];

    expect(declaration).toBeDefined();
    expect(declaration).not.toMatch(/accent-(?:primary|secondary|tertiary)/);
    expect(declaration).not.toMatch(/material-(?:tint|edge-highlight|inner-glow|bloom)/);
  }
});

test('positions the button press glow from pointer coordinates', async () => {
  const semanticCss = await readTokenCss('components/button.css');
  const pointerPosition =
    /at var\(--neoverse-button-press-x,\s*50%\) var\(--neoverse-button-press-y,\s*50%\)/;

  expect(semanticCss).toMatch(pointerPosition);
  expect(semanticCss).not.toContain('90% 140% at 50% -12%');
});

test('keeps dark keyboard focus aligned with the segmented-control accent', async () => {
  const themesCss = await readTokenCss('themes/dark.css');
  const focusRings = themesCss.match(/--neoverse-color-focus-ring:\s*([^;]+);/g);

  expect(focusRings).toHaveLength(1);
  for (const focusRing of focusRings ?? []) {
    expect(focusRing).toContain('var(--neoverse-color-accent-secondary)');
    expect(focusRing).not.toContain('var(--neoverse-color-accent-tertiary)');
  }
});

test('provides the complete four-pixel spacing grid', () => {
  const spacingTokens = Object.values(cssVariables.space);

  expect(spacingTokens).toHaveLength(33);
  expect(spacingTokens[0]).toBe('--neoverse-space-0');
  expect(spacingTokens[32]).toBe('--neoverse-space-32');
});

test('exposes the shared geometry and typography contracts', () => {
  expect(cssVariables.radius['2xl']).toBe('--neoverse-radius-2xl');
  expect(cssVariables.shadow.inset).toBe('--neoverse-shadow-inset');
  expect(cssVariables.font.family.mono).toBe('--neoverse-font-family-mono');
  expect(cssVariables.typography.family.display).toBe('--neoverse-typography-display-font-family');
  expect(cssVariables.typography.family.body).toBe('--neoverse-typography-body-font-family');
  expect(cssVariables.typography.code.fontFamily).toBe('--neoverse-typography-code-font-family');
  expect(cssVariables.typography.scale.body.md.lineHeight).toBe(
    '--neoverse-typography-body-md-line-height',
  );
});

test('keeps semantic typography families overrideable by role', async () => {
  const typographyCss = await readTokenCss('typography.css');

  for (const role of ['display', 'title', 'body', 'label', 'caption']) {
    expect(typographyCss).toContain(
      `--neoverse-typography-${role}-font-family: var(--neoverse-font-family-sans);`,
    );
  }
  expect(typographyCss).toContain(
    '--neoverse-typography-code-font-family: var(--neoverse-font-family-code);',
  );
});

test('exposes only the canonical semantic type scale', async () => {
  const typographyCss = await readTokenCss('typography.css');
  expect(cssVariables.typography.family.title).toBe('--neoverse-typography-title-font-family');
  expect(cssVariables.typography.scale.display.lg.size).toBe(
    '--neoverse-typography-display-lg-size',
  );
  expect(cssVariables.typography.scale.title.md.size).toBe('--neoverse-typography-title-md-size');
  expect(cssVariables.typography.scale.body.sm.size).toBe('--neoverse-typography-body-sm-size');
  expect(cssVariables.typography.scale.label.lg.size).toBe('--neoverse-typography-label-lg-size');
  expect(typographyCss).not.toContain('--neoverse-typography-heading-size');
  expect(typographyCss).not.toContain('--neoverse-typography-subtitle-size');
  expect(typographyCss).not.toContain('--neoverse-typography-body-size');
});
test('exposes semantic geometry and focus aliases', () => {
  expect(cssVariables.radius.control).toBe('--neoverse-radius-control');
  expect(cssVariables.radius.controlInner).toBe('--neoverse-radius-control-inner');
  expect(cssVariables.radius.card).toBe('--neoverse-radius-card');
  expect(cssVariables.shadow.overlay).toBe('--neoverse-shadow-overlay');
  expect(cssVariables.focus.ringWidth).toBe('--neoverse-focus-ring-width');
  expect(cssVariables.focus.ringOffset).toBe('--neoverse-focus-ring-offset');
  expect(cssVariables.focus.ringOffsetColor).toBe('--neoverse-focus-ring-offset-color');
});

test('derives compact-control inner corners from the shared outer radius and inset', async () => {
  const geometryCss = await readTokenCss('geometry.css');

  expect(geometryCss).toContain('--neoverse-control-inset: 0.22rem;');
  expect(geometryCss).toContain(
    '--neoverse-radius-control-inner-offset: var(--neoverse-control-inset);',
  );
  expect(geometryCss).toContain(
    '--neoverse-control-corner-radius: var(--neoverse-radius-control);',
  );
  expect(geometryCss).toMatch(
    /--neoverse-radius-control-inner:\s*max\(\s*0px,\s*calc\(var\(--neoverse-control-corner-radius\) - var\(--neoverse-radius-control-inner-offset\)\)\s*\);/,
  );
  expect(geometryCss).not.toContain('--neoverse-radius-control-inner-offset: 0.18rem;');
});

test('keeps grouped controls on a compact, shared geometry contract', async () => {
  const [sharedControlCss, controlSurfaceCss, navigationItemCss, segmentedControlCss, lightCss] =
    await Promise.all([
      readTokenCss('components/shared-control.css'),
      readTokenCss('components/control-surface.css'),
      readTokenCss('components/navigation-item.css'),
      readTokenCss('components/segmented-control.css'),
      readTokenCss('themes/light.css'),
    ]);

  expect(sharedControlCss).toContain('--neoverse-control-compact-height: var(--neoverse-space-6);');
  expect(sharedControlCss).toContain(
    '--neoverse-control-compact-radius: var(--neoverse-radius-control-inner);',
  );
  expect(sharedControlCss).toContain('--neoverse-control-compact-line-height: normal;');
  expect(controlSurfaceCss).toContain('--neoverse-control-surface-group-height: 1.875rem;');
  expect(controlSurfaceCss).toContain(
    '--neoverse-control-surface-control-height: var(--neoverse-control-compact-height);',
  );
  expect(controlSurfaceCss).toContain(
    '--neoverse-control-surface-navigation-height: var(--neoverse-action-height-sm);',
  );
  expect(controlSurfaceCss).toContain(
    '--neoverse-control-surface-segmented-height: var(--neoverse-control-compact-height);',
  );
  expect(controlSurfaceCss).toContain(
    '--neoverse-control-surface-padding: var(--neoverse-space-1);',
  );
  expect(controlSurfaceCss).toContain(
    '--neoverse-control-surface-padding-block: var(--neoverse-control-surface-padding);',
  );
  expect(controlSurfaceCss).toContain(
    '--neoverse-control-surface-padding-inline: var(--neoverse-space-2);',
  );
  expect(controlSurfaceCss).toContain(
    '--neoverse-control-surface-corner-radius: var(--neoverse-control-segmented-corner-radius);',
  );
  expect(controlSurfaceCss).toContain(
    '--neoverse-control-surface-inner-radius: var(--neoverse-control-segmented-option-radius);',
  );
  expect(controlSurfaceCss).toMatch(
    /--neoverse-control-surface-trailing-radius:\s*var\(\s*--neoverse-control-segmented-corner-radius\s*\);/,
  );
  expect(controlSurfaceCss).toContain('--neoverse-control-surface-navigation-edge-inset: calc(');
  expect(controlSurfaceCss).toContain('--neoverse-control-surface-divider-height: 1rem;');
  expect(controlSurfaceCss).toContain(
    '--neoverse-control-surface-divider-gap: var(--neoverse-space-0);',
  );
  expect(controlSurfaceCss).toContain(
    '--neoverse-control-surface-indicator-duration: var(--neoverse-motion-spatial-duration);',
  );
  expect(controlSurfaceCss).toContain(
    '--neoverse-control-surface-indicator-easing: var(--neoverse-motion-spatial-easing);',
  );
  expect(controlSurfaceCss).toContain('--neoverse-control-chrome-edge-refraction-width: var(');
  expect(controlSurfaceCss).toMatch(
    /--neoverse-control-chrome-refraction-gradient:\s*var\(\s*--neoverse-material-refraction-gradient-subtle\s*\);/,
  );
  expect(controlSurfaceCss).toContain('--neoverse-control-chrome-edge-refraction-opacity: var(');
  expect(controlSurfaceCss).toContain(
    '--neoverse-control-chrome-edge-highlight: var(--neoverse-material-edge-highlight-elevated);',
  );
  expect(controlSurfaceCss).toContain('--neoverse-control-chrome-trailing-padding: var(');
  expect(controlSurfaceCss).toContain('--neoverse-control-chrome-trailing-padding-inline: var(');
  expect(controlSurfaceCss).toContain('--neoverse-control-surface-trailing-padding');
  expect(navigationItemCss).toContain(
    '--neoverse-navigation-item-height-md: var(--neoverse-control-surface-control-height);',
  );
  expect(navigationItemCss).toContain(
    '--neoverse-navigation-item-padding-block-md: var(--neoverse-space-1);',
  );
  expect(navigationItemCss).toContain('--neoverse-navigation-item-gap: 0.375rem;');
  expect(navigationItemCss).toContain(
    '--neoverse-navigation-item-font-size-md: var(--neoverse-font-size-2xs);',
  );
  expect(navigationItemCss).toContain(
    '--neoverse-navigation-item-compact-gap: var(--neoverse-space-1);',
  );
  expect(navigationItemCss).toContain(
    '--neoverse-navigation-item-compact-indicator-inset: var(--neoverse-space-0);',
  );
  expect(navigationItemCss).toContain(
    '--neoverse-navigation-item-indicator-inset: var(--neoverse-space-0);',
  );

  expect(segmentedControlCss).toContain('--neoverse-control-segmented-inset: 0.18rem;');
  expect(segmentedControlCss).toContain(
    '--neoverse-control-segmented-embedded-inset: var(--neoverse-space-0);',
  );
  expect(segmentedControlCss).toContain(
    '--neoverse-control-segmented-option-min-width-compact: max-content;',
  );
  expect(segmentedControlCss).toContain('--neoverse-control-segmented-option-min-width: 2.5rem;');
  expect(segmentedControlCss).toContain(
    '--neoverse-control-segmented-embedded-option-min-width: var(--neoverse-space-8);',
  );
  expect(segmentedControlCss).toContain(
    '--neoverse-control-segmented-option-height-sm: var(--neoverse-control-surface-control-height);',
  );
  expect(segmentedControlCss).toContain(
    '--neoverse-control-segmented-option-padding-block-sm: 0.2rem;',
  );
  expect(segmentedControlCss).toContain(
    '--neoverse-control-segmented-option-padding-inline-sm: 0.5rem;',
  );
  expect(segmentedControlCss).toContain(
    '--neoverse-control-segmented-embedded-option-padding-inline-sm: 0.375rem;',
  );
  expect(segmentedControlCss).toContain(
    '--neoverse-control-segmented-option-radius: var(--neoverse-control-compact-radius);',
  );
  expect(lightCss).toContain('--neoverse-control-segmented-option-radius: max(');
  expect(lightCss).toContain('var(--neoverse-control-segmented-corner-radius) -');
  expect(lightCss).toContain('var(--neoverse-control-segmented-internal-inset) -');
});

test('exposes shared Surface and Glass material contracts', () => {
  const surfaceParameters = [
    'background',
    'backgroundFallback',
    'transparency',
    'blur',
    'saturation',
    'border',
    'borderWidth',
    'edgeHighlight',
    'shadow',
    'refractionGradient',
  ];
  const glassParameters = [
    'background',
    'backgroundFallback',
    'tint',
    'transparency',
    'blur',
    'saturation',
    'filter',
    'edgeFilter',
    'border',
    'borderWidth',
    'edgeRefractionOpacity',
    'edgeRefractionWidth',
    'edgeRefractionSoftness',
    'edgeRefractionCarrier',
    'edgeHighlight',
    'innerGlow',
    'seamGlow',
    'bloom',
    'shadow',
    'hoverTransparency',
    'hoverBorder',
    'hoverShadow',
    'refractionGradient',
  ];
  const surfaceRoles = [
    cssVariables.material.surface.solid,
    cssVariables.material.surface.subtle,
    cssVariables.material.surface.elevated,
  ];
  const glassRoles = [
    cssVariables.material.glass.subtle,
    cssVariables.material.glass.elevated,
    cssVariables.material.glass.immersive,
  ];

  for (const role of surfaceRoles) {
    expect(Object.keys(role)).toEqual(surfaceParameters);
  }

  for (const role of glassRoles) {
    expect(Object.keys(role)).toEqual(glassParameters);
  }

  expect(cssVariables.material.scale.blur.md).toBe('--neoverse-material-blur-md');
  expect(cssVariables.material.scale.saturation.immersive).toBe(
    '--neoverse-material-saturation-immersive',
  );
  expect(cssVariables.material.scale.filter.elevated).toBe('--neoverse-material-filter-elevated');
  expect(cssVariables.material.scale.edgeFilter.immersive).toBe(
    '--neoverse-material-edge-filter-immersive',
  );
  expect(cssVariables.material.scale.tint.subtle).toBe('--neoverse-material-tint-subtle');
  expect(cssVariables.material.scale.innerGlow.elevated).toBe(
    '--neoverse-material-inner-glow-elevated',
  );
  expect(cssVariables.material.scale.seamGlow.subtle).toBe('--neoverse-material-seam-glow-subtle');
  expect(cssVariables.material.scale.bloom.immersive).toBe('--neoverse-material-bloom-immersive');
  expect(cssVariables.material.surface.elevated.shadow).toBe(
    '--neoverse-material-surface-elevated-shadow',
  );
  expect(cssVariables.material.glass.elevated.filter).toBe(
    '--neoverse-material-glass-elevated-filter',
  );
  expect(cssVariables.material.glass.immersive.edgeRefractionSoftness).toBe(
    '--neoverse-material-glass-immersive-edge-refraction-softness',
  );
  expect(cssVariables.material.glass.immersive.refractionGradient).toBe(
    '--neoverse-material-glass-immersive-refraction-gradient',
  );
});

test('keeps inset surface effects owned by the material token layer', async () => {
  const materialCss = await readTokenCss('material.css');
  const inset = cssVariables.material.surface.inset;

  expect(Object.keys(inset)).toEqual([
    'highlight',
    'refraction',
    'denseFill',
    'fill',
    'sheen',
    'restBackground',
    'hoverFill',
    'hoverBackground',
    'strongFill',
    'strongBackground',
    'alternateFill',
    'disabledFill',
    'disabledBackground',
    'activeHighlight',
    'filter',
    'interactiveActiveScale',
  ]);

  for (const token of Object.values(inset)) {
    expect(materialCss).toContain(`${token}:`);
  }
});

test('exposes Motion duration, easing, and spatial tokens', () => {
  expect(cssVariables.motion.duration).toEqual({
    fast: '--neoverse-motion-duration-fast',
    standard: '--neoverse-motion-duration-standard',
    expressive: '--neoverse-motion-duration-expressive',
  });
  expect(cssVariables.motion.easing.standard).toBe('--neoverse-motion-easing-standard');
  expect(cssVariables.motion.spatialDistance).toBe('--neoverse-motion-spatial-distance');
});

test('keeps the particle lifetime beyond the delayed incoming entrance', async () => {
  const motionCss = await readTokenCss('motion.css');
  const readMilliseconds = (token: string): number => {
    const raw = motionCss.match(new RegExp(`${token}:\\s*([\\d.]+)(ms|s)`));
    if (raw?.[1] === undefined || raw[2] === undefined) {
      throw new Error(`Missing Motion timing token: ${token}`);
    }
    const value = Number.parseFloat(raw[1]);
    return raw[2] === 's' ? value * 1000 : value;
  };

  const particle = readMilliseconds('--neoverse-motion-particle-duration');
  const incomingDelay = readMilliseconds('--neoverse-motion-particle-enter-delay');
  const incomingDuration = readMilliseconds('--neoverse-motion-particle-enter-duration');

  expect(particle - incomingDelay - incomingDuration).toBeGreaterThanOrEqual(200);
});

test('exposes the optional presentation root-size layout token', async () => {
  const layoutCss = await readTokenCss('layout.css');

  expect(cssVariables.layout.presentationRootSize).toBe('--neoverse-layout-presentation-root-size');
  expect(layoutCss).toContain('--neoverse-layout-presentation-root-size: clamp(');
  expect(layoutCss).toContain('calc(0.8125rem + 0.3125vw)');
});

test('exposes semantic page layout roles above the primitive container scale', async () => {
  const layoutCss = await readTokenCss('layout.css');

  expect(cssVariables.layout.page).toEqual({
    maxWidth: '--neoverse-layout-page-max-width',
    paddingInline: '--neoverse-layout-page-padding-inline',
    paddingBlock: '--neoverse-layout-page-padding-block',
  });
  expect(cssVariables.layout.contentMaxWidth).toBe('--neoverse-layout-content-max-width');
  expect(cssVariables.layout.reading).toEqual({
    width: '--neoverse-layout-reading-width',
    wideWidth: '--neoverse-layout-reading-wide-width',
  });
  expect(cssVariables.layout.sidebar).toEqual({
    width: '--neoverse-layout-sidebar-width',
    drawerWidth: '--neoverse-layout-sidebar-drawer-width',
  });
  expect(cssVariables.layout.headerMinHeight).toBe('--neoverse-layout-header-min-height');

  expect(layoutCss).toContain(
    '--neoverse-layout-page-max-width: var(--neoverse-layout-container-2xl);',
  );
  expect(layoutCss).toContain(
    '--neoverse-layout-content-max-width: var(--neoverse-layout-container-xl);',
  );
  expect(layoutCss).toContain(
    '--neoverse-layout-reading-width: var(--neoverse-layout-container-md);',
  );
  expect(layoutCss).toContain(
    '--neoverse-layout-reading-wide-width: var(--neoverse-layout-container-lg);',
  );
});

test('keeps layout breakpoints available as numeric adapter constants', () => {
  expect(layoutBreakpoints).toEqual({
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
  });
});

type ShadowLayer = [boolean, number, number, number, number];

const splitShadowLayers = (value: string): string[] => {
  const layers: string[] = [];
  let start = 0;
  let parentheses = 0;

  for (let index = 0; index < value.length; index += 1) {
    if (value[index] === '(') {
      parentheses += 1;
    } else if (value[index] === ')') {
      parentheses -= 1;
    } else if (value[index] === ',' && parentheses === 0) {
      layers.push(value.slice(start, index).trim());
      start = index + 1;
    }
  }

  layers.push(value.slice(start).trim());
  return layers;
};

const parseShadowLayers = (value: string): ShadowLayer[] =>
  splitShadowLayers(value).map((layer) => {
    const match =
      /^(inset\s+)?(-?[\d.]+(?:px|rem)?)\s+(-?[\d.]+(?:px|rem)?)\s+([\d.]+(?:px|rem)?)(?:\s+(-?[\d.]+(?:px|rem)?))?/.exec(
        layer,
      );

    if (match === null) {
      throw new Error(`Unable to parse shadow layer: ${layer}`);
    }

    const offsetX = match[2];
    const offsetY = match[3];
    const blur = match[4];
    const spread = match[5] ?? '0';

    if (offsetX === undefined || offsetY === undefined || blur === undefined) {
      throw new Error(`Incomplete shadow layer: ${layer}`);
    }

    const toPx = (token: string): number =>
      Number.parseFloat(token) * (token.endsWith('rem') ? 16 : 1);

    return [match[1] !== undefined, toPx(offsetX), toPx(offsetY), toPx(blur), toPx(spread)];
  });

const firstShadowLayer = (value: string): ShadowLayer => {
  const layer = parseShadowLayers(value)[0];

  if (layer === undefined) {
    throw new Error(`Missing shadow layer: ${value}`);
  }

  return layer;
};

const shadowDeclarations = (css: string, name: string): string[] =>
  [...css.matchAll(new RegExp(`--neoverse-shadow-${name}:\\s*([^;]+)`, 'g'))].flatMap((match) =>
    match[1] === undefined ? [] : [match[1].trim()],
  );

const normalizeCss = (css: string): string => css.replace(/\r\n?/g, '\n');

const readCssFile = async (file: URL): Promise<string> => normalizeCss(await Bun.file(file).text());

const readTokenCss = async (fileName: string): Promise<string> => {
  const localFile = Bun.file(new URL(`./${fileName}`, import.meta.url));

  if (await localFile.exists()) {
    return normalizeCss(await localFile.text());
  }

  return normalizeCss(await Bun.file(new URL(`../src/${fileName}`, import.meta.url)).text());
};

const readBuiltTokenCss = (): Promise<string> =>
  readCssFile(new URL('../dist/tokens.css', import.meta.url));

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const extractCssBlock = (css: string, selector: string): string => {
  const selectorPattern = selector.trim().split(/\s+/).map(escapeRegExp).join('\\s*');
  const selectorMatch = new RegExp(`${selectorPattern}\\s*\\{`).exec(css);
  const selectorIndex = selectorMatch?.index ?? -1;
  const openingBrace = selectorMatch === null ? -1 : css.indexOf('{', selectorIndex);

  if (selectorIndex < 0 || openingBrace < 0) {
    throw new Error(`Unable to find selector block: ${selector}`);
  }

  let depth = 0;
  for (let index = openingBrace; index < css.length; index += 1) {
    if (css[index] === '{') {
      depth += 1;
    } else if (css[index] === '}') {
      depth -= 1;
      if (depth === 0) {
        return css.slice(openingBrace + 1, index);
      }
    }
  }

  throw new Error(`Unclosed selector block: ${selector}`);
};

test('isolates light control refinements from the explicit dark theme', async () => {
  const lightSource = await readTokenCss('themes/light.css');
  const builtCss = await readBuiltTokenCss();
  const lightBody = extractCssBlock(
    builtCss,
    ":root:not([data-theme]),\n  :root[data-theme='light']",
  );
  const darkBody = extractCssBlock(builtCss, ":root[data-theme='dark']");

  expect(lightSource).not.toMatch(/:root|\[data-theme=|@media/);
  expect(builtCss).not.toContain('@neoverse-light-tokens');
  expect(lightBody).toContain('--neoverse-control-segmented-edge-display: block;');
  expect(lightBody).toContain('--neoverse-control-segmented-shell-hover-background-image: var(');
  expect(lightBody).toContain(
    '--neoverse-prose-inline-code-background: var(--neoverse-surface-inset-hover-background);',
  );
  expect(lightBody).toContain('--neoverse-prose-inline-code-shadow:');
  expect(darkBody).toContain('--neoverse-control-segmented-edge-display: none;');
  expect(darkBody).toContain('--neoverse-control-segmented-shell-hover-background-image: var(');
  expect(darkBody).not.toContain('--neoverse-prose-inline-code-background:');
});

test('renders one dark source into matching explicit and system wrappers', async () => {
  const darkSource = await readTokenCss('themes/dark.css');
  const declarations = [...darkSource.matchAll(/^\s*(--neoverse-[\w-]+):/gm)].map(
    (match) => match[1],
  );
  const builtCss = await readBuiltTokenCss();
  const systemBody = extractCssBlock(
    builtCss,
    ":root[data-theme='system'],\n    :root:not([data-theme])",
  );
  const explicitBody = extractCssBlock(builtCss, ":root[data-theme='dark']");

  expect(declarations.length).toBeGreaterThan(0);
  expect(new Set(declarations).size).toBe(declarations.length);
  expect(darkSource).not.toMatch(/:root|\[data-theme=|@media/);
  expect(builtCss).not.toContain('@neoverse-dark-tokens');
  expect(builtCss).not.toMatch(/:root\.(?:light|dark)/);
  expect(systemBody.replace(/\s+/g, ' ').trim()).toBe(explicitBody.replace(/\s+/g, ' ').trim());
});

test('keeps Glass transparency visible and ordered by depth', async () => {
  const materialCss = await readTokenCss('material.css');
  const transparency = ['subtle', 'elevated', 'immersive'].map((name) => {
    const value = materialCss.match(
      new RegExp(`--neoverse-material-transparency-${name}:\\s*(\\d+)%`),
    )?.[1];

    return Number(value);
  });

  expect(transparency).toEqual([30, 20, 12]);
});

test('keeps light Glass surfaces free of dark hairline borders', async () => {
  const [materialCss, themesCss] = await Promise.all([
    readTokenCss('material.css'),
    readTokenCss('themes/dark.css'),
  ]);
  const variants = ['subtle', 'elevated', 'immersive'];
  for (const variant of variants) {
    expect(materialCss).toContain(`--neoverse-material-glass-${variant}-border: transparent;`);
    expect(
      themesCss.match(
        new RegExp(
          variant === 'elevated' || variant === 'immersive'
            ? `--neoverse-material-glass-${variant}-border:\\s*color-mix\\(\\s*in srgb,\\s*var\\(--neoverse-color-border-subtle\\) ${variant === 'elevated' ? 72 : 70}%,\\s*transparent\\s*\\);`
            : `--neoverse-material-glass-${variant}-border:\\s*var\\(--neoverse-color-border-(?:subtle|default)\\);`,
          'g',
        ),
      ),
    ).toHaveLength(1);
  }
});

test('keeps light Glass hierarchy density-led with restrained control edges', async () => {
  const lightCss = await readTokenCss('themes/light.css');

  for (const [token, value] of [
    ['transparency-subtle', '24%'],
    ['transparency-elevated', '42%'],
    ['transparency-immersive', '18%'],
    ['edge-refraction-opacity-subtle', '0.16'],
    ['edge-refraction-opacity-elevated', '0.22'],
    ['edge-refraction-opacity-immersive', '0.14'],
  ] as const) {
    expect(lightCss).toContain(`--neoverse-material-${token}: ${value};`);
  }

  expect(lightCss).toContain('--neoverse-control-button-edge-refraction-opacity: 0.12;');
  expect(lightCss).toContain('var(--neoverse-color-border-default) 60%');
  const secondaryShadow =
    lightCss.match(/--neoverse-control-secondary-shadow:([\s\S]*?);/)?.[1] ?? '';
  expect(secondaryShadow.match(/inset/g)).toHaveLength(1);
  expect(secondaryShadow).not.toContain('var(--neoverse-color-border-interactive)');
});

test('keeps Glass edge highlights refractive and softly diffused', async () => {
  const [materialCss, buttonCss, geometryCss, themesCss] = await Promise.all([
    readTokenCss('material.css'),
    readTokenCss('components/button.css'),
    readTokenCss('geometry.css'),
    readTokenCss('themes/dark.css'),
  ]);

  for (const variant of ['subtle', 'elevated', 'immersive']) {
    const declaration = materialCss.match(
      new RegExp(`--neoverse-material-edge-highlight-${variant}:([\\s\\S]*?);`),
    )?.[1];

    expect(declaration).toContain('inset 0 1px 2px');
    expect(declaration).toContain('inset 0 -1px 2px');
    expect(declaration).toContain('inset 1px 0 2px');
    expect(declaration).toContain('inset -1px 0 2px');
    expect(declaration).toContain('var(--neoverse-color-accent-primary)');
    expect(declaration).toContain('var(--neoverse-color-accent-secondary)');
    expect(declaration).toContain('var(--neoverse-color-accent-tertiary)');

    const darkDeclarations = themesCss.match(
      new RegExp(`--neoverse-material-edge-highlight-${variant}:([\\s\\S]*?);`, 'g'),
    );

    expect(darkDeclarations).toHaveLength(1);
    for (const darkDeclaration of darkDeclarations ?? []) {
      if (variant === 'elevated') {
        expect(darkDeclaration).toContain('inset 0 1px 0');
        expect(darkDeclaration).toContain('inset 0 -1px 2px');
        expect(darkDeclaration).toContain('inset 1px 0 2px');
        expect(darkDeclaration).toContain('inset -1px 0 2px');
        expect(darkDeclaration).not.toMatch(
          /var\(--neoverse-color-accent-(?:primary|secondary|tertiary)\)/,
        );
      } else {
        expect(darkDeclaration).toContain('inset 0 1px 2px');
        expect(darkDeclaration).toContain('inset 0 -1px 2px');
        expect(darkDeclaration).toContain('inset 1px 0 2px');
        expect(darkDeclaration).toContain('inset -1px 0 2px');
        if (variant === 'subtle') {
          expect(darkDeclaration).not.toMatch(
            /var\(--neoverse-color-accent-(?:primary|secondary|tertiary)\)/,
          );
        } else {
          expect(darkDeclaration).toContain('var(--neoverse-color-accent-primary)');
          expect(darkDeclaration).toContain('var(--neoverse-color-accent-secondary)');
          expect(darkDeclaration).toContain('var(--neoverse-color-accent-tertiary)');
        }
      }
    }
  }

  expect(buttonCss).toMatch(
    /--neoverse-control-primary-shadow:\s*var\(\s*--neoverse-control-active-shadow\s*\);/,
  );
  expect(geometryCss).toMatch(
    /--neoverse-shadow-inset:\s*var\(--neoverse-material-edge-highlight-subtle\),/,
  );
  expect(materialCss).toMatch(
    /--neoverse-material-refraction-gradient-subtle:\s*radial-gradient\(/,
  );
  expect(materialCss).toMatch(
    /--neoverse-material-refraction-gradient-immersive:\s*radial-gradient\(/,
  );
  for (const token of [
    'filter',
    'edge-filter',
    'tint',
    'inner-glow',
    'seam-glow',
    'bloom',
    'edge-refraction-width',
    'edge-refraction-softness',
  ]) {
    expect(materialCss).toContain(`--neoverse-material-${token}-subtle:`);
    expect(materialCss).toContain(`--neoverse-material-${token}-elevated:`);
    expect(materialCss).toContain(`--neoverse-material-${token}-immersive:`);
  }
  expect(themesCss).toContain('--neoverse-material-filter-subtle: blur(10px)');
  expect(themesCss).toContain('--neoverse-material-edge-filter-subtle: blur(12px)');
  expect(themesCss).toMatch(/--neoverse-material-refraction-gradient-subtle:\s*radial-gradient\(/);
});

test('keeps dark shadows aligned with the light hierarchy', async () => {
  const [geometryCss, themesCss] = await Promise.all([
    readTokenCss('geometry.css'),
    readTokenCss('themes/dark.css'),
  ]);

  for (const name of ['xs', 'sm', 'md', 'lg', 'xl']) {
    const lightValue = shadowDeclarations(geometryCss, name)[0];
    const darkValues = shadowDeclarations(themesCss, name);

    expect(lightValue).toBeDefined();
    expect(darkValues).toHaveLength(1);

    if (lightValue === undefined) {
      continue;
    }

    const lightLayers = parseShadowLayers(lightValue);

    for (const darkValue of darkValues) {
      expect(parseShadowLayers(darkValue)).toEqual(lightLayers);
    }
  }
});

test('keeps inset material distinct between light and dark surfaces', async () => {
  const [geometryCss, materialCss, themesCss] = await Promise.all([
    readTokenCss('geometry.css'),
    readTokenCss('material.css'),
    readTokenCss('themes/dark.css'),
  ]);
  const lightValue = shadowDeclarations(geometryCss, 'inset')[0];
  const lightEdgeHighlight = materialCss.match(
    /--neoverse-material-edge-highlight-subtle:([\s\S]*?);/,
  )?.[1];
  const darkValues = shadowDeclarations(themesCss, 'inset');
  const darkEdgeHighlights = [
    ...themesCss.matchAll(/--neoverse-material-edge-highlight-subtle:([\s\S]*?);/g),
  ].flatMap((match) => (match[1] === undefined ? [] : [match[1]]));

  expect(lightValue).toBeDefined();
  expect(lightEdgeHighlight).toBeDefined();
  expect(darkValues).toHaveLength(1);
  expect(darkEdgeHighlights).toHaveLength(1);

  if (lightValue === undefined || lightEdgeHighlight === undefined) {
    return;
  }

  expect(
    parseShadowLayers(
      lightValue.replace('var(--neoverse-material-edge-highlight-subtle)', lightEdgeHighlight),
    ),
  ).toEqual([
    [true, 0, 1, 2, 0],
    [true, 0, -1, 2, 0],
    [true, 1, 0, 2, 0],
    [true, -1, 0, 2, 0],
    [true, 0, -1, 2, 0],
  ]);

  for (const [index, darkValue] of darkValues.entries()) {
    const darkEdgeHighlight = darkEdgeHighlights[index];

    expect(darkEdgeHighlight).toBeDefined();
    if (darkEdgeHighlight === undefined) {
      continue;
    }

    expect(
      parseShadowLayers(
        darkValue.replace('var(--neoverse-material-edge-highlight-subtle)', darkEdgeHighlight),
      ),
    ).toEqual([
      [true, 0, 1, 2, 0],
      [true, 0, -1, 2, 0],
      [true, 1, 0, 2, 0],
      [true, -1, 0, 2, 0],
      [true, 0, -1, 2, 0],
    ]);
  }
});

const shadowReach = ([, offsetX, offsetY, blur, spread]: ShadowLayer): number =>
  Math.abs(offsetX) + Math.abs(offsetY) + blur + spread;

test('keeps sm and md shadows visibly separated from xs', async () => {
  const [geometryCss, themesCss] = await Promise.all([
    readTokenCss('geometry.css'),
    readTokenCss('themes/dark.css'),
  ]);

  const lightValue = shadowDeclarations(geometryCss, 'xs')[0];
  const lightSmValue = shadowDeclarations(geometryCss, 'sm')[0];
  const lightMdValue = shadowDeclarations(geometryCss, 'md')[0];
  const darkValues = ['xs', 'sm', 'md'].map((name) => shadowDeclarations(themesCss, name));
  const shadowSets = [
    [lightValue, lightSmValue, lightMdValue],
    ...[0].map((index) => darkValues.map((values) => values[index])),
  ];

  for (const [xsValue, smValue, mdValue] of shadowSets) {
    expect(xsValue).toBeDefined();
    expect(smValue).toBeDefined();
    expect(mdValue).toBeDefined();

    if (xsValue === undefined || smValue === undefined || mdValue === undefined) {
      continue;
    }

    const smLayers = parseShadowLayers(smValue);
    const mdLayers = parseShadowLayers(mdValue);
    const xsLayer = firstShadowLayer(xsValue);
    const smLayer = firstShadowLayer(smValue);
    const mdLayer = firstShadowLayer(mdValue);
    const smGroundingLayer = smLayers[1];
    const mdGroundingLayer = mdLayers[1];

    expect(smGroundingLayer).toBeDefined();
    expect(mdGroundingLayer).toBeDefined();
    expect(shadowReach(smLayer)).toBeGreaterThan(shadowReach(xsLayer));
    expect(shadowReach(mdLayer)).toBeGreaterThan(shadowReach(smLayer));

    if (smGroundingLayer === undefined || mdGroundingLayer === undefined) {
      continue;
    }

    expect(shadowReach(smGroundingLayer)).toBeGreaterThan(shadowReach(xsLayer));
    expect(shadowReach(mdGroundingLayer)).toBeGreaterThan(shadowReach(smGroundingLayer));
  }
});
