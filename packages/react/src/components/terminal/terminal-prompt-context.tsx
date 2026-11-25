import type { ReactNode } from 'react';
import {
  resolveTerminalSegmentIcon,
  type TerminalSegmentIcon,
  useTerminalNavigatorHints,
} from './terminal-environment.js';
import { TerminalSegmentIconGlyph } from './terminal-segment-icon-glyph.js';

export type TerminalPromptTone = 'host' | 'path' | 'branch' | 'runtime' | 'time';

export interface TerminalPromptSegment {
  id: string;
  label: string;
  tone?: TerminalPromptTone;
  icon?: TerminalSegmentIcon;
  iconOnly?: boolean;
}

export function TerminalPromptContext({
  segments,
  context,
  renderSegment,
}: {
  segments: readonly TerminalPromptSegment[];
  context?: ReactNode;
  renderSegment: ((segment: TerminalPromptSegment) => ReactNode) | undefined;
}) {
  const navigatorHints = useTerminalNavigatorHints();
  if (segments.length === 0 && context == null) return null;
  return (
    <div className="ui-terminal-prompt__context">
      {context ?? (
        <>
          <span className="ui-terminal-prompt__lead" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          {segments.map((segment) => {
            const resolvedIcon =
              segment.icon === undefined
                ? undefined
                : resolveTerminalSegmentIcon(segment, navigatorHints);
            return (
              <span
                key={segment.id}
                className="ui-terminal-prompt__segment"
                data-tone={segment.tone ?? 'runtime'}
                data-icon={resolvedIcon}
                title={segment.label}
              >
                {renderSegment ? (
                  renderSegment(segment)
                ) : (
                  <>
                    {resolvedIcon ? <TerminalSegmentIconGlyph name={resolvedIcon} /> : null}
                    <span className={segment.iconOnly ? 'sr-only' : undefined}>
                      {segment.label}
                    </span>
                  </>
                )}
              </span>
            );
          })}
        </>
      )}
    </div>
  );
}
