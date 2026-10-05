import { mkdir } from 'node:fs/promises';

const packageDirectory = new URL('../', import.meta.url);
const sourceDirectory = new URL('src/', packageDirectory);
const sourceFiles = [
  'fonts.css',
  'primitives.css',
  'material.css',
  'motion.css',
  'typography.css',
  'geometry.css',
  'layout.css',
  'components/shared-control.css',
  'components/button.css',
  'components/action.css',
  'components/navigation-item.css',
  'components/breadcrumb.css',
  'components/control-surface.css',
  'components/status-indicator.css',
  'components/segmented-control.css',
  'components/badge.css',
  'components/notice.css',
  'components/tooltip.css',
  'components/skeleton.css',
  'components/scrollbar.css',
  'components/table.css',
  'components/disclosure.css',
  'components/form-control.css',
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
