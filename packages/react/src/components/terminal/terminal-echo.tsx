import type { HTMLAttributes, ReactNode } from 'react';
import { TerminalPromptContext, type TerminalPromptSegment } from './terminal-prompt-context.js';

export interface UiTerminalEchoProps extends HTMLAttributes<HTMLElement> {
  /** Recorded command text. Rendered as plain text; never interpreted. */
  text: string;
  symbol?: string;
  segments?: readonly TerminalPromptSegment[];
  error?: boolean;
  renderSegment?: (segment: TerminalPromptSegment) => ReactNode;
}

export function UiTerminalEcho({
  text,
  symbol = '❯',
  segments = [],
  error = false,
  renderSegment,
  className = '',
  children,
  ...rest
}: UiTerminalEchoProps) {
  return (
    <div
      {...rest}
      className={`ui-terminal-echo ${className}`}
      data-error={error ? 'true' : 'false'}
      data-readonly="true"
    >
      <TerminalPromptContext segments={segments} renderSegment={renderSegment} />
      <div className="ui-terminal-echo__entry">
        <span className="ui-terminal-prompt__symbol" aria-hidden="true">
          {symbol}
        </span>
        <span className="ui-terminal-echo__text">{text}</span>
      </div>
    </div>
  );
}
