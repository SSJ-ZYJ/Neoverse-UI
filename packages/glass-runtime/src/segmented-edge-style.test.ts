import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it } from 'vitest';

const read = (path: string): string => readFileSync(new URL(path, import.meta.url), 'utf8');
const unwrap = (source: string): string =>
  source.slice(source.indexOf('{') + 1, source.lastIndexOf('}'));
const source = read('../../tailwind/src/components/segmented-control.css');
const componentCss = unwrap(source.slice(0, source.indexOf('@layer utilities')));
const primitivesCss = unwrap(read('../../tokens/src/primitives.css'));
const geometryCss = unwrap(read('../../tokens/src/geometry.css'));
const feedbackCss = unwrap(read('../../tokens/src/effects.css'));
const effectsCss = unwrap(read('../../tokens/src/control-effects.css'));
const tokenCss = unwrap(read('../../tokens/src/components/segmented-control.css'));
const lightCss = unwrap(read('../../tokens/src/themes/light.css'));
const darkCss = unwrap(read('../../tokens/src/themes/dark.css'));

// happy-dom does not resolve every nested CSS variable, so resolve them against
// the actual theme and component declarations without claiming rendered pixels.
const resolveVars = (element: Element, input: string, seen = new Set<string>()): string => {
  const start = input.indexOf('var(');
  if (start < 0) return input.trim();
  let depth = 1;
  let comma = -1;
  let end = start + 4;
  for (; end < input.length && depth > 0; end += 1) {
    const character = input[end];
    if (character === '(') depth += 1;
    if (character === ')') depth -= 1;
    if (character === ',' && depth === 1 && comma < 0) comma = end;
  }
  if (depth !== 0) throw new Error(`Unbalanced CSS variable: ${input}`);
  const name = input.slice(start + 4, comma < 0 ? end - 1 : comma).trim();
  const fallback = comma < 0 ? '' : input.slice(comma + 1, end - 1).trim();
  let owner: Element | null = element;
  let raw = '';
  while (owner && !raw) {
    raw = getComputedStyle(owner).getPropertyValue(name).trim();
    owner = owner.parentElement;
  }
  const value = !raw || raw === 'initial' || seen.has(name) ? fallback : raw;
  return resolveVars(
    element,
    input.slice(0, start) + resolveVars(element, value, new Set(seen).add(name)) + input.slice(end),
    seen,
  );
};

const install = (theme: 'light' | 'dark', renderer: 'webgl' | 'none') => {
  document.documentElement.dataset.theme = theme;
  if (renderer === 'webgl') document.documentElement.dataset.neoverseGlassRenderer = 'webgl';
  const style = document.createElement('style');
  style.textContent = `
    ${primitivesCss}
    ${geometryCss}
    ${feedbackCss}
    ${effectsCss}
    ${tokenCss}
    :root[data-theme='light'] { ${lightCss} }
    :root[data-theme='dark'] { ${darkCss} }
    ${componentCss}
  `;
  document.head.append(style);
  const control = document.createElement('div');
  control.className = 'ui-segmented-control';
  const slider = document.createElement('span');
  slider.className = 'ui-segmented-control__slider';
  control.append(slider);
  document.body.append(control);
  return { control, slider };
};

describe('segmented selection styling', () => {
  afterEach(() => {
    document.head.replaceChildren();
    document.body.replaceChildren();
    delete document.documentElement.dataset.theme;
    delete document.documentElement.dataset.neoverseGlassRenderer;
  });

  it.each(['webgl', 'none'] as const)(
    'uses the 0.3.0 pale outline in light mode with renderer %s',
    (renderer) => {
      const { control, slider } = install('light', renderer);
      const outline = () =>
        resolveVars(slider, 'var(--neoverse-control-segmented-active-border)').replace(/\s+/g, ' ');
      expect(outline()).toBe('color-mix( in srgb, rgb(116 186 229 / 48%) 34%, transparent )');
      control.dataset.surface = 'none';
      expect(outline()).toBe('color-mix( in srgb, rgb(116 186 229 / 48%) 34%, transparent )');
      control.style.setProperty('--neoverse-control-segmented-active-border', 'red');
      expect(outline()).toBe('red');
    },
  );

  it.each(['webgl', 'none'] as const)(
    'uses the 0.3.0 selected field in light mode with renderer %s',
    (renderer) => {
      const { slider } = install('light', renderer);
      const field = resolveVars(
        slider,
        'var(--neoverse-control-segmented-active-background)',
      ).replace(/\s*([(),])\s*/g, '$1');
      expect(field).toBe(
        'linear-gradient(145deg,color-mix(in srgb,#34c99a 24%,transparent),color-mix(in srgb,#74bae5 10%,transparent))',
      );
      const navigationField = resolveVars(
        slider,
        'var(--neoverse-navigation-item-active-background)',
      ).replace(/\s+/g, ' ');
      expect(navigationField).toContain('#3d95e6');
    },
  );

  it.each(['webgl', 'none'] as const)(
    'preserves the transparent dark selection border with renderer %s',
    (renderer) => {
      const { slider } = install('dark', renderer);
      expect(resolveVars(slider, 'var(--neoverse-control-segmented-active-border)')).toBe(
        'transparent',
      );
    },
  );

  it('uses the shared thin solid border without a separate slider edge field', () => {
    expect(source).toMatch(
      /border:\s*var\(--neoverse-border-width-thin\)\s+var\(--neoverse-border-style-solid\)\s+var\(--neoverse-control-segmented-active-border\)/,
    );
    expect(source).not.toMatch(/\.ui-segmented-control__slider[^{]*::before/);
  });

  it.each(['light', 'dark'] as const)(
    'keeps the unselected label on the neutral hover foreground in %s mode',
    (theme) => {
      const { control } = install(theme, 'none');
      const option = document.createElement('button');
      option.className = 'ui-segmented-control__option';
      control.append(option);
      const hovered = resolveVars(option, 'var(--neoverse-control-segmented-hover-foreground)');
      expect(hovered).toBe(theme === 'light' ? '#0f172a' : '#f4f8fc');
      expect(hovered).not.toBe(
        resolveVars(option, 'var(--neoverse-control-segmented-active-foreground)'),
      );
    },
  );

  it('reserves the selected accent for the active label and keeps the press wash stable', () => {
    const activeAccentUses = source.match(/--neoverse-control-segmented-active-foreground/g) ?? [];
    expect(activeAccentUses).toHaveLength(1);
    expect(source).toContain('color: var(--neoverse-control-segmented-hover-foreground);');
    // Press feedback must not swap the hover wash for a different background.
    expect(source).not.toContain('--neoverse-effect-press-wash');
    const pressRule = source.slice(source.indexOf('.ui-segmented-control__option:active'));
    expect(pressRule.slice(0, pressRule.indexOf('}'))).not.toContain('background');
  });
});
