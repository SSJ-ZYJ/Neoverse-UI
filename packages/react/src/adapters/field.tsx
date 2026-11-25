import { createElement, type HTMLAttributes, type ReactNode, useId } from 'react';
import { mergeClassNames } from '../internal.js';
import type { FormControlValidation } from './shared.js';

export interface UiFieldControlAttrs {
  id?: string;
  'aria-describedby'?: string;
  required?: boolean;
  disabled?: boolean;
}

export interface UiFieldProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  controlId?: string;
  descriptionId?: string;
  messageId?: string;
  label?: ReactNode;
  description?: ReactNode;
  message?: ReactNode;
  validation?: FormControlValidation;
  required?: boolean;
  disabled?: boolean;
  children?: ReactNode | ((controlAttrs: UiFieldControlAttrs) => ReactNode);
}

export function UiField({
  controlId,
  descriptionId,
  messageId,
  label,
  description,
  message,
  validation = 'none',
  required = false,
  disabled = false,
  className,
  children,
  ...props
}: UiFieldProps) {
  const generatedId = useId();
  const hasDescription =
    description !== undefined &&
    description !== null &&
    description !== false &&
    description !== '';
  const hasMessage =
    message !== undefined && message !== null && message !== false && message !== '';
  const resolvedDescriptionId = descriptionId ?? `${controlId ?? generatedId}-description`;
  const resolvedMessageId = messageId ?? `${controlId ?? generatedId}-message`;
  const describedBy = [
    hasDescription ? resolvedDescriptionId : undefined,
    hasMessage ? resolvedMessageId : undefined,
  ]
    .filter(Boolean)
    .join(' ');
  const controlAttrs: UiFieldControlAttrs = {
    ...(controlId ? { id: controlId } : {}),
    ...(describedBy ? { 'aria-describedby': describedBy } : {}),
    ...(required ? { required: true } : {}),
    ...(disabled ? { disabled: true } : {}),
  };
  return (
    <div
      {...props}
      className={mergeClassNames('ui-field', className)}
      data-validation={validation}
      data-disabled={disabled || undefined}
      aria-disabled={disabled || undefined}
    >
      {(label !== undefined && label !== null) || required ? (
        <div className="ui-field__label-row">
          {createElement(
            controlId ? 'label' : 'span',
            {
              className: 'ui-field__label',
              ...(controlId ? { htmlFor: controlId } : {}),
            },
            label,
          )}
          {required ? (
            <span className="ui-field__required" aria-hidden="true">
              *
            </span>
          ) : null}
        </div>
      ) : null}
      {hasDescription ? (
        <p id={resolvedDescriptionId} className="ui-field__description">
          {description}
        </p>
      ) : null}
      <div className="ui-field__control">
        {typeof children === 'function' ? children(controlAttrs) : children}
      </div>
      {hasMessage ? (
        <p id={resolvedMessageId} className="ui-field__message">
          {message}
        </p>
      ) : null}
    </div>
  );
}
