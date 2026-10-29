import { describe, expect, it, vi } from 'vitest';
import { createSSRApp, h, nextTick } from 'vue';
import { renderToString } from 'vue/server-renderer';
import UiDropdownMenu from './UiDropdownMenu.vue';
import UiPopover from './UiPopover.vue';

describe('overlay SSR hydration', () => {
  it('preserves unique panel associations through hydration and interaction', async () => {
    const createFixture = () =>
      createSSRApp({
        render: () =>
          h('main', [
            h(
              UiPopover,
              { ariaLabel: 'First details' },
              { trigger: () => 'First', default: () => 'Body' },
            ),
            h(
              UiPopover,
              { ariaLabel: 'Second details' },
              { trigger: () => 'Second', default: () => 'Body' },
            ),
            h(
              UiDropdownMenu,
              { ariaLabel: 'Actions', items: [{ id: 'open', label: 'Open' }] },
              {
                trigger: () => 'Actions',
              },
            ),
          ]),
      });
    const container = document.createElement('div');
    document.body.append(container);
    container.innerHTML = await renderToString(createFixture());
    const associations = () =>
      Array.from(container.querySelectorAll('button[aria-expanded]')).map((button) =>
        button.getAttribute('aria-controls'),
      );
    const serverIds = associations();
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const app = createFixture();
    try {
      expect(serverIds).toHaveLength(3);
      expect(serverIds.every(Boolean)).toBe(true);
      expect(new Set(serverIds).size).toBe(3);
      for (const id of serverIds) {
        expect(container.querySelectorAll(`[id="${id}"]`)).toHaveLength(1);
      }
      app.mount(container);
      await nextTick();
      expect(associations()).toEqual(serverIds);
      container.querySelector('button')?.click();
      await nextTick();
      await nextTick();
      expect(container.querySelector('button')?.getAttribute('aria-expanded')).toBe('true');
      expect(associations()).toEqual(serverIds);
      expect(error).not.toHaveBeenCalled();
      expect(warn).not.toHaveBeenCalled();
    } finally {
      app.unmount();
      container.remove();
      error.mockRestore();
      warn.mockRestore();
    }
  });
});
