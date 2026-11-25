import { createElement, type HTMLAttributes, type ReactNode } from 'react';
import { mergeClassNames } from '../../internal.js';

export type NoticeVariant = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export interface UiNoticeProps extends HTMLAttributes<HTMLElement> {
  as?: string;
  variant?: NoticeVariant;
  action?: ReactNode;
}

/** Status callout surface shared by the Vue and React adapters. */
export function UiNotice({
  as = 'div',
  variant = 'neutral',
  action,
  className,
  children,
  ...rest
}: UiNoticeProps) {
  return createElement(
    as,
    {
      ...rest,
      className: mergeClassNames('ui-notice', `ui-notice--${variant}`, className),
    },
    createElement('div', { className: 'ui-notice__content' }, children),
    action !== undefined && action !== null
      ? createElement('div', { className: 'ui-notice__action' }, action)
      : null,
  );
}
