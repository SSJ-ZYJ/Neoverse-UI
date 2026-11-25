import type { SurfacePreset } from './controls';

export type TerminalPromptTone = 'host' | 'path' | 'branch' | 'runtime' | 'time';

export type TerminalTitlebar = 'default' | 'auto' | 'macos' | 'windows' | 'linux';

export type TerminalWindowAction = 'close' | 'minimize' | 'maximize';

export type TerminalSegmentIcon =
  | 'auto'
  | 'macos'
  | 'windows'
  | 'linux'
  | 'ubuntu'
  | 'debian'
  | 'arch'
  | 'fedora'
  | 'android'
  | 'ios'
  | 'terminal'
  | 'windows-terminal'
  | 'powershell'
  | 'bash'
  | 'zsh'
  | 'iterm2'
  | 'warp'
  | 'ghostty'
  | 'vscode'
  | 'chrome'
  | 'edge'
  | 'safari'
  | 'firefox'
  | 'bun'
  | 'node'
  | 'branch'
  | 'runtime'
  | 'time'
  | 'folder';

export interface TerminalPromptSegment {
  id: string;
  label: string;
  tone?: TerminalPromptTone;
  icon?: TerminalSegmentIcon;
  iconOnly?: boolean;
}

export interface TerminalPromptProps {
  id?: string;
  label: string;
  modelValue?: string;
  /** Full suggested value. Only the suffix is displayed; acceptance belongs to the consumer. */
  suggestion?: string;
  type?: 'text' | 'password' | 'search';
  symbol?: string;
  segments?: readonly TerminalPromptSegment[];
  disabled?: boolean;
  readonly?: boolean;
  error?: boolean;
}

export interface TerminalEchoProps {
  /** Recorded command text. Rendered as plain text; never interpreted. */
  text: string;
  symbol?: string;
  segments?: readonly TerminalPromptSegment[];
  error?: boolean;
}

export interface TerminalSurfaceProps {
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
}

export interface TerminalLineProps {
  kind?: 'command' | 'text' | 'status';
  tone?: 'normal' | 'muted' | 'success' | 'error';
  preformatted?: boolean;
  text?: string;
}

export interface TerminalTranscriptProps {
  label?: string;
  followTail?: boolean;
  density?: 'compact' | 'comfortable';
  live?: 'polite' | 'off';
}
