import { describe, expect, it } from 'bun:test';
import { Window } from 'happy-dom';
import { act } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { UiTerminalEcho } from '../components/terminal/terminal-echo.js';
import {
  detectTerminalEnvironment,
  matchTerminalSegmentIcon,
  resolveTerminalSegmentIcon,
  resolveTerminalTitlebar,
  type TerminalWindowAction,
  terminalSegmentIconNames,
} from '../components/terminal/terminal-environment.js';
import { terminalSegmentGlyphs } from '../components/terminal/terminal-icons.js';
import { UiTerminalPrompt } from '../components/terminal/terminal-prompt.js';
import { UiTerminalSurface } from '../components/terminal/terminal-surface.js';

function withBrowserDom<T>(
  options: {
    platform?: string;
    userAgent?: string;
    maxTouchPoints?: number;
    hasVscodeHost?: boolean;
  },
  run: (browser: Window) => Promise<T> | T,
): Promise<T> {
  const browser = new Window();
  const navigatorValue = {
    platform: options.platform ?? '',
    userAgent: options.userAgent ?? '',
    maxTouchPoints: options.maxTouchPoints ?? 0,
  };
  const globals: Record<string, unknown> = {
    window: browser,
    document: browser.document,
    navigator: navigatorValue,
    HTMLElement: browser.HTMLElement,
    Node: browser.Node,
    getComputedStyle: browser.getComputedStyle.bind(browser),
    requestAnimationFrame: browser.requestAnimationFrame.bind(browser),
    cancelAnimationFrame: browser.cancelAnimationFrame.bind(browser),
    IS_REACT_ACT_ENVIRONMENT: true,
  };
  if (options.hasVscodeHost) {
    globals.acquireVsCodeApi = () => ({});
  }
  const previous = new Map<string, PropertyDescriptor | undefined>();
  const restoreKeys = [...Object.keys(globals), 'acquireVsCodeApi'];
  for (const name of restoreKeys) {
    previous.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
  }
  for (const [name, value] of Object.entries(globals)) {
    Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
  }
  if (!options.hasVscodeHost) {
    Reflect.deleteProperty(globalThis, 'acquireVsCodeApi');
  }
  return Promise.resolve(run(browser)).finally(() => {
    for (const name of restoreKeys) {
      const descriptor = previous.get(name);
      if (descriptor) {
        Object.defineProperty(globalThis, name, descriptor);
      } else {
        Reflect.deleteProperty(globalThis, name);
      }
    }
    browser.close();
  });
}

describe('terminal environment detection and icon recognition in React', () => {
  it('environment helpers resolve OS, app and titlebar variants consistently', () => {
    expect(detectTerminalEnvironment()).toEqual({
      os: 'unknown',
      browser: undefined,
      app: undefined,
      titlebar: 'default',
      icon: 'terminal',
    });
    expect(
      detectTerminalEnvironment({
        platform: 'MacIntel',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) Safari/605',
      }),
    ).toMatchObject({ os: 'macos', browser: 'safari', titlebar: 'macos', icon: 'macos' });
    expect(
      detectTerminalEnvironment({
        platform: 'Win32',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0) Edg/130.0',
      }),
    ).toMatchObject({ os: 'windows', browser: 'edge', titlebar: 'windows', icon: 'windows' });
    expect(
      detectTerminalEnvironment({
        platform: 'Linux x86_64',
        userAgent: 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64) Firefox/130.0',
      }),
    ).toMatchObject({ os: 'ubuntu', browser: 'firefox', titlebar: 'linux', icon: 'ubuntu' });

    expect(resolveTerminalTitlebar('auto', { platform: 'Win32' })).toBe('windows');
    expect(matchTerminalSegmentIcon('PowerShell 7')).toBe('powershell');
    expect(matchTerminalSegmentIcon('VS Code')).toBe('vscode');
    expect(resolveTerminalSegmentIcon({ icon: 'auto', label: 'bun v1.4.0' })).toBe('bun');

    for (const iconName of terminalSegmentIconNames) {
      expect(terminalSegmentGlyphs[iconName].nodes.length).toBeGreaterThan(0);
    }
  });

  it('UiTerminalSurface renders macOS, Windows and Linux titlebars and dispatches window actions', async () => {
    await withBrowserDom({}, async (browser) => {
      const container = browser.document.createElement('div');
      browser.document.body.append(container);
      const actions: TerminalWindowAction[] = [];
      const root = createRoot(container as unknown as Element);

      try {
        await act(async () => {
          root.render(
            <div>
              <UiTerminalSurface
                title="macOS terminal"
                titlebar="macos"
                maximized
                restoreLabel="Restore macOS window"
                onWindowAction={(action) => actions.push(action)}
              >
                <div>macOS body</div>
              </UiTerminalSurface>
              <UiTerminalSurface title="Windows terminal" titlebar="windows">
                <div>Windows body</div>
              </UiTerminalSurface>
              <UiTerminalSurface title="Linux terminal" titlebar="linux">
                <div>Linux body</div>
              </UiTerminalSurface>
            </div>,
          );
        });

        const macos = container.querySelector('[data-titlebar="macos"]');
        expect(macos?.getAttribute('data-maximized')).toBe('true');
        const macosButtons = Array.from(
          macos?.querySelectorAll('.ui-terminal-surface__window-button') ?? [],
        ) as unknown as HTMLButtonElement[];
        expect(macosButtons.map((button) => button.getAttribute('data-window-action'))).toEqual([
          'close',
          'minimize',
          'maximize',
        ]);
        expect(macosButtons[2]?.getAttribute('aria-pressed')).toBe('true');
        expect(macosButtons[2]?.getAttribute('aria-label')).toBe('Restore macOS window');

        await act(async () => {
          for (const button of macosButtons) button.click();
        });
        expect(actions).toEqual(['close', 'minimize', 'maximize']);

        const windows = container.querySelector('[data-titlebar="windows"]');
        expect(windows?.querySelector('.ui-terminal-surface__app-icon svg')).not.toBeNull();
        expect(
          Array.from(windows?.querySelectorAll('.ui-terminal-surface__window-button') ?? []).map(
            (button) => button.getAttribute('data-window-action'),
          ),
        ).toEqual(['minimize', 'maximize', 'close']);

        const linux = container.querySelector('[data-titlebar="linux"]');
        expect(linux?.querySelector('.ui-terminal-surface__app-icon')).toBeNull();
        expect(
          Array.from(linux?.querySelectorAll('.ui-terminal-surface__window-button') ?? []).map(
            (button) => button.getAttribute('data-window-action'),
          ),
        ).toEqual(['minimize', 'maximize', 'close']);
      } finally {
        await act(async () => {
          root.unmount();
        });
      }
    });
  });

  it('UiTerminalSurface resolves auto titlebar without hydration mismatch and renders prompt/echo icons', async () => {
    const fixture = (
      <div>
        <UiTerminalSurface title="Auto terminal" titlebar="auto">
          <UiTerminalEcho
            text="bun test"
            segments={[
              { id: 'host', label: 'neoverse', tone: 'host', icon: 'auto', iconOnly: true },
            ]}
          />
          <UiTerminalPrompt
            label="Command input"
            defaultValue=""
            segments={[
              { id: 'host', label: 'neoverse', tone: 'host', icon: 'auto', iconOnly: true },
              { id: 'runtime', label: 'bun v1.4.0', tone: 'runtime', icon: 'auto' },
              { id: 'legacy', label: '~/playground', tone: 'path' },
            ]}
          />
        </UiTerminalSurface>
      </div>
    );

    const serverHtml = renderToString(fixture);
    expect(serverHtml).toContain('data-titlebar="default"');
    expect(serverHtml).not.toContain('ui-terminal-surface__window-controls');

    await withBrowserDom(
      { platform: 'Win32', userAgent: 'Windows NT 10.0', hasVscodeHost: true },
      async (browser) => {
        const container = browser.document.createElement('div');
        browser.document.body.append(container);
        container.innerHTML = serverHtml;
        const errors: unknown[] = [];
        let root: ReturnType<typeof hydrateRoot> | undefined;

        try {
          await act(async () => {
            root = hydrateRoot(container as unknown as Element, fixture, {
              onRecoverableError: (error) => errors.push(error),
            });
          });

          expect(errors).toEqual([]);
          const surface = container.querySelector('.ui-terminal-surface');
          expect(surface?.getAttribute('data-titlebar')).toBe('windows');

          const segments = container.querySelectorAll(
            '.ui-terminal-prompt .ui-terminal-prompt__segment',
          );
          expect(segments[0]?.getAttribute('data-icon')).toBe('vscode');
          expect(segments[0]?.querySelector('svg')).not.toBeNull();
          expect(segments[0]?.querySelector('.sr-only')?.textContent).toBe('neoverse');
          expect(segments[1]?.getAttribute('data-icon')).toBe('bun');
          expect(segments[1]?.querySelector('.sr-only')).toBeNull();
          expect(segments[2]?.getAttribute('data-icon')).toBeNull();

          expect(
            container
              .querySelector('.ui-terminal-echo .ui-terminal-prompt__segment')
              ?.getAttribute('data-icon'),
          ).toBe('vscode');
        } finally {
          await act(async () => {
            root?.unmount();
          });
        }
      },
    );
  });
});
