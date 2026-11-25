import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import ts from 'typescript';

const categories: Record<string, true> = {
  actions: true,
  display: true,
  forms: true,
  motion: true,
  navigation: true,
  overlays: true,
  surfaces: true,
  terminal: true,
};
const packageEntry = /^packages\/[^/]+\/src\/index\.tsx?$/;
const vueComponent = /^packages\/vue\/src\/.+\.vue$/;
const reactSource = /^packages\/react\/src\/(?!.*\.(?:test|test-support)\.tsx?$).+\.tsx?$/;

function reactComponentNames(source: ts.SourceFile): ts.Identifier[] {
  const names: ts.Identifier[] = [];
  const visit = (node: ts.Node): void => {
    const name =
      (ts.isFunctionDeclaration(node) && node.body) ||
      (ts.isVariableDeclaration(node) && node.initializer)
        ? node.name
        : undefined;
    if (name && ts.isIdentifier(name) && /^[A-Z][A-Za-z0-9]*$/.test(name.text)) names.push(name);
    ts.forEachChild(node, visit);
  };
  visit(source);
  return names;
}

/** Check the source layout of one published package file. */
export function checkComponentLayout(path: string, text: string): string[] {
  const isEntry = packageEntry.test(path);
  const isVue = vueComponent.test(path);
  const isReact = reactSource.test(path);
  if (!isEntry && !isVue && !isReact) return [];

  const source = isVue ? undefined : ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true);
  const report = (message: string, node?: ts.Node): string => {
    const line =
      source && node ? source.getLineAndCharacterOfPosition(node.getStart(source)).line : 0;
    return `${path}:${line + 1}: ${message}`;
  };
  if (isEntry && source) {
    return source.statements
      .filter((statement) => !ts.isExportDeclaration(statement) || !statement.moduleSpecifier)
      .map((statement) => report('package entry must only re-export modules', statement));
  }

  const isTsx = path.endsWith('.tsx');
  const names = source ? reactComponentNames(source) : [];
  const components = isTsx ? names : names.filter((name) => /^Ui[A-Z]/.test(name.text));
  if (!isVue && !isTsx && components.length === 0) return [];

  const location = /\/src\/components\/([^/]+)\/[^/]+$/.exec(path);
  if (!location?.[1] || !Object.hasOwn(categories, location[1])) {
    return [report('place components under src/components/<category>/')];
  }
  return components
    .slice(1)
    .map((name) => report(`move ${name.text} to its own component file`, name));
}

function main(): void {
  const root = resolve(import.meta.dir, '../..');
  const files = new Set(
    execFileSync(
      'git',
      ['ls-files', '--cached', '--others', '--exclude-standard', '--', 'packages'],
      { cwd: root, encoding: 'utf8' },
    ).split('\n'),
  );
  const errors: string[] = [];
  for (const path of files) {
    if (!packageEntry.test(path) && !vueComponent.test(path) && !reactSource.test(path)) continue;
    const file = resolve(root, path);
    if (existsSync(file)) errors.push(...checkComponentLayout(path, readFileSync(file, 'utf8')));
  }
  if (errors.length > 0) {
    for (const error of errors) console.error(error);
    process.exitCode = 1;
  } else {
    console.log('Component layout passed for published package entries and adapter sources.');
  }
}

if (import.meta.main) main();
