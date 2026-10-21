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
  expect(cssVariables.components.terminal.prompt).toBe('--neoverse-terminal-prompt');
  expect(cssVariables.components.terminal.selection).toBe('--neoverse-terminal-selection');
  expect(cssVariables.components.terminal.segmentPathBackground).toBe(
    '--neoverse-terminal-segment-path-background',
  );
  expect(cssVariables.components.button.primary.background).toBe(
    '--neoverse-control-primary-background',
  );
  expect(cssVariables.components.button.ghost.border).toBe('--neoverse-control-ghost-border');
  expect(cssVariables.components.button.glassTint).toBe('--neoverse-control-button-glass-tint');
  expect(cssVariables.components.button.blurScale).toBe('--neoverse-control-button-blur-scale');
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
  expect(cssVariables.components.badge.backdropFilter).toBe('--neoverse-badge-backdrop-filter');
  expect(cssVariables.components.badge.info.background).toBe('--neoverse-badge-info-background');
  expect(cssVariables.components.badge.info.shadow).toBe('--neoverse-badge-info-shadow');
  for (const variant of ['info', 'success', 'warning', 'danger'] as const) {
    expect(cssVariables.components.badge[variant].foreground).toBe(
      `--neoverse-badge-${variant}-foreground`,
    );
  }
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
  expect(cssVariables.components.formControl.readonlyBackground).toBe(
    '--neoverse-form-control-readonly-background',
  );
  expect(cssVariables.components.formControl.validationError).toBe(
    '--neoverse-form-control-validation-error',
  );
  expect(cssVariables.components.formControl.choiceSize).toBe('--neoverse-choice-control-size');
  expect(cssVariables.components.formControl.switchInlineSize).toBe(
    '--neoverse-switch-inline-size',
  );
  expect(cssVariables.components.formControl.fieldGap).toBe('--neoverse-field-gap');
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
  expect(semanticCss).toContain(
    '--neoverse-skeleton-pulse-mid-opacity: var(--neoverse-effect-pulse-mid-opacity);',
  );

  const skeletonCss = await readCssFile(
    new URL('../../tailwind/src/components/skeleton.css', import.meta.url),
  );
  expect(skeletonCss).toContain('opacity: var(--neoverse-skeleton-pulse-mid-opacity);');
  expect(skeletonCss).not.toContain('opacity: 0.58;');
});

test('keeps skeletons visibly tinted and blurred with an opaque accessibility fallback', async () => {
  const [tokens, skeletonCss, darkTheme, effects] = await Promise.all([
    readTokenCss('components/skeleton.css'),
    readCssFile(new URL('../../tailwind/src/components/skeleton.css', import.meta.url)),
    readTokenCss('themes/dark.css'),
    readTokenCss('effects.css'),
  ]);

  expect(skeletonCss).toContain(
    '-webkit-backdrop-filter: var(--neoverse-skeleton-backdrop-filter);',
  );
  expect(skeletonCss).toContain('backdrop-filter: var(--neoverse-skeleton-backdrop-filter);');
  expect(tokens).toContain(
    '--neoverse-skeleton-backdrop-filter: var(--neoverse-material-glass-subtle-filter);',
  );
  expect(tokens).toContain('var(--neoverse-effect-loading-base)');
  expect(tokens).toContain('--neoverse-skeleton-fill: var(--neoverse-effect-highlight-color);');
  expect(effects).toContain('--neoverse-skeleton-fill: var(--neoverse-effect-highlight-color);');
  expect(effects).not.toContain(
    '--neoverse-skeleton-fill: var(--neoverse-material-glass-subtle-background);',
  );
  expect(darkTheme).not.toContain('--neoverse-skeleton-fill:');
  expect(tokens).toContain('(prefers-reduced-transparency: reduce)');
  expect(tokens).toContain('(forced-colors: active)');
  expect(tokens).toContain('--neoverse-skeleton-fill: var(--neoverse-skeleton-base-fill);');
  expect(tokens).toContain('--neoverse-skeleton-backdrop-filter: none;');
  expect(cssVariables.components.skeleton.backdropFilter).toBe(
    '--neoverse-skeleton-backdrop-filter',
  );
});

test('lets rectangular skeletons honor short custom heights without losing their default size', async () => {
  const skeletonCss = await readCssFile(
    new URL('../../tailwind/src/components/skeleton.css', import.meta.url),
  );
  const rectRule = skeletonCss.match(/\.ui-skeleton--rect\s*\{([^}]+)\}/)?.[1] ?? '';
  expect(rectRule).toContain('min-height: 0;');
  expect(rectRule).toContain('height: var(--neoverse-skeleton-text-min-height);');
});

test('reuses ancestor Glass blur instead of filtering every nested skeleton cell', async () => {
  const skeletonCss = await readCssFile(
    new URL('../../tailwind/src/components/skeleton.css', import.meta.url),
  );
  const nestedRule =
    skeletonCss.match(
      /:is\(\.material-glass-subtle,\s*\.material-glass-elevated,\s*\.material-glass-immersive\)\s+:is\(\.ui-skeleton,\s*\.skeleton-surface\)\s*\{([^}]+)\}/,
    )?.[1] ?? '';
  expect(nestedRule).toContain('-webkit-backdrop-filter: none;');
  expect(nestedRule).toContain('backdrop-filter: none;');
  expect(nestedRule).not.toMatch(/background:|opacity:/);
});

test('keeps immersive scrollbars on shared affordance roles', async () => {
  const css = await readTokenCss('components/scrollbar.css');
  expect(css).toContain('var(--neoverse-effect-rail-track)');
  expect(css).toContain('var(--neoverse-effect-rail-thumb)');
  expect(css).toContain('var(--neoverse-effect-rail-thumb-hover)');
  expect(css).toContain('var(--neoverse-effect-rail-thumb-active)');
  expect(css).not.toContain('color-mix(');
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
  const [sharedControlCss, controlSurfaceCss, navigationItemCss, segmentedControlCss] =
    await Promise.all([
      readTokenCss('components/shared-control.css'),
      readTokenCss('components/control-surface.css'),
      readTokenCss('components/navigation-item.css'),
      readTokenCss('components/segmented-control.css'),
    ]);

  expect(sharedControlCss).toContain('--neoverse-control-compact-height: var(--neoverse-space-8);');
  expect(sharedControlCss).toContain(
    '--neoverse-control-compact-radius: var(--neoverse-radius-control-inner);',
  );
  expect(sharedControlCss).toContain('--neoverse-control-compact-line-height: normal;');
  expect(controlSurfaceCss).toContain(
    '--neoverse-control-surface-group-height: var(--neoverse-space-9);',
  );
  expect(controlSurfaceCss).toContain(
    '--neoverse-control-surface-control-height: var(--neoverse-control-compact-height);',
  );
  expect(controlSurfaceCss).toContain(
    '--neoverse-control-surface-navigation-height: var(--neoverse-action-height-sm);',
  );
  expect(controlSurfaceCss).toContain(
    '--neoverse-control-surface-segmented-height: var(--neoverse-space-6);',
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
  expect(controlSurfaceCss).toContain('--neoverse-control-surface-trailing-padding');
  expect(navigationItemCss).toContain(
    '--neoverse-navigation-item-height-md: var(--neoverse-control-surface-control-height);',
  );
  expect(navigationItemCss).toContain(
    '--neoverse-navigation-item-padding-block-md: var(--neoverse-space-1);',
  );
  expect(navigationItemCss).toContain('--neoverse-navigation-item-gap: 0.375rem;');
  expect(navigationItemCss).toContain(
    '--neoverse-navigation-item-font-size-md: var(--neoverse-font-size-sm);',
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

  expect(segmentedControlCss).toContain('--neoverse-control-segmented-inset: 0.25rem;');
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
    '--neoverse-control-segmented-option-padding-inline-sm: var(--neoverse-space-2);',
  );
  expect(segmentedControlCss).toContain(
    '--neoverse-control-segmented-embedded-option-padding-inline-sm: 0.375rem;',
  );
  expect(segmentedControlCss).toContain(
    '--neoverse-control-segmented-option-radius: var(--neoverse-control-compact-radius);',
  );
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
  expect(cssVariables.material.scale.backdropBrightness).toBe(
    '--neoverse-material-backdrop-brightness',
  );
  expect(cssVariables.material.scale.backdropContrast).toBe(
    '--neoverse-material-backdrop-contrast',
  );
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
    'outlineRest',
    'outlineActive',
    'dangerHighlight',
    'warningHighlight',
    'successHighlight',
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
