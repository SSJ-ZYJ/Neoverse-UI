<script setup lang="ts">
import {
  type ResolvedTerminalSegmentIcon,
  type TerminalSegmentIcon,
  type TerminalTitlebar,
  terminalSegmentGlyphs,
  UiButton,
} from '@neoverse-ui/vue';
import { ref } from 'vue';
import LabSpecimenSection from '../LabSpecimenSection.vue';
import MaterialBackdrop from '../MaterialBackdrop.vue';
import { localize, localized } from '../playground-content';
import TerminalTranscriptExample from '../previews/TerminalTranscriptExample.vue';
import type { LabModuleProps } from './types';

defineProps<LabModuleProps>();

const copy = {
  title: localized('Terminal composition', '终端组件组合'),
  description: localized(
    'Platform titlebar presets (macOS, Windows, Linux, auto) with OS and application icon recognition in the command line.',
    '提供 macOS、Windows、Linux 与自动识别的多套标题栏样式，并在命令行片段中自动识别系统与应用图标。',
  ),
  galleryLabel: localized(
    'Click any detected OS, terminal, browser or runtime chip to preview its command line icon:',
    '点击下方系统、终端、浏览器或运行时图标即可预览命令行图标效果：',
  ),
};

const iconGallery: ReadonlyArray<{
  value: TerminalSegmentIcon;
  glyph: ResolvedTerminalSegmentIcon;
  label: string;
}> = [
  { value: 'auto', glyph: 'terminal', label: 'Auto' },
  { value: 'macos', glyph: 'macos', label: 'macOS' },
  { value: 'windows', glyph: 'windows', label: 'Windows' },
  { value: 'linux', glyph: 'linux', label: 'Linux' },
  { value: 'ubuntu', glyph: 'ubuntu', label: 'Ubuntu' },
  { value: 'windows-terminal', glyph: 'windows-terminal', label: 'Windows Terminal' },
  { value: 'powershell', glyph: 'powershell', label: 'PowerShell' },
  { value: 'bash', glyph: 'bash', label: 'Bash' },
  { value: 'zsh', glyph: 'zsh', label: 'Zsh' },
  { value: 'vscode', glyph: 'vscode', label: 'VS Code' },
  { value: 'iterm2', glyph: 'iterm2', label: 'iTerm2' },
  { value: 'warp', glyph: 'warp', label: 'Warp' },
  { value: 'ghostty', glyph: 'ghostty', label: 'Ghostty' },
  { value: 'chrome', glyph: 'chrome', label: 'Chrome' },
  { value: 'edge', glyph: 'edge', label: 'Edge' },
  { value: 'safari', glyph: 'safari', label: 'Safari' },
  { value: 'firefox', label: 'Firefox', glyph: 'firefox' },
  { value: 'bun', glyph: 'bun', label: 'Bun' },
  { value: 'node', glyph: 'node', label: 'Node.js' },
];

const selectedTitlebar = ref<TerminalTitlebar>('auto');
const selectedHostIcon = ref<TerminalSegmentIcon>('auto');
</script>

<template>
  <LabSpecimenSection
    id="terminal-composition"
    :title="localize(copy.title, locale)"
    :description="localize(copy.description, locale)"
  >
    <MaterialBackdrop edge="inset">
      <TerminalTranscriptExample
        v-model:titlebar="selectedTitlebar"
        v-model:host-icon="selectedHostIcon"
        :locale="locale"
      />
    </MaterialBackdrop>

    <div class="grid gap-2" data-terminal-icon-gallery>
      <p class="text-caption text-secondary">{{ localize(copy.galleryLabel, locale) }}</p>
      <div class="flex flex-wrap items-center gap-2">
        <UiButton
          v-for="item in iconGallery"
          :key="item.value"
          size="sm"
          :variant="selectedHostIcon === item.value ? 'primary' : 'ghost'"
          :data-terminal-icon-chip="item.value"
          @click="selectedHostIcon = item.value"
        >
          <template #leading>
            <svg
              viewBox="0 0 16 16"
              width="14"
              height="14"
              :fill="terminalSegmentGlyphs[item.glyph].mode === 'fill' ? 'currentColor' : 'none'"
              :stroke="
                terminalSegmentGlyphs[item.glyph].mode === 'stroke' ? 'currentColor' : undefined
              "
              :stroke-width="terminalSegmentGlyphs[item.glyph].mode === 'stroke' ? 1.5 : undefined"
              :stroke-linecap="
                terminalSegmentGlyphs[item.glyph].mode === 'stroke' ? 'round' : undefined
              "
              :stroke-linejoin="
                terminalSegmentGlyphs[item.glyph].mode === 'stroke' ? 'round' : undefined
              "
              aria-hidden="true"
              focusable="false"
            >
              <component
                :is="node.tag"
                v-for="(node, index) in terminalSegmentGlyphs[item.glyph].nodes"
                :key="index"
                v-bind="node.attrs"
              />
            </svg>
          </template>
          {{ item.label }}
        </UiButton>
      </div>
    </div>
  </LabSpecimenSection>
</template>
