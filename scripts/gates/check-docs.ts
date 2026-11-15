import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

// Documentation governance, described in docs/AGENTS.md. This check keeps the
// structure declarative: current state lives in docs/, dated process material
// lives in .agents/notes/, every file carries a status line, and every relative
// link resolves.

const root = resolve(import.meta.dir, '../..');
const docsDirectory = join(root, 'docs');
const notesDirectory = join(root, '.agents');
const governancePath = join(docsDirectory, 'AGENTS.md');

const statusPattern = /^Status: (adopted|historical)$/m;
const datedName = /\d{4}-\d{2}-\d{2}/;
const linkPattern = /\]\(([^)\s]+)\)/g;

function walk(directory: string, output: string[] = []): string[] {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const full = join(directory, entry.name);
    if (entry.isDirectory()) {
      walk(full, output);
    } else if (entry.name.endsWith('.md')) {
      output.push(full);
    }
  }
  return output;
}

function repositoryPath(file: string): string {
  return relative(root, file).split('\\').join('/');
}

function headerOf(file: string): string {
  return readFileSync(file, 'utf8').split('\n').slice(0, 6).join('\n');
}

function structureRegistry(source: string): Set<string> {
  const paths = new Set<string>();
  const parents: Array<{ indent: number; path: string }> = [];
  for (const line of source.split('\n')) {
    const entry = /^(\s*)(\S+)(?:\s+.*)?$/.exec(line);
    if (!entry) continue;
    const name = entry[2];
    if (!name) continue;
    const indent = entry[1]?.length ?? 0;
    while (true) {
      const current = parents.at(-1);
      if (!current || current.indent < indent) break;
      parents.pop();
    }
    const parent = parents.at(-1)?.path ?? '';
    const path = parent ? `${parent}/${name.replace(/\/$/, '')}` : name.replace(/\/$/, '');
    if (name.endsWith('/')) {
      parents.push({ indent, path });
    } else {
      paths.add(path);
    }
  }
  return paths;
}

function walkNamed(directory: string, filename: string, output: string[] = []): string[] {
  const ignored: Record<string, true> = {
    node_modules: true,
    dist: true,
    '.git': true,
    '.release': true,
    'test-results': true,
  };
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (ignored[entry.name]) continue;
    const full = join(directory, entry.name);
    if (entry.isDirectory()) {
      walkNamed(full, filename, output);
    } else if (entry.name === filename) {
      output.push(full);
    }
  }
  return output;
}

function walkMarkdown(directory: string, output: string[] = []): string[] {
  const ignored: Record<string, true> = {
    node_modules: true,
    dist: true,
    '.git': true,
    '.release': true,
    'test-results': true,
    '.agents': true,
    '.workbuddy': true,
    '.codeartsdoer': true,
  };
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (ignored[entry.name]) continue;
    const full = join(directory, entry.name);
    if (entry.isDirectory()) {
      walkMarkdown(full, output);
    } else if (entry.name.endsWith('.md')) {
      output.push(full);
    }
  }
  return output;
}

const issues: string[] = [];

if (!existsSync(governancePath)) {
  issues.push('docs/AGENTS.md: missing documentation standards');
}

const docsFiles = existsSync(docsDirectory) ? walk(docsDirectory) : [];
const notesFiles = existsSync(notesDirectory) ? walk(notesDirectory) : [];

// The structure block is the registry: a topic that is not listed there cannot
// be introduced silently.
const structure = existsSync(governancePath)
  ? structureRegistry(
      readFileSync(governancePath, 'utf8').match(/```text\n([\s\S]*?)```/)?.[1] ?? '',
    )
  : new Set<string>();

for (const file of docsFiles) {
  const name = repositoryPath(file);
  if (!statusPattern.test(headerOf(file))) {
    issues.push(`${name}: expected "Status: adopted" or "Status: historical" after the title`);
  }
  if (datedName.test(name)) {
    issues.push(`${name}: dated process records belong in .agents/notes/`);
  }
  if (!structure.has(name)) {
    issues.push(`${name}: not listed in the docs/AGENTS.md structure block`);
  }
}

for (const file of notesFiles) {
  const name = repositoryPath(file);
  if (!statusPattern.test(headerOf(file))) {
    issues.push(`${name}: expected a status line after the title`);
  }
}

// Bilingual pairs are declared in one registry. A translation is not a second
// fact owner: it records the source path and byte hash, so an English edit
// without a Chinese review fails the check instead of drifting silently.
const translationsPath = join(root, 'docs', 'translations.json');
const translationFiles: string[] = [];
if (existsSync(translationsPath)) {
  const registry = JSON.parse(readFileSync(translationsPath, 'utf8')) as {
    pairs?: Array<{ source?: string; translation?: string }>;
  };
  for (const pair of registry.pairs ?? []) {
    if (!pair.source || !pair.translation) {
      issues.push('docs/translations.json: every pair needs source and translation paths');
      continue;
    }
    const sourcePath = resolve(root, pair.source);
    const translationPath = resolve(root, pair.translation);
    if (!existsSync(sourcePath)) {
      issues.push(`docs/translations.json: source missing at ${pair.source}`);
      continue;
    }
    if (!existsSync(translationPath)) {
      issues.push(`docs/translations.json: translation missing at ${pair.translation}`);
      continue;
    }
    translationFiles.push(translationPath);
    const translation = readFileSync(translationPath, 'utf8');
    const expectedHash = createHash('sha256').update(readFileSync(sourcePath)).digest('hex');
    const declaredSource = /<!-- Source: (\S+) -->/.exec(translation)?.[1];
    const declaredHash = /<!-- Source-SHA256: ([a-f0-9]{64}) -->/.exec(translation)?.[1];
    if (declaredSource !== pair.source) {
      issues.push(
        `${pair.translation}: Source metadata must name ${pair.source} (found ${declaredSource ?? 'none'})`,
      );
    }
    if (declaredHash !== expectedHash) {
      issues.push(
        `${pair.translation}: translation is stale; update the content and Source-SHA256 to ${expectedHash}`,
      );
    }
  }
}

const guidanceFiles = [
  join(root, 'README.md'),
  ...walkNamed(root, 'AGENTS.md'),
  ...walkNamed(root, 'README.md'),
  ...translationFiles,
];
const checkedGuidance = new Set(guidanceFiles);

// An English document stays English. Chinese belongs in a registered zh-CN
// translation or in one of the existing Chinese working records.
const chineseWorkingRecords = new Set([
  'docs/architecture/component-requests.md',
  'docs/architecture/consumer-sizing.md',
  'docs/architecture/framework-parity.md',
]);
const isChineseDocument = (file: string): boolean =>
  file.split('\\').join('/').includes('/docs/zh-CN/') ||
  file.endsWith('.zh-CN.md') ||
  chineseWorkingRecords.has(repositoryPath(file));

for (const file of walkMarkdown(root)) {
  if (isChineseDocument(file)) continue;
  if (/[\p{Script=Han}]/u.test(readFileSync(file, 'utf8'))) {
    issues.push(
      `${repositoryPath(file)}: English document contains Chinese text; move it to a zh-CN translation`,
    );
  }
}

for (const file of guidanceFiles) {
  const name = repositoryPath(file);
  const source = readFileSync(file, 'utf8');
  const lines = source.split('\n').length;
  if (file.endsWith('AGENTS.md') && file !== join(root, 'AGENTS.md') && lines > 120) {
    issues.push(`${name}: ${lines} lines exceeds the 120-line directory guidance limit`);
  }
  for (const match of source.matchAll(linkPattern)) {
    const link = match[1];
    if (!link || /^(https?:|mailto:|#)/.test(link)) continue;
    const target = link.split('#')[0];
    if (!target) continue;
    if (!existsSync(resolve(dirname(file), target))) {
      issues.push(`${name}: unresolved relative link ${link}`);
    }
  }
}

for (const file of [...docsFiles, ...notesFiles]) {
  if (checkedGuidance.has(file)) continue;
  const name = repositoryPath(file);
  for (const match of readFileSync(file, 'utf8').matchAll(linkPattern)) {
    const link = match[1];
    if (!link || /^(https?:|mailto:|#)/.test(link)) continue;
    const target = link.split('#')[0];
    if (!target) continue;
    if (!existsSync(resolve(dirname(file), target))) {
      issues.push(`${name}: unresolved relative link ${link}`);
    }
  }
}

// Contract evidence names the document that supports a component's maturity.
// Moving a document must not leave a dangling evidence path behind; sibling
// repositories are outside this checkout and are not resolved here.
const matrixPath = join(root, 'contracts', 'component-matrix.json');
if (existsSync(matrixPath)) {
  const matrix = JSON.parse(readFileSync(matrixPath, 'utf8')) as {
    components?: Array<{ name?: string; evidence?: string[] }>;
  };
  for (const component of matrix.components ?? []) {
    for (const evidence of component.evidence ?? []) {
      if (!evidence.endsWith('.md') || evidence.startsWith('../')) continue;
      if (!existsSync(resolve(root, evidence))) {
        issues.push(
          `contracts/component-matrix.json: ${component.name ?? 'unknown'} evidence missing at ${evidence}`,
        );
      }
    }
  }
}

if (issues.length > 0) {
  throw new Error(['Documentation check failed:', ...issues].join('\n'));
}

console.log(
  `Documentation check passed for ${docsFiles.length} current-state, ${notesFiles.length} note and ${translationFiles.length} translation file(s).`,
);
