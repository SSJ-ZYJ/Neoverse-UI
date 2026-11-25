import { describe, expect, test } from 'bun:test';
import { checkComponentLayout } from './check-component-layout';

describe('Published source layout', () => {
  test('accepts categorized Vue and React components and package re-exports', () => {
    expect(checkComponentLayout('packages/vue/src/components/forms/UiInput.vue', '')).toEqual([]);
    expect(
      checkComponentLayout(
        'packages/react/src/components/forms/input.tsx',
        'export function UiInput() { return <input />; }',
      ),
    ).toEqual([]);
    expect(
      checkComponentLayout(
        'packages/overlay-runtime/src/index.ts',
        "export { showAnchoredOverlay } from './anchored-overlay/lifecycle.js';",
      ),
    ).toEqual([]);
  });

  test('rejects implementation in a package entry', () => {
    expect(
      checkComponentLayout(
        'packages/overlay-runtime/src/index.ts',
        "export { showAnchoredOverlay } from './lifecycle.js';\nexport const state = new WeakMap();",
      ),
    ).toEqual([
      'packages/overlay-runtime/src/index.ts:2: package entry must only re-export modules',
    ]);
  });

  test('rejects flat and uncategorized component locations', () => {
    expect(checkComponentLayout('packages/vue/src/UiInput.vue', '')).toEqual([
      'packages/vue/src/UiInput.vue:1: place components under src/components/<category>/',
    ]);
    expect(
      checkComponentLayout('packages/react/src/components/uncategorized/checkbox.tsx', ''),
    ).toEqual([
      'packages/react/src/components/uncategorized/checkbox.tsx:1: place components under src/components/<category>/',
    ]);
  });

  test('rejects a second component in a React source file', () => {
    expect(
      checkComponentLayout(
        'packages/react/src/components/forms/checkbox.tsx',
        'export function UiCheckbox() { return <input />; }\nconst CheckboxLabel = () => <label />;',
      ),
    ).toEqual([
      'packages/react/src/components/forms/checkbox.tsx:2: move CheckboxLabel to its own component file',
    ]);
  });

  test('allows a test to define several local React fixtures', () => {
    expect(
      checkComponentLayout(
        'packages/react/src/forms.test.tsx',
        'const CheckboxLabel = () => <label />;\nconst Harness = () => <CheckboxLabel />;',
      ),
    ).toEqual([]);
  });
});
