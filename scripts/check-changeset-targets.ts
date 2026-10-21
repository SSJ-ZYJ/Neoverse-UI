import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dir, '..');
const workspaceDirs = ['apps', 'packages'];
const packages = new Map<string, boolean>();

for (const directory of workspaceDirs) {
  const parent = join(root, directory);
  if (!existsSync(parent)) continue;
  for (const entry of readdirSync(parent, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const manifest = join(parent, entry.name, 'package.json');
    if (!existsSync(manifest)) continue;
    const pkg = JSON.parse(readFileSync(manifest, 'utf8')) as {
      name?: string;
      private?: boolean;
    };
    if (pkg.name) packages.set(pkg.name, pkg.private === true);
  }
}

const changesetDir = join(root, '.changeset');
const invalid: string[] = [];

for (const filename of readdirSync(changesetDir)) {
  if (!filename.endsWith('.md') || filename === 'README.md') continue;
  const text = readFileSync(join(changesetDir, filename), 'utf8');
  const frontmatter = /^---\s*\r?\n([\s\S]*?)\r?\n---/u.exec(text)?.[1];
  if (!frontmatter) continue;
  const targets = [
    ...frontmatter.matchAll(/^\s*['"]?([^'"\s:]+)['"]?\s*:\s*(major|minor|patch)\s*$/gmu),
  ].map((match) => match[1]);
  if (targets.length > 0 && targets.every((target) => packages.get(target) === true)) {
    invalid.push(`${filename}: ${targets.join(', ')}`);
  }
}

if (invalid.length > 0) {
  console.error(
    'Private-only Changesets block public releases without creating publishable versions:',
  );
  for (const item of invalid) console.error(`  ${item}`);
  process.exitCode = 1;
} else {
  console.log('Changesets validated: no private-only release entries.');
}
