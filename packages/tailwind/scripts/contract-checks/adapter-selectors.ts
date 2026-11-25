import { fileURLToPath } from 'node:url';

const ADAPTER_CLASS_LITERAL =
  /['"]((?:ui-|material-glass-)[a-z0-9_-]+(?:\s+(?:ui-|material-glass-)[a-z0-9_-]+)*)['"]/g;

export async function collectMissingAdapterSelectors(
  flattenedComponentsCss: string,
  contractCss: string,
  baseUrl: URL,
): Promise<string[]> {
  const vueClassesSource = new URL('../../vue/src/classes.ts', baseUrl);
  const vueSurfaceSource = new URL('../../vue/src/surface.ts', baseUrl);
  const reactSourceDirectory = fileURLToPath(new URL('../../react/src/', baseUrl));
  const reactFiles = [
    ...new Bun.Glob('index.tsx').scanSync({ cwd: reactSourceDirectory }),
    ...new Bun.Glob('adapters/*.{ts,tsx}').scanSync({ cwd: reactSourceDirectory }),
    ...new Bun.Glob('overlays/*.{ts,tsx}').scanSync({ cwd: reactSourceDirectory }),
  ]
    .filter((file) => !file.includes('.test.'))
    .sort();

  const [vueClasses, vueSurface, ...reactSources] = await Promise.all([
    Bun.file(vueClassesSource).text(),
    Bun.file(vueSurfaceSource).text(),
    ...reactFiles.map((file) => Bun.file(`${reactSourceDirectory}/${file}`).text()),
  ]);

  const adapterClassNames = new Set<string>();
  for (const source of [vueClasses, vueSurface, ...reactSources]) {
    for (const match of source.matchAll(ADAPTER_CLASS_LITERAL)) {
      for (const className of match[1]?.split(/\s+/) ?? []) {
        adapterClassNames.add(className);
      }
    }
  }

  const adapterCssClassNames = new Set(
    [...`${flattenedComponentsCss}\n${contractCss}`.matchAll(/\.([a-zA-Z][a-zA-Z0-9_-]*)/g)].map(
      (match) => match[1],
    ),
  );

  return [...adapterClassNames].filter((className) => !adapterCssClassNames.has(className)).sort();
}

export async function collectComponentCssIssues(componentSourceDirectory: string) {
  const componentSourceFiles = [
    ...new Bun.Glob('*.css').scanSync({ cwd: componentSourceDirectory }),
  ];
  const componentSources = await Promise.all(
    componentSourceFiles.map(async (file) => ({
      file,
      css: await Bun.file(`${componentSourceDirectory}/${file}`).text(),
    })),
  );

  const malformedComponentSelectors = componentSources.flatMap(({ file, css: sourceCss }) => {
    const classNames = [...sourceCss.matchAll(/\.([a-zA-Z][a-zA-Z0-9_-]*)/g)].map(
      (match) => match[1] ?? '',
    );
    return classNames
      .filter((className) => {
        const modifiers = className.split('--');
        const elements = className.split('__');
        const repeatedModifier =
          modifiers.length >= 3 && modifiers.at(-1) !== '' && modifiers.at(-1) === modifiers.at(-2);
        const repeatedElement =
          elements.length >= 3 && elements.at(-1) !== '' && elements.at(-1) === elements.at(-2);
        return repeatedModifier || repeatedElement;
      })
      .map((className) => `${file}:.${className}`);
  });

  const hardcodedGeometryLiterals = componentSources.flatMap(({ file, css: sourceCss }) => {
    const withoutComments = sourceCss.replace(/\/\*[\s\S]*?\*\//g, '');
    return [...withoutComments.matchAll(/\b\d+(?:\.\d+)?(?:rem|px)\b/g)].map(
      (match) => `${file}:${match[0]}`,
    );
  });

  return { malformedComponentSelectors, hardcodedGeometryLiterals };
}
