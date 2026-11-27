import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';

// Test registry governance, described in docs/testing/README.md. The Scope
// registry is the single declaration of test files; every declaration needs
// mechanical evidence, and every piece of evidence needs a declaration.

const root = resolve(import.meta.dir, '../..');
const registryPath = resolve(root, 'docs/testing/README.md');
const crossBrowserPath = resolve(root, 'playwright.cross-browser.config.ts');

const DASH = '—';
const LEVELS = ['unit', 'module', 'system'] as const;
const RUNNERS = ['bun-test', 'playwright'] as const;
const KNOWN_METADATA = ['browser', 'isolated', 'scene', 'snapshot'] as const;

export type Level = (typeof LEVELS)[number];
export type Runner = (typeof RUNNERS)[number];
export type Metadata = (typeof KNOWN_METADATA)[number];

export interface ScopeRow {
  scope: string;
  level: Level;
  runner: Runner;
  args: string;
  metadata: Metadata[];
}

// Evidence is a call or tag in executed code, not a mention in a string. The
// registry checker's own tests construct these strings by concatenation so the
// checker does not register its fixtures as evidence.
const EVIDENCE: Record<Exclude<Metadata, 'browser'>, (content: string) => boolean> = {
  isolated: (content) => /mkdtemp(?:Sync)?\s*\(/.test(content),
  scene: (content) => /\/\/\s*@cinematic\b/.test(content),
  snapshot: (content) => /toHaveScreenshot\s*\(/.test(content),
};

export function globToRegExp(glob: string): RegExp {
  const escaped = glob.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  const pattern = escaped
    .replace(/\*\*/g, '__GLOBSTAR__')
    .replace(/\*/g, '[^/]*')
    .replace(/__GLOBSTAR__/g, '.*');
  return new RegExp(`^${pattern}$`);
}

export function parseScopeRegistry(markdown: string): { rows: ScopeRow[]; errors: string[] } {
  const rows: ScopeRow[] = [];
  const errors: string[] = [];
  const section = /## Scope registry([\s\S]*?)(?=\n## |$)/.exec(markdown)?.[1];
  if (!section) {
    errors.push('docs/testing/README.md: missing "Scope registry" section');
    return { rows, errors };
  }
  const rowPattern =
    /^\|\s*`([^`]+)`\s*\|\s*(\w+)\s*\|\s*([\w-]+)\s*\|\s*([^|]*)\|\s*([^|]*)\|\s*$/;
  const seen = new Set<string>();
  for (const line of section.split('\n')) {
    const trimmed = line.trim();
    // A table row starts with a pipe. Prose and headings are allowed, but a
    // pipe-prefixed line that is neither a header, a separator nor a valid
    // row is a malformed declaration and must fail instead of being ignored.
    if (!trimmed.startsWith('|')) continue;
    if (/^\|\s*Scope\s*\|/.test(trimmed)) continue;
    if (/^\|[\s|:-]+\|$/.test(trimmed)) continue;
    const cells = rowPattern.exec(trimmed);
    if (!cells) {
      errors.push(`docs/testing/README.md: malformed Scope registry row: ${trimmed.slice(0, 80)}`);
      continue;
    }
    const scope = cells[1] ?? '';
    if (seen.has(scope)) {
      errors.push(`${scope}: duplicate Scope registry row`);
      continue;
    }
    seen.add(scope);
    const level = cells[2] as Level;
    const runner = cells[3] as Runner;
    if (!LEVELS.includes(level)) {
      errors.push(`${scope}: unknown level "${level}"`);
      continue;
    }
    if (!RUNNERS.includes(runner)) {
      errors.push(`${scope}: unknown runner "${runner}"`);
      continue;
    }
    const args = cells[4]?.trim() ?? '';
    const raw = cells[5]?.trim() ?? '';
    const names = raw === DASH || raw === '' ? [] : raw.split(',').map((name) => name.trim());
    const metadata: Metadata[] = [];
    for (const name of names) {
      if (!KNOWN_METADATA.includes(name as Metadata)) {
        errors.push(`${scope}: unknown metadata "${name}"`);
        continue;
      }
      metadata.push(name as Metadata);
    }
    rows.push({ scope, level, runner, args, metadata });
  }
  if (rows.length === 0) errors.push('docs/testing/README.md: Scope registry has no rows');
  return { rows, errors };
}

export function parseBrowserSpecs(markdown: string): string[] {
  const section = /## Browser specs([\s\S]*?)(?=\n## |$)/.exec(markdown)?.[1] ?? '';
  return [...section.matchAll(/^\| `([^`]+\.spec\.ts)` \|/gm)].map((match) => match[1] ?? '');
}

export function collectTestFiles(): string[] {
  let output: string;
  try {
    output = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], {
      cwd: root,
      encoding: 'utf8',
    });
  } catch {
    const files: string[] = [];
    for (const directory of ['packages', 'apps', 'scripts', 'tests']) {
      const walk = (path: string): void => {
        for (const entry of readdirSync(path, { withFileTypes: true })) {
          if (['node_modules', 'dist', '.git', 'test-results'].includes(entry.name)) continue;
          const full = resolve(path, entry.name);
          if (entry.isDirectory()) walk(full);
          else if (/\.(test|spec)\.tsx?$/.test(entry.name)) {
            files.push(
              full
                .slice(root.length + 1)
                .split('\\')
                .join('/'),
            );
          }
        }
      };
      walk(resolve(root, directory));
    }
    return files.sort();
  }
  return output
    .split('\n')
    .filter((file) => /\.(test|spec)\.tsx?$/.test(file) && existsSync(resolve(root, file)))
    .sort();
}

export interface TestCommand {
  file: string;
  runner: 'bun-test' | 'vitest';
  targets: string[];
}

function extractCommands(file: string, command: string): TestCommand[] {
  const commands: TestCommand[] = [];
  for (const match of command.matchAll(/\b(bun\s+test|vitest(?:\s+run)?)\b([^&|;]*)/g)) {
    const runner = match[1]?.startsWith('bun') ? 'bun-test' : 'vitest';
    const targets = (match[2] ?? '')
      .split(/\s+/)
      .filter((token) => /\.(?:test|spec)\.tsx?$/.test(token) || token.includes('/'))
      .filter((token) => !token.startsWith('-'));
    commands.push({ file, runner, targets });
  }
  return commands;
}

// parseTestCommands is the unfiltered extractor used by tests. The gate uses
// reachableTestCommands so an orphan script cannot make a test look executed.
export function parseTestCommands(manifests: Array<[string, string]>): TestCommand[] {
  const commands: TestCommand[] = [];
  for (const [file, source] of manifests) {
    const scripts = (JSON.parse(source) as { scripts?: Record<string, string> }).scripts ?? {};
    for (const command of Object.values(scripts)) commands.push(...extractCommands(file, command));
  }
  return commands;
}

interface ScriptRef {
  filter?: string;
  script: string;
}

function scriptRefs(command: string): ScriptRef[] {
  const refs: ScriptRef[] = [];
  for (const match of command.matchAll(/\bbun\s+run\s+([^&|;]+)/g)) {
    const tokens = (match[1] ?? '').trim().split(/\s+/).filter(Boolean);
    let filter: string | undefined;
    const positional: string[] = [];
    for (let index = 0; index < tokens.length; index += 1) {
      const token = tokens[index] ?? '';
      if (token === '--filter') {
        filter = tokens[index + 1]?.replace(/^['"]|['"]$/g, '');
        index += 1;
        continue;
      }
      if (token.startsWith('-')) continue;
      positional.push(token);
    }
    const script = positional[0];
    if (script) refs.push(filter === undefined ? { script } : { filter, script });
  }
  return refs;
}

function matchesFilter(name: string, filter: string): boolean {
  return filter.includes('*') ? globToRegExp(filter).test(name) : name === filter;
}

interface Manifest {
  file: string;
  name: string;
  scripts: Record<string, string>;
}

export function reachableTestCommands(manifests: Array<[string, string]>): TestCommand[] {
  const parsed: Manifest[] = manifests.map(([file, source]) => {
    const json = JSON.parse(source) as { name?: string; scripts?: Record<string, string> };
    return { file, name: json.name ?? '', scripts: json.scripts ?? {} };
  });
  const entry = parsed.find((manifest) => manifest.file === 'package.json');
  if (!entry) return [];
  const workspaces = parsed.filter((manifest) => manifest.file !== 'package.json');
  const commands: TestCommand[] = [];
  const visited = new Set<string>();

  const visit = (manifest: Manifest, script: string): void => {
    const key = `${manifest.file}#${script}`;
    if (visited.has(key)) return;
    visited.add(key);
    const command = manifest.scripts[script];
    if (!command) return;
    commands.push(...extractCommands(manifest.file, command));
    for (const ref of scriptRefs(command)) {
      if (ref.filter) {
        for (const workspace of workspaces) {
          if (matchesFilter(workspace.name, ref.filter)) visit(workspace, ref.script);
        }
      } else {
        visit(manifest, ref.script);
      }
    }
  };

  visit(entry, 'test');
  return commands;
}

function commandCovers(command: TestCommand, testFile: string): boolean {
  const directory = relative(root, resolve(root, command.file)).replace(/\\/g, '/');
  const owner = directory.includes('/') ? directory.slice(0, directory.lastIndexOf('/')) : '';
  if (owner && !testFile.startsWith(`${owner}/`)) return false;
  const base = owner ? testFile.slice(owner.length + 1) : testFile;
  if (command.targets.length === 0) return true;
  return command.targets.some(
    (target) => base === target || base.startsWith(`${target.replace(/\/$/, '')}/`),
  );
}

export function uncoveredTests(testFiles: string[], commands: TestCommand[]): string[] {
  const uncovered: string[] = [];
  for (const file of testFiles) {
    if (!commands.some((command) => commandCovers(command, file))) uncovered.push(file);
  }
  return uncovered;
}

export interface RegistryInput {
  rows: ScopeRow[];
  testFiles: string[];
  contents: Map<string, string>;
  browserSpecs: string[];
  crossBrowserSpecs: string[];
  pngFiles: string[];
  testCommands: TestCommand[];
}

export function checkRegistry(input: RegistryInput): string[] {
  const { rows, testFiles, contents, browserSpecs, crossBrowserSpecs, pngFiles, testCommands } =
    input;
  const errors: string[] = [];
  const matchers = rows.map((row) => ({ row, matcher: globToRegExp(row.scope) }));

  for (const file of testFiles) {
    if (!matchers.some(({ matcher }) => matcher.test(file))) {
      errors.push(`${file}: test file is not covered by any Scope registry row`);
    }
  }
  for (const { row, matcher } of matchers) {
    const matched = testFiles.filter((file) => matcher.test(file));
    if (matched.length === 0) {
      errors.push(`${row.scope}: registered scope matches no test file`);
      continue;
    }
    const names = Object.keys(EVIDENCE) as Array<Exclude<Metadata, 'browser'>>;
    // Evidence is per-file: a declaration applies to every file in the scope,
    // and an undeclared property is invalid on any single file. Aggregating
    // with some() would let one isolated file hide an unisolated sibling.
    for (const file of matched) {
      const content = contents.get(file) ?? '';
      for (const name of names) {
        const present = EVIDENCE[name](content);
        const declared = row.metadata.includes(name);
        if (declared && !present) {
          errors.push(
            `${file}: metadata "${name}" is declared by ${row.scope} but has no evidence in this file`,
          );
        }
        if (present && !declared) {
          errors.push(`${file}: carries "${name}" evidence but ${row.scope} does not declare it`);
        }
      }
    }
    if (row.metadata.includes('browser') && row.runner !== 'playwright') {
      errors.push(`${row.scope}: browser metadata requires the playwright runner`);
    }
    if (row.runner === 'playwright' && !row.metadata.includes('browser')) {
      errors.push(`${row.scope}: playwright runner requires browser metadata`);
    }
    if (row.metadata.includes('snapshot') && !pngFiles.some((file) => file.startsWith('tests/'))) {
      errors.push(`${row.scope}: snapshot metadata requires a PNG baseline under tests/`);
    }
  }

  const scriptTests = testFiles.filter((file) =>
    matchers.some(({ row, matcher }) => matcher.test(file) && row.runner !== 'playwright'),
  );
  for (const file of uncoveredTests(scriptTests, testCommands)) {
    errors.push(
      `${file}: registered test is not covered by any bun test or vitest command in a package.json`,
    );
  }

  const e2eSpecs = testFiles
    .filter((file) => /^tests\/e2e\/.+\.spec\.ts$/.test(file))
    .map((file) => file.slice('tests/e2e/'.length));
  for (const spec of e2eSpecs) {
    if (!browserSpecs.includes(spec))
      errors.push(`${spec}: browser spec is missing from docs/testing/README.md`);
  }
  for (const spec of browserSpecs) {
    if (!e2eSpecs.includes(spec))
      errors.push(`${spec}: registered browser spec does not exist in tests/e2e`);
  }
  for (const spec of crossBrowserSpecs) {
    if (!e2eSpecs.includes(spec))
      errors.push(`${spec}: cross-browser config references a missing spec`);
    if (!browserSpecs.includes(spec))
      errors.push(`${spec}: cross-browser spec must be registered in docs/testing/README.md`);
  }
  return errors;
}

function main(): void {
  const registry = readFileSync(registryPath, 'utf8');
  const parsed = parseScopeRegistry(registry);
  const errors = parsed.errors;
  const testFiles = collectTestFiles();
  const contents = new Map(
    testFiles.map((file) => [file, readFileSync(resolve(root, file), 'utf8')] as const),
  );
  const crossBrowser = readFileSync(crossBrowserPath, 'utf8');
  const crossBrowserSpecs = [...crossBrowser.matchAll(/'\*\*\/([^']+\.spec\.ts)'/g)].map(
    (match) => match[1] ?? '',
  );
  const pngFiles = execFileSync('git', ['ls-files', '*.png'], { cwd: root, encoding: 'utf8' })
    .split('\n')
    .filter(Boolean);
  const manifests = execFileSync('git', ['ls-files', '*package.json'], {
    cwd: root,
    encoding: 'utf8',
  })
    .split('\n')
    .filter(Boolean)
    .filter(
      (file) => file === 'package.json' || /^(packages|apps)\/[^/]+\/package\.json$/.test(file),
    )
    .map((file) => [file, readFileSync(resolve(root, file), 'utf8')] as [string, string]);
  errors.push(
    ...checkRegistry({
      rows: parsed.rows,
      testFiles,
      contents,
      browserSpecs: parseBrowserSpecs(registry),
      crossBrowserSpecs,
      pngFiles,
      testCommands: reachableTestCommands(manifests),
    }),
  );
  if (errors.length > 0) {
    console.error('Test registry check failed:');
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
    return;
  }
  console.log(
    `Test registry passed for ${parsed.rows.length} scopes, ${testFiles.length} test files and ${crossBrowserSpecs.length} cross-browser specs.`,
  );
}

if (import.meta.main) main();
