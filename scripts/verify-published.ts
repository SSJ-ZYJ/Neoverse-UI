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

export class PublicationPendingError extends Error {}

export function validatePublishedPackage(
  expected: ReleasePackage,
  metadata: RegistryMetadata,
  versions: ReadonlyMap<string, string>,
): void {
  const published = metadata.versions?.[expected.version];
  if (!published) {
    throw new PublicationPendingError(
      `${expected.name}@${expected.version}: exact published version is missing`,
    );
  }
  if (
    metadata.name !== expected.name ||
    published.name !== expected.name ||
    published.version !== expected.version
  ) {
    throw new Error(`${expected.name}: published identity differs from the release`);
  }
  if (metadata['dist-tags']?.latest !== expected.version) {
    throw new PublicationPendingError(
      `${expected.name}: latest does not match release version ${expected.version}`,
    );
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

type RegistryWaitOptions = {
  timeoutMs?: number;
  intervalMs?: number;
  now?: () => number;
  sleep?: (milliseconds: number) => Promise<unknown>;
  fetch?: (input: URL | string, init?: RequestInit) => Promise<Response>;
  log?: (message: string) => void;
};

export async function waitForPublishedPackages(
  packages: readonly ReleasePackage[],
  options: RegistryWaitOptions = {},
): Promise<void> {
  const timeoutMs = options.timeoutMs ?? 300_000;
  const intervalMs = options.intervalMs ?? 10_000;
  const now = options.now ?? Date.now;
  const sleep = options.sleep ?? Bun.sleep;
  const request = options.fetch ?? fetch;
  const log = options.log ?? console.log;
  const deadline = now() + timeoutMs;
  const versions = new Map(packages.map((pkg) => [pkg.name, pkg.version]));
  const pending = new Map(packages.map((pkg) => [pkg.name, pkg]));

  async function registryRequest(url: URL | string, method = 'GET') {
    const remaining = deadline - now();
    if (remaining <= 0) throw new PublicationPendingError('registry wait deadline reached');
    let response: Response;
    try {
      response = await request(url, {
        method,
        redirect: 'error',
        headers: { 'Cache-Control': 'no-cache' },
        signal: AbortSignal.timeout(Math.min(15_000, remaining)),
      });
    } catch (error) {
      throw new PublicationPendingError(`registry request failed: ${String(error)}`);
    }
    if (response.status === 404 || response.status === 429 || response.status >= 500) {
      throw new PublicationPendingError(`registry returned HTTP ${response.status}`);
    }
    if (!response.ok) throw new Error(`registry returned HTTP ${response.status} for ${url}`);
    return response;
  }

  while (pending.size > 0) {
    const waiting: string[] = [];
    for (const [name, expected] of pending) {
      try {
        const response = await registryRequest(
          new URL(encodeURIComponent(name), 'https://registry.npmjs.org/'),
        );
        let metadata: RegistryMetadata;
        try {
          metadata = (await response.json()) as RegistryMetadata;
        } catch (error) {
          if (error instanceof SyntaxError) throw error;
          throw new PublicationPendingError(`registry response interrupted: ${String(error)}`);
        }
        validatePublishedPackage(expected, metadata, versions);
        const tarball = metadata.versions?.[expected.version]?.dist?.tarball;
        if (!tarball) throw new Error(`${name}: missing validated tarball`);
        await registryRequest(tarball, 'HEAD');
        pending.delete(name);
        log(`Registry verified: ${name}@${expected.version}`);
      } catch (error) {
        if (!(error instanceof PublicationPendingError)) throw error;
        waiting.push(`${name}: ${error.message}`);
      }
    }
    if (pending.size === 0) return;
    const remaining = deadline - now();
    if (remaining <= 0) {
      throw new Error(
        `npm publication did not propagate within ${timeoutMs / 1000}s:\n${waiting.join('\n')}`,
      );
    }
    log(
      `Waiting for npm propagation (${Math.ceil(remaining / 1000)}s remaining):\n${waiting.join('\n')}`,
    );
    await sleep(Math.min(intervalMs, remaining));
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
