import type { ComponentPropsWithRef, ReactNode } from 'react';
import { mergeClassNames } from '../../internal.js';

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
