<script setup lang="ts">
import { type CardProps, UiCard, UiSurface } from '@neoverse-ui/vue';
import { localize, localized, moduleCopy } from '../../content/playground-content';
import type { LabModuleProps } from '../../features/catalogue/types';
import LabSpecimenSection from '../../features/stage/LabSpecimenSection.vue';
import QaPreviewMatrix from '../../features/stage/QaPreviewMatrix.vue';
import MaterialBackdrop from './MaterialBackdrop.vue';
import ReferenceCardContent from './ReferenceCardContent.vue';

const props = defineProps<LabModuleProps>();
const copy = moduleCopy.card;
const surfaceExamples = [
  { id: 'default', cardProps: {}, ...copy.defaultExample },
  { id: 'elevated', cardProps: { surface: 'elevated' }, ...copy.elevatedExample },
  { id: 'transparent', cardProps: { surface: 'none' }, ...copy.transparentExample },
] as const satisfies readonly {
  id: string;
  cardProps: Pick<CardProps, 'surface'>;
  label: typeof copy.label;
  description: typeof copy.description;
}[];
const qaCopy = {
  label: localized('Card backdrop QA', '卡片背景 QA'),
  hint: localized(
    'The default Aurora Glass · Standard card is repeated across the shared QA backdrop contexts.',
    '在共享 QA 背景环境中重复检查默认的极光玻璃 · 标准卡片。',
  ),
} as const;
</script>

<template>
  <div class="grid gap-grid">
    <LabSpecimenSection
      id="card-card"
      :title="localize(copy.surfaceLabel, props.locale)"
      :description="localize(copy.surfaceDescription, props.locale)"
    >
      <MaterialBackdrop>
        <div class="playground-preview-columns">
          <div
            v-for="example in surfaceExamples"
            :key="example.id"
            :data-specimen-card-surface="example.id"
            class="grid min-w-0 content-start gap-2"
          >
            <div class="grid gap-1 px-1">
              <h4 class="text-label-sm font-label text-primary">
                {{ localize(example.label, props.locale) }}
              </h4>
              <p class="text-caption text-secondary">
                {{ localize(example.description, props.locale) }}
              </p>
            </div>
            <UiSurface
              :surface="example.id === 'transparent' ? 'subtle' : 'none'"
              class="rounded-card p-1"
            >
              <UiCard
                v-bind="example.cardProps"
                :data-card-default="example.id === 'default' ? '' : undefined"
                :data-card-transparent-optout="example.id === 'transparent' ? '' : undefined"
              >
                <ReferenceCardContent :locale="props.locale" presentation="gallery" />
              </UiCard>
            </UiSurface>
          </div>
        </div>
      </MaterialBackdrop>

      <div class="mt-3 grid gap-2" data-card-qa>
        <div class="grid gap-1 px-1">
          <h4 class="text-label-sm font-label text-primary">
            {{ localize(qaCopy.label, props.locale) }}
          </h4>
          <p class="text-caption text-secondary">
            {{ localize(qaCopy.hint, props.locale) }}
          </p>
        </div>
        <QaPreviewMatrix :locale="props.locale">
          <UiCard class="w-full max-w-container-sm">
            <ReferenceCardContent :locale="props.locale" presentation="qa" />
          </UiCard>
        </QaPreviewMatrix>
      </div>
    </LabSpecimenSection>
  </div>
</template>
