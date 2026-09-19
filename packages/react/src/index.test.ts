import { expect, test } from 'bun:test';

import { uiActionClassName } from './index.js';

test('builds the canonical secondary action contract', () => {
  const classes = uiActionClassName({ variant: 'secondary', size: 'sm', surface: 'glass-subtle' });

  expect(classes).toContain('ui-button');
  expect(classes).toContain('ui-action');
  expect(classes).toContain('ui-button--secondary');
  expect(classes).toContain('ui-action--sm');
  expect(classes).toContain('material-glass-subtle');
  expect(classes).not.toContain('focus-visible:');
});

test('keeps consumer layout classes additive instead of replacing the contract', () => {
  const classes = uiActionClassName({ className: 'docs-specific-layout' });

  expect(classes).toContain('ui-button--primary');
  expect(classes).toContain('docs-specific-layout');
});
