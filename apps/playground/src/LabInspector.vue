<script setup lang="ts">
import { UiAction, UiButton, UiIconButton } from '@neoverse-ui/vue';
import { computed } from 'vue';
import LabIcon from './LabIcon.vue';
import LabInspectorField from './LabInspectorField.vue';
import type { LabModule, LabSpecimen } from './lab-modules';
import type { SpecimenSession } from './lab-specimen-config';
import {
  appCopy,
  type Locale,
  type LocalizedText,
  localize,
  localized,
} from './playground-content';
import { resolvedTheme } from './theme-state';

const props = defineProps<{
  locale: Locale;
  persistent: boolean;
  module: LabModule | undefined;
  category: LocalizedText | undefined;
  specimen: LabSpecimen | undefined;
  session: SpecimenSession | undefined;
}>();
const emit = defineEmits<{ close: [] }>();
const copy = {
  information: localized('Information', '信息'),
  overview: localized(
    'Select a module or specimen in the Explorer to inspect its details.',
    '在资源浏览中选择模块或示例，即可查看详细信息。',
  ),
  category: localized('Category', '分类'),
  module: localized('Module', '模块'),
  selectionId: localized('Selection ID', '所选项目 ID'),
  apis: localized('Component APIs', '组件 API'),
  frame: localized('Open isolated preview', '打开独立预览'),
  properties: localized('Properties', '属性'),
  chooseSpecimen: localized(
    'Module properties are read-only. Select an individual specimen to see its available controls.',
    '模块属性为只读。选择单个示例即可查看可用控件。',
  ),
  fixedSpecimen: localized(
    'This specimen is read-only. Its original examples are available in the stage.',
    '此示例为只读。可在舞台中查看原有示例。',
  ),
  editable: localized(
    'Only the listed fields can be edited. Other parameters stay as provided by the specimen or component.',
    '仅可编辑下列字段。其余参数由示例或组件决定。',
  ),
  reset: localized('Reset specimen', '重置示例'),
  states: localized('Variants and states', '变体与状态'),
  statesDescription: localized(
    'Use the examples in the Preview Stage to try the available states.',
    '可在预览舞台的示例中体验不同状态。',
  ),
} as const;
const selection = computed(() => props.specimen ?? props.module);
const frameHref = computed(() => {
  if (selection.value === undefined) return undefined;
  const query = new URLSearchParams({ theme: resolvedTheme.value, lang: props.locale });
  return `/frame?${query}#${selection.value.id}`;
});
</script>

<template>
  <header class="playground-shell__panel-header">
    <div class="playground-shell__panel-title">
      <h2 id="inspector-title" class="text-title-sm font-title text-primary">
        {{ localize(appCopy.inspector.label, locale) }}
      </h2>
      <UiIconButton
        v-if="!persistent"
        variant="ghost"
        surface="none"
        size="sm"
        :label="localize(appCopy.inspector.close, locale)"
        @click="emit('close')"
      >
        <LabIcon name="close" />
      </UiIconButton>
    </div>
  </header>
  <div class="playground-shell__panel-body playground-inspector scrollbar-immersive">
    <section aria-labelledby="inspector-information">
      <h3 id="inspector-information" class="playground-inspector__label">
        {{ localize(copy.information, locale) }}
      </h3>
      <template v-if="selection && module">
        <p class="text-title-sm font-title text-primary">{{ localize(selection.label, locale) }}</p>
        <p v-if="!specimen" class="text-body-sm text-secondary">
          {{ localize(module.description, locale) }}
        </p>
        <dl class="playground-inspector__details text-body-sm">
          <template v-if="category">
            <dt>{{ localize(copy.category, locale) }}</dt>
            <dd>{{ localize(category, locale) }}</dd>
          </template>
          <template v-if="specimen">
            <dt>{{ localize(copy.module, locale) }}</dt>
            <dd>{{ localize(module.label, locale) }}</dd>
          </template>
          <dt>{{ localize(copy.selectionId, locale) }}</dt>
          <dd><code>{{ selection.id }}</code></dd>
          <template v-if="specimen && specimen.apiNames.length > 0">
            <dt>{{ localize(copy.apis, locale) }}</dt>
            <dd class="flex flex-wrap gap-x-2 gap-y-1">
              <code v-for="name in specimen.apiNames" :key="name">{{ name }}</code>
            </dd>
          </template>
        </dl>
        <UiAction
          v-if="frameHref"
          :href="frameHref"
          tabindex="0"
          size="sm"
          variant="ghost"
          surface="none"
          class="playground-inspector__frame-link"
        >
          {{ localize(copy.frame, locale) }}
          <template #trailing><LabIcon name="arrow-right" /></template>
        </UiAction>
      </template>
      <p v-else class="text-body-sm text-secondary">{{ localize(copy.overview, locale) }}</p>
    </section>
    <section aria-labelledby="inspector-properties">
      <h3 id="inspector-properties" class="playground-inspector__label">
        {{ localize(copy.properties, locale) }}
      </h3>
      <template v-if="session">
        <p class="text-body-sm text-secondary">{{ localize(copy.editable, locale) }}</p>
        <p v-if="session.note" class="text-body-sm text-secondary">
          {{ localize(session.note, locale) }}
        </p>
        <LabInspectorField
          v-for="field in session.fields"
          :key="`${specimen?.id}-${field.source}-${field.key}`"
          :field="field"
          :locale="locale"
          @edit="session.edit(field.source, field.key, $event)"
        />
        <UiButton variant="secondary" size="sm" class="justify-self-start" @click="session.reset()">
          {{ localize(copy.reset, locale) }}
        </UiButton>
      </template>
      <p v-else class="text-body-sm text-secondary">
        {{
          localize(
            specimen ? copy.fixedSpecimen : module ? copy.chooseSpecimen : copy.overview,
            locale,
          )
        }}
      </p>
    </section>
    <section v-if="!session && selection" aria-labelledby="inspector-states">
      <h3 id="inspector-states" class="playground-inspector__label">
        {{ localize(copy.states, locale) }}
      </h3>
      <p class="text-body-sm text-secondary">{{ localize(copy.statesDescription, locale) }}</p>
    </section>
  </div>
</template>
