<script setup lang="ts">
import { UiPopover } from '@neoverse-ui/vue';
import { ref } from 'vue';
import MaterialBackdrop from '../MaterialBackdrop.vue';
import { DropdownPreview, PopoverPreview } from '../previews/overlays';
import type { LabModuleProps } from './types';

const props = defineProps<LabModuleProps>();

const contractMode = new URLSearchParams(window.location.search).has('contract-fixtures');
const controlledOpen = ref(false);
const controlledMounted = ref(true);
const controlledDisabled = ref(false);
const dropdownDisabled = ref(false);
const dismissAttempts = ref(0);

function requestControlledOpen(value: boolean) {
  if (value) controlledOpen.value = true;
  else dismissAttempts.value += 1;
}
</script>

<template>
  <MaterialBackdrop edge="inset">
    <div class="flex min-h-40 flex-wrap items-start gap-4" data-contract-state="default">
      <PopoverPreview :locale="props.locale" />
      <DropdownPreview
        id="overlays-dropdown-menu"
        :locale="props.locale"
        :contract-mode="contractMode"
        :disabled="dropdownDisabled"
      />
      <div v-if="contractMode" data-overlay-controlled>
        <UiPopover
          v-if="controlledMounted"
          :open="controlledOpen"
          :disabled="controlledDisabled"
          aria-label="Controlled details"
          data-overlay-controlled-popover
          @update:open="requestControlledOpen"
        >
          <template #trigger>Controlled popover</template>
          <p>Parent retains open state after a dismiss request.</p>
        </UiPopover>
        <button type="button" data-overlay-unmount @click="controlledMounted = false">
          Unmount overlay
        </button>
        <button
          type="button"
          data-overlay-toggle-disabled
          @click="controlledDisabled = !controlledDisabled"
        >
          Toggle controlled disabled
        </button>
        <button
          type="button"
          data-overlay-toggle-menu-disabled
          @click="dropdownDisabled = !dropdownDisabled"
        >
          Toggle menu disabled
        </button>
        <output data-overlay-dismiss-attempts>{{ dismissAttempts }}</output>
      </div>
    </div>
  </MaterialBackdrop>
</template>
