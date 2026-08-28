import { fileURLToPath } from 'node:url';

const workspaceRoot = new URL('../', import.meta.url);
const workspacePath = fileURLToPath(workspaceRoot);
const sourcePatterns = ['apps/**/src/**/*', 'packages/vue/src/**/*', 'packages/react/src/**/*'];
const sourceExtensions: Record<string, true> = {
  '.js': true,
  '.jsx': true,
  '.ts': true,
  '.tsx': true,
  '.vue': true,
};
const ignoredSuffixes = [
  '.test.js',
  '.test.jsx',
  '.test.ts',
  '.test.tsx',
  '.test.vue',
  '.spec.js',
  '.spec.jsx',
  '.spec.ts',
  '.spec.tsx',
  '.spec.vue',
];

const primitiveColorFamilies =
  'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose';
const colorUtility = new RegExp(
  String.raw`(?:[a-z-]+:)*(?:bg|text|border|ring|outline|decoration|fill|stroke|from|via|to|placeholder|caret|accent|divide)-(?:${primitiveColorFamilies})-(?:50|100|200|300|400|500|600|700|800|900|950)(?:\/\d+)?`,
  'g',
);
const radiusUtility = /(?:[a-z-]+:)*rounded-(?:none|xs|sm|md|lg|xl|2xl)(?:\/[a-z-]+)?/g;
const shadowUtility = /(?:[a-z-]+:)*shadow-(?:none|xs|sm|md|lg|xl|inset)(?:\/[a-z-]+)?/g;

const materialUtility = /(?:[a-z-]+:)*material-glass-(?:subtle|elevated|immersive)/g;
const classAttribute = /\b(?:class|className)\s*=\s*(["'`])([\s\S]*?)\1/g;
const markupTag = /<\/?([A-Za-z][\w.-]*)([^<>]*?)>/g;
const voidElements: Record<string, true> = {
  area: true,
  base: true,
  br: true,
  col: true,
  embed: true,
  hr: true,
  img: true,
  input: true,
  link: true,
  meta: true,
  param: true,
  source: true,
  track: true,
  wbr: true,
};

type MarkupElement = {
  name: string;
  glass: boolean;
  utility: string | undefined;
  line: number;
};

const checkMaterialNesting = (source: string, path: string): void => {
  const stack: MarkupElement[] = [];

  for (const match of source.matchAll(markupTag)) {
    const rawTag = match[0];
    const name = match[1];
    const attributes = match[2] ?? '';
    const line = source.slice(0, match.index ?? 0).split('\n').length;

    if (name === undefined) {
      continue;
    }

    if (rawTag.startsWith('</')) {
      let closingIndex = -1;
      for (let index = stack.length - 1; index >= 0; index -= 1) {
        if (stack[index]?.name === name) {
          closingIndex = index;
          break;
        }
      }

      if (closingIndex !== -1) {
        stack.splice(closingIndex);
      }
      continue;
    }

    const classValues = [...attributes.matchAll(classAttribute)]
      .map(([, , value]) => value)
      .filter((value): value is string => value !== undefined);
    const glassClasses = classValues.flatMap((value) =>
      [...value.matchAll(materialUtility)].map(([utility]) => utility),
    );
    if (glassClasses.length > 1) {
      violations.push(
        `${path}:${line}: multiple Glass material utilities on one element: ${glassClasses.join(', ')}`,
      );
    }

    let glassAncestor: MarkupElement | undefined;
    for (let index = stack.length - 1; index >= 0; index -= 1) {
      const element = stack[index];
      if (element?.glass) {
        glassAncestor = element;
        break;
      }
    }

    if (glassAncestor !== undefined && glassClasses.length > 0) {
      violations.push(
        `${path}:${line}: Glass material "${glassClasses[0]}" is nested under "${glassAncestor.utility ?? glassAncestor.name}" at line ${glassAncestor.line}`,
      );
    }

    if (
      !rawTag.endsWith('/>') &&
      voidElements[name.toLowerCase()] !== true &&
      !(name.length === 1 && name === name.toUpperCase())
    ) {
      stack.push({
        name,
        glass: glassClasses.length > 0,
        utility: glassClasses[0],
        line,
      });
    }
  }
};

const violations: string[] = [];
const files = new Set<string>();

for (const pattern of sourcePatterns) {
  const glob = new Bun.Glob(pattern);
  for await (const path of glob.scan({ cwd: workspacePath })) {
    const extension = path.slice(path.lastIndexOf('.'));
    if (
      sourceExtensions[extension] !== true ||
      ignoredSuffixes.some((suffix) => path.endsWith(suffix))
    ) {
      continue;
    }

    files.add(path);
  }
}

for (const path of [...files].sort()) {
  const source = await Bun.file(new URL(path, workspaceRoot)).text();
  checkMaterialNesting(source, path);
  const patterns = [
    ['primitive color', colorUtility],
    ['geometric radius', radiusUtility],
    ['geometric shadow', shadowUtility],
  ] as const;

  for (const [category, pattern] of patterns) {
    for (const match of source.matchAll(pattern)) {
      const line = source.slice(0, match.index ?? 0).split('\n').length;
      violations.push(`${path}:${line}: ${category} utility "${match[0]}"`);
    }
  }
}

if (violations.length > 0) {
  throw new Error(['Tailwind semantic utility contract failed:', ...violations].join('\n'));
}

console.log(`Tailwind semantic utility check passed for ${files.size} source file(s).`);
