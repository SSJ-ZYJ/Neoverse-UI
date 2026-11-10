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

// The comment metadata inside the widget uses fg-subtle. The iframe is
// cross-origin, so the Design Lab cannot assert it; keep the ratio here.
const contrastTargets = [
  { fileName: 'giscus-light.css', floor: 4.5 },
  { fileName: 'giscus-dark.css', floor: 4.5 },
] as const;

const readHex = (css: string, name: string): string => {
  const match = new RegExp(`${name}:\\s*(#[0-9a-f]{6})\\s*;`, 'i').exec(css);
  const value = match?.[1];
  if (value === undefined) throw new Error(`Missing ${name}`);
  return value;
};

const luminance = (hex: string): number => {
  const channels = hex
    .slice(1)
    .match(/../g)
    ?.map((channel) => Number.parseInt(channel, 16) / 255)
    .map((channel) => (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4));
  if (channels === undefined || channels.length !== 3) throw new Error(`Invalid ${hex}`);
  const [red, green, blue] = channels as [number, number, number];
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
};

const contrast = (foreground: string, background: string): number => {
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort(
    (first, second) => second - first,
  ) as [number, number];
  return (lighter + 0.05) / (darker + 0.05);
};

for (const fileName of files) {
  const css = await Bun.file(new URL(`../dist/${fileName}`, import.meta.url)).text();
  const missing = requiredFragments.filter((fragment) => !css.includes(fragment));
  if (missing.length > 0) {
    throw new Error(`${fileName} contract failed. Missing: ${missing.join(', ')}`);
  }
}

for (const target of contrastTargets) {
  const css = await Bun.file(new URL(`../dist/${target.fileName}`, import.meta.url)).text();
  const ratio = contrast(readHex(css, '--color-fg-subtle'), readHex(css, '--color-canvas-overlay'));
  if (ratio < target.floor) {
    throw new Error(
      `${target.fileName}: fg-subtle contrast ${ratio.toFixed(2)}:1 is below ${target.floor}:1`,
    );
  }
}

console.log(
  `Giscus theme contract passed for ${files.length} themes, fg-subtle contrast >= 4.5:1.`,
);
