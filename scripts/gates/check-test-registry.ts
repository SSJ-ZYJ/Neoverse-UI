import { readdirSync } from 'node:fs';
import { basename, resolve } from 'node:path';

const root = resolve(import.meta.dir, '../..');
const e2eDirectory = resolve(root, 'tests/e2e');
const registryPath = resolve(root, 'docs/testing/README.md');
const registry = await Bun.file(registryPath).text();
const specs = readdirSync(e2eDirectory)
  .filter((name) => name.endsWith('.spec.ts'))
  .sort();
const errors: string[] = [];

for (const spec of specs) {
  if (!registry.includes(`\`${spec}\``)) {
    errors.push(`${spec}: browser spec is missing from docs/testing/README.md`);
  }
}

const registered = new Set(
  [...registry.matchAll(/^\| `([^`]+\.spec\.ts)` \|/gm)].map((match) => match[1] ?? ''),
);
for (const spec of registered) {
  if (!specs.includes(basename(spec))) {
    errors.push(`${spec}: registered browser spec does not exist in tests/e2e`);
  }
}

const crossBrowser = await Bun.file(resolve(root, 'playwright.cross-browser.config.ts')).text();
for (const match of crossBrowser.matchAll(/'\*\*\/([^']+\.spec\.ts)'/g)) {
  const spec = match[1] ?? '';
  if (!specs.includes(spec)) {
    errors.push(`${spec}: cross-browser config references a missing spec`);
  }
  if (!registered.has(spec)) {
    errors.push(`${spec}: cross-browser spec must be registered in docs/testing/README.md`);
  }
}

if (errors.length > 0) {
  console.error('Browser spec registry check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Browser spec registry passed for ${specs.length} specs.`);
