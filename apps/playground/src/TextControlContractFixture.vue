<script setup lang="ts">
import { UiField, UiInput, UiSelect, UiTextarea } from '@neoverse-ui/vue';
import { ref } from 'vue';

const text = ref('Initial');
const notes = ref('Initial notes');
const locked = ref<'none' | 'readonly' | 'disabled'>('none');
const hints = ref(true);
const requests = ref(0);
const options = [
  { value: 'native', label: 'Native' },
  { value: 'unavailable', label: 'Unavailable', disabled: true },
  { value: 'remote', label: 'Remote' },
];
</script>

<template>
  <form data-text-contract-form class="grid gap-3" @submit.prevent>
    <UiField
      v-slot="{ controlAttrs }"
      control-id="contract-text"
      label="Contract text"
      :description="hints ? 'Text is included in the form.' : ''"
      :message="hints ? 'Review this value.' : ''"
      validation="error"
      required
      :disabled="locked === 'disabled'"
    >
      <UiInput
        v-bind="controlAttrs"
        v-model="text"
        name="text"
        validation="error"
        :readonly="locked === 'readonly'"
      />
    </UiField>
    <UiField v-slot="{ controlAttrs }" control-id="contract-notes" label="Contract notes">
      <UiTextarea
        v-bind="controlAttrs"
        v-model="notes"
        name="notes"
        rows="3"
        validation="warning"
        :disabled="locked === 'disabled'"
        :readonly="locked === 'readonly'"
      />
    </UiField>
    <UiSelect
      model-value="native"
      :options="options"
      name="selection"
      aria-label="Contract selection"
      :disabled="locked === 'disabled'"
      :readonly="locked === 'readonly'"
      @update:model-value="requests += 1"
    />
    <div class="flex flex-wrap gap-2">
      <button type="button" data-text-toggle-hints @click="hints = !hints">Toggle hints</button>
      <button type="button" data-text-readonly @click="locked = 'readonly'">Readonly</button>
      <button type="button" data-text-disabled @click="locked = 'disabled'">Disabled</button>
      <button type="button" data-text-editable @click="locked = 'none'">Editable</button>
    </div>
    <output data-text-value>{{ text }}</output>
    <output data-notes-value>{{ notes }}</output>
    <output data-select-requests>{{ requests }}</output>
  </form>
</template>
