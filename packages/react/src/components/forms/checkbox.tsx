import type { ComponentPropsWithRef, ReactNode } from 'react';
import { mergeClassNames } from '../../internal.js';
import { type FormControlValidation, resolveAriaInvalid } from './form-control.js';

export interface UiCheckboxProps extends Omit<ComponentPropsWithRef<'input'>, 'type' | 'children'> {
  validation?: FormControlValidation;
  children?: ReactNode;
  onCheckedChange?: (checked: boolean) => void;
}

export function UiCheckbox({
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
}: UiCheckboxProps) {
  return (
    <label
      className={mergeClassNames('ui-choice ui-checkbox', className)}
      data-validation={validation}
      data-disabled={disabled || undefined}
      data-readonly={readOnly || undefined}
    >
      <input
        {...props}
        className="ui-choice__native"
        type="checkbox"
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
      <span className="ui-choice__control" aria-hidden="true">
        <svg className="ui-choice__indicator" viewBox="0 0 24 24" aria-hidden="true">
          <path d="m5 12 4 4L19 6" />
        </svg>
      </span>
      <span className="ui-choice__content">{children}</span>
    </label>
  );
}
