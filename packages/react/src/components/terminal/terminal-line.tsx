import type { HTMLAttributes } from 'react';

export interface UiTerminalLineProps extends HTMLAttributes<HTMLDivElement> {
  kind?: 'command' | 'text' | 'status';
  tone?: 'normal' | 'muted' | 'success' | 'error';
  preformatted?: boolean;
  text?: string;
}

export function UiTerminalLine({
  kind = 'text',
  tone = 'normal',
  preformatted = false,
  text,
  className = '',
  children,
  ...rest
}: UiTerminalLineProps) {
  return (
    <div
      {...rest}
      className={`ui-terminal-line ${className}`}
      data-kind={kind}
      data-tone={tone}
      data-preformatted={preformatted ? 'true' : 'false'}
    >
      {children ?? text}
    </div>
  );
}
