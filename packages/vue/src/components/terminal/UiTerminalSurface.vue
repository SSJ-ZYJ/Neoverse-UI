<script setup lang="ts">
import { computed, onMounted, ref, useAttrs } from 'vue';
import type { TerminalSurfaceProps, TerminalWindowAction } from '../../types';
import UiSurface from '../surfaces/UiSurface.vue';
import TerminalSegmentIconGlyph from './TerminalSegmentIconGlyph.vue';
import TerminalWindowControls from './TerminalWindowControls.vue';
import {
  readTerminalNavigatorHints,
  resolveTerminalTitlebar,
  type TerminalNavigatorHints,
} from './terminal-environment';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<TerminalSurfaceProps>(), {
  density: 'compact',
  surface: 'auto',
  titlebar: 'default',
  maximized: false,
  closeLabel: 'Close window',
  minimizeLabel: 'Minimize window',
  maximizeLabel: 'Maximize window',
  restoreLabel: 'Restore window',
});
const emit = defineEmits<{
  windowAction: [action: TerminalWindowAction];
}>();

const attrs = useAttrs();
const browserHints = ref<TerminalNavigatorHints | undefined>(undefined);
const hydrated = ref(false);
onMounted(() => {
  // Resolve `auto` after mount so SSR HTML and initial hydration agree on `default`.
  browserHints.value = readTerminalNavigatorHints();
  hydrated.value = true;
});

const activeTitlebar = computed(() => {
  if (props.titlebar === 'auto' && !hydrated.value) return 'default';
  return resolveTerminalTitlebar(props.titlebar, browserHints.value);
});

const forwardedAttrs = computed(() => {
  const { class: _class, style: _style, ...rest } = attrs;
  return rest;
});
</script>

<template>
  <UiSurface
    as="section"
    v-bind="forwardedAttrs"
    :class="['ui-terminal-surface', attrs.class]"
    :style="attrs.style"
    :surface="props.surface"
    :aria-label="props.ariaLabel ?? props.title"
    :data-density="props.density"
    :data-titlebar="activeTitlebar"
    :data-maximized="props.maximized ? 'true' : undefined"
  >
    <header class="ui-terminal-surface__header">
      <slot name="header">
        <template v-if="activeTitlebar === 'default'">
          <span class="ui-terminal-surface__title">{{ props.title }}</span>
          <div v-if="$slots.status" class="ui-terminal-surface__status"><slot name="status" /></div>
          <div
            v-if="$slots.actions"
            class="ui-terminal-surface__actions"
            role="toolbar"
            :aria-label="`${props.title} actions`"
          >
            <slot name="actions" />
          </div>
        </template>
        <template v-else-if="activeTitlebar === 'macos'">
          <TerminalWindowControls
            variant="macos"
            :maximized="props.maximized"
            :close-label="props.closeLabel"
            :minimize-label="props.minimizeLabel"
            :maximize-label="props.maximizeLabel"
            :restore-label="props.restoreLabel"
            :group-label="`${props.title} window controls`"
            @action="emit('windowAction', $event)"
          />
          <div class="ui-terminal-surface__title-group">
            <span class="ui-terminal-surface__title">{{ props.title }}</span>
            <div v-if="$slots.status" class="ui-terminal-surface__status">
              <slot name="status" />
            </div>
          </div>
          <div
            v-if="$slots.actions"
            class="ui-terminal-surface__actions"
            role="toolbar"
            :aria-label="`${props.title} actions`"
          >
            <slot name="actions" />
          </div>
        </template>
        <template v-else-if="activeTitlebar === 'windows'">
          <div class="ui-terminal-surface__title-group">
            <span class="ui-terminal-surface__app-icon" aria-hidden="true">
              <TerminalSegmentIconGlyph name="windows-terminal" />
            </span>
            <span class="ui-terminal-surface__title">{{ props.title }}</span>
            <div v-if="$slots.status" class="ui-terminal-surface__status">
              <slot name="status" />
            </div>
          </div>
          <div
            v-if="$slots.actions"
            class="ui-terminal-surface__actions"
            role="toolbar"
            :aria-label="`${props.title} actions`"
          >
            <slot name="actions" />
          </div>
          <TerminalWindowControls
            variant="windows"
            :maximized="props.maximized"
            :close-label="props.closeLabel"
            :minimize-label="props.minimizeLabel"
            :maximize-label="props.maximizeLabel"
            :restore-label="props.restoreLabel"
            :group-label="`${props.title} window controls`"
            @action="emit('windowAction', $event)"
          />
        </template>
        <template v-else>
          <div
            v-if="$slots.actions"
            class="ui-terminal-surface__actions"
            role="toolbar"
            :aria-label="`${props.title} actions`"
          >
            <slot name="actions" />
          </div>
          <div class="ui-terminal-surface__title-group">
            <span class="ui-terminal-surface__title">{{ props.title }}</span>
            <div v-if="$slots.status" class="ui-terminal-surface__status">
              <slot name="status" />
            </div>
          </div>
          <TerminalWindowControls
            variant="linux"
            :maximized="props.maximized"
            :close-label="props.closeLabel"
            :minimize-label="props.minimizeLabel"
            :maximize-label="props.maximizeLabel"
            :restore-label="props.restoreLabel"
            :group-label="`${props.title} window controls`"
            @action="emit('windowAction', $event)"
          />
        </template>
      </slot>
    </header>
    <div class="ui-terminal-surface__body"><slot /></div>
  </UiSurface>
</template>
