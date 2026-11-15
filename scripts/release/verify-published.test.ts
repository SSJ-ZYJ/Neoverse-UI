import { afterEach, describe, expect, test } from 'bun:test';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  type RegistryMetadata,
  type ReleasePackage,
  validatePublishedPackage,
  verifyInstalledPackages,
  waitForPublishedPackages,
} from './verify-published';

const expected: ReleasePackage = {
  name: '@neoverse-ui/vue',
  version: '0.3.0',
  dependencies: { '@neoverse-ui/tokens': '^0.3.0' },
};
const versions = new Map([['@neoverse-ui/tokens', '0.3.0']]);
function metadata(): RegistryMetadata {
  return {
    name: expected.name,
    'dist-tags': { latest: expected.version },
    versions: {
      '0.3.0': {
        ...expected,
        dependencies: { ...expected.dependencies },
        dist: { tarball: 'https://registry.npmjs.org/@neoverse-ui/vue/-/vue-0.3.0.tgz' },
      },
    },
  };
}

describe('published release metadata', () => {
  test('accepts the exact official release and coordinated dependency ranges', () => {
    expect(() => validatePublishedPackage(expected, metadata(), versions)).not.toThrow();
  });
  test('rejects a registered name without the requested version', () => {
    expect(() => validatePublishedPackage(expected, { name: expected.name }, versions)).toThrow(
      'exact published version is missing',
    );
  });
  test('rejects latest still pointing at the previous release', () => {
    const value = metadata();
    value['dist-tags'] = { latest: '0.2.0' };
    expect(() => validatePublishedPackage(expected, value, versions)).toThrow('latest');
  });
  test('rejects dependency ranges hidden by local overrides in a tarball smoke', () => {
    const value = metadata();
    const published = value.versions?.['0.3.0'];
    if (!published) throw new Error('Missing fixture');
    published.dependencies = { '@neoverse-ui/tokens': '^0.2.0' };
    expect(() => validatePublishedPackage(expected, value, versions)).toThrow('excludes release');
  });
  test('rejects missing runtime dependencies', () => {
    const value = metadata();
    const published = value.versions?.['0.3.0'];
    if (!published) throw new Error('Missing fixture');
    published.dependencies = {};
    expect(() => validatePublishedPackage(expected, value, versions)).toThrow('is missing');
  });
  test('rejects unofficial tarball origins', () => {
    const value = metadata();
    const published = value.versions?.['0.3.0'];
    if (!published) throw new Error('Missing fixture');
    published.dist = { tarball: 'https://example.com/vue.tgz' };
    expect(() => validatePublishedPackage(expected, value, versions)).toThrow(
      'official npm registry',
    );
  });
});

describe('npm propagation wait', () => {
  const release: ReleasePackage = { name: expected.name, version: expected.version };
  function ready() {
    const value = metadata();
    const published = value.versions?.[release.version];
    if (!published) throw new Error('Missing fixture');
    published.dependencies = {};
    return value;
  }

  function harness(respond: (method: string, call: number) => Response | Promise<Response>) {
    let time = 0;
    let calls = 0;
    const delays: number[] = [];
    const messages: string[] = [];
    return {
      delays,
      messages,
      options: {
        timeoutMs: 100,
        intervalMs: 10,
        now: () => time,
        sleep: async (milliseconds: number) => {
          delays.push(milliseconds);
          time += milliseconds;
        },
        fetch: async (_input: URL | string, init?: RequestInit) => {
          expect(init?.headers).toEqual({ 'Cache-Control': 'no-cache' });
          return respond(init?.method ?? 'GET', ++calls);
        },
        log: (message: string) => messages.push(message),
      },
    };
  }

  test('waits through missing versions, stale latest and unavailable tarballs', async () => {
    const stale = ready();
    stale['dist-tags'] = { latest: '0.2.0' };
    const responses = [
      Response.json({ name: release.name }),
      Response.json(stale),
      Response.json(ready()),
      new Response(null, { status: 404 }),
      Response.json(ready()),
      new Response(null, { status: 200 }),
    ];
    const value = harness((method, call) => {
      expect(method).toBe(call === 4 || call === 6 ? 'HEAD' : 'GET');
      const response = responses.shift();
      if (!response) throw new Error('Unexpected request');
      return response;
    });
    await waitForPublishedPackages([release], value.options);
    expect(value.delays).toEqual([10, 10, 10]);
    expect(value.messages.at(-1)).toBe(`Registry verified: ${release.name}@${release.version}`);
    expect(responses).toHaveLength(0);
  });

  test('retries registry outages and request timeouts before installing packages', async () => {
    const value = harness((method, call) => {
      if (call <= 3) return new Response(null, { status: [404, 429, 503][call - 1] ?? 503 });
      if (call === 4) throw new DOMException('request timed out', 'TimeoutError');
      return method === 'HEAD' ? new Response(null) : Response.json(ready());
    });
    await waitForPublishedPackages([release], value.options);
    expect(value.delays).toHaveLength(4);
  });

  test('stops at the shared deadline when a release never becomes visible', async () => {
    const value = harness(() => Response.json({ name: release.name }));
    await expect(
      waitForPublishedPackages([release], { ...value.options, timeoutMs: 20 }),
    ).rejects.toThrow('npm publication did not propagate within 0.02s');
    expect(value.delays).toEqual([10, 10]);
  });

  test('does not retry authentication errors', async () => {
    const value = harness(() => new Response(null, { status: 401 }));
    await expect(waitForPublishedPackages([release], value.options)).rejects.toThrow('HTTP 401');
    expect(value.delays).toEqual([]);
  });

  test('does not hide malformed registry metadata behind retries', async () => {
    const value = harness(() => new Response('invalid json'));
    await expect(waitForPublishedPackages([release], value.options)).rejects.toBeInstanceOf(
      SyntaxError,
    );
    expect(value.delays).toEqual([]);
  });

  test('does not retry incorrect package contents', async () => {
    const invalid = ready();
    const published = invalid.versions?.[release.version];
    if (!published) throw new Error('Missing fixture');
    published.dependencies = { '@neoverse-ui/tokens': '^0.2.0' };
    const value = harness(() => Response.json(invalid));
    await expect(waitForPublishedPackages([release], value.options)).rejects.toThrow(
      'excludes release',
    );
    expect(value.delays).toEqual([]);
  });
});

describe('installed registry dependency graph', () => {
  const fixtures: string[] = [];
  afterEach(async () => {
    for (const fixture of fixtures.splice(0)) await rm(fixture, { recursive: true, force: true });
  });

  async function fixture(nestedVersion?: string) {
    const directory = await mkdtemp(join(tmpdir(), 'neoverse-published-graph-'));
    fixtures.push(directory);
    const packages: ReleasePackage[] = [
      expected,
      { name: '@neoverse-ui/tokens', version: '0.3.0' },
    ];
    const entries = packages.map((pkg) => ({
      directory: join(directory, 'node_modules', pkg.name),
      pkg,
    }));
    if (nestedVersion) {
      entries.push({
        directory: join(
          directory,
          'node_modules/@neoverse-ui/vue/node_modules/@neoverse-ui/tokens',
        ),
        pkg: { name: '@neoverse-ui/tokens', version: nestedVersion },
      });
    }
    for (const entry of entries) {
      await mkdir(entry.directory, { recursive: true });
      await writeFile(
        join(entry.directory, 'package.json'),
        JSON.stringify({ ...entry.pkg, main: 'index.js' }),
      );
      await writeFile(join(entry.directory, 'index.js'), 'export {};\n');
    }
    return { directory, packages };
  }

  test('accepts exact installed versions and the real hoisted dependency resolution', async () => {
    const value = await fixture();
    await verifyInstalledPackages(value.directory, value.packages);
  });

  test('rejects a stale nested dependency even with a correct top-level version', async () => {
    const value = await fixture('0.2.0');
    await expect(verifyInstalledPackages(value.directory, value.packages)).rejects.toThrow(
      'resolved @neoverse-ui/tokens@0.2.0 outside the release',
    );
  });

  test('rejects a top-level version outside the exact release', async () => {
    const value = await fixture();
    const packages = value.packages.map((pkg) => ({ ...pkg, version: '0.2.0' }));
    await expect(verifyInstalledPackages(value.directory, packages)).rejects.toThrow(
      'installed version differs',
    );
  });
});
