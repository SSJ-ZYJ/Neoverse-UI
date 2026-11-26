import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import UiAction from './components/actions/UiAction.vue';
import UiButton from './components/actions/UiButton.vue';
import UiIconButton from './components/actions/UiIconButton.vue';
import { presence } from './components/motion/presence';
import UiPresence from './components/motion/UiPresence.vue';

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

describe('Presence', () => {
  it('maps variants and origins onto the shared Motion attributes', () => {
    expect(presence('pop', 'top')).toEqual({
      'data-neoverse-motion': 'pop',
      'data-neoverse-motion-origin': 'top',
    });
    expect(presence('fade')).toEqual({ 'data-neoverse-motion': 'fade' });
  });

  it('keeps content mounted through exit and supports an interrupted departure', async () => {
    const wrapper = mount(UiPresence, {
      attachTo: document.body,
      props: { show: true, variant: 'pop', origin: 'top', as: 'span' },
      attrs: { 'data-test-presence': '' },
      slots: { default: 'Presence content' },
    });

    expect(wrapper.element.tagName).toBe('SPAN');
    expect(wrapper.attributes('data-neoverse-motion')).toBe('pop');
    expect(wrapper.attributes('data-neoverse-motion-origin')).toBe('top');
    expect(wrapper.classes()).toContain('nv-appear');
    expect(wrapper.classes()).not.toContain('nv-vanish');

    await wrapper.setProps({ show: false });
    expect(wrapper.find('[data-test-presence]').exists()).toBe(true);
    expect(wrapper.classes()).toContain('nv-vanish');

    await wrapper.setProps({ show: true });
    expect(wrapper.find('[data-test-presence]').exists()).toBe(true);
    expect(wrapper.classes()).not.toContain('nv-vanish');

    await wrapper.setProps({ show: false });
    const animationEnd = new Event('animationend', { bubbles: true }) as AnimationEvent;
    Object.defineProperty(animationEnd, 'animationName', { value: 'nv-vanish' });
    wrapper.element.dispatchEvent(animationEnd);
    await nextTick();

    expect(wrapper.find('[data-test-presence]').exists()).toBe(false);
    wrapper.unmount();
  });

  it('interprets millisecond exit tokens without treating them as seconds', async () => {
    vi.useFakeTimers();
    const computedStyle = vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      getPropertyValue: () => '140ms',
    } as unknown as CSSStyleDeclaration);
    const wrapper = mount(UiPresence, {
      attachTo: document.body,
      props: { show: true },
      attrs: { 'data-test-presence-timer': '' },
      slots: { default: 'Timed presence' },
    });

    await wrapper.setProps({ show: false });
    await vi.advanceTimersByTimeAsync(189);
    expect(wrapper.find('[data-test-presence-timer]').exists()).toBe(true);

    await vi.advanceTimersByTimeAsync(1);
    await nextTick();
    expect(wrapper.find('[data-test-presence-timer]').exists()).toBe(false);

    computedStyle.mockRestore();
    vi.useRealTimers();
    wrapper.unmount();
  });
});

describe('UiButton', () => {
  it('exposes a material-resolving Button without changing primary button semantics', () => {
    const wrapper = mount(UiButton, {
      props: { variant: 'primary' },
      slots: { default: 'Primary' },
    });

    expect(wrapper.classes()).toEqual(
      expect.arrayContaining([
        'ui-button',
        'ui-button--primary',
        'ui-button--md',
        'material-role-control',
      ]),
    );
    expect(wrapper.attributes('data-surface')).toBe('auto');
    expect(wrapper.attributes('type')).toBe('button');
  });

  it('can remove its material surface without losing button semantics', () => {
    const wrapper = mount(UiButton, {
      props: { variant: 'ghost', surface: 'none' },
      slots: { default: 'Bare action' },
    });

    expect(wrapper.classes()).toContain('ui-button--ghost');
    expect(wrapper.classes()).not.toContain('material-role-control');
    expect(wrapper.attributes('data-surface')).toBe('none');
  });

  it('fills a fixed-height flex container when stretch is set', () => {
    const stretched = mount(UiButton, {
      props: { stretch: true },
      slots: { default: 'Stretch' },
    });

    expect(stretched.classes()).toEqual(
      expect.arrayContaining(['ui-button--md', 'ui-button--stretch']),
    );
    expect(stretched.classes()).not.toContain('h-8');

    const sized = mount(UiButton, { slots: { default: 'Sized' } });
    expect(sized.classes()).toContain('ui-button--md');
    expect(sized.classes()).not.toContain('ui-button--stretch');
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
      expect.arrayContaining(['ui-button--secondary', 'ui-button--lg']),
    );
    expect(button.classes().some((className) => className.includes(':'))).toBe(false);

    await button.trigger('click');
    expect(onClick).toHaveBeenCalledTimes(1);

    await wrapper.setProps({ loading: true });
    expect(button.element.disabled).toBe(true);
    expect(button.attributes('aria-busy')).toBe('true');
    expect(button.find('[aria-hidden="true"]').exists()).toBe(true);

    const loadingIndicator = button.get('[aria-hidden="true"] svg');
    expect(loadingIndicator.classes()).toContain('ui-loading-indicator');
    expect(loadingIndicator.get('circle').attributes('stroke-linecap')).toBe('round');

    onClick.mockClear();
    button.element.click();
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe('UiAction', () => {
  it('renders destination semantics with comfortable action geometry', () => {
    const wrapper = mount(UiAction, {
      props: { href: '/journal', size: 'lg' },
      slots: { default: 'Read the journal' },
    });
    const action = wrapper.get('a');

    expect(action.attributes('href')).toBe('/journal');
    expect(action.text()).toBe('Read the journal');
    expect(action.classes()).toEqual(
      expect.arrayContaining([
        'ui-action',
        'ui-action--lg',
        'ui-button--primary',
        'material-role-control',
      ]),
    );
  });

  it('can scale a destination action as one visual unit', () => {
    const action = mount(UiAction, {
      props: { href: '/journal', size: 'lg', scale: 'lg' },
      slots: { default: 'Read the journal' },
    });

    const anchor = action.get('a');
    expect(anchor.classes()).toContain('ui-action--lg');
    expect(anchor.classes()).toContain('ui-action--scale-lg');
  });

  it('removes navigation and consumer activation while disabled', async () => {
    const onClick = vi.fn();
    const wrapper = mount(UiAction, {
      attrs: { onClick },
      props: { href: '/journal', disabled: true },
      slots: { default: 'Unavailable' },
    });
    const action = wrapper.get('a');

    expect(action.attributes('href')).toBeUndefined();
    expect(action.attributes('aria-disabled')).toBe('true');
    expect(action.attributes('tabindex')).toBe('-1');

    await action.trigger('click');
    expect(onClick).not.toHaveBeenCalled();
  });

  it('keeps native button type and disabled semantics when rendered as a button', () => {
    const enabled = mount(UiAction, {
      props: { as: 'button', type: 'submit' },
      slots: { default: 'Submit' },
    });
    expect(enabled.get('button').attributes('type')).toBe('submit');
    expect(enabled.get('button').attributes('disabled')).toBeUndefined();
    expect(enabled.get('button').attributes('aria-disabled')).toBeUndefined();

    const disabled = mount(UiAction, {
      props: { as: 'button', disabled: true },
      slots: { default: 'Unavailable' },
    });
    expect(disabled.get('button').element.disabled).toBe(true);
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
      expect.arrayContaining(['ui-button--ghost', 'ui-icon-button', 'ui-icon-button--sm']),
    );
    expect(button.classes().some((className) => className.includes(':'))).toBe(false);

    await wrapper.setProps({ loading: true });
    expect(button.element.disabled).toBe(true);
    expect(button.attributes('aria-busy')).toBe('true');

    const loadingIndicator = button.get('[aria-hidden="true"] svg');
    expect(loadingIndicator.classes()).toContain('ui-loading-indicator');
  });

  it('fills a fixed-height flex container when stretch is set', () => {
    const stretched = mount(UiIconButton, {
      props: { label: 'Add', stretch: true },
      slots: { default: 'icon' },
    });

    expect(stretched.get('button').classes()).toEqual(
      expect.arrayContaining(['ui-icon-button--md', 'ui-icon-button--stretch']),
    );
    expect(stretched.get('button').classes()).not.toContain('size-8');

    const sized = mount(UiIconButton, { props: { label: 'Add' }, slots: { default: 'icon' } });
    expect(sized.get('button').classes()).toContain('ui-icon-button--md');
    expect(sized.get('button').classes()).not.toContain('ui-icon-button--stretch');
  });

  it('supports icon-only navigation without consumer geometry overrides', async () => {
    const wrapper = mount(UiIconButton, {
      props: {
        as: 'a',
        href: 'https://example.com/source',
        label: 'View source',
        size: 'sm',
      },
      attrs: { target: '_blank' },
      slots: { default: 'icon' },
    });

    const link = wrapper.get('a');
    expect(link.attributes('href')).toBe('https://example.com/source');
    expect(link.attributes('aria-label')).toBe('View source');
    expect(link.classes()).toContain('ui-icon-button--sm');

    await wrapper.setProps({ disabled: true });
    expect(link.attributes('href')).toBeUndefined();
    expect(link.attributes('aria-disabled')).toBe('true');
    expect(link.attributes('tabindex')).toBe('-1');
  });
});
