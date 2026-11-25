import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSSRApp, h, nextTick, ref } from 'vue';
import { renderToString } from 'vue/server-renderer';
import UiDialog from './components/overlays/UiDialog.vue';
import UiToast from './components/overlays/UiToast.vue';

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

describe('business interaction adapters', () => {
  it('does not render modal or toast portals on the server', async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h('main', [
            h(UiDialog, { title: 'Review', open: true }, () => 'Contents'),
            h(UiToast, { open: true, message: 'Saved', dismissLabel: 'Dismiss' }),
          ]),
      }),
    );
    expect(html).not.toContain('<dialog');
    expect(html).not.toContain('ui-toast');
  });

  it('delegates cancel requests without closing a controlled modal', async () => {
    const open = ref(true);
    const show = vi.spyOn(HTMLDialogElement.prototype, 'showModal').mockImplementation(function (
      this: HTMLDialogElement,
    ) {
      this.setAttribute('open', '');
    });
    const close = vi.spyOn(HTMLDialogElement.prototype, 'close').mockImplementation(function (
      this: HTMLDialogElement,
    ) {
      this.removeAttribute('open');
      this.dispatchEvent(new Event('close'));
    });
    const wrapper = mount(
      {
        setup: () => () =>
          h(UiDialog, {
            title: 'Review',
            open: open.value,
            'onUpdate:open': (value: boolean) => {
              open.value = value;
            },
          }),
      },
      { attachTo: document.body },
    );
    await nextTick();
    await nextTick();
    const dialog = document.querySelector<HTMLDialogElement>('.ui-dialog');
    expect(dialog).not.toBeNull();
    expect(show).toHaveBeenCalledOnce();
    const cancel = new Event('cancel', { cancelable: true });
    dialog?.dispatchEvent(cancel);
    expect(cancel.defaultPrevented).toBe(true);
    await nextTick();
    await nextTick();
    expect(open.value).toBe(false);
    expect(close).toHaveBeenCalledOnce();
    wrapper.unmount();
  });
});
