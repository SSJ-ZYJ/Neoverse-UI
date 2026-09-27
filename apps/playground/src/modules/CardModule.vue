<script setup lang="ts">
import { UiBadge, UiButton, UiCard, UiSurface } from '@neoverse-ui/vue';
import LabIcon from '../LabIcon.vue';
import MaterialBackdrop from '../MaterialBackdrop.vue';
import { localize, moduleCopy } from '../playground-content';
import type { LabModuleProps } from './types';

const props = defineProps<LabModuleProps>();
const copy = moduleCopy.card;
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
  </div>
</template>
