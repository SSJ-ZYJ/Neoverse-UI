export {};

// Source language governance, described in docs/code-style.md.
//
// Comments and identifiers are English; Chinese exists only as localized display
// data inside string literals. The check therefore extracts comment text with a
// small scanner instead of matching raw lines, so a localized label value and a
// template literal containing CJK copy are not reported.

const sourceExtensions = new Set(['.mjs', '.ts', '.tsx', '.vue']);
const roots = ['apps', 'packages', 'scripts', 'tests'];

const spellingRules: Array<[RegExp, string]> = [
  [/\bcolour(s|ed|ing|ful|less)?\b/gi, 'color'],
  [/\bbehaviour(s|al)?\b/gi, 'behavior'],
  [/\bcentred\b/gi, 'centered'],
  [/\bcancelled\b/gi, 'canceled'],
  [/\borganisation(s|al)?\b/gi, 'organization'],
  [/\bnormalise(s|d)?\b/gi, 'normalize'],
];

const abbreviationRules: Array<[RegExp, string]> = [
  [/\bAX\b/g, 'a11y or accessibility'],
  [/\bAx\b/g, 'a11y or accessibility'],
];

const cjk = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/;

type ScanState = { inBlock: boolean };

function skipString(line: string, start: number): number {
  const quote = line[start] ?? '"';
  let index = start + 1;
  while (index < line.length) {
    const character = line[index];
    if (character === '\\') {
      index += 2;
      continue;
    }
    if (character === quote) return index + 1;
    index += 1;
  }
  return index;
}

function commentText(line: string, state: ScanState): string {
  let text = '';
  let index = 0;

  while (index < line.length) {
    if (state.inBlock) {
      const end = line.indexOf('*/', index);
      if (end === -1) return text + line.slice(index);
      text += ` ${line.slice(index, end)}`;
      state.inBlock = false;
      index = end + 2;
      continue;
    }

    const character = line[index];
    if (character === '/' && line[index + 1] === '*') {
      state.inBlock = true;
      index += 2;
      continue;
    }
    if (character === '/' && line[index + 1] === '/') {
      return text + line.slice(index + 2);
    }
    if (character === "'" || character === '"' || character === '`') {
      index = skipString(line, index);
      continue;
    }
    index += 1;
  }

  return text;
}

function codeText(line: string, state: ScanState): string {
  let text = '';
  let index = 0;

  while (index < line.length) {
    if (state.inBlock) {
      const end = line.indexOf('*/', index);
      if (end === -1) return text;
      state.inBlock = false;
      index = end + 2;
      continue;
    }

    const character = line[index];
    if (character === '/' && line[index + 1] === '*') {
      state.inBlock = true;
      index += 2;
      continue;
    }
    if (character === '/' && line[index + 1] === '/') {
      return text;
    }
    if (character === "'" || character === '"' || character === '`') {
      text += ' ';
      index = skipString(line, index);
      continue;
    }
    text += character;
    index += 1;
  }

  return text;
}

const tracked = Bun.spawnSync({
  cmd: ['git', 'ls-files', '-co', '--exclude-standard'],
  stdout: 'pipe',
  stderr: 'pipe',
});

if (tracked.exitCode !== 0) {
  throw new Error(`git ls-files failed: ${tracked.stderr.toString().trim()}`);
}

const files = tracked.stdout
  .toString()
  .split(/\r?\n/)
  .filter(Boolean)
  .filter((file) => roots.some((root) => file.startsWith(`${root}/`)))
  .filter((file) => {
    const dot = file.lastIndexOf('.');
    return dot >= 0 && sourceExtensions.has(file.slice(dot).toLowerCase());
  })
  .filter((file) => !file.includes('/dist/') && !file.endsWith('.d.ts'));

const issues: string[] = [];

for (const file of files) {
  const source = Bun.file(file);
  if (!(await source.exists())) continue;

  const lines = (await source.text()).split(/\r?\n/);
  const commentState: ScanState = { inBlock: false };
  const codeState: ScanState = { inBlock: false };

  lines.forEach((line, index) => {
    if (line.includes('style-ignore')) return;

    const lineNumber = index + 1;
    const comment = commentText(line, commentState);
    const code = codeText(line, codeState);

    if (cjk.test(comment)) {
      issues.push(
        `${file}:${lineNumber}  CJK in a comment; comments are English and Chinese is display data only`,
      );
      return;
    }

    for (const [pattern, replacement] of [...spellingRules, ...abbreviationRules]) {
      if (pattern.test(comment) || pattern.test(code)) {
        issues.push(`${file}:${lineNumber}  use "${replacement}"`);
        return;
      }
    }
  });
}

if (issues.length > 0) {
  throw new Error(['Source language check failed:', ...issues].join('\n'));
}

console.log(`Source language check passed for ${files.length} file(s).`);
