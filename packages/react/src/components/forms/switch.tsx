import type { ComponentPropsWithRef, ReactNode } from 'react';
import { mergeClassNames } from '../../internal.js';
import { type FormControlValidation, resolveAriaInvalid } from './form-control.js';

export interface UiSwitchProps extends Omit<ComponentPropsWithRef<'input'>, 'type' | 'children'> {
  validation?: FormControlValidation;
  children?: ReactNode;
  onCheckedChange?: (checked: boolean) => void;
}

export function UiSwitch({
  validation = 'none',
  readOnly = false,
  disabled = false,
  className,
  children,
  onClick,
  onChange,
  onCheckedChange,
  'aria-invalid': ariaInvalid,
  ...props
}: UiSwitchProps) {
  return (
    <label
      className={mergeClassNames('ui-choice ui-switch', className)}
      data-validation={validation}
      data-disabled={disabled || undefined}
      data-readonly={readOnly || undefined}
    >
      <input
        {...props}
        className="ui-choice__native ui-switch__native"
        type="checkbox"
        // biome-ignore lint/a11y/useAriaPropsForRole: WAI-ARIA Switch pattern uses native checkbox checked state instead of aria-checked.
        role="switch"
        disabled={disabled}
        aria-disabled={disabled || readOnly || undefined}
        aria-invalid={resolveAriaInvalid(ariaInvalid, validation)}
        onClick={(event) => {
          if (readOnly) event.preventDefault();
          onClick?.(event);
        }}
        onChange={(event) => {
          if (readOnly) return;
          onChange?.(event);
          onCheckedChange?.(event.currentTarget.checked);
        }}
      />
      <span className="ui-choice__control ui-switch__control" aria-hidden="true">
        <span className="ui-switch__thumb" />
      </span>
      <span className="ui-choice__content">{children}</span>
    </label>
  );
}
