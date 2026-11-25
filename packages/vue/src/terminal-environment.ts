import type { TerminalSegmentIcon, TerminalTitlebar } from './types';

/** Concrete titlebar preset after resolving `auto` against the environment. */
export type ResolvedTerminalTitlebar = Exclude<TerminalTitlebar, 'auto'>;

/** Concrete icon identifier after resolving `auto` against the segment and environment. */
export type ResolvedTerminalSegmentIcon = Exclude<TerminalSegmentIcon, 'auto'>;

/** Navigator and host fields consulted when detecting the terminal environment. */
export interface TerminalNavigatorHints {
  userAgentData?:
    | {
        platform?: string | undefined;
        mobile?: boolean | undefined;
        brands?:
          | ReadonlyArray<{ brand?: string | undefined; version?: string | undefined }>
          | undefined;
      }
    | undefined;
  platform?: string | undefined;
  userAgent?: string | undefined;
  maxTouchPoints?: number | undefined;
  hasVscodeHost?: boolean | undefined;
}

/** Detected operating system, browser and host application summary. */
export interface TerminalEnvironmentInfo {
  os: ResolvedTerminalSegmentIcon | 'unknown';
  browser: 'chrome' | 'edge' | 'firefox' | 'safari' | undefined;
  app: ResolvedTerminalSegmentIcon | undefined;
  titlebar: ResolvedTerminalTitlebar;
  icon: ResolvedTerminalSegmentIcon;
}

export interface TerminalSvgNode {
  tag: 'path' | 'rect' | 'circle';
  attrs: Record<string, string | number>;
}

export interface TerminalIconGlyph {
  mode: 'stroke' | 'fill';
  nodes: readonly TerminalSvgNode[];
}

/** Canonical list of concrete terminal segment icons. */
export const terminalSegmentIconNames: readonly ResolvedTerminalSegmentIcon[] = [
  'macos',
  'windows',
  'linux',
  'ubuntu',
  'debian',
  'arch',
  'fedora',
  'android',
  'ios',
  'terminal',
  'windows-terminal',
  'powershell',
  'bash',
  'zsh',
  'iterm2',
  'warp',
  'ghostty',
  'vscode',
  'chrome',
  'edge',
  'safari',
  'firefox',
  'bun',
  'node',
  'branch',
  'runtime',
  'time',
  'folder',
];

const applePlatformPattern = /^(?:Mac|macOS|Darwin|AppleTV|AppleWatch|AppleVision)/i;
const appleUserAgentPattern = /Macintosh|Mac OS X|AppleTV|AppleWatch|AppleVision/i;
const iosPlatformPattern = /^(?:iPhone|iPad|iPod|iOS)/i;
const iosUserAgentPattern = /(?:iPhone|iPad|iPod|\biOS\b)/i;

/** Read browser navigator hints safely without assuming a DOM environment. */
export function readTerminalNavigatorHints(): TerminalNavigatorHints | undefined {
  if (typeof navigator === 'undefined') return undefined;
  const extendedNavigator = navigator as Navigator & {
    userAgentData?: TerminalNavigatorHints['userAgentData'];
  };
  const globalRecord = globalThis as Record<string, unknown>;
  return {
    userAgentData: extendedNavigator.userAgentData,
    platform: navigator.platform,
    userAgent: navigator.userAgent,
    maxTouchPoints: navigator.maxTouchPoints,
    hasVscodeHost: typeof globalRecord.acquireVsCodeApi === 'function',
  };
}

function detectOperatingSystem(
  hints: TerminalNavigatorHints,
): ResolvedTerminalSegmentIcon | 'unknown' {
  const platform = hints.userAgentData?.platform || hints.platform || '';
  const userAgent = hints.userAgent || '';

  if (iosPlatformPattern.test(platform) || iosUserAgentPattern.test(userAgent)) {
    return 'ios';
  }
  if (
    /^Mac/i.test(platform) &&
    typeof hints.maxTouchPoints === 'number' &&
    hints.maxTouchPoints > 1 &&
    !appleUserAgentPattern.test(userAgent)
  ) {
    return 'ios';
  }
  if (applePlatformPattern.test(platform) || appleUserAgentPattern.test(userAgent)) {
    return 'macos';
  }
  if (/^Win/i.test(platform) || /Windows/i.test(userAgent)) {
    return 'windows';
  }
  if (/Android/i.test(platform) || /Android/i.test(userAgent)) {
    return 'android';
  }
  if (/Ubuntu/i.test(userAgent)) return 'ubuntu';
  if (/Debian/i.test(userAgent)) return 'debian';
  if (/Arch/i.test(userAgent)) return 'arch';
  if (/Fedora/i.test(userAgent)) return 'fedora';
  if (
    /^(?:Linux|X11|FreeBSD|OpenBSD|NetBSD)/i.test(platform) ||
    /Linux|X11|CrOS/i.test(userAgent)
  ) {
    return 'linux';
  }
  return 'unknown';
}

function detectBrowser(
  hints: TerminalNavigatorHints,
): 'chrome' | 'edge' | 'firefox' | 'safari' | undefined {
  const userAgent = hints.userAgent || '';
  const brands = hints.userAgentData?.brands?.map((entry) => entry.brand ?? '') ?? [];

  if (brands.some((brand) => /Microsoft Edge/i.test(brand)) || /Edg(?:A|iOS)?\//.test(userAgent)) {
    return 'edge';
  }
  if (/Firefox\/|FxiOS\//.test(userAgent)) {
    return 'firefox';
  }
  if (
    brands.some((brand) => /Google Chrome|Chromium/i.test(brand)) ||
    (/Chrome\/|CriOS\//.test(userAgent) && !/Edg|OPR|SamsungBrowser/.test(userAgent))
  ) {
    return 'chrome';
  }
  if (/Safari\//.test(userAgent) && !/Chrome|Chromium|Edg|CriOS|FxiOS/.test(userAgent)) {
    return 'safari';
  }
  return undefined;
}

const appUserAgentMatchers: ReadonlyArray<readonly [RegExp, ResolvedTerminalSegmentIcon]> = [
  [/\b(?:VSCode|Code\/\d)/i, 'vscode'],
  [/WindowsTerminal/i, 'windows-terminal'],
  [/Ghostty/i, 'ghostty'],
  [/WarpTerminal|\bWarp\//i, 'warp'],
  [/iTerm2/i, 'iterm2'],
  [/PowerShell|\bpwsh\b/i, 'powershell'],
  [/\bzsh\b/i, 'zsh'],
  [/\bbash\b/i, 'bash'],
  [/\bBun\//i, 'bun'],
  [/\bNode\.js\b/i, 'node'],
];

function detectHostApplication(
  hints: TerminalNavigatorHints,
): ResolvedTerminalSegmentIcon | undefined {
  if (hints.hasVscodeHost) return 'vscode';
  const userAgent = hints.userAgent || '';
  for (const [pattern, icon] of appUserAgentMatchers) {
    if (pattern.test(userAgent)) return icon;
  }
  return undefined;
}

/** Detect operating system, browser, host application and matching terminal chrome/icon. */
export function detectTerminalEnvironment(hints?: TerminalNavigatorHints): TerminalEnvironmentInfo {
  if (!hints) {
    return {
      os: 'unknown',
      browser: undefined,
      app: undefined,
      titlebar: 'default',
      icon: 'terminal',
    };
  }

  const os = detectOperatingSystem(hints);
  const browser = detectBrowser(hints);
  const app = detectHostApplication(hints);

  let titlebar: ResolvedTerminalTitlebar = 'default';
  if (os === 'macos' || os === 'ios') titlebar = 'macos';
  else if (os === 'windows') titlebar = 'windows';
  else if (
    os === 'linux' ||
    os === 'ubuntu' ||
    os === 'debian' ||
    os === 'arch' ||
    os === 'fedora'
  ) {
    titlebar = 'linux';
  }

  const icon: ResolvedTerminalSegmentIcon =
    app ?? (os !== 'unknown' ? os : undefined) ?? browser ?? 'terminal';

  return { os, browser, app, titlebar, icon };
}

/** Resolve a `TerminalTitlebar` preset into a concrete layout variant. */
export function resolveTerminalTitlebar(
  titlebar: TerminalTitlebar = 'default',
  hints?: TerminalNavigatorHints,
): ResolvedTerminalTitlebar {
  if (titlebar !== 'auto') return titlebar;
  return detectTerminalEnvironment(hints).titlebar;
}

const nameMatchers: ReadonlyArray<readonly [RegExp, ResolvedTerminalSegmentIcon]> = [
  [/windows\s*terminal|\bwt(?:\.exe)?\b/i, 'windows-terminal'],
  [/power\s*shell|\bpwsh\b/i, 'powershell'],
  [/visual\s*studio\s*code|\bvs\s*code\b|\bvscode\b/i, 'vscode'],
  [/iterm2?/i, 'iterm2'],
  [/ghostty/i, 'ghostty'],
  [/\bwarp\b/i, 'warp'],
  [/\bzsh\b|oh-my-zsh/i, 'zsh'],
  [/\bbash\b|git\s*bash/i, 'bash'],
  [/\bbun\b/i, 'bun'],
  [/\bnode(?:\.?js)?\b/i, 'node'],
  [/\bmacos\b|mac\s*os|\bdarwin\b|\bapple\b|\bmacbook\b|\bimac\b/i, 'macos'],
  [/\bios\b|\biphone\b|\bipad\b|\bipados\b/i, 'ios'],
  [/\bwindows\b|\bwin32\b|\bwin64\b/i, 'windows'],
  [/\bubuntu\b/i, 'ubuntu'],
  [/\bdebian\b/i, 'debian'],
  [/\barch(?:\s*linux)?\b/i, 'arch'],
  [/\bfedora\b/i, 'fedora'],
  [/\bandroid\b/i, 'android'],
  [/\blinux\b|\bgnome\b|\bkde\b/i, 'linux'],
  [/microsoft\s*edge|\bedge\b|\bmsedge\b/i, 'edge'],
  [/google\s*chrome|\bchrome\b|\bchromium\b/i, 'chrome'],
  [/\bsafari\b/i, 'safari'],
  [/\bfirefox\b/i, 'firefox'],
  [/\bgit\b|\bbranch\b/i, 'branch'],
  [/\bclock\b|\btime\b/i, 'time'],
  [/\bfolder\b|\bdirectory\b/i, 'folder'],
  [/\bterminal\b|\bshell\b/i, 'terminal'],
];

/** Match an explicit system, shell, browser or runtime label to a built-in icon. */
export function matchTerminalSegmentIcon(
  query: string | undefined,
): ResolvedTerminalSegmentIcon | undefined {
  if (!query) return undefined;
  const trimmed = query.trim();
  if (!trimmed) return undefined;
  for (const [pattern, icon] of nameMatchers) {
    if (pattern.test(trimmed)) return icon;
  }
  return undefined;
}

/** Resolve the built-in icon for a prompt segment, recognizing `auto` from segment context or navigator. */
export function resolveTerminalSegmentIcon(
  segment: { icon?: TerminalSegmentIcon; tone?: string; label?: string },
  hints?: TerminalNavigatorHints,
): ResolvedTerminalSegmentIcon {
  if (segment.icon && segment.icon !== 'auto') return segment.icon;
  const fromLabel = matchTerminalSegmentIcon(segment.label);
  if (fromLabel) return fromLabel;
  if (segment.tone === 'branch') return 'branch';
  if (segment.tone === 'time') return 'time';
  if (segment.tone === 'path') return 'folder';
  if (segment.tone === 'runtime') return 'runtime';
  return detectTerminalEnvironment(hints).icon;
}
