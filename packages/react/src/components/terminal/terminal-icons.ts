import type {
  ResolvedTerminalSegmentIcon,
  TerminalIconGlyph,
  TerminalSvgNode,
} from './terminal-environment.js';

const terminalFrame: TerminalSvgNode = {
  tag: 'rect',
  attrs: { x: 1.5, y: 2.5, width: 13, height: 11, rx: 1.5 },
};

/** Independently authored 16x16 monochrome SVG descriptors for every terminal segment icon. */
export const terminalSegmentGlyphs: Record<ResolvedTerminalSegmentIcon, TerminalIconGlyph> = {
  macos: {
    mode: 'fill',
    nodes: [
      {
        tag: 'path',
        attrs: {
          d: 'M10.4 1.3c-.7.1-1.5.6-1.9 1.3-.3.6-.3 1.2.1 1.4.8.1 1.6-.4 2-1.1.3-.6.2-1.3-.2-1.6Z',
        },
      },
      {
        tag: 'path',
        attrs: {
          d: 'M12.3 8.4c0-1.5 1.1-2.3 1.2-2.4-.7-1-1.8-1.2-2.2-1.2-.9-.1-1.8.6-2.3.6-.5 0-1.2-.6-2-.6-1 0-2 .6-2.5 1.5-1.1 1.9-.3 4.8.8 6.4.5.8 1.2 1.6 2 1.6.8 0 1.1-.5 2.1-.5 1 0 1.2.5 2.1.5.9 0 1.4-.8 1.9-1.6.6-.9.9-1.8.9-1.9-.1 0-2-.8-2-2.4Z',
        },
      },
    ],
  },
  windows: {
    mode: 'fill',
    nodes: [
      { tag: 'rect', attrs: { x: 2, y: 2, width: 5.4, height: 5.4, rx: 0.8 } },
      { tag: 'rect', attrs: { x: 8.6, y: 2, width: 5.4, height: 5.4, rx: 0.8 } },
      { tag: 'rect', attrs: { x: 2, y: 8.6, width: 5.4, height: 5.4, rx: 0.8 } },
      { tag: 'rect', attrs: { x: 8.6, y: 8.6, width: 5.4, height: 5.4, rx: 0.8 } },
    ],
  },
  linux: {
    mode: 'stroke',
    nodes: [
      {
        tag: 'path',
        attrs: {
          d: 'M5.2 6.8C5.2 3.8 6.4 2 8 2s2.8 1.8 2.8 4.8c0 1.4 1.2 2.9 1.2 4.4 0 1-.8 1.8-2 1.8H6c-1.2 0-2-.8-2-1.8 0-1.5 1.2-3 1.2-4.4Z',
        },
      },
      { tag: 'path', attrs: { d: 'M6.8 5.2h.01M9.2 5.2h.01M6.8 7l1.2.8L9.2 7M5 14h2M9 14h2' } },
    ],
  },
  ubuntu: {
    mode: 'stroke',
    nodes: [
      { tag: 'circle', attrs: { cx: 8, cy: 8, r: 4.5 } },
      { tag: 'circle', attrs: { cx: 12.6, cy: 5.3, r: 1.2 } },
      { tag: 'circle', attrs: { cx: 12.6, cy: 10.7, r: 1.2 } },
      { tag: 'circle', attrs: { cx: 3.1, cy: 8, r: 1.2 } },
    ],
  },
  debian: {
    mode: 'stroke',
    nodes: [
      {
        tag: 'path',
        attrs: {
          d: 'M8.5 14c-3.3 0-5.5-2.5-5.5-5.8C3 4.6 5.5 2 9 2c2.8 0 4.5 1.8 4.5 4.2 0 2-1.5 3.6-3.5 3.6-1.6 0-2.6-1.1-2.6-2.4 0-1.1.8-1.9 1.9-1.9.8 0 1.4.6 1.4 1.3',
        },
      },
    ],
  },
  arch: {
    mode: 'stroke',
    nodes: [
      {
        tag: 'path',
        attrs: { d: 'M8 1.8 13.5 14l-2.6-1.4-1.4.8L8 10.6l-1.5 2.8-1.4-.8L2.5 14 8 1.8Z' },
      },
    ],
  },
  fedora: {
    mode: 'stroke',
    nodes: [
      { tag: 'path', attrs: { d: 'M8 2h3.8A2.2 2.2 0 0 1 14 4.2V8a6 6 0 1 1-6-6Z' } },
      {
        tag: 'path',
        attrs: { d: 'M9.8 5.5a1.5 1.5 0 0 0-3 0v5.3a1.3 1.3 0 0 1-1.3 1.3H5M6.3 8.5h3.2' },
      },
    ],
  },
  android: {
    mode: 'stroke',
    nodes: [
      { tag: 'path', attrs: { d: 'M3.2 10.5a4.8 4.8 0 0 1 9.6 0v2.3H3.2v-2.3Z' } },
      { tag: 'path', attrs: { d: 'M5.6 6 4.4 3.5M10.4 6l1.2-2.5M6.2 9h.01M9.8 9h.01' } },
    ],
  },
  ios: {
    mode: 'stroke',
    nodes: [
      { tag: 'rect', attrs: { x: 4, y: 1.8, width: 8, height: 12.4, rx: 1.8 } },
      { tag: 'path', attrs: { d: 'M6.8 4h2.4M7 12.2h2' } },
    ],
  },
  terminal: {
    mode: 'stroke',
    nodes: [terminalFrame, { tag: 'path', attrs: { d: 'm4 6 2 2-2 2m4 0h3' } }],
  },
  'windows-terminal': {
    mode: 'stroke',
    nodes: [
      terminalFrame,
      { tag: 'path', attrs: { d: 'M1.5 5.5h13M6 2.5v3M4.2 8.2 6 9.8l-1.8 1.6M8 11.4h3' } },
    ],
  },
  powershell: {
    mode: 'stroke',
    nodes: [
      { tag: 'path', attrs: { d: 'M3.8 2.5h10.4l-2 11H1.8l2-11Z' } },
      { tag: 'path', attrs: { d: 'm5.3 6 2 2-2.5 2M8.4 10h2.4' } },
    ],
  },
  bash: {
    mode: 'stroke',
    nodes: [
      terminalFrame,
      {
        tag: 'path',
        attrs: {
          d: 'M5.5 5v6M6.8 6a1.4 1.4 0 0 0-2.6.6c0 1.3 2.6.9 2.6 2.2a1.4 1.4 0 0 1-2.6.6M8.8 10.5h3',
        },
      },
    ],
  },
  zsh: {
    mode: 'stroke',
    nodes: [terminalFrame, { tag: 'path', attrs: { d: 'M4.2 6h3.2L4.2 10h3.2M9 10h2.8' } }],
  },
  iterm2: {
    mode: 'stroke',
    nodes: [
      terminalFrame,
      { tag: 'path', attrs: { d: 'M8 2.5v11M3.5 6.5 5 8l-1.5 1.5M10 9.5h2.5' } },
    ],
  },
  warp: {
    mode: 'stroke',
    nodes: [
      { tag: 'rect', attrs: { x: 1.5, y: 2.5, width: 13, height: 11, rx: 3 } },
      { tag: 'path', attrs: { d: 'm4.5 5.5 3 2.5-3 2.5M9 10.5h2.8' } },
    ],
  },
  ghostty: {
    mode: 'stroke',
    nodes: [
      {
        tag: 'path',
        attrs: {
          d: 'M3 13.5V7a5 5 0 0 1 10 0v6.5l-2-1.4-1.5 1.4-1.5-1.4-1.5 1.4-1.5-1.4-2 1.4Z',
        },
      },
      { tag: 'path', attrs: { d: 'M5.5 6.8 6.8 7.8 5.5 8.8M9 8.8h2' } },
    ],
  },
  vscode: {
    mode: 'stroke',
    nodes: [
      {
        tag: 'path',
        attrs: {
          d: 'M11.5 2v12l2.5-1.4V3.4L11.5 2ZM11.5 4.2 3.2 11.2l-1.2-.8 9.5-8.4M11.5 11.8 3.2 4.8 2 5.6l9.5 8.4',
        },
      },
    ],
  },
  chrome: {
    mode: 'stroke',
    nodes: [
      { tag: 'circle', attrs: { cx: 8, cy: 8, r: 6 } },
      { tag: 'circle', attrs: { cx: 8, cy: 8, r: 2.2 } },
      { tag: 'path', attrs: { d: 'M8 5.8h5.6M6.1 9.1 3.3 4.3M9.9 9.1l-2.8 4.8' } },
    ],
  },
  edge: {
    mode: 'stroke',
    nodes: [
      {
        tag: 'path',
        attrs: {
          d: 'M13.5 9.2A5.5 5.5 0 0 0 2.6 7.5C2.5 11 5.2 13.8 8.7 13.8c1.6 0 3-.6 4-1.5M3.5 10.3a4.2 4.2 0 0 1 4.8-5.2c1.8.2 3 1.6 2.8 3.1H7.5',
        },
      },
    ],
  },
  safari: {
    mode: 'stroke',
    nodes: [
      { tag: 'circle', attrs: { cx: 8, cy: 8, r: 6 } },
      { tag: 'path', attrs: { d: 'm10.8 5.2-1.6 4-4 1.6 1.6-4 4-1.6Z' } },
    ],
  },
  firefox: {
    mode: 'stroke',
    nodes: [
      { tag: 'circle', attrs: { cx: 8.3, cy: 8.5, r: 3.2 } },
      { tag: 'path', attrs: { d: 'M13.2 6.8a5.6 5.6 0 1 1-7-4.5c-.6 1.2-.4 2.5.4 3.4' } },
    ],
  },
  bun: {
    mode: 'stroke',
    nodes: [
      {
        tag: 'path',
        attrs: {
          d: 'M2.2 9.2C2.2 5.5 4.8 3 8 3s5.8 2.5 5.8 6.2c0 2.3-2.5 3.8-5.8 3.8S2.2 11.5 2.2 9.2Z',
        },
      },
      { tag: 'path', attrs: { d: 'M6 7.4h.01M10 7.4h.01M6.8 9.8a2 2 0 0 0 2.4 0' } },
    ],
  },
  node: {
    mode: 'stroke',
    nodes: [
      { tag: 'path', attrs: { d: 'M8 1.8 13.4 4.9v6.2L8 14.2l-5.4-3.1V4.9L8 1.8Z' } },
      { tag: 'path', attrs: { d: 'M8 5.2v5.6M6 6.8v2.4a2 2 0 0 0 4 0' } },
    ],
  },
  branch: {
    mode: 'stroke',
    nodes: [
      { tag: 'circle', attrs: { cx: 4, cy: 3, r: 1.5 } },
      { tag: 'circle', attrs: { cx: 4, cy: 13, r: 1.5 } },
      { tag: 'circle', attrs: { cx: 12, cy: 3, r: 1.5 } },
      { tag: 'path', attrs: { d: 'M4 4.5v7M12 4.5v1A3.5 3.5 0 0 1 8.5 9H4' } },
    ],
  },
  runtime: {
    mode: 'stroke',
    nodes: [{ tag: 'path', attrs: { d: 'm5 4-4 4 4 4m6-8 4 4-4 4' } }],
  },
  time: {
    mode: 'stroke',
    nodes: [
      { tag: 'circle', attrs: { cx: 8, cy: 8, r: 6 } },
      { tag: 'path', attrs: { d: 'M8 4.5V8l2.5 1.5' } },
    ],
  },
  folder: {
    mode: 'stroke',
    nodes: [
      {
        tag: 'path',
        attrs: { d: 'M2 4.5h4.2l1.4 1.5H14v6.5a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-8Z' },
      },
    ],
  },
};
