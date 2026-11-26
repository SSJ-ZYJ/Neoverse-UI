<script setup lang="ts">
import { bridgePortalMaterialScope, isKeyboardModality } from '@neoverse-ui/overlay-runtime';
import { getSurfaceClass } from '@neoverse-ui/tokens';
import { ref, useId, watchPostEffect } from 'vue';
import type { ContextMenuItem, ContextMenuProps } from '../../types';
import { presence } from '../motion/presence';
import {
  contextMenuCheckableState,
  contextMenuItemRole,
  createContextMenuState,
  isContextMenuItem,
} from './useContextMenu';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<ContextMenuProps>(), { autoFocus: true });
const emit = defineEmits<{
  'update:open': [value: boolean];
  select: [item: ContextMenuItem];
}>();

const panelRef = ref<HTMLElement | null>(null);
const materialHost = ref<HTMLDivElement | null>(null);
const submenuRef = ref<HTMLElement | null>(null);
const panelId = `${useId()}-context-menu`;
const submenuId = `${useId()}-context-submenu`;
const panelMaterial = getSurfaceClass('auto', 'overlay');

const {
  openSubmenu,
  submenuContent,
  visibleEntries,
  submenuEntries,
  onPanelToggle,
  selectItem,
  enterSubmenu,
  onItemPointerMove,
  onMenuKeydown,
} = createContextMenuState({
  panelRef,
  submenuRef,
  props,
  onUpdateOpen: (value) => emit('update:open', value),
  onSelect: (item) => emit('select', item),
});

watchPostEffect((onCleanup) => {
  const host = materialHost.value;
  const source = props.focusReturn ?? host?.parentElement;
  if (!host || !source) return;
  const disconnect = bridgePortalMaterialScope(source, host);
  if (disconnect) onCleanup(disconnect);
});

watchPostEffect((onCleanup) => {
  if (!panelRef.value || !submenuRef.value) return;
  const disconnect = bridgePortalMaterialScope(panelRef.value, submenuRef.value);
  if (disconnect) onCleanup(disconnect);
});
</script>

<template>
  <div ref="materialHost" class="ui-overlay-portal">
    <div
      ref="panelRef"
      v-bind="{ ...$attrs, ...presence('pop', 'top') }"
      :id="panelId"
      class="ui-overlay-panel ui-context-menu nv-presence"
      :class="panelMaterial"
      data-surface="auto"
      popover="manual"
      role="menu"
      :aria-label="props.ariaLabel"
      @toggle="onPanelToggle"
      @keydown="onMenuKeydown"
    >
      <div class="ui-context-menu__level" role="none">
        <template
          v-for="(entry, index) in visibleEntries"
          :key="'id' in entry && entry.id ? entry.id : index"
        >
          <hr
            v-if="'type' in entry && entry.type === 'separator'"
            class="ui-context-menu__separator"
          >
          <p
            v-else-if="'type' in entry && entry.type === 'heading'"
            class="ui-context-menu__heading"
          >
            {{ entry.label }}
          </p>
          <button
            v-else-if="isContextMenuItem(entry)"
            class="ui-context-menu__item"
            type="button"
            tabindex="-1"
            :role="contextMenuItemRole(entry)"
            :disabled="entry.disabled"
            :data-entry-id="entry.id"
            :data-tone="entry.tone ?? 'default'"
            :data-open="openSubmenu?.id === entry.id ? 'true' : undefined"
            :aria-haspopup="entry.children?.length ? 'menu' : undefined"
            :aria-expanded="
              entry.children?.length ? (openSubmenu?.id === entry.id ? 'true' : 'false') : undefined
            "
            :aria-controls="entry.children?.length ? submenuId : undefined"
            v-bind="contextMenuCheckableState(entry)"
            @pointermove="onItemPointerMove(entry, $event)"
            @click="
              entry.children?.length
                ? enterSubmenu(
                    entry,
                    $event.currentTarget as HTMLButtonElement,
                    isKeyboardModality(($event.currentTarget as HTMLElement).ownerDocument),
                  )
                : selectItem(entry)
            "
          >
            <span
              v-if="entry.selection !== undefined"
              class="ui-context-menu__check"
              aria-hidden="true"
              >{{
                entry.checked ? '✓' : ''
              }}</span
            >
            <span class="ui-context-menu__label">{{ entry.label }}</span>
            <span v-if="entry.shortcut" class="ui-context-menu__shortcut">{{
              entry.shortcut
            }}</span>
            <span
              v-else-if="entry.children?.length"
              class="ui-context-menu__chevron"
              aria-hidden="true"
              >›</span
            >
          </button>
        </template>
      </div>
    </div>
  </div>

  <Teleport to="body">
    <div
      v-if="submenuContent !== undefined"
      :id="submenuId"
      ref="submenuRef"
      class="ui-overlay-panel ui-context-menu__submenu nv-presence"
      :class="panelMaterial"
      data-surface="auto"
      popover="manual"
      role="menu"
      :aria-label="submenuContent.label"
      :inert="openSubmenu === null"
      v-bind="presence('slide-end', 'start')"
      @keydown="onMenuKeydown"
    >
      <button
        v-for="child in submenuEntries"
        :key="child.id"
        class="ui-context-menu__item"
        type="button"
        tabindex="-1"
        :role="contextMenuItemRole(child)"
        :disabled="child.disabled"
        :data-entry-id="child.id"
        v-bind="contextMenuCheckableState(child)"
        @click="selectItem(child)"
      >
        <span
          v-if="child.selection !== undefined"
          class="ui-context-menu__check"
          aria-hidden="true"
          >{{
            child.checked ? '✓' : ''
          }}</span
        >
        <span class="ui-context-menu__label">{{ child.label }}</span>
      </button>
    </div>
  </Teleport>
</template>
