import { nextTick } from 'vue';
import type { FormControlValidation } from './types';

export type AriaInvalidValue = boolean | 'true' | 'false' | 'grammar' | 'spelling' | undefined;

export function resolveAriaInvalid(
  explicitValue: unknown,
  validation: FormControlValidation,
): AriaInvalidValue {
  if (
    explicitValue === true ||
    explicitValue === false ||
    explicitValue === 'true' ||
    explicitValue === 'false' ||
    explicitValue === 'grammar' ||
    explicitValue === 'spelling'
  ) {
    return explicitValue;
  }

  return validation === 'error' ? 'true' : undefined;
}

/**
 * Restore a controlled choice input after the parent rejects an update.
 *
 * A bare `:checked` binding cannot roll the native control back on its own:
 * the click already flipped the DOM, and Vue skips the patch when the prop
 * value did not change. React restores controlled inputs automatically, so
 * Vue adapters call this once the parent has had a chance to respond.
 */
export function restoreControlledChecked(
  input: HTMLInputElement,
  readExpected: () => boolean,
  syncAriaChecked: boolean,
): void {
  // Wait for the parent's model write to land before comparing. A controlled
  // parent that accepts the update moves the prop; only a value that still
  // disagrees with the *current* prop is a rejected update to roll back.
  void nextTick(() => {
    const expected = readExpected();
    if (input.checked !== expected) input.checked = expected;
    const ariaChecked = input.getAttribute('aria-checked');
    const expectedAria = String(expected);
    if (syncAriaChecked && ariaChecked !== null && ariaChecked !== expectedAria) {
      input.setAttribute('aria-checked', expectedAria);
    }
  });
}
