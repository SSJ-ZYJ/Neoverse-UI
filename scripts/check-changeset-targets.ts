import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseChangesetFile } from '@changesets/parse';

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
  try {
    const targets = parseChangesetFile(text).releases.map((release) => release.name);
    const unknown = targets.filter((target) => !packages.has(target));
    if (unknown.length > 0) {
      invalid.push(`${filename}: unknown workspace packages: ${unknown.join(', ')}`);
    } else if (targets.length > 0 && targets.every((target) => packages.get(target) === true)) {
      invalid.push(`${filename}: private-only targets: ${targets.join(', ')}`);
    }
  } catch (error) {
    invalid.push(`${filename}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

if (invalid.length > 0) {
  console.error('Invalid Changesets would block public versioning or publishing:');
  for (const item of invalid) console.error(`  ${item}`);
  process.exitCode = 1;
} else {
  console.log('Changesets validated: valid workspace targets, no private-only release entries.');
}
