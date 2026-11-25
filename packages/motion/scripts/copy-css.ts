import { mkdir } from 'node:fs/promises';

const packageDirectory = new URL('../', import.meta.url);
const outputDirectory = new URL('dist/', packageDirectory);

await mkdir(outputDirectory, { recursive: true });
await Promise.all(
  ['motion.css', 'appearance.css', 'page-transition.css', 'page-reveals.css'].map(async (name) => {
    const source = new URL(`src/${name}`, packageDirectory);
    await Bun.write(new URL(name, outputDirectory), await Bun.file(source).text());
  }),
);
