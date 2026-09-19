import { mkdir } from 'node:fs/promises';

const packageDirectory = new URL('../', import.meta.url);
const sourceDirectory = new URL('src/', packageDirectory);
const outputDirectory = new URL('dist/', packageDirectory);

await mkdir(outputDirectory, { recursive: true });

await Promise.all(
  ['giscus-light.css', 'giscus-dark.css'].map(async (fileName) => {
    await Bun.write(
      new URL(fileName, outputDirectory),
      await Bun.file(new URL(fileName, sourceDirectory)).text(),
    );
  }),
);
