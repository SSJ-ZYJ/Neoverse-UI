import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSSRApp, h, nextTick } from 'vue';
import { renderToString } from 'vue/server-renderer';
import UiSegmentedControl from './components/navigation/UiSegmentedControl.vue';

const options = [
  { value: 'overview', label: 'Overview' },
  { value: 'details', label: 'Details', disabled: true },
  { value: 'activity', label: 'Activity' },
] as const;

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

describe('UiSegmentedControl', () => {
  it('publishes the selected grid column instead of measured offsets before hydration', async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(UiSegmentedControl, { options, defaultValue: 'overview', ariaLabel: 'View' }),
      }),
    );

    expect(html).toContain('--segment-index');
    expect(html).toContain('ui-segmented-control__slider');
    expect(html).not.toContain('--segment-active-offset');
    expect(html).not.toContain('--segment-active-width');
    expect(html).not.toContain('--segment-active-column');
  });

  it('uses an automatic group surface and can opt out of outer chrome', () => {
    const automatic = mount(UiSegmentedControl, { props: { options } });
    expect(automatic.classes()).toContain('material-role-group');
    expect(automatic.attributes('data-surface')).toBe('auto');
    expect(automatic.attributes('data-neoverse-surface-hover')).toBe('static');
    expect(automatic.attributes('data-neoverse-glass-edge-pass')).toBeUndefined();

    const bare = mount(UiSegmentedControl, { props: { options, surface: 'none' } });
    expect(bare.attributes('data-neoverse-glass-edge-pass')).toBeUndefined();
    expect(bare.classes()).not.toContain('material-role-group');
    expect(bare.attributes('data-surface')).toBe('none');
    expect(bare.find('.ui-segmented-control__slider').exists()).toBe(true);
  });

  it('supports roving keyboard selection and skips disabled options', async () => {
    const wrapper = mount(UiSegmentedControl, {
      attachTo: document.body,
      attrs: { 'aria-label': 'View' },
      props: { options, defaultValue: 'overview' },
    });
    const buttons = wrapper.findAll('button');

    expect(wrapper.attributes('role')).toBe('radiogroup');
    expect(wrapper.attributes('aria-orientation')).toBe('horizontal');
    expect(wrapper.classes()).toEqual(expect.arrayContaining(['ui-segmented-control']));
    expect(wrapper.classes()).not.toEqual(expect.arrayContaining(['border-subtle']));
    expect(buttons[0]?.classes()).toEqual(
      expect.arrayContaining([
        'ui-segmented-control__option',
        'ui-segmented-control__option--active',
      ]),
    );
    expect(buttons[0]?.classes().some((className) => className.includes(':'))).toBe(false);
    expect(wrapper.find('.ui-segmented-control__slider').exists()).toBe(true);
    expect(buttons[0]?.attributes('aria-checked')).toBe('true');
    expect(buttons[0]?.attributes('tabindex')).toBe('0');
    expect(buttons[1]?.attributes('disabled')).toBeDefined();
    expect(buttons[2]?.attributes('tabindex')).toBe('-1');

    await buttons[0]?.trigger('keydown', { key: 'ArrowRight' });
    await nextTick();

    expect(buttons[2]?.attributes('aria-checked')).toBe('true');
    expect(buttons[2]?.attributes('tabindex')).toBe('0');
    expect(document.activeElement).toBe(buttons[2]?.element);
    expect(wrapper.emitted('update:modelValue')).toEqual([['activity']]);
  });

  it('keeps controlled values authoritative until the parent updates them', async () => {
    const wrapper = mount(UiSegmentedControl, {
      props: { options, modelValue: 'overview' },
    });
    const buttons = wrapper.findAll('button');

    await buttons[2]?.trigger('click');
    expect(wrapper.emitted('update:modelValue')).toEqual([['activity']]);
    expect(buttons[0]?.attributes('aria-checked')).toBe('true');
    expect(buttons[2]?.attributes('aria-checked')).toBe('false');

    await wrapper.setProps({ modelValue: 'activity' });
    expect(buttons[2]?.attributes('aria-checked')).toBe('true');
  });

  it('returns the tab stop to the controlled value after focus leaves the group', async () => {
    const wrapper = mount(UiSegmentedControl, {
      attachTo: document.body,
      props: { options, modelValue: 'overview' },
    });
    const buttons = wrapper.findAll('button');
    const group = wrapper.get('.ui-segmented-control__options');

    await buttons[0]?.trigger('focus');
    expect(buttons[0]?.attributes('tabindex')).toBe('0');
    await group.trigger('focusout', { relatedTarget: buttons[2]?.element });
    expect(buttons[0]?.attributes('tabindex')).toBe('0');

    await group.trigger('focusout', { relatedTarget: document.body });
    await wrapper.setProps({ modelValue: 'activity' });
    expect(buttons[2]?.attributes('tabindex')).toBe('0');
    expect(buttons[0]?.attributes('tabindex')).toBe('-1');
    wrapper.unmount();
  });

  it('labels the group and individual options through ariaLabel props', () => {
    const labeled = mount(UiSegmentedControl, {
      attrs: { 'aria-label': 'Attrs label' },
      props: { options, ariaLabel: 'View' },
    });
    expect(labeled.attributes('aria-label')).toBe('View');

    const optionLabeled = mount(UiSegmentedControl, {
      props: {
        options: [
          { value: 'a', label: 'A', ariaLabel: 'Show A' },
          { value: 'b', label: 'B' },
        ],
      },
    });
    const optionButtons = optionLabeled.findAll('button');
    expect(optionButtons[0]?.attributes('aria-label')).toBe('Show A');
    expect(optionButtons[1]?.attributes('aria-label')).toBeUndefined();
  });

  it('preserves an aria-label supplied through fallthrough attributes', () => {
    const wrapper = mount(UiSegmentedControl, {
      attrs: { 'aria-label': 'Fallthrough view' },
      props: { options },
    });

    expect(wrapper.attributes('aria-label')).toBe('Fallthrough view');
  });

  it('falls back for an invalid uncontrolled default but not an invalid controlled value', () => {
    const uncontrolled = mount(UiSegmentedControl, {
      props: { options, defaultValue: 'missing' },
    });
    expect(uncontrolled.findAll('button')[0]?.attributes('aria-checked')).toBe('true');

    const controlled = mount(UiSegmentedControl, {
      props: { options, modelValue: 'missing' },
    });
    expect(
      controlled.findAll('button').every((button) => button.attributes('aria-checked') === 'false'),
    ).toBe(true);
    expect(controlled.findAll('button')[0]?.attributes('tabindex')).toBe('0');
  });

  it('warns about duplicate option values in development', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    mount(UiSegmentedControl, {
      props: {
        options: [
          { value: 'one', label: 'One' },
          { value: 'one', label: 'Duplicate' },
        ],
      },
    });

    expect(warn).toHaveBeenCalledWith(
      '[UiSegmentedControl] Duplicate option value "one" makes selection ambiguous.',
    );
  });
});
