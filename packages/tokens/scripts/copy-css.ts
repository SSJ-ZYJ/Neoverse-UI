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
  'themes.css',
] as const;
const outputDirectory = new URL('dist/', packageDirectory);
const output = new URL('tokens.css', outputDirectory);

const sourceParts: string[] = [];
for (const fileName of sourceFiles) {
  sourceParts.push(await Bun.file(new URL(fileName, sourceDirectory)).text());
}
const source = sourceParts.join('\n\n');

await mkdir(outputDirectory, { recursive: true });
await Bun.write(output, `${source}\n`);
