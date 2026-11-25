import type { TerminalSegmentIcon, TerminalSurfaceProps, TerminalTitlebar } from '@neoverse-ui/vue';
import { h } from 'vue';
import { defineSpecimen } from '../lab-specimen-config';
import { lazyComponent, withPreload } from '../lazy-component';
import { localized } from '../playground-content';

const TerminalTranscriptExample = lazyComponent(
  () => import('../previews/TerminalTranscriptExample.vue'),
);

export interface TerminalSpecimenProps {
  titlebar: TerminalTitlebar;
  hostIcon: TerminalSegmentIcon;
  density: NonNullable<TerminalSurfaceProps['density']>;
  surface: NonNullable<TerminalSurfaceProps['surface']>;
  maximized: boolean;
}

/** The editable Terminal composition specimen */
export const terminal = withPreload(
  defineSpecimen<TerminalSpecimenProps>()({
    initialProps: {
      titlebar: 'auto',
      hostIcon: 'auto',
      density: 'compact',
      surface: 'glass-elevated',
      maximized: false,
    },
    initialState: () => ({}),
    controls: {
      props: {
        titlebar: {
          kind: 'select',
          label: localized('Titlebar style', '标题栏样式'),
          options: [
            { value: 'auto', label: localized('Auto detect', '自动识别') },
            { value: 'default', label: localized('Default', '默认') },
            { value: 'macos', label: localized('macOS', 'macOS') },
            { value: 'windows', label: localized('Windows', 'Windows') },
            { value: 'linux', label: localized('Linux / GNOME', 'Linux / GNOME') },
          ],
        },
        hostIcon: {
          kind: 'select',
          label: localized('Commandline icon', '命令行图标'),
          options: [
            { value: 'auto', label: localized('Auto (OS / App)', '自动识别系统/应用') },
            { value: 'macos', label: localized('macOS', 'macOS') },
            { value: 'windows', label: localized('Windows', 'Windows') },
            { value: 'linux', label: localized('Linux', 'Linux') },
            { value: 'ubuntu', label: localized('Ubuntu', 'Ubuntu') },
            { value: 'windows-terminal', label: localized('Windows Terminal', 'Windows Terminal') },
            { value: 'powershell', label: localized('PowerShell', 'PowerShell') },
            { value: 'bash', label: localized('Bash', 'Bash') },
            { value: 'zsh', label: localized('Zsh', 'Zsh') },
            { value: 'vscode', label: localized('VS Code', 'VS Code') },
            { value: 'iterm2', label: localized('iTerm2', 'iTerm2') },
            { value: 'warp', label: localized('Warp', 'Warp') },
            { value: 'ghostty', label: localized('Ghostty', 'Ghostty') },
            { value: 'chrome', label: localized('Chrome', 'Chrome') },
            { value: 'edge', label: localized('Edge', 'Edge') },
            { value: 'safari', label: localized('Safari', 'Safari') },
            { value: 'firefox', label: localized('Firefox', 'Firefox') },
            { value: 'bun', label: localized('Bun', 'Bun') },
            { value: 'node', label: localized('Node.js', 'Node.js') },
          ],
        },
        density: {
          kind: 'select',
          label: localized('Density', '密度'),
          options: [
            { value: 'compact', label: localized('Compact', '紧凑') },
            { value: 'expanded', label: localized('Expanded', '宽松') },
          ],
        },
        surface: {
          kind: 'select',
          label: localized('Surface', '表面材质'),
          options: [
            { value: 'glass-subtle', label: localized('Light glass', '轻量极光玻璃') },
            { value: 'glass-elevated', label: localized('Standard glass', '标准极光玻璃') },
            { value: 'glass-immersive', label: localized('Immersive glass', '沉浸极光玻璃') },
          ],
        },
        maximized: {
          kind: 'boolean',
          label: localized('Maximized', '最大化'),
        },
      },
    },
    render: ({ props, locale }) =>
      h(TerminalTranscriptExample, {
        ...props,
        locale,
        inlineControls: false,
        class: 'w-full min-w-0',
      }),
  }),
  TerminalTranscriptExample,
);
