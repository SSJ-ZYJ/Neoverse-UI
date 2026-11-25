import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it } from 'vitest';

const read = (path: string): string => readFileSync(new URL(path, import.meta.url), 'utf8');
const unwrap = (source: string): string =>
  source.slice(source.indexOf('{') + 1, source.lastIndexOf('}'));
const source = read('../../tailwind/src/components/segmented-control.css');
const componentCss = unwrap(source.slice(0, source.indexOf('@layer utilities')));
const primitivesCss = unwrap(read('../../tokens/src/primitives.css'));
const materialCss = unwrap(read('../../tokens/src/material.css'));
const geometryCss = unwrap(read('../../tokens/src/geometry.css'));
const feedbackCss = unwrap(read('../../tokens/src/effects.css'));
const effectsCss = unwrap(read('../../tokens/src/control-effects.css'));
const sharedControlCss = unwrap(read('../../tokens/src/components/shared-control.css'));
const controlSurfaceTokenCss = unwrap(read('../../tokens/src/components/control-surface.css'));
const tokenCss = unwrap(read('../../tokens/src/components/segmented-control.css'));
const navigationTokenCss = unwrap(read('../../tokens/src/components/navigation-item.css'));
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
    ${materialCss}
    ${geometryCss}
    ${feedbackCss}
    ${effectsCss}
    ${sharedControlCss}
    ${controlSurfaceTokenCss}
    ${tokenCss}
    ${navigationTokenCss}
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
    'keeps the slider border transparent by default in light mode with renderer %s',
    (renderer) => {
      const { control, slider } = install('light', renderer);
      const outline = () =>
        resolveVars(slider, 'var(--neoverse-control-segmented-active-border)').replace(/\s+/g, ' ');
      expect(outline()).toBe('transparent');
      control.dataset.surface = 'none';
      expect(outline()).toBe('transparent');
      control.style.setProperty('--neoverse-control-segmented-active-border', 'red');
      expect(outline()).toBe('red');
    },
  );

  it.each(['webgl', 'none'] as const)(
    'uses a translucent frosted ice-azure selected field and blur filter in light mode with renderer %s',
    (renderer) => {
      const { slider } = install('light', renderer);
      const normalize = (value: string) =>
        value
          .replace(/\s*([(),])\s*/g, '$1')
          .replace(/\s+/g, ' ')
          .trim();
      const field = normalize(
        resolveVars(slider, 'var(--neoverse-control-segmented-active-background)'),
      );
      expect(field).toBe(
        'linear-gradient(155deg,color-mix(in srgb,#e0f2fe 28%,transparent),color-mix(in srgb,#3d95e6 24%,transparent))',
      );
      expect(field).not.toContain('#ffffff');
      const fill = normalize(resolveVars(slider, 'var(--neoverse-control-segmented-active-fill)'));
      expect(fill).toBe('color-mix(in srgb,#7dd3fc 28%,transparent)');
      expect(fill).not.toContain('#ffffff');
      const filter = resolveVars(slider, 'var(--neoverse-control-segmented-active-filter)').replace(
        /\s+/g,
        ' ',
      );
      expect(filter).toBe(
        resolveVars(slider, 'var(--neoverse-navigation-item-filter)').replace(/\s+/g, ' '),
      );
      expect(filter).toContain('blur(12px)');
      const navigationField = normalize(
        resolveVars(slider, 'var(--neoverse-navigation-item-active-background)'),
      );
      expect(navigationField).toBe(field);
      expect(resolveVars(slider, 'var(--neoverse-navigation-item-indicator-color)')).toBe(
        '#3d95e6',
      );
    },
  );

  it.each(['webgl', 'none'] as const)(
    'matches the primary sky-blue fill, transparent border, dark primary ink and primary indicator in dark mode with renderer %s',
    (renderer) => {
      const { slider } = install('dark', renderer);
      const normalize = (value: string) =>
        value
          .replace(/\s*([(),])\s*/g, '$1')
          .replace(/\s+/g, ' ')
          .trim();
      expect(resolveVars(slider, 'var(--neoverse-control-segmented-active-border)')).toBe(
        'transparent',
      );
      expect(
        normalize(resolveVars(slider, 'var(--neoverse-control-segmented-active-background)')),
      ).toBe('linear-gradient(155deg,rgb(126 202 253 / 12%),rgb(85 172 232 / 8%))');
      expect(normalize(resolveVars(slider, 'var(--neoverse-control-segmented-active-fill)'))).toBe(
        normalize(resolveVars(slider, 'var(--neoverse-effect-primary-rest-field-dark)')),
      );
      expect(normalize(resolveVars(slider, 'var(--neoverse-control-segmented-active-fill)'))).toBe(
        'rgb(101 186 242 / 86%)',
      );
      expect(
        normalize(resolveVars(slider, 'var(--neoverse-control-segmented-active-hover-fill)')),
      ).toBe(normalize(resolveVars(slider, 'var(--neoverse-control-primary-hover-background)')));
      expect(
        normalize(resolveVars(slider, 'var(--neoverse-control-segmented-active-press-fill)')),
      ).toBe(normalize(resolveVars(slider, 'var(--neoverse-control-primary-active-background)')));
      expect(resolveVars(slider, 'var(--neoverse-control-segmented-active-foreground)')).toBe(
        resolveVars(slider, 'var(--neoverse-control-primary-foreground)'),
      );
      expect(resolveVars(slider, 'var(--neoverse-navigation-item-indicator-color)')).toBe(
        '#0369a1',
      );
    },
  );

  it('keeps NavigationItem sm, md and lg sizes strictly distinct across height, font and icon tokens', () => {
    const { control } = install('light', 'none');
    expect(resolveVars(control, 'var(--neoverse-navigation-item-height-sm)')).toBe('1.75rem');
    expect(resolveVars(control, 'var(--neoverse-navigation-item-height-md)')).toBe('2rem');
    expect(resolveVars(control, 'var(--neoverse-navigation-item-height-lg)')).toBe('2.5rem');
    expect(resolveVars(control, 'var(--neoverse-navigation-item-font-size-sm)')).toBe('0.8125rem');
    expect(resolveVars(control, 'var(--neoverse-navigation-item-font-size-md)')).toBe('0.875rem');
    expect(resolveVars(control, 'var(--neoverse-navigation-item-icon-size-sm)')).toBe('0.875rem');
    expect(resolveVars(control, 'var(--neoverse-navigation-item-icon-size-md)')).toBe('1rem');
  });

  it.each(['light', 'dark'] as const)(
    'omits any top stroke or outer shadow bleed on the slider in %s mode',
    (theme) => {
      const { slider } = install(theme, 'none');
      expect(resolveVars(slider, 'var(--neoverse-control-segmented-active-shadow)')).toBe('none');
    },
  );

  it('uses the shared thin solid border, origin-aligned non-repeating fill, shape modifiers and no separate slider edge field', () => {
    expect(source).toMatch(
      /border:\s*var\(--neoverse-border-width-thin\)\s+var\(--neoverse-border-style-solid\)\s+var\(--neoverse-control-segmented-active-border\)/,
    );
    expect(source).toContain('background-origin: border-box;');
    expect(source).toContain('background-repeat: no-repeat;');
    expect(source).not.toMatch(/\.ui-segmented-control__slider[^{]*::before/);
    expect(source).toContain('.ui-segmented-control--pill');
    expect(source).toContain('.ui-segmented-control--rounded');
  });

  it.each(['light', 'dark'] as const)(
    'pairs the active option with selected-choice contrast while keeping unselected options secondary in %s mode',
    (theme) => {
      const { control } = install(theme, 'none');
      const option = document.createElement('button');
      option.className = 'ui-segmented-control__option';
      control.append(option);
      const resting = resolveVars(option, 'var(--neoverse-control-segmented-foreground)');
      const active = resolveVars(option, 'var(--neoverse-control-segmented-active-foreground)');
      expect(resting).not.toBe(active);
      expect(active).toBe(resolveVars(option, 'var(--neoverse-effect-choice-selected-foreground)'));
      if (theme === 'light') {
        expect(active).toBe(resolveVars(option, 'var(--neoverse-color-text-primary)'));
      } else {
        expect(active).toBe(resolveVars(option, 'var(--neoverse-control-primary-foreground)'));
      }
      expect(source).not.toContain('color: var(--neoverse-control-segmented-hover-foreground)');
    },
  );

  it('uses primary text for the active option, keeps default focus ring, and keeps the press wash stable', () => {
    const activeAccentUses = source.match(/--neoverse-control-segmented-active-foreground/g) ?? [];
    expect(activeAccentUses).toHaveLength(1);
    expect(source).not.toContain(
      '--neoverse-color-focus-ring: var(--neoverse-control-segmented-active-foreground);',
    );
    expect(source).toContain('color: var(--neoverse-control-segmented-active-foreground);');
    expect(source).toContain('background-color: var(--neoverse-quiet-control-feedback);');
    expect(source).not.toContain('--neoverse-effect-press-wash');
    expect(source).not.toContain('--neoverse-effect-press-shadow');
  });

  it('squishes only capsule pills on press and scales circular and rounded thumbs uniformly', () => {
    expect(source).toContain('transform-origin: center;');
    expect(source).toContain('scale: var(--neoverse-control-segmented-press-scale);');
    expect(source).toContain(
      'scale: var(--neoverse-control-segmented-press-scale)\n      var(--neoverse-control-segmented-pill-press-scale-y);',
    );
    expect(source).toContain('scale: var(--neoverse-control-segmented-circular-press-scale);');
  });
});
