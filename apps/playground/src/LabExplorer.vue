<script setup lang="ts">
import { glassMaterial } from '@neoverse-ui/tokens';
import { UiButton, UiIconButton, UiInput, UiNavigationItem } from '@neoverse-ui/vue';
import { computed, reactive, ref, watch } from 'vue';
import LabIcon from './LabIcon.vue';
import { labModules, moduleGroups, type ResolvedLabHash, specimensForModule } from './lab-modules';
import { appCopy, type Locale, localize, localized } from './playground-content';

const props = defineProps<{
  locale: Locale;
  persistent: boolean;
  route: ResolvedLabHash | null;
  homeHref: string;
}>();
const emit = defineEmits<{ close: []; navigate: [event: MouseEvent, hash: string | null] }>();

const searchLabel = localized('Search modules and specimens', '搜索模块与示例');
const searchHint = localized('Name, API, or tag…', '名称、API 或标签…');
const noResults = localized(
  'No modules or specimens match your search.',
  '没有与搜索匹配的模块或示例。',
);
const search = ref('');
const terms = computed(() => search.value.toLowerCase().trim().split(/\s+/).filter(Boolean));
const collapsed = reactive(new Set<string>());

const groups = moduleGroups.map((group) => ({
  ...group,
  modules: group.moduleIds.flatMap((id) => {
    const module = labModules.find((entry) => entry.id === id);
    return module === undefined ? [] : [{ ...module, specimens: specimensForModule(id) }];
  }),
}));

function matches(values: readonly string[]): boolean {
  const text = values.join(' ').toLowerCase();
  return terms.value.every((term) => text.includes(term));
}

const results = computed(() => {
  const activeModule = props.route?.moduleId;
  return groups.flatMap((group) => {
    const modules = group.modules.flatMap((module) => {
      if (terms.value.length === 0) {
        return [{ ...module, specimens: module.id === activeModule ? module.specimens : [] }];
      }
      const names = [module.id, module.label.en, module.label.zh, group.label.en, group.label.zh];
      const specimens = module.specimens.filter((specimen) =>
        matches([
          ...names,
          specimen.id,
          specimen.label.en,
          specimen.label.zh,
          ...specimen.apiNames,
          ...specimen.tags,
          ...(specimen.tags.includes('glass')
            ? [glassMaterial.name.en, glassMaterial.name.zh]
            : []),
        ]),
      );
      return specimens.length > 0 || matches(names) ? [{ ...module, specimens }] : [];
    });
    return modules.length > 0 ? [{ ...group, modules }] : [];
  });
});

watch(
  () => terms.value.length > 0,
  (searching) => {
    if (searching) collapsed.clear();
  },
);
watch(
  () => props.route?.moduleId,
  (id) => {
    const group = groups.find((entry) => entry.modules.some((module) => module.id === id));
    if (group !== undefined) collapsed.delete(group.id);
  },
);

function toggle(id: string): void {
  if (!collapsed.delete(id)) collapsed.add(id);
}
</script>

<template>
  <header class="playground-shell__panel-header">
    <div class="playground-shell__panel-title">
      <h2 id="explorer-title" class="text-title-sm font-title text-primary">
        {{ localize(appCopy.navigation.label, locale) }}
      </h2>
      <UiIconButton
        v-if="!persistent"
        variant="ghost"
        surface="none"
        size="sm"
        :label="localize(appCopy.navigation.close, locale)"
        @click="emit('close')"
      >
        <LabIcon name="close" />
      </UiIconButton>
    </div>
    <UiInput
      v-model="search"
      data-specimen-search
      type="search"
      :aria-label="localize(searchLabel, locale)"
      :placeholder="localize(searchHint, locale)"
    />
  </header>

  <nav
    class="playground-shell__panel-body playground-explorer scrollbar-immersive"
    :aria-label="localize(appCopy.navigation.modulesLabel, locale)"
  >
    <UiNavigationItem
      :href="homeHref"
      tabindex="0"
      :label="localize(appCopy.navigation.overview, locale)"
      :active="route === null"
      stretch
      indicator-placement="start"
      class="playground-explorer__link"
      @click="emit('navigate', $event, null)"
    >
      <template #icon><LabIcon name="home" /></template>
    </UiNavigationItem>

    <p v-if="results.length === 0" role="status" class="px-2 py-3 text-body-sm text-secondary">
      {{ localize(noResults, locale) }}
    </p>
    <section
      v-for="group in results"
      :key="group.id"
      :aria-labelledby="`explorer-group-${group.id}`"
    >
      <h3>
        <UiButton
          :id="`explorer-group-${group.id}`"
          :aria-controls="`explorer-items-${group.id}`"
          :aria-expanded="!collapsed.has(group.id)"
          variant="ghost"
          surface="none"
          size="sm"
          stretch
          class="playground-explorer__category"
          @click="toggle(group.id)"
        >
          {{ localize(group.label, locale) }}
          <template #trailing>
            <LabIcon name="chevron" class="playground-explorer__chevron" />
          </template>
        </UiButton>
      </h3>
      <ul v-show="!collapsed.has(group.id)" :id="`explorer-items-${group.id}`">
        <li v-for="module in group.modules" :key="module.id">
          <UiNavigationItem
            :href="`#${module.id}`"
            tabindex="0"
            :label="localize(module.label, locale)"
            :active="route?.moduleId === module.id && route.specimenId === undefined"
            stretch
            indicator-placement="start"
            class="playground-explorer__link"
            @click="emit('navigate', $event, module.id)"
          />
          <ul v-if="module.specimens.length > 0" class="playground-explorer__specimens">
            <li v-for="specimen in module.specimens" :key="specimen.id">
              <UiNavigationItem
                :href="`#${specimen.id}`"
                tabindex="0"
                :label="localize(specimen.label, locale)"
                :active="route?.specimenId === specimen.id"
                :aria-current="route?.specimenId === specimen.id ? 'location' : undefined"
                stretch
                indicator-placement="start"
                class="playground-explorer__link"
                @click="emit('navigate', $event, specimen.id)"
              />
            </li>
          </ul>
        </li>
      </ul>
    </section>
  </nav>
</template>
