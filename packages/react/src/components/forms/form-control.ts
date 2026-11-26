export type FormControlValidation = 'none' | 'error' | 'warning' | 'success';
export type FormControlValue = string | number;

/** The scope belongs to the shell when it owns paint beside the native control. */
export interface FormControlMaterialScope {
  'data-neoverse-material'?: string;
}

/**
 * Resolve `aria-invalid` from an explicit value or the validation state.
 *
 * Like the Vue adapter, this only treats an `error` validation as invalid.
 */
export function resolveAriaInvalid(
  explicit: unknown,
  validation: FormControlValidation | undefined,
): boolean | 'true' | 'false' | 'grammar' | 'spelling' | undefined {
  if (
    explicit === true ||
    explicit === false ||
    explicit === 'true' ||
    explicit === 'false' ||
    explicit === 'grammar' ||
    explicit === 'spelling'
  ) {
    return explicit;
  }
  return validation === 'error' ? true : undefined;
}
