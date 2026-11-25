import { expect, test } from 'bun:test';
import { readFile } from 'node:fs/promises';
import { cssVariables } from './index.js';

const readTokenCss = (relativePath: string) =>
  readFile(new URL(relativePath, import.meta.url), 'utf8');

test('exposes terminal header and window-control token names and values', async () => {
  const [terminalCss, lightCss, darkCss] = await Promise.all([
    readTokenCss('components/terminal.css'),
    readTokenCss('themes/light.css'),
    readTokenCss('themes/dark.css'),
  ]);

  expect(cssVariables.components.terminal.headerBorder).toBe('--neoverse-terminal-header-border');
  expect(cssVariables.components.terminal.windowControlSize).toBe(
    '--neoverse-terminal-window-control-size',
  );
  expect(cssVariables.components.terminal.windowCaptionWidth).toBe(
    '--neoverse-terminal-window-caption-width',
  );
  expect(cssVariables.components.terminal.windowLinuxButtonSize).toBe(
    '--neoverse-terminal-window-linux-button-size',
  );
  expect(cssVariables.components.terminal.windowClose).toBe('--neoverse-terminal-window-close');

  for (const token of [
    cssVariables.components.terminal.headerBorder,
    cssVariables.components.terminal.headerMinHeight,
    cssVariables.components.terminal.windowControlSize,
    cssVariables.components.terminal.windowCaptionWidth,
    cssVariables.components.terminal.windowLinuxButtonSize,
    cssVariables.components.terminal.windowCloseHoverBackground,
  ]) {
    expect(terminalCss).toContain(`${token}:`);
  }

  for (const themeCss of [lightCss, darkCss]) {
    expect(themeCss).toContain('--neoverse-terminal-window-close:');
    expect(themeCss).toContain('--neoverse-terminal-window-minimize:');
    expect(themeCss).toContain('--neoverse-terminal-window-maximize:');
  }
});
