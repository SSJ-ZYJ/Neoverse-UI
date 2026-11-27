import { materials } from '@neoverse-ui/tokens';
import { expect, it } from 'vitest';
import { createSSRApp, h, nextTick } from 'vue';
import { renderToString } from 'vue/server-renderer';
import UiButton from '../components/actions/UiButton.vue';
import UiInput from '../components/forms/UiInput.vue';
import UiSelect from '../components/forms/UiSelect.vue';
import UiCard from '../components/surfaces/UiCard.vue';
import UiControlSurface from '../components/surfaces/UiControlSurface.vue';

it.each(materials)(
  'keeps server-rendered controls intact when the material scope switches to %s before hydration',
  async (material) => {
    let clicks = 0;
    const createFixture = () =>
      createSSRApp({
        render: () =>
          h(UiCard, { as: 'article' }, () => [
            h(UiControlSurface, { as: 'nav', 'aria-label': 'Tools' }, () =>
              h(UiButton, { onClick: () => clicks++ }, () => 'Apply'),
            ),
            h(UiInput, { modelValue: 'Neoverse', 'aria-label': 'Name' }),
            h(UiSelect, {
              modelValue: 'a',
              'aria-label': 'Mode',
              options: [
                { value: 'a', label: 'Alpha' },
                { value: 'b', label: 'Beta' },
              ],
            }),
          ]),
      });
    const container = document.createElement('div');
    document.body.append(container);
    const app = createFixture();
    const warnings: string[] = [];
    app.config.warnHandler = (message) => warnings.push(message);
    try {
      container.innerHTML = await renderToString(createFixture());
      const button = container.querySelector('button');
      const input = container.querySelector('input');
      const surfaces = [...container.querySelectorAll('[data-surface="auto"]')];
      expect(surfaces.map((surface) => surface.tagName)).toEqual(['ARTICLE', 'NAV', 'BUTTON']);
      container.dataset.neoverseMaterial = material;
      app.mount(container);
      await nextTick();
      expect(container.querySelector('button')).toBe(button);
      expect(container.querySelector('input')).toBe(input);
      expect([...container.querySelectorAll('[data-surface="auto"]')]).toEqual(surfaces);
      button?.click();
      expect(clicks).toBe(1);
      expect(warnings).toEqual([]);
    } finally {
      app.unmount();
      container.remove();
    }
  },
);
