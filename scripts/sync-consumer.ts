import { copyFile, mkdir, readdir, realpath, stat } from 'node:fs/promises';
import { isAbsolute, join, relative, resolve } from 'node:path';

// One local-development entrypoint for every consumer. file: packages are
// physical copies under Bun, so rebuilding the UI repository alone is insufficient.
const uiRoot = resolve(import.meta.dir, '..');
const consumerIndex = process.argv.indexOf('--consumer');
const consumerArgument = process.argv[consumerIndex + 1];
if (consumerIndex < 0 || !consumerArgument) {
  throw new Error('Usage: bun scripts/sync-consumer.ts --consumer <repository> [--skip-build]');
}
const consumerRoot = await realpath(resolve(consumerArgument));
const packageOrder = [
  'tokens',
  'motion',
  'overlay-runtime',
  'giscus-theme',
  'glass-runtime',
  'tailwind',
  'vue',
  'react',
];
const roots = [consumerRoot];
const consumerManifest = await Bun.file(join(consumerRoot, 'package.json')).json();
for (const pattern of ['apps/*/package.json', 'packages/*/package.json']) {
  for await (const manifest of new Bun.Glob(pattern).scan({ cwd: consumerRoot })) {
    roots.push(resolve(consumerRoot, manifest, '..'));
  }
}
const localPackages = new Set<string>();
for (const root of roots) {
  const manifest = await Bun.file(join(root, 'package.json')).json();
  for (const [name, specifier] of Object.entries({
    ...manifest.dependencies,
    ...manifest.devDependencies,
    ...manifest.overrides,
    ...consumerManifest.overrides,
  })) {
    if (
      !name.startsWith('@neoverse-ui/') ||
      typeof specifier !== 'string' ||
      !specifier.startsWith('file:')
    )
      continue;
    const shortName = name.slice('@neoverse-ui/'.length);
    const specifierRoot = Object.hasOwn(consumerManifest.overrides ?? {}, name)
      ? consumerRoot
      : root;
    const source = await realpath(resolve(specifierRoot, specifier.slice(5)));
    if (source !== (await realpath(join(uiRoot, 'packages', shortName)))) {
      throw new Error(`Local dependency points to another UI checkout: ${name}`);
    }
    localPackages.add(shortName);
  }
}
if (!localPackages.size) throw new Error('No local Neoverse-UI file: dependencies found');

const pending: string[] = [];
const visited = new Set<string>();
for (const root of roots) pending.push(join(root, 'node_modules', '@neoverse-ui'));
const copies = new Map<string, string>();
while (pending.length) {
  const scope = pending.shift();
  if (!scope) break;
  const entries = await readdir(scope).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') return [];
    throw error;
  });
  for (const name of entries) {
    const installed = await realpath(join(scope, name));
    if (visited.has(installed)) continue;
    visited.add(installed);
    pending.push(join(installed, 'node_modules', '@neoverse-ui'));
    if (localPackages.has(name)) copies.set(installed, name);
  }
}
for (const name of localPackages) {
  if (![...copies.values()].includes(name))
    throw new Error(`Install @neoverse-ui/${name} in the consumer first`);
  if (!packageOrder.includes(name)) throw new Error(`Unsupported local package: ${name}`);
}
if (!process.argv.includes('--skip-build')) {
  // Build prerequisite layers too; consumer manifests need not list transitives.
  const lastPackage = Math.max(...[...localPackages].map((name) => packageOrder.indexOf(name)));
  for (const name of packageOrder.slice(0, lastPackage + 1)) {
    const child = Bun.spawn([process.execPath, 'run', 'build'], {
      cwd: join(uiRoot, 'packages', name),
      stdout: 'inherit',
      stderr: 'inherit',
    });
    if ((await child.exited) !== 0) throw new Error(`UI build failed: ${name}`);
  }
}
for (const [installed, name] of copies) {
  const source = await realpath(join(uiRoot, 'packages', name));
  if (source !== installed) {
    // Never modify an unrelated checkout reached through a node_modules link.
    const difference = relative(consumerRoot, installed);
    if (
      !difference ||
      difference.startsWith('..') ||
      isAbsolute(difference) ||
      !difference.split(/[\\/]/).includes('node_modules')
    ) {
      throw new Error(`Installed package is outside consumer node_modules: ${installed}`);
    }
    // Overwrite generated files only. No recursive deletion or source changes.
    const output = join(installed, 'dist');
    const existingOutput = await stat(output).catch(() => undefined);
    if (existingOutput && (await realpath(output)) !== resolve(output)) {
      throw new Error(`Refusing to write through a linked dist directory: ${output}`);
    }
    for await (const file of new Bun.Glob('**/*').scan({
      cwd: join(source, 'dist'),
      onlyFiles: true,
    })) {
      const target = join(output, file);
      const expected = await Bun.file(join(source, 'dist', file)).arrayBuffer();
      const actual = (await Bun.file(target).exists())
        ? await Bun.file(target).arrayBuffer()
        : undefined;
      // Bun also uses hard links. Identical files must not be copied onto themselves.
      if (actual && Buffer.from(expected).equals(Buffer.from(actual))) continue;
      await mkdir(resolve(target, '..'), { recursive: true });
      await copyFile(join(source, 'dist', file), target);
    }
    const sourceManifest = await Bun.file(join(source, 'package.json')).text();
    if (sourceManifest !== (await Bun.file(join(installed, 'package.json')).text())) {
      await copyFile(join(source, 'package.json'), join(installed, 'package.json'));
    }
  }
  for await (const file of new Bun.Glob('**/*').scan({
    cwd: join(source, 'dist'),
    onlyFiles: true,
  })) {
    const expected = await Bun.file(join(source, 'dist', file)).arrayBuffer();
    const actual = await Bun.file(join(installed, 'dist', file)).arrayBuffer();
    if (!Buffer.from(expected).equals(Buffer.from(actual)))
      throw new Error(`Stale UI artifact: ${join(installed, 'dist', file)}`);
  }
  console.log(`[ui:sync] @neoverse-ui/${name}: ${installed}`);
}
