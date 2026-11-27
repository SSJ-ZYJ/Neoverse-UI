import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSSRApp, h, nextTick, ref } from 'vue';
import { renderToString } from 'vue/server-renderer';
import UiDialog from '../components/overlays/UiDialog.vue';
import UiToast from '../components/overlays/UiToast.vue';

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

  it('delegates Escape and close requests without keeping a controlled modal in the top layer', async () => {
    const open = ref(true);
    const show = vi.spyOn(HTMLDialogElement.prototype, 'show').mockImplementation(function (
      this: HTMLDialogElement,
    ) {
      this.setAttribute('open', '');
    });
    const showModal = vi.spyOn(HTMLDialogElement.prototype, 'showModal');
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
    expect(dialog?.getAttribute('aria-modal')).toBe('true');
    expect(show).toHaveBeenCalledOnce();
    expect(showModal).not.toHaveBeenCalled();

    const escapeEvent = new KeyboardEvent('keydown', {
      key: 'Escape',
      cancelable: true,
      bubbles: true,
    });
    document.dispatchEvent(escapeEvent);
    expect(escapeEvent.defaultPrevented).toBe(true);
    await nextTick();
    await nextTick();
    expect(open.value).toBe(false);
    expect(close).toHaveBeenCalledOnce();
    wrapper.unmount();
  });

  it('bridges ancestor material scope onto the portaled dialog across open and close', async () => {
    const open = ref(true);
    vi.spyOn(HTMLDialogElement.prototype, 'show').mockImplementation(function (
      this: HTMLDialogElement,
    ) {
      this.setAttribute('open', '');
    });
    vi.spyOn(HTMLDialogElement.prototype, 'close').mockImplementation(function (
      this: HTMLDialogElement,
    ) {
      this.removeAttribute('open');
      this.dispatchEvent(new Event('close'));
    });
    const host = document.createElement('div');
    host.dataset.neoverseMaterial = 'frosted';
    document.body.append(host);
    const nativeGetComputedStyle = window.getComputedStyle.bind(window);
    vi.spyOn(window, 'getComputedStyle').mockImplementation((target, pseudo) => {
      const style = nativeGetComputedStyle(target, pseudo);
      return new Proxy(style, {
        get(obj, prop, receiver) {
          if (prop === 'getPropertyValue') {
            return (name: string) =>
              name === '--neoverse-scope-material'
                ? (target
                    .closest('[data-neoverse-material]')
                    ?.getAttribute('data-neoverse-material') ?? '')
                : obj.getPropertyValue(name);
          }
          const value = Reflect.get(obj, prop, receiver);
          return typeof value === 'function' ? value.bind(obj) : value;
        },
      });
    });

    const wrapper = mount(
      {
        setup: () => () =>
          h(UiDialog, {
            title: 'Scoped review',
            open: open.value,
            'onUpdate:open': (value: boolean) => {
              open.value = value;
            },
          }),
      },
      { attachTo: host },
    );
    await nextTick();
    await nextTick();
    const portal = document.querySelector<HTMLDialogElement>('.ui-dialog')?.parentElement;
    expect(portal?.getAttribute('data-neoverse-material')).toBe('frosted');

    host.dataset.neoverseMaterial = 'solid';
    await nextTick();
    await Promise.resolve();
    expect(portal?.getAttribute('data-neoverse-material')).toBe('solid');

    open.value = false;
    await nextTick();
    expect(portal?.getAttribute('data-neoverse-material')).toBe('solid');
    wrapper.unmount();
  });

  it('renders an accessible close button across all toast presentations and requests dismissal on click', async () => {
    for (const presentation of ['compact', 'action', 'notification'] as const) {
      const open = ref(true);
      const wrapper = mount(
        {
          setup: () => () =>
            h(
              UiToast,
              {
                open: open.value,
                presentation,
                duration: presentation === 'notification' ? 0 : 4000,
                message: 'Changes saved.',
                dismissLabel: 'Dismiss notification',
                'onUpdate:open': (value: boolean) => {
                  open.value = value;
                },
              },
              presentation === 'action'
                ? { action: () => h('button', { type: 'button' }, 'View') }
                : undefined,
            ),
        },
        { attachTo: document.body },
      );
      await nextTick();
      await nextTick();

      const dismiss = document.querySelector<HTMLButtonElement>(
        'button[aria-label="Dismiss notification"]',
      );
      expect(dismiss).not.toBeNull();
      expect(dismiss?.querySelector('svg')).not.toBeNull();
      expect(dismiss?.textContent?.trim()).toBe('');

      dismiss?.click();
      await nextTick();
      expect(open.value).toBe(false);
      wrapper.unmount();
    }
  });
});
