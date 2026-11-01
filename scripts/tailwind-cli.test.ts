import { describe, expect, test } from 'bun:test';
import { posix, win32 } from 'node:path';
import { fileURLToPath } from 'node:url';
import { findTailwindCli, readTailwindBinEntry, requireTailwindCli } from './tailwind-cli';

const manifest = JSON.stringify({
  name: '@tailwindcss/cli',
  version: '4.3.3',
  bin: { tailwindcss: './dist/index.mjs' },
});

const lookup = (platform: NodeJS.Platform, present: Record<string, string> = {}) => ({
  platform,
  exists: (path: string) => Object.keys(present).includes(path),
  readFile: (path: string) => present[path] ?? '',
  normalize: (value: string) =>
    platform === 'win32' ? win32.resolve(value) : posix.resolve(value),
});

describe('tailwind CLI lookup', () => {
  test('reads the tailwindcss bin entry from both manifest shapes', () => {
    expect(readTailwindBinEntry({ bin: { tailwindcss: './dist/index.mjs' } })).toBe(
      './dist/index.mjs',
    );
    expect(readTailwindBinEntry({ bin: { other: './x.mjs' } })).toBeUndefined();
    expect(readTailwindBinEntry({ bin: './single.mjs' })).toBe('./single.mjs');
    expect(readTailwindBinEntry({})).toBeUndefined();
  });

  test('resolves the package-local CLI entry and its JavaScript file', () => {
    const dir = 'D:\\repo\\packages\\tailwind';
    const manifestPath =
      'D:\\repo\\packages\\tailwind\\node_modules\\@tailwindcss\\cli\\package.json';
    expect(findTailwindCli(dir, lookup('win32', { [manifestPath]: manifest }))).toBe(
      'D:\\repo\\packages\\tailwind\\node_modules\\@tailwindcss\\cli\\dist\\index.mjs',
    );
  });

  test('resolves the hoisted install that bun creates at the repository root', () => {
    const dir = 'D:\\repo\\packages\\tailwind';
    const manifestPath = 'D:\\repo\\node_modules\\@tailwindcss\\cli\\package.json';
    expect(findTailwindCli(dir, lookup('win32', { [manifestPath]: manifest }))).toBe(
      'D:\\repo\\node_modules\\@tailwindcss\\cli\\dist\\index.mjs',
    );
  });

  test('produces a POSIX path on Linux, never a Windows .exe shim', () => {
    const dir = '/repo/packages/tailwind';
    const manifestPath = '/repo/node_modules/@tailwindcss/cli/package.json';
    const cli = findTailwindCli(dir, lookup('linux', { [manifestPath]: manifest }));
    expect(cli).toBe('/repo/node_modules/@tailwindcss/cli/dist/index.mjs');
    expect(cli).not.toContain('.exe');
    expect(cli).not.toContain('\\');
  });

  test('prefers the nearest install when every level provides one', () => {
    const dir = 'D:\\repo\\packages\\tailwind';
    const localManifest =
      'D:\\repo\\packages\\tailwind\\node_modules\\@tailwindcss\\cli\\package.json';
    const hoistedManifest = 'D:\\repo\\node_modules\\@tailwindcss\\cli\\package.json';
    expect(
      findTailwindCli(
        dir,
        lookup('win32', { [localManifest]: manifest, [hoistedManifest]: manifest }),
      ),
    ).toBe('D:\\repo\\packages\\tailwind\\node_modules\\@tailwindcss\\cli\\dist\\index.mjs');
  });

  test('keeps walking past a corrupt manifest instead of crashing the watcher', () => {
    const dir = '/repo/packages/tailwind';
    const corrupt = '/repo/packages/tailwind/node_modules/@tailwindcss/cli/package.json';
    const healthy = '/repo/node_modules/@tailwindcss/cli/package.json';
    expect(
      findTailwindCli(dir, lookup('linux', { [corrupt]: '{ not json', [healthy]: manifest })),
    ).toBe('/repo/node_modules/@tailwindcss/cli/dist/index.mjs');
  });

  test('returns undefined when the CLI is absent', () => {
    expect(findTailwindCli('D:\\repo\\packages\\tailwind', lookup('win32'))).toBeUndefined();
  });

  test('fails with an actionable message when the install has no CLI', () => {
    expect(() => requireTailwindCli('/repo/packages/tailwind', lookup('linux'))).toThrow(
      'Run bun install',
    );
  });

  test('resolves the real workspace install on the current platform', () => {
    const packageDirectory = fileURLToPath(new URL('../packages/tailwind/', import.meta.url));
    const cli = findTailwindCli(packageDirectory);
    expect(cli).toBeString();
    expect(cli?.endsWith('index.mjs')).toBe(true);
    expect(exists(cli as string)).toBe(true);
  });
});

const exists = (path: string): boolean => {
  try {
    return Bun.file(path).size > 0;
  } catch {
    return false;
  }
};
