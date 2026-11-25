import { expect, test } from 'bun:test';

const source = (name: string) => Bun.file(new URL(name, import.meta.url)).text();

test('publishes three monotonic tiers with exactly one background alpha', async () => {
  const material = (await source('material.css')).replace(/\s+/g, ' ');
  for (const [tier, size, blur] of [
    ['subtle', 'sm', 12],
    ['elevated', 'md', 18],
    ['immersive', 'lg', 24],
  ] as const) {
    expect(material).toContain(`--neoverse-material-blur-${size}: ${blur}px;`);
    expect(material).toContain(
      `--neoverse-material-glass-${tier}-tint: var(--neoverse-material-glass-base-tint);`,
    );
    expect(material).toContain(
      `var(--neoverse-material-glass-${tier}-tint) var(--neoverse-material-glass-${tier}-transparency), transparent`,
    );
  }
});

test('light keeps the restored 0.2.0 edge inputs with a softer surface alpha', async () => {
  const light = await source('themes/light.css');
  const dark = await source('themes/dark.css');
  expect(light).toContain('--neoverse-material-edge-refraction-gain: 1;');
  expect(dark).toContain('--neoverse-material-edge-refraction-gain: 1;');
  for (const [tier, compactOpacity, surfaceOpacity, carrier] of [
    ['subtle', 0.16, 0.36, 22],
    ['elevated', 0.22, 0.38, 24],
    ['immersive', 0.14, 0.4, 18],
  ] as const) {
    expect(light).toContain(
      `--neoverse-material-edge-refraction-opacity-${tier}: ${compactOpacity};`,
    );
    expect(light).toContain(`--neoverse-surface-glass-${tier}-edge-opacity: ${surfaceOpacity};`);
    expect(light).toContain(`--neoverse-material-edge-refraction-chroma-${tier}: 1;`);
    expect(light.replace(/\s+/g, ' ')).toContain(
      `--neoverse-material-edge-refraction-carrier-${tier}: color-mix( in srgb, var(--neoverse-color-border-default) ${carrier}%, transparent );`,
    );
  }
});

test('theme tints and command decoration follow shared material roles', async () => {
  for (const theme of ['light', 'dark']) {
    const css = await source(`themes/${theme}.css`);
    expect(css).toMatch(/--neoverse-material-glass-base-tint:\s*rgb\(\d+ \d+ \d+\);/);
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
  const vue = await Bun.file(new URL('../../vue/src/types/controls.ts', import.meta.url)).text();
  const react = await Bun.file(
    new URL('../../react/src/components/surfaces/control-surface.tsx', import.meta.url),
  ).text();
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
  }
  const status = await source('components/status-indicator.css');
  expect(status).toContain('var(--neoverse-effect-pulse-mid-opacity)');
});

test('opted-in Glass strokes precede highlights without changing button edges', async () => {
  const material = await source('material.css');
  const dark = await source('themes/dark.css');
  const css = await Bun.file(new URL('../../tailwind/src/theme.css', import.meta.url)).text();

  expect(material).toContain('--neoverse-material-edge-stroke: 0 0 transparent;');
  expect(dark).toMatch(/--neoverse-material-edge-stroke:\s*inset 0 0 0/);
  expect(css).toMatch(
    /:not\(\s*\.ui-button\s*\)\[data-neoverse-glass-edge-stroke\]\s*\{\s*box-shadow:\s*var\(--neoverse-material-edge-stroke\),\s*var\(--neoverse-material-edge-highlight\)/,
  );
  expect(css).toMatch(
    /\[data-neoverse-glass-edge-stroke\]\s*\{\s*box-shadow:\s*var\(--neoverse-material-edge-stroke\),\s*var\(--neoverse-material-shadow\)/,
  );
});

test('disclosure boundaries use the shared directional inset edge in both themes', async () => {
  for (const theme of ['light', 'dark']) {
    const css = await source(`themes/${theme}.css`);
    expect(css).toContain(
      '--neoverse-disclosure-edge-rest: var(--neoverse-surface-inset-edge-rest);',
    );
    expect(css).toContain(
      '--neoverse-disclosure-edge-active: var(--neoverse-surface-inset-edge-active);',
    );
    expect(css).not.toMatch(
      /--neoverse-disclosure-edge-(?:rest|active):\s*var\(--neoverse-surface-inset-outline/,
    );
  }
});

test('reduced transparency keeps the opted-in stroke ahead of the fallback shadow', async () => {
  const css = await Bun.file(new URL('../../tailwind/src/theme.css', import.meta.url)).text();
  const reduced = css.slice(css.indexOf('@media (prefers-reduced-transparency: reduce)'));

  expect(reduced).toContain('-webkit-backdrop-filter: none;');
  expect(reduced).toContain('backdrop-filter: none;');
  expect(reduced).toMatch(
    /:not\(\s*\.ui-button\s*\)\[data-neoverse-glass-edge-stroke\]\s*\{\s*box-shadow:\s*var\(--neoverse-material-edge-stroke\),\s*var\(--neoverse-material-edge-highlight\)/,
  );
});
