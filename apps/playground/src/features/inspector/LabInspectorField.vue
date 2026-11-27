<script setup lang="ts">
import { type FormControlValue, UiButton, UiInput, UiSelect, UiSwitch } from '@neoverse-ui/vue';
import { computed } from 'vue';
import { type Locale, localize, localized } from '../../content/playground-content';
import type { SpecimenField } from '../specimens/lab-specimen-config';

const props = defineProps<{ field: SpecimenField; locale: Locale }>();
const emit = defineEmits<{ edit: [value: unknown] }>();
const id = computed(() => `inspector-control-${props.field.source}-${props.field.key}`);
const inheritOption = -1;
const copy = {
  default: localized('Component default', '组件默认值'),
  modified: localized('Modified', '已修改'),
  inherit: localized('Use component default', '使用组件默认值'),
};
const label = computed(() => localize(props.field.label, props.locale));
const options = computed(() => {
  const { field, locale } = props;
  if (field.kind !== 'select') return [];
  const choices = field.options.map(({ value, label }) => ({
    value,
    label: localize(label, locale),
  }));
  return field.inherits
    ? [{ value: inheritOption, label: localize(copy.default, locale) }, ...choices]
    : choices;
});

function choose(value: FormControlValue): void {
  emit('edit', value === inheritOption ? undefined : value);
}

function updateNumber(event: Event): void {
  if (event.currentTarget instanceof HTMLInputElement) {
    emit('edit', event.currentTarget.valueAsNumber);
  }
}
</script>

<template>
  <div class="grid min-w-0 gap-1" :data-specimen-control="field.key">
    <UiSwitch
      v-if="field.kind === 'boolean'"
      :model-value="field.value === true"
      :disabled="field.disabled"
      @update:model-value="emit('edit', $event)"
    >
      {{ label }}
    </UiSwitch>
    <template v-else>
      <label :for="id" class="text-body-sm text-primary">{{ label }}</label>
      <UiSelect
        v-if="field.kind === 'select'"
        :id="id"
        :aria-label="label"
        :model-value="typeof field.value === 'string' ? field.value : inheritOption"
        :options="options"
        :disabled="field.disabled"
        class="w-full min-w-0"
        @update:model-value="choose"
      />
      <UiInput
        v-else-if="field.kind === 'text'"
        :id="id"
        :model-value="typeof field.value === 'string' ? field.value : ''"
        :disabled="field.disabled"
        @update:model-value="emit('edit', $event)"
      />
      <input
        v-else
        :id="id"
        type="range"
        :min="field.min"
        :max="field.max"
        step="any"
        :value="typeof field.value === 'number' ? field.value : undefined"
        :disabled="field.disabled"
        @input="updateNumber"
      >
    </template>
    <p v-if="field.edited" class="text-caption text-secondary">
      {{ localize(copy.modified, locale) }}
    </p>
    <template v-if="field.inherits && field.kind !== 'select'">
      <UiButton
        v-if="field.edited"
        size="sm"
        variant="ghost"
        surface="none"
        class="justify-self-start"
        @click="emit('edit', undefined)"
      >
        {{ localize(copy.inherit, locale) }}
      </UiButton>
      <p v-else class="text-caption text-secondary">{{ localize(copy.default, locale) }}</p>
    </template>
  </div>
</template>
