import { expect, test } from 'bun:test';

import { cssVariables } from '@neoverse-ui/tokens';
import { primitiveRadiusTokens, semanticRadiusTokens } from './lab-data';
import { localize, moduleCopy } from './playground-content';

const radiusVariableNames = (tokens: { variable: string }[]) =>
  tokens.map((token) => token.variable);

test('classifies semantic radius aliases outside the base scale', () => {
  const primitiveVariables = radiusVariableNames(primitiveRadiusTokens);
  const semanticVariables = radiusVariableNames(semanticRadiusTokens);
  const semanticAliasVariables = [
    cssVariables.radius.pill,
    cssVariables.radius.control,
    cssVariables.radius.controlInner,
    cssVariables.radius.card,
    cssVariables.radius.panel,
  ];

  for (const variable of semanticAliasVariables) {
    expect(primitiveVariables).not.toContain(variable);
    expect(semanticVariables).toContain(variable);
  }
});

test('describes the radius aliases with their actual definitions', () => {
  const description = localize(moduleCopy.radius.aliases.description, 'zh');

  expect(description).toContain('pill=9999px');
  expect(description).toContain('control=md（12px）');
  expect(description).toContain('controlInner=control - 0.18rem（9.12px）');
  expect(description).toContain('card=lg（16px）');
  expect(description).toContain('panel=xl（24px）');
});

test('keeps every composition scene localized in both supported locales', () => {
  const sceneIds = [
    'controlCluster',
    'projectCard',
    'floatingToolbar',
    'docsArticleHeader',
    'docsNavigationGroup',
    'docsContentSurface',
    'docsToolbar',
  ] as const;
  const scenes = moduleCopy.composition.scenes;

  expect(Object.keys(scenes)).toEqual(Array.from(sceneIds));

  for (const sceneId of sceneIds) {
    const scene = scenes[sceneId];
    expect(localize(scene.label, 'en')).not.toBe('');
    expect(localize(scene.label, 'zh')).not.toBe('');
    expect(localize(scene.description, 'en')).not.toBe('');
    expect(localize(scene.description, 'zh')).not.toBe('');
  }
});
