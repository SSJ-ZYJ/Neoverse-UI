import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSSRApp, h, nextTick } from 'vue';
import { renderToString } from 'vue/server-renderer';
import UiScrollbar from '../components/surfaces/UiScrollbar.vue';

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

describe('UiScrollbar', () => {
  it('publishes its native-hiding contract in server-rendered markup', async () => {
    const render = (hideNative: boolean) =>
      renderToString(createSSRApp({ render: () => h(UiScrollbar, { hideNative }) }));

    const html = await render(true);
    expect(html).toContain('data-hide-native="true"');
    expect(html).toContain('data-visible="false"');
    expect(html).toContain('aria-hidden="true"');
    expect(await render(false)).toContain('data-hide-native="false"');
  });

  it('reacts when native scrollbar ownership is toggled', async () => {
    const root = document.documentElement;
    const wrapper = mount(UiScrollbar, {
      attachTo: document.body,
      props: { hideNative: false },
    });

    expect(root.classList).not.toContain('ui-scrollbar-target');
    await wrapper.setProps({ hideNative: true });
    expect(root.classList).toContain('ui-scrollbar-target');
    await wrapper.setProps({ hideNative: false });
    expect(root.classList).not.toContain('ui-scrollbar-target');
    wrapper.unmount();
  });

  it('tracks document geometry and owns native scrollbar visibility', async () => {
    const root = document.documentElement;
    Object.defineProperty(root, 'scrollHeight', { configurable: true, value: 1600 });
    Object.defineProperty(root, 'clientHeight', { configurable: true, value: 800 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 });

    const wrapper = mount(UiScrollbar, {
      attachTo: document.body,
      props: { autoHideMs: 0 },
    });
    await nextTick();

    expect(wrapper.classes()).toContain('ui-scrollbar');
    expect(wrapper.attributes('data-visible')).toBe('true');
    expect(wrapper.get('.ui-scrollbar__thumb').attributes('style')).toContain('height: 50%');
    expect(root.classList).toContain('ui-scrollbar-target');

    wrapper.unmount();
    expect(root.classList).not.toContain('ui-scrollbar-target');
  });

  it('maps thumb dragging and track jumps to document scrolling', async () => {
    const root = document.documentElement;
    Object.defineProperty(root, 'scrollHeight', { configurable: true, value: 1600 });
    Object.defineProperty(root, 'clientHeight', { configurable: true, value: 800 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 });
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);

    const wrapper = mount(UiScrollbar, {
      attachTo: document.body,
      props: { autoHideMs: 0 },
    });
    await nextTick();

    const track = wrapper.get('.ui-scrollbar');
    const thumb = wrapper.get('.ui-scrollbar__thumb');
    vi.spyOn(track.element, 'getBoundingClientRect').mockReturnValue({
      top: 0,
      height: 800,
    } as DOMRect);
    vi.spyOn(thumb.element, 'getBoundingClientRect').mockReturnValue({
      top: 0,
      height: 400,
    } as DOMRect);

    await thumb.trigger('pointerdown', { button: 0, clientY: 20, pointerId: 1 });
    expect(wrapper.classes()).toContain('ui-scrollbar--dragging');

    await thumb.trigger('pointermove', { clientY: 400, pointerId: 1 });
    await thumb.trigger('pointerup', { pointerId: 1 });
    expect(wrapper.classes()).not.toContain('ui-scrollbar--dragging');

    await track.trigger('pointerdown', { button: 0, clientY: 700, pointerId: 2 });
    expect(scrollTo).toHaveBeenCalled();
  });
});

describe('UiScrollbar interaction visibility', () => {
  it('keeps the scrollbar visible while the pointer rests on its track', async () => {
    vi.useFakeTimers();
    const root = document.documentElement;
    Object.defineProperty(root, 'scrollHeight', { configurable: true, value: 1600 });
    Object.defineProperty(root, 'clientHeight', { configurable: true, value: 800 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 });
    const wrapper = mount(UiScrollbar, { attachTo: document.body, props: { autoHideMs: 100 } });
    try {
      await nextTick();
      const track = wrapper.get('.ui-scrollbar');
      await track.trigger('pointerenter', { pointerType: 'mouse' });
      vi.advanceTimersByTime(250);
      await nextTick();
      expect(track.attributes('data-visible')).toBe('true');

      await track.trigger('pointerleave', { pointerType: 'mouse' });
      vi.advanceTimersByTime(100);
      await nextTick();
      expect(track.attributes('data-visible')).toBe('false');
    } finally {
      wrapper.unmount();
      vi.useRealTimers();
    }
  });

  it.each(['pointerup', 'pointercancel', 'lostpointercapture'])(
    'keeps the scrollbar visible while a drag is held, until %s',
    async (finishEvent) => {
      vi.useFakeTimers();
      const root = document.documentElement;
      Object.defineProperty(root, 'scrollHeight', { configurable: true, value: 1600 });
      Object.defineProperty(root, 'clientHeight', { configurable: true, value: 800 });
      Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 });
      const wrapper = mount(UiScrollbar, { attachTo: document.body, props: { autoHideMs: 100 } });
      try {
        await nextTick();
        const track = wrapper.get('.ui-scrollbar');
        const thumb = wrapper.get('.ui-scrollbar__thumb');
        vi.spyOn(thumb.element, 'getBoundingClientRect').mockReturnValue({
          top: 0,
          bottom: 400,
          height: 400,
        } as DOMRect);
        await thumb.trigger('pointerdown', { button: 0, clientY: 20, pointerId: 1 });
        await track.trigger('pointerleave', { pointerType: 'mouse' });
        vi.advanceTimersByTime(250);
        await nextTick();
        expect(track.classes()).toContain('ui-scrollbar--dragging');
        expect(track.attributes('data-visible')).toBe('true');

        await thumb.trigger('pointerup', { pointerId: 2 });
        expect(track.classes()).toContain('ui-scrollbar--dragging');
        await thumb.trigger(finishEvent, { pointerId: 1 });
        expect(track.classes()).not.toContain('ui-scrollbar--dragging');
        vi.advanceTimersByTime(100);
        await nextTick();
        expect(track.attributes('data-visible')).toBe('false');
      } finally {
        wrapper.unmount();
        vi.useRealTimers();
      }
    },
  );
});
