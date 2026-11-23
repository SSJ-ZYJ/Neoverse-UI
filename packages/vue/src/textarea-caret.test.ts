import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import UiTextarea from './UiTextarea.vue';

describe('Textarea mirrored caret', () => {
  it('draws the two-axis breathing caret and falls back on selection, IME and locked states', async () => {
    const wrapper = mount(UiTextarea, {
      attachTo: document.body,
      props: { modelValue: 'first\nsecond' },
    });
    const control = wrapper.get('textarea');
    control.element.focus();
    control.element.setSelectionRange(8, 8);
    await control.trigger('focus');
    expect(wrapper.attributes('data-caret')).toBe('overlay');
    const caret = wrapper.get('.ui-textarea-caret');
    expect(caret.attributes('aria-hidden')).toBe('true');
    expect(caret.get('.ui-textarea-caret__prefix').text()).toBe('first\nse');
    expect(caret.get('.ui-textarea-caret__suffix').text()).toBe('cond');

    control.element.setSelectionRange(2, 2);
    document.dispatchEvent(new Event('selectionchange'));
    await nextTick();
    expect(caret.get('.ui-textarea-caret__prefix').text()).toBe('fi');

    control.element.setSelectionRange(0, 5);
    await control.trigger('select');
    expect(wrapper.attributes('data-caret')).toBe('native');
    expect(wrapper.find('.ui-textarea-caret').exists()).toBe(false);

    control.element.setSelectionRange(2, 2);
    await control.trigger('select');
    await control.trigger('compositionstart');
    expect(wrapper.attributes('data-caret')).toBe('native');
    await control.trigger('compositionend');
    expect(wrapper.attributes('data-caret')).toBe('overlay');

    await wrapper.setProps({ readonly: true });
    expect(wrapper.attributes('data-caret')).toBe('native');
    await wrapper.setProps({ readonly: false, disabled: true });
    expect(wrapper.attributes('data-caret')).toBe('native');
    wrapper.unmount();
  });
});
