import { expect, test } from 'bun:test';
import { readCssFile, readTokenCss } from './css-helpers.test-support.js';
import { cssVariables } from './index.js';

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
  expect(cssVariables.components.segmentedControl.activeFilter).toBe(
    '--neoverse-control-segmented-active-filter',
  );
  expect(cssVariables.components.segmentedControl.trackBleed).toBe(
    '--neoverse-control-segmented-track-bleed',
  );
  expect(cssVariables.components.tabs.selectedFilter).toBe('--neoverse-tabs-selected-filter');
  expect(cssVariables.components.tabs.selectedForeground).toBe(
    '--neoverse-tabs-selected-foreground',
  );
  expect(cssVariables.components.pagination.currentFilter).toBe(
    '--neoverse-pagination-current-filter',
  );
  expect(cssVariables.components.pagination.currentForeground).toBe(
    '--neoverse-pagination-current-foreground',
  );
  expect(cssVariables.effects.controls.selectedChoiceInsetShadow).toBe(
    '--neoverse-effect-choice-selected-inset-shadow',
  );
  expect(cssVariables.effects.controls.selectedChoiceFilter).toBe(
    '--neoverse-effect-choice-selected-filter',
  );
  expect(cssVariables.effects.controls.selectedChoiceOpaqueFill).toBe(
    '--neoverse-effect-choice-selected-fill-opaque',
  );
  expect(cssVariables.effects.controls.selectedChoiceForeground).toBe(
    '--neoverse-effect-choice-selected-foreground',
  );
  expect(cssVariables.effects.controls.selectedChoiceHoverField).toBe(
    '--neoverse-effect-choice-selected-hover-field',
  );
  expect(cssVariables.effects.controls.selectedChoiceHoverFill).toBe(
    '--neoverse-effect-choice-selected-hover-fill',
  );
  expect(cssVariables.effects.controls.selectedChoiceHoverWash).toBe(
    '--neoverse-effect-choice-selected-hover-wash',
  );
  expect(cssVariables.effects.controls.selectedChoicePressField).toBe(
    '--neoverse-effect-choice-selected-press-field',
  );
  expect(cssVariables.effects.controls.selectedChoicePressFill).toBe(
    '--neoverse-effect-choice-selected-press-fill',
  );
  expect(cssVariables.effects.controls.selectedChoicePressWash).toBe(
    '--neoverse-effect-choice-selected-press-wash',
  );
  expect(cssVariables.components.segmentedControl.activeHoverFill).toBe(
    '--neoverse-control-segmented-active-hover-fill',
  );
  expect(cssVariables.components.tabs.selectedHoverBackgroundColor).toBe(
    '--neoverse-tabs-selected-hover-background-color',
  );
  expect(cssVariables.components.pagination.currentHoverBackgroundColor).toBe(
    '--neoverse-pagination-current-hover-background-color',
  );
  expect(cssVariables.components.navigationItem.activeHoverFill).toBe(
    '--neoverse-navigation-item-active-hover-fill',
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
  expect(cssVariables.components.toast).toMatchObject({
    dismissSize: '--neoverse-toast-dismiss-size',
    dismissIconSize: '--neoverse-toast-dismiss-icon-size',
    dismissBackground: '--neoverse-toast-dismiss-background',
    dismissBorder: '--neoverse-toast-dismiss-border',
    dismissShadow: '--neoverse-toast-dismiss-shadow',
    dismissForeground: '--neoverse-toast-dismiss-foreground',
  });
  expect(cssVariables.components.tooltip.accentTint).toBe('--neoverse-tooltip-accent-tint');
  expect(cssVariables.components.drawer).toEqual({
    width: '--neoverse-drawer-width',
    inset: '--neoverse-drawer-inset',
  });
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
  expect(cssVariables.components.prose.headingWeight).toBe('--neoverse-prose-heading-weight');
  for (const level of ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const) {
    expect(cssVariables.components.prose.headingSize[level]).toBe(
      `--neoverse-prose-heading-${level}-size`,
    );
  }
  expect(cssVariables.components.prose.quoteBackground).toBe('--neoverse-prose-quote-background');
  expect(cssVariables.components.prose.inlineCodeFontFamily).toBe(
    '--neoverse-prose-inline-code-font-family',
  );
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
  expect(cssVariables.components.navigationItem.iconSizes).toEqual({
    sm: '--neoverse-navigation-item-icon-size-sm',
    md: '--neoverse-navigation-item-icon-size-md',
    lg: '--neoverse-navigation-item-icon-size-lg',
  });
  expect(cssVariables.components.navigationItem.filter).toBe('--neoverse-navigation-item-filter');
  expect(cssVariables.components.breadcrumb.currentForeground).toBe(
    '--neoverse-breadcrumb-current-foreground',
  );
  expect(cssVariables.components.breadcrumb.focusRadius).toBe('--neoverse-breadcrumb-focus-radius');
  // The hover plate is consumer-tunable: size, wash and growth live in tokens.
  expect(cssVariables.components.breadcrumb).toMatchObject({
    linkPlateInset: '--neoverse-breadcrumb-link-plate-inset',
    linkPlateInsetInline: '--neoverse-breadcrumb-link-plate-inset-inline',
    linkPlateBackground: '--neoverse-breadcrumb-link-plate-background',
    linkPlateRestScale: '--neoverse-breadcrumb-link-plate-rest-scale',
    clipMargin: '--neoverse-breadcrumb-clip-margin',
  });
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

test('keeps component token declarations in their owner recipes', async () => {
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
    ['components/drawer.css', '--neoverse-drawer-width'],
    ['components/drawer.css', '--neoverse-drawer-inset'],
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
    expect(source).not.toMatch(/\b\d+(?:\.\d+)?(?:ms|%)\b/);
    expect(source).not.toContain('color-mix(');
  }

  const [formTokens, overlayTokens, toastCss, controlFeedbackCss] = await Promise.all([
    readTokenCss('components/form-control.css'),
    readTokenCss('components/overlay.css'),
    readCssFile(new URL('../../tailwind/src/components/toast.css', import.meta.url)),
    readCssFile(new URL('../../tailwind/src/components/control-feedback.css', import.meta.url)),
  ]);
  expect(formTokens).toContain(
    '--neoverse-input-step-hover-background: var(--neoverse-control-ghost-hover-background);',
  );
  expect(formTokens).toContain(
    '--neoverse-input-step-active-background: var(--neoverse-control-ghost-active-background);',
  );
  expect(formTokens).toContain(
    '--neoverse-select-option-hover-background: var(--neoverse-control-ghost-hover-background);',
  );
  expect(overlayTokens).toContain(
    '--neoverse-overlay-item-hover-background: var(--neoverse-control-ghost-hover-background);',
  );
  expect(toastCss).toContain('background-color: var(--neoverse-quiet-control-feedback);');
  expect(toastCss).not.toContain('.ui-toast__dismiss:hover');
  expect(controlFeedbackCss).toContain('.ui-toast__dismiss');
});

test('keeps ControlSurface scale steps distinct from unscaled controls while preserving Dock scales', async () => {
  const [controlSurfaceTokens, controlSurfaceStyles] = await Promise.all([
    readTokenCss('components/control-surface.css'),
    readCssFile(new URL('../../tailwind/src/components/control-surface.css', import.meta.url)),
  ]);

  expect(controlSurfaceTokens).toContain('--neoverse-control-surface-scale-md: 1.08;');
  expect(controlSurfaceTokens).toContain('--neoverse-control-surface-scale-lg: 1.18;');
  expect(controlSurfaceTokens).toContain('--neoverse-dock-scale-md: 1.1;');
  expect(controlSurfaceTokens).toContain('--neoverse-dock-scale-lg: 1.3;');

  const largeRule = controlSurfaceStyles.match(
    /\.ui-control-surface--scale-lg\s*\{[\s\S]*?\}/,
  )?.[0];
  expect(largeRule).toBeDefined();
  expect(largeRule).toContain('var(--neoverse-font-size-xs)');
  expect(largeRule).toContain('var(--neoverse-icon-size-sm)');

  const genericNavEdgeRule = controlSurfaceStyles.match(
    /\.ui-control-surface:has\([^)]+\)\s*\{[\s\S]*?\}/,
  )?.[0];
  expect(genericNavEdgeRule).toContain(
    '--neoverse-control-surface-padding-inline: var(--neoverse-control-surface-padding-block);',
  );
  const dockNavEdgeRule = controlSurfaceStyles.match(/\.ui-dock:has\([^)]+\)\s*\{[\s\S]*?\}/)?.[0];
  expect(dockNavEdgeRule).toMatch(
    /--neoverse-control-surface-padding-inline:\s*var\(\s*--neoverse-control-surface-navigation-edge-inset\s*\);/,
  );
});
