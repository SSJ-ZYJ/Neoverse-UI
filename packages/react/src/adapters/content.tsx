import {
  type ComponentPropsWithRef,
  createElement,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { mergeClassNames } from '../internal.js';
import type { NoticeVariant } from './shared.js';

export interface UiTableProps extends Omit<ComponentPropsWithRef<'table'>, 'children'> {
  caption?: ReactNode;
  striped?: boolean;
  hoverable?: boolean;
  children?: ReactNode;
}

/** Native table semantics with a shared inset data surface and local horizontal overflow. */
export function UiTable({
  caption,
  striped = true,
  hoverable = true,
  className,
  children,
  ...rest
}: UiTableProps) {
  return (
    <div className="ui-table-region" data-ui-table-region="">
      <table
        {...rest}
        className={mergeClassNames(
          'ui-table',
          striped && 'ui-table--striped',
          hoverable && 'ui-table--hoverable',
          className,
        )}
      >
        {caption !== undefined && caption !== null ? (
          <caption className="ui-table__caption">{caption}</caption>
        ) : null}
        {children}
      </table>
    </div>
  );
}

export interface UiDisclosureProps extends Omit<ComponentPropsWithRef<'details'>, 'children'> {
  summary: ReactNode;
  children?: ReactNode;
}

/** Native details/summary semantics with the shared inset progressive-disclosure material. */
export function UiDisclosure({ summary, className, children, ...rest }: UiDisclosureProps) {
  return (
    <details {...rest} className={mergeClassNames('ui-disclosure', className)}>
      <summary className="ui-disclosure__summary">{summary}</summary>
      <div className="ui-disclosure__content">{children}</div>
    </details>
  );
}

export interface UiNoticeProps extends HTMLAttributes<HTMLElement> {
  as?: 'div' | 'aside' | 'section';
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
