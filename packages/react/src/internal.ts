export const mergeClassNames = (...values: Array<string | false | null | undefined>): string =>
  values.filter(Boolean).join(' ');

type FormControlValidation = 'none' | 'error' | 'warning' | 'success';

/**
 * Resolve `aria-invalid` from an explicit value or the validation state.
 *
 * Mirrors `packages/vue/src/form-control.ts` so both adapters derive the
 * attribute from one rule: only an `error` validation implies invalid.
 * The validation type is restated locally to keep this module free of
 * imports from the package entry point (which imports this file).
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
