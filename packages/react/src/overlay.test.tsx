import { expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { UiContextMenu, UiDropdownMenu, UiPopover } from './index.js';

test('UiPopover renders the shared trigger and dialog contract', () => {
  const html = renderToStaticMarkup(
    <UiPopover trigger="Open details" ariaLabel="Details">
      <p>Overlay body</p>
    </UiPopover>,
  );

  expect(html).toContain('class="ui-popover"');
  expect(html).toContain(
    'class="ui-popover__trigger ui-button material-glass-subtle ui-button--secondary ui-button--md"',
  );
  expect(html).toContain('class="ui-button__tone-field"');
  expect(html).toContain('class="ui-button__edge-field"');
  expect(html).toContain('aria-expanded="false"');
  expect(html).toContain(
    'class="ui-overlay-panel ui-popover__content material-glass-elevated nv-presence"',
  );
  expect(html).toContain('popover="auto"');
  expect(html).toContain('role="dialog"');
  expect(html).toContain('aria-label="Details"');
});

test('overlay triggers accept a ghost variant and keep the secondary default', () => {
  const ghostPopover = renderToStaticMarkup(
    <UiPopover trigger="Open details" ariaLabel="Details" triggerVariant="ghost">
      <p>Overlay body</p>
    </UiPopover>,
  );
  const ghostMenu = renderToStaticMarkup(
    <UiDropdownMenu trigger="Actions" ariaLabel="Actions" items={[]} triggerVariant="ghost" />,
  );
  const defaultPopover = renderToStaticMarkup(
    <UiPopover trigger="Open details" ariaLabel="Details" />,
  );

  expect(ghostPopover).toContain(
    'class="ui-popover__trigger ui-button material-glass-subtle ui-button--ghost ui-button--md"',
  );
  expect(ghostMenu).toContain(
    'class="ui-dropdown-menu__trigger ui-button material-glass-subtle ui-button--ghost ui-button--md"',
  );
  expect(defaultPopover).toContain(
    'class="ui-popover__trigger ui-button material-glass-subtle ui-button--secondary ui-button--md"',
  );
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

  expect(html).toContain(
    'class="ui-overlay-panel ui-context-menu material-glass-immersive nv-presence"',
  );
  // A context menu owns a nested submenu popover, so the runtime owns outside dismissal.
  // 上下文菜单拥有一个嵌套的二级浮层，因此外部关闭由运行时负责。
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
