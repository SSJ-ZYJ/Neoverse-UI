import { mkdir } from 'node:fs/promises';

const packageDirectory = new URL('../', import.meta.url);
const outputDirectory = new URL('dist/', packageDirectory);

await mkdir(outputDirectory, { recursive: true });
await Bun.write(
  new URL('index.css', outputDirectory),
  await Bun.file(new URL('src/index.css', packageDirectory)).text(),
);
