const files = ['giscus-light.css', 'giscus-dark.css'] as const;
const requiredFragments = [
  'main {',
  '.gsc-main {',
  '.gsc-comment-box',
  '.gsc-comment-box-write',
  '.btn-primary',
  '*:focus-visible',
  '@media (prefers-reduced-motion: reduce)',
] as const;

for (const fileName of files) {
  const css = await Bun.file(new URL(`../dist/${fileName}`, import.meta.url)).text();
  const missing = requiredFragments.filter((fragment) => !css.includes(fragment));
  if (missing.length > 0) {
    throw new Error(`${fileName} contract failed. Missing: ${missing.join(', ')}`);
  }
}

console.log(`Giscus theme contract passed for ${files.length} themes.`);
