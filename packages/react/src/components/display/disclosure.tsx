import type { ComponentPropsWithRef, ReactNode } from 'react';
import { mergeClassNames } from '../../internal.js';

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
