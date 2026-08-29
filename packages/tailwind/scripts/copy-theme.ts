import { mkdir } from 'node:fs/promises';

const packageDirectory = new URL('../', import.meta.url);
const source = new URL('src/theme.css', packageDirectory);
const componentsSource = new URL('src/components.css', packageDirectory);
const outputDirectory = new URL('dist/', packageDirectory);
const output = new URL('theme.css', outputDirectory);
const componentsOutput = new URL('components.css', outputDirectory);

await mkdir(outputDirectory, { recursive: true });
await Promise.all([
  Bun.write(output, await Bun.file(source).text()),
  Bun.write(componentsOutput, await Bun.file(componentsSource).text()),
]);
