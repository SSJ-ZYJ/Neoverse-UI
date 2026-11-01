import { afterEach, describe, expect, test } from 'bun:test';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { releaseApiSmoke } from './release-api-smoke';

const directories: string[] = [];
afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true })));
});

function versions(version: string): Map<string, string> {
  return new Map(['react', 'vue', 'tokens'].map((name) => [`@neoverse-ui/${name}`, version]));
}

const reactExports = [
  'UiControlSurface',
  'UiNavigationItem',
  'UiSegmentedControl',
  'UiBadge',
  'UiStatusIndicator',
  'UiTooltipSurface',
  'UiSkeleton',
  'UiScrollbar',
  'UiTerminalSurface',
  'UiTerminalTranscript',
  'UiTerminalLine',
  'UiTerminalPrompt',
  'UiTerminalEcho',
  'UiStatCard',
  'UiTimeline',
  'UiStepFlow',
];

async function execute(
  smoke: string,
  options: { missingReact?: string; missingVueEcho?: boolean; missingToken?: boolean } = {},
) {
  const directory = await mkdtemp(join(tmpdir(), 'neoverse-release-api-'));
  directories.push(directory);
  const modules = {
    react: reactExports
      .filter((name) => name !== options.missingReact)
      .map((name) => `export function ${name}() {}`)
      .join('\n'),
    vue: `export const UiTerminalEcho = ${options.missingVueEcho ? 'undefined' : '{}'};`,
    tokens: `export const glassMaterial = ${JSON.stringify({
      name: { en: 'Aurora Glass', zh: '极光玻璃' },
      tiers: {
        subtle: { en: 'Light' },
        elevated: { en: 'Standard' },
        immersive: { en: 'Immersive' },
      },
    })};\nexport const cssVariables = ${JSON.stringify({
      components: {
        controlSurface: { trailingPadding: '--neoverse-control-surface-trailing-padding' },
        scrollbar: {
          immersive: {
            railInset: '--neoverse-scrollbar-immersive-rail-inset',
            ...(!options.missingToken && {
              thumbHoverBorderWidth: '--neoverse-scrollbar-immersive-thumb-hover-border-width',
            }),
          },
        },
      },
    })};`,
  };
  for (const [name, source] of Object.entries(modules)) {
    const moduleDirectory = join(directory, 'node_modules', '@neoverse-ui', name);
    await mkdir(moduleDirectory, { recursive: true });
    await writeFile(
      join(moduleDirectory, 'package.json'),
      JSON.stringify({ name: `@neoverse-ui/${name}`, type: 'module', exports: './index.js' }),
    );
    await writeFile(join(moduleDirectory, 'index.js'), source);
  }
  await writeFile(join(directory, 'smoke.ts'), smoke);
  const child = Bun.spawn([process.execPath, 'smoke.ts'], {
    cwd: directory,
    stdout: 'pipe',
    stderr: 'pipe',
  });
  const [exitCode, stderr] = await Promise.all([child.exited, new Response(child.stderr).text()]);
  return { exitCode, stderr };
}

describe('release API verification', () => {
  test('continues to accept the published 0.3.0 API baseline', async () => {
    const result = await execute(releaseApiSmoke(versions('0.3.0'), true), {
      missingReact: 'UiTerminalEcho',
      missingVueEcho: true,
      missingToken: true,
    });
    expect(result.exitCode).toBe(0);
  });

  test('checks unversioned local candidates before manifest versioning', async () => {
    const result = await execute(releaseApiSmoke(versions('0.3.0'), false), {
      missingReact: 'UiTerminalEcho',
    });
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain('missing React adapter: UiTerminalEcho');
  });

  test('accepts complete 0.3.1 registry APIs', async () => {
    const result = await execute(releaseApiSmoke(versions('0.3.1'), true));
    expect(result.exitCode).toBe(0);
  });

  test('rejects missing React parity exports in 0.3.1 registry packages', async () => {
    const result = await execute(releaseApiSmoke(versions('0.3.1'), true), {
      missingReact: 'UiScrollbar',
    });
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain('missing React adapter: UiScrollbar');
  });

  test('rejects a missing Vue Echo in 0.3.1 registry packages', async () => {
    const result = await execute(releaseApiSmoke(versions('0.3.1'), true), {
      missingVueEcho: true,
    });
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain('missing Vue terminal echo');
  });

  test('checks Tokens by its own version in a mixed-version release', async () => {
    const mixedVersions = versions('0.3.0');
    mixedVersions.set('@neoverse-ui/tokens', '0.3.1');
    const result = await execute(releaseApiSmoke(mixedVersions, true), {
      missingReact: 'UiTerminalEcho',
      missingVueEcho: true,
      missingToken: true,
    });
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain('public 0.3.1 token map is incomplete');
  });

  test('does not silently skip a package with a missing release version', () => {
    const incompleteVersions = versions('0.3.1');
    incompleteVersions.delete('@neoverse-ui/vue');
    expect(() => releaseApiSmoke(incompleteVersions, true)).toThrow(
      'Missing release version for @neoverse-ui/vue',
    );
  });
});
