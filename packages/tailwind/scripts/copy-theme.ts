import { mkdir } from 'node:fs/promises';

const packageDirectory = new URL('../', import.meta.url);
const source = new URL('src/theme.css', packageDirectory);
const componentsSource = new URL('src/components.css', packageDirectory);
const componentsDirectory = new URL('src/components/', packageDirectory);
const outputDirectory = new URL('dist/', packageDirectory);
const output = new URL('theme.css', outputDirectory);
const componentsOutput = new URL('components.css', outputDirectory);

await mkdir(outputDirectory, { recursive: true });
const componentFacade = await Bun.file(componentsSource).text();
const componentFiles = [
  ...componentFacade.matchAll(/^@import ['"]\.\/components\/([^'"]+)['"];?$/gm),
].flatMap((match) => (match[1] === undefined ? [] : [match[1]]));

if (componentFiles.length === 0) {
  throw new Error('Tailwind component facade does not import any component stylesheets.');
}

const componentCss = (
  await Promise.all(
    componentFiles.map((fileName) => Bun.file(new URL(fileName, componentsDirectory)).text()),
  )
).join('\n\n');

await Promise.all([
  Bun.write(output, await Bun.file(source).text()),
  Bun.write(componentsOutput, `${componentCss}\n`),
]);
