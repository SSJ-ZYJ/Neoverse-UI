import { expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { UiContextMenu, UiDropdownMenu, UiPopover } from './index.js';

test('UiPopover renders the shared trigger and dialog contract', () => {
  const html = renderToStaticMarkup(
    <UiPopover trigger="Open details" ariaLabel="Details">
      <p>Overlay body</p>
    </UiPopover>,
  );

  expect(html).toContain('aria-expanded="false"');
  expect(html).toContain('popover="auto"');
  expect(html).toContain('role="dialog"');
  expect(html).toContain('aria-label="Details"');
});

test('overlay triggers accept a ghost variant', () => {
  const ghostPopover = renderToStaticMarkup(
    <UiPopover trigger="Open details" ariaLabel="Details" triggerVariant="ghost">
      <p>Overlay body</p>
    </UiPopover>,
  );
  const ghostMenu = renderToStaticMarkup(
    <UiDropdownMenu trigger="Actions" ariaLabel="Actions" items={[]} triggerVariant="ghost" />,
  );

  expect(ghostPopover).toContain('ui-button--ghost');
  expect(ghostMenu).toContain('ui-button--ghost');
});

test('disabled Popover and DropdownMenu never announce expanded even with controlled/default open', () => {
  for (const openProps of [{ open: true }, { defaultOpen: true }]) {
    const popover = renderToStaticMarkup(
      <UiPopover trigger="Details" ariaLabel="Details" disabled {...openProps} />,
    );
    const menu = renderToStaticMarkup(
      <UiDropdownMenu trigger="Actions" ariaLabel="Actions" items={[]} disabled {...openProps} />,
    );
    expect(popover).toContain('aria-expanded="false"');
    expect(menu).toContain('aria-expanded="false"');
  }
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

test('UiContextMenu renders menu rows, separators, headings and checkable state', () => {
  const html = renderToStaticMarkup(
    <UiContextMenu
      open={false}
      ariaLabel="Page actions"
      entries={[
        { type: 'heading', id: 'edit', label: 'Edit' },
        { id: 'copy', label: 'Copy', shortcut: 'Ctrl+C' },
        { type: 'separator', id: 'sep-1' },
        { id: 'remove', label: 'Remove', tone: 'danger', disabled: true },
        { id: 'dark', label: 'Dark', selection: 'single', group: 'theme', checked: true },
      ]}
    />,
  );

  // A context menu owns a nested submenu popover, so the runtime owns outside dismissal.
  expect(html).toContain('popover="manual"');
  expect(html).toContain('role="menu"');
  expect(html).toContain('aria-label="Page actions"');
  expect(html).toContain('class="ui-context-menu__heading"');
  expect(html).toContain('<hr class="ui-context-menu__separator"');
  expect(html).toContain('role="menuitemradio"');
  expect(html).toContain('aria-checked="true"');
  expect(html).toContain('data-tone="danger"');
  expect(html).toContain('disabled=""');
  expect(html).toContain('class="ui-context-menu__shortcut"');
});

test('DropdownMenu supports compact triggers, checkable rows and shortcuts', () => {
  const html = renderToStaticMarkup(
    <UiDropdownMenu
      trigger="Commands"
      ariaLabel="Commands"
      triggerSize="sm"
      triggerVariant="ghost"
      placement="bottom-end"
      items={[
        { id: 'grid', label: 'Show grid', checked: true, shortcut: '⌘G' },
        { id: 'dup', label: 'Duplicate', shortcut: '⌘D' },
      ]}
    />,
  );

  expect(html).toContain('ui-button--sm');
  expect(html).toContain('ui-button--ghost');
  expect(html).toContain('role="menuitemcheckbox"');
  expect(html).toContain('aria-checked="true"');
  expect(html).toContain('class="ui-dropdown-menu__check"');
  expect(html).toContain('class="ui-dropdown-menu__shortcut"');
});
