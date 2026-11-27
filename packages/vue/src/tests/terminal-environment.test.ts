import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { createSSRApp, h, nextTick } from 'vue';
import { renderToString } from 'vue/server-renderer';
import {
  detectTerminalEnvironment,
  matchTerminalSegmentIcon,
  resolveTerminalSegmentIcon,
  resolveTerminalTitlebar,
  type TerminalWindowAction,
  terminalSegmentGlyphs,
  terminalSegmentIconNames,
  UiTerminalEcho,
  UiTerminalPrompt,
  UiTerminalSurface,
} from '../index';

const originalNavigatorDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
const originalVsCodeDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'acquireVsCodeApi');

function stubNavigator(overrides: {
  platform?: string;
  userAgent?: string;
  maxTouchPoints?: number;
  userAgentData?: {
    platform?: string;
    mobile?: boolean;
    brands?: ReadonlyArray<{ brand?: string; version?: string }>;
  };
  hasVscodeHost?: boolean;
}) {
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    writable: true,
    value: {
      platform: overrides.platform ?? '',
      userAgent: overrides.userAgent ?? '',
      maxTouchPoints: overrides.maxTouchPoints ?? 0,
      userAgentData: overrides.userAgentData,
    },
  });
  if (overrides.hasVscodeHost) {
    Object.defineProperty(globalThis, 'acquireVsCodeApi', {
      configurable: true,
      writable: true,
      value: () => ({}),
    });
  } else {
    Reflect.deleteProperty(globalThis, 'acquireVsCodeApi');
  }
}

afterEach(() => {
  if (originalNavigatorDescriptor) {
    Object.defineProperty(globalThis, 'navigator', originalNavigatorDescriptor);
  }
  if (originalVsCodeDescriptor) {
    Object.defineProperty(globalThis, 'acquireVsCodeApi', originalVsCodeDescriptor);
  } else {
    Reflect.deleteProperty(globalThis, 'acquireVsCodeApi');
  }
});

describe('terminal environment detection and icon recognition', () => {
  it('environment helpers detect operating system, browser, host application and titlebar preset', () => {
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
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605 Safari/605',
      }),
    ).toEqual({
      os: 'macos',
      browser: 'safari',
      app: undefined,
      titlebar: 'macos',
      icon: 'macos',
    });

    expect(
      detectTerminalEnvironment({
        platform: 'MacIntel',
        maxTouchPoints: 5,
        userAgent: 'Mozilla/5.0 AppleWebKit/605 Safari/605',
      }),
    ).toMatchObject({ os: 'ios', titlebar: 'macos', icon: 'ios' });

    expect(
      detectTerminalEnvironment({
        userAgentData: {
          platform: 'Windows',
          brands: [{ brand: 'Microsoft Edge', version: '130' }],
        },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edg/130.0',
      }),
    ).toEqual({
      os: 'windows',
      browser: 'edge',
      app: undefined,
      titlebar: 'windows',
      icon: 'windows',
    });

    expect(
      detectTerminalEnvironment({
        platform: 'Linux x86_64',
        userAgent: 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64) Firefox/130.0',
      }),
    ).toEqual({
      os: 'ubuntu',
      browser: 'firefox',
      app: undefined,
      titlebar: 'linux',
      icon: 'ubuntu',
    });

    for (const [uaToken, expectedOs] of [
      ['Debian', 'debian'],
      ['Arch', 'arch'],
      ['Fedora', 'fedora'],
      ['Linux', 'linux'],
    ] as const) {
      expect(
        detectTerminalEnvironment({ platform: 'Linux x86_64', userAgent: uaToken }),
      ).toMatchObject({ os: expectedOs, titlebar: 'linux', icon: expectedOs });
    }

    expect(
      detectTerminalEnvironment({
        platform: 'Linux armv8l',
        userAgent: 'Mozilla/5.0 (Linux; Android 15) Chrome/130.0',
      }),
    ).toEqual({
      os: 'android',
      browser: 'chrome',
      app: undefined,
      titlebar: 'default',
      icon: 'android',
    });

    expect(
      detectTerminalEnvironment({
        platform: 'Win32',
        userAgent: 'WindowsTerminal Chrome/130.0',
      }),
    ).toMatchObject({
      os: 'windows',
      app: 'windows-terminal',
      titlebar: 'windows',
      icon: 'windows-terminal',
    });

    expect(
      detectTerminalEnvironment({
        platform: 'MacIntel',
        userAgent: 'Mozilla/5.0 Ghostty/1.0',
        hasVscodeHost: true,
      }),
    ).toMatchObject({
      os: 'macos',
      app: 'vscode',
      titlebar: 'macos',
      icon: 'vscode',
    });

    expect(resolveTerminalTitlebar('auto', { platform: 'Win32' })).toBe('windows');
    expect(resolveTerminalTitlebar('linux', { platform: 'MacIntel' })).toBe('linux');
  });

  it('segment icon helpers match explicit labels and expose SVG descriptors for every built-in icon', () => {
    expect(matchTerminalSegmentIcon('Windows Terminal')).toBe('windows-terminal');
    expect(matchTerminalSegmentIcon('PowerShell 7')).toBe('powershell');
    expect(matchTerminalSegmentIcon('Git Bash')).toBe('bash');
    expect(matchTerminalSegmentIcon('oh-my-zsh')).toBe('zsh');
    expect(matchTerminalSegmentIcon('VS Code')).toBe('vscode');
    expect(matchTerminalSegmentIcon('iTerm2')).toBe('iterm2');
    expect(matchTerminalSegmentIcon('Warp')).toBe('warp');
    expect(matchTerminalSegmentIcon('Ghostty')).toBe('ghostty');
    expect(matchTerminalSegmentIcon('Ubuntu 24.04')).toBe('ubuntu');
    expect(matchTerminalSegmentIcon('Debian 12')).toBe('debian');
    expect(matchTerminalSegmentIcon('Arch Linux')).toBe('arch');
    expect(matchTerminalSegmentIcon('Fedora 41')).toBe('fedora');
    expect(matchTerminalSegmentIcon('macOS Sequoia')).toBe('macos');
    expect(matchTerminalSegmentIcon('Microsoft Edge')).toBe('edge');
    expect(matchTerminalSegmentIcon('Google Chrome')).toBe('chrome');
    expect(matchTerminalSegmentIcon('Safari')).toBe('safari');
    expect(matchTerminalSegmentIcon('Firefox')).toBe('firefox');
    expect(matchTerminalSegmentIcon('bun v1.4.0')).toBe('bun');
    expect(matchTerminalSegmentIcon('Node.js v22')).toBe('node');
    expect(matchTerminalSegmentIcon('   ')).toBeUndefined();

    expect(
      resolveTerminalSegmentIcon({ icon: 'ghostty', label: 'bun v1.4.0', tone: 'runtime' }),
    ).toBe('ghostty');
    expect(resolveTerminalSegmentIcon({ icon: 'auto', label: 'bun v1.4.0', tone: 'runtime' })).toBe(
      'bun',
    );
    expect(resolveTerminalSegmentIcon({ icon: 'auto', label: 'main', tone: 'branch' })).toBe(
      'branch',
    );
    expect(resolveTerminalSegmentIcon({ icon: 'auto', label: '12:30:00', tone: 'time' })).toBe(
      'time',
    );
    expect(resolveTerminalSegmentIcon({ icon: 'auto', label: '~/repo', tone: 'path' })).toBe(
      'folder',
    );
    expect(
      resolveTerminalSegmentIcon(
        { icon: 'auto', label: 'neoverse', tone: 'host' },
        { platform: 'Linux x86_64', userAgent: 'Ubuntu' },
      ),
    ).toBe('ubuntu');

    for (const iconName of terminalSegmentIconNames) {
      const descriptor = terminalSegmentGlyphs[iconName];
      expect(descriptor).toBeDefined();
      expect(descriptor.nodes.length).toBeGreaterThan(0);
    }
  });
});

describe('UiTerminalSurface titlebars and segment icons in Vue', () => {
  it('UiTerminalSurface renders default, macOS, Windows and Linux titlebars and emits windowAction events', async () => {
    const actions: TerminalWindowAction[] = [];
    const defaultSurface = mount(UiTerminalSurface, {
      props: { title: 'Default shell' },
      slots: { default: '<p>Body</p>' },
    });
    expect(defaultSurface.attributes('data-titlebar')).toBe('default');
    expect(defaultSurface.find('.ui-terminal-surface__window-controls').exists()).toBe(false);
    defaultSurface.unmount();

    const macosSurface = mount(UiTerminalSurface, {
      props: {
        title: 'macOS shell',
        titlebar: 'macos',
        maximized: true,
        restoreLabel: 'Restore macOS window',
        onWindowAction: (action: TerminalWindowAction) => actions.push(action),
      },
      slots: { default: '<p>Body</p>' },
    });
    expect(macosSurface.attributes('data-titlebar')).toBe('macos');
    expect(macosSurface.attributes('data-maximized')).toBe('true');
    const macosButtons = macosSurface.findAll('.ui-terminal-surface__window-button');
    expect(macosButtons.map((button) => button.attributes('data-window-action'))).toEqual([
      'close',
      'minimize',
      'maximize',
    ]);
    expect(macosButtons[2]?.attributes('aria-pressed')).toBe('true');
    expect(macosButtons[2]?.attributes('aria-label')).toBe('Restore macOS window');
    for (const button of macosButtons) {
      await button.trigger('click');
    }
    expect(actions).toEqual(['close', 'minimize', 'maximize']);
    macosSurface.unmount();

    const windowsSurface = mount(UiTerminalSurface, {
      props: { title: 'Windows shell', titlebar: 'windows' },
      slots: { default: '<p>Body</p>' },
    });
    expect(windowsSurface.attributes('data-titlebar')).toBe('windows');
    expect(windowsSurface.find('.ui-terminal-surface__app-icon svg').exists()).toBe(true);
    expect(
      windowsSurface
        .findAll('.ui-terminal-surface__window-button')
        .map((button) => button.attributes('data-window-action')),
    ).toEqual(['minimize', 'maximize', 'close']);
    windowsSurface.unmount();

    const linuxSurface = mount(UiTerminalSurface, {
      props: { title: 'Linux shell', titlebar: 'linux' },
      slots: { default: '<p>Body</p>' },
    });
    expect(linuxSurface.attributes('data-titlebar')).toBe('linux');
    expect(linuxSurface.find('.ui-terminal-surface__app-icon').exists()).toBe(false);
    expect(
      linuxSurface
        .findAll('.ui-terminal-surface__window-button')
        .map((button) => button.attributes('data-window-action')),
    ).toEqual(['minimize', 'maximize', 'close']);
    linuxSurface.unmount();
  });

  it('UiTerminalSurface resolves auto titlebar safely across SSR and client mount', async () => {
    stubNavigator({ platform: 'MacIntel', userAgent: 'Macintosh; Safari/605' });

    const ssrHtml = await renderToString(
      createSSRApp({
        render: () => h(UiTerminalSurface, { title: 'Auto shell', titlebar: 'auto' }, () => 'Body'),
      }),
    );
    expect(ssrHtml).toContain('data-titlebar="default"');
    expect(ssrHtml).not.toContain('ui-terminal-surface__window-controls');

    const wrapper = mount(UiTerminalSurface, {
      props: { title: 'Auto shell', titlebar: 'auto' },
      slots: { default: '<p>Body</p>' },
    });
    await nextTick();
    expect(wrapper.attributes('data-titlebar')).toBe('macos');
    expect(wrapper.find('.ui-terminal-surface__window-controls').exists()).toBe(true);
    wrapper.unmount();
  });

  it('UiTerminalPrompt and UiTerminalEcho render recognized and icon-only segment glyphs', async () => {
    stubNavigator({ platform: 'Win32', userAgent: 'Windows NT 10.0 WindowsTerminal Chrome/130' });

    const promptWrapper = mount(UiTerminalPrompt, {
      props: {
        label: 'Command input',
        modelValue: '',
        segments: [
          { id: 'host', label: 'neoverse', tone: 'host', icon: 'auto', iconOnly: true },
          { id: 'runtime', label: 'bun v1.4.0', tone: 'runtime', icon: 'auto' },
          { id: 'legacy', label: '~/repo', tone: 'path' },
        ],
      },
    });
    await nextTick();

    const segments = promptWrapper.findAll('.ui-terminal-prompt__segment');
    expect(segments[0]?.attributes('data-icon')).toBe('windows-terminal');
    expect(segments[0]?.find('svg').exists()).toBe(true);
    expect(segments[0]?.find('.sr-only').text()).toBe('neoverse');
    expect(segments[1]?.attributes('data-icon')).toBe('bun');
    expect(segments[1]?.find('svg').exists()).toBe(true);
    expect(segments[1]?.find('.sr-only').exists()).toBe(false);
    expect(segments[2]?.attributes('data-icon')).toBeUndefined();
    expect(segments[2]?.find('svg').exists()).toBe(false);
    promptWrapper.unmount();

    const echoWrapper = mount(UiTerminalEcho, {
      props: {
        text: 'bun run test',
        segments: [{ id: 'host', label: 'PowerShell', tone: 'host', icon: 'auto', iconOnly: true }],
      },
    });
    await nextTick();
    expect(echoWrapper.find('.ui-terminal-prompt__segment').attributes('data-icon')).toBe(
      'powershell',
    );
    expect(echoWrapper.find('.ui-terminal-prompt__segment .sr-only').text()).toBe('PowerShell');
    echoWrapper.unmount();
  });
});
