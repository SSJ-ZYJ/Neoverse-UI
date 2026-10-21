import { expect, test } from 'bun:test';
import { copyFile, link, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const uiRoot = resolve(import.meta.dir, '..');
const source = join(uiRoot, 'packages', 'tokens');
const run = (consumer: string) =>
  Bun.spawn(
    [
      process.execPath,
      join(import.meta.dir, 'sync-consumer.ts'),
      '--consumer',
      consumer,
      '--skip-build',
    ],
    { stdout: 'pipe', stderr: 'pipe' },
  );

test('syncs stale and nested file: copies, respects root overrides, and tolerates hard links', async () => {
  // Hard links must live on the same volume as the UI checkout on Windows.
  const consumer = await mkdtemp(join(uiRoot, 'node_modules', '.sync-consumer-'));
  try {
    const installed = join(consumer, 'node_modules', '@neoverse-ui', 'tokens');
    const nested = join(installed, 'node_modules', '@neoverse-ui', 'tokens');
    await mkdir(join(installed, 'dist'), { recursive: true });
    await mkdir(join(nested, 'dist'), { recursive: true });
    await mkdir(join(consumer, 'apps', 'web'), { recursive: true });
    await writeFile(
      join(consumer, 'package.json'),
      JSON.stringify({ overrides: { '@neoverse-ui/tokens': `file:${source}` } }),
    );
    await writeFile(
      join(consumer, 'apps', 'web', 'package.json'),
      JSON.stringify({ dependencies: { '@neoverse-ui/tokens': 'file:./obsolete-checkout' } }),
    );
    for (const target of [installed, nested]) {
      await copyFile(join(source, 'package.json'), join(target, 'package.json'));
      await writeFile(join(target, 'dist', 'tokens.css'), 'stale CSS');
    }
    await link(join(source, 'dist', 'index.js'), join(installed, 'dist', 'index.js'));
    const before = await readFile(join(source, 'dist', 'index.js'), 'utf8');
    const child = run(consumer);
    const error = await new Response(child.stderr).text();
    expect(await child.exited, error).toBe(0);
    for (const target of [installed, nested]) {
      expect(await readFile(join(target, 'dist', 'tokens.css'), 'utf8')).toBe(
        await readFile(join(source, 'dist', 'tokens.css'), 'utf8'),
      );
    }
    expect(await readFile(join(source, 'dist', 'index.js'), 'utf8')).toBe(before);
  } finally {
    await rm(consumer, { recursive: true, force: true });
  }
});

test('does not synchronize registry dependencies', async () => {
  const consumer = await mkdtemp(join(tmpdir(), 'neoverse-ui-consumer-'));
  try {
    await writeFile(
      join(consumer, 'package.json'),
      JSON.stringify({ dependencies: { '@neoverse-ui/tokens': '^0.2.0' } }),
    );
    const child = run(consumer);
    const error = await new Response(child.stderr).text();
    expect(await child.exited).not.toBe(0);
    expect(error).toContain('No local Neoverse-UI file: dependencies found');
  } finally {
    await rm(consumer, { recursive: true, force: true });
  }
});

test('refuses an installed package link outside the consumer', async () => {
  const consumer = await mkdtemp(join(tmpdir(), 'neoverse-ui-consumer-'));
  const external = await mkdtemp(join(tmpdir(), 'neoverse-ui-external-'));
  try {
    await writeFile(
      join(consumer, 'package.json'),
      JSON.stringify({ dependencies: { '@neoverse-ui/tokens': `file:${source}` } }),
    );
    await mkdir(join(consumer, 'node_modules', '@neoverse-ui'), { recursive: true });
    await symlink(external, join(consumer, 'node_modules', '@neoverse-ui', 'tokens'), 'junction');
    const child = run(consumer);
    const error = await new Response(child.stderr).text();
    expect(await child.exited).not.toBe(0);
    expect(error).toContain('Installed package is outside consumer node_modules');
  } finally {
    await rm(consumer, { recursive: true, force: true });
    await rm(external, { recursive: true, force: true });
  }
});
