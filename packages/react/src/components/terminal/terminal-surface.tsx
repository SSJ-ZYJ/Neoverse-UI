import type { SurfacePreset } from '@neoverse-ui/tokens';
import type { HTMLAttributes, ReactNode } from 'react';
import { UiSurface } from '../surfaces/surface.js';
import {
  resolveTerminalTitlebar,
  type TerminalTitlebar,
  type TerminalWindowAction,
  useTerminalNavigatorHints,
} from './terminal-environment.js';
import { TerminalSegmentIconGlyph } from './terminal-segment-icon-glyph.js';
import { TerminalWindowControls } from './terminal-window-controls.js';

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
  surface = 'auto',
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
