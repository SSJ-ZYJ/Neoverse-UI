import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import UiEmptyState from './UiEmptyState.vue';

describe('UiEmptyState', () => {
  it('labels the region with its title and description', () => {
    const wrapper = mount(UiEmptyState, {
      props: { title: 'No projects', description: 'Create one to begin' },
      slots: {
        icon: () => h('svg', { 'data-icon': '' }),
        action: () => h('button', { type: 'button' }, 'Create'),
      },
    });
    const region = wrapper.get('section');
    expect(region.attributes('aria-labelledby')).toBe(wrapper.get('h3').attributes('id'));
    expect(region.attributes('aria-describedby')).toBe(wrapper.get('p').attributes('id'));
    expect(wrapper.get('.ui-empty-state__icon').attributes('aria-hidden')).toBe('true');
    expect(wrapper.get('button').text()).toBe('Create');
  });

  it('omits optional description, icon and action elements', () => {
    const wrapper = mount(UiEmptyState, { props: { title: 'Nothing here' } });
    expect(wrapper.get('section').attributes('aria-describedby')).toBeUndefined();
    expect(wrapper.find('.ui-empty-state__icon').exists()).toBe(false);
    expect(wrapper.find('.ui-empty-state__action').exists()).toBe(false);
  });
});
