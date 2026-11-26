export const expectedFragments = [
  'background-color:color-mix(in srgb',
  'mask-image:var(--neoverse-material-refraction-gradient)',
  'backdrop-filter:var(--neoverse-material-filter)',
  'mix-blend-mode:normal',
  'filter:var(--neoverse-material-edge-refraction-softness)',
  'opacity:var(--neoverse-material-edge-refraction-opacity)',
  'data-neoverse-glass-renderer=webgl',
  'data-neoverse-glass-renderer=native',
  '[data-neoverse-glass-renderer=webgl]',
  'data-neoverse-glass-edge-pass=css',
  'data-neoverse-surface-hover=static',
  ':not(:focus-visible){box-shadow:var(--neoverse-material-shadow)',
  'var(--neoverse-material-inner-glow)',
  'var(--neoverse-material-seam-glow)',
  'var(--neoverse-material-bloom)',
  'box-shadow:var(--neoverse-material-bloom), var(--neoverse-material-shadow)',
  '@media (prefers-reduced-motion:reduce)',
  '-webkit-backdrop-filter:var(--neoverse-material-filter)',
  '@media (prefers-reduced-transparency:reduce)',
  'background-color:var(--neoverse-material-background-fallback)',
  'background:var(--neoverse-material-borrowed,revert-layer)',
  'background-color:var(--neoverse-solid-plate-fill)',
  '--neoverse-glass-tier:elevated',
  'backdrop-filter:var(--neoverse-material-frosted-filter)',
  'box-shadow:var(--neoverse-material-borrowed,revert-layer)',
  '-webkit-backdrop-filter:none',
  'backdrop-filter:none',
  'background-image:none',
  '[data-neoverse-surface-overflow=visible]{overflow:visible}',
  'transition-duration:var(--tw-duration)',
  'transition-timing-function:var(--tw-ease)',
  '@keyframes ui-skeleton-shimmer',
  'grid-column:var(--segment-active-column,calc(var(--segment-index) + 1) / span 1)',
  'translate:var(--segment-active-offset,0)',
  'box-shadow:var(--neoverse-control-segmented-active-shadow)',
  'background-image:var(--neoverse-control-segmented-background-image)',
  'background-color:var(--neoverse-control-segmented-background-color)',
  'color:var(--neoverse-control-segmented-foreground)',
  'color:var(--neoverse-control-segmented-active-foreground)',
  'border:var(--neoverse-border-width-thin) var(--neoverse-border-style-solid) var(--neoverse-control-segmented-active-border)',
  'scrollbar-color:var(--neoverse-scrollbar-immersive-thumb) transparent',
  'scrollbar-width:thin',
  '::-webkit-scrollbar',
  'background-clip:padding-box',
  '@media (forced-colors:active)',
  '.ui-button{',
  '.ui-button--primary{',
  '.ui-button--secondary{',
  'border:0',
];

export const forbiddenNestedGlassFragments = [
  /* Never restore implicit nested flattening: independent Glass components
     must retain their resting material when placed inside Glass layouts. */
  ':not([data-neoverse-glass-nesting=local])',
];

export const forbiddenWebglFragments = [
  '[data-neoverse-glass-renderer=webgl] :is(.material-glass-subtle,.material-glass-elevated,.material-glass-immersive){box-shadow:var(--neoverse-shadow-none)',
  '[data-neoverse-glass-renderer=webgl] :is(.material-glass-subtle,.material-glass-elevated,.material-glass-immersive){box-shadow:var(--neoverse-material-shadow);-webkit-backdrop-filter:none',
];

export const expectedButtonFragments = [
  '.ui-icon-button--sm {',
  'width: var(--neoverse-button-height-sm);',
  '.ui-icon-button--md {',
  'width: var(--neoverse-button-height-md);',
  '.ui-icon-button--lg {',
  'width: var(--neoverse-button-height-lg);',
  '.ui-icon-button--stretch {',
  '.ui-icon-button__content {',
  'position: absolute;',
];

export const forbiddenButtonFragments = [
  'inset: 1px;',
  'var(--neoverse-control-secondary-shadow)',
  'var(--neoverse-control-secondary-hover-shadow)',
  'var(--neoverse-control-active-shadow)',
  'var(--neoverse-control-segmented-active-foreground)',
];

export const expectedProseFragments = [
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
  '.neoverse-prose :where(em, i)',
  'font-family: var(--neoverse-prose-inline-code-font-family);',
  '.neoverse-prose :where(del, s)',
  '.neoverse-prose a :where(strong, b, del, s)',
];

export const expectedNavigationMotionFragments = [
  'opacity var(--neoverse-motion-state-duration) var(--neoverse-motion-state-easing)',
  'top var(--neoverse-motion-state-duration) var(--neoverse-motion-state-easing)',
  'left var(--neoverse-motion-state-duration) var(--neoverse-motion-state-easing)',
  'transform var(--neoverse-motion-state-duration) var(--neoverse-motion-state-easing)',
];

export const expectedTooltipFragments = [
  '.ui-tooltip-surface.material-recipe-glass-subtle[data-neoverse-tooltip-surface]',
  '--neoverse-material-border: transparent;',
  '--neoverse-material-hover-border: transparent;',
  'backdrop-filter: var(--neoverse-material-filter);',
  'clip-path: shape(',
];
