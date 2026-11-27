import { mkdir } from 'node:fs/promises';
import { materialRecipes } from './material-recipes.js';

const packageDirectory = new URL('../', import.meta.url);
const sourceDirectory = new URL('src/', packageDirectory);
const source = new URL('theme.css', sourceDirectory);
const componentsSource = new URL('components.css', sourceDirectory);
const outputDirectory = new URL('dist/', packageDirectory);
const output = new URL('theme.css', outputDirectory);
const componentsOutput = new URL('components.css', outputDirectory);
const proseSource = new URL('components/prose/prose.css', sourceDirectory);
const tableSource = new URL('components/display/table.css', sourceDirectory);
const disclosureSource = new URL('components/display/disclosure.css', sourceDirectory);
const proseOutput = new URL('prose.css', outputDirectory);
await mkdir(outputDirectory, { recursive: true });
const componentFacade = await Bun.file(componentsSource).text();
const componentFiles = [
  ...componentFacade.matchAll(/^@import ['"]\.\/((?:materials|components)\/[^'"]+)['"];?$/gm),
].flatMap((match) => (match[1] === undefined ? [] : [match[1]]));

if (componentFiles.length === 0) {
  throw new Error('Tailwind component facade does not import any component stylesheets.');
}

const componentCss = (
  await Promise.all(
    componentFiles.map((fileName) => Bun.file(new URL(fileName, sourceDirectory)).text()),
  )
).join('\n\n');

await Promise.all([
  Bun.write(output, materialRecipes(await Bun.file(source).text())),
  Bun.write(componentsOutput, `${materialRecipes(componentCss)}\n`),
  Bun.write(
    proseOutput,
    materialRecipes(
      [
        await Bun.file(tableSource).text(),
        await Bun.file(disclosureSource).text(),
        await Bun.file(proseSource).text(),
      ].join('\n\n'),
    ),
  ),
]);
