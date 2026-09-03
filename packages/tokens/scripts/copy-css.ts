import { mkdir } from 'node:fs/promises';

const packageDirectory = new URL('../', import.meta.url);
const sourceDirectory = new URL('src/', packageDirectory);
const sourceFiles = [
  'primitives.css',
  'semantic.css',
  'material.css',
  'motion.css',
  'typography.css',
  'geometry.css',
  'layout.css',
  'themes/light.css',
  'components/shared-control.css',
  'components/button.css',
  'components/segmented-control.css',
  'components/badge.css',
  'components/skeleton.css',
  'components/scrollbar.css',
] as const;
const darkSource = new URL('themes/dark.css', sourceDirectory);
const outputDirectory = new URL('dist/', packageDirectory);
const output = new URL('tokens.css', outputDirectory);

const extractCanonicalBody = (source: string): string => {
  const marker = '@neoverse-dark-tokens';
  const markerIndex = source.indexOf(marker);
  const openingBrace = source.indexOf('{', markerIndex);

  if (markerIndex < 0 || openingBrace < 0) {
    throw new Error('Dark theme source is missing the canonical declaration body.');
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

  throw new Error('Dark theme source has an unclosed canonical declaration body.');
};

const indent = (source: string, spaces: number): string => {
  const prefix = ' '.repeat(spaces);
  return source
    .split('\n')
    .map((line) => (line.length === 0 ? line : `${prefix}${line}`))
    .join('\n');
};

export const renderDarkTheme = (source: string): string => {
  const body = extractCanonicalBody(source);

  return `@layer neoverse.tokens {
  @media (prefers-color-scheme: dark) {
    :root[data-theme='system'],
    :root:not([data-theme], .light, .dark) {
${indent(body, 6)}
    }
  }

  :root.dark:not([data-theme]),
  :root[data-theme='dark'] {
${indent(body, 4)}
  }
}`;
};

const sourceParts: string[] = [];
for (const fileName of sourceFiles) {
  sourceParts.push(await Bun.file(new URL(fileName, sourceDirectory)).text());
}
sourceParts.push(renderDarkTheme(await Bun.file(darkSource).text()));
const source = sourceParts.join('\n\n');

await mkdir(outputDirectory, { recursive: true });
await Bun.write(output, `${source}\n`);
