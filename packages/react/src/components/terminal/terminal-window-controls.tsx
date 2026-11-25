import type { TerminalWindowAction } from './terminal-environment.js';

export function TerminalWindowControls({
  variant,
  maximized,
  closeLabel,
  minimizeLabel,
  maximizeLabel,
  restoreLabel,
  groupLabel,
  onAction,
}: {
  variant: 'macos' | 'windows' | 'linux';
  maximized: boolean;
  closeLabel: string;
  minimizeLabel: string;
  maximizeLabel: string;
  restoreLabel: string;
  groupLabel: string;
  onAction?: ((action: TerminalWindowAction) => void) | undefined;
}) {
  const order: readonly TerminalWindowAction[] =
    variant === 'macos' ? ['close', 'minimize', 'maximize'] : ['minimize', 'maximize', 'close'];
  const labels: Record<TerminalWindowAction, string> = {
    close: closeLabel,
    minimize: minimizeLabel,
    maximize: maximized ? restoreLabel : maximizeLabel,
  };
  return (
    <div
      className="ui-terminal-surface__window-controls"
      data-window-controls={variant}
      role="toolbar"
      aria-label={groupLabel}
    >
      {order.map((action) => (
        <button
          key={action}
          type="button"
          className={`ui-terminal-surface__window-button ui-terminal-surface__window-button--${action}`}
          data-window-action={action}
          aria-label={labels[action]}
          aria-pressed={action === 'maximize' ? maximized : undefined}
          title={labels[action]}
          onClick={() => onAction?.(action)}
        >
          {variant === 'macos' ? (
            <svg
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              focusable="false"
            >
              {action === 'close' ? <path d="m3.5 3.5 5 5m0-5-5 5" /> : null}
              {action === 'minimize' ? <path d="M2.8 6h6.4" /> : null}
              {action === 'maximize' ? <path d="M6 2.8v6.4M2.8 6h6.4" /> : null}
            </svg>
          ) : (
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.35"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              focusable="false"
            >
              {action === 'close' ? <path d="m4.5 4.5 7 7m0-7-7 7" /> : null}
              {action === 'minimize' ? <path d="M4 8.5h8" /> : null}
              {action === 'maximize' && maximized ? (
                <path d="M6 4.5h5.5V10M4.5 6.5H10V12H4.5V6.5Z" />
              ) : null}
              {action === 'maximize' && !maximized ? (
                <rect x="4.5" y="4.5" width="7" height="7" rx="0.75" />
              ) : null}
            </svg>
          )}
        </button>
      ))}
    </div>
  );
}
