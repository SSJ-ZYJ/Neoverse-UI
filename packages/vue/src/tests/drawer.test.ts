import { mount } from '@vue/test-utils';
import { expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { UiDrawer } from '../index';

function getDrawer() {
  const dialog = document.querySelector<HTMLDialogElement>('dialog.ui-drawer');
  if (!dialog) throw new Error('Missing Drawer');
  return dialog;
}

it('keeps a controlled modal Drawer in the document layer and an inline Drawer unfocused', async () => {
  const opener = document.createElement('button');
  document.body.append(opener);
  opener.focus();
  const wrapper = mount(UiDrawer, {
    attachTo: document.body,
    attrs: { id: 'filters', 'aria-labelledby': 'filters-title', class: 'custom-drawer' },
    slots: { default: '<h2 id="filters-title">Filters</h2><button>Apply</button>' },
  });
  try {
    await nextTick();
    const dialog = getDrawer();
    const showModal = vi.spyOn(dialog, 'showModal');
    const show = vi.spyOn(dialog, 'show');
    expect(dialog.open).toBe(false);
    expect(dialog.id).toBe('filters');
    expect(dialog.getAttribute('aria-labelledby')).toBe('filters-title');
    expect(dialog.querySelector('h2')?.textContent).toBe('Filters');
    expect([...dialog.classList]).toEqual(
      expect.arrayContaining(['ui-drawer', 'material-role-compact-overlay', 'custom-drawer']),
    );
    expect(dialog.dataset.side).toBe('left');
    expect(dialog.dataset.neoverseGlassEdgePass).toBe('css');
    expect(dialog.parentElement?.parentElement).toBe(document.body);
    expect(dialog.parentElement?.hasAttribute('inert')).toBe(true);

    await wrapper.setProps({ open: true, modal: false, side: 'right' });
    expect(dialog.open).toBe(true);
    expect(show).not.toHaveBeenCalled();
    expect(showModal).not.toHaveBeenCalled();
    expect(dialog.dataset.side).toBe('right');
    expect(dialog.dataset.modal).toBe('false');
    expect(dialog.dataset.neoverseGlassEdgePass).toBeUndefined();
    expect(wrapper.get('dialog').element).toBe(dialog);
    expect(document.activeElement).toBe(opener);
    dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
    expect(wrapper.emitted('update:open')).toBeUndefined();

    await wrapper.setProps({ modal: true, width: '18rem' });
    expect(dialog.open).toBe(true);
    expect(show).toHaveBeenCalledTimes(1);
    expect(showModal).not.toHaveBeenCalled();
    expect(dialog.parentElement?.style.getPropertyValue('--neoverse-drawer-width')).toBe('18rem');
    expect(dialog.contains(document.activeElement)).toBe(true);

    opener.focus();
    const toolbarEscape = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    opener.dispatchEvent(toolbarEscape);
    expect(toolbarEscape.defaultPrevented).toBe(false);
    expect(wrapper.emitted('update:open')).toBeUndefined();
    dialog.focus();
    const tab = new KeyboardEvent('keydown', { key: 'Tab', cancelable: true, bubbles: true });
    dialog.dispatchEvent(tab);
    expect(tab.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(dialog.querySelector('button'));
    const escapeEvent = new KeyboardEvent('keydown', {
      key: 'Escape',
      cancelable: true,
      bubbles: true,
    });
    document.activeElement?.dispatchEvent(escapeEvent);
    expect(escapeEvent.defaultPrevented).toBe(true);
    expect(wrapper.emitted('update:open')).toEqual([[false]]);
    expect(dialog.open).toBe(true);

    dialog.close();
    await vi.waitFor(() => expect(dialog.open).toBe(true));
    expect(wrapper.emitted('update:open')).toEqual([[false], [false]]);
    expect(dialog.open).toBe(true);
    await wrapper.setProps({ open: false });
    expect(dialog.open).toBe(false);
    expect(document.activeElement).toBe(opener);
    expect(wrapper.emitted('update:open')).toEqual([[false], [false]]);
  } finally {
    wrapper.unmount();
    opener.remove();
  }
});

it('dismisses modal Drawers only for a complete primary backdrop click', async () => {
  const wrapper = mount(UiDrawer, {
    attachTo: document.body,
    attrs: { 'aria-label': 'Filters' },
    props: { open: true },
    slots: { default: '<button>Apply</button>' },
  });
  try {
    await nextTick();
    const dialog = getDrawer();
    const backdrop = document.querySelector<HTMLElement>('.ui-drawer__backdrop');
    if (!backdrop) throw new Error('Missing Drawer backdrop');
    const pointer = (target: HTMLElement, type: string, button = 0) => {
      target.dispatchEvent(new PointerEvent(type, { button, isPrimary: true }));
    };
    const click = (button = 0) => {
      backdrop.dispatchEvent(new MouseEvent('click', { button, detail: 1 }));
    };
    const gesture = (start: HTMLElement, end: HTMLElement, button = 0) => {
      pointer(start, 'pointerdown', button);
      pointer(end, 'pointerup', button);
      click(button);
    };

    click();
    gesture(dialog, dialog);
    gesture(dialog, backdrop);
    gesture(backdrop, dialog);
    gesture(backdrop, backdrop, 2);
    pointer(backdrop, 'pointerdown');
    pointer(backdrop, 'pointercancel');
    pointer(backdrop, 'pointerup');
    click();
    expect(wrapper.emitted('update:open')).toBeUndefined();

    await wrapper.setProps({ closeOnOutside: false });
    gesture(backdrop, backdrop);
    expect(wrapper.emitted('update:open')).toBeUndefined();
    await wrapper.setProps({ closeOnOutside: true });
    gesture(backdrop, backdrop);
    expect(wrapper.emitted('update:open')).toEqual([[false]]);
    expect(dialog.open).toBe(true);
    await wrapper.setProps({ modal: false });
    expect(document.querySelector('.ui-drawer__backdrop')).toBeNull();
    gesture(backdrop, backdrop);
    expect(wrapper.emitted('update:open')).toEqual([[false]]);
  } finally {
    wrapper.unmount();
  }
});
