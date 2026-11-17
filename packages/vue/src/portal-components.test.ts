import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import UiAvatar from './UiAvatar.vue';
import UiPagination from './UiPagination.vue';
import UiTabs from './UiTabs.vue';

describe('portal components', () => {
  it('Tabs uses tab semantics, skips disabled options and changes on arrow keys', async () => {
    const wrapper = mount(UiTabs, {
      attachTo: document.body,
      props: {
        ariaLabel: 'Member sections',
        options: [
          { value: 'profile', label: 'Profile' },
          { value: 'blocked', label: 'Blocked', disabled: true },
          { value: 'activity', label: 'Activity' },
        ],
      },
      slots: { default: (props: { value: string }) => props.value },
    });
    const tabs = wrapper.findAll('[role="tab"]');
    expect(tabs).toHaveLength(3);
    expect(tabs[0]?.attributes('aria-selected')).toBe('true');
    expect(tabs[1]?.attributes('disabled')).toBeDefined();
    await tabs[0]?.trigger('keydown', { key: 'ArrowRight' });
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['activity']);
    expect(tabs[2]?.attributes('aria-selected')).toBe('true');
    expect(wrapper.get('[role="tabpanel"]').text()).toBe('activity');
    wrapper.unmount();
  });

  it('Avatar shows initials when an image fails and retries when src changes', async () => {
    const wrapper = mount(UiAvatar, {
      props: { name: 'Lin Chen', src: '/missing-image.png' },
    });
    expect(wrapper.classes()).toContain('ui-avatar--rounded');
    expect(wrapper.get('img').attributes('alt')).toBe('');
    await wrapper.get('img').trigger('error');
    expect(wrapper.find('img').exists()).toBe(false);
    expect(wrapper.get('.ui-avatar__fallback').text()).toBe('LC');
    await wrapper.setProps({ src: '/another.png' });
    expect(wrapper.find('img').exists()).toBe(true);
  });

  it('Avatar supports a circle shape', () => {
    const wrapper = mount(UiAvatar, {
      props: { name: 'Lin Chen', shape: 'circle' },
    });
    expect(wrapper.classes()).toContain('ui-avatar--circle');
    expect(wrapper.classes()).not.toContain('ui-avatar--rounded');
    wrapper.unmount();
  });

  it('Pagination marks the current page and suppresses invalid requests', async () => {
    const props = {
      page: 5,
      totalPages: 12,
      ariaLabel: 'Pages',
      previousLabel: 'Previous',
      nextLabel: 'Next',
      pageLabel: 'Page',
    };
    const wrapper = mount(UiPagination, { props });
    expect(wrapper.get('[aria-current="page"]').text()).toBe('5');
    await wrapper.get('[aria-label="Next"]').trigger('click');
    expect(wrapper.emitted('update:page')?.[0]).toEqual([6]);
    await wrapper.setProps({ page: 1 });
    expect(wrapper.get('[aria-label="Previous"]').attributes('disabled')).toBeDefined();
    await wrapper.setProps({ page: 1, totalPages: 0 });
    expect(wrapper.find('[aria-current="page"]').exists()).toBe(false);
    expect(wrapper.get('[aria-label="Next"]').attributes('disabled')).toBeDefined();
    wrapper.unmount();
  });
});
