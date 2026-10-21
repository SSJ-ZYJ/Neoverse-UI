import { afterEach, describe, expect, test } from 'bun:test';
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dir, '..');
const fixtures: string[] = [];

afterEach(() => {
  for (const fixture of fixtures.splice(0)) rmSync(fixture, { recursive: true, force: true });
});

function check(frontmatter?: string) {
  const fixture = mkdtempSync(join(tmpdir(), 'neoverse-changeset-targets-'));
  fixtures.push(fixture);
  for (const directory of ['scripts', '.changeset', 'apps/playground', 'packages/vue']) {
    mkdirSync(join(fixture, directory), { recursive: true });
  }
  copyFileSync(join(root, 'scripts/check-changeset-targets.ts'), join(fixture, 'scripts/check.ts'));
  symlinkSync(join(root, 'node_modules'), join(fixture, 'node_modules'), 'junction');
  writeFileSync(
    join(fixture, 'apps/playground/package.json'),
    JSON.stringify({ name: '@neoverse-ui/playground', private: true }),
  );
  writeFileSync(
    join(fixture, 'packages/vue/package.json'),
    JSON.stringify({ name: '@neoverse-ui/vue', version: '0.3.0' }),
  );
  writeFileSync(join(fixture, '.changeset/README.md'), 'Not a changeset.');
  if (frontmatter !== undefined) {
    writeFileSync(join(fixture, '.changeset/example.md'), `---\n${frontmatter}\n---\n\nExample.\n`);
  }
  const result = Bun.spawnSync([process.execPath, join(fixture, 'scripts/check.ts')], {
    cwd: fixture,
    stdout: 'pipe',
    stderr: 'pipe',
  });
  return {
    exitCode: result.exitCode,
    output: new TextDecoder().decode(result.stdout) + new TextDecoder().decode(result.stderr),
  };
}

describe('Changeset target CLI', () => {
  test.each([
    "'@neoverse-ui/playground': patch",
    "'@neoverse-ui/playground': patch # internal-only",
    '{ "@neoverse-ui/playground": patch }',
  ])('rejects private-only YAML: %s', (frontmatter) => {
    const result = check(frontmatter);
    expect(result.exitCode).toBe(1);
    expect(result.output).toContain('example.md');
    expect(result.output).toContain('@neoverse-ui/playground');
  });

  test.each([undefined, '{}', "'@neoverse-ui/vue': minor # public", "'@neoverse-ui/vue': none"])(
    'accepts public or empty release entries: %s',
    (frontmatter) => {
      expect(check(frontmatter).exitCode).toBe(0);
    },
  );

  test('accepts a public release with an accompanying private target', () => {
    expect(check("'@neoverse-ui/vue': patch\n'@neoverse-ui/playground': patch").exitCode).toBe(0);
  });

  test.each([
    "'@neoverse-ui/missing': patch",
    "'@neoverse-ui/vue': patch\n'@neoverse-ui/missing': patch",
  ])('rejects unknown workspace targets: %s', (frontmatter) => {
    const result = check(frontmatter);
    expect(result.exitCode).toBe(1);
    expect(result.output).toContain('@neoverse-ui/missing');
  });

  test.each(["'@neoverse-ui/vue': patc", "'@neoverse-ui/vue': [patch"])(
    'rejects malformed release entries: %s',
    (frontmatter) => {
      const result = check(frontmatter);
      expect(result.exitCode).toBe(1);
      expect(result.output).toContain('example.md');
    },
  );
});
