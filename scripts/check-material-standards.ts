import { readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dir, '..');
const errors: string[] = [];
for (const directory of ['packages/tokens/src/components', 'packages/tailwind/src/components']) {
  for (const file of await readdir(resolve(root, directory))) {
    if (!file.endsWith('.css')) continue;
    const path = `${directory}/${file}`;
    const source = (await Bun.file(resolve(root, path)).text()).replace(/\/\*[\s\S]*?\*\//g, '');
    if (
      directory.includes('/tokens/') &&
      /(?:color-mix|rgba?|hsla?|(?:radial|linear)-gradient)\(/.test(source)
    ) {
      errors.push(`${path}: component token must alias a shared recipe`);
    }
    const forbidden = [
      /blur\(\s*\d/,
      /--[\w-]*(?:transparency|alpha|blur|saturation)\s*:\s*\d+(?:\.\d+)?(?:%|px)/,
      /(?:^|[;{}\s])(?:--[\w-]*opacity|opacity)\s*:\s*(?:0?\.\d+|[1-9]\d?%)/,
      /(?:rgb|hsl)a?\([^;]*\/\s*\d+(?:\.\d+)?%/,
      /var\(--neoverse-color-[\w-]+\)\s+\d+(?:\.\d+)?%/,
    ];
    for (const pattern of forbidden) {
      if (pattern.test(source))
        errors.push(`${path}: independent optical value (${pattern.source})`);
    }
  }
}

// Adapter styles must consume the same vocabulary. Geometry and 0/1 visibility
// remain valid; translucent colors and numeric blur/intensity are not.
for (const directory of ['packages/vue/src', 'packages/react/src']) {
  for (const file of await readdir(resolve(root, directory), { recursive: true })) {
    if (!/\.(?:vue|tsx?|css)$/.test(file) || /\.test\./.test(file)) continue;
    const path = `${directory}/${file}`;
    const source = await Bun.file(resolve(root, path)).text();
    if (/blur\(\s*\d|(?:rgb|hsl)a?\([^)]*\/\s*\d|opacity\s*:\s*0\.\d/.test(source)) {
      errors.push(`${path}: adapter must consume shared optical roles`);
    }
  }
}

for (const theme of ['light', 'dark']) {
  const path = `packages/tokens/src/themes/${theme}.css`;
  const source = await Bun.file(resolve(root, path)).text();
  if (
    /--neoverse-material-(?:filter|transparency)-(?:subtle|elevated|immersive)\s*:/.test(source)
  ) {
    errors.push(`${path}: themes may change tint, not tier blur/filter/alpha`);
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('Material standards passed: component optics use shared material/effect roles.');
