import { rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const output = new URL('../dist/contract.css', import.meta.url);
const buttonSource = new URL('../src/components/button.css', import.meta.url);
const badgeSource = new URL('../src/components/badge.css', import.meta.url);
const navigationItemSource = new URL('../src/components/navigation-item.css', import.meta.url);
const tooltipSource = new URL('../src/components/tooltip.css', import.meta.url);
const componentsOutput = new URL('../dist/components.css', import.meta.url);
const proseOutput = new URL('../dist/prose.css', import.meta.url);
const vueClassesSource = new URL('../../vue/src/classes.ts', import.meta.url);
const vueSurfaceSource = new URL('../../vue/src/surface.ts', import.meta.url);
const reactSource = new URL('../../react/src/index.tsx', import.meta.url);

try {
  const [
    css,
    buttonCss,
    badgeCss,
    navigationItemCss,
    tooltipCss,
    flattenedComponentsCss,
    proseCss,
    vueClasses,
    vueSurface,
    reactAdapter,
  ] = await Promise.all([
    Bun.file(output).text(),
    Bun.file(buttonSource).text(),
    Bun.file(badgeSource).text(),
    Bun.file(navigationItemSource).text(),
    Bun.file(tooltipSource).text(),
    Bun.file(componentsOutput).text(),
    Bun.file(proseOutput).text(),
    Bun.file(vueClassesSource).text(),
    Bun.file(vueSurfaceSource).text(),
    Bun.file(reactSource).text(),
  ]);
  const adapterClassNames = new Set<string>();
  for (const source of [vueClasses, vueSurface, reactAdapter]) {
    for (const match of source.matchAll(
      /['"]((?:ui-|material-glass-)[a-z0-9_-]+(?:\s+(?:ui-|material-glass-)[a-z0-9_-]+)*)['"]/g,
    )) {
      for (const className of match[1]?.split(/\s+/) ?? []) {
        adapterClassNames.add(className);
      }
    }
  }
  const adapterCssClassNames = new Set(
    [...`${flattenedComponentsCss}\n${css}`.matchAll(/\.([a-zA-Z][a-zA-Z0-9_-]*)/g)].map(
      (match) => match[1],
    ),
  );
  const missingAdapterSelectors = [...adapterClassNames]
    .filter((className) => !adapterCssClassNames.has(className))
    .sort();
  const componentSourceDirectory = fileURLToPath(new URL('../src/components/', import.meta.url));
  const componentSourceFiles = [
    ...new Bun.Glob('*.css').scanSync({ cwd: componentSourceDirectory }),
  ];
  const componentSources = await Promise.all(
    componentSourceFiles.map(async (file) => ({
      file,
      css: await Bun.file(`${componentSourceDirectory}/${file}`).text(),
    })),
  );
  const malformedComponentSelectors = componentSources.flatMap(({ file, css: sourceCss }) => {
    const classNames = [...sourceCss.matchAll(/\.([a-zA-Z][a-zA-Z0-9_-]*)/g)].map(
      (match) => match[1] ?? '',
    );
    return classNames
      .filter((className) => {
        const modifiers = className.split('--');
        const elements = className.split('__');
        const repeatedModifier =
          modifiers.length >= 3 && modifiers.at(-1) !== '' && modifiers.at(-1) === modifiers.at(-2);
        const repeatedElement =
          elements.length >= 3 && elements.at(-1) !== '' && elements.at(-1) === elements.at(-2);
        return repeatedModifier || repeatedElement;
      })
      .map((className) => `${file}:.${className}`);
  });
  const hardcodedGeometryLiterals = componentSources.flatMap(({ file, css: sourceCss }) => {
    const withoutComments = sourceCss.replace(/\/\*[\s\S]*?\*\//g, '');
    return [...withoutComments.matchAll(/\b\d+(?:\.\d+)?(?:rem|px)\b/g)].map(
      (match) => `${file}:${match[0]}`,
    );
  });
  const expectedSelectors = [
    '.bg-surface-canvas',
    '.bg-surface-subtle',
    '.bg-surface-raised',
    '.bg-surface-glass',
    '.bg-surface-overlay',
    '.text-primary',
    '.text-secondary',
    '.text-muted',
    '.text-disabled',
    '.text-inverse',
    '.text-on-accent',
    '.bg-accent-primary',
    '.bg-accent-secondary',
    '.bg-accent-tertiary',
    '.bg-accent-soft',
    '.bg-action-primary',
    '.bg-action-primary-hover',
    '.bg-action-primary-active',
    '.bg-action-secondary',
    '.hover\\:bg-action-secondary-hover',
    '.active\\:bg-action-secondary-active',
    '.bg-action-disabled',
    '.text-action-primary-foreground',
    '.text-action-secondary-foreground',
    '.text-action-disabled-foreground',
    '.border-subtle',
    '.border-default',
    '.border-strong',
    '.border-interactive',
    '.bg-status-info',
    '.bg-status-success',
    '.bg-status-warning',
    '.bg-status-danger',
    '.text-status-info-foreground',
    '.text-status-success-foreground',
    '.text-status-warning-foreground',
    '.text-status-danger-foreground',
    '.text-display',
    '.text-heading',
    '.text-subtitle',
    '.text-body',
    '.text-label',
    '.text-caption',
    '.text-code',
    '.text-display-lg',
    '.text-display-md',
    '.text-title-lg',
    '.text-title-md',
    '.text-title-sm',
    '.text-body-lg',
    '.text-body-md',
    '.text-body-sm',
    '.text-label-lg',
    '.text-label-md',
    '.text-label-sm',
    '.font-display',
    '.font-title',
    '.font-heading',
    '.font-body',
    '.leading-display',
    '.leading-body',
    '.leading-display-lg',
    '.leading-display-md',
    '.leading-title-lg',
    '.leading-title-md',
    '.leading-title-sm',
    '.leading-body-lg',
    '.leading-body-md',
    '.leading-body-sm',
    '.leading-label-lg',
    '.leading-label-md',
    '.leading-label-sm',
    '.tracking-display',
    '.tracking-body',
    '.tracking-display-lg',
    '.tracking-display-md',
    '.tracking-title-lg',
    '.tracking-title-md',
    '.tracking-title-sm',
    '.tracking-body-lg',
    '.tracking-body-md',
    '.tracking-body-sm',
    '.tracking-label-lg',
    '.tracking-label-md',
    '.tracking-label-sm',
    '.p-4',
    '.px-gutter-inline',
    '.py-gutter-block',
    '.px-page-inline',
    '.py-page-block',
    '.pb-page-block',
    '.w-sidebar',
    '.w-sidebar-drawer',
    '.min-h-header',
    '.gap-grid',
    '.rounded-control',
    '.rounded-card',
    '.rounded-panel',
    '.rounded-pill',
    '.shadow-control',
    '.shadow-raised',
    '.shadow-card',
    '.shadow-overlay',
    '.shadow-modal',
    '.shadow-inset',
    '.max-w-container-sm',
    '.max-w-container-md',
    '.max-w-container-lg',
    '.max-w-container-xl',
    '.max-w-container-2xl',
    '.max-w-page',
    '.max-w-content',
    '.max-w-reading',
    '.max-w-reading-wide',
    '.z-layer-base',
    '.z-layer-raised',
    '.z-layer-sticky',
    '.z-layer-overlay',
    '.z-layer-modal',
    '.z-layer-toast',
    '.focus-visible\\:outline-none',
    '.focus-visible\\:ring-2',
    '.focus-visible\\:ring-focus',
    '.focus-visible\\:ring-offset-2',
    '.hover\\:bg-action-primary-hover',
    '.ui-button--primary',
    '.ui-button--secondary',
    '.ui-button--ghost',
    '.ui-icon-button--sm',
    '.ui-icon-button--md',
    '.ui-icon-button--lg',
    '.ui-icon-button--stretch',
    '.ui-icon-button__content',
    '.ui-action',
    '.ui-navigation-item',
    '.ui-breadcrumb',
    '.ui-control-surface',
    '.ui-dock',
    '.ui-status-indicator',
    '.ui-badge',
    '.self-stretch',
    '.w-7',
    '.ui-badge--info',
    '.scrollbar-immersive',
    '.ui-scrollbar',
    '.ui-scrollbar__thumb',
    '.ui-scrollbar-target',
    '.ui-table',
    '.ui-table-region',
    '.ui-disclosure',
    '.ui-disclosure__summary',
    '.ui-input',
    '.ui-textarea',
    '.ui-select',
    '.material-glass-subtle',
    '.material-glass-elevated',
    '.material-glass-immersive',
    '.ui-segmented-control',
    '.ui-segmented-control__slider',
    '.ui-skeleton',
    '.skeleton-surface',
    '.duration-fast',
    '.duration-standard',
    '.duration-expressive',
    '.ease-linear',
    '.ease-standard',
    '.ease-emphasized',
    '.neoverse-prose',
  ];
  const missingSelectors = expectedSelectors.filter((selector) => !css.includes(selector));
  const forbiddenSelectors = [
    '.bg-background',
    '.text-foreground',
    '.border-border',
    '.shadow-sm',
    '.material-glass-card',
    '.ui-icon-button--sm--sm',
    '.ui-icon-button--md--md',
    '.ui-icon-button--lg--lg',
    '.ui-icon-button--stretch--stretch',
    '.ui-icon-button__content__content',
  ];
  const emittedForbiddenSelectors = forbiddenSelectors.filter((selector) => css.includes(selector));
  const expectedValues = [
    '--neoverse-color-surface-canvas',
    '--neoverse-color-text-primary',
    '--neoverse-breadcrumb-current-foreground',
    '--neoverse-color-edge-light',
    '--neoverse-color-transparent',
    '--neoverse-border-width-none',
    '--neoverse-shadow-card',
    '--neoverse-shadow-none',
    '--neoverse-radius-control',
    '--neoverse-layout-container-lg',
    '--neoverse-layout-layer-modal',
    '--neoverse-material-blur-md',
    '--neoverse-material-saturation-immersive',
    '--neoverse-material-filter-elevated',
    '--neoverse-material-edge-filter-immersive',
    '--neoverse-material-edge-refraction-carrier-subtle',
    '--neoverse-material-tint-subtle',
    '--neoverse-material-inner-glow-elevated',
    '--neoverse-material-seam-glow-immersive',
    '--neoverse-material-bloom-immersive',
    '--neoverse-material-edge-highlight-elevated',
    '--neoverse-material-refraction-gradient-immersive',
    '--neoverse-material-glass-subtle-background',
    '--neoverse-material-glass-immersive-background',
    '--neoverse-material-transparency-subtle:30%',
    '--neoverse-material-transparency-elevated:20%',
    '--neoverse-material-transparency-immersive:12%',
    '--neoverse-material-glass-elevated-background:var(--neoverse-color-surface-glass)',
    '--neoverse-motion-duration-fast',
    '--neoverse-motion-duration-standard',
    '--neoverse-motion-duration-expressive',
    '--neoverse-motion-easing-standard',
    '--neoverse-motion-easing-emphasized',
    '--neoverse-motion-feedback-duration',
    '--neoverse-motion-feedback-easing',
    '--neoverse-motion-state-duration',
    '--neoverse-motion-state-easing',
    '--neoverse-motion-spatial-duration',
    '--neoverse-motion-spatial-easing',
    '--neoverse-motion-duration-fast:1ms',
    '--neoverse-motion-spatial-distance:0px',
    '--neoverse-control-active-background',
    '--neoverse-control-active-highlight',
    '--neoverse-control-active-shadow',
    '--neoverse-control-primary-background',
    '--neoverse-control-primary-foreground',
    '--neoverse-control-primary-hover-shadow',
    '--neoverse-control-button-border',
    '--neoverse-control-button-edge',
    '--neoverse-control-button-edge-active',
    '--neoverse-control-button-edge-carrier',
    '--neoverse-control-button-filter',
    '--neoverse-control-button-refraction-gradient',
    '--neoverse-control-button-press-glow',
    '--neoverse-control-button-hover-background',
    '--neoverse-control-button-active-background',
    '--neoverse-control-button-ghost-active-background',
    '--neoverse-control-secondary-background',
    '--neoverse-control-secondary-border',
    '--neoverse-control-secondary-foreground',
    '--neoverse-control-secondary-hover-foreground',
    '--neoverse-control-secondary-active-foreground',
    '--neoverse-control-ghost-foreground',
    '--neoverse-control-ghost-hover-foreground',
    '--neoverse-control-ghost-active-foreground',
    '--neoverse-control-ghost-background',
    '--neoverse-control-secondary-filter',
    '--neoverse-control-button-disabled-opacity',
    '--neoverse-control-button-hover-glow-opacity',
    '--neoverse-control-segmented-background-image',
    '--neoverse-control-segmented-background-color',
    '--neoverse-control-segmented-foreground',
    '--neoverse-control-segmented-active-foreground',
    '--neoverse-control-segmented-active-background',
    '--neoverse-control-segmented-active-fill',
    '--neoverse-control-segmented-active-border',
    '--neoverse-control-segmented-active-shadow',
    '--neoverse-control-segmented-inset',
    '--neoverse-control-segmented-embedded-inset',
    '--neoverse-control-segmented-gap',
    '--neoverse-control-segmented-option-radius',
    '--neoverse-control-segmented-option-press-scale',
    '--neoverse-control-segmented-disabled-opacity',
    '--neoverse-control-segmented-border',
    '--neoverse-control-segmented-shadow',
    '--neoverse-control-segmented-filter',
    '--neoverse-control-active-border',
    '--neoverse-badge-background',
    '--neoverse-badge-foreground',
    '--neoverse-badge-shadow',
    '--neoverse-badge-info-background',
    '--neoverse-badge-info-shadow',
    '--neoverse-badge-success-background',
    '--neoverse-badge-success-shadow',
    '--neoverse-badge-warning-background',
    '--neoverse-badge-warning-shadow',
    '--neoverse-badge-danger-background',
    '--neoverse-badge-danger-shadow',
    '--neoverse-notice-neutral-background',
    '--neoverse-notice-neutral-shadow',
    '--neoverse-notice-info-background',
    '--neoverse-notice-info-shadow',
    '--neoverse-notice-success-background',
    '--neoverse-notice-warning-background',
    '--neoverse-notice-danger-background',
    '--neoverse-tooltip-radius',
    '--neoverse-tooltip-arrow-background',
    '--neoverse-tooltip-accent-tint',
    '--neoverse-scrollbar-immersive-size',
    '--neoverse-scrollbar-overlay-thumb-width',
    '--neoverse-scrollbar-immersive-track',
    '--neoverse-scrollbar-immersive-thumb',
    '--neoverse-scrollbar-immersive-thumb-hover',
    '--neoverse-scrollbar-immersive-thumb-active',
    '--neoverse-scrollbar-immersive-thumb-background',
    '--neoverse-scrollbar-immersive-thumb-hover-background',
    '--neoverse-scrollbar-immersive-thumb-active-background',
    '--neoverse-scrollbar-immersive-thumb-edge',
    '--neoverse-scrollbar-immersive-thumb-glow',
    '--neoverse-skeleton-fill',
    '--neoverse-skeleton-text-min-height',
    '--neoverse-skeleton-title-min-height',
    '--neoverse-skeleton-pulse-mid-opacity',
    '--neoverse-action-height-md',
    '--neoverse-action-icon-size-md',
    '--neoverse-navigation-item-active-background',
    '--neoverse-navigation-item-active-border',
    '--neoverse-navigation-item-padding-block-md',
    '--neoverse-navigation-item-indicator-color',
    '--neoverse-control-surface-padding',
    '--neoverse-control-surface-item-gap',
    '--neoverse-control-surface-divider-gap',
    '--neoverse-control-surface-indicator-duration',
    '--neoverse-control-surface-indicator-easing',
    '--neoverse-status-indicator-dot-size-sm',
    '--neoverse-status-indicator-pulse-scale',
    '--neoverse-status-indicator-neutral-glow',
    '--neoverse-status-indicator-info-glow',
    '--neoverse-status-indicator-success-glow',
    '--neoverse-status-indicator-success-pulse-background',
    '--neoverse-status-indicator-success-pulse-shadow',
    '--neoverse-surface-interactive-active-scale',
  ];
  const missingValues = expectedValues.filter((value) => !css.includes(value));
  const expectedFragments = [
    'background-color:color-mix(in srgb',
    'background-image:var(--neoverse-material-refraction-gradient)',
    'backdrop-filter:var(--neoverse-material-filter)',
    'backdrop-filter:var(--neoverse-material-edge-filter)',
    'filter:var(--neoverse-material-edge-refraction-softness)',
    'opacity:var(--neoverse-material-edge-refraction-opacity)',
    'data-neoverse-glass-renderer=webgl',
    '[data-neoverse-glass-renderer=webgl]',
    'data-neoverse-glass-edge-pass=css',
    'data-neoverse-surface-hover=static',
    '[data-neoverse-glass-renderer=webgl] :is(.material-glass-subtle,.material-glass-elevated,.material-glass-immersive):not(:focus-visible){box-shadow:var(--neoverse-material-shadow)',
    '[data-neoverse-glass-renderer=webgl] :is(.material-glass-subtle,.material-glass-elevated,.material-glass-immersive):not(:focus-visible){box-shadow:var(--neoverse-material-shadow);-webkit-backdrop-filter:var(--neoverse-material-filter);backdrop-filter:var(--neoverse-material-filter);background-clip:padding-box',
    'var(--neoverse-material-inner-glow)',
    'var(--neoverse-material-seam-glow)',
    'var(--neoverse-material-bloom)',
    'box-shadow:var(--neoverse-material-bloom), var(--neoverse-material-shadow)',
    '@media (prefers-reduced-motion:reduce)',
    '-webkit-backdrop-filter:var(--neoverse-material-filter)',
    '@media (prefers-reduced-transparency:reduce)',
    'background-color:var(--neoverse-material-background-fallback)',
    ':is(.material-glass-subtle,.material-glass-elevated,.material-glass-immersive) :is(.material-glass-subtle,.material-glass-elevated,.material-glass-immersive):not(.ui-button):not(.ui-segmented-control)[data-neoverse-glass-nesting=inherit]{background-color:var(--neoverse-color-transparent)',
    'border:var(--neoverse-border-width-none) var(--neoverse-border-style-solid) var(--neoverse-color-transparent)',
    'box-shadow:var(--neoverse-shadow-none)',
    '-webkit-backdrop-filter:none',
    'backdrop-filter:none',
    'background-image:none',
    '[data-neoverse-surface-overflow=visible]{overflow:visible}',
    'transition-duration:var(--tw-duration)',
    'transition-timing-function:var(--tw-ease)',
    '@keyframes ui-skeleton-shimmer',
    'transform:translateX(calc(var(--segment-index)',
    'box-shadow:var(--neoverse-control-segmented-active-shadow)',
    'background-image:var(--neoverse-control-segmented-background-image)',
    'background-color:var(--neoverse-control-segmented-background-color)',
    'color:var(--neoverse-control-segmented-foreground)',
    'color:var(--neoverse-control-segmented-active-foreground)',
    'border:var(--neoverse-border-width-thin) var(--neoverse-border-style-solid) var(--neoverse-control-segmented-border)',
    'border:var(--neoverse-border-width-thin) var(--neoverse-border-style-solid) var(--neoverse-control-segmented-active-border)',
    'backdrop-filter:var(--neoverse-control-segmented-filter)',
    'scrollbar-color:var(--neoverse-scrollbar-immersive-thumb) var(--neoverse-scrollbar-immersive-track)',
    'scrollbar-width:thin',
    '::-webkit-scrollbar',
    'background-clip:padding-box',
    '@media (forced-colors:active)',
    '.ui-button{',
    '.ui-button.material-glass-subtle{',
    '.ui-button--primary{',
    '.ui-button--secondary{',
    '.ui-button--ghost.material-glass-subtle{',
    'background-image:var(--neoverse-control-primary-background)',
    'background-color:var(--neoverse-control-secondary-fill)',
    'background-image:var(--neoverse-control-secondary-background)',
    'background:var(--neoverse-badge-background)',
    'box-shadow:var(--neoverse-badge-shadow)',
    'color:var(--neoverse-badge-foreground)',
    'border:0',
    'backdrop-filter:var(--neoverse-control-button-filter)',
  ];
  const missingFragments = expectedFragments.filter((fragment) => !css.includes(fragment));
  const forbiddenNestedGlassFragments = [
    /* Never restore implicit nested flattening: independent Glass components
       must retain their resting material when placed inside Glass layouts. */
    ':not([data-neoverse-glass-nesting=local])',
    ':is(.material-glass-subtle,.material-glass-elevated,.material-glass-immersive) :is(.material-glass-subtle,.material-glass-elevated,.material-glass-immersive):not(.ui-button):not(.ui-segmented-control)[data-neoverse-glass-nesting=inherit]{background-color:var(--neoverse-color-surface-raised)',
  ];
  const emittedForbiddenNestedGlassFragments = forbiddenNestedGlassFragments.filter((fragment) =>
    css.includes(fragment),
  );
  const forbiddenWebglFragments = [
    '[data-neoverse-glass-renderer=webgl] :is(.material-glass-subtle,.material-glass-elevated,.material-glass-immersive){box-shadow:var(--neoverse-shadow-none)',
    '[data-neoverse-glass-renderer=webgl] :is(.material-glass-subtle,.material-glass-elevated,.material-glass-immersive){box-shadow:var(--neoverse-material-shadow);-webkit-backdrop-filter:none',
  ];
  const emittedForbiddenWebglFragments = forbiddenWebglFragments.filter((fragment) =>
    css.includes(fragment),
  );
  const expectedButtonFragments = [
    '.ui-icon-button--sm {',
    'width: var(--neoverse-space-7);',
    '.ui-icon-button--md {',
    'width: var(--neoverse-space-8);',
    '.ui-icon-button--lg {',
    'width: var(--neoverse-space-9);',
    '.ui-icon-button--stretch {',
    '.ui-icon-button__content {',
    '--neoverse-material-shadow: var(--neoverse-control-button-edge);',
    '--neoverse-material-edge-refraction-carrier: var(--neoverse-control-button-edge-carrier);',
    'border: var(--neoverse-border-width-thin) var(--neoverse-border-style-solid)',
    'var(--neoverse-control-button-border);',
    'background-clip: padding-box;',
    'overflow: hidden;',
    '--neoverse-material-edge-highlight: 0 0 0 0 transparent;',
    '.ui-button.material-glass-subtle:hover:not(:disabled)::after',
    '.ui-button--primary.material-glass-subtle {',
    '--neoverse-material-shadow: var(--neoverse-control-primary-shadow);',
    '--neoverse-material-shadow: var(--neoverse-control-primary-hover-shadow);',
    'background: var(--neoverse-control-ghost-background);',
    'border-color: var(--neoverse-control-ghost-border);',
    '--neoverse-material-edge-refraction-opacity: var(',
    '.ui-button > .ui-button__edge-field',
    'position: absolute;',
  ];
  const missingButtonFragments = expectedButtonFragments.filter(
    (fragment) => !buttonCss.includes(fragment),
  );
  const expectedBadgeFragments = [
    '--neoverse-badge-background',
    '--neoverse-badge-foreground',
    '--neoverse-badge-shadow',
    '--neoverse-badge-info-background',
    '--neoverse-badge-info-shadow',
    '--neoverse-badge-success-background',
    '--neoverse-badge-success-shadow',
    '--neoverse-badge-warning-background',
    '--neoverse-badge-warning-shadow',
    '--neoverse-badge-danger-background',
    '--neoverse-badge-danger-shadow',
    'border: 0;',
    'color: var(--neoverse-color-status-info);',
  ];
  const missingBadgeFragments = expectedBadgeFragments.filter(
    (fragment) => !badgeCss.includes(fragment),
  );
  const ghostActiveCss =
    buttonCss.match(
      /\.ui-button--ghost:active:not\(:disabled\):not\(\[aria-disabled='true'\]\) \{([\s\S]*?)\n {2}\}/,
    )?.[1] ?? '';
  const expectedGhostActiveFragments = [
    'background: var(--neoverse-control-ghost-active-background);',
    'transform: none;',
  ];
  const missingGhostActiveFragments = expectedGhostActiveFragments.filter(
    (fragment) => !ghostActiveCss.includes(fragment),
  );
  const forbiddenButtonFragments = [
    'inset: 1px;',
    'var(--neoverse-control-secondary-shadow)',
    'var(--neoverse-control-secondary-hover-shadow)',
    'var(--neoverse-control-active-shadow)',
    'var(--neoverse-control-segmented-active-foreground)',
  ];
  const emittedForbiddenButtonFragments = forbiddenButtonFragments.filter((fragment) =>
    buttonCss.includes(fragment),
  );
  const expectedProseFragments = [
    '.neoverse-prose :where(a, code, dd)',
    '.neoverse-prose :where(ul, ol) :where(ul, ol)',
    '.neoverse-prose dt',
    '.neoverse-prose dd',
    ':where(.ui-table, .neoverse-prose table)',
    ':where(.ui-table__caption, .neoverse-prose caption)',
    ':where(.ui-table--striped, .neoverse-prose table) tbody tr:nth-child(even) td',
    ':where(.ui-table--hoverable, .neoverse-prose table) tbody tr:hover td',
    ':where(.ui-disclosure, .neoverse-prose details)',
    ':where(.ui-disclosure__summary, .neoverse-prose summary)::-webkit-details-marker',
    ':where(.ui-disclosure__summary, .neoverse-prose summary)::after',
    ':where(.ui-disclosure__summary, .neoverse-prose summary):focus-visible',
    '.neoverse-prose abbr[title]',
  ];
  const missingProseFragments = expectedProseFragments.filter(
    (fragment) => !proseCss.includes(fragment),
  );
  const expectedNavigationMotionFragments = [
    'opacity var(--neoverse-motion-spatial-duration) var(--neoverse-motion-spatial-easing)',
    'transform var(--neoverse-motion-spatial-duration) var(--neoverse-motion-spatial-easing)',
  ];
  const missingNavigationMotionFragments = expectedNavigationMotionFragments.filter(
    (fragment) => !navigationItemCss.includes(fragment),
  );
  const expectedTooltipFragments = [
    '.ui-tooltip-surface.material-glass-subtle[data-neoverse-tooltip-surface]',
    '--neoverse-material-border: transparent;',
    '--neoverse-material-hover-border: transparent;',
    'backdrop-filter: var(--neoverse-material-glass-subtle-filter);',
  ];
  const missingTooltipFragments = expectedTooltipFragments.filter(
    (fragment) => !tooltipCss.includes(fragment),
  );

  if (
    missingSelectors.length > 0 ||
    emittedForbiddenSelectors.length > 0 ||
    missingValues.length > 0 ||
    missingFragments.length > 0 ||
    emittedForbiddenNestedGlassFragments.length > 0 ||
    emittedForbiddenWebglFragments.length > 0 ||
    missingButtonFragments.length > 0 ||
    missingGhostActiveFragments.length > 0 ||
    emittedForbiddenButtonFragments.length > 0 ||
    missingBadgeFragments.length > 0 ||
    missingProseFragments.length > 0 ||
    missingNavigationMotionFragments.length > 0 ||
    missingTooltipFragments.length > 0 ||
    missingAdapterSelectors.length > 0 ||
    malformedComponentSelectors.length > 0 ||
    hardcodedGeometryLiterals.length > 0 ||
    flattenedComponentsCss.includes('@import') ||
    !proseCss.includes('.neoverse-prose') ||
    proseCss.includes('@import')
  ) {
    const details = [
      missingSelectors.length > 0 ? `Missing selectors: ${missingSelectors.join(', ')}` : '',
      emittedForbiddenSelectors.length > 0
        ? `Forbidden selectors emitted: ${emittedForbiddenSelectors.join(', ')}`
        : '',
      missingValues.length > 0 ? `Missing token references: ${missingValues.join(', ')}` : '',
      missingFragments.length > 0 ? `Missing CSS fragments: ${missingFragments.join(', ')}` : '',
      emittedForbiddenNestedGlassFragments.length > 0
        ? `Forbidden nested Glass material fragments: ${emittedForbiddenNestedGlassFragments.join(', ')}`
        : '',
      emittedForbiddenWebglFragments.length > 0
        ? `Forbidden WebGL material fragments: ${emittedForbiddenWebglFragments.join(', ')}`
        : '',
      missingButtonFragments.length > 0
        ? `Missing button edge fragments: ${missingButtonFragments.join(', ')}`
        : '',
      missingGhostActiveFragments.length > 0
        ? `Missing Ghost active fragments: ${missingGhostActiveFragments.join(', ')}`
        : '',
      emittedForbiddenButtonFragments.length > 0
        ? `Forbidden button edge fragments: ${emittedForbiddenButtonFragments.join(', ')}`
        : '',
      missingBadgeFragments.length > 0
        ? `Missing badge token fragments: ${missingBadgeFragments.join(', ')}`
        : '',
      missingProseFragments.length > 0
        ? `Missing prose semantic fragments: ${missingProseFragments.join(', ')}`
        : '',
      missingNavigationMotionFragments.length > 0
        ? `Missing navigation motion fragments: ${missingNavigationMotionFragments.join(', ')}`
        : '',
      missingTooltipFragments.length > 0
        ? `Missing tooltip Glass fragments: ${missingTooltipFragments.join(', ')}`
        : '',
      missingAdapterSelectors.length > 0
        ? `Adapter classes without component CSS selectors: ${missingAdapterSelectors.join(', ')}`
        : '',
      malformedComponentSelectors.length > 0
        ? `Malformed duplicated component selectors: ${malformedComponentSelectors.join(', ')}`
        : '',
      hardcodedGeometryLiterals.length > 0
        ? `Hard-coded rem/px geometry in component CSS: ${hardcodedGeometryLiterals.join(', ')}`
        : '',
      flattenedComponentsCss.includes('@import')
        ? 'Compiled component CSS still contains source imports'
        : '',
      !proseCss.includes('.neoverse-prose')
        ? 'Public prose CSS entry is missing .neoverse-prose'
        : '',
      proseCss.includes('@import') ? 'Public prose CSS entry still contains source imports' : '',
    ].filter(Boolean);
    throw new Error(['Tailwind semantic contract failed:', ...details].join('\n'));
  }

  console.log(`Tailwind semantic contract passed with ${expectedSelectors.length} selectors.`);
} finally {
  await rm(output, { force: true });
}
