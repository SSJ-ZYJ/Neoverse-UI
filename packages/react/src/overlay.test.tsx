import { expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { UiDropdownMenu, UiPopover } from './index.js';

test('UiPopover renders the shared trigger and dialog contract', () => {
  const html = renderToStaticMarkup(
    <UiPopover trigger="Open details" ariaLabel="Details">
      <p>Overlay body</p>
    </UiPopover>,
  );

  expect(html).toContain('class="ui-popover"');
  expect(html).toContain(
    'class="ui-popover__trigger ui-button ui-button--secondary ui-button--md"',
  );
  expect(html).toContain('aria-expanded="false"');
  expect(html).toContain(
    'class="ui-overlay-panel ui-popover__content material-glass-elevated nv-presence"',
  );
  expect(html).toContain('popover="auto"');
  expect(html).toContain('role="dialog"');
  expect(html).toContain('aria-label="Details"');
});

test('UiDropdownMenu renders native button items with menu semantics', () => {
  const html = renderToStaticMarkup(
    <UiDropdownMenu
      trigger="Actions"
      ariaLabel="Project actions"
      items={[
        { id: 'open', label: 'Open' },
        { id: 'archive', label: 'Archive', disabled: true },
        { id: 'remove', label: 'Remove', tone: 'danger' },
      ]}
    />,
  );

  expect(html).toContain('class="ui-dropdown-menu"');
  expect(html).toContain('aria-haspopup="menu"');
  expect(html).toContain('role="menu"');
  expect(html).toContain('aria-label="Project actions"');
  expect(html.match(/role="menuitem"/g)).toHaveLength(3);
  expect(html).toContain('disabled=""');
  expect(html).toContain('data-tone="danger"');
});
