import { createElement } from 'react';
import type { ResolvedTerminalSegmentIcon } from './terminal-environment.js';
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
