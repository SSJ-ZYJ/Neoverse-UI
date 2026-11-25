import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import UiContextMenu from './components/overlays/UiContextMenu.vue';
import UiDropdownMenu from './components/overlays/UiDropdownMenu.vue';
import UiPopover from './components/overlays/UiPopover.vue';

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

describe('Overlay primitives', () => {
  it('keeps controlled Popover ARIA closed when disabled and restores the retained open intent', async () => {
    const wrapper = mount(UiPopover, {
      props: { open: true, disabled: true, ariaLabel: 'Details' },
      slots: { trigger: 'Details', default: '<p>Body</p>' },
    });
    await nextTick();
    expect(wrapper.get('.ui-popover__trigger').attributes('aria-expanded')).toBe('false');
    await wrapper.setProps({ disabled: false });
    await nextTick();
    expect(wrapper.get('.ui-popover__trigger').attributes('aria-expanded')).toBe('true');
    expect(wrapper.get('.ui-popover__content').classes()).toContain(
      'ui-overlay-panel--fallback-open',
    );
    await wrapper.setProps({ disabled: true });
    await nextTick();
    expect(wrapper.get('.ui-popover__trigger').attributes('aria-expanded')).toBe('false');
    wrapper.unmount();
  });

  it('keeps controlled DropdownMenu ARIA closed when disabled and restores the retained open intent', async () => {
    const wrapper = mount(UiDropdownMenu, {
      props: {
        open: true,
        disabled: true,
        ariaLabel: 'Actions',
        items: [{ id: 'open', label: 'Open' }],
      },
      slots: { trigger: 'Actions' },
    });
    await nextTick();
    expect(wrapper.get('.ui-dropdown-menu__trigger').attributes('aria-expanded')).toBe('false');
    await wrapper.setProps({ disabled: false });
    await nextTick();
    expect(wrapper.get('.ui-dropdown-menu__trigger').attributes('aria-expanded')).toBe('true');
    expect(wrapper.get('.ui-dropdown-menu__panel').classes()).toContain(
      'ui-overlay-panel--fallback-open',
    );
    await wrapper.setProps({ disabled: true });
    await nextTick();
    expect(wrapper.get('.ui-dropdown-menu__trigger').attributes('aria-expanded')).toBe('false');
    wrapper.unmount();
  });

  it('keeps a controlled Popover open when the parent rejects an Escape request', async () => {
    const wrapper = mount(UiPopover, {
      attachTo: document.body,
      props: { open: true, ariaLabel: 'Controlled details' },
      slots: { trigger: 'Details', default: '<p>Body</p>' },
    });
    await nextTick();
    const panel = wrapper.get('.ui-popover__content');
    expect(panel.classes()).toContain('ui-overlay-panel--fallback-open');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await nextTick();
    await nextTick();
    expect(wrapper.emitted('update:open')?.at(-1)).toEqual([false]);
    expect(panel.classes()).toContain('ui-overlay-panel--fallback-open');
    expect(wrapper.get('button').attributes('aria-expanded')).toBe('true');
    wrapper.unmount();
  });

  it('renders Popover with the shared trigger, top-layer panel, and dialog semantics', () => {
    const wrapper = mount(UiPopover, {
      props: { ariaLabel: 'Details' },
      slots: { trigger: 'Open details', default: '<p>Overlay body</p>' },
    });

    const trigger = wrapper.get('.ui-popover__trigger');
    const panel = wrapper.get('.ui-popover__content');
    expect(trigger.attributes('type')).toBe('button');
    expect(trigger.attributes('aria-expanded')).toBe('false');
    expect(panel.attributes('popover')).toBe('auto');
    expect(panel.attributes('role')).toBe('dialog');
    expect(panel.attributes('aria-label')).toBe('Details');
    expect(panel.classes()).toContain('material-glass-elevated');
  });

  it('renders overlay triggers with the shared button variant and keeps the secondary default', () => {
    const wrapper = mount(UiPopover, {
      props: { ariaLabel: 'Details', triggerVariant: 'ghost' },
      slots: { trigger: 'Open details', default: '<p>Overlay body</p>' },
    });
    const menu = mount(UiDropdownMenu, {
      props: { ariaLabel: 'Actions', triggerVariant: 'ghost', items: [] },
      slots: { trigger: 'Actions' },
    });
    const fallback = mount(UiPopover, {
      props: { ariaLabel: 'Details' },
      slots: { trigger: 'Open details' },
    });

    expect(wrapper.get('.ui-popover__trigger').classes()).toContain('ui-button--ghost');
    expect(menu.get('.ui-dropdown-menu__trigger').classes()).toContain('ui-button--ghost');
    expect(fallback.get('.ui-popover__trigger').classes()).toContain('ui-button--secondary');
    expect(wrapper.get('.ui-popover__trigger').classes()).not.toContain('ui-button--secondary');
  });

  it('renders a context menu with menu roles, separators, headings and checkable rows', () => {
    const wrapper = mount(UiContextMenu, {
      props: {
        open: false,
        ariaLabel: 'Page actions',
        entries: [
          { type: 'heading', id: 'edit', label: 'Edit' },
          { id: 'copy', label: 'Copy', shortcut: 'Ctrl+C' },
          { type: 'separator', id: 'sep-1' },
          { id: 'delete', label: 'Delete', tone: 'danger', disabled: true },
          {
            id: 'theme-dark',
            label: 'Dark',
            group: 'theme',
            selection: 'single',
            checked: true,
          },
        ],
      },
    });

    const panel = wrapper.get('.ui-context-menu');
    // A context menu owns a nested submenu popover, so the runtime must own outside
    // dismissal instead of the browser's light dismiss.
    expect(panel.attributes('popover')).toBe('manual');
    expect(panel.attributes('role')).toBe('menu');
    expect(panel.attributes('aria-label')).toBe('Page actions');
    expect(panel.classes()).toContain('ui-overlay-panel');
    expect(panel.classes()).toContain('material-glass-elevated');

    expect(wrapper.get('.ui-context-menu__heading').text()).toBe('Edit');
    // A native hr carries the separator role without an explicit attribute.
    expect(wrapper.get('.ui-context-menu__separator').element.tagName).toBe('HR');

    const items = wrapper.findAll('.ui-context-menu__item');
    expect(items).toHaveLength(3);
    expect(items[0]?.attributes('role')).toBe('menuitem');
    expect(items[0]?.get('.ui-context-menu__shortcut').text()).toBe('Ctrl+C');
    expect(items[1]?.attributes('disabled')).toBeDefined();
    expect(items[1]?.attributes('data-tone')).toBe('danger');
    expect(items[2]?.attributes('role')).toBe('menuitemradio');
    expect(items[2]?.attributes('aria-checked')).toBe('true');
    expect(items[2]?.get('.ui-context-menu__check').text()).toBe('✓');
    wrapper.unmount();
  });

  it('opens a submenu popover beside the panel and keeps the parent rows visible', async () => {
    const wrapper = mount(UiContextMenu, {
      attachTo: document.body,
      props: {
        open: true,
        autoFocus: true,
        ariaLabel: 'Page actions',
        point: { x: 20, y: 20 },
        entries: [
          { id: 'copy', label: 'Copy' },
          {
            id: 'theme',
            label: 'Theme',
            children: [
              { id: 'theme:light', label: 'Light', selection: 'single', checked: true },
              { id: 'theme:dark', label: 'Dark', selection: 'single', checked: false },
            ],
          },
        ],
      },
    });
    await nextTick();
    await nextTick();

    const rows = () => wrapper.findAll('.ui-context-menu__item');
    expect(rows()).toHaveLength(2);
    const opener = rows()[1];
    expect(opener?.attributes('aria-haspopup')).toBe('menu');
    expect(opener?.attributes('aria-expanded')).toBe('false');

    await opener?.trigger('click');
    await nextTick();
    await nextTick();

    // The submenu is its own manual popover teleported to the body, so the panel's presence
    // filter cannot become its containing block and the parent rows stay rendered.
    const submenu = document.querySelector<HTMLElement>('.ui-context-menu__submenu');
    expect(submenu).not.toBeNull();
    expect(submenu?.getAttribute('popover')).toBe('manual');
    expect(submenu?.getAttribute('role')).toBe('menu');
    expect(submenu?.parentElement).toBe(document.body);
    expect(rows()).toHaveLength(2);
    expect(opener?.attributes('aria-expanded')).toBe('true');
    expect(opener?.attributes('data-open')).toBe('true');
    expect(opener?.attributes('aria-controls')).toBe(submenu?.id);

    const childRows = submenu?.querySelectorAll<HTMLElement>('.ui-context-menu__item') ?? [];
    expect(submenu?.classList.contains('ui-overlay-panel')).toBe(true);
    expect(submenu?.classList.contains('material-glass-elevated')).toBe(true);
    expect(childRows).toHaveLength(2);
    expect(childRows[0]?.getAttribute('aria-checked')).toBe('true');
    expect(childRows[1]?.getAttribute('role')).toBe('menuitemradio');

    childRows[1]?.click();
    await nextTick();
    expect(wrapper.emitted('select')?.[0]?.[0]).toMatchObject({ id: 'theme:dark' });
    wrapper.unmount();
  });

  it('opens a context menu at its pointer anchor and restores focus on Escape', async () => {
    const wrapper = mount(UiContextMenu, {
      attachTo: document.body,
      props: {
        open: true,
        ariaLabel: 'Page actions',
        point: { x: 240, y: 160 },
        entries: [{ id: 'copy', label: 'Copy' }],
      },
    });
    await nextTick();
    await nextTick();

    const panel = wrapper.get('.ui-context-menu');
    expect(panel.classes()).toContain('ui-overlay-panel--fallback-open');
    expect(panel.attributes('data-neoverse-overlay-side')).toBe('bottom');
    expect(
      Number.parseFloat(
        (panel.element as HTMLElement).style.getPropertyValue('--neoverse-overlay-left'),
      ),
    ).toBe(240);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await nextTick();
    expect(wrapper.emitted('update:open')?.at(-1)).toEqual([false]);
    wrapper.unmount();
  });

  it('emits the selected context menu item and closes on selection', async () => {
    const wrapper = mount(UiContextMenu, {
      attachTo: document.body,
      props: {
        open: true,
        ariaLabel: 'Page actions',
        point: { x: 10, y: 10 },
        entries: [{ id: 'copy', label: 'Copy' }],
      },
    });
    await nextTick();
    await nextTick();

    await wrapper.get('.ui-context-menu__item').trigger('click');
    expect(wrapper.emitted('select')?.[0]?.[0]).toMatchObject({ id: 'copy' });
    expect(wrapper.emitted('update:open')?.at(-1)).toEqual([false]);
    wrapper.unmount();
  });

  it('renders DropdownMenu with native menu items, disabled state, and danger tone', () => {
    const wrapper = mount(UiDropdownMenu, {
      props: {
        ariaLabel: 'Actions',
        items: [
          { id: 'open', label: 'Open' },
          { id: 'disabled', label: 'Disabled', disabled: true },
          { id: 'archive', label: 'Archive', tone: 'danger' },
        ],
      },
      slots: { trigger: 'Open menu' },
    });

    const trigger = wrapper.get('.ui-dropdown-menu__trigger');
    const panel = wrapper.get('.ui-dropdown-menu__panel');
    expect(trigger.attributes('aria-haspopup')).toBe('menu');
    expect(panel.attributes('popover')).toBe('auto');
    expect(panel.attributes('role')).toBe('menu');
    expect(panel.attributes('aria-label')).toBe('Actions');

    const items = wrapper.findAll('.ui-dropdown-menu__item');
    expect(items).toHaveLength(3);
    expect(items[0]?.attributes('role')).toBe('menuitem');
    expect(items[1]?.attributes('disabled')).toBeDefined();
    expect(items[2]?.attributes('data-tone')).toBe('danger');
  });

  it('supports compact triggers, checkmarks and shortcuts on rich dropdown menus', () => {
    const wrapper = mount(UiDropdownMenu, {
      props: {
        ariaLabel: 'Command menu',
        triggerSize: 'sm',
        triggerVariant: 'ghost',
        placement: 'bottom-end',
        items: [
          { id: 'grid', label: 'Show grid', checked: true, shortcut: '⌘G' },
          { id: 'dup', label: 'Duplicate', shortcut: '⌘D' },
        ],
      },
      slots: { trigger: 'Commands' },
    });

    const trigger = wrapper.get('.ui-dropdown-menu__trigger');
    expect(trigger.classes()).toContain('ui-button--sm');
    expect(trigger.classes()).toContain('ui-button--ghost');
    const items = wrapper.findAll('.ui-dropdown-menu__item');
    expect(items[0]?.attributes('role')).toBe('menuitemcheckbox');
    expect(items[0]?.attributes('aria-checked')).toBe('true');
    expect(items[0]?.get('.ui-dropdown-menu__check').text()).toBe('✓');
    expect(items[0]?.get('.ui-dropdown-menu__shortcut').text()).toBe('⌘G');
    expect(items[1]?.attributes('role')).toBe('menuitem');
  });
});
