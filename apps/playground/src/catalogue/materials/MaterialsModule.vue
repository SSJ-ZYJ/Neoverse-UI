<script setup lang="ts">
import { UiButton, UiCard, UiControlSurface, UiSurface } from '@neoverse-ui/vue';
import { localize, localized, moduleCopy } from '../../content/playground-content';
import type { LabModuleProps } from '../../features/catalogue/types';
import {
  CoreMaterialPreview,
  coreMaterialCopy,
  coreMaterialModes,
} from '../../features/specimens/materials';
import LabSpecimenSection from '../../features/stage/LabSpecimenSection.vue';
import MaterialFoundationMatrix from './MaterialFoundationMatrix.vue';
import SurfaceModule from './SurfaceModule.vue';

const props = defineProps<LabModuleProps>();
const foundationCopy = {
  title: localized('Material foundation matrix', '材质基础验证矩阵'),
  description: localized(
    'Verify Solid, Frosted, and Aurora Glass across all surface roles, five backdrop types, nesting ownership, and interactive states.',
    '在全部表面角色、五类背景、嵌套所有权与交互状态下对照验证实体、磨砂与极光玻璃。',
  ),
} as const;
const materialCopy = {
  title: localized('Material resolution', '材质解析'),
  panel: localized('Panel', '表面'),
  controls: localized('Grouped controls', '成组控件'),
  button: localized('Continue', '继续'),
  borrowed: localized('Borrow Glass ancestry', '借用上层极光玻璃'),
} as const;
</script>

<template>
  <LabSpecimenSection
    id="materials-surface"
    :title="localize(moduleCopy.surface.label, props.locale)"
    :description="localize(moduleCopy.surface.description, props.locale)"
  >
    <SurfaceModule :locale="props.locale" />
  </LabSpecimenSection>
  <LabSpecimenSection
    id="materials-core"
    :title="localize(coreMaterialCopy.label, props.locale)"
    :description="localize(coreMaterialCopy.description, props.locale)"
  >
    <div class="grid min-w-0 gap-3">
      <div class="playground-core-material-grid grid min-w-0 gap-3">
        <CoreMaterialPreview
          v-for="mode in coreMaterialModes"
          :key="mode"
          :mode="mode"
          :locale="props.locale"
        />
      </div>
      <div class="flex flex-wrap gap-3 text-body-sm text-primary">
        <a class="underline" :href="`/frame?theme=light&lang=${props.locale}#materials-core`">{{
          localize(localized('Compare in light theme', '对照浅色主题'), props.locale)
        }}</a>
        <a class="underline" :href="`/frame?theme=dark&lang=${props.locale}#materials-core`">{{
          localize(localized('Compare in dark theme', '对照深色主题'), props.locale)
        }}</a>
      </div>
    </div>
  </LabSpecimenSection>
  <LabSpecimenSection
    id="materials-foundation"
    :title="localize(foundationCopy.title, props.locale)"
    :description="localize(foundationCopy.description, props.locale)"
  >
    <MaterialFoundationMatrix :locale="props.locale" />
  </LabSpecimenSection>
  <section
    id="materials-resolution"
    class="grid gap-3 p-4 scroll-mt-24"
    aria-labelledby="materials-resolution-title"
  >
    <h3 id="materials-resolution-title" class="text-subtitle font-heading text-primary">
      {{ localize(materialCopy.title, props.locale) }}
    </h3>
    <div class="grid gap-3">
      <div class="flex flex-wrap items-center gap-3">
        <UiCard data-contract-material="card">
          {{ localize(materialCopy.panel, props.locale) }}
          <UiSurface surface="glass-subtle" glass-nesting="inherit" data-contract-material="borrow">
            {{ localize(materialCopy.borrowed, props.locale) }}
          </UiSurface>
        </UiCard>
        <UiControlSurface
          data-contract-material="group"
          :aria-label="localize(materialCopy.controls, props.locale)"
        >
          <UiButton data-contract-material="button">{{
            localize(materialCopy.button, props.locale)
          }}</UiButton>
        </UiControlSurface>
      </div>
      <div class="flex flex-wrap gap-3" data-neoverse-material="solid">
        <UiCard data-contract-material="solid">Solid</UiCard>
        <UiCard data-neoverse-material="glass" data-contract-material="nested-glass"
          >Aurora Glass</UiCard
        >
        <UiCard surface="glass-immersive" data-contract-material="explicit-glass"
          >glass-immersive</UiCard
        >
        <UiCard surface="none" data-contract-material="none">none</UiCard>
      </div>
    </div>
  </section>
</template>
