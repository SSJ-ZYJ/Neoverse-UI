import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import UiBadge from './UiBadge.vue';
import UiButton from './UiButton.vue';
import UiCard from './UiCard.vue';
import UiGlassSurface from './UiGlassSurface.vue';
import UiIconButton from './UiIconButton.vue';
import UiSegmentedControl from './UiSegmentedControl.vue';
import UiSkeleton from './UiSkeleton.vue';

const options = [
  { value: 'overview', label: 'Overview' },
  { value: 'details', label: 'Details', disabled: true },
  { value: 'activity', label: 'Activity' },
] as const;

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

describe('UiButton', () => {
  it('uses the shared material hierarchy for visual variants', () => {
    const primary = mount(UiButton, {
      props: { variant: 'primary' },
      slots: { default: 'Primary' },
    });
    const secondary = mount(UiButton, {
      props: { variant: 'secondary' },
      slots: { default: 'Secondary' },
    });
    const ghost = mount(UiButton, { props: { variant: 'ghost' }, slots: { default: 'Ghost' } });

    expect(primary.classes()).toContain('ui-button--primary');
    expect(secondary.classes()).toContain('ui-button--secondary');
    expect(secondary.classes()).not.toContain('bg-action-secondary');
    expect(secondary.classes()).not.toContain('text-action-secondary-foreground');
    expect(ghost.classes()).toContain('ui-button--ghost');
    expect(ghost.classes()).not.toContain('hover:bg-accent-soft');
  });

  it('uses semantic classes and blocks native activation while loading', async () => {
    const onClick = vi.fn();
    const wrapper = mount(UiButton, {
      attrs: { onClick },
      props: { variant: 'secondary', size: 'lg' },
      slots: { default: 'Save' },
    });
    const button = wrapper.get('button');

    expect(button.attributes('type')).toBe('button');
    expect(button.classes()).toEqual(
      expect.arrayContaining([
        'ui-button--secondary',
        'focus-visible:ring-focus',
        'duration-fast',
        'ease-standard',
        'h-11',
        'px-4',
      ]),
    );

    await button.trigger('click');
    expect(onClick).toHaveBeenCalledTimes(1);

    await wrapper.setProps({ loading: true });
    expect(button.element.disabled).toBe(true);
    expect(button.attributes('aria-busy')).toBe('true');
    expect(button.find('[aria-hidden="true"]').exists()).toBe(true);

    onClick.mockClear();
    button.element.click();
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe('UiIconButton', () => {
  it('requires and forwards its accessible label', async () => {
    const wrapper = mount(UiIconButton, {
      props: { label: 'Open settings', variant: 'ghost', size: 'sm' },
      slots: { default: 'icon' },
    });
    const button = wrapper.get('button');

    expect(button.attributes('aria-label')).toBe('Open settings');
    expect(button.classes()).toEqual(
      expect.arrayContaining(['ui-button--ghost', 'size-7', 'focus-visible:ring-2']),
    );

    await wrapper.setProps({ loading: true });
    expect(button.element.disabled).toBe(true);
    expect(button.attributes('aria-busy')).toBe('true');
    expect(button.find('[aria-hidden="true"] .motion-safe\\:animate-spin').exists()).toBe(true);
  });
});

describe('display components', () => {
  it('maps badge, glass, card, and skeleton variants to semantic classes', () => {
    const badge = mount(UiBadge, {
      props: { variant: 'danger', size: 'md' },
      slots: { default: 'Error' },
    });
    expect(badge.classes()).toEqual(
      expect.arrayContaining(['bg-status-danger', 'text-status-danger-foreground', 'text-label']),
    );

    const glass = mount(UiGlassSurface, { props: { variant: 'immersive' } });
    expect(glass.classes()).toEqual(
      expect.arrayContaining(['material-glass-immersive', 'rounded-card', 'p-4']),
    );

    const card = mount(UiCard, { attrs: { class: 'max-w-container-sm' } });
    expect(card.classes()).toEqual(
      expect.arrayContaining([
        'bg-surface-raised',
        'rounded-card',
        'shadow-card',
        'max-w-container-sm',
      ]),
    );

    const skeleton = mount(UiSkeleton, { props: { variant: 'circle' } });
    expect(skeleton.attributes('aria-hidden')).toBe('true');
    expect(skeleton.classes()).toEqual(
      expect.arrayContaining([
        'ui-skeleton',
        'skeleton-surface',
        'ui-skeleton--circle',
        'ui-skeleton--shimmer',
        'rounded-pill',
      ]),
    );
    expect(skeleton.attributes('data-effect')).toBe('shimmer');

    const sizedRect = mount(UiSkeleton, {
      props: {
        variant: 'rect',
        effect: 'none',
        width: '7rem',
        height: '2rem',
        radius: '1rem',
      },
    });
    expect(sizedRect.attributes('data-effect')).toBe('none');
    expect(sizedRect.classes()).toEqual(
      expect.arrayContaining(['ui-skeleton--rect', 'ui-skeleton--static']),
    );
    expect(sizedRect.attributes('style')).toContain('width: 7rem');
    expect(sizedRect.attributes('style')).toContain('height: 2rem');
    expect(sizedRect.attributes('style')).toContain('--ui-skeleton-radius: 1rem');
  });
});

describe('UiSegmentedControl', () => {
  it('supports roving keyboard selection and skips disabled options', async () => {
    const wrapper = mount(UiSegmentedControl, {
      attachTo: document.body,
      attrs: { 'aria-label': 'View' },
      props: { options, defaultValue: 'overview' },
    });
    const buttons = wrapper.findAll('button');

    expect(wrapper.attributes('role')).toBe('radiogroup');
    expect(wrapper.attributes('aria-orientation')).toBe('horizontal');
    expect(wrapper.classes()).toEqual(expect.arrayContaining(['border', 'border-subtle', 'gap-1']));
    expect(buttons[0]?.classes()).toEqual(
      expect.arrayContaining([
        'ui-segmented-control__option',
        'ui-segmented-control__option--active',
        'duration-standard',
        'ease-emphasized',
      ]),
    );
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
  it('marks the group busy and blocks selection while loading', async () => {
    const wrapper = mount(UiSegmentedControl, {
      props: { options, defaultValue: 'overview', loading: true },
    });
    const buttons = wrapper.findAll('button');

    expect(wrapper.attributes('aria-busy')).toBe('true');
    expect(buttons.every((button) => button.element.disabled)).toBe(true);
    expect(wrapper.find('[aria-hidden="true"] > span').classes()).toContain(
      'motion-safe:animate-spin',
    );

    await buttons[0]?.trigger('click');
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
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
