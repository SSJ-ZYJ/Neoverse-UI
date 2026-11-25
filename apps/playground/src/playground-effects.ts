import { attachLayoutSizeMotion } from '@neoverse-ui/motion';
import { mountPlaygroundGlass } from './glass-runtime';

// Multiline catalogue rows reflow as part of the locale snapshot so that
// a newly added line never has to fit inside the old row height.
const controls = `:is(
  button, input:not([type='hidden']), select, textarea, [role='tab'], [role='switch'],
  .ui-action, .ui-segmented-control, .ui-navigation-item, .ui-control-surface, .ui-dock,
  .ui-input, .ui-textarea, .ui-select, .ui-field, .ui-checkbox, .ui-radio-group,
  .ui-tabs, .ui-disclosure, .ui-avatar, .ui-badge, .ui-status-indicator
):not([data-motion-width-stage] *, .playground-explorer__link, .playground-explorer__section-toggle)`;

export function mountPlaygroundEffects(root: HTMLElement): void {
  attachLayoutSizeMotion(root, {
    targets: controls,
    singleLineLabels: [
      '.ui-button__content',
      '.ui-action__content',
      '.ui-navigation-item__label:not(.sr-only)',
      '.ui-badge__label',
      '.ui-status-indicator__label',
      '.ui-select__value',
    ].join(', '),
    attributes: [
      'class',
      'data-size',
      'data-scale',
      'data-density',
      'data-compact',
      'data-variant',
      'hidden',
    ],
  });
  mountPlaygroundGlass();
}
