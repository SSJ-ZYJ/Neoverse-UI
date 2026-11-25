import type { HTMLAttributes, ReactNode } from 'react';
import { mergeClassNames } from '../../internal.js';
import {
  type FormControlValidation,
  type FormControlValue,
  resolveAriaInvalid,
} from './form-control.js';

export interface UiRadioGroupOption {
  value: FormControlValue;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}

export interface UiRadioGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  options: readonly UiRadioGroupOption[];
  value?: FormControlValue;
  defaultValue?: FormControlValue;
  name?: string;
  disabled?: boolean;
  readOnly?: boolean;
  validation?: FormControlValidation;
  onValueChange?: (value: FormControlValue) => void;
}

export function UiRadioGroup({
  options,
  value,
  defaultValue,
  name,
  disabled = false,
  readOnly = false,
  validation = 'none',
  onValueChange,
  className,
  'aria-invalid': ariaInvalid,
  ...props
}: UiRadioGroupProps) {
  const resolvedAriaInvalid = resolveAriaInvalid(ariaInvalid, validation);

  return (
    <div
      {...props}
      className={mergeClassNames('ui-radio-group', className)}
      role="radiogroup"
      aria-disabled={disabled || readOnly || undefined}
      aria-invalid={resolvedAriaInvalid}
      data-validation={validation}
      data-disabled={disabled || undefined}
      data-readonly={readOnly || undefined}
    >
      {options.map((option) => {
        const selected = value !== undefined && String(option.value) === String(value);
        const defaultSelected =
          value === undefined &&
          defaultValue !== undefined &&
          String(option.value) === String(defaultValue);
        const optionDisabled = disabled || option.disabled === true;

        return (
          <label
            key={String(option.value)}
            className="ui-choice ui-radio"
            data-disabled={optionDisabled || undefined}
            data-readonly={readOnly || undefined}
          >
            <input
              className="ui-choice__native"
              type="radio"
              name={name}
              value={option.value}
              checked={value === undefined ? undefined : selected}
              defaultChecked={defaultSelected}
              disabled={optionDisabled}
              aria-disabled={optionDisabled || readOnly || undefined}
              aria-invalid={resolvedAriaInvalid}
              onClick={(event) => {
                if (readOnly) event.preventDefault();
              }}
              onChange={(event) => {
                if (readOnly || !event.currentTarget.checked) return;
                onValueChange?.(option.value);
              }}
            />
            <span className="ui-choice__control" aria-hidden="true">
              <span className="ui-choice__indicator" />
            </span>
            <span className="ui-choice__content">
              <span className="ui-choice__label">{option.label}</span>
              {option.description !== undefined && option.description !== null ? (
                <span className="ui-choice__description">{option.description}</span>
              ) : null}
            </span>
          </label>
        );
      })}
    </div>
  );
}
