import { mkdir } from 'node:fs/promises';

const packageDirectory = new URL('../', import.meta.url);
const sourceDirectory = new URL('src/', packageDirectory);
const sourceFiles = [
  'foundation/fonts.css',
  'foundation/primitives.css',
  'materials/glass.css',
  'materials/solid.css',
  'materials/frosted.css',
  'foundation/motion.css',
  'foundation/typography.css',
  'foundation/geometry.css',
  'foundation/layout.css',
  'components/actions/shared-control.css',
  'components/actions/button.css',
  'components/actions/action.css',
  'components/navigation/navigation-item.css',
  'components/navigation/breadcrumb.css',
  'components/surfaces/control-surface.css',
  'components/feedback/status-indicator.css',
  'components/navigation/segmented-control.css',
  'components/navigation/tabs.css',
  'components/display/avatar.css',
  'components/navigation/pagination.css',
  'components/feedback/badge.css',
  'components/feedback/notice.css',
  'components/display/empty-state.css',
  'components/overlays/tooltip.css',
  'components/feedback/skeleton.css',
  'components/surfaces/scrollbar.css',
  'components/display/table.css',
  'components/display/disclosure.css',
  'components/display/prose.css',
  'components/terminal/terminal.css',
  'components/forms/form-control.css',
  'components/overlays/overlay.css',
  'components/overlays/drawer.css',
  'components/overlays/context-menu.css',
  'semantic/effects.css',
  'semantic/surface-effects.css',
  'semantic/control-effects.css',
] as const;
const lightSource = new URL('themes/light.css', sourceDirectory);
const darkSource = new URL('themes/dark.css', sourceDirectory);
const outputDirectory = new URL('dist/', packageDirectory);
const output = new URL('tokens.css', outputDirectory);

const extractCanonicalBody = (source: string, marker: string, label: string): string => {
  const markerIndex = source.indexOf(marker);
  const openingBrace = source.indexOf('{', markerIndex);

  if (markerIndex < 0 || openingBrace < 0) {
    throw new Error(`${label} theme source is missing the canonical declaration body.`);
  }

  let depth = 0;
  for (let index = openingBrace; index < source.length; index += 1) {
    if (source[index] === '{') {
      depth += 1;
    } else if (source[index] === '}') {
      depth -= 1;
      if (depth === 0) {
        return source.slice(openingBrace + 1, index).trim();
      }
    }
  }

  throw new Error(`${label} theme source has an unclosed canonical declaration body.`);
};

const indent = (source: string, spaces: number): string => {
  const prefix = ' '.repeat(spaces);
  return source
    .split('\n')
    .map((line) => (line.length === 0 ? line : `${prefix}${line}`))
    .join('\n');
};

export const renderLightTheme = (source: string): string => {
  const body = extractCanonicalBody(source, '@neoverse-light-tokens', 'Light');

  return `@layer neoverse.tokens {
  :root:not([data-theme]),
  :root[data-theme='light'] {
${indent(body, 4)}
  }

  @media (prefers-color-scheme: light) {
    :root[data-theme='system'] {
${indent(body, 6)}
    }
  }
}`;
};

export const renderDarkTheme = (source: string): string => {
  const body = extractCanonicalBody(source, '@neoverse-dark-tokens', 'Dark');

  return `@layer neoverse.tokens {
  @media (prefers-color-scheme: dark) {
    :root[data-theme='system'],
    :root:not([data-theme]) {
${indent(body, 6)}
    }
  }

  :root[data-theme='dark'] {
${indent(body, 4)}
  }
}`;
};

const sourceParts: string[] = [];
for (const fileName of sourceFiles) {
  sourceParts.push(await Bun.file(new URL(fileName, sourceDirectory)).text());
}
sourceParts.push(renderLightTheme(await Bun.file(lightSource).text()));
sourceParts.push(renderDarkTheme(await Bun.file(darkSource).text()));
const source = sourceParts.join('\n\n');

await mkdir(outputDirectory, { recursive: true });
await Bun.write(output, `${source}\n`);
