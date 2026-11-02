import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it } from 'vitest';

const read = (path: string): string => readFileSync(new URL(path, import.meta.url), 'utf8');
const unwrap = (source: string, marker: string): string => {
  const start = source.indexOf('{', source.indexOf(marker));
  return source.slice(start + 1, source.lastIndexOf('}'));
};

// happy-dom does not support @layer and cannot resolve every nested var()
// fallback. Keep the actual component rules and resolve their computed custom
// properties separately, without pretending this is a rendered-pixel test.
const componentCss = unwrap(read('../../tailwind/src/components/form-control.css'), '@layer')
  .replaceAll(':popover-open', '[data-test-popover-open]')
  .replaceAll(':modal', '[data-test-modal]');
// happy-dom fails to match a descendant selector inside :where(). Expand only
// the table-owner selector so prose-table token resolution can be exercised.
const tableCss = unwrap(read('../../tailwind/src/components/table.css'), '@layer')
  .replace(
    ':where(.ui-table, .neoverse-prose table) {',
    ':where(.ui-table), :where(.neoverse-prose) table {',
  )
  .replaceAll('@media (hover: hover)', '@media all')
  .replaceAll('tr:hover td', 'tr[data-test-hover] td');
const materialCss = unwrap(read('../../tokens/src/material.css'), '@layer');
const controlEffectsCss = unwrap(read('../../tokens/src/control-effects.css'), '@layer');
const tokenCss = unwrap(read('../../tokens/src/components/form-control.css'), '@layer');
const tableTokenCss = unwrap(read('../../tokens/src/components/table.css'), '@layer');
const disclosureCss = unwrap(
  read('../../tailwind/src/components/disclosure.css'),
  '@layer',
).replace(
  ':where(.ui-disclosure, .neoverse-prose details) {',
  ':where(.ui-disclosure), :where(.neoverse-prose) details {',
);
const disclosureTokenCss = unwrap(read('../../tokens/src/components/disclosure.css'), '@layer');
const lightCss = unwrap(read('../../tokens/src/themes/light.css'), '@neoverse-light-tokens');
const darkCss = unwrap(read('../../tokens/src/themes/dark.css'), '@neoverse-dark-tokens');

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
  const nextSeen = new Set(seen).add(name);
  return resolveVars(
    element,
    input.slice(0, start) + resolveVars(element, value, nextSeen) + input.slice(end),
    seen,
  );
};

const installStyles = (
  theme: 'light' | 'dark',
  renderer: 'webgl' | 'none',
  reducedTransparency = false,
): void => {
  document.documentElement.dataset.theme = theme;
  if (renderer === 'webgl') document.documentElement.dataset.neoverseGlassRenderer = 'webgl';
  else delete document.documentElement.dataset.neoverseGlassRenderer;
  const style = document.createElement('style');
  style.textContent = `
    ${materialCss}
    :root {
      --neoverse-shadow-inset: inset 0 -1px 2px rgb(14 34 44 / 8%);
      --neoverse-material-edge-highlight-subtle: inset 0 1px 2px white;
      --neoverse-surface-inset-active-highlight: inset 0 1px 0 blue;
      --neoverse-shadow-control: 0 2px 6px black;
      --neoverse-border-width-none: 0px;
    }
    ${controlEffectsCss}
    ${tokenCss}
    ${tableTokenCss}
    ${disclosureTokenCss}
    :root[data-theme='light'] { ${lightCss} }
    :root[data-theme='dark'] { ${darkCss} }
    ${reducedTransparency ? componentCss.replaceAll('@media (prefers-reduced-transparency: reduce)', '@media all') : componentCss}
    ${tableCss}
    ${disclosureCss}
  `;
  document.head.append(style);
};

const property = (element: Element, name: string): string => {
  const style = getComputedStyle(element);
  return resolveVars(element, style.getPropertyValue(name));
};

describe('form control shadows with the shared Glass renderer', () => {
  afterEach(() => {
    document.head.replaceChildren();
    document.body.replaceChildren();
    delete document.documentElement.dataset.theme;
    delete document.documentElement.dataset.neoverseGlassRenderer;
  });

  it.each([
    ['light', 'webgl'],
    ['light', 'none'],
    ['dark', 'webgl'],
    ['dark', 'none'],
  ] as const)(
    'adds the shared control elevation in %s mode with %s renderer',
    (theme, renderer) => {
      installStyles(theme, renderer);
      const input = document.createElement('input');
      input.className = 'ui-input';
      const select = document.createElement('summary');
      select.className = 'ui-select';
      const shell = document.createElement('span');
      shell.className = 'ui-textarea-shell';
      const textarea = document.createElement('textarea');
      textarea.className = 'ui-textarea';
      shell.append(textarea);
      document.body.append(input, select, shell);
      const elevation = property(document.documentElement, '--neoverse-shadow-control');
      const bloom = property(document.documentElement, '--neoverse-material-glass-subtle-bloom');

      expect(property(input, 'box-shadow')).toContain(elevation);
      expect(property(input, 'box-shadow')).toContain(bloom);
      expect(property(select, 'box-shadow')).toContain(elevation);
      expect(property(select, 'box-shadow')).toContain(bloom);
      expect(property(input, '--neoverse-form-control-effective-hover-shadow')).toContain(
        elevation,
      );
      expect(property(input, '--neoverse-form-control-effective-hover-shadow')).toContain(bloom);
      expect(property(input, '--neoverse-form-control-effective-focus-shadow')).toContain(
        elevation,
      );
      expect(property(input, '--neoverse-form-control-effective-focus-shadow')).toContain(bloom);
      // The textarea is clipped by the resizable shell, so its shadow belongs on the shell.
      expect(property(shell, 'overflow')).toBe('hidden');
      expect(property(shell, 'box-shadow')).toContain(elevation);
      expect(property(shell, 'box-shadow')).toContain(bloom);
    },
  );

  it.each([
    ['light', 'webgl'],
    ['light', 'none'],
    ['dark', 'webgl'],
    ['dark', 'none'],
  ] as const)(
    'keeps %s choice plates elevated in checked and unchecked states with %s renderer',
    (theme, renderer) => {
      installStyles(theme, renderer);
      const choice = document.createElement('label');
      choice.className = 'ui-choice';
      const input = document.createElement('input');
      input.className = 'ui-choice__native';
      input.type = 'checkbox';
      const plate = document.createElement('span');
      plate.className = 'ui-choice__control';
      choice.append(input, plate);
      document.body.append(choice);
      const elevation = property(document.documentElement, '--neoverse-shadow-control');

      expect(property(plate, 'box-shadow')).toContain(elevation);
      input.checked = true;
      expect(property(plate, 'box-shadow')).toContain(elevation);
    },
  );

  it.each(['light', 'dark'] as const)(
    'keeps %s disabled and validation feedback alongside the control elevation',
    (theme) => {
      installStyles(theme, 'webgl');
      const input = document.createElement('input');
      input.className = 'ui-input';
      input.disabled = true;
      input.dataset.validation = 'error';
      input.style.setProperty('--neoverse-form-control-validation-error-shadow', '0 0 0 2px red');
      document.body.append(input);
      expect(property(input, 'box-shadow')).toContain(
        property(document.documentElement, '--neoverse-shadow-control'),
      );
      expect(property(input, 'box-shadow')).toContain('2px red');
      expect(property(input, 'opacity')).toBe('1');
    },
  );

  it.each(['ui-input', 'ui-textarea', 'ui-select'])(
    'removes the conflicting lower inset shadow from light %s while retaining state feedback',
    (className) => {
      installStyles('light', 'webgl');
      const element = document.createElement('div');
      element.className = className;
      document.body.append(element);

      expect(property(element, '--neoverse-form-control-effective-shadow')).toBe(
        property(document.documentElement, '--neoverse-form-control-webgl-shadow'),
      );
      expect(property(element, '--neoverse-form-control-effective-hover-shadow')).toContain('blue');
      expect(property(element, '--neoverse-form-control-effective-focus-shadow')).toBe(
        property(document.documentElement, '--neoverse-form-control-webgl-focus-shadow'),
      );
      expect(property(element, '--neoverse-form-control-effective-shadow')).not.toContain(
        '14 34 44 / 8%',
      );
    },
  );

  it.each([
    ['input', 'ui-input', '0.5'],
    ['textarea', 'ui-textarea', '0.5'],
    ['summary', 'ui-select', '0.5'],
    ['span', 'ui-choice__control', '0.5'],
    ['table', 'ui-table', '0.5'],
    ['div', 'ui-select__popover', '0.54'],
  ])('resolves the dark Glass edge roles on %s', (tag, className, opacity) => {
    installStyles('dark', 'webgl');
    const element = document.createElement(tag);
    element.className = className;
    document.body.append(element);

    expect(property(element, '--neoverse-material-edge-refraction-opacity')).toBe(opacity);
    expect(property(element, '--neoverse-material-edge-refraction-chroma')).toBe('0.12');
  });

  it('resolves the same dark Glass edge roles on prose tables', () => {
    installStyles('dark', 'webgl');
    const prose = document.createElement('article');
    prose.className = 'neoverse-prose';
    const table = document.createElement('table');
    prose.append(table);
    document.body.append(prose);

    expect(property(table, '--neoverse-material-edge-refraction-opacity')).toBe('0.5');
    expect(property(table, '--neoverse-material-edge-refraction-chroma')).toBe('0.12');
  });

  it.each([
    ['light', '14 34 44'],
    ['dark', '0 0 0 / 18%'],
  ] as const)(
    'keeps %s fallback shadows without WebGL and for CSS edge passes',
    (theme, shadow) => {
      installStyles(theme, 'none');
      const ordinary = document.createElement('input');
      ordinary.className = 'ui-input';
      document.body.append(ordinary);
      expect(property(ordinary, '--neoverse-form-control-effective-shadow')).toContain(shadow);

      document.documentElement.dataset.neoverseGlassRenderer = 'webgl';
      const cssEdge = document.createElement('input');
      cssEdge.className = 'ui-input';
      cssEdge.dataset.neoverseGlassEdgePass = 'css';
      document.body.append(cssEdge);
      expect(property(cssEdge, '--neoverse-form-control-effective-shadow')).toContain(shadow);
    },
  );

  it.each(['ui-input', 'ui-textarea', 'ui-select'])(
    'keeps the dark WebGL edge free of the competing lower shadow for %s',
    (className) => {
      installStyles('dark', 'webgl');
      const element = document.createElement('div');
      element.className = className;
      document.body.append(element);

      expect(property(element, '--neoverse-form-control-effective-shadow')).toContain(
        property(document.documentElement, '--neoverse-material-edge-highlight-subtle'),
      );
      expect(property(element, '--neoverse-form-control-effective-shadow')).toContain(
        property(document.documentElement, '--neoverse-shadow-control'),
      );
      expect(property(element, '--neoverse-form-control-effective-shadow')).not.toContain(
        'rgb(0 0 0 / 18%)',
      );
      expect(property(element, '--neoverse-form-control-effective-hover-shadow')).toContain('blue');
      expect(property(element, '--neoverse-form-control-effective-focus-shadow')).toContain(
        '0 1px 3px',
      );
    },
  );

  it('preserves a custom dark WebGL shadow', () => {
    installStyles('dark', 'webgl');
    const wrapper = document.createElement('div');
    wrapper.style.setProperty('--neoverse-form-control-webgl-shadow', '0 0 5px purple');
    const input = document.createElement('input');
    input.className = 'ui-input';
    wrapper.append(input);
    document.body.append(wrapper);
    expect(property(input, '--neoverse-form-control-effective-shadow')).toBe('0 0 5px purple');
  });

  it('preserves a custom ordinary dark shadow when the renderer is absent', () => {
    installStyles('dark', 'none');
    const wrapper = document.createElement('div');
    wrapper.style.setProperty('--neoverse-form-control-shadow', '0 0 5px purple');
    const input = document.createElement('input');
    input.className = 'ui-input';
    wrapper.append(input);
    document.body.append(wrapper);
    expect(property(input, '--neoverse-form-control-effective-shadow')).toBe('0 0 5px purple');
  });

  it.each([
    ['light', '14 34 44'],
    ['dark', '0 0 0 / 18%'],
  ] as const)('keeps %s fallback shadows in a top-layer container', (theme, shadow) => {
    installStyles(theme, 'webgl');
    const topLayer = document.createElement('div');
    topLayer.setAttribute('data-test-popover-open', '');
    const input = document.createElement('input');
    input.className = 'ui-input';
    const choice = document.createElement('span');
    choice.className = 'ui-choice__control';
    topLayer.append(input, choice);
    document.body.append(topLayer);
    expect(property(input, '--neoverse-form-control-effective-shadow')).toContain(shadow);
    expect(property(choice, '--neoverse-choice-control-effective-shadow')).toContain(shadow);
  });

  it.each([
    ['light', '14 34 44'],
    ['dark', '0 0 0 / 18%'],
  ] as const)('keeps %s fallback shadows with reduced transparency', (theme, shadow) => {
    installStyles(theme, 'webgl', true);
    const input = document.createElement('input');
    input.className = 'ui-input';
    const choice = document.createElement('span');
    choice.className = 'ui-choice__control';
    document.body.append(input, choice);
    expect(property(input, '--neoverse-form-control-effective-shadow')).toContain(shadow);
    expect(property(choice, '--neoverse-choice-control-effective-shadow')).toContain(shadow);
  });

  it('uses the same light rim treatment for the inactive choice plate', () => {
    installStyles('light', 'webgl');
    const choice = document.createElement('span');
    choice.className = 'ui-choice__control';
    document.body.append(choice);
    expect(property(choice, '--neoverse-choice-control-effective-shadow')).toBe(
      property(document.documentElement, '--neoverse-choice-control-webgl-shadow'),
    );
  });

  it('keeps the competing lower inset off dark inactive choice plates', () => {
    installStyles('dark', 'webgl');
    const choice = document.createElement('span');
    choice.className = 'ui-choice__control';
    document.body.append(choice);
    expect(property(choice, '--neoverse-choice-control-effective-shadow')).toContain(
      property(document.documentElement, '--neoverse-material-edge-highlight-subtle'),
    );
    expect(property(choice, '--neoverse-choice-control-effective-shadow')).toContain(
      property(document.documentElement, '--neoverse-shadow-control'),
    );
    expect(property(choice, '--neoverse-choice-control-effective-shadow')).not.toContain(
      'rgb(0 0 0 / 18%)',
    );
  });
});

describe('table lower-edge shadows', () => {
  afterEach(() => {
    document.head.replaceChildren();
    document.body.replaceChildren();
    delete document.documentElement.dataset.theme;
    delete document.documentElement.dataset.neoverseGlassRenderer;
  });

  it.each(['light', 'dark'] as const)(
    'keeps the %s lower highlight on the outer row without changing grid lines or hover feedback',
    (theme) => {
      installStyles(theme, 'webgl');
      const table = document.createElement('table');
      table.className = 'ui-table ui-table--hoverable';
      table.style.setProperty(
        '--neoverse-material-edge-highlight-subtle-bottom',
        'inset 0 -1px 2px purple',
      );
      table.style.setProperty('--neoverse-table-cell-shadow', 'inset 0 1px 3px blue');
      table.style.setProperty('--neoverse-table-hover-shadow', 'inset 0 1px 3px orange');
      table.style.setProperty('--neoverse-table-grid-line', 'black');
      table.style.setProperty('--neoverse-border-width-thin', '1px');
      const body = table.createTBody();
      const firstRow = body.insertRow();
      const firstCell = firstRow.insertCell();
      firstRow.insertCell();
      const lastRow = body.insertRow();
      const lastCell = lastRow.insertCell();
      lastRow.insertCell();
      document.body.append(table);

      expect(property(firstCell, 'box-shadow')).toContain('blue');
      expect(property(firstCell, 'box-shadow')).not.toContain('purple');
      expect(property(lastCell, 'box-shadow')).toContain('purple');
      expect(property(lastCell, 'box-shadow')).toContain('blue');
      expect(getComputedStyle(firstCell).getPropertyValue('border-block-end')).toContain('solid');
      expect(getComputedStyle(lastCell).getPropertyValue('border-inline-end')).toContain('solid');

      lastRow.setAttribute('data-test-hover', '');
      expect(property(lastCell, 'box-shadow')).toContain('purple');
      expect(property(lastCell, 'box-shadow')).toContain('orange');
    },
  );

  it('moves the lower highlight to the footer when one is present', () => {
    installStyles('light', 'webgl');
    const table = document.createElement('table');
    table.className = 'ui-table';
    table.style.setProperty(
      '--neoverse-material-edge-highlight-subtle-bottom',
      'inset 0 -1px 2px purple',
    );
    table.style.setProperty('--neoverse-table-cell-shadow', 'inset 0 1px 3px blue');
    const bodyCell = table.createTBody().insertRow().insertCell();
    const footerCell = table.createTFoot().insertRow().insertCell();
    document.body.append(table);

    expect(property(bodyCell, 'box-shadow')).not.toContain('purple');
    expect(property(footerCell, 'box-shadow')).toContain('purple');
  });

  it('targets only the last body group and also supports a header-only table', () => {
    installStyles('light', 'webgl');
    const table = document.createElement('table');
    table.className = 'ui-table';
    table.style.setProperty(
      '--neoverse-material-edge-highlight-subtle-bottom',
      'inset 0 -1px 2px purple',
    );
    table.style.setProperty('--neoverse-table-cell-shadow', 'inset 0 1px 3px blue');
    table.style.setProperty('--neoverse-table-header-shadow', 'inset 0 1px 3px green');
    const earlierBodyCell = table.createTBody().insertRow().insertCell();
    const lastBodyCell = table.createTBody().insertRow().insertCell();
    document.body.append(table);
    expect(property(earlierBodyCell, 'box-shadow')).not.toContain('purple');
    expect(property(lastBodyCell, 'box-shadow')).toContain('purple');

    for (const body of Array.from(table.tBodies)) body.remove();
    const headerCell = document.createElement('th');
    table.createTHead().insertRow().append(headerCell);
    expect(property(headerCell, 'box-shadow')).toContain('purple');
    expect(property(headerCell, 'box-shadow')).toContain('green');
  });
});

describe('disclosure optics with the shared Glass renderer', () => {
  afterEach(() => {
    document.head.replaceChildren();
    document.body.replaceChildren();
    delete document.documentElement.dataset.theme;
    delete document.documentElement.dataset.neoverseGlassRenderer;
  });

  it.each([
    ['light', '0.16', '1'],
    ['dark', '0.5', '0.12'],
  ] as const)(
    'uses the %s Light-tier optics without replacing disclosure shadows',
    (theme, opacity, chroma) => {
      installStyles(theme, 'webgl');
      const details = document.createElement('details');
      details.className = 'ui-disclosure';
      details.style.setProperty('--neoverse-disclosure-shadow', 'inset 0 -1px 2px purple');
      details.style.setProperty('--neoverse-disclosure-filter', 'blur(12px)');
      document.body.append(details);

      expect(property(details, '--neoverse-material-edge-refraction-opacity')).toBe(opacity);
      expect(property(details, '--neoverse-material-edge-refraction-chroma')).toBe(chroma);
      expect(property(details, 'box-shadow')).toContain('purple');
      expect(property(details, 'backdrop-filter')).toBe('blur(12px)');
    },
  );

  it('keeps the existing disclosure fallback without WebGL', () => {
    installStyles('light', 'none');
    const details = document.createElement('details');
    details.className = 'ui-disclosure';
    details.style.setProperty('--neoverse-disclosure-shadow', 'inset 0 0 0 1px red');
    document.body.append(details);
    expect(property(details, 'box-shadow')).toContain('1px red');
  });

  it('applies the Light-tier edge roles to native prose details', () => {
    installStyles('dark', 'webgl');
    const prose = document.createElement('article');
    prose.className = 'neoverse-prose';
    const details = document.createElement('details');
    prose.append(details);
    document.body.append(prose);
    expect(property(details, '--neoverse-material-edge-refraction-opacity')).toBe('0.5');
    expect(property(details, '--neoverse-material-edge-refraction-chroma')).toBe('0.12');
  });
});
