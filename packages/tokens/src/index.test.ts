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
  expect(cssVariables.control.secondaryBackground).toBe('--neoverse-control-secondary-background');
  expect(cssVariables.control.secondaryFilter).toBe('--neoverse-control-secondary-filter');
  expect(cssVariables.control.activeBackground).toBe('--neoverse-control-active-background');
  expect(cssVariables.control.hoverBackground).toBe('--neoverse-control-hover-background');
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
  const parameters = [
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
  const roles = [
    cssVariables.material.surface.solid,
    cssVariables.material.surface.subtle,
    cssVariables.material.surface.elevated,
    cssVariables.material.glass.subtle,
    cssVariables.material.glass.elevated,
    cssVariables.material.glass.immersive,
  ];

  for (const role of roles) {
    expect(Object.keys(role)).toEqual(parameters);
  }

  expect(cssVariables.material.scale.blur.md).toBe('--neoverse-material-blur-md');
  expect(cssVariables.material.scale.saturation.immersive).toBe(
    '--neoverse-material-saturation-immersive',
  );
  expect(cssVariables.material.surface.elevated.shadow).toBe(
    '--neoverse-material-surface-elevated-shadow',
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

test('keeps dark shadows aligned with the light hierarchy', async () => {
  const [geometryCss, themesCss] = await Promise.all([
    readTokenCss('geometry.css'),
    readTokenCss('themes.css'),
  ]);

  for (const name of ['xs', 'sm', 'md', 'lg', 'xl', 'inset']) {
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
