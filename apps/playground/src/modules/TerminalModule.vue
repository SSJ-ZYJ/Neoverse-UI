<script setup lang="ts">
import {
  type TerminalPromptSegment,
  UiTerminalLine,
  UiTerminalPrompt,
  UiTerminalSurface,
  UiTerminalTranscript,
} from '@neoverse-ui/vue';
import { computed, ref } from 'vue';
import LabSpecimenSection from '../LabSpecimenSection.vue';
import MaterialBackdrop from '../MaterialBackdrop.vue';
import { localize, localized } from '../playground-content';
import type { LabModuleProps } from './types';

defineProps<Pick<LabModuleProps, 'locale'>>();

type OutputLine = {
  text: string;
  kind: 'text' | 'command';
  tone: 'normal' | 'muted' | 'success' | 'error';
};
const command = ref('');
const suggestion = computed(() =>
  command.value && 'echo hello'.startsWith(command.value) ? 'echo hello' : '',
);
const prompt = ref<InstanceType<typeof UiTerminalPrompt> | null>(null);
const lines = ref<OutputLine[]>([
  { text: 'Neoverse shell · interactive preview', kind: 'text', tone: 'muted' },
  {
    text: 'Ready. Enter a command to inspect the terminal composition.',
    kind: 'text',
    tone: 'normal',
  },
]);
const clock = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' }).format(
  new Date(),
);
const segments: readonly TerminalPromptSegment[] = [
  { id: 'host', label: 'neoverse', tone: 'host' },
  { id: 'path', label: '~/playground', tone: 'path' },
  { id: 'branch', label: 'dev', tone: 'branch' },
  { id: 'runtime', label: 'bun v1.4.0', tone: 'runtime' },
  { id: 'time', label: clock, tone: 'time' },
];

function submit(event: KeyboardEvent) {
  if (event.key !== 'Enter' || event.isComposing || event.repeat || !command.value.trim()) return;
  event.preventDefault();
  lines.value.push({ text: `❯ ${command.value}`, kind: 'command', tone: 'normal' });
  command.value = '';
}

function focusOnBackground(event: MouseEvent) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  if (
    target.classList.contains('ui-terminal-surface__body') ||
    target.classList.contains('ui-terminal-transcript')
  ) {
    prompt.value?.focus();
  }
}

const copy = {
  title: localized('Terminal composition', '终端组件组合'),
  description: localized(
    'Tokyo Night context with rounded transitions and a seamless command line.',
    'Tokyo Night 分段上下文，圆头衔接，下方直接输入命令。',
  ),
  label: localized('Terminal command', '终端命令'),
  placeholder: localized('type a command…', '输入命令…'),
};
</script>

<template>
  <LabSpecimenSection
    id="terminal-composition"
    :title="localize(copy.title, locale)"
    :description="localize(copy.description, locale)"
  >
    <MaterialBackdrop edge="inset">
      <UiTerminalSurface title="neoverse / session" class="w-full" @click="focusOnBackground">
        <template #status><span>● active</span></template>
        <UiTerminalTranscript label="Terminal history" style="max-height: 9rem">
          <UiTerminalLine
            v-for="(line, index) in lines"
            :key="index"
            :text="line.text"
            :kind="line.kind"
            :tone="line.tone"
          />
        </UiTerminalTranscript>
        <UiTerminalPrompt
          ref="prompt"
          v-model="command"
          :suggestion="suggestion"
          :label="localize(copy.label, locale)"
          :segments="segments"
          :placeholder="localize(copy.placeholder, locale)"
          @keydown="submit"
        >
          <template #segment="{ segment }">
            <svg
              v-if="segment.tone !== 'path'"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
              focusable="false"
            >
              <template v-if="segment.tone === 'host'">
                <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" />
                <path d="m4 6 2 2-2 2m4 0h3" />
              </template>
              <template v-else-if="segment.tone === 'branch'">
                <circle cx="4" cy="3" r="1.5" />
                <circle cx="4" cy="13" r="1.5" />
                <circle cx="12" cy="3" r="1.5" />
                <path d="M4 4.5v7M12 4.5v1A3.5 3.5 0 0 1 8.5 9H4" />
              </template>
              <path v-else-if="segment.tone === 'runtime'" d="m5 4-4 4 4 4m6-8 4 4-4 4" />
              <template v-else-if="segment.tone === 'time'">
                <circle cx="8" cy="8" r="6" />
                <path d="M8 4.5V8l2.5 1.5" />
              </template>
            </svg>
            <span :class="{ 'sr-only': segment.tone === 'host' }">{{ segment.label }}</span>
          </template>
        </UiTerminalPrompt>
      </UiTerminalSurface>
    </MaterialBackdrop>
  </LabSpecimenSection>
</template>
