import { rm } from 'node:fs/promises';

const output = new URL('../dist/contract.css', import.meta.url);
const buttonSource = new URL('../src/components/button.css', import.meta.url);
const badgeSource = new URL('../src/components/badge.css', import.meta.url);
const componentsOutput = new URL('../dist/components.css', import.meta.url);

try {
  const [css, buttonCss, badgeCss, flattenedComponentsCss] = await Promise.all([
    Bun.file(output).text(),
    Bun.file(buttonSource).text(),
    Bun.file(badgeSource).text(),
    Bun.file(componentsOutput).text(),
  ]);
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
    '.font-display',
    '.font-heading',
    '.font-body',
    '.leading-display',
    '.leading-body',
    '.tracking-display',
    '.tracking-body',
    '.p-4',
    '.px-gutter-inline',
    '.py-gutter-block',
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
    '.ui-badge',
    '.ui-badge--info',
    '.scrollbar-immersive',
    '.material-glass-subtle',
    '.material-glass-elevated',
    '.material-glass-immersive',
    '.glass-card',
    '.glass-surface',
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
  ];
  const missingSelectors = expectedSelectors.filter((selector) => !css.includes(selector));
  const forbiddenSelectors = ['.bg-background', '.text-foreground', '.border-border', '.shadow-sm'];
  const emittedForbiddenSelectors = forbiddenSelectors.filter((selector) => css.includes(selector));
  const expectedValues = [
    '--neoverse-color-surface-canvas',
    '--neoverse-color-text-primary',
    '--neoverse-color-edge-light',
    '--neoverse-shadow-card',
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
    '--neoverse-motion-micro-property',
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
    '--neoverse-control-segmented-background',
    '--neoverse-control-segmented-foreground',
    '--neoverse-control-segmented-active-foreground',
    '--neoverse-control-segmented-border',
    '--neoverse-control-segmented-shadow',
    '--neoverse-control-segmented-filter',
    '--neoverse-control-segmented-focus-shadow',
    '--neoverse-control-active-border',
    '--neoverse-badge-background',
    '--neoverse-badge-border',
    '--neoverse-badge-foreground',
    '--neoverse-scrollbar-immersive-size',
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
    '[data-neoverse-glass-renderer=webgl] :is(.glass-card,.glass-surface):before{display:none}',
    '[data-neoverse-glass-renderer=webgl] :is(.glass-card,.glass-surface){box-shadow:var(--neoverse-material-shadow,var(--glass-shadow,none));border-color:#0000',
    '[data-neoverse-glass-renderer=webgl] :is(.material-glass-subtle,.material-glass-elevated,.material-glass-immersive):not(:focus-visible){box-shadow:var(--neoverse-material-shadow)',
    '[data-neoverse-glass-renderer=webgl] :is(.material-glass-subtle,.material-glass-elevated,.material-glass-immersive):not(:focus-visible){box-shadow:var(--neoverse-material-shadow);-webkit-backdrop-filter:var(--neoverse-material-filter);backdrop-filter:var(--neoverse-material-filter);background-clip:padding-box',
    'border-color:#0000',
    'var(--neoverse-material-inner-glow)',
    'var(--neoverse-material-seam-glow)',
    'var(--neoverse-material-bloom)',
    '@media (prefers-reduced-motion:reduce)',
    '-webkit-backdrop-filter:var(--neoverse-material-filter)',
    '@media (prefers-reduced-transparency:reduce)',
    'background-color:var(--neoverse-color-surface-raised);border:var(--neoverse-border-width-thin)',
    ':is(.material-glass-subtle,.material-glass-elevated,.material-glass-immersive) :is(.material-glass-subtle,.material-glass-elevated,.material-glass-immersive):not(.ui-button){background-color:var(--neoverse-color-surface-raised)',
    'transition-duration:var(--tw-duration)',
    'transition-timing-function:var(--tw-ease)',
    '@keyframes ui-skeleton-shimmer',
    'transform:translateX(calc(var(--segment-index)',
    'box-shadow:var(--neoverse-control-active-shadow)',
    'background:var(--neoverse-control-segmented-background)',
    'color:var(--neoverse-control-segmented-foreground)',
    'color:var(--neoverse-control-segmented-active-foreground)',
    'border:var(--neoverse-border-width-thin) var(--neoverse-border-style-solid) var(--neoverse-control-segmented-border)',
    'border:var(--neoverse-border-width-thin) var(--neoverse-border-style-solid) var(--neoverse-control-active-border)',
    'backdrop-filter:var(--neoverse-control-segmented-filter)',
    'box-shadow:var(--neoverse-control-segmented-focus-shadow)',
    'scrollbar-color:var(--neoverse-scrollbar-immersive-thumb) var(--neoverse-scrollbar-immersive-track)',
    'scrollbar-width:thin',
    '::-webkit-scrollbar',
    'background-clip:padding-box',
    '@media (forced-colors:active)',
    '.ui-button{',
    '.ui-button.material-glass-subtle{',
    '.ui-button--primary.material-glass-subtle{',
    '.ui-button--secondary.material-glass-subtle{',
    '.ui-button--ghost.material-glass-subtle{',
    'background:var(--neoverse-control-primary-background)',
    'background:var(--neoverse-control-secondary-background)',
    'background:var(--neoverse-badge-background)',
    'border:var(--neoverse-border-width-thin) var(--neoverse-border-style-solid) var(--neoverse-badge-border)',
    'color:var(--neoverse-badge-foreground)',
    'border:0',
    'backdrop-filter:var(--neoverse-material-filter-subtle)',
  ];
  const missingFragments = expectedFragments.filter((fragment) => !css.includes(fragment));
  const forbiddenWebglFragments = [
    '[data-neoverse-glass-renderer=webgl] :is(.material-glass-subtle,.material-glass-elevated,.material-glass-immersive){box-shadow:var(--neoverse-shadow-none)',
    '[data-neoverse-glass-renderer=webgl] :is(.material-glass-subtle,.material-glass-elevated,.material-glass-immersive){box-shadow:var(--neoverse-material-shadow);-webkit-backdrop-filter:none',
  ];
  const emittedForbiddenWebglFragments = forbiddenWebglFragments.filter((fragment) =>
    css.includes(fragment),
  );
  const expectedButtonFragments = [
    '--neoverse-material-shadow: var(--neoverse-control-button-edge);',
    '--neoverse-material-edge-refraction-carrier: var(--neoverse-control-button-edge-carrier);',
    'border: var(--neoverse-border-width-thin) var(--neoverse-border-style-solid)',
    'var(--neoverse-control-button-border);',
    'background-clip: padding-box;',
    'overflow: hidden;',
    '--neoverse-material-edge-highlight: 0 0 0 0 transparent;',
    '.ui-button.material-glass-subtle:hover:not(:disabled)::after',
    'background: var(--neoverse-control-ghost-background);',
    'border-color: var(--neoverse-color-border-strong);',
    '--neoverse-material-edge-refraction-opacity: var(',
    '.ui-button > .ui-button__edge-field',
    'position: absolute;',
  ];
  const missingButtonFragments = expectedButtonFragments.filter(
    (fragment) => !buttonCss.includes(fragment),
  );
  const expectedBadgeFragments = [
    '--neoverse-badge-background',
    '--neoverse-badge-border',
    '--neoverse-badge-foreground',
    '--ui-badge-status: var(--neoverse-color-status-info);',
  ];
  const missingBadgeFragments = expectedBadgeFragments.filter(
    (fragment) => !badgeCss.includes(fragment),
  );
  const ghostActiveCss =
    buttonCss.match(
      /\.ui-button--ghost\.material-glass-subtle:active:not\(:disabled\) \{([\s\S]*?)\n {2}\}/,
    )?.[1] ?? '';
  const expectedGhostActiveFragments = [
    'background: var(--neoverse-control-button-ghost-active-background);',
    'transform: none;',
  ];
  const missingGhostActiveFragments = expectedGhostActiveFragments.filter(
    (fragment) => !ghostActiveCss.includes(fragment),
  );
  const forbiddenButtonFragments = [
    'inset: 1px;',
    'var(--neoverse-control-primary-shadow)',
    'var(--neoverse-control-primary-hover-shadow)',
    'var(--neoverse-control-secondary-shadow)',
    'var(--neoverse-control-secondary-hover-shadow)',
    'var(--neoverse-control-active-shadow)',
    'var(--neoverse-control-segmented-active-foreground)',
  ];
  const emittedForbiddenButtonFragments = forbiddenButtonFragments.filter((fragment) =>
    buttonCss.includes(fragment),
  );

  if (
    missingSelectors.length > 0 ||
    emittedForbiddenSelectors.length > 0 ||
    missingValues.length > 0 ||
    missingFragments.length > 0 ||
    emittedForbiddenWebglFragments.length > 0 ||
    missingButtonFragments.length > 0 ||
    missingGhostActiveFragments.length > 0 ||
    emittedForbiddenButtonFragments.length > 0 ||
    missingBadgeFragments.length > 0 ||
    flattenedComponentsCss.includes('@import')
  ) {
    const details = [
      missingSelectors.length > 0 ? `Missing selectors: ${missingSelectors.join(', ')}` : '',
      emittedForbiddenSelectors.length > 0
        ? `Forbidden selectors emitted: ${emittedForbiddenSelectors.join(', ')}`
        : '',
      missingValues.length > 0 ? `Missing token references: ${missingValues.join(', ')}` : '',
      missingFragments.length > 0 ? `Missing CSS fragments: ${missingFragments.join(', ')}` : '',
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
      flattenedComponentsCss.includes('@import')
        ? 'Compiled component CSS still contains source imports'
        : '',
    ].filter(Boolean);
    throw new Error(['Tailwind semantic contract failed:', ...details].join('\n'));
  }

  console.log(`Tailwind semantic contract passed with ${expectedSelectors.length} selectors.`);
} finally {
  await rm(output, { force: true });
}
