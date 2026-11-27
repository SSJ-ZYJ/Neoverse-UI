import { expect, test } from 'bun:test';
import {
  extractCssBlock,
  firstShadowLayer,
  parseShadowLayers,
  readBuiltTokenCss,
  readTokenCss,
  shadowDeclarations,
  shadowReach,
} from './css-helpers.test-support.js';

test('keeps default keyboard focus on the primary accent in both themes', async () => {
  for (const theme of ['light', 'dark']) {
    const themesCss = await readTokenCss(`themes/${theme}.css`);
    const focusRings = themesCss.match(/--neoverse-color-focus-ring:\s*([^;]+);/g);

    expect(focusRings).toHaveLength(1);
    for (const focusRing of focusRings ?? []) {
      expect(focusRing).toContain('var(--neoverse-color-accent-primary)');
      expect(focusRing).not.toContain('var(--neoverse-color-accent-secondary)');
      expect(focusRing).not.toContain('var(--neoverse-color-accent-tertiary)');
    }
  }
});

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
    readTokenCss('materials/glass.css'),
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
    readTokenCss('foundation/geometry.css'),
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
    readTokenCss('foundation/geometry.css'),
    readTokenCss('materials/glass.css'),
    readTokenCss('themes/dark.css'),
  ]);
  const lightValue = shadowDeclarations(geometryCss, 'inset')[0];
  const lightEdgeHighlight = materialCss.match(
    /--neoverse-material-edge-highlight-subtle:([\s\S]*?);/,
  )?.[1];
  const lightBottomHighlight = materialCss.match(
    /--neoverse-material-edge-highlight-subtle-bottom:([\s\S]*?);/,
  )?.[1];
  const darkValues = shadowDeclarations(themesCss, 'inset');
  const darkEdgeHighlights = [
    ...themesCss.matchAll(/--neoverse-material-edge-highlight-subtle:([\s\S]*?);/g),
  ].flatMap((match) => (match[1] === undefined ? [] : [match[1]]));
  const darkBottomHighlight = themesCss.match(
    /--neoverse-material-edge-highlight-subtle-bottom:([\s\S]*?);/,
  )?.[1];

  expect(lightValue).toBeDefined();
  expect(lightEdgeHighlight).toBeDefined();
  expect(lightBottomHighlight).toBeDefined();
  expect(darkBottomHighlight).toBeDefined();
  expect(darkValues).toHaveLength(1);
  expect(darkEdgeHighlights).toHaveLength(1);

  if (
    lightValue === undefined ||
    lightEdgeHighlight === undefined ||
    lightBottomHighlight === undefined ||
    darkBottomHighlight === undefined
  ) {
    return;
  }

  expect(
    parseShadowLayers(
      lightValue
        .replace('var(--neoverse-material-edge-highlight-subtle)', lightEdgeHighlight)
        .replace('var(--neoverse-material-edge-highlight-subtle-bottom)', lightBottomHighlight),
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
        darkValue
          .replace('var(--neoverse-material-edge-highlight-subtle)', darkEdgeHighlight)
          .replace('var(--neoverse-material-edge-highlight-subtle-bottom)', darkBottomHighlight),
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

test('keeps sm and md shadows visibly separated from xs', async () => {
  const [geometryCss, themesCss] = await Promise.all([
    readTokenCss('foundation/geometry.css'),
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

test('resets every light theme custom property in dark theme to prevent system-dark leaks', async () => {
  const [lightSource, darkSource] = await Promise.all([
    readTokenCss('themes/light.css'),
    readTokenCss('themes/dark.css'),
  ]);
  const extractProperties = (source: string) =>
    new Set([...source.matchAll(/^\s*(--neoverse-[\w-]+):/gm)].map((match) => match[1]));

  const lightProperties = extractProperties(lightSource);
  const darkProperties = extractProperties(darkSource);
  const missingInDark = [...lightProperties].filter((property) => !darkProperties.has(property));

  expect(missingInDark).toEqual([]);
});
