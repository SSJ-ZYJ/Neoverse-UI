export type FormControlValue = string | number;

export type FormControlValidation = 'none' | 'error' | 'warning' | 'success';

export interface FormControlStateProps {
  validation?: FormControlValidation;
  disabled?: boolean;
  readonly?: boolean;
}

export interface InputProps extends FormControlStateProps {
  modelValue?: FormControlValue;
  incrementLabel?: string;
  decrementLabel?: string;
}

export interface TextareaProps extends FormControlStateProps {
  modelValue?: string;
}

export interface SelectOption {
  value: FormControlValue;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends FormControlStateProps {
  modelValue?: FormControlValue;
  options: readonly SelectOption[];
  placeholder?: string;
}

export interface CheckboxProps extends FormControlStateProps {
  modelValue?: boolean;
}

export interface RadioOption {
  value: FormControlValue;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface RadioGroupProps extends FormControlStateProps {
  modelValue?: FormControlValue;
  options: readonly RadioOption[];
  name?: string;
  ariaLabel?: string;
}

export interface SwitchProps extends FormControlStateProps {
  modelValue?: boolean;
}

export interface FieldControlAttrs {
  id?: string;
  'aria-describedby'?: string;
  required?: boolean;
  disabled?: boolean;
}

export interface FieldProps {
  controlId?: string;
  descriptionId?: string;
  messageId?: string;
  label?: string;
  description?: string;
  message?: string;
  validation?: FormControlValidation;
  required?: boolean;
  disabled?: boolean;
}
