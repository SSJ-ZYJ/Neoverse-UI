import { type FunctionalComponent, h } from 'vue';

export const MotionPreviewFrame: FunctionalComponent = (_, { slots }) =>
  h('div', { class: 'grid w-full min-w-0 max-w-reading-wide gap-3' }, [
    h('div', { class: 'flex flex-wrap gap-2' }, slots.action?.()),
    slots.default?.(),
  ]);
