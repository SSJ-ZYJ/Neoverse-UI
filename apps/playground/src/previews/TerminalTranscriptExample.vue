<script setup lang="ts">
import {
  detectTerminalEnvironment,
  readTerminalNavigatorHints,
  type TerminalEnvironmentInfo,
  type TerminalNavigatorHints,
  type TerminalPromptSegment,
  type TerminalSegmentIcon,
  type TerminalSurfaceProps,
  type TerminalTitlebar,
  type TerminalWindowAction,
  UiButton,
  UiSelect,
  UiTerminalEcho,
  UiTerminalLine,
  UiTerminalPrompt,
  UiTerminalSurface,
  UiTerminalTranscript,
} from '@neoverse-ui/vue';
import { computed, onMounted, ref, watch } from 'vue';
import type { LabModuleProps } from '../modules/types';
import { localize, localized } from '../playground-content';

const props = withDefaults(
  defineProps<
    LabModuleProps & {
      titlebar?: TerminalTitlebar;
      hostIcon?: TerminalSegmentIcon;
      density?: TerminalSurfaceProps['density'];
      surface?: TerminalSurfaceProps['surface'];
      maximized?: boolean;
      inlineControls?: boolean;
    }
  >(),
  {
    titlebar: 'auto',
    hostIcon: 'auto',
    density: 'compact',
    surface: 'glass-elevated',
    maximized: false,
    inlineControls: true,
  },
);

const emit = defineEmits<{
  'update:titlebar': [value: TerminalTitlebar];
  'update:hostIcon': [value: TerminalSegmentIcon];
}>();

const copy = {
  titlebarLabel: localized('Titlebar style', '标题栏样式'),
  hostIconLabel: localized('Commandline icon', '命令行图标'),
  focusCommand: localized('Focus command', '聚焦命令'),
  restoreBody: localized('Restore view', '恢复视图'),
  reopen: localized('Reopen terminal', '重新打开终端'),
  closedNotice: localized(
    'Terminal window closed from titlebar action.',
    '终端窗口已通过标题栏按钮关闭。',
  ),
  label: localized('Terminal command', '终端命令'),
  placeholder: localized('type a command…', '输入命令…'),
  closeWindow: localized('Close window', '关闭窗口'),
  minimizeWindow: localized('Minimize window', '最小化窗口'),
  maximizeWindow: localized('Maximize window', '最大化窗口'),
  restoreWindow: localized('Restore window', '还原窗口'),
};

const titlebarOptions = computed(() => [
  { value: 'auto', label: props.locale === 'zh' ? '自动识别' : 'Auto detect' },
  { value: 'default', label: props.locale === 'zh' ? '默认' : 'Default' },
  { value: 'macos', label: 'macOS' },
  { value: 'windows', label: 'Windows' },
  { value: 'linux', label: 'Linux / GNOME' },
]);

const hostIconOptions = computed(() => [
  { value: 'auto', label: props.locale === 'zh' ? '自动识别系统/应用' : 'Auto (OS / App)' },
  { value: 'macos', label: 'macOS' },
  { value: 'windows', label: 'Windows' },
  { value: 'linux', label: 'Linux' },
  { value: 'ubuntu', label: 'Ubuntu' },
  { value: 'debian', label: 'Debian' },
  { value: 'arch', label: 'Arch Linux' },
  { value: 'fedora', label: 'Fedora' },
  { value: 'android', label: 'Android' },
  { value: 'ios', label: 'iOS' },
  { value: 'windows-terminal', label: 'Windows Terminal' },
  { value: 'powershell', label: 'PowerShell' },
  { value: 'bash', label: 'Bash' },
  { value: 'zsh', label: 'Zsh' },
  { value: 'iterm2', label: 'iTerm2' },
  { value: 'warp', label: 'Warp' },
  { value: 'ghostty', label: 'Ghostty' },
  { value: 'vscode', label: 'VS Code' },
  { value: 'chrome', label: 'Google Chrome' },
  { value: 'edge', label: 'Microsoft Edge' },
  { value: 'safari', label: 'Safari' },
  { value: 'firefox', label: 'Firefox' },
  { value: 'bun', label: 'Bun' },
  { value: 'node', label: 'Node.js' },
  { value: 'terminal', label: props.locale === 'zh' ? '通用终端' : 'Generic terminal' },
]);

const localTitlebar = ref<TerminalTitlebar>(props.titlebar);
const localHostIcon = ref<TerminalSegmentIcon>(props.hostIcon);
const localMaximized = ref(props.maximized);
const minimized = ref(false);
const closed = ref(false);
const navigatorHints = ref<TerminalNavigatorHints | undefined>(undefined);
const detectedEnvironment = ref<TerminalEnvironmentInfo | null>(null);

watch(
  () => props.titlebar,
  (value) => {
    localTitlebar.value = value;
  },
);
watch(
  () => props.hostIcon,
  (value) => {
    localHostIcon.value = value;
  },
);
watch(
  () => props.maximized,
  (value) => {
    localMaximized.value = value;
  },
);

onMounted(() => {
  const hints = readTerminalNavigatorHints();
  navigatorHints.value = hints;
  detectedEnvironment.value = detectTerminalEnvironment(hints);
});

function selectTitlebar(value: string | number) {
  const next = String(value) as TerminalTitlebar;
  localTitlebar.value = next;
  emit('update:titlebar', next);
}

function selectHostIcon(value: string | number) {
  const next = String(value) as TerminalSegmentIcon;
  localHostIcon.value = next;
  emit('update:hostIcon', next);
}

function handleWindowAction(action: TerminalWindowAction) {
  if (action === 'maximize') {
    minimized.value = false;
    localMaximized.value = !localMaximized.value;
    return;
  }
  if (action === 'minimize') {
    minimized.value = !minimized.value;
    return;
  }
  closed.value = true;
  minimized.value = false;
}

type OutputLine = {
  text: string;
  tone: 'normal' | 'muted' | 'success' | 'error';
} & ({ kind: 'text' } | { kind: 'command'; segments: readonly TerminalPromptSegment[] });

const command = ref('');
const suggestion = computed(() =>
  command.value && 'echo hello'.startsWith(command.value) ? 'echo hello' : '',
);
const prompt = ref<InstanceType<typeof UiTerminalPrompt> | null>(null);
const clock = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' }).format(
  new Date(),
);

const hostLabel = computed(() => {
  if (localHostIcon.value !== 'auto') return localHostIcon.value;
  const environment = detectedEnvironment.value;
  if (!environment) return 'neoverse';
  return environment.app ?? (environment.os !== 'unknown' ? environment.os : 'neoverse');
});

const segments = computed<readonly TerminalPromptSegment[]>(() => [
  {
    id: 'host',
    label: hostLabel.value,
    tone: 'host',
    icon: localHostIcon.value,
    iconOnly: true,
  },
  { id: 'path', label: '~/playground', tone: 'path' },
  { id: 'branch', label: 'dev', tone: 'branch', icon: 'branch' },
  { id: 'runtime', label: 'bun v1.4.0', tone: 'runtime', icon: 'auto' },
  { id: 'time', label: clock, tone: 'time', icon: 'time' },
]);

const lines = ref<OutputLine[]>([
  { text: 'Neoverse shell · interactive preview', kind: 'text', tone: 'muted' },
  {
    text: 'Ready. Enter a command to inspect the terminal composition.',
    kind: 'text',
    tone: 'normal',
  },
  {
    text: 'echo hello',
    kind: 'command',
    tone: 'normal',
    segments: segments.value.map((segment) => ({ ...segment })),
  },
]);

function submit(event: KeyboardEvent) {
  if (event.key !== 'Enter' || event.isComposing || event.repeat || !command.value.trim()) return;
  event.preventDefault();
  lines.value.push({
    text: command.value,
    kind: 'command',
    tone: 'normal',
    segments: segments.value.map((segment) => ({ ...segment })),
  });
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
</script>

<template>
  <div class="grid w-full min-w-0 gap-3">
    <div v-if="props.inlineControls" class="flex flex-wrap items-center gap-3">
      <div class="flex min-w-0 items-center gap-2">
        <label for="terminal-titlebar-select" class="text-caption text-secondary">
          {{ localize(copy.titlebarLabel, locale) }}
        </label>
        <UiSelect
          id="terminal-titlebar-select"
          data-terminal-titlebar-select
          :model-value="localTitlebar"
          :options="titlebarOptions"
          :aria-label="localize(copy.titlebarLabel, locale)"
          @update:model-value="selectTitlebar"
        />
      </div>
      <div class="flex min-w-0 items-center gap-2">
        <label for="terminal-icon-select" class="text-caption text-secondary">
          {{ localize(copy.hostIconLabel, locale) }}
        </label>
        <UiSelect
          id="terminal-icon-select"
          data-terminal-icon-select
          :model-value="localHostIcon"
          :options="hostIconOptions"
          :aria-label="localize(copy.hostIconLabel, locale)"
          @update:model-value="selectHostIcon"
        />
      </div>
    </div>

    <UiTerminalSurface
      v-if="!closed"
      title="neoverse / session"
      class="w-full"
      :titlebar="localTitlebar"
      :maximized="localMaximized"
      :density="props.density"
      :surface="props.surface"
      :close-label="localize(copy.closeWindow, locale)"
      :minimize-label="localize(copy.minimizeWindow, locale)"
      :maximize-label="localize(copy.maximizeWindow, locale)"
      :restore-label="localize(copy.restoreWindow, locale)"
      @window-action="handleWindowAction"
      @click="focusOnBackground"
    >
      <template #actions>
        <UiButton
          v-if="minimized"
          data-terminal-restore
          variant="ghost"
          size="sm"
          @click="minimized = false"
        >
          {{ localize(copy.restoreBody, locale) }}
        </UiButton>
        <UiButton variant="ghost" size="sm" @click="prompt?.focus()">
          {{ localize(copy.focusCommand, locale) }}
        </UiButton>
      </template>

      <UiTerminalTranscript v-show="!minimized" label="Terminal history" style="max-height: 9rem">
        <template v-for="(line, index) in lines" :key="index">
          <UiTerminalEcho
            v-if="line.kind === 'command'"
            :text="line.text"
            :segments="line.segments"
          />
          <UiTerminalLine v-else :text="line.text" :kind="line.kind" :tone="line.tone" />
        </template>
      </UiTerminalTranscript>
      <UiTerminalPrompt
        v-show="!minimized"
        ref="prompt"
        v-model="command"
        :suggestion="suggestion"
        :label="localize(copy.label, locale)"
        :segments="segments"
        :placeholder="localize(copy.placeholder, locale)"
        @keydown="submit"
      />
    </UiTerminalSurface>

    <div
      v-else
      class="flex flex-wrap items-center justify-between gap-3 text-caption text-secondary"
    >
      <span>{{ localize(copy.closedNotice, locale) }}</span>
      <UiButton data-terminal-reopen variant="secondary" size="sm" @click="closed = false">
        {{ localize(copy.reopen, locale) }}
      </UiButton>
    </div>
  </div>
</template>
