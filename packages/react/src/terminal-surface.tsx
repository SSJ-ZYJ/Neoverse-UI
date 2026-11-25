import { createElement, type HTMLAttributes, type ReactNode } from 'react';
import { type SurfacePreset, UiSurface } from './index.js';
import {
  type ResolvedTerminalSegmentIcon,
  resolveTerminalTitlebar,
  type TerminalTitlebar,
  type TerminalWindowAction,
  useTerminalNavigatorHints,
} from './terminal-environment.js';
import { terminalSegmentGlyphs } from './terminal-icons.js';

export function TerminalSegmentIconGlyph({ name }: { name: ResolvedTerminalSegmentIcon }) {
  const glyph = terminalSegmentGlyphs[name];
  return (
    <svg
      viewBox="0 0 16 16"
      fill={glyph.mode === 'fill' ? 'currentColor' : 'none'}
      stroke={glyph.mode === 'stroke' ? 'currentColor' : undefined}
      strokeWidth={glyph.mode === 'stroke' ? 1.5 : undefined}
      strokeLinecap={glyph.mode === 'stroke' ? 'round' : undefined}
      strokeLinejoin={glyph.mode === 'stroke' ? 'round' : undefined}
      aria-hidden="true"
      focusable="false"
    >
      {glyph.nodes.map((node, index) =>
        createElement(node.tag, { key: `${name}-${index}`, ...node.attrs }),
      )}
    </svg>
  );
}

function TerminalWindowControls({
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

export interface UiTerminalSurfaceProps extends HTMLAttributes<HTMLElement> {
  title: string;
  ariaLabel?: string;
  density?: 'compact' | 'expanded';
  surface?: SurfacePreset;
  titlebar?: TerminalTitlebar;
  maximized?: boolean;
  closeLabel?: string;
  minimizeLabel?: string;
  maximizeLabel?: string;
  restoreLabel?: string;
  header?: ReactNode;
  status?: ReactNode;
  actions?: ReactNode;
  onWindowAction?: (action: TerminalWindowAction) => void;
}

export function UiTerminalSurface({
  title,
  ariaLabel,
  density = 'compact',
  surface = 'glass-elevated',
  titlebar = 'default',
  maximized = false,
  closeLabel = 'Close window',
  minimizeLabel = 'Minimize window',
  maximizeLabel = 'Maximize window',
  restoreLabel = 'Restore window',
  header,
  status,
  actions,
  onWindowAction,
  className = '',
  children,
  ...rest
}: UiTerminalSurfaceProps) {
  const navigatorHints = useTerminalNavigatorHints();
  const activeTitlebar = resolveTerminalTitlebar(
    titlebar,
    titlebar === 'auto' ? navigatorHints : undefined,
  );
  const actionsNode =
    actions != null ? (
      <div className="ui-terminal-surface__actions" role="toolbar" aria-label={`${title} actions`}>
        {actions}
      </div>
    ) : null;
  const statusNode =
    status != null ? <div className="ui-terminal-surface__status">{status}</div> : null;

  const defaultChrome =
    activeTitlebar === 'default' ? (
      <>
        <span className="ui-terminal-surface__title">{title}</span>
        {statusNode}
        {actionsNode}
      </>
    ) : activeTitlebar === 'macos' ? (
      <>
        <TerminalWindowControls
          variant="macos"
          maximized={maximized}
          closeLabel={closeLabel}
          minimizeLabel={minimizeLabel}
          maximizeLabel={maximizeLabel}
          restoreLabel={restoreLabel}
          groupLabel={`${title} window controls`}
          onAction={onWindowAction}
        />
        <div className="ui-terminal-surface__title-group">
          <span className="ui-terminal-surface__title">{title}</span>
          {statusNode}
        </div>
        {actionsNode}
      </>
    ) : activeTitlebar === 'windows' ? (
      <>
        <div className="ui-terminal-surface__title-group">
          <span className="ui-terminal-surface__app-icon" aria-hidden="true">
            <TerminalSegmentIconGlyph name="windows-terminal" />
          </span>
          <span className="ui-terminal-surface__title">{title}</span>
          {statusNode}
        </div>
        {actionsNode}
        <TerminalWindowControls
          variant="windows"
          maximized={maximized}
          closeLabel={closeLabel}
          minimizeLabel={minimizeLabel}
          maximizeLabel={maximizeLabel}
          restoreLabel={restoreLabel}
          groupLabel={`${title} window controls`}
          onAction={onWindowAction}
        />
      </>
    ) : (
      <>
        {actionsNode}
        <div className="ui-terminal-surface__title-group">
          <span className="ui-terminal-surface__title">{title}</span>
          {statusNode}
        </div>
        <TerminalWindowControls
          variant="linux"
          maximized={maximized}
          closeLabel={closeLabel}
          minimizeLabel={minimizeLabel}
          maximizeLabel={maximizeLabel}
          restoreLabel={restoreLabel}
          groupLabel={`${title} window controls`}
          onAction={onWindowAction}
        />
      </>
    );

  return (
    <UiSurface
      {...rest}
      as="section"
      surface={surface}
      aria-label={ariaLabel ?? rest['aria-label'] ?? title}
      data-density={density}
      data-titlebar={activeTitlebar}
      data-maximized={maximized ? 'true' : undefined}
      className={`ui-terminal-surface ${className}`}
    >
      <header className="ui-terminal-surface__header">{header ?? defaultChrome}</header>
      <div className="ui-terminal-surface__body">{children}</div>
    </UiSurface>
  );
}
