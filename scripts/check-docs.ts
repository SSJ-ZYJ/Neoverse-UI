import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

// Documentation governance, described in docs/AGENTS.md. This check keeps the
// structure declarative: current state lives in docs/, dated process material
// lives in .agents/notes/, every file carries a status line, and every relative
// link resolves.

const root = resolve(import.meta.dir, '..');
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

const issues: string[] = [];

if (!existsSync(governancePath)) {
  issues.push('docs/AGENTS.md: missing documentation standards');
}

const docsFiles = existsSync(docsDirectory) ? walk(docsDirectory) : [];
const notesFiles = existsSync(notesDirectory) ? walk(notesDirectory) : [];

// The structure block is the registry: a topic that is not listed there cannot
// be introduced silently.
const structure = existsSync(governancePath)
  ? (readFileSync(governancePath, 'utf8').match(/```text\n([\s\S]*?)```/)?.[1] ?? '')
  : '';

for (const file of docsFiles) {
  const name = repositoryPath(file);
  if (!statusPattern.test(headerOf(file))) {
    issues.push(`${name}: expected "Status: adopted" or "Status: historical" after the title`);
  }
  if (datedName.test(name)) {
    issues.push(`${name}: dated process records belong in .agents/notes/`);
  }
  if (!structure.includes(name.slice('docs/'.length))) {
    issues.push(`${name}: not listed in the docs/AGENTS.md structure block`);
  }
}

for (const file of notesFiles) {
  const name = repositoryPath(file);
  if (!statusPattern.test(headerOf(file))) {
    issues.push(`${name}: expected a status line after the title`);
  }
}

for (const file of [...docsFiles, ...notesFiles]) {
  const name = repositoryPath(file);
  for (const match of readFileSync(file, 'utf8').matchAll(linkPattern)) {
    const link = match[1];
    if (/^(https?:|mailto:|#)/.test(link)) continue;
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
  `Documentation check passed for ${docsFiles.length} current-state and ${notesFiles.length} note file(s).`,
);
