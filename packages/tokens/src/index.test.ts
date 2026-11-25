import { expect, test } from 'bun:test';
import { readTokenCss } from './css-helpers.test-support.js';
import { cssVariables, layoutBreakpoints } from './index.js';

test('exposes semantic color variables under the Neoverse namespace', () => {
  expect(cssVariables.color.surface.canvas).toBe('--neoverse-color-surface-canvas');
  expect(cssVariables.color.text.primary).toBe('--neoverse-color-text-primary');
  expect(cssVariables.color.edgeLight).toBe('--neoverse-color-edge-light');
  expect(cssVariables.color.ambient.ice).toBe('--neoverse-color-ambient-ice');
  expect(cssVariables.color.action.primaryHover).toBe('--neoverse-color-action-primary-hover');
  expect(cssVariables.color.status.danger).toBe('--neoverse-color-status-danger');
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
  expect(cssVariables.shadow.float).toBe('--neoverse-shadow-float');
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
  expect(await readTokenCss('primitives.css')).toContain(
    "'Fira Code Variable', 'Fira Code', 'Noto Sans SC Variable', 'Noto Sans SC', 'PingFang SC',",
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
  expect(cssVariables.material.scale.edgeHighlight.subtleBottom).toBe(
    '--neoverse-material-edge-highlight-subtle-bottom',
  );
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
    'planeBackground',
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
