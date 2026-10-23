import { describe, expect, test } from 'bun:test';
import { collectReactRuntimeAdapters } from './react-runtime-fixture';

describe('React runtime fixture contract', () => {
  test('accepts a marker on the matching component', () => {
    const result = collectReactRuntimeAdapters('<UiButton data-react-adapter="UiButton" />');

    expect(result.adapters).toEqual(new Set(['UiButton']));
    expect(result.errors).toEqual([]);
  });

  test('accepts a wrapper marker when it contains the corresponding component', () => {
    const result = collectReactRuntimeAdapters(
      '<div data-react-adapter="UiPopover"><UiPopover /></div>',
    );

    expect(result.adapters).toEqual(new Set(['UiPopover']));
    expect(result.errors).toEqual([]);
  });

  test('rejects a wrapper marker when the corresponding component is absent', () => {
    const result = collectReactRuntimeAdapters(
      '<div data-react-adapter="UiPopover"><span /></div>',
    );

    expect(result.adapters).toEqual(new Set(['UiPopover']));
    expect(result.errors).toContain(
      'UiPopover: runtime marker does not contain a matching JSX component.',
    );
  });

  test('rejects a wrapper marker when it contains a different component', () => {
    const result = collectReactRuntimeAdapters(
      '<div data-react-adapter="UiPopover"><UiDropdownMenu /></div>',
    );

    expect(result.errors).toContain(
      'UiPopover: runtime marker does not contain a matching JSX component.',
    );
  });
});
