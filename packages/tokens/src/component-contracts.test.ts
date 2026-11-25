import { expect, test } from 'bun:test';
import { readCssFile, readTokenCss } from './css-helpers.test-support.js';
import { cssVariables } from './index.js';

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
    '--neoverse-prose-quote-background: var(--neoverse-surface-inset-plane-background);',
  );
  expect(proseCss).toContain('--neoverse-surface-inset-edge-active');
  expect(proseCss).toContain('--neoverse-surface-inset-alternate-fill');
  expect(proseCss).toContain('--neoverse-prose-inline-code-shadow:');
  expect(proseCss).toContain('--neoverse-surface-inset-active-highlight');
});

test('keeps skeleton motion and effect isolation on shared contracts', async () => {
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
  expect(skeletonCss).not.toContain('box-shadow');
  expect(skeletonCss).not.toContain('.skeleton-surface::after');
  expect(skeletonCss).toContain('.ui-skeleton--shimmer::after');
  expect(skeletonCss).toContain('.skeleton-surface--shimmer::after');
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
});

test('resolves every shared control effect strength used by scrollbar states', async () => {
  const css = await readTokenCss('control-effects.css');
  const definitions = new Set(
    Array.from(css.matchAll(/(--neoverse-effect-strength-\d+)\s*:/g), (match) => match[1]),
  );
  const references = Array.from(
    css.matchAll(/var\((--neoverse-effect-strength-\d+)\)/g),
    (match) => match[1],
  );
  expect([...new Set(references.filter((name) => !definitions.has(name)))]).toEqual([]);
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

test('keeps grouped controls on a compact, shared geometry contract', async () => {
  const [sharedControlCss, controlSurfaceCss, navigationItemCss, segmentedControlCss, motionCss] =
    await Promise.all([
      readTokenCss('components/shared-control.css'),
      readTokenCss('components/control-surface.css'),
      readTokenCss('components/navigation-item.css'),
      readTokenCss('components/segmented-control.css'),
      readTokenCss('motion.css'),
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
    '--neoverse-control-surface-corner-radius: var(--neoverse-control-corner-radius);',
  );
  expect(controlSurfaceCss).toContain(
    '--neoverse-control-surface-inner-radius: var(--neoverse-control-compact-radius);',
  );
  expect(controlSurfaceCss).toMatch(
    /--neoverse-control-surface-trailing-radius:\s*var\(\s*--neoverse-control-corner-radius\s*\);/,
  );
  expect(controlSurfaceCss).toContain('--neoverse-control-surface-navigation-edge-inset: calc(');
  expect(controlSurfaceCss).toContain('--neoverse-control-surface-divider-height: 1rem;');
  expect(controlSurfaceCss).toContain(
    '--neoverse-control-surface-divider-gap: var(--neoverse-space-0);',
  );
  expect(controlSurfaceCss).toContain(
    '--neoverse-control-surface-indicator-duration: var(--neoverse-motion-state-duration);',
  );
  expect(controlSurfaceCss).toContain(
    '--neoverse-control-surface-indicator-easing: var(--neoverse-motion-state-easing);',
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

  for (const declaration of [
    '--neoverse-control-segmented-inset: 0.25rem;',
    '--neoverse-control-segmented-embedded-inset: var(--neoverse-space-0);',
    '--neoverse-control-segmented-option-min-width-compact: max-content;',
    '--neoverse-control-segmented-option-min-width: 2.5rem;',
    '--neoverse-control-segmented-embedded-option-min-width: var(--neoverse-space-8);',
    '--neoverse-control-segmented-option-height-sm: var(--neoverse-control-surface-control-height);',
    '--neoverse-control-segmented-option-padding-block-sm: 0.2rem;',
    '--neoverse-control-segmented-option-padding-inline-sm: var(--neoverse-space-3);',
    '--neoverse-control-segmented-embedded-option-padding-inline-sm: 0.5rem;',
    '--neoverse-control-segmented-corner-radius: var(--neoverse-radius-pill);',
    '--neoverse-control-segmented-option-radius: var(--neoverse-radius-pill);',
    '--neoverse-control-segmented-rounded-corner-radius: var(--neoverse-control-corner-radius);',
    '--neoverse-control-segmented-rounded-option-radius: var(--neoverse-control-compact-radius);',
    '--neoverse-control-segmented-slider-duration: var(--neoverse-motion-state-duration);',
    '--neoverse-control-segmented-slider-easing: var(--neoverse-motion-state-easing);',
    '--neoverse-control-segmented-active-shadow: var(--neoverse-effect-choice-selected-inset-shadow);',
  ]) {
    expect(segmentedControlCss).toContain(declaration);
  }
  const [lightCss, darkCss] = await Promise.all([
    readTokenCss('themes/light.css'),
    readTokenCss('themes/dark.css'),
  ]);
  expect(lightCss).not.toContain('--neoverse-control-segmented-active-shadow:');
  expect(darkCss).not.toContain('--neoverse-control-segmented-active-shadow:');
  expect(motionCss).toContain(
    '--neoverse-motion-easing-spring-soft: cubic-bezier(0.3, 1.16, 0.48, 1);',
  );
});
