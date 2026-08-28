import { mkdir } from 'node:fs/promises';

const packageDirectory = new URL('../', import.meta.url);
const source = new URL('src/theme.css', packageDirectory);
const outputDirectory = new URL('dist/', packageDirectory);
const output = new URL('theme.css', outputDirectory);

await mkdir(outputDirectory, { recursive: true });
await Bun.write(output, await Bun.file(source).text());
