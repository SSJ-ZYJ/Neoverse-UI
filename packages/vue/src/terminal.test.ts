import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h, nextTick, ref } from 'vue';
import UiTerminalLine from './UiTerminalLine.vue';
import UiTerminalPrompt from './UiTerminalPrompt.vue';
import UiTerminalSurface from './UiTerminalSurface.vue';
import UiTerminalTranscript from './UiTerminalTranscript.vue';

describe('Terminal composition', () => {
  it('reuses UiSurface Glass and exposes accessible header/action slots', () => {
    const wrapper = mount(UiTerminalSurface, {
      props: { title: 'Session', density: 'expanded' },
      slots: {
        status: () => h('span', 'Connected'),
        actions: () => h('button', { type: 'button' }, 'Close'),
        default: () => h('p', 'Ready'),
      },
    });
    expect(wrapper.classes()).toContain('material-glass-elevated');
    expect(wrapper.attributes('aria-label')).toBe('Session');
    expect(wrapper.attributes('data-density')).toBe('expanded');
    expect(wrapper.get('[role="toolbar"]').attributes('aria-label')).toBe('Session actions');
    expect(wrapper.get('.ui-terminal-surface__body').text()).toBe('Ready');
  });

  it('renders user-provided output as text and exposes preformatted line semantics', () => {
    const payload = '<img src=x onerror=alert(1)>';
    const wrapper = mount(UiTerminalLine, {
      props: { kind: 'command', tone: 'error', preformatted: true, text: payload },
    });
    expect(wrapper.text()).toBe(payload);
    expect(wrapper.find('img').exists()).toBe(false);
    expect(wrapper.attributes('data-kind')).toBe('command');
    expect(wrapper.attributes('data-preformatted')).toBe('true');
    expect(wrapper.attributes('data-tone')).toBe('error');
  });

  it('edits directly after the prompt glyph without the shared form-input surface', async () => {
    const wrapper = mount(UiTerminalPrompt, {
      props: {
        label: 'Terminal command',
        modelValue: '',
        segments: [
          { id: 'host', label: 'Neoverse', tone: 'host' },
          { id: 'path', label: '~/docs', tone: 'path' },
        ],
      },
    });
    const input = wrapper.get('input');
    expect(wrapper.find('.ui-input').exists()).toBe(false);
    expect(input.classes()).toContain('ui-terminal-prompt__editor');
    expect(input.attributes('aria-label')).toBe('Terminal command');
    expect(wrapper.get('label').attributes('for')).toBe(input.attributes('id'));
    expect(wrapper.findAll('.ui-terminal-prompt__segment')).toHaveLength(2);

    await input.setValue('echo hello');
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['echo hello']);
    await input.trigger('compositionstart');
    input.element.value = '你好';
    await input.trigger('input');
    await input.trigger('compositionend');
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['你好']);
  });

  it('keeps native password, readonly, disabled and error states', () => {
    const wrapper = mount(UiTerminalPrompt, {
      props: {
        label: 'Secret token',
        modelValue: 'example',
        type: 'password',
        readonly: true,
        error: true,
      },
      attrs: { autocomplete: 'current-password', spellcheck: 'true' },
    });
    const input = wrapper.get('input');
    expect(input.attributes('type')).toBe('password');
    expect(input.attributes('autocomplete')).toBe('current-password');
    expect(input.attributes('spellcheck')).toBe('true');
    expect(input.attributes('readonly')).toBeDefined();
    expect(input.attributes('aria-invalid')).toBe('true');
    expect(wrapper.attributes('data-error')).toBe('true');
    wrapper.unmount();
  });

  it('shows a ghost suffix only during native editing at the end', async () => {
    const wrapper = mount(UiTerminalPrompt, {
      props: { label: 'Command', modelValue: 'c', suggestion: 'clear' },
    });
    const input = wrapper.get('input');
    input.element.setSelectionRange(1, 1);
    await input.trigger('focus');
    expect(wrapper.get('.ui-terminal-prompt__ghost-suffix').text()).toBe('lear');
    expect(wrapper.get('.ui-terminal-prompt__ghost').attributes('aria-hidden')).toBe('true');
    expect(input.element.value).toBe('c');
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    input.element.setSelectionRange(0, 1);
    await input.trigger('select');
    expect(wrapper.find('.ui-terminal-prompt__ghost').exists()).toBe(false);
    input.element.setSelectionRange(1, 1);
    await input.trigger('select');
    await input.trigger('compositionstart');
    expect(wrapper.find('.ui-terminal-prompt__ghost').exists()).toBe(false);
    await input.trigger('compositionend');
    expect(wrapper.find('.ui-terminal-prompt__ghost').exists()).toBe(true);
    input.element.scrollLeft = 20;
    await input.trigger('scroll');
    expect(wrapper.get('.ui-terminal-prompt__ghost > span').attributes('style')).toContain(
      'translateX(-20px)',
    );
    await input.trigger('blur');
    expect(wrapper.find('.ui-terminal-prompt__ghost').exists()).toBe(false);
    await input.trigger('focus');
    for (const props of [
      { suggestion: 'different' },
      { suggestion: 'clear', readonly: true },
      { readonly: false, disabled: true },
      { disabled: false, type: 'password' as const },
    ]) {
      await wrapper.setProps(props);
      expect(wrapper.find('.ui-terminal-prompt__ghost').exists()).toBe(false);
    }
  });

  it('composes segment content without requiring a host or glyph font', () => {
    const wrapper = mount(UiTerminalPrompt, {
      props: {
        label: 'Command',
        segments: [
          { id: 'path', label: '~/docs', tone: 'path' },
          { id: 'time', label: '12:32', tone: 'time' },
        ],
      },
      slots: {
        segment: ({ segment }) => [
          h('svg', { 'aria-hidden': 'true', viewBox: '0 0 16 16' }),
          h('span', segment.label),
        ],
      },
    });
    const segments = wrapper.findAll('.ui-terminal-prompt__segment');
    expect(segments.map((segment) => segment.text())).toEqual(['~/docs', '12:32']);
    expect(segments[0]?.attributes('data-tone')).toBe('path');
    expect(wrapper.findAll('svg[aria-hidden="true"]')).toHaveLength(2);
    expect(wrapper.get('input').attributes('aria-label')).toBe('Command');
  });

  it('exposes an accessible native scroll region and cleans observers on unmount', async () => {
    const lines = ref(['first']);
    const wrapper = mount(UiTerminalTranscript, {
      attachTo: document.body,
      props: { label: 'Build log', live: 'polite' },
      slots: { default: () => lines.value.map((line) => h('p', { key: line }, line)) },
    });
    expect(wrapper.find('section').exists()).toBe(true);
    expect(wrapper.get('[role="log"]').attributes('aria-live')).toBe('polite');
    expect(wrapper.attributes('aria-label')).toBe('Build log');
    expect(wrapper.classes()).toContain('scrollbar-immersive');
    lines.value.push('second');
    await nextTick();
    expect(wrapper.text()).toContain('second');
    wrapper.unmount();
  });
});
