<script setup lang="ts">
import { UiBadge, UiButton, UiCard, UiSurface } from '@neoverse-ui/vue';
import LabIcon from '../LabIcon.vue';
import MaterialBackdrop from '../MaterialBackdrop.vue';
import { localize, localized, moduleCopy } from '../playground-content';
import QaPreviewMatrix from '../QaPreviewMatrix.vue';
import type { LabModuleProps } from './types';

const props = defineProps<LabModuleProps>();
const copy = moduleCopy.card;
const qaCopy = {
  label: localized('Card backdrop QA', '卡片背景 QA'),
  hint: localized(
    'The default elevated Glass card is repeated across the shared QA backdrop contexts.',
    '在共享 QA 背景环境中重复检查默认高层级玻璃卡片。',
  ),
} as const;
</script>

<template>
  <div id="card-card" class="scroll-mt-24">
    <MaterialBackdrop>
      <div class="grid gap-grid md:grid-cols-2">
        <UiCard data-card-default>
          <div class="grid gap-3">
            <div class="flex items-center justify-between gap-3">
              <div class="flex items-center gap-2">
                <LabIcon name="spark" />
                <h3 class="text-label font-label text-primary">
                  {{ localize(copy.reference, props.locale) }}
                </h3>
              </div>
              <UiBadge variant="success">{{ localize(copy.ready, props.locale) }}</UiBadge>
            </div>
            <p class="text-body text-secondary">{{ localize(copy.body, props.locale) }}</p>
            <UiButton variant="ghost" class="justify-self-start">
              {{ localize(copy.continue, props.locale) }}
              <template #trailing><LabIcon name="arrow-right" /></template>
            </UiButton>
          </div>
        </UiCard>
        <UiCard surface="elevated" class="max-w-container-md">
          <div class="grid gap-2">
            <h3 class="text-label font-label text-primary">
              {{ localize(copy.externalClass, props.locale) }}
            </h3>
            <p class="text-caption text-secondary">
              {{ localize(copy.externalBody, props.locale) }}
            </p>
          </div>
        </UiCard>
        <UiSurface surface="subtle" class="max-w-container-md rounded-card p-1">
          <UiCard data-card-transparent-optout surface="none">
            <div class="grid gap-2">
              <h3 class="text-label font-label text-primary">
                {{ localize(copy.glassCard, props.locale) }}
              </h3>
              <p class="text-caption text-secondary">
                {{ localize(copy.glassCardBody, props.locale) }}
              </p>
            </div>
          </UiCard>
        </UiSurface>
      </div>
    </MaterialBackdrop>

    <div class="mt-3 grid gap-2" data-card-qa>
      <div class="grid gap-1 px-1">
        <h3 class="text-label-sm font-label text-primary">
          {{ localize(qaCopy.label, props.locale) }}
        </h3>
        <p class="text-caption text-secondary">
          {{ localize(qaCopy.hint, props.locale) }}
        </p>
      </div>
      <QaPreviewMatrix :locale="props.locale">
        <UiCard class="w-full max-w-container-sm">
          <div class="grid gap-3">
            <div class="flex items-center justify-between gap-3">
              <h4 class="text-label font-label text-primary">
                {{ localize(copy.reference, props.locale) }}
              </h4>
              <UiBadge variant="success">{{ localize(copy.ready, props.locale) }}</UiBadge>
            </div>
            <p class="text-caption text-secondary">
              {{ localize(copy.body, props.locale) }}
            </p>
          </div>
        </UiCard>
      </QaPreviewMatrix>
    </div>
  </div>
</template>
