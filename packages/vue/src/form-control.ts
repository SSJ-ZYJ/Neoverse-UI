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
