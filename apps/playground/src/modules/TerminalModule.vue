<script setup lang="ts">
import LabSpecimenSection from '../LabSpecimenSection.vue';
import MaterialBackdrop from '../MaterialBackdrop.vue';
import { localize, localized } from '../playground-content';
import TerminalTranscriptExample from '../previews/TerminalTranscriptExample.vue';
import type { LabModuleProps } from './types';

defineProps<LabModuleProps>();

const copy = {
  title: localized('Terminal composition', '终端组件组合'),
  description: localized(
    'Tokyo Night context with rounded transitions and a seamless command line.',
    'Tokyo Night 分段上下文，圆头衔接，下方直接输入命令。',
  ),
};
</script>

<template>
  <LabSpecimenSection
    id="terminal-composition"
    :title="localize(copy.title, locale)"
    :description="localize(copy.description, locale)"
  >
    <MaterialBackdrop edge="inset">
      <TerminalTranscriptExample :locale="locale" />
    </MaterialBackdrop>
  </LabSpecimenSection>
</template>
