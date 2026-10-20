import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const registry = 'https://registry.npmjs.org/';
const packagesDirectory = join(import.meta.dir, '../packages');

type PackageManifest = {
  name: string;
  version: string;
  private?: boolean;
  dependencies?: Record<string, string>;
};

async function main() {
  const packages: PackageManifest[] = [];
  for (const entry of await readdir(packagesDirectory, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const manifest: PackageManifest = JSON.parse(
      await readFile(join(packagesDirectory, entry.name, 'package.json'), 'utf8'),
    );
    if (!manifest.private) packages.push(manifest);
  }
  packages.sort((a, b) => a.name.localeCompare(b.name));
  if (packages.length === 0) throw new Error('No public packages found.');

  const results = await Promise.all(
    packages.map(async (manifest) => {
      const requiredBy = packages
        .filter((consumer) => consumer.dependencies?.[manifest.name] !== undefined)
        .map((consumer) => consumer.name);
      try {
        const response = await fetch(new URL(encodeURIComponent(manifest.name), registry), {
          headers: { Accept: 'application/json' },
          redirect: 'error',
          signal: AbortSignal.timeout(15_000),
        });
        if (response.status === 404) {
          return {
            name: manifest.name,
            version: manifest.version,
            requiredBy,
            status: 'bootstrap-required' as const,
          };
        }
        if (!response.ok) throw new Error(`Registry returned HTTP ${response.status}.`);
        const metadata = (await response.json()) as { name?: string; versions?: unknown };
        if (
          metadata.name !== manifest.name ||
          !metadata.versions ||
          typeof metadata.versions !== 'object' ||
          Object.keys(metadata.versions).length === 0
        ) {
          throw new Error('Registry metadata does not identify a published package.');
        }
        return {
          name: manifest.name,
          version: manifest.version,
          requiredBy,
          status: 'registered' as const,
        };
      } catch (error) {
        return {
          name: manifest.name,
          version: manifest.version,
          requiredBy,
          status: 'unavailable' as const,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }),
  );
  const ready = results.every((result) => result.status === 'registered');
  console.log(
    JSON.stringify(
      {
        registry,
        ready,
        policy:
          'Read-only first-publication gate, not authorization to publish. Registered packages still require manual Trusted Publisher verification for SSJ-ZYJ/Neoverse-UI, release.yml, environment npm.',
        packages: results,
      },
      null,
      2,
    ),
  );
  if (!ready) process.exitCode = 1;
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
