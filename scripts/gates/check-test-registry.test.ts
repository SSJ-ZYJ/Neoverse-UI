import { describe, expect, test } from 'bun:test';
import {
  checkRegistry,
  globToRegExp,
  parseBrowserSpecs,
  parseScopeRegistry,
  parseTestCommands,
  type RegistryInput,
  reachableTestCommands,
  type ScopeRow,
  type TestCommand,
  uncoveredTests,
} from './check-test-registry';

const row = (scope: string, overrides: Partial<ScopeRow> = {}): ScopeRow => ({
  scope,
  level: 'unit',
  runner: 'bun-test',
  args: '—',
  metadata: [],
  ...overrides,
});

const input = (overrides: Partial<RegistryInput> = {}): RegistryInput => ({
  rows: [row('tests/**/*.test.ts')],
  testFiles: ['tests/unit/a.test.ts'],
  contents: new Map([['tests/unit/a.test.ts', 'test("works", () => {});']]),
  browserSpecs: [],
  crossBrowserSpecs: [],
  pngFiles: [],
  testCommands: [{ file: 'package.json', runner: 'bun-test', targets: ['tests/'] }],
  ...overrides,
});

describe('scope registry parsing', () => {
  test('reads scopes, levels, runners and metadata from the registry section', () => {
    const markdown = [
      '## Scope registry',
      '',
      '| Scope | Level | Runner | Args | Metadata |',
      '| --- | --- | --- | --- | --- |',
      '| `tests/e2e/*.spec.ts` | system | playwright | — | browser |',
      '| `tests/optics/*.spec.ts` | module | bun-test | — | isolated, scene |',
      '',
      '## Browser specs',
    ].join('\n');
    const { rows, errors } = parseScopeRegistry(markdown);
    expect(errors).toEqual([]);
    expect(rows).toEqual([
      row('tests/e2e/*.spec.ts', { level: 'system', runner: 'playwright', metadata: ['browser'] }),
      row('tests/optics/*.spec.ts', { level: 'module', metadata: ['isolated', 'scene'] }),
    ]);
  });

  test('rejects unknown levels, runners and metadata', () => {
    const markdown = [
      '## Scope registry',
      '| `a.test.ts` | giant | bun-test | — | — |',
      '| `b.test.ts` | unit | magic | — | — |',
      '| `c.test.ts` | unit | bun-test | — | fantasy |',
    ].join('\n');
    const { errors } = parseScopeRegistry(markdown);
    expect(errors).toContain('a.test.ts: unknown level "giant"');
    expect(errors).toContain('b.test.ts: unknown runner "magic"');
    expect(errors).toContain('c.test.ts: unknown metadata "fantasy"');
  });

  test('reports a missing registry section', () => {
    const { errors } = parseScopeRegistry('# Nothing');
    expect(errors).toContain('docs/testing/README.md: missing "Scope registry" section');
  });

  test('reads browser specs only from the browser specs section', () => {
    const markdown = [
      '## Scope registry',
      '| `tests/e2e/*.spec.ts` | system | playwright | — | browser |',
      '## Browser specs',
      '| `forms.spec.ts` | Forms |',
      '| `parity.spec.ts` | Parity |',
      '## Commands',
    ].join('\n');
    expect(parseBrowserSpecs(markdown)).toEqual(['forms.spec.ts', 'parity.spec.ts']);
  });
});

describe('glob matching', () => {
  test('single star does not cross a directory separator', () => {
    expect(globToRegExp('tests/*/*.spec.ts').test('tests/e2e/forms.spec.ts')).toBe(true);
    expect(globToRegExp('tests/*.spec.ts').test('tests/e2e/forms.spec.ts')).toBe(false);
  });

  test('double star crosses a directory separator', () => {
    expect(
      globToRegExp('scripts/**/*.test.ts').test('scripts/release/verify-published.test.ts'),
    ).toBe(true);
  });
});

describe('registry consistency', () => {
  test('passes declared metadata with matching evidence', () => {
    const errors = checkRegistry(
      input({
        rows: [
          row('tests/**/*.test.ts', { runner: 'playwright', metadata: ['browser', 'isolated'] }),
        ],
        contents: new Map([['tests/unit/a.test.ts', `const dir = await ${'mkdtemp'}(prefix);`]]),
      }),
    );
    expect(errors).toEqual([]);
  });

  test('rejects a test file outside every registered scope', () => {
    const errors = checkRegistry(input({ testFiles: ['other/b.test.ts'], contents: new Map() }));
    expect(errors).toContain('other/b.test.ts: test file is not covered by any Scope registry row');
  });

  test('rejects a scope with no matching test file', () => {
    const errors = checkRegistry(input({ rows: [row('tests/absent/*.test.ts')] }));
    expect(errors).toContain('tests/absent/*.test.ts: registered scope matches no test file');
  });

  test('rejects declared metadata without evidence', () => {
    const errors = checkRegistry(
      input({ rows: [row('tests/**/*.test.ts', { metadata: ['isolated'] })] }),
    );
    expect(errors).toContain(
      'tests/unit/a.test.ts: metadata "isolated" is declared by tests/**/*.test.ts but has no evidence in this file',
    );
  });

  test('rejects evidence without a declaration', () => {
    const errors = checkRegistry(
      input({
        contents: new Map([['tests/unit/a.test.ts', `const dir = ${'mkdtempSync'}(prefix);`]]),
      }),
    );
    expect(errors).toContain(
      'tests/unit/a.test.ts: carries "isolated" evidence but tests/**/*.test.ts does not declare it',
    );
  });

  test('requires the playwright runner for browser metadata', () => {
    const errors = checkRegistry(
      input({ rows: [row('tests/**/*.test.ts', { metadata: ['browser'] })] }),
    );
    expect(errors).toContain('tests/**/*.test.ts: browser metadata requires the playwright runner');
  });

  test('requires browser metadata for playwright scopes', () => {
    const errors = checkRegistry(
      input({ rows: [row('tests/**/*.test.ts', { runner: 'playwright' })] }),
    );
    expect(errors).toContain('tests/**/*.test.ts: playwright runner requires browser metadata');
  });

  test('requires a PNG baseline for snapshot metadata', () => {
    const errors = checkRegistry(
      input({
        rows: [row('tests/**/*.test.ts', { metadata: ['snapshot'] })],
        contents: new Map([
          ['tests/unit/a.test.ts', `await expect(page).${'toHaveScreenshot'}();`],
        ]),
      }),
    );
    expect(errors).toContain(
      'tests/**/*.test.ts: snapshot metadata requires a PNG baseline under tests/',
    );
  });

  test('checks browser spec registration and cross-browser references', () => {
    const errors = checkRegistry(
      input({
        rows: [row('tests/e2e/*.spec.ts', { runner: 'playwright', metadata: ['browser'] })],
        testFiles: ['tests/e2e/forms.spec.ts'],
        contents: new Map([['tests/e2e/forms.spec.ts', 'test("opens", () => {});']]),
        browserSpecs: ['missing.spec.ts'],
        crossBrowserSpecs: ['forms.spec.ts'],
      }),
    );
    expect(errors).toContain('forms.spec.ts: browser spec is missing from docs/testing/README.md');
    expect(errors).toContain(
      'missing.spec.ts: registered browser spec does not exist in tests/e2e',
    );
    expect(errors).toContain(
      'forms.spec.ts: cross-browser spec must be registered in docs/testing/README.md',
    );
  });
});

describe('registry row integrity', () => {
  test('rejects a malformed table row instead of ignoring it', () => {
    const markdown = [
      '## Scope registry',
      '| Scope | Level | Runner | Args | Metadata |',
      '| --- | --- | --- | --- | --- |',
      '| `a.test.ts` | unit | bun-test | — |',
    ].join('\n');
    const { errors } = parseScopeRegistry(markdown);
    expect(errors.some((error) => error.includes('malformed Scope registry row'))).toBe(true);
  });

  test('rejects a duplicated scope', () => {
    const markdown = [
      '## Scope registry',
      '| `a.test.ts` | unit | bun-test | — | — |',
      '| `a.test.ts` | module | bun-test | — | — |',
    ].join('\n');
    const { errors } = parseScopeRegistry(markdown);
    expect(errors).toContain('a.test.ts: duplicate Scope registry row');
  });

  test('ignores prose and accepts header and separator rows', () => {
    const markdown = [
      '## Scope registry',
      'Explanatory prose with a | pipe inside.',
      '| Scope | Level | Runner | Args | Metadata |',
      '| --- | --- | --- | --- | --- |',
      '| `a.test.ts` | unit | bun-test | — | — |',
    ].join('\n');
    const { rows, errors } = parseScopeRegistry(markdown);
    expect(errors).toEqual([]);
    expect(rows).toHaveLength(1);
  });
});

describe('per-file metadata evidence', () => {
  test('fails an unisolated sibling when the scope declares isolated', () => {
    const errors = checkRegistry(
      input({
        rows: [row('tests/**/*.test.ts', { metadata: ['isolated'] })],
        testFiles: ['tests/unit/a.test.ts', 'tests/unit/b.test.ts'],
        contents: new Map([
          ['tests/unit/a.test.ts', `const dir = ${'mkdtemp'}(prefix);`],
          ['tests/unit/b.test.ts', 'test("works", () => {});'],
        ]),
      }),
    );
    expect(errors).toContain(
      'tests/unit/b.test.ts: metadata "isolated" is declared by tests/**/*.test.ts but has no evidence in this file',
    );
  });

  test('fails a single file carrying undeclared evidence', () => {
    const errors = checkRegistry(
      input({
        testFiles: ['tests/unit/a.test.ts', 'tests/unit/b.test.ts'],
        contents: new Map([
          ['tests/unit/a.test.ts', 'test("works", () => {});'],
          ['tests/unit/b.test.ts', `const dir = ${'mkdtemp'}(prefix);`],
        ]),
      }),
    );
    expect(errors).toContain(
      'tests/unit/b.test.ts: carries "isolated" evidence but tests/**/*.test.ts does not declare it',
    );
  });
});

describe('test execution coverage', () => {
  test('extracts bun test and vitest commands from manifests', () => {
    const commands = parseTestCommands([
      [
        'package.json',
        JSON.stringify({
          scripts: {
            'test:contracts': 'bun test a.test.ts && bun run build',
            test: 'vitest run --coverage',
          },
        }),
      ],
    ]);
    expect(commands).toEqual([
      { file: 'package.json', runner: 'bun-test', targets: ['a.test.ts'] },
      { file: 'package.json', runner: 'vitest', targets: [] },
    ]);
  });

  test('matches package-local targets against repository-relative files', () => {
    const command: TestCommand = {
      file: 'packages/vue/package.json',
      runner: 'bun-test',
      targets: ['src/index.test.ts'],
    };
    expect(uncoveredTests(['packages/vue/src/index.test.ts'], [command])).toEqual([]);
    expect(uncoveredTests(['packages/react/src/index.test.ts'], [command])).toEqual([
      'packages/react/src/index.test.ts',
    ]);
  });

  test('reports a registered test that no command executes', () => {
    const errors = checkRegistry(
      input({
        testCommands: [{ file: 'package.json', runner: 'bun-test', targets: ['tests/other/'] }],
      }),
    );
    expect(errors).toContain(
      'tests/unit/a.test.ts: registered test is not covered by any bun test or vitest command in a package.json',
    );
  });

  test('does not require playwright specs to appear in bun test commands', () => {
    const errors = checkRegistry(
      input({
        rows: [row('tests/e2e/*.spec.ts', { runner: 'playwright', metadata: ['browser'] })],
        testFiles: ['tests/e2e/forms.spec.ts'],
        contents: new Map([['tests/e2e/forms.spec.ts', 'test("opens", () => {});']]),
        browserSpecs: ['forms.spec.ts'],
        testCommands: [],
      }),
    );
    expect(errors).toEqual([]);
  });
});

describe('reachable test commands', () => {
  const manifest = (
    file: string,
    name: string,
    scripts: Record<string, string>,
  ): [string, string] => [file, JSON.stringify({ name, scripts })];

  test('excludes an orphan script that the root test entry never calls', () => {
    const commands = reachableTestCommands([
      manifest('package.json', 'root', {
        test: 'bun run test:main',
        'test:main': 'bun test src/main.test.ts',
        'test:optional': 'bun test src/optional.test.ts',
      }),
    ]);
    expect(commands).toEqual([
      { file: 'package.json', runner: 'bun-test', targets: ['src/main.test.ts'] },
    ]);
  });

  test('follows chained bun run calls from the root entry', () => {
    const commands = reachableTestCommands([
      manifest('package.json', 'root', {
        test: 'bun run test:all && bun run build',
        'test:all': 'bun run test:contracts',
        'test:contracts': 'bun test scripts/gates/a.test.ts',
        build: 'bun run tsc --noEmit',
      }),
    ]);
    expect(commands).toEqual([
      { file: 'package.json', runner: 'bun-test', targets: ['scripts/gates/a.test.ts'] },
    ]);
  });

  test('expands a workspace filter into each matching package test script', () => {
    const commands = reachableTestCommands([
      manifest('package.json', 'root', {
        test: "bun run --filter '@scope/*' --if-present --sequential test",
      }),
      manifest('packages/one/package.json', '@scope/one', { test: 'bun test src/one.test.ts' }),
      manifest('packages/two/package.json', '@scope/two', { test: 'vitest run' }),
      manifest('packages/other/package.json', '@else/other', {
        test: 'bun test src/other.test.ts',
      }),
    ]);
    expect(commands).toEqual([
      { file: 'packages/one/package.json', runner: 'bun-test', targets: ['src/one.test.ts'] },
      { file: 'packages/two/package.json', runner: 'vitest', targets: [] },
    ]);
  });

  test('breaks cycles between scripts', () => {
    const commands = reachableTestCommands([
      manifest('package.json', 'root', {
        test: 'bun run test:a',
        'test:a': 'bun run test:b && bun test src/a.test.ts',
        'test:b': 'bun run test:a',
      }),
    ]);
    expect(commands).toEqual([
      { file: 'package.json', runner: 'bun-test', targets: ['src/a.test.ts'] },
    ]);
  });
});

describe('vitest target matching', () => {
  test('an explicit vitest target does not cover a sibling file in the same package', () => {
    const command: TestCommand = {
      file: 'packages/vue/package.json',
      runner: 'vitest',
      targets: ['src/a.test.ts'],
    };
    expect(uncoveredTests(['packages/vue/src/a.test.ts'], [command])).toEqual([]);
    expect(uncoveredTests(['packages/vue/src/b.test.ts'], [command])).toEqual([
      'packages/vue/src/b.test.ts',
    ]);
  });

  test('vitest and bun test share the same no-target fallback', () => {
    for (const runner of ['vitest', 'bun-test'] as const) {
      const command: TestCommand = { file: 'packages/vue/package.json', runner, targets: [] };
      expect(uncoveredTests(['packages/vue/src/a.test.ts'], [command])).toEqual([]);
    }
  });

  test('vitest with an explicit directory covers files under that directory', () => {
    const command: TestCommand = {
      file: 'packages/vue/package.json',
      runner: 'vitest',
      targets: ['src/unit/'],
    };
    expect(uncoveredTests(['packages/vue/src/unit/a.test.ts'], [command])).toEqual([]);
    expect(uncoveredTests(['packages/vue/src/integration/b.test.ts'], [command])).toEqual([
      'packages/vue/src/integration/b.test.ts',
    ]);
  });
});
