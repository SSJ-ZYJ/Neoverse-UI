import { expect, test } from 'bun:test';

const source = (name: string) => Bun.file(new URL(name, import.meta.url)).text();

test('publishes three monotonic tiers with exactly one background alpha', async () => {
  const material = (await source('material.css')).replace(/\s+/g, ' ');
  for (const [tier, size, blur, opacity] of [
    ['subtle', 'sm', 12, 15],
    ['elevated', 'md', 18, 20],
    ['immersive', 'lg', 24, 30],
  ] as const) {
    expect(material).toContain(`--neoverse-material-blur-${size}: ${blur}px;`);
    expect(material).toContain(`--neoverse-material-transparency-${tier}: ${opacity}%;`);
    expect(material).toContain(
      `--neoverse-material-glass-${tier}-tint: var(--neoverse-material-glass-base-tint);`,
    );
    expect(material).toContain(
      `var(--neoverse-material-glass-${tier}-tint) var(--neoverse-material-glass-${tier}-transparency), transparent`,
    );
  }
});

test('themes cannot redefine Glass optics and command decoration aliases shared roles', async () => {
  for (const theme of ['light', 'dark']) {
    const css = await source(`themes/${theme}.css`);
    expect(css).toMatch(/--neoverse-material-glass-base-tint:\s*rgb\(\d+ \d+ \d+\);/);
    expect(css).not.toMatch(
      /--neoverse-material-(?:filter|transparency)-(?:subtle|elevated|immersive)\s*:/,
    );
    expect(css).not.toMatch(/--neoverse-control-button-(?:filter|filled-fill)\s*:/);
    if (theme === 'dark') {
      expect(css).toMatch(
        /--neoverse-control-button-filled-background:\s*var\(--neoverse-effect-command-rest-field-dark\);/,
      );
      expect(css).toMatch(
        /--neoverse-control-primary-background:\s*var\(--neoverse-effect-primary-rest-field-dark\);/,
      );
    }
  }
});

test('dependent recipes compose at local material owners for consumer overrides', async () => {
  const effects = await source('effects.css');
  expect(effects).toContain(':where(');
  expect(effects).toContain('.ui-input');
  expect(effects).toContain('.ui-skeleton');
  for (const tier of ['subtle', 'elevated', 'immersive']) {
    expect(effects).toContain(
      `--neoverse-material-glass-${tier}-filter: blur(var(--neoverse-material-glass-${tier}-blur))`,
    );
    expect(effects).toContain(`var(--neoverse-material-glass-${tier}-transparency)`);
  }
});

test('all control adapters accept the three presets without losing none', async () => {
  const vue = await Bun.file(new URL('../../vue/src/types.ts', import.meta.url)).text();
  const react = await Bun.file(new URL('../../react/src/index.tsx', import.meta.url)).text();
  for (const adapter of [vue, react]) {
    expect(adapter).toMatch(
      /ControlSurfacePreset[^;]*'none'[^;]*'glass-subtle'[^;]*'glass-elevated'[^;]*'glass-immersive'/,
    );
  }
});

test('semantic effects share one disabled and loading vocabulary', async () => {
  const components = ['button', 'segmented-control', 'form-control', 'overlay'];
  for (const name of components) {
    const css = await source(`components/${name}.css`);
    expect(css).toContain('var(--neoverse-effect-disabled-content-opacity)');
    expect(css).not.toMatch(/--[\w-]*disabled-opacity:\s*0\./);
  }
  const skeleton = await source('components/skeleton.css');
  const status = await source('components/status-indicator.css');
  expect(skeleton).toContain('var(--neoverse-effect-pulse-mid-opacity)');
  expect(status).toContain('var(--neoverse-effect-pulse-mid-opacity)');
});

test('hover and press do not rewrite filled-button optics or dim the whole material', async () => {
  const css = await Bun.file(
    new URL('../../tailwind/src/components/button.css', import.meta.url),
  ).text();
  expect(css).toContain('@media (hover: hover)');
  expect(css).toContain(":active:not(:disabled):not([aria-disabled='true'])");
  expect(css).toContain('var(--neoverse-effect-hover-opacity)');
  expect(css).toContain('var(--neoverse-effect-press-opacity)');
  expect(css).toContain('> :not(.ui-button__edge-field)');
  expect(css).not.toContain('background-color: var(--neoverse-control-button-filled-hover-fill)');
});
