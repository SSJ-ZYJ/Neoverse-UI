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

test('exposes compact-control and skeleton effect tokens', () => {
  expect(cssVariables.control.primaryBackground).toBe('--neoverse-control-primary-background');
  expect(cssVariables.control.primaryForeground).toBe('--neoverse-control-primary-foreground');
  expect(cssVariables.control.primaryHoverShadow).toBe('--neoverse-control-primary-hover-shadow');
  expect(cssVariables.control.buttonEdge).toBe('--neoverse-control-button-edge');
  expect(cssVariables.control.buttonHoverBackground).toBe(
    '--neoverse-control-button-hover-background',
  );
  expect(cssVariables.control.buttonActiveBackground).toBe(
    '--neoverse-control-button-active-background',
  );
  expect(cssVariables.control.buttonGhostActiveBackground).toBe(
    '--neoverse-control-button-ghost-active-background',
  );
  expect(cssVariables.control.secondaryBackground).toBe('--neoverse-control-secondary-background');
  expect(cssVariables.control.secondaryBorder).toBe('--neoverse-control-secondary-border');
  expect(cssVariables.control.secondaryFilter).toBe('--neoverse-control-secondary-filter');
  expect(cssVariables.control.segmentedBackground).toBe('--neoverse-control-segmented-background');
  expect(cssVariables.control.segmentedBorder).toBe('--neoverse-control-segmented-border');
  expect(cssVariables.control.segmentedShadow).toBe('--neoverse-control-segmented-shadow');
  expect(cssVariables.control.activeBackground).toBe('--neoverse-control-active-background');
  expect(cssVariables.control.activeBorder).toBe('--neoverse-control-active-border');
  expect(cssVariables.control.hoverBackground).toBe('--neoverse-control-hover-background');
  expect(cssVariables.scrollbar.immersive.size).toBe('--neoverse-scrollbar-immersive-size');
  expect(cssVariables.scrollbar.immersive.track).toBe('--neoverse-scrollbar-immersive-track');
  expect(cssVariables.scrollbar.immersive.thumb).toBe('--neoverse-scrollbar-immersive-thumb');
  expect(cssVariables.scrollbar.immersive.thumbHover).toBe(
    '--neoverse-scrollbar-immersive-thumb-hover',
  );
  expect(cssVariables.scrollbar.immersive.thumbActive).toBe(
    '--neoverse-scrollbar-immersive-thumb-active',
  );
  expect(cssVariables.scrollbar.immersive.thumbEdge).toBe(
    '--neoverse-scrollbar-immersive-thumb-edge',
  );
  expect(cssVariables.skeleton.fill).toBe('--neoverse-skeleton-fill');
  expect(cssVariables.skeleton.highlight).toBe('--neoverse-skeleton-highlight');
  expect(cssVariables.skeleton.edge).toBe('--neoverse-skeleton-edge');
});

test('keeps skeleton motion at a calmer loading pace', async () => {
  const semanticCss = await readTokenCss('semantic.css');
  const duration = semanticCss
    .match(/--neoverse-skeleton-shimmer-duration:\s*([^;]+)/)?.[1]
    ?.trim();

  expect(duration).toBe('1.25s');
});

test('keeps immersive scrollbars theme-aware and quiet at rest', async () => {
  const semanticCss = await readTokenCss('semantic.css');

  expect(semanticCss).toContain('--neoverse-scrollbar-immersive-size: 0.75rem;');
  expect(semanticCss).toContain('--neoverse-scrollbar-immersive-track: color-mix(');
  expect(semanticCss).toContain('--neoverse-scrollbar-immersive-thumb: color-mix(');
  expect(semanticCss).toContain('--neoverse-scrollbar-immersive-thumb-hover: color-mix(');
  expect(semanticCss).toContain('var(--neoverse-scrollbar-immersive-thumb-hover) 48%,');
  expect(semanticCss).toContain('var(--neoverse-scrollbar-immersive-thumb-active) 48%,');
  expect(semanticCss).toMatch(/--neoverse-scrollbar-immersive-thumb-edge:\s*inset 0 1px 1px/);
});

test('keeps the light segmented control edges translucent and blurred', async () => {
  const [semanticCss, themesCss] = await Promise.all([
    readTokenCss('semantic.css'),
    readTokenCss('themes.css'),
  ]);

  expect(semanticCss).toMatch(/--neoverse-control-segmented-background:\s*color-mix\(/);
  expect(semanticCss).toContain('--neoverse-control-segmented-border: transparent;');
  expect(semanticCss).toMatch(/--neoverse-control-segmented-shadow:\s*inset 0 1px 3px/);
  expect(semanticCss).toMatch(/--neoverse-control-active-background:\s*linear-gradient\(/);
  expect(semanticCss).toContain('--neoverse-control-active-border: transparent;');
  expect(semanticCss).toMatch(/--neoverse-control-active-highlight:\s*inset 0 1px 3px/);
  const activeHighlight =
    semanticCss.match(/--neoverse-control-active-highlight:([\s\S]*?);/)?.[1] ?? '';
  expect(activeHighlight).not.toContain('var(--neoverse-color-edge-light)');
  expect(semanticCss).toContain(
    '--neoverse-control-active-shadow:\n      var(--neoverse-control-active-highlight), var(--neoverse-shadow-control);',
  );
  expect(semanticCss).toMatch(/--neoverse-control-secondary-shadow:\s*inset 0 1px 0/);
  expect(
    themesCss.match(
      /--neoverse-control-active-shadow:\s*var\(--neoverse-control-active-highlight\),\s*var\(--neoverse-shadow-xs\);/g,
    ),
  ).toHaveLength(2);
  expect(
    themesCss.match(
      /--neoverse-control-segmented-shadow:\s*var\(--neoverse-control-secondary-shadow\);/g,
    ),
  ).toHaveLength(2);
  expect(
    themesCss.match(
      /--neoverse-control-segmented-background:\s*var\(--neoverse-control-secondary-background\);/g,
    ),
  ).toHaveLength(2);
  expect(
    themesCss.match(/--neoverse-control-active-background:\s*linear-gradient\(/g),
  ).toHaveLength(2);
  expect(themesCss.match(/--neoverse-control-active-border:\s*transparent;/g)).toHaveLength(2);
});

test('keeps light control buttons grounded by a compact neutral shadow', async () => {
  const [geometryCss, semanticCss, themesCss] = await Promise.all([
    readTokenCss('geometry.css'),
    readTokenCss('semantic.css'),
    readTokenCss('themes.css'),
  ]);
  const controlShadow = 'var(--neoverse-shadow-control)';

  expect(geometryCss).toContain('--neoverse-shadow-control: 0 2px 6px -1px rgb(14 34 44 / 20%);');

  for (const name of ['primary', 'secondary']) {
    const declaration = semanticCss.match(
      new RegExp(`--neoverse-control-${name}-shadow:([\\s\\S]*?);`),
    )?.[1];

    expect(declaration).toContain(controlShadow);
  }

  expect(semanticCss).toMatch(/--neoverse-control-secondary-background:\s*linear-gradient\(/);
  expect(semanticCss).toMatch(/--neoverse-control-primary-hover-shadow:\s*inset 0 1px 0/);
  expect(semanticCss).toContain(
    '--neoverse-control-primary-background: linear-gradient(\n      180deg,',
  );
  expect(semanticCss).toMatch(/--neoverse-control-button-edge:\s*inset 0 1px 3px/);

  expect(
    themesCss.match(/--neoverse-shadow-control:\s*var\(--neoverse-shadow-xs\);/g),
  ).toHaveLength(2);
});

test('keeps button surfaces independent of theme accents', async () => {
  const semanticCss = await readTokenCss('semantic.css');
  const buttonTokens = [
    'primary-background',
    'primary-foreground',
    'primary-border',
    'primary-shadow',
    'primary-hover-background',
    'primary-hover-shadow',
    'primary-active-background',
    'button-edge',
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
  expect(cssVariables.typography.body.lineHeight).toBe('--neoverse-typography-body-line-height');
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

test('exposes Motion duration, easing, and spatial tokens', () => {
  expect(cssVariables.motion.duration).toEqual({
    fast: '--neoverse-motion-duration-fast',
    standard: '--neoverse-motion-duration-standard',
    expressive: '--neoverse-motion-duration-expressive',
  });
  expect(cssVariables.motion.easing.standard).toBe('--neoverse-motion-easing-standard');
  expect(cssVariables.motion.spatialDistance).toBe('--neoverse-motion-spatial-distance');
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

const readTokenCss = async (fileName: string): Promise<string> => {
  const localFile = Bun.file(new URL(`./${fileName}`, import.meta.url));

  if (await localFile.exists()) {
    return localFile.text();
  }

  return Bun.file(new URL(`../src/${fileName}`, import.meta.url)).text();
};

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
    readTokenCss('themes.css'),
  ]);
  const variants = ['subtle', 'elevated', 'immersive'];

  for (const variant of variants) {
    expect(materialCss).toContain(`--neoverse-material-glass-${variant}-border: transparent;`);
    expect(
      themesCss.match(
        new RegExp(
          `--neoverse-material-glass-${variant}-border:\\s*var\\(--neoverse-color-border-(?:subtle|default)\\);`,
          'g',
        ),
      ),
    ).toHaveLength(2);
  }
});

test('keeps Glass edge highlights refractive and softly diffused', async () => {
  const [materialCss, semanticCss, geometryCss, themesCss] = await Promise.all([
    readTokenCss('material.css'),
    readTokenCss('semantic.css'),
    readTokenCss('geometry.css'),
    readTokenCss('themes.css'),
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

    expect(darkDeclarations).toHaveLength(2);
    for (const darkDeclaration of darkDeclarations ?? []) {
      expect(darkDeclaration).toContain('inset 0 1px 2px');
      expect(darkDeclaration).toContain('inset 0 -1px 2px');
      expect(darkDeclaration).toContain('inset 1px 0 2px');
      expect(darkDeclaration).toContain('inset -1px 0 2px');
      expect(darkDeclaration).toContain('var(--neoverse-color-accent-primary)');
      expect(darkDeclaration).toContain('var(--neoverse-color-accent-secondary)');
      expect(darkDeclaration).toContain('var(--neoverse-color-accent-tertiary)');
    }
  }

  expect(semanticCss).toMatch(/--neoverse-control-primary-shadow:\s*inset 0 1px 0/);
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
    readTokenCss('themes.css'),
  ]);

  for (const name of ['xs', 'sm', 'md', 'lg', 'xl']) {
    const lightValue = shadowDeclarations(geometryCss, name)[0];
    const darkValues = shadowDeclarations(themesCss, name);

    expect(lightValue).toBeDefined();
    expect(darkValues).toHaveLength(2);

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
    readTokenCss('themes.css'),
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
  expect(darkValues).toHaveLength(2);
  expect(darkEdgeHighlights).toHaveLength(2);

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
    readTokenCss('themes.css'),
  ]);

  const lightValue = shadowDeclarations(geometryCss, 'xs')[0];
  const lightSmValue = shadowDeclarations(geometryCss, 'sm')[0];
  const lightMdValue = shadowDeclarations(geometryCss, 'md')[0];
  const darkValues = ['xs', 'sm', 'md'].map((name) => shadowDeclarations(themesCss, name));
  const shadowSets = [
    [lightValue, lightSmValue, lightMdValue],
    ...[0, 1].map((index) => darkValues.map((values) => values[index])),
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
