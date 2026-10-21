import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

export type ReleasePackage = {
  name: string;
  version: string;
  dependencies?: Record<string, string>;
};

export type RegistryMetadata = {
  name?: string;
  'dist-tags'?: { latest?: string };
  versions?: Record<string, ReleasePackage & { dist?: { tarball?: string } }>;
};

export function validatePublishedPackage(
  expected: ReleasePackage,
  metadata: RegistryMetadata,
  versions: ReadonlyMap<string, string>,
): void {
  const published = metadata.versions?.[expected.version];
  if (metadata.name !== expected.name || published?.name !== expected.name) {
    throw new Error(`${expected.name}@${expected.version}: exact published version is missing`);
  }
  if (
    published.version !== expected.version ||
    metadata['dist-tags']?.latest !== expected.version
  ) {
    throw new Error(`${expected.name}: latest does not match release version ${expected.version}`);
  }
  const tarball = published.dist?.tarball;
  if (!tarball || new URL(tarball).origin !== 'https://registry.npmjs.org') {
    throw new Error(`${expected.name}: tarball must come from the official npm registry`);
  }
  for (const [name, range] of Object.entries(published.dependencies ?? {})) {
    if (!name.startsWith('@neoverse-ui/')) continue;
    const version = versions.get(name);
    if (!version || !Bun.semver.satisfies(version, range)) {
      throw new Error(`${expected.name}: published ${name}@${range} excludes release ${version}`);
    }
    if (range !== expected.dependencies?.[name]) {
      throw new Error(`${expected.name}: published dependency ${name} differs from the release`);
    }
  }
  for (const name of Object.keys(expected.dependencies ?? {})) {
    if (name.startsWith('@neoverse-ui/') && !published.dependencies?.[name]) {
      throw new Error(`${expected.name}: published dependency ${name} is missing`);
    }
  }
}

export async function verifyInstalledPackages(
  consumerDirectory: string,
  packages: readonly ReleasePackage[],
): Promise<void> {
  const versions = new Map(packages.map((pkg) => [pkg.name, pkg.version]));
  for (const expected of packages) {
    const directory = join(consumerDirectory, 'node_modules', expected.name);
    const installed = JSON.parse(
      await readFile(join(directory, 'package.json'), 'utf8'),
    ) as ReleasePackage;
    if (installed.name !== expected.name || installed.version !== expected.version) {
      throw new Error(`${expected.name}: installed version differs from ${expected.version}`);
    }
    for (const name of Object.keys(installed.dependencies ?? {})) {
      if (!name.startsWith('@neoverse-ui/')) continue;
      let parent = dirname(Bun.resolveSync(name, directory));
      while (!existsSync(join(parent, 'package.json'))) {
        const next = dirname(parent);
        if (next === parent) throw new Error(`${expected.name}: cannot locate dependency ${name}`);
        parent = next;
      }
      const dependency = JSON.parse(
        await readFile(join(parent, 'package.json'), 'utf8'),
      ) as ReleasePackage;
      if (dependency.name !== name || dependency.version !== versions.get(name)) {
        throw new Error(
          `${expected.name}: resolved ${name}@${dependency.version} outside the release`,
        );
      }
    }
  }
}
