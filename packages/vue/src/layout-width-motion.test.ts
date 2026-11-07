import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, onBeforeUpdate, ref } from 'vue';
import { useLayoutWidthMotion } from './layout-width-motion';

interface RecordedAnimation {
  keyframes: Keyframe[];
  options: KeyframeAnimationOptions;
  cancel: ReturnType<typeof vi.fn>;
}

const recorded: RecordedAnimation[] = [];
const mounted: ReturnType<typeof mount>[] = [];
const locale = ref('zh');
let boxWidth = '100px';

function fakeAnimation(): Animation {
  return {
    finished: new Promise<void>(() => undefined),
    cancel: vi.fn(),
  } as unknown as Animation;
}

function installGeometry(element: Element): void {
  vi.spyOn(element, 'getClientRects').mockReturnValue([
    { width: 100, height: 20 },
  ] as unknown as DOMRectList);
  Object.defineProperty(element, 'animate', {
    configurable: true,
    value: (keyframes: Keyframe[], options: KeyframeAnimationOptions) => {
      const animation = fakeAnimation();
      recorded.push({ keyframes, options, cancel: animation.cancel as ReturnType<typeof vi.fn> });
      return animation;
    },
  });
}

function stubComputedStyle(): void {
  const original = window.getComputedStyle.bind(window);
  vi.spyOn(window, 'getComputedStyle').mockImplementation((element, pseudo) => {
    if (element instanceof Element && element.classList.contains('box')) {
      return {
        width: boxWidth,
        getPropertyValue: (name: string) =>
          name === '--neoverse-motion-spatial-duration'
            ? '420ms'
            : name === '--neoverse-motion-spatial-easing'
              ? 'ease-out'
              : '',
      } as unknown as CSSStyleDeclaration;
    }
    return original(element, pseudo);
  });
}

const component = defineComponent({
  setup() {
    const root = ref<HTMLElement | null>(null);
    useLayoutWidthMotion({ root, targets: '.box', trigger: () => locale.value });
    // The browser recalculates the box while Vue patches, after the pre-flush sample.
    onBeforeUpdate(() => {
      boxWidth = '160px';
    });
    return () => h('div', { ref: root }, [h('span', { class: 'box' }, locale.value)]);
  },
});

function mountComponent() {
  const wrapper = mount(component, { attachTo: document.body });
  mounted.push(wrapper);
  installGeometry(wrapper.find('.box').element);
  stubComputedStyle();
  return wrapper;
}

beforeEach(() => {
  locale.value = 'zh';
  boxWidth = '100px';
});

afterEach(() => {
  for (const wrapper of mounted.splice(0)) wrapper.unmount();
  vi.restoreAllMocks();
  recorded.length = 0;
  document.body.innerHTML = '';
});

describe('useLayoutWidthMotion', () => {
  it('samples before the update and animates the new width on the spatial role', async () => {
    mountComponent();

    locale.value = 'en';
    await nextTick();
    await nextTick();

    expect(recorded).toHaveLength(1);
    expect(recorded[0]?.keyframes).toEqual([{ width: '100px' }, { width: '160px' }]);
    expect(recorded[0]?.options).toMatchObject({
      duration: 420,
      easing: 'ease-out',
      fill: 'both',
    });
  });

  it('does not replay the motion on first render', async () => {
    mountComponent();

    await nextTick();

    expect(recorded).toHaveLength(0);
  });

  it('stops the running animation when the viewport resizes', async () => {
    mountComponent();

    locale.value = 'en';
    await nextTick();
    await nextTick();
    window.dispatchEvent(new Event('resize'));

    expect(recorded[0]?.cancel).toHaveBeenCalled();
  });

  it('stops the running animation when the owner unmounts', async () => {
    const wrapper = mountComponent();

    locale.value = 'en';
    await nextTick();
    await nextTick();
    wrapper.unmount();

    expect(recorded[0]?.cancel).toHaveBeenCalled();
  });
});
