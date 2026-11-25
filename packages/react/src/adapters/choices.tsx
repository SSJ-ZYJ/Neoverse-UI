import type { ComponentPropsWithRef, HTMLAttributes, ReactNode } from 'react';
import { mergeClassNames, resolveAriaInvalid } from '../internal.js';
import type { FormControlValidation, FormControlValue } from './shared.js';

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
