<script setup lang="ts">
import {
  UiButton,
  UiCard,
  UiIconButton,
  UiInput,
  UiSegmentedControl,
  UiSelect,
} from '@neoverse-ui/vue';
import { computed, onMounted, ref, watch } from 'vue';
import LabIcon from '../LabIcon.vue';
import { localize, localized, moduleCopy } from '../playground-content';
import QaPreviewMatrix from '../QaPreviewMatrix.vue';
import StateRow from '../StateRow.vue';
import type { LabModuleProps } from './types';

const props = defineProps<LabModuleProps>();
const copy = moduleCopy.button;
const tiers = ['glass-subtle', 'glass-elevated', 'glass-immersive'] as const;
const customTier = ref('glass-elevated');
const customBlur = ref('');
const customAlpha = ref('');
const customOptions = tiers.map((value) => ({ value, label: value }));
function resetCustom() {
  const style = getComputedStyle(document.documentElement);
  customBlur.value = style
    .getPropertyValue(`--neoverse-material-${customTier.value}-blur`)
    .trim()
    .replace('px', '');
  customAlpha.value = style
    .getPropertyValue(`--neoverse-material-${customTier.value}-transparency`)
    .trim()
    .replace('%', '');
}
onMounted(resetCustom);
watch(customTier, resetCustom);
const customStyle = computed(() => ({
  [`--neoverse-material-${customTier.value}-blur`]: `${Math.max(0, Math.min(64, Number(customBlur.value)))}px`,
  [`--neoverse-material-${customTier.value}-transparency`]: `${Math.max(0, Math.min(100, Number(customAlpha.value)))}%`,
}));
const clicks = ref(0);
const selection = ref('one');
const options = [
  { value: 'one', label: 'One' },
  { value: 'two', label: 'Two' },
];
const surfaceCopy = {
  label: localized('Surface ownership', 'Surface 归属'),
  hint: localized(
    'surface="none" removes the control plate when a parent composition already owns the material.',
    '当父级组合已经负责材质时，surface="none" 会移除控件自身的表面。',
  ),
} as const;
const qaCopy = {
  label: localized('Canonical QA', '规范 QA'),
  hint: localized(
    'Compare the same button hierarchy across gradient, neutral, and reduced-transparency contexts.',
    '在渐变、中性与降低透明度环境中对比同一组按钮层级。',
  ),
} as const;
</script>

<template>
  <StateRow
    :label="localized('Three material tiers', '三档材质')"
    :hint="localized('Identical backdrop; each preset can be overridden through CSS tokens.', '同一背景对比；每档支持 CSS token 覆盖。')"
    :locale="props.locale"
  >
    <div v-for="tier in tiers" :key="tier" class="grid gap-3">
      <UiButton :surface="tier" @click="clicks += 1">{{ tier }}</UiButton>
      <UiButton :surface="tier" variant="secondary">Secondary</UiButton>
      <UiSegmentedControl
        v-model="selection"
        :surface="tier"
        :options="options"
        :aria-label="tier"
      />
      <UiCard :surface="tier"><span>{{ tier }}</span></UiCard>
    </div>
  </StateRow>
  <StateRow
    :label="localized('Customize a tier', '自定义档位')"
    :hint="localized('Only this region changes; all children share the selected tier tokens.', '仅修改本区域；内部组件复用所选档位 token。')"
    :locale="props.locale"
  >
    <div class="grid gap-3" data-material-custom-controls>
      <UiSelect
        v-model="customTier"
        :options="customOptions"
        :aria-label="props.locale === 'zh' ? '自定义档位' : 'Custom tier'"
      />
      <label for="material-custom-blur" class="grid gap-1 text-caption text-secondary"
        >{{ props.locale === 'zh' ? '模糊（px）' : 'Blur (px)' }}
        <UiInput
          id="material-custom-blur"
          v-model="customBlur"
          type="number"
          min="0"
          max="64"
          data-custom-blur
        /></label
      >
      <label for="material-custom-alpha" class="grid gap-1 text-caption text-secondary"
        >{{ props.locale === 'zh' ? '背景不透明度（%）' : 'Background opacity (%)' }}
        <UiInput
          id="material-custom-alpha"
          v-model="customAlpha"
          type="number"
          min="0"
          max="100"
          data-custom-alpha
        /></label
      >
      <UiButton surface="none" @click="resetCustom"
        >{{ props.locale === 'zh' ? '恢复规范值' : 'Reset to standard' }}</UiButton
      >
    </div>
    <div class="grid gap-3" :style="customStyle" data-material-custom-preview>
      <UiButton :surface="customTier as typeof tiers[number]"
        >{{ props.locale === 'zh' ? '自定义按钮' : 'Custom button' }}</UiButton
      >
      <UiCard :surface="customTier as typeof tiers[number]"
        >{{ props.locale === 'zh' ? '自定义卡片' : 'Custom card' }}</UiCard
      >
    </div>
  </StateRow>
  <StateRow
    :label="localized('Hover and press', '悬停与按下')"
    :hint="localized('Hover, hold, release, or focus with Tab. Activation updates the counter once.', '悬停、按住、松开，或用 Tab 聚焦；每次激活计数一次。')"
    :locale="props.locale"
  >
    <UiButton @click="clicks += 1"
      >{{ props.locale === 'zh' ? '交互验证' : 'Interaction' }}
      · {{ clicks }}</UiButton
    >
    <UiButton disabled>{{ props.locale === 'zh' ? '禁用' : 'Disabled' }}</UiButton>
    <UiButton loading>{{ props.locale === 'zh' ? '加载中' : 'Loading' }}</UiButton>
  </StateRow>
  <StateRow
    :label="copy.states.default.label"
    :hint="copy.states.default.hint"
    :locale="props.locale"
    contract-state="default"
  >
    <UiButton>{{ localize(copy.controls.default, props.locale) }}</UiButton>
    <UiButton variant="secondary">{{ localize(copy.controls.secondary, props.locale) }}</UiButton>
    <UiButton variant="ghost">{{ localize(copy.controls.ghost, props.locale) }}</UiButton>
  </StateRow>
  <StateRow
    :label="copy.states.hover.label"
    :hint="copy.states.hover.hint"
    :locale="props.locale"
    contract-state="hover"
  >
    <UiButton>{{ localize(copy.controls.hover, props.locale) }}</UiButton>
  </StateRow>
  <StateRow
    :label="copy.states.active.label"
    :hint="copy.states.active.hint"
    :locale="props.locale"
    contract-state="active"
  >
    <UiButton>{{ localize(copy.controls.active, props.locale) }}</UiButton>
  </StateRow>
  <StateRow
    :label="copy.states.focus.label"
    :hint="copy.states.focus.hint"
    :locale="props.locale"
    contract-state="focus"
  >
    <UiButton>{{ localize(copy.controls.focus, props.locale) }}</UiButton>
  </StateRow>
  <StateRow :label="copy.states.disabled.label" :locale="props.locale" contract-state="disabled">
    <UiButton disabled>{{ localize(copy.controls.disabled, props.locale) }}</UiButton>
  </StateRow>
  <StateRow
    :label="copy.states.loading.label"
    :hint="copy.states.loading.hint"
    :locale="props.locale"
    contract-state="loading"
  >
    <UiButton loading>{{ localize(copy.controls.loading, props.locale) }}</UiButton>
  </StateRow>
  <StateRow
    :label="copy.states.stretch.label"
    :hint="copy.states.stretch.hint"
    :locale="props.locale"
  >
    <div class="flex h-8 w-full items-stretch gap-2">
      <UiButton stretch>{{ localize(copy.controls.stretchPrimary, props.locale) }}</UiButton>
      <UiButton variant="ghost" stretch>
        {{ localize(copy.controls.stretchSecondary, props.locale) }}
      </UiButton>
      <UiIconButton stretch :label="localize(copy.controls.stretchPrimary, props.locale)">
        <LabIcon name="plus" />
      </UiIconButton>
    </div>
  </StateRow>
  <StateRow :label="surfaceCopy.label" :hint="surfaceCopy.hint" :locale="props.locale">
    <UiButton surface="none">{{ localize(copy.controls.default, props.locale) }}</UiButton>
    <UiButton surface="none" variant="secondary">
      {{ localize(copy.controls.secondary, props.locale) }}
    </UiButton>
    <UiButton surface="none" variant="ghost">
      {{ localize(copy.controls.ghost, props.locale) }}
    </UiButton>
  </StateRow>
  <StateRow :label="qaCopy.label" :hint="qaCopy.hint" :locale="props.locale">
    <QaPreviewMatrix :locale="props.locale">
      <UiButton>{{ localize(copy.controls.default, props.locale) }}</UiButton>
      <UiButton variant="secondary">{{ localize(copy.controls.secondary, props.locale) }}</UiButton>
      <UiButton variant="ghost">{{ localize(copy.controls.ghost, props.locale) }}</UiButton>
    </QaPreviewMatrix>
  </StateRow>
</template>
