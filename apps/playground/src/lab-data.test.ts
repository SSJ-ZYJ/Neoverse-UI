import { expect, test } from 'bun:test';

import { cssVariables } from '@neoverse-ui/tokens';
import {
  layoutRoleTokens,
  primitiveRadiusTokens,
  semanticRadiusTokens,
  typographyTokens,
} from './lab-data';
import {
  labModules,
  labSpecimens,
  moduleGroups,
  resolveLabHash,
  specimenById,
  specimenKinds,
} from './lab-modules';
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

test('keeps semantic typography family roles visible in the Design Lab token specimen', () => {
  const variables = typographyTokens.flatMap((token) => token.variables);

  expect(variables).toContain(cssVariables.typography.display.fontFamily);
  expect(variables).toContain(cssVariables.typography.body.fontFamily);
  expect(variables).toContain(cssVariables.typography.code.fontFamily);
});

test('keeps semantic page layout roles visible in the Design Lab token specimen', () => {
  const variables = layoutRoleTokens.map((token) => token.variable);
  const classes = layoutRoleTokens.map((token) => token.className);

  expect(variables).toEqual(
    expect.arrayContaining([
      cssVariables.layout.page.maxWidth,
      cssVariables.layout.contentMaxWidth,
      cssVariables.layout.reading.width,
      cssVariables.layout.reading.wideWidth,
      cssVariables.layout.sidebar.width,
      cssVariables.layout.sidebar.drawerWidth,
      cssVariables.layout.headerMinHeight,
    ]),
  );
  expect(classes).toEqual(
    expect.arrayContaining([
      'max-w-page',
      'max-w-content',
      'max-w-reading',
      'max-w-reading-wide',
      'w-sidebar',
      'w-sidebar-drawer',
      'min-h-header',
    ]),
  );
});

test('describes the radius aliases with their actual definitions', () => {
  const description = localize(moduleCopy.radius.aliases.description, 'zh');

  expect(description).toContain('pill=9999px');
  expect(description).toContain('control=md（12px）');
  expect(description).toContain('controlInner=control - 0.18rem（9.12px）');
  expect(description).toContain('card=lg（16px）');
  expect(description).toContain('panel=xl（24px）');
});

test('registers one consolidated controls module and the parity composition', () => {
  const moduleIds = labModules.map((module) => module.id);

  expect(moduleIds).toEqual(expect.arrayContaining(['controls', 'consumer-parity']));
  expect(moduleIds).not.toEqual(
    expect.arrayContaining(['action', 'navigation-item', 'status-indicator', 'control-surface']),
  );
});

test('keeps the top-level lab information architecture compact and purpose-driven', () => {
  expect(labModules.map((module) => module.id)).toEqual([
    'colors',
    'typography',
    'layout-shape',
    'motion',
    'materials',
    'shadow',
    'controls',
    'status-feedback',
    'card',
    'scrollbar',
    'composition',
    'consumer-parity',
  ]);

  expect(moduleGroups.map((group) => [group.id, [...group.moduleIds]])).toEqual([
    ['foundations', ['colors', 'typography', 'layout-shape', 'motion']],
    ['materials', ['materials', 'shadow']],
    ['components', ['controls', 'status-feedback', 'card', 'scrollbar']],
    ['patterns', ['composition']],
    ['validation', ['consumer-parity']],
  ]);
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

test('keeps every specimen kind represented in the catalogue registry', () => {
  expect([...new Set(labSpecimens.map((specimen) => specimen.kind))].sort()).toEqual(
    [...specimenKinds].sort(),
  );
});

test('keeps the foundation modules represented in the specimen catalogue', () => {
  expect(
    labSpecimens
      .filter((specimen) => specimen.kind === 'foundation')
      .map((specimen) => [specimen.id, specimen.moduleId]),
  ).toEqual([
    ['foundation-colors', 'colors'],
    ['foundation-typography', 'typography'],
    ['foundation-prose', 'typography'],
    ['foundation-layout-shape', 'layout-shape'],
    ['foundation-motion', 'motion'],
  ]);
});

test('keeps specimen ids unique, localized, and resolvable to their owner module', () => {
  const ids = labSpecimens.map((specimen) => specimen.id);
  expect(new Set(ids).size).toBe(ids.length);

  for (const specimen of labSpecimens) {
    expect(localize(specimen.label, 'en')).not.toBe('');
    expect(localize(specimen.label, 'zh')).not.toBe('');
    expect(specimenById(specimen.id)?.moduleId).toBe(specimen.moduleId);
    expect(resolveLabHash(specimen.id)).toEqual({
      moduleId: specimen.moduleId,
      specimenId: specimen.id,
      canonicalHash: specimen.id,
    });
  }
});

test('keeps public Vue components discoverable from the specimen catalogue', async () => {
  const source = await Bun.file(
    new URL('../../../packages/vue/src/index.ts', import.meta.url),
  ).text();
  const publicComponents = [...source.matchAll(/export \{ default as (Ui[A-Za-z]+) \}/g)]
    .map((match) => match[1])
    .filter((value): value is string => value !== undefined)
    .sort();
  const coveredComponents: string[] = [
    ...new Set<string>(labSpecimens.flatMap((specimen) => [...specimen.apiNames])),
  ].sort();

  expect(coveredComponents).toEqual(publicComponents);
});

test('keeps public React component adapters discoverable from the specimen catalogue', async () => {
  const source = await Bun.file(
    new URL('../../../packages/react/src/index.tsx', import.meta.url),
  ).text();
  const publicComponents = [...source.matchAll(/export function (Ui[A-Za-z]+)/g)]
    .map((match) => match[1])
    .filter((value): value is string => value !== undefined)
    .sort();
  const coveredComponents = new Set<string>(
    labSpecimens.flatMap((specimen) => [...specimen.apiNames]),
  );

  for (const component of publicComponents) {
    expect(coveredComponents.has(component), component).toBe(true);
  }
});

test('keeps every registered specimen backed by a stable module fixture id', async () => {
  const modulesDirectory = `${import.meta.dir}/modules`;
  const sourceFiles = [...new Bun.Glob('*.vue').scanSync({ cwd: modulesDirectory })];
  const moduleSources = await Promise.all(
    sourceFiles.map((file) => Bun.file(`${modulesDirectory}/${file}`).text()),
  );
  const source = moduleSources.join('\n');

  for (const specimen of labSpecimens) {
    expect(source.includes(`id="${specimen.id}"`), specimen.id).toBe(true);
  }
});

test('resolves legacy module hashes without changing specimen deep links', () => {
  expect(resolveLabHash('spacing')).toEqual({
    moduleId: 'layout-shape',
    canonicalHash: 'layout-shape',
  });
  expect(resolveLabHash('#glass')).toEqual({
    moduleId: 'materials',
    canonicalHash: 'materials',
  });
  expect(resolveLabHash('controls-action')).toEqual({
    moduleId: 'controls',
    specimenId: 'controls-action',
    canonicalHash: 'controls-action',
  });
  expect(resolveLabHash('not-a-lab-route')).toBeNull();
});
