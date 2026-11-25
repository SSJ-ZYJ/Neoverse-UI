import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { h, nextTick } from 'vue';
import UiCheckbox from './components/forms/UiCheckbox.vue';
import UiField from './components/forms/UiField.vue';
import UiInput from './components/forms/UiInput.vue';
import UiRadioGroup from './components/forms/UiRadioGroup.vue';
import UiSelect from './components/forms/UiSelect.vue';
import UiSwitch from './components/forms/UiSwitch.vue';
import UiTextarea from './components/forms/UiTextarea.vue';

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

describe('form controls', () => {
  for (const [name, component] of [
    ['UiInput', UiInput],
    ['UiTextarea', UiTextarea],
  ] as const) {
    it(`${name} commits IME text only after composition ends`, async () => {
      const wrapper = mount(component, { props: { modelValue: 'Initial' } });
      const editor = wrapper.get('input, textarea');
      const element = editor.element as HTMLInputElement | HTMLTextAreaElement;
      await editor.trigger('compositionstart');
      element.value = 'ni';
      await editor.trigger('input', { isComposing: true });
      expect(wrapper.emitted('update:modelValue')).toBeUndefined();

      element.value = '你好';
      await editor.trigger('compositionend');
      expect(wrapper.emitted('update:modelValue')).toEqual([['你好']]);
      await wrapper.setProps({ modelValue: '你好' });
      element.value = '你好!';
      await editor.trigger('input');
      expect(wrapper.emitted('update:modelValue')).toEqual([['你好'], ['你好!']]);
      wrapper.unmount();
    });
  }

  it('renders themed number steps while forwarding native attributes and localized labels', async () => {
    const wrapper = mount(UiInput, {
      attrs: { type: 'number', id: 'amount', name: 'amount', min: '0', max: '2', step: '0.5' },
      props: { modelValue: '1.5', incrementLabel: '增加', decrementLabel: '减少' },
    });
    const input = wrapper.get('input');
    expect(wrapper.classes()).toContain('ui-input-number');
    expect(input.attributes('id')).toBe('amount');
    expect(input.attributes('step')).toBe('0.5');
    const buttons = wrapper.findAll('button');
    expect(buttons.map((button) => button.attributes('aria-label'))).toEqual(['增加', '减少']);
    expect(buttons.every((button) => button.attributes('type') === 'button')).toBe(true);
    await input.setValue('1');
    expect(wrapper.emitted('update:modelValue')).toEqual([['1']]);
    await wrapper.setProps({ readonly: true });
    expect(buttons.every((button) => button.attributes('disabled') !== undefined)).toBe(true);
  });

  it('keeps input attributes and v-model updates native', async () => {
    const wrapper = mount(UiInput, {
      attrs: { type: 'email', name: 'email', 'aria-label': 'Email' },
      props: { modelValue: 'hello@example.com' },
    });

    const control = wrapper.get('input');
    expect(wrapper.classes()).toContain('ui-input-shell');
    expect(control.attributes('type')).toBe('email');
    expect(control.attributes('name')).toBe('email');
    expect(control.classes()).toContain('ui-input');
    expect((control.element as HTMLInputElement).value).toBe('hello@example.com');

    await control.trigger('pointerdown');
    expect(control.attributes('data-neoverse-focus-origin')).toBe('pointer');
    await control.trigger('blur');
    expect(control.attributes('data-neoverse-focus-origin')).toBeUndefined();

    await control.setValue('next@example.com');
    expect(wrapper.emitted('update:modelValue')).toEqual([['next@example.com']]);
  });

  it('draws the breathing caret inside the shared input shell', async () => {
    const wrapper = mount(UiInput, { attachTo: document.body, props: { modelValue: 'hello' } });
    const control = wrapper.get('input');
    control.element.focus();
    control.element.setSelectionRange(2, 2);
    await control.trigger('focus');
    expect(wrapper.attributes('data-caret')).toBe('overlay');
    const caret = wrapper.get('.ui-input-caret');
    expect(caret.attributes('aria-hidden')).toBe('true');
    expect(caret.get('.ui-input-caret__prefix').text()).toBe('he');
    control.element.setSelectionRange(4, 4);
    document.dispatchEvent(new Event('selectionchange'));
    await nextTick();
    expect(caret.get('.ui-input-caret__prefix').text()).toBe('hell');
    control.element.setSelectionRange(0, 2);
    await control.trigger('select');
    expect(wrapper.attributes('data-caret')).toBe('native');
    expect(wrapper.find('.ui-input-caret').exists()).toBe(false);
    control.element.setSelectionRange(2, 2);
    await control.trigger('focus');
    await wrapper.setProps({ readonly: true });
    expect(wrapper.attributes('data-caret')).toBe('native');
    await wrapper.setProps({ readonly: false });
    expect(wrapper.attributes('data-caret')).toBe('overlay');
    wrapper.unmount();
  });

  it('keeps textarea attributes and v-model updates native', async () => {
    const wrapper = mount(UiTextarea, {
      attrs: { name: 'notes', rows: '4', 'aria-label': 'Notes', class: 'consumer-notes' },
      props: { modelValue: 'Initial' },
    });

    const textarea = wrapper.get('textarea');
    expect(textarea.attributes('rows')).toBe('4');
    expect(textarea.classes()).toContain('ui-textarea');
    expect(textarea.classes()).not.toContain('consumer-notes');
    expect(wrapper.classes()).toContain('ui-textarea-shell');
    expect(wrapper.classes()).toContain('consumer-notes');
    await textarea.trigger('pointerdown');
    expect(textarea.attributes('data-neoverse-focus-origin')).toBe('pointer');
    await textarea.trigger('blur');
    expect(textarea.attributes('data-neoverse-focus-origin')).toBeUndefined();
    await textarea.setValue('Updated');
    expect(wrapper.emitted('update:modelValue')).toEqual([['Updated']]);
  });

  it('renders the library select surface and emits option changes', async () => {
    const wrapper = mount(UiSelect, {
      attrs: { name: 'runtime', 'aria-label': 'Runtime' },
      props: {
        modelValue: 'native',
        options: [
          { value: 'native', label: 'Native' },
          { value: 'remote', label: 'Remote' },
        ],
      },
    });

    expect(wrapper.classes()).toContain('ui-select-shell');
    expect(wrapper.get('.ui-select').attributes('aria-label')).toBe('Runtime');
    expect(wrapper.findAll('.ui-select__option')).toHaveLength(2);
    expect(wrapper.get('.ui-select__popover').attributes('popover')).toBe('auto');
    expect(wrapper.get('input[type="hidden"]').attributes('name')).toBe('runtime');
    await wrapper.get('.ui-select').trigger('pointerdown');
    expect(wrapper.get('.ui-select').attributes('data-neoverse-focus-origin')).toBe('pointer');
    await wrapper.get('.ui-select').trigger('blur');
    expect(wrapper.get('.ui-select').attributes('data-neoverse-focus-origin')).toBeUndefined();
    await wrapper.findAll('.ui-select__option')[1]?.trigger('click');
    expect(wrapper.emitted('update:modelValue')).toEqual([['remote']]);
  });

  it('maps validation and readonly state onto native text controls', () => {
    const input = mount(UiInput, {
      props: { modelValue: 'Locked', validation: 'error', readonly: true },
    });
    const control = input.get('input');
    expect(control.attributes('data-validation')).toBe('error');
    expect(control.attributes('readonly')).toBeDefined();
    expect(control.attributes('aria-invalid')).toBe('true');

    const explicit = mount(UiTextarea, {
      attrs: { 'aria-invalid': 'false' },
      props: { validation: 'error' },
    });
    expect(explicit.get('textarea').attributes('aria-invalid')).toBe('false');
  });

  it('uses native checkbox and switch semantics with v-model updates', async () => {
    const checkbox = mount(UiCheckbox, {
      props: { modelValue: false },
      slots: { default: 'Release notifications' },
    });
    const checkboxInput = checkbox.get('input');
    expect(checkboxInput.attributes('type')).toBe('checkbox');
    await checkboxInput.setValue(true);
    expect(checkbox.emitted('update:modelValue')).toEqual([[true]]);

    const toggle = mount(UiSwitch, {
      props: { modelValue: false, validation: 'success' },
      slots: { default: 'Sync automatically' },
    });
    const switchInput = toggle.get('input');
    expect(switchInput.attributes('role')).toBe('switch');
    expect(toggle.attributes('data-validation')).toBe('success');
    await switchInput.setValue(true);
    expect(toggle.emitted('update:modelValue')).toEqual([[true]]);
  });

  it('keeps readonly choice controls focusable without emitting mutations', async () => {
    const checkbox = mount(UiCheckbox, {
      props: { modelValue: true, readonly: true },
    });
    const input = checkbox.get('input');
    expect(input.attributes('disabled')).toBeUndefined();
    expect(input.attributes('aria-disabled')).toBe('true');
    await input.trigger('change');
    expect(checkbox.emitted('update:modelValue')).toBeUndefined();
  });

  it('renders a semantic radio group and emits selected values', async () => {
    const wrapper = mount(UiRadioGroup, {
      props: {
        modelValue: 'native',
        name: 'runtime',
        ariaLabel: 'Runtime',
        options: [
          { value: 'native', label: 'Native' },
          { value: 'remote', label: 'Remote', description: 'Hosted runtime' },
        ],
      },
    });
    expect(wrapper.attributes('role')).toBe('radiogroup');
    expect(wrapper.attributes('aria-label')).toBe('Runtime');
    const inputs = wrapper.findAll('input[type="radio"]');
    expect(inputs).toHaveLength(2);
    await inputs[1]?.setValue(true);
    expect(wrapper.emitted('update:modelValue')).toEqual([['remote']]);
  });

  it('composes labels, descriptions, controls and validation messages with UiField', () => {
    const wrapper = mount(UiField, {
      props: {
        controlId: 'field-email',
        label: 'Email',
        description: 'Used for release notifications.',
        message: 'Enter a valid email address.',
        validation: 'error',
        required: true,
      },
      slots: { default: '<input id="field-email" />' },
    });
    expect(wrapper.attributes('data-validation')).toBe('error');
    expect(wrapper.get('label').attributes('for')).toBe('field-email');
    expect(wrapper.get('.ui-field__description').text()).toContain('release notifications');
    expect(wrapper.get('.ui-field__message').text()).toBe('Enter a valid email address.');
    expect(wrapper.get('.ui-field__required').text()).toBe('*');
  });

  it('binds native Field state and updates description associations without dangling ids', async () => {
    const wrapper = mount(UiField, {
      props: {
        controlId: 'release-email',
        label: 'Email',
        description: 'Release updates',
        message: 'Invalid email',
        descriptionId: 'release-help',
        messageId: 'release-error',
        required: true,
        disabled: true,
      },
      slots: { default: ({ controlAttrs }) => h(UiInput, { ...controlAttrs, type: 'email' }) },
    });
    const input = wrapper.get('input');
    expect(input.attributes('id')).toBe('release-email');
    expect(input.attributes('aria-describedby')).toBe('release-help release-error');
    expect((input.element as HTMLInputElement).required).toBe(true);
    expect((input.element as HTMLInputElement).disabled).toBe(true);
    expect(wrapper.get('#release-help').text()).toBe('Release updates');
    expect(wrapper.get('#release-error').text()).toBe('Invalid email');
    await wrapper.setProps({ description: '', message: '', required: false, disabled: false });
    expect(input.attributes('aria-describedby')).toBeUndefined();
    expect((input.element as HTMLInputElement).required).toBe(false);
    expect((input.element as HTMLInputElement).disabled).toBe(false);
  });
});
