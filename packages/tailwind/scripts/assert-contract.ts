import { rm } from 'node:fs/promises';

const output = new URL('../dist/contract.css', import.meta.url);
const source = new URL('../src/components.css', import.meta.url);

try {
  const css = await Bun.file(output).text();
  const componentCss = await Bun.file(source).text();
  const buttonCss = componentCss.slice(0, componentCss.indexOf('/* Badges'));
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
    '--neoverse-control-button-edge',
    '--neoverse-control-button-hover-background',
    '--neoverse-control-button-active-background',
    '--neoverse-control-button-ghost-active-background',
    '--neoverse-control-secondary-background',
    '--neoverse-control-secondary-border',
    '--neoverse-control-secondary-filter',
    '--neoverse-control-segmented-background',
    '--neoverse-control-segmented-border',
    '--neoverse-control-segmented-shadow',
    '--neoverse-control-active-border',
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
    '[data-neoverse-glass-renderer=webgl] :is(.glass-card,.glass-surface){box-shadow:var(--neoverse-shadow-none',
    '[data-neoverse-glass-renderer=webgl] :is(.material-glass-subtle,.material-glass-elevated,.material-glass-immersive){box-shadow:var(--neoverse-shadow-none',
    '[data-neoverse-glass-renderer=webgl] :is(.material-glass-subtle,.material-glass-elevated,.material-glass-immersive){box-shadow:var(--neoverse-shadow-none);-webkit-backdrop-filter:blur(var(--neoverse-material-blur)) saturate(var(--neoverse-material-saturation));backdrop-filter:blur(var(--neoverse-material-blur)) saturate(var(--neoverse-material-saturation))',
    '[data-neoverse-glass-renderer=webgl] :is(.material-glass-subtle,.material-glass-elevated,.material-glass-immersive){box-shadow:var(--neoverse-shadow-none);-webkit-backdrop-filter:blur(var(--neoverse-material-blur)) saturate(var(--neoverse-material-saturation));backdrop-filter:blur(var(--neoverse-material-blur)) saturate(var(--neoverse-material-saturation));background-clip:border-box',
    'border-color:#0000',
    'var(--neoverse-material-inner-glow)',
    'var(--neoverse-material-seam-glow)',
    'var(--neoverse-material-bloom)',
    '@media (prefers-reduced-motion:reduce)',
    '-webkit-backdrop-filter:var(--neoverse-material-filter)',
    '@media (prefers-reduced-transparency:reduce)',
    'background-color:var(--neoverse-color-surface-raised);border:var(--neoverse-border-width-thin)',
    ':is(.material-glass-subtle,.material-glass-elevated,.material-glass-immersive) :is(.material-glass-subtle,.material-glass-elevated,.material-glass-immersive){background-color:var(--neoverse-color-surface-raised)',
    'transition-duration:var(--tw-duration)',
    'transition-timing-function:var(--tw-ease)',
    '@keyframes ui-skeleton-shimmer',
    'transform:translateX(calc(var(--segment-index)',
    'box-shadow:var(--neoverse-control-active-shadow)',
    'background:var(--neoverse-control-segmented-background)',
    'border:var(--neoverse-border-width-thin) var(--neoverse-border-style-solid) var(--neoverse-control-segmented-border)',
    'border:var(--neoverse-border-width-thin) var(--neoverse-border-style-solid) var(--neoverse-control-active-border)',
    'scrollbar-color:var(--neoverse-scrollbar-immersive-thumb) var(--neoverse-scrollbar-immersive-track)',
    'scrollbar-width:thin',
    '::-webkit-scrollbar',
    'background-clip:padding-box',
    '@media (forced-colors:active)',
    '.ui-button--primary{',
    '.ui-button--secondary{',
    '.ui-button--ghost{',
    'background:var(--neoverse-control-primary-background)',
    'background:var(--neoverse-control-secondary-background)',
    'box-shadow:var(--neoverse-control-button-edge)',
    'border:0',
    'backdrop-filter:var(--neoverse-control-secondary-filter)',
  ];
  const missingFragments = expectedFragments.filter((fragment) => !css.includes(fragment));
  const forbiddenWebglFragments = [
    '[data-neoverse-glass-renderer=webgl] :is(.material-glass-subtle,.material-glass-elevated,.material-glass-immersive){box-shadow:var(--neoverse-shadow-none);-webkit-backdrop-filter:none;backdrop-filter:none',
  ];
  const emittedForbiddenWebglFragments = forbiddenWebglFragments.filter((fragment) =>
    css.includes(fragment),
  );
  const expectedButtonFragments = [
    'box-shadow: var(--neoverse-control-button-edge);',
    'box-shadow: var(--neoverse-shadow-none);',
  ];
  const missingButtonFragments = expectedButtonFragments.filter(
    (fragment) => !buttonCss.includes(fragment),
  );
  const ghostActiveCss =
    buttonCss.match(/\.ui-button--ghost:active:not\(:disabled\) \{([\s\S]*?)\n {2}\}/)?.[1] ?? '';
  const expectedGhostActiveFragments = [
    'background-color: var(--neoverse-control-button-ghost-active-background);',
    'box-shadow: var(--neoverse-control-button-edge);',
    'transform: none;',
  ];
  const missingGhostActiveFragments = expectedGhostActiveFragments.filter(
    (fragment) => !ghostActiveCss.includes(fragment),
  );
  const forbiddenButtonFragments = [
    '::before',
    'inset: 1px;',
    'var(--neoverse-control-primary-shadow)',
    'var(--neoverse-control-primary-hover-shadow)',
    'var(--neoverse-control-secondary-shadow)',
    'var(--neoverse-control-secondary-hover-shadow)',
    'var(--neoverse-control-active-shadow)',
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
    emittedForbiddenButtonFragments.length > 0
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
    ].filter(Boolean);
    throw new Error(['Tailwind semantic contract failed:', ...details].join('\n'));
  }

  console.log(`Tailwind semantic contract passed with ${expectedSelectors.length} selectors.`);
} finally {
  await rm(output, { force: true });
}
