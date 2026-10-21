<script setup lang="ts">
import { UiDropdownMenu, UiPopover } from '@neoverse-ui/vue';
import { computed, ref } from 'vue';
import MaterialBackdrop from '../MaterialBackdrop.vue';
import { localize, localized } from '../playground-content';
import type { LabModuleProps } from './types';

const props = defineProps<LabModuleProps>();

const selectedAction = ref('');
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

const copy = {
  popoverTrigger: localized('Open popover', '打开弹层'),
  popoverLabel: localized('Popover example', '弹层示例'),
  popoverBody: localized(
    'Top-layer positioning, light dismiss, viewport clamping, and Motion are shared by one overlay runtime.',
    '顶层定位、轻量关闭、视口约束与 Motion 均复用同一套 Overlay Runtime。',
  ),
  menuTrigger: localized('Open menu', '打开菜单'),
  menuLabel: localized('Project actions', '项目操作'),
  open: localized('Open', '打开'),
  archive: localized('Archive', '归档'),
  remove: localized('Remove', '移除'),
  selected: localized('Selected action', '已选择操作'),
} as const;

const menuItems = computed(() => [
  { id: 'open', label: localize(copy.open, props.locale) },
  { id: 'archive', label: localize(copy.archive, props.locale) },
  ...(contractMode ? [{ id: 'disabled', label: 'Disabled action', disabled: true }] : []),
  { id: 'remove', label: localize(copy.remove, props.locale), tone: 'danger' as const },
]);
</script>

<template>
  <MaterialBackdrop edge="inset">
    <div class="flex min-h-40 flex-wrap items-start gap-4" data-contract-state="default">
      <UiPopover
        v-bind="{ ariaLabel: localize(copy.popoverLabel, props.locale) }"
        data-overlay-popover
      >
        <template #trigger>
          {{ localize(copy.popoverTrigger, props.locale) }}
        </template>

        <p class="max-w-container-xs p-2 text-body-sm text-secondary">
          {{ localize(copy.popoverBody, props.locale) }}
        </p>
      </UiPopover>

      <UiDropdownMenu
        v-bind="{ ariaLabel: localize(copy.menuLabel, props.locale) }"
        :items="menuItems"
        :disabled="dropdownDisabled"
        data-overlay-dropdown
        @select="selectedAction = $event.id"
      >
        <template #trigger>
          {{ localize(copy.menuTrigger, props.locale) }}
        </template>
      </UiDropdownMenu>

      <output class="w-full text-caption text-secondary" aria-live="polite" data-overlay-selection>
        {{ localize(copy.selected, props.locale) }}: {{ selectedAction || '—' }}
      </output>
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
